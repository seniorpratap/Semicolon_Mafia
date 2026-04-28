import { ShieldAlert, Bug, Flame, Package, Users, Syringe, Zap, Smartphone, ShieldOff, Stethoscope, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';

const base = import.meta.env.BASE_URL || '/';

const guidelines = [
  {
    id: 'mutation',
    title: 'Virus Mutation',
    icon: <Bug size={16} className="text-red-500" />,
    image: 'images/guidelines/biological.png',
    description: 'A new variant emerges — R0 increases by 40%, existing immunity may be compromised.',
    dos: [
      "Immediately increase genomic sequencing to identify the new variant's characteristics.",
      "Reinstate or tighten mask mandates and social distancing in all hotspot zones.",
      "Isolate confirmed cases of the new variant and trace all contacts within 48 hours.",
      "Accelerate booster vaccination drives — prioritize healthcare workers and high-risk populations.",
      "Update public health messaging with clear, non-alarmist information about the mutation."
    ],
    donts: [
      "Do not assume existing vaccines are completely ineffective — wait for lab data.",
      "Do not delay action waiting for full genomic analysis — treat as high-threat immediately.",
      "Do not allow mass gatherings until variant transmissibility is understood."
    ]
  },
  {
    id: 'hospital_fire',
    title: 'Hospital Fire',
    icon: <Flame size={16} className="text-orange-500" />,
    image: 'images/guidelines/forest_fire.png',
    description: 'Hospital District loses 60% capacity — critical care patients need immediate relocation.',
    dos: [
      "Activate emergency patient evacuation protocols — triage by severity.",
      "Redirect incoming patients to nearest operational hospitals and field clinics.",
      "Deploy fire and rescue services immediately; secure medical equipment and drug stores.",
      "Set up temporary triage centers in nearby schools or government buildings.",
      "Request mutual aid from neighboring districts for ambulances and medical staff."
    ],
    donts: [
      "Do not send non-critical patients to the affected hospital zone.",
      "Do not allow unauthorized personnel into the evacuation zone.",
      "Do not delay evacuation of ICU patients — every minute counts."
    ]
  },
  {
    id: 'supply_shortage',
    title: 'Medical Supply Shortage',
    icon: <Package size={16} className="text-amber-500" />,
    image: 'images/guidelines/chemical.png',
    description: 'Critical supplies depleted — mortality rate increases by 50%.',
    dos: [
      "Activate emergency procurement channels — contact central and state medical reserves.",
      "Implement strict rationing of remaining PPE, ventilators, and medications.",
      "Prioritize supply allocation to zones with highest infection-to-capacity ratios.",
      "Coordinate with military logistics for emergency airlifts of critical supplies.",
      "Identify and fast-track local manufacturing of essential supplies (masks, sanitizers, oxygen)."
    ],
    donts: [
      "Do not hoard supplies at administrative centers — distribute to frontline hospitals.",
      "Do not use expired medications unless explicitly authorized by health authorities.",
      "Do not allow black-market supply chains to operate unchecked."
    ]
  },
  {
    id: 'mass_gathering',
    title: 'Mass Gathering Outbreak',
    icon: <Users size={16} className="text-pink-500" />,
    image: 'images/guidelines/earthquake.png',
    description: 'Unauthorized mass gathering seeds 5000 infections in a single zone.',
    dos: [
      "Immediately impose containment perimeter around the gathering zone.",
      "Deploy rapid testing teams — test all attendees within 72 hours.",
      "Activate contact tracing for all identified participants.",
      "Set up quarantine facilities for confirmed positive cases.",
      "Issue emergency public advisory with gathering location and time for self-reporting."
    ],
    donts: [
      "Do not use force to disperse — it causes stampede and wider geographic spread.",
      "Do not ignore asymptomatic attendees — they are the primary transmission vector.",
      "Do not delay quarantine waiting for test results — presume positive and isolate."
    ]
  },
  {
    id: 'vaccine_arrival',
    title: 'Emergency Vaccine Shipment',
    icon: <Syringe size={16} className="text-green-500" />,
    image: 'images/guidelines/heat_wave.png',
    description: 'Vaccine supply available — deploy vaccination drives strategically.',
    dos: [
      "Prioritize vaccination in zones with highest infection rates and hospital overflow.",
      "Set up cold-chain logistics — maintain 2-8°C storage at all distribution points.",
      "Deploy mobile vaccination units to densely populated zones for maximum coverage.",
      "Run targeted awareness campaigns to combat vaccine hesitancy in low-uptake areas.",
      "Track vaccination rates per zone in real-time — adjust allocation dynamically."
    ],
    donts: [
      "Do not distribute vaccines equally — prioritize by infection severity and vulnerability.",
      "Do not break cold-chain requirements — spoiled vaccines waste critical supply.",
      "Do not allow walk-in chaos — use appointment systems to prevent super-spreader queues."
    ]
  },
  {
    id: 'power_outage',
    title: 'Power Grid Failure',
    icon: <Zap size={16} className="text-yellow-400" />,
    image: 'images/guidelines/cyclone.png',
    description: 'Hospital ventilators and cold-chain systems go offline — mortality spikes 80%.',
    dos: [
      "Activate backup diesel generators at ALL hospitals in affected zones immediately.",
      "Prioritize power restoration to hospitals, water treatment, and communication towers.",
      "Transfer ventilator-dependent patients to zones with functioning power.",
      "Deploy portable oxygen concentrators as ventilator alternatives.",
      "Coordinate with power utility for estimated restoration timeline — plan accordingly."
    ],
    donts: [
      "Do not operate critical medical equipment on unstable power — use UPS systems.",
      "Do not delay patient transfers hoping for quick power restoration.",
      "Do not allow vaccine cold-chain to break — move supplies to powered facilities."
    ]
  },
  {
    id: 'misinformation',
    title: 'Misinformation Wave',
    icon: <Smartphone size={16} className="text-violet-500" />,
    image: 'images/guidelines/tsunami.png',
    description: 'Anti-vaccine misinformation goes viral — public morale crashes, compliance drops 60%.',
    dos: [
      "Launch immediate counter-messaging campaign with trusted community leaders and doctors.",
      "Deploy health workers door-to-door in low-compliance zones for direct outreach.",
      "Partner with social media platforms to flag and reduce reach of misinformation.",
      "Hold live public Q&A sessions with health officials — address fears transparently.",
      "Publish real-time vaccination safety data showing adverse event rates vs infection risks."
    ],
    donts: [
      "Do not censor aggressively — it fuels conspiracy theories and distrust.",
      "Do not dismiss public concerns — acknowledge fears before presenting evidence.",
      "Do not rely solely on official channels — use influencers and local voices."
    ]
  },
  {
    id: 'border_breach',
    title: 'Border Checkpoint Breach',
    icon: <ShieldOff size={16} className="text-red-400" />,
    image: 'images/guidelines/landslide.png',
    description: '3000 unscreened individuals enter border zones — immediate containment needed.',
    dos: [
      "Deploy rapid response testing teams to all border-adjacent zones (Zones 0-2).",
      "Set up emergency screening checkpoints on all entry roads within 2 hours.",
      "Activate ring quarantine — restrict movement OUT of breached zones to prevent spread.",
      "Register all new entrants and begin 14-day monitoring for symptom development.",
      "Reinforce checkpoint security with additional personnel and screening equipment."
    ],
    donts: [
      "Do not allow unrestricted movement from breached zones into the city interior.",
      "Do not rely on self-reporting — deploy active surveillance teams.",
      "Do not use the breach to justify discriminatory actions against any population group."
    ]
  },
  {
    id: 'healthcare_strike',
    title: 'Healthcare Worker Strike',
    icon: <Stethoscope size={16} className="text-teal-500" />,
    image: 'images/guidelines/floods.png',
    description: 'Hospital efficiency drops 50% — critical care severely impacted.',
    dos: [
      "Open immediate negotiations — address worker safety concerns and PPE demands.",
      "Deploy military medical corps and volunteer doctors to maintain essential services.",
      "Prioritize emergency and ICU services — defer all elective procedures.",
      "Offer hazard pay, insurance guarantees, and mental health support as negotiation terms.",
      "Activate telemedicine for non-critical patients to reduce hospital load."
    ],
    donts: [
      "Do not use punitive measures against striking workers — it worsens morale permanently.",
      "Do not ignore their demands — healthcare workers are your most critical asset.",
      "Do not allow essential services (ICU, emergency) to go completely unstaffed."
    ]
  },
  {
    id: 'water_contamination',
    title: 'Water Contamination',
    icon: <Droplets size={16} className="text-cyan-500" />,
    image: 'images/guidelines/chemical.png',
    description: 'Contaminated water supply causes secondary illness outbreak — 2000 new cases.',
    dos: [
      "Immediately shut down contaminated water supply and issue boil-water advisory.",
      "Deploy emergency water tankers and purification units to affected zones.",
      "Test all water sources in adjacent zones — contamination may have spread.",
      "Set up oral rehydration centers for waterborne illness cases.",
      "Coordinate with water utility for decontamination timeline and safe-to-use notification."
    ],
    donts: [
      "Do not allow residents to consume tap water until officially cleared.",
      "Do not underestimate secondary infections — waterborne diseases spread rapidly.",
      "Do not delay public notification — every hour of exposure increases cases."
    ]
  }
];

export default function CrisisGuidelines() {
  return (
    <div className="max-w-5xl mx-auto p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 border-b pb-4" style={{ borderColor: 'var(--t-border)' }}>
        <div className="flex items-center gap-3">
          <ShieldAlert size={20} className="text-orange-500" />
          <h2 className="text-lg font-black uppercase tracking-widest" style={{ color: 'var(--t-text)' }}>Crisis Management SOPs</h2>
        </div>
        <div className="text-[10px] font-mono font-black uppercase tracking-[0.2em] px-3 py-1 bg-white/5 rounded-full border border-white/10" style={{ color: 'var(--t-muted)' }}>
          Administrative Protocols · {guidelines.length} Scenarios
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-y pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
          {guidelines.map((g, idx) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="border rounded-xl overflow-hidden flex flex-col transition-all group"
              style={{ borderColor: 'var(--t-border)', background: 'var(--t-bg)' }}
            >
              <div className="h-40 overflow-hidden relative border-b" style={{ borderColor: 'var(--t-border)' }}>
                <img 
                  src={`${base}${g.image}`} 
                  alt={g.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10">
                      {g.icon}
                    </div>
                    <h3 className="text-white font-black uppercase tracking-wider text-sm drop-shadow-md">{g.title}</h3>
                  </div>
                  <p className="text-[10px] font-mono text-white/70 leading-tight">{g.description}</p>
                </div>
              </div>
              
              <div className="p-4 flex-1 grid grid-cols-2 gap-3">
                {/* DO's */}
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 text-green-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Command Directives
                  </div>
                  <ul className="text-[11px] font-mono font-medium leading-relaxed space-y-1.5 list-none m-0 p-0" style={{ color: 'var(--t-text)' }}>
                    {g.dos.map((pt, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5 opacity-70 text-[10px]">▹</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* DONT's */}
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 text-red-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Operational Restrictions
                  </div>
                  <ul className="text-[11px] font-mono font-medium leading-relaxed space-y-1.5 list-none m-0 p-0" style={{ color: 'var(--t-text)' }}>
                    {g.donts.map((pt, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-red-500 mt-0.5 opacity-70 text-[10px]">▹</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
