/* ============================================
   SLIDESHOW — КОСМОС & ТЕХНОЛОГІЇ
   - Циклічне перегортання (пункт 3 завдання)
   - Кнопки prev/next, навігація точками
   - Авто-прокрутка кожні 5 секунд
   - Підтримка клавіатури (←/→)
   - Підтримка свайпів на тач-пристроях
   ============================================ */

(function () {
  'use strict';

  const slider = document.getElementById('slider');
  const track  = document.getElementById('slider-track');
  const prev   = document.getElementById('prevSlide');
  const next   = document.getElementById('nextSlide');
  const dotsEl = document.getElementById('sliderDots');
  if (!slider || !track) return;

  const slides = track.querySelectorAll('.slide');
  const total  = slides.length;
  let   index  = 0;
  let   autoTimer = null;
  const AUTO_DELAY = 5000;

  // -- Створення точок-індикаторів ---------------------------------
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'slider-dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', 'Слайд ' + (i + 1));
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(dot);
  }
  const dots = dotsEl.querySelectorAll('.slider-dot');

  // -- Основна функція переходу ------------------------------------
  function goTo(i) {
    // Циклічність: від'ємні та перевищення обгортаються
    index = (i + total) % total;
    track.style.transform = 'translateX(-' + (index * 100) + '%)';

    slides.forEach((s, k) => s.classList.toggle('is-active', k === index));
    dots.forEach((d, k) => {
      d.classList.toggle('is-active', k === index);
      d.setAttribute('aria-selected', k === index ? 'true' : 'false');
    });
  }
  function nextSlide() { goTo(index + 1); }
  function prevSlide() { goTo(index - 1); }

  // -- Авто-прокрутка ----------------------------------------------
  function startAuto() {
    stopAuto();
    autoTimer = setInterval(nextSlide, AUTO_DELAY);
  }
  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  // -- Обробники ---------------------------------------------------
  next.addEventListener('click', () => { nextSlide(); startAuto(); });
  prev.addEventListener('click', () => { prevSlide(); startAuto(); });

  // Пауза при наведенні мишею
  slider.addEventListener('mouseenter', stopAuto);
  slider.addEventListener('mouseleave', startAuto);

  // Клавіатура — стрілки
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { nextSlide(); startAuto(); }
    if (e.key === 'ArrowLeft')  { prevSlide(); startAuto(); }
  });

  // Свайпи на тач-пристроях
  let touchStartX = 0;
  slider.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    stopAuto();
  }, { passive: true });
  slider.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) dx < 0 ? nextSlide() : prevSlide();
    startAuto();
  });

  // Пауза коли вкладка неактивна (щоб не "переганяв" у фоні)
  document.addEventListener('visibilitychange', () => {
    document.hidden ? stopAuto() : startAuto();
  });

  startAuto();
})();
