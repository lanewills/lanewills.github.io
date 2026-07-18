// synth
// synth 2.0 has (functional) mobile touch support, a bandpass filter with the scroll wheel,
// and link negation.

(function () {
  "use strict";

  // which gain nodes are audible in each quadrant, and which
  // oscillator triplet tracks the x position vs. the y position.
  const QUADRANTS = {
    topLeft:     { gains: [0, 3], xOsc: 0, yOsc: 9 },
    topRight:    { gains: [0, 1], xOsc: 0, yOsc: 3 },
    bottomLeft:  { gains: [1, 2], xOsc: 3, yOsc: 6 },
    bottomRight: { gains: [2, 3], xOsc: 6, yOsc: 9 },
  };
  const WAVE_TYPES = ["sawtooth", "square", "triangle", "sine"];

  // band-pass filter range for the scroll wheel. the sweep moves
  // logarithmically through this range.
  const FILTER_MIN_FREQ = 60;
  const FILTER_MAX_FREQ = 30000;
  const FILTER_START_FREQ = 100;
  const FILTER_Q = 0.4;

  // each scroll tick adds "velocity" to a sweep that's animated every frame and slowed by friction.
  const FILTER_VELOCITY_PER_TICK = 5; // log-Hz/sec added per wheel event
  const FILTER_MAX_VELOCITY = 50; // log-Hz/sec cap
  const FILTER_FRICTION = 0.90; // velocity retained per ~frame
  const FILTER_VELOCITY_EPSILON = 0.001; // below this, treat velocity as settled

  // crosshair thickness range driven by the filter's position.
  const BAR_MIN_THICKNESS = 1; // px, at FILTER_MIN_FREQ
  const BAR_MAX_THICKNESS = 50; // px, at FILTER_MAX_FREQ
  const LABEL_OFFSET = 15; // px gap kept between the crosshair's edge and the coordinate label

  // true on touch/coarse-pointer devices (phones, tablets). the wheel
  // listener is never attached on these, so scrolling a mouse
  // wheel is a desktop/trackpad-only feature.
  const isTouchPrimary =
    window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

  let width = window.innerWidth;
  let height = window.innerHeight;

  let isSynthInit = false;
  let isOn = false;
  let touchActive = false;
  let filterEngaged = false; // stays false (filter bypassed) until the first scroll

  let lastX = 0;
  let lastY = 0;
  let currentThickness = 0;

  let filterVelocity = 0; // current sweep speed, in log-Hz/sec
  let filterAnimHandle = null; // requestAnimationFrame id, or null when idle
  let filterAnimLastTime = 0;

  let audioContext, oscillators, gainNodes, filterNode;
  let coordinates, verticalBar, horizontalBar;

  // anything tapped/clicked inside a link is left alone so navigation
  // doesn't accidentally show the synth for a couple seconds
  function isExcludedTarget(e) {
    return !!(e.target && e.target.closest && e.target.closest("a"));
  }

  function buildEngine() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    filterNode = audioContext.createBiquadFilter();
    filterNode.type = "bandpass";
    filterNode.frequency.value = FILTER_START_FREQ;
    filterNode.Q.value = FILTER_Q;
    filterNode.connect(audioContext.destination);

    // gain nodes go straight to the speakers by default. the filter sits
    // ready but disconnected until engageFilter() patches it in on the
    // first scroll.
    gainNodes = [];
    for (let i = 0; i < 4; i++) {
      const gain = audioContext.createGain();
      gain.gain.value = 0;
      gain.connect(audioContext.destination);
      gainNodes.push(gain);
    }

    oscillators = [];
    for (let i = 0; i < 12; i++) {
      const quadrant = Math.floor(i / 3);
      const osc = audioContext.createOscillator();
      osc.type = WAVE_TYPES[quadrant];
      osc.connect(gainNodes[quadrant]);
      osc.start(0);
      oscillators.push(osc);
    }

    coordinates = document.getElementById("coordinates");
    verticalBar = document.getElementById("verticalBar");
    horizontalBar = document.getElementById("horizontalBar");

    // make sure crosshair is centered based on CSS bar thickness
    const defaultThickness = parseFloat(window.getComputedStyle(verticalBar).width);
    currentThickness = Number.isNaN(defaultThickness) ? BAR_MIN_THICKNESS : defaultThickness;
  }

  function showUI() {
    coordinates.style.color = "#000000";
    verticalBar.style.backgroundColor = "#000000";
    horizontalBar.style.backgroundColor = "#000000";
  }

  function hideUI() {
    coordinates.style.color = "transparent";
    verticalBar.style.backgroundColor = "#FFFFFF";
    horizontalBar.style.backgroundColor = "#FFFFFF";
  }

  function muteAll() {
    for (let i = 0; i < 4; i++) {
      gainNodes[i].gain.value = 0;
    }
  }

  function pickQuadrant(x, y) {
    const left = x <= width / 2;
    const top = y <= height / 2;
    if (left && top) return QUADRANTS.topLeft;
    if (!left && top) return QUADRANTS.topRight;
    if (left && !top) return QUADRANTS.bottomLeft;
    return QUADRANTS.bottomRight;
  }

  function positionElements() {
    // center the crosshair on the last known pointer position so it grows
    // evenly in all directions. push out the coordinates too.
    const halfThickness = currentThickness / 2;

    verticalBar.style.left = lastX - halfThickness + "px";
    horizontalBar.style.top = lastY - halfThickness + "px";

    coordinates.textContent = `(${lastX}, ${lastY})`;
    coordinates.style.left = lastX + LABEL_OFFSET + halfThickness + "px";
    coordinates.style.top = lastY + LABEL_OFFSET + halfThickness + "px";
  }

  function updateSynth(x, y) {
    lastX = x;
    lastY = y;
    positionElements();

    const q = pickQuadrant(x, y);

    for (let i = 0; i < 4; i++) {
      gainNodes[i].gain.value = q.gains.includes(i) ? 0.02 : 0;
    }

    oscillators[q.xOsc].frequency.value = x / 2;
    oscillators[q.xOsc + 1].frequency.value = (x / 2) * (5 / 4);
    oscillators[q.xOsc + 2].frequency.value = (x / 2) * (3 / 2);

    oscillators[q.yOsc].frequency.value = y / 2;
    oscillators[q.yOsc + 1].frequency.value = (y / 2) * (5 / 4);
    oscillators[q.yOsc + 2].frequency.value = (y / 2) * (3 / 2);
  }

  function updateWH() {
    width = window.innerWidth;
    height = window.innerHeight;
  }

  function turnOn() {
    isOn = true;
    showUI();
    window.addEventListener("mousemove", onMouseMove);
  }

  function turnOff() {
    isOn = false;
    muteAll();
    hideUI();
    window.removeEventListener("mousemove", onMouseMove);
  }

  function init(x, y) {
    buildEngine();
    isSynthInit = true;
    window.addEventListener("resize", updateWH);
    turnOn();
    updateSynth(x, y);
  }

  // ---- mouse / click (desktop) ----
  function onMouseMove(e) {
    updateSynth(e.clientX, e.clientY);
  }

  function onClick(e) {
    if (isExcludedTarget(e)) return;

    if (!isSynthInit) {
      init(e.clientX, e.clientY);
      return;
    }
    if (isOn) {
      turnOff();
    } else {
      turnOn();
      updateSynth(e.clientX, e.clientY);
    }
  }

  // ---- touch (mobile) ----
  function onTouchStart(e) {
    if (isExcludedTarget(e)) return; // let the tap reach the link normally

    // stops the page from scrolling under the finger, and stops the
    // browser from firing a trailing synthetic "click" a moment later
    // (which would otherwise immediately toggle the synth back off).
    e.preventDefault();

    const touch = e.touches[0];
    if (!touch) return;

    touchActive = true;

    // round client X and Y because the values were too granular.
    // i also don't know if this works on safari iOS, it seems that the user must
    // interact with the page before audio plays.
    if (!isSynthInit) {
      init(Math.round(touch.clientX), Math.round(touch.clientY));
    } else {
      if (audioContext.state === "suspended") audioContext.resume();
      turnOn();
      updateSynth(Math.round(touch.clientX), Math.round(touch.clientY)); // sound starts on tap, no drag needed
    }
  }

  function onTouchMove(e) {
    if (!touchActive) return;
    const touch = e.touches[0];
    if (!touch) return;
    e.preventDefault();
    updateSynth(Math.round(touch.clientX), Math.round(touch.clientY));
  }

  function onTouchEnd() {
    if (!touchActive) return;
    touchActive = false;
    turnOff();
  }

  // ---- scroll wheel (band-pass filter sweep) ----
  function engageFilter() {
    for (let i = 0; i < gainNodes.length; i++) {
      gainNodes[i].disconnect(audioContext.destination);
      gainNodes[i].connect(filterNode);
    }
    filterEngaged = true;
    updateBarThickness();
  }

  function updateBarThickness() {
    if (!filterEngaged) return;

    const logMin = Math.log(FILTER_MIN_FREQ);
    const logMax = Math.log(FILTER_MAX_FREQ);
    const t = (Math.log(filterNode.frequency.value) - logMin) / (logMax - logMin);
    currentThickness = BAR_MIN_THICKNESS + t * (BAR_MAX_THICKNESS - BAR_MIN_THICKNESS);

    verticalBar.style.width = currentThickness + "px";
    horizontalBar.style.height = currentThickness + "px";

    positionElements(); // re-center the crosshair and label on the new size
  }

  function stepFilterAnimation(now) {
    const dt = filterAnimLastTime ? (now - filterAnimLastTime) / 1000 : 0;
    filterAnimLastTime = now;

    const logMin = Math.log(FILTER_MIN_FREQ);
    const logMax = Math.log(FILTER_MAX_FREQ);

    let nextLog = Math.log(filterNode.frequency.value) + filterVelocity * dt;
    if (nextLog < logMin) {
      nextLog = logMin;
      filterVelocity = 0; // hit the bottom of the range, stop pushing against it
    } else if (nextLog > logMax) {
      nextLog = logMax;
      filterVelocity = 0; // same at the top
    }

    filterNode.frequency.value = Math.exp(nextLog);
    updateBarThickness();

    // friction: frame-rate-independent exponential decay toward zero.
    filterVelocity *= Math.pow(FILTER_FRICTION, dt * 60);

    if (Math.abs(filterVelocity) > FILTER_VELOCITY_EPSILON) {
      filterAnimHandle = requestAnimationFrame(stepFilterAnimation);
    } else {
      filterVelocity = 0;
      filterAnimHandle = null;
      filterAnimLastTime = 0;
    }
  }

  function nudgeFilterVelocity(direction) {
    filterVelocity += direction * FILTER_VELOCITY_PER_TICK;
    filterVelocity = Math.max(
      -FILTER_MAX_VELOCITY,
      Math.min(FILTER_MAX_VELOCITY, filterVelocity)
    );

    if (filterAnimHandle === null) {
      filterAnimLastTime = 0; // fresh baseline so the first frame doesn't jump
      filterAnimHandle = requestAnimationFrame(stepFilterAnimation);
    }
  }

  function onWheel(e) {
    if (!isSynthInit) return; // nothing to filter until the synth has started
    if (isExcludedTarget(e)) return; // let normal scrolling happen over links

    e.preventDefault();

    if (!filterEngaged) engageFilter();

    // scroll up speeds the sweep up; scroll down speeds it
    // down. only the sign of deltaY is used (not its magnitude), which
    // keeps the feel consistent across mice and trackpads, but repeated
    // ticks in the same direction still stack up into acceleration.
    const direction = e.deltaY < 0 ? 1 : -1;
    nudgeFilterVelocity(direction);
  }

  document.addEventListener("click", onClick);
  if (!isTouchPrimary) {
    document.addEventListener("wheel", onWheel, { passive: false });
  }
  document.addEventListener("touchstart", onTouchStart, { passive: false });
  document.addEventListener("touchmove", onTouchMove, { passive: false });
  document.addEventListener("touchend", onTouchEnd);
  document.addEventListener("touchcancel", onTouchEnd);
})();
