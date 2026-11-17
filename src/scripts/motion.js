// All site motion, inlined at the end of <body>. Ported from the canvas artboards.
// Scroll-driven effects only run on wide, normal-height windows without reduced motion;
// everywhere else the pages stay a plain static layout.
(() => {
  const R = document.getElementById('top');
  if (!R) return;
  const W = window, D = document;
  const all = (s) => [...R.querySelectorAll(s)];
  const reduce = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = W.matchMedia('(hover: hover)').matches;

  // Menu: the burger opens a full-screen panel; links, Escape and the burger close it.
  const burger = R.querySelector('.burger'), menu = R.querySelector('.menu');
  let open = false;
  const setMenu = (v, focus) => {
    open = v;
    burger.classList.toggle('open', v);
    menu.classList.toggle('open', v);
    burger.setAttribute('aria-expanded', String(v));
    burger.querySelector('.mono').textContent = v ? 'Close' : 'Menu';
    if (focus) (v ? menu.querySelector('a') : burger).focus({ preventScroll: true });
  };
  if (burger && menu) {
    burger.addEventListener('click', () => setMenu(!open, false));
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false, false)));
    D.addEventListener('keydown', (e) => { if (open && e.key === 'Escape') setMenu(false, true); });
  }

  // Live Jakarta time in the footer.
  const clock = R.querySelector('.m-clock');
  if (clock) {
    const tick = () => {
      clock.textContent = new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Jakarta', hour: 'numeric', minute: '2-digit', second: '2-digit',
      }) + ', ';
    };
    tick();
    setInterval(tick, 1000);
  }

  const hero = R.querySelector('.h2'), stick = R.querySelector('.h2-stick');
  const name = R.querySelector('.wm'), dots = all('.h2 .dot');
  const stack = R.querySelector('.stk'), counter = R.querySelector('.stk-n');
  const cards = all('.wk-card'), stories = all('.wk-story');
  const cover = R.querySelector('.cs-cover-in');
  let pin = false, fade = false;
  const setMode = () => {
    pin = !reduce && W.innerWidth >= 760 && W.innerHeight <= 1400;
    R.classList.toggle('pin', pin);
    // Home only: one section per screen and section colours, on any width.
    fade = !!hero && !reduce && W.innerHeight <= 1400;
    R.classList.toggle('fold', fade);
    R.style.setProperty('--vh', W.innerHeight + 'px');
  };
  const progress = (el) => {
    const r = el.getBoundingClientRect(), len = r.height - W.innerHeight;
    return len > 0 ? Math.min(1, Math.max(0, -r.top / len)) : 0;
  };
  let shown = -1;

  const home = () => {
    if (!pin) {
      ['--p', '--s', '--sp', '--dk'].forEach((k) => hero.style.removeProperty(k));
      dots.forEach((d) => { d.style.transform = ''; });
      cards.forEach((c) => { c.style.transform = ''; c.style.opacity = ''; c.style.zIndex = ''; });
      stories.forEach((s) => s.classList.remove('on'));
      shown = -1;
      return;
    }
    // Hero: the name zooms toward the viewer, the squares fly out with it,
    // and the page fades to charcoal so it hands straight over to the work section.
    const p = progress(hero);
    const sc = 1 + 3.4 * Math.pow(p, 1.6);
    const u = Math.min(1, p / 0.42);
    hero.style.setProperty('--sp', (1.15 * u * u * (3 - 2 * u)).toFixed(3));
    const t = Math.min(1, Math.max(0, (p - 0.25) / 0.32));
    hero.style.setProperty('--p', p.toFixed(3));
    hero.style.setProperty('--s', sc.toFixed(4));
    hero.style.setProperty('--dk', (t * t * (3 - 2 * t)).toFixed(3));
    const ox = name.offsetLeft + name.offsetWidth / 2, oy = name.offsetTop + name.offsetHeight * 0.55;
    dots.forEach((d) => {
      const x = d.offsetLeft + 5 - ox, y = d.offsetTop + 5 - oy;
      d.style.transform = 'translate(' + (x * (sc - 1)).toFixed(1) + 'px,' + (y * (sc - 1)).toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')';
    });
    // Work: one project at a time. The next card waits behind, the done card flies off.
    const n = cards.length, h = W.innerHeight, w = W.innerWidth;
    const at = Math.min(n - 1, Math.max(0, progress(stack) * (n - 0.4) - 0.3));
    cards.forEach((c, i) => {
      const d = i - at;
      if (d >= 0) {
        const q = Math.min(d, 2);
        c.style.transform = 'translate3d(0,' + (q * h * 0.06).toFixed(1) + 'px,0) scale(' + (1 - q * 0.12).toFixed(3) + ')';
        c.style.opacity = d > 1.6 ? '0' : (1 - q * 0.45).toFixed(3);
        c.style.zIndex = String(100 - i);
      } else {
        const q = -d;
        c.style.transform = 'translate3d(' + (-q * w * 0.22).toFixed(1) + 'px,' + (-q * h * 0.95).toFixed(1) + 'px,0) rotate(' + (-q * 12).toFixed(2) + 'deg) skewY(' + (-q * 5).toFixed(2) + 'deg)';
        c.style.opacity = '1';
        c.style.zIndex = String(200 + i);
      }
    });
    const now = Math.round(at);
    if (now !== shown) {
      stories.forEach((st, i) => st.classList.toggle('on', i === now));
      counter.textContent = '{0' + (now + 1) + '—0' + n + '}';
      shown = now;
    }
  };

  const page = () => {
    if (!pin) return;
    // Reading progress along the top.
    const S = D.scrollingElement, max = S.scrollHeight - S.clientHeight;
    R.style.setProperty('--rd', (max > 0 ? Math.min(1, S.scrollTop / max) : 0).toFixed(4));
    if (!cover) return;
    // The cover grows from 90% to the full width while its top travels up the screen.
    const r = cover.getBoundingClientRect(), h = W.innerHeight;
    const t = Math.min(1, Math.max(0, (h - r.top) / (h * 0.9)));
    R.style.setProperty('--cv', (0.9 + 0.1 * t * t * (3 - 2 * t)).toFixed(4));
  };

  // Section colours on home. One fixed backdrop holds the colour of whichever section has
  // reached the middle of the screen and eases to the next; type follows through
  // --ink, --ink2, --line and --hl. With reduced motion every section keeps its own colour.
  const fx = R.querySelector('.bgfx'), BS = D.body.style;
  // The work stack keeps its own charcoal: if it went transparent, a fast scroll would show
  // the backdrop still fading from grey behind the cards.
  const clear = [R.querySelector('.more'), R.querySelector('.how'), R.querySelector('.ft')];
  const PAL = [['#D2D5D8', '#0E0F11', '#4A4E53', '#0E0F11'], ['#16181B', '#E6E8EA', '#9DA2A8', '#34373C'], ['var(--acc)', '#0E0F11', '#2B2E32', '#0E0F11'], ['#0E0F11', '#E6E8EA', '#9DA2A8', '#34373C']];
  const zones = [[hero, 0], [stack, 1], [clear[0], 1], [R.querySelector('.focus'), 0], [clear[1], 2], [clear[2], 3]].filter(([el]) => el);
  let zone = -1;
  const tone = () => {
    if (!fx) return;
    if (!fade) {
      if (zone !== -1) {
        fx.style.display = '';
        clear.forEach((el) => el.style.removeProperty('background'));
        ['--ink', '--ink2', '--line', '--hl'].forEach((k) => BS.removeProperty(k));
        zone = -1;
      }
      return;
    }
    if (zone === -1) { fx.style.display = 'block'; clear.forEach((el) => { el.style.background = 'transparent'; }); }
    const S = D.scrollingElement, line = W.innerHeight * 0.5;
    let k = 0;
    zones.forEach(([el, c]) => { if (el.getBoundingClientRect().top <= line) k = c; });
    if (S.scrollTop + S.clientHeight >= S.scrollHeight - 2) k = 3;
    if (k === zone) return;
    zone = k;
    fx.style.backgroundColor = PAL[k][0];
    BS.setProperty('--ink', PAL[k][1]);
    BS.setProperty('--ink2', PAL[k][2]);
    BS.setProperty('--line', PAL[k][3]);
    if (k === 2) BS.setProperty('--hl', '#0E0F11'); else BS.removeProperty('--hl');
  };

  const update = hero && stack ? home : page;
  setMode();
  update();
  tone();
  W.addEventListener('resize', () => { setMode(); update(); tone(); });
  W.addEventListener('scroll', () => { update(); tone(); }, { passive: true });

  // Smooth wheel scrolling in scroll-driven mode. Touch, keyboard and scrollbar stay native.
  {
    const S = D.scrollingElement;
    let cur = S.scrollTop, goal = cur, time = 0, moving = 0;
    const glide = (t) => {
      const dt = Math.min((t - time) / 1000, 0.05);
      time = t;
      cur += (goal - cur) * (1 - Math.exp(-6.9 * dt));
      if (Math.abs(goal - cur) < 0.5) cur = goal;
      W.scrollTo({ top: cur, behavior: 'instant' });
      moving = cur === goal ? 0 : requestAnimationFrame(glide);
    };
    W.addEventListener('wheel', (ev) => {
      const max = S.scrollHeight - S.clientHeight;
      if (!pin || open || max <= 0 || ev.ctrlKey || ev.shiftKey || Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) return;
      ev.preventDefault();
      if (!moving) { cur = goal = S.scrollTop; time = performance.now(); }
      const unit = ev.deltaMode === 1 ? 40 : ev.deltaMode === 2 ? S.clientHeight : 1;
      goal = Math.max(0, Math.min(max, goal + ev.deltaY * unit));
      if (!moving) moving = requestAnimationFrame(glide);
    }, { passive: false });
    D.querySelectorAll('a[href*="#"]').forEach((a) => a.addEventListener('click', () => { cancelAnimationFrame(moving); moving = 0; }));
  }

  // Hero squares drift with the cursor, each at its own depth.
  if (stick && dots.length && fine && !reduce) {
    const depth = [0.9, 0.5, 0.7, 1, 0.6, 0.8];
    let tx = 0, ty = 0, cx = 0, cy = 0, last = 0, raf = 0;
    const drift = (t) => {
      const q = 1 - Math.exp(-5 * Math.min((t - last) / 1000, 0.05));
      last = t;
      cx += (tx - cx) * q;
      cy += (ty - cy) * q;
      dots.forEach((d, i) => { const z = depth[i % depth.length]; d.style.translate = (cx * z).toFixed(2) + 'px ' + (cy * z).toFixed(2) + 'px'; });
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.05 ? requestAnimationFrame(drift) : 0;
    };
    const aim = (x, y) => { tx = x; ty = y; if (!raf) { last = performance.now(); raf = requestAnimationFrame(drift); } };
    stick.addEventListener('pointermove', (ev) => {
      const r = stick.getBoundingClientRect();
      aim(((ev.clientX - r.left) / r.width - 0.5) * 96, ((ev.clientY - r.top) / r.height - 0.5) * 64);
    });
    stick.addEventListener('pointerleave', () => aim(0, 0));
  }

  // Annotated screens: hovering a note lights up its part of the screen.
  all('.ann').forEach((box) => {
    const list = box.querySelector('.ann-list');
    if (!list) return;
    const items = [...list.querySelectorAll('div')], parts = [...box.querySelectorAll('.ann-box')];
    const light = (i) => {
      box.classList.toggle('hot', i >= 0);
      items.forEach((x, j) => x.classList.toggle('on', j === i));
      parts.forEach((x, j) => x.classList.toggle('on', j === i));
    };
    items.forEach((it, i) => it.addEventListener('pointerenter', () => light(i)));
    list.addEventListener('pointerleave', () => light(-1));
  });

  // Reveal on scroll.
  if (!reduce && 'IntersectionObserver' in W) {
    R.classList.add('js');
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { threshold: 0.12 });
    all('.rv').forEach((el) => io.observe(el));
  }
})();
