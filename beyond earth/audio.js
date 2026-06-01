// contexto de áudio global
let ctxAudio = null;

function iniciarAudio() {
  if (ctxAudio) return;
  try {
    ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e) {}
}


const SONS = {};

// variáveis para a transição da música de fundo
let musicaFundo               = null;
let fadeMusicaRaf        = 0;
let volumeAlvo   = 0;
let tokenMusica          = 0;      // cancela transições anteriores
let autoplayAtivado = false;  // ativo depois de o browser aceitar
let tokenTransicao  = 0;
let rafTransicao    = 0;

// volumes da música para cada estado do jogo
const VOLUMES_MUSICA = {
  intro:  0.22,
  travel: 0.08,  // durante a viagem
  silent: 0      // dentro dos planetas
};

function carregarSons() {
  const files = {
    botao:         'audio/botao.ogg',
    viagem:        'audio/viagem.wav',
    alerta:        'audio/alerta.wav',
    lava:          'audio/lava.mp3',
    entrarsair:    'audio/entrarsair.mp3',
    gelo:          'audio/gelo.mp3',
    interferencia: 'audio/interferencia.wav',
    oceano:        'audio/oceano.mp3',
    deserto:       'audio/deserto.mp3',
    gravidade:     'audio/gravidade.wav',
    inabitavel:    'audio/inabitavel.mp3'
  };
  Object.entries(files).forEach(([key, src]) => {
    const a = new Audio(src);
    a.preload = 'auto';
    SONS[key] = a;
  });
}
carregarSons();

function garantirMusicaFundo() {
  if (musicaFundo) return musicaFundo;
  const music = new Audio('audio/fundo.wav');
  music.preload = 'auto';
  music.loop    = true;
  music.volume  = 0;
  musicaFundo = music;
  return music;
}

// transição suave do volume
function fadeMusica(volume, duration = 1200) {
  const music = garantirMusicaFundo();
  volumeAlvo = Math.max(0, Math.min(1, volume));

  // cancela a transição anterior se houver uma já a correr
  if (fadeMusicaRaf) { cancelAnimationFrame(fadeMusicaRaf); fadeMusicaRaf = 0; }

  const volumeInicial = music.volume;
  const delta  = volumeAlvo - volumeInicial; // diferença a percorrer
  const fadeMs = Math.max(0, duration);
  const token  = ++tokenMusica;

  // se a duração for zero aplica logo sem animar
  if (fadeMs === 0 || Math.abs(delta) < 0.001) {
    if (music.paused && volumeAlvo > 0.001) music.play().catch(() => {});
    music.volume = volumeAlvo;
    if (volumeAlvo <= 0.001) music.pause();
    return;
  }

  if (music.paused && volumeAlvo > 0.001) music.play().catch(() => {});

  const iniciadoEm = performance.now();
  const tick = (now) => {
    if (token !== tokenMusica) return;
    const progress = Math.min(1, (now - iniciadoEm) / fadeMs);
    const eased    = 1 - Math.pow(1 - progress, 3); // suavização de saída
    music.volume   = volumeInicial + delta * eased;
    if (progress < 1) { fadeMusicaRaf = requestAnimationFrame(tick); return; }
    fadeMusicaRaf = 0;
    music.volume   = volumeAlvo;
    if (volumeAlvo <= 0.001) music.pause();
  };

  fadeMusicaRaf = requestAnimationFrame(tick);
}

// muda o estado (intro/travel/silent) com transição suave
function setEstadoMusica(state, duration) {
  const volume = VOLUMES_MUSICA[state] ?? VOLUMES_MUSICA.travel;
  fadeMusica(volume, duration);
}

// os browsers bloqueiam autoplay até ao primeiro gesto do utilizador
function ativarAutoplay() {
  if (autoplayAtivado) return;
  autoplayAtivado = true;

  const unlock = () => {
    setEstadoMusica('intro', 0);
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown',     unlock, true);
    window.removeEventListener('touchstart',  unlock, true);
  };

  setEstadoMusica('intro', 0);
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown',     unlock, true);
  window.addEventListener('touchstart',  unlock, true);
}

function tocarSom(key, volume = 1, fromStart = true) {
  const snd = SONS[key];
  if (!snd) return;
  try {
    if (fromStart) snd.currentTime = 0;
    snd.volume = Math.min(1, Math.max(0, volume));
    snd.play().catch(() => {});
  } catch(e) {}
}

// deixa sobrepor várias partes do mesmo som
function tocarSomUnico(key, volume = 1) {
  const snd = SONS[key];
  if (!snd) return;
  try {
    const somUnico  = snd.cloneNode();
    somUnico.volume = Math.min(1, Math.max(0, volume));
    somUnico.play().catch(() => {});
  } catch(e) {}
}

// baixa o volume antes do fim
function tocarSomComFade(key, volume = 1, maxMs = 1000, duracaoSaida = 420) {
  const snd = SONS[key];
  if (!snd) return;
  try {
    const somUnico    = snd.cloneNode();
    const volumeBase = Math.min(1, Math.max(0, volume));
    somUnico.volume   = volumeBase;
    somUnico.play().catch(() => {});
    // temporizador para iniciar a descida de volume antes do corte
    setTimeout(() => {
      const inicioFade = performance.now();
      const step = (now) => {
        try {
          const progress = Math.min(1, (now - inicioFade) / Math.max(120, duracaoSaida));
          somUnico.volume = volumeBase * (1 - progress); // volume desce linearmente
          if (progress < 1) { requestAnimationFrame(step); return; }
          somUnico.pause(); somUnico.currentTime = 0;
        } catch(e) {}
      };
      requestAnimationFrame(step);
    }, Math.max(120, maxMs - duracaoSaida));
  } catch(e) {}
}

// alarme em ciclo para as evacuações
function iniciarAlarme(volume = 0.8) {
  const snd = SONS.alerta;
  if (!snd) return;
  try { snd.loop = true; snd.volume = Math.min(1, Math.max(0, volume)); snd.currentTime = 0; snd.play().catch(() => {}); } catch(e) {}
}

// para o alarme e reinicia
function pararAlarme() {
  const snd = SONS.alerta;
  if (!snd) return;
  try { snd.pause(); snd.currentTime = 0; snd.loop = false; } catch(e) {}
}

// para o som de transição e cancela a transição em curso
function pararSomTransicao() {
  tokenTransicao++;
  if (rafTransicao) { cancelAnimationFrame(rafTransicao); rafTransicao = 0; }
  const snd = SONS.entrarsair;
  if (!snd) return;
  try { snd.pause(); snd.currentTime = 0; snd.loop = false; snd.volume = 0; } catch(e) {}
}

// som de entrar/sair do planeta
function tocarSomTransicao(duracaoTotal = 2200, peakVolume = 0.82) {
  const snd = SONS.entrarsair;
  if (!snd) return;

  pararSomTransicao();

  const token     = ++tokenTransicao;
  const duracaoEntrada  = Math.min(420, Math.max(180, duracaoTotal * 0.18));  // subida de volume
  const duracaoSaida = Math.min(520, Math.max(220, duracaoTotal * 0.22));  // descida de volume
  const aguardarAte = Math.max(duracaoEntrada, duracaoTotal - duracaoSaida);       // momento de iniciar a descida

  try { snd.loop = false; snd.currentTime = 0; snd.volume = 0; snd.play().catch(() => {}); } catch(e) { return; }

  const iniciadoEm = performance.now();
  const tick = (now) => {
    if (token !== tokenTransicao) return;
    const elapsed = now - iniciadoEm;
    let volume    = peakVolume;
    if (elapsed < duracaoEntrada)        volume = peakVolume * (elapsed / duracaoEntrada);           // rampa de subida
    else if (elapsed > aguardarAte)  volume = peakVolume * (1 - Math.min(1, (elapsed - aguardarAte) / duracaoSaida)); // rampa de descida
    snd.volume = Math.max(0, Math.min(1, volume));
    if (elapsed < duracaoTotal) { rafTransicao = requestAnimationFrame(tick); return; }
    rafTransicao = 0;
    if (token === tokenTransicao) pararSomTransicao();
  };

  rafTransicao = requestAnimationFrame(tick);
}

// atalhos rápidos
function tocarBotao()          { tocarSom('botao', 0.5); }    // clique de UI
function tocarViagem()          { tocarSom('viagem', 0.9); }          // som de viagem
function tocarGelo()       { tocarSomUnico('gelo', 0.82); }  // estalactite a cair
function tocarOnda()     { tocarSomComFade('oceano', 0.62, 1100, 560); } // onda com transição
function tocarInabitavel() { tocarSom('inabitavel', 0.88); }     // planeta inabitável

// arranca o som de ambiente do planeta em ciclo contínuo
function iniciarAmbiente(kind) {
  if (kind === 'lava')      { const s = SONS.lava;          if (s) try { s.loop=true; s.volume=0.95; s.currentTime=0; s.play().catch(()=>{}); } catch(e) {} return; }
  if (kind === 'radiation') { const s = SONS.interferencia; if (s) try { s.loop=true; s.volume=0.85; s.currentTime=0; s.play().catch(()=>{}); } catch(e) {} return; }
  if (kind === 'desert')    { const s = SONS.deserto;       if (s) try { s.loop=true; s.volume=0.88; s.currentTime=0; s.play().catch(()=>{}); } catch(e) {} return; }
  if (kind === 'lowgrav')   { const s = SONS.gravidade;     if (s) try { s.loop=true; s.volume=0.82; s.currentTime=0; s.play().catch(()=>{}); } catch(e) {} }
}

// para todos os sons de ambiente ao sair do planeta
function pararAmbiente() {
  ['lava', 'interferencia', 'deserto', 'gravidade'].forEach(key => {
    const snd = SONS[key];
    if (!snd) return;
    try { snd.pause(); snd.currentTime = 0; snd.loop = false; } catch(e) {}
  });
}
