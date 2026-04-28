/**
 * SimulCrisis — AI Agent System (v2)
 * ====================================
 * 4 AI agents with conflicting priorities debate crisis response.
 * Each agent receives RICH simulation data and MUST reference it.
 * The Coordinator weighs all inputs and makes a final explainable decision.
 *
 * Key improvements over v1:
 * - Agents see zone-by-zone data, trends, and previous decision outcomes
 * - Advisory is MANDATORY to address when provided
 * - Agents reference each other's arguments and disagree
 * - Coordinator produces structured, actionable decisions
 */

import { isGeminiReady, generateAgentResponseStreaming } from '../services/gemini';

// ─── Agent Definitions ───────────────────────────────────
export const AGENTS = {
  health: {
    id: 'health',
    name: 'Dr. Meera Sharma',
    role: 'Health Director',
    emoji: '🏥',
    color: '#ef4444',
    priority: 'Minimize casualties and contain the outbreak',
    systemPrompt: `You are Dr. Meera Sharma, Health Director. You are in a LIVE crisis simulation council.

RULES — YOU MUST FOLLOW THESE:
1. ALWAYS cite SPECIFIC numbers from the data (e.g. "Zone Old Town has 659 cases with hospital at 344% capacity")
2. NEVER give generic advice. Every sentence must reference the ACTUAL data you were given.
3. If a user advisory was provided, you MUST directly address it — agree, disagree, or modify it.
4. If another agent said something you disagree with, NAME them and explain why they're wrong.
5. Your response must contain at least ONE specific zone name, ONE number, and ONE concrete action.

YOUR BIAS: You ALWAYS lean toward aggressive containment. You think economic concerns are secondary to saving lives. You get frustrated when others downplay the severity.

FORMAT: 2-3 punchy paragraphs. No bullet points. Speak like a doctor in a war room, not a report.`,
  },

  economy: {
    id: 'economy',
    name: 'Arjun Patel',
    role: 'Economic Advisor',
    emoji: '💰',
    color: '#f59e0b',
    priority: 'Protect livelihoods and economic stability',
    systemPrompt: `You are Arjun Patel, Economic Advisor. You are in a LIVE crisis simulation council.

RULES — YOU MUST FOLLOW THESE:
1. ALWAYS calculate economic costs using the data ("lockdown of Zone Finance will cost ₹X Cr based on its economic value of Y")
2. NEVER agree with full lockdowns without proposing a cheaper alternative first.
3. If a user advisory was provided, you MUST analyze its economic impact — be specific with numbers.
4. When the Health Director pushes for lockdowns, you MUST push back with cost-benefit numbers.
5. Reference specific zones by name, their economic values, and what shutting them down means.

YOUR BIAS: You believe poverty kills more people long-term than pandemics. You think targeted interventions are always better than blanket responses. You get annoyed by "save lives at any cost" arguments because the cost falls on the poor.

FORMAT: 2-3 punchy paragraphs. No bullet points. Speak like an economist who's seen the human cost of recession.`,
  },

  safety: {
    id: 'safety',
    name: 'Inspector Kavya Reddy',
    role: 'Public Safety Chief',
    emoji: '👮',
    color: '#3b82f6',
    priority: 'Maintain public order and social stability',
    systemPrompt: `You are Inspector Kavya Reddy, Public Safety Chief. You are in a LIVE crisis simulation council.

RULES — YOU MUST FOLLOW THESE:
1. ALWAYS assess whether proposed actions are PHYSICALLY ENFORCEABLE (how many police needed, which zones)
2. NEVER ignore the morale data — low morale means riots, non-compliance, migration.
3. If a user advisory was provided, assess whether it's practically implementable on the ground.
4. If other agents propose actions, tell them the REAL consequences on the streets.
5. Reference specific zones, lockdown status, population density, and public morale numbers.

YOUR BIAS: You've seen cities burn from panic. You think rushed decisions without public communication cause more harm than the crisis. You care about the people other agents forget — migrants, daily-wage workers, elderly living alone.

FORMAT: 2-3 punchy paragraphs. No bullet points. Speak like a police chief who's been on the ground during riots.`,
  },

  coordinator: {
    id: 'coordinator',
    name: 'Commissioner Vikram Das',
    role: 'Crisis Coordinator',
    emoji: '🎯',
    color: '#8b5cf6',
    priority: 'Make the optimal balanced decision',
    systemPrompt: `You are Commissioner Vikram Das, Crisis Coordinator. You've heard all three agents argue. Now YOU decide.

YOU MUST use this EXACT format:

**DECISION:** [One specific, actionable decision. Name zones, numbers, timeline.]

**Why this, not that:**
- I'm going with [Health/Economy/Safety]'s recommendation on [X] because [specific data reason]
- I'm REJECTING [Agent name]'s suggestion to [Y] because [specific counter-argument]
- The user advised "[advisory text]" — [how you're incorporating or rejecting it and why]

**Reasoning Chain:**
1. Health (weight: X.XX) — [cite their specific argument + data they used]
2. Economy (weight: X.XX) — [cite their specific argument + data they used]
3. Safety (weight: X.XX) — [cite their specific argument + data they used]

**Concrete Actions (next 5 days):**
- Action 1: [e.g. "Full lockdown Zone Old Town and Zone Tech Hub"]
- Action 2: [e.g. "Deploy 200 additional beds to Hospital Zone"]
- Action 3: [e.g. "Open economic relief corridor for Zone Finance"]

**Confidence:** [0-100]% — [one sentence explaining why this confidence level]

**If I'm wrong:** [What's the fallback if this decision backfires in 5 days]

Be DECISIVE. Do NOT hedge. Pick a side and justify it with data.`,
  },
};

// ─── Build Situation Report (MUCH richer) ─────────────────
export function buildSituationReport(stats, zones, day, recentDecisions = []) {
  const hotZones = zones
    .filter(z => z.infected > 50)
    .sort((a, b) => b.infected - a.infected)
    .slice(0, 8);

  const safeZones = zones.filter(z => z.infected === 0);
  const overwhelmedHospitals = zones.filter(z => z.hospitalCapacity > 0 && z.hospitalOccupancy > z.hospitalCapacity);
  const lockdownZones = zones.filter(z => z.lockdownLevel > 0);
  const totalPop = zones.reduce((s, z) => s + z.population, 0);
  const infectionRate = ((stats.totalInfected / totalPop) * 100).toFixed(2);
  const mortalityRate = stats.totalInfected > 0 ? ((stats.totalDeceased / (stats.totalInfected + stats.totalRecovered + stats.totalDeceased)) * 100).toFixed(2) : '0';

  let report = `══════ CRISIS SITUATION REPORT — DAY ${day} ══════

SUMMARY:
- Total Population: ${totalPop.toLocaleString()}
- Active Infections: ${stats.totalInfected.toLocaleString()} (${infectionRate}% of population)
- Recovered: ${stats.totalRecovered.toLocaleString()}
- Deceased: ${stats.totalDeceased.toLocaleString()} (Case Fatality Rate: ${mortalityRate}%)
- Economy: ${Math.round(stats.economyIndex)}/100 ${stats.economyIndex < 60 ? '⚠️ CRITICAL' : stats.economyIndex < 80 ? '⚠️ DECLINING' : '✅'}
- Public Morale: ${Math.round(stats.publicMorale)}/100 ${stats.publicMorale < 40 ? '🔴 CIVIL UNREST RISK' : stats.publicMorale < 60 ? '🟡 TENSE' : '🟢'}
- Hospital System: ${stats.hospitalLoad}/${stats.hospitalCapacity} beds (${Math.round(stats.hospitalLoad/stats.hospitalCapacity*100)}% occupancy)

ZONE-BY-ZONE HOTSPOTS (worst first):
${hotZones.map(z => {
  const hospStatus = z.hospitalCapacity > 0 
    ? `Hospital: ${z.hospitalOccupancy}/${z.hospitalCapacity} (${Math.round(z.hospitalOccupancy/z.hospitalCapacity*100)}%)` 
    : 'No hospital';
  return `• ${z.name}: ${z.infected.toLocaleString()} infected | Pop: ${z.population.toLocaleString()} | ${hospStatus} | Lockdown: ${['NONE','PARTIAL','FULL'][z.lockdownLevel]} | Vaccination: ${Math.round((z.vaccinationRate||0)*100)}%`;
}).join('\n')}

${overwhelmedHospitals.length > 0 ? `🚨 HOSPITAL CRISIS: ${overwhelmedHospitals.map(z => `${z.name} at ${Math.round(z.hospitalOccupancy/z.hospitalCapacity*100)}%`).join(', ')}` : ''}
${safeZones.length > 0 ? `Safe zones (0 cases): ${safeZones.length}/36 remaining` : '⚠️ ALL ZONES NOW INFECTED'}
${lockdownZones.length > 0 ? `Currently under lockdown: ${lockdownZones.map(z => `${z.name} (${['','PARTIAL','FULL'][z.lockdownLevel]})`).join(', ')}` : 'No lockdowns currently active'}`;

  if (recentDecisions.length > 0) {
    report += `\n\nPREVIOUS DECISIONS & OUTCOMES:\n${recentDecisions.slice(-3).map(d => `• Day ${d.day}: ${d.summary} → ${d.outcome || 'Outcome pending'}`).join('\n')}`;
  }

  return report;
}

// ─── Extract key stats from situation report for mock responses ───
function extractStats(report) {
  const infected = report.match(/Active Infections:\s*([\d,]+)/)?.[1] || '0';
  const deceased = report.match(/Deceased:\s*([\d,]+)/)?.[1] || '0';
  const economy = report.match(/Economy:\s*([\d.]+)/)?.[1] || '100';
  const morale = report.match(/Public Morale:\s*([\d.]+)/)?.[1] || '100';
  const hospital = report.match(/Hospital System:\s*(\d+)\/(\d+)/);
  const hospPct = hospital ? Math.round(parseInt(hospital[1]) / parseInt(hospital[2]) * 100) : 0;
  const hotZones = (report.match(/• (.+?):/g) || []).map(z => z.replace('• ', '').replace(':', ''));
  return { infected, deceased, economy, morale, hospPct, hotZones };
}

// ─── Intelligent Mock Responses (data-driven) ─────────────
function getMockResponse(agentId, situationReport, otherAgentInputs, userAdvisory) {
  const s = extractStats(situationReport);
  const infNum = parseInt(s.infected.replace(/,/g, ''));
  const econNum = parseFloat(s.economy);
  const moraleNum = parseFloat(s.morale);
  const topZone = s.hotZones[0] || 'the worst-hit zone';
  const secondZone = s.hotZones[1] || 'adjacent zones';

  const mocks = {
    health: () => {
      if (infNum > 5000) {
        return `This is a catastrophe unfolding in real time. ${topZone} alone has thousands of active cases and the hospitals there are at ${s.hospPct}% capacity — we are literally turning patients away to die. I don't care what Arjun says about the economy — you cannot have an economy if your workforce is dead or in ICU beds. We need FULL lockdown of ${topZone} and ${secondZone} immediately, not tomorrow, not after "consultation" — NOW.\n\n${userAdvisory ? `Regarding the advisory "${userAdvisory}" — ${infNum > 5000 ? 'this is secondary to the immediate containment crisis. We implement containment FIRST, then we can discuss finer strategies.' : 'I support this approach as part of a broader containment strategy.'}` : 'We have ${s.deceased} deaths already. Every hour we debate is another family destroyed. I need a decision NOW.'}`;
      } else if (infNum > 1000) {
        return `We're at a critical inflection point. ${s.infected} active cases with ${s.hospPct}% hospital load — this is exactly where cities lose control if they don't act decisively. ${topZone} needs immediate targeted lockdown and I want emergency testing deployed to ${secondZone} before it becomes the next hotspot. The mortality rate is climbing and I can see the hospital overflow happening within 3 days if we don't intervene.\n\n${userAdvisory ? `On the advisory "${userAdvisory}" — this is worth considering but ONLY if paired with aggressive containment in the top 3 hotspot zones simultaneously.` : `I know Arjun will push back on lockdowns, but I'd rather have a temporary economic dip than permanent mass graves.`}`;
      } else {
        return `Current situation with ${s.infected} cases is still containable — but the window is closing fast. I'm watching ${topZone} carefully; the infection doubling rate suggests we'll hit critical mass within a week if we don't deploy targeted testing and ring-vaccination NOW. Hospital capacity at ${s.hospPct}% gives us a buffer, but buffers evaporate fast in exponential growth.\n\n${userAdvisory ? `The advisory "${userAdvisory}" aligns with early intervention — I support implementing this alongside enhanced surveillance in all adjacent zones.` : 'This is our chance to contain this before it becomes uncontainable. Proactive spending now saves lives AND money later.'}`;
      }
    },

    economy: () => {
      if (econNum < 60) {
        return `The economy is in freefall — ${s.economy}/100 and dropping. Every zone under lockdown is hemorrhaging jobs. If Dr. Sharma gets another full lockdown, we'll cross the point of no return: business closures become permanent, unemployment triggers its own health crisis, and the tax base collapses meaning NO funding for hospitals or vaccines. I need smart containment: keep ${secondZone}'s commercial corridor OPEN while we quarantine ${topZone} specifically.\n\n${userAdvisory ? `Regarding "${userAdvisory}" — I'll support it ONLY if we simultaneously open economic relief corridors. We cannot afford a single-axis response.` : 'We need to stop treating lockdowns as free actions. They are NOT free. They cost lives too — just slower, quieter deaths from poverty and despair.'}`;
      } else {
        return `Economy at ${s.economy}/100 — we still have room but I'm watching the trajectory. ${s.hospPct}% hospital load is concerning but Dr. Sharma's instinct for blanket lockdowns would cost approximately ₹2-4 Cr per day per locked zone. I propose targeted quarantine: isolate ${topZone}'s residential blocks while keeping essential commercial activity running. Close non-essential gathering points, not entire zones.\n\n${userAdvisory ? `The advisory "${userAdvisory}" — economically, this is ${econNum > 70 ? 'viable if we implement it smartly. I can work with this.' : 'risky given our declining economy. Modified version: implement it only in the top 2 hotspot zones to limit economic damage.'}` : `Public morale at ${s.morale}/100 — remember that economic despair feeds into low morale which feeds into non-compliance which makes EVERYTHING harder.`}`;
      }
    },

    safety: () => {
      if (moraleNum < 40) {
        return `I need everyone to hear this clearly: public morale is at ${s.morale}/100. We are ONE bad announcement away from civil unrest. I have reports of panic buying in ${secondZone}, and if we announce another lockdown without 48 hours of preparation and public communication, I cannot guarantee order. Dr. Sharma wants immediate lockdowns — respectfully, she's never had to face an angry crowd of 10,000 migrants who just lost their daily wage.\n\n${userAdvisory ? `The advisory "${userAdvisory}" — this needs to be communicated carefully to the public BEFORE implementation. Surprise policy changes at morale ${s.morale}/100 are a recipe for riots.` : 'Before we decide WHAT to do, we need to decide HOW to communicate it. The messaging matters as much as the medicine.'}`;
      } else {
        return `Ground assessment: enforcement capacity is stretched but manageable. We currently have ${s.hotZones.length} hotspot zones requiring monitoring. ${infNum > 500 ? `If we lock down ${topZone}, I need 72 hours to position personnel and set up supply corridors — sudden lockdowns cause migration waves that SPREAD the virus to clean zones.` : 'Current measures are enforceable with existing deployment.'} I want to flag that ${topZone}'s demographics include significant daily-wage worker populations — lockdown without income support will cause migration.\n\n${userAdvisory ? `On "${userAdvisory}" — from an enforcement perspective, ${moraleNum > 60 ? 'this is feasible with current resources. Public sentiment is cooperative enough.' : 'feasible but we need to pair it with visible community engagement to maintain compliance.'}` : 'Whatever we decide, I need it communicated through community leaders first. Top-down orders without local buy-in fail every time.'}`;
      }
    },

    coordinator: () => {
      const severity = infNum > 5000 ? 'extreme' : infNum > 1000 ? 'high' : 'moderate';
      const healthWeight = severity === 'extreme' ? '0.50' : severity === 'high' ? '0.40' : '0.30';
      const econWeight = econNum < 70 ? '0.30' : '0.20';
      const safetyWeight = moraleNum < 50 ? '0.25' : '0.15';
      
      const decision = severity === 'extreme'
        ? `Full lockdown of ${topZone} and ${secondZone}, emergency hospital expansion, economic relief package for locked zones`
        : severity === 'high'
        ? `Targeted lockdown of ${topZone} with partial restrictions in ${secondZone}, accelerated vaccination in all hotspot zones`
        : `Enhanced monitoring and testing in ${topZone}, preparatory lockdown planning for ${secondZone} if cases double`;

      return `**DECISION:** ${decision}

**Why this, not that:**
- Going with Health's push for containment in ${topZone} because ${s.hospPct}% hospital load leaves no margin for error
- ${econNum < 70 ? `PARTIALLY accepting Economy's objection — opening relief corridor to limit economic damage` : `Overriding Economy's preference for minimal intervention — the infection trajectory demands stronger action`}
- Incorporating Safety's 48hr communication window — we announce today, enforce in 48 hours
${userAdvisory ? `- User advisory "${userAdvisory}" — ${severity === 'extreme' ? 'noted but containment takes priority over fine-tuning right now' : 'incorporating this into the implementation framework'}` : '- No external advisory received this cycle'}

**Reasoning Chain:**
1. Health (weight: ${healthWeight}) — ${s.infected} active cases, hospitals at ${s.hospPct}%, ${severity === 'extreme' ? 'demands immediate maximum intervention' : 'requires proactive but measured response'}
2. Economy (weight: ${econWeight}) — Economy at ${s.economy}/100, ${econNum < 70 ? 'already critical — cannot afford broad lockdowns' : 'stable enough to absorb targeted measures'}
3. Safety (weight: ${safetyWeight}) — Morale at ${s.morale}/100, ${moraleNum < 50 ? 'civil unrest risk HIGH — communication critical' : 'public cooperation expected with proper messaging'}

**Concrete Actions (next 5 days):**
- Action 1: ${severity !== 'moderate' ? `Lockdown ${topZone} (${severity === 'extreme' ? 'FULL' : 'PARTIAL'})` : `Deploy mass testing to ${topZone}`}
- Action 2: Emergency hospital capacity +200 beds in nearest hospital zone
- Action 3: ${econNum < 70 ? 'Open economic relief corridor for essential businesses' : 'Accelerated vaccination drive in top 3 hotspot zones'}

**Confidence:** ${severity === 'extreme' ? '91' : severity === 'high' ? '78' : '65'}% — ${severity === 'extreme' ? 'High confidence because the data leaves no room for half-measures' : 'Moderate confidence — situation could evolve either way'}

**If I'm wrong:** ${severity === 'extreme' ? 'If lockdown fails to bend the curve in 5 days, we escalate to military-assisted enforcement and mandatory evacuation of overwhelmed hospital zones' : 'If cases double despite intervention, we immediately escalate to full lockdown with no further debate'}`;
    },
  };

  return mocks[agentId]();
}

// ─── Build User Prompt (MUCH richer context) ──────────────
function buildAgentPrompt(agent, situationReport, otherAgentInputs, userAdvisory) {
  let prompt = `Here is the LIVE crisis data. You MUST reference specific numbers and zone names from this data in your response:\n\n${situationReport}`;

  if (otherAgentInputs) {
    prompt += `\n\n══ WHAT OTHER COUNCIL MEMBERS SAID ══\n${otherAgentInputs}\n\nYou MUST directly respond to their arguments. Agree or disagree — cite specific data to support your position.`;
  }

  if (userAdvisory) {
    prompt += `\n\n══ ⚠️ MANDATORY: CITIZEN/LEADER ADVISORY ══\n"${userAdvisory}"\n\nYou MUST directly address this advisory in your response. Do you agree? Disagree? What modifications would you make? Be specific.`;
  }

  prompt += `\n\nRespond NOW as ${agent.name} (${agent.role}). Your priority: ${agent.priority}. Be specific, cite data, disagree with others if needed. No generic responses.`;
  return prompt;
}

// ─── Single Agent Response (Gemini Direct + Mock Fallback) ─
async function getAgentResponse(agentId, situationReport, otherAgentInputs = '', userAdvisory = '', onStream = null) {
  const agent = AGENTS[agentId];
  const prompt = buildAgentPrompt(agent, situationReport, otherAgentInputs, userAdvisory);

  // ── Try Gemini first ──
  if (isGeminiReady()) {
    try {
      const response = await generateAgentResponseStreaming(
        agent.systemPrompt,
        prompt,
        onStream
      );
      return response;
    } catch (err) {
      console.warn(`[Agent ${agentId}] Gemini failed, using mock:`, err.message);
    }
  }

  // ── Fallback: intelligent mock responses ──
  const mockText = getMockResponse(agentId, situationReport, otherAgentInputs, userAdvisory);

  if (onStream) {
    const words = mockText.split(' ');
    let accumulated = '';
    for (let i = 0; i < words.length; i++) {
      accumulated += (i > 0 ? ' ' : '') + words[i];
      onStream(accumulated);
      await new Promise(r => setTimeout(r, 25 + Math.random() * 35));
    }
  } else {
    await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
  }

  return mockText;
}

// ─── Run Full Agent Debate ────────────────────────────────
export async function runAgentDebate(stats, zones, day, recentDecisions = [], userAdvisory = '', onAgentSpeak = null) {
  const situationReport = buildSituationReport(stats, zones, day, recentDecisions);

  const makeStreamCb = (agentId) => {
    if (!onAgentSpeak) return null;
    return (partialText) => onAgentSpeak(agentId, partialText);
  };

  // Step 1: Health Director speaks first (sees raw data only)
  if (onAgentSpeak) onAgentSpeak('health', 'thinking');
  const healthResponse = await getAgentResponse('health', situationReport, '', userAdvisory, makeStreamCb('health'));

  // Step 2: Economic Advisor responds (sees Health's argument, must counter it)
  if (onAgentSpeak) onAgentSpeak('economy', 'thinking');
  const economyResponse = await getAgentResponse('economy', situationReport,
    `Dr. Meera Sharma (Health Director) argued:\n"${healthResponse}"`, userAdvisory, makeStreamCb('economy'));

  // Step 3: Safety Chief responds (sees both, brings ground reality)
  if (onAgentSpeak) onAgentSpeak('safety', 'thinking');
  const safetyResponse = await getAgentResponse('safety', situationReport,
    `Dr. Meera Sharma (Health Director) argued:\n"${healthResponse}"\n\nArjun Patel (Economic Advisor) argued:\n"${economyResponse}"`, userAdvisory, makeStreamCb('safety'));

  // Step 4: Coordinator makes final decision (sees ALL arguments)
  if (onAgentSpeak) onAgentSpeak('coordinator', 'thinking');
  const coordinatorResponse = await getAgentResponse('coordinator', situationReport,
    `Dr. Meera Sharma (Health): "${healthResponse}"\n\nArjun Patel (Economy): "${economyResponse}"\n\nInspector Kavya Reddy (Safety): "${safetyResponse}"`,
    userAdvisory, makeStreamCb('coordinator'));

  return {
    health: healthResponse,
    economy: economyResponse,
    safety: safetyResponse,
    coordinator: coordinatorResponse,
    situationReport,
    day,
    userAdvisory: userAdvisory || null,
  };
}

// ─── Parse Coordinator Decision into Action ───────────────
export function parseDecisionAction(coordinatorResponse) {
  const text = coordinatorResponse.toLowerCase();
  const actions = [];

  if (text.includes('full lockdown') || text.includes('complete lockdown')) {
    const zoneMatches = coordinatorResponse.match(/zone\s*(\d+)/gi) || [];
    const zoneIds = zoneMatches.map(m => parseInt(m.replace(/zone\s*/i, '')));
    if (zoneIds.length > 0) {
      actions.push({ action: 'lockdown', targetZones: zoneIds, level: 2, summary: `Full lockdown: Zones ${zoneIds.join(', ')}` });
    }
  }

  if (text.includes('partial lockdown') || text.includes('targeted lockdown') || text.includes('restricted movement')) {
    const zoneMatches = coordinatorResponse.match(/zone\s*(\d+)/gi) || [];
    const zoneIds = zoneMatches.map(m => parseInt(m.replace(/zone\s*/i, '')));
    if (zoneIds.length > 0) {
      actions.push({ action: 'partial_lockdown', targetZones: zoneIds, summary: `Partial lockdown: Zones ${zoneIds.join(', ')}` });
    }
  }

  if (text.includes('vaccin')) {
    const zoneMatches = coordinatorResponse.match(/zone\s*(\d+)/gi) || [];
    const zoneIds = zoneMatches.map(m => parseInt(m.replace(/zone\s*/i, '')));
    actions.push({ action: 'vaccinate', targetZones: zoneIds.length > 0 ? zoneIds : [0, 1, 2], summary: `Vaccination drive` });
  }

  if (text.includes('expand hospital') || text.includes('increase capacity') || text.includes('field hospital') || text.includes('additional beds')) {
    actions.push({ action: 'expand_hospital', targetZones: [7, 15, 28], summary: 'Hospital capacity expanded' });
  }

  if (text.includes('testing') || text.includes('mass test')) {
    actions.push({ action: 'testing', targetZones: [0, 1, 2, 3], summary: 'Mass testing deployed' });
  }

  return actions;
}
