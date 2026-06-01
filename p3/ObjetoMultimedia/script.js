const scenes = Array.from(document.querySelectorAll('.scene'));
const fullscreenToggle = document.querySelector('.fullscreen-toggle');
const introSceneIndex = scenes.findIndex(scene => scene.classList.contains('scene-gif-intro'));
const introTextSceneIndex = scenes.findIndex(scene => scene.classList.contains('scene-intro-text'));
const introVideo = document.querySelector('.scene-gif-intro__media');
const introLine = document.querySelector('.intro-line');
const clockButton = document.querySelector('.clock-button');
const hiddenGif = document.querySelector('.hidden-gif');
const baseGif = document.querySelector('.base-gif');
const bloodVideo = document.querySelector('.blood-video');
const fornoScene = document.querySelector('.scene-forno');
const comprasScene = document.querySelector('.scene-compras');
const comprasVideo = document.querySelector('.compras-video');
const telefoneScene = document.querySelector('.scene-telefone');
const telefoneVideo = document.querySelector('.telefone-video');
const refeicaoScene = document.querySelector('.scene-refeicao');
const refeicaoVideo = document.querySelector('.refeicao-video');
const investigarScene = document.querySelector('.scene-investigar');
const investigarVideo = document.querySelector('.investigar-video');
const meatScene = document.querySelector('.scene-meat');
const risoScene = document.querySelector('.scene-riso');
const risoVideo = document.querySelector('.riso-video');
const endScene = document.querySelector('.scene-end');
const endVideo = endScene?.querySelector('video');
const restartButton = document.querySelector('.restart-button');
const lambInviteScene = document.querySelector('.scene-lamb-invite');
const blurIntroText = document.querySelector('.scene-blur-intro p');
const timerAudio = document.getElementById('timerAudio'); // som do timer
const fimVideo = document.querySelector('video[src*="fim.mp4"]');
const tituloVideo = document.getElementById('tituloVideo');
const cena2Video = document.querySelector('.cena2-video');
const hoverGrowText = document.querySelector('.hover-grow-text');
const pernilVideo = document.getElementById('pernilVideo');
const pernilScene = pernilVideo?.closest('.scene');
const deadScene = document.querySelector('.scene-dead');
const deadOverlay = deadScene?.querySelector('.dead-overlay');
const deadPointerTarget = deadOverlay || deadScene;
const balaoGif = document.querySelector('.balao-gif');
const balaoRefeicao1 = document.querySelector('.balao-refeicao-1');
const balaoRefeicao2 = document.querySelector('.balao-refeicao-2');
const startOverlay = document.querySelector('.start-overlay');
const fullscreenCornerHint = document.querySelector('.fullscreen-corner-hint');
const scrollHint = document.querySelector('.scroll-hint');
const introArrow = document.querySelector('.intro-arrow');
const risoArrow = document.querySelector('.riso-arrow');
const circleScene = document.querySelector('.scene-text-invert');
const getCircleDeadWord = () => document.querySelector('.circle-dead');
const maryAudio = document.getElementById('maryAudio');
const clockAudio = document.getElementById('clockAudio');
const tricotarAudio = document.getElementById('tricotarAudio');
const batidaAudio = document.getElementById('batidaAudio');
const fornoAudio = document.getElementById('fornoAudio');
const supermercadoAudio = document.getElementById('supermercadoAudio');
const carrinhoAudio = document.getElementById('carrinhoAudio');
const carroAudio = document.getElementById('carroAudio');
const tensaoAudio = document.getElementById('tensaoAudio');
const tensao1Audio = document.getElementById('tensao1Audio');
const tensao2Audio = document.getElementById('tensao2Audio');
const portaAudio = document.getElementById('portaAudio');
const baterAudio = document.getElementById('baterAudio');
const ouvidoAudio = document.getElementById('ouvidoAudio');
const comidaAudio = document.getElementById('comidaAudio');
const comida1Audio = document.getElementById('comida1Audio');
const comida2Audio = document.getElementById('comida2Audio');
const creepyAudio = document.getElementById('creepyAudio');
const dingAudio = document.getElementById('dingAudio');
const winkAudio = document.getElementById('winkAudio');
const audioFadeRafs = new Map();
const audioElements = [
    maryAudio,
    clockAudio,
    tricotarAudio,
    batidaAudio,
    fornoAudio,
    timerAudio,
    supermercadoAudio,
    carrinhoAudio,
    carroAudio,
    tensaoAudio,
    tensao1Audio,
    tensao2Audio,
    portaAudio,
    baterAudio,
    ouvidoAudio,
    comidaAudio,
    comida1Audio,
    comida2Audio,
    creepyAudio,
    dingAudio,
    winkAudio,
].filter(Boolean);
let audioUnlocked = false;
const unlockingAudios = new WeakSet();

const clampVolume = (value = 0) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return 0;
    return Math.min(1, Math.max(0, value));
};

const setVolumeSafe = (audio, value) => {
    if (!audio) return;
    audio.volume = clampVolume(value);
};

const safePlay = (media) => {
    if (!media) return Promise.resolve();
    unlockingAudios.delete(media);
    const playPromise = media.play();
    if (playPromise instanceof Promise) {
        return playPromise.catch((error) => {
            console.warn('Não foi possível reproduzir media:', media.id || media.currentSrc || media.src || media.className, error);
        });
    }
    return Promise.resolve();
};

const unlockAudio = () => {
    if (audioUnlocked) return;
    audioUnlocked = true;

    audioElements.forEach(audio => {
        if (!audio || !audio.paused) return;
        audio.preload = 'auto';
        const previousVolume = audio.volume;
        const previousMuted = audio.muted;
        audio.volume = 0;
        audio.muted = false;
        unlockingAudios.add(audio);
        const playPromise = audio.play();
        if (playPromise instanceof Promise) {
            playPromise
                .then(() => {
                    if (!unlockingAudios.has(audio)) return;
                    unlockingAudios.delete(audio);
                    audio.pause();
                    audio.currentTime = 0;
                    audio.volume = previousVolume;
                    audio.muted = previousMuted;
                })
                .catch(() => {
                    unlockingAudios.delete(audio);
                    audio.volume = previousVolume;
                    audio.muted = previousMuted;
                });
        } else {
            unlockingAudios.delete(audio);
            audio.pause();
            audio.currentTime = 0;
            audio.volume = previousVolume;
            audio.muted = previousMuted;
        }
    });
};

['pointerdown', 'touchstart', 'keydown'].forEach(eventName => {
    window.addEventListener(eventName, unlockAudio, { once: true, passive: true });
});

const attachCircleDeadFall = () => {
    const el = getCircleDeadWord();
    if (!el || el.dataset.fallAttached === 'true') return;
    const dropWord = () => {
        if (el.classList.contains('is-fallen')) return;
        el.classList.add('is-fallen');
    };
    el.addEventListener('animationend', (evt) => {
        if (evt.animationName !== 'deadHang') return;
        dropWord();
    });
    el.dataset.fallAttached = 'true';
};

const clearRefeicaoBalaoTimers = () => {
    if (refeicaoBalao1Timeout) {
        clearTimeout(refeicaoBalao1Timeout);
        refeicaoBalao1Timeout = null;
    }
    if (refeicaoBalao2Timeout) {
        clearTimeout(refeicaoBalao2Timeout);
        refeicaoBalao2Timeout = null;
    }
};

const resetRefeicaoBaloes = () => {
    clearRefeicaoBalaoTimers();
    refeicaoBaloesStarted = false;
    [balaoRefeicao1, balaoRefeicao2].forEach(el => {
        if (el) el.classList.remove('is-active');
    });
};

const startRefeicaoBaloes = () => {
    if (refeicaoBaloesStarted) return;
    refeicaoBaloesStarted = true;
    if (balaoRefeicao1) {
        balaoRefeicao1Timeout = setTimeout(() => {
            balaoRefeicao1?.classList.add('is-active');
            balaoRefeicao1Timeout = null;
        }, 2000);
    }
    if (balaoRefeicao2) {
        balaoRefeicao2Timeout = setTimeout(() => {
            balaoRefeicao2?.classList.add('is-active');
            balaoRefeicao2Timeout = null;
        }, 4000);
    }
};

const playOvenDingAudio = () => {
    if (!dingAudio) return;
    dingAudio.currentTime = 0;
    safePlay(dingAudio);
    const ovenWordEl = document.querySelector('.lamb-oven-word');
    if (ovenWordEl) {
        ovenWordEl.classList.add('is-jumping');
        setTimeout(() => {
            ovenWordEl.classList.remove('is-jumping');
        }, 220);
    }
};

const attachLambOvenHover = () => {
    const ovenEl = document.querySelector('.lamb-oven-word');
    if (!ovenEl || ovenEl.dataset.dingAttached === 'true') return;
    ['pointerenter', 'pointerdown'].forEach(evt => {
        ovenEl.addEventListener(evt, playOvenDingAudio);
    });
    ovenEl.dataset.dingAttached = 'true';
};

if (portaAudio) {
    setVolumeSafe(portaAudio, 0.35); 
}

if (dingAudio) {
    setVolumeSafe(dingAudio, 0.75);
}

if (ouvidoAudio) {
    setVolumeSafe(ouvidoAudio, 0.7);
}

const DEFAULT_PHRASES = {
    startOverlay: 'Go full screen to start. Interact with objects and text to improve your experience',
    smallScreen: 'This website cannot be viewed at this screen size. Please use a larger display.',
    introLine: 'Mary Maloney was waiting for her husband to come home from work.',
    listenLine: '“Listen,” he said, “I’ve got something to tell you.”',
    hoverGrow: 'At that point, Mary Maloney simply walked up behind him and without any pause she swung the big frozen leg of lamb',
    blurIntro: "All right, she told herself. So I've killed him",
    thoughts: {
        1: 'He didn’t deserve this…',
        2: 'But what else could I do?',
        3: 'Stay calm, Mary. Stay calm.',
        4: 'Keep your voice steady.',
        5: 'Hide the trembling hands.',
        6: 'They can’t suspect a thing.',
        7: 'Remember your story.',
        8: 'Smile, don’t shake.',
        9: 'The oven will cover it.',
        10: 'Serve it before it cools.',
        11: 'Keep breathing. Keep smiling.',
        12: 'Hide the lamb. Hide the truth.',
        13: 'Footsteps—are they closer?',
        14: 'Smile wider, breathe slower.',
        15: 'Keep talking. Keep talking.',
    },
    meatMelt: 'She carried the meat into the kitchen, placed it in a pan, turned the oven on high, and shoved it inside.',
    flickerText: 'It wasn’t six o’clock yet and the lights were still on in the grocery shop.',
    deadParagraph: '“Quick! Come quick! Patrick’s dead!” “Who’s speaking?” “Mrs Maloney. Mrs Patrick Maloney.”',
    circleText: '“Is he dead?” she cried. “I’m afraid he is. What happened?”',
    lambInvite: 'Why don’t you eat up that lamb that’s in the oven? It’ll be cooked just right by now.”',
    giggleText: 'And in the other room, Mary Maloney began to giggle.',
};

const applyPhrases = (phrases) => {
    const setText = (selector, text, onSet) => {
        if (typeof text !== 'string') return;
        const el = document.querySelector(selector);
        if (!el) return;
        el.textContent = text;
        if (typeof onSet === 'function') {
            onSet(el, text);
        }
    };

    setText('.start-overlay__text', phrases?.startOverlay);
    setText('.small-screen-message', phrases?.smallScreen);
    setText('.intro-line', phrases?.introLine);
    setText('.listen-line', phrases?.listenLine);
    setText('.hover-grow-text', phrases?.hoverGrow);
    setText('.scene-blur-intro p', phrases?.blurIntro);

    document.querySelectorAll('.thought').forEach(thought => {
        const match = Array.from(thought.classList).find(cls => cls.startsWith('thought-'));
        const idx = match ? match.split('-')[1] : null;
        const text = idx ? phrases?.thoughts?.[idx] : null;
        if (typeof text === 'string') {
            thought.textContent = text;
        }
    });

    setText('.meat-melt-text', phrases?.meatMelt, (el, text) => {
        el.setAttribute('data-text', text);
    });

    setText('.flicker-text', phrases?.flickerText);
    setText('.scene-dead p', phrases?.deadParagraph);
    const circleEl = document.querySelector('.circle-text');
    if (circleEl && typeof phrases?.circleText === 'string') {
        circleEl.innerHTML = phrases.circleText.replace(/dead/i, '<span class="circle-dead">$&</span>');
        attachCircleDeadFall();
    }
    const setLambInviteText = (text) => {
        const el = lambInviteScene?.querySelector('p');
        if (!el || typeof text !== 'string') return;
        const ovenWrapped = text.replace(/oven/i, '<span class="lamb-oven-trigger"><span class="lamb-oven-word">$&</span></span>');
        el.innerHTML = ovenWrapped;
        attachLambOvenHover();
    };
    setLambInviteText(phrases?.lambInvite);
    setText('.giggle-text', phrases?.giggleText);
    setText('.animation-placeholder', phrases?.animationPlaceholder);
};

applyPhrases(DEFAULT_PHRASES);

const loadPhrases = async () => {
    try {
        const response = await fetch('frases.json', { cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(`Erro ao obter frases (${response.status})`);
        }
        const phrases = await response.json();
        applyPhrases(phrases);
    } catch (error) {
        console.warn('Não foi possível carregar frases.json', error);
    }
};

loadPhrases();

let introVideoPlayed = false;
let currentScene = -1;
let introLineHasEntered = false;
let hasSwappedToSecond = false;
let hasPlayedBloodVideo = false;
let hasPlayedFimVideo = false;
let hasAlignedFimSection = false;
let hasAlignedCena2 = false;
let hasAlignedPernil = false;
let hasAlignedCompras = false;
let hasAlignedTelefone = false;
let hasAlignedRefeicao = false;
let hasAlignedRiso = false;
let comprasScrollLocked = false;
let telefoneScrollLocked = false;
let refeicaoScrollLocked = false;
let refeicaoPlaybackStarted = false;
let lambInviteDingPlayed = false;
let scrollLocked = false;
let lastScrollY = window.scrollY;
let tituloVideoStarted = false;
let hasStartedCarAudio = false;
let carAudioStartTimeout = null;
let carAudioStopTimeout = null;
let hasStartedTensaoAudio = false;
let hasPlayedPortaAudio = false;
let portaAudioTimeout = null;
let hoverGrowRaf = null;
let hoverGrowScale = 1;
let hasStartedPernilVideo = false;
let hasPlayedPretoClip = false;
let baterTimeout = null;
let tensaoOuvidoFadeTimeout = null;
let pretoScrollTimeout = null;
let hasAutoScrolledFromPreto = false;
let pernilScrollLocked = false;
let investigarScrollLocked = false;
let suppressThoughts = false;
let introBlurRaf = null;
let introPointerPos = null;
let hoverShakeIntensity = 1;
let pernilBaterTimeout = null;
let deadIntervalId = null;
let lockBatidaUntilTelefone = false;
let refeicaoAudiosActive = false;
let comprasAudiosActive = false;
let carrinhoStopTimeout = null;
let fornoAudiosActive = false;
let refeicaoBalao1Timeout = null;
let refeicaoBalao2Timeout = null;
let hasAlignedInvestigar = false;
let hasStartedInvestigarVideo = false;
let investigatingCreepy = false;
let hasBouncedGiggle = false;
let balaoShowTimeout = null;
let balaoHideTimeout = null;
let hasShownBalao = false;
let telefoneUnlockTimeout = null;
let telefonePlaybackStarted = false;
let introBlurInteractive = false;
let introBlurFocusTimeout = null;
let introBlurEnableTimeout = null;
let startOverlayHidden = false;
let minScrollY = 0;
let lastTouchY = null;
let introScrollLocked = true;
let introArrowTimeout = null;
let hasStartedRisoVideo = false;
let risoWinkTimeout = null;
let risoArrowVisible = false;
let deadOverlayListenersAttached = false;
let hasHungCircleDead = false;
let endScrollLocked = false;
let risoScrollLocked = false;
let risoUnlockTimeout = null;
let activeVideoLocks = 0;
let scrollHintTimeout = null;
let refeicaoUnlockTimeout = null;
let refeicaoBaloesStarted = false;
let introBlurSequenceStarted = false;

const lockVideoScroll = () => {
    if (activeVideoLocks === 0) {
        document.body.classList.add('no-scroll');
    }
    activeVideoLocks += 1;
};

const unlockVideoScroll = () => {
    activeVideoLocks = Math.max(0, activeVideoLocks - 1);
    if (activeVideoLocks === 0) {
        document.body.classList.remove('no-scroll');
    }
};

const randomizeThoughtSizes = () => {
    const thoughts = document.querySelectorAll('.thought');
    thoughts.forEach(thought => {
        const minRem = 2.6 + Math.random() * 2.2; // 2.6–4.8
        const maxRem = minRem + 1.1 + Math.random() * 1.3; // 3.7–6.1
        const midVw = (4.2 + Math.random() * 2).toFixed(2);
        thought.style.setProperty('--thought-size', `clamp(${minRem.toFixed(2)}rem, ${midVw}vw, ${maxRem.toFixed(2)}rem)`);
    });
};

const lockScrollAhead = (scene) => {
    const targetY = scene ? scene.getBoundingClientRect().top + window.scrollY : window.scrollY;
    const lockY = Math.max(minScrollY, targetY - 8);
    setTimeout(() => {
        minScrollY = Math.max(minScrollY, lockY);
    }, 400);
};

const clearIntroArrow = () => {
    if (introArrowTimeout) {
        clearTimeout(introArrowTimeout);
        introArrowTimeout = null;
    }
    if (introArrow) {
        introArrow.classList.remove('is-visible');
    }
};

const scheduleIntroArrow = () => {
    if (!introArrow || hasSwappedToSecond) return;
    clearIntroArrow();
    introArrowTimeout = setTimeout(() => {
        introArrow?.classList.add('is-visible');
        introArrowTimeout = null;
    }, 2000);
};

const preventScrollUp = (evt) => {
    const nearMin = window.scrollY <= minScrollY + 6;
    if (!nearMin) return;
    const deltaY = evt.deltaY;
    if (typeof deltaY === 'number' && deltaY < 0) {
        evt.preventDefault();
        window.scrollTo(0, minScrollY);
    }
};

const preventTouchScrollUp = (evt) => {
    if (!evt.touches || evt.touches.length === 0) return;
    const currentY = evt.touches[0].clientY;
    if (lastTouchY === null) {
        lastTouchY = currentY;
        return;
    }
    const movingDown = currentY > lastTouchY;
    lastTouchY = currentY;
    if (movingDown && window.scrollY <= minScrollY + 2) {
        evt.preventDefault();
        window.scrollTo(0, minScrollY);
    }
};

window.addEventListener('wheel', preventScrollUp, { passive: false });
window.addEventListener('touchmove', preventTouchScrollUp, { passive: false });
window.addEventListener('touchend', () => { lastTouchY = null; }, { passive: true });

const preventInitialScroll = (evt) => {
    if (!introScrollLocked) return;
    evt.preventDefault();
    window.scrollTo(0, 0);
};

['wheel', 'touchmove'].forEach(evtName => {
    window.addEventListener(evtName, preventInitialScroll, { passive: false });
});


if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

const sceneVisibility = new Map();
scenes.forEach(scene => sceneVisibility.set(scene, 0));

const isFullscreen = () => document.fullscreenElement || document.webkitFullscreenElement;

const requestFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) return element.requestFullscreen();
    if (element.webkitRequestFullscreen) return element.webkitRequestFullscreen();
    return Promise.resolve();
};

const exitFullscreen = () => {
    if (document.exitFullscreen) return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    return Promise.resolve();
};

const hideStartOverlay = () => {
    if (!startOverlay || startOverlayHidden) return;
    startOverlay.classList.add('is-hidden');
    startOverlay.setAttribute('aria-hidden', 'true');
    startOverlayHidden = true;
    introScrollLocked = false;
};

const hideFullscreenHint = () => {
    if (!fullscreenCornerHint) return;
    fullscreenCornerHint.classList.add('is-hidden');
};

const showScrollHint = () => {
    if (!scrollHint) return;
    scrollHint.classList.add('is-visible');
};

const scheduleScrollHint = () => {
    if (!scrollHint) return;
    if (scrollHintTimeout) {
        clearTimeout(scrollHintTimeout);
        scrollHintTimeout = null;
    }
    scrollHintTimeout = setTimeout(() => {
        showScrollHint();
        scrollHintTimeout = null;
    }, 5000);
};

const fadeAudioElement = (audio, targetVolume, { duration = 700, stopAfter = false } = {}) => {
    if (!audio) return;

    const existing = audioFadeRafs.get(audio);
    if (existing) cancelAnimationFrame(existing);

    const startVolume = clampVolume(audio.volume);
    const safeTarget = clampVolume(targetVolume);
    audio.volume = startVolume;
    const startTime = performance.now();

    const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const nextVolume = startVolume + (safeTarget - startVolume) * progress;
        audio.volume = clampVolume(nextVolume);

        if (progress < 1) {
            const rafId = requestAnimationFrame(step);
            audioFadeRafs.set(audio, rafId);
        } else {
            if (stopAfter) {
                audio.pause();
                audio.currentTime = 0;
            }
            audioFadeRafs.delete(audio);
        }
    };

    const rafId = requestAnimationFrame(step);
    audioFadeRafs.set(audio, rafId);
};

const startComprasAudio = () => {
    if (comprasAudiosActive) return;
    comprasAudiosActive = true;
    if (supermercadoAudio) {
        supermercadoAudio.loop = true;
        if (supermercadoAudio.paused) {
            setVolumeSafe(supermercadoAudio, 0);
            safePlay(supermercadoAudio);
        }
        fadeAudioElement(supermercadoAudio, 0.12, { duration: 700 });
    }
    if (carrinhoAudio) {
        carrinhoAudio.loop = true;
        carrinhoAudio.muted = false;
        carrinhoAudio.currentTime = 0;
        setVolumeSafe(carrinhoAudio, 0);
        safePlay(carrinhoAudio);
        fadeAudioElement(carrinhoAudio, 0.55, { duration: 700 });
        if (carrinhoStopTimeout) {
            clearTimeout(carrinhoStopTimeout);
        }
        carrinhoStopTimeout = setTimeout(() => {
            fadeAudioElement(carrinhoAudio, 0, { duration: 600, stopAfter: true });
            carrinhoStopTimeout = null;
        }, 3000);
    }
};

const startRefeicaoAudio = () => {
    if (refeicaoAudiosActive) return;
    refeicaoAudiosActive = true;
    [comidaAudio, comida1Audio, comida2Audio].forEach((audio, idx) => {
        if (!audio) return;
        audio.loop = true;
        if (audio.paused) {
            audio.currentTime = 0;
            setVolumeSafe(audio, 0);
            safePlay(audio);
        }
        const target = idx === 0 ? 0.18 : 0.8;
        fadeAudioElement(audio, target, { duration: 700 });
    });
};

const stopRefeicaoAudio = () => {
    if (!refeicaoAudiosActive) return;
    [comidaAudio, comida1Audio, comida2Audio].forEach((audio) => {
        if (!audio) return;
        fadeAudioElement(audio, 0, { duration: 800, stopAfter: true });
    });
    refeicaoAudiosActive = false;
};

const startCreepy = () => {
    if (!creepyAudio || investigatingCreepy) return;
    investigatingCreepy = true;
    creepyAudio.loop = true;
    if (creepyAudio.paused) {
        creepyAudio.currentTime = 0;
        setVolumeSafe(creepyAudio, 0);
        safePlay(creepyAudio);
    }
    fadeAudioElement(creepyAudio, 0.6, { duration: 700 });
};

const stopCreepy = () => {
    if (!creepyAudio || !investigatingCreepy) return;
    fadeAudioElement(creepyAudio, 0, { duration: 800, stopAfter: true });
    investigatingCreepy = false;
};

const stopComprasAudio = () => {
    if (!comprasAudiosActive) return;
    comprasAudiosActive = false;
    if (carrinhoStopTimeout) {
        clearTimeout(carrinhoStopTimeout);
        carrinhoStopTimeout = null;
    }
    if (supermercadoAudio) {
        fadeAudioElement(supermercadoAudio, 0, { duration: 700, stopAfter: true });
    }
    if (carrinhoAudio) {
        fadeAudioElement(carrinhoAudio, 0, { duration: 700, stopAfter: true });
    }
};

const startTelefoneAudio = () => {
    if (!tensao1Audio) return;
    tensao1Audio.loop = false;
    if (tensao1Audio.paused) {
        tensao1Audio.currentTime = 0;
        setVolumeSafe(tensao1Audio, 0);
        safePlay(tensao1Audio);
    }
    fadeAudioElement(tensao1Audio, 0.8, { duration: 800 });
};

const stopTelefoneAudio = () => {
    if (!tensao1Audio) return;
    fadeAudioElement(tensao1Audio, 0, { duration: 600, stopAfter: true });
};

const startPreTelefoneAudio = () => {
    if (!tensao2Audio) return;
    tensao2Audio.loop = false;
    if (tensao2Audio.paused) {
        tensao2Audio.currentTime = 0;
        setVolumeSafe(tensao2Audio, 0);
        safePlay(tensao2Audio);
    }
    fadeAudioElement(tensao2Audio, 0.7, { duration: 900 });
};

const stopPreTelefoneAudio = () => {
    if (!tensao2Audio) return;
    fadeAudioElement(tensao2Audio, 0, { duration: 700, stopAfter: true });
};

const clearIntroCarTimers = () => {
    if (carAudioStartTimeout) {
        clearTimeout(carAudioStartTimeout);
        carAudioStartTimeout = null;
    }
    if (carAudioStopTimeout) {
        clearTimeout(carAudioStopTimeout);
        carAudioStopTimeout = null;
    }
};

const startIntroCarAudio = () => {
    if (!carroAudio || hasStartedCarAudio) return;
    hasStartedCarAudio = true;
    carroAudio.loop = true;
    if (carroAudio.paused) {
        setVolumeSafe(carroAudio, 0);
        carroAudio.currentTime = 0;
        safePlay(carroAudio);
    }
    fadeAudioElement(carroAudio, 0.6, { duration: 800 });
};

const stopIntroCarAudio = () => {
    if (!carroAudio) return;
    clearIntroCarTimers();
    fadeAudioElement(carroAudio, 0, { duration: 600, stopAfter: true });
    hasStartedCarAudio = false;
};

const scheduleIntroCarAudio = () => {
    if (!baseGif || hasSwappedToSecond) return;
    if (baseGif.paused) return;
    if (hasStartedCarAudio || carAudioStartTimeout || carAudioStopTimeout) return;
    carAudioStartTimeout = setTimeout(() => {
        startIntroCarAudio();
        carAudioStopTimeout = setTimeout(() => {
            stopIntroCarAudio();
        }, 3000);
    }, 3000);
};

const playPortaAudioOnce = () => {
    if (!portaAudio || hasPlayedPortaAudio) return;
    if (portaAudioTimeout) {
        clearTimeout(portaAudioTimeout);
        portaAudioTimeout = null;
    }
    portaAudio.currentTime = 0;
    safePlay(portaAudio);
    hasPlayedPortaAudio = true;
};

const schedulePortaAudio = () => {
    if (!portaAudio || hasPlayedPortaAudio || portaAudioTimeout) return;
    portaAudioTimeout = setTimeout(() => {
        portaAudioTimeout = null;
        playPortaAudioOnce();
    }, 2000);
};

const resetHoverGrow = () => {
    if (hoverGrowRaf) cancelAnimationFrame(hoverGrowRaf);
    hoverGrowRaf = null;
    hoverGrowScale = 1;
    hoverShakeIntensity = 0.45;
    if (hoverGrowText) {
        hoverGrowText.classList.remove('is-shaking');
        hoverGrowText.style.setProperty('--hover-scale', '1');
        hoverGrowText.style.setProperty('--shake-amp', hoverShakeIntensity.toString());
    }
};

const stepHoverGrow = () => {
    if (!hoverGrowText) return;
    hoverGrowScale += 0.015;
    hoverShakeIntensity = Math.min(2.2, hoverShakeIntensity + 0.012);
    hoverGrowText.style.setProperty('--hover-scale', hoverGrowScale.toString());
    hoverGrowText.style.setProperty('--shake-amp', hoverShakeIntensity.toString());
    hoverGrowRaf = requestAnimationFrame(stepHoverGrow);
};

const startHoverGrow = () => {
    if (!hoverGrowText) return;
    resetHoverGrow();
    hoverGrowScale = 1.0; // começa logo a aumentar
    hoverShakeIntensity = 0.55; // tremor inicial leve
    hoverGrowText.style.setProperty('--hover-scale', hoverGrowScale.toString());
    hoverGrowText.style.setProperty('--shake-amp', hoverShakeIntensity.toString());
    hoverGrowText.classList.add('is-shaking');
    hoverGrowRaf = requestAnimationFrame(stepHoverGrow);
};


/* ---------------------------------------------------
   VÍDEO DO TÍTULO (AUTOPLAY UMA VEZ)
---------------------------------------------------- */

const playTituloVideoOnce = () => {
    if (!tituloVideo || tituloVideoStarted) return;

    tituloVideo.muted = true;
    tituloVideo.playsInline = true;
    tituloVideo.loop = false;
    tituloVideo.currentTime = 0;

    const playPromise = tituloVideo.play();
    if (playPromise instanceof Promise) {
        playPromise
            .then(() => {
                tituloVideoStarted = true;
                scheduleScrollHint();
            })
            .catch(() => {});
    } else {
        tituloVideoStarted = true;
        scheduleScrollHint();
    }
};

if (tituloVideo) {
    tituloVideo.addEventListener('play', () => {
        scheduleScrollHint();
    }, { once: true });
    tituloVideo.addEventListener('ended', () => {
        tituloVideo.pause();
    }, { once: true });
}

/* ---------------------------------------------------
   FULLSCREEN BUTTON
---------------------------------------------------- */

const fullscreenEnterIcon = `
    <svg class="fullscreen-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 9V3h6v2H5v4H3zm12-6h6v6h-2V5h-4V3zm6 12v6h-6v-2h4v-4h2zM9 21H3v-6h2v4h4v2z" fill="currentColor"></path>
    </svg>
`.trim();

const fullscreenExitIcon = `
    <svg class="fullscreen-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M5 16h3v3h2v-5H5zm3-8H5v2h5V5H8zm6 11h2v-3h3v-2h-5zm2-11V5h-2v5h5V8z" fill="currentColor"></path>
    </svg>
`.trim();

const updateFullscreenButton = () => {
    if (!fullscreenToggle) return;
    const active = Boolean(isFullscreen());
    const label = active ? 'Sair do ecrã cheio' : 'Entrar em ecrã cheio';
    fullscreenToggle.dataset.active = active ? 'true' : 'false';
    fullscreenToggle.setAttribute('aria-pressed', active ? 'true' : 'false');
    fullscreenToggle.setAttribute('aria-label', label);
    fullscreenToggle.setAttribute('title', label);
    fullscreenToggle.innerHTML = active ? fullscreenExitIcon : fullscreenEnterIcon;
};

const handleFullscreenChange = () => {
    updateFullscreenButton();
    if (isFullscreen()) {
        playTituloVideoOnce();
    }
    if (isFullscreen()) {
        hideStartOverlay();
        hideFullscreenHint();
        introScrollLocked = false;
    }
};

const updateCurrentScene = () => {
    let bestScene = scenes[0] || null;
    let bestRatio = bestScene ? (sceneVisibility.get(bestScene) || 0) : 0;

    sceneVisibility.forEach((ratio, scene) => {
        if (ratio > bestRatio) {
            bestScene = scene;
            bestRatio = ratio;
        }
    });

    const nextIndex = bestScene ? scenes.indexOf(bestScene) : -1;
    if (nextIndex === -1 || nextIndex === currentScene) return;

    currentScene = nextIndex;
};

/* ---------------------------------------------------
   INTERSECTION OBSERVER
---------------------------------------------------- */

const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const previousRatio = sceneVisibility.get(entry.target) || 0;
        const ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
        sceneVisibility.set(entry.target, ratio);

        const leaving = ratio < previousRatio;

        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        } else {
            entry.target.classList.remove('active');
        }

        /* --- SOM mary.wav + tricotar.mp3 QUANDO CENA1.1 ENTRA --- */
        if (entry.target.classList.contains('scene-gif-intro')) {
            const introActive = entry.isIntersecting && !hasSwappedToSecond;
            if (introActive) {
                if (maryAudio?.paused) {
                    maryAudio.currentTime = 0;
                    safePlay(maryAudio);
                }

                if (tricotarAudio?.paused) {
                    tricotarAudio.currentTime = 0;
                    safePlay(tricotarAudio);
                }
                scheduleIntroCarAudio();
            } else {
                if (maryAudio && !maryAudio.paused) maryAudio.pause();
                if (tricotarAudio && !tricotarAudio.paused) tricotarAudio.pause();
                if (clockAudio && !clockAudio.paused) clockAudio.pause();
                if (maryAudio) maryAudio.currentTime = 0;
                if (tricotarAudio) tricotarAudio.currentTime = 0;
                if (clockAudio) clockAudio.currentTime = 0;
                stopIntroCarAudio();
                hasStartedCarAudio = false;
                clearIntroArrow();
            }
        }

        /* --- SOM DO FORNO --- */
        if (fornoScene && entry.target === fornoScene) {
            if (!fornoAudio) return;
            if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
                if (!fornoAudiosActive) {
                    fornoAudiosActive = true;
                    fornoAudio.currentTime = 0;
                    safePlay(fornoAudio);
                    if (timerAudio) {
                        timerAudio.currentTime = 0;
                        safePlay(timerAudio);
                    }
                }
            } else {
                fornoAudiosActive = false;
                if (fornoAudio && !fornoAudio.paused) fornoAudio.pause();
                if (fornoAudio) fornoAudio.currentTime = 0;
                if (timerAudio && !timerAudio.paused) timerAudio.pause();
                if (timerAudio) timerAudio.currentTime = 0;
            }
        }

        /* --- SOM DA CENA COMPRAS --- */
        if (comprasScene && entry.target === comprasScene) {
            const visible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
            if (visible) {
                startComprasAudio();
            } else {
                stopComprasAudio();
            }
        }


        if (introLine && entry.target.classList.contains('scene-intro-text')) {
            const visibleEnough = entry.isIntersecting && entry.intersectionRatio >= 0.6;
            entry.target.classList.toggle('intro-visible', visibleEnough);

            if (!visibleEnough) {
                if (introLineHasEntered && entry.isIntersecting && leaving) {
                    introLine.classList.add('exit-right');
                }
                if (!entry.isIntersecting) {
                    introLine.classList.remove('exit-right');
                }
            } else {
                introLineHasEntered = true;
                introLine.classList.remove('exit-right');
            }
        }

        /* --- SOM DO CORAÇÃO NA FRASE  --- */
        if (entry.target.classList.contains('scene-blur-intro')) {
            const heartActive = entry.isIntersecting && entry.intersectionRatio >= 0.35;
            if (heartActive) {
                startBloodAudio();
            } else {
                fadeOutBloodAudio();
            }
        }

        if (entry.target.classList.contains('scene-meat')) {
            const visibleEnough = entry.isIntersecting && entry.intersectionRatio >= 0.45;
            if (visibleEnough && ouvidoAudio && !ouvidoAudio.paused) {
                fadeAudioElement(ouvidoAudio, 0, { duration: 700, stopAfter: true });
            }
        }

        if (refeicaoScene && entry.target === refeicaoScene) {
            const visibleEnough = entry.isIntersecting && entry.intersectionRatio >= 0.3;
            if (visibleEnough) {
                startRefeicaoAudio();
            } else {
                stopRefeicaoAudio();
                refeicaoPlaybackStarted = false;
                resetRefeicaoBaloes();
            }
        }

        if (deadScene && entry.target === deadScene) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
                startDeadOverlay();
            } else {
                stopDeadOverlay();
            }
        }

        if (entry.target.classList.contains('scene-dead')) {
            const visibleEnough = entry.isIntersecting && entry.intersectionRatio >= 0.45;
            if (visibleEnough) {
                startPreTelefoneAudio();
            } else {
                stopPreTelefoneAudio();
            }
        }

        if (circleScene && entry.target === circleScene) {
            const visibleEnough = entry.isIntersecting && entry.intersectionRatio >= 0.5;
            if (visibleEnough && !hasHungCircleDead) {
                triggerCircleDeadHang();
                hasHungCircleDead = true;
            } else if (!visibleEnough && hasHungCircleDead) {
                const el = getCircleDeadWord();
                if (el) {
                    el.classList.remove('is-hanging');
                }
                hasHungCircleDead = false;
            }
        }

        if (risoScene && entry.target === risoScene) {
            const visibleEnough = entry.isIntersecting && entry.intersectionRatio >= 0.55;
            if (visibleEnough) {
                if (!hasAlignedRiso) {
                    risoScene.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    lockScrollAhead(risoScene);
                    hasAlignedRiso = true;
                }
                if (risoArrow && !risoArrowVisible) {
                    risoArrow.classList.add('is-visible');
                    risoArrowVisible = true;
                }
                if (risoVideo && !hasStartedRisoVideo) {
                    hasStartedRisoVideo = true;
                    risoVideo.currentTime = 0;
                    const playPromise = risoVideo.play();
                    if (playPromise instanceof Promise) {
                        playPromise.catch(() => {});
                    }
                    if (winkAudio) {
                        if (risoWinkTimeout) {
                            clearTimeout(risoWinkTimeout);
                            risoWinkTimeout = null;
                        }
                        risoWinkTimeout = setTimeout(() => {
                            winkAudio.currentTime = 0;
                            safePlay(winkAudio);
                            risoWinkTimeout = null;
                        }, 1000);
                    }
                }
            } else {
                if (risoArrow && risoArrowVisible) {
                    risoArrow.classList.remove('is-visible');
                    risoArrowVisible = false;
                }
            }
        }


        if (introVideo instanceof HTMLVideoElement &&
            entry.target.classList.contains('scene-gif-intro')) {

            if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
                if (!introVideoPlayed) {
                    introVideo.currentTime = 0;
                    const playPromise = introVideo.play();
                    if (playPromise instanceof Promise) {
                        playPromise.catch(() => {});
                    }
                    introVideoPlayed = true;
                }
            } else {
                introVideo.pause();
                if (!hasSwappedToSecond) {
                    introVideo.currentTime = 0;
                    introVideoPlayed = false;
                }
            }
        }

        /* --- EFEITO DE PULSO NO RELÓGIO DA CENA 1.1 --- */
        if (entry.target.classList.contains('scene-gif-intro')) {
            const isPopupOpen = hiddenGif && hiddenGif.classList.contains('show');
            const shouldPulse = entry.isIntersecting && !hasSwappedToSecond && !isPopupOpen;

            if (clockButton) {
                clockButton.classList.toggle('is-pulsing', shouldPulse);
            }
        }
    });

    updateCurrentScene();
}, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) });

scenes.forEach(scene => intersectionObserver.observe(scene));


const ensureIntroAudioPlays = () => {
    const introScene = scenes[introSceneIndex];
    if (!introScene || hasSwappedToSecond) return;
    const ratio = sceneVisibility.get(introScene) || 0;
    if (ratio <= 0) return;

    if (maryAudio?.paused) {
        maryAudio.currentTime = 0;
        safePlay(maryAudio);
    }
    if (tricotarAudio?.paused) {
        tricotarAudio.currentTime = 0;
        safePlay(tricotarAudio);
    }

};

['pointerdown', 'touchstart', 'keydown'].forEach(eventName => {
    window.addEventListener(eventName, ensureIntroAudioPlays);
});

/* ---------------------------------------------------
   DESFOQUE INTERATIVO NA FRASE
---------------------------------------------------- */

const introBlurDefaults = {
    blur: 22,
    opacity: 0.25,
};

const setIntroBlur = (blurPx = introBlurDefaults.blur, opacityVal = introBlurDefaults.opacity) => {
    if (!blurIntroText) return;
    blurIntroText.style.setProperty('--intro-blur', `${blurPx}px`);
    blurIntroText.style.setProperty('--intro-opacity', opacityVal.toString());
};

const applyIntroBlurFromPointer = () => {
    introBlurRaf = null;
    if (!blurIntroText || !introBlurInteractive) return;
    const rect = blurIntroText.getBoundingClientRect();
    const inView = rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
    if (!inView) {
        setIntroBlur();
        return;
    }
    const pointer = introPointerPos || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = pointer.x - cx;
    const dy = pointer.y - cy;
    const dist = Math.hypot(dx, dy);
    const focusRadius = Math.max(rect.width, rect.height) * 0.8; // focar quase ao tocar
    const t = Math.min(1, dist / Math.max(focusRadius, 1));
    // inverso: perto → mais blur; longe → focado
    const blurVal = introBlurDefaults.blur * (1 - t);
    const opacityVal = introBlurDefaults.opacity + t * (1 - introBlurDefaults.opacity);
    setIntroBlur(blurVal, opacityVal);
};

const scheduleIntroBlurUpdate = (evt) => {
    if (!introBlurInteractive) return;
    introPointerPos = { x: evt.clientX, y: evt.clientY };
    if (introBlurRaf) return;
    introBlurRaf = requestAnimationFrame(applyIntroBlurFromPointer);
};

const startIntroBlurSequence = () => {
    if (!blurIntroText) return;
    introBlurInteractive = false;
    if (introBlurFocusTimeout) {
        clearTimeout(introBlurFocusTimeout);
        introBlurFocusTimeout = null;
    }
    if (introBlurEnableTimeout) {
        clearTimeout(introBlurEnableTimeout);
        introBlurEnableTimeout = null;
    }
    setIntroBlur(0, 1); // começa focado
    introBlurFocusTimeout = setTimeout(() => {
        setIntroBlur(introBlurDefaults.blur * 1.35, Math.max(0, introBlurDefaults.opacity - 0.05)); // desfoca depois de alguns segundos
        introBlurEnableTimeout = setTimeout(() => {
            introBlurInteractive = true; // agora já reage ao rato
            applyIntroBlurFromPointer();
        }, 400);
    }, 3000);
};

if (blurIntroText) {
    window.addEventListener('pointermove', scheduleIntroBlurUpdate);
    window.addEventListener('pointerleave', () => {
        introPointerPos = null;
        if (introBlurInteractive) {
            setIntroBlur();
        }
    });

    const blurScene = blurIntroText.closest('.scene');
    if (blurScene) {
        const blurObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                const visibleEnough = entry.isIntersecting && entry.intersectionRatio >= 0.5;
                if (visibleEnough && !introBlurSequenceStarted) {
                    introBlurSequenceStarted = true;
                    startIntroBlurSequence();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

        blurObserver.observe(blurScene);
    } else {
        // fallback: se não achar a cena, inicia de imediato
        startIntroBlurSequence();
    }
}



if (fullscreenToggle) {
    fullscreenToggle.addEventListener('click', () => {
        if (isFullscreen()) exitFullscreen();
        else requestFullscreen();
    });

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    updateFullscreenButton();
}



window.addEventListener('load', () => {
    window.scrollTo(0, 0);
    updateCurrentScene();
    randomizeThoughtSizes();
    if (isFullscreen()) {
        hideFullscreenHint();
    }
});

window.addEventListener('pageshow', (event) => {
    if (event.persisted) window.scrollTo(0, 0);
});

if (restartButton) {
    restartButton.addEventListener('click', () => {
        window.location.reload();
    });
}

/* ---------------------------------------------------
   TEXTO → AUMENTA CONTINUAMENTE AO HOVER
---------------------------------------------------- */

if (hoverGrowText) {
    hoverGrowText.addEventListener('mouseenter', startHoverGrow);
    hoverGrowText.addEventListener('mouseleave', resetHoverGrow);
}

/* ---------------------------------------------------
   FORÇAR ALINHAMENTO DA CENA 1
---------------------------------------------------- */

const sceneGifIntro = document.querySelector('.scene-gif-intro');

if (sceneGifIntro) {

    // BLOQUEAR SCROLL ASSIM QUE A CENA 1 ALINHA
    const alignIntroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.55) {

                sceneGifIntro.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

                // BLOQUEAR SCROLL
                document.body.classList.add('no-scroll');
            }
        });
    }, { threshold: [0.55] });

    alignIntroObserver.observe(sceneGifIntro);
}

if (baseGif) {
    baseGif.addEventListener('play', () => {
        if (!hasSwappedToSecond) scheduleIntroCarAudio();
        else schedulePortaAudio();
        scheduleIntroArrow();
    });
    baseGif.addEventListener('pause', () => {
        stopIntroCarAudio();
        if (portaAudioTimeout) {
            clearTimeout(portaAudioTimeout);
            portaAudioTimeout = null;
        }
        clearIntroArrow();
    });
}



/* ---------------------------------------------------
   RELÓGIO → POPUP → TROCA VÍDEO + SONS
---------------------------------------------------- */

if (clockButton && hiddenGif && baseGif) {

    /* --- ABRIR POPUP DO RELÓGIO --- */
    clockButton.addEventListener('click', () => {
        clockButton.classList.remove('is-pulsing');
        clockButton.classList.add('is-hidden');
        hiddenGif.classList.add('show');
        clearIntroArrow();

        // parar sons iniciais
        if (!maryAudio.paused) maryAudio.pause();
        if (!tricotarAudio.paused) tricotarAudio.pause();
        stopIntroCarAudio();

        maryAudio.currentTime = 0;
        tricotarAudio.currentTime = 0;

        // tocar som do relógio
        clockAudio.loop = true;
        clockAudio.currentTime = 0;
        safePlay(clockAudio);
    });

    /* --- SAIR DO POPUP E TROCAR PARA cena1.2.mp4 --- */
    hiddenGif.addEventListener('click', () => {
        if (!hasSwappedToSecond) {
            if (!maryAudio.paused) maryAudio.pause();
            if (!tricotarAudio.paused) tricotarAudio.pause();
            maryAudio.currentTime = 0;
            tricotarAudio.currentTime = 0;
            stopIntroCarAudio();

            const playThirdIntro = () => {
                baseGif.removeEventListener('ended', playThirdIntro);
                baseGif.src = 'videos/cena1.3.mp4';
                baseGif.loop = false;
                baseGif.currentTime = 0;
                baseGif.classList.add('is-top');
                const playPromise = baseGif.play();
                if (playPromise instanceof Promise) {
                    playPromise.catch(() => {});
                }

                baseGif.addEventListener('ended', () => {
                    // manter último frame visível
                    baseGif.pause();
                    const endTime = (baseGif.duration || 0) - 0.001;
                    if (endTime > 0) {
                        try {
                            baseGif.currentTime = endTime;
                        } catch (_) {}
                    }

                    const nextScene = document
                        .querySelector('.scene-gif-intro')
                        ?.nextElementSibling;

                    if (nextScene) {
                        nextScene.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                        document.body.classList.remove('no-scroll');
                        lockScrollAhead(nextScene);
                    }
                }, { once: true });
            };

            baseGif.src = 'videos/cena1.2.mp4';
            baseGif.loop = false;
            baseGif.currentTime = 0;
            const playPromise = baseGif.play();
            if (playPromise instanceof Promise) {
                playPromise.catch(() => {});
            }
            schedulePortaAudio();

            hasSwappedToSecond = true;

            baseGif.addEventListener('ended', playThirdIntro, { once: true });
        }
        hiddenGif.classList.remove('show');
        clockButton.classList.remove('is-pulsing', 'is-hidden');

        // parar som relógio
        if (!clockAudio.paused) clockAudio.pause();
        clockAudio.loop = false;
        clockAudio.currentTime = 0;
    });
}


/* ---------------------------------------------------
   CENA 2 → SOM "tensao.mp3" ALINHADO AO VÍDEO
---------------------------------------------------- */

const cena2Scene = cena2Video?.closest('.scene');

if (cena2Scene) {
    const alignCena2Observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            const alignedEnough = entry.isIntersecting && entry.intersectionRatio > 0.55;
            if (alignedEnough && !hasAlignedCena2) {
                cena2Scene.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                document.body.classList.add('no-scroll');
                hasAlignedCena2 = true;
                lockScrollAhead(cena2Scene);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: [0.55] });

    alignCena2Observer.observe(cena2Scene);
}

const startTensaoSound = () => {
    if (!cena2Video || !tensaoAudio || hasStartedTensaoAudio) return;
    hasStartedTensaoAudio = true;

    
    cena2Video.currentTime = 0;
    const videoPromise = cena2Video.play();
    if (videoPromise instanceof Promise) {
        videoPromise.catch(() => {});
    }

    tensaoAudio.currentTime = 0;
    safePlay(tensaoAudio);

    if (balaoGif && !hasShownBalao) {
        if (balaoShowTimeout) {
            clearTimeout(balaoShowTimeout);
            balaoShowTimeout = null;
        }
        if (balaoHideTimeout) {
            clearTimeout(balaoHideTimeout);
            balaoHideTimeout = null;
        }

        balaoShowTimeout = setTimeout(() => {
            balaoGif.classList.add('is-visible');
            balaoHideTimeout = setTimeout(() => {
                balaoGif.classList.remove('is-visible');
                balaoHideTimeout = null;
            }, 4000);
            balaoShowTimeout = null;
        }, 5000);

        hasShownBalao = true;
    }
};

if (cena2Scene && cena2Video) {
    const cena2Observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            const visibleEnough = entry.isIntersecting && entry.intersectionRatio >= 0.35;
            if (visibleEnough) {
                startTensaoSound();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: [0, 0.2, 0.35, 0.5] });

    cena2Observer.observe(cena2Scene);
}

if (tensaoAudio && ouvidoAudio) {
    tensaoAudio.addEventListener('ended', () => {
        if (tensaoOuvidoFadeTimeout) {
            clearTimeout(tensaoOuvidoFadeTimeout);
        }
        tensaoOuvidoFadeTimeout = setTimeout(() => {
            fadeAudioElement(ouvidoAudio, 0, { duration: 800, stopAfter: true });
            tensaoOuvidoFadeTimeout = null;
        }, 5000);
    }, { once: true });
}

if (cena2Video) {
    cena2Video.addEventListener('ended', () => {
        document.body.classList.remove('no-scroll');
        const nextScene = cena2Video.closest('.scene')?.nextElementSibling;
        if (nextScene) {
            nextScene.scrollIntoView({ behavior: 'smooth', block: 'start' });
            lockScrollAhead(nextScene);
        }
    });
}

const showPretoClip = () => {
    if (hasPlayedPretoClip || !pernilVideo) return;
    hasPlayedPretoClip = true;

    const pernilParent = pernilVideo.parentElement;
    if (pernilParent) {
        const pretoGif = document.createElement('img');
        pretoGif.src = 'videos/preto.GIF';
        pretoGif.alt = 'Transição para preto';
        pretoGif.className = 'preto-gif';
        pretoGif.style.display = 'block';
        pernilVideo.style.display = 'none';
        pernilParent.appendChild(pretoGif);
    }

    if (!hasAutoScrolledFromPreto && pernilScene) {
        const nextScene = pernilScene.nextElementSibling;
        if (pretoScrollTimeout) {
            clearTimeout(pretoScrollTimeout);
        }
        if (nextScene) {
            hasAutoScrolledFromPreto = true;
            pretoScrollTimeout = setTimeout(() => {
                if (pernilScrollLocked) {
                    document.body.classList.remove('no-scroll');
                    pernilScrollLocked = false;
                }
                nextScene.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
                lockScrollAhead(nextScene);
                pretoScrollTimeout = null;
            }, 3000);
        }
    }
};

if (pernilVideo) {
    pernilVideo.loop = false;
    pernilVideo.addEventListener('ended', () => {
        showPretoClip();
    }, { once: true });
}

if (pernilScene) {
    const alignPernilObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            const alignedEnough = entry.isIntersecting && entry.intersectionRatio > 0.55;
            if (alignedEnough && !hasAlignedPernil) {
                pernilScene.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                document.body.classList.add('no-scroll');
                pernilScrollLocked = true;
                hasAlignedPernil = true;
                lockScrollAhead(pernilScene);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: [0.55] });

    alignPernilObserver.observe(pernilScene);
}

const startPernilVideo = () => {
    if (!pernilVideo || hasStartedPernilVideo) return;
    hasStartedPernilVideo = true;
    if (pernilBaterTimeout) {
        clearTimeout(pernilBaterTimeout);
        pernilBaterTimeout = null;
    }
    pernilVideo.currentTime = 0;
    safePlay(pernilVideo);
    pernilBaterTimeout = setTimeout(() => {
        playBaterHit();
        pernilBaterTimeout = null;
    }, 2000);
};

const startInvestigarVideo = () => {
    if (!investigarVideo || hasStartedInvestigarVideo) return;
    hasStartedInvestigarVideo = true;
    investigarVideo.loop = false;
    investigarVideo.currentTime = 0;
    safePlay(investigarVideo);
};

const startGiggleBounce = () => {
    if (hasBouncedGiggle) return;
    const giggleText = document.querySelector('.giggle-text');
    if (!giggleText) return;
    giggleText.classList.add('is-bouncing');
    hasBouncedGiggle = true;
};

const buildCircleText = () => {};
const toggleCircleLayout = () => {};

const spawnDeadOverlay = () => {
    if (!deadOverlay) return;
    const el = document.createElement('span');
    const words = ['DEAD', 'WHEN', 'HOW', 'WHO', 'WHERE', '?', '???'];
    el.textContent = words[Math.floor(Math.random() * words.length)];
    el.className = 'dead-float';
    const left = Math.random() * 100;
    const top = Math.random() * 80 + 10; // evita colar às bordas
    el.style.left = `${left}%`;
    el.style.top = `${top}%`;
    const weightOptions = [700, 800, 900];
    const sizePx = 28 + Math.random() * 30; // 28–58px
    el.style.fontWeight = weightOptions[Math.floor(Math.random() * weightOptions.length)];
    el.style.fontSize = `${sizePx}px`;
    el.addEventListener('pointerenter', () => {
        el.classList.add('is-hovered');
    });
    el.addEventListener('pointerleave', () => {
        el.classList.remove('is-hovered');
    });
    deadOverlay.appendChild(el);
};

const startDeadOverlay = () => {
    if (!deadOverlay || deadIntervalId) return;
    lockBatidaUntilTelefone = true;
    startBloodAudio();
    attachDeadOverlayListeners();
    spawnDeadOverlay();
    deadIntervalId = setInterval(spawnDeadOverlay, 240);
};

const stopDeadOverlay = () => {
    if (deadIntervalId) {
        clearInterval(deadIntervalId);
        deadIntervalId = null;
    }
    if (deadOverlay) {
        deadOverlay.innerHTML = '';
    }
    resetDeadWordTransforms();
    detachDeadOverlayListeners();
};

const repelDeadWords = (evt) => {
    if (!deadOverlay) return;
    const radius = 240;
    const strength = 220;
    deadOverlay.querySelectorAll('.dead-float').forEach(el => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = cx - evt.clientX;
        const dy = cy - evt.clientY;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist > radius) {
            el.style.transform = '';
            return;
        }
        const force = ((radius - dist) / radius) * strength;
        const nx = dx / dist;
        const ny = dy / dist;
        const tx = nx * force;
        const ty = ny * force;
        requestAnimationFrame(() => {
            el.style.transform = `translate(${tx}px, ${ty}px)`;
        });
    });
};

const resetDeadWordTransforms = () => {
    if (!deadOverlay) return;
    deadOverlay.querySelectorAll('.dead-float').forEach(el => {
        el.style.transform = '';
    });
};

const triggerCircleDeadHang = () => {
    const el = getCircleDeadWord();
    if (!el || el.classList.contains('is-fallen')) return;
    el.classList.remove('is-hanging');
    el.offsetWidth;
    el.classList.add('is-hanging');
};

const attachDeadOverlayListeners = () => {
    if (!deadPointerTarget || deadOverlayListenersAttached) return;
    deadOverlayListenersAttached = true;
};

const detachDeadOverlayListeners = () => {
    if (!deadPointerTarget || !deadOverlayListenersAttached) return;
    deadOverlayListenersAttached = false;
};

const playBaterHit = () => {
    if (!baterAudio) return;
    if (baterTimeout) {
        clearTimeout(baterTimeout);
        baterTimeout = null;
    }
    baterAudio.currentTime = 0;
    safePlay(baterAudio);
    if (ouvidoAudio) {
        ouvidoAudio.currentTime = 0;
        safePlay(ouvidoAudio);
    }
    baterTimeout = setTimeout(() => {
        baterAudio.pause();
        baterAudio.currentTime = 0;
        baterTimeout = null;
    }, 1000);
};

if (pernilScene && pernilVideo) {
    const pernilObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            const visibleEnough = entry.isIntersecting && entry.intersectionRatio >= 0.5;
            if (visibleEnough) {
                startPernilVideo();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

    pernilObserver.observe(pernilScene);
}

if (risoVideo) {
    risoVideo.loop = false;
    risoVideo.addEventListener('ended', () => {
        risoVideo.pause();
        const endTime = (risoVideo.duration || 0) - 0.001;
        if (endTime > 0) {
            try {
                risoVideo.currentTime = endTime;
            } catch (_) {}
        }
        if (risoScrollLocked) {
            unlockVideoScroll();
            risoScrollLocked = false;
        }
        if (risoUnlockTimeout) {
            clearTimeout(risoUnlockTimeout);
            risoUnlockTimeout = null;
        }
        const nextScene = risoVideo.closest('.scene')?.nextElementSibling || risoScene?.nextElementSibling;
        if (nextScene) {
            nextScene.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
            lockScrollAhead(nextScene);
        }
    });
}

if (risoScene) {
    const alignRisoObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            const alignedEnough = entry.isIntersecting && entry.intersectionRatio > 0.5;
            if (alignedEnough && !hasAlignedRiso) {
                risoScene.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
                lockVideoScroll();
                lockScrollAhead(risoScene);
                hasAlignedRiso = true;
                risoScrollLocked = true;
                if (risoUnlockTimeout) {
                    clearTimeout(risoUnlockTimeout);
                    risoUnlockTimeout = null;
                }
                const fallbackMs = (Number.isFinite(risoVideo?.duration) && risoVideo.duration > 0 ? risoVideo.duration * 1000 : 12000) + 1000;
                risoUnlockTimeout = setTimeout(() => {
                    if (risoScrollLocked) {
                        unlockVideoScroll();
                        risoScrollLocked = false;
                    }
                    risoUnlockTimeout = null;
                }, fallbackMs);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: [0.5] });

    alignRisoObserver.observe(risoScene);
}

if (endScene && endVideo) {
    const alignEndObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            const alignedEnough = entry.isIntersecting && entry.intersectionRatio > 0.5;
            if (alignedEnough && !endScrollLocked) {
                endScene.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
                lockVideoScroll();
                lockScrollAhead(endScene);
                endScrollLocked = true;
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: [0.5] });

    alignEndObserver.observe(endScene);

    const playEndVideo = () => {
        if (!endVideo.paused) return;
        endVideo.currentTime = 0;
        safePlay(endVideo);
    };

    const maybePlayEndVideo = () => {
        const ratio = sceneVisibility.get(endScene) || 0;
        if (ratio >= 0.4) playEndVideo();
    };

    endVideo.addEventListener('canplay', maybePlayEndVideo, { once: true });

    const endSceneObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
                playEndVideo();
            }
        });
    }, { threshold: [0.4, 0.6, 0.8, 1] });

    endSceneObserver.observe(endScene);

    endVideo.addEventListener('ended', () => {
        endVideo.pause();
        const lastFrameTime = Math.max(0, (endVideo.duration || 0) - 0.05);
        if (Number.isFinite(lastFrameTime)) {
            endVideo.currentTime = lastFrameTime;
        }
        if (endScrollLocked) {
            unlockVideoScroll();
            endScrollLocked = false;
        }
        if (restartButton) {
            restartButton.classList.add('is-visible');
        }
    });
}


if (comprasScene) {
    const alignComprasObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            const alignedEnough = entry.isIntersecting && entry.intersectionRatio > 0.5;
            if (alignedEnough && !hasAlignedCompras) {
                const target = comprasVideo || comprasScene;
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
                document.body.classList.add('no-scroll');
                comprasScrollLocked = true;
                hasAlignedCompras = true;
                lockScrollAhead(comprasScene);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: [0.5] });

    alignComprasObserver.observe(comprasScene);
}


if (telefoneScene && telefoneVideo) {
    const alignTelefoneObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            const alignedEnough = entry.isIntersecting && entry.intersectionRatio > 0.5;
            if (alignedEnough && !hasAlignedTelefone) {
                if (telefoneUnlockTimeout) {
                    clearTimeout(telefoneUnlockTimeout);
                    telefoneUnlockTimeout = null;
                }
                telefonePlaybackStarted = false;
                telefoneVideo.pause();
                telefoneVideo.currentTime = 0;
                telefoneVideo.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
                document.body.classList.add('no-scroll');
                telefoneScrollLocked = true;
                hasAlignedTelefone = true;
                lockScrollAhead(telefoneScene);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: [0.5] });

    alignTelefoneObserver.observe(telefoneScene);

    const startTelefonePlayback = () => {
        if (!telefoneVideo || telefonePlaybackStarted) return;
        telefonePlaybackStarted = true;
        if (telefoneUnlockTimeout) {
            clearTimeout(telefoneUnlockTimeout);
            telefoneUnlockTimeout = null;
        }
        const nearEnd = telefoneVideo.duration && telefoneVideo.currentTime >= Math.max(0, telefoneVideo.duration - 0.35);
        if (telefoneVideo.ended || nearEnd) {
            telefoneVideo.currentTime = 0;
        }
        safePlay(telefoneVideo);
        startTelefoneAudio();
        const fallbackMs = (Number.isFinite(telefoneVideo.duration) && telefoneVideo.duration > 0 ? telefoneVideo.duration * 1000 : 12000) + 1200;
        telefoneUnlockTimeout = setTimeout(() => {
            if (telefoneScrollLocked) {
                document.body.classList.remove('no-scroll');
                telefoneScrollLocked = false;
            }
            telefonePlaybackStarted = false;
            telefoneUnlockTimeout = null;
            stopTelefoneAudio();
        }, fallbackMs);
    };

    const telefonePlayObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            const fullyAligned = entry.isIntersecting &&
                entry.intersectionRatio >= 0.98 &&
                entry.boundingClientRect.top >= -1 &&
                entry.boundingClientRect.bottom <= window.innerHeight + 1;
            if (fullyAligned) {
                startTelefonePlayback();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: [0.5, 0.75, 0.9, 0.98, 1] });

    telefonePlayObserver.observe(telefoneVideo);
}

const startRefeicaoPlayback = () => {
    if (!refeicaoVideo || refeicaoPlaybackStarted) return;
    refeicaoPlaybackStarted = true;
    clearRefeicaoBalaoTimers();
    resetRefeicaoBaloes();
    refeicaoVideo.currentTime = 0;
    safePlay(refeicaoVideo);
    startRefeicaoBaloes();
};


if (refeicaoScene && refeicaoVideo) {
    const alignRefeicaoObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            const alignedEnough = entry.isIntersecting && entry.intersectionRatio > 0.5;
            if (alignedEnough && !hasAlignedRefeicao) {
                refeicaoVideo.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
                lockVideoScroll();
                refeicaoScrollLocked = true;
                hasAlignedRefeicao = true;
                lockScrollAhead(refeicaoScene);
                startRefeicaoBaloes();
                if (refeicaoUnlockTimeout) {
                    clearTimeout(refeicaoUnlockTimeout);
                    refeicaoUnlockTimeout = null;
                }
                const fallbackMs = (Number.isFinite(refeicaoVideo.duration) && refeicaoVideo.duration > 0 ? refeicaoVideo.duration * 1000 : 14000) + 1200;
                refeicaoUnlockTimeout = setTimeout(() => {
                    if (refeicaoScrollLocked) {
                        unlockVideoScroll();
                        refeicaoScrollLocked = false;
                    }
                    refeicaoUnlockTimeout = null;
                }, fallbackMs);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: [0.5] });

    alignRefeicaoObserver.observe(refeicaoScene);

    const refeicaoPlayObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            const fullyAligned = entry.isIntersecting &&
                entry.intersectionRatio >= 0.98 &&
                entry.boundingClientRect.top >= -1 &&
                entry.boundingClientRect.bottom <= window.innerHeight + 1;
            if (fullyAligned) {
                startRefeicaoPlayback();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: [0.5, 0.75, 0.9, 0.98, 1] });

    refeicaoPlayObserver.observe(refeicaoVideo);
}


if (investigarScene && investigarVideo) {
    const alignInvestigarObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            const alignedEnough = entry.isIntersecting && entry.intersectionRatio > 0.5;
            if (alignedEnough && !hasAlignedInvestigar) {
                investigarVideo.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
                document.body.classList.add('no-scroll');
                investigarScrollLocked = true;
                hasAlignedInvestigar = true;
                lockScrollAhead(investigarScene);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: [0.5] });

    alignInvestigarObserver.observe(investigarScene);
}

if (investigarScene && investigarVideo) {
    const investigarObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            const visibleEnough = entry.isIntersecting && entry.intersectionRatio >= 0.5;
            if (visibleEnough) {
                startInvestigarVideo();
                startCreepy();
                observer.unobserve(entry.target);
            } else {
                stopCreepy();
            }
        });
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

    investigarObserver.observe(investigarScene);
}

if (investigarVideo) {
    investigarVideo.loop = false;
    investigarVideo.addEventListener('ended', () => {
        if (investigarScrollLocked) {
            document.body.classList.remove('no-scroll');
            investigarScrollLocked = false;
        }
        stopCreepy();
        const nextScene = investigarVideo.closest('.scene')?.nextElementSibling || investigarScene?.nextElementSibling;
        if (nextScene) {
            nextScene.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
            lockScrollAhead(nextScene);
        }
    });
}


const giggleScene = document.querySelector('.giggle-text')?.closest('.scene');

if (giggleScene) {
    const giggleObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            const visibleEnough = entry.isIntersecting && entry.intersectionRatio >= 0.5;
            if (visibleEnough) {
                startGiggleBounce();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

    giggleObserver.observe(giggleScene);
}


if (meatScene) {
    const meatObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const isHalf = entry.isIntersecting && entry.intersectionRatio >= 0.5;
            suppressThoughts = isHalf;
            if (isHalf && ouvidoAudio && !ouvidoAudio.paused) {
                fadeAudioElement(ouvidoAudio, 0, { duration: 700, stopAfter: true });
            }
            if (requestParallaxUpdate) requestParallaxUpdate();
        });
    }, { threshold: [0, 0.5, 0.75, 1] });

    meatObserver.observe(meatScene);
}



if (comprasVideo) {
    comprasVideo.addEventListener('ended', () => {
        if (comprasScrollLocked) {
            document.body.classList.remove('no-scroll');
            comprasScrollLocked = false;
        }
        // Encontrar a próxima cena (a próxima <section.scene>)
            const nextScene = document
                .querySelector('.scene-compras')
                .nextElementSibling;

        if (nextScene) {
            nextScene.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            lockScrollAhead(nextScene);
        }
    });
}

if (telefoneVideo) {
    telefoneVideo.addEventListener('ended', () => {
        if (telefoneUnlockTimeout) {
            clearTimeout(telefoneUnlockTimeout);
            telefoneUnlockTimeout = null;
        }
        telefonePlaybackStarted = false;
        lockBatidaUntilTelefone = false;
        fadeOutBloodAudio();
        if (telefoneScrollLocked) {
            document.body.classList.remove('no-scroll');
            telefoneScrollLocked = false;
        }
        stopTelefoneAudio();
        const nextScene = telefoneVideo.closest('.scene')?.nextElementSibling || telefoneScene?.nextElementSibling;
        if (nextScene) {
            nextScene.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
            lockScrollAhead(nextScene);
        }
    });
}

if (refeicaoVideo) {
    refeicaoVideo.addEventListener('play', () => {
        startRefeicaoBaloes();
    });

    refeicaoVideo.addEventListener('ended', () => {
        if (refeicaoScrollLocked) {
            unlockVideoScroll();
            refeicaoScrollLocked = false;
        }
        refeicaoPlaybackStarted = false;
        resetRefeicaoBaloes();
        if (refeicaoUnlockTimeout) {
            clearTimeout(refeicaoUnlockTimeout);
            refeicaoUnlockTimeout = null;
        }
        const nextScene = refeicaoVideo.closest('.scene')?.nextElementSibling || refeicaoScene?.nextElementSibling;
        if (nextScene) {
            nextScene.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
            lockScrollAhead(nextScene);
        }
    });
}


const parallaxScenes = Array.from(document.querySelectorAll('.scene-extra'))
    .filter(scene => scene.querySelector('.thought'));
let requestParallaxUpdate = null;

const findSceneNeighbor = (scene, direction) => {
    let node = scene?.[direction] || null;
    while (node && node.classList && !node.classList.contains('scene')) {
        node = node[direction];
    }
    return (node && node.classList?.contains('scene')) ? node : null;
};

if (parallaxScenes.length) {
    const parallaxEntries = parallaxScenes.map(scene => ({
        scene,
        thoughts: Array.from(scene.querySelectorAll('.thought')),
        prevScene: findSceneNeighbor(scene, 'previousElementSibling'),
        nextScene: findSceneNeighbor(scene, 'nextElementSibling'),
    }));

    let ticking = false;

    const applyParallax = () => {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const viewportMid = scrollY + windowHeight / 2;
        const startMargin = windowHeight * 0.18;
        const endMargin = 0;
        const defaultSpeeds = [0.9, 1.35, 1.7, 1.1, 1.9, 1.3, 1.0, 1.6, 1.15, 1.8, 1.45, 2.0, 0.95, 1.7, 1.2];
        const defaultSpeedsX = [0.18, -0.28, 0.24, -0.32, 0.14, -0.2, 0.28, -0.16, 0.1, -0.22, 0.15, -0.34, 0.2, -0.18, 0.26];
        const defaultStarts = [0.02, 0.11, 0.21, 0.29, 0.38, 0.47, 0.56, 0.64, 0.72, 0.8, 0.88, 0.18, 0.32, 0.5, 0.68];
        const defaultDurations = [0.16, 0.2, 0.18, 0.14, 0.22, 0.17, 0.15, 0.2, 0.16, 0.18, 0.2, 0.14, 0.19, 0.16, 0.21];

        parallaxEntries.forEach(({ scene, thoughts, prevScene, nextScene }) => {
            const sceneRect = scene.getBoundingClientRect();
            const sceneTop = sceneRect.top + scrollY;
            const sceneBottom = sceneRect.bottom + scrollY;

            const prevRect = prevScene ? prevScene.getBoundingClientRect() : null;
            const nextRect = nextScene ? nextScene.getBoundingClientRect() : null;

            const rangeStart = (prevRect ? prevRect.top + scrollY : sceneTop) - startMargin;
            const rangeEnd = (nextRect ? nextRect.bottom + scrollY : sceneBottom) + endMargin;
            const rangeSize = Math.max(1, rangeEnd - rangeStart);

            const inRange = viewportMid >= rangeStart && viewportMid <= rangeEnd;
            scene.classList.toggle('active', inRange);
            scene.classList.toggle('parallax-overlay', inRange);
            if (!inRange) {
                thoughts.forEach(thought => {
                    thought.style.opacity = '0';
                    thought.style.setProperty('--thought-parallax-x', '0px');
                    thought.style.setProperty('--thought-parallax-y', '0px');
                });
                return;
            }

            const progress = (viewportMid - rangeStart) / rangeSize;
            const centered = (progress - 0.5) * 640;

            if (suppressThoughts) {
                thoughts.forEach(thought => {
                    thought.classList.remove('is-active');
                    thought.style.opacity = '0';
                    thought.style.setProperty('--thought-parallax-x', '0px');
                    thought.style.setProperty('--thought-parallax-y', '0px');
                });
                return;
            }

            thoughts.forEach((thought, index) => {
                const speedY = parseFloat(thought.dataset.speed || defaultSpeeds[index % defaultSpeeds.length]);
                const speedX = parseFloat(thought.dataset.speedX || thought.dataset.speedx || defaultSpeedsX[index % defaultSpeedsX.length]);
                const y = centered * speedY;
                const x = (progress - 0.5) * 220 * speedX;
                const appearStart = parseFloat(thought.dataset.start || defaultStarts[index % defaultStarts.length]);
                const appearDuration = parseFloat(thought.dataset.duration || defaultDurations[index % defaultDurations.length]);
                const appearEnd = appearStart + appearDuration;
                const withinWindow = progress >= appearStart && progress <= appearEnd;
                thought.style.setProperty('--thought-parallax-x', `${x}px`);
                thought.style.setProperty('--thought-parallax-y', `${y}px`);
                if (withinWindow) {
                    if (!thought.classList.contains('is-active')) {
                        thought.classList.remove('is-active');
                        thought.offsetHeight;
                        thought.classList.add('is-active');
                    }
                } else {
                    thought.classList.remove('is-active');
                    thought.style.opacity = '0';
                }
            });
        });
    };

    requestParallaxUpdate = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
            applyParallax();
            ticking = false;
        });
    };

    window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
    window.addEventListener('resize', requestParallaxUpdate);

    // Inicializar posições no load
    requestParallaxUpdate();
}


const bloodLayer = document.querySelector('.blood-layer');
let bloodFadeFrame = null;
let isBloodAudioActive = false;

const cancelBloodFade = () => {
    if (!bloodFadeFrame) return;
    cancelAnimationFrame(bloodFadeFrame);
    bloodFadeFrame = null;
};

const startBloodAudio = () => {
    if (!batidaAudio) return;
    cancelBloodFade();
    batidaAudio.loop = true;
    if (batidaAudio.paused) {
        batidaAudio.currentTime = 0;
    }
    setVolumeSafe(batidaAudio, 1);
    safePlay(batidaAudio);
    isBloodAudioActive = true;
};

const fadeOutBloodAudio = () => {
    if (!batidaAudio || !isBloodAudioActive || lockBatidaUntilTelefone) return;
    cancelBloodFade();

    const duration = 800;
    const startVolume = clampVolume(batidaAudio.volume);
    const startTime = performance.now();

    const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        batidaAudio.volume = clampVolume(Math.max(0, startVolume * (1 - progress)));

        if (progress < 1) {
            bloodFadeFrame = requestAnimationFrame(step);
        } else {
            batidaAudio.pause();
            batidaAudio.currentTime = 0;
            setVolumeSafe(batidaAudio, 1);
            isBloodAudioActive = false;
            bloodFadeFrame = null;
        }
    };

    bloodFadeFrame = requestAnimationFrame(step);
};

const playBloodVideoOnce = () => {
    if (!bloodVideo || hasPlayedBloodVideo) return;
    bloodVideo.loop = false;
    bloodVideo.currentTime = 0;
    safePlay(bloodVideo);
    bloodVideo.addEventListener('ended', () => {
        bloodVideo.pause();
    }, { once: true });
    hasPlayedBloodVideo = true;
};

if (bloodLayer) {
    const bloodObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
            if (isVisible) {
                playBloodVideoOnce();
            }
        });
    }, { threshold: [0, 0.25, 0.5, 0.75] });

    bloodObserver.observe(bloodLayer);
}


const fimSection = fimVideo?.closest('.scene');

if (fimVideo && fimSection) {
    fimVideo.loop = false;

    const fimObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            const inMiddle = entry.isIntersecting && entry.intersectionRatio >= 0.5;
            if (!hasAlignedFimSection && inMiddle) {
                fimSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                hasAlignedFimSection = true;
                lockScrollAhead(fimSection);
            }

            if (!hasPlayedFimVideo && inMiddle) {
                fimVideo.currentTime = 0;
                safePlay(fimVideo);
                hasPlayedFimVideo = true;
            }

            if (hasAlignedFimSection && hasPlayedFimVideo) {
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

    fimObserver.observe(fimSection);
}
