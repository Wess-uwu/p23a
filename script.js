/* =================== CONFIG =================== */
const WORDS = [
  "te amo","tkm","mi vida",
  "me encantas","mi reina","preciosa",
  "mi amor","mi niña","mi bebé",
  "mi corazón","eres todo para mí","mi todo",
  "mi tesoro","mi chiquita","mi princesa",
  "mi razón","mi cielo","mi alegría",
  "mi bonita","mi única","mi adorada",
  "mi favorita","mi luz","mi perlita❤️",
  "besitos","abachito?","mi consentida"
];

// ⚠️ Usa barras normales en web:
const IMAGES = [
  "img/1.jpg","img/2.jpg","img/3.jpg","img/4.jpg",
  "img/5.jpg","img/6.jpg","img/7.jpg","img/8.jpg",
];

const isTouch = matchMedia('(pointer:coarse)').matches;

// Menos elementos en móvil
const TOTAL_WORDS  = isTouch ? 18 : 28;
const TOTAL_PHOTOS = isTouch ? 6  : 10;
const TOTAL_HEARTS = isTouch ? 18 : 28;

const FALL_SPEED_VH = [15, 25];      // vh/s
const DRIFT_PX      = [6, 18];       // px
const DEPTH_PX      = [-650, -180];  // px (más negativo = más lejos)

const WORD_SIZE  = [14, 28];         // px
const PHOTO_SIDE = [80, 150];        // px
/* ===================================================== */

const sky  = document.getElementById('sky');
const bg   = document.getElementById('bg');
const ctx  = bg.getContext('2d', { alpha: true });

const rnd =(a,b)=> Math.random()*(b-a)+a;
const pick=a => a[(Math.random()*a.length)|0];
const sprites=[];

/* ===== estrellas (canvas) ===== */
function sizeCanvas(){
  const dpr = isTouch ? 1 : Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  bg.width  = Math.floor(innerWidth * dpr);
  bg.height = Math.floor(innerHeight* dpr);
  bg.style.width='100%'; bg.style.height='100%';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  genStars();
}
let stars=[];
function genStars(){
  const density = isTouch ? 14000 : 9000;
  const N = Math.floor((innerWidth*innerHeight)/density);
  stars = Array.from({length:N}, ()=>({
    x: Math.random()*innerWidth,
    y: Math.random()*innerHeight,
    r: Math.random()*0.9 + 0.2,
    a: Math.random()*Math.PI*2,
    s: Math.random()*0.7 + 0.3
  }));
}

// Twinkle a 30 FPS aprox (en móvil)
let skyAcc = 0;
function drawSky(dt){
  skyAcc += dt;
  if (skyAcc < 1/30) return;
  skyAcc = 0;

  ctx.clearRect(0,0,bg.width,bg.height);
  for(const st of stars){
    st.a += 0.01*st.s;
    const alpha = 0.6 + Math.sin(st.a)*0.2;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
sizeCanvas();
addEventListener('resize', sizeCanvas);

/* ===== lluvia (3D) sobre contenedor 120×120 ===== */
const TOP_MARGIN = -10;   // -10% (arriba del área visible)
const BOTTOM_LIMIT = 110; // 110% (debajo del área visible)

const spawnX        = () => Math.random()*100;   // 0..100% (ancho visible)
const spawnYInitial = () => Math.random()*100;   // cae ya en pantalla
const spawnYAbove   = () => TOP_MARGIN;          // reentrar por arriba
const spawnZ        = () => rnd(...DEPTH_PX);    // profundidad

function makeState(kind, initial=false){
  return {
    kind,
    x: spawnX(),
    y: initial ? spawnYInitial() : spawnYAbove(), // % sobre #sky (120vh)
    z: spawnZ(),
    baseX: Math.random()*Math.PI*2,
    drift: rnd(...DRIFT_PX),
    speed: rnd(...FALL_SPEED_VH),   // vh/s reales
    rot: rnd(-25,25),
    ty: 0   // desplazamiento vertical acumulado en % de #sky
  };
}

// Fijamos left/top una vez (spawn/respawn). Animamos SOLO con transform.
function placeOnce(el, st){
  const s = el.style;
  s.left = st.x + '%';
  s.top  = st.y + '%';
  s.transform = `translateZ(${st.z}px) translateX(0px) rotate(${st.rot}deg)`;
}

// ⚠️ Aquí el FIX: usamos vh reales para el translateY (no %).
function updateTransform(el, st, dx){
  // st.ty está en % del #sky (que mide 120vh), pasamos a vh: ty * 1.2
  el.style.transform =
    `translateZ(${st.z}px) translateY(${(st.ty*1.2).toFixed(3)}vh) translateX(${dx}px) rotate(${st.rot}deg)`;
}

/* palabras */
for (let i=0;i<TOTAL_WORDS;i++){
  const el = document.createElement('div');
  el.className = 'sprite word';
  el.textContent = pick(WORDS);
  el.style.fontSize = rnd(...WORD_SIZE)+'px';
  sky.appendChild(el);
  const st = makeState('word', true);
  sprites.push({el, st, style: el.style});
  placeOnce(el, st);
}

/* fotos */
for (let i=0;i<TOTAL_PHOTOS;i++){
  const box = document.createElement('div');
  box.className = 'sprite photo';
  const img = document.createElement('img');
  img.decoding = 'async';
  img.loading  = 'lazy';
  img.src = pick(IMAGES);
  box.appendChild(img);
  const w = rnd(...PHOTO_SIDE), h = w * rnd(1.1, 1.6);
  box.style.width = `${w}px`; box.style.height = `${h}px`;
  sky.appendChild(box);
  const st = makeState('photo', true);
  sprites.push({el:box, st, style: box.style});
  placeOnce(box, st);
}

/* corazones */
for (let i=0;i<TOTAL_HEARTS;i++){
  const el = document.createElement('div');
  el.className = 'sprite heart';
  const core = document.createElement('div');
  core.className = 'h';
  el.appendChild(core);
  sky.appendChild(el);
  const st = makeState('heart', true);
  st.speed = rnd(10, 35); st.rot = rnd(-10, 10);
  sprites.push({el, st, style: el.style});
  placeOnce(el, st);
}

/* ===== bucle con frame cap ===== */
const TARGET_FPS = isTouch ? 30 : 60;
const STEP = 1 / TARGET_FPS;

let last = performance.now()/1000, acc = 0;
function frame(nowMs){
  const now = nowMs/1000;
  let dt = now - last; last = now;
  if (dt > 0.1) dt = 0.1;

  acc += dt;
  while (acc >= STEP) {
    tick(STEP);
    acc -= STEP;
  }
  requestAnimationFrame(frame);
}

function tick(dt){
  // estrellas (30fps)
  drawSky(dt);

  const t = performance.now()/1000;
  for (let i=0;i<sprites.length;i++){
    const s = sprites[i];
    const st = s.st;

    // caída: convertimos vh/s a % del contenedor (120vh → % = vh/1.2)
    st.ty += (st.speed / 1.2) * dt;

    const dx = Math.sin(t + st.baseX) * st.drift;

    // cuando sale por abajo, respawn
    if (st.y + st.ty > BOTTOM_LIMIT){
      st.y = spawnYAbove();
      st.x = spawnX();
      st.z = spawnZ();
      st.baseX = Math.random()*Math.PI*2;
      st.ty = 0;

      s.style.left = st.x + '%';
      s.style.top  = st.y + '%';

      if (st.kind === 'word'){
        s.el && (s.el.textContent = pick(WORDS));
        s.style.fontSize = rnd(...WORD_SIZE)+'px';
      } else if (st.kind === 'photo'){
        const img = s.el.querySelector('img');
        img && (img.src = pick(IMAGES));
        const w = rnd(...PHOTO_SIDE), h = w * rnd(1.1, 1.6);
        s.style.width = `${w}px`; s.style.height = `${h}px`;
      }
    }
    updateTransform(s.el, st, dx);
  }
}
requestAnimationFrame(frame);

/* ===== PARALLAX 3D SUAVE ===== */
let active = false, curX = 0, curY = 0, targetX = 0, targetY = 0;
const MAX_DESKTOP = 12, MAX_MOBILE = 6;
const MAX = isTouch ? MAX_MOBILE : MAX_DESKTOP;
const FOLLOW = isTouch ? 0.14 : 0.18;
const RETURN = 0.07;
const clamp = (v,a,b)=> Math.max(a, Math.min(b,v));

function setTargetFromPoint(x, y){
  const nx = (x / innerWidth ) * 2 - 1;
  const ny = (y / innerHeight) * 2 - 1;
  targetY = clamp(nx * MAX, -MAX, MAX);
  targetX = clamp(-ny * MAX, -MAX, MAX);
  const originX = clamp(50 + nx * 12, 35, 65);
  const originY = clamp(45 + ny * 10, 35, 60);
  document.documentElement.style.setProperty('--originX', originX + '%');
  document.documentElement.style.setProperty('--originY', originY + '%');
}

addEventListener('pointerdown', e=>{ active = true; setTargetFromPoint(e.clientX, e.clientY); }, {passive:true});
addEventListener('pointermove', e=>{
  if (!active && !isTouch) setTargetFromPoint(e.clientX, e.clientY);
  else if (active)         setTargetFromPoint(e.clientX, e.clientY);
}, {passive:true});
addEventListener('pointerup',   ()=> active=false, {passive:true});
addEventListener('pointercancel',()=> active=false, {passive:true});
addEventListener('pointerleave', ()=> active=false, {passive:true});

(function animateTilt(){
  const k = active ? FOLLOW : RETURN;
  curX += (targetX - curX) * k;
  curY += (targetY - curY) * k;

  curX = clamp(curX, -MAX, MAX);
  curY = clamp(curY, -MAX, MAX);

  const magnitude = Math.max(Math.abs(curX), Math.abs(curY)) / MAX;
  const zoom = 1 - 0.16 * (magnitude * magnitude);
  document.documentElement.style.setProperty('--zoom', zoom.toFixed(3));
  document.documentElement.style.setProperty('--tiltX', curX.toFixed(2)+'deg');
  document.documentElement.style.setProperty('--tiltY', curY.toFixed(2)+'deg');

  requestAnimationFrame(animateTilt);
})();
