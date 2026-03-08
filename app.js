// ─────────────────────────────────────────────
//  Charlie's Car Designer – app.js
// ─────────────────────────────────────────────

// ── Data ──────────────────────────────────────

const CARS = [
  { id: 'mercedes', label: 'Mercedes-Benz', desc: 'Sleek & classy', shape: 'sedan' },
  { id: 'lambo',    label: 'Lamborghini',   desc: 'Super low & fast', shape: 'supercar' },
  { id: 'volvo',    label: 'Volvo',         desc: 'Big & sturdy', shape: 'suv' },
  { id: 'starter',  label: 'Starter Car',   desc: 'Your blank canvas', shape: 'classic' },
];

const COLORS = [
  { name: 'Red',       hex: '#e53935' },
  { name: 'Orange',    hex: '#ff6d00' },
  { name: 'Yellow',    hex: '#fdd835' },
  { name: 'Lime',      hex: '#76ff03' },
  { name: 'Cyan',      hex: '#00e5ff' },
  { name: 'Blue',      hex: '#1e88e5' },
  { name: 'Purple',    hex: '#8e24aa' },
  { name: 'Pink',      hex: '#f06292' },
  { name: 'White',     hex: '#ffffff' },
  { name: 'Silver',    hex: '#b0bec5' },
  { name: 'Black',     hex: '#212121' },
  { name: 'Rainbow',   hex: 'rainbow' },
  { name: 'Lava',      hex: 'lava'    },
];

const WHEELS = [
  { id: 'standard', label: '⚙ Standard' },
  { id: 'sport',    label: '🏎 Sport'    },
  { id: 'gold',     label: '✨ Gold'     },
  { id: 'spiky',    label: '🔩 Spiky'   },
];

const STICKERS = [
  { id: 'none',     label: '✖ None'      },
  { id: 'flames',   label: '🔥 Flames'   },
  { id: 'stars',    label: '⭐ Stars'    },
  { id: 'stripes',  label: '〰 Stripes'  },
  { id: 'lightning',label: '⚡ Lightning' },
];

const HEADLIGHTS = [
  { id: 'normal', label: '💡 Normal' },
  { id: 'led',    label: '🔵 LED'    },
  { id: 'neon',   label: '🟢 Neon'   },
  { id: 'laser',  label: '🔴 Laser'  },
];

const SPOILERS = [
  { id: 'none',   label: '✖ None'    },
  { id: 'small',  label: '▲ Small'   },
  { id: 'big',    label: '▲▲ Big'    },
  { id: 'wing',   label: '✈ Wing'    },
];

const BG_SCENES = [
  { label: '🏁 Racetrack',      gradient: ['#555', '#333'], groundColor: '#ccc', groundStripe: true },
  { label: '🏙 City Street',    gradient: ['#1a1a3e', '#2a2a5e'], groundColor: '#444', groundStripe: false },
  { label: '🏔 Mountains',      gradient: ['#87ceeb', '#ddeeff'], groundColor: '#5d8a5e', groundStripe: false },
  { label: '🌅 Sunset Highway', gradient: ['#ff7043', '#ffcc02'], groundColor: '#8b6f47', groundStripe: true },
];

// ── State ──────────────────────────────────────

const state = {
  carShape: 'sedan',
  color: '#e53935',
  wheel: 'standard',
  sticker: 'none',
  headlight: 'normal',
  spoiler: 'none',
  bgIndex: 0,
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
    cv.width = 180; cv.height = 100;
    card.appendChild(cv);
    card.innerHTML += `<div class="car-label">${car.label}</div><div class="car-desc">${car.desc}</div>`;
    card.prepend(cv);
    drawCar(cv.getContext('2d'), cv.width, cv.height, { ...state, carShape: car.shape }, true);
    card.onclick = () => {
      state.carShape = car.shape;
      state.color = '#e53935';
      state.wheel = 'standard';
      state.sticker = 'none';
      state.headlight = 'normal';
      state.spoiler = 'none';
      showScreen('screen-garage');
      initGarage();
      renderGarage();
    };
    grid.appendChild(card);
  });
}

// ── Garage ─────────────────────────────────────

function initGarage() {
  // Colors
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
      document.getElementById('custom-color').value = (c.hex.startsWith('#') ? c.hex : '#ff0000');
      document.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
      s.classList.add('active');
      renderGarage();
    };
    swatchRow.appendChild(s);
  });

  // Wheels
  buildOptBtns('wheel-btns', WHEELS, 'wheel');
  buildOptBtns('sticker-btns', STICKERS, 'sticker');
  buildOptBtns('headlight-btns', HEADLIGHTS, 'headlight');
  buildOptBtns('spoiler-btns', SPOILERS, 'spoiler');
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

// ── Core Draw Engine ───────────────────────────

function drawCar(ctx, W, H, s, small) {
  ctx.clearRect(0, 0, W, H);

  // Floor shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(W / 2, H * 0.88, W * 0.38, H * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const shapes = {
    sedan:    drawSedan,
    supercar: drawSupercar,
    suv:      drawSuv,
    classic:  drawClassic,
  };
  (shapes[s.carShape] || drawSedan)(ctx, W, H, s);

  if (!small) {
    drawSticker(ctx, W, H, s.sticker, s.color);
    drawSpoilerOnCar(ctx, W, H, s.carShape, s.spoiler, s.color);
  }
}

// ── Colour Helper ──────────────────────────────

function applyColor(ctx, color, x, y, w, h, shape) {
  if (color === 'rainbow') {
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0,    'red');
    grad.addColorStop(0.17, 'orange');
    grad.addColorStop(0.33, 'yellow');
    grad.addColorStop(0.5,  'lime');
    grad.addColorStop(0.67, 'cyan');
    grad.addColorStop(0.83, 'blue');
    grad.addColorStop(1,    'magenta');
    ctx.fillStyle = grad;
  } else if (color === 'lava') {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#ff4500');
    grad.addColorStop(0.5, '#ff8c00');
    grad.addColorStop(1, '#ff0000');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = color;
  }
}

// ── Wheel Draw ─────────────────────────────────

function drawWheel(ctx, cx, cy, r, style) {
  ctx.save();
  // Tyre
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#222';
  ctx.fill();
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Hub
  const hubColors = { standard: '#888', sport: '#ccc', gold: '#ffd700', spiky: '#e53935' };
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = hubColors[style] || '#888';
  ctx.fill();

  if (style === 'sport' || style === 'gold') {
    // Spokes
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r * 0.18, cy + Math.sin(angle) * r * 0.18);
      ctx.lineTo(cx + Math.cos(angle) * r * 0.92, cy + Math.sin(angle) * r * 0.92);
      ctx.strokeStyle = style === 'gold' ? '#ffd700' : '#ddd';
      ctx.lineWidth = r * 0.14;
      ctx.stroke();
    }
  } else if (style === 'spiky') {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r * 0.95, cy + Math.sin(angle) * r * 0.95);
      ctx.strokeStyle = '#e53935';
      ctx.lineWidth = r * 0.1;
      ctx.stroke();
    }
  }

  // Headlight glow overlay for neon/led (handled separately)
  ctx.restore();
}

// ── Headlight Draw ─────────────────────────────

function drawHeadlights(ctx, x, y, w, h, style) {
  const colors = { normal: '#ffffcc', led: '#66aaff', neon: '#00ff88', laser: '#ff2222' };
  const col = colors[style] || '#ffffcc';
  ctx.save();
  ctx.fillStyle = col;
  ctx.shadowColor = col;
  ctx.shadowBlur = style === 'normal' ? 4 : 18;
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Car Shapes ─────────────────────────────────

function drawSedan(ctx, W, H, s) {
  const bx = W * 0.08, by = H * 0.52, bw = W * 0.84, bh = H * 0.28;
  const tx = W * 0.22, ty = H * 0.3,  tw = W * 0.56, th = H * 0.25;
  const wr = W * 0.09;

  // Body
  ctx.save();
  applyColor(ctx, s.color, bx, by, bw, bh);
  roundRect(ctx, bx, by, bw, bh, 12);
  ctx.fill();
  ctx.restore();

  // Roof
  ctx.save();
  applyColor(ctx, s.color, tx, ty, tw, th);
  roundRect(ctx, tx, ty, tw, th, 10);
  ctx.fill();
  ctx.restore();

  // Windows
  ctx.save();
  ctx.fillStyle = 'rgba(100,200,255,0.55)';
  roundRect(ctx, tx + 6, ty + 5, tw * 0.44, th - 10, 6);
  ctx.fill();
  roundRect(ctx, tx + tw * 0.5, ty + 5, tw * 0.44, th - 10, 6);
  ctx.fill();
  ctx.restore();

  // Headlights
  drawHeadlights(ctx, bx + bw - 14, by + bh * 0.4, 10, 6, s.headlight);
  // Tail lights
  ctx.save(); ctx.fillStyle = '#ff2222'; ctx.shadowBlur = 8; ctx.shadowColor = '#f00';
  ctx.beginPath(); ctx.ellipse(bx + 14, by + bh * 0.4, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Wheels
  const wcy = by + bh + 2;
  drawWheel(ctx, bx + W * 0.17, wcy, wr, s.wheel);
  drawWheel(ctx, bx + bw - W * 0.17, wcy, wr, s.wheel);
}

function drawSupercar(ctx, W, H, s) {
  // Very flat body
  const bx = W * 0.05, by = H * 0.53, bw = W * 0.9, bh = H * 0.22;
  const tx = W * 0.28, ty = H * 0.36, tw = W * 0.44, th = H * 0.2;
  const wr = W * 0.095;

  ctx.save();
  applyColor(ctx, s.color, bx, by, bw, bh);
  roundRect(ctx, bx, by, bw, bh, 6);
  ctx.fill();
  ctx.restore();

  // Front slope
  ctx.save();
  applyColor(ctx, s.color, bx, by, bw, bh);
  ctx.beginPath();
  ctx.moveTo(bx + bw, by + bh);
  ctx.lineTo(bx + bw, by);
  ctx.lineTo(bx + bw - W * 0.12, by - 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Roof
  ctx.save();
  applyColor(ctx, s.color, tx, ty, tw, th);
  roundRect(ctx, tx, ty, tw, th, 8);
  ctx.fill();
  ctx.restore();

  // Windshield
  ctx.save();
  ctx.fillStyle = 'rgba(100,200,255,0.6)';
  roundRect(ctx, tx + 4, ty + 4, tw * 0.95, th - 8, 6);
  ctx.fill();
  ctx.restore();

  drawHeadlights(ctx, bx + bw - 10, by + bh * 0.35, 12, 5, s.headlight);
  ctx.save(); ctx.fillStyle = '#ff2222'; ctx.shadowBlur = 6; ctx.shadowColor='#f00';
  ctx.beginPath(); ctx.ellipse(bx + 12, by + bh * 0.35, 10, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  const wcy = by + bh + 2;
  drawWheel(ctx, bx + W * 0.14, wcy, wr, s.wheel);
  drawWheel(ctx, bx + bw - W * 0.14, wcy, wr, s.wheel);
}

function drawSuv(ctx, W, H, s) {
  const bx = W * 0.07, by = H * 0.42, bw = W * 0.86, bh = H * 0.4;
  const wr = W * 0.1;

  ctx.save();
  applyColor(ctx, s.color, bx, by, bw, bh);
  roundRect(ctx, bx, by, bw, bh, 10);
  ctx.fill();
  ctx.restore();

  // Windows row
  ctx.save();
  ctx.fillStyle = 'rgba(100,200,255,0.5)';
  roundRect(ctx, bx + 10, by + 8, bw * 0.3, bh * 0.35, 5); ctx.fill();
  roundRect(ctx, bx + bw * 0.38, by + 8, bw * 0.26, bh * 0.35, 5); ctx.fill();
  roundRect(ctx, bx + bw * 0.68, by + 8, bw * 0.22, bh * 0.35, 5); ctx.fill();
  ctx.restore();

  drawHeadlights(ctx, bx + bw - 12, by + bh * 0.55, 11, 6, s.headlight);
  ctx.save(); ctx.fillStyle='#ff2222'; ctx.shadowBlur=6; ctx.shadowColor='#f00';
  ctx.beginPath(); ctx.ellipse(bx+13, by+bh*0.55, 9, 5, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  const wcy = by + bh + 2;
  drawWheel(ctx, bx + W * 0.16, wcy, wr, s.wheel);
  drawWheel(ctx, bx + bw - W * 0.16, wcy, wr, s.wheel);
}

function drawClassic(ctx, W, H, s) {
  const bx = W * 0.1, by = H * 0.5, bw = W * 0.8, bh = H * 0.3;
  const tx = W * 0.25, ty = H * 0.3, tw = W * 0.5, th = H * 0.23;
  const wr = W * 0.09;

  ctx.save();
  applyColor(ctx, s.color, bx, by, bw, bh);
  roundRect(ctx, bx, by, bw, bh, 16);
  ctx.fill();
  ctx.restore();

  ctx.save();
  applyColor(ctx, s.color, tx, ty, tw, th);
  roundRect(ctx, tx, ty, tw, th, 14);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(100,200,255,0.5)';
  roundRect(ctx, tx + 5, ty + 5, tw - 10, th - 10, 8); ctx.fill();
  ctx.restore();

  drawHeadlights(ctx, bx + bw - 14, by + bh * 0.45, 10, 6, s.headlight);
  ctx.save(); ctx.fillStyle='#ff3333'; ctx.shadowBlur=6; ctx.shadowColor='#f00';
  ctx.beginPath(); ctx.ellipse(bx+14, by+bh*0.45, 8, 5, 0,0,Math.PI*2); ctx.fill();
  ctx.restore();

  const wcy = by + bh + 2;
  drawWheel(ctx, bx + W * 0.16, wcy, wr, s.wheel);
  drawWheel(ctx, bx + bw - W * 0.16, wcy, wr, s.wheel);
}

// ── Stickers ───────────────────────────────────

function drawSticker(ctx, W, H, sticker, color) {
  if (sticker === 'none') return;
  ctx.save();
  const bx = W * 0.08, by = H * 0.42, bw = W * 0.84, bh = H * 0.42;

  if (sticker === 'flames') {
    for (let i = 0; i < 5; i++) {
      const fx = bx + bw * 0.05 + i * bw * 0.08;
      ctx.beginPath();
      ctx.moveTo(fx, by + bh * 0.95);
      ctx.bezierCurveTo(fx - 8, by + bh * 0.6, fx + 4, by + bh * 0.4, fx + 2, by + bh * 0.1);
      ctx.bezierCurveTo(fx + 12, by + bh * 0.4, fx + 18, by + bh * 0.6, fx + 14, by + bh * 0.95);
      ctx.closePath();
      const fg = ctx.createLinearGradient(fx, by + bh * 0.1, fx, by + bh * 0.95);
      fg.addColorStop(0, '#fff200'); fg.addColorStop(0.5, '#ff6600'); fg.addColorStop(1, '#ff0000');
      ctx.fillStyle = fg;
      ctx.globalAlpha = 0.82;
      ctx.fill();
    }
  } else if (sticker === 'stars') {
    const positions = [[0.2,0.55],[0.4,0.45],[0.6,0.55],[0.8,0.48],[0.5,0.7]];
    positions.forEach(([rx, ry]) => {
      drawStar(ctx, bx + bw * rx, by + bh * ry, 12, 5, '#ffd700');
    });
  } else if (sticker === 'stripes') {
    ctx.globalAlpha = 0.55;
    const stripeColor = color === 'rainbow' ? '#fff' : (color === 'lava' ? '#fff' : shiftHue(color));
    ctx.fillStyle = stripeColor;
    roundRect(ctx, bx + bw * 0.25, by + bh * 0.35, bw * 0.08, bh * 0.55, 4); ctx.fill();
    roundRect(ctx, bx + bw * 0.37, by + bh * 0.35, bw * 0.08, bh * 0.55, 4); ctx.fill();
  } else if (sticker === 'lightning') {
    ctx.save();
    ctx.globalAlpha = 0.85;
    const lx = bx + bw * 0.42, ly = by + bh * 0.3;
    ctx.beginPath();
    ctx.moveTo(lx + 20, ly);
    ctx.lineTo(lx, ly + bh * 0.35);
    ctx.lineTo(lx + 14, ly + bh * 0.35);
    ctx.lineTo(lx - 6, ly + bh * 0.7);
    ctx.lineTo(lx + 28, ly + bh * 0.35);
    ctx.lineTo(lx + 14, ly + bh * 0.35);
    ctx.closePath();
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawStar(ctx, cx, cy, r, points, color) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
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
  // Return a lighter version for stripe contrast
  try {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgb(${Math.min(255,r+80)},${Math.min(255,g+80)},${Math.min(255,b+80)})`;
  } catch { return '#ffffff'; }
}

function drawSpoilerOnCar(ctx, W, H, shape, spoiler, color) {
  if (spoiler === 'none') return;
  const heights = { small: H * 0.07, big: H * 0.14, wing: H * 0.17 };
  const sh = heights[spoiler] || 0;
  const sx = W * 0.17, sy = H * 0.42 - sh, sw = W * 0.14;

  ctx.save();
  applyColor(ctx, color === 'rainbow' ? '#fff' : color, sx, sy, sw, sh);
  if (spoiler === 'wing') {
    // Horizontal wing
    ctx.fillStyle = '#888';
    roundRect(ctx, sx - 4, sy, sw + 8, sh * 0.18, 3); ctx.fill();
    ctx.fillStyle = '#555';
    roundRect(ctx, sx + sw * 0.35, sy, sw * 0.3, sh, 3); ctx.fill();
  } else {
    roundRect(ctx, sx, sy, sw, sh, 4);
    ctx.fill();
  }
  ctx.restore();
}

// ── roundRect helper ───────────────────────────

function roundRect(ctx, x, y, w, h, r) {
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
  const cv = document.getElementById('car-canvas');
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
    img.src = car.snapshot;
    img.width = 180; img.height = 108;
    img.style.borderRadius = '8px';
    card.appendChild(img);
    card.innerHTML += `<div class="coll-name">🚗 ${car.name}</div>`;
    card.appendChild(img);
    // Delete button
    const del = document.createElement('button');
    del.className = 'opt-btn'; del.style.marginTop = '8px'; del.style.color='#f88';
    del.textContent = '🗑 Delete';
    del.onclick = (e) => { e.stopPropagation(); savedCars.splice(i,1); localStorage.setItem('charlies-cars', JSON.stringify(savedCars)); renderCollection(); };
    card.appendChild(del);
    // Load button
    const load = document.createElement('button');
    load.className = 'opt-btn'; load.style.marginTop = '4px';
    load.textContent = '✏ Edit';
    load.onclick = (e) => { e.stopPropagation(); Object.assign(state, car.config); showScreen('screen-garage'); initGarage(); renderGarage(); };
    card.appendChild(load);
    grid.appendChild(card);
  });
}

function goToPicker() {
  showScreen('screen-pick');
}

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
  const bg = document.getElementById('photo-bg');
  const g = `linear-gradient(to bottom, ${scene.gradient[0]}, ${scene.gradient[1]})`;
  bg.style.background = g;

  // Draw ground strip + car on photo canvas
  const cv = document.getElementById('photo-canvas');
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);

  // Ground
  ctx.fillStyle = scene.groundColor;
  ctx.fillRect(0, cv.height * 0.75, cv.width, cv.height * 0.25);

  if (scene.groundStripe) {
    ctx.fillStyle = '#fff';
    for (let x = 0; x < cv.width; x += 60) {
      ctx.fillRect(x, cv.height * 0.86, 36, 5);
    }
  }

  // Scene labels
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = 'bold 13px Arial';
  ctx.fillText(scene.label, 10, 20);

  // Draw car on photo canvas
  drawCar(ctx, cv.width, cv.height, state, false);
}

function savePhoto() {
  // Composite bg + photo canvas
  const bg = document.getElementById('photo-bg');
  const photoCv = document.getElementById('photo-canvas');

  const out = document.createElement('canvas');
  out.width = photoCv.width; out.height = photoCv.height;
  const oc = out.getContext('2d');

  // Reproduce gradient
  const scene = BG_SCENES[state.bgIndex];
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

// ── Collection button in nav ───────────────────

function viewCollection() {
  showScreen('screen-collection');
}

// ── Boot ───────────────────────────────────────

function boot() {
  initPicker();
  showScreen('screen-pick');

  // Add top nav bar to garage
  const garage = document.getElementById('screen-garage');
  const nav = document.createElement('div');
  nav.style.cssText = 'text-align:right;margin-bottom:8px;';
  nav.innerHTML = `<button class="opt-btn" onclick="viewCollection()">🏁 My Collection (${savedCars.length})</button>`;
  garage.insertBefore(nav, garage.firstChild);
}

boot();
