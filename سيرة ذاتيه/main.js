/* ==========================================================================
   main.js
   Handles: loading screen, language switching (i18n), dark/light theme,
   sticky nav + smooth scroll + active link highlighting, mobile menu,
   typing animation, scroll-reveal, animated counters, animated progress
   bars, back-to-top button, and the contact form.

   IMPORTANT ORDERING NOTE: every DOM element is looked up and every
   IntersectionObserver is created FIRST. Only at the very end do we run
   the "initial state" calls (apply saved language, apply saved theme,
   etc.) — this avoids a whole class of bugs where an early function call
   references a `const`/`let` that hasn't been declared yet further down
   the file (a "temporal dead zone" error), which silently stops the rest
   of the script from running.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* =======================================================================
     STEP 1 — LOOK UP ALL DOM ELEMENTS UP FRONT
     ======================================================================= */
  const htmlEl = document.documentElement;

  const loadingScreen   = document.getElementById('loading-screen');

  const langSwitchBtn   = document.getElementById('lang-switch');
  const langCodeEl      = document.getElementById('lang-code');

  const themeSwitchBtn  = document.getElementById('theme-switch');
  const themeIcon       = document.getElementById('theme-icon');

  const navbar             = document.getElementById('navbar');
  const navLinks           = document.querySelectorAll('.nav-link');
  const sections           = document.querySelectorAll('main .section, .hero');
  const navLinksContainer  = document.getElementById('nav-links');
  const hamburger          = document.getElementById('hamburger');

  const typingEl        = document.getElementById('typing-text');
  let   typingTimeoutId = null;

  const revealEls  = document.querySelectorAll('.reveal');
  const counterEls = document.querySelectorAll('.counter');
  const skillEls   = document.querySelectorAll('.skill-item');

  const backToTopBtn = document.getElementById('back-to-top');

  const contactForm  = document.getElementById('contact-form');
  const formSuccess  = document.getElementById('form-success');


  /* =======================================================================
     STEP 2 — DEFINE ALL FUNCTIONS
     ======================================================================= */

  /* ---- Loading screen ---- */
  function hideLoadingScreen() {
    if (loadingScreen) loadingScreen.classList.add('hidden');
  }

  /* ---- Language (i18n) ---- */
  function applyTranslations(lang) {
    const dict = translations[lang];
    if (!dict) return;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) el.textContent = dict[key];
    });

    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (dict[key] !== undefined) el.setAttribute('title', dict[key]);
    });

    document.title = dict['meta.title'] || document.title;

    htmlEl.setAttribute('lang', lang);
    htmlEl.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    langCodeEl.textContent = lang === 'ar' ? 'EN' : 'AR';

    localStorage.setItem('site-lang', lang);
    restartTyping(lang);
  }

  /* ---- Dark / light theme ---- */
  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    themeIcon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    localStorage.setItem('site-theme', theme);
  }

  /* ---- Sticky navbar / active link ---- */
  function highlightActiveLink() {
    let currentId = sections[0] ? sections[0].id : '';
    const scrollPos = window.scrollY + window.innerHeight * 0.35;

    sections.forEach((section) => {
      if (scrollPos >= section.offsetTop) currentId = section.id;
    });

    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
  }

  /* ---- Typing animation (hero subtitle) ---- */
  function restartTyping(lang) {
    clearTimeout(typingTimeoutId);
    const dict = translations[lang];
    const phrases = [dict['hero.title1'], dict['hero.title2'], dict['hero.title3']].filter(Boolean);
    let phraseIndex = 0, charIndex = 0, deleting = false;

    function tick() {
      const current = phrases[phraseIndex];

      if (!deleting) {
        charIndex++;
        typingEl.textContent = current.slice(0, charIndex);
        if (charIndex === current.length) {
          deleting = true;
          typingTimeoutId = setTimeout(tick, 1600);
          return;
        }
      } else {
        charIndex--;
        typingEl.textContent = current.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
        }
      }
      typingTimeoutId = setTimeout(tick, deleting ? 45 : 90);
    }
    tick();
  }

  /* ---- Animated counters ---- */
  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'), 10) || 0;
    const duration = 1600;
    const start = performance.now();

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(frame);
      else el.textContent = target;
    }
    requestAnimationFrame(frame);
  }

  /* ---- Back to top ---- */
  function toggleBackToTop() {
    backToTopBtn.classList.toggle('show', window.scrollY > 500);
  }


  /* =======================================================================
     STEP 3 — SET UP OBSERVERS (safe to do any time after elements exist)
     ======================================================================= */

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('pre-reveal');
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  // Only hide elements right before we start watching them — if this code
  // never runs, elements simply stay visible (see style.css notes).
  revealEls.forEach((el) => {
    el.classList.add('pre-reveal');
    revealObserver.observe(el);
  });

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  counterEls.forEach((el) => counterObserver.observe(el));

  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const percent = entry.target.getAttribute('data-percent');
        const bar = entry.target.querySelector('.progress-bar');
        requestAnimationFrame(() => { bar.style.width = percent + '%'; });
        skillObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  skillEls.forEach((el) => skillObserver.observe(el));


  /* =======================================================================
     STEP 4 — ATTACH EVENT LISTENERS
     (wrapped in try/catch so one broken feature can never take the rest
     of the page down with it — worst case, that one feature just won't
     work, and the error is logged to the console for debugging)
     ======================================================================= */
  try {
    window.addEventListener('load', () => setTimeout(hideLoadingScreen, 400));
    setTimeout(hideLoadingScreen, 2500); // fallback in case 'load' already fired

    langSwitchBtn.addEventListener('click', () => {
      const current = htmlEl.getAttribute('lang') === 'ar' ? 'ar' : 'en';
      applyTranslations(current === 'ar' ? 'en' : 'ar');
    });

    themeSwitchBtn.addEventListener('click', () => {
      const current = htmlEl.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
      toggleBackToTop();
      highlightActiveLink();
    }, { passive: true });

    navLinksContainer.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        navLinksContainer.classList.remove('open');
        hamburger.classList.remove('open');
      });
    });

    hamburger.addEventListener('click', () => {
      navLinksContainer.classList.toggle('open');
      hamburger.classList.toggle('open');
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }
      formSuccess.classList.add('show');
      contactForm.reset();
      setTimeout(() => formSuccess.classList.remove('show'), 5000);
    });
  } catch (err) {
    console.error('Portfolio site: error attaching event listeners', err);
  }


  /* =======================================================================
     STEP 5 — RUN INITIAL STATE (everything above is defined by now)
     ======================================================================= */
  try {
    applyTheme(localStorage.getItem('site-theme') || 'dark');
  } catch (err) {
    console.error('Portfolio site: error applying theme', err);
  }

  try {
    applyTranslations(localStorage.getItem('site-lang') || 'en');
  } catch (err) {
    console.error('Portfolio site: error applying translations', err);
  }

  try {
    highlightActiveLink();
  } catch (err) {
    console.error('Portfolio site: error highlighting active link', err);
  }

});
