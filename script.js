/* Finora landing page. All figures are illustrative sample data. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

  const MONTHS = [
    { label: 'May', long: 'May', value: 32000 },
    { label: 'Jun', long: 'June', value: 38000 },
    { label: 'Jul', long: 'July', value: 35000 },
    { label: 'Aug', long: 'August', value: 42000 },
    { label: 'Sep', long: 'September', value: 45000 },
    { label: 'Oct', long: 'October', value: 48290 },
  ];
  const CATEGORIES = [
    { name: 'Software & Tools', value: 12500, color: 'var(--c1)' },
    { name: 'Marketing', value: 10200, color: 'var(--c2)' },
    { name: 'Operations', value: 9400, color: 'var(--c3)' },
    { name: 'Travel', value: 6800, color: 'var(--c4)' },
    { name: 'Office Supplies', value: 4390, color: 'var(--c5)' },
    { name: 'Other', value: 5000, color: 'var(--c6)' },
  ];
  const TOTAL = CATEGORIES.reduce((sum, c) => sum + c.value, 0);

  /* Run a callback once when an element scrolls into view */
  function onceVisible(el, cb, threshold = 0.2) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { io.disconnect(); cb(el); }
      });
    }, { threshold, rootMargin: '0px 0px -6% 0px' });
    io.observe(el);
  }

  /* ---------- Navigation ---------- */
  function initNav() {
    const nav = $('#nav');
    const toggle = $('.nav__toggle');
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    const syncStuck = () => nav.classList.toggle('is-stuck', scrollY > 8);
    addEventListener('scroll', syncStuck, { passive: true });
    syncStuck();
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    addEventListener('resize', () => { if (innerWidth > 1024) setOpen(false); });
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target)) setOpen(false);
    });

    // Smooth anchor scrolling, shared by every in-page link
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const target = $(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      setOpen(false);
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      history.pushState(null, '', link.getAttribute('href'));
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    $$('[data-stagger]').forEach((group) => {
      $$('.reveal', group).forEach((el, i) => el.style.setProperty('--d', `${i * 90}ms`));
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    $$('.reveal').forEach((el) => io.observe(el));
  }

  /* Pause decorative loops while off screen */
  function initPlayGates() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle('is-playing', e.isIntersecting));
    });
    $$('[data-play]').forEach((el) => io.observe(el));
  }

  /* ---------- Counters and bars ---------- */
  function animateCount(el) {
    const end = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const format = (n) => prefix + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    if (reducedMotion) { el.textContent = format(end); return; }
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      el.textContent = format(end * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function initCounters() {
    $$('[data-counters]').forEach((group) => {
      onceVisible(group, () => $$('[data-count]', group).forEach(animateCount), 0.25);
    });
    $$('[data-bars]').forEach((group) => {
      onceVisible(group, () => group.classList.add('is-on'), 0.25);
    });
  }

  /* ---------- Shared chart tooltip ---------- */
  const tip = $('#chartTip');
  function showTip(html, x, y) {
    tip.innerHTML = html;
    tip.classList.add('is-on');
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const left = Math.max(8, Math.min(innerWidth - w - 8, x - w / 2));
    const top = y - h - 12 < 8 ? y + 16 : y - h - 12;
    tip.style.transform = `translate(${left}px, ${top}px)`;
  }
  const hideTip = () => tip.classList.remove('is-on');
  addEventListener('scroll', hideTip, { passive: true });

  /* ---------- Hero bar chart ---------- */
  function initHeroBars() {
    const chart = $('#heroBars');
    const bars = $('.barchart__bars', chart);
    const MAX = 60000;
    MONTHS.forEach((m, i) => {
      const isNow = i === MONTHS.length - 1;
      const col = document.createElement('div');
      col.className = `bcol${isNow ? ' is-now' : ''}`;
      col.style.setProperty('--h', `${(m.value / MAX) * 100}%`);
      col.style.setProperty('--i', i);
      col.innerHTML = `<div class="bcol__plot"><div class="bcol__bar"></div>${isNow ? `<span class="bcol__val">${money(m.value)}</span>` : ''}</div><span class="bcol__label">${m.label}</span>`;
      col.addEventListener('pointermove', (e) => showTip(`${m.long} <b>${money(m.value)}</b>`, e.clientX, e.clientY));
      col.addEventListener('pointerleave', hideTip);
      bars.append(col);
    });
    requestAnimationFrame(() => chart.classList.add('is-on'));
  }

  /* ---------- Donut chart ---------- */
  function initDonut() {
    const host = $('#donut');
    const legend = $('#donutLegend');
    const NS = 'http://www.w3.org/2000/svg';
    const R = 64;
    const C = 2 * Math.PI * R;
    const GAP = 2; // surface gap between segments

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 160 160');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Spending distribution: ' + CATEGORIES.map((c) => `${c.name} ${money(c.value)}`).join(', '));
    host.append(svg);

    const center = document.createElement('div');
    center.className = 'donut__center';
    host.append(center);
    const setCenter = (value, label) => { center.innerHTML = `<b>${value}</b><small>${label}</small>`; };
    setCenter(money(TOTAL), 'Total spend');

    let offset = 0;
    const segments = CATEGORIES.map((cat, i) => {
      const len = (cat.value / TOTAL) * C;
      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('cx', 80);
      circle.setAttribute('cy', 80);
      circle.setAttribute('r', R);
      circle.style.stroke = cat.color;
      circle.setAttribute('transform', `rotate(${(offset / C) * 360} 80 80)`);
      const visible = len - GAP;
      circle.style.strokeDasharray = `${visible} ${C}`;
      circle.style.strokeDashoffset = reducedMotion ? 0 : visible;
      circle.style.transitionDelay = `${i * 130}ms, 0s, 0s`;
      svg.append(circle);
      offset += len;

      const row = document.createElement('li');
      row.innerHTML = `<i class="sw" style="background:${cat.color}"></i><span>${cat.name}</span><span class="num">${money(cat.value)}</span>`;
      legend.append(row);

      const on = () => {
        host.classList.add('is-hovering');
        circle.classList.add('is-hover');
        row.classList.add('is-hover');
        setCenter(money(cat.value), `${cat.name} · ${Math.round((cat.value / TOTAL) * 100)}%`);
      };
      const off = () => {
        host.classList.remove('is-hovering');
        circle.classList.remove('is-hover');
        row.classList.remove('is-hover');
        setCenter(money(TOTAL), 'Total spend');
      };
      [circle, row].forEach((el) => {
        el.addEventListener('pointerenter', on);
        el.addEventListener('pointerleave', off);
      });
      return circle;
    });

    if (!reducedMotion) {
      onceVisible(host, () => segments.forEach((s) => { s.style.strokeDashoffset = 0; }), 0.35);
    }
  }

  /* ---------- Trend line chart ---------- */
  function initTrend() {
    const host = $('#trend');
    const NS = 'http://www.w3.org/2000/svg';
    const pad = { t: 22, r: 18, b: 24, l: 38 };
    const TICKS = [0, 20000, 40000, 60000];
    let drawn = false;

    const el = (name, attrs = {}, parent) => {
      const node = document.createElementNS(NS, name);
      Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
      if (parent) parent.append(node);
      return node;
    };

    function draw(animate) {
      const W = host.clientWidth;
      const H = host.clientHeight;
      if (!W) return;
      host.innerHTML = '';
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true' }, host);
      const defs = el('defs', {}, svg);
      const grad = el('linearGradient', { id: 'trendFill', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      el('stop', { offset: 0, style: 'stop-color:var(--color-blue);stop-opacity:.2' }, grad);
      el('stop', { offset: 1, style: 'stop-color:var(--color-blue);stop-opacity:0' }, grad);

      const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / (MONTHS.length - 1);
      const y = (v) => H - pad.b - (v / 60000) * (H - pad.t - pad.b);

      TICKS.forEach((t) => {
        el('line', { class: 'trend__grid', x1: pad.l, x2: W - pad.r, y1: y(t), y2: y(t) }, svg);
        el('text', { class: 'trend__axis', x: 0, y: y(t) + 4 }, svg).textContent = t ? `$${t / 1000}k` : '$0';
      });
      MONTHS.forEach((m, i) => {
        const label = el('text', { class: 'trend__axis', x: x(i), y: H - 4, 'text-anchor': i === MONTHS.length - 1 ? 'end' : i === 0 ? 'start' : 'middle' }, svg);
        label.textContent = m.label;
      });

      const points = MONTHS.map((m, i) => [x(i), y(m.value)]);
      const d = points.map(([px, py], i) => `${i ? 'L' : 'M'}${px} ${py}`).join(' ');
      const area = el('path', { class: 'trend__area', d: `${d} L${x(MONTHS.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`, fill: 'url(#trendFill)' }, svg);
      const line = el('path', { class: 'trend__line', d, pathLength: 1 }, svg);
      const last = points[points.length - 1];
      const endDot = el('circle', { class: 'trend__dot', cx: last[0], cy: last[1], r: 5 }, svg);
      const endLabel = el('text', { class: 'trend__last', x: last[0], y: last[1] - 12, 'text-anchor': 'end' }, svg);
      endLabel.textContent = money(MONTHS[MONTHS.length - 1].value);

      if (animate && !reducedMotion) {
        line.style.strokeDasharray = 1;
        line.style.strokeDashoffset = 1;
        area.style.opacity = 0;
        endDot.style.opacity = 0;
        endLabel.style.opacity = 0;
        onceVisible(host, () => {
          drawn = true;
          line.style.strokeDashoffset = 0;
          area.style.opacity = 1;
          setTimeout(() => { endDot.style.opacity = 1; endLabel.style.opacity = 1; }, 1300);
        }, 0.35);
      }

      // Hover layer: crosshair, marker and tooltip on the nearest month
      const cross = el('line', { class: 'trend__cross', y1: pad.t, y2: y(0), visibility: 'hidden' }, svg);
      const dot = el('circle', { class: 'trend__dot', r: 5, visibility: 'hidden' }, svg);
      svg.style.cursor = 'crosshair';
      svg.addEventListener('pointermove', (e) => {
        const rect = svg.getBoundingClientRect();
        const px = e.clientX - rect.left;
        let idx = 0;
        points.forEach((p, i) => { if (Math.abs(p[0] - px) < Math.abs(points[idx][0] - px)) idx = i; });
        const [cx, cy] = points[idx];
        cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.setAttribute('visibility', 'visible');
        dot.setAttribute('cx', cx); dot.setAttribute('cy', cy); dot.setAttribute('visibility', 'visible');
        showTip(`${MONTHS[idx].long} <b>${money(MONTHS[idx].value)}</b>`, rect.left + cx, rect.top + cy);
      });
      svg.addEventListener('pointerleave', () => {
        cross.setAttribute('visibility', 'hidden');
        dot.setAttribute('visibility', 'hidden');
        hideTip();
      });
    }

    draw(true);
    let lastW = host.clientWidth;
    new ResizeObserver(() => {
      if (host.clientWidth === lastW) return;
      lastW = host.clientWidth;
      draw(!drawn);
    }).observe(host);
  }

  /* ---------- Categorization demo (Feature 02) ---------- */
  function initCategorizer() {
    const box = $('#categorizer');
    const raw = $('#catRaw');
    const amt = $('#catAmt');
    const status = $('#catStatus');
    const items = $$('#catList li');
    const SAMPLES = [
      { raw: 'UBER *TRIP 8821', name: 'Uber Business', amt: '$82.40', cat: 'travel', label: 'Travel & Transport' },
      { raw: 'ADOBE *CREATIVE CLD', name: 'Adobe Creative Cloud', amt: '$59.99', cat: 'software', label: 'Software & Tools' },
      { raw: 'AMZN BUS MKTP 4417', name: 'Amazon Business', amt: '$145.20', cat: 'office', label: 'Office Supplies' },
      { raw: 'GOOGLE *ADS 2093', name: 'Google Ads', amt: '$640.00', cat: 'marketing', label: 'Marketing' },
      { raw: 'CLEANCO FACILITIES', name: 'Facilities service', amt: '$310.00', cat: 'ops', label: 'Operations' },
    ];
    const resolve = (s) => {
      box.classList.add('is-done');
      raw.textContent = s.name;
      status.textContent = `Categorized as ${s.label}`;
      items.forEach((li) => li.classList.toggle('is-active', li.dataset.cat === s.cat));
    };
    if (reducedMotion) { resolve(SAMPLES[0]); return; }

    let i = 0;
    let timer = null;
    let visible = false;
    const step = () => {
      const s = SAMPLES[i % SAMPLES.length];
      box.classList.remove('is-done');
      items.forEach((li) => li.classList.remove('is-active'));
      raw.textContent = s.raw;
      amt.textContent = s.amt;
      status.textContent = 'Reading merchant…';
      timer = setTimeout(() => {
        resolve(s);
        i += 1;
        timer = setTimeout(() => { if (visible) step(); }, 2200);
      }, 1300);
    };
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      clearTimeout(timer);
      if (visible) step();
    }, { threshold: 0.2 }).observe(box);
  }

  /* ---------- How it works: line follows scroll, steps light up in turn ---------- */
  function initSteps() {
    const wrap = $('.steps__wrap');
    const line = $('.steps__line');
    const steps = $$('.step');
    const THRESHOLDS = [0.02, 0.4, 0.82];
    return () => {
      const rect = wrap.getBoundingClientRect();
      const vh = innerHeight;
      const raw = (vh * 0.88 - rect.top) / (Math.min(rect.height, vh) * 0.62);
      const p = reducedMotion ? 1 : Math.max(0, Math.min(1, raw));
      line.style.setProperty('--p', p.toFixed(3));
      steps.forEach((s, i) => { if (p >= THRESHOLDS[i]) s.classList.add('is-lit'); });
    };
  }

  /* ---------- Parallax (desktop only) ---------- */
  function initScrollEffects() {
    const updateSteps = initSteps();
    const items = $$('[data-parallax]').map((el) => ({
      el,
      factor: parseFloat(el.dataset.parallax),
      min: parseInt(el.dataset.parallaxMin || '769', 10),
    }));
    let queued = false;
    const frame = () => {
      queued = false;
      updateSteps();
      if (reducedMotion) return;
      const vh = innerHeight;
      items.forEach(({ el, factor, min }) => {
        if (innerWidth < min) { el.style.transform = ''; return; }
        const rect = el.parentElement.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        const delta = rect.top + rect.height / 2 - vh / 2;
        el.style.transform = `translate3d(0, ${(delta * factor).toFixed(1)}px, 0)`;
      });
    };
    const request = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(frame);
    };
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', request);
    frame();
  }

  /* ---------- Interactive dashboard tabs ---------- */
  function initTabs() {
    const list = $('.tabs');
    const tabs = $$('.tab', list);
    const indicator = $('.tabs__ind');
    const caps = $$('.cap');
    const budgetRows = $('#budgetRows');

    const moveIndicator = () => {
      const tab = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
      indicator.style.left = `${tab.offsetLeft}px`;
      indicator.style.width = `${tab.offsetWidth}px`;
    };

    const select = (name, focus = false) => {
      tabs.forEach((tab) => {
        const on = tab.dataset.tab === name;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        const panel = $(`#${tab.getAttribute('aria-controls')}`);
        panel.hidden = !on;
        panel.classList.remove('is-entering');
        if (on) {
          void panel.offsetWidth; // restart the entrance animation
          panel.classList.add('is-entering');
          if (focus) tab.focus();
        }
      });
      caps.forEach((cap) => cap.classList.toggle('is-active', cap.dataset.gotoTab === name));
      moveIndicator();
      budgetRows.classList.remove('is-on');
      if (name === 'budgets') {
        void budgetRows.offsetWidth; // restart the bar animation
        budgetRows.classList.add('is-on');
      }
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab.dataset.tab));
      tab.addEventListener('keydown', (e) => {
        const moves = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
        if (!(e.key in moves)) return;
        e.preventDefault();
        select(tabs[(moves[e.key] + tabs.length) % tabs.length].dataset.tab, true);
      });
    });
    caps.forEach((cap) => cap.addEventListener('click', () => select(cap.dataset.gotoTab)));

    addEventListener('resize', moveIndicator);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);
    select('overview');
  }

  /* ---------- FAQ accordion: one item open at a time ---------- */
  function initAccordion() {
    const items = $$('.acc');
    items.forEach((item) => {
      const button = $('button', item);
      button.addEventListener('click', () => {
        const wasOpen = item.classList.contains('is-open');
        items.forEach((other) => {
          other.classList.remove('is-open');
          $('button', other).setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          item.classList.add('is-open');
          button.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ---------- Modals ---------- */
  function closeModal(modal) {
    if (!modal.open) return;
    if (reducedMotion) { modal.close(); return; }
    modal.classList.add('is-closing');
    setTimeout(() => {
      modal.classList.remove('is-closing');
      modal.close();
    }, 190);
  }

  function initModals() {
    $$('.modal').forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.closest('[data-close]')) closeModal(modal);
      });
      modal.addEventListener('cancel', (e) => {
        e.preventDefault();
        closeModal(modal);
      });
    });
  }

  /* Destinations that don't exist yet get an honest notice, not a dead link */
  function initInfo() {
    const modal = $('#infoModal');
    const title = $('#infoTitle');
    const body = $('#infoBody');
    const foot = $('#infoFoot');
    const demoBtn = '<button class="btn btn--primary btn--full" type="button" data-open-form="demo">Book a Demo <span class="btn__arrow" aria-hidden="true">→</span></button>';
    const NOTICES = {
      login: { title: 'Log in', body: '<p>Accounts aren\'t available in this prototype, so there\'s nothing to log in to yet. You can request a demo instead.</p>', foot: demoBtn },
      about: { title: 'About Finora', body: '<p>Finora is an intelligent financial assistant for businesses that want complete visibility and control over their spending. It helps track expenses, organize transactions and surface useful insights.</p>' },
      privacy: { title: 'Privacy Policy', body: '<p>The privacy policy hasn\'t been published yet. This prototype doesn\'t store or send anything you enter into its forms.</p>' },
      terms: { title: 'Terms of Service', body: '<p>The terms of service haven\'t been published yet and will be added before Finora launches.</p>' },
      linkedin: { title: 'LinkedIn', body: '<p>Finora\'s LinkedIn profile isn\'t linked in this prototype yet.</p>' },
      x: { title: 'X', body: '<p>Finora\'s X profile isn\'t linked in this prototype yet.</p>' },
      insights: {
        title: 'All insights',
        body: `<p>Sample insights from this prototype. Review suggested actions before making financial decisions.</p>
          <ul class="info-list">
            <li>You spent 18% more on software this month.<small>Possible cause: 3 new subscriptions added this month.</small></li>
            <li>Three recurring subscriptions may need review.<small>Potential action: review recurring subscriptions.</small></li>
            <li>Your marketing budget is currently 70% utilized.<small>$8,450 of $12,000 used.</small></li>
          </ul>`,
      },
    };
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-info]');
      if (!trigger) return;
      const notice = NOTICES[trigger.dataset.info];
      title.textContent = notice.title;
      body.innerHTML = notice.body;
      foot.innerHTML = notice.foot || '';
      modal.showModal();
    });
  }

  /* ---------- Demo and contact form ---------- */
  function initForm() {
    const modal = $('#formModal');
    const form = $('#demoForm');
    const view = $('#formView');
    const success = $('#formSuccess');
    const successTitle = $('#successTitle');
    const sizeField = $('#sizeField');
    const messageField = $('#messageField');
    const COPY = {
      demo: { title: 'Book a demo', lead: 'Tell us a little about your business.', submit: 'Submit request', done: 'Demo request recorded' },
      contact: { title: 'Get in touch', lead: 'Tell us who you are and how we can help.', submit: 'Send message', done: 'Message recorded' },
    };
    let mode = 'demo';

    const RULES = {
      name: (v) => (v.trim().length >= 2 ? '' : 'Please enter your full name.'),
      email: (v) => {
        if (!v.trim()) return 'Please enter your work email.';
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address.';
      },
      company: (v) => (v.trim() ? '' : 'Please enter your company name.'),
      size: (v) => (mode === 'contact' || v ? '' : 'Please select your company size.'),
    };

    const validateField = (field) => {
      const rule = RULES[field.name];
      if (!rule) return true;
      const message = rule(field.value);
      field.setAttribute('aria-invalid', String(Boolean(message)));
      $(`#${field.id}-e`).textContent = message;
      return !message;
    };

    const open = (nextMode) => {
      mode = nextMode;
      const copy = COPY[mode];
      form.reset();
      $$('[aria-invalid]', form).forEach((f) => f.removeAttribute('aria-invalid'));
      $$('.field__err', form).forEach((p) => { p.textContent = ''; });
      $('#formTitle').textContent = copy.title;
      $('#formLead').textContent = copy.lead;
      $('#formSubmitLabel').textContent = copy.submit;
      sizeField.hidden = mode !== 'demo';
      messageField.hidden = mode !== 'contact';
      view.hidden = false;
      success.hidden = true;
      modal.showModal();
    };

    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-open-form]');
      if (!trigger) return;
      const info = $('#infoModal');
      if (info.open) info.close();
      open(trigger.dataset.openForm);
    });

    form.addEventListener('focusout', (e) => {
      if (e.target.getAttribute('aria-invalid') === 'true') validateField(e.target);
    });
    form.addEventListener('input', (e) => {
      if (e.target.getAttribute('aria-invalid') === 'true') validateField(e.target);
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fields = $$('input, select', form).filter((f) => !f.closest('[hidden]'));
      const invalid = fields.filter((f) => !validateField(f));
      if (invalid.length) { invalid[0].focus(); return; }
      // No backend: stop here and say so plainly in the success state
      successTitle.textContent = COPY[mode].done;
      view.hidden = true;
      success.hidden = false;
      successTitle.focus();
    });
  }

  /* ---------- Boot ---------- */
  initNav();
  initReveal();
  initPlayGates();
  initHeroBars();
  initDonut();
  initTrend();
  initCounters();
  initCategorizer();
  initTabs();
  initAccordion();
  initModals();
  initInfo();
  initForm();
  initScrollEffects();
})();
