'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RotateCcw, Sparkles, Camera, Cpu } from 'lucide-react';
import { type PsiDataset } from '@/backend/psi-datasets';

export type FlameProvenanceMode =
  | '3d_illustration'
  | 'psi_experimental'
  | 'validated_simulation';

export interface FlameChamberParams {
  gravityG: number;
  oxygenPercent: number;
  airflowCmPerSec: number;
  eFieldKv: number;
  coolFlameMode: boolean;
  provenanceMode?: FlameProvenanceMode;
  playbackTimeSec?: number;
}

interface ThreeFlameChamberProps {
  params: FlameChamberParams;
  onChangeParams: (next: FlameChamberParams) => void;
  activeDataset: PsiDataset;
  onSaveToSimulator?: (params: FlameChamberParams) => void;
}

// Module-scope reusable scratch math objects (Zero GC in render loop)
const _tempMatrix = new THREE.Matrix4();
const _tempPos = new THREE.Vector3();
const _tempScale = new THREE.Vector3();
const _tempQuat = new THREE.Quaternion();
const _tempColor = new THREE.Color();
const _targetColorInner = new THREE.Color();
const _targetColorOuter = new THREE.Color();
const _defaultOrbitTarget = new THREE.Vector3(0, 1.18, 0);

function createProceduralGridTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#060a17';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
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

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.38)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 510, 510);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 4);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 120);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function ThreeFlameChamber({
  params,
  onChangeParams,
  activeDataset,
  onSaveToSimulator,
}: ThreeFlameChamberProps) {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const paramsRef = useRef<FlameChamberParams>(params);
  const resetCameraTriggerRef = useRef<boolean>(false);

  const provenanceMode: FlameProvenanceMode =
    params.provenanceMode || '3d_illustration';

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // 1. Software WebGL detection from GPU renderer string
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 720;
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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050814);
    scene.fog = new THREE.FogExp2(0x050814, 0.042);

    // 2. Mandatory RoomEnvironment + PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 2.35, 7.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.18, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.minDistance = 3.6;
    controls.maxDistance = 13.0;
    controls.update();

    // 3. Balanced 3-Point Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.8);
    hemiLight.position.set(0, 12, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff3db, 2.2);
    keyLight.position.set(5.5, 8.5, 6.0);
    keyLight.castShadow = !isSoftwareGl;
    const d = 6;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x6366f1, 1.3);
    rimLight.position.set(-5.0, 4.5, -5.0);
    scene.add(rimLight);

    const flamePointLightLeft = new THREE.PointLight(0xf59e0b, 2.5, 6.5, 2.0);
    flamePointLightLeft.position.set(-1.85, 1.65, 0);
    scene.add(flamePointLightLeft);

    const flamePointLightRight = new THREE.PointLight(0x38bdf8, 2.9, 7.5, 2.0);
    flamePointLightRight.position.set(1.85, 1.55, 0);
    scene.add(flamePointLightRight);

    // 4. Optical Bench Floor & Contact Shadows
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const gridTex = createProceduralGridTexture(maxAniso);
    const shadowTex = createContactShadowTexture();

    const floorGeo = new THREE.PlaneGeometry(18, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      map: gridTex,
      roughness: 0.72,
      metalness: 0.25,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Shared PBR Materials
    const matAnodizedBase = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.48,
      metalness: 0.82,
    });
    const matBrushedSteel = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      roughness: 0.18,
      metalness: 0.94,
      clearcoat: 0.45,
    });
    const matSinteredBronze = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.65,
      metalness: 0.72,
    });
    const matCeramicInsulator = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.24,
      metalness: 0.08,
    });
    const matCopperElectrode = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      roughness: 0.22,
      metalness: 0.95,
      emissive: new THREE.Color(0x4f46e5),
      emissiveIntensity: 0.15,
    });
    const matSapphireShroud = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      roughness: 0.06,
      metalness: 0.0,
      transmission: isSoftwareGl ? 0 : 0.88,
      transparent: true,
      opacity: isSoftwareGl ? 0.24 : 1.0,
      ior: 1.76,
      thickness: 0.35,
      depthWrite: false,
    });

    // Helper to build a 9-part Composite Burner Rig (THREE.Group) pivoted at y = 0
    function createBurnerRigGroup(xOffset: number, includeEFieldRig: boolean, boxColorHex: number) {
      const group = new THREE.Group();
      group.position.set(xOffset, 0, 0);

      // Contact shadow plane at y = 0.015
      const shadowGeo = new THREE.PlaneGeometry(3.1, 3.1);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = 0.015;
      group.add(shadowPlane);

      // Part 1: Stepped Optical Base Pedestal
      const basePoints = [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(1.02, 0.0),
        new THREE.Vector2(1.02, 0.14),
        new THREE.Vector2(0.84, 0.18),
        new THREE.Vector2(0.84, 0.32),
        new THREE.Vector2(0.42, 0.38),
        new THREE.Vector2(0.0, 0.38),
      ];
      const baseGeo = new THREE.LatheGeometry(basePoints, 36);
      const baseMesh = new THREE.Mesh(baseGeo, matAnodizedBase);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      // Part 2: Coflow Collar
      const collarGeo = new THREE.CylinderGeometry(0.68, 0.72, 0.16, 32);
      const collarMesh = new THREE.Mesh(collarGeo, matBrushedSteel);
      collarMesh.position.y = 0.44;
      collarMesh.castShadow = true;
      group.add(collarMesh);

      // Part 3: Stainless Fuel Feed Stem
      const stemPoints = [
        new THREE.Vector2(0.0, 0.48),
        new THREE.Vector2(0.14, 0.48),
        new THREE.Vector2(0.11, 0.75),
        new THREE.Vector2(0.08, 1.08),
        new THREE.Vector2(0.0, 1.08),
      ];
      const stemGeo = new THREE.LatheGeometry(stemPoints, 24);
      const stemMesh = new THREE.Mesh(stemGeo, matBrushedSteel);
      stemMesh.castShadow = true;
      group.add(stemMesh);

      // Part 4: Sintered Bronze Porous Spherical Burner Matrix
      const porousSphereGeo = new THREE.SphereGeometry(0.21, 32, 24);
      const porousSphereMesh = new THREE.Mesh(porousSphereGeo, matSinteredBronze);
      porousSphereMesh.position.y = 1.22;
      porousSphereMesh.castShadow = true;
      group.add(porousSphereMesh);

      // Part 5: Igniter / Thermocouple Probe Arm
      const tcCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.55, 0.45, 0.2),
        new THREE.Vector3(0.52, 1.15, 0.15),
        new THREE.Vector3(0.32, 1.38, 0.05),
      ]);
      const tcGeo = new THREE.TubeGeometry(tcCurve, 20, 0.018, 8, false);
      const tcMesh = new THREE.Mesh(tcGeo, matBrushedSteel);
      group.add(tcMesh);

      // Part 6: Optical Sapphire Cylindrical Containment Window
      const shroudGeo = new THREE.CylinderGeometry(0.95, 0.95, 2.35, 36, 1, true);
      const shroudMesh = new THREE.Mesh(shroudGeo, matSapphireShroud);
      shroudMesh.position.y = 1.35;
      shroudMesh.renderOrder = 5;
      group.add(shroudMesh);

      // Part 7: Top Retainer Ring
      const topRingGeo = new THREE.TorusGeometry(0.95, 0.035, 16, 48);
      const topRingMesh = new THREE.Mesh(topRingGeo, matAnodizedBase);
      topRingMesh.rotation.x = Math.PI / 2;
      topRingMesh.position.y = 2.52;
      group.add(topRingMesh);

      // Part 8: Scientific Wireframe Measurement Bounding Cage (Matching Dashboard_UI)
      const cageGeo = new THREE.BoxGeometry(1.12, 1.65, 1.12);
      const cageEdges = new THREE.EdgesGeometry(cageGeo);
      const cageMat = new THREE.LineBasicMaterial({
        color: boxColorHex,
        transparent: true,
        opacity: 0.48,
      });
      const cageLines = new THREE.LineSegments(cageEdges, cageMat);
      cageLines.position.y = 1.48;
      group.add(cageLines);

      // Part 9: E-FIELD High-Voltage Mesh Ring
      let eFieldRingGroup: THREE.Group | null = null;
      if (includeEFieldRig) {
        eFieldRingGroup = new THREE.Group();
        eFieldRingGroup.position.y = 2.02;

        const hvTorusGeo = new THREE.TorusGeometry(0.52, 0.025, 16, 40);
        const hvTorus = new THREE.Mesh(hvTorusGeo, matCopperElectrode);
        hvTorus.rotation.x = Math.PI / 2;
        eFieldRingGroup.add(hvTorus);

        for (let i = -3; i <= 3; i++) {
          const halfChord = Math.sqrt(Math.max(0.01, 0.52 * 0.52 - (i * 0.13) ** 2));
          const wireGeo = new THREE.CylinderGeometry(0.006, 0.006, halfChord * 2, 6);
          const wireX = new THREE.Mesh(wireGeo, matCopperElectrode);
          wireX.rotation.z = Math.PI / 2;
          wireX.position.z = i * 0.13;
          eFieldRingGroup.add(wireX);
        }

        for (const sign of [-1, 1]) {
          const postGeo = new THREE.CylinderGeometry(0.03, 0.04, 1.65, 16);
          const postMesh = new THREE.Mesh(postGeo, matCeramicInsulator);
          postMesh.position.set(sign * 0.68, -0.78, 0);
          eFieldRingGroup.add(postMesh);
        }

        group.add(eFieldRingGroup);
      }

      return { group, eFieldRingGroup, cageMat };
    }

    const leftRig = createBurnerRigGroup(-1.85, false, 0xf59e0b);
    const rightRig = createBurnerRigGroup(1.85, true, 0x38bdf8);
    scene.add(leftRig.group);
    scene.add(rightRig.group);

    // 5. Instanced Hex Bolts across both rigs (24 instances)
    const boltGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.05, 6);
    const boltInstances = new THREE.InstancedMesh(boltGeo, matBrushedSteel, 24);
    let boltIdx = 0;
    for (const xCenter of [-1.85, 1.85]) {
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        _tempPos.set(xCenter + Math.cos(angle) * 0.9, 0.16, Math.sin(angle) * 0.9);
        _tempQuat.identity();
        _tempScale.set(1, 1, 1);
        _tempMatrix.compose(_tempPos, _tempQuat, _tempScale);
        boltInstances.setMatrixAt(boltIdx++, _tempMatrix);
      }
    }
    boltInstances.instanceMatrix.needsUpdate = true;
    boltInstances.computeBoundingSphere();
    scene.add(boltInstances);

    // 6. Volumetric Multi-Layer Flame Envelopes
    const flameSphereGeoLeft = new THREE.SphereGeometry(0.32, 48, 36);
    const basePosLeft = Float32Array.from(flameSphereGeoLeft.attributes.position.array);

    const matFlameInnerLeft = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      emissive: new THREE.Color(0xea580c),
      emissiveIntensity: 2.3,
      roughness: 0.2,
      metalness: 0.0,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const matFlameOuterLeft = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: new THREE.Color(0xf59e0b),
      emissiveIntensity: 1.15,
      roughness: 0.3,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const flameInnerLeft = new THREE.Mesh(flameSphereGeoLeft, matFlameInnerLeft);
    flameInnerLeft.position.set(-1.85, 1.24, 0);
    flameInnerLeft.renderOrder = 3;
    scene.add(flameInnerLeft);

    const flameOuterLeft = new THREE.Mesh(flameSphereGeoLeft.clone(), matFlameOuterLeft);
    flameOuterLeft.position.set(-1.85, 1.24, 0);
    flameOuterLeft.scale.set(1.18, 1.18, 1.18);
    flameOuterLeft.renderOrder = 4;
    scene.add(flameOuterLeft);

    // Right Interactive Flame
    const flameSphereGeoRight = new THREE.SphereGeometry(0.37, 48, 36);
    const basePosRight = Float32Array.from(flameSphereGeoRight.attributes.position.array);

    const matFlameInnerRight = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: new THREE.Color(0x0284c7),
      emissiveIntensity: 2.5,
      roughness: 0.15,
      metalness: 0.0,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const matFlameOuterRight = new THREE.MeshPhysicalMaterial({
      color: 0x6366f1,
      emissive: new THREE.Color(0x38bdf8),
      emissiveIntensity: 1.4,
      roughness: 0.25,
      transparent: true,
      opacity: 0.44,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const flameInnerRight = new THREE.Mesh(flameSphereGeoRight, matFlameInnerRight);
    flameInnerRight.position.set(1.85, 1.22, 0);
    flameInnerRight.renderOrder = 3;
    scene.add(flameInnerRight);

    const flameOuterRight = new THREE.Mesh(flameSphereGeoRight.clone(), matFlameOuterRight);
    flameOuterRight.position.set(1.85, 1.22, 0);
    flameOuterRight.scale.set(1.25, 1.25, 1.25);
    flameOuterRight.renderOrder = 4;
    scene.add(flameOuterRight);

    // 7. Instanced Soot & Chemi-Ion Stream Particles (64 instances)
    const particleCount = 64;
    const particleGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particleInstanced = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
    particleInstanced.frustumCulled = false;
    scene.add(particleInstanced);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let dampedGravity = paramsRef.current.gravityG;
    let dampedO2 = paramsRef.current.oxygenPercent;
    let dampedFlow = paramsRef.current.airflowCmPerSec;
    let dampedEField = paramsRef.current.eFieldKv;

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

    function deformFlameGeometry(
      geo: THREE.BufferGeometry,
      basePositions: Float32Array,
      time: number,
      buoyancyStretch: number,
      flowSkewX: number,
      flickerAmp: number,
      radiusScale: number
    ) {
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const count = posAttr.count;

      for (let i = 0; i < count; i++) {
        const ix = i * 3;
        const bx = basePositions[ix];
        const by = basePositions[ix + 1];
        const bz = basePositions[ix + 2];

        const normY = THREE.MathUtils.clamp((by + 0.36) / 0.72, 0, 1);
        const pinch = 1.0 - normY * normY * THREE.MathUtils.clamp(buoyancyStretch * 0.68, 0, 0.82);
        const verticalStretch = 1.0 + normY * buoyancyStretch * 1.45;

        const wave =
          Math.sin(time * 7.5 + normY * 6.0 + bx * 4.0) *
          flickerAmp *
          Math.pow(normY, 1.3);

        arr[ix] = bx * pinch * radiusScale + normY * normY * flowSkewX + wave;
        arr[ix + 1] = by * verticalStretch * radiusScale + Math.max(0, normY * buoyancyStretch * 0.28);
        arr[ix + 2] = bz * pinch * radiusScale + wave * 0.5;
      }
      posAttr.needsUpdate = true;
      geo.computeVertexNormals();
    }

    function tick() {
      if (disposed) return;
      const nowMs = performance.now();
      const delta = Math.min(Math.max((nowMs - lastFrameTimeMs) / 1000, 0.001), 0.1);
      lastFrameTimeMs = nowMs;
      const elapsed = (nowMs - startTimeMs) / 1000;

      if (resetCameraTriggerRef.current) {
        camera.position.lerp(_tempPos.set(0, 2.35, 7.2), 1 - Math.exp(-8 * delta));
        controls.target.lerp(_defaultOrbitTarget, 1 - Math.exp(-8 * delta));
        if (camera.position.distanceTo(_tempPos) < 0.05) {
          resetCameraTriggerRef.current = false;
        }
      }

      controls.update();

      const target = paramsRef.current;
      const activeMode = target.provenanceMode || '3d_illustration';

      // Toggle wireframe overlay for Validated Reduced-Order Simulation mode
      const isWireframeSim = activeMode === 'validated_simulation';
      matFlameOuterLeft.wireframe = isWireframeSim;
      matFlameOuterRight.wireframe = isWireframeSim;
      leftRig.cageMat.opacity = activeMode === 'psi_experimental' ? 0.85 : isWireframeSim ? 0.7 : 0.42;
      rightRig.cageMat.opacity = activeMode === 'psi_experimental' ? 0.85 : isWireframeSim ? 0.7 : 0.42;

      dampedGravity = THREE.MathUtils.damp(dampedGravity, target.gravityG, 6.0, delta);
      dampedO2 = THREE.MathUtils.damp(dampedO2, target.oxygenPercent, 6.0, delta);
      dampedFlow = THREE.MathUtils.damp(dampedFlow, target.airflowCmPerSec, 6.0, delta);
      dampedEField = THREE.MathUtils.damp(dampedEField, target.eFieldKv, 6.0, delta);

      // Playback time modulation (0s..300s)
      const pbSec = target.playbackTimeSec ?? 120;
      const pbScale =
        pbSec < 15
          ? 0.45 + (pbSec / 15) * 0.55
          : pbSec > 265
          ? Math.max(0.35, 1.0 - (pbSec - 265) / 50)
          : 1.0;

      // Deform Left 1.00g Earth Reference Teardrop Flame
      deformFlameGeometry(flameSphereGeoLeft, basePosLeft, elapsed, 1.18, 0.02, 0.035, pbScale);
      flamePointLightLeft.intensity = (2.2 + Math.sin(elapsed * 11.0) * 0.25) * pbScale;

      // Compute Right Interactive Flame Physics
      const eFieldEquivBuoyancy = (dampedEField / 10.0) * 0.55;
      const effectiveStretch = Math.max(0.0, dampedGravity * 1.15 + eFieldEquivBuoyancy);
      const flowSkew = (dampedFlow / 20.0) * 0.34;
      const flicker = 0.004 + dampedGravity * 0.028 + Math.abs(dampedEField) * 0.0015;
      const o2RadiusScale = THREE.MathUtils.mapLinear(dampedO2, 15, 85, 0.82, 1.38) * pbScale;

      deformFlameGeometry(
        flameSphereGeoRight,
        basePosRight,
        elapsed,
        effectiveStretch,
        flowSkew,
        flicker,
        o2RadiusScale
      );

      const isCoolStage = target.coolFlameMode || (pbSec >= 155 && pbSec <= 260 && target.gravityG <= 0.16);

      if (isCoolStage) {
        _targetColorInner.setHex(0xa855f7);
        _targetColorOuter.setHex(0x6366f1);
        matFlameInnerRight.emissiveIntensity = 1.7 + Math.sin(elapsed * 4.0) * 0.25;
      } else if (activeMode === 'psi_experimental') {
        // Calibrated Nikon DSLR Pyrometry & Intensified CCD False-Color Palette
        _targetColorInner.setHex(0x38bdf8);
        _targetColorOuter.setHex(0xf59e0b);
        matFlameInnerRight.emissiveIntensity = 2.6;
      } else {
        const sootFactor = THREE.MathUtils.clamp(
          dampedGravity * 0.75 + Math.max(0, (dampedO2 - 28) / 45) - Math.max(0, dampedEField * 0.06),
          0,
          1
        );
        _targetColorInner.setHex(0x38bdf8).lerp(_tempColor.setHex(0xf59e0b), sootFactor);
        _targetColorOuter.setHex(0x2563eb).lerp(_tempColor.setHex(0xea580c), sootFactor * 0.8);
        matFlameInnerRight.emissiveIntensity = 2.3 + (dampedO2 / 85) * 1.2;
      }

      matFlameInnerRight.color.lerp(_targetColorInner, 1 - Math.exp(-8 * delta));
      matFlameInnerRight.emissive.lerp(_targetColorInner, 1 - Math.exp(-8 * delta));
      matFlameOuterRight.color.lerp(_targetColorOuter, 1 - Math.exp(-8 * delta));
      matFlameOuterRight.emissive.lerp(_targetColorOuter, 1 - Math.exp(-8 * delta));
      flamePointLightRight.color.copy(matFlameInnerRight.color);
      flamePointLightRight.intensity = (isCoolStage ? 1.5 : 2.6 + (dampedO2 / 85) * 1.4) * pbScale;

      if (rightRig.eFieldRingGroup) {
        matCopperElectrode.emissiveIntensity = 0.15 + (Math.abs(dampedEField) / 10) * 1.6;
      }

      // Update 64 Instanced Soot & Ion Stream Particles
      for (let i = 0; i < particleCount; i++) {
        const isLeft = i < 24;
        const localIdx = isLeft ? i : i - 24;
        const totalForSide = isLeft ? 24 : 40;
        const phase = ((elapsed * (isLeft ? 0.85 : 0.45 + effectiveStretch * 0.4) + localIdx / totalForSide) % 1.0);
        const angle = localIdx * 2.39996 + elapsed * 0.6;
        const radial = isLeft
          ? 0.16 * (1 - phase * 0.6)
          : 0.36 * o2RadiusScale * (1 - phase * 0.25 * Math.min(1, effectiveStretch));

        const xBase = isLeft ? -1.85 : 1.85;
        const xDrift = isLeft ? 0 : phase * flowSkew * 1.3;
        const yRise = isLeft
          ? 1.24 + phase * 1.05
          : 1.22 + (effectiveStretch > 0.08 ? phase * (0.55 + effectiveStretch * 0.65) : Math.sin(angle * 2) * 0.46);

        _tempPos.set(
          xBase + Math.cos(angle) * radial + xDrift,
          yRise,
          Math.sin(angle) * radial
        );
        const s = (1.0 - Math.abs(phase - 0.5) * 1.5) * (isLeft ? 0.95 : 1.2);
        _tempScale.setScalar(Math.max(0.15, s));
        _tempQuat.identity();
        _tempMatrix.compose(_tempPos, _tempQuat, _tempScale);
        particleInstanced.setMatrixAt(i, _tempMatrix);

        if (isLeft) {
          _tempColor.setHex(0xf59e0b);
        } else if (isCoolStage) {
          _tempColor.setHex(0xa855f7);
        } else {
          _tempColor.copy(matFlameInnerRight.color);
        }
        particleInstanced.setColorAt(i, _tempColor);
      }
      particleInstanced.instanceMatrix.needsUpdate = true;
      if (particleInstanced.instanceColor) particleInstanced.instanceColor.needsUpdate = true;

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
      const w = container.clientWidth || 720;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      controls.dispose();
      gridTex.dispose();
      shadowTex.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      renderer.dispose();
    };
  }, []);

  const gravityLabel =
    params.gravityG === 0
      ? '0.00g ISS Orbital Freefall'
      : params.gravityG <= 0.18
      ? '0.16g Lunar Surface (FM2/LUCI)'
      : params.gravityG <= 0.42
      ? '0.38g Martian Surface'
      : '1.00g Earth Sea-Level';

  const provenanceMeta = {
    '3d_illustration': {
      badge: 'MODE 1 · 3D PHYSICS ILLUSTRATION',
      title: 'Interactive Three.js Buoyancy vs. Spherical Diffusion Illustration',
      desc: 'Visualizes how 1.00g natural buoyancy pinches hot products into an upward soot teardrop, while 0.00g freefall eliminates Archimedes lift—creating a spherical diffusion flame governed by Fickian radial transport.',
      color: 'text-sky-300 border-sky-500/50 bg-sky-950/60',
    },
    psi_experimental: {
      badge: `MODE 2 · PSI EXPERIMENTAL VISUALIZATION (${activeDataset.psiId})`,
      title: `Calibrated Optical Diagnostic Overlay — ${activeDataset.shortTitle}`,
      desc: `Maps empirical ${activeDataset.facility} optical diagnostics (DOI: ${activeDataset.doi}, ${activeDataset.sampleCount} runs, Peak ${activeDataset.peakTempK}) with 2D color-ratio pyrometry & intensified-CCD radical reaction zone bounds.`,
      color: 'text-amber-300 border-amber-500/50 bg-amber-950/60',
    },
    validated_simulation: {
      badge: 'MODE 3 · VALIDATED REDUCED-ORDER SIMULATION',
      title: 'Spalding B-Number & Damköhler S-Curve Numerical Mesh',
      desc: `Displays the axisymmetric finite-volume control cage and reaction-sheet mesh validated against ${activeDataset.psiId} (${activeDataset.extinctionLimitLOI}).`,
      color: 'text-purple-300 border-purple-500/50 bg-purple-950/60',
    },
  }[provenanceMode];

  return (
    <div className="rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-[#050814] flex flex-col h-full shadow-lg">
      {/* Top Provenance Switcher Bar (Clearly Distinguishing Illustration vs Experimental vs Simulation) */}
      <div className="bg-[#080d1e] border-b border-slate-800 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            {
              id: '3d_illustration' as const,
              label: '3D Physics Illustration',
              icon: Sparkles,
            },
            {
              id: 'psi_experimental' as const,
              label: `PSI Experimental Overlay (${activeDataset.psiId})`,
              icon: Camera,
            },
            {
              id: 'validated_simulation' as const,
              label: 'Validated Simulation Mesh',
              icon: Cpu,
            },
          ].map((mode) => {
            const Icon = mode.icon;
            const active = provenanceMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onChangeParams({ ...params, provenanceMode: mode.id })}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  active
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400 font-semibold shadow-sm'
                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {mode.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              resetCameraTriggerRef.current = true;
            }}
            className="px-3 py-1 text-xs font-mono text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
            Reset Camera
          </button>
          {onSaveToSimulator && (
            <button
              type="button"
              onClick={() => onSaveToSimulator(params)}
              className="px-3 py-1 text-xs font-mono font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors whitespace-nowrap"
            >
              Save Snapshot
            </button>
          )}
        </div>
      </div>

      {/* Main 3D Optical Chamber Stage with Scientific Callouts (Matching Dashboard_UI) */}
      <div className="relative flex-1 min-h-[430px] sm:min-h-[480px] bg-[#050814]">
        <div ref={canvasMountRef} className="w-full h-full cursor-crosshair" />

        {/* Top-Left Telemetry Readout Box (Exact Dashboard_UI Match) */}
        <div className="pointer-events-none absolute top-3 left-3 right-3 flex flex-wrap items-start justify-between gap-2 z-10">
          <div className="bg-[#090e22]/90 border border-slate-700/80 px-3.5 py-2 rounded-lg backdrop-blur-sm max-w-xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-amber-400 font-semibold">
                LEFT RIG: 1.00g Buoyant Teardrop
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-cyan-400 font-semibold">
                RIGHT RIG: {gravityLabel}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[11px] font-mono tabular-nums text-slate-300">
              <span>
                O₂: <strong className="text-amber-300">{params.oxygenPercent.toFixed(0)}%</strong>
              </span>
              <span className="text-slate-600">·</span>
              <span>
                Duct Flow: <strong className="text-emerald-300">{params.airflowCmPerSec.toFixed(1)} cm/s</strong>
              </span>
              <span className="text-slate-600">·</span>
              <span>
                E-Regime:{' '}
                <strong className={params.coolFlameMode ? 'text-purple-300' : 'text-sky-300'}>
                  {params.coolFlameMode
                    ? 'Cool Flame NTC (500–1000 K)'
                    : `Hot Diffusion (${activeDataset.peakTempK})`}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Floating Chamber Titles & Scientific Dimension Callout Annotations (Matching Dashboard_UI) */}
        <div className="pointer-events-none hidden sm:block">
          {/* Left Rig Title */}
          <div className="absolute top-[74px] left-[22%] -translate-x-1/2 text-center">
            <div className="text-sm font-bold text-amber-400 tracking-wide">
              1.00g Buoyant Teardrop
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
              ── Boundary Layer (76 mm) ──
            </div>
          </div>

          {/* Right Rig Title */}
          <div className="absolute top-[74px] left-[76%] -translate-x-1/2 text-center">
            <div className="text-sm font-bold text-cyan-300 tracking-wide">
              {gravityLabel}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
              ── {activeDataset.psiId} Optical Envelope ──
            </div>
          </div>

          {/* Left Rig Callout Labels */}
          <div className="absolute top-[42%] left-3 text-[10px] font-mono text-slate-400 bg-[#050814]/80 px-2 py-1 rounded border border-slate-800">
            <div className="text-amber-300">Buoyant Plume</div>
            <div>V_b ≈ 32 cm/s ↑</div>
          </div>
          <div className="absolute top-[52%] left-[41%] text-[10px] font-mono text-slate-300 bg-[#050814]/85 px-2 py-1 rounded border border-slate-800">
            <div className="text-amber-400">Soot Oxidation Zone</div>
            <div>1,650–1,890 K Annulus</div>
          </div>

          {/* Right Rig Callout Labels */}
          <div className="absolute top-[40%] left-[53%] text-[10px] font-mono text-slate-300 bg-[#050814]/85 px-2 py-1 rounded border border-slate-800">
            <div className="text-cyan-300">Particle Trajectory</div>
            <div>Fickian Radial Diffusion</div>
          </div>
          <div className="absolute top-[48%] right-3 text-[10px] font-mono text-slate-300 bg-[#050814]/85 px-2 py-1 rounded border border-slate-800 text-right">
            <div className="text-sky-400">Reaction Sheet</div>
            <div>{activeDataset.extinctionLimitLOI.slice(0, 24)}</div>
          </div>
        </div>

        {/* Bottom Provenance Identification Strip */}
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10">
          <div
            className={`px-3.5 py-2 rounded-lg border backdrop-blur-md text-xs flex flex-wrap items-center justify-between gap-2 ${provenanceMeta.color}`}
          >
            <div>
              <span className="font-mono font-bold mr-2">[{provenanceMeta.badge}]</span>
              <span className="text-slate-200">{provenanceMeta.desc}</span>
            </div>
            <span className="font-mono text-[11px] text-slate-300 shrink-0">
              DOI: {activeDataset.doi}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
