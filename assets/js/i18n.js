/* Lightweight i18n for this single-page portfolio.
   Loads translations from assets/i18n/content.json and swaps content dynamically. */

(function () {
  const CONTENT_URL = 'assets/i18n/content.json';
  const STORAGE_KEY = 'lang';
  const FALLBACK_LANG = 'en';

  /** @type {{fr:any,en:any}|null} */
  let dictionary = null;
  /** @type {'fr'|'en'} */
  let currentLang = FALLBACK_LANG;

  function getPreferredLang() {
    const stored = (localStorage.getItem(STORAGE_KEY) || '').toLowerCase();
    if (stored === 'fr' || stored === 'en') return stored;

    const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (nav.startsWith('fr')) return 'fr';
    return FALLBACK_LANG;
  }

  function getGreetingKeyByHour(hour) {
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  function setText(el, value) {
    if (!el) return;
    el.textContent = value;
  }

  function setHtml(el, value) {
    if (!el) return;
    el.innerHTML = value;
  }

  function renderEducation(listEl, education) {
    if (!listEl) return;
    listEl.innerHTML = '';
    for (const item of education || []) {
      const li = document.createElement('li');
      const i = document.createElement('i');
      i.className = item.icon;
      li.appendChild(i);
      li.appendChild(document.createTextNode(' ' + item.text));
      listEl.appendChild(li);
    }
  }

  function renderSimpleList(listEl, items) {
    if (!listEl) return;
    listEl.innerHTML = '';
    for (const html of items || []) {
      const li = document.createElement('li');
      li.innerHTML = html;
      listEl.appendChild(li);
    }
  }

  function renderProject(projectId, project) {
    const slide = document.querySelector(`.carousel-slide[data-project="${projectId}"]`);
    if (!slide) return;

    const titleEl = slide.querySelector('[data-project-part="title"]');
    const descEl = slide.querySelector('[data-project-part="description"]');
    const bulletsEl = slide.querySelector('[data-project-part="bullets"]');

    setHtml(titleEl, project?.titleHtml || '');
    setHtml(descEl, project?.descriptionHtml || '');

    if (bulletsEl) {
      bulletsEl.innerHTML = '';
      for (const b of project?.bullets || []) {
        const li = document.createElement('li');
        li.textContent = b;
        bulletsEl.appendChild(li);
      }
      bulletsEl.style.display = (project?.bullets && project.bullets.length > 0) ? '' : 'none';
    }
  }

  function applyTranslations(lang) {
    if (!dictionary) return;
    const t = dictionary[lang] || dictionary[FALLBACK_LANG];

    // <title>
    if (t.siteTitle) document.title = t.siteTitle;

    // Header
    setText(document.querySelector('[data-i18n="header.name"]'), t.header?.name || '');

    const now = new Date();
    const greetKey = getGreetingKeyByHour(now.getHours());
    const greet = t.header?.greeting?.[greetKey] || '';
    const intro = t.header?.introHtml || '';
    setHtml(document.querySelector('[data-i18n="header.intro"]'), `${greet} ${intro}`);

    // Nav
    setText(document.querySelector('[data-i18n="nav.about"]'), t.nav?.about || '');
    setText(document.querySelector('[data-i18n="nav.skills"]'), t.nav?.skills || '');
    setText(document.querySelector('[data-i18n="nav.work"]'), t.nav?.work || '');
    setText(document.querySelector('[data-i18n="nav.contact"]'), t.nav?.contact || '');

    // About
    setText(document.querySelector('[data-i18n="about.title"]'), t.about?.title || '');
    setHtml(document.querySelector('[data-i18n="about.bio"]'), t.about?.bioHtml || '');
    setText(document.querySelector('[data-i18n="about.educationTitle"]'), t.about?.educationTitle || '');
    renderEducation(document.querySelector('#education-list'), t.about?.education || []);

    // Skills
    setText(document.querySelector('[data-i18n="skills.title"]'), t.skills?.title || '');
    setText(document.querySelector('[data-i18n="skills.softSkills"]'), t.skills?.softSkills || '');
    setHtml(document.querySelector('[data-i18n="skills.languages"]'), t.skills?.languagesHtml || '');
    setText(document.querySelector('[data-i18n="skills.tools"]'), t.skills?.tools || '');
    setText(document.querySelector('[data-i18n="skills.cybersecurity"]'), t.skills?.cybersecurity || '');
    setText(document.querySelector('[data-i18n="skills.spoken"]'), t.skills?.spoken || '');
    setText(document.querySelector('[data-i18n="skills.experienceTitle"]'), t.skills?.experienceTitle || '');
    renderSimpleList(document.querySelector('#experience-list'), t.skills?.experience || []);

    // Contact
    setText(document.querySelector('[data-i18n="contact.title"]'), t.contact?.title || '');
    setHtml(document.querySelector('[data-i18n="contact.body"]'), t.contact?.bodyHtml || '');
    setText(document.querySelector('[data-i18n="contact.spokenLabel"]'), t.contact?.spokenLabel || '');

    // Work + projects
    setText(document.querySelector('[data-i18n="work.title"]'), t.work?.title || '');
    const projects = t.work?.projects || {};
    for (const [projectId, project] of Object.entries(projects)) renderProject(projectId, project);

    // Footer
    setHtml(document.querySelector('[data-i18n="footer.copyright"]'), t.footer?.copyright || '');

    // Close button (created by main.js)
    const closeText = t.ui?.close || 'Close';
    document.querySelectorAll('#main article .close').forEach((el) => { el.textContent = closeText; });

    // Toggle UI
    const checkbox = document.querySelector('#lang-toggle');
    if (checkbox) checkbox.checked = lang === 'en';
  }

  async function loadDictionary() {
    const res = await fetch(CONTENT_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Failed to load translations (${res.status})`);
    return await res.json();
  }

  function setLanguage(lang) {
    currentLang = (lang === 'fr' ? 'fr' : 'en');
    localStorage.setItem(STORAGE_KEY, currentLang);
    applyTranslations(currentLang);
  }

  function wireToggle() {
    const checkbox = document.querySelector('#lang-toggle');
    if (!checkbox) return;
    checkbox.addEventListener('change', () => {
      setLanguage(checkbox.checked ? 'en' : 'fr');
    });
  }

  async function init() {
    try {
      dictionary = await loadDictionary();
    } catch (e) {
      console.error(e);
      return;
    }

    wireToggle();
    setLanguage(getPreferredLang());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

