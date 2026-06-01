const estadoDeserto = {
  fingerX: 0.5,
  fingerY: 0.5,
  fingerHistory: [],   // histórico de posições do dedo para avaliar movimento
  pontuacaoCirculo: 0,
  whirlIntensity: 0,
  whirlX: 0.5,
  whirlY: 0.8,
  whirlParticles: [], // partículas para os tornados
  active: false,
};

// desenho da cena
function construirCenaDeserto(s, bx, W, H, rng) {
s.horizonY = 0.48 + rng()*0.05;
    // posição e raio do sol
  s.sunX = 0.38 + rng()*0.24; s.sunY = 0.10 + rng()*0.12; s.sunR = 0.055 + rng()*0.03;
    // estrelas
  s.stars = Array.from({length: 10}, () => ({ x: rng(), y: rng()*0.28, r: 0.5+rng()*1.2, phase: rng()*Math.PI*2 }));
    // pirâmides
  s.mesas = Array.from({length: 6 + Math.floor(rng()*4)}, () => {
      const layer = rng();
      return { cx: rng(), topY: (0.12+rng()*0.20)-layer*0.06, flatW: 0.02+rng()*0.08+layer*0.04, slopeW: 0.06+rng()*0.14+layer*0.08, layer, shadow: rng()>0.5 };
    }).sort((a,b) => a.layer - b.layer);
    // ondulações de areia
  s.sandRipples = Array.from({length: 8}, (_, i) => ({
      y: s.horizonY+0.05+i*0.065, amp: 2+rng()*4, freq: 0.006+rng()*0.006,
      phase: rng()*Math.PI*2, speed: 0.03+rng()*0.04, alpha: 0.06+rng()*0.08
    }));
    const numPlants = 5 + Math.floor(rng()*5);
    s.plants = Array.from({length: numPlants}, (_, i) => ({
      x: 0.03+(i/(numPlants-1))*0.94, y: s.horizonY+0.01+rng()*0.09,
      scale: 0.4+rng()*0.9, phase: rng()*Math.PI*2, dark: rng()>0.45
    }));


  // cores
    const C = {
      skyTop:'#b85c08', skyMid:'#d8800a', skyHorizon:'#f0b828',
      mesaFar1:'#a05018', mesaFar2:'#7a3a0c', mesaNear1:'#c06820', mesaNear2:'#8a4010', mesaShadow:'#5a2808',
      sandBright:'#e8b830', sandMid:'#cc9420', sandDark:'#a87018', sandDeep:'#7a4e10',
    };
    const horizY = s.horizonY * H;

    // céu
  const skyG = bx.createLinearGradient(0, 0, 0, H);
    skyG.addColorStop(0, C.skyTop); skyG.addColorStop(0.38, C.skyMid);
    skyG.addColorStop(horizY/H, C.skyHorizon); skyG.addColorStop(1, C.skyHorizon);
    bx.fillStyle = skyG; bx.fillRect(0, 0, W, H);

    // sol
    const sunX = s.sunX*W, sunY = s.sunY*H, sunR = s.sunR*Math.min(W,H);
    const sunGlow = bx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR*6);
    sunGlow.addColorStop(0, 'rgba(255,252,200,0.38)'); sunGlow.addColorStop(0.3, 'rgba(255,230,100,0.16)');
    sunGlow.addColorStop(0.65, 'rgba(255,200,50,0.05)'); sunGlow.addColorStop(1, 'rgba(0,0,0,0)');
    bx.fillStyle = sunGlow; bx.beginPath(); bx.arc(sunX, sunY, sunR*6, 0, Math.PI*2); bx.fill();
    const sunCore = bx.createRadialGradient(sunX-sunR*0.2, sunY-sunR*0.2, 0, sunX, sunY, sunR);
    sunCore.addColorStop(0, '#fffef0'); sunCore.addColorStop(0.6, '#fff4a0'); sunCore.addColorStop(1, '#ffe060');
    bx.fillStyle = sunCore; bx.beginPath(); bx.arc(sunX, sunY, sunR, 0, Math.PI*2); bx.fill();

    // desenha montanhas
  s.mesas.forEach(m => {
      const proximidade = m.layer;
      const mcx = m.cx*W, mTopY = (s.horizonY - m.topY)*H;
      const flatHW = m.flatW*W*0.5, totalHW = (m.flatW+m.slopeW)*W*0.5;
      const faceCol   = proximidade < 0.5 ? C.mesaFar1 : C.mesaNear1;
      const shadowCol = proximidade < 0.5 ? C.mesaFar2 : C.mesaNear2;
      bx.fillStyle = faceCol;
      bx.beginPath(); bx.moveTo(mcx-totalHW, horizY); bx.lineTo(mcx-flatHW, mTopY);
      bx.lineTo(mcx+flatHW, mTopY); bx.lineTo(mcx+totalHW, horizY); bx.closePath(); bx.fill();
      const shadowW = totalHW*0.38;
      bx.fillStyle = shadowCol;
      bx.beginPath(); bx.moveTo(mcx+flatHW, mTopY); bx.lineTo(mcx+totalHW, horizY);
      bx.lineTo(mcx+totalHW-shadowW, horizY); bx.closePath(); bx.fill();
    });

    // chão
  const groundG = bx.createLinearGradient(0, horizY, 0, H);
    groundG.addColorStop(0, C.sandBright); groundG.addColorStop(0.15, C.sandMid);
    groundG.addColorStop(0.5, C.sandDark); groundG.addColorStop(1, C.sandDeep);
    bx.fillStyle = groundG; bx.fillRect(0, horizY, W, H-horizY);
    // faixa brilhante no horizonte — borda de areia iluminada pelo sol
  const edgeG = bx.createLinearGradient(0, horizY, 0, horizY+H*0.04);
    edgeG.addColorStop(0, '#f8d060'); edgeG.addColorStop(1, C.sandBright);
    bx.fillStyle = edgeG; bx.fillRect(0, horizY, W, H*0.04);



    // catos
    s.plants.forEach(p => {
      const cx2 = p.x*W, groundY = p.y*H, sc = p.scale;
      const trunkH = 55+sc*75, trunkW = 9+sc*8, hw = trunkW*0.5;
      const cMid = '#2e5818', cDark = '#1e3c0e', cLight = '#4a7a28';

      function drawSeg(x, topY, botY, w) {
        const shw = w*0.5;
        bx.fillStyle = cMid; bx.beginPath();
        bx.moveTo(x-shw, botY); bx.lineTo(x-shw, topY+shw*0.8);
        bx.quadraticCurveTo(x-shw, topY-shw*0.3, x, topY-shw*0.5);
        bx.quadraticCurveTo(x+shw, topY-shw*0.3, x+shw, topY+shw*0.8);
        bx.lineTo(x+shw, botY); bx.closePath(); bx.fill();
        bx.fillStyle = cDark; bx.beginPath();
        bx.moveTo(x-shw, botY); bx.lineTo(x-shw, topY+shw*0.8);
        bx.quadraticCurveTo(x-shw, topY-shw*0.3, x-shw*0.2, topY-shw*0.1);
        bx.lineTo(x-shw*0.2, botY); bx.closePath(); bx.fill();
        bx.fillStyle = cLight; bx.beginPath();
        bx.moveTo(x+shw*0.2, botY); bx.lineTo(x+shw*0.2, topY+shw*0.9);
        bx.lineTo(x+shw*0.7, topY+shw*1.1); bx.lineTo(x+shw*0.7, botY); bx.closePath(); bx.fill();
      }
      function drawHoriz(x1, x2, midY, h) {
        const hh = h*0.5;
        bx.fillStyle = cMid; bx.fillRect(Math.min(x1,x2), midY-hh, Math.abs(x2-x1), h);
        bx.fillStyle = cDark; bx.fillRect(Math.min(x1,x2), midY-hh, Math.abs(x2-x1), h*0.35);
        bx.fillStyle = cLight; bx.fillRect(Math.min(x1,x2), midY+hh*0.1, Math.abs(x2-x1), h*0.3);
      }
      const numArms = Math.floor(sc*1.6+0.3), armW = trunkW*0.72, armHW = armW*0.5;
      if (numArms >= 2) {
        const armBaseY = groundY - trunkH*(0.42+Math.sin(p.phase)*0.06);
        const armH2 = trunkH*(0.30+Math.cos(p.phase*1.1)*0.06);
        const stubEnd = cx2 - hw, armX = stubEnd - trunkW*2.0 - sc*6;
        drawHoriz(stubEnd, armX, armBaseY, armW);
        drawSeg(armX, armBaseY-armH2, armBaseY+armHW*0.5, armW);
      }
      drawSeg(cx2, groundY-trunkH, groundY, trunkW);
      if (numArms >= 1) {
        const armBaseY = groundY - trunkH*(0.50+Math.cos(p.phase)*0.07);
        const armH1 = trunkH*(0.32+Math.sin(p.phase*0.9)*0.07);
        const stubEnd = cx2 + hw, armX = stubEnd + trunkW*1.8 + sc*5;
        drawHoriz(stubEnd, armX, armBaseY, armW);
        drawSeg(armX, armBaseY-armH1, armBaseY+armHW*0.5, armW);
      }
    });

    const vig = bx.createRadialGradient(W*0.5, H*0.5, H*0.2, W*0.5, H*0.5, H*0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(20,8,0,0.48)');
    bx.fillStyle = vig; bx.fillRect(0, 0, W, H);
}

// parte animada - estrelas
function desenharCenaDeserto(ctx, s, W, H, t) {
const horizY = s.horizonY * H;

    // estrelas piscam suave
  s.stars.forEach(st => {
      const twink = 0.25+0.25*Math.sin(t*1.3+st.phase);
      ctx.globalAlpha = twink; ctx.fillStyle = '#fff8e0';
      ctx.beginPath(); ctx.arc(st.x*W, st.y*horizY, st.r, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1;
    });

    // areia a mexer
  s.sandRipples.forEach(r => {
      const ry = r.y*H, rAlpha = r.alpha*(0.55+0.45*Math.sin(t*r.speed+r.phase));
      ctx.save(); ctx.globalAlpha = rAlpha; ctx.strokeStyle = '#c08818'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let rx2 = 0; rx2 <= W; rx2 += 14) {
        const yw = ry+Math.sin(rx2*r.freq+t*r.speed+r.phase)*r.amp;
        rx2===0 ? ctx.moveTo(rx2, yw) : ctx.lineTo(rx2, yw);
      }
      ctx.stroke(); ctx.restore();
    });

    const mirG = ctx.createLinearGradient(0, horizY-6, 0, horizY+H*0.05);
    mirG.addColorStop(0, `rgba(248,220,100,${0.10+Math.sin(t*0.8)*0.04})`);
    mirG.addColorStop(0.5, `rgba(200,240,255,${0.04+Math.sin(t*1.2)*0.02})`);
    mirG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mirG; ctx.fillRect(0, horizY-6, W, H*0.07);
}

// analisa o movimento circular do dedo
function tickDeserto(now) {
  if (!estadoDeserto.active) return;

  const video  = estadoCamera.videoEl;
  const sCtx   = estadoCamera.sampleCtx;
  const canvas = estadoCamera.sampleCanvas;
  if (!video || !sCtx || !canvas || !estadoCamera.ready || video.readyState < 2) return;

  if (now - (estadoDeserto._lastSample || 0) < 60) return;
  estadoDeserto._lastSample = now;

  const W = canvas.width, H = canvas.height;

  sCtx.drawImage(video, 0, 0, W, H); // copia o fotograma atual
  let frame;
  try { frame = sCtx.getImageData(0, 0, W, H).data; } catch(_) { return; }

  // converte RGB para preto e branco - mais rápido para comparar entre fotogramas
  const gray = new Uint8Array(W * H);
  for (let i = 0, p = 0; i < frame.length; i += 4, p++) {
    gray[p] = (frame[i] * 77 + frame[i+1] * 150 + frame[i+2] * 29) >> 8;
  }

  if (!estadoDeserto._prevGray) { // primeiro fotograma - guarda como referência
    estadoDeserto._prevGray = gray;
    return;
  }

  const prev = estadoDeserto._prevGray;
  let sumX = 0, sumY = 0, totalMotion = 0;
  const THRESHOLD = 18; // filtra ruído
  for (let p = 0; p < W * H; p++) {
    const diff = Math.abs(gray[p] - prev[p]);
    if (diff < THRESHOLD) continue;
    const weight = diff - THRESHOLD; // quanto mais diff acima do limite, mais peso
    sumX += (p % W) * weight;
    sumY += ((p / W) | 0) * weight;
    totalMotion += weight;
  }
  estadoDeserto._prevGray = gray;

  const movimentoNorm = Math.min(1, totalMotion / (W * H * 8));
  estadoDeserto._motionSmooth = lerp(estadoDeserto._motionSmooth || 0, movimentoNorm, 0.4);

  if (totalMotion > W * H * 0.3) { // deteta posição acima dos 30% dos píxeis com movimento
    const rawX = sumX / totalMotion / W;
    const rawY = sumY / totalMotion / H;
    const fx = 1 - rawX; // espelha a cam
    const fy = rawY;

    estadoDeserto.fingerX = lerp(estadoDeserto.fingerX || 0.5, fx, 0.4);
    estadoDeserto.fingerY = lerp(estadoDeserto.fingerY || 0.5, fy, 0.4);
    estadoDeserto.fingerHistory.push({
      x: estadoDeserto.fingerX,
      y: estadoDeserto.fingerY,
      t: now
    });
    while (estadoDeserto.fingerHistory.length > 60) estadoDeserto.fingerHistory.shift();
    while (estadoDeserto.fingerHistory.length > 0 && now - estadoDeserto.fingerHistory[0].t > 3000) {
      estadoDeserto.fingerHistory.shift();
    }
  } else {

    while (estadoDeserto.fingerHistory.length > 0 && now - estadoDeserto.fingerHistory[0].t > 5000) {
      estadoDeserto.fingerHistory.shift();
    }
  }

  const hist = estadoDeserto.fingerHistory;
  let pontuacaoCirculo = 0;

  if (hist.length >= 12) { // precisa de 12 pontos para avaliar o movimento circular
    let cx = 0, cy = 0;
    hist.forEach(p => { cx += p.x; cy += p.y; });
    cx /= hist.length; // calcula o centro médio do círculo
    cy /= hist.length;

    let avgR = 0;
    hist.forEach(p => { avgR += Math.hypot(p.x - cx, p.y - cy); });
    avgR /= hist.length; // raio médio dos pontos do centro do círculo

    if (avgR > 0.06) {
      const angles = hist.map(p => Math.atan2(p.y - cy, p.x - cx));
      angles.sort((a, b) => a - b);

      let maxGap = 0;
      for (let i = 1; i < angles.length; i++) {
        maxGap = Math.max(maxGap, angles[i] - angles[i-1]);
      }
      const wrapGap = (angles[0] + Math.PI * 2) - angles[angles.length - 1];
      maxGap = Math.max(maxGap, wrapGap);
      const cobertura = Math.max(0, 1 - maxGap / (Math.PI * 2));

      let varR = 0;
      hist.forEach(p => {
        const d = Math.hypot(p.x - cx, p.y - cy) - avgR;
        varR += d * d;
      });
      varR = Math.sqrt(varR / hist.length);
      const consistencia = Math.max(0, 1 - (varR / Math.max(avgR * 0.5, 0.01)));

      let progressaoAngular = 0;
      if (hist.length >= 8) {
        let cwCount = 0, ccwCount = 0;
        for (let i = 1; i < hist.length; i++) {
          const da = Math.atan2(hist[i].y - cy, hist[i].x - cx)
              - Math.atan2(hist[i-1].y - cy, hist[i-1].x - cx);
          const daNorm = ((da + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
          if (daNorm > 0.02) cwCount++; // movimento no sentido horário
          else if (daNorm < -0.02) ccwCount++; // movimento no sentido anti-horário
        }
        const dominante = Math.max(cwCount, ccwCount);
        const total = cwCount + ccwCount;
        progressaoAngular = total > 4 ? dominante / total : 0;
      }
    pontuacaoCirculo = cobertura * 0.4 + consistencia * 0.3 + progressaoAngular * 0.3;
    }
  }

  const taxaLerp = pontuacaoCirculo > (estadoDeserto.pontuacaoCirculo || 0) ? 0.25 : 0.015; // sobe rápido (0.25), desce devagar (0.015)
  estadoDeserto.pontuacaoCirculo = lerp(estadoDeserto.pontuacaoCirculo || 0, pontuacaoCirculo, taxaLerp);

  // círculos acima de 22% fazem dissipar a temprestade
  const progressoCalma = estadoDeserto.pontuacaoCirculo > 0.22
      ? clamp((estadoDeserto.pontuacaoCirculo - 0.22) / 0.78, 0, 1)
      : 0;
  const intensidadeAlvo = 1 - progressoCalma; // inicio já com tempestade forte e o gesto circular faz diminuir a tempestade
  const intensidadeAtual = estadoDeserto.whirlIntensity ?? 1;
  const intLerp = intensidadeAlvo < intensidadeAtual ? 0.085 : 0.018; // dissipa rápido, volta devagar se o gesto parar
  estadoDeserto.whirlIntensity = lerp(intensidadeAtual, intensidadeAlvo, intLerp);

  const desertAmbience = SONS.deserto;
  if (desertAmbience && estadoInterior.active && estadoInterior.planet?.space.pattern === 'desert') {
    desertAmbience.volume = Math.max(0.04, Math.min(0.92, estadoDeserto.whirlIntensity * 0.92));
  }

  if (hist.length > 0) {
    const mediaHistX = hist.reduce((s, p) => s + p.x, 0) / hist.length;
    estadoDeserto.whirlX = lerp(estadoDeserto.whirlX || 0.5, clamp(mediaHistX, 0.15, 0.85), 0.03);
  }
  estadoDeserto.whirlY = 0.75; // base dos tornados sempre a 75% da altura do ecrã
}

function iniciarParticulasTornado() {
  if (estadoDeserto.whirlParticles.length === 0) {
    for (let i = 0; i < 320; i++) {
      estadoDeserto.whirlParticles.push({
        angle:    Math.random() * Math.PI * 2,
        layer:    Math.random(),
        height:   Math.random(),
        speed:    1.0 + Math.random() * 3.0,
        size:     2 + Math.random() * 6,
        alpha:    0.6 + Math.random() * 0.4,
        phase:    Math.random() * Math.PI * 2,
        color:    Math.random(),
        tornado:  Math.floor(Math.random() * 7)

      });
    }
  }
}

// desenha cada tornado individual e partículas de areia
function desenharTornadoUnico(ctx, W, H, t, bx, by, scale, intensidade, twistOffset, particleSubset) {
  // dimensões do tornado - altura e larguras no topo e na base
  const funnelH = H * 3.5 * intensidade * scale;
  const baseR   = W * 0.10 * intensidade * scale;
  const topR    = W * 0.75 * intensidade * scale;
  const waist   = 0.25;


  const slices = 28;
  for (let si = 0; si < slices; si++) {
    const hFrac     = si / slices;
    const hFracNext = (si + 1) / slices;
    const sliceY    = by - hFrac * funnelH;
    const sliceYN   = by - hFracNext * funnelH;

    const rAtH = hFrac < waist
        ? lerp(baseR, baseR * 0.15, hFrac / waist)
        : lerp(baseR * 0.15, topR, (hFrac - waist) / (1 - waist));

    const twist = hFrac * Math.PI * 7 + t * 3.0 + twistOffset;
    const alpha = Math.min(0.98, (0.92 + 0.06 * (1 - hFrac)) * intensidade);

    ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(bx - rAtH, sliceY, bx + rAtH, sliceY);
    g.addColorStop(0,    'rgba(30,12,2,1.0)');
    g.addColorStop(0.18, 'rgba(90,42,8,0.95)');
    g.addColorStop(0.38, 'rgba(170,95,18,0.75)');
    g.addColorStop(0.5,  'rgba(210,140,35,0.35)');
    g.addColorStop(0.62, 'rgba(170,95,18,0.75)');
    g.addColorStop(0.82, 'rgba(90,42,8,0.95)');
    g.addColorStop(1,    'rgba(30,12,2,1.0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(
        bx + Math.sin(twist) * rAtH * 0.12,
        sliceY,
        rAtH,
        Math.max(3, (sliceY - sliceYN) * 0.7 + 4),
        0, 0, Math.PI * 2
    );
    ctx.fill();
  }

  // partículas de areia
  particleSubset.forEach(p => {
    const velocidadeRot = p.speed * (1.5 - p.height * 0.6) * intensidade;
    p.angle += velocidadeRot * 0.06;
    p.height = (p.height + 0.005 * intensidade * p.speed) % 1;

    const rAtH = p.height < waist
        ? lerp(baseR, baseR * 0.15, p.height / waist)
        : lerp(baseR * 0.15, topR, (p.height - waist) / (1 - waist));

    const pr = rAtH * (0.1 + p.layer * 1.0);
    const twist = p.height * Math.PI * 6 + t * 3.0 + twistOffset;
    const px2 = bx + Math.cos(p.angle + twist * 0.35) * pr;
    const py2 = by - p.height * funnelH + Math.sin(p.angle) * pr * 0.12;

    const rr = p.color < 0.5 ? (80  + p.height * 110) | 0 : (165 + p.height * 70) | 0;
    const gg = p.color < 0.5 ? (38  + p.height * 75)  | 0 : (100 + p.height * 60) | 0;
    const bb = (8 + p.height * 28) | 0;
    const aa = Math.min(0.98, p.alpha * intensidade);

    ctx.globalAlpha = aa;
    ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
    ctx.beginPath();
    ctx.arc(px2, py2, (p.size * 4.5) * (0.3 + intensidade * 1.0) * (1 - p.height * 0.3), 0, Math.PI * 2);
    ctx.fill();
  });

  const dustR = baseR * 5;
  ctx.globalAlpha = 1;
  const dg = ctx.createRadialGradient(bx, by, 0, bx, by, dustR);
  dg.addColorStop(0,   `rgba(230,155,25,${0.99 * intensidade})`);
  dg.addColorStop(0.35,`rgba(195,115,15,${0.85 * intensidade})`);
  dg.addColorStop(0.7, `rgba(155,85,10,${0.45 * intensidade})`);
  dg.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = dg;
  ctx.beginPath();
  ctx.ellipse(bx, by, dustR, dustR * 0.20, 0, 0, Math.PI * 2);
  ctx.fill();
}

// desenha todos os tornados ativos
function desenharTornado(ctx, W, H, t) {
  const intensidade = estadoDeserto.whirlIntensity || 0;
  if (intensidade < 0.01) return;

  iniciarParticulasTornado();

  const allP = estadoDeserto.whirlParticles;
  const p0   = allP.filter(p => p.tornado === 0);
  const p1   = allP.filter(p => p.tornado === 1);
  const p2   = allP.filter(p => p.tornado === 2);

  const tremor = intensidade > 0.65 ? (intensidade - 0.65) * 12 : 0; // tremor do ecrã acima de 65% de intensidade
  const tremorX = tremor > 0 ? (Math.random() - 0.5) * tremor : 0;
  const tremorY = tremor > 0 ? (Math.random() - 0.5) * tremor * 0.4 : 0;

  ctx.save();
  if (tremor > 0) ctx.translate(tremorX, tremorY);

  if (intensidade > 0.3) {
    const alphaStorm = (intensidade - 0.3) / 0.7 * 0.55;
    const stormG = ctx.createLinearGradient(0, H, 0, 0);
    stormG.addColorStop(0,   `rgba(200,130,20,${alphaStorm * 1.0})`);
    stormG.addColorStop(0.4, `rgba(180,110,15,${alphaStorm * 0.7})`);
    stormG.addColorStop(1,   `rgba(140,80,10,${alphaStorm * 0.2})`);
    ctx.globalAlpha = 1;
    ctx.fillStyle = stormG;
    ctx.fillRect(0, 0, W, H);
  }

  desenharTornadoUnico(ctx, W, H, t, W * 0.50, H * 0.95, 1.00, intensidade, 0,            p0);
  desenharTornadoUnico(ctx, W, H, t, W * 0.18, H * 0.97, 0.60, intensidade, Math.PI*0.6,  p1);
  desenharTornadoUnico(ctx, W, H, t, W * 0.82, H * 0.97, 0.60, intensidade, Math.PI*1.3,  p2);

  const p3 = allP.filter((_, i) => i % 5 === 3);
  const p4 = allP.filter((_, i) => i % 5 === 4);
  desenharTornadoUnico(ctx, W, H, t, W * 0.36, H * 0.96, 0.50, intensidade, Math.PI*0.3,  p3);
  desenharTornadoUnico(ctx, W, H, t, W * 0.64, H * 0.96, 0.50, intensidade, Math.PI*1.8,  p4);

  const p5 = allP.filter((_, i) => i % 7 === 0);
  const p6 = allP.filter((_, i) => i % 7 === 1);
  desenharTornadoUnico(ctx, W, H, t, W * 0.05, H * 0.98, 0.38, intensidade, Math.PI*2.1,  p5);
  desenharTornadoUnico(ctx, W, H, t, W * 0.95, H * 0.98, 0.38, intensidade, Math.PI*0.9,  p6);

  if (intensidade > 0.6) {
    const alphaDetritos = (intensidade - 0.6) / 0.4;
    ctx.globalAlpha = alphaDetritos * 0.7;
    for (let d = 0; d < 40; d++) {
      const dx = ((d * 137.5 + t * 180) % W);
      const dy = H * 0.2 + ((d * 89.3 + t * 80) % (H * 0.7));
      const dsize = 2 + (d % 5);
      ctx.fillStyle = d % 3 === 0 ? '#c87818' : d % 3 === 1 ? '#906010' : '#6a4008';
      ctx.beginPath();
      ctx.ellipse(dx, dy, dsize * 3, dsize, Math.sin(t + d) * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
