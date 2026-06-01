const estadoLava = {
  micLevel: 0,
  micAnalyser: null,
  micStream: null,
  _micData: null,
  smokes: [], // fumo
  cracks: [], // fissuras
  crackSpawnCooldown: 0,
};

// gera fundo da cena
function construirCenaLava(s, bx, W, H, rng) {
// layout das paredes
const layout = rng();
    const layoutMode = layout < 0.33 ? 'both' : layout < 0.66 ? 'left' : 'right';
    const leftW  = layoutMode === 'right' ? 0.10 + rng()*0.10 : 0.25 + rng()*0.15;
    const rightW = layoutMode === 'left'  ? 0.10 + rng()*0.10 : 0.25 + rng()*0.15;

    // rocha à esquerda
    s.leftSlabs = Array.from({length: 4 + Math.floor(rng()*4)}, (_, i) => ({
      xFrac: -(0.02 + rng()*0.06), wFrac: leftW * (0.5 + rng()*0.7),
      topFrac: -0.02 + rng()*0.15, botFrac: 0.68 + rng()*0.20,
      brightness: 0.35 + rng()*0.45, lightDir: rng() > 0.5 ? 1 : -1, peakOffset: 0.28 + rng()*0.35, depth: i
    }));
    // rocha à direita
    s.rightSlabs = Array.from({length: 4 + Math.floor(rng()*4)}, (_, i) => ({
      xFrac: 1.0 - rightW*(0.5 + rng()*0.7) + 0.02 + rng()*0.04, wFrac: rightW * (0.5 + rng()*0.7),
      topFrac: -0.02 + rng()*0.15, botFrac: 0.68 + rng()*0.20,
      brightness: 0.35 + rng()*0.45, lightDir: rng() > 0.5 ? 1 : -1, peakOffset: 0.28 + rng()*0.35, depth: i
    }));

    // lago de lava central
    s.floorY = 0.60 + rng()*0.08;
    s.lakeX = 0.35 + rng()*0.30; s.lakeW = 0.22 + rng()*0.20;
    s.lakeH = 0.06 + rng()*0.06; s.lakeYFrac = s.floorY + 0.16 + rng()*0.08;

    // plantas nas margens
    const numPlants = 2 + Math.floor(rng()*5);
    s.plants = Array.from({length: numPlants}, () => ({
      x: rng() < 0.5 ? rng() * leftW * W * 0.9 : W - rng() * rightW * W * 0.9,
      numBlades: 3 + Math.floor(rng()*4), h: 30 + rng()*50, spread: 0.3 + rng()*0.4
    }));
    // nuvens
    s.clouds = Array.from({length: 3 + Math.floor(rng()*4)}, () => ({
      x: rng(), y: 0.04 + rng()*0.28, w: 0.10 + rng()*0.16, h: 0.04 + rng()*0.06,
      phase: rng()*Math.PI*2, speed: 0.012 + rng()*0.018
    }));
    // estrelas visíveis através do fumo
    s.stars = Array.from({length: 5 + Math.floor(rng()*8)}, () => ({
      x: rng(), y: rng()*0.45, r: 1.5 + rng()*2.5, twinkle: rng()*Math.PI*2, diamond: false
    }));
    // brasas
    s.embers = Array.from({length: 35}, () => ({
      x: rng()*W, y: H*(0.45+rng()*0.4), vx: (rng()-0.5)*0.8, vy: -(0.3+rng()*1.0),
      r: 1+rng()*2.5, life: rng(), speed: 0.3+rng()*0.6
    }));

    const C = {
      skyTop:'#cc2200', skyMid:'#e83800', skyBot:'#ff5500',
      rockDark:'#8b1200', floorMain:'#7a3010', plantDark:'#6b0a00', cloudFill:'#e85030',
    };
    const floorY = s.floorY * H;

    // céu
    const skyG = bx.createLinearGradient(0, 0, 0, floorY);
    skyG.addColorStop(0, C.skyTop); skyG.addColorStop(0.45, C.skyMid); skyG.addColorStop(1, C.skyBot);
    bx.fillStyle = skyG; bx.fillRect(0, 0, W, floorY + 4);

    // nuvens atrás das montanhas
    s.clouds.forEach(c => {
      const cx = c.x * W, cy = c.y * H, cw = c.w * W, ch = c.h * H;
      bx.fillStyle = C.rockDark;
      bx.beginPath(); bx.ellipse(cx, cy+ch*0.35, cw*0.82, ch*0.55, 0, 0, Math.PI*2); bx.fill();
      bx.fillStyle = C.cloudFill;
      bx.beginPath(); bx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI*2); bx.fill();
      bx.beginPath(); bx.ellipse(cx-cw*0.35, cy-ch*0.15, cw*0.55, ch*0.75, 0, 0, Math.PI*2); bx.fill();
    });

    function drawRockSlab(x, w, top, bot, brightness, lightDir, peakOffset) {
      const peakX = x + w * peakOffset, b = Math.round(brightness * 200);
      bx.fillStyle = `rgb(${b},${Math.round(b*0.28)},0)`;
      bx.beginPath(); bx.moveTo(peakX, top); bx.lineTo(x+w, bot); bx.lineTo(x, bot); bx.closePath(); bx.fill();
      bx.fillStyle = C.rockDark;
      if (lightDir > 0) {
        bx.beginPath(); bx.moveTo(peakX, top); bx.lineTo(x, bot); bx.lineTo(x+(x+w-x)*0.42, bot); bx.closePath(); bx.fill();
      } else {
        bx.beginPath(); bx.moveTo(peakX, top); bx.lineTo(x+w, bot); bx.lineTo(x+w-(x+w-x)*0.42, bot); bx.closePath(); bx.fill();
      }
    }

    // desenha lajes da esquerda
    s.leftSlabs.forEach(sl => drawRockSlab(sl.xFrac*W, sl.wFrac*W, sl.topFrac*H, Math.min(sl.botFrac*H, floorY+6), sl.brightness, sl.lightDir, sl.peakOffset));
    s.rightSlabs.forEach(sl => drawRockSlab(sl.xFrac*W, sl.wFrac*W, sl.topFrac*H, Math.min(sl.botFrac*H, floorY+6), sl.brightness, sl.lightDir, sl.peakOffset));

    bx.fillStyle = C.floorMain; bx.fillRect(0, floorY, W, H - floorY);
    const floorShad = bx.createLinearGradient(0, floorY, 0, H);
    floorShad.addColorStop(0, 'rgba(0,0,0,0)'); floorShad.addColorStop(1, 'rgba(0,0,0,0.4)');
    bx.fillStyle = floorShad; bx.fillRect(0, floorY, W, H - floorY);

    s.plants.forEach(pl => {
      const baseY = floorY + 4;
      for (let b = 0; b < pl.numBlades; b++) {
        const angle = -Math.PI * 0.5 + (b - pl.numBlades/2) * pl.spread * 0.35;
        const tipX = pl.x + Math.cos(angle) * pl.h, tipY = baseY - Math.abs(Math.sin(angle)) * pl.h, hw = 4 + b%2*2;
        bx.fillStyle = C.plantDark;
        bx.beginPath(); bx.moveTo(pl.x-hw, baseY); bx.lineTo(pl.x+hw, baseY); bx.lineTo(tipX, tipY); bx.closePath(); bx.fill();
      }
    });

    const vig = bx.createRadialGradient(W*0.5, H*0.5, H*0.2, W*0.5, H*0.5, H*0.75);
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.32)');
    bx.fillStyle = vig; bx.fillRect(0, 0, W, H);
}

// estrelas, lago e brasas
function desenharCenaLava(ctx, s, W, H, t) {
const floorY = s.floorY * H;
    const C = { rockDark:'#8b1200', cloudFill:'#e85030', lavaCore:'#ff6200' };

    // cintilação das estrelas
    s.stars.forEach(st => {
      const twink = 0.55 + 0.45 * Math.sin(t*1.4+st.twinkle);
      ctx.save(); ctx.globalAlpha = twink;
      if (st.diamond) {
        const r = st.r;
        ctx.fillStyle = '#ffee88';
        ctx.beginPath(); ctx.moveTo(st.x*W, st.y*floorY-r*2.2); ctx.lineTo(st.x*W+r*0.6, st.y*floorY);
        ctx.lineTo(st.x*W, st.y*floorY+r*2.2); ctx.lineTo(st.x*W-r*0.6, st.y*floorY); ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(st.x*W, st.y*floorY, st.r*0.6, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    });

    const lkX = s.lakeX*W, lkY = s.lakeYFrac*H + Math.sin(t*0.6)*3, lkW = s.lakeW*W, lkH = s.lakeH*H;
    ctx.fillStyle = C.lavaCore;
    ctx.beginPath(); ctx.ellipse(lkX, lkY, lkW, lkH, 0, 0, Math.PI*2); ctx.fill();


    // brasas a subir
    s.embers.forEach(e => {
      e.life = (e.life + e.speed*0.004) % 1;
      const alpha = Math.sin(e.life*Math.PI)*0.8;
      ctx.fillStyle = `rgba(255,${100+e.life*120|0},0,${alpha})`;
      ctx.beginPath(); ctx.arc(e.x+e.vx*e.life*60, e.y+e.vy*e.life*70, e.r*(1-e.life*0.4), 0, Math.PI*2); ctx.fill();
    });
}

// liga o microfone
function iniciarMicLava() {
  if (estadoLava.micAnalyser) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    mostrarNotif('MICROFONE NÃO DISPONÍVEL', '', 2000);
    return;
  }
  if (!ctxAudio) iniciarAudio();

  const retormarELigar = (stream) => {
    const ligar = () => {
      estadoLava.micStream = stream;
      const src = ctxAudio.createMediaStreamSource(stream);
      const analyser = ctxAudio.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      src.connect(analyser);
      estadoLava.micAnalyser = analyser;
      estadoLava._micData = new Uint8Array(analyser.frequencyBinCount);

    };
    if (ctxAudio.state === 'suspended') ctxAudio.resume().catch(() => {});
    ligar();
  };

  estadoLava.micStream = 'pending';
  getStreamMic(
      stream => {

        setTimeout(() => retormarELigar(stream), 200);
      },
      () => {
        estadoLava.micStream = null;
        mostrarNotif('SEM ACESSO AO MICROFONE', '', 2500);
      }
  );
}

function pararMicLava() {
  estadoLava.micStream = null;
  estadoLava.micAnalyser = null;
  estadoLava.micLevel = 0;
}

function resetLava() {
  estadoLava.smokes = [];
  estadoLava.cracks = [];
  estadoLava._bubbles = [];
  estadoLava.crackSpawnCooldown = 0;
  estadoLava.micLevel = 0;
  pararAmbiente();
  pararMicLava();
}

// calcula o nível de volume 0..1
function atualizarNivelMicLava() {
  if (!estadoLava.micAnalyser || !estadoLava._micData) return;
  estadoLava.micAnalyser.getByteFrequencyData(estadoLava._micData);
  let sum = 0, peak = 0;
  for (let i = 0; i < estadoLava._micData.length; i++) {
    sum += estadoLava._micData[i];
    if (estadoLava._micData[i] > peak) peak = estadoLava._micData[i];
  }
  const avg = sum / estadoLava._micData.length;
  estadoLava.micLevel = Math.min(1, (avg * 0.5 + peak * 0.5) / 130);
}

// cria fumo e fissuras quando há som
function tickLava(scene, W, H) {
  if (!estadoInterior.active || estadoInterior.planet?.space.pattern !== 'lava') return;
  atualizarNivelMicLava();
  const lvl = estadoLava.micLevel;
  // tolera algum ruído ambiente antes de considerar que há som
  const temSom = lvl > 0.25;
  const silence = !temSom;

  const lkX = scene.lakeX * W;
  const lkY = scene.lakeYFrac * H;
  const lkW = scene.lakeW * W;
  const lkH = scene.lakeH * H;

  // sem som - fumo denso; com som - o fumo diminui
  if (silence) {
    const rajadosFumo = 9 + Math.floor(Math.random() * 5); // mais fumo em silêncio
    for (let i = 0; i < rajadosFumo; i++) {
      if (Math.random() > 0.75) continue;
      const u = (Math.random() + Math.random() - 1);
      const smokeX = lkX + u * lkW * 0.95;
      const relX = (smokeX - lkX) / lkW;
      const edgeY = lkY - lkH * Math.sqrt(Math.max(0, 1 - relX * relX));
      estadoLava.smokes.push({
        x: smokeX,
        y: edgeY - lkH * (0.05 + Math.random() * 0.15),
        vy: -(0.9 + Math.random() * 0.6),
        vx: (Math.random() - 0.5) * 0.14,
        r: 8 + Math.random() * 10,
        growth: 0.08 + Math.random() * 0.1,
        life: 0,
        maxLife: 220 + Math.random() * 120,
        alpha: 0.18 + Math.random() * 0.14,
        drift: (Math.random() - 0.5) * 0.014,
        phase: Math.random() * Math.PI * 2,
        wobbleAmp: 4 + Math.random() * 8,
        wobbleFreq: 0.6 + Math.random() * 0.9,
        rot: (Math.random() - 0.5) * 0.45,
        velocidadeRot: (Math.random() - 0.5) * 0.005,
        stretchX: 1.2 + Math.random() * 0.5,
        stretchY: 0.68 + Math.random() * 0.22,
        shade: 28 + Math.floor(Math.random() * 30)
      });
    }
  }

  // com som não aparece fumo novo
  estadoLava.smokes = estadoLava.smokes.filter(s => {
    s.life++;
    s.y += s.vy * 1.22;
    s.x += s.vx;
    s.r += s.growth;
    s.vx = (s.vx + s.drift) * 0.996;
    s.vy = (s.vy - 0.006) * 0.998;
    s.rot += s.velocidadeRot;
    return s.life < s.maxLife;
  });
  if (estadoLava.smokes.length > 560) {
    estadoLava.smokes.splice(0, estadoLava.smokes.length - 560);
  }

  estadoLava.crackSpawnCooldown = Math.max(0, estadoLava.crackSpawnCooldown - 1);
  const floorY = scene.floorY * H;
  const fissurasCrescendo = estadoLava.cracks.filter(c => c.reveal < c.maxReveal).length;

  // som forte, nova fissura no chão
  if (temSom && lvl > 0.3 && estadoLava.crackSpawnCooldown === 0
      && fissurasCrescendo < 2 && estadoLava.cracks.length < 8
      && Math.random() < (lvl - 0.3) * 0.07) {

    const margin = 14;
    const startX = margin + Math.random() * (W - margin * 2);
    const groundH = H - floorY;
    const startY = floorY + 6 + Math.random() * groundH * 0.6;

    const segs = 8 + Math.floor(Math.random() * 7);  // 8–14 fissuras
    const pts = [[startX, startY]];
    let cx = startX, cy = startY;
    const leanX = (Math.random() - 0.5) * 0.5;

    for (let i = 0; i < segs; i++) {
      const zigDir = i % 2 === 0 ? 1 : -1;
      const zigAmp = 5 + Math.random() * 10; // 5–15px por fissura
      const stepX  = leanX * 6 + zigDir * zigAmp + (Math.random() - 0.5) * 4;
      const stepY  = 5 + Math.random() * 9;

      cx = clamp(cx + stepX, margin, W - margin);
      cy = clamp(cy + stepY, floorY + 4, H - 8);
      pts.push([cx, cy]);
    }

    estadoLava.cracks.push({
      pts,
      reveal: 0,
      maxReveal: pts.length - 1,
      growSpeed: 0.04 + lvl * 0.06 + Math.random() * 0.03,
      w: 1.0 + lvl * 0.8  // espessura moderada
    });
    estadoLava.crackSpawnCooldown = 18 + Math.floor(Math.random() * 18);
  }

  estadoLava.cracks.forEach(c => {
    if (c.reveal < c.maxReveal) {
      c.reveal = Math.min(c.maxReveal, c.reveal + c.growSpeed);
    }
  });
}

// desenha a fissura progressivamente
function desenharFissura(ctx, pts, reveal) {
  if (!pts || pts.length < 2 || reveal <= 0) return false;
  const revelacaoLimitada = clamp(reveal, 0, pts.length - 1);
  const segmentosCompletos = Math.floor(revelacaoLimitada);
  const partial = revelacaoLimitada - segmentosCompletos;

  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);

  for (let i = 1; i <= segmentosCompletos; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }

  if (segmentosCompletos < pts.length - 1) {
    const a = pts[segmentosCompletos];
    const b = pts[segmentosCompletos + 1];
    ctx.lineTo(lerp(a[0], b[0], partial), lerp(a[1], b[1], partial));
  }

  return true;
}

// desenha uma partícula de fumo
function desenharFumo(ctx, s, t) {
  const progress = s.life / s.maxLife;
  const fadeIn = smoothstep(0, 0.1, progress);
  const fadeOut = 1 - smoothstep(0.58, 1, progress);
  const alpha = s.alpha * fadeIn * fadeOut;
  if (alpha <= 0.002) return;

  const wobble = Math.sin(t * s.wobbleFreq + s.phase) * s.wobbleAmp * (0.25 + progress * 0.95);
  const liftSway = Math.cos(t * (s.wobbleFreq * 0.7) + s.phase * 1.4) * s.wobbleAmp * 0.12;
  const puffW = s.r * (s.stretchX + progress * 0.55);
  const puffH = s.r * (s.stretchY + progress * 0.38);
  const coreShade = Math.min(118, s.shade + 34);

  ctx.save();
  ctx.translate(s.x + wobble, s.y + liftSway);
  ctx.rotate(s.rot + Math.sin(t * 0.55 + s.phase) * 0.08);

  const outerGlow = ctx.createRadialGradient(0, 0, s.r * 0.25, 0, 0, puffW * 1.15);
  outerGlow.addColorStop(0, `rgba(${coreShade},${coreShade - 8},${coreShade - 14},${alpha * 0.22})`);
  outerGlow.addColorStop(0.6, `rgba(${s.shade},${s.shade - 8},${s.shade - 12},${alpha * 0.14})`);
  outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.ellipse(0, 0, puffW * 1.05, puffH * 1.25, 0, 0, Math.PI * 2);
  ctx.fill();

  const bodyGradient = ctx.createRadialGradient(-puffW * 0.16, -puffH * 0.2, s.r * 0.1, 0, 0, puffW);
  bodyGradient.addColorStop(0, `rgba(${coreShade},${coreShade - 10},${coreShade - 18},${alpha * 0.38})`);
  bodyGradient.addColorStop(0.5, `rgba(${s.shade + 18},${s.shade + 6},${s.shade},${alpha * 0.24})`);
  bodyGradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, puffW, puffH, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(${s.shade + 28},${s.shade + 12},${s.shade + 4},${alpha * 0.14})`;
  ctx.beginPath();
  ctx.ellipse(-puffW * 0.28, puffH * 0.06, puffW * 0.52, puffH * 0.48, -0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(puffW * 0.24, -puffH * 0.1, puffW * 0.42, puffH * 0.4, 0.24, 0, Math.PI * 2);
  ctx.fill();

  const baseHeatAlpha = (1 - progress) * alpha * 0.16;
  if (baseHeatAlpha > 0.01) {
    const baseHeat = ctx.createRadialGradient(0, puffH * 0.45, s.r * 0.1, 0, puffH * 0.45, puffW * 0.7);
    baseHeat.addColorStop(0, `rgba(168,92,38,${baseHeatAlpha})`);
    baseHeat.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = baseHeat;
    ctx.beginPath();
    ctx.ellipse(0, puffH * 0.34, puffW * 0.7, puffH * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// redesenha lago, fumo por cima, fissuras
function desenharOverlayLava(ctx, scene, W, H, t) {
  const lkX = scene.lakeX * W;
  const lkY = scene.lakeYFrac * H + Math.sin(t * 0.6) * 3;
  const lkW = scene.lakeW * W;
  const lkH = scene.lakeH * H;

  // desenha fissuras primeiro
  estadoLava.cracks.forEach(c => {
    ctx.save();
    ctx.globalAlpha = 0.90;
    ctx.strokeStyle = '#ff5500';
    ctx.lineWidth = c.w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#ff7700';
    ctx.shadowBlur = 4;
    if (desenharFissura(ctx, c.pts, c.reveal)) ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.65;
    ctx.strokeStyle = '#ffcc66';
    ctx.lineWidth = Math.max(0.5, c.w * 0.32);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 0;
    if (desenharFissura(ctx, c.pts, c.reveal)) ctx.stroke();
    ctx.restore();
  });

  // depois desenha logo por cima
  const lavaFill = ctx.createRadialGradient(lkX, lkY - lkH * 0.2, lkW * 0.1, lkX, lkY, lkW);
  lavaFill.addColorStop(0,   '#ffcc00');
  lavaFill.addColorStop(0.3, '#ff8800');
  lavaFill.addColorStop(0.7, '#ff4400');
  lavaFill.addColorStop(1,   '#cc2200');
  ctx.fillStyle = lavaFill;
  ctx.beginPath();
  ctx.ellipse(lkX, lkY, lkW, lkH, 0, 0, Math.PI * 2);
  ctx.fill();


  // desenha fumo
  estadoLava.smokes.forEach(s => {
    desenharFumo(ctx, s, t);
  });

}
