(() => {
  'use strict';

  const API_URL = 'https://open.spotify.com/embed/iframe-api/v1';
  const LOAD_TIMEOUT = 14000;
  let initialized = false;
  let api = null;
  let apiPromise = null;

  function loadAPI() {
    if (api) return Promise.resolve(api);
    if (apiPromise) return apiPromise;
    apiPromise = new Promise((resolve, reject) => {
      const previousCallback = window.onSpotifyIframeApiReady;
      const timeout = window.setTimeout(() => reject(new Error('Spotify API timeout')), LOAD_TIMEOUT);
      window.onSpotifyIframeApiReady = value => {
        if (!value || typeof value.createController !== 'function') return;
        api = value;
        window.clearTimeout(timeout);
        resolve(value);
        if (typeof previousCallback === 'function') {
          try { previousCallback(value); } catch (_) { /* Another integration is independent. */ }
        }
      };
      const script = document.createElement('script');
      script.src = API_URL;
      script.async = true;
      script.addEventListener('error', () => {
        window.clearTimeout(timeout);
        reject(new Error('Spotify API unavailable'));
      }, { once: true });
      document.body.append(script);
    });
    return apiPromise;
  }

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1));
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  }

  function artistGroup(track) {
    const artist = track.artist.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (artist.includes('anavitoria')) return 'anavitoria';
    if (artist.includes('tiago iorc')) return 'tiago iorc';
    if (artist.includes('jao')) return 'jao';
    return artist;
  }

  // Shuffle each artist's songs, then interleave the groups without adjacent
  // lead artists whenever the remaining catalogue allows it.
  function makeQueue(tracks, previousArtist = '') {
    const groups = new Map();
    shuffle(tracks).forEach(track => {
      const key = artistGroup(track);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(track);
    });
    const result = [];
    let previous = previousArtist;
    while (result.length < tracks.length) {
      let candidates = [...groups].filter(([key, songs]) => songs.length && key !== previous);
      if (!candidates.length) candidates = [...groups].filter(([, songs]) => songs.length);
      // Prefer the larger remaining groups so the tail does not become one artist.
      candidates = shuffle(candidates).sort((a, b) => b[1].length - a[1].length);
      const [key, songs] = candidates[0];
      result.push(songs.pop());
      previous = key;
    }
    return result;
  }

  function init() {
    if (initialized) return;
    const dock = document.querySelector('#music-dock, .music-dock');
    const trigger = document.getElementById('music-trigger');
    const panel = document.getElementById('music-panel');
    const embed = document.getElementById('music-embed');
    const album = document.getElementById('music-album');
    const status = document.getElementById('music-playback-status');
    const wave = document.getElementById('music-wave');
    const spotifyLink = document.getElementById('spotify-link');
    if (!dock || !trigger || !panel || !embed || !status) return;

    const seen = new Set();
    const tracks = (Array.isArray(window.WEDDING_MUSIC_TRACKS) ? window.WEDDING_MUSIC_TRACKS : [])
      .filter(track => track && /^spotify:track:[a-zA-Z0-9]{22}$/.test(track.uri) &&
        ['title', 'artist', 'album'].every(key => typeof track[key] === 'string' && track[key].trim()) &&
        !seen.has(track.uri) && seen.add(track.uri))
      .map(track => ({ ...track, url: `https://open.spotify.com/track/${track.uri.split(':')[2]}` }));
    if (!tracks.length) return;
    initialized = true;

    const byURI = new Map(tracks.map(track => [track.uri, track]));
    let queue = makeQueue(tracks);
    let queueIndex = 0;
    let expectedURI = queue[0].uri;
    let controller = null;
    let mode = 'idle';
    let generation = 0;
    let loadingTimer = 0;
    let progressTimer = 0;
    let previousSample = null;
    let hasProgressed = false;
    let ignoredCloseEvents = 0;

    const setStatus = text => {
      if (status.textContent !== text) status.textContent = text;
    };
    const setPlaying = playing => {
      wave?.classList.toggle('is-playing', playing);
      dock.classList.toggle('is-playing', playing);
    };
    function resetProgress() {
      window.clearTimeout(progressTimer);
      previousSample = null;
      hasProgressed = false;
      setPlaying(false);
    }
    function showMetadata(uri) {
      const track = byURI.get(uri);
      if (!track) return;
      if (album) album.textContent = track.album;
      if (spotifyLink) spotifyLink.href = track.url;
      const iframe = embed.querySelector('iframe');
      if (iframe) iframe.title = `${track.title} — ${track.artist}, no Spotify`;
    }
    function prepareIframe() {
      const iframe = embed.querySelector('iframe');
      if (!iframe) return;
      iframe.width = '100%';
      iframe.height = '152';
      iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      showMetadata(expectedURI);
    }
    function disposeController(value) {
      if (!value) return;
      try { value.pause(); } catch (_) { /* Removing the iframe also stops its audio. */ }
      try { value.destroy(); } catch (_) { /* The containing element is cleared below. */ }
    }
    function stopPlayer() {
      generation += 1;
      window.clearTimeout(loadingTimer);
      resetProgress();
      const oldController = controller;
      controller = null;
      mode = 'idle';
      disposeController(oldController);
      embed.replaceChildren();
      setStatus('Pronto para o play');
    }
    function fallback(mountGeneration) {
      if (mountGeneration !== generation || mode === 'fallback') return;
      generation += 1;
      window.clearTimeout(loadingTimer);
      resetProgress();
      const oldController = controller;
      controller = null;
      mode = 'fallback';
      disposeController(oldController);
      const iframe = document.createElement('iframe');
      iframe.src = `https://open.spotify.com/embed/track/${expectedURI.split(':')[2]}?theme=0`;
      embed.replaceChildren(iframe);
      prepareIframe();
      setStatus('Use o player do Spotify. A sequência automática está indisponível.');
    }
    function armLoadingTimeout(mountGeneration) {
      window.clearTimeout(loadingTimer);
      loadingTimer = window.setTimeout(() => fallback(mountGeneration), LOAD_TIMEOUT);
    }
    function advance(mountGeneration) {
      if (mountGeneration !== generation || !controller || mode !== 'api') return;
      const previousArtist = artistGroup(queue[queueIndex]);
      queueIndex += 1;
      if (queueIndex === queue.length) {
        queue = makeQueue(tracks, previousArtist);
        queueIndex = 0;
      }
      expectedURI = queue[queueIndex].uri;
      resetProgress();
      showMetadata(expectedURI);
      setStatus('Carregando a próxima faixa…');
      armLoadingTimeout(mountGeneration);
      try {
        controller.loadEntity(`${queue[queueIndex].url}?theme=0`);
        // The official controller queues play while the newly loaded Embed is
        // initializing. This is only a request; playback events confirm success.
        controller.play();
      } catch (_) {
        fallback(mountGeneration);
      }
    }
    function onPlayback(event, mountGeneration) {
      if (mountGeneration !== generation || mode !== 'api') return;
      const data = event?.data;
      if (!data || data.playingURI !== expectedURI || !byURI.has(data.playingURI)) return;
      if (!Number.isFinite(data.position) || !Number.isFinite(data.duration) ||
          data.position < 0 || data.duration <= 0 ||
          typeof data.isPaused !== 'boolean' || typeof data.isBuffering !== 'boolean') {
        resetProgress();
        setStatus('Use os controles do Spotify');
        return;
      }
      window.clearTimeout(loadingTimer);
      window.clearTimeout(progressTimer);
      showMetadata(data.playingURI);
      const previous = previousSample;
      const delta = previous ? data.position - previous.position : 0;
      const progressed = Boolean(previous && delta > 0 && delta <= 5000);
      const moving = progressed && !data.isPaused && !data.isBuffering;
      if (moving) hasProgressed = true;

      // No "ended" event is documented. Require an observed approach to the
      // exact duration reported by Spotify. A pause near the end, a 30-second
      // wall-clock timer, or a reset to zero is never sufficient.
      const reachedEnd = Boolean(previous && hasProgressed &&
        !previous.isPaused && !previous.isBuffering && !data.isPaused && !data.isBuffering &&
        Math.abs(previous.duration - data.duration) < 1 &&
        previous.position > 0 && previous.position < data.duration &&
        previous.position >= data.duration - 5000 &&
        data.position >= data.duration && progressed);
      previousSample = {
        position: data.position, duration: data.duration,
        isPaused: data.isPaused, isBuffering: data.isBuffering
      };
      if (reachedEnd) {
        advance(mountGeneration);
        return;
      }
      setPlaying(moving);
      if (data.isBuffering) setStatus('Carregando áudio…');
      else if (data.isPaused) setStatus(data.position > 0 ? 'Pausado' : 'Pronto para o play');
      else if (moving) setStatus('Tocando');
      else setStatus('Aguardando reprodução');
      if (moving) {
        // A stale event must not leave a decorative "playing" indicator running.
        // This timer never advances the queue or changes the Spotify player.
        progressTimer = window.setTimeout(() => {
          if (mountGeneration !== generation) return;
          setPlaying(false);
          setStatus('Use os controles do Spotify');
        }, 5000);
      }
    }
    async function mountPlayer() {
      if (mode !== 'idle') return;
      const mountGeneration = ++generation;
      mode = 'loading';
      expectedURI = queue[queueIndex].uri;
      resetProgress();
      showMetadata(expectedURI);
      setStatus('Carregando o Spotify…');
      const placeholder = document.createElement('div');
      embed.replaceChildren(placeholder);
      armLoadingTimeout(mountGeneration);
      try {
        const iframeAPI = await loadAPI();
        if (mountGeneration !== generation) return;
        iframeAPI.createController(placeholder, {
          url: `${queue[queueIndex].url}?theme=0`, width: '100%', height: 152
        }, value => {
          if (mountGeneration !== generation) {
            disposeController(value);
            return;
          }
          controller = value;
          mode = 'api';
          prepareIframe();
          value.addListener('ready', () => {
            if (mountGeneration !== generation) return;
            window.clearTimeout(loadingTimer);
            prepareIframe();
            setStatus('Pronto para o play');
          });
          value.addListener('playback_started', event => {
            if (mountGeneration !== generation || event?.data?.playingURI !== expectedURI) return;
            showMetadata(event.data.playingURI);
            // Starting is not evidence that audio is progressing.
          });
          value.addListener('playback_update', event => onPlayback(event, mountGeneration));
          value.addListener('error', () => fallback(mountGeneration));
        });
      } catch (_) {
        fallback(mountGeneration);
      }
    }
    function syncPanel(open) {
      trigger.setAttribute('aria-expanded', String(open));
      trigger.setAttribute('aria-label', open
        ? 'Recolher painel da trilha sonora' : 'Abrir nossa trilha sonora');
    }
    function closePanel({ stop = false, restoreFocus = false } = {}) {
      if (stop) stopPlayer();
      syncPanel(false);
      if (panel.open) {
        if (typeof panel.close === 'function') {
          ignoredCloseEvents += 1;
          panel.close();
        } else panel.removeAttribute('open');
      }
      if (restoreFocus && !dock.inert) trigger.focus({ preventScroll: true });
    }
    function openPanel() {
      if (typeof panel.show === 'function') panel.show();
      else panel.setAttribute('open', '');
      syncPanel(true);
      mountPlayer();
    }
    trigger.addEventListener('click', () => {
      if (panel.open) closePanel({ restoreFocus: true });
      else openPanel();
    });
    document.getElementById('music-minimize')?.addEventListener('click', () =>
      closePanel({ restoreFocus: true }));
    panel.querySelector('.music-close')?.addEventListener('click', () =>
      closePanel({ stop: true, restoreFocus: true }));
    panel.addEventListener('cancel', event => {
      event.preventDefault();
      closePanel({ stop: true, restoreFocus: true });
    });
    panel.addEventListener('close', () => {
      if (ignoredCloseEvents > 0) {
        ignoredCloseEvents -= 1;
        return;
      }
      syncPanel(false);
      stopPlayer();
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !panel.open || event.defaultPrevented) return;
      const otherDialog = event.target.closest?.('dialog');
      if (otherDialog && otherDialog !== panel) return;
      event.preventDefault();
      closePanel({ stop: true, restoreFocus: true });
    });
    const form = document.getElementById('message-form');
    if (form) {
      form.addEventListener('focusin', () => {
        closePanel();
        dock.classList.add('is-form-focus');
        dock.inert = true;
      });
      form.addEventListener('focusout', () => {
        queueMicrotask(() => {
          if (form.contains(document.activeElement)) return;
          dock.classList.remove('is-form-focus');
          dock.inert = false;
        });
      });
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
          dock.classList.toggle('is-near-form', entries.some(entry => entry.isIntersecting));
        }, { threshold: 0 });
        observer.observe(form);
      }
    }
    dock.hidden = false;
    syncPanel(false);
  }

  window.WeddingMusic = Object.freeze({ init });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else init();
})();
