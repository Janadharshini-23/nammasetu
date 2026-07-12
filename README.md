# SchemeSetu 🌉

**Your bridge to every government scheme.** Answer 8 simple questions and discover which Indian government schemes you're eligible for, with a transparent explanation of *why*, the documents you'll need, and a direct link to the official portal.

English + हिंदी · 23 major central schemes seeded · explainable rule engine · AI assistant grounded in the scheme database.

> **Disclaimer:** SchemeSetu is an independent guide built from public information. Scheme rules and income caps change, always verify on [myscheme.gov.in](https://www.myscheme.gov.in) or the official portal before applying.

---

## Features

| Feature | How it works |
|---|---|
| **Eligibility checker** | 8-question profile → deterministic rule engine evaluates every scheme and returns *eligible / likely / not eligible* with per-criterion ✓ ✗ ? explanations |
| **Scheme explorer** | Search + tag filters across scholarships, loans, pensions, housing, insurance, agriculture |
| **AI assistant** | Retrieval-grounded Q&A: relevant schemes are retrieved from the DB and passed as the *only* context to an OpenAI-compatible LLM (Groq / OpenAI / Ollama). Degrades gracefully to retrieval-only answers if no key is set |
| **Accounts & saved schemes** | JWT auth (bcrypt-hashed passwords), save schemes to build an application shortlist |
| **Bilingual UI** | English / हिंदी toggle persisted in localStorage |
| **Document checklists** | Every scheme lists exactly what to carry to the CSC/bank |

## Tech stack

- **Frontend:** Next.js 14 (App Router) · TypeScript · Tailwind CSS
- **Backend:** FastAPI · SQLAlchemy · Pydantic v2 · PyJWT · passlib/bcrypt
- **Database:** SQLite locally (zero setup) → PostgreSQL (Neon) in production, switched by one env var
- **AI:** Retrieval-augmented chat over the scheme corpus via any OpenAI-compatible API (optional)
- **Infra:** Docker + docker-compose · GitHub Actions CI · Render (API) · Vercel (web)

## How "AI" is actually used here

Worth being precise about this for interviews:

- **Eligibility checker: not AI.** It's a deterministic rule engine (`backend/app/eligibility.py`). Each scheme stores machine-readable rules (age range, income cap, category, etc.) and every profile field is checked against them in plain Python. This is intentional: eligibility for a government scheme should be exact and explainable, not a probabilistic guess. That's also why it can show a checklist of exactly which rule passed or failed, bilingually.
- **Smart match report (`/api/eligibility/smart-check`): grounded, optionally LLM-written.** You fill in your profile once. The rule engine decides, with certainty, exactly which schemes you qualify for (nothing is invented). Then either an LLM (if `LLM_API_KEY` is set) or a local template turns that structured result into a warm, personal, plain-language paragraph, the same idea as describing your situation to an assistant and getting a tailored answer back, except every scheme it mentions is one the rule engine actually matched. The response tells you which path produced it (`used_llm: true/false`).
- **Chat assistant: retrieval-augmented, optionally LLM-backed.** Your question is matched against the scheme database with keyword scoring, and only the top matches are sent as context to an LLM. Without a key, it answers directly from the retrieved schemes; with a key, it becomes a real grounded LLM answer. Either way, it never talks about a scheme that isn't in the database.

## Managing scheme data (not hardcoded in application logic)

All 23 schemes live in **`backend/app/data/schemes.json`**, not buried inside Python functions. Each entry has English and Hindi content side by side:

```json
{
  "slug": "pm-svanidhi",
  "ministry": "...", "tags": ["business", "credit"], "apply_url": "...",
  "rules": { "occupations": ["street-vendor"] },
  "en": { "name": "...", "summary": "...", "benefits": "...", "eligibility_text": "...", "documents": ["..."] },
  "hi": { "name": "...", "summary": "...", "benefits": "...", "eligibility_text": "...", "documents": ["..."] }
}
```

`app/seed.py` just reads this file into the database on startup. **To add or correct a scheme, edit this JSON file and restart the backend, no code changes needed.**

Being fully honest about the "will these change over time" question: there is no stable public API from myScheme.gov.in or individual ministries to pull live scheme data automatically, and a scraper against those sites would be fragile and could break silently or violate terms of use. What this refactor buys you instead is the realistic version of "not hardcoded": scheme content is data, cleanly separated from logic, easy to extend, and easy to wire up to a real content-management workflow (an admin UI, a spreadsheet import, or a periodically-run, carefully-monitored scraper) later without touching the eligibility engine or the API at all. That's the honest, defensible story for an interview.

### Growing the dataset beyond 23 schemes

`backend/scripts/import_schemes.py` bulk-imports schemes from a CSV into `schemes.json` instead of typing JSON by hand:

```powershell
cd backend
python scripts/import_schemes.py path\to\some_schemes.csv
```

It skips schemes whose slug already exists, and if `LLM_API_KEY` is set, it asks the model to draft a Hindi translation for each new scheme (review it, machine translation of legal or eligibility text can be imprecise). New schemes come in with empty `rules: {}`, meaning the eligibility checker marks them "likely" rather than a firm yes or no, until you add rules by hand, since inferring exact eligibility logic from free-text descriptions isn't reliable enough to automate. Open `schemes.json` after importing and fill in `rules` and `documents` for anything you want fully working in the eligibility checker. A reasonable CSV source to start from is a public research dataset scraped from myScheme (searchable on Kaggle or HuggingFace), treated as a one-time bulk import, not a live feed.

### If you see "no such column" errors after updating

This project uses SQLite locally via a simple `create_all()` on startup, not real migrations (Alembic would be the production answer, but is overkill for a portfolio MVP). `create_all()` only creates tables that don't exist yet; it never adds new columns to a table you already have. So if a future change adds a field to the `Scheme` model and you see an error like `no such column: schemes.name_hi`, the fix is always the same:

```powershell
cd backend
del schemesetu.db
uvicorn app.main:app --reload --port 8000
```

Deleting the local database file is safe, it just re-seeds from `schemes.json` on the next startup. This doesn't apply to a deployed Neon database; a real schema change there would need an actual migration.

## Helping people with low digital literacy apply

Every scheme page now includes, alongside the existing document list:

- **How to get each document**, plain-language, bilingual guidance per document (e.g. "Visit your nearest Aadhaar Seva Kendra or bank branch, or apply online"), with a link to the right portal where one exists (`backend/app/document_help.py`).
- **A 4-step "how to apply" guide**, gather documents, go to the portal or a CSC, fill the form carefully, save your application number, the same steps regardless of scheme, because the actual friction for a first-time applicant is almost always these four things.
- **A link to the nearest Common Service Centre (CSC)**, for anyone who would rather apply in person than online.
- **A print button**, turns the document checklist and steps into a clean printable page to carry to a CSC or bank, no smartphone required once printed.

## Architecture

```
┌─────────────┐   HTTPS/JSON   ┌──────────────────┐   SQLAlchemy   ┌────────────┐
│  Next.js 14 │ ─────────────▶ │   FastAPI        │ ─────────────▶ │ PostgreSQL │
│  (Vercel)   │ ◀───────────── │   (Render)       │                │  (Neon)    │
└─────────────┘                │ • JWT auth       │                └────────────┘
                               │ • Rule engine    │
                               │ • Retrieval +    │──▶ OpenAI-compatible LLM
                               │   grounded chat  │    (optional, e.g. Groq free tier)
                               └──────────────────┘
```

---

## 1 · Run locally (Windows 11)

**Prerequisites:** Python 3.11+ and Node.js 20+ installed. Unzip the project anywhere, e.g. `C:\projects\schemesetu`.

### Backend (Terminal 1)

```powershell
cd schemesetu\backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env        # optional, defaults work out of the box
uvicorn app.main:app --reload --port 8000
```

On first start the API creates `schemesetu.db` (SQLite) and seeds 23 schemes automatically.
Open **http://localhost:8000/docs**, you should see the interactive Swagger UI.

### Frontend (Terminal 2)

```powershell
cd schemesetu\frontend
npm install
copy .env.example .env.local   # sets NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open **http://localhost:3000**. Verify the flow end-to-end:

1. Home → **Check my eligibility** → fill age 21, female, student, income 300000 → you should see AICTE Pragati + CSSS in the eligible list, each with ✓ reasons.
2. **Schemes** → search "solar" → PM Surya Ghar appears.
3. **Create account** → open any scheme → **Save** → check the **Saved** tab.
4. **Assistant** → ask "I'm a street vendor, what loans can I get?" → PM SVANidhi is retrieved (works with no API key; add one for full AI answers, see below).

### Optional: enable AI answers

Get a free API key from [Groq](https://console.groq.com) (generous free tier), then in `backend/.env`:

```env
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_API_KEY=gsk_...
LLM_MODEL=openai/gpt-oss-20b
```

The model name has to exist on whichever provider `LLM_BASE_URL` points to, mixing providers (e.g. a Groq key with an OpenAI model name, or vice versa) is the most common setup mistake. Groq's available models change occasionally as older ones are retired; check [console.groq.com/docs/models](https://console.groq.com/docs/models) if `openai/gpt-oss-20b` stops working, and swap in whatever's current.

Restart the backend (the `.env` file is loaded automatically on startup via `python-dotenv`). Before testing the assistant, check `http://localhost:8000/api/health`, if `llm_configured` is `false` or `llm_warning` is not `null`, fix that first. Then ask the assistant something: `"used_llm": true` in the response means the model actually answered; `false` means it fell back to retrieval-only, usually because the backend wasn't restarted after editing `.env`, the model name doesn't exist on that provider, or the key is invalid.

### Optional: run with Docker instead

```powershell
docker compose up --build
```

---

## 2 · Push to GitHub

```powershell
cd schemesetu
git init
git add .
git commit -m "feat: SchemeSetu MVP, eligibility engine, scheme explorer, grounded AI assistant, JWT auth, bilingual UI"
```

Create an empty repo named `schemesetu` on github.com (no README/license, the project already has them), then:

```powershell
git branch -M main
git remote add origin https://github.com/<your-username>/schemesetu.git
git push -u origin main
```

CI runs automatically on every push (`.github/workflows/ci.yml`): backend import check + frontend production build. Green checkmarks on your repo = instant credibility.

> **Never commit `.env` or `.env.local`**, they're already in `.gitignore`. Only the `.example` files belong in git.

---

## 3 · Deploy (Neon → Render → Vercel, all free tiers)

Deploy in this order, because each step needs a value from the previous one.

### Step A: Database on Neon

1. [neon.tech](https://neon.tech) → New Project → name it `schemesetu`.
2. Copy the **connection string** (looks like `postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require`).

### Step B: Backend on Render

1. [render.com](https://render.com) → **New → Web Service** → connect your GitHub repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance type:** Free
3. Environment variables:
   - `DATABASE_URL` = your Neon connection string
   - `SECRET_KEY` = a long random string (run `python -c "import secrets; print(secrets.token_hex(32))"`)
   - `CORS_ORIGINS` = `http://localhost:3000` for now (you'll add the Vercel URL after Step C)
   - *(optional)* `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` for AI answers
4. Deploy. On boot the API creates tables and seeds schemes in Neon automatically. Test: open `https://<your-api>.onrender.com/docs`.

### Step C: Frontend on Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → import the same repo.
2. **Root Directory:** `frontend` (Framework auto-detects Next.js).
3. Environment variable: `NEXT_PUBLIC_API_URL` = `https://<your-api>.onrender.com`
4. Deploy, note your URL (e.g. `https://schemesetu.vercel.app`).

### Step D: Close the CORS loop

Back in Render, update `CORS_ORIGINS` to include your Vercel URL:

```
CORS_ORIGINS=https://schemesetu.vercel.app,http://localhost:3000
```

Save (Render redeploys automatically). Open your Vercel URL and run the same 4-step verification from the local section. **Done, you're live.**

> **Render free-tier note:** the API sleeps after 15 min of inactivity; the first request after sleep takes ~50s. Mention this on your portfolio, or add an uptime pinger (e.g. cron-job.org hitting `/api/health` every 10 min).

---

## API overview

Endpoints that return scheme content accept `?lang=en` or `?lang=hi` (or a `"lang"` field in the request body for POST endpoints) to localize the response.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | None | Health check, also reports whether an LLM is configured |
| POST | `/api/auth/register` | None | Create account, returns JWT |
| POST | `/api/auth/login` | None | Login, returns JWT |
| GET | `/api/schemes?q=&tag=&lang=` | None | Search / filter schemes |
| GET | `/api/schemes/tags` | None | All tags |
| GET | `/api/schemes/{slug}?lang=` | None | Scheme detail, with document help and localized content |
| POST/DELETE | `/api/schemes/{slug}/save` | JWT | Save / unsave |
| GET | `/api/schemes/saved?lang=` | JWT | Saved schemes |
| POST | `/api/eligibility/check` | None | Profile in, explainable matches out (structured only) |
| POST | `/api/eligibility/smart-check` | None | Profile in, personalised narrative report plus structured matches out |
| POST | `/api/chat` | None | Retrieval-grounded assistant, optionally LLM-backed |

## Roadmap

- [ ] Semantic retrieval with sentence-transformers + pgvector (replace keyword scoring) for a genuinely ML-flavored addition
- [ ] An admin UI or spreadsheet-import workflow for editing `schemes.json` without touching JSON by hand
- [ ] Grow the corpus beyond 23 schemes, including state-level schemes, sourced by manual curation rather than scraping
- [ ] Conversational eligibility agent that *asks* clarifying questions (LangGraph)
- [ ] IndicTrans2 or a similar model for scheme content in more than English and Hindi
- [ ] Application deadline reminders via email (background worker + queue)
- [ ] Admin panel for scheme data curation
