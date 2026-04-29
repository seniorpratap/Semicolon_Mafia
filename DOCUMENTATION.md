# SimulCrisis — Complete Project Documentation

**Team:** Semicolon Mafia  
**Hackathon:** Aurum 2026 (24-Hour)  
**Track:** Open Innovation — AI-Native Systems  
**Live URL:** https://seniorpratap.github.io/Semicolon_Mafia/  
**Repository:** https://github.com/seniorpratap/Semicolon_Mafia

---

## 1. Project Overview

SimulCrisis is a **real-time, AI-powered multi-agent crisis decision simulator**. It models a fictional city of 1.2 million people across 36 zones hit by a disease outbreak. Four AI agents — each with conflicting priorities (Health, Economy, Safety, Coordination) — debate in real-time using Google's Gemini 2.5 Pro model. The user plays the role of a **Crisis Commander**, observing the epidemic spread on a live grid, injecting crisis events, and advising the AI council. The coordinator agent synthesizes all arguments and makes a final, explainable decision that directly modifies the simulation state.

### What Problem Does It Solve?

Real-world crisis management (pandemics, disasters) suffers from:
- **Single-perspective bias** — health officials ignore economics, economists ignore mortality
- **Decision opacity** — leaders can't explain WHY they chose a specific response
- **No rehearsal** — you can't practice a pandemic before it happens

SimulCrisis solves all three: multiple AI agents force multi-perspective debate, the coordinator produces structured reasoning chains, and the simulator lets you rehearse infinite scenarios.

### Hackathon Pitch (30 seconds)

> "What if you could simulate a pandemic response with 4 AI advisors who argue with each other using real data — and then watch the consequences of your decisions unfold in real-time on a city grid? That's SimulCrisis. It's not a dashboard. It's a decision laboratory."

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 19.1 | Component architecture, state management |
| **Build Tool** | Vite | 8.0 | Fast dev server, production bundling |
| **Styling** | Tailwind CSS | 4.1 | Utility-first CSS, dark/light themes |
| **Animations** | Framer Motion | 12.x | Gauge bars, toast notifications, panel transitions |
| **Charts** | Recharts | 2.15 | SIR curves, bar charts, radar, pie charts |
| **Icons** | Lucide React | 0.487 | 25+ tactical icons throughout the UI |
| **AI Model** | Gemini 2.5 Pro | Latest | 1M token context, streaming responses, complex reasoning |
| **AI SDK** | @google/genai | 1.x | Official Google GenAI SDK (replaces deprecated `@google/generative-ai`) |
| **Deployment** | GitHub Pages | — | Static hosting from `docs/` directory |
| **Language** | JavaScript (JSX) | ES2022 | All source code |

### Why These Choices?

- **React + Vite**: Fastest possible dev cycle for a 24hr hackathon. HMR in <50ms.
- **Gemini 2.5 Pro over GPT-4**: Free tier available, streaming API, 1M context window lets us send entire simulation state to all 4 agents without truncation.
- **Recharts over D3**: Declarative API = faster to build. We have 5 chart types in ~100 lines.
- **GitHub Pages**: Zero-config deployment. Push to `docs/` = live instantly.

---

## 3. Architecture & Data Flow

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  USER INPUT  │────▶│   App.jsx        │────▶│  simulation.js   │
│  (Play/Pause │     │   (Orchestrator) │     │  (SIR Engine)    │
│   Advisory   │     │                  │     │                  │
│   Crisis)    │     │  State Manager   │     │  advanceDay()    │
└──────────────┘     │  tick() every 1s │     │  applyDecision() │
                     └────────┬─────────┘     └──────────────────┘
                              │
                     ┌────────▼─────────┐
                     │   agents.js      │
                     │  (AI Debate)     │
                     │                  │
                     │  buildReport()   │
                     │  getResponse()   │◀───── Gemini 2.5 Pro API
                     │  parseAction()   │       (streaming)
                     └──────────────────┘
```

### The Exact Flow (Step by Step)

1. **App mounts** → `createSimState()` generates 36 zones, seeds 150 infections in Zone 2 (Old Town)
2. **User clicks LAUNCH** → `setIsRunning(true)`, interval starts calling `tick()` every 1000ms
3. **Each tick** → `advanceDay(state)` runs the SIR model:
   - Per-zone: calculates new infections using `effectiveR0 × infected × (susceptible/population)`
   - Per-zone: recoveries at 1/14 per day, deaths at 2% × recovery rate × hospital overflow multiplier
   - Cross-zone: 2% of infected spill to adjacent zones (blocked by full lockdown)
   - Economy drops from lockdowns (0.15/zone partial, 0.35/zone full) + infection workforce loss + hospital overflow
   - Morale drops from death shock + lockdown fatigue + infection fear
4. **Every 5 days** → `tick()` auto-triggers `triggerDebate()`:
   - `buildSituationReport()` generates a 500-word data brief with zone-by-zone stats
   - Health agent speaks first (sees raw data only)
   - Economy agent responds (sees Health's argument, must counter)
   - Safety agent responds (sees both, brings ground reality)
   - Coordinator weighs all three + user advisory → produces structured DECISION
   - `parseDecisionAction()` extracts actions from coordinator's text (lockdown, vaccinate, etc.)
   - `applyDecision()` modifies simulation state (lockdown levels, vaccination rates, etc.)
   - Simulation auto-resumes
5. **User injects crisis** → event `apply()` modifies state directly → triggers emergency debate
6. **User types advisory** → stored and passed to ALL 4 agents as mandatory input they must address

### How AI Responses Are Generated

```
User Advisory + Situation Report + Other Agents' Arguments
                    ↓
        buildAgentPrompt() assembles full prompt
                    ↓
        ┌─── Gemini 2.5 Pro available? ───┐
        │ YES                              │ NO (rate limit / no key)
        ↓                                  ↓
  generateAgentResponseStreaming()    getMockResponse()
  (real API call, streaming chunks)  (intelligent data-driven mock)
        │                                  │
        └──────────── both return ─────────┘
                    ↓
        onStream callback → setAgentMessages()
        (typewriter effect in AgentPanel)
```

---

## 4. Every UI Element Explained

### 4.1 Header Bar
| Element | What It Does |
|---------|-------------|
| **SimulCrisis** logo | Brand identity, top-left |
| **GEMINI LIVE** badge | Green = API key configured and model ready. Shows real-time AI status |
| **THREAT • ELEVATED** pill | Color-coded threat level based on active infections (GREEN/YELLOW/RED) |
| **DASHBOARD / DECISION LOG / GUIDELINES** tabs | Switch between main view, historical decisions, and crisis management guidelines |
| **☀/🌙 toggle** | Switches between dark mode (default) and light mode |
| **DAY counter** | Shows current simulation day (animated number) |

### 4.2 Left Panel — City Grid & Command Center

| Element | What It Does |
|---------|-------------|
| **City Grid (6×6)** | 36 interactive zone cells. Color = infection severity (CLR/LOW/MED/HI) |
| **Zone cell** | Shows zone name (truncated to 8 chars) + infected count |
| **Red border + dot** | Full lockdown active (level 2) — glowing red border around cell |
| **Yellow border + dot** | Partial lockdown active (level 1) |
| **Purple dot (bottom-right)** | Vaccination deployed in this zone |
| **Blue dot (bottom-left)** | Military deployed in this zone |
| **INF / DEC counters** | Animated total infected and deceased counts |
| **Legend bar** | CLR/LOW/MED/HI color key for infection levels |
| **LAUNCH button** | Starts the simulation (1 day per second) |
| **Reset button** | Resets entire simulation to Day 0 |
| **ADVANCE 5 DAYS + COUNCIL DEBATE** | Jumps 5 days forward then triggers AI debate |
| **DEMO MODE — AUTO PILOT** | Automated demonstration: runs sim, injects crisis, triggers debate, types advisory — for judges |
| **INJECT CRISIS EVENT** | Dropdown with 10 crisis scenarios (mutation, hospital fire, etc.) |

### 4.3 Center Panel — Agent Council

| Element | What It Does |
|---------|-------------|
| **Agent messages** | Streaming text from each of 4 agents with color-coded headers |
| **Agent emoji + name + role** | Identifies who is speaking (🏥 Dr. Meera Sharma — Health Director) |
| **"thinking" indicator** | Pulsing dots while agent response is being generated |
| **Streaming text** | Real-time typewriter effect as Gemini generates tokens |
| **Previous Session dropdown** | Collapsible view of previous debate round at 60% opacity |
| **Current Session divider** | Visual separator between old and new debate |
| **Executed Actions** | Green action cards showing what the coordinator decided (e.g. "Full lockdown enforced in Old Town") |
| **"Council convening..." loader** | Three-dot animation shown when debate is initializing |
| **ADVISE THE COUNCIL input** | Text field where user types strategic advisory for all agents |
| **Quick Suggestions dropdown** | Pre-written advisories: "Prioritize vaccination", "Open economy", etc. |

### 4.4 Right Panel — Live Intelligence

| Element | What It Does |
|---------|-------------|
| **Active Cases** | Real-time infected count with red icon |
| **Casualties** | Total deceased |
| **Recovered** | Total recovered |
| **Hospital Load** | Percentage of hospital beds occupied |
| **Economy gauge** | Bar + number (0-100, turns RED when negative) |
| **Morale gauge** | Bar + number (0-100, turns RED when negative) |
| **Chart switcher** | 5 tabs: SIR Curve, Stacked Bar, Stability, Radar, Pie |
| **SIR Curve** | Area chart showing Susceptible/Infected/Recovered/Deceased over time |
| **Stacked Bar** | Daily breakdown of S/I/R/D populations |
| **Stability** | Line chart tracking Economy and Morale indices over time |
| **Radar** | Pentagon radar showing Infected/Hospital/Deceased/Economy/Morale/Zones Hit |
| **Pie** | Donut chart of current population distribution |
| **Zones affected** | Count of zones with active infections |
| **Under lockdown** | Count of zones currently locked down |

### 4.5 Zone Detail Popup (click any grid cell)

| Element | What It Does |
|---------|-------------|
| **Zone name + ID** | Full zone name and grid position |
| **Population / Infected / Recovered / Deceased** | Detailed zone stats |
| **Hospital bar** | Visual occupancy bar (red when >100%) |
| **Lockdown status** | Current level (None/Partial/Full) |
| **Vaccination %** | Current vaccination coverage |
| **Quick Actions** | 4 buttons: Full Lockdown, Partial Lockdown, Lift Lockdown, Vaccinate, Expand Hospital |
| **Action toast** | Green confirmation "✓ Action applied" when clicking any quick action |

### 4.6 Decision Log Tab

| Element | What It Does |
|---------|-------------|
| **Decision cards** | Each past coordinator decision with day number, summary, and actions taken |
| **Color-coded borders** | Left border color indicates severity of the situation when decision was made |
| **Expandable detail** | Click to see full coordinator reasoning chain |

### 4.7 Guidelines Tab

| Element | What It Does |
|---------|-------------|
| **WHO-style guidelines** | Reference document on crisis management phases |
| **Decision framework** | When to lockdown, when to vaccinate, when to deploy military |
| **Risk assessment** | Criteria for threat level escalation |

---

## 5. Simulation Engine Deep Dive

### 5.1 SIR Model

The engine uses a **modified SIR (Susceptible → Infected → Recovered)** compartmental model:

```
S → I → R (or D)

New Infections = infected × (R0/14) × (susceptible/population)
Recoveries     = infected × (1/14)
Deaths         = infected × 0.02 × (1/14) × hospitalOverflowMultiplier
```

- **Base R0**: 2.5 (comparable to COVID-19 original strain)
- **Recovery period**: 14 days
- **Base mortality**: 2%
- **Hospital overflow multiplier**: 1.5× mortality when hospitals are over capacity

### 5.2 R0 Modifiers

| Factor | Effect on R0 |
|--------|-------------|
| Partial lockdown | ×0.6 |
| Full lockdown | ×0.25 |
| Military deployment | ×0.7 |
| Vaccination | ×(1 - vacRate × 0.8) |
| Dense zone (>40k pop) | ×1.2 |
| Minimum R0 | 0.1 (never fully stops) |

### 5.3 Cross-Zone Spread

- Each day, zones with >10 infected spill 2% of cases to adjacent zones (up/down/left/right)
- Full lockdown blocks ALL outbound spread
- Partial lockdown reduces spillover by 30%

### 5.4 Economy Index (0 to -50..100)

Drops from:
- Lockdowns: 0.15/day (partial), 0.35/day (full) per zone
- Infection workforce loss: up to 15 points proportional to infection rate
- Hospital overflow: 0.5/day per overwhelmed hospital
- Tiny recovery: +0.1/day natural

### 5.5 Public Morale (0 to -50..100)

Drops from:
- Death shock: 0.05-0.30/day based on total deaths
- Lockdown fatigue: 0.2/day per locked zone
- Infection fear: proportional to infection rate
- Recovery: +0.2/day only when no lockdowns AND infections <500

### 5.6 Available Actions

| Action | Code | Effect |
|--------|------|--------|
| Full Lockdown | `lockdown` | Sets zone lockdownLevel=2, R0×0.25 |
| Partial Lockdown | `partial_lockdown` | lockdownLevel=1, R0×0.6 |
| Lift Lockdown | `lift_lockdown` | lockdownLevel=0 |
| Deploy Military | `deploy_military` | R0×0.7, enforcement support |
| Vaccinate | `vaccinate` | +10% vaccination rate per application |
| Expand Hospital | `expand_hospital` | +200 bed capacity |

### 5.7 Crisis Events (10 total)

| Event | Effect |
|-------|--------|
| ⚠️ Virus Mutation | R0 ×1.4 |
| 🔥 Hospital Fire (Zone 7) | Hospital capacity ×0.4 |
| 📦 Medical Supply Shortage | Mortality ×1.5 |
| 🎉 Mass Gathering (Zone 3) | +5000 infections in Market |
| 💉 Vaccine Shipment | Enables vaccination drives |
| ⚡ Power Grid Failure | Zones 5-8 lose 70% hospital capacity, mortality ×1.8 |
| 📱 Anti-Vaccine Misinformation | Morale -30 |
| 🚧 Border Breach | +3000 infections in Zones 0-2 |
| 🏥 Healthcare Strike | All hospitals -50% capacity, morale -15 |
| 🚰 Water Contamination | +2000 infections in Zone 10 |

---

## 6. AI Agent System Deep Dive

### 6.1 The Four Agents

| Agent | Name | Priority | Bias |
|-------|------|----------|------|
| 🏥 Health | Dr. Meera Sharma | Minimize casualties | Always pushes aggressive lockdowns |
| 💰 Economy | Arjun Patel | Protect livelihoods | Resists lockdowns, proposes targeted alternatives |
| 👮 Safety | Inspector Kavya Reddy | Public order | Warns about riots, enforceability, communication |
| 🎯 Coordinator | Commissioner Vikram Das | Optimal decision | Weighs all three, produces structured DECISION |

### 6.2 Debate Flow

1. **Health** speaks first — sees only raw simulation data
2. **Economy** responds — sees Health's full argument, must counter specific points
3. **Safety** responds — sees both, brings ground-level enforcement reality
4. **Coordinator** — sees ALL three arguments + user advisory → makes final DECISION

### 6.3 Advisory System

When user types advisory (e.g. "Focus on vaccination in worst zones"):
- ALL 4 agents receive it as `MANDATORY: CITIZEN/LEADER ADVISORY`
- They MUST address it — agree, disagree, or modify
- Coordinator parses advisory keywords and modifies both DECISION and ACTION PLAN
- Keywords detected: hospital, vaccin, lockdown, test, economy, military, etc.

### 6.4 Decision Parsing

The coordinator's text is parsed by `parseDecisionAction()` which searches for keywords:
- "full lockdown" / "complete lockdown" → `lockdown` action
- "partial lockdown" / "targeted lockdown" → `partial_lockdown` action
- "vaccin" → `vaccinate` action
- "expand hospital" / "field hospital" / "additional beds" → `expand_hospital`
- "testing" / "mass test" → `testing` action
- "lift lockdown" / "ease restriction" / "reopen" → `lift_lockdown`
- "deploy military" / "army" → `deploy_military`

Zone IDs are extracted from patterns like "Zone 5" or matching zone names.

### 6.5 Fallback System

If Gemini API fails (rate limit, network error), the system uses **intelligent mock responses** that:
- Parse the actual simulation data (infection counts, economy, morale)
- Reference specific zone names from the report
- Include the user's advisory text
- Vary responses based on severity tiers (moderate / high / extreme)
- Feel indistinguishable from real AI responses during a demo

---

## 7. File Structure

```
hackathon-ready/
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    # Main orchestrator (759 lines)
│   │   │                               # State management, layout, tick loop,
│   │   │                               # debate trigger, crisis handler, demo mode
│   │   ├── index.css                  # CSS theme system (dark + light mode)
│   │   ├── theme.js                   # Theme token definitions
│   │   ├── components/
│   │   │   ├── CityGrid.jsx           # 6×6 interactive zone grid with lockdown indicators
│   │   │   ├── AgentPanel.jsx          # Agent debate display, streaming, advisory input
│   │   │   ├── ZoneDetail.jsx          # Zone drill-down popup with quick actions
│   │   │   ├── DecisionLog.jsx         # Historical decision timeline
│   │   │   ├── ControlPanel.jsx        # Play/pause/crisis/advisory controls
│   │   │   ├── CrisisGuidelines.jsx    # WHO-style reference guidelines
│   │   │   ├── ResizeHandle.jsx        # Draggable column dividers
│   │   │   └── StatsPanel.jsx          # Stat boxes and gauge components
│   │   ├── engine/
│   │   │   ├── simulation.js           # SIR model, zone generator, crisis events (372 lines)
│   │   │   └── agents.js               # 4 AI agents, debate flow, decision parser (473 lines)
│   │   ├── services/
│   │   │   └── gemini.js               # Gemini 2.5 Pro SDK wrapper, streaming
│   │   └── hooks/
│   │       └── useEffects.js           # Animated numbers, typewriter effect
│   ├── .env                            # VITE_GEMINI_API_KEY (local only, gitignored)
│   └── package.json                    # Dependencies
├── docs/                               # Production build served by GitHub Pages
│   ├── index.html
│   └── assets/                         # Bundled JS + CSS
├── presentation.html                   # 9-slide pitch deck
├── progress.md                         # Checkpoint progress reports
├── DOCUMENTATION.md                    # This file
└── README.md                           # Quick start guide
```

---

## 8. Team Task Division

### Member 1 — **Simulation Engine & Data Modeling** (Backend Logic)
- Built the SIR compartmental model (`simulation.js`)
- Designed 36 city zones with unique populations, hospital capacities, economic values
- Implemented cross-zone disease spread with adjacency logic
- Created all 10 crisis events with specific state modifications
- Built economy and morale decay systems with multiple pressure sources
- Implemented `applyDecision()` for all 7 action types

### Member 2 — **AI Agent System & Prompt Engineering** (AI/ML)
- Designed 4 agent personas with conflicting priorities and realistic biases
- Wrote detailed system prompts forcing agents to cite specific data
- Built the sequential debate flow (Health → Economy → Safety → Coordinator)
- Implemented `parseDecisionAction()` to extract structured actions from natural language
- Created intelligent mock fallback responses that use real simulation data
- Integrated Gemini 2.5 Pro streaming API with `@google/genai` SDK

### Member 3 — **Frontend UI & Data Visualization** (Frontend)
- Built the 3-column tactical dashboard layout with resizable panels
- Created the interactive 6×6 city grid with lockdown/vaccination indicators
- Implemented 5 chart types (SIR curve, stacked bar, stability, radar, pie) using Recharts
- Built the zone detail popup with quick action buttons
- Created dark/light theme system with CSS variables
- Implemented animated gauges, toast notifications, and streaming text display

### Member 4 — **Integration, Deployment & Demo** (DevOps + Polish)
- Wired all components together in `App.jsx` (state management, event flow)
- Built the Demo Mode auto-pilot for hackathon judges
- Set up GitHub Pages deployment pipeline (build → docs → push)
- Handled API key security (git history scrub, .env, .gitignore)
- Created the presentation deck (`presentation.html`)
- Bug fixing, performance optimization, production hardening

---

## 9. Future Scope

### Phase 2 — Enhanced Simulation
- **Multi-disease modeling**: Simulate concurrent outbreaks (COVID + flu season)
- **Population mobility**: Model commuter patterns between zones (home → work → home)
- **Resource logistics**: Track PPE, ventilators, test kits as finite resources that can run out
- **Weather effects**: Seasonal R0 variation (higher in winter, lower in summer)

### Phase 3 — Advanced AI
- **Learning agents**: Agents remember past decisions and their outcomes across sessions
- **Adversarial mode**: One agent actively tries to worsen the crisis (simulating misinformation actors)
- **Multi-language support**: Agents debate in regional languages for local government training
- **Fine-tuned model**: Train a custom model on real pandemic response data (WHO, CDC case studies)

### Phase 4 — Platform
- **Multiplayer mode**: Multiple users control different zones, negotiate resources
- **Scenario library**: Pre-built scenarios (1918 Flu, 2020 COVID, Ebola, fictional bioterrorism)
- **Training certification**: Government officials complete scenarios and receive crisis management scores
- **API**: Expose the simulation engine as a REST API for third-party integrations
- **Mobile app**: Touch-optimized version for tablet-based crisis command centers

### Phase 5 — Real-World Application
- **Integration with real epidemiological data**: Feed actual case data from government APIs
- **Hospital dashboard**: Real hospitals connect their capacity data for live monitoring
- **Early warning system**: AI agents monitor real data streams and alert when thresholds are crossed
- **Policy testing lab**: Government teams test proposed policies (lockdown timing, vaccine distribution) before implementation

---

## 10. Presentation Flow Guide

### Optimal Demo Sequence (5 minutes)

**Step 1: Introduction (30 sec)**
- Show the dashboard. Point out: 36 zones, 1.2M population, Day 0, 150 initial infections in Old Town.
- "This is SimulCrisis — a real-time pandemic decision simulator powered by 4 AI agents."

**Step 2: Launch Simulation (30 sec)**
- Click **LAUNCH**. Watch infections spread on the grid.
- Point out: red cells appearing, infection count rising, economy/morale starting to drop.
- "The disease is spreading through adjacent zones. Economy and morale are already declining."

**Step 3: First Council Debate (60 sec)**
- Wait for Day 5 (auto-triggers) or click **ADVANCE 5 DAYS + COUNCIL DEBATE**
- Watch agents stream their arguments in real-time
- Point out: "Health wants full lockdown, Economy pushes back with cost data, Safety warns about riots."
- Show the coordinator's structured DECISION with reasoning chain
- Show the executed actions appearing (green cards)

**Step 4: Inject a Crisis (30 sec)**
- Click **INJECT CRISIS EVENT** → select **🎉 Unauthorized Mass Gathering**
- Show the spike in infections on the grid (Zone 3 lights up red)
- "Now the situation has escalated. The AI council is convening an emergency debate."

**Step 5: User Advisory (60 sec)**
- Type in the advisory box: **"Focus all resources on mass vaccination in the worst-hit zones"**
- Press Enter / Send
- Watch agents respond to YOUR advisory specifically — "The advisory suggests vaccination..."
- Show coordinator ACCEPTING the advisory and modifying the action plan

**Step 6: Show Impact (30 sec)**
- Switch to **Stability** chart → show economy and morale trends
- Switch to **Radar** chart → show multi-dimensional crisis view
- Click a locked-down zone → show Zone Detail popup with hospital bar, vaccination rate

**Step 7: Close (30 sec)**
- "SimulCrisis isn't just a dashboard — it's a decision laboratory where AI agents with conflicting priorities force you to confront trade-offs no single expert can see alone."

### Best Advisory Phrases to Type (Maximum Scenarios)

| Advisory Text | What Happens |
|---------------|-------------|
| `"Prioritize mass vaccination in all hotspot zones"` | Coordinator shifts to vaccination-focused plan, action cards show vaccine deployment |
| `"Lock down everything immediately"` | Health agent supports, Economy agent pushes back hard, Coordinator debates trade-offs |
| `"Open the economy, lift all lockdowns"` | Economy agent celebrates, Health agent panics, Safety warns about migration |
| `"Deploy military to worst zones"` | Safety agent discusses enforceability, Coordinator may accept with caveats |
| `"Expand hospital capacity first"` | All agents discuss feasibility, action shows +200 beds deployed |
| `"Focus on mass testing and contact tracing"` | Testing-focused response, Coordinator orders city-wide testing mandate |

---

## 11. FAQ for Judges

**Q: Is the AI actually running live?**
A: Yes. The green "GEMINI LIVE" badge means Gemini 2.5 Pro is active. Each agent response is streamed in real-time from the API. If the API is unavailable (rate limits), intelligent data-driven mock responses activate seamlessly — the user experience is identical.

**Q: How is this different from a simple chatbot?**
A: This is a **multi-agent system** where 4 AI agents with conflicting priorities argue with each other, reference specific simulation data, and produce actionable decisions that directly modify a running SIR simulation. A chatbot answers questions; SimulCrisis makes decisions under uncertainty.

**Q: Can the user actually influence the AI's decisions?**
A: Yes. The advisory system passes user input to ALL 4 agents as a mandatory item they must address. The coordinator parses advisory keywords and modifies its decision and action plan accordingly.

**Q: Is the simulation scientifically accurate?**
A: The SIR model uses standard epidemiological parameters (R0=2.5, 14-day recovery, 2% mortality). Cross-zone spread, hospital overflow mortality multipliers, and lockdown effectiveness values are based on published pandemic modeling research.

**Q: How many lines of code?**
A: ~2,800 lines of hand-written JavaScript/JSX across 12 source files. No boilerplate generators — every line serves a purpose.

**Q: What happens if the API key runs out of quota?**
A: The system automatically falls back to intelligent mock responses that use the REAL simulation data. Mock responses reference actual zone names, infection counts, and economic values — they're designed to be indistinguishable from AI responses during a demo.

---

*Built in 24 hours at Aurum 2026 by Team Semicolon Mafia.*
