"""Shared helper for talking to any OpenAI-compatible LLM API (Groq, OpenAI, Ollama, vLLM...).

Centralised here so both the chat assistant and the smart-match narrator use the
same config parsing and the same diagnostics, instead of each guessing separately.
"""
import os
import re
import logging
import httpx

logger = logging.getLogger("schemesetu.llm")

KNOWN_HOSTS = {
    "gsk_": "https://api.groq.com/openai/v1",   # Groq API keys always start with gsk_
    "sk-": "https://api.openai.com/v1",          # OpenAI API keys always start with sk-
}


def strip_markdown(text: str) -> str:
    """Best-effort cleanup in case the model adds markdown despite instructions not to.
    This is a plain-text app for people who may not recognise markdown syntax, so any
    asterisks, bullet symbols, or bracketed links should read as normal text, not clutter.
    """
    if not text:
        return text
    text = re.sub(r"\[([^\]]+)\]\((https?://[^\s)]+)\)", r"\1: \2", text)  # [label](url) -> label: url
    text = re.sub(r"<(https?://[^\s>]+)>", r"\1", text)                     # <url> -> url
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)                            # **bold** -> bold
    text = re.sub(r"(?m)^\s*[*\-]\s+", "", text)                            # leading * or - bullets
    text = re.sub(r"(?m)^\s*\d+\.\s+", "", text)                            # leading "1. " numbering
    text = text.replace("**", "").replace("__", "").replace("##", "").replace("#", "")
    return text.strip()


def _clean(value: str | None) -> str | None:
    """Trim whitespace and strip a trailing ' # comment' some editors leave in .env files."""
    if value is None:
        return None
    value = value.split(" #", 1)[0].strip()
    return value or None


def get_config():
    base_url = _clean(os.getenv("LLM_BASE_URL"))
    api_key = _clean(os.getenv("LLM_API_KEY"))
    model = _clean(os.getenv("LLM_MODEL")) or "gpt-4o-mini"

    warning = None
    if base_url and api_key:
        for prefix, expected_host in KNOWN_HOSTS.items():
            if api_key.startswith(prefix) and expected_host not in base_url:
                warning = (
                    f"LLM_API_KEY looks like a '{prefix}...' key, which belongs to {expected_host}, "
                    f"but LLM_BASE_URL is set to '{base_url}'. Update LLM_BASE_URL to match your key's provider."
                )
                logger.warning(warning)
    return base_url, api_key, model, warning


def configured() -> bool:
    base_url, api_key, _, _ = get_config()
    return bool(base_url and api_key)


async def complete(system: str, messages: list[dict], max_tokens: int = 700) -> str | None:
    """Returns the model's reply text, or None if not configured / the call failed."""
    base_url, api_key, model, warning = get_config()
    if not (base_url and api_key):
        return None
    if warning:
        # Still attempt the call in case the heuristic is wrong (e.g. a proxy), but the
        # warning is already logged and surfaced via /api/health for the developer to see.
        pass
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{base_url.rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={"model": model, "max_tokens": max_tokens,
                      "messages": [{"role": "system", "content": system}, *messages]},
            )
            resp.raise_for_status()
            raw = resp.json()["choices"][0]["message"]["content"]
            return strip_markdown(raw)
    except Exception as e:
        logger.warning("LLM call failed: %s", e)
        return None
