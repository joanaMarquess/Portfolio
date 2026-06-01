function construirCenaRadiacao(s, bx, W, H, rng, planet) {
  // estrelas
  s.stars = Array.from({length: 18}, () => ({ x: rng(), y: rng()*0.42, r: 0.8+rng()*2, phase: rng()*Math.PI*2 }));
    // montanhas de fundo
    const numMtnBg = 4 + Math.floor(rng()*3);
    s.mountainsBg = Array.from({length: numMtnBg}, (_, i) => ({
      cx: (i+0.5)/numMtnBg + (rng()-0.5)*0.15, peakY: 0.28 + rng()*0.14, w: 0.28 + rng()*0.22
    }));
    // montanhas em primeiro plano
    const numMtnFg = 3 + Math.floor(rng()*3);
    s.mountainsFg = Array.from({length: numMtnFg}, (_, i) => ({
      cx: (i+0.5)/numMtnFg + (rng()-0.5)*0.1, peakY: 0.38 + rng()*0.1, w: 0.22 + rng()*0.2
    }));
    s.floorY = 0.58 + rng()*0.06;
    // poças
    s.pools = Array.from({length: 3+Math.floor(rng()*3)}, () => ({
      cx: 0.1+rng()*0.8, cy: s.floorY + 0.06+rng()*0.12, rx: 0.04+rng()*0.09, ry: 0.012+rng()*0.022
    }));
    // plantas
    const numPlants = planet.gen.numPlants || 7;
    s.plants = Array.from({length: numPlants}, (_, i) => ({
      x: (0.05 + (i/(numPlants-1||1))*0.9), baseY: s.floorY + 0.005 + rng()*0.02,
      bodyH: 0.10 + rng()*0.16, bodyW: 0.025 + rng()*0.03,
      orbs: Math.floor(2+rng()*3), phase: rng()*Math.PI*2, scale: 0.55 + rng()*0.9
    }));
    // nuvens roxas
    s.clouds = Array.from({length: 5+Math.floor(rng()*4)}, () => ({
      x: rng(), y: 0.05+rng()*0.22, w: 0.10+rng()*0.18, h: 0.04+rng()*0.07,
      phase: rng()*Math.PI*2, speed: 0.025+rng()*0.03, dark: rng() > 0.5
    }));
    // faixas de glitch
    s.glitchStrips = Array.from({length: 18}, () => ({
      y: rng(), h: 0.005+rng()*0.02, phase: rng()*Math.PI*2, speed: 1.5+rng()*4, color: rng()>0.5 ? 0 : 1
    }));

    const C = {
      skyTop:'#1a2b04', skyMid:'#2e4d06', skyHorizon:'#4a7a0a',
      mtnBg:'#5a3578', mtnBgDark:'#3d2252', mtnFg:'#2a4408', mtnFgDark:'#1a2d04',
      groundTop:'#5a9010', groundMid:'#3d6608', groundBot:'#1e3304',
    };
    const floorY = s.floorY * H;

    // gradiente do céu
    const sky = bx.createLinearGradient(0, 0, 0, floorY);
    sky.addColorStop(0, C.skyTop); sky.addColorStop(1, C.skyHorizon);
    bx.fillStyle = sky; bx.fillRect(0, 0, W, floorY + 2);

    // desenha as montanhas de fundo
    s.mountainsBg.forEach(m => {
      const cx = m.cx * W, peakY = m.peakY * H, hw = m.w * W * 0.5;
      bx.fillStyle = C.mtnBg; bx.beginPath(); bx.moveTo(cx-hw, floorY+4); bx.lineTo(cx, peakY); bx.lineTo(cx+hw, floorY+4); bx.closePath(); bx.fill();
      bx.fillStyle = C.mtnBgDark; bx.beginPath(); bx.moveTo(cx-hw*0.15, floorY+4); bx.lineTo(cx, peakY); bx.lineTo(cx+hw*0.4, floorY+4); bx.closePath(); bx.fill();
    });
    // desenha as montanhas de frente
    s.mountainsFg.forEach(m => {
      const cx = m.cx * W, peakY = m.peakY * H, hw = m.w * W * 0.5;
      bx.fillStyle = C.mtnFg; bx.beginPath(); bx.moveTo(cx-hw, floorY+2); bx.lineTo(cx, peakY); bx.lineTo(cx+hw, floorY+2); bx.closePath(); bx.fill();
      bx.fillStyle = C.mtnFgDark; bx.beginPath(); bx.moveTo(cx-hw*0.1, floorY+2); bx.lineTo(cx, peakY); bx.lineTo(cx+hw*0.35, floorY+2); bx.closePath(); bx.fill();
    });

    // gradiente do chão
    const groundGrad = bx.createLinearGradient(0, floorY, 0, H);
    groundGrad.addColorStop(0, C.groundTop); groundGrad.addColorStop(1, C.groundBot);
    bx.fillStyle = groundGrad; bx.fillRect(0, floorY, W, H - floorY);
}

// desenha estrelas, poças, plantas, nuvens e glitch da câmara
function desenharCenaRadiacao(ctx, s, W, H, t) {
const floorY = s.floorY * H;
    const C = {
      poolLight:'#c8ff40', poolDark:'#8ec818', cloudLight:'#7a3a9a', cloudDark:'#4a1f6a',
      orbYellow:'#c8ff18', orbGlow:'#e0ff60', plantBody:'#6a2a88', plantDark:'#3d1550',
    };

    // cintilação das estrelas
    s.stars.forEach(st => {
      const twink = 0.5 + 0.5 * Math.sin(t*1.4+st.phase);
      ctx.globalAlpha = twink*0.9; ctx.fillStyle = '#d0ff80';
      ctx.beginPath(); ctx.arc(st.x*W, st.y*H, st.r, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1;
    });

    // desenha poças
    s.pools.forEach(p => {
      const pulsacaoPoca = 0.75 + 0.25*Math.sin(t*1.1+p.cx*10);
      const pcx = p.cx*W, pcy = p.cy*H, prx = p.rx*W, pry = p.ry*H;
      const pg = ctx.createRadialGradient(pcx, pcy, 0, pcx, pcy, prx*1.6);
      pg.addColorStop(0, `rgba(180,255,40,${0.25*pulsacaoPoca})`); pg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(pcx, pcy, prx*1.6, pry*2.2, 0, 0, Math.PI*2); ctx.fill();
      const pb = ctx.createRadialGradient(pcx-prx*0.25, pcy-pry*0.3, 0, pcx, pcy, prx);
      pb.addColorStop(0, C.poolLight); pb.addColorStop(0.6, C.poolDark); pb.addColorStop(1, '#3a5808');
      ctx.fillStyle = pb; ctx.beginPath(); ctx.ellipse(pcx, pcy, prx, pry, 0, 0, Math.PI*2); ctx.fill();
    });

    // desenhar plantas
    s.plants.forEach(p => {
      const sway = Math.sin(t*0.7+p.phase)*5*p.scale;
      const bxp = p.x*W, by = p.baseY*H, bh = p.bodyH*H*p.scale, bw = p.bodyW*W*p.scale;
      const tipX = bxp+sway, tipY = by-bh;
      ctx.fillStyle = C.plantBody;
      ctx.beginPath(); ctx.moveTo(bxp-bw*0.5, by);
      ctx.quadraticCurveTo(bxp-bw*0.8, by-bh*0.4, bxp-bw*0.55+sway*0.3, by-bh*0.6);
      ctx.quadraticCurveTo(tipX-bw*0.3, tipY-bh*0.05, tipX, tipY);
      ctx.quadraticCurveTo(tipX+bw*0.3, tipY-bh*0.05, bxp+bw*0.55+sway*0.3, by-bh*0.6);
      ctx.quadraticCurveTo(bxp+bw*0.8, by-bh*0.4, bxp+bw*0.5, by); ctx.closePath(); ctx.fill();
    });

    // desenha nuvens roxas
    s.clouds.forEach(c => {
      const cloudX = (c.x + Math.sin(t*c.speed+c.phase)*0.025)*W;
      const cloudY = c.y*H, cw = c.w*W, ch = c.h*H;
      const col1 = c.dark ? C.cloudDark : C.cloudLight;
      const n = 6;
      for (let i = 0; i < n; i++) {
        const a = (i/n)*Math.PI*2, bxc = cloudX+Math.cos(a)*cw*0.55, byc = cloudY+Math.sin(a)*ch*0.7;
        const g = ctx.createRadialGradient(bxc, byc, 0, bxc, byc, cw*0.48);
        g.addColorStop(0, col1); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bxc, byc, cw*0.52, 0, Math.PI*2); ctx.fill();
      }
      const gc = ctx.createRadialGradient(cloudX, cloudY, 0, cloudX, cloudY, cw*0.6);
      gc.addColorStop(0, col1); gc.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gc; ctx.beginPath(); ctx.ellipse(cloudX, cloudY, cw*0.8, ch*0.85, 0, 0, Math.PI*2); ctx.fill();
    });

    // efeitos de glitch baseados no movimento
    const camMotion = getMovimentoRadiacao();
    const impulsoMovimento = camMotion.energy; // 0=em movimento, 1=completamente parado
    if (impulsoMovimento > 0.01) {
      const probabilidadeFaixa = impulsoMovimento * 0.9;

      // separação RGB, desenha o fundo deslocado
      const rgbShift = impulsoMovimento * W * 0.018;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.18 + impulsoMovimento * 0.22;
      // canal vermelho deslocado para a direita
      ctx.drawImage(s.bg, rgbShift, 0);
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.14 + impulsoMovimento * 0.18;
      // canal azul deslocado para a esquerda
      ctx.fillStyle = `rgba(0,80,255,${0.08 * impulsoMovimento})`;
      ctx.fillRect(-rgbShift, 0, W, H);
      ctx.drawImage(s.bg, -rgbShift, 0); // fundo deslocado para a esquerda
      ctx.restore();

      // faixas de glitch horizontais
      s.glitchStrips.forEach(gs => {
        if (Math.random() > probabilidadeFaixa) return;
        const gy = gs.y * H;
        const gh = gs.h * H * (1 + impulsoMovimento * 2.5);
        // deslocamento horizontal da faixa
        const offset = (Math.sin(t * gs.speed + gs.phase) * 0.5 + Math.sin(t * gs.speed * 3.1 + gs.phase) * 0.5) * impulsoMovimento * W * 0.12;
        ctx.save();
        ctx.globalAlpha = 0.25 + impulsoMovimento * 0.45;
        ctx.drawImage(s.bg, offset, gy, W, gh, 0, gy, W, gh);
        // tom verde ou roxo na faixa, alternado aleatoriamente para simular o efeito
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = gs.color === 0 ? `rgba(80,255,40,${0.12 * impulsoMovimento})` : `rgba(160,40,255,${0.12 * impulsoMovimento})`;
        ctx.fillRect(0, gy, W, gh);
        ctx.restore();
      });

      // linhas pretas horizontais a cada 4px
      if (impulsoMovimento > 0.25) {
        ctx.save();
        ctx.globalAlpha = (impulsoMovimento - 0.25) * 0.35;
        for (let sy = 0; sy < H; sy += 4) {
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(0, sy, W, 1.5);
        }
        ctx.restore();
      }

      // flash de cor total — pisca verde ou roxo quando o glitch está no máximo
      if (impulsoMovimento > 0.7 && Math.random() < (impulsoMovimento - 0.7) * 0.15) {
        ctx.save();
        ctx.globalAlpha = 0.08 + Math.random() * 0.10;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(180,255,60,1)' : 'rgba(140,40,255,1)';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    }
}


function atualizarGlitch() {
  const cockpit = $('cockpit-screen');
  if (!cockpit) return;
  const planetaAtivo = getPlanetaAtivo();
  const eRadiacao = !!(planetaAtivo && planetaAtivo.space.pattern === 'radiation'); // glitch só existe neste planeta
  const nivelGlitch = getMovimentoRadiacao().energy;
  const phase = estadoInterior.phase;
  const fatorInterior = phase === 'interior' ? 1 : phase === 'entering' || phase === 'exiting' ? 0.7 : 0.35;
  const intensidade = eRadiacao ? nivelGlitch * fatorInterior : 0;
  cockpit.style.setProperty('--radiation-glitch', intensidade.toFixed(3)); // variável CSS lida pelos keyframes de glitch no styles.css
  cockpit.classList.toggle('radiation-glitching', eRadiacao && intensidade > 0.01); // classe que ativa as animações de glitch definidas no CSS

  const radiationAmbience = SONS.interferencia;
  if (radiationAmbience) {
    if (eRadiacao && estadoInterior.active) {
      radiationAmbience.volume = Math.max(0.08, Math.min(0.88, intensidade * 0.88)); // volume da interferência acompanha o glitch
    } else {
      radiationAmbience.volume = 0;
    }
  }
}
