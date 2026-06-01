const estadoMao = {
  running: false,
  videoStream: null,
  _rafId: null,
  _canvas: null,
  _ctx: null,
  _prevData: null,
  handX: 0.5,
  handY: 0.5,
  handXSmooth: 0.5,
  handYSmooth: 0.5,
  detected: false
};
// monta a cena
function construirCenaBaixaGrav(s, bx, W, H, rng, planet) {
s.horizonY = 0.52 + rng() * 0.06;
    s.bgPlanet = {
      x: 0.20 + rng()*0.60, y: 0.08 + rng()*0.18, r: 0.07 + rng()*0.06,
      ringTilt: 0.18 + rng()*0.22, ringW: 1.55 + rng()*0.4, hue: 200 + rng()*80
    };
    // monta os elementos do fundo
    function genRockProfile(count, wMin, wMax, hMin, hMax) {
      return Array.from({length: count}, () => {
        const x = rng(), w = wMin + rng()*(wMax-wMin), h = hMin + rng()*(hMax-hMin);
        const numPeaks = 2 + Math.floor(rng()*3), pts = [];
        for (let i = 0; i <= numPeaks*2; i++) {
          const fx = i/(numPeaks*2), isPeak = i%2===1;
          pts.push({ fx, ht: isPeak ? h*(0.65+rng()*0.35) : h*(0.08+rng()*0.22) });
        }
        return { x, w, h, pts };
      });
    }
    s.mtnFar  = genRockProfile(6 + Math.floor(rng()*4), 0.10, 0.26, 0.08, 0.20);
    s.mtnNear = genRockProfile(5 + Math.floor(rng()*3), 0.12, 0.32, 0.14, 0.26);
    s.floatRocks = Array.from({length: planet.gen.numRocks || 6}, () => ({
      x: (rng() * 1.3 - 0.15) * W, y: H*(0.08+rng()*0.56), r: 17+rng()*10, rot: rng()*Math.PI*2,
      phase: rng()*Math.PI*2, speed: 0.14+rng()*0.24, sides: Math.floor(5+rng()*4),
      followOffsetX: (rng() - 0.5) * W * 0.36,
      followOffsetY: (rng() - 0.5) * H * 0.24
    }));
    s.stars = Array.from({length: 130}, () => ({
      x: rng(), y: rng()*0.72, r: 0.4+rng()*1.5, phase: rng()*Math.PI*2, speed: 0.3+rng()*0.5
    }));


    const HZ = s.horizonY * H;

    // céu, montanhas, rochas, chão e planetazinho
    const skyG = bx.createLinearGradient(0, 0, 0, HZ);
    skyG.addColorStop(0, '#020008'); skyG.addColorStop(1, '#160528');
    bx.fillStyle = skyG; bx.fillRect(0, 0, W, HZ);


    // planetazinho
    const bp = s.bgPlanet, bpX = bp.x*W, bpY = bp.y*H, bpR = bp.r*Math.min(W,H);
    const bpG = bx.createRadialGradient(bpX-bpR*0.3, bpY-bpR*0.3, 0, bpX, bpY, bpR);
    bpG.addColorStop(0, `hsla(${bp.hue},60%,75%,0.9)`);
    bpG.addColorStop(1, `hsla(${bp.hue},50%,35%,0.85)`);
    bx.save(); bx.translate(bpX, bpY); bx.scale(1, bp.ringTilt);
    bx.strokeStyle = `hsla(${bp.hue},50%,70%,0.35)`; bx.lineWidth = bpR*0.22;
    bx.beginPath(); bx.arc(0, 0, bpR*bp.ringW, Math.PI, Math.PI*2); bx.stroke(); bx.restore();
    bx.fillStyle = bpG; bx.beginPath(); bx.arc(bpX, bpY, bpR, 0, Math.PI*2); bx.fill();
    bx.save(); bx.translate(bpX, bpY); bx.scale(1, bp.ringTilt);
    bx.strokeStyle = `hsla(${bp.hue},60%,85%,0.65)`; bx.lineWidth = bpR*0.20;
    bx.beginPath(); bx.arc(0, 0, bpR*bp.ringW, 0, Math.PI); bx.stroke(); bx.restore();


    function drawRockMtn(arr, col1, col2, col3, shadowF) {
      arr.forEach(m => {
        const mx = m.x*W, mw = m.w*W, mh = m.h*H;
        const peak = [mx, HZ - mh];
        bx.fillStyle = col1; bx.beginPath(); bx.moveTo(mx - mw*0.5, HZ);
        m.pts.forEach(p => bx.lineTo(mx - mw*0.5 + p.fx*mw, HZ - p.ht));
        bx.lineTo(mx + mw*0.5, HZ); bx.closePath(); bx.fill();
        bx.fillStyle = col2; bx.beginPath(); bx.moveTo(peak[0], peak[1]);
        bx.lineTo(mx + mw*shadowF, HZ); bx.lineTo(mx + mw*0.5, HZ); bx.closePath(); bx.fill();
        bx.fillStyle = col3; bx.beginPath(); bx.moveTo(peak[0], peak[1]);
        bx.lineTo(mx - mw*0.1, HZ); bx.lineTo(mx - mw*shadowF, HZ); bx.closePath(); bx.fill();
      });
    }
    drawRockMtn(s.mtnFar,  'rgba(95,58,148,0.60)', 'rgba(65,35,108,0.78)', 'rgba(42,20,72,0.90)', 0.18);
    drawRockMtn(s.mtnNear, 'rgba(68,36,112,0.90)', 'rgba(44,20,80,0.96)',  'rgba(26,10,50,1.00)', 0.35);

    // cor do chão
    const gnd = bx.createLinearGradient(0, HZ, 0, H);
    gnd.addColorStop(0, 'rgba(200,135,90,0.94)'); gnd.addColorStop(1, 'rgba(110,55,38,1)');
    bx.fillStyle = gnd; bx.fillRect(0, HZ, W, H-HZ);

}
// interação
function desenharCenaBaixaGrav(ctx, s, W, H, t) {
s.stars.forEach(st => {
      const alpha = (0.3+0.5*Math.sin(t*st.speed+st.phase))*0.85;
      ctx.globalAlpha = alpha; ctx.fillStyle = '#c8b0ff';
      ctx.beginPath(); ctx.arc(st.x*W, st.y*H, st.r, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1;
    });

    const rawDx = window._lgFingerDx || 0, rawDy = window._lgFingerDy || 0;
    const handCX = W*0.5+rawDx*W*0.45, handCY = H*0.25+rawDy*H*0.20;

    s.floatRocks.forEach(r => {
      if (r._cx===undefined) { r._cx=r.x; r._cy=r.y; }
      const pull = 0.028 + (r.r / 45) * 0.026;
      const blend = 0.68 + (r.r / 45) * 0.22;
      const overshootX = rawDx * W * (0.08 + r.r / 260);
      const overshootY = rawDy * H * (0.04 + r.r / 340);
      const restX = r.x+Math.sin(t*r.speed+r.phase)*16, restY = r.y+Math.cos(t*r.speed*0.8+r.phase)*10;
      const offsetDriftX = Math.sin(t * (r.speed * 0.7) + r.phase) * 18;
      const offsetDriftY = Math.cos(t * (r.speed * 0.6) + r.phase) * 12;
      const targetHandX = handCX + overshootX + r.followOffsetX + offsetDriftX;
      const targetHandY = handCY + overshootY + r.followOffsetY + offsetDriftY;
      const targX = restX+(targetHandX-restX)*blend, targY = restY+(targetHandY-restY)*blend;
      r._cx += (targX-r._cx)*pull; r._cy += (targY-r._cy)*pull;
      ctx.save(); ctx.translate(r._cx, r._cy); ctx.rotate(r.rot+t*0.12);
      const rg = ctx.createRadialGradient(-r.r*0.2, -r.r*0.25, 0, 0, 0, r.r);
      rg.addColorStop(0, 'rgba(125,92,155,0.95)'); rg.addColorStop(0.5, 'rgba(78,50,108,0.90)'); rg.addColorStop(1, 'rgba(34,20,55,0.76)');
      ctx.fillStyle = rg; ctx.shadowColor = 'rgba(0,0,0,0.50)'; ctx.shadowBlur = 20;
      ctx.beginPath();
      for (let i = 0; i < r.sides; i++) {
        const a = ((i/r.sides)*Math.PI*2)-Math.PI/2, rr = r.r*(0.78+Math.sin(a*2.3+r.phase)*0.22);
        i===0 ? ctx.moveTo(Math.cos(a)*rr, Math.sin(a)*rr) : ctx.lineTo(Math.cos(a)*rr, Math.sin(a)*rr);
      }
      ctx.closePath(); ctx.fill(); ctx.restore();
    });
}

async function iniciarRastreioMao() {
  if (estadoMao.running) return;

  // liga a câmara
  let stream = null;
  try {
    stream = await new Promise((res, rej) => getStreamCamera(res, rej));
  } catch(e) { stream = null; }

  if (stream) {
    estadoMao.videoStream = stream;

    let video = document.getElementById('lg-hand-video');
    if (!video) {
      video = document.createElement('video');
      video.id = 'lg-hand-video';
      video.playsInline = true;
      video.muted = true;
      video.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;top:0;left:0;';
      document.body.appendChild(video);
    }
    video.srcObject = stream;
    await new Promise(res => {
      if (video.readyState >= 2) { res(); return; }
      video.onloadedmetadata = () => { video.play().catch(()=>{}); res(); };
    });
    await new Promise(res => setTimeout(res, 200));

    const W = 80, H = 60;
    estadoMao._canvas = document.createElement('canvas');
    estadoMao._canvas.width = W;
    estadoMao._canvas.height = H;
    estadoMao._ctx = estadoMao._canvas.getContext('2d', { willReadFrequently: true });
    estadoMao._prevData = null;
    estadoMao.running = true;

    function motionLoop() {
      if (!estadoMao.running) return;
      estadoMao._rafId = requestAnimationFrame(motionLoop);

      const video2 = document.getElementById('lg-hand-video');
      if (!video2 || video2.readyState < 2) return;

      const ctx2 = estadoMao._ctx;
      // vista cam horizontal
      ctx2.save();
      ctx2.translate(W, 0);
      ctx2.scale(-1, 1);
      ctx2.drawImage(video2, 0, 0, W, H);
      ctx2.restore();

      const frame = ctx2.getImageData(0, 0, W, H).data;

      if (!estadoMao._prevData) {
        estadoMao._prevData = new Uint8ClampedArray(frame);
        return;
      }

      // encontra o pixel mais brilhante
      let sumX = 0, sumY = 0, count = 0;
      for (let py = 0; py < H; py++) {
        for (let px2 = 0; px2 < W; px2++) {
          const i = (py * W + px2) * 4;
          const r = frame[i], g = frame[i+1], b = frame[i+2];
          const pr = estadoMao._prevData[i], pg = estadoMao._prevData[i+1], pb = estadoMao._prevData[i+2];
          const diff = Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb);
          const bright = (r + g + b) / 3;
          if (diff > 30 && bright > 80) {
            const w = diff * (bright / 255);
            sumX += px2 * w;
            sumY += py * w;
            count += w;
          }
        }
      }
      estadoMao._prevData = new Uint8ClampedArray(frame);

      if (count > 800) {
        estadoMao.handX = sumX / count / W;
        estadoMao.handY = sumY / count / H;
        estadoMao.detected = true;
      } else {
        estadoMao.detected = false;
      }

      // Mantém a última posição válida para as rochas seguirem sempre o utilizador.
      if (estadoMao.detected) {
        estadoMao.handXSmooth += (estadoMao.handX - estadoMao.handXSmooth) * 0.22;
        estadoMao.handYSmooth += (estadoMao.handY - estadoMao.handYSmooth) * 0.22;
      }

      // atualiza a última posição conhecida; a cena continua a segui-la mesmo sem deteção momentânea
      window._lgFingerDx     = (estadoMao.handXSmooth - 0.5) * 2;
      window._lgFingerDy     = (estadoMao.handYSmooth - 0.5) * 2;
      window._lgHandDetected = true;
    }

    motionLoop();

  }
}

function pararRastreioMao() {
  estadoMao.running = false;
  window._lgFingerDx = 0;
  window._lgFingerDy = 0;
  window._lgHandDetected = false;
  if (estadoMao._mouseFallback) {
    window.removeEventListener('pointermove', estadoMao._mouseFallback);
    estadoMao._mouseFallback = null;
  }
  if (estadoMao._rafId) { cancelAnimationFrame(estadoMao._rafId); estadoMao._rafId = null; }
  estadoMao.videoStream = null;
  estadoMao._prevData = null;
  estadoMao.detected = false;
  const v = document.getElementById('lg-hand-video');
  if (v) { v.srcObject = null; }
}
