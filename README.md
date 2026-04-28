# SimulCrisis — Multi-Agent Crisis Decision Simulator

> **AI agents debate. You decide. Cities survive.**

SimulCrisis is a real-time tactical crisis management dashboard where 4 AI agents—powered by Google Gemini 2.5 Flash—analyze an unfolding pandemic simulation, debate response strategies with conflicting priorities, and produce actionable decisions. The human operator (you) can inject crises, override decisions, and guide the AI council through advisories.

---

## 🎯 What It Does

| Layer | Description |
|-------|-------------|
| **Simulation** | SIR epidemiological model across 36 city zones with cross-zone spread, hospital overflow, dynamic economy & morale |
| **AI Council** | 4 specialized agents (Health, Economy, Safety, Coordinator) conduct sequential debates with data-driven reasoning |
| **Human-in-the-Loop** | Operator can submit advisories that agents MUST address, inject crisis events, and take direct zone actions |
| **Decision Engine** | Coordinator synthesizes debates into executable actions (lockdowns, vaccinations, hospital expansion) that modify simulation state |

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    SimulCrisis Dashboard                  │
├──────────┬────────────────────────┬──────────────────────┤
│ City Grid│    Agent Council       │  Live Intelligence   │
│ 6×6 zones│  4 AI agents debate    │  Metrics + Charts    │
│ + Crisis │  + Advisory input      │  Economy + Morale    │
│ Controls │  + Action execution    │  Infection Curve     │
├──────────┴────────────────────────┴──────────────────────┤
│                  SIR Simulation Engine                    │
│          36 zones · cross-spread · hospital overflow      │
├──────────────────────────────────────────────────────────┤
│              Google Gemini 2.5 Flash API                  │
│         4 agents · streaming · data-driven prompts        │
└──────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/seniorpratap/Semicolon_Mafia.git
cd Semicolon_Mafia/frontend

# Install
npm install

# Set up Gemini API key (optional — works with mock mode too)
echo "VITE_GEMINI_API_KEY=your_key_here" > .env

# Run
npm run dev
```

Opens at `http://localhost:5173`

## 🎮 Demo Flow (For Judges)

1. **Launch** the simulation
2. Click **Advance 5 Days + Council Debate** — watch agents analyze zone data and argue
3. **Inject a crisis** (e.g., "Virus Mutation") — see agents react to the emergency
4. **Type an advisory** (e.g., "Focus on vaccinating Zone 2") — agents must address it
5. **Click any zone** in the grid — see detailed stats and take quick actions
6. Click **GUIDELINES** tab — see response protocols for all 10 crisis scenarios
7. Or just click **Demo Mode** and let it auto-run

## 🧠 AI Agent System

| Agent | Role | Priority |
|-------|------|----------|
| **Dr. Meera Sharma** | Health Director | Containment first, save lives at any cost |
| **Arjun Patel** | Economic Advisor | Minimize lockdown damage, keep economy alive |
| **Inspector Kavya Reddy** | Public Safety Chief | Law enforcement, morale, civil order |
| **Coordinator Vikram Singh** | Crisis Coordinator | Weighs all 3 arguments, makes final decision |

Agents receive **real-time zone-by-zone data** (infection rates, hospital occupancy, lockdown status, vaccination %) and must cite specific numbers in their arguments.

## 📊 Simulation Features

- **SIR Model**: Susceptible → Infected → Recovered/Deceased compartmental model
- **36 City Zones**: Each with unique population, hospital capacity, economic value
- **Cross-Zone Spread**: Infections spread to adjacent zones based on lockdown status
- **10 Crisis Events**: Virus mutation, hospital fire, power outage, misinformation wave, etc.
- **Dynamic Economy**: Drops from infections (workforce loss), lockdowns, and hospital overflow
- **Dynamic Morale**: Decays from deaths, lockdown fatigue, and infection fear

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 + CSS Variables |
| Animations | Framer Motion |
| Charts | Recharts |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| Simulation | Custom SIR Engine (372 lines) |

## 👥 Team — Semicolon Mafia

Built for **TechFusion 2.0 Hackathon** — Intelligent Systems Track

---

*SimulCrisis: Because in a real crisis, AI shouldn't replace human judgment — it should inform it.*
