// ─────────────────────────────────────────────────────────────────────────────
//  Charlie's Car Designer – app.js  v3.0  (Three.js 3-D Edition)
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';
import { OrbitControls }  from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ── Data ───────────────────────────────────────────────────────────────────

const CARS = [
  { id: 'mercedes', label: 'Mercedes-Benz',  desc: 'Sleek & luxurious',      shape: 'sedan'    },
  { id: 'lambo',    label: 'Lamborghini',     desc: 'Low & aggressive',        shape: 'supercar' },
  { id: 'volvo',    label: 'Volvo SUV',       desc: 'Powerful & refined',      shape: 'suv'      },
  { id: 'classic',  label: 'Classic',         desc: 'Timeless vintage style',  shape: 'classic'  },
];

const COLORS = [
  { name: 'Racing Red',    hex: '#c0392b' },
  { name: 'Burnt Orange',  hex: '#ca6f1e' },
  { name: 'Sunburst',      hex: '#b7950b' },
  { name: 'British Green', hex: '#1a5e20' },
  { name: 'Ocean Blue',    hex: '#1a5276' },
  { name: 'Midnight Blue', hex: '#1c2833' },
  { name: 'Purple',        hex: '#6c3483' },
  { name: 'Hot Pink',      hex: '#c0185c' },
  { name: 'Pearl White',   hex: '#f0f0f0' },
  { name: 'Silver',        hex: '#7f8c8d' },
  { name: 'Obsidian',      hex: '#1c1c1c' },
  { name: 'Candy Red',     hex: '#ff0033' },
];

const WHEELS = [
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

const SPOILERS = [
  { id: 'none',  label: '✖ None'    },
  { id: 'small', label: '▲ Small'   },
  { id: 'big',   label: '▲▲ Big'    },
  { id: 'wing',  label: '✈ Wing'    },
];

// ── App State ──────────────────────────────────────────────────────────────

const state = {
  carShape:  'sedan',
  color:     '#c0392b',
  wheel:     'standard',
  headlight: 'normal',
  spoiler:   'none',
};

let savedCars = JSON.parse(localStorage.getItem('charlies-cars-3d') || '[]');

// ── Three.js globals ───────────────────────────────────────────────────────

let renderer, scene, camera, controls;
let carGroup = null;
let threeReady = false;

// ═════════════════════════════════════════════════════════════════════════════
//  SCREEN MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  if (id === 'screen-garage') {
    // Slight delay so the element is visible before measuring
    setTimeout(() => {
      if (!threeReady) initThreeJS();
      else             resizeRenderer();
      buildCar();
    }, 50);
  }
  if (id === 'screen-collection') renderCollection();
}

function showToast(msg, duration = 2400) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), duration);
}

function goToPicker()      { showScreen('screen-pick');       }
function viewCollection()  { showScreen('screen-collection'); }

// ═════════════════════════════════════════════════════════════════════════════
//  THREE.JS  –  SCENE SETUP
// ═════════════════════════════════════════════════════════════════════════════

function initThreeJS() {
  if (threeReady) return;
  threeReady = true;

  const canvas    = document.getElementById('three-canvas');
  const container = document.getElementById('viewport-wrap');

  // ── Renderer ────────────────────────────────
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled  = true;
  renderer.shadowMap.type     = THREE.PCFSoftShadowMap;
  renderer.toneMapping        = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  renderer.outputColorSpace   = THREE.SRGBColorSpace;

  // ── Scene ────────────────────────────────────
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x18181e);
  scene.fog = new THREE.FogExp2(0x18181e, 0.045);

  // ── Environment (metallic reflection map) ────
  const pmrem   = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment(renderer);
  scene.environment = pmrem.fromScene(roomEnv, 0.04).texture;
  pmrem.dispose();

  // ── Camera ───────────────────────────────────
  const { clientWidth: w, clientHeight: h } = container;
  camera = new THREE.PerspectiveCamera(38, w / h, 0.05, 200);
  camera.position.set(4.2, 1.9, 5.5);
  camera.lookAt(0, 0.55, 0);

  // ── Orbit Controls ───────────────────────────
  controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.55, 0);
  controls.enableDamping   = true;
  controls.dampingFactor   = 0.06;
  controls.minPolarAngle   = 0.08;
  controls.maxPolarAngle   = Math.PI / 2.05;
  controls.minDistance     = 2.5;
  controls.maxDistance     = 14;
  controls.autoRotate      = true;
  controls.autoRotateSpeed = 0.7;

  // ── Lighting ─────────────────────────────────
  scene.add(new THREE.AmbientLight(0xfff8f0, 0.55));

  const makeSpot = (x, y, z, intensity, angle = Math.PI / 7) => {
    const s = new THREE.SpotLight(0xfff8f0, intensity, 25, angle, 0.4, 1.8);
    s.position.set(x, y, z);
    s.castShadow = true;
    s.shadow.mapSize.setScalar(1024);
    s.shadow.camera.near = 0.5;
    s.shadow.camera.far  = 22;
    scene.add(s);
    return s;
  };
  makeSpot(0,   9,  0,   120);  // overhead key
  makeSpot(6,   7,  4,    60);  // front-right fill
  makeSpot(-5,  6,  4,    45);  // front-left fill
  makeSpot(0,   5, -6,    35);  // rear accent
  makeSpot(0,   4,  7,    30);  // front low

  // ── Showroom Floor ───────────────────────────
  buildShowroomFloor();

  // ── Resize ───────────────────────────────────
  window.addEventListener('resize', resizeRenderer);
  resizeRenderer();

  // ── Render loop ──────────────────────────────
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

function buildShowroomFloor() {
  // Main floor tile
  const floorGeo = new THREE.PlaneGeometry(40, 40, 10, 10);
  const floorMat = new THREE.MeshStandardMaterial({
    color:            0xcccccc,
    roughness:        0.06,
    metalness:        0.08,
    envMapIntensity:  1.2,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Showroom podium disc
  const discGeo = new THREE.CylinderGeometry(3.8, 4.0, 0.06, 80);
  const discMat = new THREE.MeshStandardMaterial({
    color:           0xe8e8e8,
    roughness:       0.04,
    metalness:       0.12,
    envMapIntensity: 1.5,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.y = 0.03;
  disc.receiveShadow = true;
  scene.add(disc);

  // Pedestal edge ring
  const ringGeo = new THREE.TorusGeometry(3.9, 0.06, 8, 100);
  const ringMat = new THREE.MeshPhysicalMaterial({
    color: 0xffd700, metalness: 0.95, roughness: 0.08, clearcoat: 1,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.06;
  scene.add(ring);

  // Back wall
  const wallGeo = new THREE.PlaneGeometry(28, 12);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf0eeeb, roughness: 0.92 });
  const wall    = new THREE.Mesh(wallGeo, wallMat);
  wall.position.set(0, 5, -14);
  wall.receiveShadow = true;
  scene.add(wall);

  // Brand sign on wall
  addWallSign();
}

function addWallSign() {
  // A simple glowing logo plate on the back wall
  const geo = new THREE.BoxGeometry(5, 0.5, 0.05);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffd700, metalness: 0.95, roughness: 0.08,
    emissive: new THREE.Color(0xffd700), emissiveIntensity: 0.3,
  });
  const sign = new THREE.Mesh(geo, mat);
  sign.position.set(0, 7, -13.9);
  scene.add(sign);
}

// ═════════════════════════════════════════════════════════════════════════════
//  CAR MATERIALS
// ═════════════════════════════════════════════════════════════════════════════

function paintMaterial(hexColor) {
  return new THREE.MeshPhysicalMaterial({
    color:               new THREE.Color(hexColor),
    metalness:           0.88,
    roughness:           0.16,
    clearcoat:           1.0,
    clearcoatRoughness:  0.06,
    envMapIntensity:     2.0,
    reflectivity:        1.0,
  });
}

function glassMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color:        new THREE.Color(0x0a1f2e),
    metalness:    0.0,
    roughness:    0.03,
    transmission: 0.80,
    transparent:  true,
    opacity:      0.88,
    ior:          1.5,
    envMapIntensity: 1.2,
  });
}

function tyreMaterial() {
  return new THREE.MeshStandardMaterial({
    color:     0x111111,
    roughness: 0.92,
    metalness: 0.0,
  });
}

function rimMaterial(style) {
  const c = { standard: 0xc0c0c0, sport: 0xe8e8f8, gold: 0xffd700, spiky: 0xff3333 };
  return new THREE.MeshPhysicalMaterial({
    color:              c[style] || c.standard,
    metalness:          0.94,
    roughness:          0.10,
    clearcoat:          0.7,
    clearcoatRoughness: 0.08,
    envMapIntensity:    2.0,
  });
}

function headlightMaterial(style) {
  const c = { normal: 0xffffd0, led: 0xb0d8ff, neon: 0x88ffcc, laser: 0xff6666 };
  const i = { normal: 4,        led: 6,         neon: 6,         laser: 8        };
  const col = new THREE.Color(c[style] || c.normal);
  return new THREE.MeshStandardMaterial({
    color:             col,
    emissive:          col,
    emissiveIntensity: i[style] || 4,
  });
}

function taillightMaterial() {
  return new THREE.MeshStandardMaterial({
    color:             new THREE.Color(0xff0000),
    emissive:          new THREE.Color(0xcc0000),
    emissiveIntensity: 3,
    transparent:       true,
    opacity:           0.85,
  });
}

function chromeMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color:     0xdddddd,
    metalness: 0.98,
    roughness: 0.04,
    clearcoat: 1.0,
    envMapIntensity: 2.5,
  });
}

function darkPlasticMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7, metalness: 0.05 });
}

// ═════════════════════════════════════════════════════════════════════════════
//  WHEEL ASSEMBLY
// ═════════════════════════════════════════════════════════════════════════════

function createWheelAssembly(style) {
  const g   = new THREE.Group();
  const tyR = 0.37, tyH = 0.24;
  const riR = 0.265, riH = 0.26;

  // Tyre (cylinder along Y, we'll rotate group so axis is along X)
  const tyre = new THREE.Mesh(
    new THREE.CylinderGeometry(tyR, tyR, tyH, 40, 1, false),
    tyreMaterial()
  );
  tyre.castShadow = true;
  g.add(tyre);

  // Tyre sidewall detail (ring)
  const sideMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });
  [-1, 1].forEach(side => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(tyR * 0.82, tyR * 0.04, 8, 40),
      sideMat
    );
    ring.position.y = side * tyH * 0.42;
    g.add(ring);
  });

  // Rim
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(riR, riR, riH + 0.01, 40),
    rimMaterial(style)
  );
  rim.castShadow = true;
  g.add(rim);

  // Spokes
  const spokeCount = style === 'spiky' ? 8 : style === 'gold' ? 10 : 5;
  const sR  = rimMaterial(style);
  for (let i = 0; i < spokeCount; i++) {
    const angle  = (i / spokeCount) * Math.PI * 2;
    const sW     = style === 'spiky' ? 0.04 : 0.042;
    const spoke  = new THREE.Mesh(
      new THREE.BoxGeometry(sW, riH + 0.02, riR * 1.55),
      sR
    );
    spoke.rotation.y = angle;
    g.add(spoke);
  }

  // Rim outer ring
  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(riR * 0.93, riR * 0.05, 8, 40),
    rimMaterial(style)
  );
  outerRing.rotation.x = Math.PI / 2;
  g.add(outerRing);

  // Centre cap
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.068, riH + 0.03, 20),
    chromeMaterial()
  );
  g.add(cap);

  // Brake disc (shows through spokes)
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.19, 0.025, 32),
    new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.6, metalness: 0.4 })
  );
  g.add(disc);

  // The wheel cylinder axis is Y; to mount on car facing outward we rotate 90° around Z
  g.rotation.z = Math.PI / 2;
  return g;
}

function addWheels(carGrp, positions, style) {
  positions.forEach(([x, y, z]) => {
    const w = createWheelAssembly(style);
    w.position.set(x, y, z);
    w.castShadow = true;
    carGrp.add(w);
  });
}

// ═════════════════════════════════════════════════════════════════════════════
//  EXTRUDED BODY HELPER
//  Takes a 2-D path spec (array of points/beziers), extrudes it, centres it.
// ═════════════════════════════════════════════════════════════════════════════

function makeBodyMesh(profileSpec, depth, material, bevel = 0.045) {
  const shape = new THREE.Shape();

  profileSpec.forEach((cmd, i) => {
    if (i === 0)                              shape.moveTo(cmd[0], cmd[1]);
    else if (cmd.length === 2)                shape.lineTo(cmd[0], cmd[1]);
    else if (cmd.length === 6)                shape.bezierCurveTo(...cmd);
    else if (cmd.length === 4)                shape.quadraticCurveTo(...cmd);
  });
  shape.closePath();

  const settings = {
    depth,
    bevelEnabled:    bevel > 0,
    bevelThickness:  bevel,
    bevelSize:       bevel * 0.75,
    bevelSegments:   5,
    curveSegments:   14,
  };

  const geo  = new THREE.ExtrudeGeometry(shape, settings);
  geo.center();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow    = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ═════════════════════════════════════════════════════════════════════════════
//  SEDAN  (Mercedes-like silhouette)
// ═════════════════════════════════════════════════════════════════════════════

function buildSedan(grp, s) {
  const col   = s.color;
  const depth = 1.80;   // car width
  const paint = paintMaterial(col);

  // ── Main body silhouette ────────────────────
  //  X: -2.1 (rear) → +2.25 (front)
  //  Y:  0.10 (bumper bottom) → 1.38 (roof)
  const bodyProfile = [
    [-2.08, 0.12],
    [-2.08, 0.12, -2.18, 0.14, -2.20, 0.35],
    [-2.20, 0.35, -2.18, 0.58, -2.04, 0.74],
    [-1.78, 0.76],
    [-1.18, 0.80],
    [-1.18, 0.80, -0.82, 0.84, -0.62, 0.96],
    [-0.62, 0.96, -0.44, 1.08, -0.35, 1.26],
    [-0.35, 1.26, -0.20, 1.38,  0.10, 1.40],
    [ 0.72, 1.40],
    [ 0.72, 1.40,  0.90, 1.38,  1.10, 1.26],
    [ 1.10, 1.26,  1.32, 1.14,  1.44, 0.98],
    [ 1.44, 0.98,  1.52, 0.90,  1.58, 0.84],
    [ 1.80, 0.80],
    [ 1.80, 0.80,  2.05, 0.76,  2.18, 0.68],
    [ 2.18, 0.68,  2.26, 0.56,  2.28, 0.38],
    [ 2.28, 0.38,  2.28, 0.18,  2.20, 0.12],
    [-2.08, 0.12],
  ];

  const body = makeBodyMesh(bodyProfile, depth, paint);
  // Centre the car so wheel-base midpoint is at X=0, bottom at Y=0
  body.position.set(0, 0, 0);
  grp.add(body);

  // ── Roof darker band (ambient occlusion impression) ──
  const roofProfile = [
    [-0.42, 1.00],
    [-0.42, 1.00, -0.28, 1.12, -0.20, 1.22],
    [-0.20, 1.22,  0.05, 1.34,  0.22, 1.36],
    [ 0.72, 1.36],
    [ 0.72, 1.36,  0.88, 1.34,  1.06, 1.24],
    [ 1.06, 1.24,  1.28, 1.12,  1.36, 0.98],
    [ 0.30, 0.82],
    [-0.42, 1.00],
  ];
  const roofMat = paintMaterial(col);
  roofMat.color.multiplyScalar(0.88);
  const roofMesh = makeBodyMesh(roofProfile, depth * 0.86, roofMat, 0.02);
  grp.add(roofMesh);

  // ── Windshield glass ────────────────────────
  const windProfile = [
    [ 1.08, 0.82],
    [ 1.08, 0.82,  1.30, 1.12,  1.14, 1.24],
    [ 0.78, 1.36],
    [ 0.78, 1.36,  0.72, 1.22,  0.78, 0.84],
    [ 1.08, 0.82],
  ];
  const windMesh = makeBodyMesh(windProfile, depth * 0.72, glassMaterial(), 0.01);
  windMesh.position.z -= depth * 0.07;
  grp.add(windMesh);

  // ── Side windows (rear quarter + main side) ──
  const sideWinProfile = [
    [-0.42,  0.98],
    [-0.42,  0.98, -0.28, 1.10, -0.20, 1.20],
    [ 0.68,  1.36],
    [ 0.68,  1.36,  0.72, 1.22,  0.74, 0.82],
    [ 0.60,  0.82],
    [-0.42,  0.98],
  ];
  const sideWin = makeBodyMesh(sideWinProfile, depth * 0.06, glassMaterial(), 0.005);
  sideWin.position.z = depth / 2 + 0.04;
  grp.add(sideWin);
  const sideWin2 = sideWin.clone();
  sideWin2.position.z = -(depth / 2 + 0.04);
  grp.add(sideWin2);

  // ── Rear window ────────────────────────────
  const rearWinProfile = [
    [-1.18, 0.80],
    [-1.18, 0.80, -0.90, 0.84, -0.66, 0.96],
    [-0.66, 0.96, -0.50, 1.06, -0.40, 1.22],
    [-0.20, 1.26],
    [-0.20, 1.26, -0.40, 1.28, -0.56, 1.24],
    [-0.56, 1.24, -0.72, 1.16, -0.92, 0.96],
    [-0.92, 0.96, -1.10, 0.82, -1.18, 0.80],
  ];
  const rearWin = makeBodyMesh(rearWinProfile, depth * 0.74, glassMaterial(), 0.01);
  grp.add(rearWin);

  // ── Door panel crease ────────────────────────
  const creaseMat = paintMaterial(col);
  creaseMat.color.multiplyScalar(0.78);
  const creaseGeo = new THREE.BoxGeometry(3.4, 0.04, depth + 0.1);
  const crease    = new THREE.Mesh(creaseGeo, creaseMat);
  crease.position.set(0.04, 0.60, 0);
  grp.add(crease);

  // ── Front grille ────────────────────────────
  const grilleMat = new THREE.MeshPhysicalMaterial({
    color: 0x222222, roughness: 0.3, metalness: 0.7,
  });
  const grilleGeo = new THREE.BoxGeometry(0.04, 0.26, 0.70);
  const grille    = new THREE.Mesh(grilleGeo, grilleMat);
  grille.position.set(2.25, 0.40, 0);
  grp.add(grille);
  // Grille slats
  for (let i = 0; i < 5; i++) {
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.025, 0.68),
      chromeMaterial()
    );
    slat.position.set(2.25, 0.28 + i * 0.052, 0);
    grp.add(slat);
  }

  // ── Front bumper lower ──────────────────────
  const bumperF = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.16, 1.50),
    darkPlasticMaterial()
  );
  bumperF.position.set(2.24, 0.20, 0);
  grp.add(bumperF);

  // ── Rear bumper ─────────────────────────────
  const bumperR = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.22, 1.55),
    darkPlasticMaterial()
  );
  bumperR.position.set(-2.16, 0.24, 0);
  grp.add(bumperR);

  // ── Headlights (front) ──────────────────────
  const hlMat = headlightMaterial(s.headlight);
  [0.55, -0.55].forEach(z => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.28), hlMat);
    hl.position.set(2.27, 0.55, z);
    grp.add(hl);
    // Add a point light inside each headlight
    const light = new THREE.PointLight(new THREE.Color(hlMat.color), 2, 3, 2);
    light.position.set(2.2, 0.55, z);
    grp.add(light);
  });

  // ── Tail lights ────────────────────────────
  const tlMat = taillightMaterial();
  [0.55, -0.55].forEach(z => {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.38), tlMat);
    tl.position.set(-2.16, 0.58, z);
    grp.add(tl);
    const rl = new THREE.PointLight(0xff2200, 1.5, 2.5, 2);
    rl.position.set(-2.1, 0.58, z);
    grp.add(rl);
  });

  // ── Side mirrors ────────────────────────────
  [depth / 2 + 0.06, -(depth / 2 + 0.06)].forEach(z => {
    const mirror = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.06, 0.08),
      darkPlasticMaterial()
    );
    mirror.position.set(1.15, 0.90, z);
    grp.add(mirror);
  });

  // ── Wheels ──────────────────────────────────
  const wY = 0.37;
  addWheels(grp, [
    [-1.28, wY, -(depth / 2 + 0.01)],
    [-1.28, wY,   depth / 2 + 0.01 ],
    [ 1.28, wY, -(depth / 2 + 0.01)],
    [ 1.28, wY,   depth / 2 + 0.01 ],
  ], s.wheel);

  // ── Spoiler ──────────────────────────────────
  addSpoiler(grp, 'sedan', s.spoiler, col, depth);
}

// ═════════════════════════════════════════════════════════════════════════════
//  SUPERCAR  (Lamborghini-like silhouette)
// ═════════════════════════════════════════════════════════════════════════════

function buildSupercar(grp, s) {
  const col   = s.color;
  const depth = 1.88;
  const paint = paintMaterial(col);

  // Very low, wedge-shaped profile
  const bodyProfile = [
    [-2.18, 0.12],
    [-2.18, 0.12, -2.26, 0.14, -2.28, 0.30],
    [-2.28, 0.30, -2.26, 0.54, -2.14, 0.60],
    [-2.00, 0.62],
    [-1.60, 0.64],
    [-1.60, 0.64, -1.22, 0.68, -0.98, 0.74],
    [-0.98, 0.74, -0.75, 0.80, -0.60, 0.96],
    [-0.60, 0.96, -0.44, 1.08, -0.30, 1.18],
    [-0.30, 1.18, -0.10, 1.26,  0.25, 1.28],
    [ 0.55, 1.28],
    [ 0.55, 1.28,  0.70, 1.26,  0.84, 1.18],
    [ 0.84, 1.18,  1.04, 1.04,  1.18, 0.88],
    [ 1.18, 0.88,  1.32, 0.74,  1.46, 0.68],
    [ 1.80, 0.64],
    [ 1.80, 0.64,  2.06, 0.62,  2.20, 0.58],
    [ 2.20, 0.58,  2.32, 0.52,  2.36, 0.38],
    [ 2.36, 0.38,  2.36, 0.18,  2.28, 0.12],
    [-2.18, 0.12],
  ];

  const body = makeBodyMesh(bodyProfile, depth, paint);
  grp.add(body);

  // Roof (narrower, lower)
  const roofProfile = [
    [-0.68,  0.74],
    [-0.68,  0.74, -0.48, 0.94, -0.34, 1.10],
    [-0.34,  1.10, -0.16, 1.24,  0.10, 1.26],
    [ 0.52,  1.26],
    [ 0.52,  1.26,  0.68, 1.24,  0.82, 1.14],
    [ 0.82,  1.14,  1.00, 1.00,  1.14, 0.86],
    [ 0.50,  0.72],
    [-0.68,  0.74],
  ];
  const roofMat = paintMaterial(col);
  roofMat.color.multiplyScalar(0.85);
  grp.add(makeBodyMesh(roofProfile, depth * 0.82, roofMat, 0.02));

  // Windshield
  const windProfile = [
    [ 1.12, 0.66],
    [ 1.12, 0.66,  1.24, 0.86,  1.14, 1.16],
    [ 0.54, 1.26],
    [ 0.54, 1.26,  0.60, 1.00,  0.66, 0.70],
    [ 1.12, 0.66],
  ];
  grp.add(makeBodyMesh(windProfile, depth * 0.70, glassMaterial(), 0.01));

  // Side glass
  const sideWinP = [
    [-0.72, 0.72],
    [-0.72, 0.72, -0.52, 0.94, -0.36, 1.08],
    [ 0.48, 1.24],
    [ 0.48, 1.24,  0.56, 1.04,  0.62, 0.68],
    [ 0.20, 0.64],
    [-0.72, 0.72],
  ];
  const sideW = makeBodyMesh(sideWinP, depth * 0.06, glassMaterial(), 0.005);
  sideW.position.z = depth / 2 + 0.04;
  grp.add(sideW);
  const sideW2 = sideW.clone();
  sideW2.position.z = -(depth / 2 + 0.04);
  grp.add(sideW2);

  // Air intake scoops (side)
  [depth / 2 * 0.85, -depth / 2 * 0.85].forEach(z => {
    const scoop = new THREE.Mesh(
      new THREE.BoxGeometry(0.40, 0.14, 0.08),
      darkPlasticMaterial()
    );
    scoop.position.set(-1.40, 0.56, z);
    grp.add(scoop);
  });

  // Low front splitter
  const splitter = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.06, depth * 0.90),
    darkPlasticMaterial()
  );
  splitter.position.set(2.34, 0.09, 0);
  grp.add(splitter);

  // Grille (low and wide)
  const grilleMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
  const grilleG   = new THREE.BoxGeometry(0.06, 0.22, 0.90);
  const grilleM   = new THREE.Mesh(grilleG, grilleMat);
  grilleM.position.set(2.32, 0.36, 0);
  grp.add(grilleM);

  // Headlights (sharp, angled)
  const hlMat = headlightMaterial(s.headlight);
  [0.62, -0.62].forEach(z => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.32), hlMat);
    hl.position.set(2.32, 0.50, z);
    hl.rotation.x = 0.25;
    grp.add(hl);
    const light = new THREE.PointLight(new THREE.Color(hlMat.color), 2, 3, 2);
    light.position.set(2.25, 0.50, z);
    grp.add(light);
  });

  // Tail lights (strip)
  const tlMat = taillightMaterial();
  const tlGeo = new THREE.BoxGeometry(0.06, 0.06, depth * 0.85);
  const tlMesh = new THREE.Mesh(tlGeo, tlMat);
  tlMesh.position.set(-2.24, 0.52, 0);
  grp.add(tlMesh);
  const rl = new THREE.PointLight(0xff2200, 2, 2.5, 2);
  rl.position.set(-2.18, 0.52, 0);
  grp.add(rl);

  // Side mirrors (very flat)
  [depth / 2 + 0.05, -(depth / 2 + 0.05)].forEach(z => {
    const mirror = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.04, 0.06),
      darkPlasticMaterial()
    );
    mirror.position.set(0.94, 0.88, z);
    grp.add(mirror);
  });

  // Wheels
  const wY = 0.37;
  addWheels(grp, [
    [-1.35, wY, -(depth / 2 + 0.01)],
    [-1.35, wY,   depth / 2 + 0.01 ],
    [ 1.38, wY, -(depth / 2 + 0.01)],
    [ 1.38, wY,   depth / 2 + 0.01 ],
  ], s.wheel);

  addSpoiler(grp, 'supercar', s.spoiler, col, depth);
}

// ═════════════════════════════════════════════════════════════════════════════
//  SUV  (Volvo-like silhouette)
// ═════════════════════════════════════════════════════════════════════════════

function buildSuv(grp, s) {
  const col   = s.color;
  const depth = 1.95;
  const paint = paintMaterial(col);

  // Tall, boxy profile
  const bodyProfile = [
    [-2.10, 0.12],
    [-2.10, 0.12, -2.18, 0.14, -2.20, 0.32],
    [-2.20, 0.32, -2.18, 0.60, -2.10, 0.74],
    [-2.10, 0.74],
    [-2.10, 0.74, -2.08, 0.90, -2.06, 1.10],
    [-2.06, 1.10, -2.00, 1.56, -1.90, 1.68],
    [-1.58, 1.76],
    [ 1.50, 1.76],
    [ 1.50, 1.76,  1.82, 1.74,  1.94, 1.62],
    [ 1.94, 1.62,  2.02, 1.50,  2.04, 1.30],
    [ 2.04, 1.30,  2.06, 1.10,  2.06, 0.90],
    [ 2.06, 0.90,  2.12, 0.76,  2.18, 0.66],
    [ 2.18, 0.66,  2.26, 0.52,  2.28, 0.36],
    [ 2.28, 0.36,  2.26, 0.18,  2.18, 0.12],
    [-2.10, 0.12],
  ];

  const body = makeBodyMesh(bodyProfile, depth, paint);
  grp.add(body);

  // Roof (flat, slightly darker)
  const roofProfile = [
    [-1.92, 1.62],
    [-1.92, 1.62, -1.96, 1.68, -1.60, 1.74],
    [ 1.52, 1.74],
    [ 1.52, 1.74,  1.82, 1.72,  1.92, 1.60],
    [ 1.50, 1.44],
    [-1.80, 1.44],
    [-1.92, 1.62],
  ];
  const roofMat = paintMaterial(col);
  roofMat.color.multiplyScalar(0.84);
  grp.add(makeBodyMesh(roofProfile, depth * 0.94, roofMat, 0.02));

  // Windshield (near vertical)
  const windProfile = [
    [ 1.94, 0.88],
    [ 1.94, 0.88,  1.98, 1.24,  1.92, 1.56],
    [ 1.52, 1.72],
    [ 1.52, 1.72,  1.50, 1.44,  1.52, 0.86],
    [ 1.94, 0.88],
  ];
  grp.add(makeBodyMesh(windProfile, depth * 0.74, glassMaterial(), 0.01));

  // Side windows (3 rows)
  const sideWinRows = [
    // Front
    [[ 1.50, 0.88], [ 1.50, 0.88, 1.52, 1.44, 1.52, 1.70], [ 0.66, 1.72], [ 0.66, 0.86], [ 1.50, 0.88]],
    // Middle
    [[ 0.60, 0.86], [ 0.60, 1.70], [-0.32, 1.70], [-0.32, 0.86], [ 0.60, 0.86]],
    // Rear
    [[-0.38, 0.86], [-0.38, 1.70], [-1.88, 1.64], [-1.88, 0.86], [-0.38, 0.86]],
  ];
  sideWinRows.forEach(pts => {
    const sw = makeBodyMesh(pts, depth * 0.06, glassMaterial(), 0.005);
    sw.position.z = depth / 2 + 0.04;
    grp.add(sw);
    const sw2 = sw.clone();
    sw2.position.z = -(depth / 2 + 0.04);
    grp.add(sw2);
  });

  // Rear window
  const rearWinP = [
    [-2.08, 0.76],
    [-2.08, 0.76, -2.06, 1.08, -2.04, 1.60],
    [-1.94, 1.66],
    [-1.94, 1.66, -1.92, 1.44, -1.90, 0.76],
    [-2.08, 0.76],
  ];
  grp.add(makeBodyMesh(rearWinP, depth * 0.76, glassMaterial(), 0.01));

  // Roof rack
  [-0.8, 0.0, 0.8].forEach(x => {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.04, depth * 0.92),
      chromeMaterial()
    );
    bar.position.set(x, 1.80, 0);
    grp.add(bar);
  });
  const longBar = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.03, 0.045),
    chromeMaterial()
  );
  longBar.position.set(0, 1.80, depth * 0.42);
  grp.add(longBar);
  const longBar2 = longBar.clone();
  longBar2.position.z = -depth * 0.42;
  grp.add(longBar2);

  // Headlights
  const hlMat = headlightMaterial(s.headlight);
  [0.65, -0.65].forEach(z => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.35), hlMat);
    hl.position.set(2.24, 0.60, z);
    grp.add(hl);
    const light = new THREE.PointLight(new THREE.Color(hlMat.color), 2, 3, 2);
    light.position.set(2.18, 0.60, z);
    grp.add(light);
  });

  // Tail lights (vertical strip)
  [0.65, -0.65].forEach(z => {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 0.12), taillightMaterial());
    tl.position.set(-2.16, 0.90, z);
    grp.add(tl);
  });

  // Side mirrors
  [depth / 2 + 0.06, -(depth / 2 + 0.06)].forEach(z => {
    const mirror = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.08, 0.10),
      darkPlasticMaterial()
    );
    mirror.position.set(1.80, 1.22, z);
    grp.add(mirror);
  });

  // Running boards
  [-depth / 2 - 0.02, depth / 2 + 0.02].forEach(z => {
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.045, 0.14),
      darkPlasticMaterial()
    );
    board.position.set(0, 0.26, z);
    grp.add(board);
  });

  const wY = 0.42;
  addWheels(grp, [
    [-1.25, wY, -(depth / 2 + 0.01)],
    [-1.25, wY,   depth / 2 + 0.01 ],
    [ 1.25, wY, -(depth / 2 + 0.01)],
    [ 1.25, wY,   depth / 2 + 0.01 ],
  ], s.wheel);

  addSpoiler(grp, 'suv', s.spoiler, col, depth);
}

// ═════════════════════════════════════════════════════════════════════════════
//  CLASSIC  (vintage rounded silhouette)
// ═════════════════════════════════════════════════════════════════════════════

function buildClassic(grp, s) {
  const col   = s.color;
  const depth = 1.72;
  const paint = paintMaterial(col);

  // Rounded, bulbous vintage profile
  const bodyProfile = [
    [-2.14, 0.12],
    [-2.14, 0.12, -2.22, 0.14, -2.24, 0.32],
    [-2.24, 0.32, -2.22, 0.52, -2.14, 0.64],
    [-2.14, 0.64, -2.04, 0.82, -1.85, 0.90],
    [-1.85, 0.90, -1.70, 0.96, -1.48, 1.00],
    [-1.48, 1.00, -1.22, 1.08, -1.02, 1.20],
    [-1.02, 1.20, -0.78, 1.30, -0.50, 1.38],
    [-0.50, 1.38, -0.22, 1.44,  0.10, 1.44],
    [ 0.54, 1.44],
    [ 0.54, 1.44,  0.78, 1.42,  0.96, 1.34],
    [ 0.96, 1.34,  1.20, 1.24,  1.38, 1.10],
    [ 1.38, 1.10,  1.56, 0.96,  1.68, 0.88],
    [ 1.68, 0.88,  1.90, 0.80,  2.04, 0.68],
    [ 2.04, 0.68,  2.18, 0.58,  2.22, 0.44],
    [ 2.22, 0.44,  2.24, 0.28,  2.18, 0.14],
    [ 2.18, 0.14,  2.12, 0.08,  2.00, 0.08],
    [-2.14, 0.12],
  ];

  const body = makeBodyMesh(bodyProfile, depth, paint);
  grp.add(body);

  // Roof (organic, rounded)
  const roofProfile = [
    [-1.06, 1.18],
    [-1.06, 1.18, -0.78, 1.28, -0.50, 1.36],
    [-0.50, 1.36, -0.22, 1.42,  0.10, 1.42],
    [ 0.52, 1.42],
    [ 0.52, 1.42,  0.78, 1.40,  0.94, 1.32],
    [ 0.94, 1.32,  1.18, 1.20,  1.36, 1.08],
    [ 0.48, 0.88],
    [-0.80, 0.88],
    [-1.06, 1.18],
  ];
  const roofMat = paintMaterial(col);
  roofMat.color.multiplyScalar(0.87);
  grp.add(makeBodyMesh(roofProfile, depth * 0.84, roofMat, 0.02));

  // Windshield
  const windProfile = [
    [ 1.14, 0.88],
    [ 1.14, 0.88,  1.26, 1.10,  1.12, 1.30],
    [ 0.56, 1.40],
    [ 0.56, 1.40,  0.62, 1.12,  0.62, 0.86],
    [ 1.14, 0.88],
  ];
  grp.add(makeBodyMesh(windProfile, depth * 0.70, glassMaterial(), 0.01));

  // Main side window (classic large window)
  const sideWinP = [
    [-1.08, 1.16],
    [-1.08, 1.16, -0.80, 1.26, -0.52, 1.34],
    [ 0.50, 1.38],
    [ 0.50, 1.38,  0.60, 1.14,  0.58, 0.84],
    [-0.72, 0.84],
    [-1.08, 1.16],
  ];
  const sw = makeBodyMesh(sideWinP, depth * 0.06, glassMaterial(), 0.005);
  sw.position.z = depth / 2 + 0.04;
  grp.add(sw);
  const sw2 = sw.clone();
  sw2.position.z = -(depth / 2 + 0.04);
  grp.add(sw2);

  // Rear window
  const rearWP = [
    [-1.06, 1.18],
    [-1.06, 1.18, -1.04, 1.08, -1.10, 0.88],
    [-0.74, 0.86],
    [-0.74, 0.86, -0.80, 0.96, -0.80, 1.16],
    [-0.80, 1.16, -0.94, 1.24, -1.06, 1.18],
  ];
  grp.add(makeBodyMesh(rearWP, depth * 0.72, glassMaterial(), 0.01));

  // Chrome bumper strips
  const bumperMat = chromeMaterial();
  [[-2.18, 0.32, 0.62], [2.14, 0.32, 0.62]].forEach(([x, y, zW]) => {
    const bGeo = new THREE.BoxGeometry(0.08, 0.10, zW);
    const bMesh = new THREE.Mesh(bGeo, bumperMat);
    bMesh.position.set(x, y, 0);
    grp.add(bMesh);
  });

  // Chrome side trim
  const trimGeo = new THREE.BoxGeometry(3.60, 0.04, 0.03);
  [depth / 2 + 0.04, -(depth / 2 + 0.04)].forEach(z => {
    const trim = new THREE.Mesh(trimGeo, bumperMat);
    trim.position.set(0, 0.60, z);
    grp.add(trim);
  });

  // Round headlights (classic look)
  const hlMat = headlightMaterial(s.headlight);
  [0.52, -0.52].forEach(z => {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.10, 16, 16), hlMat);
    hl.position.set(2.10, 0.60, z);
    grp.add(hl);
    const light = new THREE.PointLight(new THREE.Color(hlMat.color), 2, 3, 2);
    light.position.set(2.04, 0.60, z);
    grp.add(light);
  });

  // Round tail lights
  [0.52, -0.52].forEach(z => {
    const tl = new THREE.Mesh(new THREE.SphereGeometry(0.10, 16, 16), taillightMaterial());
    tl.position.set(-2.12, 0.60, z);
    grp.add(tl);
  });

  // Whitewall tyre option (handled in wheel assembly)
  // Classic round side mirrors
  [depth / 2 + 0.05, -(depth / 2 + 0.05)].forEach(z => {
    const mirror = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      chromeMaterial()
    );
    mirror.scale.set(1.5, 1, 0.8);
    mirror.position.set(1.22, 1.02, z);
    grp.add(mirror);
  });

  const wY = 0.37;
  addWheels(grp, [
    [-1.22, wY, -(depth / 2 + 0.01)],
    [-1.22, wY,   depth / 2 + 0.01 ],
    [ 1.22, wY, -(depth / 2 + 0.01)],
    [ 1.22, wY,   depth / 2 + 0.01 ],
  ], s.wheel);

  addSpoiler(grp, 'classic', s.spoiler, col, depth);
}

// ═════════════════════════════════════════════════════════════════════════════
//  SPOILER
// ═════════════════════════════════════════════════════════════════════════════

function addSpoiler(grp, shape, spoiler, col, depth) {
  if (spoiler === 'none') return;

  const paint = paintMaterial(col);

  // Rear X position per shape
  const rearX = { sedan: -2.15, supercar: -2.22, suv: -2.12, classic: -2.16 }[shape] || -2.15;
  const baseY = { sedan:  0.74, supercar:  0.58, suv:  1.60, classic:  0.74 }[shape] || 0.74;

  if (spoiler === 'wing') {
    // Wing blade (horizontal)
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.06, depth * 0.95),
      new THREE.MeshPhysicalMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 })
    );
    blade.position.set(rearX - 0.02, baseY + 0.38, 0);
    grp.add(blade);

    // Support stands
    [-depth * 0.32, depth * 0.32].forEach(z => {
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.36, 0.04),
        chromeMaterial()
      );
      stand.position.set(rearX - 0.02, baseY + 0.20, z);
      grp.add(stand);
    });

  } else {
    const heights = { small: 0.18, big: 0.34 };
    const sh = heights[spoiler] || 0.18;
    const spoilerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, sh, depth * 0.80),
      paint
    );
    spoilerMesh.position.set(rearX - 0.04, baseY + sh / 2, 0);
    grp.add(spoilerMesh);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  BUILD / REFRESH THE CURRENT CAR
// ═════════════════════════════════════════════════════════════════════════════

function buildCar() {
  if (!scene) return;

  if (carGroup) {
    scene.remove(carGroup);
    carGroup.traverse(obj => {
      if (obj.isMesh) { obj.geometry.dispose(); }
    });
  }

  carGroup = new THREE.Group();

  const builders = {
    sedan:    buildSedan,
    supercar: buildSupercar,
    suv:      buildSuv,
    classic:  buildClassic,
  };
  (builders[state.carShape] || buildSedan)(carGroup, state);

  // Lift car so wheels sit on the podium surface
  const wY = state.carShape === 'suv' ? 0.42 : 0.37;
  carGroup.position.y = wY + 0.06;

  scene.add(carGroup);
}

// ═════════════════════════════════════════════════════════════════════════════
//  PICKER  (2-D canvas thumbnails)
// ═════════════════════════════════════════════════════════════════════════════

function initPicker() {
  const grid = document.getElementById('car-grid');
  grid.innerHTML = '';

  CARS.forEach(car => {
    const card = document.createElement('div');
    card.className = 'car-card';

    const cv = document.createElement('canvas');
    cv.width = 200; cv.height = 120;
    drawThumbCar(cv.getContext('2d'), cv.width, cv.height, car.shape);
    card.appendChild(cv);

    card.innerHTML += `<div class="car-label">${car.label}</div>
                       <div class="car-desc">${car.desc}</div>`;
    card.prepend(cv);

    card.onclick = () => {
      state.carShape  = car.shape;
      state.wheel     = 'standard';
      state.headlight = 'normal';
      state.spoiler   = 'none';
      document.getElementById('garage-title').textContent = car.label + ' – Garage';
      showScreen('screen-garage');
      initGaragePanel();
    };
    grid.appendChild(card);
  });
}

// Quick 2-D thumbnail for the picker cards
function drawThumbCar(ctx, W, H, shape) {
  // showroom bg
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#ddd'); bg.addColorStop(1, '#bbb');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // simple silhouette based on shape
  const silhouettes = {
    sedan:    [[0.08,0.70],[0.08,0.55],[0.25,0.40],[0.55,0.32],[0.68,0.32],[0.82,0.40],[0.90,0.48],[0.92,0.70]],
    supercar: [[0.06,0.72],[0.06,0.60],[0.20,0.42],[0.45,0.30],[0.60,0.30],[0.75,0.38],[0.88,0.50],[0.94,0.72]],
    suv:      [[0.08,0.72],[0.08,0.52],[0.14,0.28],[0.22,0.22],[0.78,0.22],[0.88,0.28],[0.92,0.50],[0.92,0.72]],
    classic:  [[0.09,0.72],[0.09,0.60],[0.22,0.36],[0.38,0.28],[0.62,0.28],[0.78,0.36],[0.90,0.58],[0.91,0.72]],
  };
  const pts = silhouettes[shape] || silhouettes.sedan;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0]*W, pts[0][1]*H);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0]*W, pts[i][1]*H);
  ctx.closePath();
  const cg = ctx.createLinearGradient(0, H*0.28, 0, H*0.72);
  cg.addColorStop(0, '#e04030'); cg.addColorStop(0.4, '#c0392b'); cg.addColorStop(1, '#801010');
  ctx.fillStyle = cg; ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
  // windows
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#1a3045';
  ctx.fillRect(W*0.30, H*0.33, W*0.35, H*0.14);
  ctx.restore();
  // wheels
  [0.22, 0.76].forEach(x => {
    ctx.save();
    ctx.beginPath(); ctx.arc(x*W, H*0.72, H*0.10, 0, Math.PI*2);
    ctx.fillStyle = '#111'; ctx.fill();
    ctx.beginPath(); ctx.arc(x*W, H*0.72, H*0.065, 0, Math.PI*2);
    ctx.fillStyle = '#ccc'; ctx.fill();
    ctx.restore();
  });
}

// ═════════════════════════════════════════════════════════════════════════════
//  GARAGE PANEL
// ═════════════════════════════════════════════════════════════════════════════

function initGaragePanel() {
  // Color swatches
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

function buildOptBtns(containerId, options, stateKey) {
  const row = document.getElementById(containerId);
  row.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn' + (state[stateKey] === opt.id ? ' active' : '');
    btn.textContent = opt.label;
    btn.onclick = () => {
      state[stateKey] = opt.id;
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

// ═════════════════════════════════════════════════════════════════════════════
//  PHOTO – COLOUR EXTRACTION
// ═════════════════════════════════════════════════════════════════════════════

function extractColorFromPhoto(input) {
  const file = input.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    // Draw to a small canvas and sample
    const cv  = document.createElement('canvas');
    cv.width  = 100; cv.height = 100;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0, 100, 100);

    // Sample a region in the centre (where the car body usually is)
    const region = ctx.getImageData(20, 25, 60, 50);
    const data   = region.data;

    // Build histogram of saturated colours (skip grey/dark/white)
    const buckets = {};
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      const { h, s, v } = rgbToHsv(r, g, b);
      if (s < 0.15 || v < 0.12 || v > 0.96) continue; // skip grey / black / white
      const hBucket = Math.round(h / 12) * 12;
      buckets[hBucket] = (buckets[hBucket] || 0) + 1;
    }

    // Find dominant hue bucket
    let bestH = 0, bestCount = 0;
    for (const [hStr, count] of Object.entries(buckets)) {
      if (count > bestCount) { bestCount = count; bestH = parseInt(hStr); }
    }

    // Convert back to a nice saturated version of that hue
    const extractedRgb = hsvToRgb(bestH / 360, 0.78, 0.72);
    const hexColor = rgbToHex(...extractedRgb);

    // Apply
    state.color = hexColor;
    buildCar();

    // Show preview
    const thumb     = document.getElementById('photo-thumb');
    const swatch    = document.getElementById('extracted-swatch');
    const nameEl    = document.getElementById('extracted-name');
    const resultDiv = document.getElementById('photo-result');

    thumb.src           = img.src;
    swatch.style.background  = hexColor;
    nameEl.textContent  = 'Matched: ' + hexColor;
    resultDiv.classList.remove('hidden');
    document.getElementById('custom-color').value = hexColor;

    showToast('🎨 Colour matched from photo!');
  };
  img.src = URL.createObjectURL(file);
}

// ── Colour space helpers ────────────────────────────────────────────────────

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s, v };
}

function hsvToRgb(h, s, v) {
  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r=v; g=t; b=p; break;
    case 1: r=q; g=v; b=p; break;
    case 2: r=p; g=v; b=t; break;
    case 3: r=p; g=q; b=v; break;
    case 4: r=t; g=p; b=v; break;
    case 5: r=v; g=p; b=q; break;
  }
  return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// ═════════════════════════════════════════════════════════════════════════════
//  SAVE / COLLECTION
// ═════════════════════════════════════════════════════════════════════════════

function openSaveDialog() {
  document.getElementById('save-dialog').classList.remove('hidden');
  document.getElementById('car-name-input').value = '';
  document.getElementById('car-name-input').focus();
}

function closeSaveDialog() {
  document.getElementById('save-dialog').classList.add('hidden');
}

function saveCarToCollection() {
  const name     = document.getElementById('car-name-input').value.trim() || 'My Car';
  const snapshot = renderer ? renderer.domElement.toDataURL('image/jpeg', 0.75) : '';
  savedCars.push({ name, snapshot, config: { ...state } });
  localStorage.setItem('charlies-cars-3d', JSON.stringify(savedCars));
  closeSaveDialog();
  showToast(`💾 "${name}" saved to collection!`);
  // Update collection badge if visible
  const btn = document.querySelector('.bar-btn');
  if (btn && btn.textContent.startsWith('🏁')) {
    btn.textContent = `🏁 Collection (${savedCars.length})`;
  }
}

function renderCollection() {
  const grid = document.getElementById('collection-grid');
  grid.innerHTML = '';
  if (savedCars.length === 0) {
    grid.innerHTML = '<p style="color:#aaa;text-align:center;grid-column:1/-1;padding:40px 0">No saved cars yet — go design one! 🚗</p>';
    return;
  }
  savedCars.forEach((car, i) => {
    const card = document.createElement('div');
    card.className = 'coll-card';

    if (car.snapshot) {
      const img = document.createElement('img');
      img.src   = car.snapshot;
      img.style.cssText = 'width:100%;border-radius:8px;margin-bottom:10px;display:block';
      card.appendChild(img);
    }

    card.innerHTML += `<div class="coll-name">🚗 ${car.name}</div>`;

    const editBtn = document.createElement('button');
    editBtn.className = 'opt-btn'; editBtn.style.marginTop = '6px';
    editBtn.textContent = '✏ Edit';
    editBtn.onclick = () => {
      Object.assign(state, car.config);
      document.getElementById('garage-title').textContent =
        CARS.find(c => c.shape === state.carShape)?.label + ' – Garage' || 'Garage';
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
  const link    = document.createElement('a');
  link.download = 'charlies-car.png';
  link.href     = renderer.domElement.toDataURL();
  link.click();
  showToast('📸 Screenshot saved!');
}

// ═════════════════════════════════════════════════════════════════════════════
//  BOOT
// ═════════════════════════════════════════════════════════════════════════════

function boot() {
  initPicker();
  showScreen('screen-pick');

  // Make functions available to inline HTML onclick handlers
  Object.assign(window, {
    showScreen, goToPicker, viewCollection,
    setCustomColor, openSaveDialog, closeSaveDialog,
    saveCarToCollection, takeScreenshot, extractColorFromPhoto,
  });
}

boot();
