# 🤖 AI Communication Assistant

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An AI-powered email management and communication assistant that fetches, analyses, and helps you respond to emails intelligently. It surfaces email priority, sentiment, and analytics — and can draft AI replies via [OpenRouter](https://openrouter.ai/).

---

## ✨ Features

- 📥 **Multi-provider email fetching** — connect via Gmail (Google OAuth) or any standard IMAP server
- 🏷️ **Priority & sentiment analysis** — automatically classifies each email by urgency and tone
- 🤖 **AI-powered reply drafting** — generates contextual draft replies using OpenRouter (any model)
- 📊 **Analytics dashboard** — visualise email volume, sentiment trends, and response metrics
- 🌙 **Dark / light theme** — system-aware with a manual toggle
- ⚡ **Fast & responsive UI** — built with React, shadcn/ui, and Tailwind CSS

---

## 🏗️ Architecture

```
├── src/                  # React frontend (Vite + TypeScript)
│   ├── components/       # UI components (EmailTable, EmailDetail, Analytics, …)
│   ├── pages/            # Route-level pages
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Shared utilities
└── server/               # Express.js backend
    ├── index.mjs         # API server entry point
    └── providers/        # Email provider adapters (Gmail, IMAP)
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18 (use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) to manage versions)
- npm ≥ 9

### Installation

```sh
# 1. Clone the repository
git clone https://github.com/Alexprinse/AI_COM_ASSISTANT.git
cd AI_COM_ASSISTANT

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your credentials (see Configuration section below)

# 4. Start the backend server (terminal 1)
npm run server

# 5. Start the frontend dev server (terminal 2)
npm run dev
```

The frontend will be available at `http://localhost:5173` and the API backend at `http://localhost:8787`.

---

## ⚙️ Configuration

Copy `.env.example` to `.env` and fill in the values:

```env
# ── OpenRouter (AI reply drafting) ──────────────────────────────────────
VITE_OPENROUTER_API_KEY=       # Your OpenRouter API key
VITE_OPENROUTER_MODEL=         # Model to use (default: deepseek/deepseek-r1-0528-qwen3-8b:free)
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=AI Email Support

# ── IMAP (optional) ─────────────────────────────────────────────────────
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_SECURE=true
IMAP_USER=your_email@gmail.com
IMAP_PASS=your_app_specific_password

# ── Backend server ───────────────────────────────────────────────────────
PORT=8787
CORS_ORIGIN=http://localhost:5173
VITE_SERVER_URL=http://localhost:8787

# ── Google OAuth (Gmail API) ─────────────────────────────────────────────
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8787/api/auth/google/callback
```

> ⚠️ **Security note:** Never commit your `.env` file. For production, use a secure server-side proxy instead of exposing API keys in client-side code.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/emails?provider=gmail\|imap&max=20&since=ISO` | Fetch emails from a provider |
| `GET` | `/api/auth/google` | Initiate Google OAuth flow |
| `GET` | `/api/auth/google/callback` | Handle Google OAuth callback |

---

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the frontend development server |
| `npm run build` | Build the frontend for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint on all source files |
| `npm run server` | Start the Express API backend |

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS + shadcn/ui |
| State / data fetching | TanStack Query |
| Backend | Node.js + Express 4 |
| Email (IMAP) | imapflow + mailparser |
| Email (Gmail) | Google APIs (googleapis) |
| AI drafting | OpenRouter API |
| Charts | Recharts |
| Forms | React Hook Form + Zod |

---

## 🔐 Gmail OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. Enable the **Gmail API**.
3. Create **OAuth 2.0 credentials** (Web application type).
4. Add `http://localhost:8787/api/auth/google/callback` to the authorised redirect URIs.
5. Copy the **Client ID**, **Client Secret**, and **Redirect URI** into your `.env` file.
6. Start the server, then visit `http://localhost:8787/api/auth/google` to authorise your Gmail account.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
