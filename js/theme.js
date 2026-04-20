/* ============================================
   THEME SWITCHER
   Перемикає клас .light / .dark на <body>
   через DOM-маніпуляцію (без localStorage —
   вимога Claude-артефактів; в реальному
   проєкті можна додати збереження).
   ============================================ */

(function () {
  'use strict';

  const body = document.body;
  const btnLight = document.getElementById('btn-light');
  const btnDark  = document.getElementById('btn-dark');

  if (!btnLight || !btnDark) return;

  /**
   * Встановлює тему, маніпулюючи класами body
   * та атрибутом aria-pressed на кнопках.
   * @param {'light'|'dark'} theme
   */
  function setTheme(theme) {
    body.classList.remove('light', 'dark');
    body.classList.add(theme);

    const isLight = theme === 'light';
    btnLight.classList.toggle('is-active', isLight);
    btnDark.classList.toggle('is-active', !isLight);
    btnLight.setAttribute('aria-pressed', String(isLight));
    btnDark.setAttribute('aria-pressed', String(!isLight));
  }

  btnLight.addEventListener('click', () => setTheme('light'));
  btnDark.addEventListener('click', () => setTheme('dark'));

  // Темна тема встановлена як default у HTML (body class="dark").
  // Користувач може перемкнути кнопками — ми не чіпаємо системні preferences,
  // бо ігровий темний HUD — це частина дизайну цього сайту.
})();
