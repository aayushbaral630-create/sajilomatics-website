/* SAJILOMATICS — motion engine (GSAP + Lenis) */
(function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------- Preloader ---------- */
  const pre = document.querySelector('.preloader');
  function killPreloader() {
    if (!pre) return;
    pre.classList.add('done');
    document.body.style.overflow = '';
    setTimeout(() => pre.remove(), 900);
  }
  if (pre) {
    document.body.style.overflow = 'hidden';
    const count = pre.querySelector('.preloader__count');
    const bar = pre.querySelector('.preloader__bar i');
    let p = 0;
    const tick = setInterval(() => {
      p = Math.min(100, p + Math.random() * 16);
      if (count) count.textContent = String(Math.floor(p)).padStart(3, '0');
      if (bar) bar.style.transform = `scaleX(${p / 100})`;
      if (p >= 100) {
        clearInterval(tick);
        setTimeout(killPreloader, 350);
      }
    }, reduced ? 10 : 90);
    // safety: never trap the user
    setTimeout(killPreloader, 4000);
  }

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* ---------- Custom cursor ---------- */
  if (!isTouch && !reduced) {
    const dot = document.createElement('div');
    const ring = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.className = 'cursor-ring';
    document.body.append(dot, ring);
    let mx = -100, my = -100, rx = -100, ry = -100;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a, button, .card, .case').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
    });
  }

  /* ---------- Nav ---------- */
  const nav = document.querySelector('.nav');
  let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 40);
      nav.classList.toggle('is-hidden', y > lastY && y > 300);
    }
    lastY = y;
  }, { passive: true });

  const burger = document.querySelector('.nav__burger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (burger && mobileMenu) {
    const setMenu = open => {
      mobileMenu.classList.toggle('is-open', open);
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      mobileMenu.setAttribute('aria-hidden', !open);
      document.body.classList.toggle('menu-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (lenis) open ? lenis.stop() : lenis.start();
    };
    burger.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('is-open')));
    mobileMenu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    addEventListener('resize', () => { if (innerWidth > 760) setMenu(false); });
    const page = location.pathname.split('/').pop() || 'index.html';
    mobileMenu.querySelectorAll('.mobile-menu__links a').forEach(a => {
      if (a.getAttribute('href') === page) a.classList.add('is-active');
    });
  }

  /* ---------- GSAP scroll choreography ---------- */
  if (window.gsap && window.ScrollTrigger && !reduced) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) lenis.on('scroll', ScrollTrigger.update);

    // hero line reveals (fire on load, after preloader)
    const heroLines = document.querySelectorAll('.reveal-line > span');
    if (heroLines.length) {
      gsap.to(heroLines, {
        y: 0, duration: 1.3, ease: 'power4.out', stagger: 0.14,
        delay: pre ? 1.5 : 0.2
      });
    }
    addEventListener('load', () => ScrollTrigger.refresh());

    // split headings into line reveals
    document.querySelectorAll('[data-split]').forEach(el => {
      const text = el.textContent.trim();
      const words = text.split(/\s+/);
      el.innerHTML = '';
      // group words into lines after layout by wrapping each word
      const spans = words.map(w => {
        const s = document.createElement('span');
        s.textContent = w;
        s.style.display = 'inline-block';
        el.appendChild(s);
        el.appendChild(document.createTextNode(' '));
        return s;
      });
      gsap.set(spans, { yPercent: 120, opacity: 0 });
      gsap.to(spans, {
        yPercent: 0, opacity: 1, duration: 1.1, ease: 'power4.out',
        stagger: 0.045,
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    // generic fades
    gsap.utils.toArray('[data-fade]').forEach((el, i) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        delay: (el.dataset.delay || 0) * 1,
        scrollTrigger: { trigger: el, start: 'top 90%' }
      });
    });

    // stagger groups
    gsap.utils.toArray('[data-stagger]').forEach(group => {
      const items = group.children;
      gsap.set(items, { opacity: 0, y: 46 });
      gsap.to(items, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12,
        scrollTrigger: { trigger: group, start: 'top 85%' }
      });
    });

    // counters
    gsap.utils.toArray('[data-count]').forEach(el => {
      const end = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const obj = { v: 0 };
      gsap.to(obj, {
        v: end, duration: 2, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
        onUpdate: () => {
          el.textContent = (end % 1 ? obj.v.toFixed(1) : Math.round(obj.v)) + suffix;
        }
      });
    });

    // parallax accents
    gsap.utils.toArray('[data-parallax]').forEach(el => {
      gsap.to(el, {
        yPercent: parseFloat(el.dataset.parallax) || -12,
        ease: 'none',
        scrollTrigger: { trigger: el, scrub: 1.2 }
      });
    });
  } else {
    // reduced motion / no GSAP: show everything
    document.querySelectorAll('[data-fade]').forEach(el => {
      el.style.opacity = 1; el.style.transform = 'none';
    });
    document.querySelectorAll('.reveal-line > span').forEach(el => {
      el.style.transform = 'none';
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (!isTouch && !reduced && window.gsap) {
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, {
          x: (e.clientX - r.left - r.width / 2) * 0.25,
          y: (e.clientY - r.top - r.height / 2) * 0.35,
          duration: 0.4, ease: 'power2.out'
        });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,0.4)' });
      });
    });
  }

  /* ---------- Card glow follows mouse ---------- */
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });

  /* ---------- Active nav link ---------- */
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a').forEach(a => {
    if (a.getAttribute('href') === here) a.classList.add('is-active');
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();

/* ============ UPGRADE PASS ============ */
(function () {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;

  /* scroll progress bar */
  const bar = document.createElement('div');
  bar.className = 'progress'; bar.innerHTML = '<i></i>';
  document.body.appendChild(bar);
  const fill = bar.firstElementChild;
  addEventListener('scroll', () => {
    const h = document.documentElement;
    fill.style.transform = 'scaleX(' + (h.scrollTop / ((h.scrollHeight - h.clientHeight) || 1)) + ')';
  }, { passive: true });

  /* 3D tilt on case visuals & post thumbnails */
  if (!isTouch && !reduced && window.gsap) {
    document.querySelectorAll('.case__visual, .post-card .thumb').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          rotateY: ((e.clientX - r.left) / r.width - .5) * 10,
          rotateX: (.5 - (e.clientY - r.top) / r.height) * 10,
          transformPerspective: 900, duration: .5, ease: 'power2.out'
        });
      });
      el.addEventListener('mouseleave', () =>
        gsap.to(el, { rotateX: 0, rotateY: 0, duration: .9, ease: 'elastic.out(1,0.5)' }));
    });
  }

  /* FAQ accordion */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q'), a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      a.style.maxHeight = open ? a.scrollHeight + 'px' : '0px';
      q.setAttribute('aria-expanded', open);
    });
  });

  /* living case visuals: chart draws itself, bars fill on scroll */
  if (window.gsap && window.ScrollTrigger && !reduced) {
    document.querySelectorAll('.cv-draw').forEach(p => {
      const L = p.getTotalLength();
      p.style.strokeDasharray = L;
      p.style.strokeDashoffset = L;
      gsap.to(p, {
        strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut',
        scrollTrigger: { trigger: p.closest('.case__visual'), start: 'top 82%' }
      });
    });
    document.querySelectorAll('.cv-bar').forEach(b => {
      gsap.fromTo(b, { scaleX: 0 }, {
        scaleX: 1, duration: 1.4, ease: 'power3.out',
        scrollTrigger: { trigger: b.closest('.case__visual'), start: 'top 82%' }
      });
    });
  }
})();

/* ============ COOKIE CONSENT ============ */
(function () {
  'use strict';
  const KEY = 'sjm_consent'; // 'all' | 'essential'
  const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const set = v => { try { localStorage.setItem(KEY, v); } catch (e) {} };

  /* Calendly loads only with consent */
  function loadCalendly() {
    const shell = document.getElementById('booking');
    if (!shell || shell.dataset.loaded) return;
    shell.dataset.loaded = '1';
    shell.classList.add('is-loaded');
    shell.innerHTML = '<div class="calendly-inline-widget" data-url="' + shell.dataset.calendly +
      '" style="min-width:320px;height:680px;width:100%"></div>';
    const s = document.createElement('script');
    s.src = 'https://assets.calendly.com/assets/external/widget.js';
    s.async = true;
    document.body.appendChild(s);
  }

  /* banner */
  const bar = document.createElement('div');
  bar.className = 'consent';
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-live', 'polite');
  bar.setAttribute('aria-label', 'Cookie preferences');
  bar.innerHTML =
    '<p><b>Cookies, kept minimal.</b> Our analytics are cookie-free. The only cookies come from the ' +
    'optional Calendly booking calendar. <a href="privacy.html">Learn more</a></p>' +
    '<div class="consent__btns">' +
    '<button type="button" class="consent__btn" data-consent-essential>Essential only</button>' +
    '<button type="button" class="consent__btn consent__btn--yes" data-consent-accept>Accept all</button>' +
    '</div>';
  document.body.appendChild(bar);

  const show = () => { bar.classList.add('is-open'); };
  const hide = () => { bar.classList.remove('is-open'); };

  function accept() { set('all'); hide(); loadCalendly(); }
  function essential() { set('essential'); hide(); }

  document.addEventListener('click', e => {
    if (e.target.closest('[data-consent-accept]')) accept();
    else if (e.target.closest('[data-consent-essential]')) essential();
    else if (e.target.closest('[data-cookie-settings]')) show();
  });

  const choice = get();
  if (choice === 'all') loadCalendly();
  if (!choice) setTimeout(show, 1600); // after the preloader
})();
