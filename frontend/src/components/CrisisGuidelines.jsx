import { ShieldAlert, Wind, Flame, CloudRain, Sun, Activity, Mountain, Waves, FlaskConical, Bug } from 'lucide-react';
import { motion } from 'framer-motion';

const base = import.meta.env.BASE_URL || '/';

const guidelines = [
  {
    id: 'cyclone',
    title: 'Cyclone',
    icon: <Wind size={16} className="text-blue-400" />,
    image: 'images/guidelines/cyclone.png',
    dos: [
      "Check the house; secure loose tiles and carry out repairs of doors and windows.",
      "Keep some wooden boards ready so that glass windows can be boarded if needed.",
      "Keep a hurricane lantern filled with kerosene, battery operated torches and enough dry cells."
    ],
    donts: [
      "DO NOT venture out even when the winds appear to calm down."
    ]
  },
  {
    id: 'forest_fire',
    title: 'Forest Fire',
    icon: <Flame size={16} className="text-orange-500" />,
    image: 'images/guidelines/forest_fire.png',
    dos: [
      "Keep emergency contact numbers of district fire service department and local forest authorities handy.",
      "Immediately inform them in case of an unattended or out-of-control fire."
    ],
    donts: [
      "Do not burn stubble, municipal waste, etc. next to a forest area.",
      "Do not burn dry waste in farms close to forest areas."
    ]
  },
  {
    id: 'floods',
    title: 'Rainy Season (Floods)',
    icon: <CloudRain size={16} className="text-blue-500" />,
    image: 'images/guidelines/floods.png',
    dos: [
      "Listen to radio, watch TV, read newspapers for weather updates.",
      "Stay away from electric poles and fallen power lines to avoid electrocution."
    ],
    donts: [
      "Do not allow children to play in or near flood waters.",
      "Don't use any damaged electrical goods, get them checked."
    ]
  },
  {
    id: 'heat_wave',
    title: 'Summer (Heat Wave)',
    icon: <Sun size={16} className="text-yellow-500" />,
    image: 'images/guidelines/heat_wave.png',
    dos: [
      "Wear lightweight, light-coloured, loose, cotton clothes.",
      "Get trained in first aid.",
      "Stay hydrated and use ORS or homemade drinks like lassi or lemon water."
    ],
    donts: [
      "Avoid going out in the sun, especially between 12.00 noon and 3.00 p.m.",
      "Avoid strenuous activities when outside in the afternoon."
    ]
  },
  {
    id: 'earthquake',
    title: 'Earthquake',
    icon: <Activity size={16} className="text-red-400" />,
    image: 'images/guidelines/earthquake.png',
    dos: [
      "Consult a structural engineer to make your house resilient. Fasten shelves securely.",
      "During a quake: Drop, Cover, and Hold.",
      "After a quake, expect aftershocks and use a battery-operated radio for updates."
    ],
    donts: [
      "Do not run outside if indoors. Stay where you are.",
      "Do not use elevators or light open flames."
    ]
  },
  {
    id: 'landslide',
    title: 'Landslide',
    icon: <Mountain size={16} className="text-stone-500" />,
    image: 'images/guidelines/landslide.png',
    dos: [
      "Grow trees to bind soil. Keep drains clean.",
      "Watch for warning signs like muddy river water or new cracks in rocks.",
      "If you hear trees cracking or boulders knocking, move away from the path immediately."
    ],
    donts: [
      "Do not construct buildings near steep slopes or drainage paths."
    ]
  },
  {
    id: 'tsunami',
    title: 'Tsunami',
    icon: <Waves size={16} className="text-blue-600" />,
    image: 'images/guidelines/tsunami.png',
    dos: [
      "Know your evacuation routes to high ground.",
      "If you see sea water receding rapidly, immediately move to higher ground.",
      "If you feel a strong earthquake lasting more than 20 seconds, Drop, Cover, Hold, then evacuate."
    ],
    donts: [
      "Do not wait for official warnings if you feel a strong quake."
    ]
  },
  {
    id: 'chemical',
    title: 'Chemical Disaster',
    icon: <FlaskConical size={16} className="text-green-500" />,
    image: 'images/guidelines/chemical.png',
    dos: [
      "Evacuate perpendicular to the wind direction.",
      "Cover your face with a wet mask.",
      "Change clothes and shower thoroughly as soon as you reach a safe area."
    ],
    donts: [
      "Do not consume exposed food or water."
    ]
  },
  {
    id: 'biological',
    title: 'Biological Disaster',
    icon: <Bug size={16} className="text-purple-500" />,
    image: 'images/guidelines/biological.png',
    dos: [
      "Follow official health authority updates.",
      "Practice strict hygiene and social distancing.",
      "Boil or chlorinate drinking water.",
      "Immediately report unusual illnesses to local authorities."
    ],
    donts: [
      "Do not touch or go near dead animals.",
      "Do not spread rumors."
    ]
  }
];

export default function CrisisGuidelines() {
  return (
    <div className="max-w-5xl mx-auto p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 border-b pb-4" style={{ borderColor: 'var(--t-border)' }}>
        <div className="flex items-center gap-3">
          <ShieldAlert size={20} className="text-orange-500" />
          <h2 className="text-lg font-black uppercase tracking-widest" style={{ color: 'var(--t-text)' }}>NDMA Crisis Guidelines</h2>
        </div>
        <div className="text-[10px] font-mono font-black uppercase tracking-[0.2em] px-3 py-1 bg-white/5 rounded-full border border-white/10" style={{ color: 'var(--t-muted)' }}>
          Standard Operating Procedures
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-y pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
          {guidelines.map((g, idx) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="border rounded-xl overflow-hidden flex flex-col bg-panel transition-all hover:border-accent group"
              style={{ borderColor: 'var(--t-border)', background: 'var(--t-panel)' }}
            >
              <div className="h-48 overflow-hidden relative border-b" style={{ borderColor: 'var(--t-border)' }}>
                <img 
                  src={`${base}${g.image}`} 
                  alt={g.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10">
                    {g.icon}
                  </div>
                  <h3 className="text-white font-black uppercase tracking-wider text-sm drop-shadow-md">{g.title}</h3>
                </div>
              </div>
              
              <div className="p-5 flex-1 grid grid-cols-2 gap-4">
                {/* DO's */}
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 text-green-500 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-green-500" /> Do's
                  </div>
                  <ul className="text-xs font-mono font-medium leading-relaxed space-y-1.5 list-none m-0 p-0" style={{ color: 'var(--t-text2)' }}>
                    {g.dos.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1 opacity-70">▹</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* DONT's */}
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 text-red-500 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-500" /> Don'ts
                  </div>
                  <ul className="text-xs font-mono font-medium leading-relaxed space-y-1.5 list-none m-0 p-0" style={{ color: 'var(--t-text2)' }}>
                    {g.donts.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-500 mt-1 opacity-70">▹</span>
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
