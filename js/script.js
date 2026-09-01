(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  /* ------------------------------------------------------------------
     Header: scrolled state
  ------------------------------------------------------------------ */
  const header = document.getElementById('siteHeader');
  const onHeaderScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  onHeaderScroll();
  window.addEventListener('scroll', onHeaderScroll, { passive: true });

  /* ------------------------------------------------------------------
     Mobile nav toggle
  ------------------------------------------------------------------ */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

  const closeNav = () => {
    mainNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menu');
  };

  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  /* ------------------------------------------------------------------
     Scroll progress bar (rAF-throttled)
  ------------------------------------------------------------------ */
  const scrollBar = document.getElementById('scrollBar');
  let progressTicking = false;

  const updateProgress = () => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const height = doc.scrollHeight - doc.clientHeight;
    const ratio = height > 0 ? scrollTop / height : 0;
    scrollBar.style.transform = `scaleX(${ratio})`;
    progressTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (!progressTicking) {
      requestAnimationFrame(updateProgress);
      progressTicking = true;
    }
  }, { passive: true });
  updateProgress();

  /* ------------------------------------------------------------------
     Reveal on scroll (IntersectionObserver) + staggered sequences
  ------------------------------------------------------------------ */
  const revealEls = document.querySelectorAll('[data-reveal]');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in-view'));
  } else {
    const groups = new Map(); // parent -> ordered children counter

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const parent = el.parentElement;

        let delay = 0;
        if (parent && (parent.classList.contains('stats-grid') ||
                        parent.classList.contains('rights-grid') ||
                        parent.classList.contains('topics-grid') ||
                        parent.classList.contains('protect-grid'))) {
          const siblings = Array.from(parent.children).filter(c => c.hasAttribute('data-reveal'));
          const index = siblings.indexOf(el);
          delay = Math.min(index, 8) * 80;
        }

        el.style.transitionDelay = `${delay}ms`;
        el.classList.add('in-view');
        revealObserver.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ------------------------------------------------------------------
     Word-by-word reveal for the closing statement
  ------------------------------------------------------------------ */
  const closingText = document.getElementById('closingText');
  if (closingText) {
    const words = closingText.textContent.trim().split(/\s+/);
    closingText.textContent = '';
    closingText.classList.add('word-reveal');

    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'word';
      if (word.toLowerCase().includes('digital')) span.classList.add('is-cyan');
      span.textContent = word;
      span.style.transitionDelay = reduceMotion ? '0ms' : `${i * 60}ms`;
      closingText.appendChild(span);
      closingText.appendChild(document.createTextNode(' '));
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      closingText.classList.add('in-view');
    } else {
      const wordObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            closingText.classList.add('in-view');
            wordObserver.unobserve(closingText);
          }
        });
      }, { threshold: 0.5 });
      wordObserver.observe(closingText);
    }
  }

  /* ------------------------------------------------------------------
     Animated stat counters
  ------------------------------------------------------------------ */
  const statNumbers = document.querySelectorAll('.stat-number[data-count]');

  const animateCount = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reduceMotion) {
      el.textContent = target;
      return;
    }
    const duration = 1100;
    const start = performance.now();

    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    statNumbers.forEach((el) => countObserver.observe(el));
  } else {
    statNumbers.forEach(animateCount);
  }

  /* ------------------------------------------------------------------
     Parallax highlight section (rAF-throttled, desktop-friendly, GPU-only)
  ------------------------------------------------------------------ */
  const highlightSection = document.getElementById('destaque');
  const parallaxEls = document.querySelectorAll('.highlight-shape, .highlight-shield');

  if (highlightSection && parallaxEls.length && !reduceMotion) {
    let parallaxTicking = false;

    const updateParallax = () => {
      const rect = highlightSection.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = 1 - Math.min(Math.max((rect.top) / vh, -1), 1);
      const offset = (progress - 0.5) * 120;

      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.speed) || 0.2;
        el.style.transform = `translate3d(0, ${(-offset * speed).toFixed(2)}px, 0)`;
      });
      parallaxTicking = false;
    };

    window.addEventListener('scroll', () => {
      if (!parallaxTicking) {
        requestAnimationFrame(updateParallax);
        parallaxTicking = true;
      }
    }, { passive: true });
    updateParallax();
  }

  /* ------------------------------------------------------------------
     Protect cards: touch-friendly flip (tap to flip on touch devices)
  ------------------------------------------------------------------ */
  const protectCards = document.querySelectorAll('.protect-card');
  protectCards.forEach((card) => {
    card.addEventListener('click', () => {
      if (!isFinePointer) {
        protectCards.forEach((c) => { if (c !== card) c.classList.remove('is-flipped'); });
        card.classList.toggle('is-flipped');
      }
    });
  });

  /* ------------------------------------------------------------------
     Custom cursor microinteraction (desktop only)
  ------------------------------------------------------------------ */
  if (isFinePointer && !reduceMotion) {
    const dot = document.getElementById('cursorDot');
    let cx = 0, cy = 0;
    let shown = false;

    window.addEventListener('pointermove', (e) => {
      cx = e.clientX;
      cy = e.clientY;
      dot.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      if (!shown) {
        dot.classList.add('is-active');
        shown = true;
      }
    }, { passive: true });

    window.addEventListener('pointerleave', () => dot.classList.remove('is-active'));

    const hoverTargets = document.querySelectorAll('a, button, .protect-card, .topic-card, .right-card');
    hoverTargets.forEach((el) => {
      el.addEventListener('pointerenter', () => dot.classList.add('is-hover'));
      el.addEventListener('pointerleave', () => dot.classList.remove('is-hover'));
    });
  }

  /* ------------------------------------------------------------------
     Nav link active-section highlight (lightweight, no layout thrash)
  ------------------------------------------------------------------ */
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.main-nav a');

  if ('IntersectionObserver' in window && sections.length && navLinks.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = document.querySelector(`.main-nav a[href="#${entry.target.id}"]`);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach((l) => l.removeAttribute('aria-current'));
          link.setAttribute('aria-current', 'true');
        }
      });
    }, { threshold: 0.5 });
    sections.forEach((s) => navObserver.observe(s));
  }
})();