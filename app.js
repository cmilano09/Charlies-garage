// ─────────────────────────────────────────────
//  Charlie's Car Designer – app.js  v2.0
//  Showroom Edition – realistic canvas rendering
// ─────────────────────────────────────────────

const CARS = [
  { id: 'mercedes', label: 'Mercedes-Benz', desc: 'Sleek & luxurious',      shape: 'sedan'    },
  { id: 'lambo',    label: 'Lamborghini',   desc: 'Low & aggressive',        shape: 'supercar' },
  { id: 'volvo',    label: 'Volvo SUV',     desc: 'Powerful & refined',      shape: 'suv'      },
  { id: 'starter',  label: 'Classic',       desc: 'Timeless vintage style',  shape: 'classic'  },
];

const COLORS = [
  { name: 'Racing Red',    hex: '#c0392b' },
  { name: 'Burnt Orange',  hex: '#ca6f1e' },
  { name: 'Sunburst',      hex: '#d4ac0d' },
  { name: 'British Green', hex: '#1e7e34' },
  { name: 'Ocean Blue',    hex: '#1f618d' },
  { name: 'Midnight',      hex: '#17202a' },
  { name: 'Purple',        hex: '#6c3483' },
  { name: 'Hot Pink',      hex: '#c0185c' },
  { name: 'Pearl White',   hex: '#e8e8e8' },
  { name: 'Silver',        hex: '#7f8c8d' },
  { name: 'Obsidian',      hex: '#1c1c1c' },
  { name: 'Rainbow',       hex: 'rainbow' },
  { name: 'Lava',          hex: 'lava'    },
];

const WHEELS = [
  { id: 'standard', label: '⚙ Standard' },
  { id: 'sport',    label: '🏎 Sport'    },
  { id: 'gold',     label: '✨ Gold'     },
  { id: 'spiky',    label: '🔩 Spiky'   },
];

const STICKERS = [
  { id: 'none',      label: '✖ None'      },
  { id: 'flames',    label: '🔥 Flames'   },
  { id: 'stars',     label: '⭐ Stars'    },
  { id: 'stripes',   label: '〰 Stripes'  },
  { id: 'lightning', label: '⚡ Lightning' },
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

const BG_SCENES = [
  { label: '🏁 Racetrack',      gradient: ['#555', '#333'], groundColor: '#ccc', groundStripe: true  },
  { label: '🏙 City Street',    gradient: ['#1a1a3e', '#2a2a5e'], groundColor: '#444', groundStripe: false },
  { label: '🏔 Mountains',      gradient: ['#87ceeb', '#ddeeff'], groundColor: '#5d8a5e', groundStripe: false },
  { label: '🌅 Sunset Highway', gradient: ['#ff7043', '#ffcc02'], groundColor: '#8b6f47', groundStripe: true  },
];

// ── State ──────────────────────────────────────

const state = {
  carShape:  'sedan',
  color:     '#c0392b',
  wheel:     'standard',
  sticker:   'none',
  headlight: 'normal',
  spoiler:   'none',
  bgIndex:   0,
};

let savedCars = JSON.parse(localStorage.getItem('charlies-cars') || '[]');

// ── Utility ────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'screen-collection') renderCollection();
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2200);
}

// ── Car Picker ─────────────────────────────────

function initPicker() {
  const grid = document.getElementById('car-grid');
  grid.innerHTML = '';
  CARS.forEach(car => {
    const card = document.createElement('div');
    card.className = 'car-card';
    const cv = document.createElement('canvas');
    cv.width = 200; cv.height = 120;
    card.appendChild(cv);
    card.innerHTML += `<div class="car-label">${car.label}</div><div class="car-desc">${car.desc}</div>`;
    card.prepend(cv);
    drawCar(cv.getContext('2d'), cv.width, cv.height, { ...state, carShape: car.shape, color: '#c0392b' }, true);
    card.onclick = () => {
      state.carShape  = car.shape;
      state.color     = '#c0392b';
      state.wheel     = 'standard';
      state.sticker   = 'none';
      state.headlight = 'normal';
      state.spoiler   = 'none';
      showScreen('screen-garage');
      initGarage();
      renderGarage();
    };
    grid.appendChild(card);
  });
}

// ── Garage ─────────────────────────────────────

function initGarage() {
  const swatchRow = document.getElementById('color-swatches');
  swatchRow.innerHTML = '';
  COLORS.forEach(c => {
    const s = document.createElement('div');
    s.className = 'swatch' + (state.color === c.hex ? ' active' : '');
    s.title = c.name;
    if (c.hex === 'rainbow') {
      s.style.background = 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)';
    } else if (c.hex === 'lava') {
      s.style.background = 'linear-gradient(135deg,#ff4500,#ff8c00,#ff0000)';
    } else {
      s.style.background = c.hex;
    }
    s.onclick = () => {
      state.color = c.hex;
      document.getElementById('custom-color').value = (c.hex.startsWith('#') ? c.hex : '#c0392b');
      document.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
      s.classList.add('active');
      renderGarage();
    };
    swatchRow.appendChild(s);
  });
  buildOptBtns('wheel-btns',     WHEELS,     'wheel');
  buildOptBtns('sticker-btns',   STICKERS,   'sticker');
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
      renderGarage();
    };
    row.appendChild(btn);
  });
}

function setCustomColor(hex) {
  state.color = hex;
  document.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
  renderGarage();
}

function renderGarage() {
  const cv = document.getElementById('car-canvas');
  drawCar(cv.getContext('2d'), cv.width, cv.height, state, false);
}

// ══════════════════════════════════════════════
//  SHOWROOM DRAW ENGINE
// ══════════════════════════════════════════════

function drawCar(ctx, W, H, s, small) {
  ctx.clearRect(0, 0, W, H);
  drawShowroom(ctx, W, H, small);
  const shapes = { sedan: drawSedan, supercar: drawSupercar, suv: drawSuv, classic: drawClassic };
  (shapes[s.carShape] || drawSedan)(ctx, W, H, s, small);
}

// ── Showroom Environment ───────────────────────

function drawShowroom(ctx, W, H, small) {
  // Background wall gradient (bright showroom white)
  const wallGrad = ctx.createLinearGradient(0, 0, 0, H * 0.72);
  wallGrad.addColorStop(0,   '#d8d8d8');
  wallGrad.addColorStop(0.4, '#f2f2f2');
  wallGrad.addColorStop(1,   '#e0e0e0');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, W, H * 0.72);

  // Overhead spotlight bloom
  if (!small) {
    const spot = ctx.createRadialGradient(W * 0.5, 0, 0, W * 0.5, H * 0.25, W * 0.55);
    spot.addColorStop(0,   'rgba(255,255,255,0.6)');
    spot.addColorStop(0.5, 'rgba(255,255,255,0.15)');
    spot.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, W, H * 0.72);
  }

  // Showroom floor
  const floorY = H * 0.72;
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, H);
  floorGrad.addColorStop(0,   '#b8b8b8');
  floorGrad.addColorStop(0.25, '#cccccc');
  floorGrad.addColorStop(1,   '#a0a0a0');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, floorY, W, H - floorY);

  // Floor highlight stripe (reflection of ceiling light)
  if (!small) {
    const stripe = ctx.createLinearGradient(0, floorY, W, floorY);
    stripe.addColorStop(0,   'rgba(255,255,255,0)');
    stripe.addColorStop(0.35, 'rgba(255,255,255,0.25)');
    stripe.addColorStop(0.65, 'rgba(255,255,255,0.25)');
    stripe.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = stripe;
    ctx.fillRect(0, floorY, W, 3);
  }

  // Subtle floor grid lines
  if (!small) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += W * 0.12) {
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(W * 0.5 + (x - W * 0.5) * 2.5, H);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ── Color Utilities ────────────────────────────

function hexToRgb(hex) {
  if (!hex.startsWith('#')) return [150, 150, 150];
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return [r, g, b];
}

function createPaintGradient(ctx, color, x, y, w, h) {
  if (color === 'rainbow') {
    const hg = ctx.createLinearGradient(x, y, x + w, y);
    hg.addColorStop(0,    '#c0392b');
    hg.addColorStop(0.17, '#e67e22');
    hg.addColorStop(0.33, '#d4ac0d');
    hg.addColorStop(0.5,  '#1e7e34');
    hg.addColorStop(0.67, '#1f618d');
    hg.addColorStop(0.83, '#6c3483');
    hg.addColorStop(1,    '#c0185c');
    return hg;
  }
  if (color === 'lava') {
    const lg = ctx.createLinearGradient(x, y, x, y + h);
    lg.addColorStop(0,   '#ff8c00');
    lg.addColorStop(0.3, '#ff4500');
    lg.addColorStop(0.6, '#cc2200');
    lg.addColorStop(1,   '#7a1000');
    return lg;
  }
  const [r, g, b] = hexToRgb(color);
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  // Highlight → base → shadow → subtle reflection → deep shadow
  grad.addColorStop(0,    `rgb(${Math.min(255,r+100)},${Math.min(255,g+100)},${Math.min(255,b+100)})`);
  grad.addColorStop(0.15, `rgb(${Math.min(255,r+55)},${Math.min(255,g+55)},${Math.min(255,b+55)})`);
  grad.addColorStop(0.42, `rgb(${r},${g},${b})`);
  grad.addColorStop(0.62, `rgb(${Math.max(0,r-45)},${Math.max(0,g-45)},${Math.max(0,b-45)})`);
  grad.addColorStop(0.80, `rgb(${Math.min(255,r+20)},${Math.min(255,g+20)},${Math.min(255,b+20)})`);
  grad.addColorStop(1,    `rgb(${Math.max(0,r-75)},${Math.max(0,g-75)},${Math.max(0,b-75)})`);
  return grad;
}

// Returns a darkened color string for trim/shadow
function paintDark(color, amt) {
  if (color === 'rainbow' || color === 'lava') return '#555';
  const [r, g, b] = hexToRgb(color);
  return `rgb(${Math.max(0,r-amt)},${Math.max(0,g-amt)},${Math.max(0,b-amt)})`;
}

// ── Realistic Wheel ────────────────────────────

function drawWheel(ctx, cx, cy, r, style) {
  ctx.save();

  // Drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur  = r * 0.5;
  ctx.shadowOffsetY = r * 0.2;

  // Outer tyre
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  const tyreGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.05, cx, cy, r);
  tyreGrad.addColorStop(0,   '#4a4a4a');
  tyreGrad.addColorStop(0.55, '#1e1e1e');
  tyreGrad.addColorStop(1,   '#0a0a0a');
  ctx.fillStyle = tyreGrad;
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Tyre sidewall highlight
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.96, Math.PI * 1.05, Math.PI * 1.65);
  ctx.strokeStyle = 'rgba(90,90,90,0.7)';
  ctx.lineWidth   = r * 0.07;
  ctx.stroke();

  // Rim base
  const rimR = r * 0.70;
  ctx.beginPath();
  ctx.arc(cx, cy, rimR, 0, Math.PI * 2);
  const rimCols = {
    standard: ['#b0b0b0', '#e0e0e0', '#808080'],
    sport:    ['#9090a0', '#d0d0e8', '#505060'],
    gold:     ['#a07810', '#ffd700', '#7a5a00'],
    spiky:    ['#aa2222', '#ff5555', '#660000'],
  };
  const [rc0, rc1, rc2] = rimCols[style] || rimCols.standard;
  const rimGrad = ctx.createRadialGradient(cx - rimR * 0.3, cy - rimR * 0.3, 0, cx, cy, rimR);
  rimGrad.addColorStop(0,   rc1);
  rimGrad.addColorStop(0.55, rc0);
  rimGrad.addColorStop(1,   rc2);
  ctx.fillStyle = rimGrad;
  ctx.fill();

  // Spokes
  ctx.save();
  ctx.translate(cx, cy);
  const spokeCount = (style === 'spiky') ? 8 : (style === 'gold') ? 10 : 5;
  const spokeCol   = (style === 'gold') ? '#ffd700' : (style === 'spiky') ? '#ff4444' : '#c8c8c8';
  const spokeW     = (style === 'spiky') ? r * 0.07 : r * 0.10;
  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * rimR * 0.15, Math.sin(angle) * rimR * 0.15);
    ctx.lineTo(Math.cos(angle) * rimR * 0.88, Math.sin(angle) * rimR * 0.88);
    ctx.strokeStyle = spokeCol;
    ctx.lineWidth   = spokeW;
    ctx.lineCap     = 'round';
    ctx.stroke();
  }
  ctx.restore();

  // Inner rim ring
  ctx.beginPath();
  ctx.arc(cx, cy, rimR * 0.88, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth   = rimR * 0.04;
  ctx.stroke();

  // Center cap
  const capR = rimR * 0.18;
  ctx.beginPath();
  ctx.arc(cx, cy, capR, 0, Math.PI * 2);
  const capGrad = ctx.createRadialGradient(cx - capR * 0.3, cy - capR * 0.3, 0, cx, cy, capR);
  capGrad.addColorStop(0, '#e8e8e8');
  capGrad.addColorStop(1, '#555');
  ctx.fillStyle = capGrad;
  ctx.fill();

  // Specular glint on tyre
  ctx.beginPath();
  ctx.arc(cx - r * 0.32, cy - r * 0.34, r * 0.10, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fill();

  ctx.restore();
}

// ── Headlight ──────────────────────────────────

function drawHeadlight(ctx, x, y, rw, rh, style) {
  const palettes = {
    normal: { glow: 'rgba(255,255,180,0.45)', lens: '#ffffd0', inner: '#ffffff' },
    led:    { glow: 'rgba(100,180,255,0.55)', lens: '#cce8ff', inner: '#ffffff' },
    neon:   { glow: 'rgba(0,255,150,0.55)',   lens: '#ccffe8', inner: '#80ffcc' },
    laser:  { glow: 'rgba(255,40,40,0.60)',   lens: '#ffcccc', inner: '#ff4444' },
  };
  const p = palettes[style] || palettes.normal;

  ctx.save();

  // Outer glow
  const gr = Math.max(rw, rh) * 2.5;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, gr);
  glow.addColorStop(0,   p.glow);
  glow.addColorStop(0.5, p.glow.replace(/[\d.]+\)$/, '0.08)'));
  glow.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(x, y, gr, gr * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();

  // Housing
  ctx.beginPath();
  ctx.ellipse(x, y, rw + 2.5, rh + 2.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();

  // Lens
  ctx.beginPath();
  ctx.ellipse(x, y, rw, rh, 0, 0, Math.PI * 2);
  const lensGrad = ctx.createRadialGradient(x - rw * 0.25, y - rh * 0.25, 0, x, y, Math.max(rw, rh));
  lensGrad.addColorStop(0,   p.inner);
  lensGrad.addColorStop(0.5, p.lens);
  lensGrad.addColorStop(1,   '#777');
  ctx.fillStyle = lensGrad;
  ctx.fill();

  // Specular dot
  ctx.beginPath();
  ctx.ellipse(x - rw * 0.28, y - rh * 0.28, rw * 0.28, rh * 0.28, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fill();

  ctx.restore();
}

// ── Window glass helper ────────────────────────

function drawWindow(ctx, points, small) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (let i = 1; i < points.length; i++) {
    if (points[i].length === 6) {
      ctx.bezierCurveTo(...points[i]);
    } else {
      ctx.lineTo(...points[i]);
    }
  }
  ctx.closePath();
  ctx.fillStyle = small ? 'rgba(20,55,90,0.70)' : 'rgba(14,42,72,0.82)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();

  if (!small) {
    // Glass shine streak
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(points[0][0] + 6, points[0][1] + 4);
    ctx.lineTo(points[0][0] + 18, points[0][1] + 4);
    const last = points[points.length - 1];
    const lx = last.length === 6 ? last[4] : last[0];
    const ly = last.length === 6 ? last[5] : last[1];
    ctx.lineTo(lx + 8, ly + 8);
    ctx.lineTo(lx - 4, ly + 8);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// ── Car shadow on floor ────────────────────────

function drawFloorShadow(ctx, W, H, cx, rx, ry) {
  ctx.save();
  const sg = ctx.createRadialGradient(cx, H * 0.72, 0, cx, H * 0.72, rx);
  sg.addColorStop(0,   'rgba(0,0,0,0.42)');
  sg.addColorStop(0.55, 'rgba(0,0,0,0.15)');
  sg.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.ellipse(cx, H * 0.722, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ══════════════════════════════════════════════
//  CAR SHAPES
// ══════════════════════════════════════════════

// ── SEDAN ──────────────────────────────────────

function drawSedan(ctx, W, H, s, small) {
  const fY  = H * 0.72;           // floor Y (showroom floor)
  const wR  = Math.max(10, H * 0.118);
  const wCY = fY - wR;            // wheel center Y
  const rwX = W * 0.255;          // rear wheel X
  const fwX = W * 0.745;          // front wheel X

  // Paint gradient over body height
  const bTop = fY - H * 0.58;
  const bH   = H * 0.58;
  const paint = createPaintGradient(ctx, s.color, W * 0.09, bTop, W * 0.82, bH);

  // ── Body silhouette ──────────────────────────
  ctx.save();
  ctx.beginPath();

  // Rear bumper bottom-left
  ctx.moveTo(W * 0.088, fY);

  // up rear bumper face
  ctx.bezierCurveTo(W * 0.075, fY, W * 0.07, fY - H * 0.06, W * 0.075, fY - H * 0.15);
  // rear trunk top edge
  ctx.lineTo(W * 0.115, fY - H * 0.235);
  // trunk lid
  ctx.lineTo(W * 0.225, fY - H * 0.27);
  // C-pillar / rear window slope
  ctx.bezierCurveTo(W * 0.265, fY - H * 0.275, W * 0.305, fY - H * 0.38, W * 0.325, fY - H * 0.445);
  // roofline rear
  ctx.lineTo(W * 0.355, fY - H * 0.555);
  // roof
  ctx.bezierCurveTo(W * 0.375, fY - H * 0.572, W * 0.565, fY - H * 0.572, W * 0.59, fY - H * 0.555);
  // A-pillar
  ctx.bezierCurveTo(W * 0.625, fY - H * 0.52, W * 0.655, fY - H * 0.44, W * 0.665, fY - H * 0.37);
  // windshield base to hood
  ctx.lineTo(W * 0.72, fY - H * 0.305);
  // hood slope
  ctx.bezierCurveTo(W * 0.80, fY - H * 0.295, W * 0.87, fY - H * 0.285, W * 0.905, fY - H * 0.265);
  // front nose
  ctx.bezierCurveTo(W * 0.935, fY - H * 0.255, W * 0.945, fY - H * 0.195, W * 0.945, fY - H * 0.13);
  // front bumper
  ctx.bezierCurveTo(W * 0.948, fY - H * 0.055, W * 0.935, fY, W * 0.915, fY);

  // bottom – front wheel arch
  ctx.lineTo(fwX + wR * 1.12, fY);
  ctx.arc(fwX, wCY, wR * 1.12, Math.PI * 0.5, Math.PI * 0.5, true); // no-op arc for continuity
  // draw arch as bezier instead for smooth clip
  ctx.lineTo(fwX + wR * 1.12, fY);
  archCut(ctx, fwX, wCY, wR * 1.12);

  // between arches
  ctx.lineTo(rwX + wR * 1.12, fY);
  archCut(ctx, rwX, wCY, wR * 1.12);

  ctx.lineTo(W * 0.088, fY);
  ctx.closePath();

  ctx.fillStyle = paint;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.30)';
  ctx.lineWidth   = 1.5;
  ctx.stroke();
  ctx.restore();

  // ── Roof darker shade ─────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W * 0.325, fY - H * 0.445);
  ctx.lineTo(W * 0.355, fY - H * 0.555);
  ctx.bezierCurveTo(W * 0.375, fY - H * 0.572, W * 0.565, fY - H * 0.572, W * 0.59, fY - H * 0.555);
  ctx.bezierCurveTo(W * 0.625, fY - H * 0.52, W * 0.655, fY - H * 0.44, W * 0.665, fY - H * 0.37);
  ctx.bezierCurveTo(W * 0.62, fY - H * 0.365, W * 0.58, fY - H * 0.37, W * 0.56, fY - H * 0.38);
  ctx.bezierCurveTo(W * 0.45, fY - H * 0.38, W * 0.38, fY - H * 0.395, W * 0.325, fY - H * 0.445);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fill();
  ctx.restore();

  // ── Door panel line ───────────────────────────
  if (!small) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(W * 0.225, fY - H * 0.27);
    ctx.bezierCurveTo(W * 0.38, fY - H * 0.28, W * 0.59, fY - H * 0.275, W * 0.72, fY - H * 0.305);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    // Vertical door split
    ctx.beginPath();
    ctx.moveTo(W * 0.49, fY - H * 0.555);
    ctx.lineTo(W * 0.49, fY - H * 0.285);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.restore();
  }

  // ── Windows ───────────────────────────────────
  // Front window
  drawWindow(ctx, [
    [W*0.595, fY - H*0.445],
    [W*0.600, fY - H*0.530],
    [W*0.580, fY - H*0.555],
    [W*0.500, fY - H*0.555],
    [W*0.494, fY - H*0.442],
    [W*0.548, fY - H*0.428, W*0.580, fY - H*0.435, W*0.595, fY - H*0.445],
  ], small);

  // Rear window
  drawWindow(ctx, [
    [W*0.490, fY - H*0.555],
    [W*0.370, fY - H*0.555],
    [W*0.325, fY - H*0.445],
    [W*0.400, fY - H*0.442],
    [W*0.484, fY - H*0.442],
  ], small);

  // Windshield
  drawWindow(ctx, [
    [W*0.600, fY - H*0.530],
    [W*0.595, fY - H*0.445],
    [W*0.660, fY - H*0.370],
    [W*0.675, fY - H*0.375, W*0.645, fY - H*0.455, W*0.635, fY - H*0.515],
    [W*0.620, fY - H*0.525],
  ], small);

  // ── Grille ────────────────────────────────────
  if (!small) {
    ctx.save();
    const grX = W * 0.910, grY = fY - H * 0.19, grW = W * 0.034, grH = H * 0.09;
    const grilleGrad = ctx.createLinearGradient(grX, 0, grX + grW, 0);
    grilleGrad.addColorStop(0, '#555');
    grilleGrad.addColorStop(0.5, '#aaa');
    grilleGrad.addColorStop(1, '#555');
    ctx.fillStyle = grilleGrad;
    roundRect(ctx, grX, grY, grW, grH, 3);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.8;
    for (let gy = grY + H * 0.017; gy < grY + grH - 2; gy += H * 0.02) {
      ctx.beginPath();
      ctx.moveTo(grX + 1, gy);
      ctx.lineTo(grX + grW - 1, gy);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Headlights & Taillights ───────────────────
  if (!small) {
    drawHeadlight(ctx, W * 0.934, fY - H * 0.195, W * 0.018, H * 0.038, s.headlight);
    // Tail light
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(W * 0.088, fY - H * 0.195, W * 0.016, H * 0.035, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#8b0000';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(W * 0.088, fY - H * 0.195, W * 0.008, H * 0.016, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4444';
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }

  // ── Spoiler ───────────────────────────────────
  if (!small) drawSpoilerOnCar(ctx, W, H, 'sedan', s.spoiler, s.color, fY);

  // ── Sticker ───────────────────────────────────
  if (!small) drawSticker(ctx, W, H, s.sticker, s.color);

  // ── Wheels ───────────────────────────────────
  drawWheel(ctx, rwX, wCY, wR, s.wheel);
  drawWheel(ctx, fwX, wCY, wR, s.wheel);

  // ── Floor shadow ─────────────────────────────
  drawFloorShadow(ctx, W, H, W * 0.5, W * 0.33, H * 0.025);
}

// helper: smooth wheel-arch cutout using bezier
function archCut(ctx, cx, cy, r) {
  // Walk from right side of arch over the top to the left
  ctx.bezierCurveTo(
    cx + r,     cy + r * 0.1,
    cx + r,     cy - r,
    cx,         cy - r
  );
  ctx.bezierCurveTo(
    cx - r,     cy - r,
    cx - r,     cy + r * 0.1,
    cx - r,     cy + r * 0.5
  );
}

// ── SUPERCAR ───────────────────────────────────

function drawSupercar(ctx, W, H, s, small) {
  const fY  = H * 0.72;
  const wR  = Math.max(10, H * 0.122);
  const wCY = fY - wR;
  const rwX = W * 0.235;
  const fwX = W * 0.755;

  const bTop = fY - H * 0.52;
  const paint = createPaintGradient(ctx, s.color, W * 0.05, bTop, W * 0.90, H * 0.52);

  // Body
  ctx.save();
  ctx.beginPath();
  // rear
  ctx.moveTo(W * 0.065, fY);
  ctx.bezierCurveTo(W * 0.052, fY, W * 0.045, fY - H * 0.04, W * 0.050, fY - H * 0.09);
  // rear deck / engine cover (supercars have flat rear)
  ctx.lineTo(W * 0.080, fY - H * 0.155);
  ctx.lineTo(W * 0.150, fY - H * 0.19);
  // rear window up
  ctx.bezierCurveTo(W * 0.195, fY - H * 0.21, W * 0.265, fY - H * 0.39, W * 0.285, fY - H * 0.44);
  // roof (very short and low)
  ctx.lineTo(W * 0.305, fY - H * 0.495);
  ctx.bezierCurveTo(W * 0.325, fY - H * 0.515, W * 0.545, fY - H * 0.515, W * 0.565, fY - H * 0.50);
  // windshield (steep)
  ctx.bezierCurveTo(W * 0.605, fY - H * 0.47, W * 0.655, fY - H * 0.38, W * 0.675, fY - H * 0.31);
  // long hood
  ctx.bezierCurveTo(W * 0.75, fY - H * 0.295, W * 0.85, fY - H * 0.275, W * 0.90, fY - H * 0.26);
  // front nose (very low and sharp)
  ctx.bezierCurveTo(W * 0.938, fY - H * 0.25, W * 0.950, fY - H * 0.20, W * 0.950, fY - H * 0.115);
  ctx.bezierCurveTo(W * 0.952, fY - H * 0.04, W * 0.940, fY, W * 0.920, fY);

  // front wheel arch
  ctx.lineTo(fwX + wR * 1.12, fY);
  archCut(ctx, fwX, wCY, wR * 1.12);
  // rear wheel arch
  ctx.lineTo(rwX + wR * 1.12, fY);
  archCut(ctx, rwX, wCY, wR * 1.12);
  ctx.lineTo(W * 0.065, fY);
  ctx.closePath();

  ctx.fillStyle = paint;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.30)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Roof shade
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W * 0.285, fY - H * 0.44);
  ctx.lineTo(W * 0.305, fY - H * 0.495);
  ctx.bezierCurveTo(W * 0.325, fY - H * 0.515, W * 0.545, fY - H * 0.515, W * 0.565, fY - H * 0.50);
  ctx.bezierCurveTo(W * 0.545, fY - H * 0.485, W * 0.37, fY - H * 0.475, W * 0.285, fY - H * 0.44);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.fill();
  ctx.restore();

  // Windshield
  drawWindow(ctx, [
    [W*0.565, fY - H*0.50],
    [W*0.605, fY - H*0.47, W*0.655, fY - H*0.38, W*0.675, fY - H*0.31],
    [W*0.645, fY - H*0.302],
    [W*0.605, fY - H*0.456, W*0.565, fY - H*0.484, W*0.548, fY - H*0.494],
  ], small);

  // Side windows (one large glass section)
  drawWindow(ctx, [
    [W*0.285, fY - H*0.44],
    [W*0.305, fY - H*0.495],
    [W*0.548, fY - H*0.494],
    [W*0.548, fY - H*0.408],
    [W*0.42,  fY - H*0.39, W*0.33, fY - H*0.40, W*0.285, fY - H*0.44],
  ], small);

  // Rear glass
  drawWindow(ctx, [
    [W*0.150, fY - H*0.19],
    [W*0.215, fY - H*0.205, W*0.265, fY - H*0.33, W*0.285, fY - H*0.44],
    [W*0.240, fY - H*0.42],
    [W*0.215, fY - H*0.32, W*0.170, fY - H*0.23, W*0.160, fY - H*0.20],
  ], small);

  // Grille / front splitter
  if (!small) {
    ctx.save();
    ctx.beginPath();
    // Low front splitter
    roundRect(ctx, W * 0.905, fY - H * 0.065, W * 0.044, H * 0.065, 2);
    const sg = ctx.createLinearGradient(W * 0.905, 0, W * 0.949, 0);
    sg.addColorStop(0, '#222'); sg.addColorStop(0.5, '#888'); sg.addColorStop(1, '#222');
    ctx.fillStyle = sg;
    ctx.fill();

    // Air intake on flank
    ctx.beginPath();
    ctx.ellipse(W * 0.88, fY - H * 0.19, W * 0.022, H * 0.028, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.restore();
  }

  if (!small) {
    drawHeadlight(ctx, W * 0.940, fY - H * 0.175, W * 0.016, H * 0.030, s.headlight);
    // Tail light strip
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, W * 0.053, fY - H * 0.145, W * 0.025, H * 0.065, 2);
    ctx.fillStyle = '#8b0000';
    ctx.fill();
    ctx.fillStyle = '#ff3333';
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 10;
    roundRect(ctx, W * 0.056, fY - H * 0.138, W * 0.018, H * 0.05, 2);
    ctx.fill();
    ctx.restore();
  }

  if (!small) drawSpoilerOnCar(ctx, W, H, 'supercar', s.spoiler, s.color, fY);
  if (!small) drawSticker(ctx, W, H, s.sticker, s.color);

  drawWheel(ctx, rwX, wCY, wR, s.wheel);
  drawWheel(ctx, fwX, wCY, wR, s.wheel);
  drawFloorShadow(ctx, W, H, W * 0.5, W * 0.36, H * 0.024);
}

// ── SUV ────────────────────────────────────────

function drawSuv(ctx, W, H, s, small) {
  const fY  = H * 0.72;
  const wR  = Math.max(10, H * 0.128);
  const wCY = fY - wR;
  const rwX = W * 0.26;
  const fwX = W * 0.74;

  const bTop = fY - H * 0.66;
  const paint = createPaintGradient(ctx, s.color, W * 0.08, bTop, W * 0.84, H * 0.66);

  // Body
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W * 0.090, fY);
  // rear face (tall)
  ctx.bezierCurveTo(W * 0.075, fY, W * 0.068, fY - H * 0.07, W * 0.070, fY - H * 0.18);
  // rear window pillar
  ctx.lineTo(W * 0.080, fY - H * 0.38);
  // roof rear
  ctx.bezierCurveTo(W * 0.090, fY - H * 0.58, W * 0.12, fY - H * 0.65, W * 0.155, fY - H * 0.665);
  // roofline
  ctx.lineTo(W * 0.730, fY - H * 0.665);
  // A-pillar / windshield
  ctx.bezierCurveTo(W * 0.80, fY - H * 0.66, W * 0.862, fY - H * 0.60, W * 0.88, fY - H * 0.52);
  // short hood
  ctx.lineTo(W * 0.895, fY - H * 0.40);
  ctx.bezierCurveTo(W * 0.91, fY - H * 0.36, W * 0.928, fY - H * 0.32, W * 0.935, fY - H * 0.28);
  // front face
  ctx.bezierCurveTo(W * 0.945, fY - H * 0.22, W * 0.945, fY - H * 0.12, W * 0.940, fY);

  // front arch
  ctx.lineTo(fwX + wR * 1.12, fY);
  archCut(ctx, fwX, wCY, wR * 1.12);
  // rear arch
  ctx.lineTo(rwX + wR * 1.12, fY);
  archCut(ctx, rwX, wCY, wR * 1.12);
  ctx.lineTo(W * 0.090, fY);
  ctx.closePath();

  ctx.fillStyle = paint;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Roof shade band
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W * 0.155, fY - H * 0.665);
  ctx.lineTo(W * 0.730, fY - H * 0.665);
  ctx.bezierCurveTo(W * 0.750, fY - H * 0.660, W * 0.760, fY - H * 0.645, W * 0.758, fY - H * 0.630);
  ctx.lineTo(W * 0.158, fY - H * 0.630);
  ctx.bezierCurveTo(W * 0.140, fY - H * 0.645, W * 0.142, fY - H * 0.660, W * 0.155, fY - H * 0.665);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fill();
  ctx.restore();

  // Door line
  if (!small) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(W * 0.09, fY - H * 0.32);
    ctx.bezierCurveTo(W * 0.30, fY - H * 0.315, W * 0.70, fY - H * 0.315, W * 0.895, fY - H * 0.38);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Door dividers
    [W * 0.42, W * 0.62].forEach(dx => {
      ctx.beginPath();
      ctx.moveTo(dx, fY - H * 0.64);
      ctx.lineTo(dx, fY - H * 0.32);
      ctx.strokeStyle = 'rgba(0,0,0,0.13)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.restore();
  }

  // Windows
  drawWindow(ctx, [
    [W*0.660, fY - H*0.635],
    [W*0.730, fY - H*0.635],
    [W*0.80,  fY - H*0.66, W*0.855, fY - H*0.595, W*0.875, fY - H*0.525],
    [W*0.808, fY - H*0.512],
    [W*0.752, fY - H*0.635, W*0.686, fY - H*0.622, W*0.660, fY - H*0.635],
  ], small);

  drawWindow(ctx, [
    [W*0.440, fY - H*0.635],
    [W*0.655, fY - H*0.635],
    [W*0.652, fY - H*0.412],
    [W*0.438, fY - H*0.412],
  ], small);

  drawWindow(ctx, [
    [W*0.155, fY - H*0.635],
    [W*0.435, fY - H*0.635],
    [W*0.433, fY - H*0.412],
    [W*0.155, fY - H*0.412],
    [W*0.105, fY - H*0.42, W*0.090, fY - H*0.465, W*0.085, fY - H*0.53],
  ], small);

  if (!small) {
    drawHeadlight(ctx, W * 0.928, fY - H * 0.22, W * 0.018, H * 0.038, s.headlight);
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, W * 0.072, fY - H * 0.26, W * 0.022, H * 0.07, 3);
    ctx.fillStyle = '#8b0000';
    ctx.fill();
    ctx.fillStyle = '#ff3333';
    ctx.shadowColor = '#f00'; ctx.shadowBlur = 8;
    roundRect(ctx, W * 0.075, fY - H * 0.255, W * 0.015, H * 0.055, 2);
    ctx.fill();
    ctx.restore();

    // Roof rack
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W * 0.2, fY - H * 0.668);
    ctx.lineTo(W * 0.7, fY - H * 0.668);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    [W*0.28, W*0.42, W*0.57, W*0.68].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, fY - H * 0.67);
      ctx.lineTo(x, fY - H * 0.658);
      ctx.stroke();
    });
    ctx.restore();
  }

  if (!small) drawSpoilerOnCar(ctx, W, H, 'suv', s.spoiler, s.color, fY);
  if (!small) drawSticker(ctx, W, H, s.sticker, s.color);

  drawWheel(ctx, rwX, wCY, wR, s.wheel);
  drawWheel(ctx, fwX, wCY, wR, s.wheel);
  drawFloorShadow(ctx, W, H, W * 0.5, W * 0.35, H * 0.028);
}

// ── CLASSIC ────────────────────────────────────

function drawClassic(ctx, W, H, s, small) {
  const fY  = H * 0.72;
  const wR  = Math.max(10, H * 0.118);
  const wCY = fY - wR;
  const rwX = W * 0.265;
  const fwX = W * 0.735;

  const bTop = fY - H * 0.60;
  const paint = createPaintGradient(ctx, s.color, W * 0.09, bTop, W * 0.82, H * 0.60);

  ctx.save();
  ctx.beginPath();
  // rear bumper
  ctx.moveTo(W * 0.092, fY);
  ctx.bezierCurveTo(W * 0.078, fY, W * 0.070, fY - H * 0.05, W * 0.072, fY - H * 0.12);
  // rear body (classic has a chrome bumper "step")
  ctx.lineTo(W * 0.082, fY - H * 0.19);
  ctx.lineTo(W * 0.115, fY - H * 0.255);
  // rear fender (classic rounded fender flare)
  ctx.bezierCurveTo(W * 0.135, fY - H * 0.28, W * 0.18, fY - H * 0.33, W * 0.21, fY - H * 0.38);
  // waistline
  ctx.lineTo(W * 0.23, fY - H * 0.395);
  // rear pillar
  ctx.bezierCurveTo(W * 0.245, fY - H * 0.41, W * 0.28, fY - H * 0.49, W * 0.30, fY - H * 0.545);
  // roof
  ctx.bezierCurveTo(W * 0.325, fY - H * 0.582, W * 0.390, fY - H * 0.598, W * 0.440, fY - H * 0.598);
  ctx.bezierCurveTo(W * 0.535, fY - H * 0.598, W * 0.595, fY - H * 0.582, W * 0.625, fY - H * 0.555);
  // A-pillar (vintage – very upright)
  ctx.bezierCurveTo(W * 0.650, fY - H * 0.52, W * 0.668, fY - H * 0.47, W * 0.672, fY - H * 0.41);
  // front fender rise
  ctx.bezierCurveTo(W * 0.685, fY - H * 0.375, W * 0.735, fY - H * 0.35, W * 0.775, fY - H * 0.35);
  // long front fender
  ctx.bezierCurveTo(W * 0.82, fY - H * 0.35, W * 0.875, fY - H * 0.36, W * 0.905, fY - H * 0.30);
  // front nose (rounded classic style)
  ctx.bezierCurveTo(W * 0.930, fY - H * 0.28, W * 0.938, fY - H * 0.22, W * 0.938, fY - H * 0.16);
  ctx.bezierCurveTo(W * 0.940, fY - H * 0.07, W * 0.928, fY, W * 0.910, fY);

  // front arch
  ctx.lineTo(fwX + wR * 1.18, fY);
  archCut(ctx, fwX, wCY, wR * 1.18);
  // rear arch
  ctx.lineTo(rwX + wR * 1.18, fY);
  archCut(ctx, rwX, wCY, wR * 1.18);
  ctx.lineTo(W * 0.092, fY);
  ctx.closePath();

  ctx.fillStyle = paint;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.30)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Roof shade
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W * 0.30, fY - H * 0.545);
  ctx.bezierCurveTo(W * 0.325, fY - H * 0.582, W * 0.390, fY - H * 0.598, W * 0.440, fY - H * 0.598);
  ctx.bezierCurveTo(W * 0.535, fY - H * 0.598, W * 0.595, fY - H * 0.582, W * 0.625, fY - H * 0.555);
  ctx.bezierCurveTo(W * 0.600, fY - H * 0.540, W * 0.430, fY - H * 0.535, W * 0.30, fY - H * 0.545);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.fill();
  ctx.restore();

  // Windows
  drawWindow(ctx, [
    [W*0.625, fY - H*0.555],
    [W*0.668, fY - H*0.47, W*0.672, fY - H*0.41, W*0.670, fY - H*0.40],
    [W*0.622, fY - H*0.41],
    [W*0.608, fY - H*0.44, W*0.620, fY - H*0.52, W*0.625, fY - H*0.555],
  ], small);

  drawWindow(ctx, [
    [W*0.300, fY - H*0.545],
    [W*0.620, fY - H*0.555],
    [W*0.620, fY - H*0.410],
    [W*0.300, fY - H*0.420],
    [W*0.282, fY - H*0.42, W*0.270, fY - H*0.44, W*0.278, fY - H*0.50],
  ], small);

  // Chrome bumper strips
  if (!small) {
    ctx.save();
    const chromePaint = ctx.createLinearGradient(W*0.09, 0, W*0.91, 0);
    chromePaint.addColorStop(0, '#888'); chromePaint.addColorStop(0.5, '#e8e8e8'); chromePaint.addColorStop(1, '#888');
    // Rear bumper
    ctx.fillStyle = chromePaint;
    roundRect(ctx, W*0.073, fY - H*0.085, W*0.06, H*0.026, 4);
    ctx.fill();
    // Front bumper
    roundRect(ctx, W*0.878, fY - H*0.085, W*0.06, H*0.026, 4);
    ctx.fill();
    ctx.restore();

    // Round headlight (classic round headlights)
    drawHeadlight(ctx, W * 0.914, fY - H * 0.215, W * 0.022, H * 0.038, s.headlight);
    // Tail light
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(W * 0.094, fY - H * 0.215, W * 0.020, H * 0.036, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#8b0000';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(W * 0.094, fY - H * 0.215, W * 0.010, H * 0.018, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4444';
    ctx.shadowColor = '#f00'; ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();

    // Chrome side trim line
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(W * 0.115, fY - H * 0.255);
    ctx.bezierCurveTo(W * 0.35, fY - H * 0.275, W * 0.68, fY - H * 0.275, W * 0.905, fY - H * 0.30);
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  if (!small) drawSpoilerOnCar(ctx, W, H, 'classic', s.spoiler, s.color, fY);
  if (!small) drawSticker(ctx, W, H, s.sticker, s.color);

  drawWheel(ctx, rwX, wCY, wR, s.wheel);
  drawWheel(ctx, fwX, wCY, wR, s.wheel);
  drawFloorShadow(ctx, W, H, W * 0.5, W * 0.33, H * 0.025);
}

// ── Stickers ───────────────────────────────────

function drawSticker(ctx, W, H, sticker, color) {
  if (sticker === 'none') return;
  ctx.save();
  const fY = H * 0.72;
  const bx = W * 0.09, by = fY - H * 0.56, bw = W * 0.82, bh = H * 0.36;

  if (sticker === 'flames') {
    for (let i = 0; i < 6; i++) {
      const fx = bx + bw * 0.04 + i * bw * 0.075;
      ctx.beginPath();
      ctx.moveTo(fx, by + bh);
      ctx.bezierCurveTo(fx - 8, by + bh * 0.6, fx + 4, by + bh * 0.35, fx + 2, by + bh * 0.05);
      ctx.bezierCurveTo(fx + 12, by + bh * 0.35, fx + 18, by + bh * 0.6, fx + 14, by + bh);
      ctx.closePath();
      const fg = ctx.createLinearGradient(fx, by, fx, by + bh);
      fg.addColorStop(0, '#fff200');
      fg.addColorStop(0.4, '#ff6600');
      fg.addColorStop(1, '#ff0000');
      ctx.fillStyle = fg;
      ctx.globalAlpha = 0.80;
      ctx.fill();
    }
  } else if (sticker === 'stars') {
    [[0.2,0.55],[0.38,0.40],[0.6,0.52],[0.78,0.44],[0.5,0.70]].forEach(([rx, ry]) => {
      drawStar(ctx, bx + bw * rx, by + bh * ry, 13, 5, '#ffd700');
    });
  } else if (sticker === 'stripes') {
    ctx.globalAlpha = 0.50;
    const sc = (color === 'rainbow' || color === 'lava') ? '#fff' : shiftHue(color);
    ctx.fillStyle = sc;
    [[0.26, 0.06], [0.38, 0.06]].forEach(([rx, rw]) => {
      roundRect(ctx, bx + bw * rx, by + bh * 0.30, bw * rw, bh * 0.60, 4);
      ctx.fill();
    });
  } else if (sticker === 'lightning') {
    const lx = bx + bw * 0.42, ly = by + bh * 0.25;
    ctx.beginPath();
    ctx.moveTo(lx + 22, ly);
    ctx.lineTo(lx, ly + bh * 0.37);
    ctx.lineTo(lx + 15, ly + bh * 0.37);
    ctx.lineTo(lx - 4, ly + bh * 0.72);
    ctx.lineTo(lx + 30, ly + bh * 0.37);
    ctx.lineTo(lx + 15, ly + bh * 0.37);
    ctx.closePath();
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 14;
    ctx.globalAlpha = 0.88;
    ctx.fill();
  }
  ctx.restore();
}

function drawStar(ctx, cx, cy, r, pts, color) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const angle  = (i * Math.PI) / pts - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.4;
    ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = color; ctx.shadowBlur = 8;
  ctx.fill();
  ctx.restore();
}

function shiftHue(hex) {
  try {
    const [r,g,b] = hexToRgb(hex);
    return `rgb(${Math.min(255,r+90)},${Math.min(255,g+90)},${Math.min(255,b+90)})`;
  } catch { return '#ffffff'; }
}

// ── Spoiler ────────────────────────────────────

function drawSpoilerOnCar(ctx, W, H, shape, spoiler, color, fY) {
  if (spoiler === 'none') return;
  fY = fY || H * 0.72;

  const spoilerHeights = { small: H * 0.07, big: H * 0.13, wing: H * 0.16 };
  const sh = spoilerHeights[spoiler] || 0;

  // Rear of each car shape
  const rearX = { sedan: W*0.13, supercar: W*0.09, suv: W*0.09, classic: W*0.13 }[shape] || W*0.13;
  const attachY = { sedan: fY - H*0.28, supercar: fY - H*0.22, suv: fY - H*0.40, classic: fY - H*0.28 }[shape] || fY - H*0.28;

  ctx.save();
  if (spoiler === 'wing') {
    // Horizontal blade
    const bladeY = attachY - sh;
    ctx.fillStyle = '#777';
    roundRect(ctx, rearX - W*0.02, bladeY, W*0.10, sh * 0.16, 3);
    ctx.fill();
    // Support stanchion
    ctx.fillStyle = '#555';
    roundRect(ctx, rearX + W*0.01, bladeY, W*0.025, sh, 3);
    ctx.fill();
  } else {
    const [r,g,b] = hexToRgb(color === 'rainbow' ? '#888' : color === 'lava' ? '#cc4400' : color);
    const sp = createPaintGradient(ctx, color, rearX, attachY - sh, W*0.06, sh);
    roundRect(ctx, rearX, attachY - sh, W*0.045, sh, 4);
    ctx.fillStyle = sp;
    ctx.fill();
  }
  ctx.restore();
}

// ── roundRect helper ───────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Save / Collection ──────────────────────────

function openSaveDialog() {
  document.getElementById('save-dialog').classList.remove('hidden');
  document.getElementById('car-name-input').value = '';
  document.getElementById('car-name-input').focus();
}

function closeSaveDialog() {
  document.getElementById('save-dialog').classList.add('hidden');
}

function saveCarToCollection() {
  const name = document.getElementById('car-name-input').value.trim() || 'My Car';
  const cv   = document.getElementById('car-canvas');
  savedCars.push({ name, snapshot: cv.toDataURL(), config: { ...state } });
  localStorage.setItem('charlies-cars', JSON.stringify(savedCars));
  closeSaveDialog();
  showToast(`💾 "${name}" saved!`);
}

function renderCollection() {
  const grid = document.getElementById('collection-grid');
  grid.innerHTML = '';
  if (savedCars.length === 0) {
    grid.innerHTML = '<p style="color:#aaa;text-align:center;grid-column:1/-1;">No saved cars yet. Go design one! 🚗</p>';
    return;
  }
  savedCars.forEach((car, i) => {
    const card = document.createElement('div');
    card.className = 'coll-card';
    const img = document.createElement('img');
    img.src    = car.snapshot;
    img.width  = 200; img.height = 120;
    img.style.borderRadius = '8px';
    card.appendChild(img);
    card.innerHTML += `<div class="coll-name">🚗 ${car.name}</div>`;
    card.appendChild(img);
    const del = document.createElement('button');
    del.className = 'opt-btn'; del.style.marginTop = '8px'; del.style.color = '#f88';
    del.textContent = '🗑 Delete';
    del.onclick = e => { e.stopPropagation(); savedCars.splice(i, 1); localStorage.setItem('charlies-cars', JSON.stringify(savedCars)); renderCollection(); };
    card.appendChild(del);
    const load = document.createElement('button');
    load.className = 'opt-btn'; load.style.marginTop = '4px';
    load.textContent = '✏ Edit';
    load.onclick = e => { e.stopPropagation(); Object.assign(state, car.config); showScreen('screen-garage'); initGarage(); renderGarage(); };
    card.appendChild(load);
    grid.appendChild(card);
  });
}

function goToPicker() { showScreen('screen-pick'); }

// ── Photo Mode ─────────────────────────────────

function enterPhotoMode() {
  document.getElementById('photo-overlay').classList.remove('hidden');
  renderPhotoMode();
}

function exitPhoto() {
  document.getElementById('photo-overlay').classList.add('hidden');
}

function cycleBackground() {
  state.bgIndex = (state.bgIndex + 1) % BG_SCENES.length;
  renderPhotoMode();
}

function renderPhotoMode() {
  const scene = BG_SCENES[state.bgIndex];
  const bg    = document.getElementById('photo-bg');
  bg.style.background = `linear-gradient(to bottom, ${scene.gradient[0]}, ${scene.gradient[1]})`;

  const cv  = document.getElementById('photo-canvas');
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);

  // Ground
  ctx.fillStyle = scene.groundColor;
  ctx.fillRect(0, cv.height * 0.75, cv.width, cv.height * 0.25);

  if (scene.groundStripe) {
    ctx.fillStyle = '#fff';
    for (let x = 0; x < cv.width; x += 60) ctx.fillRect(x, cv.height * 0.86, 36, 5);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = 'bold 13px Arial';
  ctx.fillText(scene.label, 10, 20);

  drawCar(ctx, cv.width, cv.height, state, false);
}

function savePhoto() {
  const photoCv = document.getElementById('photo-canvas');
  const scene   = BG_SCENES[state.bgIndex];
  const out = document.createElement('canvas');
  out.width = photoCv.width; out.height = photoCv.height;
  const oc  = out.getContext('2d');
  const grd = oc.createLinearGradient(0, 0, 0, out.height);
  grd.addColorStop(0, scene.gradient[0]);
  grd.addColorStop(1, scene.gradient[1]);
  oc.fillStyle = grd;
  oc.fillRect(0, 0, out.width, out.height);
  oc.drawImage(photoCv, 0, 0);
  const link = document.createElement('a');
  link.download = 'charlies-car-photo.png';
  link.href = out.toDataURL();
  link.click();
  showToast('📸 Photo saved!');
}

function viewCollection() { showScreen('screen-collection'); }

// ── Boot ───────────────────────────────────────

function boot() {
  initPicker();
  showScreen('screen-pick');
  const garage = document.getElementById('screen-garage');
  const nav    = document.createElement('div');
  nav.style.cssText = 'text-align:right;margin-bottom:8px;';
  nav.innerHTML = `<button class="opt-btn" onclick="viewCollection()">🏁 My Collection (${savedCars.length})</button>`;
  garage.insertBefore(nav, garage.firstChild);
}

boot();
