const estadoOceano = {
  headTilt: 0,
  headTiltSmooth: 0,
  videoStream: null,
  faceMesh: null,
  cameraRunning: false,
  _rafId: null,
  bigWaves: [],
  _tiltPrev: 0,
  _bigWaveCooldown: 0,
  _heldTiltEnergy: 0,
};

// desenha fundo da cena
function construirCenaOceano(s, bx, W, H, rng) {
  // escolhe tons para o céu
  s.skyHue = Math.floor(rng() * 3);
    s.horizonGlowX = 0.2 + rng() * 0.6;
    // estrelas
    s.stars = Array.from({length: 60}, () => ({
      x: rng(), y: rng()*0.38, r: 0.5+rng()*1.2, phase: rng()*Math.PI*2, speed: 0.4+rng()*0.5
    }));
    // camadas de ondas
    s.waves = Array.from({length: 18}, (_, i) => {
      // paletas RGB para cada variante de céu
      const deep   = s.skyHue===1 ? [15,90,110]  : s.skyHue===2 ? [25,45,70]  : [18,55,130];
      const mid    = s.skyHue===1 ? [20,130,150] : s.skyHue===2 ? [35,65,100] : [22,88,165];
      const bright = s.skyHue===1 ? [50,190,210] : s.skyHue===2 ? [55,95,135] : [55,155,210];
      return { y: H*(0.36+i*0.035), amp: 6+rng()*30, freq: 0.003+rng()*0.008,
               speed: 0.35+rng()*0.55, phase: rng()*Math.PI*2,
               color: i<6 ? deep : i<12 ? mid : bright };
    });
    // espuma (bolhas brancas)
    s.foam = Array.from({length: 35}, () => ({
      x: rng()*W, y: H*(0.38+rng()*0.42), r: 2+rng()*10, phase: rng()*Math.PI*2, speed: 0.25+rng()*0.45
    }));


    const skyPalettes = [
      { top:'#020510', mid:'#04102a', horizon:'#0a2248', atmLight:'rgba(30,80,180,0.18)' },
      { top:'#010c10', mid:'#042028', horizon:'#083848', atmLight:'rgba(20,120,150,0.20)' },
      { top:'#040810', mid:'#0a1020', horizon:'#142038', atmLight:'rgba(60,90,140,0.16)' },
    ];
    const P = skyPalettes[s.skyHue];
    // gradiente no céu
    const sky = bx.createLinearGradient(0, 0, 0, H*0.5);
    sky.addColorStop(0, P.top); sky.addColorStop(0.4, P.mid); sky.addColorStop(1, P.horizon);
    bx.fillStyle = sky; bx.fillRect(0, 0, W, H*0.5);

    // brilho no horizonte
    const hgX = s.horizonGlowX * W, hgY = H*0.36;
    const hg = bx.createRadialGradient(hgX, hgY, 0, hgX, hgY, W*0.45);
    hg.addColorStop(0, P.atmLight); hg.addColorStop(1, 'rgba(0,0,0,0)');
    bx.fillStyle = hg; bx.beginPath(); bx.ellipse(hgX, hgY, W*0.45, H*0.18, 0, 0, Math.PI*2); bx.fill();

    // desenhar as camadas de onda
    s.waves.forEach((w, i) => {
      const [r2,g2,b2] = w.color;
      bx.fillStyle = `rgba(${r2},${g2},${b2},${0.82-i*0.02})`;
      bx.fillRect(0, w.y, W, H - w.y);
    });

    // vinheta
    const vig = bx.createRadialGradient(W*0.5, H*0.5, H*0.18, W*0.5, H*0.5, H*0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,4,12,0.55)');
    bx.fillStyle = vig; bx.fillRect(0, 0, W, H);
}


function desenharCenaOceano(ctx, s, W, H, t) {
  // estrelas
  s.stars.forEach(st => {
      const alpha = (0.4+Math.sin(t*st.speed+st.phase)*0.35)*(1-st.y*2.0);
      if (alpha <= 0) return;
      ctx.fillStyle = `rgba(200,220,255,${alpha})`;
      ctx.beginPath(); ctx.arc(st.x*W, st.y*H, st.r, 0, Math.PI*2); ctx.fill();
    });

    ctx.save(); ctx.strokeStyle = 'rgba(160,210,240,0.18)'; ctx.lineWidth = 0.8;

    // inclinação suavizada da cabeça
    const tilt = estadoOceano.headTiltSmooth;
    // limite de inclinação
    const LIMIAR_TILT = 0.28;
    const intensidadeInclinacao = Math.min(1, Math.abs(tilt) / LIMIAR_TILT);
    const intensidadeOndas = 1 - intensidadeInclinacao;
    // ondas intensas por defeito; inclinar a cabeça acalma o mar
    if (intensidadeOndas > 0.02) {
      estadoOceano._heldTiltEnergy = Math.min(1, estadoOceano._heldTiltEnergy + intensidadeOndas * 0.016);
    } else {
      estadoOceano._heldTiltEnergy = Math.max(0, estadoOceano._heldTiltEnergy - 0.045);
    }
    estadoOceano._bigWaveCooldown -= 0.016;
    if (intensidadeOndas > 0.05 && estadoOceano._bigWaveCooldown <= 0) {
      const dir = Math.sin(t * 0.35 + estadoOceano.bigWaves.length) > 0 ? -1 : 1;
      const strength = Math.min(1, intensidadeOndas * 0.65 + estadoOceano._heldTiltEnergy * 0.75);
      const wWidth = 0.20+strength*0.14;
      tocarOnda();
      estadoOceano.bigWaves.push({ dir, progress: -wWidth, amp: 60+strength*85, speed: 0.50+strength*0.32, width: wWidth, fade: 1 });
      estadoOceano._bigWaveCooldown = Math.max(0.72, 1.35 - strength * 0.45);
    }
    estadoOceano.bigWaves.forEach(bw => {
      bw.progress += bw.speed * 0.016;
      const fadeStart = 0.72 + bw.width * 0.3;
      const fadeOut = clamp((1 + bw.width * 0.85 - bw.progress) / Math.max(0.001, 1 + bw.width * 0.85 - fadeStart), 0, 1);
      const fadeIn = clamp((bw.progress + bw.width) / Math.max(0.001, bw.width * 0.9), 0, 1);
      bw.fade = Math.sin(Math.min(fadeIn, fadeOut) * Math.PI * 0.5);
    });
    estadoOceano.bigWaves = estadoOceano.bigWaves.filter(bw => bw.progress < 1 + bw.width * 0.85 && bw.fade > 0.01);


    // pico suave no centro da onda
    function bigWaveShape(dist, halfW, amp, dir) {
      const frontDist = dir===-1 ? -dist : dist;
      const sech2 = x => { const e=Math.exp(x), em=Math.exp(-x), c=e+em; return 4/(c*c); };
      const normDist = frontDist>0 ? dist/(halfW*0.75) : dist/(halfW*1.4);
      const crest = sech2(normDist*1.8)*amp;
      const trailDist = frontDist<0 ? -frontDist/halfW : 0;
      const trail = trailDist>0.3 ? -Math.sin((trailDist-0.3)*Math.PI*1.4)*amp*0.18*Math.exp(-trailDist*1.2) : 0;
      const leadDist = frontDist>0 ? frontDist/halfW : 0;
      const lead = leadDist>0.4&&leadDist<1.8 ? Math.sin((leadDist-0.4)*Math.PI*0.9)*amp*0.08*Math.exp(-leadDist*0.9) : 0;
      return -(crest+trail+lead);
    }
    const tiltAmpBoost = 0.42 + intensidadeOndas * 0.95;
    const tiltShift = tilt * 50;

    s.waves.forEach((w, i) => {
      const wy = w.y+Math.sin(t*w.speed+w.phase)*w.amp*tiltAmpBoost;
      const [r2,g2,b2] = w.color;
      const depthFactor = 1-i/s.waves.length*0.55;
      let topOffset = 0;
      estadoOceano.bigWaves.forEach(bw => {
        const center = bw.dir===-1 ? (1-bw.progress)*W : bw.progress*W;
        topOffset = Math.min(topOffset, bigWaveShape(W*0.5-center, bw.width*W, bw.amp*bw.fade*depthFactor, bw.dir));
      });
      // gradiente vertical da onda
      const wg = ctx.createLinearGradient(0, wy+topOffset-w.amp, 0, wy+w.amp*0.5);
      wg.addColorStop(0, `rgba(${Math.min(255,r2+30)},${Math.min(255,g2+35)},${Math.min(255,b2+30)},${0.60-i*0.015})`);
      wg.addColorStop(1, `rgba(${r2},${g2},${b2},${0.82-i*0.02})`);
      ctx.fillStyle = wg; ctx.beginPath(); ctx.moveTo(0, wy);
      // pontos da curva da onda
      for (let x2 = 0; x2 <= W; x2 += 6) {
        const yw_base = wy+Math.sin((x2+tiltShift)*w.freq+t*w.speed+w.phase)*w.amp*0.6*tiltAmpBoost
            +Math.cos((x2+tiltShift)*w.freq*0.7+t*w.speed*1.3)*w.amp*0.3*tiltAmpBoost;
        let bwY = 0;
        estadoOceano.bigWaves.forEach(bw => {
          const center = bw.dir===-1 ? (1-bw.progress)*W : bw.progress*W;
          bwY += bigWaveShape(x2-center, bw.width*W, bw.amp*bw.fade*depthFactor, bw.dir);
        });
        ctx.lineTo(x2, yw_base+bwY);
      }
      ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
    });

    // espuma branca no topo de cada onda grande
    estadoOceano.bigWaves.forEach(bw => {
      const center = bw.dir===-1 ? (1-bw.progress)*W : bw.progress*W;
      const halfW = bw.width*W, baseY = s.waves[0].y;
      if (center < -halfW || center > W+halfW) return;
      const sech2 = x => { const e=Math.exp(x), em=Math.exp(-x), c=e+em; return 4/(c*c); };
      ctx.save();
      for (let x2 = Math.max(0,center-halfW*2); x2 < Math.min(W,center+halfW*2); x2+=5) {
        const dist=x2-center, shape=sech2((dist/(halfW*0.7))*1.8);
        const foamY = baseY+bigWaveShape(dist, halfW, bw.amp*bw.fade, bw.dir)*0.92;
        ctx.fillStyle = `rgba(220,240,255,${shape*0.50*bw.fade})`;
        ctx.beginPath(); ctx.arc(x2, foamY, 2+shape*6, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    });

    // espuma de fundo
    s.foam.forEach(f => {
      const fx = f.x+Math.sin(t*f.speed+f.phase)*22, fy = f.y+Math.cos(t*f.speed*0.8+f.phase)*8;
      ctx.fillStyle = `rgba(220,240,255,${0.10+Math.sin(t+f.phase)*0.07})`;
      ctx.beginPath(); ctx.arc(fx, fy, f.r, 0, Math.PI*2); ctx.fill();
    });


}

// liga a câmara
async function iniciarCameraOceano() {
  if (estadoOceano.cameraRunning) return;

  // liga a câmara
  const stream = await new Promise((res, rej) => getStreamCamera(res, rej));

  estadoOceano.videoStream = stream;
  const video = document.getElementById('webcam');
  video.srcObject = stream;
  video.style.display = 'none';

  await new Promise(resolve => {
    video.onloadedmetadata = () => { video.play(); resolve(); };
  });

  // carrega o script do FaceMesh se ainda não estiver disponível
  if (!window.FaceMesh) {
    await new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js';
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }

  // detetar pontos faciais
  const faceMesh = new window.FaceMesh({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  // extrai inclinação da cabeça
  faceMesh.onResults(results => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      estadoOceano.headTilt *= 0.92;
      return;
    }
    const lm = results.multiFaceLandmarks[0];
    // pontos de referência nos lados da cara
    const leftEar  = lm[234];
    const rightEar = lm[454];
    const nose = lm[1];

    // inclinação lateral
    const rawRoll = clamp((leftEar.y - rightEar.y) / 0.10, -1, 1);

    // deslocamento do nariz em relação ao centro da cara
    const faceCenterX = (leftEar.x + rightEar.x) * 0.5;
    const rawYaw = clamp((nose.x - faceCenterX) / 0.075, -1, 1);
    const directionalTilt = clamp(rawYaw * 0.72 + rawRoll * 0.28, -1, 1);
    estadoOceano.headTilt = directionalTilt;
  });

  estadoOceano.faceMesh = faceMesh;
  estadoOceano.cameraRunning = true;

  // envia cada fotograma de vídeo para o FaceMesh
  async function loopDetecao() {
    if (!estadoOceano.cameraRunning) return;
    if (video.readyState >= 2) {
      await faceMesh.send({ image: video });
    }
    estadoOceano.headTiltSmooth += (estadoOceano.headTilt - estadoOceano.headTiltSmooth) * 0.08;
    estadoOceano._rafId = requestAnimationFrame(loopDetecao);
  }
  estadoOceano._rafId = requestAnimationFrame(loopDetecao);

}

function pararCameraOceano() {
  estadoOceano.cameraRunning = false;
  if (estadoOceano._rafId) {
    cancelAnimationFrame(estadoOceano._rafId);
    estadoOceano._rafId = null;
  }
  if (estadoOceano.faceMesh) {
    estadoOceano.faceMesh.close();
    estadoOceano.faceMesh = null;
  }

  estadoOceano.videoStream = null;
  const video = document.getElementById('webcam');
  if (video) { video.srcObject = null; }
  estadoOceano.headTilt = 0;
  estadoOceano.headTiltSmooth = 0;
  estadoOceano.bigWaves = [];
  estadoOceano._bigWaveCooldown = 0;
  estadoOceano._heldTiltEnergy = 0;
}
