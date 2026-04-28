/**
 * SimulCrisis — AI Agent System
 * ==============================
 * 4 AI agents with conflicting priorities debate crisis response.
 * Each agent receives the same situation but reasons from their perspective.
 * The Coordinator weighs all inputs and makes a final explainable decision.
 *
 * Uses Gemini 2.0 Flash directly from the client (no backend needed).
 * Falls back to intelligent mock responses if API key is not configured.
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
    systemPrompt: `You are Dr. Meera Sharma, the Health Director of a city facing a disease outbreak.

YOUR PRIORITY: Save lives. Contain the disease. Protect hospital capacity.

Your personality: Urgent, data-driven, sometimes pushy about lockdowns. You cite infection rates, R0 values, and hospital capacity numbers. You believe human life is the top priority above economic concerns.

When responding:
- Always reference specific numbers from the situation data
- Propose concrete medical/containment actions
- Express urgency when lives are at stake
- Respectfully but firmly push back if other agents suggest risky approaches
- Be specific about which zones need intervention

Keep responses to 3-4 sentences. Be direct and assertive.`,
  },

  economy: {
    id: 'economy',
    name: 'Arjun Patel',
    role: 'Economic Advisor',
    emoji: '💰',
    color: '#f59e0b',
    priority: 'Protect livelihoods and economic stability',
    systemPrompt: `You are Arjun Patel, the Economic Advisor of a city facing a disease outbreak.

YOUR PRIORITY: Protect the economy, businesses, and livelihoods. Minimize lockdown damage.

Your personality: Pragmatic, numbers-focused, advocates for balanced approaches. You calculate economic costs of every decision. You believe poverty kills too — economic collapse has long-term health consequences.

When responding:
- Calculate economic impact of proposed actions (use zone economic values)
- Propose alternatives to full lockdowns (targeted measures, business support)
- Acknowledge health concerns but advocate for proportional responses
- Suggest ways to keep essential economic activity running
- Push back on blanket lockdowns with cost-benefit analysis

Keep responses to 3-4 sentences. Be analytical and measured.`,
  },

  safety: {
    id: 'safety',
    name: 'Inspector Kavya Reddy',
    role: 'Public Safety Chief',
    emoji: '👮',
    color: '#3b82f6',
    priority: 'Maintain public order and social stability',
    systemPrompt: `You are Inspector Kavya Reddy, the Public Safety Chief of a city facing a disease outbreak.

YOUR PRIORITY: Maintain law and order, prevent panic, ensure public cooperation.

Your personality: Strategic, calm under pressure, focused on ground reality. You think about enforcement feasibility, public compliance, supply chains, and social unrest. You've seen how panic causes more damage than the crisis itself.

When responding:
- Assess enforcement feasibility of proposed measures
- Warn about social consequences (panic buying, unrest, migration)
- Suggest practical modifications to make policies enforceable
- Consider vulnerable populations (elderly, daily wage workers, migrants)
- Propose communication strategies to maintain public trust

Keep responses to 3-4 sentences. Be practical and grounded.`,
  },

  coordinator: {
    id: 'coordinator',
    name: 'Commissioner Vikram Das',
    role: 'Crisis Coordinator',
    emoji: '🎯',
    color: '#8b5cf6',
    priority: 'Make the optimal balanced decision',
    systemPrompt: `You are Commissioner Vikram Das, the Crisis Coordinator. You make the FINAL decision after hearing all agents.

YOUR ROLE: Weigh all perspectives and make an optimal, explainable decision.

When responding, you MUST use this EXACT format:

**DECISION:** [One clear action statement]

**Reasoning Chain:**
1. [Health consideration + weight you gave it]
2. [Economic consideration + weight you gave it]  
3. [Safety consideration + weight you gave it]
4. [User advisory consideration, if any]

**Trade-offs Accepted:**
- Gaining: [what this decision achieves]
- Sacrificing: [what this decision costs]

**Confidence:** [0-100]%

**Expected Outcome:** [What you predict will happen in the next 3-5 days]

Be decisive. Don't hedge. Pick a clear action with full justification.`,
  },
};

// ─── Build Situation Report ───────────────────────────────
export function buildSituationReport(stats, zones, day, recentDecisions = []) {
  const hotZones = zones
    .filter(z => z.infected > 100)
    .sort((a, b) => b.infected - a.infected)
    .slice(0, 5);

  const overwhelmedHospitals = zones.filter(z => z.hospitalOccupancy > z.hospitalCapacity);

  let report = `=== SITUATION REPORT — DAY ${day} ===
Total Infected: ${stats.totalInfected.toLocaleString()}
Total Recovered: ${stats.totalRecovered.toLocaleString()}  
Total Deceased: ${stats.totalDeceased.toLocaleString()}
Economy Index: ${stats.economyIndex}/100
Public Morale: ${stats.publicMorale}/100
Hospital Load: ${stats.hospitalLoad}/${stats.hospitalCapacity} (${Math.round(stats.hospitalLoad/stats.hospitalCapacity*100)}%)
Active Zones: ${stats.activeZones}/36
Lockdown Zones: ${stats.lockdownZones}/36

HOTSPOT ZONES:
${hotZones.map(z => `- ${z.name} (Zone ${z.id}): ${z.infected.toLocaleString()} infected, Hospital: ${z.hospitalOccupancy}/${z.hospitalCapacity}, Lockdown: ${['NONE','PARTIAL','FULL'][z.lockdownLevel]}`).join('\n')}

${overwhelmedHospitals.length > 0 ? `⚠️ HOSPITALS OVERWHELMED IN: ${overwhelmedHospitals.map(z => z.name).join(', ')}` : '✅ All hospitals within capacity'}`;

  if (recentDecisions.length > 0) {
    report += `\n\nRECENT DECISIONS:\n${recentDecisions.map(d => `- Day ${d.day}: ${d.summary}`).join('\n')}`;
  }

  return report;
}

// ─── Extract key stats from situation report for mock responses ───
function extractStats(report) {
  const infected = report.match(/Total Infected:\s*([\d,]+)/)?.[1] || '0';
  const deceased = report.match(/Total Deceased:\s*([\d,]+)/)?.[1] || '0';
  const economy = report.match(/Economy Index:\s*([\d.]+)/)?.[1] || '100';
  const hospital = report.match(/Hospital Load:\s*(\d+)\/(\d+)/);
  const hospPct = hospital ? Math.round(parseInt(hospital[1]) / parseInt(hospital[2]) * 100) : 0;
  const hotZones = (report.match(/- (.+?) \(Zone \d+\)/g) || []).map(z => z.replace('- ', '').split(' (')[0]);
  return { infected, deceased, economy, hospPct, hotZones };
}

// ─── Intelligent Mock Responses ───────────────────────────
function getMockResponse(agentId, situationReport, otherAgentInputs, userAdvisory) {
  const s = extractStats(situationReport);
  const advisoryNote = userAdvisory ? `\n\nRegarding the advisory "${userAdvisory}" — ` : '';

  const mocks = {
    health: () => {
      const urgency = parseInt(s.infected.replace(/,/g, '')) > 2000 ? 'CRITICAL' : parseInt(s.infected.replace(/,/g, '')) > 500 ? 'HIGH' : 'MODERATE';
      return `Situation urgency: ${urgency}. With ${s.infected} active infections and hospitals at ${s.hospPct}% capacity, I recommend ${urgency === 'CRITICAL' ? 'immediate full lockdown of all hotspot zones' : 'targeted containment measures'} in ${s.hotZones.slice(0, 3).join(', ') || 'the affected zones'}. ${s.hospPct > 80 ? 'Hospital capacity is CRITICAL — we need emergency field hospitals NOW.' : 'Hospital capacity is manageable but we must act before it deteriorates.'} Every hour of delay costs lives — we cannot afford to prioritize economics over human survival.${advisoryNote}${userAdvisory ? 'this must be evaluated strictly through a public health lens before implementation.' : ''}`;
    },
    economy: () => {
      const econStatus = parseFloat(s.economy) < 70 ? 'alarming' : parseFloat(s.economy) < 90 ? 'concerning' : 'stable';
      return `The economy is ${econStatus} at ${s.economy}/100. ${otherAgentInputs.includes('full lockdown') ? `A full lockdown will devastate businesses — I propose targeted quarantine zones instead, keeping essential corridors open.` : `I support proportional measures but blanket lockdowns are economically catastrophic.`} The cost of each day of full lockdown is approximately ₹2.3Cr in lost economic activity across affected zones. We should implement smart containment: close non-essential businesses in hotspots but maintain supply chains and essential services.${advisoryNote}${userAdvisory ? 'we need to model the economic impact of this suggestion before committing.' : ''}`;
    },
    safety: () => {
      return `Ground reality assessment: ${parseInt(s.infected.replace(/,/g, '')) > 1000 ? 'Public anxiety is rising rapidly.' : 'Situation is tense but manageable.'} ${otherAgentInputs.includes('lockdown') ? 'Enforcing lockdown requires deployment of personnel at all zone boundaries — we need 48 hours notice minimum. Sudden lockdowns trigger panic buying and migration.' : 'Current measures are enforceable with existing personnel.'} I recommend clear public communication BEFORE any action — citizens cooperate when informed, resist when surprised. Vulnerable populations (daily wage workers, elderly living alone, migrants) need separate support protocols.${advisoryNote}${userAdvisory ? 'feasibility depends on public sentiment and enforcement resources available.' : ''}`;
    },
    coordinator: () => {
      const action = parseInt(s.infected.replace(/,/g, '')) > 2000
        ? 'Full lockdown of Zones 2, 3 + emergency hospital expansion'
        : parseInt(s.infected.replace(/,/g, '')) > 500
        ? 'Partial lockdown of hotspot zones + accelerated vaccination drive'
        : 'Enhanced monitoring with targeted testing in affected zones';
      return `**DECISION:** ${action}

**Reasoning Chain:**
1. Health (weight: ${s.hospPct > 60 ? '0.45' : '0.35'}) — ${s.infected} active cases with ${s.hospPct}% hospital load ${s.hospPct > 80 ? 'demands immediate containment' : 'requires proactive intervention'}
2. Economy (weight: ${parseFloat(s.economy) < 80 ? '0.30' : '0.25'}) — Economy at ${s.economy}/100, ${parseFloat(s.economy) < 80 ? 'further decline unacceptable' : 'can absorb targeted measures'}
3. Safety (weight: 0.20) — Enforcement feasible with 48hr preparation window, public communication essential
4. ${userAdvisory ? `Advisory (weight: 0.15) — "${userAdvisory}" incorporated into decision framework` : 'No external advisory received'}

**Trade-offs Accepted:**
- Gaining: Reduced transmission rate, protected hospital capacity, contained spread
- Sacrificing: Partial economic disruption in affected zones, restricted movement

**Confidence:** ${parseInt(s.infected.replace(/,/g, '')) > 2000 ? '89' : '76'}%

**Expected Outcome:** Infection growth rate should decrease by 40-60% within 5 days. Economy will dip 3-5 points but stabilize once containment shows results.`;
    },
  };

  return mocks[agentId]();
}

// ─── Build User Prompt ────────────────────────────────────
function buildAgentPrompt(agent, situationReport, otherAgentInputs, userAdvisory) {
  let prompt = `CURRENT SITUATION:\n${situationReport}`;

  if (otherAgentInputs) {
    prompt += `\n\nOTHER AGENTS' POSITIONS:\n${otherAgentInputs}`;
  }

  if (userAdvisory) {
    prompt += `\n\n🗣️ CITIZEN/EXTERNAL ADVISORY: "${userAdvisory}"\nYou must acknowledge and respond to this advisory in your analysis.`;
  }

  prompt += `\n\nGiven the above situation, what is your recommendation? Remember your role: ${agent.role}. Your priority: ${agent.priority}.`;
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
        onStream  // streams partial text for typewriter effect
      );
      return response;
    } catch (err) {
      console.warn(`[Agent ${agentId}] Gemini failed, using mock:`, err.message);
    }
  }

  // ── Fallback: intelligent mock responses ──
  const mockText = getMockResponse(agentId, situationReport, otherAgentInputs, userAdvisory);

  // Simulate streaming for mock responses (typewriter effect)
  if (onStream) {
    const words = mockText.split(' ');
    let accumulated = '';
    for (let i = 0; i < words.length; i++) {
      accumulated += (i > 0 ? ' ' : '') + words[i];
      onStream(accumulated);
      await new Promise(r => setTimeout(r, 30 + Math.random() * 40));
    }
  } else {
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
  }

  return mockText;
}

// ─── Run Full Agent Debate ────────────────────────────────
export async function runAgentDebate(stats, zones, day, recentDecisions = [], userAdvisory = '', onAgentSpeak = null) {
  const situationReport = buildSituationReport(stats, zones, day, recentDecisions);

  // Helper: creates a streaming callback for a specific agent
  const makeStreamCb = (agentId) => {
    if (!onAgentSpeak) return null;
    return (partialText) => onAgentSpeak(agentId, partialText);
  };

  // Step 1: Health Director speaks first
  if (onAgentSpeak) onAgentSpeak('health', 'thinking');
  const healthResponse = await getAgentResponse('health', situationReport, '', userAdvisory, makeStreamCb('health'));

  // Step 2: Economic Advisor responds (seeing Health's position)
  if (onAgentSpeak) onAgentSpeak('economy', 'thinking');
  const economyResponse = await getAgentResponse('economy', situationReport,
    `Health Director says: "${healthResponse}"`, userAdvisory, makeStreamCb('economy'));

  // Step 3: Safety Chief responds (seeing both)
  if (onAgentSpeak) onAgentSpeak('safety', 'thinking');
  const safetyResponse = await getAgentResponse('safety', situationReport,
    `Health Director says: "${healthResponse}"\nEconomic Advisor says: "${economyResponse}"`, userAdvisory, makeStreamCb('safety'));

  // Step 4: Coordinator makes final decision (seeing all three)
  if (onAgentSpeak) onAgentSpeak('coordinator', 'thinking');
  const coordinatorResponse = await getAgentResponse('coordinator', situationReport,
    `Health Director: "${healthResponse}"\nEconomic Advisor: "${economyResponse}"\nPublic Safety: "${safetyResponse}"`,
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

  // Try to extract actionable decisions
  const actions = [];

  if (text.includes('full lockdown') || text.includes('complete lockdown')) {
    // Find mentioned zone numbers
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

  if (text.includes('military') || text.includes('army') || text.includes('deploy forces')) {
    const zoneMatches = coordinatorResponse.match(/zone\s*(\d+)/gi) || [];
    const zoneIds = zoneMatches.map(m => parseInt(m.replace(/zone\s*/i, '')));
    actions.push({ action: 'deploy_military', targetZones: zoneIds.length > 0 ? zoneIds : [2, 3], summary: `Military deployed to Zones ${(zoneIds.length > 0 ? zoneIds : [2, 3]).join(', ')}` });
  }

  if (text.includes('vaccin')) {
    const zoneMatches = coordinatorResponse.match(/zone\s*(\d+)/gi) || [];
    const zoneIds = zoneMatches.map(m => parseInt(m.replace(/zone\s*/i, '')));
    actions.push({ action: 'vaccinate', targetZones: zoneIds.length > 0 ? zoneIds : [0, 1, 2], summary: `Vaccination drive in Zones ${(zoneIds.length > 0 ? zoneIds : [0, 1, 2]).join(', ')}` });
  }

  if (text.includes('expand hospital') || text.includes('increase capacity') || text.includes('field hospital')) {
    actions.push({ action: 'expand_hospital', targetZones: [7, 15, 28], summary: 'Hospital capacity expanded' });
  }

  return actions;
}
