// ─────────────────────────────────────────────────────────────────────────────
//  Charlie's Car Designer – app.js  v4.0  (Real GLTF Model Edition)
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE                from 'three';
import { OrbitControls }         from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment }       from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader }            from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader }           from 'three/addons/loaders/DRACOLoader.js';
import { RoundedBoxGeometry }    from 'three/addons/geometries/RoundedBoxGeometry.js';

// ── Free 3-D car model URLs ────────────────────────────────────────────────
// Ferrari 458 Italia – from official Three.js examples repo (CC-BY)
const URL_FERRARI    = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/ferrari.glb';
const URL_FERRARI_AO = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/ferrari_ao.png';
// Kenney Car Kit v1.4 – CC0 public domain, ~150 KB each
const URL_SEDAN      = 'https://raw.githubusercontent.com/ETdoFresh/kenney.nl/master/carkit_v1.4/Models/GLTF%20format/sedan.glb';
const URL_SUV        = 'https://raw.githubusercontent.com/ETdoFresh/kenney.nl/master/carkit_v1.4/Models/GLTF%20format/suv.glb';
const URL_RACE       = 'https://raw.githubusercontent.com/ETdoFresh/kenney.nl/master/carkit_v1.4/Models/GLTF%20format/race.glb';
// Draco decoder (needed to decompress the ferrari.glb)
const DRACO_PATH     = 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/libs/draco/gltf/';

// ── Data ──────────────────────────────────────────────────────────────────

const CARS = [
  { id: 'ferrari', label: 'Ferrari 458',  desc: 'Iconic Italian supercar',  shape: 'ferrari' },
  { id: 'sedan',   label: 'Sport Sedan',  desc: 'Sleek 4-door cruiser',      shape: 'sedan'   },
  { id: 'suv',     label: 'Premium SUV',  desc: 'Powerful & spacious',       shape: 'suv'     },
  { id: 'race',    label: 'Race Car',     desc: 'Built for the track',       shape: 'race'    },
];

const COLORS = [
  { name: 'Racing Red',    hex: '#cc1100' },
  { name: 'Burnt Orange',  hex: '#c05000' },
  { name: 'Gold',          hex: '#a07800' },
  { name: 'British Green', hex: '#145214' },
  { name: 'Ocean Blue',    hex: '#0a3a6e' },
  { name: 'Midnight',      hex: '#18182a' },
  { name: 'Purple',        hex: '#5a1e80' },
  { name: 'Hot Pink',      hex: '#b00050' },
  { name: 'Pearl White',   hex: '#e8e8e8' },
  { name: 'Silver',        hex: '#606878' },
  { name: 'Obsidian',      hex: '#1a1a1a' },
  { name: 'Candy Red',     hex: '#ff0033' },
];

const WHEELS     = [
  { id: 'standard', label: '⚙ Standard' },
  { id: 'sport',    label: '🏎 Sport'    },
  { id: 'gold',     label: '✨ Gold'     },
  { id: 'spiky',    label: '🔩 Spiky'   },
];
const HEADLIGHTS = [
  { id: 'normal', label: '💡 Normal' },
  { id: 'led',    label: '🔵 LED'    },
  { id: 'neon',   label: '🟢 Neon'   },
  { id: 'laser',  label: '🔴 Laser'  },
];
const SPOILERS   = [
  { id: 'none',  label: '✖ None'  },
  { id: 'small', label: '▲ Small' },
  { id: 'big',   label: '▲▲ Big'  },
  { id: 'wing',  label: '✈ Wing'  },
];

// ── State ─────────────────────────────────────────────────────────────────

const state = {
  carShape:  'ferrari',
  color:     '#cc1100',
  wheel:     'standard',
  headlight: 'normal',
  spoiler:   'none',
};

let savedCars = JSON.parse(localStorage.getItem('charlies-cars-3d') || '[]');

// ── Three.js globals ──────────────────────────────────────────────────────

let renderer, scene, camera, controls;
let carGroup   = null;
let threeReady = false;

// Reusable GLTF loader (keeps the Draco decoder warm)
let gltfLoader = null;

// Cached model scenes (avoid re-downloading on every rebuild)
let ferrariCache = null;
let sedanCache   = null;
let suvCache     = null;
let raceCache    = null;

// ══════════════════════════════════════════════════════════════════════════
//  SCREEN MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'screen-garage') {
    setTimeout(() => {
      if (!threeReady) initThreeJS();
      else             resizeRenderer();
      buildCar();
    }, 50);
  }
  if (id === 'screen-collection') renderCollection();
}

function showToast(msg, ms = 2400) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), ms);
}

function goToPicker()     { showScreen('screen-pick');       }
function viewCollection() { showScreen('screen-collection'); }

// ══════════════════════════════════════════════════════════════════════════
//  THREE.JS SCENE
// ══════════════════════════════════════════════════════════════════════════

function initThreeJS() {
  if (threeReady) return;
  threeReady = true;

  const canvas    = document.getElementById('three-canvas');
  const container = document.getElementById('viewport-wrap');

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled   = true;
  renderer.shadowMap.type      = THREE.PCFSoftShadowMap;
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  renderer.outputColorSpace    = THREE.SRGBColorSpace;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111116);
  scene.fog        = new THREE.FogExp2(0x111116, 0.038);

  // Env map for metallic reflections
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();

  // Camera
  const { clientWidth: w, clientHeight: h } = container;
  camera = new THREE.PerspectiveCamera(35, w / h, 0.05, 200);
  camera.position.set(4.8, 2.2, 6.0);
  camera.lookAt(0, 0.6, 0);

  // Orbit controls
  controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.6, 0);
  controls.enableDamping    = true;
  controls.dampingFactor    = 0.06;
  controls.minPolarAngle    = 0.08;
  controls.maxPolarAngle    = Math.PI / 2.1;
  controls.minDistance      = 2.5;
  controls.maxDistance      = 16;
  controls.autoRotate       = true;
  controls.autoRotateSpeed  = 0.6;

  // Lights
  scene.add(new THREE.AmbientLight(0xfff8f0, 0.5));
  const addSpot = (x, y, z, intensity) => {
    const s = new THREE.SpotLight(0xfff8e8, intensity, 28, Math.PI / 6, 0.35, 1.8);
    s.position.set(x, y, z);
    s.castShadow = true;
    s.shadow.mapSize.setScalar(1024);
    scene.add(s);
  };
  addSpot(  0, 10,  0,  140);   // overhead key
  addSpot(  6,  7,  5,   70);   // front-right
  addSpot( -5,  6,  4,   55);   // front-left
  addSpot(  0,  4, -6,   40);   // rear accent
  addSpot(  0,  3,  8,   30);   // front low

  // Showroom environment
  buildShowroom();

  // GLTF loader (shared, with Draco)
  const draco = new DRACOLoader();
  draco.setDecoderPath(DRACO_PATH);
  gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(draco);

  window.addEventListener('resize', resizeRenderer);
  resizeRenderer();

  (function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  })();
}

function resizeRenderer() {
  const c = document.getElementById('viewport-wrap');
  if (!c || !renderer) return;
  const w = c.clientWidth, h = c.clientHeight;
  if (w === 0 || h === 0) return;
  renderer.setSize(w, h);
  if (camera) { camera.aspect = w / h; camera.updateProjectionMatrix(); }
}

function buildShowroom() {
  // Glossy floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.05, metalness: 0.05, envMapIntensity: 1.2 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Podium disc
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(4.2, 4.4, 0.06, 80),
    new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.04, metalness: 0.1, envMapIntensity: 1.5 })
  );
  disc.position.y = 0.03;
  disc.receiveShadow = true;
  scene.add(disc);

  // Gold podium ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(4.3, 0.06, 8, 120),
    new THREE.MeshPhysicalMaterial({ color: 0xffd700, metalness: 0.98, roughness: 0.06, clearcoat: 1 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y  = 0.06;
  scene.add(ring);

  // Back wall
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 14),
    new THREE.MeshStandardMaterial({ color: 0xf0eeea, roughness: 0.95 })
  );
  wall.position.set(0, 6, -15);
  wall.receiveShadow = true;
  scene.add(wall);

  // Brand sign
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(5.5, 0.5, 0.08),
    new THREE.MeshPhysicalMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.06,
      emissive: new THREE.Color(0xffd700), emissiveIntensity: 0.25 })
  );
  sign.position.set(0, 8.5, -14.9);
  scene.add(sign);
}

// ══════════════════════════════════════════════════════════════════════════
//  MATERIALS
// ══════════════════════════════════════════════════════════════════════════

function paintMat(hex) {
  return new THREE.MeshPhysicalMaterial({
    color:              new THREE.Color(hex),
    metalness:          0.90,
    roughness:          0.14,
    clearcoat:          1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity:    2.2,
  });
}

function glassMat() {
  return new THREE.MeshPhysicalMaterial({
    color:        0x0a1820,
    metalness:    0,
    roughness:    0.02,
    transmission: 0.82,
    transparent:  true,
    opacity:      0.90,
    ior:          1.5,
    envMapIntensity: 1.2,
  });
}

function tyreMat() {
  return new THREE.MeshStandardMaterial({ color: 0x0f0f0f, roughness: 0.90, metalness: 0 });
}

function rimMat(style) {
  const col = { standard: 0xbcbcbc, sport: 0xd8d8f0, gold: 0xffd700, spiky: 0xff3333 };
  return new THREE.MeshPhysicalMaterial({
    color:              col[style] || col.standard,
    metalness:          0.95,
    roughness:          0.08,
    clearcoat:          0.8,
    clearcoatRoughness: 0.06,
    envMapIntensity:    2.2,
  });
}

function hlMat(style) {
  const cols = { normal: 0xffffd0, led: 0xb0d8ff, neon: 0x88ffcc, laser: 0xff6666 };
  const col  = new THREE.Color(cols[style] || cols.normal);
  const ints = { normal: 4, led: 6, neon: 7, laser: 8 };
  return new THREE.MeshStandardMaterial({
    color: col, emissive: col, emissiveIntensity: ints[style] || 4,
  });
}

function tlMat() {
  const col = new THREE.Color(0xff1100);
  return new THREE.MeshStandardMaterial({
    color: col, emissive: col, emissiveIntensity: 2.5,
    transparent: true, opacity: 0.82,
  });
}

function chromeMat() {
  return new THREE.MeshPhysicalMaterial({ color: 0xdddddd, metalness: 0.99, roughness: 0.03,
    clearcoat: 1, envMapIntensity: 2.5 });
}
function darkMat() {
  return new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
}

// ══════════════════════════════════════════════════════════════════════════
//  WHEEL ASSEMBLY  (FIXED: rotation.x = PI/2 so axle runs along Z)
// ══════════════════════════════════════════════════════════════════════════

function makeWheel(style) {
  const g = new THREE.Group();

  // Tyre
  const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.24, 40), tyreMat());
  tyre.castShadow = true;
  g.add(tyre);

  // Tyre sidewall rings
  const sideRingMat = new THREE.MeshStandardMaterial({ color: 0x282828, roughness: 0.85 });
  [-1, 1].forEach(s => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.03, 8, 40), sideRingMat);
    r.position.y = s * 0.10;
    g.add(r);
  });

  // Rim
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.26, 40), rimMat(style));
  rim.castShadow = true;
  g.add(rim);

  // Spokes
  const nSpokes = { standard: 5, sport: 5, gold: 10, spiky: 8 }[style] || 5;
  const sMat    = rimMat(style);
  for (let i = 0; i < nSpokes; i++) {
    const angle = (i / nSpokes) * Math.PI * 2;
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(style === 'spiky' ? 0.038 : 0.042, 0.27, 0.42),
      sMat
    );
    spoke.rotation.y = angle;
    g.add(spoke);
  }

  // Outer rim ring
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.025, 6, 40), rimMat(style));
  outerRing.rotation.x = Math.PI / 2;
  g.add(outerRing);

  // Centre cap
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.28, 18), chromeMat());
  g.add(cap);

  // Brake disc
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.20, 0.20, 0.022, 28),
    new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.55, metalness: 0.5 })
  );
  g.add(disc);

  // ── KEY FIX: rotate around X so cylinder axis aligns with Z (car-width axis)
  g.rotation.x = Math.PI / 2;
  return g;
}

function placeWheels(carGrp, wRadius, positions, style) {
  positions.forEach(([x, y, z]) => {
    const w = makeWheel(style);
    w.position.set(x, wRadius, z);  // y override: always sit on floor
    w.castShadow = true;
    carGrp.add(w);
  });
}

// ══════════════════════════════════════════════════════════════════════════
//  GENERIC GLTF HELPERS
// ══════════════════════════════════════════════════════════════════════════

// Traverse every mesh in a loaded GLTF model and apply PBR materials based
// on mesh/material name keywords so the car adopts the player's chosen paint.
function applyCarPaint(model, s) {
  const paint = paintMat(s.color);
  const glass = glassMat();
  const tyre  = tyreMat();
  const rim   = rimMat(s.wheel);
  const hl    = hlMat(s.headlight);
  const tl    = tlMat();

  model.traverse(child => {
    if (!child.isMesh) return;
    child.castShadow    = true;
    child.receiveShadow = true;

    const n = (child.name + ' ' + (child.material?.name || '')).toLowerCase();

    if (/glass|window|windshield|windscreen/.test(n)) {
      child.material = glass;
    } else if (/tire|tyre|rubber/.test(n)) {
      child.material = tyre;
    } else if (/rim|hub|spoke|disc_brake|brake/.test(n)) {
      child.material = rim;
    } else if (/light_front|headlight|lamp_front|lens/.test(n)) {
      child.material = hl;
    } else if (/light_rear|taillight|lamp_rear/.test(n)) {
      child.material = tl;
    } else {
      child.material = paint;
    }
  });
}

// Scale a cloned GLTF scene to targetLength along its longest horizontal axis
// and sit it on y = 0, centred on the podium.
function normalizeModel(model, targetLength) {
  const box  = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  const scale = targetLength / Math.max(size.x, size.z);
  model.scale.setScalar(scale);

  // Re-measure after scaling
  const box2 = new THREE.Box3().setFromObject(model);
  const cen  = new THREE.Vector3();
  box2.getCenter(cen);
  model.position.x -= cen.x;
  model.position.z -= cen.z;
  model.position.y  = -box2.min.y;   // sit on floor
}

// ══════════════════════════════════════════════════════════════════════════
//  FERRARI 458 – real GLTF model from Three.js examples
// ══════════════════════════════════════════════════════════════════════════

async function buildFerrari(grp, s) {
  setLoadingMessage('Loading Ferrari 458 model…');

  try {
    // Cache the base model so colour changes are instant after first load
    if (!ferrariCache) {
      const gltf = await gltfLoader.loadAsync(URL_FERRARI);
      ferrariCache = gltf.scene;
    }

    const car = ferrariCache.clone(true);

    // Apply environment intensity to every mesh
    car.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        if (child.material) child.material.envMapIntensity = 1.8;
      }
    });

    // ── Swap paint colour on body meshes ─────────────────────────
    const paint = paintMat(s.color);
    const body  = car.getObjectByName('body');
    if (body) body.material = paint;

    // Rim colour
    const rimColor = rimMat(s.wheel);
    ['rim_fl', 'rim_fr', 'rim_rl', 'rim_rr'].forEach(n => {
      const m = car.getObjectByName(n);
      if (m) m.material = rimColor;
    });

    // Glass
    ['glass'].forEach(n => {
      const m = car.getObjectByName(n);
      if (m) m.material = glassMat();
    });

    // Headlights: tint the lens mesh if found
    car.traverse(child => {
      if (child.isMesh && child.name.includes('light')) {
        child.material = hlMat(s.headlight);
      }
    });

    // ── Scale the model to a consistent size ───────────────────────
    const box = new THREE.Box3().setFromObject(car);
    const size = new THREE.Vector3();
    box.getSize(size);
    const targetLength = 4.4;
    const scale = targetLength / Math.max(size.x, size.z);
    car.scale.setScalar(scale);

    // Sit the car on the floor (y=0)
    const box2 = new THREE.Box3().setFromObject(car);
    car.position.y = -box2.min.y;

    grp.add(car);

    // Optional: add spoiler on top of real model
    if (s.spoiler !== 'none') {
      addSpoilerMesh(grp, 'supercar', s.spoiler, s.color, 1.85,
        -targetLength * 0.48, car.position.y + size.y * scale * 0.55);
    }

  } catch (err) {
    console.warn('Ferrari model failed to load, using fallback', err);
    buildSupercarBox(grp, s);   // graceful fallback
  } finally {
    clearLoadingMessage();
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  SPORT SEDAN  – Kenney Car Kit GLTF (CC0)
// ══════════════════════════════════════════════════════════════════════════

async function buildSedan(grp, s) {
  setLoadingMessage('Loading Sedan model…');
  try {
    if (!sedanCache) {
      const gltf = await gltfLoader.loadAsync(URL_SEDAN);
      sedanCache = gltf.scene;
    }
    const car = sedanCache.clone(true);
    applyCarPaint(car, s);
    normalizeModel(car, 4.2);
    grp.add(car);

    if (s.spoiler !== 'none') {
      const box = new THREE.Box3().setFromObject(car);
      addSpoilerMesh(grp, 'sedan', s.spoiler, s.color, 1.85, box.min.x + 0.1, box.max.y * 0.88);
    }
  } catch (err) {
    console.warn('Sedan model failed, using fallback', err);
    buildSedanBox(grp, s);
  } finally {
    clearLoadingMessage();
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  PREMIUM SUV  – Kenney Car Kit GLTF (CC0)
// ══════════════════════════════════════════════════════════════════════════

async function buildSuv(grp, s) {
  setLoadingMessage('Loading SUV model…');
  try {
    if (!suvCache) {
      const gltf = await gltfLoader.loadAsync(URL_SUV);
      suvCache = gltf.scene;
    }
    const car = suvCache.clone(true);
    applyCarPaint(car, s);
    normalizeModel(car, 4.4);
    grp.add(car);

    if (s.spoiler !== 'none') {
      const box = new THREE.Box3().setFromObject(car);
      addSpoilerMesh(grp, 'suv', s.spoiler, s.color, 1.96, box.min.x + 0.1, box.max.y * 0.94);
    }
  } catch (err) {
    console.warn('SUV model failed, using fallback', err);
    buildSuvBox(grp, s);
  } finally {
    clearLoadingMessage();
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  RACE CAR  – Kenney Car Kit GLTF (CC0)
// ══════════════════════════════════════════════════════════════════════════

async function buildRace(grp, s) {
  setLoadingMessage('Loading Race Car model…');
  try {
    if (!raceCache) {
      const gltf = await gltfLoader.loadAsync(URL_RACE);
      raceCache = gltf.scene;
    }
    const car = raceCache.clone(true);
    applyCarPaint(car, s);
    normalizeModel(car, 4.2);
    grp.add(car);

    if (s.spoiler !== 'none') {
      const box = new THREE.Box3().setFromObject(car);
      addSpoilerMesh(grp, 'supercar', s.spoiler, s.color, 1.85, box.min.x + 0.08, box.max.y * 0.85);
    }
  } catch (err) {
    console.warn('Race model failed, using fallback', err);
    buildRaceBox(grp, s);
  } finally {
    clearLoadingMessage();
  }
}

// ── Procedural fallbacks (used if GLTF download fails) ────────────────────

function buildSedanBox(grp, s) {
  const paint = paintMat(s.color);
  const glass = glassMat();
  const dark  = darkMat();
  const W = 1.85, L = 4.40, wR = 0.36;
  const lower = new THREE.Mesh(new RoundedBoxGeometry(L, 0.50, W, 4, 0.06), paint);
  lower.position.y = wR * 2 + 0.25; lower.castShadow = true; grp.add(lower);
  const cabL = 2.05, cabH = 0.62;
  const cabin = new THREE.Mesh(new RoundedBoxGeometry(cabL, cabH, W * 0.90, 4, 0.07), paint);
  cabin.position.set(-0.12, wR * 2 + 0.50 + 0.31 + cabH / 2, 0); cabin.castShadow = true; grp.add(cabin);
  const wind = new THREE.Mesh(new THREE.BoxGeometry(0.07, cabH * 0.78, W * 0.74), glass);
  wind.position.set(cabL / 2 - 0.10, wR * 2 + 0.50 + 0.31 + cabH / 2, 0); wind.rotation.z = 0.20; grp.add(wind);
  [W * 0.44, -W * 0.44].forEach(z => {
    const sw = new THREE.Mesh(new THREE.BoxGeometry(cabL * 0.78, cabH * 0.64, 0.05), glass);
    sw.position.set(-0.12, wR * 2 + 0.50 + 0.31 + cabH / 2, z); grp.add(sw);
  });
  addSpoilerMesh(grp, 'sedan', s.spoiler, s.color, W, -L / 2 + 0.1, wR * 2 + 0.72);
  placeWheels(grp, wR, [[-L*0.295,0,-(W/2+0.01)],[-L*0.295,0,W/2+0.01],[L*0.295,0,-(W/2+0.01)],[L*0.295,0,W/2+0.01]], s.wheel);
}

function buildSuvBox(grp, s) {
  const paint = paintMat(s.color);
  const glass = glassMat();
  const W = 1.96, L = 4.65, wR = 0.42, upperH = 0.95;
  const lower = new THREE.Mesh(new RoundedBoxGeometry(L, 0.56, W, 4, 0.08), paint);
  lower.position.y = wR * 2 + 0.28; lower.castShadow = true; grp.add(lower);
  const upper = new THREE.Mesh(new RoundedBoxGeometry(L * 0.88, upperH, W * 0.94, 4, 0.08), paint);
  upper.position.y = wR * 2 + 0.56 + upperH / 2; upper.castShadow = true; grp.add(upper);
  const wind = new THREE.Mesh(new THREE.BoxGeometry(0.08, upperH * 0.60, W * 0.72), glass);
  wind.position.set(L * 0.38, wR * 2 + 0.56 + upperH * 0.52, 0); wind.rotation.z = 0.28; grp.add(wind);
  addSpoilerMesh(grp, 'suv', s.spoiler, s.color, W, -L / 2 + 0.1, wR * 2 + 0.56 + upperH);
  placeWheels(grp, wR, [[-L*0.295,0,-(W/2+0.01)],[-L*0.295,0,W/2+0.01],[L*0.295,0,-(W/2+0.01)],[L*0.295,0,W/2+0.01]], s.wheel);
}

function buildRaceBox(grp, s) {
  const paint = paintMat(s.color);
  const glass = glassMat();
  const dark  = darkMat();
  const W = 1.92, L = 4.60, wR = 0.36;
  const lower = new THREE.Mesh(new RoundedBoxGeometry(L, 0.28, W, 4, 0.05), paint);
  lower.position.y = wR * 2 + 0.14; lower.castShadow = true; grp.add(lower);
  const cabH = 0.36, cabL = 1.50;
  const cabin = new THREE.Mesh(new RoundedBoxGeometry(cabL, cabH, W * 0.72, 4, 0.06), paint);
  cabin.position.set(0.08, wR * 2 + 0.28 + cabH / 2, 0); cabin.castShadow = true; grp.add(cabin);
  const wind = new THREE.Mesh(new THREE.BoxGeometry(0.06, cabH * 0.75, W * 0.62), glass);
  wind.position.set(cabL / 2 - 0.04, wR * 2 + 0.28 + cabH / 2, 0); wind.rotation.z = 0.35; grp.add(wind);
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, W * 0.96), dark);
  splitter.position.set(L / 2 + 0.06, wR * 2 + 0.05, 0); grp.add(splitter);
  addSpoilerMesh(grp, 'supercar', s.spoiler, s.color, W, -L / 2 + 0.08, wR * 2 + 0.55);
  placeWheels(grp, wR, [[-L*0.300,0,-(W/2+0.01)],[-L*0.300,0,W/2+0.01],[L*0.300,0,-(W/2+0.01)],[L*0.300,0,W/2+0.01]], s.wheel);
}

// ══════════════════════════════════════════════════════════════════════════
//  SUPERCAR (fallback if Ferrari GLTF fails)
// ══════════════════════════════════════════════════════════════════════════

function buildSupercarBox(grp, s) {
  const paint = paintMat(s.color);
  const glass = glassMat();
  const dark  = darkMat();

  const W  = 1.92;
  const L  = 4.60;
  const wR = 0.36;

  // Very low, wide lower body
  const lower = new THREE.Mesh(new RoundedBoxGeometry(L, 0.32, W, 4, 0.05), paint);
  lower.position.y = wR * 2 + 0.16;
  lower.castShadow = true;
  grp.add(lower);

  // Aerodynamic upper body
  const upper = new THREE.Mesh(new RoundedBoxGeometry(L * 0.70, 0.28, W * 0.88, 4, 0.05), paint);
  upper.position.y = wR * 2 + 0.32 + 0.14;
  upper.castShadow = true;
  grp.add(upper);

  // Short, swept-back cabin
  const cabH = 0.42;
  const cabL = 1.65;
  const cabin = new THREE.Mesh(new RoundedBoxGeometry(cabL, cabH, W * 0.78, 4, 0.06), paint);
  cabin.position.set(0.04, wR * 2 + 0.32 + 0.28 + cabH / 2, 0);
  cabin.castShadow = true;
  grp.add(cabin);

  // Roof
  const roofP = paintMat(s.color);
  roofP.color.multiplyScalar(0.82);
  const roof = new THREE.Mesh(new RoundedBoxGeometry(cabL * 0.88, 0.06, W * 0.74, 3, 0.02), roofP);
  roof.position.set(0.04, wR * 2 + 0.32 + 0.28 + cabH + 0.04, 0);
  grp.add(roof);

  // Steep windshield
  const wind = new THREE.Mesh(new THREE.BoxGeometry(0.06, cabH * 0.80, W * 0.68), glass);
  wind.position.set(cabL / 2 - 0.06, wR * 2 + 0.32 + 0.28 + cabH / 2, 0);
  wind.rotation.z = 0.32;
  grp.add(wind);

  // Side windows
  [W * 0.36, -W * 0.36].forEach(z => {
    const sw = new THREE.Mesh(new THREE.BoxGeometry(cabL * 0.68, cabH * 0.72, 0.05), glass);
    sw.position.set(0.04, wR * 2 + 0.32 + 0.28 + cabH / 2, z);
    grp.add(sw);
  });

  // Long front splitter
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, W * 0.95), dark);
  splitter.position.set(L / 2 + 0.06, wR * 2 + 0.06, 0);
  grp.add(splitter);

  // Headlights (sharp, angled)
  [W * 0.38, -W * 0.38].forEach(z => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.30), hlMat(s.headlight));
    hl.position.set(L / 2 + 0.06, wR * 2 + 0.34, z);
    grp.add(hl);
    const pt = new THREE.PointLight(new THREE.Color(hlMat(s.headlight).color), 1.5, 4, 2);
    pt.position.set(L / 2 + 0.2, wR * 2 + 0.34, z);
    grp.add(pt);
  });

  // Tail light strip
  const tlStrip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, W * 0.88), tlMat());
  tlStrip.position.set(-(L / 2 + 0.04), wR * 2 + 0.42, 0);
  grp.add(tlStrip);

  addSpoilerMesh(grp, 'supercar', s.spoiler, s.color, W, -L / 2 + 0.08, wR * 2 + 0.60);

  const wX = L * 0.300;
  placeWheels(grp, wR, [
    [-wX, 0, -(W / 2 + 0.01)],
    [-wX, 0,   W / 2 + 0.01 ],
    [ wX, 0, -(W / 2 + 0.01)],
    [ wX, 0,   W / 2 + 0.01 ],
  ], s.wheel);
}

// ══════════════════════════════════════════════════════════════════════════
//  SPOILER
// ══════════════════════════════════════════════════════════════════════════

function addSpoilerMesh(grp, shape, spoiler, col, bodyW, rearX, baseY) {
  if (spoiler === 'none') return;

  if (spoiler === 'wing') {
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, bodyW * 0.92),
      new THREE.MeshPhysicalMaterial({ color: 0x444444, metalness: 0.85, roughness: 0.18 })
    );
    blade.position.set(rearX, baseY + 0.40, 0);
    grp.add(blade);
    [bodyW * 0.30, -bodyW * 0.30].forEach(z => {
      const stand = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.04), chromeMat());
      stand.position.set(rearX, baseY + 0.21, z);
      grp.add(stand);
    });
  } else {
    const h = spoiler === 'big' ? 0.36 : 0.18;
    const sm = new THREE.Mesh(new RoundedBoxGeometry(0.10, h, bodyW * 0.80, 3, 0.03), paintMat(col));
    sm.position.set(rearX, baseY + h / 2, 0);
    grp.add(sm);
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  BUILD / REFRESH CAR IN SCENE
// ══════════════════════════════════════════════════════════════════════════

async function buildCar() {
  if (!scene) return;

  // Remove old car
  if (carGroup) {
    scene.remove(carGroup);
    carGroup.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
    carGroup = null;
  }

  carGroup = new THREE.Group();

  if (state.carShape === 'ferrari') {
    await buildFerrari(carGroup, state);
  } else if (state.carShape === 'suv') {
    await buildSuv(carGroup, state);
  } else if (state.carShape === 'race') {
    await buildRace(carGroup, state);
  } else {
    await buildSedan(carGroup, state);
  }

  scene.add(carGroup);
}

// ══════════════════════════════════════════════════════════════════════════
//  LOADING INDICATOR
// ══════════════════════════════════════════════════════════════════════════

function setLoadingMessage(msg) {
  let el = document.getElementById('loading-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loading-overlay';
    el.style.cssText = `
      position:absolute; inset:0; display:flex; align-items:center;
      justify-content:center; background:rgba(0,0,0,0.55);
      color:#ffd700; font-weight:bold; font-size:1rem;
      border-radius:16px; z-index:10; pointer-events:none;
    `;
    document.getElementById('viewport-wrap').appendChild(el);
  }
  el.textContent = msg;
  el.style.display = 'flex';
}
function clearLoadingMessage() {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = 'none';
}

// ══════════════════════════════════════════════════════════════════════════
//  PICKER
// ══════════════════════════════════════════════════════════════════════════

function initPicker() {
  const grid = document.getElementById('car-grid');
  grid.innerHTML = '';
  CARS.forEach(car => {
    const card = document.createElement('div');
    card.className = 'car-card';

    const cv  = document.createElement('canvas');
    cv.width  = 200; cv.height = 120;
    drawThumb(cv.getContext('2d'), cv.width, cv.height, car.shape);
    card.appendChild(cv);
    card.innerHTML += `<div class="car-label">${car.label}</div>
                       <div class="car-desc">${car.desc}</div>`;
    card.prepend(cv);

    card.onclick = () => {
      state.carShape  = car.shape;
      state.wheel     = 'standard';
      state.headlight = 'normal';
      state.spoiler   = 'none';
      document.getElementById('garage-title').textContent = car.label + ' — Garage';
      showScreen('screen-garage');
      initGaragePanel();
    };
    grid.appendChild(card);
  });
}

function drawThumb(ctx, W, H, shape) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#ccc'); bg.addColorStop(1, '#aaa');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  const pts = {
    ferrari: [[0.07,0.72],[0.07,0.62],[0.18,0.44],[0.38,0.32],[0.58,0.28],[0.76,0.34],[0.90,0.50],[0.93,0.72]],
    sedan:   [[0.08,0.72],[0.08,0.56],[0.24,0.40],[0.52,0.32],[0.66,0.32],[0.80,0.42],[0.91,0.52],[0.92,0.72]],
    suv:     [[0.08,0.74],[0.08,0.52],[0.14,0.26],[0.22,0.20],[0.78,0.20],[0.88,0.26],[0.92,0.50],[0.92,0.74]],
    race:    [[0.06,0.74],[0.06,0.64],[0.14,0.50],[0.32,0.38],[0.60,0.34],[0.80,0.40],[0.92,0.56],[0.94,0.74]],
  }[shape] || [];

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0]*W, pts[0][1]*H);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0]*W, pts[i][1]*H);
  ctx.closePath();
  const cg = ctx.createLinearGradient(0, H*0.26, 0, H*0.72);
  cg.addColorStop(0, '#e04030'); cg.addColorStop(0.4, '#c0392b'); cg.addColorStop(1, '#801010');
  ctx.fillStyle = cg; ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#1a3045';
  if (shape === 'suv') ctx.fillRect(W*0.15, H*0.21, W*0.62, H*0.26);
  else                 ctx.fillRect(W*0.30, H*0.32, W*0.34, H*0.12);
  ctx.restore();

  [0.22, 0.77].forEach(x => {
    ctx.save();
    ctx.beginPath(); ctx.arc(x*W, H*0.73, H*0.11, 0, Math.PI*2);
    ctx.fillStyle = '#111'; ctx.fill();
    ctx.beginPath(); ctx.arc(x*W, H*0.73, H*0.07, 0, Math.PI*2);
    ctx.fillStyle = '#bbb'; ctx.fill();
    ctx.restore();
  });
}

// ══════════════════════════════════════════════════════════════════════════
//  GARAGE PANEL
// ══════════════════════════════════════════════════════════════════════════

function initGaragePanel() {
  const row = document.getElementById('color-swatches');
  row.innerHTML = '';
  COLORS.forEach(c => {
    const sw = document.createElement('div');
    sw.className = 'swatch' + (state.color === c.hex ? ' active' : '');
    sw.title = c.name;
    sw.style.background = c.hex;
    sw.onclick = () => {
      state.color = c.hex;
      document.getElementById('custom-color').value = c.hex;
      row.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
      sw.classList.add('active');
      buildCar();
    };
    row.appendChild(sw);
  });
  buildOptBtns('wheel-btns',     WHEELS,     'wheel');
  buildOptBtns('headlight-btns', HEADLIGHTS, 'headlight');
  buildOptBtns('spoiler-btns',   SPOILERS,   'spoiler');
}

function buildOptBtns(id, opts, key) {
  const row = document.getElementById(id);
  row.innerHTML = '';
  opts.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn' + (state[key] === opt.id ? ' active' : '');
    btn.textContent = opt.label;
    btn.onclick = () => {
      state[key] = opt.id;
      row.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      buildCar();
    };
    row.appendChild(btn);
  });
}

function setCustomColor(hex) {
  state.color = hex;
  document.querySelectorAll('#color-swatches .swatch').forEach(x => x.classList.remove('active'));
  buildCar();
}

// ══════════════════════════════════════════════════════════════════════════
//  PHOTO – COLOUR EXTRACTION
// ══════════════════════════════════════════════════════════════════════════

function extractColorFromPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = 100; cv.height = 100;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0, 100, 100);
    const data = ctx.getImageData(15, 20, 70, 60).data;

    // Hue-histogram on saturated pixels
    const hist = {};
    for (let i = 0; i < data.length; i += 4) {
      const { h, s, v } = rgbToHsv(data[i], data[i+1], data[i+2]);
      if (s < 0.18 || v < 0.14 || v > 0.94) continue;
      const b = Math.round(h / 15) * 15;
      hist[b] = (hist[b] || 0) + 1;
    }
    let bestH = 0, bestC = 0;
    for (const [k, c] of Object.entries(hist)) {
      if (c > bestC) { bestC = c; bestH = parseInt(k); }
    }
    const hex = rgbToHex(...hsvToRgb(bestH / 360, 0.80, 0.70));
    state.color = hex;
    buildCar();

    document.getElementById('photo-thumb').src = img.src;
    document.getElementById('extracted-swatch').style.background = hex;
    document.getElementById('extracted-name').textContent = 'Matched: ' + hex;
    document.getElementById('photo-result').classList.remove('hidden');
    document.getElementById('custom-color').value = hex;
    showToast('🎨 Color matched from your photo!');
  };
  img.src = URL.createObjectURL(file);
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  if (d) switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }
  return { h: h * 360, s, v: max };
}

function hsvToRgb(h, s, v) {
  const i = Math.floor(h * 6), f = h * 6 - i;
  const p = v*(1-s), q = v*(1-f*s), t = v*(1-(1-f)*s);
  let r, g, b;
  switch (i % 6) {
    case 0: r=v;g=t;b=p; break; case 1: r=q;g=v;b=p; break;
    case 2: r=p;g=v;b=t; break; case 3: r=p;g=q;b=v; break;
    case 4: r=t;g=p;b=v; break; case 5: r=v;g=p;b=q; break;
  }
  return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
}

function rgbToHex(r, g, b) {
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

// ══════════════════════════════════════════════════════════════════════════
//  SAVE / COLLECTION
// ══════════════════════════════════════════════════════════════════════════

function openSaveDialog() {
  document.getElementById('save-dialog').classList.remove('hidden');
  document.getElementById('car-name-input').value = '';
  document.getElementById('car-name-input').focus();
}
function closeSaveDialog() { document.getElementById('save-dialog').classList.add('hidden'); }

function saveCarToCollection() {
  const name     = document.getElementById('car-name-input').value.trim() || 'My Car';
  const snapshot = renderer ? renderer.domElement.toDataURL('image/jpeg', 0.80) : '';
  savedCars.push({ name, snapshot, config: { ...state } });
  localStorage.setItem('charlies-cars-3d', JSON.stringify(savedCars));
  closeSaveDialog();
  showToast(`💾 "${name}" saved!`);
}

function renderCollection() {
  const grid = document.getElementById('collection-grid');
  grid.innerHTML = '';
  if (!savedCars.length) {
    grid.innerHTML = '<p style="color:#aaa;text-align:center;grid-column:1/-1;padding:40px 0">No saved cars yet — go design one! 🚗</p>';
    return;
  }
  savedCars.forEach((car, i) => {
    const card = document.createElement('div');
    card.className = 'coll-card';
    if (car.snapshot) {
      const img = document.createElement('img');
      img.src = car.snapshot;
      img.style.cssText = 'width:100%;border-radius:8px;margin-bottom:10px;display:block';
      card.appendChild(img);
    }
    card.innerHTML += `<div class="coll-name">🚗 ${car.name}</div>`;
    const editBtn = document.createElement('button');
    editBtn.className = 'opt-btn'; editBtn.style.marginTop = '6px';
    editBtn.textContent = '✏ Edit';
    editBtn.onclick = () => {
      Object.assign(state, car.config);
      showScreen('screen-garage');
      initGaragePanel();
    };
    card.appendChild(editBtn);
    const delBtn = document.createElement('button');
    delBtn.className = 'opt-btn'; delBtn.style.marginTop = '4px'; delBtn.style.color = '#f88';
    delBtn.textContent = '🗑 Delete';
    delBtn.onclick = () => {
      savedCars.splice(i, 1);
      localStorage.setItem('charlies-cars-3d', JSON.stringify(savedCars));
      renderCollection();
    };
    card.appendChild(delBtn);
    grid.appendChild(card);
  });
}

function takeScreenshot() {
  if (!renderer) return;
  renderer.render(scene, camera);
  const link = document.createElement('a');
  link.download = 'charlies-car.png';
  link.href = renderer.domElement.toDataURL();
  link.click();
  showToast('📸 Screenshot saved!');
}

// ══════════════════════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════════════════════

function boot() {
  initPicker();
  showScreen('screen-pick');
  Object.assign(window, {
    showScreen, goToPicker, viewCollection,
    setCustomColor, openSaveDialog, closeSaveDialog,
    saveCarToCollection, takeScreenshot, extractColorFromPhoto,
  });
}

boot();
