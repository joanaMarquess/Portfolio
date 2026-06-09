document.documentElement.classList.add("js-enabled");

const title = document.querySelector(".hero__name");
const randomBetween = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const usesTouchScroll = window.matchMedia(
  "(hover: none), (pointer: coarse), (max-width: 900px)"
).matches;
let gridPulseTimeoutId = null;
let heroIntroProgress = 0;
let applyHeroIntro = null;
let updateHeroMetrics = null;
let storyActive = false;
let introProgress = 0;
let heroJoinProgress = 0;
let introDistance = 0;
let heroJoinDistance = 0;
let handleStoryScroll = null;

const triggerGridPulse = () => {
  if (prefersReducedMotion) {
    return;
  }

  document.body.classList.remove("grid-pulse");
  // Force reflow so the animation can restart on rapid toggles.
  void document.body.offsetWidth;
  document.body.classList.add("grid-pulse");

  if (gridPulseTimeoutId) {
    window.clearTimeout(gridPulseTimeoutId);
  }
  gridPulseTimeoutId = window.setTimeout(() => {
    document.body.classList.remove("grid-pulse");
    gridPulseTimeoutId = null;
  }, 900);
};

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const scrollWindowImmediate = (top) => {
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;

  root.style.scrollBehavior = "auto";
  window.scrollTo({ top, behavior: "auto" });
  root.style.scrollBehavior = previousScrollBehavior;
};
const resetScroll = () => scrollWindowImmediate(0);
resetScroll();

let mobileIntroNudgeRaf = null;
let mobileIntroNudgeTimeout = null;
let mobileIntroNudgeDone = false;

const cancelMobileIntroNudge = () => {
  if (mobileIntroNudgeRaf) {
    cancelAnimationFrame(mobileIntroNudgeRaf);
    mobileIntroNudgeRaf = null;
  }
  if (mobileIntroNudgeTimeout) {
    window.clearTimeout(mobileIntroNudgeTimeout);
    mobileIntroNudgeTimeout = null;
  }
};

const startMobileIntroNudge = () => {
  if (!usesTouchScroll || prefersReducedMotion || mobileIntroNudgeDone) {
    return;
  }

  mobileIntroNudgeDone = true;
  cancelMobileIntroNudge();

  mobileIntroNudgeTimeout = window.setTimeout(() => {
    mobileIntroNudgeTimeout = null;

    if (
      storyActive ||
      document.querySelector(".work-item.is-open") ||
      window.scrollY > 24
    ) {
      return;
    }

    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const startY = window.scrollY;
    const distance = clamp(window.innerHeight * 0.16, 72, 135);
    const targetY = clamp(startY + distance, 0, maxScroll);
    if (targetY <= startY) {
      return;
    }

    const duration = 820;
    const startTime = performance.now();
    const cancelEvents = ["touchstart", "touchmove", "wheel", "keydown", "pointerdown"];

    const cleanup = () => {
      cancelEvents.forEach((eventName) => {
        window.removeEventListener(eventName, stopNudge);
      });
    };

    const stopNudge = () => {
      cleanup();
      cancelMobileIntroNudge();
    };

    cancelEvents.forEach((eventName) => {
      window.addEventListener(eventName, stopNudge, { passive: true, once: true });
    });

    const step = (time) => {
      const progress = clamp((time - startTime) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      scrollWindowImmediate(startY + (targetY - startY) * eased);

      if (progress < 1) {
        mobileIntroNudgeRaf = requestAnimationFrame(step);
        return;
      }

      mobileIntroNudgeRaf = null;
      cleanup();
    };

    mobileIntroNudgeRaf = requestAnimationFrame(step);
  }, 260);
};

const cursorSquare = document.querySelector(".cursor-square");
const cursorDot = document.querySelector(".cursor-dot");
if (cursorSquare || cursorDot) {
  const rootStyle = document.documentElement.style;
  let currentX = window.innerWidth / 2;
  let currentY = window.innerHeight / 2;
  let targetX = currentX;
  let targetY = currentY;
  let rafId = null;

  const setSquarePosition = (x, y) => {
    rootStyle.setProperty("--cursor-square-x", `${x.toFixed(2)}px`);
    rootStyle.setProperty("--cursor-square-y", `${y.toFixed(2)}px`);
  };

  const setDotPosition = (x, y) => {
    rootStyle.setProperty("--cursor-dot-x", `${x.toFixed(2)}px`);
    rootStyle.setProperty("--cursor-dot-y", `${y.toFixed(2)}px`);
  };

  const update = () => {
    const easing = prefersReducedMotion ? 1 : 0.18;
    currentX += (targetX - currentX) * easing;
    currentY += (targetY - currentY) * easing;
    setSquarePosition(currentX, currentY);

    if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
      rafId = requestAnimationFrame(update);
    } else {
      rafId = null;
    }
  };

  const onMove = (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    setDotPosition(targetX, targetY);
    if (!rafId) {
      rafId = requestAnimationFrame(update);
    }
  };

  const onResize = () => {
    const maxX = window.innerWidth;
    const maxY = window.innerHeight;
    currentX = clamp(currentX, 0, maxX);
    currentY = clamp(currentY, 0, maxY);
    targetX = clamp(targetX, 0, maxX);
    targetY = clamp(targetY, 0, maxY);
    setDotPosition(targetX, targetY);
    if (!rafId) {
      rafId = requestAnimationFrame(update);
    }
  };

  setSquarePosition(currentX, currentY);
  setDotPosition(currentX, currentY);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("resize", onResize);
}

const introOverlay = document.querySelector(".intro-overlay");
if (introOverlay) {
  const stage = introOverlay.querySelector(".intro-overlay__stage");
  const loadingValue = introOverlay.querySelector(".intro-counter__value");
  const word = introOverlay.querySelector(".intro-word");
  const lineLeft = introOverlay.querySelector(".intro-line--left");
  const lineRight = introOverlay.querySelector(".intro-line--right");
  const lineMerge = introOverlay.querySelector(".intro-line--merge");
  const header = document.querySelector(".site-header");
  const introPortfolioEnd = 0.42;
  const introMergeEnd = 0.6;
  const introExplodeEnd = 0.72;
  let introLineHeight = 0;
  let introSquareSize = 0;
  let headerDropDistance = 0;
  let introAutoRaf = null;

  const updateIntroMetrics = () => {
    if (!stage || !word) {
      return;
    }
    const rect = word.getBoundingClientRect();
    if (!rect.width) {
      return;
    }
    introLineHeight = clamp(window.innerHeight * 0.18, 80, 200);
    introSquareSize = clamp(window.innerWidth * 0.06, 34, 80);
    stage.style.setProperty("--intro-word-half", `${rect.width / 2}px`);
    stage.style.setProperty("--intro-line-height", `${introLineHeight}px`);
    stage.style.setProperty("--intro-line-width", "2px");
    const offset = rect.width / 2;
    if (lineLeft) {
      lineLeft.style.setProperty("--intro-line-offset", `${-offset}px`);
    }
    if (lineRight) {
      lineRight.style.setProperty("--intro-line-offset", `${offset}px`);
    }
    if (lineMerge) {
      lineMerge.style.setProperty("--intro-line-offset", "0px");
    }
    document.body.classList.add("intro-ready");
  };

  const updateHeaderMetrics = () => {
    if (!header) {
      return;
    }
    const rect = header.getBoundingClientRect();
    const extra = clamp(window.innerHeight * 0.06, 12, 32);
    headerDropDistance = rect.height + extra;
  };

  const ease = (value) => value * value * (3 - 2 * value);

  const updateStory = () => {
    if (!stage) {
      return;
    }

    const safeProgress = clamp(introProgress, 0, 1);
    const portfolioProgress = ease(clamp(safeProgress / introPortfolioEnd, 0, 1));
    const mergeProgress = ease(
      clamp((safeProgress - introPortfolioEnd) / (introMergeEnd - introPortfolioEnd), 0, 1)
    );
    const explodeProgress = ease(
      clamp((safeProgress - introMergeEnd) / (introExplodeEnd - introMergeEnd), 0, 1)
    );
    const heroRevealProgress = 1;

    if (!document.body.classList.contains("intro-ready")) {
      stage.style.setProperty("--intro-progress", "0");
    } else {
      stage.style.setProperty("--intro-progress", portfolioProgress.toFixed(4));
    }
    stage.style.setProperty("--intro-lines-opacity", portfolioProgress.toFixed(3));

    document.body.classList.toggle(
      "intro-merge",
      mergeProgress > 0.001 || explodeProgress > 0
    );

    const overlayOpacity = (1 - explodeProgress).toFixed(3);
    document.body.style.setProperty("--intro-overlay-opacity", overlayOpacity);
    document.body.style.setProperty("--intro-overlay-bg", overlayOpacity);

    document.body.style.setProperty("--grid-opacity", explodeProgress.toFixed(3));
    document.body.style.setProperty(
      "--grid-scale",
      (1.08 - 0.08 * explodeProgress).toFixed(3)
    );
    document.body.style.setProperty(
      "--noise-opacity",
      (0.2 * explodeProgress).toFixed(3)
    );

    const headerReveal = ease(clamp(explodeProgress / 0.95, 0, 1));
    document.body.style.setProperty("--header-reveal", headerReveal.toFixed(3));
    const headerTranslate = -headerDropDistance * (1 - headerReveal);
    document.body.style.setProperty("--header-translate", `${headerTranslate.toFixed(1)}px`);
    document.body.classList.toggle("header-visible", headerReveal > 0.6);

    const baseLineWidth = 2;
    const mergeWidth = baseLineWidth + (introSquareSize - baseLineWidth) * mergeProgress;
    const mergeHeight = introLineHeight - (introLineHeight - introSquareSize) * mergeProgress;
    const fillAlpha = 1 - mergeProgress;
    const borderAlpha = mergeProgress;
    const borderSize = 2 * mergeProgress;

    stage.style.setProperty("--intro-line-height", `${introLineHeight}px`);
    stage.style.setProperty("--intro-merge-width", `${mergeWidth.toFixed(2)}px`);
    stage.style.setProperty("--intro-merge-height", `${mergeHeight.toFixed(2)}px`);
    stage.style.setProperty("--intro-merge-fill-alpha", fillAlpha.toFixed(3));
    stage.style.setProperty("--intro-merge-border-alpha", borderAlpha.toFixed(3));
    stage.style.setProperty("--intro-merge-border", `${borderSize.toFixed(2)}px`);

    const mergeScale = 1 + explodeProgress * 7;
    stage.style.setProperty("--intro-merge-scale", mergeScale.toFixed(3));
    stage.style.setProperty("--intro-merge-opacity", (1 - explodeProgress).toFixed(3));
    const shakeAmount = (mergeProgress * 0.4 + explodeProgress * 1.4) * 6;
    stage.style.setProperty("--intro-shake", shakeAmount.toFixed(2));

    if (safeProgress < introExplodeEnd) {
      document.body.classList.add("intro-active");
      document.body.classList.remove("intro-complete");
    } else {
      document.body.classList.remove("intro-active");
      document.body.classList.add("intro-complete");
    }

    if (title) {
      if (typeof updateHeroMetrics === "function") {
        updateHeroMetrics();
      }
      title.style.setProperty("--hero-reveal", heroRevealProgress.toFixed(4));
      const lineOpacity = 1 - clamp((heroRevealProgress - 0.75) / 0.25, 0, 1);
      title.style.setProperty("--hero-line-opacity", lineOpacity.toFixed(3));
    }

    heroIntroProgress = 1;
    if (typeof applyHeroIntro === "function") {
      applyHeroIntro();
    }
  };

  const updateStoryDistance = () => {
    introDistance = Math.max(1200, window.innerHeight * 2.2);
    heroJoinDistance = Math.max(700, window.innerHeight * 1.2);
  };

  const updateIntroMetricsAndStory = () => {
    updateIntroMetrics();
    updateHeaderMetrics();
    if (storyActive) {
      updateStory();
    }
  };

  const finishIntroImmediately = () => {
    storyActive = false;
    handleStoryScroll = null;
    if (introAutoRaf) {
      cancelAnimationFrame(introAutoRaf);
      introAutoRaf = null;
    }
    introProgress = 1;
    heroJoinProgress = 1;
    document.body.classList.remove("intro-loading");
    document.body.classList.remove("intro-active");
    document.body.classList.remove("story-active");
    document.body.classList.add("intro-complete");
    document.body.style.setProperty("--grid-opacity", "1");
    document.body.style.setProperty("--grid-scale", "1");
    document.body.style.setProperty("--noise-opacity", "0.2");
    document.body.style.setProperty("--header-reveal", "1");
    document.body.style.setProperty("--header-translate", "0px");
    document.body.classList.add("header-visible");
    document.body.style.setProperty("--intro-overlay-opacity", "0");
    document.body.style.setProperty("--intro-overlay-bg", "0");
    introOverlay.remove();
    startMobileIntroNudge();
  };

  const applyDeltaToProgress = (current, delta, distance) => {
    if (!distance || delta === 0) {
      return { progress: current, leftover: delta };
    }
    const next = clamp(current + delta / distance, 0, 1);
    const consumed = (next - current) * distance;
    return { progress: next, leftover: delta - consumed };
  };

  const startIntroStory = () => {
    storyActive = true;
    introProgress = 0;
    heroJoinProgress = 1;
    document.body.classList.add("story-active");
    document.body.classList.add("intro-active");
    document.body.classList.remove("intro-complete");
    updateStoryDistance();
    updateIntroMetricsAndStory();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateIntroMetricsAndStory).catch(() => {});
    }
    window.addEventListener("resize", () => {
      updateStoryDistance();
      updateIntroMetricsAndStory();
    });

    const finishIntroStory = (leftover = 0) => {
      storyActive = false;
      heroJoinProgress = 1;
      handleStoryScroll = null;
      if (introAutoRaf) {
        cancelAnimationFrame(introAutoRaf);
        introAutoRaf = null;
      }
      document.body.classList.remove("story-active");
      document.body.classList.remove("intro-merge");
      introOverlay.setAttribute("aria-hidden", "true");

      if (leftover > 0) {
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const target = clamp(window.scrollY + leftover, 0, maxScroll);
        scrollWindowImmediate(target);
      }

      startMobileIntroNudge();
    };

    const startIntroAuto = () => {
      if (introAutoRaf) {
        return;
      }

      const startProgress = Math.max(introProgress, introPortfolioEnd);
      const duration = 1150;
      const startTime = performance.now();
      handleStoryScroll = () => {};

      const step = (time) => {
        const elapsed = time - startTime;
        const progress = ease(clamp(elapsed / duration, 0, 1));
        introProgress = startProgress + (1 - startProgress) * progress;
        updateStory();

        if (progress < 1) {
          introAutoRaf = requestAnimationFrame(step);
          return;
        }

        introAutoRaf = null;
        introProgress = 1;
        updateStory();
        finishIntroStory();
      };

      introProgress = startProgress;
      updateStory();
      introAutoRaf = requestAnimationFrame(step);
    };

    handleStoryScroll = (delta) => {
      if (!storyActive) {
        return;
      }
      if (delta > 0) {
        if (introProgress < introPortfolioEnd) {
          const updated = applyDeltaToProgress(introProgress, delta, introDistance);
          introProgress = Math.min(updated.progress, introPortfolioEnd);
          updateStory();

          if (introProgress >= introPortfolioEnd) {
            startIntroAuto();
          }
          return;
        }
        startIntroAuto();
        return;
      }

      if (delta < 0) {
        if (introProgress > 0 && introProgress < introPortfolioEnd && !introAutoRaf) {
          introProgress = clamp(introProgress + delta / introDistance, 0, 1);
          updateStory();
        }
      }
    };

    updateStory();
  };

  const runIntroLoading = (onComplete) => {
    let progress = 0;
    const intervalMs = prefersReducedMotion ? 12 : 18;
    const loadingOutroDelay = prefersReducedMotion ? 180 : 520;

    storyActive = true;
    handleStoryScroll = () => {};
    updateHeaderMetrics();
    document.body.classList.add("story-active");
    document.body.classList.add("intro-loading");
    document.body.classList.remove("intro-loading-word-visible");
    document.body.classList.remove("intro-active");
    document.body.classList.remove("intro-complete");
    document.body.classList.remove("intro-merge");
    document.body.classList.remove("header-visible");
    document.body.style.setProperty("--header-reveal", "0");
    document.body.style.setProperty(
      "--header-translate",
      `${(-Math.max(headerDropDistance, 80)).toFixed(1)}px`
    );

    if (loadingValue) {
      loadingValue.textContent = "0";
    }

    const timerId = window.setInterval(() => {
      progress += 1;
      if (loadingValue) {
        loadingValue.textContent = `${progress}`;
      }

      if (progress < 100) {
        return;
      }

      window.clearInterval(timerId);
      if (!prefersReducedMotion) {
        document.body.classList.add("intro-loading-word-visible");
      }

      window.setTimeout(() => {
        document.body.classList.remove("intro-loading-word-visible");
        document.body.classList.remove("intro-loading");
        onComplete();
      }, loadingOutroDelay);
    }, intervalMs);
  };

  runIntroLoading(prefersReducedMotion ? finishIntroImmediately : startIntroStory);
}

const normalizeWheelDelta = (event) => {
  let delta = event.deltaY;
  if (event.deltaMode === 1) {
    delta *= 16;
  } else if (event.deltaMode === 2) {
    delta *= window.innerHeight;
  }
  return delta;
};

const limitScrollSpeed = () => {
  const softLimit = 160;
  const hardLimit = 320;

  const onWheel = (event) => {
    if (storyActive && typeof handleStoryScroll === "function") {
      event.preventDefault();
      handleStoryScroll(normalizeWheelDelta(event));
      return;
    }

    if (event.ctrlKey) {
      return;
    }

    if (hasOpenWorkItem() && !usesTouchScroll) {
      const delta = normalizeWheelDelta(event);
      if (maybeHandleWorkFocusOverflow(delta)) {
        event.preventDefault();
      }
      return;
    }

    const rawDelta = normalizeWheelDelta(event);
    if (Math.abs(rawDelta) <= softLimit) {
      return;
    }

    event.preventDefault();

    const cappedDelta = clamp(rawDelta, -hardLimit, hardLimit);
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const target = clamp(window.scrollY + cappedDelta, 0, maxScroll);

    scrollWindowImmediate(target);
  };

  window.addEventListener("wheel", onWheel, { passive: false });
};

limitScrollSpeed();

const onStoryKeyDown = (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }

  const key = event.key;
  let delta = null;
  let edge = null;

  if (key === "ArrowDown") {
    delta = window.innerHeight * 0.12;
  } else if (key === "ArrowUp") {
    delta = -window.innerHeight * 0.12;
  } else if (key === "PageDown" || (key === " " && !event.shiftKey)) {
    delta = window.innerHeight * 0.9;
  } else if (key === "PageUp" || (key === " " && event.shiftKey)) {
    delta = -window.innerHeight * 0.9;
  } else if (key === "Home") {
    edge = "start";
  } else if (key === "End") {
    edge = "end";
  } else {
    return;
  }

  if (storyActive && typeof handleStoryScroll === "function") {
    event.preventDefault();
    if (edge === "start") {
      handleStoryScroll(-window.innerHeight);
      return;
    }
    if (edge === "end") {
      handleStoryScroll(window.innerHeight);
      return;
    }
    handleStoryScroll(delta);
    return;
  }

  if (hasOpenWorkItem()) {
    event.preventDefault();
    if (edge) {
      scrollWorkFocusToEdge(edge);
      return;
    }
    scrollWorkFocusBy(delta);
  } else {
    return;
  }
};

let storyTouchY = null;
const onStoryTouchStart = (event) => {
  if (event.touches.length !== 1) {
    storyTouchY = null;
    return;
  }

  if (!storyActive && !hasOpenWorkItem()) {
    storyTouchY = null;
    return;
  }
  storyTouchY = event.touches[0]?.clientY ?? null;
};

const onStoryTouchMove = (event) => {
  if (event.touches.length !== 1) {
    storyTouchY = null;
    return;
  }

  const currentY = event.touches[0]?.clientY ?? null;
  if (storyTouchY === null || currentY === null) {
    return;
  }
  const delta = storyTouchY - currentY;
  storyTouchY = currentY;

  if (!storyActive || typeof handleStoryScroll !== "function") {
    return;
  }

  event.preventDefault();
  handleStoryScroll(delta);
};

window.addEventListener("keydown", onStoryKeyDown);
window.addEventListener("touchstart", onStoryTouchStart, { passive: true });
window.addEventListener("touchmove", onStoryTouchMove, { passive: false });

const splitWorkTitles = () => {
  const titles = document.querySelectorAll(".work-item__title");
  const collectTitleLines = (title) => {
    const lines = [];
    let buffer = "";

    const flush = () => {
      const cleaned = buffer.replace(/\s+/g, " ").trim();
      if (cleaned) {
        lines.push(cleaned);
      }
      buffer = "";
    };

    [...title.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        buffer += node.textContent || "";
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;
        if (element.classList.contains("work-item__title-line")) {
          flush();
          const lineText = element.textContent || "";
          const cleaned = lineText.replace(/\s+/g, " ").trim();
          if (cleaned) {
            lines.push(cleaned);
          }
        } else {
          buffer += element.textContent || "";
        }
      }
    });

    flush();
    return lines;
  };

  titles.forEach((title, titleIndex) => {
    if (title.dataset.split === "true") {
      return;
    }

    const lines = collectTitleLines(title);

    if (!lines.length) {
      return;
    }

    title.setAttribute("aria-label", lines.join(" "));
    title.textContent = "";

    lines.forEach((lineText, lineIndex) => {
      const line = document.createElement("span");
      line.className = "work-item__title-line";
      const words = lineText.split(/\s+/).filter(Boolean);

      words.forEach((word, wordIndex) => {
        const chunk = document.createElement("span");
        chunk.className = "work-item__title-split";
        const isLeft = (wordIndex + lineIndex) % 2 === 0;
        chunk.dataset.split = isLeft ? "left" : "right";
        const delay = (titleIndex * 0.04) + (lineIndex * 0.1) + wordIndex * 0.06;
        chunk.style.setProperty("--split-delay", `${delay.toFixed(2)}s`);
        chunk.textContent = word;
        line.appendChild(chunk);
        if (wordIndex < words.length - 1) {
          line.appendChild(document.createTextNode(" "));
        }
      });

      title.appendChild(line);
    });

    title.dataset.split = "true";
  });
};

splitWorkTitles();

if (title) {
  const existingLines = [...title.querySelectorAll(".hero__name-line")];
  const lines = existingLines.length
    ? existingLines.map((line) => ({
        text: line.textContent.trim(),
        classes: [...line.classList].filter((name) => name !== "hero__name-line"),
      }))
    : [{ text: title.textContent.trim(), classes: [] }];
  let revealIndex = 0;
  const revealBaseDelay = 0.2;
  const revealStep = 0.06;

  title.textContent = "";
  const wrap = document.createElement("span");
  wrap.className = "hero__name-wrap";
  title.appendChild(wrap);

  lines.forEach((lineData) => {
    const line = document.createElement("span");
    line.className = "hero__name-line";
    lineData.classes.forEach((name) => line.classList.add(name));

    [...lineData.text].forEach((char) => {
      const letter = document.createElement("span");
      letter.className = "letter";

      const inner = document.createElement("span");
      inner.className = "letter__inner";
      const glyph = document.createElement("span");
      glyph.className = "letter__glyph";
      glyph.textContent = char === " " ? "\u00A0" : char;
      inner.appendChild(glyph);

      if (char === " ") {
        letter.classList.add("letter--space");
      } else {
        const revealDelay = revealBaseDelay + revealIndex * revealStep;
        letter.style.setProperty("--reveal-delay", `${revealDelay.toFixed(2)}s`);
        letter.style.setProperty("--drop-distance", `${randomBetween(18, 44).toFixed(1)}px`);
        revealIndex += 1;

        const floatShift = (Math.random() < 0.5 ? -1 : 1) * randomBetween(0.8, 2.2);
        const floatRotate = randomBetween(-0.5, 0.5);

        letter.style.setProperty("--float-duration", `${randomBetween(4.8, 8.6).toFixed(2)}s`);
        letter.style.setProperty("--float-delay", `${randomBetween(0, 1.2).toFixed(2)}s`);
        letter.style.setProperty("--float-shift", `${floatShift.toFixed(2)}px`);
        letter.style.setProperty("--float-rotate", `${floatRotate.toFixed(2)}deg`);

        inner.style.setProperty("--warp-duration", `${randomBetween(6.2, 10.2).toFixed(2)}s`);
        inner.style.setProperty("--warp-delay", `${randomBetween(0, 1.4).toFixed(2)}s`);
        inner.style.setProperty("--warp-shift-1", `${(-randomBetween(0.6, 1.8)).toFixed(2)}px`);
        inner.style.setProperty("--warp-shift-2", `${randomBetween(0.6, 1.8).toFixed(2)}px`);
        inner.style.setProperty("--warp-scale-x-1", randomBetween(1.01, 1.03).toFixed(3));
        inner.style.setProperty("--warp-scale-y-1", randomBetween(0.98, 0.99).toFixed(3));
        inner.style.setProperty("--warp-scale-x-2", randomBetween(0.98, 1.0).toFixed(3));
        inner.style.setProperty("--warp-scale-y-2", randomBetween(1.01, 1.03).toFixed(3));
        inner.style.setProperty("--warp-skew-1", `${randomBetween(-1.0, -0.3).toFixed(2)}deg`);
        inner.style.setProperty("--warp-skew-2", `${randomBetween(0.3, 1.0).toFixed(2)}deg`);
        inner.style.setProperty("--warp-rotate-1", `${randomBetween(-0.5, -0.1).toFixed(2)}deg`);
        inner.style.setProperty("--warp-rotate-2", `${randomBetween(0.1, 0.5).toFixed(2)}deg`);
      }

      letter.appendChild(inner);
      line.appendChild(letter);
    });

    wrap.appendChild(line);
  });

  if (!prefersReducedMotion) {
    const maxShift = 3;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let rafId = null;

    const update = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      title.style.setProperty("--cursor-x", `${currentX.toFixed(2)}px`);
      title.style.setProperty("--cursor-y", `${currentY.toFixed(2)}px`);

      if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
        rafId = requestAnimationFrame(update);
      } else {
        rafId = null;
      }
    };

    const onMove = (event) => {
      const rect = title.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }

      const offsetX = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const offsetY = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

      targetX = clamp(offsetX, -1, 1) * maxShift;
      targetY = clamp(offsetY, -1, 1) * maxShift;

      if (!rafId) {
        rafId = requestAnimationFrame(update);
      }
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      if (!rafId) {
        rafId = requestAnimationFrame(update);
      }
    };

    title.addEventListener("pointermove", onMove);
    title.addEventListener("pointerleave", onLeave);
  }

  const heroWrap = title.querySelector(".hero__name-wrap");
  const heroLines = [...title.querySelectorAll(".hero__name-line")];

  updateHeroMetrics = () => {
    if (!heroWrap || !heroLines.length) {
      return;
    }
    const lineRects = heroLines.map((line) => line.getBoundingClientRect());
    const minLeft = Math.min(...lineRects.map((rect) => rect.left));
    const maxRight = Math.max(...lineRects.map((rect) => rect.right));
    const minTop = Math.min(...lineRects.map((rect) => rect.top));
    const maxBottom = Math.max(...lineRects.map((rect) => rect.bottom));
    const width = Math.max(0, maxRight - minLeft);
    const height = Math.max(0, maxBottom - minTop);

    if (width > 0) {
      title.style.setProperty("--hero-line-offset", `${(width / 2).toFixed(2)}px`);
    }
    if (height > 0) {
      heroWrap.style.height = `${height}px`;
      title.style.setProperty("--hero-line-height", `${height.toFixed(2)}px`);
    }
  };

  updateHeroMetrics();
  window.addEventListener("resize", updateHeroMetrics);
}

if (title && !prefersReducedMotion) {
  const heroLineJoana = document.querySelector(".hero__name-line--chunky");
  const heroLineMarques = document.querySelector(".hero__name-line--montana");

  if (heroLineJoana || heroLineMarques) {
    applyHeroIntro = () => {
      if (heroLineJoana) {
        heroLineJoana.style.setProperty("--line-shift", "0px");
      }
      if (heroLineMarques) {
        heroLineMarques.style.setProperty("--line-shift", "0px");
      }
    };

    const onIntroResize = () => {
      if (typeof applyHeroIntro === "function") {
        applyHeroIntro();
      }
    };

    if (typeof applyHeroIntro === "function") {
      applyHeroIntro();
    }
    window.addEventListener("resize", onIntroResize);
  }
}

if (!prefersReducedMotion && !usesTouchScroll) {
  const driftAmplitude = 1.2;
  const driftSpeed = 0.00025;
  const idleDelay = 1400;
  let baseY = window.scrollY;
  let lastUserInput = performance.now();
  let lastAutoY = baseY;
  let autoScrollActive = false;

  const markUserInput = () => {
    lastUserInput = performance.now();
    baseY = window.scrollY;
  };

  const onScroll = () => {
    const currentY = window.scrollY;
    if (autoScrollActive && Math.abs(currentY - lastAutoY) < 0.6) {
      autoScrollActive = false;
      return;
    }
    baseY = currentY;
    lastUserInput = performance.now();
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  ["wheel", "touchstart", "touchmove", "keydown", "pointerdown"].forEach((eventName) => {
    window.addEventListener(eventName, markUserInput, { passive: true });
  });

  const tick = (time) => {
    if (storyActive || hasOpenWorkItem()) {
      requestAnimationFrame(tick);
      return;
    }
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    if (maxScroll > 0 && time - lastUserInput > idleDelay) {
      const offset = Math.sin(time * driftSpeed) * driftAmplitude;
      const target = Math.min(maxScroll, Math.max(0, baseY + offset));
      if (Math.abs(target - window.scrollY) > 0.1) {
        autoScrollActive = true;
        lastAutoY = target;
        scrollWindowImmediate(target);
      }
    }
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

if (!prefersReducedMotion) {
  let gridTargetX = 0;
  let gridTargetY = 0;
  let gridCurrentX = 0;
  let gridCurrentY = 0;
  let gridRafId = null;
  const pixelRatio = window.devicePixelRatio || 1;
  const snapToPixel = (value) => Math.round(value * pixelRatio) / pixelRatio;

  const updateGrid = () => {
    gridCurrentX += (gridTargetX - gridCurrentX) * 0.12;
    gridCurrentY += (gridTargetY - gridCurrentY) * 0.12;

    const snappedX = snapToPixel(gridCurrentX);
    const snappedY = snapToPixel(gridCurrentY);

    document.body.style.setProperty("--grid-shift-x", `${snappedX}px`);
    document.body.style.setProperty("--grid-shift-y", `${snappedY}px`);

    if (
      Math.abs(gridTargetX - gridCurrentX) > 0.1 ||
      Math.abs(gridTargetY - gridCurrentY) > 0.1
    ) {
      gridRafId = requestAnimationFrame(updateGrid);
    } else {
      gridRafId = null;
    }
  };

  const setGridTarget = (clientX, clientY) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    if (!centerX || !centerY) {
      return;
    }
    const normalizedX = clamp((clientX - centerX) / centerX, -1, 1);
    const normalizedY = clamp((clientY - centerY) / centerY, -1, 1);
    const maxShift = clamp(window.innerWidth * 0.03, 16, 48);
    gridTargetX = normalizedX * maxShift;
    gridTargetY = normalizedY * maxShift;
    if (!gridRafId) {
      gridRafId = requestAnimationFrame(updateGrid);
    }
  };

  const resetGridTarget = () => {
    gridTargetX = 0;
    gridTargetY = 0;
    if (!gridRafId) {
      gridRafId = requestAnimationFrame(updateGrid);
    }
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "touch") {
        return;
      }
      setGridTarget(event.clientX, event.clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    "mouseout",
    (event) => {
      if (!event.relatedTarget) {
        resetGridTarget();
      }
    },
    { passive: true }
  );

  window.addEventListener("blur", resetGridTarget);
  resetGridTarget();
}

if (!prefersReducedMotion) {
  const heroSection = document.querySelector(".hero");
  const heroLetters = [
    ...document.querySelectorAll(".hero__name .letter:not(.letter--space)"),
  ];

  if (heroSection && heroLetters.length) {
    let fadeRafId = null;
    let fadeDistance = 0;

    const recalcFadeDistance = () => {
      fadeDistance = Math.max(240, heroSection.offsetHeight * 0.7);
    };

    const updateLetterFade = () => {
      const progress = clamp(window.scrollY / fadeDistance, 0, 1);
      const stagger =
        heroLetters.length > 1 ? 0.55 / (heroLetters.length - 1) : 0;
      const fadeWindow = 0.45;

      heroLetters.forEach((letter, index) => {
        const start = index * stagger;
        const local = clamp((progress - start) / fadeWindow, 0, 1);
        const eased = local * local * (3 - 2 * local);
        const opacity = (1 - eased).toFixed(3);
        const blur = (eased * 6).toFixed(2);

        letter.style.setProperty("--letter-opacity", opacity);
        letter.style.setProperty("--letter-blur", `${blur}px`);
      });

      fadeRafId = null;
    };

    const onFadeScroll = () => {
      if (!fadeRafId) {
        fadeRafId = requestAnimationFrame(updateLetterFade);
      }
    };

    recalcFadeDistance();
    updateLetterFade();
    window.addEventListener("scroll", onFadeScroll, { passive: true });
    window.addEventListener("resize", () => {
      recalcFadeDistance();
      onFadeScroll();
    });
  }
}

const identityTitle = document.querySelector(".identity-title");
const identityPanel = document.querySelector(".identity-panel");
if (identityTitle && identityPanel) {
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    identityTitle.classList.add("is-visible");
    identityPanel.classList.add("is-visible");
  } else {
    const identityObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            identityTitle.classList.add("is-visible");
            identityPanel.classList.add("is-visible");
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -5% 0px" }
    );
    identityObserver.observe(identityPanel);
  }
}

const toolsPanel = document.querySelector(".tools-panel");
if (toolsPanel) {
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    toolsPanel.classList.add("is-visible");
  } else {
    const toolsObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            toolsPanel.classList.add("is-visible");
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -5% 0px" }
    );
    toolsObserver.observe(toolsPanel);
  }
}

const toolDockItems = document.querySelectorAll(".tool-dock__item");
if (toolDockItems.length) {
  toolDockItems.forEach((item, index) => {
    const delay = 0.22 + index * 0.06;
    item.style.setProperty("--dock-delay", `${delay.toFixed(2)}s`);
  });
}

const workTitle = document.querySelector(".work-title");
const workPanel = document.querySelector("#work");
const workHeader = document.querySelector(".work-header");
if (workTitle && workPanel) {
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    workTitle.classList.add("is-visible");
    workPanel.classList.add("is-visible");
  } else {
    const workTarget = workHeader || workPanel;
    const workObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            workTitle.classList.add("is-visible");
            workPanel.classList.add("is-visible");
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -25% 0px" }
    );
    workObserver.observe(workTarget);
  }
}

const workItems = document.querySelectorAll(".work-item");
let updateWorkMotion = null;
if (workItems.length) {
  const baseDelay = 0.05;
  workItems.forEach((item, index) => {
    const delay = baseDelay + index * 0.12;
    item.style.setProperty("--reveal-delay", `${delay.toFixed(2)}s`);
    const shift = randomBetween(-24, 24);
    const offset = randomBetween(-10, 10);
    item.style.setProperty("--work-shift", `${shift.toFixed(1)}px`);
    item.style.setProperty("--work-offset", `${offset.toFixed(1)}px`);

    item.addEventListener(
      "animationend",
      (event) => {
        if (event.animationName === "workJump") {
          item.classList.add("is-settled");
        }
      },
      { once: true }
    );
  });
}

if (workItems.length && !prefersReducedMotion && "IntersectionObserver" in window) {
  const workItemsObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -15% 0px" }
  );

  workItems.forEach((item) => workItemsObserver.observe(item));
} else if (workItems.length) {
  workItems.forEach((item) => {
    item.classList.add("is-visible");
    item.classList.add("is-settled");
  });
}

if (workItems.length && !prefersReducedMotion) {
  const workSection = document.querySelector("#work");
  const workItemList = [...workItems];
  let motionRafId = null;

  updateWorkMotion = () => {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportCenter = viewportHeight / 2;

    workItemList.forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.bottom < -160 || rect.top > viewportHeight + 160) {
        item.style.setProperty("--work-parallax", "0px");
        item.style.setProperty("--work-tilt-z", "0deg");
        item.style.setProperty("--work-skew", "0deg");
        return;
      }

      const center = rect.top + rect.height / 2;
      const progress = clamp((center - viewportCenter) / viewportCenter, -1, 1);
      const isOpen = item.classList.contains("is-open");
      const parallax = isOpen ? 0 : -progress * 18;
      const tilt = isOpen ? 0 : progress * 2.2;
      const skew = isOpen ? 0 : progress * 1.4;

      item.style.setProperty("--work-parallax", `${parallax.toFixed(2)}px`);
      item.style.setProperty("--work-tilt-z", `${tilt.toFixed(2)}deg`);
      item.style.setProperty("--work-skew", `${skew.toFixed(2)}deg`);
    });

    motionRafId = null;
  };

  const onWorkMotionScroll = () => {
    if (!motionRafId) {
      motionRafId = requestAnimationFrame(updateWorkMotion);
    }
  };

  updateWorkMotion();
  window.addEventListener("scroll", onWorkMotionScroll, { passive: true });
  window.addEventListener("resize", onWorkMotionScroll);

  let snapTimer = null;
  let snapLockedUntil = 0;
  let lastInputTime = performance.now();
  let pointerActive = false;

  const markInput = () => {
    lastInputTime = performance.now();
  };

  const setPointerActive = (active) => {
    pointerActive = active;
    markInput();
  };

  window.addEventListener("pointerdown", () => setPointerActive(true), { passive: true });
  window.addEventListener("pointerup", () => setPointerActive(false), { passive: true });
  window.addEventListener("pointercancel", () => setPointerActive(false), { passive: true });
  window.addEventListener("touchend", () => setPointerActive(false), { passive: true });
  ["wheel", "touchstart", "touchmove", "keydown"].forEach((eventName) => {
    window.addEventListener(eventName, markInput, { passive: true });
  });

  const maybeSnapWork = () => {
    if (usesTouchScroll) {
      return;
    }

    if (!workSection || !workItemList.length) {
      return;
    }
    if (pointerActive) {
      return;
    }
    if (performance.now() < snapLockedUntil) {
      return;
    }
    if (performance.now() - lastInputTime > 1200) {
      return;
    }
    if (document.querySelector(".work-item.is-open")) {
      return;
    }

    const viewportCenter = window.scrollY + window.innerHeight * 0.5;
    const sectionTop = workSection.offsetTop;
    const sectionBottom = sectionTop + workSection.offsetHeight;
    if (viewportCenter < sectionTop || viewportCenter > sectionBottom) {
      return;
    }

    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const snapOffset = Math.min(180, window.innerHeight * 0.2);
    let closestDistance = Infinity;
    let targetY = window.scrollY;

    workItemList.forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (!rect.height) {
        return;
      }
      const itemTop = rect.top + window.scrollY;
      const anchor = itemTop - snapOffset;
      const distance = Math.abs(anchor - window.scrollY);
      if (distance < closestDistance) {
        closestDistance = distance;
        targetY = anchor;
      }
    });

    const maxSnap = Math.min(200, window.innerHeight * 0.28);
    if (closestDistance > maxSnap) {
      return;
    }

    const clampedTarget = clamp(targetY, 0, maxScroll);
    if (Math.abs(clampedTarget - window.scrollY) < 4) {
      return;
    }

    snapLockedUntil = performance.now() + 500;
    window.scrollTo({ top: clampedTarget, behavior: "smooth" });
  };

  const onWorkSnapScroll = () => {
    if (snapTimer) {
      window.clearTimeout(snapTimer);
    }
    snapTimer = window.setTimeout(maybeSnapWork, 140);
  };

  window.addEventListener("scroll", onWorkSnapScroll, { passive: true });
}

const contactHeading = document.querySelector(".contact-heading");
const contactPanel = document.querySelector("#contact");
if (contactHeading && contactPanel) {
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    contactHeading.classList.add("is-visible");
    contactPanel.classList.add("is-visible");
  } else {
    const contactObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            contactHeading.classList.add("is-visible");
            contactPanel.classList.add("is-visible");
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -5% 0px" }
    );
    contactObserver.observe(contactPanel);
  }
}

const contactCards = document.querySelectorAll(".contact-card");
if (contactCards.length) {
  contactCards.forEach((card, index) => {
    const delay = 0.18 + index * 0.12;
    card.style.setProperty("--contact-delay", `${delay.toFixed(2)}s`);
  });
}

const workToggles = document.querySelectorAll(".work-item__toggle");
const workEntries = [];
const workSectionElement = document.querySelector("#work");
const workNavLinks = document.querySelectorAll('.site-nav a[href^="#"]');

const hasOpenWorkItem = () => Boolean(document.querySelector(".work-item.is-open"));
const getWorkFocusOffset = () => clamp(window.innerHeight * 0.06, 18, 64);
const getWorkFocusBottomOffset = () => clamp(window.innerHeight * 0.14, 64, 148);
const getElementDocumentTop = (element) => {
  let top = 0;
  let current = element;

  while (current) {
    top += current.offsetTop || 0;
    current = current.offsetParent;
  }

  return top;
};

const getWorkFocusBounds = () => {
  const openWorkItem = document.querySelector(".work-item.is-open");
  if (!openWorkItem) {
    return null;
  }

  const maxDocumentScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const openItemTop = getElementDocumentTop(openWorkItem);
  const openItemBottom = openItemTop + openWorkItem.offsetHeight;
  const minScroll = clamp(openItemTop - getWorkFocusOffset(), 0, maxDocumentScroll);
  const maxScroll = clamp(
    Math.max(minScroll, openItemBottom - window.innerHeight + getWorkFocusBottomOffset()),
    0,
    maxDocumentScroll
  );

  return { minScroll, maxScroll };
};

let workFocusClampRaf = null;

const clampWorkFocusScroll = () => {
  if (!hasOpenWorkItem()) {
    return;
  }

  const bounds = getWorkFocusBounds();
  if (!bounds) {
    return;
  }

  const target = clamp(window.scrollY, bounds.minScroll, bounds.maxScroll);
  if (Math.abs(target - window.scrollY) < 1) {
    return;
  }

  scrollWindowImmediate(target);
};

const requestWorkFocusClamp = () => {
  if (usesTouchScroll) {
    return;
  }

  if (workFocusClampRaf) {
    return;
  }

  workFocusClampRaf = requestAnimationFrame(() => {
    workFocusClampRaf = null;
    clampWorkFocusScroll();
  });
};

const scrollWorkFocusBy = (delta) => {
  const bounds = getWorkFocusBounds();
  if (!bounds) {
    return false;
  }

  const target = clamp(window.scrollY + delta, bounds.minScroll, bounds.maxScroll);
  if (Math.abs(target - window.scrollY) < 0.5) {
    return true;
  }

  scrollWindowImmediate(target);
  return true;
};

const scrollWorkFocusToEdge = (edge) => {
  const bounds = getWorkFocusBounds();
  if (!bounds) {
    return false;
  }

  const target = edge === "start" ? bounds.minScroll : bounds.maxScroll;
  if (Math.abs(target - window.scrollY) < 0.5) {
    return true;
  }

  scrollWindowImmediate(target);
  return true;
};

const maybeHandleWorkFocusOverflow = (delta) => {
  if (usesTouchScroll) {
    return false;
  }

  const bounds = getWorkFocusBounds();
  if (!bounds) {
    return false;
  }

  const current = window.scrollY;
  const next = current + delta;
  const target = clamp(next, bounds.minScroll, bounds.maxScroll);
  const isOutOfBounds = current < bounds.minScroll - 0.5 || current > bounds.maxScroll + 0.5;
  const willOverflow = Math.abs(target - next) > 0.5;

  if (!isOutOfBounds && !willOverflow) {
    return false;
  }

  if (Math.abs(target - current) < 0.5) {
    return true;
  }

  scrollWindowImmediate(target);
  return true;
};

const cancelExpandedSync = (entry) => {
  if (!entry.expandRaf) {
    return;
  }

  cancelAnimationFrame(entry.expandRaf);
  entry.expandRaf = null;
};

const syncExpandedHeight = (entry) => {
  const { workItem, expanded } = entry;
  if (!expanded || !workItem.classList.contains("is-open")) {
    return;
  }

  cancelExpandedSync(entry);
  entry.expandRaf = requestAnimationFrame(() => {
    entry.expandRaf = null;
    expanded.style.setProperty("--expanded-max-height", `${expanded.scrollHeight}px`);
    requestWorkFocusClamp();
  });
};

let updateScrollVideos = () => {};

const setWorkOpen = (entry, open) => {
  const { workItem, toggle, expanded } = entry;
  cancelExpandedSync(entry);
  workItem.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  if (expanded) {
    expanded.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) {
      const launcher = expanded.querySelector(".work-item__game");
      if (launcher) {
        const controller = gameControllers.get(launcher);
        const autoplay = launcher.getAttribute("data-autoplay") === "true";
        if (autoplay) {
          controller?.start();
        }
      }

      if (typeof updateScrollVideos === "function") {
        requestAnimationFrame(updateScrollVideos);
      }

      syncExpandedHeight(entry);
    } else {
      expanded.style.setProperty("--expanded-max-height", "0px");

      expanded.querySelectorAll("video").forEach((video) => {
        video.pause?.();
        video.currentTime = 0;
      });

      const launcher = expanded.querySelector(".work-item__game");
      if (launcher) {
        const frame = launcher.querySelector("iframe");
        if (frame?.contentWindow) {
          frame.contentWindow.postMessage({ type: "game-stop" }, "*");
        }
        const controller = gameControllers.get(launcher);
        controller?.reset();
      }
    }
  }
  if (!open) {
    workItem.classList.remove("is-color");
  }
  updateGridState();
  if (typeof updateWorkMotion === "function") {
    updateWorkMotion();
  }
  requestWorkFocusClamp();
};

const clearHoverStates = (keepItem = null) => {
  workEntries.forEach((entry) => {
    if (entry.workItem === keepItem) {
      return;
    }
    if (!entry.workItem.classList.contains("is-open")) {
      entry.workItem.classList.remove("is-color");
    }
  });
};

const scrollWorkIntoView = (workItem) => {
  if (!workItem) {
    return;
  }

  const behavior = prefersReducedMotion ? "auto" : "smooth";
  const offset = getWorkFocusOffset();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const itemTop = getElementDocumentTop(workItem);
      const bounds = getWorkFocusBounds();
      const maxDocumentScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const minScroll = !usesTouchScroll && bounds ? bounds.minScroll : 0;
      const maxScroll = !usesTouchScroll && bounds ? bounds.maxScroll : maxDocumentScroll;
      const target = clamp(itemTop - offset, minScroll, maxScroll);

      if (Math.abs(target - window.scrollY) < 6) {
        return;
      }

      window.scrollTo({ top: target, behavior });
    });
  });
};

const closeOpenWorkItem = () => {
  const openEntry = workEntries.find(({ workItem }) => workItem.classList.contains("is-open"));
  if (!openEntry) {
    return null;
  }

  setWorkOpen(openEntry, false);
  clearHoverStates(null);
  triggerGridPulse();
  return openEntry;
};

const closeOtherWorks = (current) => {
  workEntries.forEach((entry) => {
    if (entry !== current && entry.workItem.classList.contains("is-open")) {
      setWorkOpen(entry, false);
    }
  });
};

workToggles.forEach((toggle) => {
  const workItem = toggle.closest(".work-item");
  if (!workItem) {
    return;
  }

  const expandedId = toggle.getAttribute("aria-controls");
  const expanded = expandedId ? document.getElementById(expandedId) : null;
  const entry = { workItem, toggle, expanded };
  workEntries.push(entry);

  if (expanded) {
    const expandedContent = expanded.firstElementChild;
    if (expandedContent && typeof ResizeObserver === "function") {
      const resizeObserver = new ResizeObserver(() => {
        syncExpandedHeight(entry);
      });
      resizeObserver.observe(expandedContent);
      entry.resizeObserver = resizeObserver;
    }
  }

  const setHover = (active) => {
    if (active) {
      workItem.classList.add("is-color");
      return;
    }
    if (!workItem.classList.contains("is-open")) {
      workItem.classList.remove("is-color");
    }
  };

  const toggleWork = () => {
    const willOpen = !workItem.classList.contains("is-open");
    if (willOpen) {
      closeOtherWorks(entry);
      clearHoverStates(workItem);
    }
    setWorkOpen(entry, willOpen);
    if (willOpen) {
      scrollWorkIntoView(workItem);
    }
    if (!willOpen) {
      clearHoverStates(null);
      scrollWorkIntoView(workItem);
    }
    triggerGridPulse();
  };

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleWork();
  });

  workItem.addEventListener("click", (event) => {
    const isInteractiveTarget = event.target.closest(
      "a, button, video, iframe, canvas, input, select, textarea, .work-item__game"
    );
    if (isInteractiveTarget) {
      return;
    }

    if (workItem.classList.contains("is-open") && event.target.closest(".work-item__expanded")) {
      return;
    }

    toggleWork();
  });
  toggle.addEventListener("pointerenter", () => setHover(true));
  toggle.addEventListener("pointerleave", () => setHover(false));
  toggle.addEventListener("focus", () => setHover(true));
  toggle.addEventListener("blur", () => setHover(false));
});

const updateGridState = () => {
  const hasOpenWork = hasOpenWorkItem();
  document.body.classList.toggle("grid-accent", hasOpenWork);
  document.body.classList.toggle("grid-zoomed", hasOpenWork);
  document.body.classList.toggle("work-focus", hasOpenWork);
};

if (workSectionElement) {
  window.addEventListener("resize", requestWorkFocusClamp);
}

workNavLinks.forEach((link) => {
  const href = link.getAttribute("href");
  if (!href || href === "#work") {
    return;
  }

  link.addEventListener("click", (event) => {
    if (!hasOpenWorkItem()) {
      return;
    }

    const target = document.querySelector(href);
    if (!target) {
      return;
    }

    event.preventDefault();
    const closedEntry = closeOpenWorkItem();
    if (!closedEntry) {
      return;
    }

    requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  });
});

workEntries.forEach((entry) => {
  const { workItem, expanded } = entry;
  const full = expanded?.querySelector(".work-item__full");
  if (!full) {
    return;
  }

  const backTopButton = document.createElement("button");
  backTopButton.type = "button";
  backTopButton.className = "work-item__back-top";
  backTopButton.setAttribute("data-i18n-attr", "aria-label:work.backtop.aria");
  backTopButton.setAttribute("aria-label", "Back to the top of the project");
  backTopButton.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 19V5M12 5L6 11M12 5L18 11" />
    </svg>
    <span data-i18n="work.backtop">back to the top</span>
  `;

  backTopButton.addEventListener("click", () => {
    scrollWorkIntoView(workItem);
    backTopButton.blur();
  });

  full.append(backTopButton);
});

const translations = {
  en: {
    "nav.work": "Work",
    "nav.about": "About me",
    "nav.contact": "Contact",
    "nav.aria": "Primary navigation",
    "work.title": "Work",
    "work.intro":
      "Projects developed across different areas of design, from digital experiences and interactive interfaces to visual identity and communication. Each work represents an exploration between concept, aesthetics and experience.",
    "work.meta.visualidentity": "Visual identity · 2024",
    "work.meta.tmd": "Website with backend · 2025",
    "work.meta.game": "Game · 2025",
    "work.meta.p3": "Digital storytelling · 2025",
    "work.meta.blender": "3D animation · 2025",
    "work.meta.musicvideo": "mobile app design · 2026",
    "work.meta.safepoint": "mobile app design · 2026",
    "work.meta.beyondearth": "interactive web experience · 2026",
    "work.desc.tmd":
      "EatEasy is a web platform for discovering and booking restaurants. The project allows users to search for restaurants, view details, choose a date and time, and make online reservations. It also includes an administration area for managing restaurants and bookings. It was developed in PHP with a PostgreSQL database, combining dynamic functionality with a warm and intuitive visual interface.",
    "work.tmd.palette": "Color palette",
    "work.tmd.type": "Typography",
    "work.desc.game":
      "Robot Adventure is a 2D top-down game where the player controls a small robot exploring a polluted forest, collecting waste and revitalizing plants while managing limited energy and avoiding obstacles. The project combines game mechanics, interaction design, and environmental storytelling, with increasing difficulty levels and a focus on sustainability.",
    "work.desc.p3":
      "Lamb to the Slaughter is an interactive web experience based on the short story by Roald Dahl. The project reinterprets the narrative through scroll-based interaction, visual storytelling and animated moments that guide the user through key scenes of the story. " +
      "Using a minimal black-and-white visual language, the experience creates contrast between the ordinary domestic setting and the violence hidden within the plot. The interaction invites the user to progress through the story gradually, turning reading into a more immersive and cinematic experience.",
    "work.collab.p3":
      "Collaboration with: Gonçalo Carvalho & Maria Inês Rualde",
    "work.desc.blender":
      "This 3D animation builds a visual narrative through the transformation of an everyday space. Developed around a pre-existing animation, which was reinterpreted and adapted by replacing the original element with a basketball, the project explores how common objects can gain movement and autonomy, altering the perception of the environment. Through physics simulation, the piece investigates instability, rhythm and the unexpected behavior of familiar objects.",
    "work.desc.visualidentity":
      "This project develops a personal visual identity based on a modular system. Through the repetition and reorganization of graphic units, the identity is built as a flexible and adaptable structure. The system allows consistent variations while maintaining formal and conceptual coherence.",
    "work.desc.safepoint":
      "SafePoint is a mobile app prototype designed in Figma for emergency contexts in situations of war. The interface brings together missing person reports, safe and danger zones, shelter information and route guidance, using a direct visual system built for fast decisions under pressure.",
    "work.desc.beyondearth":
      "As the user approaches each planet, they can explore it more closely and analyse its conditions. However, as new worlds are discovered, it becomes clear that none of them offers truly ideal or accessible conditions to replace Earth.",
    "beyondearth.video.title":
      "Introduction to the narrative of Beyond Earth: humanity searches for a new habitable planet after destroying its own home.",
    "beyondearth.video.search":
      "Visual feedback that reinforces the uncertainty of space exploration and encourages the user to keep searching.",
    "beyondearth.video.fuel":
      "Fuel depleted\nA failure state that makes resource limitations visible and adds tension to the exploration experience.",
    "beyondearth.video.desert":
      "A hot and unstable planet, with sandstorms that introduce a more physical and dynamic interaction.",
    "beyondearth.video.ice":
      "Extreme environment marked by intense cold, falling ice and a hostile atmosphere that demands attention and silence.",
    "beyondearth.video.gravity":
      "Low-gravity scenario where the user must react to the movement of rocks and adapt to the planet's conditions.",
    "safepoint.card.hero.eyebrow": "Figma prototype",
    "safepoint.card.hero.title": "Emergency support app",
    "safepoint.card.hero.text":
      "Core flows for reporting missing people, checking nearby resources and moving through safer routes.",
    "safepoint.card.figma.eyebrow": "Prototype map",
    "safepoint.card.figma.title": "Designed and connected in Figma",
    "safepoint.card.figma.text":
      "The project explores navigation between emergency flows, with map states, forms and alert pages linked as an interactive prototype.",
    "safepoint.card.map.eyebrow": "Interactive map",
    "safepoint.card.map.title": "Search safe resources",
    "safepoint.card.map.text":
      "A draggable map lets users explore shelter points, hospitals and risk zones, making nearby support easier to identify under pressure.",
    "safepoint.card.account.eyebrow": "Account flow",
    "safepoint.card.account.title": "Create account",
    "safepoint.card.account.text":
      "Simple onboarding keeps the entry point clear before the user reaches the safety tools.",
    "safepoint.card.report.eyebrow": "Report flow",
    "safepoint.card.report.title": "Missing person report",
    "safepoint.card.report.text":
      "Structured fields collect essential information quickly, while keeping the action visible.",
    "safepoint.card.tips.eyebrow": "Emergency content",
    "safepoint.card.tips.title": "Practical guidance",
    "safepoint.card.tips.text":
      "Tip lists make urgent information scannable, with large touch targets and high contrast.",
    "safepoint.card.shelter.eyebrow": "Resource detail",
    "safepoint.card.shelter.title": "Shelter information",
    "safepoint.card.shelter.text":
      "Location, needs and directions are grouped with a map preview for immediate orientation.",
    "safepoint.palette.app": "App colors",
    "safepoint.palette.map": "Icon and map colors",
    "work.elements": "Elements",
    "work.play.prompt": "Tap to play",
    "work.launch.prompt": "Tap to launch",
    "work.project.open": "open full project",
    "work.project.sample": "project sample",
    "work.backtop": "back to the top",
    "work.backtop.aria": "Back to the top of the project",
    "about.title": "About me",
    "about.text":
      "I am a multidisciplinary designer with a special interest in UX/UI, interactive design and digital experiences.\nI enjoy creating projects that bring together aesthetics and functionality, exploring typography, layout and interaction as ways to make communication clearer, more engaging and more intuitive.\nThroughout my path, I have worked across different formats, from editorial to digital, always with a practical, curious and experimental approach.\nI am interested in understanding how people interact with what I design and in finding visual solutions that are useful, coherent and meaningful.",
    "about.text.mobile":
      "I am a multidisciplinary designer with a special interest in UX/UI, interactive design and digital experiences.\nThroughout my path, I have worked across different formats, from editorial to digital, always with a practical, curious and experimental approach.\nI am interested in understanding how people interact with what I design and in finding visual solutions that are useful, coherent and meaningful.",
    "about.cv.open": "Open CV",
    "tools.intro": "a small dock with the tools I return to most.",
    "tools.aria": "Apps I use dock",
    "contact.title": "Contact me",
    "work.toggle": "Toggle project details",
    "ui.fullscreen": "Toggle fullscreen",
    "alt.tmd.site": "EatEasy site image",
    "alt.tmd.palette": "EatEasy color palette",
    "alt.game.arvore": "Game element: tree",
    "alt.game.estrela": "Game element: star",
    "alt.game.inseto": "Game element: insect",
    "alt.game.lata": "Game element: can",
    "alt.game.obstaculo": "Game element: obstacle",
    "alt.game.recarga": "Game element: energy",
    "alt.game.robo": "Game element: robot",
    "alt.game.special": "Game element: special",
    "alt.game.tronco": "Game element: trunk",
    "alt.game.play": "EcoBot game",
    "alt.beyondearth.play": "Beyond Earth interactive experience",
    "alt.beyondearth.videos": "Beyond Earth experience videos",
    "alt.beyondearth.video.title": "Beyond Earth title sequence",
    "alt.beyondearth.video.search": "Beyond Earth planet search",
    "alt.beyondearth.video.fuel": "Beyond Earth fuel state",
    "alt.beyondearth.video.desert": "Beyond Earth desert planet",
    "alt.beyondearth.video.ice": "Beyond Earth ice planet",
    "alt.beyondearth.video.gravity": "Beyond Earth gravity planet",
    "alt.blender.video": "the office video",
    "alt.visualidentity": "Visual identity final image",
    "alt.p3.palette": "Lamb to the Slaughter color palette",
    "alt.p3.preview": "Lamb to the Slaughter interactive website preview",
    "alt.p3.scroll": "Scrollable project screen",
    "alt.p3.screen": "Lamb to the Slaughter website screen",
    "alt.p3.mac": "Mac mockup",
    "alt.safepoint.route": "SafePoint route screen",
    "alt.safepoint.menu": "SafePoint menu screen",
    "alt.safepoint.mockup": "SafePoint app mockup",
    "alt.safepoint.screens": "SafePoint app screens",
    "alt.safepoint.figma": "SafePoint Figma prototype overview",
    "alt.safepoint.map": "SafePoint interactive map with shelters, hospitals and zones",
    "alt.safepoint.mapvideo": "SafePoint draggable map interaction",
    "alt.safepoint.account": "SafePoint create account screen",
    "alt.safepoint.report": "SafePoint report missing person screen",
    "alt.safepoint.tips": "SafePoint emergency tips screen",
    "alt.safepoint.shelter": "SafePoint shelter information screen",
    "alt.safepoint.palette.app": "SafePoint app color palette",
    "alt.safepoint.palette.map": "SafePoint icon and map color palette",
    "lang.label": "Language",
  },
  pt: {
    "nav.work": "Trabalhos",
    "nav.about": "Sobre mim",
    "nav.contact": "Contacto",
    "nav.aria": "Navegação principal",
    "work.title": "Trabalhos",
    "work.intro":
      "Projetos desenvolvidos em diferentes áreas do design, desde experiências digitais e interfaces interativas até identidade visual e comunicação. Cada trabalho representa uma exploração entre conceito, estética e experiência.",
    "work.meta.visualidentity": "Identidade visual · 2024",
    "work.meta.tmd": "Website com backend · 2025",
    "work.meta.game": "Jogo · 2025",
    "work.meta.p3": "Storytelling digital · 2025",
    "work.meta.blender": "Animação 3D · 2025",
    "work.meta.musicvideo": "design de aplicação móvel · 2026",
    "work.meta.safepoint": "design de aplicação móvel · 2026",
    "work.meta.beyondearth": "experiência web interativa · 2026",
    "work.desc.tmd":
      "EatEasy é uma plataforma web para descoberta e reserva de restaurantes. O projeto permite pesquisar restaurantes, consultar detalhes, escolher data e hora, e realizar reservas online. Inclui ainda uma área de administração para gestão de restaurantes e reservas. Foi desenvolvido em PHP com base de dados PostgreSQL, combinando funcionalidades dinâmicas com uma interface visual acolhedora e intuitiva.",
    "work.tmd.palette": "Paleta de cores",
    "work.tmd.type": "Tipografia",
    "work.desc.game":
      "Robot Adventure é um jogo 2D top-down em que o jogador controla um pequeno robô que explora uma floresta poluída, recolhe resíduos e revitaliza plantas, enquanto gere energia limitada e evita obstáculos. O projeto combina mecânicas de jogo, design de interação e narrativa ambiental, com níveis de dificuldade crescente e foco na sustentabilidade.",
    "work.desc.p3":
      "Lamb to the Slaughter é uma experiência web interativa baseada no conto de Roald Dahl. O projeto reinterpreta a narrativa através de interação baseada em scroll, storytelling visual e momentos animados que guiam o utilizador por cenas-chave da história. " +
      "Com uma linguagem visual minimalista a preto e branco, a experiência cria contraste entre o ambiente doméstico comum e a violência escondida no enredo. A interação convida o utilizador a avançar gradualmente pela história, transformando a leitura numa experiência mais imersiva e cinematográfica.",
    "work.collab.p3":
      "Colaboração com: Gonçalo Carvalho & Maria Inês Rualde",
    "work.desc.blender":
      "Esta animação 3D constrói uma narrativa visual através da transformação de um espaço quotidiano. Desenvolvida a partir de uma animação pré-existente, reinterpretada e adaptada através da substituição do elemento original por uma bola de basquetebol, o projeto explora como objetos comuns podem ganhar movimento e autonomia, alterando a perceção do ambiente. Através da simulação física, a peça investiga instabilidade, ritmo e o comportamento inesperado de objetos familiares.",
    "work.desc.visualidentity":
      "Este projeto desenvolve uma identidade visual pessoal baseada num sistema modular. Através da repetição e reorganização de unidades gráficas, a identidade constrói-se como estrutura flexível e adaptável. O sistema permite variações consistentes, mantendo coerência formal e conceptual.",
    "work.desc.safepoint":
      "SafePoint é um protótipo de aplicação móvel desenhado em Figma para contextos de emergência em situações de guerra. A interface reúne denúncias de pessoas desaparecidas, zonas seguras e de perigo, informação de abrigos e orientação por rotas, usando um sistema visual direto para decisões rápidas sob pressão.",
    "work.desc.beyondearth":
      "À medida que se aproxima de cada planeta, o utilizador pode explorá-lo mais de perto e analisar as suas condições. No entanto, conforme novos mundos são descobertos, torna-se evidente que nenhum oferece condições verdadeiramente ideais ou acessíveis para substituir a Terra.",
    "beyondearth.video.title":
      "Introdução à narrativa de Beyond Earth: a humanidade procura um novo planeta habitável depois de destruir o seu próprio lar.",
    "beyondearth.video.search":
      "Feedback visual que reforça a incerteza da exploração espacial e incentiva o utilizador a continuar a procurar.",
    "beyondearth.video.fuel":
      "Combustível esgotado\nEstado de falha que torna visível a limitação dos recursos e acrescenta tensão à experiência de exploração.",
    "beyondearth.video.desert":
      "Planeta quente e instável, com tempestades de areia que introduzem uma interação física e mais dinâmica.",
    "beyondearth.video.ice":
      "Ambiente extremo marcado por frio intenso, gelo em queda e uma atmosfera hostil que exige atenção e silêncio.",
    "beyondearth.video.gravity":
      "Cenário com baixa gravidade, onde o utilizador deve reagir ao movimento das rochas e adaptar-se às condições do planeta.",
    "safepoint.card.hero.eyebrow": "Protótipo Figma",
    "safepoint.card.hero.title": "App de apoio em emergência",
    "safepoint.card.hero.text":
      "Fluxos principais para reportar pessoas desaparecidas, consultar recursos próximos e seguir rotas mais seguras.",
    "safepoint.card.figma.eyebrow": "Mapa do protótipo",
    "safepoint.card.figma.title": "Desenhado e ligado em Figma",
    "safepoint.card.figma.text":
      "O projeto explora a navegação entre fluxos de emergência, com estados de mapa, formulários e páginas de alerta ligados num protótipo interativo.",
    "safepoint.card.map.eyebrow": "Mapa interativo",
    "safepoint.card.map.title": "Procurar recursos seguros",
    "safepoint.card.map.text":
      "Um mapa arrastável permite explorar pontos de abrigo, hospitais e zonas de risco, tornando o apoio próximo mais fácil de identificar sob pressão.",
    "safepoint.card.account.eyebrow": "Fluxo de conta",
    "safepoint.card.account.title": "Criar conta",
    "safepoint.card.account.text":
      "Um onboarding simples mantém o ponto de entrada claro antes de o utilizador chegar às ferramentas de segurança.",
    "safepoint.card.report.eyebrow": "Fluxo de denúncia",
    "safepoint.card.report.title": "Denúncia de pessoa desaparecida",
    "safepoint.card.report.text":
      "Campos estruturados recolhem informação essencial rapidamente, mantendo a ação sempre visível.",
    "safepoint.card.tips.eyebrow": "Conteúdo de emergência",
    "safepoint.card.tips.title": "Orientação prática",
    "safepoint.card.tips.text":
      "As listas de dicas tornam a informação urgente fácil de percorrer, com áreas de toque grandes e contraste elevado.",
    "safepoint.card.shelter.eyebrow": "Detalhe de recurso",
    "safepoint.card.shelter.title": "Informação de abrigo",
    "safepoint.card.shelter.text":
      "Localização, necessidades e direções são agrupadas com uma pré-visualização do mapa para orientação imediata.",
    "safepoint.palette.app": "Cores da app",
    "safepoint.palette.map": "Cores dos ícones e mapa",
    "work.elements": "Elementos",
    "work.play.prompt": "Toca para jogar",
    "work.launch.prompt": "Toca para iniciar",
    "work.project.open": "abrir projeto completo",
    "work.project.sample": "amostra do projeto",
    "work.backtop": "voltar ao topo",
    "work.backtop.aria": "Voltar ao topo do projeto",
    "about.title": "Sobre mim",
    "about.text":
      "Sou uma designer multidisciplinar com especial interesse em UX/UI, design interativo e experiências digitais. Gosto de criar projetos que juntam estética e funcionalidade, explorando tipografia, layout e interação como formas de tornar a comunicação mais clara, envolvente e intuitiva.\nAo longo do meu percurso, tenho trabalhado em diferentes formatos, do editorial ao digital, sempre com uma abordagem prática, curiosa e experimental. Interessa-me perceber como as pessoas interagem com aquilo que desenho e encontrar soluções visuais que sejam úteis, coerentes e significativas.",
    "about.text.mobile":
      "Sou uma designer multidisciplinar com especial interesse em UX/UI, design interativo e experiências digitais.\nAo longo do meu percurso, tenho trabalhado em diferentes formatos, do editorial ao digital, sempre com uma abordagem prática, curiosa e experimental. Interessa-me perceber como as pessoas interagem com aquilo que desenho e encontrar soluções visuais que sejam úteis, coerentes e significativas.",
    "about.cv.open": "Abrir CV",
    "tools.intro": "uma pequena dock com as ferramentas a que volto mais vezes.",
    "tools.aria": "Dock das apps que mais uso",
    "contact.title": "Contacta-me",
    "work.toggle": "Mostrar ou ocultar detalhes do projeto",
    "ui.fullscreen": "Alternar ecrã inteiro",
    "alt.tmd.site": "Imagem do site do EatEasy",
    "alt.tmd.palette": "Paleta de cores do EatEasy",
    "alt.game.arvore": "Elemento do jogo: árvore",
    "alt.game.estrela": "Elemento do jogo: estrela",
    "alt.game.inseto": "Elemento do jogo: inseto",
    "alt.game.lata": "Elemento do jogo: lata",
    "alt.game.obstaculo": "Elemento do jogo: obstáculo",
    "alt.game.recarga": "Elemento do jogo: energia",
    "alt.game.robo": "Elemento do jogo: robô",
    "alt.game.special": "Elemento do jogo: especial",
    "alt.game.tronco": "Elemento do jogo: tronco",
    "alt.game.play": "Jogo EcoBot",
    "alt.beyondearth.play": "Experiência interativa Beyond Earth",
    "alt.beyondearth.videos": "Vídeos da experiência Beyond Earth",
    "alt.beyondearth.video.title": "Sequência de título Beyond Earth",
    "alt.beyondearth.video.search": "Procura de planetas em Beyond Earth",
    "alt.beyondearth.video.fuel": "Estado de combustível em Beyond Earth",
    "alt.beyondearth.video.desert": "Planeta desértico em Beyond Earth",
    "alt.beyondearth.video.ice": "Planeta gelado em Beyond Earth",
    "alt.beyondearth.video.gravity": "Planeta com gravidade em Beyond Earth",
    "alt.blender.video": "Vídeo do the office",
    "alt.visualidentity": "Imagem final de identidade visual",
    "alt.p3.palette": "Paleta de cores de Lamb to the Slaughter",
    "alt.p3.preview": "Pré-visualização do website interativo Lamb to the Slaughter",
    "alt.p3.scroll": "Ecrã do projeto com scroll",
    "alt.p3.screen": "Ecrã do website Lamb to the Slaughter",
    "alt.p3.mac": "Mockup de Mac",
    "alt.safepoint.route": "Ecrã de rota da SafePoint",
    "alt.safepoint.menu": "Ecrã de menu da SafePoint",
    "alt.safepoint.mockup": "Mockup da aplicação SafePoint",
    "alt.safepoint.screens": "Ecrãs da aplicação SafePoint",
    "alt.safepoint.figma": "Vista geral do protótipo SafePoint no Figma",
    "alt.safepoint.map": "Mapa interativo da SafePoint com abrigos, hospitais e zonas",
    "alt.safepoint.mapvideo": "Interação do mapa arrastável da SafePoint",
    "alt.safepoint.account": "Ecrã de criação de conta da SafePoint",
    "alt.safepoint.report": "Ecrã de denúncia de pessoa desaparecida da SafePoint",
    "alt.safepoint.tips": "Ecrã de dicas de emergência da SafePoint",
    "alt.safepoint.shelter": "Ecrã de informação de abrigo da SafePoint",
    "alt.safepoint.palette.app": "Paleta de cores da aplicação SafePoint",
    "alt.safepoint.palette.map": "Paleta de cores dos ícones e do mapa da SafePoint",
    "lang.label": "Idioma",
  },
};

let currentLang = "en";

const languageSwitch = document.querySelector(".lang-switch");
const languageButtons = [...document.querySelectorAll(".lang-switch__button")];
const i18nTextNodes = [...document.querySelectorAll("[data-i18n]")];
const i18nAttrNodes = [...document.querySelectorAll("[data-i18n-attr]")];

const parseAttrMap = (value) =>
  value
    .split(";")
    .map((pair) => pair.trim())
    .filter(Boolean);

const getTranslation = (key) => {
  const dictionary = translations[currentLang] || translations.en;
  return dictionary[key] || translations.en[key] || key;
};

const aboutTextNode = document.querySelector('[data-i18n="about.text"]');
const aboutMobileQuery = window.matchMedia("(max-width: 700px)");

const updateResponsiveAboutText = () => {
  if (!aboutTextNode) {
    return;
  }

  aboutTextNode.textContent = getTranslation(
    aboutMobileQuery.matches ? "about.text.mobile" : "about.text"
  );
};

const applyLanguage = (lang) => {
  currentLang = lang;
  const dictionary = translations[lang] || translations.en;

  document.documentElement.lang = lang === "pt" ? "pt-PT" : "en";

  i18nTextNodes.forEach((node) => {
    const key = node.getAttribute("data-i18n");
    const value = dictionary[key];
    if (typeof value === "string") {
      node.textContent = value;
    }
  });

  updateResponsiveAboutText();

  i18nAttrNodes.forEach((node) => {
    const map = node.getAttribute("data-i18n-attr");
    if (!map) {
      return;
    }

    parseAttrMap(map).forEach((pair) => {
      const [attr, key] = pair.split(":").map((entry) => entry.trim());
      if (!attr || !key) {
        return;
      }
      const value = dictionary[key];
      if (typeof value === "string") {
        node.setAttribute(attr, value);
      }
    });
  });

  languageButtons.forEach((button) => {
    const isActive = button.dataset.lang === lang;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  if (languageSwitch) {
    const label = dictionary["lang.label"];
    if (label) {
      languageSwitch.setAttribute("aria-label", label);
    }
  }

  try {
    localStorage.setItem("lang", lang);
  } catch (error) {
    // Ignore storage errors.
  }
};

if (aboutTextNode) {
  aboutMobileQuery.addEventListener("change", updateResponsiveAboutText);
}

const getStoredLanguage = () => {
  try {
    return localStorage.getItem("lang");
  } catch (error) {
    return null;
  }
};

if (languageButtons.length) {
  const storedLang = getStoredLanguage();
  const defaultLang =
    document.documentElement.lang.toLowerCase().startsWith("pt") ? "pt" : "en";
  const initialLang = storedLang || defaultLang;

  applyLanguage(initialLang);

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetLang = button.dataset.lang;
      if (targetLang) {
        applyLanguage(targetLang);
      }
    });
  });
}

const gameLaunchers = document.querySelectorAll(".work-item__game");
const gameControllers = new Map();

gameLaunchers.forEach((launcher) => {
  const src = launcher.getAttribute("data-game-src");
  const launcherId = launcher.getAttribute("id");
  if (!src || !launcherId) {
    return;
  }

  const isVisible = () => {
    const rect = launcher.getBoundingClientRect();
    return (
      !document.hidden &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth
    );
  };

  const postVisibility = (visible = isVisible()) => {
    const frame = launcher.querySelector("iframe");
    frame?.contentWindow?.postMessage({ type: "game-visibility", visible }, "*");
  };

  const startGame = () => {
    if (launcher.classList.contains("is-playing")) {
      return;
    }

    const frame = document.createElement("iframe");
    frame.className = "work-item__media work-item__game-frame";
    const frameSrc = `${src}${src.includes("?") ? "&" : "?"}v=${Date.now()}`;
    const frameTitleKey = launcher.getAttribute("data-frame-title-i18n") || "alt.game.play";
    frame.setAttribute("src", frameSrc);
    frame.setAttribute("allow", "autoplay; fullscreen");
    frame.setAttribute("title", getTranslation(frameTitleKey));

    launcher.classList.add("is-playing");
    launcher.appendChild(frame);
    frame.addEventListener(
      "load",
      () => {
        postVisibility();
        frame.contentWindow?.focus();
      },
      { once: true }
    );
  };

  const reset = () => {
    const frame = launcher.querySelector("iframe");
    frame?.contentWindow?.postMessage({ type: "game-stop" }, "*");
    frame?.remove();
    launcher.classList.remove("is-playing");
  };

  const playText = launcher.querySelector(".work-item__play-text");
  if (playText) {
    playText.addEventListener("click", startGame);
    playText.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        startGame();
      }
    });
  }
  gameControllers.set(launcher, { start: startGame, reset, postVisibility });
});

if (gameLaunchers.length) {
  if ("IntersectionObserver" in window) {
    const gameVisibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const controller = gameControllers.get(entry.target);
          controller?.postVisibility(
            !document.hidden && entry.isIntersecting && entry.intersectionRatio > 0
          );
        });
      },
      { threshold: 0 }
    );

    gameLaunchers.forEach((launcher) => gameVisibilityObserver.observe(launcher));
  }

  document.addEventListener("visibilitychange", () => {
    gameControllers.forEach((controller) => controller.postVisibility());
  });
}

const scrollVideos = [...document.querySelectorAll("video[data-scroll-video]")];

if (scrollVideos.length) {
  const setScrollVideoState = (video, visible) => {
    const openWork = video.closest(".work-item.is-open");
    const shouldPlay = visible && openWork && !document.hidden;

    if (shouldPlay) {
      video.play?.().catch(() => {});
      return;
    }

    video.pause?.();
  };

  updateScrollVideos = () => {
    scrollVideos.forEach((video) => {
      const rect = video.getBoundingClientRect();
      const visible =
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth;

      setScrollVideoState(video, visible);
    });
  };

  if ("IntersectionObserver" in window) {
    const scrollVideoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setScrollVideoState(entry.target, entry.isIntersecting && entry.intersectionRatio > 0.2);
        });
      },
      { threshold: [0, 0.2], rootMargin: "120px 0px" }
    );

    scrollVideos.forEach((video) => scrollVideoObserver.observe(video));
  }

  document.addEventListener("visibilitychange", () => {
    updateScrollVideos();
  });
}

window.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "game-exit") {
    return;
  }

  const frames = document.querySelectorAll(".work-item__game iframe");
  frames.forEach((frame) => {
    if (frame.contentWindow === event.source) {
      const launcher = frame.closest(".work-item__game");
      if (!launcher) {
        return;
      }
      const controller = gameControllers.get(launcher);
      controller?.reset();
    }
  });
});

const fullscreenToggle = document.querySelector(".fullscreen-toggle");
if (fullscreenToggle) {
  const updateFullscreenToggle = () => {
    fullscreenToggle.classList.toggle("is-fullscreen", Boolean(document.fullscreenElement));
  };

  fullscreenToggle.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  });

  document.addEventListener("fullscreenchange", updateFullscreenToggle);
  updateFullscreenToggle();
}
