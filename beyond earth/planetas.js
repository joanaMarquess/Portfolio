// dados e geração dos planetas
function hashTexto(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// garante que o mesmo planeta fica igual na mesma sessão
function criarAleatorio(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function rand(min, max) { return Math.random() * (max - min) + min; }

// arredonda os valores
function gerarStats(v) {
  return {
    temp:      Math.round(v.temp),
    o2:        Math.round(v.o2 * 10) / 10,
    pressure:  Math.round(v.pressure * 100) / 100,
    water:     Math.round(v.water),
    gravity:   Math.round(v.gravity * 100) / 100,
    radiation: Math.round(v.radiation),
    distance:  Math.round(v.distance)
  };
}

// preenche planet.gen com o fundo do planeta respetivo
function gerarCaracteristicas(planet) {
  const pattern = planet.space.pattern;
  planet.gen = {};
  if (pattern === 'ice')       planet.gen = { numGlaciers: 3 + Math.floor(Math.random() * 7), icicleCount: 4 + Math.floor(Math.random() * 10) };
  if (pattern === 'lava')      planet.gen = { numVents: 2 + Math.floor(Math.random() * 6), numDeadPlants: Math.floor(Math.random() * 6) };
  if (pattern === 'radiation') planet.gen = { numPlants: 4 + Math.floor(Math.random() * 10) };
  if (pattern === 'lowgrav')   planet.gen = { numRocks: 9 + Math.floor(Math.random() * 8), numGlobes: 2 + Math.floor(Math.random() * 6) };

}

// todos os tipos de planeta disponíveis, cada um com os seus nomes, stats e visuais
const TIPOS_PLANETA = [
  {
    type: 'lava', pattern: 'lava', classPrefix: 'M',
    systemNames: ['IGNIS','PYROS','VOLCANUS','CALDERRA','INFERNUS','MAGMARIS'],
    namePool:    ['VULCÃO','INFERNO','PYREX','CALDUS','MAGNAR','IGNEX','SCORCHIS','EMBRIS','THERMOX','LAVARIS','INCANDIS','FUMAREX'],
    stats:   () => gerarStats({ temp: rand(280,600), o2: rand(0,5), pressure: rand(1.8,6), water: rand(0,3), gravity: rand(0.8,1.4), radiation: rand(25,65), distance: rand(80,900) }),
    temAnel: () => Math.random() < 0.1,
    size:    () => rand(160, 380),
    alertText: 'TEMPERATURA EXTREMA\nFAZ BARULHO PARA DISSIPAR O FUMO.',
    spaceVariants: [
      { base: '#4a140b', secondary: '#84220d', accent: '#ff5a1f', dark: '#180603', atmosphere: '#ff8f47', emissive: '#ff6b21', roughness: 0.94, metalness: 0.02, bumpScale: 0.22, cloudOpacity: 0.05 },
      { base: '#5c1a0a', secondary: '#9a2810', accent: '#ff7a2f', dark: '#1e0602', atmosphere: '#ffaa60', emissive: '#ff8030', roughness: 0.96, metalness: 0.01, bumpScale: 0.26, cloudOpacity: 0.03 },
      { base: '#3d0f08', secondary: '#6b1a0a', accent: '#ff4010', dark: '#130403', atmosphere: '#ff7035', emissive: '#ff5015', roughness: 0.92, metalness: 0.03, bumpScale: 0.18, cloudOpacity: 0.07 }
    ],
    colorVariants: [
      { main: "radial-gradient(circle at 35% 35%, rgba(255,200,100,0.3) 0%, transparent 40%), radial-gradient(circle at 60% 60%, rgba(255,80,0,0.8) 0%, transparent 50%), linear-gradient(135deg, #8B1A00 0%, #FF4400 40%, #CC2200 100%)", glow: "rgba(255,80,0,0.5)", particle: "#ff6600" },
      { main: "radial-gradient(circle at 40% 40%, rgba(255,150,50,0.4) 0%, transparent 45%), linear-gradient(135deg, #6B1200 0%, #DD3300 45%, #AA1800 100%)", glow: "rgba(220,60,0,0.55)", particle: "#ff4400" },
      { main: "radial-gradient(circle at 30% 30%, rgba(255,220,80,0.25) 0%, transparent 40%), linear-gradient(135deg, #9B2200 0%, #FF6600 50%, #DD2200 100%)", glow: "rgba(255,100,20,0.5)", particle: "#ff8800" }
    ]
  },
  {
    type: 'ice', pattern: 'ice', classPrefix: 'K',
    systemNames: ['FRIGUS','GLACIUS','KRYOS','NIVALIS','GELIDUS','BOREALIS'],
    namePool:    ['GLACIA','FROSTHEIM','KRYOS','GLACIUS','NIVEUS','POLAREX','ARCTOS','CRYONIS','FRIGIDUS','GELARIS','BOREAS','ICETHORN'],
    stats:   () => gerarStats({ temp: rand(-240,-100), o2: rand(0,5), pressure: rand(0.02,0.4), water: rand(80,100), gravity: rand(0.3,0.65), radiation: rand(15,42), distance: rand(250,2500) }),
    temAnel: () => Math.random() < 0.45,
    size:    () => rand(140, 360),
    alertText: 'FRIO EXTREMO\nGELO FINO A CAIR. EVITA BARULHO.',
    spaceVariants: [
      { base: '#16345b', secondary: '#507cb0', accent: '#eef8ff', dark: '#09172c', atmosphere: '#8bd8ff', emissive: '#9fdcff', roughness: 0.72, metalness: 0.03, bumpScale: 0.14, cloudOpacity: 0.2 },
      { base: '#0d2240', secondary: '#3a6090', accent: '#d8f4ff', dark: '#060e1c', atmosphere: '#70c8ff', emissive: '#85d8ff', roughness: 0.68, metalness: 0.05, bumpScale: 0.12, cloudOpacity: 0.25 },
      { base: '#1a3d65', secondary: '#5e8cc0', accent: '#f5fbff', dark: '#0c1e35', atmosphere: '#9ee4ff', emissive: '#b0eaff', roughness: 0.75, metalness: 0.02, bumpScale: 0.16, cloudOpacity: 0.18 }
    ],
    colorVariants: [
      { main: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.4) 0%, transparent 40%), radial-gradient(circle at 60% 70%, rgba(100,150,220,0.6) 0%, transparent 50%), linear-gradient(135deg, #0a1a3a 0%, #1a3a6a 50%, #2a5a9a 100%)", glow: "rgba(100,180,255,0.4)", particle: "#88ccff" },
      { main: "radial-gradient(circle at 45% 30%, rgba(200,240,255,0.5) 0%, transparent 45%), linear-gradient(135deg, #08142e 0%, #142d5c 50%, #1e4880 100%)", glow: "rgba(140,200,255,0.45)", particle: "#aaddff" },
      { main: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.35) 0%, transparent 40%), linear-gradient(135deg, #0c1e40 0%, #204878 50%, #2e6aaa 100%)", glow: "rgba(80,160,240,0.4)", particle: "#66bbff" }
    ]
  },
  {
    type: 'radiation', pattern: 'radiation', classPrefix: 'R',
    systemNames: ['ION','RADIAX','NUCLEON','GAMMA','XENARIS','IONIS'],
    namePool:    ['RADIANTE','IONEX','NUCLEON','TOXARIS','GAMMARIX','MUTAGOR','XENON','RADIX','IONARIS','CHROMOX','GLOWMARIS','IRRADIS'],
    stats:   () => gerarStats({ temp: rand(30,110), o2: rand(0,4), pressure: rand(0.8,3.5), water: rand(2,22), gravity: rand(0.8,1.15), radiation: rand(88,100), distance: rand(400,3500) }),
    temAnel: () => Math.random() < 0.2,
    size:    () => rand(155, 370),
    alertText: 'RADIAÇÃO EXTREMA\nO MOVIMENTO REDUZ A INTERFERÊNCIA.',
    spaceVariants: [
      { base: '#23380a', secondary: '#5e2a74', accent: '#d7ff5f', dark: '#101706', atmosphere: '#7cff66', emissive: '#b0ff4c', roughness: 0.9,  metalness: 0.03, bumpScale: 0.16, cloudOpacity: 0.24 },
      { base: '#1a2e08', secondary: '#4a2060', accent: '#c8ff45', dark: '#0c1205', atmosphere: '#6aee55', emissive: '#9aef3c', roughness: 0.88, metalness: 0.04, bumpScale: 0.14, cloudOpacity: 0.28 },
      { base: '#2c4010', secondary: '#6e3080', accent: '#eaff70', dark: '#141e06', atmosphere: '#90ff78', emissive: '#c8ff60', roughness: 0.92, metalness: 0.02, bumpScale: 0.18, cloudOpacity: 0.20 }
    ],
    colorVariants: [
      { main: "radial-gradient(circle at 35% 35%, rgba(210,255,130,0.22) 0%, transparent 38%), radial-gradient(circle at 62% 58%, rgba(190,120,255,0.36) 0%, transparent 45%), linear-gradient(135deg, #152705 0%, #396f18 50%, #3a195c 100%)", glow: "rgba(170,255,90,0.5)", particle: "#c6ff5a" },
      { main: "radial-gradient(circle at 40% 40%, rgba(180,255,100,0.2) 0%, transparent 40%), radial-gradient(circle at 60% 60%, rgba(150,80,220,0.3) 0%, transparent 45%), linear-gradient(135deg, #101e04 0%, #2c5412 50%, #2c1248 100%)", glow: "rgba(140,255,70,0.45)", particle: "#b0ff40" },
      { main: "radial-gradient(circle at 30% 45%, rgba(230,255,150,0.25) 0%, transparent 42%), linear-gradient(135deg, #1a3006 0%, #447020 50%, #451660 100%)", glow: "rgba(200,255,100,0.5)", particle: "#ddff66" }
    ]
  },
  {
    type: 'lowgrav', pattern: 'lowgrav', classPrefix: 'G',
    systemNames: ['AER','LEVITAS','FLOATIS','AETHER','ZEROGRAV','SUSPENDIS'],
    namePool:    ['LEVITAS','FLOATIS','AERONIS','GRAVIX','ZERIUS','SUSPENDIS','AETHOR','DRIFTIS','LEVOS','AERTHAS','FLOATEX','NULLGRAV'],
    stats:   () => gerarStats({ temp: rand(-40,25), o2: rand(3,12), pressure: rand(0.15,0.75), water: rand(10,40), gravity: rand(0.08,0.38), radiation: rand(18,45), distance: rand(600,4500) }),
    temAnel: () => Math.random() < 0.3,
    size:    () => rand(145, 355),
    alertText: 'GRAVIDADE BAIXA\nMOVE-TE PARA FUGIRES DAS ROCHAS.',
    spaceVariants: [
      { base: '#3a2855', secondary: '#6a4a8a', accent: '#a06aff', dark: '#0f0820', atmosphere: '#c8a0ff', emissive: '#9060e0', roughness: 0.84, metalness: 0.06, bumpScale: 0.13, cloudOpacity: 0.07 },
      { base: '#2e2248', secondary: '#5a3a78', accent: '#8858ff', dark: '#0c0618', atmosphere: '#b090ee', emissive: '#7848cc', roughness: 0.82, metalness: 0.07, bumpScale: 0.11, cloudOpacity: 0.05 },
      { base: '#42305f', secondary: '#745590', accent: '#b878ff', dark: '#121025', atmosphere: '#d8b0ff', emissive: '#a070f0', roughness: 0.86, metalness: 0.05, bumpScale: 0.15, cloudOpacity: 0.09 }
    ],
    colorVariants: [
      { main: "radial-gradient(circle at 35% 35%, rgba(180,140,255,0.22) 0%, transparent 40%), radial-gradient(circle at 68% 60%, rgba(100,60,200,0.40) 0%, transparent 45%), linear-gradient(135deg, #1a0e30 0%, #4a3068 48%, #2a1845 100%)", glow: "rgba(160,100,255,0.45)", particle: "#c0a0ff" },
      { main: "radial-gradient(circle at 40% 35%, rgba(150,100,255,0.25) 0%, transparent 40%), linear-gradient(135deg, #140a28 0%, #3a2460 50%, #201440 100%)", glow: "rgba(130,80,230,0.40)", particle: "#b090ee" },
      { main: "radial-gradient(circle at 45% 40%, rgba(200,150,255,0.18) 0%, transparent 38%), linear-gradient(135deg, #200e38 0%, #5a3875 50%, #301858 100%)", glow: "rgba(180,120,255,0.42)", particle: "#d0b0ff" }
    ]
  },
  {
    type: 'ocean', pattern: 'ocean', classPrefix: 'W',
    systemNames: ['PELAGIA','AQUARIS','HYDROS','OCEANUS','NEPTIS','MARINUS'],
    namePool:    ['TALASSA','AQUARIS','PELAGUS','HYDRON','OCEANIX','MARINUS','NEPTARIS','ABYSSIS','WAVERON','AQUELOS','DEEPTIS','TIDALEX'],
    stats:   () => gerarStats({ temp: rand(2,28), o2: rand(10,20), pressure: rand(1.0,2.5), water: rand(96,100), gravity: rand(0.9,1.15), radiation: rand(8,30), distance: rand(600,5500) }),
    temAnel: () => Math.random() < 0.15,
    size:    () => rand(160, 375),
    alertText: 'ONDAS GRANDES\nINCLINA A CABEÇA PARA ACALMARES O OCEANO.',
    spaceVariants: [
      { base: '#0b4f8d', secondary: '#17a8be', accent: '#f3fdff', dark: '#03192f', atmosphere: '#6cdcff', emissive: '#46d2ff', roughness: 0.44, metalness: 0.03, bumpScale: 0.08, cloudOpacity: 0.38 },
      { base: '#083d70', secondary: '#1290a8', accent: '#e8f8ff', dark: '#021525', atmosphere: '#58ccf0', emissive: '#38c0ee', roughness: 0.40, metalness: 0.04, bumpScale: 0.06, cloudOpacity: 0.42 },
      { base: '#0e5a9a', secondary: '#20b8ca', accent: '#ffffff', dark: '#04203a', atmosphere: '#7aeaff', emissive: '#56dcff', roughness: 0.48, metalness: 0.02, bumpScale: 0.10, cloudOpacity: 0.34 }
    ],
    colorVariants: [
      { main: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.24) 0%, transparent 40%), radial-gradient(circle at 58% 68%, rgba(40,170,255,0.52) 0%, transparent 46%), linear-gradient(135deg, #072f60 0%, #0e74a5 52%, #1ab8b7 100%)", glow: "rgba(90,210,255,0.42)", particle: "#8ef1ff" },
      { main: "radial-gradient(circle at 40% 30%, rgba(200,240,255,0.3) 0%, transparent 42%), linear-gradient(135deg, #052248 0%, #0a6090 52%, #14a0a0 100%)", glow: "rgba(70,190,240,0.4)", particle: "#70e0ff" },
      { main: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.2) 0%, transparent 38%), linear-gradient(135deg, #083a70 0%, #1280b0 50%, #20c0c0 100%)", glow: "rgba(100,220,255,0.45)", particle: "#a0eeff" }
    ]
  },
  {
    type: 'desert', pattern: 'desert', classPrefix: 'D',
    systemNames: ['SICCUS','ARIDUS','SOLARIS','EREMOS','SANDARIX','DESICCIS'],
    namePool:    ['ÁRIDA','SOLARIS','EREMOS','SANDARIX','DESICCIS','ARENIX','DUNERIS','XERION','TORRIDUS','ARIDEX','SCORCHLAND','SANDHAVEN'],
    stats:   () => gerarStats({ temp: rand(45,125), o2: rand(1,8), pressure: rand(0.4,1.2), water: rand(0,5), gravity: rand(0.70,1.05), radiation: rand(20,55), distance: rand(400,4000) }),
    temAnel: () => Math.random() < 0.12,
    size:    () => rand(155, 365),
    alertText: 'TEMPESTADE DE AREIA\nFAZ MOVIMENTOS CIRCULARES COM O DEDO NO AR PARA A COMBATER.',
    spaceVariants: [
      { base: '#8b5a25', secondary: '#d39c4f', accent: '#ffd78f', dark: '#241305', atmosphere: '#ffc177', emissive: '#ffbe72', roughness: 0.95, metalness: 0.01, bumpScale: 0.18, cloudOpacity: 0.06 },
      { base: '#7a4e20', secondary: '#c08840', accent: '#ffc870', dark: '#1e0f04', atmosphere: '#ffb060', emissive: '#ffaa58', roughness: 0.97, metalness: 0.01, bumpScale: 0.20, cloudOpacity: 0.04 },
      { base: '#9a6030', secondary: '#e0aa58', accent: '#ffe8a0', dark: '#2c1506', atmosphere: '#ffd090', emissive: '#ffca80', roughness: 0.93, metalness: 0.02, bumpScale: 0.16, cloudOpacity: 0.08 }
    ],
    colorVariants: [
      { main: "radial-gradient(circle at 35% 35%, rgba(255,235,190,0.25) 0%, transparent 40%), radial-gradient(circle at 68% 60%, rgba(230,170,90,0.34) 0%, transparent 42%), linear-gradient(135deg, #5c3314 0%, #ba7b2d 50%, #e0b26b 100%)", glow: "rgba(255,190,100,0.38)", particle: "#ffd081" },
      { main: "radial-gradient(circle at 40% 40%, rgba(255,220,160,0.2) 0%, transparent 40%), linear-gradient(135deg, #4a2810 0%, #a06828 50%, #c88840 100%)", glow: "rgba(230,160,70,0.35)", particle: "#ffb855" },
      { main: "radial-gradient(circle at 30% 35%, rgba(255,245,200,0.28) 0%, transparent 42%), linear-gradient(135deg, #6a3c18 0%, #cc8c38 50%, #eeaa58 100%)", glow: "rgba(255,200,110,0.40)", particle: "#ffe090" }
    ]
  }
];

// 6 planetas por sessão
const TOTAL_PLANETAS = 6;
let sequenciaTipos = [];

// ordem dos planetas aleatória
function gerarSequenciaPlanetas() {
  const base = TIPOS_PLANETA.map((_, i) => i);
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  sequenciaTipos = base;
}
gerarSequenciaPlanetas();

function escolherTipo(index) {
  if (index < sequenciaTipos.length) return TIPOS_PLANETA[sequenciaTipos[index]];
  return TIPOS_PLANETA[Math.floor(Math.random() * TIPOS_PLANETA.length)];
}

// escolhe elemento aleatório
function escolherAleatorio(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// cria o planeta completo, nome, stats, visuais, anéis, luas e dados de cena
function gerarPlaneta(index) {
  const T = escolherTipo(index);
  const v = Math.floor(Math.random() * T.spaceVariants.length);
  const space = { pattern: T.pattern, ...T.spaceVariants[v] };
  const color = T.colorVariants[v] || T.colorVariants[0];


  // evita nomes repetidos na mesma sessão
  const nomesUsados      = planets.map(p => p.name);
  const nomesDisponiveis = T.namePool.filter(n => !nomesUsados.includes(n));
  const name           = nomesDisponiveis.length > 0 ? escolherAleatorio(nomesDisponiveis) : `${T.namePool[0]}-${index}`;

  const numClasse = Math.floor(Math.random() * 12) + 1;
  const subtitle = `CLASSE ${T.classPrefix}-${numClasse} // SISTEMA ${escolherAleatorio(T.systemNames)}`;

  // decide aleatoriamente se tem anel, anel duplo e lua
  const temAnel       = T.temAnel();
  const temAnelDuplo = temAnel && Math.random() < 0.35;
  const temLua       = T.pattern === 'lowgrav' ? true : Math.random() < 0.30;
  const ringScale1    = 1.8 + Math.random() * 0.9;
  const ringScale2    = ringScale1 + 0.3 + Math.random() * 0.4;

  // cores do anel
  const baseHex = T.spaceVariants[v].base;
  const br = parseInt(baseHex.slice(1,3), 16), bg = parseInt(baseHex.slice(3,5), 16), bb = parseInt(baseHex.slice(5,7), 16);
  const rc1 = `rgba(${Math.round(br*0.75)},${Math.round(bg*0.75)},${Math.round(bb*0.75)},0.65)`;
  const rc2 = `rgba(${Math.round(br*0.45)},${Math.round(bg*0.45)},${Math.round(bb*0.45)},0.80)`;
  const rc3 = `rgba(${Math.min(255,Math.round(br*1.15))},${Math.min(255,Math.round(bg*1.15))},${Math.min(255,Math.round(bb*1.15))},0.40)`;
  const rc4 = `rgba(${Math.round(br*0.55)},${Math.round(bg*0.55)},${Math.round(bb*0.55)},0.50)`;

  const planet = {
    name, subtitle, entered: false,
    color, space, size: Math.round(T.size()),
    temAnel, temAnelDuplo, temLua,
    ringScale1, ringScale2,
    ringColor: rc1, ringColorDark: rc2, ringColorLight: rc3, ringColorOuter: rc4,
    stats: T.stats(), alertText: T.alertText || null,
    gen: {}
  };

  gerarCaracteristicas(planet);
  return planet;
}

// lista de planetas da sessão atual — começa logo com o primeiro
let planets = [];
planets.push(gerarPlaneta(0));

let planetaAtual          = 0;
let nivelCombustivel              = 100;
let voidNestaSessao = false; // garante que o vazio aparece pelo menos uma vez

// calcula a habitabilidade do planeta
function calcHabitabilidade(stats) {
  let score = 0;
  if      (stats.temp >= 0 && stats.temp <= 40)           score += 20;
  else if (stats.temp >= -80 && stats.temp < 0)           score += 8;
  else if (stats.temp > 40 && stats.temp <= 150)          score += 8;
  if      (stats.o2 >= 19 && stats.o2 <= 23)             score += 20;
  else if (stats.o2 >= 10 && stats.o2 < 19)              score += 8;
  else if (stats.o2 > 23 && stats.o2 <= 30)              score += 5;
  if      (stats.pressure >= 0.8 && stats.pressure <= 1.2) score += 15;
  else if (stats.pressure >= 0.5 && stats.pressure <= 2)   score += 6;
  if      (stats.water >= 20 && stats.water <= 80)        score += 20;
  else if (stats.water >= 5 && stats.water < 20)          score += 6;
  else if (stats.water > 80 && stats.water <= 95)         score += 4;
  if      (stats.gravity >= 0.8 && stats.gravity <= 1.2)  score += 15;
  else if (stats.gravity >= 0.5 && stats.gravity <= 1.5)  score += 6;
  if      (stats.radiation <= 20) score += 10;
  else if (stats.radiation <= 40) score += 5;
  if (stats.distance > 1000) score = Math.min(score, 15);
  return Math.min(score, 100);
}


// cor da barra de stats
function corDaStat(type, val) {
  switch(type) {
    case 'temp':     return (val >= 0 && val <= 40) ? '#00ff88' : (val < -80 || val > 150) ? '#ff3344' : '#ff8800';
    case 'o2':       return (val >= 19 && val <= 23) ? '#00ff88' : (val < 5 || val > 30) ? '#ff3344' : '#ff8800';
    case 'pressure': return (val >= 0.8 && val <= 1.2) ? '#00ff88' : (val < 0.2 || val > 4) ? '#ff3344' : '#ff8800';
    case 'water':    return (val >= 20 && val <= 80) ? '#00d4ff' : (val < 5 || val > 95) ? '#ff3344' : '#ff8800';
    case 'gravity':  return (val >= 0.8 && val <= 1.2) ? '#00ff88' : (val < 0.3 || val > 2) ? '#ff3344' : '#ff8800';
    case 'radiation':return val <= 20 ? '#00ff88' : val > 70 ? '#ff3344' : '#ff8800';
    default: return '#00d4ff';
  }
}

// largura visual da barra de stats
function larguraDaStat(type, val) {
  switch(type) {
    case 'temp':     return Math.min(100, ((val + 200) / 700) * 100);
    case 'o2':       return Math.min(100, (val / 40) * 100);
    case 'pressure': return Math.min(100, (val / 10) * 100);
    case 'water':    return val;
    case 'gravity':  return Math.min(100, ((val - 0.1) / 2.9) * 100);
    case 'radiation':return val;
    default:         return 50;
  }
}
