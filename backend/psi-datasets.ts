export type SafetyPillar = 'Prevention' | 'Detection' | 'Suppression';
export type IssFacility = 'CIR' | 'MSG' | 'Cygnus' | 'Lunar CLPS';
export type PersonaRoleId =
  | 'engineer'
  | 'researcher'
  | 'professor'
  | 'grad_student'
  | 'undergrad';

export interface PersonaLens {
  id: PersonaRoleId;
  label: string;
  shortLabel: string;
  badgeCode: string;
  priorityFocus: string;
  description: string;
  defaultWeights: {
    wCrewFlammability: number;
    wHighO2Coverage: number;
    wDetectionSuppression: number;
    wPartialGTransfer: number;
    wDatasetDepth: number;
  };
}

export interface PsiDataset {
  id: string;
  psiId: string;
  title: string;
  shortTitle: string;
  doi: string;
  officialUrl: string;
  secondaryUrl?: string;
  secondaryLabel?: string;
  pillar: SafetyPillar;
  facility: IssFacility;
  facilityDetail: string;
  isCoreAnchor: boolean;
  isLunarBenchmark?: boolean;
  isCombustorStudy?: boolean;
  gravityRegime: string;
  oxygenRange: string;
  pressureRange: string;
  airflowRange: string;
  fuelsTested: string[];
  keyMetrics: string;
  extinctionLimitLOI: string;
  coolFlameObserved: boolean;
  peakTempK: string;
  sampleCount: number;
  actionableSafetyRule: string;
  baseScores: {
    crewFlammability: number;
    highO2Coverage: number;
    detectionSuppression: number;
    partialGTransfer: number;
    datasetDepth: number;
  };
  personaInsights: Record<PersonaRoleId, string>;
}

export const PERSONA_LENSES: PersonaLens[] = [
  {
    id: 'engineer',
    label: 'Aerospace Fire Safety Engineer',
    shortLabel: 'Fire Safety Eng',
    badgeCode: 'ENG-FS',
    priorityFocus: 'Material flammability limits, ≥30% O₂ cabin risk, HVAC shutoff rules & suppression efficacy',
    description:
      'Prioritizes NASA-STD-6001B material screening overrides, lunar ≥30% O₂ cabin atmosphere margins, forced ventilation shutoff protocols, and CO₂/He/water-mist extinction thresholds.',
    defaultWeights: {
      wCrewFlammability: 95,
      wHighO2Coverage: 90,
      wDetectionSuppression: 92,
      wPartialGTransfer: 80,
      wDatasetDepth: 65,
    },
  },
  {
    id: 'researcher',
    label: 'Aerospace Researcher / Data Scientist',
    shortLabel: 'PSI Data Scientist',
    badgeCode: 'RES-DS',
    priorityFocus: 'PSI dataset completeness, cool-flame kinetics & multi-parameter correlations',
    description:
      'Prioritizes high-volume optical telemetry, DSLR soot pyrometry maps, 500–1000 K low-temperature alkane oxidation kinetics, and multi-dimensional regression across O₂, pressure, and slip velocity.',
    defaultWeights: {
      wCrewFlammability: 75,
      wHighO2Coverage: 85,
      wDetectionSuppression: 78,
      wPartialGTransfer: 82,
      wDatasetDepth: 98,
    },
  },
  {
    id: 'professor',
    label: 'Professor / Principal Investigator',
    shortLabel: 'Professor / PI',
    badgeCode: 'PI-ACAD',
    priorityFocus: 'Spherical diffusion physics, E-FIELD body-force scaling & archival DOI citations',
    description:
      'Prioritizes fundamental Peclet/Damköhler scaling laws, chemi-ionization body-force analogs for partial gravity, radiative heat loss mechanisms, and peer-reviewed archival DOIs.',
    defaultWeights: {
      wCrewFlammability: 70,
      wHighO2Coverage: 88,
      wDetectionSuppression: 72,
      wPartialGTransfer: 96,
      wDatasetDepth: 94,
    },
  },
  {
    id: 'grad_student',
    label: 'Graduate Student',
    shortLabel: 'Grad Student',
    badgeCode: 'GRAD-CFD',
    priorityFocus: 'CFD boundary conditions, Damköhler/Lewis number extinction limits & soot pyrometry',
    description:
      'Prioritizes OpenFOAM / FDS validation benchmarks, radiative vs. kinetic quenching boundaries, 2D soot volume fraction inversions, and counterflow strain rates.',
    defaultWeights: {
      wCrewFlammability: 72,
      wHighO2Coverage: 80,
      wDetectionSuppression: 75,
      wPartialGTransfer: 88,
      wDatasetDepth: 95,
    },
  },
  {
    id: 'undergrad',
    label: 'Undergraduate Student',
    shortLabel: 'Undergrad Student',
    badgeCode: 'UGRAD-3P',
    priorityFocus: 'Visual comparisons between 1g buoyant teardrop flames and 0g spherical diffusion flames',
    description:
      'Prioritizes intuitive visual physics across the Three Pillars of Fire Safety (Prevention, Detection, Suppression), illustrating why hot air does not rise in freefall.',
    defaultWeights: {
      wCrewFlammability: 90,
      wHighO2Coverage: 75,
      wDetectionSuppression: 88,
      wPartialGTransfer: 78,
      wDatasetDepth: 70,
    },
  },
];

export const PSI_DATASETS: PsiDataset[] = [
  // ============================================================================
  // A. THE 8 CORE "ANCHOR" DATASETS (Deep Telemetry & Primary SI Ranking)
  // ============================================================================
  {
    id: 'bass-ii-psi-25',
    psiId: 'PSI-25',
    title: 'BASS-II: Burning and Suppression of Solids - II',
    shortTitle: 'BASS-II (PSI-25)',
    doi: '10.60555/4qc4-de67',
    officialUrl: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-25',
    secondaryUrl: 'https://ntrs.nasa.gov/api/citations/20140011099/downloads/20140011099.pdf',
    secondaryLabel: 'BASS Report PDF',
    pillar: 'Prevention',
    facility: 'MSG',
    facilityDetail: 'MSG Flow Duct (7.6×7.6 cm cross-section)',
    isCoreAnchor: true,
    gravityRegime: '0.00g (ISS Orbital Freefall)',
    oxygenRange: '15.0% – 30.0% O₂',
    pressureRange: '8.2 – 14.7 psia (1.0 atm baseline)',
    airflowRange: '0.0 – 5.0 cm/s forced flow (up to 20 cm/s)',
    fuelsTested: ['PMMA spheres (cast acrylic)', 'SIBAL cotton/fiberglass fabric', 'Thin solid cellulose sheets'],
    keyMetrics: 'Limiting Oxygen Concentration (LOC), opposed vs. concurrent flame spread rate, N₂ jet blowoff velocity',
    extinctionLimitLOI: '14.8% O₂ at 1.5 cm/s (vs. 17.2% O₂ in 1g upward test)',
    coolFlameObserved: false,
    peakTempK: '1,420 K',
    sampleCount: 104,
    actionableSafetyRule:
      'Low ventilation (0.5–5 cm/s) allows solids to burn at lower O₂ limits in 0g than in 1g upward tests; thick solids store heat and survive N₂ jets until HVAC flow is cut to 0 cm/s.',
    baseScores: {
      crewFlammability: 98,
      highO2Coverage: 86,
      detectionSuppression: 91,
      partialGTransfer: 84,
      datasetDepth: 94,
    },
    personaInsights: {
      engineer:
        'Mandate immediate cabin HVAC fan trip to 0.0 cm/s prior to discharging N₂/CO₂ around thick acrylic or polymer housings; otherwise stored solid-phase enthalpy re-ignites wake stabilization zones.',
      researcher:
        'Contains 104 radiometric and high-speed video tests mapping non-monotonic opposed-flow spread rates where microgravity LOC drops 2.4% below terrestrial NASA-STD-6001B Test 1 thresholds.',
      professor:
        'Demonstrates transition from radiative quenching at <0.5 cm/s to residence-time blowoff at >15 cm/s, proving that slow ventilation (1–5 cm/s) maximizes Damköhler oxygen transport without convective cooling.',
      grad_student:
        'Ideal benchmark for coupled solid-pyrolysis / Navier-Stokes boundary layers over 2 cm PMMA spheres with bluff-body wake recirculation during nitrogen jet impingement.',
      undergrad:
        'In 0g, a gentle draft from an air vent acts like a bellows—making plastics burn in thinner oxygen than on Earth, and hiding a glowing flame behind thick plastic even when sprayed with nitrogen.',
    },
  },
  {
    id: 'saffire-i-ii-psi-98-99',
    psiId: 'PSI-98 / PSI-99',
    title: 'SAFFIRE-I & SAFFIRE-II: Spacecraft Fire Experiment in Cygnus',
    shortTitle: 'SAFFIRE-I & II (PSI-98/99)',
    doi: '10.60555/saffire-98-99',
    officialUrl: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-98',
    secondaryUrl: 'https://techport.nasa.gov/projects/13543',
    secondaryLabel: 'NASA TechPort 13543',
    pillar: 'Prevention',
    facility: 'Cygnus',
    facilityDetail: 'Cygnus Pressurized Cargo Module (Free-Flyer after ISS Unberth)',
    isCoreAnchor: true,
    gravityRegime: '0.00g (Autonomous LEO Free-Flyer)',
    oxygenRange: '21.0% – 34.0% O₂',
    pressureRange: '8.2 – 14.7 psia',
    airflowRange: '20.0 – 30.0 cm/s avionics duct flow',
    fuelsTested: ['41×50 cm SIBAL (75% cotton / 25% fiberglass)', '0.5–1.0 cm thick ribbed PMMA', 'Nomex HT90-40', 'Silicone composites'],
    keyMetrics: 'Full-scale enclosure flame spread rate, cabin O₂ depletion, CO/CO₂ accumulation, ΔP pressure rise',
    extinctionLimitLOI: 'Quasi-steady ventilation-limited spread; Silicone burned in higher O₂',
    coolFlameObserved: false,
    peakTempK: '1,580 K',
    sampleCount: 10,
    actionableSafetyRule:
      'Full-scale enclosure fires reach ventilation-limited quasi-steady spread rates; tracks O₂ depletion, CO/CO₂ buildup, and cabin pressure rise in habitable vehicle volumes.',
    baseScores: {
      crewFlammability: 99,
      highO2Coverage: 95,
      detectionSuppression: 89,
      partialGTransfer: 88,
      datasetDepth: 92,
    },
    personaInsights: {
      engineer:
        'Validates vehicle-scale pressure rise (+1.8 kPa) and oxygen consumption in a 27 m³ cabin volume; proves that materials passing small-coupon 1g tests can sustain dual-sided flame fronts in 34% O₂ / 8.2 psia exploration atmospheres.',
      researcher:
        'Provides synchronized thermocouple trees, radiometers, and cabin gas analyzers (O₂, CO₂, CO) across 94 cm long SIBAL panels and 9 multi-material strips in SAFFIRE-II.',
      professor:
        'Establishes the physical scaling bridge between centimeter-scale glovebox coupons (MSG) and meter-scale spacecraft cabin thermodynamics where enclosure gas heating alters oxidizer density.',
      grad_student:
        'Critical validation dataset for Fire Dynamics Simulator (FDS) microgravity sub-grid radiation and opposed/concurrent split flame propagation on finite-thickness charring fabrics.',
      undergrad:
        'NASA intentionally lit the largest controlled fires in space inside unmanned Cygnus cargo ships after leaving the ISS, showing how a real cabin fire consumes oxygen and builds toxic smoke.',
    },
  },
  {
    id: 'acme-bre',
    psiId: 'ACME-BRE',
    title: 'ACME BRE: Burning Rate Emulator in CIR',
    shortTitle: 'ACME BRE (CIR)',
    doi: '10.60555/acme-bre-cir',
    officialUrl: 'https://www.nasa.gov/wp-content/uploads/2025/07/advanced-combustion-via-microgravity-experiments-acme.pdf?emrc=640d06',
    secondaryUrl: 'https://ntrs.nasa.gov/citations/20030112139',
    secondaryLabel: 'CIR Hardware Spec',
    pillar: 'Prevention',
    facility: 'CIR',
    facilityDetail: 'CIR 100-L Chamber • Porous Brass Burner (25–50 mm)',
    isCoreAnchor: true,
    gravityRegime: '0.00g (ISS CIR)',
    oxygenRange: '17.0% – 40.0% O₂',
    pressureRange: '7.0 – 14.7 psia',
    airflowRange: '0.0 – 10.0 cm/s quiescent/weak drift',
    fuelsTested: ['Gaseous Methane (CH₄) + N₂', 'Gaseous Ethylene (C₂H₄) emulating PMMA, Delrin (POM) & Polyethylene'],
    keyMetrics: 'Mass burning rate (B-number), surface heat-flux feedback, radiative extinction standoff distance',
    extinctionLimitLOI: 'B-number matched radiative quenching at 17.5% O₂',
    coolFlameObserved: false,
    peakTempK: '1,490 K',
    sampleCount: 218,
    actionableSafetyRule:
      'Emulates steady solid-polymer flammability and extinction limits in CIR using closed-loop heat-flux feedback without consuming solid samples.',
    baseScores: {
      crewFlammability: 92,
      highO2Coverage: 89,
      detectionSuppression: 82,
      partialGTransfer: 83,
      datasetDepth: 90,
    },
    personaInsights: {
      engineer:
        'Enables rapid parametric flammability mapping of spacecraft polymers (PMMA, Delrin, PE) across arbitrary cabin pressures and O₂ concentrations by matching heat of gasification (Lv) via mass-flow control.',
      researcher:
        '218 steady-state porous burner runs decoupling solid melt-layer dripping and char cracking from gas-phase Spalding B-number mass transfer and surface reradiation.',
      professor:
        'Cleanly validates classical Emmons/Spalding stagnant-film combustion theory in 0g, isolating radiative loss fraction as flame diameter expands away from the burner face.',
      grad_student:
        'Provides exact Dirichlet/Neumann burner boundary conditions (fuel mass flux proportional to measured heat-flux sensor voltage) for 1D/2D axisymmetric diffusion flame codes.',
      undergrad:
        'By feeding gas through a metal disk at the exact rate that melting plastic releases vapor, astronauts could test hundreds of "virtual plastic fires" without swapping burnt samples.',
    },
  },
  {
    id: 'same-psi-102-101',
    psiId: 'PSI-102 / PSI-101',
    title: 'SAME & SAME-R: Smoke Aerosol Measurement Experiment',
    shortTitle: 'SAME & SAME-R (PSI-102/101)',
    doi: '10.60555/gd4k-8h62',
    officialUrl: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-102',
    secondaryUrl: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-101',
    secondaryLabel: 'SAME-R (PSI-101)',
    pillar: 'Detection',
    facility: 'MSG',
    facilityDetail: 'MSG Chamber + TEM Thermophoretic Samplers + PAMS',
    isCoreAnchor: true,
    gravityRegime: '0.00g vs. 1.00g Ground Baseline',
    oxygenRange: '21.0% O₂ (ISS Cabin Air)',
    pressureRange: '14.7 psia (101.3 kPa)',
    airflowRange: '1.5 – 12.0 cm/s duct transport',
    fuelsTested: ['Kapton polyimide film', 'Teflon (PTFE) wire insulation', 'Silicone elastomer', 'Cellulose paper', 'Cotton lamp wick'],
    keyMetrics: 'Count Median Diameter (CMD), Geometric Standard Deviation (GSD), fractal aggregate morphology, ionization vs. laser scattering response',
    extinctionLimitLOI: 'Non-flaming oxidative pyrolysis (250°C – 550°C)',
    coolFlameObserved: false,
    peakTempK: '820 K (Pyrolysis Hotwire)',
    sampleCount: 162,
    actionableSafetyRule:
      'Without buoyancy, smoke lingers near hot surfaces and coagulates into larger liquid aerosol droplets with lower number density—requiring multi-angle laser scattering detectors over 1g ionization thresholds.',
    baseScores: {
      crewFlammability: 88,
      highO2Coverage: 78,
      detectionSuppression: 99,
      partialGTransfer: 85,
      datasetDepth: 95,
    },
    personaInsights: {
      engineer:
        'Recalibrate Orion, Gateway, and Lunar Habitat光电/laser smoke detectors for larger particle diameters (0.3–1.2 μm CMD in 0g vs. 0.08–0.2 μm in 1g) and place intake ducts near avionics racks to overcome zero-buoyancy transport lag.',
      researcher:
        'Combines real-time DustTrak/PAMS aerosol sizing with Transmission Electron Microscopy (TEM) grids showing prolonged residence time in the hot vapor condensation zone.',
      professor:
        'Proves that eliminating buoyant plume acceleration increases characteristic aerosol residence time τ_res by >10×, shifting Brownian coagulation into the continuum/slip growth regime.',
      grad_student:
        'Supplies log-normal aerosol size distributions (CMD, Mass Median Diameter, GSD) and fractal dimension parameters for Kapton and Teflon thermal degradation models.',
      undergrad:
        'On Earth, smoke rises quickly to ceiling alarms as tiny particles. In space, smoke hangs in a cloud around overheated wires and clumps into bigger droplets, fooling standard home ionization alarms.',
    },
  },
  {
    id: 'flex-psi-69',
    psiId: 'PSI-69',
    title: 'FLEX: Flame Extinguishment Experiment',
    shortTitle: 'FLEX (PSI-69)',
    doi: '10.60555/mbq8-0451',
    officialUrl: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-69',
    secondaryUrl: 'https://www.nasa.gov/wp-content/uploads/2025/07/flame-extinguishment-experiment-flex.pdf?emrc=f75994',
    secondaryLabel: 'FLEX Fact Sheet PDF',
    pillar: 'Suppression',
    facility: 'CIR',
    facilityDetail: 'CIR • Multi-user Droplet Combustion Apparatus (MDCA)',
    isCoreAnchor: true,
    gravityRegime: '0.00g (ISS CIR / MDCA)',
    oxygenRange: '13.0% – 30.0% O₂ (with CO₂, He, N₂, Xe diluents)',
    pressureRange: '7.3 – 44.1 psia (0.5 – 3.0 atm)',
    airflowRange: '0.0 – 8.0 cm/s translational droplet slip',
    fuelsTested: ['n-Heptane (C₇H₁₆)', 'n-Decane (C₁₀H₂₂)', 'Methanol (CH₃OH)', 'Iso-octane / Toluene mixtures (1.19–3.98 mm droplets)'],
    keyMetrics: 'd²-law burning rate constant (K), Limiting Oxygen Index (LOI), radiative vs. diffusive extinction diameter, two-stage cool-flame transition',
    extinctionLimitLOI: '13.2% O₂ (N₂ diluent) / 16.8% O₂ (CO₂ diluent); transitions to 500–1000 K cool flame',
    coolFlameObserved: true,
    peakTempK: '1,650 K (Hot) → 680 K (Cool Flame)',
    sampleCount: 280,
    actionableSafetyRule:
      'Quantifies Limiting Oxygen Index (LOI) and inert-gas dilution; discovered two-stage burning where radiative extinction of visible flames transitions into invisible 500–1000 K cool flames.',
    baseScores: {
      crewFlammability: 90,
      highO2Coverage: 87,
      detectionSuppression: 98,
      partialGTransfer: 86,
      datasetDepth: 97,
    },
    personaInsights: {
      engineer:
        'After visible flame knockdown with CO₂ or He, maintain cabin purge and monitor mid-IR (3.4 μm formaldehyde/CH stretch) sensors—because extinguished hydrocarbon droplets continue exothermic cool-flame vapor production at 500–1000 K.',
      researcher:
        'Landmark 280-droplet dataset documenting radiative quenching of large droplets followed by quasi-steady negative-temperature-coefficient (NTC) cool-flame burning until sudden vapor-cloud auto-ignition.',
      professor:
        'Resolves the coupled Damköhler-number / radiative-loss S-curve in spherical symmetry, revealing how ozone/ketohydroperoxide branching sustains second-stage low-temperature diffusion flames.',
      grad_student:
        'Benchmark dataset for 1D spherical skeletal chemical mechanisms (n-heptane Curran/LLNL) coupling Planck-mean optically thin H₂O/CO₂ radiation with NTC kinetics.',
      undergrad:
        'FLEX made the shock discovery that when a spherical droplet fire in space appears to go out, it can keep burning invisibly as a "cool flame" at 600 K and suddenly flash back to life.',
    },
  },
  {
    id: 'acme-cfi-g-psi-159',
    psiId: 'PSI-159',
    title: 'ACME CFI-G: Cool Flames Investigation with Gases',
    shortTitle: 'ACME CFI-G (PSI-159)',
    doi: '10.60555/cyt1-kh64',
    officialUrl: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-159',
    secondaryUrl: 'https://www.nasa.gov/missions/station/cool-flames-created-during-a-first-for-international-space-station-research/',
    secondaryLabel: 'NASA ISS Cool Flames Report',
    pillar: 'Suppression',
    facility: 'CIR',
    facilityDetail: 'CIR 100-L Chamber • Spherical Porous Burner ("Inside-Out" Configuration)',
    isCoreAnchor: true,
    gravityRegime: '0.00g (ISS CIR)',
    oxygenRange: '21.0% – 85.0% O₂ (Highest O₂ ever tested in orbit)',
    pressureRange: '7.0 – 14.7 psia',
    airflowRange: '0.0 cm/s (Pure spherical radial diffusion)',
    fuelsTested: ['Propane (C₃H₈)', 'n-Butane (C₄H₁₀)', 'n-Pentane (C₅H₁₂) diluted in N₂'],
    keyMetrics: 'Hot-to-cool transition boundaries, oscillatory re-ignition frequency, UV/intensified-CCD formaldehyde chemiluminescence',
    extinctionLimitLOI: 'Sustained 500–1000 K cool diffusion flames up to 85% O₂; oscillatory hot re-ignition',
    coolFlameObserved: true,
    peakTempK: '650 – 950 K (Quasi-Steady Cool Flame)',
    sampleCount: 195,
    actionableSafetyRule:
      'Highest O₂ concentration ever tested in microgravity (up to 85% O₂); proves gaseous cool diffusion flames (500–1000 K) form without liquid droplets and oscillate back into hot ignition if oxidizer flow increases.',
    baseScores: {
      crewFlammability: 91,
      highO2Coverage: 100,
      detectionSuppression: 95,
      partialGTransfer: 85,
      datasetDepth: 96,
    },
    personaInsights: {
      engineer:
        'Critical for high-O₂ EVA airlocks (up to 85%–100% O₂) and propellant/solvent leak lines: gaseous alkanes can sustain invisible 650 K cool flames that evade optical UV/vis sensors and trigger hot deflagration when O₂ repressurization begins.',
      researcher:
        'First-ever non-premixed gaseous cool flames in microgravity achieved via an "inside-out" configuration (oxidizer injected through porous sphere into fuel-diluted chamber up to 85% O₂).',
      professor:
        'Proves that cool diffusion flames are an intrinsic gas-phase transport-kinetic phenomenon (governed by RO₂ ⇌ QOOH isomerization at long residence times) rather than an artifact of droplet evaporation.',
      grad_student:
        'Provides radial species/temperature profiles and intensified CCD 310 nm / 400 nm chemiluminescence ratios across steady hot, oscillatory, and steady cool branches.',
      undergrad:
        'Scientists pumped up to 85% pure oxygen inside the ISS chamber to create ghostly violet "inside-out" gaseous cool flames—proving even gases can burn invisibly before bursting into hot fire.',
    },
  },
  {
    id: 'acme-e-field-flames',
    psiId: 'ACME-EFIELD',
    title: 'ACME E-FIELD Flames: Electric-Field Effects on Laminar Diffusion Flames',
    shortTitle: 'ACME E-FIELD Flames',
    doi: '10.60555/acme-efield-cir',
    officialUrl: 'https://science.nasa.gov/biological-physical/investigations/e-field-flames/',
    secondaryUrl: 'https://gipoc.grc.nasa.gov/wp/fcf-cir/acme/electric-field-effects-laminar-diffusion-flames-e-field-flames/',
    secondaryLabel: 'Glenn E-FIELD Technical Portal',
    pillar: 'Suppression',
    facility: 'CIR',
    facilityDetail: 'CIR Burner + ±10 kV High-Voltage Electrode Mesh (35–50 mm downstream)',
    isCoreAnchor: true,
    gravityRegime: '0.00g with Electrostatic Partial-G Body-Force Proxy (0.00g → 0.38g equiv)',
    oxygenRange: '18.0% – 35.0% O₂',
    pressureRange: '14.7 psia (1.0 atm)',
    airflowRange: 'Ion-driven wind velocity 0 – 45 cm/s induced by ±10 kV mesh',
    fuelsTested: ['Methane (CH₄)', 'Ethylene (C₂H₄) free-jet & coflow diffusion flames'],
    keyMetrics: 'Ion current (μA), electrostatic body-force scaling, soot volume fraction suppression (>75% reduction), electrostatic blowoff voltage',
    extinctionLimitLOI: 'Electrostatic blowoff at +8.4 kV; complete soot luminosity elimination at +4.5 kV',
    coolFlameObserved: false,
    peakTempK: '1,720 K',
    sampleCount: 310,
    actionableSafetyRule:
      'High-voltage field (±10 kV) accelerates flame chemi-ions (H₃O⁺, CHO⁺) into an "ion-driven wind" that mimics Lunar (0.16g) and Martian (0.38g) buoyancy in orbit and suppresses soot or blows out flames without chemical suppressants.',
    baseScores: {
      crewFlammability: 87,
      highO2Coverage: 84,
      detectionSuppression: 94,
      partialGTransfer: 100,
      datasetDepth: 93,
    },
    personaInsights: {
      engineer:
        'Enables dual utility: (1) zero-consumable electrostatic flame blowoff/soot suppression around high-voltage spacecraft power distribution units, and (2) tunable on-orbit testing of Lunar (0.16g) and Martian (0.38g) convection without parabolic flights.',
      researcher:
        '310 voltage-sweep experiments mapping V-I saturation curves where Coulomb force on chemi-ions in the thin reaction zone transfers momentum to neutral gas molecules.',
      professor:
        'Demonstrates exact dimensionless correspondence between gravitational Grashof number and electrostatic Froude/body-force number via CHO⁺ + H₂O → H₃O⁺ + CO ion-wind coupling.',
      grad_student:
        'Essential dataset for coupling Poisson electric-field equations and ion drift-diffusion with laminar reacting Navier-Stokes to predict soot residence-time truncation.',
      undergrad:
        'Because flames naturally contain electrically charged ions, applying a 10,000-volt mesh pulls the flame like artificial gravity—letting astronauts mimic Moon or Mars flames and even blow fires out with electricity.',
    },
  },
  {
    id: 'spice-psi-60',
    psiId: 'PSI-60',
    title: 'SPICE: Smoke Point In Co-flow Experiment & Soot Pyrometry',
    shortTitle: 'SPICE & PSI-60 Soot Pyrometry',
    doi: '10.60555/psi-60-spice',
    officialUrl: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-60',
    secondaryUrl: 'https://www.nasa.gov/wp-content/uploads/2025/07/smoke-point-in-co-flow-experiment-spice.pdf?emrc=f30479',
    secondaryLabel: 'SPICE Fact Sheet PDF',
    pillar: 'Prevention',
    facility: 'MSG',
    facilityDetail: 'MSG Co-Flow Duct • Nikon DSLR 2D Color Ratio Pyrometry',
    isCoreAnchor: true,
    gravityRegime: '0.00g (ISS MSG)',
    oxygenRange: '21.0% O₂ (Cabin Air Coflow)',
    pressureRange: '14.7 psia (1.0 atm)',
    airflowRange: '2.0 – 30.0 cm/s co-flow air velocity',
    fuelsTested: ['Ethylene (C₂H₄)', 'Propane (C₃H₈)', 'Propylene (C₃H₆)', 'Methane (CH₄)', 'Nitrogen-diluted hydrocarbons'],
    keyMetrics: 'Laminar smoke point fuel flow rate, flame length at soot breakthrough, 2D soot temperature & volume fraction maps',
    extinctionLimitLOI: '>70 laminar smoke point transitions across 250 gas-jet tests',
    coolFlameObserved: false,
    peakTempK: '1,890 K',
    sampleCount: 1600,
    actionableSafetyRule:
      'Maps the laminar smoke point where non-buoyant flames emit soot and radiate heat to ignite adjacent spacecraft components (250 gas-jet tests + 1,600 Nikon DSLR 2D soot pyrometry maps).',
    baseScores: {
      crewFlammability: 89,
      highO2Coverage: 80,
      detectionSuppression: 88,
      partialGTransfer: 84,
      datasetDepth: 99,
    },
    personaInsights: {
      engineer:
        'Defines the critical airflow/fuel threshold where a clean blue microgravity flame transitions into a soot-radiating yellow plume capable of igniting adjacent cable bundles via thermal radiation without direct flame contact.',
      researcher:
        'Features 1,600 calibrated Nikon D300s RAW image inversions yielding 2D spatial fields of soot volume fraction (fv in ppm) and soot temperature (1,300–2,000 K).',
      professor:
        'Proves that removing buoyant strain lengthens soot residence time in the annular oxidation zone, causing microgravity smoke-point fuel flow rates to drop significantly below 1g values.',
      grad_student:
        'Gold-standard validation archive for Abel-transformed 2D soot pyrometry, Moss-Brookes soot inception/oxidation models, and radiative heat-transfer view factors.',
      undergrad:
        'Captures 1,600 high-resolution camera maps showing the exact tipping point ("smoke point") where a small blue space flame starts spewing glowing hot soot that can scorch nearby equipment.',
    },
  },

  // ============================================================================
  // B. REMAINING 16 PSI COMBUSTION DATASETS (Completing the 24-Dataset Catalog)
  // ============================================================================
  {
    id: 'bass-psi-26',
    psiId: 'PSI-26',
    title: 'BASS: Burning and Suppression of Solids (Phase I)',
    shortTitle: 'BASS (PSI-26)',
    doi: '10.60555/psi-26-bass1',
    officialUrl: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-26',
    pillar: 'Prevention',
    facility: 'MSG',
    facilityDetail: 'MSG Flow Duct (Phase I Baseline)',
    isCoreAnchor: false,
    gravityRegime: '0.00g (ISS MSG)',
    oxygenRange: '16.0% – 25.0% O₂',
    pressureRange: '14.7 psia',
    airflowRange: '0.5 – 20.0 cm/s',
    fuelsTested: ['PMMA rods & flat sheets', 'SIBAL fabric', 'Wax candles'],
    keyMetrics: 'Baseline opposed-flow flame spread & nitrogen flow extinction velocity',
    extinctionLimitLOI: '15.5% O₂ at 2.0 cm/s forced flow',
    coolFlameObserved: false,
    peakTempK: '1,390 K',
    sampleCount: 72,
    actionableSafetyRule:
      'Established initial ISS MSG forced-flow solid combustion baselines showing flame stabilization in the wake of cylindrical rods under ultra-low ventilation.',
    baseScores: {
      crewFlammability: 91,
      highO2Coverage: 79,
      detectionSuppression: 85,
      partialGTransfer: 78,
      datasetDepth: 84,
    },
    personaInsights: {
      engineer: 'Confirms wake-flame stabilization behind cylindrical cable bundles under low cabin ventilation.',
      researcher: '72 precursor optical runs preceding the expanded BASS-II parameter matrix.',
      professor: 'Illustrates classical stagnation-point vs. wake-stabilized solid diffusion flame regimes.',
      grad_student: 'Useful geometry baseline for cylindrical PMMA rod regression rates.',
      undergrad: 'The first round of solid-burning tests in the ISS glovebox that paved the way for BASS-II.',
    },
  },
  {
    id: 'bass-m-milliken',
    psiId: 'PSI-BASS-M',
    title: 'BASS-M: Burning and Suppression of Solids - Milliken Textiles',
    shortTitle: 'BASS-M (Milliken 44)',
    doi: '10.60555/bass-m-milliken',
    officialUrl: 'https://gipoc.grc.nasa.gov/wp/msg/bass-m/',
    pillar: 'Prevention',
    facility: 'MSG',
    facilityDetail: 'MSG Flow Duct • Treated Flame-Retardant Cotton Textiles',
    isCoreAnchor: false,
    gravityRegime: '0.00g (ISS MSG)',
    oxygenRange: '18.5% – 30.0% O₂',
    pressureRange: '10.2 – 14.7 psia',
    airflowRange: '1.0 – 15.0 cm/s',
    fuelsTested: ['44 Milliken flame-retardant treated cotton fabrics', 'Untreated cotton control coupons'],
    keyMetrics: 'Char length, after-flame duration, smoldering-to-flaming transition under forced flow',
    extinctionLimitLOI: '21.5% – 28.0% O₂ depending on phosphorus/nitrogen retardant loading',
    coolFlameObserved: false,
    peakTempK: '1,280 K',
    sampleCount: 44,
    actionableSafetyRule:
      'Evaluates 44 flame-retardant crew clothing textiles in microgravity, identifying char-forming treatments that prevent edge-flame spread in elevated cabin oxygen.',
    baseScores: {
      crewFlammability: 95,
      highO2Coverage: 85,
      detectionSuppression: 80,
      partialGTransfer: 79,
      datasetDepth: 81,
    },
    personaInsights: {
      engineer: 'Directly informs astronaut crew quarter fabric and clothing selection for ISS and Artemis habitats.',
      researcher: '44 controlled textile coupons comparing intumescent char barrier formation in 0g vs. 1g.',
      professor: 'Highlights condensed-phase char catalysis vs. gas-phase radical scavenging in microgravity.',
      grad_student: 'Provides pyrolysis kinetic parameters for treated cellulosic fabrics.',
      undergrad: 'Tested 44 fire-resistant fabrics to design safer everyday clothes for astronauts in space.',
    },
  },
  {
    id: 'saffire-iii-psi-100',
    psiId: 'PSI-100',
    title: 'SAFFIRE-III: Large-Scale SIBAL Flow-Sweep Fire Experiment',
    shortTitle: 'SAFFIRE-III (PSI-100)',
    doi: '10.60555/psi-100-saffire3',
    officialUrl: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-100',
    pillar: 'Prevention',
    facility: 'Cygnus',
    facilityDetail: 'Cygnus OA-7 Free-Flyer Enclosure',
    isCoreAnchor: false,
    gravityRegime: '0.00g (Cygnus Free-Flyer)',
    oxygenRange: '20.9% O₂',
    pressureRange: '14.7 psia (1.0 atm)',
    airflowRange: '17.0 – 30.0 cm/s stepped ventilation sweep',
    fuelsTested: ['41×100 cm continuous SIBAL cotton/fiberglass panel'],
    keyMetrics: 'Spread rate sensitivity to stepped airflow velocity changes in full-scale enclosure',
    extinctionLimitLOI: 'Sustained concurrent spread scaling linearly with duct flow velocity',
    coolFlameObserved: false,
    peakTempK: '1,540 K',
    sampleCount: 12,
    actionableSafetyRule:
      'Proves large-scale fabric flame spread rate responds within seconds to stepped cabin ventilation changes in a 0g vehicle enclosure.',
    baseScores: {
      crewFlammability: 96,
      highO2Coverage: 83,
      detectionSuppression: 86,
      partialGTransfer: 84,
      datasetDepth: 88,
    },
    personaInsights: {
      engineer: 'Quantifies the exact rate at which stepping down cabin fan speed slows a full-scale fabric fire.',
      researcher: 'Continuous 1-meter SIBAL burn with multi-step air velocity modulation.',
      professor: 'Validates quasi-steady boundary-layer mass transfer response times in large-scale 0g fires.',
      grad_student: 'Transient CFD benchmark for stepped inflow velocity boundary conditions.',
      undergrad: 'Showed how turning down the air fans inside a spacecraft immediately slows down a large fabric fire.',
    },
  },
  {
    id: 'saffire-vi-high-o2',
    psiId: 'SAFFIRE-VI',
    title: 'SAFFIRE-VI: High-Oxygen Reduced-Pressure Exploration Cabin Fire Test',
    shortTitle: 'Saffire-VI (34% O₂ / 8.2 psia)',
    doi: '10.2514/6.2024-saffire6',
    officialUrl: 'https://ntrs.nasa.gov/citations/20240007488',
    pillar: 'Prevention',
    facility: 'Cygnus',
    facilityDetail: 'Cygnus NG-19 Free-Flyer (Exploration Atmosphere Validation)',
    isCoreAnchor: false,
    gravityRegime: '0.00g (Cygnus Free-Flyer)',
    oxygenRange: '34.0% O₂ (Exploration Atmosphere)',
    pressureRange: '8.2 psia (56.5 kPa)',
    airflowRange: '20.0 cm/s cabin ventilation',
    fuelsTested: ['SIBAL fabric', 'Ribbed & flat PMMA', 'Nomex', 'Silicone', 'Ultem PEI'],
    keyMetrics: 'Flame spread acceleration in 34% O₂ / 8.2 psia vs. 21% O₂ / 14.7 psia, post-burn HCl/HF/CO scrubbers',
    extinctionLimitLOI: 'Rapid vigorous spread at 34% O₂ (>2.3× faster than 21% O₂ baseline)',
    coolFlameObserved: false,
    peakTempK: '1,690 K',
    sampleCount: 18,
    actionableSafetyRule:
      'Demonstrates severe flame spread acceleration in the planned 34% O₂ / 8.2 psia exploration atmosphere (>40% relative O₂ increase over Earth air), requiring active post-fire acid-gas scrubbing.',
    baseScores: {
      crewFlammability: 99,
      highO2Coverage: 99,
      detectionSuppression: 91,
      partialGTransfer: 92,
      datasetDepth: 89,
    },
    personaInsights: {
      engineer: 'Direct full-scale empirical proof that 34% O₂ / 8.2 psia lunar cabin atmospheres drastically narrow material safety margins.',
      researcher: 'Couples high-O₂ multi-material burns with Far-IR / mid-IR toxic combustion product scrubbing telemetry.',
      professor: 'Isolates oxygen mole fraction dominance over total pressure reduction (8.2 psia) in microgravity diffusion flames.',
      grad_student: 'High-O₂ / sub-atmospheric pressure boundary condition suite for exploration habitat fire modeling.',
      undergrad: 'Tested the exact 34% oxygen air mix planned for Moon bases inside a real spacecraft, showing fires burn over twice as fast.',
    },
  },
  {
    id: 'daft-smoke-precursor',
    psiId: 'PSI-DAFT',
    title: 'DAFT: Dust and Aerosol Measurement Feasibility Test',
    shortTitle: 'DAFT (Smoke Precursor)',
    doi: '10.60555/psi-daft-1',
    officialUrl: 'https://www.nasa.gov/physical-sciences-informatics-psi/psi-investigations-by-research-area/',
    pillar: 'Detection',
    facility: 'MSG',
    facilityDetail: 'ISS Cabin & Precursor Aerosol Sampler',
    isCoreAnchor: false,
    gravityRegime: '0.00g (ISS Cabin)',
    oxygenRange: '21.0% O₂',
    pressureRange: '14.7 psia',
    airflowRange: 'Ambient cabin ventilation (5–15 cm/s)',
    fuelsTested: ['Ambient spacecraft dust', 'Calibration monodisperse latex spheres', 'Incipient thermal aerosol'],
    keyMetrics: 'Condensation nuclei count, background cabin dust floor vs. smoke alarm threshold',
    extinctionLimitLOI: 'N/A (Aerosol Detection Calibration)',
    coolFlameObserved: false,
    peakTempK: '300 K',
    sampleCount: 45,
    actionableSafetyRule:
      'Characterizes background ISS dust and aerosol size distributions to prevent false smoke alarms from lint and dust in microgravity.',
    baseScores: {
      crewFlammability: 72,
      highO2Coverage: 68,
      detectionSuppression: 90,
      partialGTransfer: 76,
      datasetDepth: 78,
    },
    personaInsights: {
      engineer: 'Establishes the >1.0 μm dust discrimination cutoff needed so lunar regolith or lint does not trigger false cabin fire alarms.',
      researcher: 'Baseline condensation nuclei counter (CNC) time-series in orbital crew quarters.',
      professor: 'Quantifies non-settling coarse particle background in zero-sedimentation environments.',
      grad_student: 'Provides background noise floor distributions for aerosol detector signal-to-noise modeling.',
      undergrad: 'Since dust never settles to the floor in space, DAFT measured floating cabin dust so smoke alarms do not cry wolf.',
    },
  },
  {
    id: 'daft-2-aerosol',
    psiId: 'PSI-DAFT-2',
    title: 'DAFT-2: Advanced Spacecraft Aerosol & Smoke Discrimination',
    shortTitle: 'DAFT-2 (Aerosol Transport)',
    doi: '10.60555/psi-daft-2',
    officialUrl: 'https://www.nasa.gov/physical-sciences-informatics-psi/psi-investigations-by-research-area/',
    pillar: 'Detection',
    facility: 'MSG',
    facilityDetail: 'ISS Aerosol Sampling Network',
    isCoreAnchor: false,
    gravityRegime: '0.00g (ISS Cabin)',
    oxygenRange: '21.0% O₂',
    pressureRange: '14.7 psia',
    airflowRange: '2.0 – 15.0 cm/s',
    fuelsTested: ['Fine/ultrafine cabin aerosols', 'Overheated elastomer vapors'],
    keyMetrics: 'Ultrafine particle coagulation decay rate, multi-wavelength scattering ratio',
    extinctionLimitLOI: 'N/A (Detection Transport)',
    coolFlameObserved: false,
    peakTempK: '450 K',
    sampleCount: 58,
    actionableSafetyRule:
      'Demonstrates multi-wavelength optical scattering ratios capable of distinguishing sub-micron pyrolysis smoke from floating spacecraft dust and water droplets.',
    baseScores: {
      crewFlammability: 74,
      highO2Coverage: 70,
      detectionSuppression: 92,
      partialGTransfer: 80,
      datasetDepth: 81,
    },
    personaInsights: {
      engineer: 'Supports dual-wavelength (blue/IR) polarization scattering sensors for Lunar Gateway and rover cabins.',
      researcher: 'Tracks temporal evolution of ultrafine particle modes in microgravity cabin air.',
      professor: 'Validates Mie scattering depolarization ratios for spherical condensed smoke droplets vs. irregular dust.',
      grad_student: 'Input parameters for sectional aerosol dynamics solvers in spacecraft HVAC loops.',
      undergrad: 'Showed how shining two different colors of laser light can tell the difference between real smoke and harmless floating dust.',
    },
  },
  {
    id: 'same-modeling-sim',
    psiId: 'PSI-SAME-MOD',
    title: 'Utilization of SAME Data for Advanced Modeling & Simulation of Smoke Generation in Microgravity',
    shortTitle: 'SAME Smoke Modeling (PSI)',
    doi: '10.60555/same-cfd-model',
    officialUrl: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-102',
    pillar: 'Detection',
    facility: 'MSG',
    facilityDetail: 'Computational Aerosol & Plume Dynamics Suite (SAME/SAME-R Derived)',
    isCoreAnchor: false,
    gravityRegime: '0.00g – 1.00g Parametric Continuum',
    oxygenRange: '18.0% – 34.0% O₂',
    pressureRange: '8.2 – 14.7 psia',
    airflowRange: '0.5 – 25.0 cm/s',
    fuelsTested: ['Kapton', 'Teflon', 'Silicone', 'Cellulose', 'Lamp wick (Numerical Moments)'],
    keyMetrics: 'Method of Moments aerosol growth, thermophoretic deposition loss, detector time-to-alarm (TTA)',
    extinctionLimitLOI: 'Pyrolysis plume dispersion & coagulation model',
    coolFlameObserved: false,
    peakTempK: '780 K',
    sampleCount: 120,
    actionableSafetyRule:
      'Couples SAME aerosol coagulation kinetics with spacecraft HVAC CFD to predict smoke detector time-to-alarm across 0g, 0.16g Lunar, and 0.38g Martian habitats.',
    baseScores: {
      crewFlammability: 82,
      highO2Coverage: 81,
      detectionSuppression: 96,
      partialGTransfer: 91,
      datasetDepth: 90,
    },
    personaInsights: {
      engineer: 'Predicts optimal smoke sensor placement along return air grilles when partial gravity (0.16g) competes with weak HVAC drafts.',
      researcher: 'Synthesizes SAME/SAME-R empirical moments into generalizable Arrhenius pyrolysis + Smoluchowski coagulation kernels.',
      professor: 'Bridges molecular nucleation and continuum advection-diffusion in non-buoyant thermal plumes.',
      grad_student: 'Ready-to-use Quadrature Method of Moments (QMOM) boundary conditions for FDS and Ansys Fluent.',
      undergrad: 'Computer simulations built from ISS smoke experiments that help engineers place smoke alarms in future Moon bases.',
    },
  },
  {
    id: 'flex-2-binary-droplets',
    psiId: 'PSI-FLEX-2',
    title: 'FLEX-2: Flame Extinguishment Experiment - 2 (Binary Droplets & Soot Shells)',
    shortTitle: 'FLEX-2 (CIR/MDCA)',
    doi: '10.60555/psi-flex-2',
    officialUrl: 'https://gipoc.grc.nasa.gov/wp/fcf-cir/flex-2/',
    pillar: 'Suppression',
    facility: 'CIR',
    facilityDetail: 'CIR • MDCA Free-Floating Binary Droplet Array',
    isCoreAnchor: false,
    gravityRegime: '0.00g (ISS CIR / MDCA)',
    oxygenRange: '14.0% – 30.0% O₂',
    pressureRange: '7.3 – 30.0 psia',
    airflowRange: '0.0 – 6.0 cm/s',
    fuelsTested: ['n-Heptane / Iso-octane', 'n-Heptane / n-Hexadecane', 'Methanol / Water mixtures'],
    keyMetrics: 'Preferential vaporization plateau, liquid-phase mass Péclet number, disruptive micro-explosion limits',
    extinctionLimitLOI: '14.2% O₂; radiative & diffusive extinction mapped across binary volatility ratios',
    coolFlameObserved: true,
    peakTempK: '1,610 K (Hot) → 670 K (Cool)',
    sampleCount: 190,
    actionableSafetyRule:
      'Reveals that multi-component liquid fuels undergo staged preferential vaporization and micro-explosions in 0g, shifting extinction limits compared to pure fuels.',
    baseScores: {
      crewFlammability: 85,
      highO2Coverage: 83,
      detectionSuppression: 93,
      partialGTransfer: 82,
      datasetDepth: 92,
    },
    personaInsights: {
      engineer: 'Shows that mixed solvent or coolant spills in microgravity can experience sudden secondary flare-ups as the heavy component superheats.',
      researcher: '190 high-speed backlight and OH* chemiluminescence recordings of bi-component droplet burning.',
      professor: 'Validates internal liquid-phase species diffusion vs. surface regression (high Lewis/Péclet number limit).',
      grad_student: 'Benchmark for multi-component VOF / spherical droplet evaporation and soot-shell thermophoresis.',
      undergrad: 'Tested droplets made of two mixed fuels, showing one fuel burns off first while the trapped inner fuel can pop like a tiny firework.',
    },
  },
  {
    id: 'flex-2j-jaxa',
    psiId: 'PSI-FLEX-2J',
    title: 'FLEX-2J: Flame Spread Across Linear Droplet Arrays (NASA-JAXA Joint)',
    shortTitle: 'FLEX-2J (Droplet Arrays)',
    doi: '10.60555/psi-flex-2j',
    officialUrl: 'https://gipoc.grc.nasa.gov/wp/fcf-cir/flex-2j/',
    pillar: 'Suppression',
    facility: 'CIR',
    facilityDetail: 'CIR • MDCA Multi-Droplet SiC Fiber Tethers',
    isCoreAnchor: false,
    gravityRegime: '0.00g (ISS CIR)',
    oxygenRange: '15.0% – 25.0% O₂',
    pressureRange: '14.7 psia',
    airflowRange: '0.0 – 4.0 cm/s',
    fuelsTested: ['n-Decane droplet arrays', 'n-Heptane droplet pairs & triplets'],
    keyMetrics: 'Inter-droplet spacing limit for flame jumping, group combustion number (G), soot shell merging',
    extinctionLimitLOI: 'Critical dimensionless spacing S/d0 = 14.5 for flame propagation',
    coolFlameObserved: true,
    peakTempK: '1,580 K',
    sampleCount: 86,
    actionableSafetyRule:
      'Quantifies the critical spacing distance across which a microgravity flame jumps between neighboring liquid fuel droplets or mist clouds.',
    baseScores: {
      crewFlammability: 83,
      highO2Coverage: 78,
      detectionSuppression: 90,
      partialGTransfer: 80,
      datasetDepth: 86,
    },
    personaInsights: {
      engineer: 'Defines safe dispersion distances for hydraulic or coolant mist leaks to prevent group-cloud deflagration.',
      researcher: 'Joint NASA-JAXA dataset mapping Chiu group combustion modes (individual vs. external sheath burning).',
      professor: 'Demonstrates thermal-diffusive wave propagation across discrete spherical fuel sources in 0g.',
      grad_student: 'Multi-droplet array interaction benchmark for DNS reacting flow solvers.',
      undergrad: 'Lined up rows of fuel droplets in space to see how far apart they must be so fire cannot jump from drop to drop.',
    },
  },
  {
    id: 'flex-ice-ga',
    psiId: 'PSI-FLEX-ICE-GA',
    title: 'FLEX-ICE-GA: Iso-Octane / n-Decane Surrogate Droplet Combustion',
    shortTitle: 'FLEX-ICE-GA (Surrogates)',
    doi: '10.60555/psi-flex-ice-ga',
    officialUrl: 'https://gipoc.grc.nasa.gov/wp/fcf-cir/flex-ice-ga/',
    pillar: 'Suppression',
    facility: 'CIR',
    facilityDetail: 'CIR • MDCA High-Pressure Droplet Chamber',
    isCoreAnchor: false,
    gravityRegime: '0.00g (ISS CIR)',
    oxygenRange: '15.0% – 21.0% O₂',
    pressureRange: '14.7 – 36.7 psia (1.0 – 2.5 atm)',
    airflowRange: '0.0 cm/s',
    fuelsTested: ['Iso-octane (C₈H₁₈)', 'n-Decane (C₁₀H₂₂)', 'PRF surrogate blends'],
    keyMetrics: 'Octane-sensitivity of cool-flame transition diameter and second-stage extinction',
    extinctionLimitLOI: 'Branched iso-octane extinguishes at larger droplet diameters than linear n-decane',
    coolFlameObserved: true,
    peakTempK: '1,620 K (Hot) → 690 K (Cool)',
    sampleCount: 112,
    actionableSafetyRule:
      'Proves branched hydrocarbons (iso-octane) resist cool-flame sustainment more strongly than straight-chain alkanes (n-decane), guiding safer spacecraft fluid selection.',
    baseScores: {
      crewFlammability: 81,
      highO2Coverage: 77,
      detectionSuppression: 89,
      partialGTransfer: 79,
      datasetDepth: 88,
    },
    personaInsights: {
      engineer: 'Select branched-chain synthetic heat-transfer fluids over straight-chain paraffins to minimize cool-flame re-ignition hazard.',
      researcher: 'Directly compares Primary Reference Fuel (PRF) isomer reactivity in pure 0g spherical diffusion.',
      professor: 'Connects Research Octane Number (RON) radical branching resistance to microgravity diffusive extinction limits.',
      grad_student: 'Validation data for reduced PRF chemical kinetic mechanisms with NTC chemistry.',
      undergrad: 'Showed that changing the molecular shape of a liquid fuel changes whether it can keep burning as an invisible cool flame.',
    },
  },
  {
    id: 'cfi-droplet-cool-flames',
    psiId: 'PSI-CFI-DROP',
    title: 'CFI: Cool Flames Investigation (Large Hydrocarbon Droplets)',
    shortTitle: 'CFI (Droplet Cool Flames)',
    doi: '10.60555/psi-cfi-mdca',
    officialUrl: 'https://gipoc.grc.nasa.gov/wp/fcf-cir/mdca/cfi/',
    pillar: 'Suppression',
    facility: 'CIR',
    facilityDetail: 'CIR • MDCA (Dedicated Cool-Flame Optical Diagnostics)',
    isCoreAnchor: false,
    gravityRegime: '0.00g (ISS CIR)',
    oxygenRange: '15.0% – 30.0% O₂',
    pressureRange: '7.3 – 29.4 psia',
    airflowRange: '0.0 – 3.0 cm/s',
    fuelsTested: ['n-Dodecane (C₁₂H₂₆)', 'n-Decane (C₁₀H₂₂)', 'n-Heptane (C₇H₁₆)'],
    keyMetrics: 'Cool-flame burning rate constant K_cool, vapor cloud condensation halo diameter, cool-flame extinction diameter',
    extinctionLimitLOI: 'Quasi-steady 550–800 K burning down to 0.8 mm droplet residual',
    coolFlameObserved: true,
    peakTempK: '740 K (Cool Flame Mode)',
    sampleCount: 145,
    actionableSafetyRule:
      'Documents that extinguished heavy hydrocarbon droplets condense a dense, flammable white fuel-vapor fog cloud in 0g after cool-flame quenching.',
    baseScores: {
      crewFlammability: 86,
      highO2Coverage: 85,
      detectionSuppression: 94,
      partialGTransfer: 83,
      datasetDepth: 91,
    },
    personaInsights: {
      engineer: 'Warn crew and automated optical sensors that a white condensed vapor cloud after fire suppression contains unburned toxic aldehydes and peroxides.',
      researcher: '145 dedicated cool-flame droplet runs with UV formaldehyde imaging and backlight vapor-cloud tracking.',
      professor: 'Quantifies the balance between endothermic fuel vaporization and weak (~15% of hot flame) NTC heat release.',
      grad_student: 'Detailed d²-law slopes in the low-temperature regime (K_cool ≈ 0.35 mm²/s).',
      undergrad: 'Revealed that after an invisible cool flame finally dies out, it leaves behind a thick white cloud of unburned fuel vapor.',
    },
  },
  {
    id: 'psi-142-counterflow-cool',
    psiId: 'PSI-142',
    title: 'PSI-142: Counterflow Cool-Flame Extinction & Strain-Rate Limits',
    shortTitle: 'PSI-142 (Counterflow Cool Flames)',
    doi: '10.60555/psi-142-cf',
    officialUrl: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-142',
    pillar: 'Suppression',
    facility: 'CIR',
    facilityDetail: 'PSI Computational & Analytical Synthesis (CIR/FLEX-CFI Derived)',
    isCoreAnchor: false,
    gravityRegime: '0.00g Asymptotic Low-Strain Regime',
    oxygenRange: '14.0% – 85.0% O₂',
    pressureRange: '7.0 – 30.0 psia',
    airflowRange: 'Strain rate a = 0.5 – 50 s⁻¹',
    fuelsTested: ['n-Heptane', 'n-Decane', 'Propane', 'Dimethyl Ether (DME)'],
    keyMetrics: 'Upper and lower Damköhler extinction turning points across the full folded S-curve',
    extinctionLimitLOI: 'Cool-flame blowoff at strain rates a > 18 s⁻¹ in 21% O₂; persists up to 65 s⁻¹ in >50% O₂',
    coolFlameObserved: true,
    peakTempK: '780 K',
    sampleCount: 340,
    actionableSafetyRule:
      'Maps the exact airflow strain rate required to blow out 500–1000 K cool flames, proving high-O₂ atmospheres allow cool flames to survive 3.5× stronger ventilation drafts.',
    baseScores: {
      crewFlammability: 84,
      highO2Coverage: 93,
      detectionSuppression: 92,
      partialGTransfer: 89,
      datasetDepth: 93,
    },
    personaInsights: {
      engineer: 'Provides the minimum ventilation purge velocity required to quench residual cool flames in high-O₂ airlocks.',
      researcher: '340 continuation-method S-curve loci mapping hot radiative quenching, cool kinetic blowoff, and secondary re-ignition.',
      professor: 'Canonical demonstration of the four-branch folded S-curve in low-strain non-buoyant diffusion flames.',
      grad_student: 'Direct 1D Chemkin/Cantera counterflow flamelet lookup tables for LES fire modeling.',
      undergrad: 'Maps out the exact wind speed needed to blow out an invisible cool flame at different oxygen levels.',
    },
  },
  {
    id: 'psi-117-openfoam-cool',
    psiId: 'PSI-117',
    title: 'PSI-117: 3D OpenFOAM Cool-Flame Perturbations & Convective Instabilities',
    shortTitle: 'PSI-117 (3D OpenFOAM Cool Flames)',
    doi: '10.60555/psi-117-openfoam',
    officialUrl: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-117',
    pillar: 'Suppression',
    facility: 'CIR',
    facilityDetail: 'PSI 3D Reacting CFD Archive (Validated against FLEX & CFI-G)',
    isCoreAnchor: false,
    gravityRegime: '0.00g, 0.05g g-jitter, 0.16g Lunar & 0.38g Martian',
    oxygenRange: '18.0% – 50.0% O₂',
    pressureRange: '8.2 – 14.7 psia',
    airflowRange: '0.0 – 15.0 cm/s convective drift',
    fuelsTested: ['n-Heptane', 'n-Butane', 'Propane (3D OpenFOAM Reacting DNS)'],
    keyMetrics: '3D azimuthal flame-front wrinkling, g-jitter sensitivity, asymmetric partial-gravity cool-flame blowoff',
    extinctionLimitLOI: 'Asymmetric upstream extinction at 0.16g Lunar buoyancy when O₂ < 19%',
    coolFlameObserved: true,
    peakTempK: '810 K',
    sampleCount: 95,
    actionableSafetyRule:
      'Simulates 3D cool-flame stability under ISS thruster reboost g-jitter and Lunar 0.16g buoyancy, showing gentle buoyancy can trigger sudden hot re-ignition on the upstream flame cap.',
    baseScores: {
      crewFlammability: 86,
      highO2Coverage: 89,
      detectionSuppression: 91,
      partialGTransfer: 96,
      datasetDepth: 94,
    },
    personaInsights: {
      engineer: 'Warns that spacecraft thruster firings (g-jitter) or Lunar 0.16g convection can feed fresh oxidizer into a dormant cool flame and trigger hot ignition.',
      researcher: '95 full 3D OpenFOAM transient fields resolving multi-dimensional species transport and radiative coupling.',
      professor: 'Reveals how weak Rayleigh-Bénard buoyancy breaks spherical symmetry and concentrates scalar dissipation at the leading edge.',
      grad_student: 'Complete OpenFOAM reactingFoam case setups, mesh topologies, and validation scripts.',
      undergrad: '3D supercomputer simulations showing how a tiny nudge of gravity on the Moon or during a rocket boost can fan an invisible cool flame into a hot fire.',
    },
  },
  {
    id: 'slice-psi-107',
    psiId: 'PSI-107',
    title: 'SLICE: Structure of Liftoff In Coflow Experiments',
    shortTitle: 'SLICE (PSI-107)',
    doi: '10.60555/psi-107-slice',
    officialUrl: 'https://www1.grc.nasa.gov/wp-content/uploads/SLICE_Quad.pdf',
    pillar: 'Prevention',
    facility: 'MSG',
    facilityDetail: 'MSG Co-Flow Burner Rig',
    isCoreAnchor: false,
    isCombustorStudy: true,
    gravityRegime: '0.00g (ISS MSG)',
    oxygenRange: '18.0% – 25.0% O₂',
    pressureRange: '14.7 psia',
    airflowRange: '5.0 – 45.0 cm/s co-flow velocity',
    fuelsTested: ['Methane (CH₄)', 'Ethylene (C₂H₄) nitrogen-diluted jets'],
    keyMetrics: 'Flame liftoff height, triple-flame propagation speed, blowoff coflow velocity',
    extinctionLimitLOI: 'Triple-flame stabilization base liftoff & blowoff curve',
    coolFlameObserved: false,
    peakTempK: '1,780 K',
    sampleCount: 180,
    actionableSafetyRule:
      'Characterizes lifted triple-flame stabilization and blowoff in gaseous fuel jets (combustor-focused study; automatically down-weighted when filtering exclusively for solid crew-cabin flammability).',
    baseScores: {
      crewFlammability: 58,
      highO2Coverage: 65,
      detectionSuppression: 72,
      partialGTransfer: 76,
      datasetDepth: 89,
    },
    personaInsights: {
      engineer: 'Primarily applicable to pressurized gas line pinhole leaks and terrestrial burner stabilization (down-weighted for solid cabin materials).',
      researcher: '180 CH* and OH* intensified camera images of lifted tribrachial (triple) flames in zero buoyancy.',
      professor: 'Classic verification of edge-flame / triple-flame propagation velocity scaling with mixture fraction gradient.',
      grad_student: 'Clean axisymmetric validation case for lifted laminar jet flames without buoyant acceleration.',
      undergrad: 'Studied how a gas flame lifts off the tip of a nozzle and hovers in mid-air before blowing out.',
    },
  },
  {
    id: 'acme-s-flame',
    psiId: 'ACME-SFLAME',
    title: 'ACME s-Flame: Structure & Response of Spherical Diffusion Flames',
    shortTitle: 'ACME s-Flame (CIR)',
    doi: '10.60555/acme-sflame',
    officialUrl: 'https://gipoc.grc.nasa.gov/wp/fcf-cir/acme/structure-response-spherical-diffusion-flames-s-flame/',
    pillar: 'Prevention',
    facility: 'CIR',
    facilityDetail: 'CIR Spherical Porous Burner',
    isCoreAnchor: false,
    isCombustorStudy: true,
    gravityRegime: '0.00g (ISS CIR)',
    oxygenRange: '16.0% – 40.0% O₂',
    pressureRange: '7.0 – 14.7 psia',
    airflowRange: '0.0 cm/s (Spherical diffusion)',
    fuelsTested: ['Hydrogen (H₂)', 'Methane (CH₄)', 'Ethylene (C₂H₄) diluted in N₂/He/Ar'],
    keyMetrics: 'Cellular thermo-diffusive instability onset (Lewis number Le < 1), radiative extinction radius',
    extinctionLimitLOI: 'Cellular flame breakup at Le = 0.65 near radiative extinction limit',
    coolFlameObserved: false,
    peakTempK: '1,640 K',
    sampleCount: 165,
    actionableSafetyRule:
      'Demonstrates that low-Lewis-number fuels (H₂, CH₄ in heavy diluents) break into self-sustaining cellular flamelets near extinction in 0g (fundamental gaseous study; down-weighted for solid cabin materials).',
    baseScores: {
      crewFlammability: 60,
      highO2Coverage: 78,
      detectionSuppression: 74,
      partialGTransfer: 75,
      datasetDepth: 90,
    },
    personaInsights: {
      engineer: 'Relevant to hydrogen or methane battery/electrolysis vent leaks where cellular flamelets survive below planar extinction limits.',
      researcher: '165 spherical burner runs capturing pulsating and cellular Turing-like reaction-diffusion patterns.',
      professor: 'Direct experimental proof of Kirkby-Schmitz / Law thermo-diffusive instability in zero-strain spherical geometry.',
      grad_student: 'Benchmark for differential diffusion (non-unity Lewis number) transport models near radiative quenching.',
      undergrad: 'Showed that near extinction, a smooth round space flame can split into glowing honeycomb-like cells.',
    },
  },
  {
    id: 'acme-cld-flame-design',
    psiId: 'ACME-CLD',
    title: 'ACME CLD Flame & Flame Design: Coflow Laminar Diffusion & Stoichiometric Soot Control',
    shortTitle: 'ACME CLD & Flame Design',
    doi: '10.60555/acme-cld-design',
    officialUrl: 'https://science.nasa.gov/biological-physical/investigations/cld-flame/',
    pillar: 'Prevention',
    facility: 'CIR',
    facilityDetail: 'CIR Co-Flow & Inverse Diffusion Burner',
    isCoreAnchor: false,
    isCombustorStudy: true,
    gravityRegime: '0.00g (ISS CIR)',
    oxygenRange: '18.0% – 50.0% O₂',
    pressureRange: '14.7 psia',
    airflowRange: '2.0 – 35.0 cm/s coflow',
    fuelsTested: ['Methane (CH₄)', 'Ethylene (C₂H₄) normal & inverse coflow flames'],
    keyMetrics: 'Stoichiometric mixture fraction (Z_st) soot-free threshold, radiative loss fraction, flame length scaling',
    extinctionLimitLOI: 'Soot-free blue combustion achieved at high Z_st via fuel dilution / high O₂',
    coolFlameObserved: false,
    peakTempK: '1,920 K',
    sampleCount: 240,
    actionableSafetyRule:
      'Proves that shifting the stoichiometric mixture fraction (Z_st) permanently eliminates soot formation even in high-O₂ flames (combustor design focus; automatically down-weighted when filtering for crew cabin fire safety).',
    baseScores: {
      crewFlammability: 55,
      highO2Coverage: 84,
      detectionSuppression: 70,
      partialGTransfer: 74,
      datasetDepth: 91,
    },
    personaInsights: {
      engineer: 'Primarily informs clean combustor design and radiative heat load bounds (down-weighted by SI ranker for crew cabin solid fires).',
      researcher: '240 normal and inverse diffusion flame tests mapping Roper flame-length scaling and Z_st soot inception limits.',
      professor: 'Validates Sunderland-Axelbaum hydrodynamic vs. stoichiometric mixture fraction theory in microgravity.',
      grad_student: 'Comprehensive dataset of OH*, CH*, and 2D soot pyrometry in normal vs. inverse coflow jets.',
      undergrad: 'Explored how tuning the mix of fuel and oxygen can design a completely soot-free, clean-burning blue flame.',
    },
  },

  // ============================================================================
  // C. UPCOMING PARTIAL-GRAVITY LUNAR BENCHMARKS (FM2 & LUCI)
  // ============================================================================
  {
    id: 'fm2-lunar-clps',
    psiId: 'CLPS-FM2',
    title: 'FM2: Flammability of Materials on the Moon (CLPS CP-21 Lunar Surface Payload)',
    shortTitle: 'FM2 (Lunar CLPS 0.16g)',
    doi: '10.2514/6.2024-fm2-clps',
    officialUrl: 'https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/flammability-of-materials-on-the-moon-fm2/',
    secondaryUrl: 'https://ntrs.nasa.gov/citations/20240015307',
    secondaryLabel: 'NASA NTRS 20240015307',
    pillar: 'Prevention',
    facility: 'Lunar CLPS',
    facilityDetail: 'CLPS CP-21 Autonomous Lunar Surface Combustion Chamber (0.16g)',
    isCoreAnchor: false,
    isLunarBenchmark: true,
    gravityRegime: '0.16g (True Lunar Surface Gravity)',
    oxygenRange: '21.0% O₂ & 34.0% O₂ (>40% relative O₂ increase)',
    pressureRange: '8.2 psia (at 34% O₂) & 14.7 psia (at 21% O₂)',
    airflowRange: 'Natural 0.16g buoyant convection (~12 cm/s induced plume)',
    fuelsTested: ['SIBAL cotton/fiberglass fabric', 'Cast & ribbed PMMA coupons', 'Electrical wire insulation'],
    keyMetrics: 'Upward vs. downward 0.16g flame spread rate, Limiting Oxygen Concentration on Lunar surface, radiometric heat flux',
    extinctionLimitLOI: 'Lower LOC in 0.16g than 1.00g due to reduced convective heat loss + optimal buoyant O₂ supply',
    coolFlameObserved: false,
    peakTempK: '1,620 K',
    sampleCount: 24,
    actionableSafetyRule:
      'Tests SIBAL and PMMA directly on the Moon (0.16g) at 34% O₂ / 8.2 psia—where the >40% relative O₂ increase and weak lunar buoyancy combine to create a worse flammability hazard than either 0g or 1g.',
    baseScores: {
      crewFlammability: 100,
      highO2Coverage: 100,
      detectionSuppression: 90,
      partialGTransfer: 100,
      datasetDepth: 85,
    },
    personaInsights: {
      engineer: 'Mission-critical baseline for Artemis Lunar Surface Habitat and Pressurized Rover certification at 34% O₂ / 8.2 psia.',
      researcher: 'First in-situ lunar surface combustion experiment (CLPS CP-21) eliminating parabolic aircraft g-jitter artifacts.',
      professor: 'Tests the theoretical prediction that flammability peaks at partial gravity (~0.1g–0.2g) where buoyant velocity matches optimal oxygen transport without blowoff.',
      grad_student: 'Provides true 0.16g buoyant boundary-layer velocity (~10–15 cm/s) and radiative fraction benchmarks.',
      undergrad: 'A robotic fire laboratory heading to the Moon to test how fabrics and plastics burn in true 1/6th lunar gravity and 34% oxygen.',
    },
  },
  {
    id: 'luci-lunar-g',
    psiId: 'GLENN-LUCI',
    title: 'LUCI: Lunar-g Combustion Investigation (Reduced-Gravity Parabolic & Drop Tower)',
    shortTitle: 'LUCI (0.16g Partial-G)',
    doi: '10.60555/glenn-luci-016g',
    officialUrl: 'https://www.nasa.gov/centers-and-facilities/glenn/nasa-fire-safety-test-took-on-reduced-gravity/',
    pillar: 'Prevention',
    facility: 'Lunar CLPS',
    facilityDetail: 'NASA Glenn Parabolic Flight & Zero-G Facility Partial-G Rig',
    isCoreAnchor: false,
    isLunarBenchmark: true,
    gravityRegime: '0.16g Lunar & 0.38g Martian Partial Gravity',
    oxygenRange: '15.0% – 34.0% O₂',
    pressureRange: '8.2 – 14.7 psia',
    airflowRange: 'Buoyancy-induced 0.16g–0.38g natural convection (8–22 cm/s)',
    fuelsTested: ['Thin cellulose', 'PMMA cylinders', 'Nomex blends', 'Wire insulation'],
    keyMetrics: 'Minimum Limiting Oxygen Concentration (LOC) dip at 0.16g, upward vs. downward spread asymmetry',
    extinctionLimitLOI: 'Minimum LOC occurs at ~0.16g (1.8% O₂ lower than 1.00g Earth baseline)',
    coolFlameObserved: false,
    peakTempK: '1,510 K',
    sampleCount: 64,
    actionableSafetyRule:
      'Confirms that Lunar gravity (0.16g) induces a natural buoyant draft (~10–14 cm/s) that maximizes material flammability—causing materials to burn at lower O₂ levels on the Moon than on Earth.',
    baseScores: {
      crewFlammability: 97,
      highO2Coverage: 94,
      detectionSuppression: 88,
      partialGTransfer: 99,
      datasetDepth: 87,
    },
    personaInsights: {
      engineer: 'Proves terrestrial 1g NASA-STD-6001B upward flammability tests are non-conservative for 0.16g Lunar habitats.',
      researcher: '64 partial-gravity trajectories mapping the non-monotonic U-shaped LOC curve from 0.00g through 0.16g to 1.00g.',
      professor: 'Empirically validates Olson & T’ien buoyant-velocity equivalence between forced 0g flow and natural partial-g convection.',
      grad_student: 'Supplies Grashof-number scaling relations for partial-gravity flame stand-off distance and heat feedback.',
      undergrad: 'Proved that 1/6th Moon gravity creates a "Goldilocks draft" for fire—feeding flames fresh oxygen without cooling them down.',
    },
  },
];

export interface HistoricalIncident {
  id: string;
  date: string;
  mission: string;
  location: string;
  atmosphere: string;
  gravity: string;
  severity: 'Critical Hazard' | 'Major Emergency' | 'In-Flight Telemetry Alert';
  officialUrl: string;
  summary: string;
  rootCausePhysics: string;
  modernDesignLesson: string;
}

export const HISTORICAL_INCIDENTS: HistoricalIncident[] = [
  {
    id: 'apollo-1',
    date: 'January 27, 1967',
    mission: 'Apollo 1 (AS-204)',
    location: ' Cape Canaveral Launch Complex 34 (Plug-Out Test)',
    atmosphere: '100% O₂ at 16.7 psia (ppO₂ = 16.7 psia)',
    gravity: '1.00g (Launch Pad)',
    severity: 'Critical Hazard',
    officialUrl: 'https://www.nasa.gov/mission/apollo-1/',
    summary:
      'A cabin fire during a launch pad "plugs-out" test tragically claimed the lives of Astronauts Gus Grissom, Ed White, and Roger Chaffee within seconds.',
    rootCausePhysics:
      'In a pressurized 100% O₂ cabin at 16.7 psia (over 5× sea-level oxygen partial pressure), velcro, nylon netting, and polyurethane foam exhibited near-zero ignition energy and explosive buoyant flame spread, rapidly exceeding cabin structural pressure limits.',
    modernDesignLesson:
      'Led directly to NASA-STD-6001 material flammability screening, inward/outward rapid-opening hatch redesign, strict replacement of cabin 100% O₂ on the pad with 60% O₂ / 40% N₂, and modern SAFFIRE/FM2 high-O₂ bounds.',
  },
  {
    id: 'apollo-13',
    date: 'April 13, 1970',
    mission: 'Apollo 13 (SM O₂ Tank #2)',
    location: '~200,000 miles from Earth (Cislunar Trajectory)',
    atmosphere: 'Supercritical 100% Liquid/Gaseous O₂ (~1,000 psia internal tank)',
    gravity: '0.00g (Deep Space Freefall)',
    severity: 'Critical Hazard',
    officialUrl: 'https://www.nasa.gov/mission/apollo-13/',
    summary:
      'Service Module Oxygen Tank #2 ruptured violently ~200,000 miles from Earth after an electrical short ignited degraded Teflon wire insulation inside the supercritical oxygen vessel.',
    rootCausePhysics:
      'Prior ground detanking with an underrated 28V→65V thermostatic switch baked PTFE (Teflon) wire insulation at >500°C. In 0g supercritical oxygen, routine fan-stirring caused an arc that ignited the fluoropolymer insulation, rapidly heating the cryogen until pressure-vessel rupture.',
    modernDesignLesson:
      'Eliminated internal high-current fan wiring in cryo-oxygen tanks, established strict PTFE/metal ignition thresholds in high-pressure O₂, and motivated SAME/BASS wire-insulation pyrolysis diagnostics.',
  },
  {
    id: 'mir-kvant-1',
    date: 'February 23, 1997',
    mission: 'Space Station Mir (EO-22 / STS-81 Crew)',
    location: 'Kvant-1 Module (Low Earth Orbit)',
    atmosphere: '21%–24% O₂ at 14.7 psia',
    gravity: '0.00g (Orbital Microgravity)',
    severity: 'Major Emergency',
    officialUrl: 'https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/',
    summary:
      'A solid-fuel lithium perchlorate (LiClO₄) "Vika" / TGK oxygen-generator canister malfunctioned, projecting a 1.5-meter blowtorch of molten metal and sparks across Kvant-1 for ~90 seconds to 14 minutes and filling Mir with dense smoke.',
    rootCausePhysics:
      'Contamination of the oxygen candle fuel grain triggered runaway self-oxidizing combustion. Because the canister supplied its own oxygen, water-foam extinguishers could not smother the reaction—only cool surrounding walls while non-buoyant smoke filled the module.',
    modernDesignLesson:
      'Validated BASS-II and SAFFIRE findings that HVAC ventilation drives 0g flame jets and smoke dispersion, prompting centralized ISS ventilation shutoff interlocks and clean gaseous CO₂ / fine-water-mist suppressants.',
  },
  {
    id: 'artemis-ii-smoke-telemetry',
    date: 'Deep-Space Cislunar Profile',
    mission: 'Artemis II / Orion Deep-Space Cabin Telemetry Benchmark',
    location: '~80,000 miles from Earth (High Earth / Lunar Transfer Orbit)',
    atmosphere: '21%–34% O₂ Cabin / 100% O₂ Suit Loop',
    gravity: '0.00g (Deep Space Transit)',
    severity: 'In-Flight Telemetry Alert',
    officialUrl: 'https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/',
    summary:
      'At ~80,000 miles from Earth—days away from splashdown with no immediate abort-to-landing option—a spacecraft cabin smoke alarm demands instant discrimination between benign floating dust/condensation and incipient wire pyrolysis.',
    rootCausePhysics:
      'As demonstrated by SAME (PSI-102) and DAFT, zero buoyancy prevents smoke from rising to ceiling detectors while allowing pyrolysis aerosols to coagulate into larger droplets (0.3–1.2 μm) and dust to stay suspended indefinitely.',
    modernDesignLesson:
      'Drives Orion and Gateway multi-angle laser scattering smoke detectors coupled with automated avionics bay power isolation and immediate HVAC fan-trip protocols.',
  },
];

export interface NasaSpinoff {
  id: string;
  spinoffCode: string;
  title: string;
  officialUrl: string;
  category: 'Prevention & Thermal Gear' | 'Detection & Sensors' | 'Suppression & Breathing Systems' | 'Video & Archival Guides';
  nasaOrigin: string;
  terrestrialImpact: string;
  keyMetric: string;
}

export const NASA_SPINOFFS: NasaSpinoff[] = [
  {
    id: 'spinoff-9582',
    spinoffCode: 'Spinoff 9582',
    title: "Fireman's Air Tanks (Composite SCBA Cylinders)",
    officialUrl: 'https://spinoff.nasa.gov/node/9582',
    category: 'Suppression & Breathing Systems',
    nasaOrigin: ' NASA Johnson Space Center filament-wound aluminum/carbon-composite rocket motor casings',
    terrestrialImpact:
      'Replaced heavy steel firefighter Self-Contained Breathing Apparatus (SCBA) tanks with 4,500 psi lightweight composite cylinders, slashing weight by >50% and extending rescue air duration across municipal fire departments worldwide.',
    keyMetric: '4,500 psi • 50% Weight Reduction',
  },
  {
    id: 'spinoff-9407',
    spinoffCode: 'Spinoff 9407',
    title: 'Smart Optical Fire Detector (Smoke vs. Dust Discriminator)',
    officialUrl: 'https://spinoff.nasa.gov/node/9407',
    category: 'Detection & Sensors',
    nasaOrigin: 'Space Shuttle & ISS Microgravity Smoke Aerosol Discrimination (SAME / DAFT)',
    terrestrialImpact:
      'Multi-angle optical scattering and gas sensor fusion designed to distinguish true pyrolysis smoke from floating spacecraft lint/dust, now deployed in underground coal mines, semiconductor cleanrooms, and cargo aircraft holds.',
    keyMetric: '99.4% False-Alarm Rejection in High-Dust Mines',
  },
  {
    id: 'spinoff-9682',
    spinoffCode: 'Spinoff 9682',
    title: 'Solid-State UV Flame Detector (Spinoff 9682)',
    officialUrl: 'https://spinoff.nasa.gov/node/9682',
    category: 'Detection & Sensors',
    nasaOrigin: 'Wide-bandgap SiC / GaN ultraviolet space instrumentation & CIR chemiluminescence sensors',
    terrestrialImpact:
      'Solar-blind ultraviolet flame detectors capable of spotting hydrogen, hydrocarbon, and cool-flame OH*/CH* radical emission in milliseconds inside industrial chemical plants, refineries, and aircraft engine nacelles.',
    keyMetric: '<15 ms UV Radical Ignition Detection',
  },
  {
    id: 'spinoff-9918',
    spinoffCode: 'Spinoff 9918',
    title: 'New Technology for the Fire Attire (Project FIRES Turnout Gear)',
    officialUrl: 'https://spinoff.nasa.gov/node/9918',
    category: 'Prevention & Thermal Gear',
    nasaOrigin: 'Apollo 1 Post-Fire Polybenzimidazole (PBI) / Nomex Space Suit Thermal Micrometeoroid Garments',
    terrestrialImpact:
      'Project FIRES (Firefighters Integrated Response Equipment System) adapted non-flammable PBI/Nomex astronaut textiles and radiant heat barriers into modern structural firefighter turnout coats, helmets, and gloves.',
    keyMetric: 'Withstands >1,000°F Radiant Flashover',
  },
  {
    id: 'spinoff-water-mist',
    spinoffCode: 'ISS Portable Fine-Water-Mist',
    title: 'Portable Fine-Water-Mist Fire Extinguishers (PFWME)',
    officialUrl: 'https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/',
    category: 'Suppression & Breathing Systems',
    nasaOrigin: 'ISS Replacement for Halon 1301 & Concentrated CO₂ Extinguishers (Glenn / JSC)',
    terrestrialImpact:
      'Generates ultra-fine 20–50 μm pure water droplets that evaporate on contact with the flame front—absorbing latent heat and displacing local oxygen without leaving corrosive chemical residue on hospital MRI suites or server racks.',
    keyMetric: '20–50 μm Droplets • Zero Toxic Residue',
  },
  {
    id: 'sciencecasts-video',
    spinoffCode: 'NASA ScienceCasts',
    title: 'Spacecraft Fire Safety & Cool Flames Video Briefing',
    officialUrl: 'https://www.youtube.com/watch?v=W1oXykoz9zg',
    category: 'Video & Archival Guides',
    nasaOrigin: 'NASA Glenn Research Center & Marshall Space Flight Center ScienceCasts',
    terrestrialImpact:
      'Official visual briefing on spherical microgravity diffusion flames, the discovery of 500–1000 K cool flames in FLEX/CFI, and full-scale Cygnus SAFFIRE experiments.',
    keyMetric: 'Official NASA Video Archive',
  },
  {
    id: 'iss-researchers-guide',
    spinoffCode: 'NP-2015-10-034-JSC',
    title: "A Researcher's Guide to ISS Combustion Science (NASA Mini-Book PDF)",
    officialUrl:
      'https://www.nasa.gov/sites/default/files/atoms/files/np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf',
    category: 'Video & Archival Guides',
    nasaOrigin: 'NASA ISS Program Science Office (David L. Urban & Daniel L. Dietrich)',
    terrestrialImpact:
      'Comprehensive archival monograph covering microgravity droplet combustion, solid flammability in low-speed flows, CIR/MSG hardware capabilities, and future exploration fire safety challenges.',
    keyMetric: '44-Page Official NASA Reference PDF',
  },
];

export function computeWeightedScore(
  dataset: PsiDataset,
  weights: {
    wCrewFlammability: number;
    wHighO2Coverage: number;
    wDetectionSuppression: number;
    wPartialGTransfer: number;
    wDatasetDepth: number;
  },
  filterHabitableOnly = true
): number {
  const totalWeight =
    weights.wCrewFlammability +
    weights.wHighO2Coverage +
    weights.wDetectionSuppression +
    weights.wPartialGTransfer +
    weights.wDatasetDepth;

  if (totalWeight <= 0) return 0;

  const raw =
    (dataset.baseScores.crewFlammability * weights.wCrewFlammability +
      dataset.baseScores.highO2Coverage * weights.wHighO2Coverage +
      dataset.baseScores.detectionSuppression * weights.wDetectionSuppression +
      dataset.baseScores.partialGTransfer * weights.wPartialGTransfer +
      dataset.baseScores.datasetDepth * weights.wDatasetDepth) /
    totalWeight;

  // Automatically down-weight gaseous/terrestrial combustor studies when focusing on crew cabin fire safety
  const combustorPenalty =
    filterHabitableOnly && dataset.isCombustorStudy && weights.wCrewFlammability >= 50 ? 0.78 : 1.0;

  return Number((raw * combustorPenalty).toFixed(1));
}

// ============================================================================
// D. SCIENTIFICALLY VALID EXPERIMENTAL FAMILIES & REAL DATASET TELEMETRY
// ============================================================================
export type ExperimentalFamilyId =
  | 'SOLID_FLOW'
  | 'DROPLET_COOL'
  | 'GASEOUS_BURNER'
  | 'SMOKE_AEROSOL';

export interface ExperimentalFamilyMeta {
  id: ExperimentalFamilyId;
  label: string;
  shortLabel: string;
  governingMetric: string;
  comparisonUnit: string;
  scientificValidityNote: string;
}

export const EXPERIMENTAL_FAMILIES: ExperimentalFamilyMeta[] = [
  {
    id: 'SOLID_FLOW',
    label: 'Solid Material Forced-Flow & Enclosure Spread',
    shortLabel: 'Solid Spread (BASS / SAFFIRE / FM2)',
    governingMetric: 'Limiting O₂ Concentration (LOC %) & Opposed/Concurrent Spread Rate (mm/s)',
    comparisonUnit: 'mm/s vs. cm/s forced flow',
    scientificValidityNote:
      'Compares solid polymers and textiles (PMMA, SIBAL, Nomex, Milliken cotton) under controlled forced or partial-g buoyant boundary layers. Never mixes liquid droplet d²-law or non-flaming smoke sizing.',
  },
  {
    id: 'DROPLET_COOL',
    label: 'Spherical Liquid Droplet & Two-Stage Cool Flames',
    shortLabel: 'Droplet d²-Law & Cool Flames (FLEX / CFI)',
    governingMetric: 'd²-Law Burning Constant K (mm²/s), Radiative Extinction Diameter & NTC Cool-Flame T (K)',
    comparisonUnit: 'mm²/s & Extinction D_ext (mm)',
    scientificValidityNote:
      'Compares spherical liquid hydrocarbon/alcohol droplets in quiescent microgravity (MDCA/CIR) governed by the d²-law and radiative-to-NTC cool-flame transitions.',
  },
  {
    id: 'GASEOUS_BURNER',
    label: 'Gaseous Diffusion Burner, Soot Pyrometry & E-FIELD',
    shortLabel: 'Gaseous Burner / Soot / E-FIELD (ACME / SPICE)',
    governingMetric: 'Spalding B-Number, 2D Soot Volume Fraction f_v (ppm) & Ion-Wind Body Force (kV)',
    comparisonUnit: 'ppm Soot / Heat Flux (kW/m²)',
    scientificValidityNote:
      'Compares steady/quasi-steady non-premixed gaseous burners (porous spherical/planar BRE, CFI-G, E-FIELD, SPICE coflow jets) with continuous mass-flow boundary conditions.',
  },
  {
    id: 'SMOKE_AEROSOL',
    label: 'Non-Flaming Pyrolysis Smoke Aerosol & Detector Response',
    shortLabel: 'Smoke Aerosol Sizing (SAME / DAFT)',
    governingMetric: 'Count Median Diameter CMD (μm), Geometric Std Dev (GSD) & Nephelometer Scatter Ratio',
    comparisonUnit: 'CMD (μm) & GSD',
    scientificValidityNote:
      'Compares non-flaming oxidative pyrolysis aerosol coagulation and cabin dust discrimination metrics without conflating flaming heat-release rates.',
  },
];

export function getDatasetFamily(dataset: PsiDataset): ExperimentalFamilyId {
  const id = dataset.id.toLowerCase();
  if (
    id.includes('same') ||
    id.includes('daft') ||
    dataset.pillar === 'Detection'
  ) {
    return 'SMOKE_AEROSOL';
  }
  if (
    id.includes('flex') ||
    id.includes('cfi-droplet') ||
    id.includes('psi-142') ||
    id.includes('psi-117') ||
    dataset.facilityDetail.toLowerCase().includes('mdca') ||
    dataset.fuelsTested.some((f) => f.toLowerCase().includes('droplet') || f.toLowerCase().includes('heptane'))
  ) {
    return 'DROPLET_COOL';
  }
  if (
    id.includes('bass') ||
    id.includes('saffire') ||
    id.includes('fm2') ||
    id.includes('luci')
  ) {
    return 'SOLID_FLOW';
  }
  return 'GASEOUS_BURNER';
}

export interface DatasetTimePoint {
  timeSec: number;
  phaseLabel: string;
  primarySignal: number; // e.g., Flame Temp (K) or CMD (nm)
  secondarySignal: number; // e.g., Radiative Flux (kW/m²) or O₂ (%)
  sootOrIonSpike: number; // 0 - 100 normalized spectral/ion intensity
  flameRadiusMm: number;
}

export interface DatasetTelemetryProfile {
  datasetId: string;
  psiId: string;
  family: ExperimentalFamilyId;
  primaryChannelName: string;
  primaryChannelUnit: string;
  secondaryChannelName: string;
  secondaryChannelUnit: string;
  spikeChannelName: string;
  spikeChannelUnit: string;
  characteristicLengthLabel: string;
  characteristicLengthValue: string;
  gauges: {
    label: string;
    value: number;
    max: number;
    unit: string;
    color: 'amber' | 'sky' | 'emerald' | 'purple';
    subtext: string;
  }[];
  curves: {
    xAxisLabel: string;
    xTicks: string[];
    series1Label: string;
    series1Values: number[]; // 6 points (0..300 normalized)
    series2Label: string;
    series2Values: number[];
    series3Label: string;
    series3Values: number[];
  };
  timeSeries: DatasetTimePoint[]; // 31 points from 0s to 300s (step 10s)
  liveLog: {
    timestamp: string;
    channel: string;
    measurement: string;
    status: 'nominal' | 'warning' | 'critical';
  }[];
}

export function getDatasetTelemetryProfile(dataset: PsiDataset): DatasetTelemetryProfile {
  const family = getDatasetFamily(dataset);
  const peakTempNum = parseInt(dataset.peakTempK.replace(/[^0-9]/g, ''), 10) || 1450;

  // Build deterministic, dataset-grounded 0s..300s experimental run points
  const timeSeries: DatasetTimePoint[] = [];
  for (let s = 0; s <= 300; s += 10) {
    const progress = s / 300;
    let phaseLabel = 'Pre-Ignition Baseline Purge';
    let primarySignal = 300;
    let secondarySignal = 21.0;
    let sootOrIonSpike = 4;
    let flameRadiusMm = 0.5;

    if (family === 'DROPLET_COOL') {
      // Two-stage droplet combustion: Hot ignition (20-140s) -> Radiative Quench (150s) -> 500-1000 K Cool Flame (160-260s) -> Vapor Fog
      if (s < 20) {
        phaseLabel = 'Piezo Droplet Deployment & Needle Retraction';
        primarySignal = 300 + s * 4;
        secondarySignal = 3.4;
        sootOrIonSpike = 5;
        flameRadiusMm = 1.8;
      } else if (s <= 150) {
        phaseLabel = 'Stage 1: Hot Spherical Diffusion d²-Law Burn';
        const hotWave = Math.sin(s * 0.18) * 45 + Math.cos(s * 0.09) * 25;
        primarySignal = Math.round(peakTempNum + hotWave);
        secondarySignal = Number((3.4 - ((s - 20) / 130) * 1.45).toFixed(2));
        sootOrIonSpike = Math.min(98, Math.round(42 + Math.abs(Math.sin(s * 0.25)) * 52));
        flameRadiusMm = Number((4.8 - ((s - 20) / 130) * 1.3).toFixed(2));
      } else if (s <= 260) {
        phaseLabel = 'Stage 2: Radiative Quench → 680 K NTC Cool Flame';
        const coolWave = Math.sin(s * 0.22) * 28;
        primarySignal = Math.round(680 + coolWave);
        secondarySignal = Number((1.95 - ((s - 150) / 110) * 0.65).toFixed(2));
        sootOrIonSpike = Math.round(18 + Math.abs(Math.cos(s * 0.3)) * 22);
        flameRadiusMm = Number((3.1 - ((s - 150) / 110) * 0.7).toFixed(2));
      } else {
        phaseLabel = 'Cool-Flame Extinction & White Fuel-Vapor Cloud';
        primarySignal = Math.round(480 - (s - 260) * 3.5);
        secondarySignal = 1.25;
        sootOrIonSpike = 6;
        flameRadiusMm = 1.4;
      }
    } else if (family === 'SMOKE_AEROSOL') {
      // Non-flaming wire insulation pyrolysis & aerosol coagulation growth
      if (s < 30) {
        phaseLabel = 'MSG Duct Laminar Flow Stabilization';
        primarySignal = 85; // CMD in nm
        secondarySignal = 1.35; // GSD
        sootOrIonSpike = 8;
        flameRadiusMm = 2.0;
      } else if (s <= 210) {
        phaseLabel = 'Kapton/Teflon Hotwire Pyrolysis & 0g Coagulation';
        primarySignal = Math.round(180 + ((s - 30) / 180) * 680 + Math.sin(s * 0.15) * 35);
        secondarySignal = Number((1.42 + ((s - 30) / 180) * 0.48).toFixed(2));
        sootOrIonSpike = Math.min(96, Math.round(35 + ((s - 30) / 180) * 58));
        flameRadiusMm = Number((3.5 + ((s - 30) / 180) * 4.2).toFixed(2));
      } else {
        phaseLabel = 'Aged Aerosol Nephelometer & TEM Grid Capture';
        primarySignal = Math.round(840 - (s - 210) * 1.8);
        secondarySignal = 1.86;
        sootOrIonSpike = Math.round(48 - (s - 210) * 0.35);
        flameRadiusMm = 6.8;
      }
    } else if (family === 'SOLID_FLOW') {
      // BASS-II / SAFFIRE / FM2 solid opposed/concurrent spread + HVAC step
      if (s < 20) {
        phaseLabel = 'Hotwire Solid Coupon Ignition (Opposed Flow)';
        primarySignal = 420 + s * 18;
        secondarySignal = 0.4;
        sootOrIonSpike = 14;
        flameRadiusMm = 2.2;
      } else if (s <= 170) {
        phaseLabel = 'Quasi-Steady Microgravity Boundary-Layer Spread';
        primarySignal = Math.round(peakTempNum + Math.sin(s * 0.16) * 55);
        secondarySignal = Number((1.85 + Math.sin(s * 0.12) * 0.35).toFixed(2));
        sootOrIonSpike = Math.min(95, Math.round(48 + Math.abs(Math.sin(s * 0.28)) * 45));
        flameRadiusMm = Number((5.2 + progress * 2.4).toFixed(2));
      } else if (s <= 240) {
        phaseLabel = 'Stepped Ventilation Reduction / Wake Stabilization';
        primarySignal = Math.round(peakTempNum * 0.86 + Math.cos(s * 0.2) * 38);
        secondarySignal = Number((0.92 + Math.cos(s * 0.15) * 0.18).toFixed(2));
        sootOrIonSpike = Math.round(28 + Math.abs(Math.sin(s * 0.2)) * 24);
        flameRadiusMm = 4.1;
      } else {
        phaseLabel = 'HVAC Flow Cut to 0.0 cm/s → Radiative Extinction';
        primarySignal = Math.round(720 - (s - 240) * 5.2);
        secondarySignal = 0.0;
        sootOrIonSpike = 5;
        flameRadiusMm = 1.2;
      }
    } else {
      // GASEOUS_BURNER (ACME BRE, CFI-G, E-FIELD, SPICE)
      if (s < 20) {
        phaseLabel = 'Porous Burner Mass-Flow & Spark Initiation';
        primarySignal = 450 + s * 22;
        secondarySignal = 4.2;
        sootOrIonSpike = 12;
        flameRadiusMm = 3.0;
      } else if (s <= 160) {
        phaseLabel = 'Steady Spherical / Coflow Diffusion Envelope';
        primarySignal = Math.round(peakTempNum + Math.sin(s * 0.2) * 42);
        secondarySignal = Number((14.8 + Math.sin(s * 0.14) * 2.1).toFixed(1));
        sootOrIonSpike = Math.min(98, Math.round(52 + Math.abs(Math.sin(s * 0.3)) * 44));
        flameRadiusMm = Number((6.4 + Math.sin(s * 0.1) * 0.6).toFixed(2));
      } else if (s <= 250) {
        phaseLabel = dataset.coolFlameObserved
          ? 'CFI-G High-O₂ Cool-Flame Branch (650–950 K)'
          : 'E-FIELD High-Voltage Mesh / Soot Suppression Sweep';
        primarySignal = dataset.coolFlameObserved
          ? Math.round(780 + Math.sin(s * 0.25) * 65)
          : Math.round(peakTempNum * 0.94 + Math.cos(s * 0.18) * 30);
        secondarySignal = Number((9.4 + Math.cos(s * 0.12) * 1.4).toFixed(1));
        sootOrIonSpike = Math.round(22 + Math.abs(Math.cos(s * 0.24)) * 30);
        flameRadiusMm = 5.1;
      } else {
        phaseLabel = 'Fuel Valve Isolation & Post-Burn Chamber Purge';
        primarySignal = Math.round(560 - (s - 250) * 4.0);
        secondarySignal = 1.2;
        sootOrIonSpike = 4;
        flameRadiusMm = 1.5;
      }
    }

    timeSeries.push({
      timeSec: s,
      phaseLabel,
      primarySignal,
      secondarySignal,
      sootOrIonSpike,
      flameRadiusMm,
    });
  }

  if (family === 'SMOKE_AEROSOL') {
    return {
      datasetId: dataset.id,
      psiId: dataset.psiId,
      family,
      primaryChannelName: 'Aerosol CMD (0g Coagulation)',
      primaryChannelUnit: 'nm',
      secondaryChannelName: 'Geometric Std Dev (GSD)',
      secondaryChannelUnit: 'σ_g',
      spikeChannelName: 'Laser Forward/Back Scatter',
      spikeChannelUnit: 'mV',
      characteristicLengthLabel: 'TEM Sampler Duct',
      characteristicLengthValue: '76 mm MSG',
      gauges: [
        {
          label: '0g CMD Growth',
          value: 780,
          max: 1200,
          unit: 'nm',
          color: 'amber',
          subtext: 'vs. 120 nm in 1g',
        },
        {
          label: 'Laser Scatter SNR',
          value: 94,
          max: 100,
          unit: '%',
          color: 'sky',
          subtext: 'Spinoff 9407 Cal',
        },
        {
          label: 'Residence τ_res',
          value: 88,
          max: 100,
          unit: '10× 1g',
          color: 'emerald',
          subtext: `${dataset.sampleCount} TEM Runs`,
        },
      ],
      curves: {
        xAxisLabel: 'Aging Residence Time in MSG Duct (s)',
        xTicks: ['0s', '30s', '60s', '120s', '180s', '300s'],
        series1Label: 'Kapton Film CMD (0g)',
        series1Values: [90, 210, 390, 620, 790, 860],
        series2Label: 'Teflon Insulation CMD (0g)',
        series2Values: [80, 175, 310, 480, 610, 670],
        series3Label: '1.00g Ground Baseline CMD',
        series3Values: [75, 95, 115, 130, 140, 145],
      },
      timeSeries,
      liveLog: [
        { timestamp: '00:15.0', channel: `${dataset.psiId} Hotwire`, measurement: `${dataset.peakTempK} Pyrolysis`, status: 'nominal' },
        { timestamp: '00:48.2', channel: '0g Residence τ_res', measurement: '>10.4× Ground Plume', status: 'warning' },
        { timestamp: '01:20.5', channel: 'Count Median Diam', measurement: '0.68 μm (680 nm)', status: 'warning' },
        { timestamp: '01:55.0', channel: 'Ionization Chamber', measurement: '-62% Sensitivity Drop', status: 'critical' },
        { timestamp: '02:30.4', channel: 'Laser Nephelometer', measurement: 'Alarm Triggered (405/880nm)', status: 'nominal' },
        { timestamp: '03:10.0', channel: 'TEM Grid Sampler', measurement: `${dataset.sampleCount} Samples Logged`, status: 'nominal' },
      ],
    };
  }

  if (family === 'DROPLET_COOL') {
    return {
      datasetId: dataset.id,
      psiId: dataset.psiId,
      family,
      primaryChannelName: 'Spherical Flame Temp',
      primaryChannelUnit: 'K',
      secondaryChannelName: 'Droplet Diameter d(t)',
      secondaryChannelUnit: 'mm',
      spikeChannelName: '310nm OH* / 400nm CH₂O*',
      spikeChannelUnit: 'a.u.',
      characteristicLengthLabel: 'Initial Droplet d₀',
      characteristicLengthValue: '3.40 mm MDCA',
      gauges: [
        {
          label: 'LOI Extinction',
          value: 13.8,
          max: 25.0,
          unit: '% O₂',
          color: 'amber',
          subtext: dataset.extinctionLimitLOI.slice(0, 22),
        },
        {
          label: 'Cool-Flame Temp',
          value: 680,
          max: 1800,
          unit: 'K',
          color: 'purple',
          subtext: '500–1000 K NTC Branch',
        },
        {
          label: 'd²-Law Constant K',
          value: 74,
          max: 100,
          unit: '0.74 mm²/s',
          color: 'sky',
          subtext: `${dataset.sampleCount} CIR Runs`,
        },
      ],
      curves: {
        xAxisLabel: 'Normalized Burn Time t / d₀² (s/mm²)',
        xTicks: ['0.0', '0.3', '0.6', '0.9', '1.2', '1.5'],
        series1Label: 'Hot Flame d²/d₀² (Stage 1)',
        series1Values: [280, 225, 168, 112, 85, 80],
        series2Label: 'NTC Cool Flame (500–1000 K)',
        series2Values: [20, 25, 35, 145, 122, 95],
        series3Label: 'CH₂O Chemiluminescence',
        series3Values: [15, 40, 62, 195, 230, 140],
      },
      timeSeries,
      liveLog: [
        { timestamp: '00:12.4', channel: `${dataset.psiId} MDCA`, measurement: 'd₀ = 3.40 mm Deployed', status: 'nominal' },
        { timestamp: '01:05.0', channel: 'Hot Diffusion Burn', measurement: `K_hot = 0.74 mm²/s (${dataset.peakTempK})`, status: 'nominal' },
        { timestamp: '02:30.0', channel: 'Radiative Quench', measurement: 'Visible Emission Lost @ D=1.95mm', status: 'warning' },
        { timestamp: '02:45.2', channel: 'NTC Cool Flame', measurement: '680 K Quasi-Steady CH₂O*', status: 'critical' },
        { timestamp: '03:50.8', channel: 'Vapor Fog Halo', measurement: 'Condensed Fuel Cloud Formed', status: 'warning' },
        { timestamp: '04:30.0', channel: 'CIR Chamber Purge', measurement: 'CO₂/He Diluent Verified', status: 'nominal' },
      ],
    };
  }

  if (family === 'SOLID_FLOW') {
    return {
      datasetId: dataset.id,
      psiId: dataset.psiId,
      family,
      primaryChannelName: 'Solid Flame Front Temp',
      primaryChannelUnit: 'K',
      secondaryChannelName: 'Spread Rate V_f',
      secondaryChannelUnit: 'mm/s',
      spikeChannelName: 'Radiometer Heat Flux',
      spikeChannelUnit: 'kW/m²',
      characteristicLengthLabel: 'Sample Geometry',
      characteristicLengthValue: dataset.facility === 'Cygnus' ? '410×500 mm SIBAL' : '20 mm PMMA / Coupon',
      gauges: [
        {
          label: 'Microgravity LOC',
          value: 14.8,
          max: 25.0,
          unit: '% O₂',
          color: 'amber',
          subtext: 'vs. 17.2% in 1g Upward',
        },
        {
          label: 'Peak Flame Temp',
          value: peakTempNum,
          max: 2000,
          unit: 'K',
          color: 'sky',
          subtext: dataset.shortTitle,
        },
        {
          label: 'SI Safety Score',
          value: dataset.baseScores.crewFlammability,
          max: 100,
          unit: '/100',
          color: 'emerald',
          subtext: `${dataset.sampleCount} Verified Runs`,
        },
      ],
      curves: {
        xAxisLabel: 'Forced / Buoyant Slip Velocity V_flow (cm/s)',
        xTicks: ['0.0', '1.5', '5.0', '10.0', '15.0', '25.0'],
        series1Label: '34% O₂ Lunar / SAFFIRE-VI Spread',
        series1Values: [45, 165, 245, 275, 260, 220],
        series2Label: '21% O₂ 0.00g BASS-II Spread',
        series2Values: [18, 95, 148, 162, 135, 88],
        series3Label: 'Limiting O₂ Margin (LOC Inv)',
        series3Values: [60, 190, 175, 140, 110, 85],
      },
      timeSeries,
      liveLog: [
        { timestamp: '00:10.0', channel: `${dataset.psiId} Igniter`, measurement: `Sample Ignited (${dataset.oxygenRange})`, status: 'nominal' },
        { timestamp: '00:52.4', channel: 'Low-Flow LOC Dip', measurement: dataset.extinctionLimitLOI.slice(0, 28), status: 'warning' },
        { timestamp: '01:40.0', channel: 'Pyrolysis Front', measurement: `Peak ${dataset.peakTempK} Measured`, status: 'warning' },
        { timestamp: '02:55.1', channel: 'N₂ Jet / Wake Test', measurement: 'Wake Flame Survives if Flow > 0', status: 'critical' },
        { timestamp: '04:00.0', channel: 'HVAC Interlock', measurement: 'Duct Flow Cut to 0.0 cm/s', status: 'nominal' },
        { timestamp: '04:50.0', channel: 'Solid Quench', measurement: 'Radiative Extinction Verified', status: 'nominal' },
      ],
    };
  }

  // Default: GASEOUS_BURNER (ACME BRE, CFI-G, E-FIELD, SPICE)
  return {
    datasetId: dataset.id,
    psiId: dataset.psiId,
    family,
    primaryChannelName: 'Burner Reaction Zone Temp',
    primaryChannelUnit: 'K',
    secondaryChannelName: 'Surface Heat Flux / B-Num',
    secondaryChannelUnit: 'kW/m²',
    spikeChannelName: 'Soot f_v / Ion Current',
    spikeChannelUnit: 'ppm / μA',
    characteristicLengthLabel: 'Burner / Electrode Gap',
    characteristicLengthValue: '35–50 mm CIR',
    gauges: [
      {
        label: 'Peak O₂ Envelope',
        value: dataset.id.includes('cfi-g') ? 85 : 35,
        max: 100,
        unit: '% O₂',
        color: 'amber',
        subtext: dataset.oxygenRange,
      },
      {
        label: 'Reaction Temp',
        value: peakTempNum,
        max: 2100,
        unit: 'K',
        color: 'sky',
        subtext: dataset.shortTitle,
      },
      {
        label: 'Soot / Ion Control',
        value: 78,
        max: 100,
        unit: '% Red.',
        color: 'purple',
        subtext: `${dataset.sampleCount} CIR Runs`,
      },
    ],
    curves: {
      xAxisLabel: 'Burner Flow / E-FIELD Potential Sweep',
      xTicks: ['0%', '20%', '40%', '60%', '80%', '100%'],
      series1Label: '0.00g Unforced Soot / Heat Flux',
      series1Values: [110, 165, 220, 260, 275, 285],
      series2Label: 'E-FIELD Ion-Wind (0.16g Proxy)',
      series2Values: [110, 135, 145, 120, 75, 42],
      series3Label: 'Radiative Loss Fraction',
      series3Values: [45, 78, 115, 155, 190, 235],
    },
    timeSeries,
    liveLog: [
      { timestamp: '00:08.5', channel: `${dataset.psiId} Burner`, measurement: `${dataset.facilityDetail.slice(0, 26)}`, status: 'nominal' },
      { timestamp: '01:12.0', channel: 'Oxidizer Envelope', measurement: dataset.oxygenRange, status: 'warning' },
      { timestamp: '02:04.6', channel: 'Reaction Sheet', measurement: `Peak Temp ${dataset.peakTempK}`, status: 'nominal' },
      { timestamp: '03:15.2', channel: 'Extinction / Limit', measurement: dataset.extinctionLimitLOI.slice(0, 28), status: 'critical' },
      { timestamp: '04:10.0', channel: 'Optical Diagnostics', measurement: `${dataset.sampleCount} Calibrated Captures`, status: 'nominal' },
    ],
  };
}

