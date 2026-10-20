(() => {
  'use strict';

  const config = window.WEDDING_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // A small, accessible mobile menu; hidden items never enter the tab sequence.
  const header = $('#header');
  const menuButton = $('.menu-toggle');
  const mobileMenu = $('#mobile-menu');
  const setMenu = (open, restoreFocus = false) => {
    header.classList.toggle('menu-is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    mobileMenu.inert = !open;
    if (restoreFocus) menuButton.focus();
  };
  menuButton.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });
  $$('#mobile-menu a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false, true);
    }
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', event => {
    if (event.matches) setMenu(false);
  });

  // The landscape moves automatically; the system's motion preference prevails.
  const hero = $('.hero');
  const motionEnabled = () => !reducedMotion.matches;
  const syncMotion = () => {
    const enabled = motionEnabled();
    document.documentElement.classList.toggle('has-motion', enabled);
    document.documentElement.classList.toggle('motion-paused', !enabled);
    document.documentElement.classList.toggle('can-reveal', enabled && 'IntersectionObserver' in window);
  };
  reducedMotion.addEventListener('change', syncMotion);

  // Progressive enhancement: content stays visible when JS is unavailable.
  $$('.line-art path, .monogram-seal path, .details-flower path, .message-flourish path').forEach(path => {
    path.setAttribute('pathLength', '1');
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px 12px 0px' });
    $$('.reveal').forEach(element => observer.observe(element));

    // A quiet landscape only moves while somebody can actually see it.
    const sceneryObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => hero.classList.toggle('scene-in-view', entry.isIntersecting));
    }, { threshold: 0 });
    sceneryObserver.observe(hero);
  } else {
    hero.classList.add('scene-in-view');
  }
  const syncPageVisibility = () => {
    document.documentElement.classList.toggle('page-inactive', document.hidden);
  };
  document.addEventListener('visibilitychange', syncPageVisibility);
  syncPageVisibility();
  syncMotion();

  // Fine, nonessential cues; all continuous decoration respects reduced motion.
  let readingFrame = 0;
  const updateReadingProgress = () => {
    readingFrame = 0;
    const available = document.documentElement.scrollHeight - window.innerHeight;
    document.documentElement.style.setProperty('--reading-progress', available > 0 ? String(Math.min(1, Math.max(0, window.scrollY / available))) : '0');
  };
  const queueReadingProgress = () => {
    if (!readingFrame && motionEnabled()) readingFrame = requestAnimationFrame(updateReadingProgress);
  };
  document.addEventListener('scroll', queueReadingProgress, { passive: true });
  window.addEventListener('resize', queueReadingProgress, { passive: true });
  updateReadingProgress();
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.message-form, .music-panel').forEach(surface => {
      let glassFrame = 0;
      surface.addEventListener('pointermove', event => {
        if (!motionEnabled() || glassFrame) return;
        const rect = surface.getBoundingClientRect();
        glassFrame = requestAnimationFrame(() => {
          surface.style.setProperty('--glass-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
          surface.style.setProperty('--glass-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
          glassFrame = 0;
        });
      });
      surface.addEventListener('pointerleave', () => {
        surface.style.removeProperty('--glass-x');
        surface.style.removeProperty('--glass-y');
      });
    });
  }

  // Official Spotify embeds, loaded only after the guest asks for music.
  // Minimizing preserves the player; stopping removes it and ends playback.
  const musicDock = $('.music-dock');
  const musicTrigger = $('#music-trigger');
  const musicPanel = $('#music-panel');
  const musicEmbed = $('#music-embed');
  const spotifyLink = $('#spotify-link');
  const musicTracks = {
    anavitoria: {
      embed: 'https://open.spotify.com/embed/album/6KD10xly79MXn1PT0dns6D?theme=0',
      url: 'https://open.spotify.com/album/6KD10xly79MXn1PT0dns6D',
      title: 'ANAVITÓRIA — player oficial do Spotify'
    },
    mpb: {
      embed: 'https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO2w94yY?theme=0',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DZ06evO2w94yY',
      title: 'MPB leve: This Is TIAGO IORC — player oficial do Spotify'
    }
  };
  let selectedMusic = 'anavitoria';
  const updateMusicTrigger = () => {
    const hasPlayer = Boolean($('iframe', musicEmbed));
    musicTrigger.setAttribute('aria-expanded', String(musicPanel.open));
    musicTrigger.setAttribute('aria-label', musicPanel.open ? 'Recolher painel da trilha sonora' : hasPlayer ? 'Abrir painel da trilha sonora' : 'Dar play no amor: escolher trilha sonora');
    $('.music-trigger-copy', musicTrigger).firstChild.textContent = hasPlayer ? 'Nossa trilha' : 'Dar play no amor';
    $('small', musicTrigger).textContent = hasPlayer ? 'Abrir a seleção musical' : 'Uma trilha para o nosso encontro';
  };
  const mountMusic = () => {
    const track = musicTracks[selectedMusic];
    const frame = document.createElement('iframe');
    frame.src = track.embed;
    frame.title = track.title;
    frame.width = '100%';
    frame.height = '152';
    frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    musicEmbed.replaceChildren(frame);
    spotifyLink.href = track.url;
    $$('.music-choice').forEach(choice => {
      const active = choice.dataset.playlist === selectedMusic;
      choice.classList.toggle('is-selected', active);
      choice.setAttribute('aria-pressed', String(active));
    });
    updateMusicTrigger();
  };
  const minimizeMusic = (restoreFocus = false) => {
    if (musicPanel.open) musicPanel.close();
    updateMusicTrigger();
    if (restoreFocus) musicTrigger.focus({ preventScroll: true });
  };
  const stopMusic = () => {
    musicEmbed.replaceChildren();
    minimizeMusic(true);
  };
  musicTrigger.addEventListener('click', () => {
    if (musicPanel.open) {
      minimizeMusic();
      return;
    }
    if (!$('iframe', musicEmbed)) mountMusic();
    musicPanel.show();
    updateMusicTrigger();
    $('.music-choice.is-selected').focus({ preventScroll: true });
  });
  $$('.music-choice').forEach(choice => {
    choice.addEventListener('click', () => {
      if (selectedMusic === choice.dataset.playlist && $('iframe', musicEmbed)) return;
      selectedMusic = choice.dataset.playlist;
      mountMusic();
    });
  });
  $('.music-close').addEventListener('click', stopMusic);
  $('#music-stop').addEventListener('click', stopMusic);
  $('#music-minimize').addEventListener('click', () => minimizeMusic(true));
  musicPanel.addEventListener('cancel', event => {
    event.preventDefault();
    stopMusic();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && musicPanel.open) {
      event.preventDefault();
      stopMusic();
    }
  });
  document.addEventListener('pointerdown', event => {
    if (musicPanel.open && !musicPanel.contains(event.target) && !musicTrigger.contains(event.target)) minimizeMusic();
  });
  const guestForm = $('#message-form');
  guestForm.addEventListener('focusin', event => {
    if (event.target.matches('input, textarea')) {
      minimizeMusic();
      musicDock.classList.add('is-form-focus');
      musicDock.inert = true;
    }
  });
  guestForm.addEventListener('focusout', () => {
    window.setTimeout(() => {
      if (!guestForm.contains(document.activeElement) || !document.activeElement.matches('input, textarea')) {
        musicDock.classList.remove('is-form-focus');
        musicDock.inert = false;
      }
    }, 0);
  });
  if ('IntersectionObserver' in window) {
    const formObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => musicDock.classList.toggle('is-near-form', entry.isIntersecting));
    }, { threshold: 0 });
    formObserver.observe($('#recados'));
  }
  if (typeof musicPanel.show === 'function') musicDock.hidden = false;
  updateMusicTrigger();

  // Calendar days are counted in São Paulo, regardless of the visitor's time zone.
  const countdown = $('#countdown');
  function updateCountdown() {
    const eventDate = new Date(config.weddingDate || '2026-11-14T15:00:00-03:00');
    if (Number.isNaN(eventDate.valueOf())) return;
    const dayParts = date => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
      }).formatToParts(date);
      const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
      return Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day));
    };
    const days = Math.round((dayParts(eventDate) - dayParts(new Date())) / 86400000);
    let lead = '';
    let label = '';
    if (days > 0) {
      lead = String(days).padStart(2, '0');
      label = days === 1 ? 'dia para o nosso sim' : 'dias para o nosso sim';
    } else if (days === 0) {
      lead = 'É hoje';
      label = 'o nosso grande dia';
    } else if (days === -1) {
      lead = 'Juntos';
      label = 'mais um dia para celebrar';
    } else {
      lead = 'Nosso sim';
      label = '14 de novembro de 2026';
    }
    countdown.replaceChildren(document.createTextNode(lead));
    const caption = document.createElement('span');
    caption.textContent = label;
    countdown.append(caption);
    countdown.setAttribute('aria-label', `${lead} ${label}`);
  }
  updateCountdown();
  window.setInterval(updateCountdown, 60000);

  // The invitation appears only when a finalized file or Canva URL is configured.
  const invitationLink = $('#invitation-download');
  if (typeof config.invitationUrl === 'string' && config.invitationUrl.trim()) {
    try {
      const invitationUrl = new URL(config.invitationUrl, location.href);
      if (['https:', 'http:'].includes(invitationUrl.protocol)) {
        invitationLink.href = invitationUrl.href;
        invitationLink.hidden = false;
        if (invitationUrl.origin !== location.origin) {
          invitationLink.removeAttribute('download');
          invitationLink.target = '_blank';
          invitationLink.rel = 'noopener noreferrer';
        }
      }
    } catch (_) { /* Keep the link hidden if the configured URL is invalid. */ }
  }

  // Original photographs open in a native modal with focus containment and Escape.
  const photoDialog = $('#photo-dialog');
  const photoButtons = $$('.portrait');
  let lastPhotoTrigger = null;
  let currentPhotoIndex = 0;
  const showPhoto = index => {
    currentPhotoIndex = (index + photoButtons.length) % photoButtons.length;
    const button = photoButtons[currentPhotoIndex];
    const photo = $('figure img', photoDialog);
    photo.src = button.dataset.photo;
    photo.alt = $('img', button).alt;
    $('figcaption', photoDialog).textContent = button.dataset.caption;
    $('#photo-position').textContent = `${currentPhotoIndex + 1} de ${photoButtons.length}`;
  };
  photoButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      if (typeof photoDialog.showModal !== 'function') {
        window.open(button.dataset.photo, '_blank', 'noopener,noreferrer');
        return;
      }
      lastPhotoTrigger = button;
      showPhoto(index);
      photoDialog.showModal();
      document.body.classList.add('modal-open');
    });
  });
  $('.photo-previous').addEventListener('click', () => showPhoto(currentPhotoIndex - 1));
  $('.photo-next').addEventListener('click', () => showPhoto(currentPhotoIndex + 1));
  photoDialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(currentPhotoIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  $('.dialog-close').addEventListener('click', () => photoDialog.close());
  photoDialog.addEventListener('click', event => {
    if (event.target === photoDialog) {
      const bounds = photoDialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) photoDialog.close();
    }
  });
  photoDialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    lastPhotoTrigger?.focus({ preventScroll: true });
  });

  $('.copy-address').addEventListener('click', async () => {
    const status = $('#copy-status');
    const address = config.address || 'Avenida Alexandre Chauar, 1604, Sarapuí, São Paulo, 18225-000, Brasil';
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard not available');
      await navigator.clipboard.writeText(address);
      status.textContent = 'Endereço copiado. Até lá!';
    } catch (_) {
      // No deprecated clipboard workaround: keep the actual address selectable.
      status.textContent = `Copie este endereço: ${address}`;
    }
  });

  const form = $('#message-form');
  const formStatus = $('#form-status');
  const submitButton = $('.form-submit');
  const messageInput = $('#guest-message');
  const counter = $('#message-count');
  const formatNumber = number => new Intl.NumberFormat('pt-BR').format(number);
  const updateCounter = () => {
    counter.textContent = `${formatNumber(messageInput.value.length)} / 3.000`;
  };
  messageInput.addEventListener('input', updateCounter);

  const setFormStatus = (message, state = 'pending', withEmail = false) => {
    formStatus.dataset.state = state;
    formStatus.replaceChildren(document.createTextNode(message));
    if (withEmail && config.recipientEmail) {
      const emailLink = document.createElement('a');
      const subject = encodeURIComponent('Um carinho para Wesley & Vinícius');
      const body = encodeURIComponent(`${messageInput.value}\n\nCom carinho, ${$('#guest-name').value}`);
      emailLink.href = `mailto:${config.recipientEmail}?subject=${subject}&body=${body}`;
      emailLink.textContent = 'enviar pelo seu aplicativo de e-mail';
      formStatus.append(document.createTextNode(' Você também pode '), emailLink, document.createTextNode('.'));
    }
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitButton.disabled) return;
    // Browser validation covers email syntax; whitespace-only inputs need this check.
    const name = $('#guest-name').value.trim();
    const email = $('#guest-email').value.trim();
    const message = messageInput.value.trim();
    if (!name || message.length < 3) {
      setFormStatus('Preencha seu nome e escreva um recado com pelo menos 3 caracteres.', 'error');
      (!name ? $('#guest-name') : messageInput).focus();
      return;
    }
    if ($('#guest-website').value) {
      setFormStatus('Não foi possível enviar. Atualize a página e tente novamente.', 'error');
      return;
    }
    const recipient = (config.formSubmitId || config.recipientEmail || '').trim();
    if (!recipient) {
      setFormStatus('O envio de recados ainda está sendo preparado. Seu texto continua aqui; tente novamente mais tarde.', 'error');
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25000);
    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    form.setAttribute('aria-busy', 'true');
    $$('input, textarea', form).forEach(field => { field.readOnly = true; });
    $('span', submitButton).textContent = 'Enviando seu carinho…';
    setFormStatus('Só um instante. Estamos enviando seu recado.');
    try {
      const payload = {
        name,
        message,
        _subject: 'WVWedding · Um carinho para Wesley & Vinícius',
        _template: 'table',
        _honey: '',
        _url: `${location.origin}${location.pathname}`
      };
      if (email) {
        payload.email = email;
        payload._replyto = email;
      }
      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const accepted = result.success === true || result.success === 'true';
      const needsActivation = /activat|verify|verification|confirm.*email|check.*email/i.test(String(result.message || ''));
      if (needsActivation) {
        setFormStatus('Seu recado ainda não foi enviado. O serviço de envio precisa de uma confirmação nossa. Seu texto foi mantido.', 'error', true);
        return;
      }
      if (!accepted) {
        setFormStatus('O serviço de envio não aceitou o recado agora. Seu texto foi mantido; tente novamente em instantes.', 'error', true);
        return;
      }
      setFormStatus('Seu carinho foi enviado. Obrigado por fazer parte da nossa vida! Com amor, Wesley & Vinícius.', 'success');
      form.reset();
      updateCounter();
    } catch (error) {
      const message = error.name === 'AbortError'
        ? 'A conexão demorou mais que o esperado. Não conseguimos confirmar o envio, e seu texto foi mantido. Antes de reenviar, aguarde um instante.'
        : 'Não conseguimos confirmar o envio agora. Seu recado continua aqui; confira sua conexão e tente novamente.';
      setFormStatus(message, 'error', true);
    } finally {
      window.clearTimeout(timeout);
      submitButton.disabled = false;
      submitButton.removeAttribute('aria-busy');
      form.removeAttribute('aria-busy');
      $$('input, textarea', form).forEach(field => { field.readOnly = false; });
      $('span', submitButton).textContent = 'Enviar carinho';
    }
  });
  // Remain disabled in plain HTML; enable only after submit interception is ready.
  submitButton.disabled = false;
})();
