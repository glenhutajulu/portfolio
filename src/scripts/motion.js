// All site motion, inlined at the end of <body> so nothing flashes before it runs.
// Values were measured from the reference site. Text and images are picked by rule,
// so new content animates without extra classes. Nothing is hidden until this runs,
// and reduced-motion users get no entrances or smooth scrolling.
(() => {
  const root = document.getElementById('top');
  if (!root) return;
  const all = (selector) => [...root.querySelectorAll(selector)];

  // Live Jakarta time in the footer.
  const clock = root.querySelector('.m-clock');
  if (clock) {
    const tick = () => {
      clock.textContent = new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Jakarta', hour: 'numeric', minute: '2-digit', second: '2-digit',
      }) + ', ';
    };
    tick();
    setInterval(tick, 1000);
  }

  // Fixed header: hides on scroll down, returns on scroll up.
  const header = root.querySelector('.m-hd');
  if (header) {
    const fit = () => document.documentElement.style.setProperty('--hd', header.offsetHeight + 'px');
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle('m-sc', y > 8);
      header.classList.toggle('grain', y > 8);
      if (Math.abs(y - last) > 4) {
        header.classList.toggle('m-up', y > last && y > 120);
        last = y;
      }
    };
    fit();
    onScroll();
    window.addEventListener('resize', fit);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // "Case study" label that follows the cursor over work cards.
  const pill = root.querySelector('.m-pill');
  if (pill && window.matchMedia('(hover: hover)').matches) {
    let x = 0, y = 0, px = 0, py = 0, raf = 0;
    const loop = () => {
      px += (x - px) * 0.18;
      py += (y - py) * 0.18;
      pill.style.transform = `translate(${px}px,${py}px) translate(-50%,-50%)`;
      raf = pill.classList.contains('on') || Math.abs(x - px) > 0.5 ? requestAnimationFrame(loop) : 0;
    };
    all('article > a').forEach((link) => {
      link.addEventListener('pointerenter', (e) => {
        x = e.clientX;
        y = e.clientY;
        if (!raf) {
          px = x;
          py = y;
          raf = requestAnimationFrame(loop);
        }
        pill.classList.add('on');
      });
      link.addEventListener('pointermove', (e) => {
        x = e.clientX;
        y = e.clientY;
      });
      link.addEventListener('pointerleave', () => pill.classList.remove('on'));
    });
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  // Smooth wheel scrolling, matched to the reference (Lenis, about 0.11 per frame at 60fps).
  // Touch, keyboard and scrollbar stay native. A page with no room to scroll is left alone.
  const scroller = document.scrollingElement;
  let current = scroller.scrollTop, goal = current, time = 0, moving = 0;
  const glide = (now) => {
    const dt = Math.min((now - time) / 1000, 0.05);
    time = now;
    current += (goal - current) * (1 - Math.exp(-6.9 * dt));
    if (Math.abs(goal - current) < 0.5) current = goal;
    window.scrollTo({ top: current, behavior: 'instant' });
    moving = current === goal ? 0 : requestAnimationFrame(glide);
  };
  window.addEventListener('wheel', (e) => {
    const max = scroller.scrollHeight - scroller.clientHeight;
    if (max <= 0 || e.ctrlKey || e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    if (!moving) {
      current = goal = scroller.scrollTop;
      time = performance.now();
    }
    const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? scroller.clientHeight : 1;
    goal = Math.max(0, Math.min(max, goal + e.deltaY * unit));
    if (!moving) moving = requestAnimationFrame(glide);
  }, { passive: false });
  all('a[href^="#"]').forEach((link) => link.addEventListener('click', () => {
    cancelAnimationFrame(moving);
    moving = 0;
  }));

  // Entrances. Kinds: l lines, b block, c card, p portrait, r row from the right,
  // f from the left, s step card, q quick rise, z hero block. A set delay plays on open.
  const list = [];
  const add = (el, kind, delay) => {
    if (!el || el === root || el.closest('.m-hd') || list.some((i) => i.el === el || i.el.contains(el))) return;
    el.classList.add('m-h', 'm-' + kind);
    list.push({ el, kind, delay });
  };

  const hero = root.querySelector('.hero');
  if (hero) {
    const title = hero.querySelector('h1');
    const side = hero.querySelector('.hero-side');
    const tag = side.previousElementSibling;
    hero.querySelector('.hero-bg').classList.add('m-bg');
    hero.querySelectorAll('.dot').forEach((dot) => dot.classList.add('m-dot'));
    add(title.previousElementSibling, 'l', 0.65);
    add(title, 'l', 0.85);
    hero.querySelectorAll('.chip').forEach((chip, i) => add(chip, 'q', 0.9 + i * 0.1));
    add(tag.children[0], 'l', 1.55);
    add(tag.children[1], 'q', 1.95);
    add(side, 'z', 1.1);
  }
  all('div.grain, dl > div').forEach((el) => add(el, 's'));
  all('#work article, figure, .ann-wrap').forEach((el) => add(el, 'c'));
  all('a.row').forEach((el) => add(el, 'r'));
  all('img:not(.hero-bg)').forEach((el) => add(el, 'p'));
  all('footer h2').forEach((el) => add(el, 'l'));
  all('footer > div:nth-of-type(1) > a').forEach((el) => add(el, 'f'));
  all('footer a, footer > div:last-child > *').forEach((el) => add(el, 'q'));
  all('h1, h2').forEach((el) => add(el, 'l'));
  all('h3, p, li').forEach((el) => add(el, 'b'));

  const finish = (el, kind) => {
    el.classList.remove('m-h', 'm-go', 'm-' + kind);
    el.style.removeProperty('--d');
  };

  // Rises text line by line, then restores the original text so it can reflow.
  const splitLines = (el, delay, kind) => {
    if (el.children.length || !el.textContent.trim()) return false;
    const saved = [...el.childNodes];
    const words = el.textContent.trim().split(/\s+/).map((word) => {
      const span = document.createElement('span');
      span.textContent = word;
      return span;
    });
    el.replaceChildren();
    words.forEach((span, i) => {
      if (i) el.append(' ');
      el.append(span);
    });
    const lines = [];
    let top = null;
    words.forEach((span) => {
      if (span.offsetTop !== top) {
        top = span.offsetTop;
        lines.push([]);
      }
      lines[lines.length - 1].push(span.textContent);
    });
    const spans = lines.map((line, i) => {
      const span = document.createElement('span');
      span.className = 'm-ln';
      span.textContent = line.join(' ');
      span.style.setProperty('--d', delay + i * 0.1 + 's');
      return span;
    });
    el.replaceChildren(...spans);
    el.classList.remove('m-h', 'm-' + kind);
    spans[spans.length - 1].addEventListener('animationend', () => el.replaceChildren(...saved), { once: true });
    return true;
  };

  const play = (item, delay, asLines) => {
    if ((item.kind === 'l' || asLines) && splitLines(item.el, delay, item.kind)) return;
    item.el.style.setProperty('--d', delay + 's');
    item.el.classList.add('m-go');
    item.el.addEventListener('animationend', () => finish(item.el, item.kind), { once: true });
  };

  const stagger = (item) => {
    if (item.kind === 's') return item.el.parentNode.children.length <= 3 ? 0.3 : 0.08;
    return item.kind === 'c' || item.kind === 'r' || item.kind === 'q' ? 0.1 : 0;
  };

  const run = () => {
    const later = list.filter((item) => {
      if (item.delay === undefined) return true;
      play(item, item.delay, false);
      return false;
    });
    const byEl = new Map(later.map((item) => [item.el, item]));
    // The first callback reports what is on screen at open; everything else waits for its turn.
    let first = true;
    const observer = new IntersectionObserver((entries) => {
      const counts = new Map();
      entries.forEach((entry) => {
        if (!entry.isIntersecting || (entry.intersectionRatio < 0.1 && entry.intersectionRect.height < 240)) return;
        const item = byEl.get(entry.target);
        const parent = item.el.parentNode;
        const count = counts.get(parent) || 0;
        counts.set(parent, count + 1);
        observer.unobserve(item.el);
        play(item, (first ? 0.25 : 0) + count * stagger(item), first && item.kind === 'b');
      });
      first = false;
    }, { threshold: [0.02, 0.1] });
    later.forEach((item) => observer.observe(item.el));
  };

  // Lines are measured after the fonts land, or after 900ms at the latest.
  const fonts = document.fonts
    ? Promise.all([document.fonts.load('500 40px "Geist Variable"'), document.fonts.load('20px "Newsreader Variable"')])
    : Promise.resolve();
  Promise.race([fonts, new Promise((resolve) => setTimeout(resolve, 900))]).then(run, run);
})();
