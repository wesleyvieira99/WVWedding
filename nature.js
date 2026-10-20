(() => {
  'use strict';

  // This module owns only its narrow decorative margins.
  const start = () => {
    if (document.getElementById('wedding-nature')) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const smallScreen = window.matchMedia('(max-width: 760px)');
    const svgStart = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" aria-hidden="true" focusable="false">';
    const blossoms = [
      `${svgStart}<path d="M20 19C8 15 8 5 14 5c5 0 7 6 6 14Zm1 0c-1-12 7-18 11-13 4 4 0 10-11 13Zm1 1c11-5 19 0 15 6-3 5-10 4-15-6Zm-2 2c8 9 5 18-2 16-5-2-6-9 2-16Zm-2-1C7 27 0 21 4 16c4-5 10-3 14 5Z"/><circle class="nature-flower-heart" cx="20" cy="20" r="2.3"/></svg>`,
      `${svgStart}<path d="M9 29C2 17 10 4 21 6c9 2 12 16 2 24-5 4-11 4-14-1Z"/><path d="M12 29c7-6 12-12 11-20" fill="none" opacity=".5"/></svg>`,
      `${svgStart}<path d="M20 18C8 16 5 7 11 5c6-2 10 4 9 13Zm2 1c-1-12 7-16 11-11 4 5-1 11-11 11Zm0 3c12 2 15 10 9 13-6 2-10-4-9-13Zm-3 0c1 12-7 16-11 11-4-5 1-11 11-11Z"/><circle class="nature-flower-heart" cx="20.5" cy="20.5" r="2"/></svg>`
    ];
    const plantDrawing = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 78 230" aria-hidden="true" focusable="false"><path class="nature-stem" d="M16 230C30 183 36 141 35 100S28 43 33 12M29 175c17-18 26-40 28-66M21 212c-6-20-8-43-5-66"/><path d="M28 183C7 178 0 159 4 150c17 2 26 16 24 33Zm5-34C13 143 7 125 12 116c16 4 22 17 21 33Zm2-35C18 107 14 91 20 83c13 5 17 17 15 31Zm-1-33C22 72 20 58 26 52c10 6 12 17 8 29Zm-1-35C26 34 27 23 33 18c7 8 7 18 0 28Zm-3 130c19-3 32-18 31-29-17 0-29 13-31 29Zm5-36c17-5 25-20 22-29-15 3-24 15-22 29Zm0-37c15-7 21-22 17-29-13 5-19 17-17 29Zm-1-34c13-8 16-21 12-28-10 6-15 16-12 28Zm8 88c17-1 28-12 29-22-15-1-25 7-29 22ZM56 120c12-6 17-18 14-25-11 3-15 13-14 25ZM17 179C4 174-1 162 2 154c11 3 16 13 15 25Z"/></svg>';

    let layer = null;
    let flowers = [];
    let plants = [];
    let frame = 0;
    let previousFrame = 0;
    let lastScroll = window.scrollY;
    let height = window.innerHeight;
    let railWidth = 0;
    let energy = 0;
    let phase = 0;
    let direction = 1;
    let typing = false;
    let dialogOpen = false;

    const suspended = () => document.hidden || reducedMotion.matches || typing || dialogOpen;

    const stop = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      previousFrame = 0;
      energy = 0;
      if (!layer) return;
      layer.classList.remove('is-moving');
      flowers.forEach(flower => { flower.element.style.opacity = '0'; });
      plants.forEach(plant => { plant.style.transform = 'rotate(0deg)'; });
    };

    const syncSuspension = () => {
      if (layer) layer.classList.toggle('is-suspended', suspended());
      if (suspended()) stop();
      lastScroll = window.scrollY;
    };

    const measure = () => {
      const previousHeight = height || 1;
      height = window.innerHeight;
      railWidth = smallScreen.matches ? 16 : Math.max(20, Math.min(64, window.innerWidth * .035));
      flowers.forEach(flower => { flower.y = (flower.y / previousHeight) * height; });
    };

    const create = () => {
      stop();
      layer?.remove();
      layer = null;
      flowers = [];
      plants = [];
      if (reducedMotion.matches) return;

      measure();
      layer = document.createElement('div');
      layer.id = 'wedding-nature';
      layer.className = 'nature-layer nature-scene';
      layer.setAttribute('aria-hidden', 'true');
      layer.setAttribute('inert', '');

      const count = smallScreen.matches ? 2 : 4;
      ['left', 'right'].forEach((side, sideIndex) => {
        const rail = document.createElement('div');
        rail.className = `nature-rail nature-rail--${side}`;

        for (let index = 0; index < count; index += 1) {
          const seed = index + sideIndex * count;
          const size = smallScreen.matches ? 13 + (seed % 2) * 3 : 18 + (seed % 3) * 4;
          const element = document.createElement('span');
          element.className = `nature-flower ${['', 'nature-flower--sage', 'nature-flower--gold'][seed % 3]}`;
          element.style.setProperty('--flower-size', `${size}px`);
          element.innerHTML = blossoms[seed % blossoms.length];
          rail.append(element);
          flowers.push({
            element,
            size,
            seed: seed * 1.73,
            y: height * ((index + .2 + sideIndex * .38) / count),
            rotation: seed * 43,
            spin: seed % 2 ? -1 : 1,
            speed: .7 + (seed % 3) * .17
          });
        }

        const plant = document.createElement('div');
        plant.className = 'nature-plant';
        plant.innerHTML = plantDrawing;
        rail.append(plant);
        plants.push(plant);
        layer.append(rail);
      });
      document.body.append(layer);
      syncSuspension();
    };

    const animate = time => {
      frame = 0;
      if (!layer || suspended()) {
        stop();
        return;
      }
      // Time-based movement remains gentle on slow or high refresh rate screens.
      const elapsed = previousFrame ? Math.min((time - previousFrame) / 1000, .05) : 1 / 60;
      previousFrame = time;
      energy *= Math.exp(-2.15 * elapsed);
      phase += elapsed * (.7 + energy * .8);

      flowers.forEach(flower => {
        flower.y += elapsed * (14 + energy * 76) * flower.speed;
        if (flower.y > height + flower.size + 20) flower.y = -flower.size - 15;
        flower.rotation += elapsed * (8 + energy * 20) * flower.spin;
        const center = (railWidth - flower.size) / 2;
        const drift = Math.sin(phase + flower.seed) * (smallScreen.matches ? 2 : 4);
        const edgeFade = Math.max(0, Math.min(1, (flower.y + 35) / 75, (height + 20 - flower.y) / 75));
        const opacity = Math.min(1, energy * 2) * edgeFade * (smallScreen.matches ? .28 : .38);
        flower.element.style.transform = `translate3d(${(center + drift).toFixed(2)}px,${flower.y.toFixed(2)}px,0) rotate(${flower.rotation.toFixed(2)}deg)`;
        flower.element.style.opacity = opacity.toFixed(3);
      });

      plants.forEach((plant, index) => {
        const sway = (Math.sin(phase * 1.15 + index * .7) * .75 + direction * .25);
        const angle = sway * energy * (smallScreen.matches ? .7 : 1.3) * (index ? -1 : 1);
        plant.style.transform = `rotate(${angle.toFixed(3)}deg)`;
      });

      if (energy > .018) {
        frame = window.requestAnimationFrame(animate);
      } else {
        stop();
      }
    };

    window.addEventListener('scroll', () => {
      const position = window.scrollY;
      const distance = position - lastScroll;
      lastScroll = position;
      if (!layer || suspended() || Math.abs(distance) < .3) return;
      direction = Math.sign(distance);
      energy = Math.min(1, energy + Math.min(Math.abs(distance), 180) / 230);
      layer.classList.add('is-moving');
      if (!frame) frame = window.requestAnimationFrame(animate);
    }, { passive: true });

    window.addEventListener('resize', measure, { passive: true });
    document.addEventListener('visibilitychange', syncSuspension);
    window.addEventListener('pagehide', stop);
    window.addEventListener('pageshow', syncSuspension);

    const syncFocus = () => {
      typing = Boolean(document.activeElement?.matches('input, textarea, select, [contenteditable="true"]'));
      syncSuspension();
    };
    document.addEventListener('focusin', syncFocus);
    document.addEventListener('focusout', () => window.queueMicrotask(syncFocus));

    const syncDialogs = () => {
      dialogOpen = Boolean(document.querySelector('dialog[open]'));
      syncSuspension();
    };
    const dialogObserver = new MutationObserver(syncDialogs);
    document.querySelectorAll('dialog').forEach(dialog => {
      dialogObserver.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    });
    reducedMotion.addEventListener('change', create);
    smallScreen.addEventListener('change', create);
    syncFocus();
    syncDialogs();
    create();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
