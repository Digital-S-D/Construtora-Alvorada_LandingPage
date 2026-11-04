(function () {
  "use strict";
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- dataLayer / rastreamento (Seção 4 do briefing) ---
     Substitua GTM-XXXXXXX pelo container real do Google Tag Manager.
     Os eventos abaixo já disparam para o dataLayer e ficam prontos
     para serem lidos assim que o GTM for instalado. Isso funciona em
     todas as páginas do site, não só na landing page principal. */
  window.dataLayer = window.dataLayer || [];
  function track(event, data) {
    window.dataLayer.push(Object.assign({ event: event }, data || {}));
  }
  track('page_view', { page: document.body.getAttribute('data-page') || 'unknown' });

  /* Profundidade de rolagem: 25/50/75% (só faz sentido em páginas com rolagem real) */
  var scrollMarks = { 25: false, 50: false, 75: false };
  window.addEventListener('scroll', function () {
    var scrollable = document.body.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    var pct = Math.round((window.scrollY / scrollable) * 100);
    [25, 50, 75].forEach(function (m) {
      if (pct >= m && !scrollMarks[m]) { scrollMarks[m] = true; track('scroll_depth', { percent: m }); }
    });
  }, { passive: true });

  /* Clique em qualquer CTA rastreado */
  document.querySelectorAll('[data-cta]').forEach(function (el) {
    el.addEventListener('click', function () { track('cta_click', { cta_id: el.getAttribute('data-cta') }); });
  });

  /* --- Header: sombra ao rolar --- */
  var header = document.getElementById('siteHeader');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 12);
    }, { passive: true });
  }

  /* --- Menu mobile --- */
  var navToggle = document.getElementById('navToggle');
  var mobileNav = document.getElementById('mobileNav');
  if (navToggle && mobileNav) {
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
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && mobileNav.classList.contains('open')) {
        mobileNav.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        navToggle.focus();
      }
    });
  }

  /* --- FAQ acordeão (só existe na home) --- */
  document.querySelectorAll('.faq-item').forEach(function (item, index) {
    var q = item.querySelector('.faq-q');
    if (!q) return;
    var answer = item.querySelector('.faq-a');
    if (answer) {
      answer.id = 'faq-answer-' + index;
      answer.hidden = true;
      q.setAttribute('aria-controls', answer.id);
    }
    q.addEventListener('click', function () {
      var wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function (other) {
        other.classList.remove('open');
        other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        other.querySelector('.faq-a').hidden = true;
      });
      if (!wasOpen) {
        item.classList.add('open');
        q.setAttribute('aria-expanded', 'true');
        if (answer) answer.hidden = false;
      }
    });
  });

  /* --- Máscara de telefone (BR): (99) 99999-9999 ou (99) 9999-9999 --- */
  function maskPhoneBR(value) {
    var v = value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    else if (v.length > 0) v = v.replace(/(\d{0,2})/, '($1');
    return v;
  }
  var phoneInput = document.getElementById('fPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      var cursorFromEnd = phoneInput.value.length - phoneInput.selectionStart;
      phoneInput.value = maskPhoneBR(phoneInput.value);
      var pos = phoneInput.value.length - cursorFromEnd;
      phoneInput.setSelectionRange(pos, pos);
    });
  }

  /* --- Formulário: validação inline + estado de sucesso (só existe na home) --- */
  var form = document.getElementById('leadForm');
  if (form) {
    var fields = {
      fName: { el: document.getElementById('fName'), test: function (v) { return v.trim().length > 3 && v.length <= 100; } },
      fPhone: { el: document.getElementById('fPhone'), test: function (v) { return /^[1-9]{2}(?:[2-5]\d{7}|9\d{8})$/.test(v.replace(/\D/g, '')); } },
      fEmail: { el: document.getElementById('fEmail'), test: function (v) { return v.length <= 150 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } },
      fInterest: { el: document.getElementById('fInterest'), test: function (v) { return ['planta-a', 'planta-b', 'indeciso'].indexOf(v) !== -1; } },
      fConsent: { el: document.getElementById('fConsent'), test: function (v, el) { return el.checked; } }
    };

    function validateField(key) {
      var f = fields[key];
      if (!f.el) return true;
      var wrap = f.el.closest('.field') || f.el.closest('.field-consent');
      var valid = f.test(f.el.value, f.el);
      if (wrap) wrap.classList.toggle('invalid', !valid);
      f.el.setAttribute('aria-invalid', String(!valid));
      if (f.el.tagName === 'SELECT' && wrap) wrap.querySelector('label').classList.toggle('has-value', f.el.value !== '');
      return valid;
    }

    Object.keys(fields).forEach(function (key) {
      var el = fields[key].el;
      if (!el) return;
      var wrap = el.closest('.field') || el.closest('.field-consent');
      var error = wrap && wrap.querySelector('.field-error');
      if (error) {
        error.id = key + '-error';
        el.setAttribute('aria-describedby', error.id);
      }
      el.addEventListener('blur', function () { validateField(key); });
      el.addEventListener('change', function () { validateField(key); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var allValid = Object.keys(fields).map(validateField).every(Boolean);
      if (!allValid) {
        var firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Apenas um evento local de teste, sem valores dos campos.
      track('demo_form_completed');
      form.reset();

      var offerForm = document.getElementById('offerForm');
      var formSuccess = document.getElementById('formSuccess');
      if (offerForm) offerForm.classList.add('submitted');
      if (formSuccess) { formSuccess.classList.add('show'); formSuccess.focus(); }
    });
    var demoFields = document.getElementById('demoFields');
    if (demoFields) demoFields.disabled = false;
    var testAgain = document.getElementById('testAgain');
    if (testAgain) testAgain.addEventListener('click', function () {
      document.getElementById('offerForm').classList.remove('submitted');
      document.getElementById('formSuccess').classList.remove('show');
      form.querySelectorAll('.invalid').forEach(function (field) { field.classList.remove('invalid'); });
      form.querySelectorAll('[aria-invalid]').forEach(function (field) { field.removeAttribute('aria-invalid'); });
      var interestLabel = fields.fInterest.el.closest('.field').querySelector('label');
      interestLabel.classList.remove('has-value');
      fields.fName.el.focus();
    });
  }

  /* --- Revelar ao rolar --- */
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

  /* ============================================
     CONSENTIMENTO DE COOKIES (LGPD)
     Presente em todas as páginas (o banner é o mesmo HTML em todas).
     Guarda a escolha em localStorage — funciona em qualquer página
     do site, e pode ser reaberto a qualquer momento pela página
     de Política de Cookies.
     ============================================ */
  var CONSENT_KEY = 'alvoradaCookieConsent';

  function readConsent() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function saveConsent(consent) {
    var full = {
      necessary: true,
      analytics: !!consent.analytics,
      marketing: !!consent.marketing,
      timestamp: new Date().toISOString()
    };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(full)); } catch (err) { /* localStorage indisponível */ }
    applyConsent(full);
    return full;
  }

  function applyConsent(consent) {
    /* Sinaliza a escolha no dataLayer no formato compatível com o
       Google Consent Mode. Hoje isso não ativa nada sozinho (o GTM
       ainda não está instalado nesta página), mas assim que o
       container real for adicionado, ele já vai encontrar esse sinal
       pronto para decidir o que carregar. */
    track('consent_update', {
      analytics_storage: consent.analytics ? 'granted' : 'denied',
      ad_storage: consent.marketing ? 'granted' : 'denied'
    });

    /* Quando o GTM/GA/Meta Pixel forem realmente instalados, é aqui
       que a ativação condicional deve acontecer. Exemplo:
       if (consent.analytics) { carregarGoogleAnalytics(); }
       if (consent.marketing) { carregarMetaPixel(); }
       Enquanto isso não existir, esta função só registra a escolha. */
  }

  var cookieBanner = document.getElementById('cookieBanner');
  if (cookieBanner) {
    var mainView = document.getElementById('cookieMainView');
    var prefsView = document.getElementById('cookiePrefsView');
    var btnAcceptAll = document.getElementById('cookieAcceptAll');
    var btnReject = document.getElementById('cookieReject');
    var btnCustomize = document.getElementById('cookieCustomize');
    var btnBack = document.getElementById('cookieBack');
    var btnSavePrefs = document.getElementById('cookieSavePrefs');
    var toggleAnalytics = document.getElementById('cookieAnalytics');
    var toggleMarketing = document.getElementById('cookieMarketing');

    function showBanner() { cookieBanner.classList.add('show'); }
    function hideBanner() { cookieBanner.classList.remove('show'); }

    function setToggle(el, value) {
      if (!el) return;
      el.setAttribute('aria-checked', value ? 'true' : 'false');
      el.classList.toggle('on', !!value);
    }
    function toggleValue(el) { return !!(el && el.getAttribute('aria-checked') === 'true'); }

    function showView(view) {
      if (mainView) mainView.hidden = view !== 'main';
      if (prefsView) prefsView.hidden = view !== 'prefs';
    }

    function openPreferences() {
      var existing = readConsent();
      setToggle(toggleAnalytics, existing ? existing.analytics : false);
      setToggle(toggleMarketing, existing ? existing.marketing : false);
      showView('prefs');
      showBanner();
    }
    /* Exposto globalmente para o botão "Alterar preferências"
       na página de Política de Cookies poder reabrir o painel. */
    window.AlvoradaCookies = { openPreferences: openPreferences };

    if (toggleAnalytics) toggleAnalytics.addEventListener('click', function () { setToggle(toggleAnalytics, !toggleValue(toggleAnalytics)); });
    if (toggleMarketing) toggleMarketing.addEventListener('click', function () { setToggle(toggleMarketing, !toggleValue(toggleMarketing)); });

    if (btnAcceptAll) btnAcceptAll.addEventListener('click', function () {
      saveConsent({ analytics: true, marketing: true });
      hideBanner();
    });
    if (btnReject) btnReject.addEventListener('click', function () {
      saveConsent({ analytics: false, marketing: false });
      hideBanner();
    });
    if (btnCustomize) btnCustomize.addEventListener('click', openPreferences);
    if (btnBack) btnBack.addEventListener('click', function () { showView('main'); });
    if (btnSavePrefs) btnSavePrefs.addEventListener('click', function () {
      saveConsent({ analytics: toggleValue(toggleAnalytics), marketing: toggleValue(toggleMarketing) });
      hideBanner();
    });

    var stored = readConsent();
    if (stored) {
      applyConsent(stored);
    } else {
      showView('main');
      setTimeout(showBanner, 900);
    }

    /* Botão "Gerenciar minhas preferências de cookies" (só existe na
       página cookies.html) reabre o mesmo painel usado no banner. */
    var reopenBtn = document.getElementById('reopenCookiePrefs');
    if (reopenBtn) reopenBtn.addEventListener('click', openPreferences);
  }
})();
