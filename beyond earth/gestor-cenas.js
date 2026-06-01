// gestor e ligação entre planetas
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function lerp(a, b, t)    { return a + (b - a) * t; }

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1); // normaliza x para 0..1
  return t * t * (3 - 2 * t); // 0 e 1
}


// posição do rato
const estadoRato        = { x: 0, y: 0, dx: 0, dy: 0, speed: 0, spin: 0, energy: 0 };
const estadoInterior = { active: false, phase: 'orbit', planet: null };

let animacaoCanvas = null;
const $ = id => document.getElementById(id);

// devolve o planeta ativo no interior ou na órbita
function getPlanetaAtivo() {
  return estadoInterior.planet || planets[planetaAtual] || null;
}

// cancela a animação do canvas
function pararCanvasPlaneta() {
  if (animacaoCanvas) { cancelAnimationFrame(animacaoCanvas); animacaoCanvas = null; }
}

// cria um canvas com fundo estático e chama o build de cada planeta
function construirCena(pattern, W, H, rng, planet) {
  const s  = {};
  const bg = document.createElement('canvas');
  bg.width = W; bg.height = H;
  const bx = bg.getContext('2d');
  s.bg = bg;

  // cada planeta desenha o seu fundo
  if (pattern === 'ice')       construirCenaGelo(s, bx, W, H, rng);
  if (pattern === 'lava')      construirCenaLava(s, bx, W, H, rng);
  if (pattern === 'radiation') construirCenaRadiacao(s, bx, W, H, rng, planet);
  if (pattern === 'lowgrav')   construirCenaBaixaGrav(s, bx, W, H, rng, planet);
  if (pattern === 'ocean')     construirCenaOceano(s, bx, W, H, rng);
  if (pattern === 'desert')    construirCenaDeserto(s, bx, W, H, rng);
  return s;
}

// desenha o fundo e a parte interativa de cada planeta
function desenharCena(ctx, pattern, s, W, H, t, mx) {
  ctx.drawImage(s.bg, 0, 0); // cola o fundo estático
  // liga a parte animada de cada planeta
  if (pattern === 'ice')       desenharCenaGelo(ctx, s, W, H, t);
  if (pattern === 'lava')      desenharCenaLava(ctx, s, W, H, t);
  if (pattern === 'radiation') desenharCenaRadiacao(ctx, s, W, H, t);
  if (pattern === 'lowgrav')   desenharCenaBaixaGrav(ctx, s, W, H, t);
  if (pattern === 'ocean')     desenharCenaOceano(ctx, s, W, H, t);
  if (pattern === 'desert')    desenharCenaDeserto(ctx, s, W, H, t);
}

// animação do canvas 2D
function iniciarCanvasPlaneta(planet) {
  pararCanvasPlaneta();
  const canvas = $('planetCanvas');
  if (!canvas || !planet) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx     = canvas.getContext('2d');
  const W       = canvas.width, H = canvas.height;
  const rng     = criarAleatorio(hashTexto(planet.name + planet.subtitle));
  const pattern = planet.space.pattern;
  const t0      = performance.now();
  // constrói a cena estática uma vez antes de arrancar o ciclo
  const scene   = construirCena(pattern, W, H, rng, planet);

  function frame(now) {
    const dt = Math.min(0.05, ((now - (frame._last || now)) || 16) / 1000);
    frame._last = now;
    const t = (now - t0) / 1000;

    estadoRato.dx    *= 0.80;
    estadoRato.dy    *= 0.80;
    estadoRato.speed *= 0.82;
    estadoRato.spin  *= 0.92;
    estadoRato.energy = Math.max(0, (estadoRato.energy || 0) - dt * 0.55);

    ctx.clearRect(0, 0, W, H); // limpa o canvas antes de desenhar outra vez

    // deserto: roda o canvas dependendo da intensidade
    if (pattern === 'desert') {
      const intensidade = estadoDeserto.whirlIntensity || 0;
      const motion    = getMovimento();
      // escala 130% para não se verem limites
      const ESCALA_EXTRA  = 1.30;

      // tempestade ativa, faz a rotação
      if (intensidade > 0.08) {
        const sway = clamp((intensidade - 0.08) / 0.92, 0, 1);
        const anguloInclinacao = sway * 0.32 * Math.sin(t * 1.1);
        const shiftX    = sway * W * 0.09 * Math.sin(t * 0.85 + 0.4);
        const shiftY    = sway * H * 0.04 * Math.cos(t * 1.2);
        const tremor  = sway > 0.6 ? (sway - 0.6) / 0.4 * 14 : 0; // tremor só aparece acima de 60% de intensidade
        const tremorX    = tremor > 0 ? (Math.random() - 0.5) * tremor : 0;
        const tremorY    = tremor > 0 ? (Math.random() - 0.5) * tremor * 0.5 : 0;
        ctx.save();
        ctx.translate(W * 0.5 + shiftX + tremorX, H * 0.5 + shiftY + tremorY);
        ctx.rotate(anguloInclinacao);
        ctx.scale(ESCALA_EXTRA, ESCALA_EXTRA);
        ctx.translate(-W * 0.5, -H * 0.5);
        desenharCena(ctx, pattern, scene, W, H, t, motion);
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(W * 0.5, H * 0.5);
        ctx.scale(ESCALA_EXTRA, ESCALA_EXTRA);
        ctx.translate(-W * 0.5, -H * 0.5);
        desenharCena(ctx, pattern, scene, W, H, t, motion);
        ctx.restore();
      }
    } else {
      desenharCena(ctx, pattern, scene, W, H, t, getMovimento());
    }

    // desenha a cena base, e aplica interação

    // gelo - atualiza as estalactites e desenha o ecrã de evacuação
    if (pattern === 'ice') {
      tickGelo(scene, W, H, t);
      desenharOverlayGelo(ctx, scene, W, H, t);
    }
    // lava - atualiza fumo e fissuras dependendo do nível do som
    if (pattern === 'lava') {
      tickLava(scene, W, H);
      desenharOverlayLava(ctx, scene, W, H, t);
    }
    // deserto - analisa o movimento, e desenha tornados
    if (pattern === 'desert') {
      tickDeserto(now);
      desenharTornado(ctx, W, H, t);
    }

    atualizarGlitch();
    animacaoCanvas = requestAnimationFrame(frame);
  }
  animacaoCanvas = requestAnimationFrame(frame);
}

// ativa ou desativa o modo interior
function setModoInterior(active, planet) {
  const cockpit  = $('cockpit-screen');
  const interior = $('simpleInterior');
  if (!cockpit || !interior) return;

  if (active && planet) {
    estadoInterior.active = true;
    estadoInterior.planet = planet;
    interior.dataset.pattern   = planet.space.pattern;
    cockpit.classList.add('simple-interior-active');

    // radiação, analisa movimento
    if (planet.space.pattern === 'radiation') iniciarCamera('radiation');

    // deserto, reinicia e vê o movimento dos círculos
    if (planet.space.pattern === 'desert') {
      estadoDeserto.active = true;
      estadoDeserto.fingerHistory = []; estadoDeserto.pontuacaoCirculo = 0;
      estadoDeserto.whirlIntensity = 1; estadoDeserto.whirlParticles = [];
      estadoDeserto._lastSample = 0; estadoDeserto._prevGray = null;
      estadoDeserto._motionSmooth = 0; estadoDeserto.fingerConfidence = 0;
      estadoDeserto.fingerX = 0.5; estadoDeserto.fingerY = 0.5;
      iniciarCamera('desert');
    }

    iniciarCanvasPlaneta(planet);
    atualizarGlitch();
    return;
  }

  estadoInterior.active = false;
  estadoInterior.planet = null;
  delete interior.dataset.pattern;
  cockpit.classList.remove('simple-interior-active');

  pararCamera();
  estadoDeserto.active = false; estadoDeserto.whirlIntensity = 0;
  estadoDeserto.pontuacaoCirculo = 0; estadoDeserto.fingerHistory = [];
  estadoDeserto.whirlParticles = [];
}

function resetInterior() {
  pararCanvasPlaneta();
  setModoInterior(false);
  estadoInterior.phase = 'orbit';
}

function atualizarParallax() {
  const interior = $('simpleInterior');
  if (!interior) return;
  const motion = getMovimento();
  interior.style.setProperty('--interior-shift-x', `${(motion.x * 18).toFixed(2)}px`);
  interior.style.setProperty('--interior-shift-y', `${(motion.y * 12).toFixed(2)}px`);
}
