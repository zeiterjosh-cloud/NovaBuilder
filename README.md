# NovaBuilder 🚀

**AI-Powered Full-Stack SaaS Platform for Code Generation**

Build websites, React apps, Unity games, and more — just describe what you want.

## Features

- 🤖 **AI Code Generation** — OpenAI GPT-4o-mini generates complete, production-ready code
- 🎮 **Unity Game Dev** — FPS, Racing, RPG, Platformer game scripts auto-detected
- 📝 **Monaco Editor** — Full VS Code editor in the browser
- 👁️ **Live Preview** — Instant iframe preview for HTML/JS projects
- 💾 **Project Saving** — JSON file-based storage
- 🚀 **One-Click Deploy** — Deploy to static hosting (Pro+)
- 📦 **Unity Export** — Export .cs scripts or ZIP packages (Pro+)
- 🤖 **DevBuddy AI** — Floating AI chat copilot
- 💳 **Stripe Integration** — Subscription billing
- 🔐 **JWT Auth** — Secure authentication

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Monaco Editor, Framer Motion
- **Backend**: Node.js + Express, OpenAI API, JWT, Stripe, Archiver
- **Storage**: JSON files (no database required)

## Quick Start

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys
npm install
npm start
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Open the app

Visit [http://localhost:5173](http://localhost:5173)

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=3001
JWT_SECRET=your_secure_secret
OPENAI_API_KEY=sk-...          # Optional: falls back to mock generation
STRIPE_SECRET_KEY=sk_test_...  # Optional: for billing
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_STUDIO_PRICE_ID=price_...
FRONTEND_URL=http://localhost:5173
```

> **Note**: The app works without API keys — it uses mock code generation. Add your OpenAI key for real AI generation.

## Project Structure

```
NovaBuilder/
├── backend/          # Express API
│   ├── routes/       # API routes (auth, generate, projects, deploy, stripe)
│   ├── middleware/   # JWT auth middleware
│   ├── utils/        # JSON database utilities
│   └── server.js     # Entry point
├── frontend/         # React Vite app
│   └── src/
│       ├── pages/    # Landing, Builder, Dashboard, Marketplace, Pricing, Auth
│       ├── components/ # DevBuddy, Particles
│       ├── context/  # AuthContext
│       └── api/      # Axios client
├── storage/          # JSON data files (gitignored)
└── shared/           # Shared utilities
```

## Plans

| Feature | Free | Pro ($29/mo) | Studio ($79/mo) |
|---------|------|-------------|-----------------|
| AI Generations | 10 | Unlimited | Unlimited |
| Monaco Editor | ✅ | ✅ | ✅ |
| Live Preview | ✅ | ✅ | ✅ |
| Unity Export | ❌ | ✅ | ✅ |
| Deployment | ❌ | ✅ | ✅ |
| DevBuddy Chat | ✅ | ✅ | ✅ |
| Team Features | ❌ | ❌ | ✅ |

## License

MIT
