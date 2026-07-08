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
    burger.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
  }

  /* ---------- Page transition curtain ---------- */
  const curtain = document.createElement('div');
  curtain.className = 'curtain';
  document.body.appendChild(curtain);
  document.querySelectorAll('a[href$=".html"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || a.target === '_blank' || reduced || !window.gsap) return;
      e.preventDefault();
      gsap.to(curtain, {
        y: '-101%', duration: 0.6, ease: 'power4.inOut',
        onStart: () => { curtain.style.transform = 'translateY(101%)'; curtain.style.pointerEvents = 'auto'; },
        onComplete: () => { location.href = href; }
      });
    });
  });
  addEventListener('pageshow', () => { curtain.style.pointerEvents = 'none'; curtain.style.transform = 'translateY(101%)'; });

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
