/* ============================================================
   Shoaib Ahmed — Creator
   Hand-written JS: scroll reveals, animated counters,
   sticky-header state and the mobile menu.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sticky header shadow ---------- */
  var header = document.getElementById('siteHeader');
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
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

  /* ---------- Animated counters ----------
     Counters start from the real value's neighbourhood when
     motion is reduced, and animate from 0 otherwise. */
  function format(value, decimals) {
    return decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString('en-US');
  }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-target'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (reduceMotion) {
      el.textContent = format(target, decimals);
      return;
    }
    var duration = 1400;
    var startTime = null;
    function step(now) {
      if (!startTime) startTime = now;
      var t = Math.min((now - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3); /* ease-out cubic */
      el.textContent = format(target * eased, decimals);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Scroll reveals + counter trigger ---------- */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      entry.target.querySelectorAll('.counter').forEach(runCounter);
      if (entry.target.classList.contains('counter')) runCounter(entry.target);
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(function (el) {
    revealObserver.observe(el);
  });
  /* Counters that sit outside a .reveal wrapper still animate. */
  document.querySelectorAll('.counter').forEach(function (el) {
    if (!el.closest('.reveal')) revealObserver.observe(el);
  });
})();
