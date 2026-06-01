// cena de espaço Three.js, exterior/órbita dos planetas
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeOutExpo(t)  { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

let emTransicao   = false;
let emVazio       = false;
let cenaEspaco        = null;
let tokenPlaneta = 0;

// câmara, planetas, estrelas e entrada/saída
class SpaceScene {
  constructor(container) {
    this.container = container;
    this.active = false;
    this.baseFov = 42;
    this.duracaoViagem = 4.5;
    this.warpFactor = 0;
    this.modeBlend = 0;
    this.viewMode = 'orbit';
    this.modeTransition = null;
    this.currentGroup = null;
    this.currentPlanetData = null;
    this.currentPlanetName = null;
    this.arrival = null;
    this.travel = null;
    this.lookTarget = null;
    this.lookOffset = null;
    this.tmpVector = null;
    this.lastFrame = 0;
    this.animateBound = this.animate.bind(this);
    this.resizeBound = this.handleResize.bind(this);
  }

  // inicializa renderizador, câmara, luzes e campos de estrelas
  init() {
    if (this.active || !window.THREE) return this.active;
    const T = window.THREE;

    // renderizador WebGL
    this.renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.scene = new T.Scene();
    this.baseFogColor = new T.Color(0x02040a);
    this.baseFogDensity = 0.0028;
    this.scene.fog = new T.FogExp2(this.baseFogColor.clone(), this.baseFogDensity);

    this.camera = new T.PerspectiveCamera(this.baseFov, this.container.clientWidth / this.container.clientHeight, 0.1, 1600);
    this.camera.position.set(0, 1.2, 28);

    this.lookTarget = new T.Vector3(0, 0, -12);
    this.lookOffset = new T.Vector3(0.3, 0.15, 0);
    this.tmpVector = new T.Vector3();

    // luz
    const hemi = new T.HemisphereLight(0x78aaff, 0x040507, 0.55);
    this.scene.add(hemi);

    const ambient = new T.AmbientLight(0xa8d2ff, 0.55);
    this.scene.add(ambient);

    // luz direcional
    this.sunLight = new T.DirectionalLight(0xfff1d6, 2.5);
    this.sunLight.position.set(28, 14, 26);
    this.scene.add(this.sunLight);

    // luz de preenchimento atrás
    this.backLight = new T.PointLight(0x4fc3ff, 1.1, 180);
    this.backLight.position.set(-40, -12, -120);
    this.scene.add(this.backLight);

    // textura de brilho
    this.glowTexture = this.createGlowTexture();
    this.starField = this.createStarField(1800, 150, 900, 1.15, 1.3);
    this.scene.add(this.starField);

    window.addEventListener('resize', this.resizeBound);
    this.active = true;
    requestAnimationFrame(this.animateBound);
    return true;
  }

  reset() {
    if (!this.active) return;
    if (this.currentGroup) {
      this.scene.remove(this.currentGroup);
      this.disposeGroup(this.currentGroup);
    }
    if (this.travel && this.travel.grupoDestino) {
      this.scene.remove(this.travel.grupoDestino);
      this.disposeGroup(this.travel.grupoDestino);
    }
    this.currentGroup = null;
    this.currentPlanetData = null;
    this.currentPlanetName = null;
    this.arrival = null;
    this.travel = null;
    this.warpFactor = 0;
    this.modeBlend = 0;
    this.viewMode = 'orbit';
    this.modeTransition = null;
    this.camera.position.set(0, 1.2, 28);
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
    this.lookTarget.set(0, 0, -12);
    this.scene.fog.color.copy(this.baseFogColor);
    this.scene.fog.density = this.baseFogDensity;
  }

  handleResize() {
    if (!this.active) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // textura do brilho com gradiente
  createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(180,220,255,0.6)');
    grad.addColorStop(0.6, 'rgba(80,160,255,0.12)');
    grad.addColorStop(1, 'rgba(80,160,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new window.THREE.CanvasTexture(canvas);
    texture.colorSpace = window.THREE.SRGBColorSpace;
    return texture;
  }

  // estrelas
  createStarField(count, spread, depth, size, speedBoost) {
    const T = window.THREE;
    const geometry = new T.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const color = new T.Color();

    for (let i = 0; i < count; i++) {
      const radius = Math.sqrt(Math.random()) * spread; // raiz quadrada para distribuição uniforme em área, não em raio
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 1.45;
      positions[i * 3 + 2] = -Math.random() * depth;

      const hue = 0.54 + Math.random() * 0.12;
      const sat = 0.12 + Math.random() * 0.18;
      const light = 0.7 + Math.random() * 0.28;
      color.setHSL(hue, sat, light);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      speeds[i] = 0.55 + Math.random() * speedBoost;
    }

    geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new T.BufferAttribute(colors, 3));

    const material = new T.PointsMaterial({
      size,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: T.AdditiveBlending
    });

    const points = new T.Points(geometry, material);
    points.userData = {
      speeds,
      spread,
      depth,
      verticalSpread: spread * 1.45,
      baseSize: size,
      sizeBoost: size * 1.6
    };
    return points;
  }

  // textura do planeta com gradiente
  createSurfaceTexture(planet) {
    const T = window.THREE;
    const { space } = planet;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const rng = criarAleatorio(hashTexto(`${planet.name}-${planet.subtitle}-surface`));

    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, space.dark);
    gradient.addColorStop(0.45, space.base);
    gradient.addColorStop(1, space.secondary);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    if (space.pattern === 'lava') this.paintLavaTexture(ctx, rng, space, w, h);
    if (space.pattern === 'ice') this.paintIceTexture(ctx, rng, space, w, h);
    if (space.pattern === 'radiation') this.paintRadiationTexture(ctx, rng, space, w, h);
    if (space.pattern === 'lowgrav') this.paintLowGravityTexture(ctx, rng, space, w, h);
    if (space.pattern === 'ocean') this.paintOceanTexture(ctx, rng, space, w, h);
    if (space.pattern === 'desert') this.paintDesertTexture(ctx, rng, space, w, h);

    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    texture.wrapS = T.RepeatWrapping;
    texture.wrapT = T.ClampToEdgeWrapping;
    return texture;
  }

  createCloudTexture(planet) {
    const T = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const rng = criarAleatorio(hashTexto(`${planet.name}-clouds`));
    const w = canvas.width;
    const h = canvas.height;

    for (let i = 0; i < 38; i++) {
      const cloudColor = planet.space.pattern === 'radiation' && rng() > 0.45
          ? '#c377ff'
          : planet.space.pattern === 'desert' && rng() > 0.65
              ? '#f1cb8a'
              : planet.space.accent;
      this.drawBlob(
          ctx,
          rng() * w,
          rng() * h,
          40 + rng() * 120,
          12 + rng() * 36,
          cloudColor,
          0.08 + rng() * 0.14,
          rng() * Math.PI,
          8 + rng() * 14
      );
    }

    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    texture.wrapS = T.RepeatWrapping;
    texture.wrapT = T.ClampToEdgeWrapping;
    return texture;
  }

  // textura do anel
  createRingTexture() {
    const T = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0,   'rgba(255,255,255,0)');
    grad.addColorStop(0.15,'rgba(255,255,255,0.08)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.85)');
    grad.addColorStop(0.5, 'rgba(255,255,255,1)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.85)');
    grad.addColorStop(0.85,'rgba(255,255,255,0.08)');
    grad.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 64);

    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    return texture;
  }

  drawBlob(ctx, x, y, rx, ry, color, alpha, rotation, blur) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation || 0);
    ctx.scale(rx, ry);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    if (blur && blur > 0) {
      ctx.shadowColor = color;
      ctx.shadowBlur = blur * 1.5;
    }
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  paintLavaTexture(ctx, rng, space, w, h) {
    for (let i = 0; i < 35; i++) {
      this.drawBlob(ctx, rng() * w, rng() * h, 50 + rng() * 120, 16 + rng() * 46, '#200704', 0.24 + rng() * 0.18, rng() * Math.PI, 3);
    }

    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.moveTo(-40, rng() * h);
      for (let j = 0; j < 6; j++) {
        ctx.lineTo((j / 5) * w + rng() * 70 - 35, rng() * h);
      }
      ctx.strokeStyle = space.accent;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1.5 + rng() * 2.6;
      ctx.shadowColor = space.emissive;
      ctx.shadowBlur = 18;
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < 25; i++) {
      this.drawBlob(ctx, rng() * w, rng() * h, 18 + rng() * 44, 8 + rng() * 18, space.accent, 0.18 + rng() * 0.16, rng() * Math.PI, 10);
    }
  }

  paintIceTexture(ctx, rng, space, w, h) {
    for (let i = 0; i < 28; i++) {
      this.drawBlob(ctx, rng() * w, rng() * h, 55 + rng() * 140, 14 + rng() * 48, space.accent, 0.08 + rng() * 0.12, rng() * Math.PI, 6);
    }

    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 21; i++) {
      ctx.beginPath();
      const startY = rng() * h;
      ctx.moveTo(-30, startY);
      for (let j = 0; j < 7; j++) {
        ctx.lineTo((j / 6) * w + rng() * 60 - 30, startY + rng() * 36 - 18);
      }
      ctx.strokeStyle = '#f4fbff';
      ctx.globalAlpha = 0.16 + rng() * 0.12;
      ctx.lineWidth = 0.8 + rng() * 1.2;
      ctx.stroke();
    }
    ctx.restore();

    this.drawBlob(ctx, w * 0.18, h * 0.16, 150, 40, '#ffffff', 0.12, 0.08, 12);
    this.drawBlob(ctx, w * 0.82, h * 0.84, 170, 48, '#ffffff', 0.1, -0.08, 12);
  }

  paintToxicTexture(ctx, rng, space, w, h) {
    for (let i = 0; i < 11; i++) {
      this.drawBlob(ctx, rng() * w, rng() * h, 65 + rng() * 130, 14 + rng() * 36, space.secondary, 0.12 + rng() * 0.14, rng() * Math.PI, 8);
    }

    for (let i = 0; i < 17; i++) {
      this.drawBlob(ctx, rng() * w, rng() * h, 18 + rng() * 80, 10 + rng() * 28, space.accent, 0.08 + rng() * 0.1, rng() * Math.PI, 12);
    }

    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 22; i++) {
      ctx.beginPath();
      ctx.moveTo(-40, rng() * h);
      for (let j = 0; j < 7; j++) {
        ctx.bezierCurveTo(
            (j / 6) * w + rng() * 50 - 25,
            rng() * h,
            (j / 6) * w + rng() * 70 - 35,
            rng() * h,
            (j / 6) * w + rng() * 80 - 40,
            rng() * h
        );
      }
      ctx.strokeStyle = '#e8ff92';
      ctx.globalAlpha = 0.09 + rng() * 0.12;
      ctx.lineWidth = 2 + rng() * 3;
      ctx.shadowColor = '#d8ff66';
      ctx.shadowBlur = 12;
      ctx.stroke();
    }
    ctx.restore();
  }

  paintRadiationTexture(ctx, rng, space, w, h) {
    this.paintToxicTexture(ctx, rng, space, w, h);
    for (let i = 0; i < 16; i++) {
      this.drawBlob(ctx, rng() * w, rng() * h, 28 + rng() * 68, 10 + rng() * 20, '#b46cff', 0.08 + rng() * 0.08, rng() * Math.PI, 12);
    }
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      const y = rng() * h;
      ctx.moveTo(-30, y);
      for (let j = 0; j < 7; j++) {
        ctx.lineTo((j / 6) * w + rng() * 90 - 45, y + rng() * 40 - 20);
      }
      ctx.strokeStyle = rng() > 0.5 ? '#d9ff61' : '#c875ff';
      ctx.globalAlpha = 0.1 + rng() * 0.14;
      ctx.lineWidth = 1 + rng() * 2;
      ctx.shadowColor = '#c8ff4f';
      ctx.shadowBlur = 16;
      ctx.stroke();
    }
    ctx.restore();
  }

  paintLowGravityTexture(ctx, rng, space, w, h) {
    const dust = ctx.createLinearGradient(0, 0, 0, h);
    dust.addColorStop(0, '#687182');
    dust.addColorStop(0.55, space.base);
    dust.addColorStop(1, '#2a303a');
    ctx.fillStyle = dust;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 20; i++) {
      this.drawBlob(ctx, rng() * w, rng() * h, 30 + rng() * 90, 20 + rng() * 55, '#2e323b', 0.12 + rng() * 0.14, rng() * Math.PI, 4);
    }
    for (let i = 0; i < 14; i++) {
      this.drawBlob(ctx, rng() * w, rng() * h, 12 + rng() * 28, 12 + rng() * 28, '#aeb8c8', 0.06 + rng() * 0.07, 0, 6);
    }
    for (let i = 0; i < 9; i++) {
      this.drawBlob(ctx, rng() * w, rng() * h, 10 + rng() * 24, 10 + rng() * 24, '#8ce5ff', 0.04 + rng() * 0.06, 0, 10);
    }
  }

  paintOceanTexture(ctx, rng, space, w, h) {
    const ocean = ctx.createLinearGradient(0, 0, 0, h);
    ocean.addColorStop(0, '#0a2c63');
    ocean.addColorStop(0.45, space.base);
    ocean.addColorStop(1, '#0f7ba7');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 32; i++) {
      this.drawBlob(ctx, rng() * w, rng() * h, 85 + rng() * 180, 10 + rng() * 22, '#84ecff', 0.04 + rng() * 0.06, rng() * Math.PI, 8);
    }

    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 17; i++) {
      ctx.beginPath();
      const y = rng() * h;
      ctx.moveTo(-40, y);
      for (let j = 0; j < 8; j++) {
        ctx.quadraticCurveTo(
            (j / 7) * w + rng() * 50 - 25,
            y + rng() * 26 - 13,
            (j / 7) * w + rng() * 80 - 40,
            y + rng() * 18 - 9
        );
      }
      ctx.strokeStyle = '#dffcff';
      ctx.globalAlpha = 0.08 + rng() * 0.1;
      ctx.lineWidth = 1 + rng() * 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  paintDesertTexture(ctx, rng, space, w, h) {
    const sand = ctx.createLinearGradient(0, 0, 0, h);
    sand.addColorStop(0, '#d49a4d');
    sand.addColorStop(0.52, space.secondary);
    sand.addColorStop(1, '#7b4a1c');
    ctx.fillStyle = sand;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 85; i++) {
      this.drawBlob(ctx, rng() * w, rng() * h, 110 + rng() * 160, 10 + rng() * 24, '#f2c57a', 0.05 + rng() * 0.08, rng() * Math.PI, 8);
    }

    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 38; i++) {
      ctx.beginPath();
      const y = rng() * h;
      ctx.moveTo(-40, y);
      for (let j = 0; j < 8; j++) {
        ctx.quadraticCurveTo(
            (j / 7) * w + rng() * 50 - 25,
            y + rng() * 34 - 17,
            (j / 7) * w + rng() * 90 - 45,
            y + rng() * 26 - 13
        );
      }
      ctx.strokeStyle = rng() > 0.5 ? '#f8d58c' : '#9a5d23';
      ctx.globalAlpha = 0.08 + rng() * 0.1;
      ctx.lineWidth = 1 + rng() * 2.4;
      ctx.stroke();
    }
    ctx.restore();
  }


  // brilho à volta do planeta
  createAtmosphereMaterial(color) {
    const T = window.THREE;
    return new T.ShaderMaterial({
      uniforms: {
        glowColor: { value: new T.Color(color) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mvPosition.xyz);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          // Fresnel - o produto escalar dá 0 nas bordas, pow amplifica o efeito
          float intensidade = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.8);
          gl_FragColor = vec4(glowColor, intensidade * 0.55);
        }
      `,
      transparent: true,
      blending: T.AdditiveBlending,
      depthWrite: false,
      side: T.BackSide
    });
  }

  // gera a textura
  getPlanetAssets(planet) {
    if (!planet._spaceAssets) {
      planet._spaceAssets = {
        surface: this.createSurfaceTexture(planet),
        clouds: planet.space.cloudOpacity ? this.createCloudTexture(planet) : null,
        ring: planet.temAnel ? this.createRingTexture() : null,
      };
    }
    return planet._spaceAssets;
  }

  // cria o grupo completo - esfera, atmosfera, anel, etc.
  createPlanetGroup(planet) {
    const T = window.THREE;
    const assets = this.getPlanetAssets(planet);
    const group = new T.Group();
    const profile = planet.space;
    const escalaBase = planet.size / 210;
    const seed = hashTexto(planet.name);

    const surface = new T.Mesh(
        new T.SphereGeometry(8, 96, 96),
        new T.MeshStandardMaterial({
          map: assets.surface,
          bumpMap: assets.surface,
          bumpScale: profile.bumpScale,
          roughness: profile.roughness,
          metalness: profile.metalness,
          transparent: true,
          opacity: 1,
          emissive: new T.Color(profile.emissive),
          emissiveIntensity: profile.pattern === 'lava' ? 0.28 : profile.pattern === 'radiation' ? 0.1 : profile.pattern === 'ocean' ? 0.05 : 0.02
        })
    );
    group.add(surface);

    let clouds = null;
    if (assets.clouds) {
      clouds = new T.Mesh(
          new T.SphereGeometry(8.12, 72, 72),
          new T.MeshStandardMaterial({
            map: assets.clouds,
            alphaMap: assets.clouds,
            transparent: true,
            opacity: profile.cloudOpacity,
            roughness: 1,
            metalness: 0,
            depthWrite: false
          })
      );
      group.add(clouds);
    }

    const atmosphere = new T.Mesh(
        new T.SphereGeometry(8.6, 72, 72),
        this.createAtmosphereMaterial(profile.atmosphere)
    );
    group.add(atmosphere);

    const halo = new T.Sprite(
        new T.SpriteMaterial({
          map: this.glowTexture,
          color: new T.Color(profile.atmosphere),
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
          blending: T.AdditiveBlending
        })
    );
    halo.scale.set(26, 26, 1);
    group.add(halo);

    // anel
    let ring = null;
    if (planet.temAnel) {
      const secHex = planet.space.secondary || '#606060';
      const sr = parseInt(secHex.slice(1,3), 16);
      const sg = parseInt(secHex.slice(3,5), 16);
      const sb = parseInt(secHex.slice(5,7), 16);
      const ringTint = new T.Color(
          Math.round(sr * 0.70) / 255,
          Math.round(sg * 0.70) / 255,
          Math.round(sb * 0.70) / 255
      );
      ring = new T.Mesh(
          new T.RingGeometry(11, 16, 128),
          new T.MeshBasicMaterial({
            map: assets.ring,
            transparent: true,
            opacity: 0.85,
            color: ringTint,
            side: T.DoubleSide,
            depthWrite: false
          })
      );      ring.rotation.x = T.MathUtils.degToRad(78);
      ring.rotation.z = T.MathUtils.degToRad(10);
      group.add(ring);
    }

    group.scale.setScalar(escalaBase);
    group.rotation.z = T.MathUtils.degToRad(10 + (seed % 18));
    group.userData = {
      planet,
      planetName: planet.name,
      escalaBase,
      spinSpeed: 0.07 + ((seed % 7) * 0.008),
      phase: (seed % 360) * Math.PI / 180,
      surface,
      clouds,
      atmosphere,
      halo,
      ring,
      rest: this.getRestPosition(planet, 1)
    };
    return group;
  }

  getRestPosition(planet, direction) {
    const T = window.THREE;
    return new T.Vector3(
        direction >= 0 ? 3.1 : -3.1,
        planet.temAnel ? -0.35 : -0.9,
        -17.5 - ((planet.size - 200) * 0.03)
    );
  }

  // mostra o planeta; se não há nenhum, cria e anima a chegada; se já há, viaja para o novo
  mostrarPlaneta(planet, direction) {
    if (!this.active) return;
    this.currentPlanetData = planet;
    if (!this.currentGroup) {
      this.currentGroup = this.createPlanetGroup(planet);
      this.currentPlanetName = planet.name;
      const rest = this.getRestPosition(planet, direction || 1);
      this.currentGroup.userData.rest.copy(rest);
      this.currentGroup.position.set((direction || 1) * 8.5, -2.5, -150);
      this.currentGroup.scale.setScalar(this.currentGroup.userData.escalaBase * 0.25);
      this.scene.add(this.currentGroup);
      this.arrival = {
        group: this.currentGroup,
        from: this.currentGroup.position.clone(),
        to: rest.clone(),
        progress: 0
      };
      return;
    }

    if (this.currentPlanetName === planet.name || this.isTravelingTo(planet)) return;
    this.travelTo(planet, direction || 1);
  }

  // inicia a viagem, planeta atual sai, novo planeta entra
  travelTo(planet, direction) {
    if (!this.active || !this.currentGroup) {
      this.mostrarPlaneta(planet, direction);
      return;
    }
    if (this.isTravelingTo(planet)) return;

    const grupoSeguinte = this.createPlanetGroup(planet);
    const rest = this.getRestPosition(planet, direction);
    grupoSeguinte.userData.rest.copy(rest);
    grupoSeguinte.position.set(direction * 15, (Math.random() - 0.5) * 4, -220);
    grupoSeguinte.scale.setScalar(grupoSeguinte.userData.escalaBase * 0.22);
    this.scene.add(grupoSeguinte);

    this.travel = {
      progress: 0,
      direction,
      entryY: grupoSeguinte.position.y,
      grupoOrigem: this.currentGroup,
      grupoDestino: grupoSeguinte,
      planet,
      targetName: planet.name
    };
    this.viewMode = 'orbit';
    this.modeBlend = 0;
    this.modeTransition = null;
    this.currentPlanetName = planet.name;
  }

  isTravelingTo(planet) {
    return !!(this.travel && this.travel.targetName === planet.name);
  }

  disposeGroup(group) {
    group.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(mat => mat.dispose());
        else obj.material.dispose();
      }
    });
  }

  // atualiza o campo de estrelas
  updateField(points, dt, baseSpeed, warpBoost, resetLimit, visibilityFactor) {
    const positions = points.geometry.attributes.position.array;
    const { speeds, spread, depth, verticalSpread, baseSize, sizeBoost } = points.userData;
    const speed = baseSpeed + warpBoost;

    for (let i = 0; i < speeds.length; i++) {
      const zi = i * 3 + 2;
      positions[zi] += speed * speeds[i] * dt;
      if (positions[zi] > resetLimit) { // estrela passou a câmara — reinicia atrás
        const radius = Math.sqrt(Math.random()) * spread;
        const angle = Math.random() * Math.PI * 2;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = (Math.random() - 0.5) * verticalSpread;
        positions[zi] = -depth - Math.random() * depth * 0.4;
      }
    }

    points.geometry.attributes.position.needsUpdate = true;
    points.material.size = baseSize + this.warpFactor * sizeBoost;
    points.material.opacity = (0.8 + this.warpFactor * 0.2) * visibilityFactor;
  }

  updateGroupSpin(group, dt, elapsed) {
    if (!group) return;
    const { surface, clouds, atmosphere, halo, ring, phase, spinSpeed, rest, escalaBase} = group.userData;
    // 1 em órbita, 0 dentro do planeta
    const visibilidadeExterior = 1 - smoothstep(0.08, 0.34, this.modeBlend);
    if (surface) surface.rotation.y += dt * spinSpeed;
    if (clouds) clouds.rotation.y += dt * (spinSpeed * 1.4);
    if (surface) {
      surface.material.opacity = visibilidadeExterior;
      surface.visible = visibilidadeExterior > 0.025;
    }
    if (clouds) {
      clouds.material.opacity = group.userData.planet.space.cloudOpacity * visibilidadeExterior;
      clouds.visible = visibilidadeExterior > 0.025;
    }
    if (atmosphere) atmosphere.visible = visibilidadeExterior > 0.08;
    if (halo) {
      halo.material.opacity = (0.22 + Math.sin(elapsed * 1.1 + phase) * 0.03 + this.warpFactor * 0.1) * visibilidadeExterior;
      halo.visible = visibilidadeExterior > 0.025;
    }
    if (ring) {
      ring.material.opacity = 0.9 * visibilidadeExterior;
      ring.visible = visibilidadeExterior > 0.04;
    }

    if (!this.travel && !this.arrival) {
      group.position.x = rest.x + Math.sin(elapsed * 0.22 + phase) * 0.55;
      group.position.y = rest.y + Math.cos(elapsed * 0.18 + phase * 0.7) * 0.32;
      group.position.z = rest.z + Math.sin(elapsed * 0.12 + phase) * 0.65;
      group.scale.setScalar(escalaBase);
    }
  }

  // ciclo principal do Three.js
  animate(time) {
    if (!this.active) return;
    const dt = Math.min(0.05, ((time - this.lastFrame) || 16) / 1000);
    this.lastFrame = time;
    const elapsed = time / 1000;
    estadoRato.dx *= 0.92;
    estadoRato.dy *= 0.92;
    estadoRato.speed *= 0.94;
    estadoRato.spin *= 0.96;

    let alvoWarp = 0;

    // transição entre órbita e interior
    if (this.modeTransition) {
      this.modeTransition.progress = Math.min(1, this.modeTransition.progress + dt / this.modeTransition.duration);
      const eased = easeOutCubic(this.modeTransition.progress);
      this.modeBlend = this.modeTransition.type === 'enter' ? eased : 1 - eased;

      if (this.modeTransition.progress >= 1) {
        this.viewMode = this.modeTransition.type === 'enter' ? 'interior' : 'orbit';
        this.modeTransition = null;
        sincronizarUI();
      }
    } else {
      const blendAlvo = this.viewMode === 'interior' ? 1 : 0;
      this.modeBlend = lerp(this.modeBlend, blendAlvo, Math.min(1, dt * 4));
    }

    // animação de chegada
    if (this.arrival && this.arrival.group) {
      this.arrival.progress = Math.min(1, this.arrival.progress + dt / 1.9);
      const p = easeOutExpo(this.arrival.progress);
      const group = this.arrival.group;
      group.position.set(
          lerp(this.arrival.from.x, this.arrival.to.x, p),
          lerp(this.arrival.from.y, this.arrival.to.y, p),
          lerp(this.arrival.from.z, this.arrival.to.z, p)
      );
      group.scale.setScalar(lerp(group.userData.escalaBase * 0.25, group.userData.escalaBase, p));
      alvoWarp = (1 - this.arrival.progress) * 0.45;

      if (this.arrival.progress >= 1) {
        this.arrival = null;
        sincronizarUI();
      }
    }

    // animação de viagem
    if (this.travel) {
      this.travel.progress = Math.min(1, this.travel.progress + dt / this.duracaoViagem);
      const p = this.travel.progress;
      const depart = smoothstep(0, 0.42, p);
      const arrive = easeOutCubic(smoothstep(0.26, 1, p));
      const grupoOrigem = this.travel.grupoOrigem;
      const grupoDestino = this.travel.grupoDestino;
      const repousoOrigem = grupoOrigem.userData.rest;
      const repousoDestino = grupoDestino.userData.rest;
      const escalaOrigem = grupoOrigem.userData.escalaBase;
      const escalaDestino = grupoDestino.userData.escalaBase;
      // curva de viagem
      alvoWarp = Math.pow(Math.sin(Math.PI * clamp((p - 0.03) / 0.94, 0, 1)), 1.35);

      grupoOrigem.position.set(
          lerp(repousoOrigem.x, -this.travel.direction * 10.5, depart),
          lerp(repousoOrigem.y, repousoOrigem.y + 1.8, depart),
          lerp(repousoOrigem.z, 70, depart)
      );
      grupoOrigem.scale.setScalar(lerp(escalaOrigem, escalaOrigem * 0.45, depart));
      grupoOrigem.visible = depart < 0.98;

      grupoDestino.position.set(
          lerp(this.travel.direction * 15, repousoDestino.x, arrive),
          lerp(this.travel.entryY, repousoDestino.y, arrive),
          lerp(-220, repousoDestino.z, easeOutExpo(arrive))
      );
      grupoDestino.scale.setScalar(lerp(escalaDestino * 0.22, escalaDestino, arrive));

      if (p >= 1) {
        this.scene.remove(grupoOrigem);
        this.disposeGroup(grupoOrigem);
        this.currentGroup = grupoDestino;
        this.currentPlanetData = this.travel.planet;
        this.travel = null;
        sincronizarUI();
      }
    }

    // suaviza a viagem para evitar mudanças bruscas na velocidade das estrelas
    this.warpFactor = lerp(this.warpFactor, alvoWarp, Math.min(1, dt * 4));

    const visibilidadeEspaco = 1 - smoothstep(0.04, 0.6, this.modeBlend);
    this.updateField(this.starField, dt, 10, 250 * this.warpFactor, 50, visibilidadeEspaco);
    this.updateGroupSpin(this.currentGroup, dt, elapsed);
    if (this.travel) this.updateGroupSpin(this.travel.grupoDestino, dt, elapsed + 0.4);

    const grupoAlvo = this.travel ? this.travel.grupoDestino : this.currentGroup;
    const camX = Math.sin(elapsed * 0.16) * 0.8 + this.warpFactor * 1.2;
    const camY = 1.15 + Math.cos(elapsed * 0.22) * 0.35;
    const camZ = 28 - this.warpFactor * 6.5;
    const T3 = window.THREE;
    const cameraDesejada = new T3.Vector3(camX, camY, camZ);
    const posicaoFallback = new T3.Vector3(0, 0, -14);
    const olharDesejado = (grupoAlvo ? grupoAlvo.position.clone() : posicaoFallback).clone().add(this.lookOffset);
    let fovDesejado = this.baseFov + this.warpFactor * 18;

    this.scene.fog.color.copy(this.baseFogColor);
    this.scene.fog.density = this.baseFogDensity;

    this.lookTarget.lerp(olharDesejado, Math.min(1, dt * 2.8));
    this.camera.position.x = lerp(this.camera.position.x, cameraDesejada.x, Math.min(1, dt * 2.5));
    this.camera.position.y = lerp(this.camera.position.y, cameraDesejada.y, Math.min(1, dt * 2.5));
    this.camera.position.z = lerp(this.camera.position.z, cameraDesejada.z, Math.min(1, dt * 3.5));
    this.camera.fov = lerp(this.camera.fov, fovDesejado, Math.min(1, dt * 4));
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.lookTarget);

    this.sunLight.intensidade = 2.5 + this.warpFactor * 0.7;
    atualizarGlitch();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animateBound);
  }
}

function iniciarCenaEspaco() {
  if (cenaEspaco) return cenaEspaco.active;
  const container = $('spaceRender');
  if (!container || !window.THREE) return false;
  cenaEspaco = new SpaceScene(container);
  const ready = cenaEspaco.init();
  if (ready) $('cockpit-screen').classList.add('three-active');
  return ready;
}
