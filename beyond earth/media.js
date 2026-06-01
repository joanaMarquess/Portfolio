// microfone e câmara
const poolMedia = {
  audioStream:    null,
  videoStream:    null,
  audioRequested: false,
  videoRequested: false,
  audioCallbacks: [],
  videoCallbacks: []
};

function getStreamMic(onReady, onError) {
  if (poolMedia.audioStream) { onReady(poolMedia.audioStream); return; }
  poolMedia.audioCallbacks.push({ onReady, onError: onError || (() => {}) });
  if (poolMedia.audioRequested) return; // pedido em curso
  poolMedia.audioRequested = true;
  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(stream => {
      poolMedia.audioStream = stream;
      const cbs = poolMedia.audioCallbacks.splice(0);
      cbs.forEach(cb => cb.onReady(stream));
    })
    .catch(err => {
      poolMedia.audioRequested = false; // falhou, tenta de novo
      const cbs = poolMedia.audioCallbacks.splice(0);
      cbs.forEach(cb => cb.onError(err));
    });
}

// câmara frontal
function getStreamCamera(onReady, onError) {
  if (poolMedia.videoStream) { onReady(poolMedia.videoStream); return; }
  poolMedia.videoCallbacks.push({ onReady, onError: onError || (() => {}) });
  if (poolMedia.videoRequested) return;
  poolMedia.videoRequested = true;
  navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
    audio: false
  })
    .then(stream => {
      poolMedia.videoStream = stream;
      const cbs = poolMedia.videoCallbacks.splice(0);
      cbs.forEach(cb => cb.onReady(stream));
    })
    .catch(err => {
      poolMedia.videoRequested = false;
      const cbs = poolMedia.videoCallbacks.splice(0);
      cbs.forEach(cb => cb.onError(err));
    });
}


// compara o fotograma atual com o anterior
const estadoCamera = {
  stream:       null,
  videoEl:      null,
  sampleCanvas: null,
  sampleCtx:    null,
  frameData:    null,   // array em tons de cinzento para detetar movimento
  raf:          null,
  lastSample:   0,
  pending:      false,
  ready:        false,
  active:       false,
  x: 0, y: 0, dx: 0, dy: 0,
  speed: 0, spin: 0, energy: 0,
  motion: 0,   // nível geral de movimento 0..1
  radiationGlitch: 1,
  radiationGlitchLastUpdate: 0
};

function resetEstadoCamera() {
  estadoCamera.x = estadoCamera.y = estadoCamera.dx = estadoCamera.dy = 0;
  estadoCamera.speed = estadoCamera.spin = estadoCamera.energy = estadoCamera.motion = 0;
  estadoCamera.radiationGlitch = 1;
  estadoCamera.radiationGlitchLastUpdate = 0;
  estadoCamera.lastSample = 0;
}

function garantirElementosCamera() {
  if (!estadoCamera.videoEl) {
    const video = document.createElement('video');
    video.autoplay = true; video.muted = true; video.playsInline = true;
    video.style.display = 'none';
    document.body.appendChild(video);
    estadoCamera.videoEl = video;
  }
  if (!estadoCamera.sampleCanvas) {
    const canvas = document.createElement('canvas');
    canvas.width = 48; canvas.height = 36;
    estadoCamera.sampleCanvas = canvas;
    estadoCamera.sampleCtx = canvas.getContext('2d', { willReadFrequently: true });
  }
}

function getMovimento() {
  const pesoCamera   = estadoCamera.ready ? 0.72 : 0;
  const pesoRato = estadoCamera.ready ? 0.28 : 1;
  return {
    x:           clamp(estadoRato.x * pesoRato + estadoCamera.x * pesoCamera, -1, 1),
    y:           clamp(estadoRato.y * pesoRato + estadoCamera.y * pesoCamera, -1, 1),
    dx:          estadoRato.dx * pesoRato + estadoCamera.dx * pesoCamera,
    dy:          estadoRato.dy * pesoRato + estadoCamera.dy * pesoCamera,
    speed:       clamp(Math.max(estadoRato.speed * pesoRato, estadoCamera.speed), 0, 1),
    spin:        estadoRato.spin * pesoRato + estadoCamera.spin * pesoCamera,
    energy:      clamp(Math.max((estadoRato.energy || 0) * Math.max(0.4, pesoRato), estadoCamera.energy), 0, 1),
    webcamActive: estadoCamera.ready
  };
}

// inverte a lógica normal para a radiação
function getMovimentoRadiacao() {
  const ready     = estadoCamera.ready;
  const movimentoBruto = ready ? estadoCamera.motion : 0;

  let energiaCalma = 0; // quanto o movimento acalma o glitch
  if (movimentoBruto > 0.03) {
    energiaCalma = clamp(Math.pow((movimentoBruto - 0.03) * 1.5, 1.8), 0, 1);
  }
  const alvoGlitch = ready ? clamp(1 - energiaCalma * 0.92, 0.08, 1) : 1; // sem câmara, glitch sempre no máximo
  const agora = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const dt = estadoCamera.radiationGlitchLastUpdate
    ? Math.min(0.25, (agora - estadoCamera.radiationGlitchLastUpdate) / 1000)
    : 0;
  estadoCamera.radiationGlitchLastUpdate = agora;
  const suavizacao = dt > 0 ? 1 - Math.exp(-dt / 1.15) : 0;
  estadoCamera.radiationGlitch = lerp(estadoCamera.radiationGlitch, alvoGlitch, suavizacao);
  const energiaGlitch = estadoCamera.radiationGlitch;

  return {
    x: ready ? estadoCamera.x : 0, y: ready ? estadoCamera.y : 0,
    dx: ready ? estadoCamera.dx : 0, dy: ready ? estadoCamera.dy : 0,
    speed: ready ? estadoCamera.speed : 0, spin: ready ? estadoCamera.spin : 0,
    energy: energiaGlitch, rawEnergy: movimentoBruto, active: energiaGlitch > 0.005,
  };
}

// ciclo de análise da diferença entre píxeis
function tickCamera(now) {
  if (!estadoCamera.active) return;
  estadoCamera.raf = requestAnimationFrame(tickCamera);

  const video = estadoCamera.videoEl, ctx = estadoCamera.sampleCtx, canvas = estadoCamera.sampleCanvas;
  if (!video || !ctx || !canvas || !estadoCamera.ready || video.readyState < 2) return;

  if (now - estadoCamera.lastSample < 70) {
    estadoCamera.energy = Math.max(0, estadoCamera.energy - 0.012);
    estadoCamera.speed *= 0.92; estadoCamera.spin *= 0.9;
    return;
  }
  estadoCamera.lastSample = now;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  let frame;
  try { frame = ctx.getImageData(0, 0, canvas.width, canvas.height).data; } catch (_) { return; }

  // primeiro fotograma após arranque, guarda como referência
  if (!estadoCamera.frameData) {
    estadoCamera.frameData = new Uint8ClampedArray(canvas.width * canvas.height);
    for (let i = 0, p = 0; i < frame.length; i += 4, p++) {
      estadoCamera.frameData[p] = (frame[i] * 77 + frame[i+1] * 150 + frame[i+2] * 29) >> 8;
    }
    return;
  }

  let total = 0, sumX = 0, sumY = 0;
  for (let i = 0, p = 0; i < frame.length; i += 4, p++) {
    const gray   = (frame[i] * 77 + frame[i+1] * 150 + frame[i+2] * 29) >> 8;
    const diff   = Math.abs(gray - estadoCamera.frameData[p]);
    estadoCamera.frameData[p] = gray;
    const motion = diff > 6 ? diff - 6 : 0; // só conta diff > 6
    if (!motion) continue;
    total += motion;
    sumX  += (p % canvas.width) * motion;
    sumY  += ((p / canvas.width) | 0) * motion;
  }

  const prevX = estadoCamera.x, prevY = estadoCamera.y;
  const movimentoNorm = clamp(total / (canvas.width * canvas.height * 12), 0, 1);
  estadoCamera.motion = lerp(estadoCamera.motion, movimentoNorm, 0.18);

  if (total > 0) {
    const targetX = ((sumX / total) / Math.max(1, canvas.width - 1)) * 2 - 1;
    const targetY = ((sumY / total) / Math.max(1, canvas.height - 1)) * 2 - 1;
    const pull    = 0.12 + movimentoNorm * 0.28;
    estadoCamera.x = lerp(estadoCamera.x, clamp(targetX, -1, 1), pull);
    estadoCamera.y = lerp(estadoCamera.y, clamp(targetY, -1, 1), pull);
  } else {
    estadoCamera.x = lerp(estadoCamera.x, 0, 0.08);
    estadoCamera.y = lerp(estadoCamera.y, 0, 0.08);
  }

  estadoCamera.dx    = estadoCamera.x - prevX;
  estadoCamera.dy    = estadoCamera.y - prevY;
  estadoCamera.speed = lerp(estadoCamera.speed, clamp(Math.hypot(estadoCamera.dx, estadoCamera.dy) * 14 + movimentoNorm * 0.75, 0, 1), 0.45);
  estadoCamera.spin  = lerp(estadoCamera.spin, (estadoCamera.dx - estadoCamera.dy) * 2.4, 0.35);
  estadoCamera.energy = clamp(movimentoNorm, 0, 1);

  atualizarParallax();
  atualizarGlitch();
}

// pede acesso à câmara e arranca o ciclo de análise
function iniciarCamera(mode) {
  if (estadoCamera.pending || estadoCamera.stream) return;
  garantirElementosCamera();
  resetEstadoCamera();
  estadoCamera.pending = true;
  estadoCamera.active  = true;
  estadoCamera.mode    = mode || 'radiation';

  getStreamCamera(
    stream => {
      if (!estadoCamera.active) return;
      estadoCamera.stream = stream;
      const video = estadoCamera.videoEl;
      const aoFicarPronto = () => {
        if (!estadoCamera.active) return;
        estadoCamera.pending = false; estadoCamera.ready = true;
        resetEstadoCamera();
        if (estadoCamera.raf) cancelAnimationFrame(estadoCamera.raf);
        // radiação: analisa a diferença geral entre píxeis; deserto: analisa movimentos
        const tickFn = estadoCamera.mode === 'desert' ? tickCameraDeserto : tickCamera;
        estadoCamera.raf = requestAnimationFrame(tickFn);
      };
      if (video.srcObject !== stream) {
        video.srcObject = stream;
        video.onloadedmetadata = () => video.play().then(aoFicarPronto).catch(aoFicarPronto);
      } else {
        if (video.readyState >= 2) aoFicarPronto();
        else video.onloadedmetadata = () => video.play().then(aoFicarPronto).catch(aoFicarPronto);
      }
    },
    () => {
      estadoCamera.pending = false; estadoCamera.active = false;
      estadoCamera.ready = false; estadoCamera.stream = null;
    }
  );
}

function pararCamera() {
  estadoCamera.active = false; estadoCamera.pending = false; estadoCamera.ready = false;
  if (estadoCamera.raf) { cancelAnimationFrame(estadoCamera.raf); estadoCamera.raf = null; }
  estadoCamera.stream = null; estadoCamera.frameData = null;
  if (estadoCamera.videoEl) {
    estadoCamera.videoEl.pause();
    estadoCamera.videoEl.srcObject = null;
    estadoCamera.videoEl.onloadedmetadata = null;
  }
  resetEstadoCamera();
  atualizarParallax();
  atualizarGlitch();
}

function tickCameraDeserto(now) {
  if (!estadoCamera.active || estadoCamera.mode !== 'desert') return;
  estadoCamera.raf = requestAnimationFrame(tickCameraDeserto);
  tickDeserto(now);
}
