/* ============================================================
   Shoaib Ahmed — Creator
   Hand-written JS: curtain intro, hero choreography timing,
   masked line reveals, counters (easeOutExpo), one rAF loop
   for scroll progress / parallax / marquee velocity, magnetic
   buttons, card tilt + spotlight, cursor glow. Vanilla only —
   the site fully works if any of this fails to load.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var heroCountersStarted = false;

  /* ---------- Masked line reveals (B3) ----------
     Split [data-lines] headings on <br> into masked lines.
     No-JS / no-split state simply shows the plain heading. */
  document.querySelectorAll('[data-lines]').forEach(function (el) {
    var parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(function (part, i) {
      return '<span class="line"><span class="line-inner" style="--i:' + i + '">' + part + '</span></span>';
    }).join('');
    el.classList.add('reveal-lines');
  });

  /* ---------- Counters (B9): easeOutExpo, 1500ms, once ---------- */
  function format(value, decimals) {
    return decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString('en-US');
  }

  function runCounter(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    var target = parseFloat(el.getAttribute('data-target'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (reduceMotion) { el.textContent = format(target, decimals); return; }
    var duration = 1500, startTime = null;
    function step(now) {
      if (!startTime) startTime = now;
      var t = Math.min((now - startTime) / duration, 1);
      var eased = t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); /* easeOutExpo */
      el.textContent = format(target * eased, decimals);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function startHeroCounters() {
    if (heroCountersStarted) return;
    heroCountersStarted = true;
    document.querySelectorAll('.stats .counter').forEach(runCounter);
  }

  /* ---------- Curtain intro (B1): ≤1.2s, first visit only ---------- */
  var curtain = document.getElementById('curtain');
  var seen = false;
  try { seen = !!sessionStorage.getItem('sa-creator-intro'); } catch (e) { /* private mode */ }

  function introDone() {
    document.documentElement.classList.add('intro-done');
    startHeroCounters();
  }

  if (reduceMotion || seen || !curtain) {
    document.documentElement.classList.add('no-intro');
    if (curtain) curtain.classList.add('gone');
    introDone();
  } else {
    var count = document.getElementById('curtainCount');
    var fill = document.getElementById('curtainBarFill');
    var introStart = null, lifted = false;
    function lift() {
      if (lifted) return;
      lifted = true;
      if (count) count.textContent = '100';
      if (fill) fill.style.width = '100%';
      curtain.classList.add('lift');
      try { sessionStorage.setItem('sa-creator-intro', '1'); } catch (e) {}
      introDone();
      setTimeout(function () { curtain.classList.add('gone'); }, 620);
    }
    curtain.addEventListener('click', lift);
    function introStep(now) {
      if (!introStart) introStart = now;
      var t = Math.min((now - introStart) / 680, 1);
      var v = Math.round((1 - Math.pow(1 - t, 3)) * 100);
      if (count) count.textContent = v;
      if (fill) fill.style.width = v + '%';
      if (t < 1) requestAnimationFrame(introStep); else setTimeout(lift, 120);
    }
    requestAnimationFrame(introStep);
    setTimeout(lift, 1600); /* hard cap — intro never outstays its welcome */
  }

  /* ---------- Sticky header + mobile menu ---------- */
  var header = document.getElementById('siteHeader');
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('siteNav');
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- Reveal observer (B10): sections, headings, cards ---------- */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      if (!entry.target.closest('.hero')) {
        entry.target.querySelectorAll('.counter').forEach(runCounter);
      }
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, [data-lines]').forEach(function (el) {
    revealObserver.observe(el);
  });
  document.querySelectorAll('.counter').forEach(function (el) {
    if (!el.closest('.reveal') && !el.closest('.stats')) revealObserver.observe(el);
  });

  /* ---------- Aurora pause offscreen (B4) ---------- */
  var hero = document.getElementById('hero');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      hero.classList.toggle('paused', !entries[0].isIntersecting);
    }).observe(hero);
  }

  /* ---------- One rAF loop: progress (B8), parallax (B11), marquee velocity (B5) ---------- */
  var progress = document.getElementById('scrollProgress');
  var heroPhoto = document.getElementById('heroPhoto');
  var mqTrack = document.getElementById('mqTrack');
  var lastScrollY = window.scrollY, mqBoost = 0, ticking = false;

  function rafLoop() {
    ticking = false;
    var y = window.scrollY;
    /* scroll progress */
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress && max > 0) progress.style.transform = 'scaleX(' + Math.min(y / max, 1) + ')';
    header.classList.toggle('scrolled', y > 8);
    /* light parallax on the hero portrait (desktop, motion-safe) */
    if (heroPhoto && !reduceMotion && window.innerWidth >= 768) {
      var rect = hero.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        var off = (rect.top + rect.height / 2 - window.innerHeight / 2) * -0.055;
        off = Math.max(-16, Math.min(16, off));
        heroPhoto.style.transform = 'translateY(' + off.toFixed(1) + 'px)';
      }
    }
    /* marquee velocity nudge: scroll speed briefly quickens the strip */
    var velocity = Math.abs(y - lastScrollY);
    lastScrollY = y;
    mqBoost = Math.min(mqBoost + velocity * 0.004, 1.6);
    if (mqTrack) {
      var anims = mqTrack.getAnimations ? mqTrack.getAnimations() : [];
      if (anims.length) anims[0].playbackRate = 1 + mqBoost;
    }
    mqBoost *= 0.92;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(rafLoop); }
  }, { passive: true });
  rafLoop();

  /* ---------- Magnetic buttons (B6) — fine pointers only ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var raf = null;
      el.addEventListener('pointermove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var r = el.getBoundingClientRect();
          var dx = (e.clientX - (r.left + r.width / 2)) * 0.28;
          var dy = (e.clientY - (r.top + r.height / 2)) * 0.34;
          dx = Math.max(-9, Math.min(9, dx));
          dy = Math.max(-7, Math.min(7, dy));
          el.style.transition = 'transform .18s cubic-bezier(.22,1,.36,1)';
          el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
        });
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform .45s cubic-bezier(.34,1.56,.64,1)';
        el.style.transform = '';
      });
    });
  }

  /* ---------- Card tilt + spotlight (B7) — fine pointers only ---------- */
  if (finePointer && !reduceMotion && window.innerWidth >= 768) {
    document.querySelectorAll('.video-card, .channel-card').forEach(function (card) {
      var raf = null;
      card.addEventListener('pointermove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width;
          var py = (e.clientY - r.top) / r.height;
          card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
          card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
          card.style.transition = 'transform .16s cubic-bezier(.22,1,.36,1)';
          card.style.transform =
            'perspective(900px) rotateX(' + ((0.5 - py) * 6).toFixed(2) + 'deg)' +
            ' rotateY(' + ((px - 0.5) * 6).toFixed(2) + 'deg) translateY(-4px)';
        });
      });
      card.addEventListener('pointerleave', function () {
        card.style.transition = 'transform .45s cubic-bezier(.22,1,.36,1)';
        card.style.transform = '';
      });
    });
  }

  /* ---------- Cursor glow (B12) — desktop, fine pointer, dark-stage garnish ---------- */
  var glow = document.getElementById('cursorGlow');
  if (glow && finePointer && !reduceMotion && window.innerWidth >= 1024) {
    var gx = -400, gy = -400, tx = gx, ty = gy, glowRaf = null;
    document.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      glow.classList.add('on');
      if (!glowRaf) glowRaf = requestAnimationFrame(glowStep);
    }, { passive: true });
    function glowStep() {
      gx += (tx - gx) * 0.15;
      gy += (ty - gy) * 0.15;
      glow.style.transform = 'translate(' + (gx - 180) + 'px,' + (gy - 180) + 'px)';
      if (Math.abs(tx - gx) > 0.4 || Math.abs(ty - gy) > 0.4) {
        glowRaf = requestAnimationFrame(glowStep);
      } else { glowRaf = null; }
    }
  } else if (glow) {
    glow.style.display = 'none';
  }
})();
