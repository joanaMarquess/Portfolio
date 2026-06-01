const estadoGelo = {
  micLevel: 0,
  micAnalyser: null,
  micStream: null,
  _micData: null,
  evacuating: false,
  lastFallSoundAt: 0,
};

function construirCenaGelo(s, bx, W, H, rng) {
  // gera todas as posições aleatórias
s.horizonY = 0.52 + rng() * 0.06;
    const horizY = s.horizonY * H;

    // estrelas do céu
    s.stars = Array.from({length: 22 + Math.floor(rng() * 16)}, () => ({
      x: rng(), y: rng() * 0.50, r: 0.5 + rng() * 1.8, twinkle: rng() * Math.PI * 2
    }));

    // montanhas ao fundo
    const numMtnFar = 5 + Math.floor(rng() * 4);
    s.mountainsFar = Array.from({length: numMtnFar}, (_, i) => ({
      cx: (i + 0.5) / numMtnFar + (rng() - 0.5) * 0.14,
      peakY: s.horizonY - 0.08 - rng() * 0.16,
      w: 0.20 + rng() * 0.22, brightness: 0.5 + rng() * 0.35
    }));

    // montanhas em primeiro plano
    const numMtnNear = 4 + Math.floor(rng() * 3);
    s.mountainsNear = Array.from({length: numMtnNear}, (_, i) => ({
      cx: (i + 0.5) / numMtnNear + (rng() - 0.5) * 0.10,
      peakY: s.horizonY - 0.04 - rng() * 0.10,
      w: 0.18 + rng() * 0.20, brightness: 0.65 + rng() * 0.30
    }));

    s.floorY = s.horizonY;

    // picos de gelo no chão
    const numSpikes = 4 + Math.floor(rng() * 7);
    s.spikes = Array.from({length: numSpikes}, () => ({
      x: 0.05 + rng() * 0.90, h: H * (0.06 + rng() * 0.14),
      w: 12 + rng() * 32, lean: (rng() - 0.5) * 0.15, shade: rng()
    }));
    s.spikes.sort((a, b) => a.x - b.x);


    const numIcicles = 5 + Math.floor(rng() * 8);
    // estalactites no teto que caem com barulho
    s.icicles = Array.from({length: numIcicles}, () => ({
      side: rng() > 0.5 ? 'left' : 'right',
      xFrac: 0.05 + rng() * 0.90, yFrac: 0.0,
      len: 40 + rng() * 120, w: 10 + rng() * 24, taper: 0.05 + rng() * 0.18
    }));

    // gradiente de preto e azul escuro no céu
    const skyG = bx.createLinearGradient(0, 0, 0, horizY);
    skyG.addColorStop(0, '#000508'); skyG.addColorStop(1, '#0a2a3e');
    bx.fillStyle = skyG; bx.fillRect(0, 0, W, horizY + 4);

    // desenha montanhas ao fundo
    s.mountainsFar.forEach(m => {
      const cx = m.cx * W, mw = m.w * W, peakY = m.peakY * H, br = m.brightness;
      bx.fillStyle = `rgba(${Math.round(10+br*30)},${Math.round(25+br*55)},${Math.round(50+br*75)},0.70)`;
      bx.beginPath(); bx.moveTo(cx, peakY); bx.lineTo(cx+mw*0.5, horizY); bx.lineTo(cx-mw*0.5, horizY); bx.closePath(); bx.fill();
    });

    // desenha montanhas à frente
    s.mountainsNear.forEach(m => {
      const cx = m.cx * W, mw = m.w * W, peakY = m.peakY * H, br = m.brightness;
      bx.fillStyle = `rgba(${Math.round(18+br*40)},${Math.round(48+br*70)},${Math.round(88+br*80)},0.88)`;
      bx.beginPath(); bx.moveTo(cx, peakY); bx.lineTo(cx+mw*0.5, horizY); bx.lineTo(cx-mw*0.5, horizY); bx.closePath(); bx.fill();
      bx.fillStyle = `rgba(${Math.round(80+br*70)},${Math.round(150+br*60)},${Math.round(195+br*35)},0.40)`;
      bx.beginPath(); bx.moveTo(cx, peakY); bx.lineTo(cx+mw*0.06, peakY+(horizY-peakY)*0.5); bx.lineTo(cx+mw*0.5, horizY); bx.closePath(); bx.fill();
    });

    // gradiente do chão
    const floorGrad = bx.createLinearGradient(0, horizY, 0, H);
    floorGrad.addColorStop(0, '#78b8d8'); floorGrad.addColorStop(1, '#0c1e30');
    bx.fillStyle = floorGrad; bx.fillRect(0, horizY, W, H - horizY);




    // desenha picos de gelo
    s.spikes.forEach(sp => {
      const sx = sp.x * W, baseY = horizY, tipX = sx + sp.lean * sp.h * 2, hw = sp.w * 0.5, br = sp.shade;
      bx.fillStyle = `rgba(${Math.round(10+br*60)},${Math.round(90+br*80)},${Math.round(140+br*80)},0.9)`;
      bx.beginPath(); bx.moveTo(sx-hw, baseY); bx.lineTo(sx+hw, baseY); bx.lineTo(tipX, baseY-sp.h); bx.closePath(); bx.fill();
      bx.fillStyle = `rgba(${Math.round(5+br*25)},${Math.round(40+br*40)},${Math.round(70+br*50)},0.85)`;
      bx.beginPath(); bx.moveTo(sx-hw, baseY); bx.lineTo(sx, baseY-sp.h*0.42); bx.lineTo(tipX, baseY-sp.h); bx.closePath(); bx.fill();
      bx.strokeStyle = 'rgba(160,230,255,0.7)'; bx.lineWidth = 1.5;
      bx.beginPath(); bx.moveTo(sx+hw, baseY); bx.lineTo(tipX, baseY-sp.h); bx.stroke();
    });

    // estalactites estáticas no tecto
    s.icicles.forEach(ic => {
      if (ic.falling || ic.fallen) return;
      const ibx = ic.xFrac * W, hw = ic.w * 0.5;
      bx.fillStyle = '#0d8aaa';
      bx.beginPath(); bx.moveTo(ibx-hw, 0); bx.lineTo(ibx+hw, 0); bx.lineTo(ibx, ic.len); bx.closePath(); bx.fill();
      bx.fillStyle = '#094858';
      bx.beginPath(); bx.moveTo(ibx-hw, 0); bx.lineTo(ibx, ic.len*0.45); bx.lineTo(ibx, ic.len); bx.closePath(); bx.fill();
      bx.strokeStyle = '#9af0ff'; bx.lineWidth = 1.2;
      bx.beginPath(); bx.moveTo(ibx+hw, 0); bx.lineTo(ibx, ic.len); bx.stroke();
    });


}

function desenharCenaGelo(ctx, s, W, H, t) {
const horizY = s.horizonY * H;

    // cintilação das estrelas
    s.stars.forEach(st => {
      const twink = 0.45 + 0.55 * Math.sin(t * 1.5 + st.twinkle);
      ctx.globalAlpha = twink;
      ctx.fillStyle = '#c8e8ff';
      ctx.beginPath(); ctx.arc(st.x*W, st.y*horizY, st.r, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    });

    ctx.fillStyle = 'rgba(220,240,255,0.7)';
    ctx.globalAlpha = 1;
}

// liga o microfone
function iniciarMicGelo() {
  if (estadoGelo.micAnalyser) return;
  if (!ctxAudio) iniciarAudio();
  const retormarELigar = (stream) => {
    const ligar = () => {
      estadoGelo.micStream = stream;
      const src = ctxAudio.createMediaStreamSource(stream);
      const analyser = ctxAudio.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4; // suavização entre fotogramas 0..1
      src.connect(analyser);
      estadoGelo.micAnalyser = analyser;
      estadoGelo._micData = new Uint8Array(analyser.frequencyBinCount);

    };
    if (ctxAudio.state === 'suspended') ctxAudio.resume().catch(() => {});
    ligar();
  };
  estadoGelo.micStream = 'pending';
  getStreamMic(stream => {
    setTimeout(() => retormarELigar(stream), 300);
  });
}

function pararMicGelo() {
  estadoGelo.micStream = null;
  estadoGelo.micAnalyser = null;
  estadoGelo.micLevel = 0;
}

function resetGelo() {
  estadoGelo.micLevel = 0;
  estadoGelo.evacuating = false;
  estadoGelo.showEvacWarning = false;
  estadoGelo.lastFallSoundAt = 0;
  pararAlarme();
  pararMicGelo();
}


function atualizarNivelMic() {
  if (!estadoGelo.micAnalyser || !estadoGelo._micData) return;
  estadoGelo.micAnalyser.getByteFrequencyData(estadoGelo._micData);
  let sum = 0, peak = 0;
  for (let i = 0; i < estadoGelo._micData.length; i++) {
    sum += estadoGelo._micData[i];
    if (estadoGelo._micData[i] > peak) peak = estadoGelo._micData[i];
  }
  const avg = sum / estadoGelo._micData.length;
  const raw = avg * 0.5 + peak * 0.5;
  estadoGelo.micLevel = Math.min(1, raw / 190);
}

// chamado a cada fotograma, decide se estalactites caem e se dispara evacuação
function tickGelo(scene, W, H, t) {
  if (!estadoInterior.active || estadoInterior.planet?.space.pattern !== 'ice') return;

  atualizarNivelMic();
  const lvl = estadoGelo.micLevel;
  const now = performance.now();

  // volume médio, escolhe uma estalactite aleatória e manda-a cair
  if (lvl > 0.25 && lvl <= 0.88 && scene && scene.icicles) {
    const avail = scene.icicles.filter(ic => !ic.falling);
    if (avail.length > 0 && Math.random() < lvl * 0.4) {
      const ic = avail[Math.floor(Math.random() * avail.length)];
      ic.falling = true;
      ic.fallen = false;
      ic.fallV = 2 + lvl * 4;
      ic.fallX = W * (0.05 + Math.random() * 0.9);
      ic.fallY = ic.len * (0.3 + Math.random() * 0.6);
      if (now - estadoGelo.lastFallSoundAt > 650) {
        tocarGelo();
        estadoGelo.lastFallSoundAt = now;
      }
    }
  }

  // volume alto, dispara a sequência de evacuação e sai do planeta
  if (lvl > 0.90 && !estadoGelo.evacuating) {
    estadoGelo.evacuating = true;
    estadoGelo.showEvacWarning = true;
    iniciarAlarme(0.96);
    setTimeout(() => {
      estadoGelo.showEvacWarning = false;
      pararAlarme();
      if (estadoInterior.phase === 'interior') {
        entrarSairPlaneta(false);
        setTimeout(resetGelo, 1200);
      }
    }, 3500);
  }

  // estalactites a cair
  if (scene && scene.icicles) {
    scene.icicles.forEach(ic => {
      if (ic.falling && !ic.fallen) {
        ic.fallV = (ic.fallV || 2) + 0.6; // aceleração
        ic.fallY = (ic.fallY || 0) + ic.fallV;
        if (ic.fallY - ic.len >= H) { ic.falling = false; ic.fallen = true; }
      }
    });
  }
}

// desenha as estalactites em queda e o aviso de evacuação
function desenharOverlayGelo(ctx, scene, W, H, t) {
  const floorY = scene.floorY * H;

  if (scene.icicles) {
    scene.icicles.forEach(ic => {
      if (!ic.falling && !ic.fallen) return;
      if (ic.fallen) return;

      const bx = ic.fallX !== undefined ? ic.fallX : ic.xFrac * W;

      const fallOffset = ic.fallY || 0;
      const tipY  = fallOffset;
      const rootY = tipY - ic.len;
      const hw = ic.w * 0.5;

      // estalactite a cair
      ctx.fillStyle = '#8adcf0';
      ctx.beginPath();
      ctx.moveTo(bx - hw, rootY);
      ctx.lineTo(bx + hw, rootY);
      ctx.lineTo(bx, tipY);
      ctx.closePath();
      ctx.fill();
      // sombra da estalactite
      ctx.fillStyle = '#0d6888';
      ctx.beginPath();
      ctx.moveTo(bx - hw, rootY);
      ctx.lineTo(bx, rootY + (tipY - rootY) * 0.45);
      ctx.lineTo(bx, tipY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c8f4ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(bx + hw, rootY);
      ctx.lineTo(bx, tipY);
      ctx.stroke();
    });
  }

  // bordas vermelhas no limite de evacuação
  if (estadoGelo.micLevel > 0.82 && !estadoGelo.evacuating) {
    ctx.save();
    ctx.globalAlpha = (estadoGelo.micLevel - 0.82) * 2.2 * (0.5 + 0.5 * Math.sin(t * 10));
    ctx.strokeStyle = '#ff2244';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, W - 6, H - 6);
    ctx.restore();
  }

  // overlay de evacuação
  if (estadoGelo.showEvacWarning) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 4, 12, 0.72)';
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 10);
    ctx.strokeStyle = '#ff2244';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, W - 8, H - 8);

    ctx.globalAlpha = 1;

    // ponto de exclamação no centro
    ctx.font = 'bold 64px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#ff2244';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const pulse = 0.85 + 0.15 * Math.sin(t * 7);
    ctx.save();
    ctx.translate(W / 2, H / 2 - 80);
    ctx.scale(pulse, pulse);
    ctx.fillText('!', 0, 0);
    ctx.restore();

    ctx.font = 'bold 28px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#ff2244';
    ctx.fillText('CHUVA DE ESTALACTITES', W / 2, H / 2 - 10);

    ctx.font = 'bold 22px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('EVACUAR IMEDIATAMENTE!', W / 2, H / 2 + 30);

    ctx.font = '13px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(200,220,255,0.7)';
    ctx.fillText('A sair do planeta...', W / 2, H / 2 + 70);

    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }
}
