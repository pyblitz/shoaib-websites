/* ============================================================
   Shoaib Ahmed — Creator · v3 "Obsidian Index"
   Hand-written JS: curtain intro, hero choreography timing,
   masked line reveals, counters (easeOutExpo), one rAF loop
   for scroll progress / header / marquee velocity, magnetic
   primary CTAs, spotlight + gentle tilt on channel cards,
   cursor follower dot (native cursor always kept).
   Vanilla only — the site fully works if any of this fails.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var heroCountersStarted = false;

  /* ---------- Masked line reveals ----------
     Split [data-lines] headings on <br> into masked lines.
     No-JS / no-split state simply shows the plain heading. */
  document.querySelectorAll('[data-lines]').forEach(function (el) {
    var parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(function (part, i) {
      return '<span class="line"><span class="line-inner" style="--i:' + i + '">' + part + '</span></span>';
    }).join('');
    el.classList.add('reveal-lines');
  });

  /* ---------- Counters: easeOutExpo, 1500ms, once ---------- */
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

  /* ---------- Curtain intro: ≤1.2s, first visit only ---------- */
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
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- Reveal observer ---------- */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, [data-lines]').forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ---------- One rAF loop: progress, header state, marquee velocity ---------- */
  var progress = document.getElementById('scrollProgress');
  var mqTrack = document.getElementById('mqTrack');
  var lastScrollY = window.scrollY, mqBoost = 0, ticking = false;

  function rafLoop() {
    ticking = false;
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress && max > 0) progress.style.transform = 'scaleX(' + Math.min(y / max, 1) + ')';
    header.classList.toggle('scrolled', y > 8);
    /* marquee velocity nudge: scroll speed briefly quickens the strip */
    var velocity = Math.abs(y - lastScrollY);
    lastScrollY = y;
    mqBoost = Math.min(mqBoost + velocity * 0.004, 1.6);
    if (mqTrack && mqTrack.getAnimations) {
      var anims = mqTrack.getAnimations();
      if (anims.length) anims[0].playbackRate = 1 + mqBoost;
    }
    mqBoost *= 0.92;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(rafLoop); }
  }, { passive: true });
  rafLoop();

  /* ---------- Magnetic buttons — fine pointers only, primary CTAs ---------- */
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

  /* ---------- Spotlight on rows/cards; gentle tilt on channel cards only ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.video-row, .channel-card').forEach(function (card) {
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
          if (card.classList.contains('channel-card') && window.innerWidth >= 768) {
            card.style.transition = 'transform .16s cubic-bezier(.22,1,.36,1)';
            card.style.transform =
              'perspective(900px) rotateX(' + ((0.5 - py) * 4).toFixed(2) + 'deg)' +
              ' rotateY(' + ((px - 0.5) * 4).toFixed(2) + 'deg) translateY(-3px)';
          }
        });
      });
      card.addEventListener('pointerleave', function () {
        if (card.classList.contains('channel-card')) {
          card.style.transition = 'transform .45s cubic-bezier(.22,1,.36,1)';
          card.style.transform = '';
        }
      });
    });
  }

  /* ---------- Cursor follower dot — native cursor kept, dot only adds ---------- */
  var dot = document.getElementById('cursorDot');
  if (dot && finePointer && !reduceMotion && window.innerWidth >= 1024) {
    var dx2 = -100, dy2 = -100, tx = dx2, ty = dy2, dotRaf = null;
    document.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      dot.classList.add('on');
      dot.classList.toggle('grow', !!e.target.closest('a, button'));
      if (!dotRaf) dotRaf = requestAnimationFrame(dotStep);
    }, { passive: true });
    function dotStep() {
      dx2 += (tx - dx2) * 0.22;
      dy2 += (ty - dy2) * 0.22;
      dot.style.transform = 'translate(' + dx2 + 'px,' + dy2 + 'px) translate(-50%,-50%)';
      if (Math.abs(tx - dx2) > 0.4 || Math.abs(ty - dy2) > 0.4) {
        dotRaf = requestAnimationFrame(dotStep);
      } else { dotRaf = null; }
    }
  } else if (dot) {
    dot.style.display = 'none';
  }
})();
