const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 720;
const DATA = "jogo_processing/data/";

const imageFiles = {
  tree: "arvore.png",
  star: "estrela.png",
  insect: "inseto.png",
  trash: "lata2.png",
  obstacle: "obstaculo.png",
  charge: "recarga.png",
  robot: "robo2.png",
  special: "special.png",
  trunk: "tronco.png",
  pause: "pausa.png",
  play: "play.png",
  home: "casita.png",
};

const soundFiles = {
  menu: "menu.mp3",
  button: "botao.mp3",
  trash: "lixo.mp3",
  star: "star.mp3",
  water: "rega.wav",
  error: "erro.wav",
  level: "nivel.wav",
  gameOver: "gameover.wav",
  gameWin: "gamewin.mp3",
  background: "fundo.mp3",
  recharge: "botao.wav",
};

const images = {};
const sounds = {};
const keys = new Set();
const pointer = { x: 0, y: 0, down: false };

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let lastTime = 0;
let audioStarted = false;
let gameAudioVisible = true;
let currentMusic = null;
let currentMusicName = null;
const activeSounds = new Set();
let state = "menu";
let volume = 0.8;
let level = 1;
let score = 0;
let energy = 100;
let timeLeft = 90;
let gameOverSoundPlayed = false;
let levelSoundPlayed = false;
let winSoundPlayed = false;
let effect = null;

const robot = { x: 60, y: DESIGN_HEIGHT / 2, radius: 32, speed: 260 };
let trees = [];
let trunks = [];
let trash = [];
let obstacles = [];
let charges = [];
let star = null;
let special = null;
let insect = null;

function loadAssets() {
  Object.entries(imageFiles).forEach(([key, file]) => {
    const img = new Image();
    img.src = DATA + file;
    images[key] = img;
  });

  Object.entries(soundFiles).forEach(([key, file]) => {
    const audio = new Audio(DATA + file);
    audio.preload = "auto";
    audio.volume = volume;
    sounds[key] = audio;
  });
  sounds.menu.loop = true;
  sounds.background.loop = true;
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  scale = Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT);
  offsetX = (window.innerWidth - DESIGN_WIDTH * scale) / 2;
  offsetY = (window.innerHeight - DESIGN_HEIGHT * scale) / 2;
}

function toGamePoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left - offsetX) / scale,
    y: (event.clientY - rect.top - offsetY) / scale,
  };
}

function playSound(name) {
  if (!audioStarted || !gameAudioVisible || !sounds[name]) return;
  const sound = sounds[name].cloneNode();
  sound.volume = volume;
  activeSounds.add(sound);
  sound.addEventListener("ended", () => activeSounds.delete(sound), { once: true });
  sound.play().catch(() => {});
}

function playMusic(name) {
  if (!audioStarted || !gameAudioVisible || currentMusic === sounds[name]) return;
  stopMusic();
  currentMusic = sounds[name];
  currentMusicName = name;
  currentMusic.volume = volume * 0.55;
  currentMusic.currentTime = 0;
  currentMusic.play().catch(() => {});
}

function stopMusic(resetName = true) {
  if (resetName) {
    currentMusicName = null;
  }
  if (!currentMusic) return;
  currentMusic.pause();
  currentMusic.currentTime = 0;
  currentMusic = null;
}

function stopAllAudio() {
  stopMusic(false);
  activeSounds.forEach((sound) => {
    sound.pause();
    sound.currentTime = 0;
  });
  activeSounds.clear();
}

function syncAudioVisibility(visible) {
  gameAudioVisible = visible;
  if (!visible) {
    stopAllAudio();
    return;
  }

  if (state === "playing") {
    playMusic("background");
  } else if (state === "menu" || state === "pause") {
    playMusic("menu");
  } else if (currentMusicName) {
    playMusic(currentMusicName);
  }
}

function button(x, y, w, h, label, fill = "#ffa333", stroke = "#ff9133") {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  roundedRect(x - w / 2, y - h / 2, w, h, 24);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "32px 'Halo Dek', Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 2);
  ctx.restore();
  return { x: x - w / 2, y: y - h / 2, w, h };
}

function hitButton(b, x, y) {
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

function roundedRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function distance(a, b, c, d) {
  return Math.hypot(a - c, b - d);
}

function imageCentered(img, x, y, w, h) {
  if (img?.complete) ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
}

function imageCorner(img, x, y, w, h) {
  if (img?.complete) ctx.drawImage(img, x, y, w, h);
}

function startGame() {
  level = 1;
  score = 0;
  setupLevel();
  state = "playing";
  playSound("button");
  playMusic("background");
}

function setupLevel() {
  energy = 100;
  timeLeft = level === 1 ? 90 : level === 2 ? 70 : 55;
  robot.x = 60;
  robot.y = DESIGN_HEIGHT / 2;
  robot.speed = 260;
  effect = null;
  gameOverSoundPlayed = false;
  levelSoundPlayed = false;

  const treeCount = 6 + (level - 1) * 2;
  const trunkCount = 4 + (level - 1) * 2;
  const trashCount = 4 + (level - 1) * 2;
  const chargeCount = level === 3 ? 1 : 2;

  obstacles = Array.from({ length: 4 }, () => ({
    x: random(120, DESIGN_WIDTH - 120),
    y: random(130, DESIGN_HEIGHT - 90),
    r: random(34, 48),
  }));

  trees = Array.from({ length: treeCount }, () => ({
    x: random(90, DESIGN_WIDTH - 170),
    y: random(110, DESIGN_HEIGHT - 170),
    size: 130,
  }));

  trunks = Array.from({ length: trunkCount }, () => ({
    x: random(90, DESIGN_WIDTH - 110),
    y: random(130, DESIGN_HEIGHT - 120),
    size: 80,
    watered: false,
  }));

  trash = Array.from({ length: trashCount }, () => ({
    x: random(70, DESIGN_WIDTH - 70),
    y: random(120, DESIGN_HEIGHT - 70),
    picked: false,
  }));

  charges = Array.from({ length: chargeCount }, () => ({
    x: random(160, DESIGN_WIDTH - 160),
    y: random(180, DESIGN_HEIGHT - 140),
  }));

  star = { x: random(70, DESIGN_WIDTH - 70), y: random(120, DESIGN_HEIGHT - 70), visible: true };
  special = { x: random(70, DESIGN_WIDTH - 70), y: random(120, DESIGN_HEIGHT - 70), visible: true };
  insect = {
    cx: random(90, DESIGN_WIDTH - 90),
    cy: random(130, DESIGN_HEIGHT - 90),
    angle: random(0, Math.PI * 2),
    orbit: random(22, 48),
    visible: true,
  };
}

function updateGame(dt) {
  if (effect) {
    effect.remaining -= dt;
    if (effect.remaining <= 0) {
      if (effect.type === "star") robot.speed -= 150;
      if (effect.type === "insect") robot.speed += 90;
      effect = null;
    }
  }

  if (!effect || effect.type !== "special") {
    timeLeft -= dt;
  }
  energy = Math.max(0, energy - dt * 0.4);

  let dx = 0;
  let dy = 0;
  if (keys.has("ArrowRight")) dx += 1;
  if (keys.has("ArrowLeft")) dx -= 1;
  if (keys.has("ArrowUp")) dy -= 1;
  if (keys.has("ArrowDown")) dy += 1;
  if (dx || dy) {
    const length = Math.hypot(dx, dy);
    moveRobot((dx / length) * robot.speed * dt, (dy / length) * robot.speed * dt);
  }

  if (keys.has("r") || keys.has("R")) {
    charges.forEach((charge) => {
      if (distance(robot.x, robot.y, charge.x, charge.y) < 90) {
        energy = Math.min(100, energy + 38 * dt);
        if (Math.random() < 0.03) playSound("recharge");
      }
    });
  }

  if (keys.has(" ")) {
    trunks.forEach((trunk) => {
      if (!trunk.watered && distance(robot.x, robot.y, trunk.x, trunk.y) < 70) {
        trunk.watered = true;
        score += 10;
        energy = Math.max(0, energy - 10);
        playSound("water");
      }
    });
  }

  trash.forEach((item) => {
    if (!item.picked && distance(robot.x, robot.y, item.x, item.y) < robot.radius + 20) {
      item.picked = true;
      score += 5;
      energy = Math.max(0, energy - 10);
      playSound("trash");
    }
  });

  if (star.visible && distance(robot.x, robot.y, star.x, star.y) < 44) {
    star.visible = false;
    robot.speed += 150;
    effect = { type: "star", remaining: 5 };
    playSound("star");
  }

  if (special.visible && distance(robot.x, robot.y, special.x, special.y) < 50) {
    special.visible = false;
    effect = { type: "special", remaining: 5 };
  }

  if (insect.visible) {
    insect.angle += dt * 2.4;
    insect.x = insect.cx + Math.cos(insect.angle) * insect.orbit;
    insect.y = insect.cy + Math.sin(insect.angle) * insect.orbit;
    if (Math.random() < 0.006) {
      insect.cx = random(90, DESIGN_WIDTH - 90);
      insect.cy = random(130, DESIGN_HEIGHT - 90);
    }
    if (distance(robot.x, robot.y, insect.x, insect.y) < 32) {
      insect.visible = false;
      robot.speed = Math.max(120, robot.speed - 90);
      effect = { type: "insect", remaining: 5 };
      score -= 5;
      playSound("error");
    }
  }

  if (trash.every((item) => item.picked) && trunks.every((trunk) => trunk.watered)) {
    level += 1;
    state = "level";
    stopMusic();
    playSound("level");
  }

  if (energy <= 0 || timeLeft <= 0) {
    state = "gameover";
    stopMusic();
  }
}

function moveRobot(dx, dy) {
  const next = {
    x: Math.max(robot.radius, Math.min(DESIGN_WIDTH - robot.radius, robot.x + dx)),
    y: Math.max(95, Math.min(DESIGN_HEIGHT - robot.radius, robot.y + dy)),
  };
  const blocked = obstacles.some((obstacle) => distance(next.x, next.y, obstacle.x, obstacle.y) < obstacle.r + robot.radius);
  if (!blocked) {
    robot.x = next.x;
    robot.y = next.y;
  }
}

function drawMenu() {
  playMusic("menu");
  ctx.fillStyle = "#b65fcf";
  ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "75px 'Halo Dek', Arial";
  ctx.fillText("Robot Adventure", DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 - 180);
  button(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 - 40, 300, 80, "Play");
  button(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 + 60, 300, 80, "Exit");
  button(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 + 160, 300, 80, "How to Play");
}

function drawRules() {
  ctx.fillStyle = "#59bfff";
  ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "64px 'Halo Dek', Arial";
  ctx.fillText("Game Rules:", DESIGN_WIDTH / 2, 120);
  ctx.font = "30px 'Halo Dek', Arial";
  [
    "1. Use the arrow keys to move the robot around.",
    "2. Press R to recharge energy when close to the station.",
    "3. Collect trash and water plants by pressing space.",
    "4. Avoid obstacles and enemies to survive.",
    "5. Search for the special plant to gain more time.",
    "6. The star gives you extra speed temporarily.",
  ].forEach((line, index) => ctx.fillText(line, DESIGN_WIDTH / 2, 220 + index * 45));
  button(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 90, 300, 80, "Back to Menu", "#ff7fb4", "#b84b92");
}

function drawPlaying() {
  ctx.fillStyle = "#82a263";
  ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

  obstacles.forEach((obstacle) => imageCentered(images.obstacle, obstacle.x, obstacle.y, obstacle.r * 2, obstacle.r * 1.65));
  if (special.visible) imageCentered(images.special, special.x, special.y, 70, 70);
  trunks.forEach((trunk) => imageCentered(trunk.watered ? images.tree : images.trunk, trunk.x, trunk.y, trunk.watered ? 120 : trunk.size, trunk.watered ? 120 : trunk.size));
  trees.forEach((tree) => imageCorner(images.tree, tree.x, tree.y, tree.size, tree.size));
  charges.forEach((charge) => imageCentered(images.charge, charge.x, charge.y, 120, 120));
  if (insect.visible) imageCentered(images.insect, insect.x, insect.y, 50, 50);
  trash.forEach((item) => {
    if (!item.picked) imageCentered(images.trash, item.x, item.y, 35, 35);
  });
  if (star.visible) imageCentered(images.star, star.x, star.y, 34, 34);
  imageCentered(images.robot, robot.x, robot.y, robot.radius * 2, robot.radius * 2);
  drawHud();
}

function drawHud() {
  imageCentered(images.pause, DESIGN_WIDTH - 55, 50, 58, 58);
  ctx.fillStyle = "#ff0000";
  roundedRect(55, 25, 155, 60, 18);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "25px 'Halo Dek', Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`Time: ${Math.max(0, Math.ceil(timeLeft))}`, 80, 58);

  ctx.fillStyle = "#f5ad39";
  roundedRect(300, 25, 250, 60, 18);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(`Score: ${score}`, 425, 58);

  ctx.fillStyle = "#f2f24e";
  roundedRect(585, 25, Math.max(0, energy / 100) * 320, 60, 18);
  ctx.fill();

  const picked = trash.filter((item) => item.picked).length;
  const watered = trunks.filter((trunk) => trunk.watered).length;
  ctx.fillStyle = "#009600";
  roundedRect(930, 25, 250, 60, 18);
  ctx.fill();
  imageCentered(images.trash, 970, 55, 38, 38);
  imageCentered(images.trunk, 1080, 55, 48, 48);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.fillText(`${picked}/${trash.length}`, 995, 58);
  ctx.fillText(`${watered}/${trunks.length}`, 1105, 58);
}

function drawPause() {
  drawPlaying();
  ctx.fillStyle = "rgba(182, 95, 207, 0.94)";
  ctx.strokeStyle = "#9b4f97";
  ctx.lineWidth = 5;
  roundedRect(DESIGN_WIDTH / 2 - 330, DESIGN_HEIGHT / 2 - 230, 660, 460, 34);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "58px 'Halo Dek', Arial";
  ctx.fillText("Game Paused", DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 - 160);
  imageCentered(images.play, DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 - 20, 140, 140);
  imageCentered(images.home, DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 + 110, 80, 80);
}

function drawLevel() {
  ctx.fillStyle = "#f5ad39";
  ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "80px 'Halo Dek', Arial";
  if (level > 3) {
    if (!winSoundPlayed) {
      playSound("gameWin");
      winSoundPlayed = true;
    }
    ctx.fillText("The End!", DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 - 50);
    ctx.font = "32px 'Halo Dek', Arial";
    ctx.fillText(`Final Score: ${score}`, DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 + 30);
    button(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 + 140, 300, 80, "Back to Menu", "#ff7fb4", "#b84b92");
  } else {
    ctx.fillText("WELL DONE!", DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 - 70);
    button(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 + 60, 300, 80, `Level ${level}`, "#b47ebe", "#9e5c99");
  }
}

function drawGameOver() {
  if (!gameOverSoundPlayed) {
    playSound("gameOver");
    gameOverSoundPlayed = true;
  }
  ctx.fillStyle = "#e00000";
  ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "75px 'Halo Dek', Arial";
  ctx.fillText("Game Over!", DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 - 60);
  button(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 + 70, 300, 80, "Back to Menu", "#464646", "#000");
}

function draw() {
  ctx.save();
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#0b1018";
  ctx.fillRect(-offsetX / scale, -offsetY / scale, window.innerWidth / scale, window.innerHeight / scale);

  if (state === "menu") drawMenu();
  if (state === "rules") drawRules();
  if (state === "playing") drawPlaying();
  if (state === "pause") drawPause();
  if (state === "level") drawLevel();
  if (state === "gameover") drawGameOver();

  ctx.restore();
}

function loop(timestamp) {
  const dt = Math.min(0.04, (timestamp - lastTime) / 1000 || 0);
  lastTime = timestamp;
  if (state === "playing") updateGame(dt);
  draw();
  requestAnimationFrame(loop);
}

function handlePointerDown(event) {
  const point = toGamePoint(event);
  pointer.x = point.x;
  pointer.y = point.y;
  pointer.down = true;
  audioStarted = true;

  if (state === "menu") {
    if (hitButton({ x: DESIGN_WIDTH / 2 - 150, y: DESIGN_HEIGHT / 2 - 80, w: 300, h: 80 }, point.x, point.y)) startGame();
    else if (hitButton({ x: DESIGN_WIDTH / 2 - 150, y: DESIGN_HEIGHT / 2 + 20, w: 300, h: 80 }, point.x, point.y)) window.parent?.postMessage({ type: "game-exit" }, "*");
    else if (hitButton({ x: DESIGN_WIDTH / 2 - 150, y: DESIGN_HEIGHT / 2 + 120, w: 300, h: 80 }, point.x, point.y)) {
      state = "rules";
      playSound("button");
    }
  } else if (state === "rules") {
    if (hitButton({ x: DESIGN_WIDTH / 2 - 150, y: DESIGN_HEIGHT - 130, w: 300, h: 80 }, point.x, point.y)) {
      state = "menu";
      playSound("button");
    }
  } else if (state === "playing") {
    if (point.x > DESIGN_WIDTH - 90 && point.x < DESIGN_WIDTH - 25 && point.y > 20 && point.y < 85) {
      state = "pause";
      stopMusic();
      playMusic("menu");
      playSound("button");
    }
  } else if (state === "pause") {
    if (distance(point.x, point.y, DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 - 20) < 70) {
      state = "playing";
      stopMusic();
      playMusic("background");
      playSound("button");
    } else if (distance(point.x, point.y, DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 + 110) < 55) {
      state = "menu";
      playSound("button");
    }
  } else if (state === "level") {
    if (level > 3) {
      if (hitButton({ x: DESIGN_WIDTH / 2 - 150, y: DESIGN_HEIGHT / 2 + 100, w: 300, h: 80 }, point.x, point.y)) {
        state = "menu";
        winSoundPlayed = false;
        playSound("button");
      }
    } else if (hitButton({ x: DESIGN_WIDTH / 2 - 150, y: DESIGN_HEIGHT / 2 + 20, w: 300, h: 80 }, point.x, point.y)) {
      setupLevel();
      state = "playing";
      playSound("button");
      playMusic("background");
    }
  } else if (state === "gameover") {
    if (hitButton({ x: DESIGN_WIDTH / 2 - 150, y: DESIGN_HEIGHT / 2 + 30, w: 300, h: 80 }, point.x, point.y)) {
      level = 1;
      state = "menu";
      playSound("button");
    }
  }
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("pointerdown", handlePointerDown);
window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
  keys.add(event.key);
});
window.addEventListener("keyup", (event) => keys.delete(event.key));
window.addEventListener("message", (event) => {
  if (event.data?.type === "game-stop") {
    stopAllAudio();
    state = "menu";
  } else if (event.data?.type === "game-visibility") {
    syncAudioVisibility(Boolean(event.data.visible));
  }
});
document.addEventListener("visibilitychange", () => {
  syncAudioVisibility(!document.hidden);
});

loadAssets();
resizeCanvas();
requestAnimationFrame(loop);
