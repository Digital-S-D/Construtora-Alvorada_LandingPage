(function () {
  "use strict";
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.dataLayer = window.dataLayer || [];
  function track(event, data) {
    window.dataLayer.push(Object.assign({ event: event }, data || {}));
  }
  track('page_view', { page: 'landing_alvorada_jardins' });

  var scrollMarks = { 25: false, 50: false, 75: false };
  window.addEventListener('scroll', function () {
    var pct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    [25, 50, 75].forEach(function (m) {
      if (pct >= m && !scrollMarks[m]) { scrollMarks[m] = true; track('scroll_depth', { percent: m }); }
    });
  }, { passive: true });

  document.querySelectorAll('[data-cta]').forEach(function (el) {
    el.addEventListener('click', function () { track('cta_click', { cta_id: el.getAttribute('data-cta') }); });
  });

  var header = document.getElementById('siteHeader');
  window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 12);
  }, { passive: true });

  var navToggle = document.getElementById('navToggle');
  var mobileNav = document.getElementById('mobileNav');
  navToggle.addEventListener('click', function () {
    var open = mobileNav.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mobileNav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      mobileNav.classList.remove('open');
      navToggle.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  document.querySelectorAll('.faq-item').forEach(function (item) {
    item.querySelector('.faq-q').addEventListener('click', function () {
      var wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (o) { o.classList.remove('open'); });
      if (!wasOpen) item.classList.add('open');
    });
  });

  document.getElementById('tourCard').addEventListener('click', function () {
    track('cta_click', { cta_id: 'tour_virtual_play' });
    document.getElementById('oferta').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  function maskPhoneBR(value) {
    var v = value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    else if (v.length > 0) v = v.replace(/(\d{0,2})/, '($1');
    return v;
  }
  var phoneInput = document.getElementById('fPhone');
  phoneInput.addEventListener('input', function () {
    var cursorFromEnd = phoneInput.value.length - phoneInput.selectionStart;
    phoneInput.value = maskPhoneBR(phoneInput.value);
    var pos = phoneInput.value.length - cursorFromEnd;
    phoneInput.setSelectionRange(pos, pos);
  });

  var form = document.getElementById('leadForm');
  var fields = {
    fName: { el: document.getElementById('fName'), test: function (v) { return v.trim().length > 3; } },
    fPhone: { el: document.getElementById('fPhone'), test: function (v) { return v.replace(/\D/g, '').length >= 10; } },
    fEmail: { el: document.getElementById('fEmail'), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); } },
    fInterest: { el: document.getElementById('fInterest'), test: function (v) { return v !== ''; } }
  };

  function validateField(key) {
    var f = fields[key];
    var wrap = f.el.closest('.field');
    var valid = f.test(f.el.value);
    wrap.classList.toggle('invalid', !valid);
    if (f.el.tagName === 'SELECT') wrap.querySelector('label').classList.toggle('has-value', f.el.value !== '');
    return valid;
  }

  Object.keys(fields).forEach(function (key) {
    var el = fields[key].el;
    el.addEventListener('blur', function () { validateField(key); });
    el.addEventListener('change', function () { validateField(key); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var allValid = Object.keys(fields).map(validateField).every(Boolean);
    if (!allValid) return;

    track('generate_lead', {
      interest: fields.fInterest.el.value
    });

    document.getElementById('offerForm').classList.add('submitted');
    document.getElementById('formSuccess').classList.add('show');
  });

  var cookieBanner = document.getElementById('cookieBanner');
  setTimeout(function () { cookieBanner.classList.add('show'); }, 900);
  document.getElementById('cookieAccept').addEventListener('click', function () {
    cookieBanner.classList.remove('show');
  });

  document.getElementById('whatsappFab').addEventListener('click', function (e) {
    track('cta_click', { cta_id: 'whatsapp_fab' });
  });
  document.getElementById('whatsappFab').href =
    'https://wa.me/5500000000000?text=' + encodeURIComponent('Olá! Vi a página do Alvorada Jardins e quero saber mais.');

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }
})();