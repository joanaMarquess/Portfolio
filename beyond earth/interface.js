// interface, navegação, notificações, ecrãs

// cursor e rato
const elementoCursor = $('cursor');
let botaoHovered = null;

// expande o cursor para envolver o botão com hover
function aplicarCursorBotao(target) {
  if (!elementoCursor || !target) return;
  const rect = target.getBoundingClientRect();
  const padX = 12;
  const padY = 10;
  elementoCursor.style.left = (rect.left + rect.width / 2) + 'px';
  elementoCursor.style.top = (rect.top + rect.height / 2) + 'px';
  elementoCursor.style.setProperty('--cursor-w', `${rect.width + padX}px`);
  elementoCursor.style.setProperty('--cursor-h', `${rect.height + padY}px`);
  elementoCursor.style.setProperty('--cursor-corner', '11px');
  elementoCursor.classList.add('is-button-hover');
}

// reinicia o cursor para o tamanho normal
function limparCursorBotao() {
  if (!elementoCursor) return;
  elementoCursor.style.setProperty('--cursor-w', '28px');
  elementoCursor.style.setProperty('--cursor-h', '28px');
  elementoCursor.style.setProperty('--cursor-corner', '8px');
  elementoCursor.classList.remove('is-button-hover');
}

// atualiza a posição
document.addEventListener('mousemove', e => {
  const btnHov = e.target.closest('button');
  botaoHovered = btnHov && !btnHov.disabled ? btnHov : null;

  if (botaoHovered) aplicarCursorBotao(botaoHovered);
  else {
    limparCursorBotao();
    elementoCursor.style.left = e.clientX + 'px';
    elementoCursor.style.top = e.clientY + 'px';
  }

  const nx = (e.clientX / window.innerWidth) * 2 - 1;
  const ny = (e.clientY / window.innerHeight) * 2 - 1;
  const dx = nx - estadoRato.x;
  const dy = ny - estadoRato.y;
  estadoRato.x = nx;
  estadoRato.y = ny;
  estadoRato.dx = dx;
  estadoRato.dy = dy;
  estadoRato.speed = Math.min(1, Math.hypot(dx, dy) * 12); // magnitude do movimento normalizada 0..1
  estadoRato.energy = Math.min(1, (estadoRato.energy || 0) + estadoRato.speed * 0.8);
  estadoRato.spin += (dx - dy) * 0.8; // diferença diagonal — simula rotação do cursor
  atualizarParallax();
  atualizarGlitch();
});

window.addEventListener('scroll', () => {
  if (botaoHovered) aplicarCursorBotao(botaoHovered);
}, { passive: true });

window.addEventListener('resize', () => {
  if (botaoHovered) aplicarCursorBotao(botaoHovered);
});

// estrelas, partículas e warp
function buildStars() {
  if (cenaEspaco && cenaEspaco.active) return;
  const sf = $('starField');
  sf.innerHTML = '';
  for (let i = 0; i < 120; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const sz = Math.random() * 2 + 0.5;
    s.style.cssText = `
    width:${sz}px;height:${sz}px;
    left:${Math.random()*100}%;
    top:${Math.random()*100}%;
    --dur:${2+Math.random()*4}s;
    --min-op:${0.2+Math.random()*0.4};
    animation-delay:${Math.random()*4}s;
  `;
    sf.appendChild(s);
  }
}

// cria partículas
function buildParticles(color) {
  if (cenaEspaco && cenaEspaco.active) return;
  const pf = $('particleField');
  pf.innerHTML = '';
  for (let i = 0; i < 15; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const sz = Math.random() * 4 + 1;
    p.style.cssText = `
    width:${sz}px;height:${sz}px;
    left:${20+Math.random()*60}%;
    top:${20+Math.random()*60}%;
    background:${color};
    --dur:${3+Math.random()*5}s;
    --op:${0.2+Math.random()*0.5};
    --dy:${-30+Math.random()*60}px;
    --dx:${-30+Math.random()*60}px;
    animation-delay:${Math.random()*5}s;
    filter:blur(${Math.random()*2}px);
  `;
    pf.appendChild(p);
  }
}

// cria linhas de warp no container durante as viagens
function construirLinhasWarp() {
  const wc = $('warpContainer');
  wc.innerHTML = '';
  for (let i = 0; i < 40; i++) {
    const line = document.createElement('div');
    line.className = 'warp-line';
    const angle = Math.random() * 360;
    const len = 100 + Math.random() * 400;
    line.style.cssText = `
    --angle:${angle}deg;
    width:${len}px;
    animation-delay:${Math.random()*0.5}s;
    animation-duration:${0.3+Math.random()*0.4}s;
  `;
    wc.appendChild(line);
  }
}


// chamada sempre que a fase muda: órbita, entrada, interior, etc.
function sincronizarUI() {
  const botaoSair = $('exitBtn');
  const prevBtn = $('prevBtn');
  const botaoSeguinte = $('nextBtn');
  const cockpit = $('cockpit-screen');
  const cockpitAtivo = !!(cockpit && cockpit.classList.contains('active'));
  const planetaAtivo = getPlanetaAtivo();
  const faseAtual = estadoInterior.phase;
  const dentroPlaneta = estadoInterior.active;
  const hasEnteredCurrentPlanet = !!(planetaAtivo && planetaAtivo.entered);
  const pattern = planetaAtivo ? planetaAtivo.space.pattern : '';

  if (cockpit) cockpit.classList.toggle('radiation-active', cockpitAtivo && pattern === 'radiation');
  atualizarGlitch();

  if (botaoSair) {
    botaoSair.textContent = faseAtual === 'exiting' ? 'A SAIR...' : 'REGRESSAR À ÓRBITA';
    botaoSair.classList.toggle('active', faseAtual === 'interior' || faseAtual === 'exiting');
    botaoSair.classList.toggle('is-hidden', faseAtual !== 'interior' && faseAtual !== 'exiting');
    botaoSair.classList.toggle('is-disabled', emTransicao || faseAtual === 'exiting');
    botaoSair.disabled = emTransicao || faseAtual !== 'interior';
    botaoSair.setAttribute('aria-disabled', botaoSair.disabled ? 'true' : 'false');
  }

  if (prevBtn) {
    prevBtn.disabled = planetaAtual === 0 || dentroPlaneta || emTransicao || faseAtual === 'entering' || faseAtual === 'exiting';
  }
  if (botaoSeguinte) {
    const faseBloqueada = faseAtual === 'entering' || faseAtual === 'exiting';
    botaoSeguinte.classList.toggle('is-hidden', !cockpitAtivo || !hasEnteredCurrentPlanet || dentroPlaneta || faseBloqueada);
    botaoSeguinte.disabled = dentroPlaneta || emTransicao || faseAtual === 'entering' || faseAtual === 'exiting';
  }
}


// análise progressiva das estatísticas
function fazerScanPlaneta(planet) {
  const s = planet.stats;
  const panel = $('statsPanel');
  const DURACAO_SCAN = 420; // ms a "analisar" cada linha
  const PASSO_REVEAL   = 180; // ms entre a revelação e o início da próxima análise

  ['temp','o2','press','water','grav','rad'].forEach(id => {
    const row = $('stat-'+id);
    if (row) { row.classList.remove('scanning', 'scanning-active', 'revealed'); }
    $('val-'+id).textContent = '—';
    $('val-'+id).style.color = '';
    const bar = $('bar-'+id);
    if (bar) {
      bar.style.width = '0';
      bar.style.background = '';
      bar.style.boxShadow = '';
    }
  });
  $('habitFill').style.width = '0';
  $('habitValue').textContent = '—';
  $('habitStatus').textContent = '—';
  $('habitStatus').style.color = '';

  const verdict = $('habitVerdict');
  if (verdict) { verdict.classList.remove('visible'); verdict.textContent = ''; }
  const avisoInterior = $('planetInteriorWarning');
  if (avisoInterior) {
    const partesAviso = (planet.alertText || '').split('\n');
    const tituloAviso = partesAviso[0] || '';
    const textoAviso = partesAviso.slice(1).join('\n');
    avisoInterior.innerHTML = tituloAviso
      ? `<strong>${tituloAviso}</strong>${textoAviso ? `<span>${textoAviso}</span>` : ''}`
      : '';
    avisoInterior.classList.toggle('visible', !!planet.alertText);
  }

  panel.classList.add('scanning');
  panel.classList.remove('done');

  const sequencia = [
    { id: 'temp',  val: s.temp,      display: `${s.temp}°C`       },
    { id: 'o2',    val: s.o2,        display: `${s.o2}%`           },
    { id: 'press', val: s.pressure,  display: `${s.pressure} atm`  },
    { id: 'water', val: s.water,     display: `${s.water}%`        },
    { id: 'grav',  val: s.gravity,   display: `${s.gravity} g`     },
    { id: 'rad',   val: s.radiation, display: `${s.radiation}`     },
  ];

  let cursor = 0;

  function scanNext() {
    if (cursor >= sequencia.length) {
      const atrasoHab = 300;
      setTimeout(() => {
        const hab = calcHabitabilidade(s);
        const fill   = $('habitFill');
        const val    = $('habitValue');
        const status = $('habitStatus');
        fill.style.width      = hab + '%';
        fill.style.background = hab >= 60 ? '#00ff88' : '#ff3344';
        val.textContent       = hab + '%';
        if (hab >= 60) { status.textContent = 'HABITÁVEL';  status.style.color = '#00ff88'; }
        else           { status.textContent = 'INABITÁVEL'; status.style.color = '#ff3344'; }
        panel.classList.remove('scanning');
        panel.classList.add('done');

        setTimeout(() => {
          if (!verdict) return;
          if (hab >= 60) {
            verdict.textContent = 'PLANETA HABITÁVEL';
            verdict.className = 'habit-verdict habit-verdict--ok visible';
          } else {
            verdict.textContent = 'INABITÁVEL';
            verdict.className = 'habit-verdict habit-verdict--danger visible';
            tocarInabitavel();
          }
        }, 600);
      }, atrasoHab);
      return;
    }

    const { id, val, display } = sequencia[cursor];
    const row = $('stat-'+id);

    if (row) {
      row.classList.remove('revealed');
      row.classList.add('scanning', 'scanning-active');
    }
    $('val-'+id).textContent = '···';

    setTimeout(() => {
      if (row) {
        row.classList.remove('scanning-active');
        row.classList.add('revealed');
      }
      atualizarBarra(id, val, display);
      cursor++;
      setTimeout(scanNext, PASSO_REVEAL);
    }, DURACAO_SCAN);
  }

  scanNext();
}


// atualiza com os dados do planeta e mostra-o na cena
function mostrarPlaneta(idx, direction) {
  const p = planets[idx];
  const stats = p.stats;
  const tokenRender = ++tokenPlaneta; // cancela alertas de planetas anteriores

  $('hudPlanetName').textContent = p.name;
  $('hudSubtitle').textContent = p.subtitle;
  $('planetDescTitle').textContent = '';
  $('planetDescText').textContent = p.descText;

  if (cenaEspaco && cenaEspaco.active) {
    cenaEspaco.mostrarPlaneta(p, direction || 1);
  } else {
    const sphere = $('planetSphere');
    const glow = $('planetGlow');
    const ring = $('planetRing');
    sphere.style.cssText = `width:${p.size}px;height:${p.size}px;background:${p.color.main};`;
    glow.style.cssText = `background:${p.color.glow};filter:blur(30px);`;

    if (p.temAnel) {
      const rs   = p.size;
      const sc1  = p.ringScale1  || 2.2;
      const sc2  = p.ringScale2  || 2.7;
      const rc1  = p.ringColor      || 'rgba(120,100,60,0.65)';
      const rc2  = p.ringColorDark  || 'rgba(60,50,30,0.80)';
      const rc3  = p.ringColorLight || 'rgba(160,140,90,0.40)';
      const rc4  = p.ringColorOuter || 'rgba(80,65,35,0.50)';
      const tilt = 72;

      // gradiente do anel interior
      const fundoAnel1 = `linear-gradient(to bottom, ${rc2} 0%, ${rc3} 20%, ${rc1} 40%, ${rc2} 60%, ${rc1} 78%, ${rc3} 100%)`;
      const rw1 = rs * sc1;
      const rh1 = rs * 0.36;
      const baseAnel1 = `display:block;width:${rw1}px;height:${rh1}px;position:absolute;top:50%;left:50%;border-radius:50%;border:none;background:${fundoAnel1};transform:translate(-50%,-50%) rotateX(${tilt}deg);`;

      ring.style.cssText = baseAnel1 + `clip-path:polygon(0% 0%,100% 0%,100% 50%,0% 50%);`;
      const ringFront = $('planetRingFront');
      if (ringFront) ringFront.style.cssText = baseAnel1 + `clip-path:polygon(0% 50%,100% 50%,100% 100%,0% 100%);z-index:10;`;

      // anel duplo
      if (p.temAnelDuplo) {
        const rw2 = rs * sc2;
        const rh2 = rs * 0.42;
        const fundoAnel2 = `linear-gradient(to bottom, ${rc4} 0%, ${rc2} 35%, ${rc4} 65%, ${rc2} 100%)`;
        const baseAnel2 = `display:block;width:${rw2}px;height:${rh2}px;position:absolute;top:50%;left:50%;border-radius:50%;border:none;background:${fundoAnel2};transform:translate(-50%,-50%) rotateX(${tilt}deg);z-index:-1;`;
        const exibicaoPlaneta = $('planetDisplay');
        let outerRing = document.getElementById('planetRingOuter');
        if (!outerRing) {
          outerRing = document.createElement('div');
          outerRing.id = 'planetRingOuter';
          exibicaoPlaneta.appendChild(outerRing);
          const outerRingFront = document.createElement('div');
          outerRingFront.id = 'planetRingOuterFront';
          exibicaoPlaneta.appendChild(outerRingFront);
        }
        outerRing.style.cssText = baseAnel2 + `clip-path:polygon(0% 0%,100% 0%,100% 50%,0% 50%);`;
        const outerRingFront = document.getElementById('planetRingOuterFront');
        if (outerRingFront) outerRingFront.style.cssText = baseAnel2 + `clip-path:polygon(0% 50%,100% 50%,100% 100%,0% 100%);z-index:9;`;
      } else {
        // esconde o anel externo se existir
        const outerRing = document.getElementById('planetRingOuter');
        if (outerRing) outerRing.style.display = 'none';
        const outerRingFront = document.getElementById('planetRingOuterFront');
        if (outerRingFront) outerRingFront.style.display = 'none';
      }
    } else {
      ring.style.display = 'none';
      const ringFront = $('planetRingFront');
      if (ringFront) ringFront.style.display = 'none';
      const outerRing = document.getElementById('planetRingOuter');
      if (outerRing) outerRing.style.display = 'none';
      const outerRingFront = document.getElementById('planetRingOuterFront');
      if (outerRingFront) outerRingFront.style.display = 'none';
    }

    // lua cinzenta com crateras ou mini-saturno para planeta da gravidade
    const oldMoon = document.getElementById('planetMoon');
    if (oldMoon) oldMoon.remove();
    if (p.temLua) {
      const tamanhoLua = Math.round(p.size * (0.22 + Math.random() * 0.14));
      const distanciaLua = p.size * 0.85;
      const eBaixaGrav = p.space.pattern === 'lowgrav';
      // canvas mais largo para planetas de baixa gravidade para caber o anel
      const largCanvas = eBaixaGrav ? tamanhoLua * 5 : tamanhoLua * 2;
      const altCanvas = tamanhoLua * 2;
      const canvasLua = document.createElement('canvas');
      canvasLua.id = 'planetMoon';
      canvasLua.width  = largCanvas;
      canvasLua.height = altCanvas;
      canvasLua.style.cssText = `
        width:${eBaixaGrav ? tamanhoLua*2.5 : tamanhoLua}px;
        height:${tamanhoLua}px;
        position:absolute;
        top:${-tamanhoLua*0.5 - distanciaLua*0.3}px;
        right:${-tamanhoLua - distanciaLua*0.2}px;
        border-radius:${eBaixaGrav ? '0' : '50%'};
        box-shadow: ${eBaixaGrav ? 'none' : '-3px 3px 14px rgba(0,0,0,0.7)'};
        pointer-events:none;
        overflow:visible;
      `;
      const planetDisplay2 = $('planetDisplay');
      planetDisplay2.appendChild(canvasLua);

      if (eBaixaGrav) {
        // mini-Saturno com anel
        const mc = canvasLua.getContext('2d');
        const cx = largCanvas / 2, cy = altCanvas / 2;
        const R  = tamanhoLua * 0.75; // raio do planeta
        const ringW = R * 2.0;      // largura do anel
        const tilt  = 0.28;         // achatamento vertical do anel
        // deriva o tom da cor da atmosfera do planeta (ex: '#c8a0ff' -> roxo)
        const atmHex = p.space.atmosphere || '#c8a0ff';
        const atmR = parseInt(atmHex.slice(1,3),16);
        const atmG = parseInt(atmHex.slice(3,5),16);
        const atmB = parseInt(atmHex.slice(5,7),16);
        const maxC = Math.max(atmR,atmG,atmB), minC = Math.min(atmR,atmG,atmB);
        let hue = 270;
        if (maxC !== minC) {
          const d = maxC - minC;
          hue = maxC === atmR ? ((atmG-atmB)/d*60+360)%360
              : maxC === atmG ? (atmB-atmR)/d*60+120
                  : (atmR-atmG)/d*60+240;
        }

        // anel de trás
        mc.save(); mc.translate(cx, cy); mc.scale(1, tilt);
        mc.strokeStyle = `hsla(${hue+15},45%,75%,0.30)`;
        mc.lineWidth = R * 0.30;
        mc.beginPath(); mc.arc(0, 0, ringW, Math.PI, Math.PI*2); mc.stroke();
        mc.restore();

        // corpo do planeta
        const pg = mc.createRadialGradient(cx - R*0.28, cy - R*0.32, 0, cx, cy, R);
        pg.addColorStop(0,   `hsla(${hue-10},40%,95%,1)`);
        pg.addColorStop(0.45,`hsla(${hue},50%,78%,1)`);
        pg.addColorStop(1,   `hsla(${hue+25},55%,52%,1)`);
        mc.fillStyle = pg;
        mc.beginPath(); mc.arc(cx, cy, R, 0, Math.PI*2); mc.fill();

        // anel da frente
        mc.save(); mc.translate(cx, cy); mc.scale(1, tilt);
        mc.strokeStyle = `hsla(${hue+15},60%,90%,0.75)`;
        mc.lineWidth = R * 0.28;
        mc.beginPath(); mc.arc(0, 0, ringW, 0, Math.PI); mc.stroke();
        mc.restore();

        // executa a lua
      } else {
        const mc = canvasLua.getContext('2d');
        const R  = tamanhoLua;
        const cx = R, cy = R;
        const mrng = criarAleatorio(hashTexto(p.name + 'moon'));
        const baseGrad = mc.createRadialGradient(cx*0.6, cy*0.55, R*0.05, cx, cy, R);
        baseGrad.addColorStop(0,   '#d0d0d0');
        baseGrad.addColorStop(0.45,'#b0b0b0');
        baseGrad.addColorStop(0.75,'#888888');
        baseGrad.addColorStop(1,   '#555555');
        mc.beginPath(); mc.arc(cx, cy, R, 0, Math.PI*2);
        mc.fillStyle = baseGrad; mc.fill();
        const numMaria = 3 + Math.floor(mrng()*4);
        for (let i = 0; i < numMaria; i++) {
          const angle = mrng()*Math.PI*2, dist = mrng()*R*0.55;
          const mx2 = cx + Math.cos(angle)*dist, my2 = cy + Math.sin(angle)*dist;
          const mr2 = R*(0.12 + mrng()*0.22);
          const mg = mc.createRadialGradient(mx2,my2,0,mx2,my2,mr2);
          mg.addColorStop(0,'rgba(80,80,80,0.45)'); mg.addColorStop(1,'rgba(100,100,100,0)');
          mc.beginPath(); mc.arc(mx2,my2,mr2,0,Math.PI*2); mc.fillStyle=mg; mc.fill();
        }
        const numCraters = 6 + Math.floor(mrng()*10);
        for (let i = 0; i < numCraters; i++) {
          const angle = mrng()*Math.PI*2, dist = mrng()*R*0.80;
          const crx = cx + Math.cos(angle)*dist, cry = cy + Math.sin(angle)*dist;
          const crR = R*(0.03 + mrng()*0.12);
          mc.beginPath(); mc.arc(crx,cry,crR*1.25,0,Math.PI*2);
          mc.fillStyle='rgba(200,200,200,0.18)'; mc.fill();
          const cg = mc.createRadialGradient(crx-crR*0.25,cry-crR*0.25,0,crx,cry,crR);
          cg.addColorStop(0,'rgba(50,50,50,0.85)'); cg.addColorStop(1,'rgba(100,100,100,0.10)');
          mc.beginPath(); mc.arc(crx,cry,crR,0,Math.PI*2); mc.fillStyle=cg; mc.fill();
          mc.beginPath(); mc.arc(crx,cry,crR,Math.PI*1.1,Math.PI*1.9);
          mc.strokeStyle='rgba(230,230,230,0.35)'; mc.lineWidth=Math.max(0.5,crR*0.18); mc.stroke();
        }
        mc.globalCompositeOperation = 'destination-in';
        mc.beginPath(); mc.arc(cx, cy, R, 0, Math.PI*2); mc.fillStyle='#fff'; mc.fill();
        mc.globalCompositeOperation = 'source-over';
      }
    }

    buildParticles(p.color.particle);
  }

  limparStats();

  const dist = stats.distance;
  $('distValue').textContent = dist > 1000 ? `${dist.toLocaleString()} a.l.` : `${dist} a.l.`;

  const containerMsg = $('statusMessages');
  containerMsg.innerHTML = '';

// botão do próximo planeta
  $('nextBtn').textContent = 'PROCURAR OUTRO PLANETA';
  $('nextBtn').disabled = false;

  sincronizarUI();

  if (p.alertText && !p.entered) {
    setTimeout(() => {
      if (tokenRender !== tokenPlaneta) return;
      mostrarNotif(p.alertText, 'warn', 0, { sound: 'alert', volume: 0.96, action: 'enter' });
    }, 1000);
  }
}

// reinicia todas as barras e valores do painel de estatísticas
function limparStats() {
  ['temp','o2','press','water','grav','rad'].forEach(id => {
    $('val-'+id).textContent = '—';
    $('val-'+id).style.color = '';
    const bar = $('bar-'+id);
    bar.style.width = '0';
    bar.style.background = '';
    bar.style.boxShadow = '';
    const row = $('stat-'+id);
    if (row) row.classList.remove('scanning', 'scanning-active', 'revealed');
  });
  $('statsPanel').classList.remove('scanning', 'done');
  $('habitFill').style.width = '0';
  $('habitValue').textContent = '—';
  $('habitStatus').textContent = '—';
  $('habitStatus').style.color = '';
  const avisoInterior = $('planetInteriorWarning');
  if (avisoInterior) {
    avisoInterior.classList.remove('visible');
    avisoInterior.textContent = '';
  }
}

// limpa o HUD para o estado de espaço profundo, sem planeta detetado
function mostrarEspacoProfundo() {
  $('hudPlanetName').textContent = '—';
  $('hudSubtitle').textContent = 'ESPAÇO PROFUNDO';
  $('planetDescTitle').textContent = '';
  $('planetDescText').textContent = 'Os sensores continuam a varrer o vazio em busca de um novo mundo.';
  $('distValue').textContent = '—';

  limparStats();
  const verdict = $('habitVerdict');
  if (verdict) { verdict.classList.remove('visible'); verdict.textContent = ''; }
}

function atualizarBarra(id, val, display) {
  const types = {temp:'temp', o2:'o2', press:'pressure', water:'water', grav:'gravity', rad:'radiation'};
  const type = types[id] || id;
  const color = corDaStat(type, val);
  const width = larguraDaStat(type, val);

  $('val-'+id).textContent = display;
  $('val-'+id).style.color = color;
  const bar = $('bar-'+id);
  bar.style.width = width + '%';
  bar.style.background = color;
  bar.style.boxShadow = `0 0 6px ${color}`;
}


// mostra notificação antes da entrada
function mostrarNotif(msg, type, duration, opts = {}) {
  const n = $('notif');
  if (n._showTimer) clearTimeout(n._showTimer);
  if (n._hideTimer) clearTimeout(n._hideTimer);
  if (n._soundTimer) clearTimeout(n._soundTimer);
  pararAlarme();
  n.classList.remove('show');

  // divide a mensagem por quebra de linha
  const parts = msg.split('\n');
  const title = parts[0] || '';
  const sub = parts.slice(1).join('\n');


  // notificação com subtítulo
  const eRico = (type === 'alert-planet' || type === 'warn') && sub;
  const eAterragem = type === 'landing';
  const temAcaoEntrar = eRico && opts.action === 'enter';

  if (eAterragem) {
    n.innerHTML = `<div class="notif-landing-inner"><span class="notif-landing-icon">▼</span><span class="notif-landing-text">${title}</span><span class="notif-landing-icon">▼</span></div>`;
  } else if (eRico) {
    n.innerHTML = `
      <div class="notif-rich-header">
        <span class="notif-rich-tag">AVISO DO SISTEMA</span>
      </div>
      <div class="notif-rich-title">${title}</div>
      ${sub ? `<div class="notif-rich-sub">${sub}</div>` : ''}
      ${temAcaoEntrar ? '<button class="notif-action notif-enter-btn" type="button">ENTRAR</button>' : ''}
    `;
    const botaoEntrarNotif = n.querySelector('.notif-enter-btn');
    if (botaoEntrarNotif) {
      botaoEntrarNotif.addEventListener('click', (e) => {
        e.stopPropagation();
        tocarBotao();
        entrarSairPlaneta();
      });
    }
  } else {
    n.innerHTML = `<div class="notif-simple-text">${title}</div>`;
  }

  n.className = 'notif' + (type ? ' notif-' + type : '');
  n._showTimer = setTimeout(() => n.classList.add('show'), 50);

  // flash laranja em ciclo
  if (eRico) {
    const existente = document.querySelector('.warn-flash-overlay');
    if (existente) existente.remove();
    const flash = document.createElement('div');
    flash.className = 'warn-flash-overlay';
    document.body.appendChild(flash);
  }

  if (opts.sound === 'alert') {
    iniciarAlarme(opts.volume ?? 0.96);
  }

  if (eRico && !opts.forceTimer) {
    n._hideTimer = 0;
  } else if (duration) {
    n._hideTimer = setTimeout(() => {
      pararAlarme();
      n.classList.remove('show');
    }, duration);
  } else if (!eRico) {
    n._hideTimer = setTimeout(() => {
      pararAlarme();
      n.classList.remove('show');
    }, 3000);
  }
}


// viagem entre planetas - dir=1 avança
function navegar(dir) {
  if (emTransicao) return; // ignora cliques durante animações
  if (estadoInterior.phase !== 'orbit') {
    mostrarNotif('SAI DO PLANETA PARA NAVEGAR', 'warn', 2200);
    return;
  }
  tocarViagem(); // som de viagem
  setEstadoMusica('travel', 900);
  emVazio = false;

  const novoIdx = planetaAtual + dir;
  if (novoIdx < 0) return;

  if (dir > 0 && novoIdx >= planets.length) {
    if (planetaAtual >= TOTAL_PLANETAS - 1) { // chega ao fim, aviso de combustível baixo
      terminarCombustivel();
      return;
    }
    planets.push(gerarPlaneta(planets.length)); // gera o planeta seguinte
  }

  emTransicao = true;
  iniciarAudio();
  pararAmbiente();
  const usarThree = !!(cenaEspaco && cenaEspaco.active);
  const buscasVazias = dir > 0 ? (Math.random() < 0.35 ? 1 : 0) : 0;

  // depois de já ter acontecido: apenas 10% de probabilidade
  const probabilidadeVazio = !voidNestaSessao && planetaAtual >= 1 && planetaAtual <= 5
      ? 1.0
      : 0.10;
  const viagemVazia = dir > 0 && Math.random() < probabilidadeVazio;

  const duracaoBuscaVazia = usarThree ? 2800 : 2200;
  const duracaoTotal = (usarThree ? Math.round(cenaEspaco.duracaoViagem * 1000) : 2000) + buscasVazias * duracaoBuscaVazia;
  const atrasoReveal = (usarThree ? 1800 : 1600) + buscasVazias * duracaoBuscaVazia;
  const atrasoEsconderWarp = (usarThree ? 2800 : 1800) + buscasVazias * duracaoBuscaVazia;

  sincronizarUI();

  construirLinhasWarp();
  const warp = $('warpContainer');
  warp.classList.add('active');

  const flash = $('travelFlash');
  const exibicaoPlaneta = $('planetDisplay');
  const atrasoFlash = usarThree ? 520 : 600;
  const atrasoFlashFinal = buscasVazias * duracaoBuscaVazia + atrasoFlash;
  const duracaoFlash = usarThree ? 220 : 300;

  if (buscasVazias > 0) {
    mostrarEspacoProfundo();
    if (exibicaoPlaneta) {
      exibicaoPlaneta.style.transition = 'opacity 0.12s ease';
      exibicaoPlaneta.style.opacity = '0';
    }
    if (usarThree && cenaEspaco && cenaEspaco.currentGroup) {
      cenaEspaco.currentGroup.visible = false;
    }

    for (let i = 0; i < buscasVazias; i++) {
      const attemptTime = i * duracaoBuscaVazia;
      setTimeout(() => {
        mostrarNotif('NENHUM PLANETA DETETADO', '', 2800);
      }, attemptTime + 120);

      setTimeout(() => {
        flash.classList.add('active');
        setTimeout(() => {
          flash.classList.remove('active');
        }, duracaoFlash);
      }, attemptTime + atrasoFlash);
    }
  } else if (usarThree) {
    cenaEspaco.travelTo(planets[novoIdx], dir);
  }

  setTimeout(() => {
    flash.classList.add('active');
    if (exibicaoPlaneta) {
      exibicaoPlaneta.style.transition = 'opacity 0.12s ease';
      exibicaoPlaneta.style.opacity = '0';
    }
    setTimeout(() => {
      flash.classList.remove('active');
    }, duracaoFlash);
  }, atrasoFlashFinal);

  setTimeout(() => {
    if (viagemVazia) {
      // viagem sem planeta, espera clique para procurar outro
      emVazio = true;
      voidNestaSessao = true;
      mostrarEspacoProfundo();
      mostrarNotif('NENHUM PLANETA DETETADO', '', 3500);
      const pd = $('planetDisplay');
      if (pd) { pd.style.transition = 'opacity 0.3s ease'; pd.style.opacity = '0'; }
      if (usarThree && cenaEspaco && cenaEspaco.currentGroup) {
        cenaEspaco.currentGroup.visible = false;
      }
      sincronizarUI();
    } else {
      if (usarThree) {
        if (cenaEspaco && cenaEspaco.currentGroup) cenaEspaco.currentGroup.visible = true;
        if (cenaEspaco) cenaEspaco.travelTo(planets[novoIdx], dir);
      }
      planetaAtual = novoIdx;
      if (dir > 0) {
        nivelCombustivel = Math.max(0, 100 - (planetaAtual * (100 / TOTAL_PLANETAS)));
        atualizarCombustivel();
      }
      mostrarPlaneta(planetaAtual, dir);
      const pd = $('planetDisplay');
      if (pd) {
        pd.style.transition = 'opacity 0.5s ease';
        pd.style.opacity = '1';
      }
    }
  }, atrasoReveal);

  setTimeout(() => {
    warp.classList.remove('active');
  }, atrasoEsconderWarp);

  setTimeout(() => {
    emTransicao = false;
    sincronizarUI();
  }, duracaoTotal);
}


let combustivelMostrado = 100;
let animacaoCombustivelId = null;

// atualiza a barra de combustível — a cor muda consoante o nível
function atualizarCombustivel() { // atualiza a cor da barra de combustível
  const bar = $('fuelFill');
  const elValor = $('fuelValue');
  const elTitulo = $('fuelLabel');
  if (!bar) return;

  const pct = Math.max(0, nivelCombustivel);
  const raio = 52;
  const circunferencia = 2 * Math.PI * raio;
  bar.style.strokeDasharray = `${circunferencia}`;
  bar.style.strokeDashoffset = `${circunferencia * (1 - pct / 100)}`;

  let color;
  if (pct > 50) {
    color = '#00d4ff'; // azul — normal
    bar.style.animation = 'none';
  } else if (pct > 25) {
    color = '#ff8800'; // laranja — baixo
    bar.style.animation = 'none';
  } else {
    color = '#ff2244'; // vermelho — crítico
    bar.style.animation = 'fuelPulse 0.8s ease-in-out infinite'; // pulsa em vermelho quando crítico
  }

  bar.style.stroke = color;
  bar.style.filter = `drop-shadow(0 0 6px ${color})`;
  if (elValor) {
    elValor.style.color = color;
  }
  if (elTitulo) {
    elTitulo.style.color = color;
  }

  if (!elValor) return;

  if (animacaoCombustivelId) {
    cancelAnimationFrame(animacaoCombustivelId);
    animacaoCombustivelId = null;
  }

  const inicio = combustivelMostrado;
  const destino = pct;
  const duracao = destino < inicio ? 1200 : 0;

  if (duracao === 0) {
    combustivelMostrado = destino;
    elValor.textContent = Math.round(destino) + '%';
    return;
  }

  const inicioTempo = performance.now();
  const animarNumero = (agora) => {
    const progresso = Math.min(1, (agora - inicioTempo) / duracao);
    const suavizado = 1 - Math.pow(1 - progresso, 3);
    combustivelMostrado = inicio + (destino - inicio) * suavizado;
    elValor.textContent = Math.round(combustivelMostrado) + '%';

    if (progresso < 1) {
      animacaoCombustivelId = requestAnimationFrame(animarNumero);
    } else {
      combustivelMostrado = destino;
      elValor.textContent = Math.round(destino) + '%';
      animacaoCombustivelId = null;
    }
  };

  animacaoCombustivelId = requestAnimationFrame(animarNumero);
}

// dispara o fim por combustível esgotado, alarme e depois ecrã final
function terminarCombustivel() {
  if (emTransicao) return;
  emTransicao = true;

  nivelCombustivel = 0;
  atualizarCombustivel();

  setTimeout(() => {
    const alarm = $('fuelAlarm');
    if (alarm) {
      alarm.classList.add('active');
      setTimeout(() => {
        alarm.classList.remove('active');
        mostrarEcraFinal();
      }, 3000);
    } else {
      mostrarEcraFinal();
    }
  }, 1500);
}

// entra ou sai do planeta
function entrarSairPlaneta(forceInside) {
  const cockpit = $('cockpit-screen');
  const planetaAtivo = getPlanetaAtivo();
  if (!cockpit || !cockpit.classList.contains('active') || !planetaAtivo) return;
  if (emTransicao) {
    mostrarNotif('AGUARDA A ESTABILIZAÇÃO DA NAVE', '', 1600);
    return;
  }

  const deveEntrar = typeof forceInside === 'boolean' ? forceInside : estadoInterior.phase === 'orbit';
  iniciarAudio();

  if (deveEntrar) {
    if (estadoInterior.phase !== 'orbit') return;
    if (planetaAtivo.entered) {
      sincronizarUI();
      return;
    }
    estadoInterior.phase = 'entering';
    emTransicao = true;
    sincronizarUI();
    tocarSomTransicao(2300, 0.86);
    setEstadoMusica('silent', 1600);
    mostrarNotif(`A ATERRAR EM ${planetaAtivo.name}`, 'landing', 2200);
    // esconde o flash laranja ao entrar no planeta
    const flashAviso = document.querySelector('.warn-flash-overlay');
    if (flashAviso) flashAviso.remove();

    const exibicaoPlaneta = $('planetDisplay');
    const warp = $('warpContainer');

    // entrada - planeta a crescer
    construirLinhasWarp();
    if (warp) warp.classList.add('active');
    if (exibicaoPlaneta) {
      // centrar no centro do planeta
      exibicaoPlaneta.style.transformOrigin = 'center center';
      exibicaoPlaneta.style.transition = 'transform 2.4s cubic-bezier(0.15,0,0.6,1), opacity 0.35s ease 2.1s';
      exibicaoPlaneta.style.transform = 'scale(10)';
      exibicaoPlaneta.style.opacity = '0';
    }

    // passado 1.2 segundos, transição para o interior do planeta
    setTimeout(() => {
      if (warp) warp.classList.remove('active');
      setModoInterior(true, planetaAtivo);
    }, 1800);

    // fim da entrada
    setTimeout(() => {
      if (exibicaoPlaneta) {
        exibicaoPlaneta.style.transition = '';
        exibicaoPlaneta.style.transform = '';
        exibicaoPlaneta.style.opacity = '0';
      }
      planetaAtivo.entered = true;
      estadoInterior.phase = 'interior';
      emTransicao = false;
      sincronizarUI();
      if (planetaAtivo.space.pattern === 'lava') { iniciarAmbiente('lava'); }
      if (planetaAtivo.space.pattern === 'radiation') { iniciarAmbiente('radiation'); }
      if (planetaAtivo.space.pattern === 'desert') { iniciarAmbiente('desert'); }
      if (planetaAtivo.space.pattern === 'lowgrav') { iniciarAmbiente('lowgrav'); }
      fazerScanPlaneta(planetaAtivo);
      if (planetaAtivo.space.pattern === 'ice') {
        resetGelo(); iniciarMicGelo();
      }
      if (planetaAtivo.space.pattern === 'lava')   { resetLava(); iniciarMicLava(); }
      if (planetaAtivo.space.pattern === 'ocean')  { iniciarCameraOceano(); }
      if (planetaAtivo.space.pattern === 'lowgrav'){ iniciarRastreioMao(); }
    }, 2300);

  } else {
    if (estadoInterior.phase !== 'interior') return;
    estadoInterior.phase = 'exiting';
    emTransicao = true;
    sincronizarUI();
    tocarSomTransicao(2200, 0.86);
    mostrarNotif('REGRESSO À ÓRBITA DE OBSERVAÇÃO', '', 1800);

    pararAmbiente();
    pararMicGelo(); pararMicLava(); pararCameraOceano(); pararRastreioMao(); pararCamera();

    const warp = $('warpContainer');

    // saída
    construirLinhasWarp();
    if (warp) warp.classList.add('active');

    // esconde o interior, e o planeta volta ao tamanho normal
    setTimeout(() => {
      setModoInterior(false);
      cockpit.classList.remove('frame-hold');

      const exibicaoPlaneta = $('planetDisplay');
      if (exibicaoPlaneta) {
        exibicaoPlaneta.style.transformOrigin = 'center center';
        exibicaoPlaneta.style.transition = 'none';
        exibicaoPlaneta.style.transform = 'scale(8)';
        exibicaoPlaneta.style.opacity = '0';
        void exibicaoPlaneta.offsetWidth;
        exibicaoPlaneta.style.transition = 'transform 2.2s cubic-bezier(0.15,0,0.7,1), opacity 0.5s ease';
        exibicaoPlaneta.style.transform = 'scale(1)';
        exibicaoPlaneta.style.opacity = '1';
      }

      limparStats();
      resetInterior();
    }, 400);

    // para a viagem
    setTimeout(() => {
      if (warp) warp.classList.remove('active');
    }, 1400);

    setTimeout(() => {
      setEstadoMusica('travel', 1500);
    }, 260);

    setTimeout(() => {
      const exibicaoPlaneta = $('planetDisplay');
      if (exibicaoPlaneta) { exibicaoPlaneta.style.transition = ''; exibicaoPlaneta.style.transform = ''; }
      emTransicao = false;
      sincronizarUI();
    }, 2200);
  }
}


// mostra o ecrã final, esconde o cockpit e anima o ecrã de conclusão
function mostrarEcraFinal() {
  emTransicao = true;
  pararAmbiente();
  pararSomTransicao();
  pararAlarme();
  resetInterior();
  const cockpit = $('cockpit-screen');
  const final = $('final-screen');

  cockpit.style.opacity = '0';
  cockpit.style.transition = 'opacity 1s';

  setTimeout(() => {
    cockpit.classList.remove('active', 'visible');
    cockpit.style.display = 'none';
    final.style.display = 'flex';
    final.classList.add('active');
    setTimeout(() => {
      final.classList.add('visible');
      animarFinal();
    }, 100);
  }, 1000);
}

// anima os elementos principais do ecrã final
function animarFinal() {
  const earth = $('finalEarth');
  const big   = $('finalBig');
  const btn   = $('restartBtn');

  setTimeout(() => earth.classList.add('show'), 300);
  setTimeout(() => big.classList.add('show'), 2000);
  setTimeout(() => btn.classList.add('show'), 3300);
}


function iniciarExploracao() { // botão INICIAR, esconde a intro e mostra o cockpit
  iniciarAudio();
  setEstadoMusica('intro', 0);
  pararAmbiente();
  resetInterior();
  const intro = $('intro');
  const cockpit = $('cockpit-screen');
  const temCenaThree = iniciarCenaEspaco(); // inicializa three.js
  emTransicao = true;
  sincronizarUI();

  if (temCenaThree && cenaEspaco) {
    cenaEspaco.reset();
  } else {
    buildStars();
  }

  $('loadingBar').style.width = '0';
  $('warpContainer').classList.remove('active');
  $('travelFlash').classList.remove('active');

  intro.style.opacity = '0';
  intro.style.transition = 'opacity 0.8s';
  setTimeout(() => {
    intro.classList.remove('active', 'visible');
    intro.style.display = 'none';
    cockpit.style.display = 'flex';
    cockpit.classList.add('active');
    setTimeout(() => {
      cockpit.classList.add('visible');
      nivelCombustivel = 100;
      atualizarCombustivel();

      const duracaoViagem = temCenaThree ? 3800 : 3200;
      const atrasoMostrar = temCenaThree ? 2400 : 2000;
      const atrasoEsconderWarp = temCenaThree ? 3000 : 2500;
      const atrasoFlash = temCenaThree ? 1800 : 1600;
      const duracaoFlash = 260;
      const warp = $('warpContainer');
      const flash = $('travelFlash');
      const barraCarregamento = $('loadingBar');
      const exibicaoPlaneta = $('planetDisplay');

      if (exibicaoPlaneta) {
        exibicaoPlaneta.style.transition = 'none';
        exibicaoPlaneta.style.opacity = '0';
      }

      tocarViagem();
      construirLinhasWarp();
      if (warp) warp.classList.add('active');
      mostrarNotif('A EXPLORAR O ESPAÇO PROFUNDO...', '', 2800);

      setTimeout(() => {
        if (flash) flash.classList.add('active');
        setTimeout(() => {
          if (flash) flash.classList.remove('active');
        }, duracaoFlash);
      }, atrasoFlash);

      setTimeout(() => {
        mostrarPlaneta(0, 1);
        const pd = $('planetDisplay');
        if (pd) {
          pd.style.transition = 'opacity 0.5s ease';
          pd.style.opacity = '1';
        }
      }, atrasoMostrar);

      setTimeout(() => {
        if (warp) warp.classList.remove('active');
      }, atrasoEsconderWarp);

      setTimeout(() => {
        emTransicao = false;
        sincronizarUI();
      }, duracaoViagem);

      setTimeout(() => {
        setEstadoMusica('travel', 2600);
      }, Math.max(600, atrasoMostrar - 200));
    }, 50);
  }, 800);
}


// reinicia tudo e volta à intro
function reiniciar() { // reinicia tudo para o estado inicial

  const final = $('final-screen');
  const intro = $('intro');
  const cockpit = $('cockpit-screen');

  planetaAtual = 0;
  nivelCombustivel = 100;
  emTransicao = false;
  emVazio = false;
  voidNestaSessao = false;

  // limpa os estados
  pararAmbiente();
  pararSomTransicao();
  pararAlarme();
  resetInterior();
  setEstadoMusica('intro', 1400);
  resetGelo();
  resetLava();
  pararRastreioMao();
  pararCameraOceano();
  pararCamera();

  if (cockpit) {
    cockpit.style.opacity = '';
    cockpit.style.transition = '';
    cockpit.style.display = '';
    cockpit.classList.remove('frame-hold', 'simple-interior-active', 'radiation-active', 'three-active');
  }
  const exibicaoPlaneta = $('planetDisplay');
  if (exibicaoPlaneta) {
    exibicaoPlaneta.style.opacity = '';
    exibicaoPlaneta.style.transition = '';
  }

  if (cenaEspaco && cenaEspaco.active) cenaEspaco.reset();

  // limpa elementos visuais
  const barraCarregamento = $('loadingBar');
  if (barraCarregamento) barraCarregamento.style.width = '0';

  const warpContainer = $('warpContainer');
  if (warpContainer) warpContainer.classList.remove('active');

  const travelFlash = $('travelFlash');
  if (travelFlash) travelFlash.classList.remove('active');

  const mensagensEstado = $('statusMessages');
  if (mensagensEstado) mensagensEstado.innerHTML = '';

  const listaCaracts = $('listaCaracts');
  if (listaCaracts) listaCaracts.innerHTML = '';

  const notif = $('notif');
  if (notif) notif.classList.remove('show');

  // gera novos planetas
  gerarSequenciaPlanetas();
  planets.length = 0;
  planets.push(gerarPlaneta(0));

  sincronizarUI();
  atualizarCombustivel();

  // transição para a intro
  final.style.opacity = '0';
  final.style.transition = 'opacity 0.8s';

  // reinicia as classes dos elementos da cena final
  ['finalEarth', 'finalBig', 'restartBtn'].forEach(id => {
    const el = $(id);
    if (el) el.classList.remove('show');
  });

  const botaoIniciar = $('startBtn');
  if (botaoIniciar) botaoIniciar.classList.remove('visible');

  setTimeout(() => {
    final.classList.remove('active', 'visible');
    final.style.display = 'none';
    final.style.opacity = '';

    intro.style.opacity = '';
    intro.style.display = 'flex';
    intro.classList.add('active');

    setTimeout(() => {
      intro.classList.add('visible');
      if (botaoIniciar) botaoIniciar.classList.add('visible');
    }, 50);
  }, 800);
}

// regista todos os event listeners dos botões
function ligarEventos() {
  $('startBtn').addEventListener('click', () => { tocarBotao(); iniciarExploracao(); });
  $('nextBtn').addEventListener('click', () => { tocarBotao(); navegar(1); });
  const botaoSair = $('exitBtn');
  if (botaoSair) botaoSair.addEventListener('click', () => { tocarBotao(); entrarSairPlaneta(false); });

  // verifica que o botão de reiniciar funciona
  const botaoReiniciar = $('restartBtn');
  if (botaoReiniciar) {
    botaoReiniciar.addEventListener('click', () => { tocarBotao(); reiniciar(); });
  }

  window.addEventListener('resize', () => {
    const canvas = $('planetCanvas');
    if (canvas && estadoInterior.active && estadoInterior.planet) {
      canvas.width = canvas.offsetWidth || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
    }
  });
}

// INICIALIZAÇÃO
ligarEventos();
ativarAutoplay();


// efeito de escrita da intro
(function initTypewriter() {
  const el = $('introTitle');
  if (!el) return;
  const textoCompleto = 'A humanidade destruiu o seu planeta.\nAgora procura um novo lar.';
  let indiceChar = 0;
  const btn = $('startBtn');
  if (btn) btn.classList.remove('visible');
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  function tick() {
    if (indiceChar <= textoCompleto.length) {
      el.innerHTML = textoCompleto.slice(0, indiceChar).replace(/\n/g, '<br>');
      el.appendChild(cursor);
      indiceChar++;
      const c = textoCompleto[indiceChar - 1];
      setTimeout(tick, c === '\n' ? 400 : c === '.' ? 280 : 38 + Math.random() * 28);
    } else {
      setTimeout(() => {
        cursor.remove();
        if (btn) btn.classList.add('visible');
      }, 900);
    }
  }
  setTimeout(tick, 1500);
})();

// botão de ecrã inteiro
(function initFullscreen() {
  const btn = $('fullscreenBtn');
  if (!btn) return;
  const iconExpand   = $('fsIconExpand');
  const iconCompress = $('fsIconCompress');
  const eEcraInteiro = () => !!(document.fullscreenElement || document.webkitFullscreenElement
      || document.mozFullScreenElement || document.msFullscreenElement);
  function atualizarIcone() {
    const eFs = eEcraInteiro();
    if (iconExpand)   iconExpand.style.display   = eFs ? 'none' : 'block';
    if (iconCompress) iconCompress.style.display = eFs ? 'block' : 'none';
  }
  btn.addEventListener('click', function(e) {
    e.stopPropagation(); e.preventDefault();
    if (!eEcraInteiro()) {
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (req) req.call(el).catch(() => {});
    } else {
      const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
      if (exit) exit.call(document).catch(() => {});
    }
  }, true);
  ['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange']
      .forEach(ev => document.addEventListener(ev, atualizarIcone));
  atualizarIcone();
})();
