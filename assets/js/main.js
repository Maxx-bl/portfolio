/* Portfolio SPA navigation — no jQuery */

(function () {
  const PAGES = ['home', 'projects', 'skills', 'experience', 'education', 'contact'];
  const DEFAULT_PAGE = 'home';

  function showPage(id) {
    if (!PAGES.includes(id)) id = DEFAULT_PAGE;

    // Sections
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');

    // Nav links
    document.querySelectorAll('#sidebar-nav .nav-link').forEach(a => {
      a.classList.toggle('active', a.dataset.page === id);
    });

    // Update hash without pushing duplicate state
    const newHash = '#' + id;
    if (location.hash !== newHash) history.pushState(null, '', newHash);

    // Close mobile sidebar
    document.body.classList.remove('sidebar-open');
  }

  function getHashPage() {
    const hash = location.hash.replace('#', '').trim();
    return PAGES.includes(hash) ? hash : DEFAULT_PAGE;
  }

  function initNav() {
    document.querySelectorAll('#sidebar-nav .nav-link').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        showPage(a.dataset.page);
      });
    });
  }

  function initBurger() {
    const burger = document.getElementById('burger');
    const overlay = document.getElementById('sidebar-overlay');
    if (!burger) return;

    burger.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-open');
    });

    overlay.addEventListener('click', () => {
      document.body.classList.remove('sidebar-open');
    });
  }

  function initHash() {
    window.addEventListener('popstate', () => {
      showPage(getHashPage());
    });
  }

  function closeModal() {
    const modal = document.getElementById('project-modal');
    if (modal) modal.hidden = true;
    document.body.style.overflow = '';
  }

  function initModal() {
    document.getElementById('modal-close')?.addEventListener('click', closeModal);
    document.getElementById('project-modal')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });
  }

  function setThemeIcon(dark) {
    const icon = dark ? 'fa-moon' : 'fa-sun';
    document.querySelectorAll('#theme-toggle i, #mobile-theme-btn i').forEach(el => {
      el.className = `fa-solid ${icon}`;
    });
  }

  function initTheme() {
    const stored = localStorage.getItem('theme');
    const dark = stored === 'dark';
    if (dark) document.body.classList.add('dark');
    setThemeIcon(dark);

    const toggle = (e) => {
      const isDark = document.body.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      setThemeIcon(isDark);
    };

    document.getElementById('theme-toggle')?.addEventListener('click', toggle);
    document.getElementById('mobile-theme-btn')?.addEventListener('click', toggle);
  }

  function init() {
    initNav();
    initBurger();
    initHash();
    initModal();
    initTheme();
    showPage(getHashPage());
  }

  // Expose for i18n.js to call after translations applied
  window.showPage = showPage;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
