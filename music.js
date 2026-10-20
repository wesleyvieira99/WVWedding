(() => {
  'use strict';

  const VOLUME = .18;
  const FADE_SECONDS = 2;
  const CHANGE_MS = 600;
  let initialized = false;

  function init() {
    if (initialized) return;
    const bar = document.getElementById('music-bar');
    const title = document.getElementById('music-track-title');
    const artist = document.getElementById('music-track-artist');
    const status = document.getElementById('music-status');
    const wave = document.getElementById('music-wave');
    const toggle = document.getElementById('music-toggle');
    const progress = document.getElementById('music-progress');
    const fill = document.getElementById('music-progress-fill');
    if (!bar || !title || !artist || !status || !toggle) return;

    const seen = new Set();
    const tracks = (Array.isArray(window.WEDDING_MUSIC_TRACKS) ? window.WEDDING_MUSIC_TRACKS : [])
      .filter(track => {
        if (!track || !['title', 'artist', 'src'].every(key => typeof track[key] === 'string' && track[key].trim())) return false;
        try {
          const url = new URL(track.src, window.location.href);
          if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol) || seen.has(url.href)) return false;
          seen.add(url.href);
          return true;
        } catch (_) { return false; }
      });
    if (!tracks.length || typeof window.Audio !== 'function') return;
    initialized = true;

    // One media element streams only the selected song. No bulk audio preload.
    const audio = new window.Audio();
    audio.preload = 'metadata';
    audio.loop = false;
    let index = 0;
    let started = false;
    let disposed = false;
    let pageReady = document.readyState === 'complete';
    let wantsPlaying = false;
    let confirmedPlaying = false;
    let hasPlayed = false;
    let endedHandled = false;
    let sourceGeneration = 0;
    let playRequest = 0;
    let sourceListeners = [];
    let transition = null;
    let ticker = 0;
    let changeTimer = 0;
    let loadingTimer = 0;
    let portalTimer = 0;
    let portalObserver = null;
    let fadeStart = 0;
    let level = 0;
    let context = null;
    let gain = null;
    let source = null;
    let gainUnavailable = false;

    const setStatus = text => { if (status.textContent !== text) status.textContent = text; };
    function setState(state, text) {
      bar.dataset.state = state;
      toggle.dataset.state = state;
      const playing = state === 'playing';
      wave?.classList.toggle('is-playing', playing);
      bar.classList.toggle('is-playing', playing);
      toggle.setAttribute('aria-pressed', String(playing));
      toggle.setAttribute('aria-label', playing || (state === 'loading' && wantsPlaying) ? 'Pausar a música' : 'Reproduzir a música');
      if (text) setStatus(text);
    }
    function setLevel(value) {
      level = Math.max(0, Math.min(VOLUME, value));
      if (gain && context?.state === 'running') {
        // Smooth gain changes avoid clicks and also work where native volume is fixed.
        gain.gain.setTargetAtTime(level, context.currentTime, .035);
      } else if (!gain) {
        try {
          audio.volume = level;
          bar.dataset.volume = Math.abs(audio.volume - level) < .025 ? 'controlled' : 'device';
        } catch (_) { bar.dataset.volume = 'device'; }
      }
    }
    function unlockGain() {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext || gainUnavailable || disposed) return;
      try {
        if (!context) context = new AudioContext();
        const connect = () => {
          if (disposed || context.state !== 'running' || gain) return;
          try {
            const nextGain = context.createGain();
            nextGain.gain.value = level;
            nextGain.connect(context.destination);
            source = context.createMediaElementSource(audio);
            source.connect(nextGain);
            gain = nextGain;
            audio.volume = 1;
            bar.dataset.volume = 'controlled';
          } catch (_) {
            gainUnavailable = true;
            // Keep a usable output even if a browser only partially supports the graph.
            if (source) {
              try { source.connect(context.destination); } catch (_) { /* Native playback remains the fallback. */ }
            }
          }
        };
        if (context.state === 'running') connect();
        else Promise.resolve(context.resume()).then(connect).catch(() => {});
      } catch (_) { gainUnavailable = true; }
    }
    function formatTime(value) {
      const seconds = Math.max(0, Math.floor(Number(value) || 0));
      return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    }
    function updateProgress() {
      const duration = audio.duration;
      const position = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      const fraction = Number.isFinite(duration) && duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;
      if (fill) fill.style.transform = `scaleX(${fraction.toFixed(4)})`;
      if (progress) {
        progress.setAttribute('aria-valuenow', String(Math.round(fraction * 100)));
        progress.setAttribute('aria-valuetext', Number.isFinite(duration) && duration > 0
          ? `${formatTime(position)} de ${formatTime(duration)}` : 'Preparando a música');
      }
    }
    function metadata(changed = false) {
      title.textContent = tracks[index].title;
      artist.textContent = tracks[index].artist;
      if (changed) {
        window.clearTimeout(changeTimer);
        bar.classList.add('is-changing');
        changeTimer = window.setTimeout(() => bar.classList.remove('is-changing'), CHANGE_MS);
      }
    }
    function stopTicker() {
      window.clearInterval(ticker);
      ticker = 0;
    }
    function cancelTransition() { transition = null; }
    function tick() {
      updateProgress();
      if (!wantsPlaying || !confirmedPlaying || audio.paused || disposed) return;
      if (transition) {
        const change = transition;
        const fraction = Math.min(1, (Date.now() - change.start) / CHANGE_MS);
        setLevel(change.level * (1 - fraction));
        if (fraction === 1 && transition === change) {
          loadTrack(change.index);
          requestPlay();
        }
        return;
      }
      const position = Number(audio.currentTime) || 0;
      const fadeIn = Math.max(0, Math.min(1, (position - fadeStart) / FADE_SECONDS));
      const fadeOut = Number.isFinite(audio.duration) && audio.duration > 0
        ? Math.max(0, Math.min(1, (audio.duration - position) / FADE_SECONDS)) : 1;
      setLevel(VOLUME * Math.min(fadeIn, fadeOut));
      // Only the media's ended event advances automatically; a timer never does.
    }
    function startTicker() {
      stopTicker();
      tick();
      ticker = window.setInterval(tick, 100);
    }
    function pausePlayback(text = 'Pausado') {
      wantsPlaying = false;
      confirmedPlaying = false;
      playRequest += 1;
      cancelTransition();
      stopTicker();
      window.clearTimeout(loadingTimer);
      audio.pause();
      setState('paused', text);
    }
    function fail(error) {
      pausePlayback(error?.name === 'NotAllowedError' || error?.name === 'AbortError'
        ? 'Toque para ouvir' : 'Não foi possível tocar esta música. Tente a próxima.');
    }
    function currentSource(generation) {
      if (disposed || generation !== sourceGeneration) return false;
      const actual = audio.currentSrc || audio.src;
      try { return new URL(actual, window.location.href).href === new URL(tracks[index].src, window.location.href).href; }
      catch (_) { return false; }
    }
    function bindSource() {
      const generation = sourceGeneration;
      const listen = (name, callback) => {
        const listener = () => { if (currentSource(generation)) callback(); };
        audio.addEventListener(name, listener);
        sourceListeners.push([name, listener]);
      };
      listen('playing', () => {
        if (!wantsPlaying) { audio.pause(); return; }
        if (audio.paused) return;
        confirmedPlaying = true;
        hasPlayed = true;
        window.clearTimeout(loadingTimer);
        setState('playing', 'Tocando');
        startTicker();
      });
      listen('pause', () => {
        if (audio.ended) return; // A natural ending is handled below, not as a manual pause.
        if (!audio.paused) return; // Ignore a queued pause from an earlier play request.
        wantsPlaying = false;
        confirmedPlaying = false;
        playRequest += 1;
        cancelTransition();
        stopTicker();
        window.clearTimeout(loadingTimer);
        setState('paused', 'Pausado');
      });
      const buffering = () => {
        if (!wantsPlaying || audio.paused) return;
        confirmedPlaying = false;
        stopTicker();
        setState('loading', 'Carregando a música…');
      };
      listen('waiting', buffering);
      listen('stalled', buffering);
      listen('timeupdate', tick);
      listen('loadedmetadata', updateProgress);
      listen('durationchange', updateProgress);
      listen('ended', () => {
        if (!wantsPlaying || !hasPlayed || endedHandled || !audio.ended) return;
        endedHandled = true;
        const next = transition?.index ?? (index + 1) % tracks.length;
        loadTrack(next);
        requestPlay();
      });
      listen('error', () => fail(audio.error));
    }
    function loadTrack(next) {
      sourceGeneration += 1;
      playRequest += 1;
      sourceListeners.forEach(([name, listener]) => audio.removeEventListener(name, listener));
      sourceListeners = [];
      audio.pause();
      stopTicker();
      cancelTransition();
      window.clearTimeout(loadingTimer);
      index = (next + tracks.length) % tracks.length;
      confirmedPlaying = false;
      hasPlayed = false;
      endedHandled = false;
      fadeStart = 0;
      setLevel(0);
      audio.src = tracks[index].src;
      bindSource();
      audio.load();
      metadata(started);
      updateProgress();
      setState(wantsPlaying ? 'loading' : 'paused', wantsPlaying ? 'Carregando a música…' : 'Toque para ouvir');
    }
    function requestPlay(gesture = false) {
      if (!started || disposed) return;
      wantsPlaying = true;
      confirmedPlaying = false;
      const request = ++playRequest;
      const generation = sourceGeneration;
      if (audio.ended) {
        try { audio.currentTime = 0; } catch (_) { /* Playback will retry when the media is ready. */ }
        endedHandled = false;
      }
      fadeStart = Number(audio.currentTime) || 0;
      setLevel(0);
      if (gesture) unlockGain();
      setState('loading', 'Carregando a música…');
      window.clearTimeout(loadingTimer);
      loadingTimer = window.setTimeout(() => {
        if (request === playRequest && wantsPlaying && !confirmedPlaying) setStatus('A música está carregando. Você pode tentar a próxima.');
      }, 20000);
      try {
        Promise.resolve(audio.play()).catch(error => {
          if (request !== playRequest || generation !== sourceGeneration || disposed) return;
          fail(error);
        });
      } catch (error) {
        if (request === playRequest && generation === sourceGeneration) fail(error);
      }
    }
    function selectTrack(next) {
      if (!started || disposed) return;
      const target = (next + tracks.length) % tracks.length;
      if (target === index) {
        cancelTransition();
        if (wantsPlaying && confirmedPlaying) tick();
        return;
      }
      const shouldPlay = wantsPlaying;
      if (shouldPlay && confirmedPlaying && !audio.paused) {
        transition = { index: target, start: Date.now(), level };
        return;
      }
      loadTrack(target);
      if (shouldPlay) requestPlay();
    }
    function step(direction) {
      selectTrack((transition?.index ?? index) + direction);
    }
    toggle.addEventListener('click', () => {
      if (wantsPlaying) pausePlayback();
      else requestPlay(true);
    });
    document.getElementById('music-previous')?.addEventListener('click', () => step(-1));
    document.getElementById('music-next')?.addEventListener('click', () => step(1));

    function portalPending() { return document.documentElement.classList.contains('intro-pending'); }
    function maybeStart() {
      if (started || disposed || !pageReady || portalPending()) return;
      started = true;
      bar.hidden = false;
      loadTrack(0);
      requestPlay();
    }
    function onLoad() { pageReady = true; maybeStart(); }
    metadata();
    setState('paused', 'Toque para ouvir');
    window.addEventListener('load', onLoad, { once: true });
    if (portalPending()) {
      if ('MutationObserver' in window) {
        portalObserver = new MutationObserver(() => {
          if (portalPending()) return;
          portalObserver.disconnect();
          maybeStart();
        });
        portalObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      } else {
        portalTimer = window.setInterval(() => {
          if (portalPending()) return;
          window.clearInterval(portalTimer);
          maybeStart();
        }, 250);
      }
    }
    maybeStart();
    window.addEventListener('pagehide', event => {
      pausePlayback();
      if (event.persisted) return;
      disposed = true;
      sourceGeneration += 1;
      sourceListeners.forEach(([name, listener]) => audio.removeEventListener(name, listener));
      sourceListeners = [];
      window.clearTimeout(changeTimer);
      window.clearInterval(portalTimer);
      portalObserver?.disconnect();
      window.removeEventListener('load', onLoad);
      if (context && context.state !== 'closed') Promise.resolve(context.close()).catch(() => {});
      audio.removeAttribute('src');
      audio.load();
    });
  }

  window.WeddingMusic = Object.freeze({ init });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
