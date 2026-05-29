/* Lightweight i18n for the portfolio SPA */

(function () {
  const CONTENT_URL = 'assets/i18n/content.json';
  const STORAGE_KEY = 'lang';
  const FALLBACK    = 'fr';

  let dictionary = null;
  let currentLang = FALLBACK;

  // ── Project image map ───────────────────────────────────────────────────
  const PROJECT_IMAGES = {
    rockingball:  'images/work/rockingball.png',
    ethixmarine:  'images/work/ethixmarine.png',
    ethixit:      'images/work/ethixit.png',
    spacey:       'images/work/spaceY.png',
    portfolio:    'images/work/portfolio.png',
    solanum:      'images/work/solanum.png',
    weatherapp:   'images/work/weatherapp.png',
    mininote:     'images/work/notestasksapp.png',
    mediafinder:  'images/work/cwad-mediafinder.png',
    moh:          'images/work/MoH-codegamejam2025.png',
    portfolioLea: 'images/work/portfolio-lea.png',
    beerfinity:   'images/work/beerfinity-codegamejam2026.png',
    maxiflop:     'images/work/maxiflop.png',
    glyphe:       'images/work/glyphe.png',
  };

  // ── Helpers ─────────────────────────────────────────────────────────────
  function setText(el, val) { if (el) el.textContent = val || ''; }
  function setHtml(el, val) { if (el) el.innerHTML  = val || ''; }

  function get(obj, path) {
    return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
  }

  function getGreetingKey(hour) {
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  // ── Simple data-i18n bindings ────────────────────────────────────────────
  function applySimple(t) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const val = get(t, key);
      if (val === undefined || val === null) return;
      // Keys ending in Html or containing HTML tags → innerHTML
      if (key.toLowerCase().endsWith('html') || (typeof val === 'string' && val.includes('<'))) {
        setHtml(el, val);
      } else {
        setText(el, val);
      }
    });
  }

  // ── Greeting prefix on home ──────────────────────────────────────────────
  function applyGreeting(t) {
    const el = document.getElementById('home-greeting');
    if (!el) return;
    const key = getGreetingKey(new Date().getHours());
    const greet = t.header?.greeting?.[key] || '';
    el.textContent = greet ? greet + ' ' : '';
  }

  // ── Skills grid renderer ─────────────────────────────────────────────────
  function renderSkillGroups(containerEl, skillsData) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    // Technical groups (6 text-based rows)
    for (const group of skillsData.technicalGroups || []) {
      const div = document.createElement('div');
      div.className = 'skill-group';
      const label = document.createElement('div');
      label.className = 'skill-group-label';
      label.textContent = group.label;
      const value = document.createElement('p');
      value.className = 'skill-value';
      value.textContent = group.items;
      div.appendChild(label);
      div.appendChild(value);
      containerEl.appendChild(div);
    }

    // Qualities
    const makeListGroup = (labelText, items) => {
      const div = document.createElement('div');
      div.className = 'skill-group';
      const label = document.createElement('div');
      label.className = 'skill-group-label';
      label.textContent = labelText;
      div.appendChild(label);
      const ul = document.createElement('ul');
      ul.className = 'skill-detail-list';
      for (const item of items || []) {
        const li = document.createElement('li');
        const strong = document.createElement('strong');
        strong.textContent = item.label;
        li.appendChild(strong);
        if (item.description) {
          li.appendChild(document.createTextNode(' : ' + item.description));
        }
        ul.appendChild(li);
      }
      div.appendChild(ul);
      containerEl.appendChild(div);
    };

    makeListGroup(skillsData.qualitiesLabel, skillsData.qualities);
    makeListGroup(skillsData.spokenLabel,    skillsData.spoken);
    makeListGroup(skillsData.hobbiesLabel,   skillsData.hobbies);
  }

  // ── Project modal ────────────────────────────────────────────────────────
  function openModal(proj, imgSrc) {
    const modal = document.getElementById('project-modal');
    if (!modal) return;
    document.getElementById('modal-img').src      = imgSrc || '';
    document.getElementById('modal-year').textContent = proj.year || '';
    document.getElementById('modal-title').innerHTML  = proj.titleHtml || '';
    document.getElementById('modal-desc').innerHTML   = proj.descriptionHtml || '';
    const bullets = document.getElementById('modal-bullets');
    bullets.innerHTML = '';
    for (const b of proj.bullets || []) {
      const li = document.createElement('li');
      li.textContent = b;
      bullets.appendChild(li);
    }
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  // ── Timeline renderer ────────────────────────────────────────────────────
  // entries: [{ period, title (or role+company or institution+degree), descriptionHtml, bullets }]
  function renderTimeline(containerEl, entries) {
    if (!containerEl) return;
    containerEl.innerHTML = '';
    for (const entry of entries || []) {
      const item = document.createElement('div');
      item.className = 'timeline-item';

      const period = document.createElement('div');
      period.className = 'timeline-period';
      period.textContent = entry.period || '';
      item.appendChild(period);

      const title = document.createElement('div');
      title.className = 'timeline-title';
      // Experience entries have role + company; Education entries have institution + degree
      title.textContent = entry.role || entry.institution || entry.title || '';
      item.appendChild(title);

      const subtitle = document.createElement('div');
      subtitle.className = 'timeline-subtitle';
      subtitle.textContent = entry.company || entry.degree || entry.subtitle || '';
      item.appendChild(subtitle);

      if (entry.descriptionHtml) {
        const desc = document.createElement('p');
        desc.className = 'timeline-description';
        desc.innerHTML = entry.descriptionHtml;
        item.appendChild(desc);
      } else if (entry.description) {
        const desc = document.createElement('p');
        desc.className = 'timeline-description';
        desc.textContent = entry.description;
        item.appendChild(desc);
      }

      if (entry.bullets && entry.bullets.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'timeline-bullets';
        for (const b of entry.bullets) {
          const li = document.createElement('li');
          li.textContent = b;
          ul.appendChild(li);
        }
        item.appendChild(ul);
      }

      containerEl.appendChild(item);
    }
  }

  // ── Project grid renderer ────────────────────────────────────────────────
  function renderProjectGrid(containerEl, projects) {
    if (!containerEl) return;
    containerEl.innerHTML = '';
    for (const [id, proj] of Object.entries(projects || {}).reverse()) {
      const card = document.createElement('div');
      card.className = 'project-card';

      const imgSrc = PROJECT_IMAGES[id] || '';
      if (imgSrc) {
        const img = document.createElement('img');
        img.className = 'project-card-img';
        img.src = imgSrc;
        img.alt = '';
        img.loading = 'lazy';
        card.appendChild(img);
      }

      const body = document.createElement('div');
      body.className = 'project-card-body';

      const year = document.createElement('div');
      year.className = 'project-card-year';
      year.textContent = proj.year || '';
      body.appendChild(year);

      const titleEl = document.createElement('div');
      titleEl.className = 'project-card-title';
      titleEl.innerHTML = proj.titleHtml || '';
      body.appendChild(titleEl);

      const desc = document.createElement('p');
      desc.className = 'project-card-desc';
      desc.innerHTML = proj.descriptionHtml || '';
      body.appendChild(desc);

      card.appendChild(body);
      card.addEventListener('click', () => openModal(proj, imgSrc));
      containerEl.appendChild(card);
    }
  }

  // ── Apply all translations ───────────────────────────────────────────────
  function applyTranslations(lang) {
    if (!dictionary) return;
    const t = dictionary[lang] || dictionary[FALLBACK];

    applySimple(t);
    applyGreeting(t);

    // Skills grid
    renderSkillGroups(
      document.getElementById('skills-grid'),
      t.skills || {}
    );

    // Experience timeline
    renderTimeline(
      document.getElementById('experience-timeline'),
      t.experience?.entries || []
    );

    // Education timeline
    renderTimeline(
      document.getElementById('education-timeline'),
      t.education?.entries || []
    );

    // Projects grid
    renderProjectGrid(
      document.getElementById('projects-grid'),
      t.work?.projects || {}
    );

    // Language toggle state
    const toggle = document.getElementById('lang-toggle');
    if (toggle) toggle.checked = lang === 'en';

    const mobileBtn = document.getElementById('mobile-lang-btn');
    if (mobileBtn) mobileBtn.textContent = lang.toUpperCase();
  }

  // ── Lang detection & persistence ─────────────────────────────────────────
  function getPreferredLang() {
    const stored = (localStorage.getItem(STORAGE_KEY) || '').toLowerCase();
    if (stored === 'fr' || stored === 'en') return stored;
    const nav = (navigator.language || '').toLowerCase();
    return nav.startsWith('fr') ? 'fr' : FALLBACK;
  }

  function setLanguage(lang) {
    currentLang = lang === 'fr' ? 'fr' : 'en';
    localStorage.setItem(STORAGE_KEY, currentLang);
    document.documentElement.lang = currentLang;
    applyTranslations(currentLang);
  }

  function wireToggle() {
    const toggle = document.getElementById('lang-toggle');
    if (toggle) {
      toggle.addEventListener('change', () => setLanguage(toggle.checked ? 'en' : 'fr'));
    }

    const mobileBtn = document.getElementById('mobile-lang-btn');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => setLanguage(currentLang === 'fr' ? 'en' : 'fr'));
    }
  }

  async function init() {
    try {
      const res = await fetch(CONTENT_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      dictionary = await res.json();
    } catch (e) {
      console.error('i18n: failed to load content.json', e);
      return;
    }
    wireToggle();
    setLanguage(getPreferredLang());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
