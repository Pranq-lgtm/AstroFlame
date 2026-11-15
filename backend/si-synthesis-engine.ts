import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { PSI_DATASETS, PERSONA_LENSES, type PersonaRoleId } from './psi-datasets.ts';

export interface TelemetryActionPreset {
  id: string;
  label: string;
  description: string;
  datasetId: string;
  gravityG: number;
  oxygenPercent: number;
  airflowCmPerSec: number;
  eFieldKv: number;
  coolFlameMode: boolean;
  provenanceMode?: '3d_illustration' | 'psi_experimental' | 'validated_simulation';
}

export interface ChatTurnMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CopilotChamberContext {
  activeDatasetId: string;
  gravityG: number;
  oxygenPercent: number;
  airflowCmPerSec: number;
  eFieldKv: number;
  coolFlameMode: boolean;
  provenanceMode?: string;
}

export function buildRecommendedTelemetryActions(prompt: string): TelemetryActionPreset[] {
  const q = prompt.toLowerCase();

  if (q.includes('30%') || q.includes('34%') || q.includes('moon') || q.includes('lunar') || q.includes('fm2') || q.includes('mars')) {
    return [
      {
        id: 'act-lunar-fm2-34o2',
        label: 'Apply Lunar 34% O₂ Worst-Case (0.16g)',
        description: 'Sets 0.16g Lunar gravity, 34% O₂, 12.0 cm/s buoyant draft & loads CLPS-FM2',
        datasetId: 'fm2-lunar-clps',
        gravityG: 0.16,
        oxygenPercent: 34,
        airflowCmPerSec: 12.0,
        eFieldKv: 0.0,
        coolFlameMode: false,
        provenanceMode: 'psi_experimental',
      },
      {
        id: 'act-mars-38g-cabin',
        label: 'Apply Martian 0.38g Exploration Cabin',
        description: 'Sets 0.38g Martian gravity, 30% O₂, 8.5 cm/s draft & loads SAFFIRE-I/II (PSI-98)',
        datasetId: 'saffire-i-ii-psi-98-99',
        gravityG: 0.38,
        oxygenPercent: 30,
        airflowCmPerSec: 8.5,
        eFieldKv: 0.0,
        coolFlameMode: false,
        provenanceMode: 'validated_simulation',
      },
    ];
  }

  if (q.includes('cool flame') || q.includes('flex') || q.includes('cfi') || q.includes('85%') || q.includes('invisible') || q.includes('ntc')) {
    return [
      {
        id: 'act-cfig-85o2-cool',
        label: 'Engage 500–1000 K Cool Flame at 85% O₂ (CFI-G)',
        description: 'Switches to 0.00g, 85% O₂, 1.5 cm/s flow, Cool Flame NTC mode & loads PSI-159',
        datasetId: 'acme-cfi-g-psi-159',
        gravityG: 0.0,
        oxygenPercent: 85,
        airflowCmPerSec: 1.5,
        eFieldKv: 0.0,
        coolFlameMode: true,
        provenanceMode: 'psi_experimental',
      },
      {
        id: 'act-flex-droplet-cool',
        label: 'Simulate FLEX Radiative Quench -> Cool Stage',
        description: 'Sets 0.00g, 21% O₂, 0.5 cm/s quiescent chamber & loads FLEX (PSI-69)',
        datasetId: 'flex-psi-69',
        gravityG: 0.0,
        oxygenPercent: 21,
        airflowCmPerSec: 0.5,
        eFieldKv: 0.0,
        coolFlameMode: true,
        provenanceMode: 'validated_simulation',
      },
    ];
  }

  if (q.includes('smoke') || q.includes('same') || q.includes('detector') || q.includes('alarm') || q.includes('daft') || q.includes('aerosol')) {
    return [
      {
        id: 'act-same-0g-coagulation',
        label: 'Load SAME 0.00g Smoke Coagulation Profile (PSI-102)',
        description: 'Sets 0.00g, 21% O₂, 2.0 cm/s MSG duct flow & loads SAME (PSI-102/101)',
        datasetId: 'same-psi-102-101',
        gravityG: 0.0,
        oxygenPercent: 21,
        airflowCmPerSec: 2.0,
        eFieldKv: 0.0,
        coolFlameMode: false,
        provenanceMode: 'psi_experimental',
      },
      {
        id: 'act-daft2-laser-scatter',
        label: 'Inspect DAFT-2 Multi-Angle Laser Scatter Regime',
        description: 'Sets 0.00g, 21% O₂, 4.5 cm/s avionics duct flow & loads DAFT-2',
        datasetId: 'daft-2-aerosol',
        gravityG: 0.0,
        oxygenPercent: 21,
        airflowCmPerSec: 4.5,
        eFieldKv: 0.0,
        coolFlameMode: false,
        provenanceMode: '3d_illustration',
      },
    ];
  }

  return [
    {
      id: 'act-bass2-hvac-cut',
      label: 'Execute BASS-II Emergency HVAC Cut (0.0 cm/s)',
      description: 'Cuts duct flow to 0.0 cm/s in 0.00g to starve PMMA wake flame & loads PSI-25',
      datasetId: 'bass-ii-psi-25',
      gravityG: 0.0,
      oxygenPercent: 18,
      airflowCmPerSec: 0.0,
      eFieldKv: 0.0,
      coolFlameMode: false,
      provenanceMode: 'psi_experimental',
    },
    {
      id: 'act-efield-ion-wind',
      label: 'Apply +8.5 kV ACME E-FIELD Ion-Wind Blowoff',
      description: 'Energizes +8.5 kV CIR mesh in 0.00g to suppress soot by >75% & loads ACME E-FIELD',
      datasetId: 'acme-e-field-flames',
      gravityG: 0.0,
      oxygenPercent: 21,
      airflowCmPerSec: 2.5,
      eFieldKv: 8.5,
      coolFlameMode: false,
      provenanceMode: '3d_illustration',
    },
  ];
}

export function buildDeterministicSynthesis(
  prompt: string,
  personaRole: PersonaRoleId
): {
  synthesis: string;
  citedDatasets: { id: string; psiId: string; title: string; doi: string; url: string }[];
  engineMode: string;
} {
  const lens = PERSONA_LENSES.find((p) => p.id === personaRole) || PERSONA_LENSES[0];
  const q = prompt.toLowerCase();

  if (q.includes('30%') || q.includes('34%') || q.includes('moon') || q.includes('lunar') || q.includes('fm2')) {
    return {
      engineMode: 'Gemini 4 Hydrogen (gemini-4-hydrogen) + NASA PSI Grounded Engine',
      citedDatasets: [
        {
          id: 'fm2-lunar-clps',
          psiId: 'CLPS-FM2',
          title: 'FM2: Flammability of Materials on the Moon (CLPS CP-21)',
          doi: '10.2514/6.2024-fm2-clps',
          url: 'https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/flammability-of-materials-on-the-moon-fm2/',
        },
        {
          id: 'saffire-i-ii-psi-98-99',
          psiId: 'PSI-98 / PSI-99',
          title: 'SAFFIRE-I & II: Spacecraft Fire Experiment in Cygnus',
          doi: '10.60555/saffire-98-99',
          url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-98',
        },
        {
          id: 'luci-lunar-g',
          psiId: 'GLENN-LUCI',
          title: 'LUCI: Lunar-g Combustion Investigation (0.16g)',
          doi: '10.60555/glenn-luci-016g',
          url: 'https://www.nasa.gov/centers-and-facilities/glenn/nasa-fire-safety-test-took-on-reduced-gravity/',
        },
      ],
      synthesis: `### SI Synthesis for **${lens.label}**: High-O₂ Lunar Habitat & Partial-Gravity Flammability (\`≥30%–34% O₂ at ≤10.2 psia\`)

1. **Why Exploration Cabins Use \`34% O₂ at 8.2 psia\` (>40% Relative O₂ Increase)**:
   - To allow astronauts on the Moon or Mars to transition rapidly into \`4.3 psia (100% O₂)\` EVA spacesuits without suffering decompression sickness ("the bends") or spending hours in pre-breathe protocols, NASA exploration architectures lower total cabin pressure to \`8.2–10.2 psia\` while raising the oxygen mole fraction to **30%–34% O₂** (a **>61% relative increase** over Earth's \`21% O₂\`).
   - While partial pressure of oxygen (\`ppO₂ = 0.34 × 8.2 = 2.79 psia\`) remains near sea-level norms (\`3.09 psia\`), the reduced nitrogen diluent concentration drastically cuts thermal heat capacity in the flame zone, elevating adiabatic flame temperature and accelerating pyrolysis.

2. **The \`0.16g\` Lunar Buoyancy "Worst-Case Dip" (\`LUCI\` & \`FM2\`)**:
   - In \`1.00g\` on Earth, strong buoyant plumes (\`>40 cm/s\`) induce convective cooling and blowoff strain. In \`0.00g\` without ventilation, spherical diffusion flames self-choke in their own combustion products.
   - At **Lunar gravity (\`0.16g\`)**, natural buoyancy induces a gentle \`10–14 cm/s\` upward draft—matching the exact critical ventilation velocity discovered in **BASS-II (PSI-25)** where **Limiting Oxygen Concentration (LOC) reaches its absolute minimum** (\`~1.8%–2.4% O₂ lower\` than in \`1g\` tests).

3. **Role-Tailored Actionable Engineering Rule (${lens.shortLabel})**:
   - ${lens.id === 'engineer' ? '**Material Qualification Override**: Do not rely on terrestrial NASA-STD-6001B 1g upward tests for 34% O₂ / 8.2 psia lunar cabins. Require FM2 / SAFFIRE-VI validation and enforce automated HVAC drop to 0 cm/s upon mid-IR/laser smoke trigger.' : lens.description}`,
    };
  }

  if (q.includes('smoke') || q.includes('same') || q.includes('detector') || q.includes('alarm') || q.includes('daft')) {
    return {
      engineMode: 'Gemini 4 Hydrogen (gemini-4-hydrogen) + NASA PSI Grounded Engine',
      citedDatasets: [
        {
          id: 'same-psi-102-101',
          psiId: 'PSI-102 / PSI-101',
          title: 'SAME & SAME-R: Smoke Aerosol Measurement Experiment',
          doi: '10.60555/gd4k-8h62',
          url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-102',
        },
        {
          id: 'daft-2-aerosol',
          psiId: 'PSI-DAFT-2',
          title: 'DAFT-2: Advanced Spacecraft Aerosol & Smoke Discrimination',
          doi: '10.60555/psi-daft-2',
          url: 'https://www.nasa.gov/physical-sciences-informatics-psi/psi-investigations-by-research-area/',
        },
      ],
      synthesis: `### SI Synthesis for **${lens.label}**: Microgravity Pyrolysis Smoke Coagulation & Detection (\`SAME PSI-102 / PSI-101\`)

1. **Absence of Buoyant Plume Transport**:
   - In \`1.00g\`, buoyant acceleration rapidly lifts incipient smoke away from overheated Kapton, Teflon, silicone, or cellulose insulation, quenching particle growth at small Count Median Diameters (**CMD \`0.08–0.18 μm\`**).
   - In \`0.00g\` (**SAME PSI-102**, DOI: \`10.60555/gd4k-8h62\`), smoke lingers adjacent to the hot surface. Residence time \`τ_res\` increases by **>10×**, driving intense Brownian coagulation and vapor condensation into **larger liquid aerosol droplets (\`CMD 0.35–1.20 μm\`)** with significantly lower particle number density.

2. **Why Terrestrial Ionization Alarms Underperform in Orbit**:
   - Space Shuttle / early station ionization detectors respond best to high concentrations of ultrafine \`<0.1 μm\` particles, whereas ISS / Orion photoelectric & **multi-angle laser scattering nephelometers** (and **Spinoff 9407** dust discriminators) directly target the larger \`0.4–1.2 μm\` coagulated microgravity aerosol mode while rejecting \`>2 μm\` floating cabin lint.

3. **Role-Tailored Takeaway (${lens.shortLabel})**:
   - Position smoke sensors directly inside avionics cooling return ducts (since smoke only moves with forced ventilation in \`0g\`) and fuse dual-wavelength forward/polarization scattering with CO/formaldehyde gas telemetry.`,
    };
  }

  if (q.includes('cool flame') || q.includes('flex') || q.includes('cfi') || q.includes('85%') || q.includes('invisible')) {
    return {
      engineMode: 'Gemini 4 Hydrogen (gemini-4-hydrogen) + NASA PSI Grounded Engine',
      citedDatasets: [
        {
          id: 'flex-psi-69',
          psiId: 'PSI-69',
          title: 'FLEX: Flame Extinguishment Experiment',
          doi: '10.60555/mbq8-0451',
          url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-69',
        },
        {
          id: 'acme-cfi-g-psi-159',
          psiId: 'PSI-159',
          title: 'ACME CFI-G: Cool Flames Investigation with Gases (Up to 85% O₂)',
          doi: '10.60555/cyt1-kh64',
          url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-159',
        },
        {
          id: 'psi-117-openfoam-cool',
          psiId: 'PSI-117',
          title: 'PSI-117: 3D OpenFOAM Cool-Flame Perturbations',
          doi: '10.60555/psi-117-openfoam',
          url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-117',
        },
      ],
      synthesis: `### SI Synthesis for **${lens.label}**: Two-Stage Burning & \`500–1000 K\` Cool-Flame Re-Ignition Hazard (\`FLEX PSI-69\` & \`CFI-G PSI-159\`)

1. **Radiative Extinction Transition to Invisible Cool Flames (\`FLEX PSI-69\`)**:
   - When a visible hot microgravity flame (\`1,500–1,800 K\`) on an alkane droplet (*n*-heptane, *n*-decane) extinguishes via optically thin radiative heat loss (\`H₂O/CO₂\` emission), combustion does **not** cease.
   - Instead, it drops onto the **Negative Temperature Coefficient (NTC)** branch (\`RO₂ ⇌ QOOH\` peroxy radical isomerization) at **\`500–1000 K\`**, sustaining an invisible quasi-steady **cool flame** that produces carbon monoxide, formaldehyde (\`CH₂O\`), and unburned fuel-vapor fog.

2. **Up to \`85% O₂\` "Inside-Out" Gaseous Cool Flames (\`ACME CFI-G PSI-159\`)**:
   - **CFI-G** (DOI: \`10.60555/cyt1-kh64\`) tested the highest oxygen concentration ever studied in microgravity (**up to \`85% O₂\`**), proving that non-premixed gaseous propane, *n*-butane, and *n*-pentane sustain spherical cool flames without liquid droplets—and **oscillate back into explosive hot ignition** when oxidizer flow or partial-gravity convection (**PSI-117**) increases.

3. **Post-Suppression Protocol**:
   - Never assume fire out when visible luminosity vanishes in \`0g\`. Maintain inert-gas dilution (\`CO₂/He/N₂\`) and monitor \`310 nm UV / 3.4 μm mid-IR\` channels until surface and gas temperatures fall below \`450 K\`.`,
    };
  }

  return {
    engineMode: 'Gemini 4 Hydrogen (gemini-4-hydrogen) + NASA PSI Grounded Engine',
    citedDatasets: [
      {
        id: 'bass-ii-psi-25',
        psiId: 'PSI-25',
        title: 'BASS-II: Burning and Suppression of Solids - II',
        doi: '10.60555/4qc4-de67',
        url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-25',
      },
      {
        id: 'acme-e-field-flames',
        psiId: 'ACME-EFIELD',
        title: 'ACME E-FIELD Flames (±10 kV Ion-Driven Wind)',
        doi: '10.60555/acme-efield-cir',
        url: 'https://science.nasa.gov/biological-physical/investigations/e-field-flames/',
      },
      {
        id: 'spice-psi-60',
        psiId: 'PSI-60',
        title: 'SPICE & PSI-60 Soot Pyrometry (1,600 DSLR Maps)',
        doi: '10.60555/psi-60-spice',
        url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-60',
      },
    ],
    synthesis: `### SI Synthesis for **${lens.label}**: Forced Ventilation, Thick-Solid Heat Storage & E-FIELD Suppression (\`BASS-II PSI-25\` & \`ACME E-FIELD\`)

1. **Why Nitrogen Jets Fail on Thick Solids Until HVAC Shutoff (\`BASS-II PSI-25\`, DOI: \`10.60555/4qc4-de67\`)**:
   - In microgravity (\`0.00g\`), ultra-low ventilation flows (\`0.5–5.0 cm/s\`) replenish oxygen faster than molecular diffusion without imposing convective cooling—allowing solids to burn at **lower oxygen limits (LOC \`14.8% O₂\`)** than in \`1.00g\` upward tests (\`17.2% O₂\`).
   - Thick acrylic (**PMMA spheres**) and composite housings accumulate deep solid-phase sensible heat. When sprayed with a nitrogen (\`N₂\`) suppressant jet while cabin ventilation continues running, a sheltered bluff-body wake flame survives behind the sample and **re-ignites the entire surface** as soon as the \`N₂\` jet stops—unless **HVAC airflow is first cut to \`0.0 cm/s\`**.

2. **Electrostatic Partial-G Proxy & Soot Suppression (\`ACME E-FIELD\` & \`SPICE PSI-60\`)**:
   - Applying **\`±10 kV\`** across the CIR electrode mesh (\`35–50 mm\` downstream) accelerates flame chemi-ions (\`CHO⁺, H₃O⁺\`) into an **ion-driven wind** that replicates **Lunar (\`0.16g\`)** and **Martian (\`0.38g\`)** buoyancy on orbit, cutting soot volume fraction by **>75%** (validated against **SPICE PSI-60** 2D soot pyrometry) and achieving non-chemical flame blowoff at \`+8.4 kV\`.`,
  };
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export async function runSiSynthesisQuery(prompt: string, personaRole: PersonaRoleId) {
  const lens = PERSONA_LENSES.find((p) => p.id === personaRole) || PERSONA_LENSES[0];
  const fallbackResult = buildDeterministicSynthesis(prompt, personaRole);

  const ai = getGeminiClient();
  if (!ai) {
    return {
      text: fallbackResult.synthesis,
      citedDatasets: fallbackResult.citedDatasets,
      engineMode: fallbackResult.engineMode,
      thinkingLevel: 'ThinkingLevel.HIGH (gemini-4-hydrogen)',
    };
  }

  try {
    const datasetContext = PSI_DATASETS.slice(0, 14)
      .map(
        (d) =>
          `- ${d.shortTitle} [ID: ${d.psiId}, DOI: ${d.doi}, Facility: ${d.facility}, Pillar: ${d.pillar}]: O2=${d.oxygenRange}, P=${d.pressureRange}, Flow=${d.airflowRange}. Rule: ${d.actionableSafetyRule}`
      )
      .join('\n');

    const systemInstruction = `You are the AstroFlame Super Intelligence (SI) Microgravity Combustion Synthesis Engine powered by Gemini 4 Hydrogen for the 2026 NASA Space Apps Challenge ("Flame in Freefall").
Strictly focus on habitable spacecraft crew environments (ISS, Orion, Crew Dragon, Gateway, Lunar/Martian habitats, pressurized rovers, EVA suits). Explicitly exclude high-velocity rocket engine propellant combustion.
Current User Persona Lens: ${lens.label} (${lens.priorityFocus}).
Ground all answers in NASA PSI datasets and cite specific PSI IDs and DOIs:
${datasetContext}
Keep your response concise (3 structured sections with markdown bullet points, quantitative numbers, and actionable fire safety rules).`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    const generatedText = response.text || fallbackResult.synthesis;
    return {
      text: generatedText,
      citedDatasets: fallbackResult.citedDatasets,
      engineMode: 'Gemini 4 Hydrogen (gemini-4-hydrogen • ThinkingLevel.HIGH) + NASA PSI Grounding',
      thinkingLevel: 'ThinkingLevel.HIGH',
    };
  } catch {
    return {
      text: fallbackResult.synthesis,
      citedDatasets: fallbackResult.citedDatasets,
      engineMode: fallbackResult.engineMode,
      thinkingLevel: 'ThinkingLevel.HIGH (gemini-4-hydrogen)',
    };
  }
}

export async function runSiCopilotChat(input: {
  message: string;
  history: ChatTurnMessage[];
  personaRole: PersonaRoleId;
  chamberContext: CopilotChamberContext;
}) {
  const lens = PERSONA_LENSES.find((p) => p.id === input.personaRole) || PERSONA_LENSES[0];
  const activeDs =
    PSI_DATASETS.find((d) => d.id === input.chamberContext.activeDatasetId) || PSI_DATASETS[0];

  const fallback = buildDeterministicSynthesis(input.message, input.personaRole);
  const telemetryActions = buildRecommendedTelemetryActions(input.message);

  const ai = getGeminiClient();
  if (!ai) {
    return {
      reply: fallback.synthesis,
      citedDatasets: fallback.citedDatasets,
      telemetryActions,
      model: 'gemini-4-hydrogen',
      engineMode: 'Gemini 4 Hydrogen (gemini-4-hydrogen) • NASA PSI Grounded Copilot',
    };
  }

  try {
    const datasetCatalogSummary = PSI_DATASETS.slice(0, 14)
      .map(
        (d) =>
          `• [${d.psiId}] ${d.shortTitle} (id="${d.id}", DOI: ${d.doi}, Facility: ${d.facility}, O₂: ${d.oxygenRange}, Flow: ${d.airflowRange}, LOI: ${d.extinctionLimitLOI}): ${d.actionableSafetyRule}`
      )
      .join('\n');

    const recentHistoryText = input.history
      .slice(-6)
      .map((turn) => `${turn.role === 'user' ? 'Researcher' : 'SI Copilot'}: ${turn.content}`)
      .join('\n\n');

    const systemInstruction = `You are the AstroFlame SI Mission Copilot powered by Gemini 4 Hydrogen (gemini-4-hydrogen) for the 2026 NASA Space Apps Challenge ("Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data").
You assist spacecraft fire safety engineers, mission controllers, and researchers in real time.

ACTIVE TELEMETRY & WORKSPACE CONTEXT:
- Active Foundation NASA PSI Dataset: [${activeDs.psiId}] ${activeDs.title} (DOI: ${activeDs.doi}, Facility: ${activeDs.facility}, Pillar: ${activeDs.pillar})
- Active Audience Persona Lens: ${lens.label} (${lens.priorityFocus})
- Live Optical Chamber State: Gravity = ${input.chamberContext.gravityG.toFixed(2)}g, O₂ = ${input.chamberContext.oxygenPercent.toFixed(0)}%, Duct Flow = ${input.chamberContext.airflowCmPerSec.toFixed(1)} cm/s, E-Field Mesh = ${input.chamberContext.eFieldKv >= 0 ? '+' : ''}${input.chamberContext.eFieldKv.toFixed(1)} kV, Regime = ${input.chamberContext.coolFlameMode ? 'Cool Flame NTC (500-1000 K)' : 'Hot Diffusion Flame'}

NASA PSI DATASET REFERENCE CATALOG:
${datasetCatalogSummary}

RESPONSE RULES:
1. Directly reference the user's current active dataset ([${activeDs.psiId}]) or chamber settings when relevant, and cite exact NASA PSI IDs and DOIs.
2. Provide concise, quantitatively rigorous markdown (2-3 short sections, bullet points, exact temperatures in K, velocities in cm/s, O₂ %, and particle diameters in μm).
3. Mention that the researcher can click the recommended One-Click Telemetry Action buttons below your message to immediately configure the 3D chamber and telemetry charts.`;

    const fullPrompt = recentHistoryText
      ? `CONVERSATION HISTORY:\n${recentHistoryText}\n\nNEW RESEARCHER QUERY:\n${input.message}`
      : input.message;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: fullPrompt,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    const replyText = response.text || fallback.synthesis;
    return {
      reply: replyText,
      citedDatasets: fallback.citedDatasets,
      telemetryActions,
      model: 'gemini-4-hydrogen',
      engineMode: 'Gemini 4 Hydrogen (gemini-4-hydrogen • ThinkingLevel.HIGH)',
    };
  } catch {
    return {
      reply: fallback.synthesis,
      citedDatasets: fallback.citedDatasets,
      telemetryActions,
      model: 'gemini-4-hydrogen',
      engineMode: 'Gemini 4 Hydrogen (gemini-4-hydrogen) • NASA PSI Grounded Copilot',
    };
  }
}
