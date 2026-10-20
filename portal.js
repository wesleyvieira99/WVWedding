(() => {
  'use strict';
  const root = document.documentElement;
  const portal = document.getElementById('wedding-portal');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const interactionEvents = ['focusin', 'pointerdown', 'wheel', 'touchstart'];
  let finishTimer = 0;
  const finish = () => {
    window.clearTimeout(finishTimer);
    window.clearTimeout(window.weddingIntroFallback);
    root.classList.remove('intro-pending', 'intro-playing');
    if (portal) portal.hidden = true;
    document.removeEventListener('keydown', skipWithKeyboard);
    interactionEvents.forEach(type => document.removeEventListener(type, finish, true));
    reducedMotion.removeEventListener('change', onMotionChange);
  };
  const skipWithKeyboard = event => {
    if (event.key === 'Escape') finish();
  };
  const onMotionChange = event => {
    if (event.matches) finish();
  };
  if (!portal || reducedMotion.matches || !root.classList.contains('intro-pending')) {
    finish();
    return;
  }
  root.classList.add('intro-playing');
  portal.dataset.duration = '5000';
  window.clearTimeout(window.weddingIntroFallback);
  finishTimer = window.setTimeout(finish, 5000);
  document.addEventListener('keydown', skipWithKeyboard);
  // Reveal immediately if a guest starts using the page beneath the welcome.
  interactionEvents.forEach(type => document.addEventListener(type, finish, { capture: true, passive: true }));
  reducedMotion.addEventListener('change', onMotionChange);
  // A back/forward cache restoration must never leave the welcome over the page.
  window.addEventListener('pageshow', event => {
    if (event.persisted) finish();
  });
})();
