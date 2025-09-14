/* =================== CONFIG =================== */
const WORDS = [
  "tonta","tkm","te amo",
  "mi vida","pompompurin","azul",
  "me encantas","eres todo para mi","mi reina","23",
  "preciosa","Perlita❤️","abachito?","besitos"
];

const IMAGES = [
  "img\\1.jpg",
  "img\\2.jpg",
  "img\\3.jpg",
    "img\\4.jpg",
  "img\\5.jpg",
  "img\\6.jpg",
  "img\\7.jpg",
  "img\\8.jpg",
];

const TOTAL_WORDS   = 28;
const TOTAL_PHOTOS  = 10;
const TOTAL_HEARTS  = 60;

const FALL_SPEED_VH = [15, 25];      // velocidad caída (vh/s)
const DRIFT_PX      = [6, 18];       // oscilación horizontal (px)
const DEPTH_PX      = [-650, -180];  // profundidad 3D (más negativo = más lejos)

const WORD_SIZE = [14, 28];          // px
const PHOTO_SIDE= [80, 150];         // px
/* ===================================================== */

const sky  = document.getElementById('sky');
const bg   = document.getElementById('bg');
const ctx  = bg.getContext('2d', { alpha: true });

/* ===== utils ===== */
const rnd =(a,b)=> Math.random()*(b-a)+a;
const pick=a => a[Math.floor(Math.random()*a.length)];
const sprites=[];

/* ===== estrellas (canvas) ===== */
let stars=[];
function sizeCanvas(){
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  bg.width  = Math.floor(innerWidth * dpr);
  bg.height = Math.floor(innerHeight* dpr);
  bg.style.width='100%'; bg.style.height='100%';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  genStars();
}
function genStars(){
  const N = Math.floor((innerWidth*innerHeight)/9000);
  stars = Array.from({length:N}, ()=>({
    x: Math.random()*innerWidth,
    y: Math.random()*innerHeight,
    r: Math.random()*0.9 + 0.2,
    a: Math.random()*Math.PI*2,
    s: Math.random()*0.7 + 0.3
  }));
}
function drawSky(){
  ctx.clearRect(0,0,bg.width,bg.height);
  for(const st of stars){
    st.a += 0.01*st.s;
    const alpha = 0.6 + Math.sin(st.a)*0.2;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(drawSky);
}
sizeCanvas(); drawSky();
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
    y: initial ? spawnYInitial() : spawnYAbove(),
    z: spawnZ(),
    baseX: Math.random()*Math.PI*2,
    drift: rnd(...DRIFT_PX),
    speed: rnd(...FALL_SPEED_VH),   // vh/s
    rot: rnd(-25,25)
  };
}

function setPos(el,st){
  const dx = Math.sin((performance.now()/1000) + st.baseX) * st.drift;
  el.style.left = st.x + '%';
  el.style.top  = st.y + '%';
  el.style.transform =
    `translateZ(${st.z}px) translateX(${dx}px) rotate(${st.rot}deg)`;
}

/* palabras */
for (let i=0;i<TOTAL_WORDS;i++){
  const el = document.createElement('div');
  el.className = 'sprite word';
  el.textContent = pick(WORDS);
  el.style.fontSize = rnd(...WORD_SIZE)+'px';
  sky.appendChild(el);
  const st = makeState('word', true);
  sprites.push({el, st}); setPos(el, st);
}

/* fotos */
for (let i=0;i<TOTAL_PHOTOS;i++){
  const box = document.createElement('div');
  box.className = 'sprite photo';
  const img = document.createElement('img');
  img.src = pick(IMAGES); box.appendChild(img);
  const w = rnd(...PHOTO_SIDE), h = w * rnd(1.1, 1.6);
  box.style.width = `${w}px`; box.style.height = `${h}px`;
  sky.appendChild(box);
  const st = makeState('photo', true);
  sprites.push({el:box, st}); setPos(box, st);
}

/* corazones (con wrapper .h para la forma) */
for (let i=0;i<TOTAL_HEARTS;i++){
  const el = document.createElement('div');
  el.className = 'sprite heart';
  const core = document.createElement('div');
  core.className = 'h';
  el.appendChild(core);
  sky.appendChild(el);
  const st = makeState('heart', true);
  st.speed = rnd(10, 35); st.rot = rnd(-10, 10);
  sprites.push({el, st}); setPos(el, st);
}

/* loop */
let last = performance.now();
function loop(now){
  const dt = (now - last)/1000; last = now;

  sprites.forEach(s=>{
    // de vh/s a %/s del contenedor (120vh => /1.2)
    s.st.y += (s.st.speed / 1.2) * dt;

    if (s.st.y > BOTTOM_LIMIT){
      s.st.y = spawnYAbove();
      s.st.x = spawnX();
      s.st.z = spawnZ();
      s.st.baseX = Math.random()*Math.PI*2;

      if (s.st.kind === 'word'){
        s.el.textContent = pick(WORDS);
        s.el.style.fontSize = rnd(...WORD_SIZE)+'px';
      } else if (s.st.kind === 'photo'){
        s.el.querySelector('img').src = pick(IMAGES);
        const w = rnd(...PHOTO_SIDE), h = w * rnd(1.1, 1.6);
        s.el.style.width = `${w}px`; s.el.style.height = `${h}px`;
      }
    }
    setPos(s.el, s.st);
  });

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ===== PARALLAX 3D SUAVE y SEGURO (móvil + desktop) ===== */
let active = false;                 // dedo pulsando
let curX = 0, curY = 0;             // ángulos actuales
let targetX = 0, targetY = 0;       // ángulos objetivo

const isTouch = matchMedia('(pointer:coarse)').matches;
const MAX_DESKTOP = 12;
const MAX_MOBILE  = 6;              // límite en móviles
const MAX = isTouch ? MAX_MOBILE : MAX_DESKTOP;

const FOLLOW = isTouch ? 0.14 : 0.18;
const RETURN = 0.07;

const clamp = (v,a,b)=> Math.max(a, Math.min(b,v));

function setTargetFromPoint(x, y){
  const nx = (x / innerWidth)  * 2 - 1;   // -1..1
  const ny = (y / innerHeight) * 2 - 1;   // -1..1

  targetY = clamp(nx * MAX, -MAX, MAX);
  targetX = clamp(-ny * MAX, -MAX, MAX);

  // mueve un poco el punto de fuga para seguir el dedo
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

function animateTilt(){
  const k = active ? FOLLOW : RETURN;
  curX += (targetX - curX) * k;
  curY += (targetY - curY) * k;

  curX = clamp(curX, -MAX, MAX);
  curY = clamp(curY, -MAX, MAX);

  // Zoom dinámico (más fuerte) para proteger bordes
  const magnitude = Math.max(Math.abs(curX), Math.abs(curY)) / MAX; // 0..1
  const zoom = 1 - 0.18 * (magnitude * magnitude);
  document.documentElement.style.setProperty('--zoom', zoom.toFixed(3));

  document.documentElement.style.setProperty('--tiltX', curX.toFixed(2)+'deg');
  document.documentElement.style.setProperty('--tiltY', curY.toFixed(2)+'deg');
  requestAnimationFrame(animateTilt);
}
animateTilt();
