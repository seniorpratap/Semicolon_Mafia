# 🧠 SimulCrisis — Multi-Agent Crisis Decision Simulator

> **Theme:** Intelligent Systems for Real-World Decision Making  
> **Event:** TechFusion 2.0 | Dayananda Sagar Academy of Technology & Management

## What is SimulCrisis?

SimulCrisis is a **real-time crisis simulation platform** where a disease outbreak spreads across a virtual city, and **4 AI agents** with conflicting priorities debate the best course of action — live on screen.

### The 3 Things That Make This Different:
1. **Visible Intelligence** — Watch AI agents argue, reason, and make decisions in real-time
2. **Interactive** — Users can inject crises, give suggestions, and watch all agents adapt
3. **Explainable AI** — Every decision shows a full reasoning chain (why THIS and not THAT)

---

## 🖥️ Features

### 🗺️ Real-Time City Simulation
- 36-zone city grid with SIR disease spread model
- Zones change color as infection spreads (green → yellow → orange → red)
- Hospital capacity tracking, economy index, public morale
- Cross-zone transmission and containment mechanics

### 🧠 4 AI Agents with Conflicting Priorities
| Agent | Role | Priority |
|-------|------|----------|
| 🏥 Dr. Meera Sharma | Health Director | Save lives at all costs |
| 💰 Arjun Patel | Economic Advisor | Protect livelihoods |
| 👮 Inspector Kavya Reddy | Public Safety Chief | Maintain order |
| 🎯 Commissioner Vikram Das | Coordinator | Balance all & decide |

Each agent **sees the other agents' positions** and responds to them — creating a realistic multi-agent debate.

### ⚡ Interactive Crisis Injection
- Virus Mutation (R0 increase)
- Hospital Fire (capacity loss)
- Medical Supply Shortage
- Unauthorized Mass Gathering
- Emergency Vaccine Shipment

### 💬 User Advisory System
Type any suggestion → all 4 agents evaluate it from their perspective → the coordinator incorporates it into the final decision with explicit reasoning.

### 📊 Live Intelligence Dashboard
- Infection curve (area chart)
- Economy & morale stability index
- Hospital load tracking
- Animated counters and gauge bars

### 📋 Explainable Decision Log
- Full debate history with expandable entries
- Each decision shows: reasoning chain, trade-offs, confidence score, expected outcome
- User advisories tracked as decision inputs

---

## 🏗️ Architecture

```
Frontend (React + Vite)
├── Simulation Engine (SIR model, city grid, JS)
├── Agent Orchestrator (debate chain, prompt builder)
├── UI Components (CityGrid, AgentPanel, Stats, Controls)
└── Mock Fallback (works without backend)

Backend (FastAPI + Python)
├── /api/agent-respond → Gemini API proxy
└── CORS configured for frontend
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS v4 |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | FastAPI, Python |
| AI | Google Gemini 2.0 Flash |

---

## 🚀 Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Backend
```bash
cd backend
pip install -r requirements.txt
# Add GEMINI_API_KEY to .env
python main.py
# → http://localhost:8000
```

> **Note:** The app works fully without the backend using intelligent mock responses. Backend adds real Gemini AI responses.

---

## 👥 Team

| Role | Responsibility |
|------|---------------|
| Lead Dev | Simulation engine, AI agents, App orchestration |
| Frontend Dev 1 | CityGrid, StatsPanel, charts |
| Frontend Dev 2 | AgentPanel, ControlPanel, DecisionLog |
| Backend + Deploy | FastAPI, Gemini API, deployment, pitch deck |

---

## 📄 License

Built for TechFusion 2.0 Hackathon.
