/**
 * SimulCrisis — Disease Spread Simulation Engine
 * ================================================
 * SIR model (Susceptible → Infected → Recovered) on a city grid.
 * Each zone has population, hospital capacity, economic value.
 */

// ─── City Zone Generator ─────────────────────────────────
export function createCity(gridSize = 6) {
  const zones = [];
  const zoneNames = [
    'Central', 'Tech', 'Old Town', 'Market',
    'Suburb N', 'Industry', 'Univ', 'Hospital',
    'Harbor', 'Biz Hub', 'East Res', 'Green',
    'Transit', 'Suburb S', 'Mall', 'Heritage',
    'IT Park', 'Lake', 'Defense', 'New Ext',
    'Railway', 'Airport', 'Sports', 'Culture',
    'Food St', 'Garden', 'Electro', 'Auto',
    'Pharma', 'Edu', 'Media', 'Finance',
    'Logist', 'Textile', 'Agri', 'Smart'
  ];

  for (let i = 0; i < gridSize * gridSize; i++) {
    const isHospitalZone = i === 7 || i === 15 || i === 28;
    const isBusiness = i === 1 || i === 9 || i === 31;
    const isDense = i === 2 || i === 3 || i === 10;

    zones.push({
      id: i,
      name: zoneNames[i] || `Zone ${i + 1}`,
      row: Math.floor(i / gridSize),
      col: i % gridSize,
      population: isDense ? 50000 : (15000 + Math.floor(Math.random() * 35000)),
      susceptible: 0,   // set during init
      infected: 0,
      recovered: 0,
      deceased: 0,
      hospitalCapacity: isHospitalZone ? 500 : (50 + Math.floor(Math.random() * 150)),
      hospitalOccupancy: 0,
      economicValue: isBusiness ? 100 : (20 + Math.floor(Math.random() * 60)),
      lockdownLevel: 0,   // 0=none, 1=partial, 2=full
      militaryDeployed: false,
      vaccinationRate: 0,
    });
  }

  // Initialize susceptible = population
  zones.forEach(z => { z.susceptible = z.population; });

  return zones;
}

// ─── Initial Outbreak ─────────────────────────────────────
export function seedOutbreak(zones, zoneId = 2, initialInfected = 150) {
  const zone = zones[zoneId];
  zone.infected = initialInfected;
  zone.susceptible -= initialInfected;
  return zones;
}

// ─── Simulation State ─────────────────────────────────────
export function createSimState() {
  const zones = createCity(6);
  seedOutbreak(zones, 2, 150);

  return {
    zones,
    day: 0,
    totalPopulation: zones.reduce((s, z) => s + z.population, 0),
    baseR0: 2.5,
    mortalityRate: 0.02,
    recoveryDays: 14,
    economyIndex: 100,
    publicMorale: 100,
    decisions: [],
    events: [],
    paused: false,
    speed: 1,
  };
}

// ─── Compute Effective R0 for a Zone ──────────────────────
function effectiveR0(zone, baseR0) {
  let r = baseR0;

  // Lockdown reduces transmission
  if (zone.lockdownLevel === 1) r *= 0.6;
  if (zone.lockdownLevel === 2) r *= 0.25;

  // Military deployment helps contain
  if (zone.militaryDeployed) r *= 0.7;

  // Vaccination reduces susceptible pool (indirect R0 effect)
  r *= (1 - zone.vaccinationRate * 0.8);

  // Dense zones spread faster
  if (zone.population > 40000) r *= 1.2;

  return Math.max(r, 0.1);
}

// ─── Advance One Day ──────────────────────────────────────
export function advanceDay(state) {
  const { zones, baseR0, mortalityRate } = state;
  const newState = { ...state, day: state.day + 1 };
  const newZones = zones.map(z => ({ ...z }));

  // ── Per-zone SIR update ──
  newZones.forEach(zone => {
    if (zone.population === 0) return;

    const r0 = effectiveR0(zone, baseR0);
    const infectionRate = r0 / 14; // infections per day per infected
    const recoveryRate = 1 / 14;

    // New infections
    const susceptibleRatio = zone.susceptible / zone.population;
    const newInfections = Math.min(
      Math.floor(zone.infected * infectionRate * susceptibleRatio),
      zone.susceptible
    );

    // Recoveries
    const newRecoveries = Math.floor(zone.infected * recoveryRate);

    // Deaths (higher if hospitals overwhelmed)
    const hospitalOverflow = zone.hospitalOccupancy > zone.hospitalCapacity ? 1.5 : 1;
    const newDeaths = Math.floor(zone.infected * mortalityRate * recoveryRate * hospitalOverflow);

    // Update
    zone.susceptible -= newInfections;
    zone.infected += newInfections - newRecoveries - newDeaths;
    zone.recovered += newRecoveries;
    zone.deceased += newDeaths;
    zone.hospitalOccupancy = Math.floor(zone.infected * 0.15); // 15% need hospitalization

    // Clamp
    zone.infected = Math.max(zone.infected, 0);
    zone.susceptible = Math.max(zone.susceptible, 0);
  });

  // ── Cross-zone spread (adjacent zones) ──
  const gridSize = 6;
  newZones.forEach(zone => {
    if (zone.infected < 10) return;
    if (zone.lockdownLevel === 2) return; // full lockdown blocks spread

    const neighbors = getNeighbors(zone.id, gridSize, newZones.length);
    neighbors.forEach(nId => {
      const neighbor = newZones[nId];
      if (neighbor.lockdownLevel === 2) return;

      const spillover = Math.floor(zone.infected * 0.02 * (1 - zone.lockdownLevel * 0.3));
      const actualSpill = Math.min(spillover, neighbor.susceptible);
      neighbor.infected += actualSpill;
      neighbor.susceptible -= actualSpill;
    });
  });

  // ── Economy impact (infections + lockdowns + hospital crisis) ──
  const totalInfected = newZones.reduce((s, z) => s + z.infected, 0);
  const totalPop = newZones.reduce((s, z) => s + z.population, 0);
  let economyDrop = 0;
  // Lockdown economic damage
  newZones.forEach(z => {
    if (z.lockdownLevel === 1) economyDrop += 0.15;  // partial lockdown per zone
    if (z.lockdownLevel === 2) economyDrop += 0.35;  // full lockdown per zone
  });
  // Infection-driven workforce loss (people can't work when sick)
  const infectionPenalty = (totalInfected / totalPop) * 15;
  // Hospital overflow panic
  const overwhelmed = newZones.filter(z => z.hospitalCapacity > 0 && z.hospitalOccupancy > z.hospitalCapacity).length;
  const overflowPenalty = overwhelmed * 0.5;

  newState.economyIndex = Math.max(0, Math.min(100,
    state.economyIndex - economyDrop - infectionPenalty - overflowPenalty
    + 0.1  // tiny natural recovery
  ));

  // ── Public morale (cumulative pressure, slow recovery) ──
  const totalDeaths = newZones.reduce((s, z) => s + z.deceased, 0);
  const lockdownZones = newZones.filter(z => z.lockdownLevel > 0).length;
  const deathShock = totalDeaths > 100 ? 0.3 : totalDeaths > 50 ? 0.15 : 0.05;
  const lockdownFatigue = lockdownZones * 0.2;
  const infectionFear = (totalInfected / totalPop) * 8;
  const naturalRecovery = lockdownZones === 0 && totalInfected < 500 ? 0.2 : 0;

  newState.publicMorale = Math.max(0, Math.min(100,
    state.publicMorale - deathShock - lockdownFatigue - infectionFear + naturalRecovery
  ));

  newState.zones = newZones;
  return newState;
}

// ─── Get Adjacent Zone IDs ────────────────────────────────
function getNeighbors(id, gridSize, total) {
  const row = Math.floor(id / gridSize);
  const col = id % gridSize;
  const neighbors = [];

  if (row > 0) neighbors.push(id - gridSize);           // up
  if (row < gridSize - 1) neighbors.push(id + gridSize); // down
  if (col > 0) neighbors.push(id - 1);                   // left
  if (col < gridSize - 1) neighbors.push(id + 1);        // right

  return neighbors.filter(n => n >= 0 && n < total);
}

// ─── Apply Decision to Simulation ─────────────────────────
export function applyDecision(state, decision) {
  const newZones = state.zones.map(z => ({ ...z }));

  if (decision.action === 'lockdown') {
    decision.targetZones.forEach(zId => {
      if (newZones[zId]) newZones[zId].lockdownLevel = decision.level || 2;
    });
  }

  if (decision.action === 'partial_lockdown') {
    decision.targetZones.forEach(zId => {
      if (newZones[zId]) newZones[zId].lockdownLevel = 1;
    });
  }

  if (decision.action === 'lift_lockdown') {
    decision.targetZones.forEach(zId => {
      if (newZones[zId]) newZones[zId].lockdownLevel = 0;
    });
  }

  if (decision.action === 'deploy_military') {
    decision.targetZones.forEach(zId => {
      if (newZones[zId]) newZones[zId].militaryDeployed = true;
    });
  }

  if (decision.action === 'vaccinate') {
    decision.targetZones.forEach(zId => {
      if (newZones[zId]) {
        newZones[zId].vaccinationRate = Math.min(1, newZones[zId].vaccinationRate + 0.1);
      }
    });
  }

  if (decision.action === 'expand_hospital') {
    decision.targetZones.forEach(zId => {
      if (newZones[zId]) newZones[zId].hospitalCapacity += 200;
    });
  }

  return {
    ...state,
    zones: newZones,
    decisions: [...state.decisions, { ...decision, day: state.day }],
  };
}

// ─── Get Summary Stats ────────────────────────────────────
export function getStats(state) {
  const { zones } = state;
  return {
    totalInfected: zones.reduce((s, z) => s + z.infected, 0),
    totalRecovered: zones.reduce((s, z) => s + z.recovered, 0),
    totalDeceased: zones.reduce((s, z) => s + z.deceased, 0),
    totalSusceptible: zones.reduce((s, z) => s + z.susceptible, 0),
    hospitalLoad: zones.reduce((s, z) => s + z.hospitalOccupancy, 0),
    hospitalCapacity: zones.reduce((s, z) => s + z.hospitalCapacity, 0),
    activeZones: zones.filter(z => z.infected > 0).length,
    lockdownZones: zones.filter(z => z.lockdownLevel > 0).length,
    economyIndex: Math.round(state.economyIndex * 10) / 10,
    publicMorale: Math.round(state.publicMorale * 10) / 10,
    day: state.day,
  };
}

// ─── Preset Crisis Events ─────────────────────────────────
export const CRISIS_EVENTS = [
  {
    id: 'mutation',
    name: '⚠️ Virus Mutation',
    description: 'A new variant emerges — R0 increases by 40%',
    apply: (state) => ({ ...state, baseR0: state.baseR0 * 1.4 }),
  },
  {
    id: 'hospital_fire',
    name: '🔥 Hospital Fire in Zone 7',
    description: 'Hospital District loses 60% capacity',
    apply: (state) => {
      const zones = state.zones.map(z => ({ ...z }));
      zones[7].hospitalCapacity = Math.floor(zones[7].hospitalCapacity * 0.4);
      return { ...state, zones };
    },
  },
  {
    id: 'supply_shortage',
    name: '📦 Medical Supply Shortage',
    description: 'Mortality rate increases by 50% for 5 days',
    apply: (state) => ({ ...state, mortalityRate: state.mortalityRate * 1.5 }),
  },
  {
    id: 'mass_gathering',
    name: '🎉 Unauthorized Mass Gathering in Zone 3',
    description: '5000 new infections seeded in Market District',
    apply: (state) => {
      const zones = state.zones.map(z => ({ ...z }));
      const spike = Math.min(5000, zones[3].susceptible);
      zones[3].infected += spike;
      zones[3].susceptible -= spike;
      return { ...state, zones };
    },
  },
  {
    id: 'vaccine_arrival',
    name: '💉 Emergency Vaccine Shipment',
    description: 'Vaccine available — can now deploy vaccination drives',
    apply: (state) => state,
  },
  {
    id: 'power_outage',
    name: '⚡ Power Grid Failure in Zones 5-8',
    description: 'Hospital ventilators offline — mortality spikes 80%',
    apply: (state) => {
      const zones = state.zones.map(z => ({ ...z }));
      [5, 6, 7, 8].forEach(i => { if (zones[i]) zones[i].hospitalCapacity = Math.floor(zones[i].hospitalCapacity * 0.3); });
      return { ...state, zones, mortalityRate: state.mortalityRate * 1.8 };
    },
  },
  {
    id: 'misinformation',
    name: '📱 Anti-Vaccine Misinformation Wave',
    description: 'Public morale crashes, vaccine compliance drops 60%',
    apply: (state) => ({ ...state, publicMorale: Math.max(10, state.publicMorale - 30) }),
  },
  {
    id: 'border_breach',
    name: '🚧 Border Checkpoint Breach',
    description: '3000 unscreened migrants enter Zones 0-2',
    apply: (state) => {
      const zones = state.zones.map(z => ({ ...z }));
      [0, 1, 2].forEach(i => {
        const spike = Math.min(1000, zones[i].susceptible);
        zones[i].infected += spike;
        zones[i].susceptible -= spike;
      });
      return { ...state, zones };
    },
  },
  {
    id: 'healthcare_strike',
    name: '🏥 Healthcare Worker Strike',
    description: 'Hospital efficiency drops 50% across all zones',
    apply: (state) => {
      const zones = state.zones.map(z => ({ ...z, hospitalCapacity: Math.floor(z.hospitalCapacity * 0.5) }));
      return { ...state, zones, publicMorale: Math.max(10, state.publicMorale - 15) };
    },
  },
  {
    id: 'water_contamination',
    name: '🚰 Water Contamination in Zone 10',
    description: 'Secondary illness outbreak — 2000 new cases in residential area',
    apply: (state) => {
      const zones = state.zones.map(z => ({ ...z }));
      const idx = Math.min(10, zones.length - 1);
      const spike = Math.min(2000, zones[idx].susceptible);
      zones[idx].infected += spike;
      zones[idx].susceptible -= spike;
      return { ...state, zones };
    },
  },
];
