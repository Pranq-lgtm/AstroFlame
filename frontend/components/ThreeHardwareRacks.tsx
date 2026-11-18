'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, RotateCcw, Layers, Cpu } from 'lucide-react';
import { useAstroFlame } from '@/frontend/context/astroflame-context';

export type HardwareRackType = 'CIR' | 'MSG';

export interface SubsystemSpec {
  id: string;
  rack: HardwareRackType;
  name: string;
  code: string;
  investigations: string[];
  telemetrySpec: string;
  description: string;
  safetyFunction: string;
}

export const HARDWARE_SUBSYSTEMS: SubsystemSpec[] = [
  {
    id: 'cir-chamber-100l',
    rack: 'CIR',
    name: '100-Liter Stainless Pressure Vessel & Optical Carousel',
    code: 'CIR-PV-100L',
    investigations: ['FLEX (PSI-69)', 'ACME BRE', 'ACME CFI-G (PSI-159)', 'ACME E-FIELD', 'FLEX-2', 'CFI'],
    telemetrySpec: '0.5–3.0 atm (7.3–44.1 psia) • Up to 85% O₂ (CFI-G) • 8 Sapphire Windows',
    description:
      'Hermetically sealed 100-liter cylindrical combustion chamber mounted inside an International Standard Payload Rack (ISPR) in the ISS Destiny Lab, surrounded by an optical diagnostic carousel.',
    safetyFunction:
      'Provides triple-containment pressure and oxidizer isolation, enabling safe testing of up to 85% O₂ atmospheres and 500–1000 K cool flames without crew cabin exposure.',
  },
  {
    id: 'cir-mdca',
    rack: 'CIR',
    name: 'Multi-user Droplet Combustion Apparatus (MDCA)',
    code: 'CIR-MDCA-01',
    investigations: ['FLEX (PSI-69)', 'FLEX-2', 'FLEX-2J', 'FLEX-ICE-GA', 'CFI'],
    telemetrySpec: '1.19–3.98 mm Free/SiC-Tethered Droplets • Dual Piezo Needles + Hot-Wire Igniters',
    description:
      'Automated droplet deployment and opposing-needle retraction insert inside CIR that dispenses precise liquid hydrocarbon or methanol droplets into quiescent microgravity.',
    safetyFunction:
      'Discovered radiative extinction and two-stage 500–1000 K cool-flame vapor clouds across pure and binary fuel droplets under CO₂, He, and N₂ dilution.',
  },
  {
    id: 'cir-acme-efield',
    rack: 'CIR',
    name: 'ACME Porous Burner & ±10 kV E-FIELD Electrode Mesh',
    code: 'CIR-ACME-HV10',
    investigations: ['ACME BRE', 'ACME E-FIELD', 'ACME CFI-G (PSI-159)', 'ACME s-Flame', 'ACME CLD'],
    telemetrySpec: '±10,000 V DC Mesh at 35–50 mm • Heat-Flux Feedback Burner • 24-Bit Ion Current Sensor',
    description:
      'Interchangeable gaseous burner insert supporting porous spherical/planar BRE burners and a translation-stage high-voltage electrode mesh.',
    safetyFunction:
      'Accelerates chemi-ions (H₃O⁺, CHO⁺) into an electrostatic ion-driven wind that mimics Lunar (0.16g) and Martian (0.38g) buoyancy in orbit and suppresses soot by >75%.',
  },
  {
    id: 'msg-flow-duct',
    rack: 'MSG',
    name: 'MSG Modular Fan-Driven Low-Velocity Flow Duct',
    code: 'MSG-DUCT-76',
    investigations: ['BASS-II (PSI-25)', 'BASS (PSI-26)', 'BASS-M (Milliken 44)', 'SPICE (PSI-60)', 'SLICE (PSI-107)'],
    telemetrySpec: '7.6 × 7.6 cm Test Section • 0.0–50.0 cm/s Laminar Flow • N₂ Suppressant Jet Port',
    description:
      'Compact wind-tunnel insert housed inside the 255-liter Microgravity Science Glovebox (MSG) work volume, using a calibrated variable-speed DC fan and honeycomb flow straighteners.',
    safetyFunction:
      'Proved in BASS-II that 0.5–5.0 cm/s ventilation allows solids to burn at lower O₂ limits than in 1g, and that thick PMMA spheres survive N₂ jets until HVAC flow is cut to 0 cm/s.',
  },
  {
    id: 'msg-same-tem',
    rack: 'MSG',
    name: 'SAME Pyrolysis Hotwire & TEM Thermophoretic Smoke Samplers',
    code: 'MSG-SAME-TEM',
    investigations: ['SAME (PSI-102)', 'SAME-R (PSI-101)', 'DAFT', 'DAFT-2'],
    telemetrySpec: '0.02–10 μm Aerosol Sizing • Thermophoretic Copper TEM Grids • 3-Channel Ion/Laser Bridge',
    description:
      'Ages and samples non-flaming pyrolysis smoke from Kapton, Teflon, silicone, and cellulose in controlled low-speed air ducts inside MSG.',
    safetyFunction:
      'Demonstrated microgravity smoke coagulation into larger droplets (CMD 0.35–1.2 μm), establishing calibration curves for Orion and Lunar Gateway laser smoke detectors.',
  },
];

// Reusable module-scope scratch objects
const _mat4 = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _xAxis = new THREE.Vector3(1, 0, 0);
const _defaultRackTarget = new THREE.Vector3(0, 1.3, 0);
const _rackBgDark = new THREE.Color(0x050814);
const _rackBgLight = new THREE.Color(0xe8eff7);
const _rackHemiSkyDark = new THREE.Color(0x38bdf8);
const _rackHemiGroundDark = new THREE.Color(0x0f172a);
const _rackHemiSkyLight = new THREE.Color(0xffffff);
const _rackHemiGroundLight = new THREE.Color(0xcbd5e1);
const _rackFrameDark = new THREE.Color(0x1e293b);
const _rackFrameLight = new THREE.Color(0x475569);

function createRackFloorGridTexture(maxAnisotropy: number, isLight: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = isLight ? '#eef3f9' : '#070b19';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.10)' : 'rgba(56, 189, 248, 0.14)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 512; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  ctx.strokeStyle = isLight ? 'rgba(2, 132, 199, 0.28)' : 'rgba(56, 189, 248, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 510, 510);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

interface ThreeHardwareRacksProps {
  activeRack: HardwareRackType;
  onSelectRack: (rack: HardwareRackType) => void;
  selectedSubsystemId: string;
  onSelectSubsystem: (id: string) => void;
}

export default function ThreeHardwareRacks({
  activeRack,
  onSelectRack,
  selectedSubsystemId,
  onSelectSubsystem,
}: ThreeHardwareRacksProps) {
  const { theme } = useAstroFlame();
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const [explodedFactor, setExplodedFactor] = useState<number>(0.25);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);

  const activeRackRef = useRef<HardwareRackType>(activeRack);
  const explodedRef = useRef<number>(explodedFactor);
  const themeRef = useRef(theme);
  const resetCamRef = useRef<boolean>(false);

  useEffect(() => {
    activeRackRef.current = activeRack;
  }, [activeRack]);

  useEffect(() => {
    explodedRef.current = explodedFactor;
  }, [explodedFactor]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 480;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const initialLight = themeRef.current === 'light';
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(initialLight ? 0xe8eff7 : 0x050814);
    scene.fog = new THREE.FogExp2(initialLight ? 0xe8eff7 : 0x050814, initialLight ? 0.03 : 0.045);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(3.2, 2.6, 5.8);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.3, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.minDistance = 2.8;
    controls.maxDistance = 12.0;
    controls.update();

    const hemiLight = new THREE.HemisphereLight(
      initialLight ? 0xffffff : 0x38bdf8,
      initialLight ? 0xcbd5e1 : 0x0f172a,
      initialLight ? 1.35 : 0.85
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e4, initialLight ? 2.6 : 2.3);
    keyLight.position.set(5, 8, 6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.camera.left = -5;
    keyLight.shadow.camera.right = 5;
    keyLight.shadow.camera.top = 5;
    keyLight.shadow.camera.bottom = -5;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(initialLight ? 0x0284c7 : 0x6366f1, initialLight ? 1.1 : 1.4);
    rimLight.position.set(-5, 4, -5);
    scene.add(rimLight);

    // Materials
    const matRackFrame = new THREE.MeshStandardMaterial({
      color: initialLight ? 0x475569 : 0x1e293b,
      roughness: 0.52,
      metalness: 0.75,
    });
    const matStainlessVessel = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      roughness: 0.16,
      metalness: 0.94,
      clearcoat: 0.5,
    });
    const matAnodizedBlue = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.38,
      metalness: 0.82,
    });
    const matCopperHV = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.95,
      emissive: new THREE.Color(0x9333ea),
      emissiveIntensity: 0.35,
    });
    const matOpticalGlass = new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd,
      roughness: 0.05,
      metalness: 0.0,
      transmission: isSoftwareGl ? 0 : 0.9,
      transparent: true,
      opacity: isSoftwareGl ? 0.28 : 1.0,
      ior: 1.65,
      depthWrite: false,
    });

    // Floor Grid (Pre-built Dark & Light Studio Textures)
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const rackGridDark = createRackFloorGridTexture(maxAniso, false);
    const rackGridLight = createRackFloorGridTexture(maxAniso, true);
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      map: initialLight ? rackGridLight : rackGridDark,
      roughness: initialLight ? 0.85 : 0.78,
      metalness: initialLight ? 0.08 : 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Group 1: CIR (Combustion Integrated Rack) — 8 distinct parts
    const cirGroup = new THREE.Group();
    scene.add(cirGroup);

    // CIR Part 1: ISPR Base Deck & Bowed Frame Rails
    const cirBase = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 1.8), matRackFrame);
    cirBase.position.y = 0.09;
    cirBase.castShadow = true;
    cirBase.receiveShadow = true;
    cirGroup.add(cirBase);

    // CIR Part 2: 100-Liter Cylindrical Combustion Chamber Core
    const cirVessel = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 1.35, 36), matStainlessVessel);
    cirVessel.position.set(0, 1.35, 0);
    cirVessel.castShadow = true;
    cirGroup.add(cirVessel);

    // CIR Part 3: Front Autolatch Pressure Door (Explodes forward along +Z)
    const cirDoorGroup = new THREE.Group();
    cirDoorGroup.position.set(0, 1.35, 0.72);
    const doorFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.12, 32), matAnodizedBlue);
    doorFlange.rotation.x = Math.PI / 2;
    cirDoorGroup.add(doorFlange);
    const sapphirePort = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.15, 24), matOpticalGlass);
    sapphirePort.rotation.x = Math.PI / 2;
    sapphirePort.renderOrder = 4;
    cirDoorGroup.add(sapphirePort);
    cirGroup.add(cirDoorGroup);

    // CIR Part 4: MDCA / ACME Internal Burner & ±10 kV E-FIELD Insert (Explodes upward along +Y)
    const cirInsertGroup = new THREE.Group();
    cirInsertGroup.position.set(0, 1.35, 0);
    const burnerStem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.65, 24), matStainlessVessel);
    cirInsertGroup.add(burnerStem);
    const hvMeshTorus = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.025, 16, 36), matCopperHV);
    hvMeshTorus.rotation.x = Math.PI / 2;
    hvMeshTorus.position.y = 0.28;
    cirInsertGroup.add(hvMeshTorus);
    const flameCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.85,
      })
    );
    flameCore.position.y = 0.08;
    cirInsertGroup.add(flameCore);
    cirGroup.add(cirInsertGroup);

    // CIR Part 5 & 6: Left & Right Optical Diagnostics Pods (Nikon Pyrometer & UV Intensified CCD)
    const cirOpticsLeft = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.62), matAnodizedBlue);
    cirOpticsLeft.position.set(-1.05, 1.35, 0);
    cirGroup.add(cirOpticsLeft);

    const cirOpticsRight = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.62), matAnodizedBlue);
    cirOpticsRight.position.set(1.05, 1.35, 0);
    cirGroup.add(cirOpticsRight);

    // Group 2: MSG (Microgravity Science Glovebox) — 7 distinct parts
    const msgGroup = new THREE.Group();
    msgGroup.visible = false;
    scene.add(msgGroup);

    const msgBase = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.22, 1.7), matRackFrame);
    msgBase.position.y = 0.11;
    msgGroup.add(msgBase);

    // MSG 255-Liter Sealed Glovebox Work Volume
    const msgEnclosure = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.3), matOpticalGlass);
    msgEnclosure.position.set(0, 1.32, 0);
    msgEnclosure.renderOrder = 5;
    msgGroup.add(msgEnclosure);

    // MSG Modular Fan-Driven Flow Duct (BASS-II / SPICE / SLICE)
    const msgFlowDuct = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.42, 0.45), matAnodizedBlue);
    msgFlowDuct.position.set(0, 1.25, 0);
    msgGroup.add(msgFlowDuct);

    // MSG Front Glove Ports Cover (Explodes along +Z)
    const msgGlovePorts = new THREE.Group();
    msgGlovePorts.position.set(0, 1.32, 0.68);
    for (const xOff of [-0.52, 0.52]) {
      const portRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 16, 32), matStainlessVessel);
      portRing.position.x = xOff;
      msgGlovePorts.add(portRing);
    }
    msgGroup.add(msgGlovePorts);

    // MSG Top SAME TEM Aerosol Sampler Module (Explodes along +Y)
    const msgSameSampler = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.35, 24), matCopperHV);
    msgSameSampler.position.set(0, 2.02, 0);
    msgGroup.add(msgSameSampler);

    // 28 Instanced Structural Fasteners across rack frame
    const fastenerGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.04, 6);
    const fasteners = new THREE.InstancedMesh(fastenerGeo, matStainlessVessel, 28);
    for (let i = 0; i < 28; i++) {
      const side = i < 14 ? -1.02 : 1.02;
      const yPos = 0.25 + (i % 14) * 0.16;
      _pos.set(side, yPos, 0.85);
      _quat.setFromAxisAngle(_xAxis, Math.PI / 2);
      _scale.setScalar(1);
      _mat4.compose(_pos, _quat, _scale);
      fasteners.setMatrixAt(i, _mat4);
    }
    fasteners.instanceMatrix.needsUpdate = true;
    fasteners.computeBoundingSphere();
    scene.add(fasteners);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let dampedExplode = explodedRef.current;
    let lastFrameTimeMs = performance.now();
    const startTimeMs = lastFrameTimeMs;
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    let prevAppliedLight: boolean | null = null;

    function tick() {
      if (disposed) return;
      const nowMs = performance.now();
      const delta = Math.min(Math.max((nowMs - lastFrameTimeMs) / 1000, 0.001), 0.1);
      lastFrameTimeMs = nowMs;
      const elapsed = (nowMs - startTimeMs) / 1000;

      const isLight = themeRef.current === 'light';
      if (prevAppliedLight !== isLight) {
        prevAppliedLight = isLight;
        floorMat.map = isLight ? rackGridLight : rackGridDark;
        floorMat.roughness = isLight ? 0.85 : 0.78;
        floorMat.metalness = isLight ? 0.08 : 0.2;
        floorMat.needsUpdate = true;

        (flameCore.material as THREE.MeshBasicMaterial).color.setHex(
          isLight ? 0x0284c7 : 0x38bdf8
        );
        renderer.toneMappingExposure = isLight ? 1.04 : 1.15;
      }

      const bgColor = scene.background as THREE.Color;
      bgColor.lerp(isLight ? _rackBgLight : _rackBgDark, 1 - Math.exp(-8 * delta));
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(bgColor);
        scene.fog.density = THREE.MathUtils.damp(scene.fog.density, isLight ? 0.028 : 0.045, 6, delta);
      }
      hemiLight.color.lerp(isLight ? _rackHemiSkyLight : _rackHemiSkyDark, 1 - Math.exp(-8 * delta));
      hemiLight.groundColor.lerp(isLight ? _rackHemiGroundLight : _rackHemiGroundDark, 1 - Math.exp(-8 * delta));
      hemiLight.intensity = THREE.MathUtils.damp(hemiLight.intensity, isLight ? 1.35 : 0.85, 6, delta);
      keyLight.intensity = THREE.MathUtils.damp(keyLight.intensity, isLight ? 2.6 : 2.3, 6, delta);
      matRackFrame.color.lerp(isLight ? _rackFrameLight : _rackFrameDark, 1 - Math.exp(-8 * delta));

      if (resetCamRef.current) {
        camera.position.lerp(_pos.set(3.2, 2.6, 5.8), 1 - Math.exp(-8 * delta));
        controls.target.lerp(_defaultRackTarget, 1 - Math.exp(-8 * delta));
        if (camera.position.distanceTo(_pos) < 0.05) {
          resetCamRef.current = false;
        }
      }

      controls.update();

      const isCir = activeRackRef.current === 'CIR';
      cirGroup.visible = isCir;
      msgGroup.visible = !isCir;

      dampedExplode = THREE.MathUtils.damp(dampedExplode, explodedRef.current, 6.5, delta);

      // Apply smooth exploded-view offsets
      cirDoorGroup.position.z = 0.72 + dampedExplode * 1.15;
      cirInsertGroup.position.y = 1.35 + dampedExplode * 0.95;
      cirOpticsLeft.position.x = -1.05 - dampedExplode * 0.85;
      cirOpticsRight.position.x = 1.05 + dampedExplode * 0.85;

      msgGlovePorts.position.z = 0.68 + dampedExplode * 1.1;
      msgSameSampler.position.y = 2.02 + dampedExplode * 0.75;
      msgFlowDuct.position.x = -dampedExplode * 0.65;

      flameCore.scale.setScalar(1 + Math.sin(elapsed * 5.0) * 0.06);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    }

    tick();

    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 900;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      controls.dispose();
      rackGridDark.dispose();
      rackGridLight.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      renderer.dispose();
    };
  }, []);

  const subsystemsForRack = HARDWARE_SUBSYSTEMS.filter((s) => s.rack === activeRack);

  const explodePct = Math.round(explodedFactor * 100);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-sky-400/25 bg-white dark:bg-[#090d1e] shadow-sm">
      <div className="relative w-full h-[400px] sm:h-[450px] bg-[#e8eff7] dark:bg-[#050814]">
        <div ref={canvasMountRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

        {/* Top Overlay Badge */}
        <div className="pointer-events-none absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 z-10">
          <div className="pointer-events-auto bg-white/95 dark:bg-[#090d1e]/95 border border-slate-300 dark:border-slate-800 px-3.5 py-2 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-sky-700 dark:text-sky-400">
              <Cpu className="w-3.5 h-3.5" />
              <span>
                {activeRack === 'CIR'
                  ? 'ISS Combustion Integrated Rack (CIR • Destiny Lab)'
                  : 'ISS Microgravity Science Glovebox (MSG • 255-L Enclosed Work Volume)'}
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5 tabular-nums">
              Exploded Separation: {explodePct}% · Orbit/Zoom Enabled
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              resetCamRef.current = true;
            }}
            className="pointer-events-auto px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white/95 dark:bg-[#090d1e]/95 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            Reset Camera
          </button>
        </div>
      </div>

      {/* Dedicated Unobscured Hardware Controls Deck */}
      <div className="bg-slate-100/90 dark:bg-[#0b1124] border-t border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Rack Switcher */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onSelectRack('CIR');
                onSelectSubsystem('cir-chamber-100l');
              }}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeRack === 'CIR'
                  ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950 font-semibold'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700'
              }`}
            >
              CIR Rack (100-L / MDCA / ACME)
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectRack('MSG');
                onSelectSubsystem('msg-flow-duct');
              }}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeRack === 'MSG'
                  ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-950 font-semibold'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700'
              }`}
            >
              MSG Glovebox (BASS-II / SAME / SPICE)
            </button>
          </div>

          {/* Exploded View Slider */}
          <div className="flex items-center gap-3 min-w-[240px] flex-1 max-w-sm">
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1 whitespace-nowrap shrink-0">
              <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              Explode View:
            </span>
            <input
              type="range"
              aria-label="Explode Hardware Assembly"
              min={0}
              max={1}
              step={0.02}
              value={explodedFactor}
              onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
              style={{
                background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${explodePct}%, rgba(100,116,139,0.35) ${explodePct}%, rgba(100,116,139,0.35) 100%)`,
              }}
              className="w-full astro-range"
            />
            <span className="text-xs font-mono text-sky-700 dark:text-sky-300 font-bold tabular-nums w-10 text-right">
              {explodePct}%
            </span>
          </div>

          <button
            type="button"
            onClick={() => setDockCollapsed((prev) => !prev)}
            className="px-2.5 py-1 text-xs font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            {dockCollapsed ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Subsystems
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Minimize
              </>
            )}
          </button>
        </div>

        {/* Subsystem Selector Tabs */}
        {!dockCollapsed && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400 mr-1">
              Inspect Subsystem:
            </span>
            {subsystemsForRack.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  onSelectSubsystem(sub.id);
                  setExplodedFactor(0.55);
                }}
                className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedSubsystemId === sub.id
                    ? 'bg-sky-100 text-sky-800 border border-sky-500 dark:bg-slate-800 dark:text-sky-300 dark:border-sky-400/50 font-semibold'
                    : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-800'
                }`}
              >
                {sub.code}: {sub.name.split('&')[0].trim()}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
