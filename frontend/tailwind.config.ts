import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        khadi: "#FAF7F0",
        khadiraised: "#F3EEE1",
        ink: "#1F2A37",
        inkmuted: "#5C6672",
        saffron: "#E67E22",
        saffrondeep: "#C6690F",
        banyan: "#0B6E4F",
        banyandeep: "#08543C",
        banyanlight: "#E4F0EA",
        indigo: "#1E3A5F",
        alert: "#B3423A",
        alertlight: "#F6E7E5",
        line: "#E4DDC9"
      },
      fontFamily: {
        display: ["'Fraunces'", "Georgia", "serif"],
        body: ["'Inter'", "'Noto Sans Devanagari'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"]
      },
      boxShadow: {
        stamp: "0 1px 0 rgba(31,42,55,0.04), 0 8px 24px -12px rgba(31,42,55,0.18)"
      }
    }
  },
  plugins: []
};
export default config;
