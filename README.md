# AstroFlame — SI-Powered Microgravity Fire Safety Dashboard

**2026 NASA Space Apps Challenge**: [Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data](https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/)

AstroFlame is a full-stack aerospace telemetry and synthesis platform that summarizes, ranks, and interprets decades of microgravity (`0.00g`) and partial-gravity (`0.16g` Lunar / `0.38g` Martian) combustion experiments from NASA's [Physical Sciences Informatics (PSI) Data Repository](https://psi.nasa.gov/physci/repo) and the [NASA Glenn Combustion Science Program](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/).

---

## Core Architecture & Features

- **4-Panel Mission Control Cockpit (`/`)**:
  - **Environment Configurations (`LEFT`)**: Select any NASA PSI dataset as the active platform foundation, switch across `0.00g ISS`, `0.16g Moon`, `0.38g Mars`, and `1.00g Earth` gravity regimes, and adjust `O₂ Concentration (%)`, `BASS-II Duct Flow (cm/s)`, `ACME E-FIELD Mesh Potential (kV)`, and `500–1000 K Cool-Flame Mode`.
  - **Dual 3D Flame Comparison Chamber (`CENTER`)**: Side-by-side Three.js chamber comparing `1.00g Buoyant Teardrop` vs. `0.00g / Partial-g` diffusion flames with an explicit **3-Mode Provenance Switcher** (`3D Physics Illustration` | `PSI Experimental Overlay` | `Validated Simulation Mesh`).
  - **Dataset-Grounded Real-Time Telemetry (`RIGHT`)**: Every waveform, transient spike bar chart, circular radial gauge, parametric multi-curve plot, and timestamped live log entry is driven directly by empirical measurements from the active NASA PSI dataset.
  - **History & Simulation Playback Timeline (`BOTTOM`)**: Interactive `0s–300s` experimental run scrubber with Play/Pause, Step Back/Forward, and synchronized chamber/telemetry state.
- **NASA PSI Datasets Catalog & Regime-Locked Comparison Matrix (`/datasets`)**:
  - Covers 8 Core Fire-Safety Anchors, 16 Extended PSI Investigations, and 2 Lunar Partial-Gravity Benchmarks (`FM2` & `LUCI`).
  - Enforces scientifically valid comparisons by locking side-by-side matrices within compatible experimental families (`SOLID_FLOW`, `DROPLET_COOL`, `GASEOUS_BURNER`, `SMOKE_AEROSOL`).
- **Simulation Arena (`/simulator`)**:
  - Dedicated reduced-order parametric cabin model with explicitly documented physical assumptions, governing equations (`ppO₂ = X_O₂ · P_tot`, mixed-convection + ion-wind slip velocity quadrature), and validity bounds.
- **ISS Hardware Racks (`/hardware`) & Spaceflight Fire Forensics (`/resources`)**:
  - Interactive 3D assemblies of the Combustion Integrated Rack (`CIR`), Multi-user Droplet Combustion Apparatus (`MDCA`), and Microgravity Science Glovebox (`MSG`), alongside forensic timelines of Apollo 1, Apollo 13, Space Station Mir, and verified terrestrial NASA Spin-Off technologies.

---

## Repository Structure

- `app/` — Next.js 15 App Router pages and server-side SI API routes (`app/api/si/chat/route.ts` and `app/api/si-synthesis/route.ts`).
- `frontend/` — Reusable UI components (`AppShell`, `SiChatbotDrawer`, `ThreeFlameChamber`, `ThreeHardwareRacks`, `AstroFlameLogo`, `FirebaseConfigModal`) and global state context (`astroflame-context.tsx`).
- `backend/` — NASA PSI dataset catalog & empirical telemetry profiles (`psi-datasets.ts`), Gemini 4 Hydrogen (`gemini-4-hydrogen`) SI Synthesis & Copilot Engine (`si-synthesis-engine.ts`), and Firebase Authentication + Cloud Firestore client (`firebase.ts`).
- `public/assets/brand/` — Brand emblem and static assets.

---

## Local Development & Environment Variables (`.env.local`)

`.env` and `.env.local` are excluded via `.gitignore` so secret API keys are never committed to GitHub. To run locally with live **Gemini 4 Hydrogen (`gemini-4-hydrogen`)** responses:

```bash
cp .env.example .env.local
# Edit .env.local and set GEMINI_API_KEY="your_gemini_api_key"
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Deployment (Render / Vercel / Cloud Run)

Because AstroFlame uses **Next.js App Router**, the frontend UI and backend API routes (`/api/si/chat` and `/api/si-synthesis`) run together inside a **single unified Web Service**—no separate backend deployment is required:

1. Create a single **Web Service** on Render (or import into Vercel) connected to this GitHub repository.
2. Build Command: `npm install && npm run build`
3. Start Command: `npm run start`
4. Add `GEMINI_API_KEY` under the service's **Environment Variables** settings.
