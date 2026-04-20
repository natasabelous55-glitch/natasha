/* ============================================================
   3D CHNPP (ЧАЕС) + GEIGER COUNTER
   Three.js r128 + OrbitControls + Web Audio API
   - 4-й енергоблок у вигляді до вибуху
   - Реактивний лічильник радіації: 1/r² від положення камери
   - Біпи через OscillatorNode (Web Audio)
   ============================================================ */

(function () {
  'use strict';

  const container = document.getElementById('scene');
  if (!container || typeof THREE === 'undefined') {
    console.warn('Three.js or scene container not found');
    return;
  }

  // -------- DOM елементи лічильника --------
  const $value    = document.getElementById('geiger-value');
  const $distance = document.getElementById('r-distance');
  const $zone     = document.getElementById('r-zone');
  const $beeps    = document.getElementById('r-beeps');
  const $ledSafe  = document.getElementById('led-safe');
  const $ledWarn  = document.getElementById('led-warn');
  const $ledDange = document.getElementById('led-danger');

  // ============================================================
   // THREE.JS SCENE
   // ============================================================

  const scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.Fog(0x8a7868, 80, 300);

  const camera = new THREE.PerspectiveCamera(
    50, container.clientWidth / container.clientHeight, 0.1, 1000
  );
  camera.position.set(60, 40, 80);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // -- Освітлення — холодне ранкове світло --
  const ambient = new THREE.AmbientLight(0x8090a0, 0.55);
  scene.add(ambient);

  const sunLight = new THREE.DirectionalLight(0xfff0c8, 0.9);
  sunLight.position.set(40, 60, 30);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 200;
  sunLight.shadow.camera.left = -80;
  sunLight.shadow.camera.right = 80;
  sunLight.shadow.camera.top = 80;
  sunLight.shadow.camera.bottom = -80;
  scene.add(sunLight);

  // Легка підсвітка зі зворотного боку
  const fill = new THREE.DirectionalLight(0x9fb8d0, 0.3);
  fill.position.set(-30, 20, -20);
  scene.add(fill);

  // -- Земля --
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x3a5028, roughness: 0.95, metalness: 0
  });
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    groundMat
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  // -- Бетонний майданчик перед станцією --
  const platformMat = new THREE.MeshStandardMaterial({
    color: 0x8a8680, roughness: 0.85
  });
  const platform = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 80),
    platformMat
  );
  platform.rotation.x = -Math.PI / 2;
  platform.position.y = 0.05;
  platform.receiveShadow = true;
  scene.add(platform);

  // ============================================================
   // ЧАЕС — 4-Й ЕНЕРГОБЛОК ДО ВИБУХУ
   // ============================================================

  const chaes = new THREE.Group();
  scene.add(chaes);

  // Матеріали
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0xb8b4a8, roughness: 0.85, metalness: 0.05
  });
  const concreteDarkMat = new THREE.MeshStandardMaterial({
    color: 0x9a9488, roughness: 0.9
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x5a5852, roughness: 0.4, metalness: 0.7
  });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x3a4858, roughness: 0.2, metalness: 0.1, emissive: 0x1a2028, emissiveIntensity: 0.2
  });

  // -- ГОЛОВНИЙ КОРПУС станції (довгий прямокутник) --
  const mainBuilding = new THREE.Mesh(
    new THREE.BoxGeometry(80, 14, 20),
    concreteMat
  );
  mainBuilding.position.set(0, 7, 0);
  mainBuilding.castShadow = true;
  mainBuilding.receiveShadow = true;
  chaes.add(mainBuilding);

  // Вікна вздовж головного корпусу
  for (let i = -35; i <= 35; i += 5) {
    const win = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2.5, 0.3),
      windowMat
    );
    win.position.set(i, 9, 10.05);
    chaes.add(win);
    const win2 = win.clone();
    win2.position.z = -10.05;
    chaes.add(win2);
  }
  for (let i = -35; i <= 35; i += 5) {
    const win = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2.5, 0.3),
      windowMat
    );
    win.position.set(i, 4, 10.05);
    chaes.add(win);
    const win2 = win.clone();
    win2.position.z = -10.05;
    chaes.add(win2);
  }

  // -- РЕАКТОРНА ЗАЛА 4-го блоку — висока споруда --
  const reactorBuilding = new THREE.Mesh(
    new THREE.BoxGeometry(22, 28, 22),
    concreteMat
  );
  reactorBuilding.position.set(30, 14, 0);
  reactorBuilding.castShadow = true;
  reactorBuilding.receiveShadow = true;
  chaes.add(reactorBuilding);

  // Верхній "шолом" — характерне завершення
  const reactorTop = new THREE.Mesh(
    new THREE.BoxGeometry(24, 4, 24),
    concreteDarkMat
  );
  reactorTop.position.set(30, 30, 0);
  reactorTop.castShadow = true;
  chaes.add(reactorTop);

  // -- ВНУТРІШНІЙ РЕАКТОР — місце епіцентру (потрібне для лічильника) --
  const reactorCore = new THREE.Mesh(
    new THREE.CylinderGeometry(3, 3, 6, 32),
    new THREE.MeshStandardMaterial({
      color: 0x8a7a3a,
      emissive: 0x4a3010,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.8
    })
  );
  reactorCore.position.set(30, 4, 0);
  chaes.add(reactorCore);
  // Світіння реактора (тонке)
  const reactorGlow = new THREE.PointLight(0xff8030, 0.6, 25);
  reactorGlow.position.set(30, 6, 0);
  chaes.add(reactorGlow);

  // ЗБЕРІГАЮ ПОЗИЦІЮ РЕАКТОРА — звідси рахується радіація
  const reactorPosition = new THREE.Vector3(30, 6, 0);

  // -- ВЕНТИЛЯЦІЙНА ТРУБА — культова червоно-біла --
  const chimneyGroup = new THREE.Group();

  const chimneyBase = new THREE.Mesh(
    new THREE.BoxGeometry(8, 8, 8),
    concreteMat
  );
  chimneyBase.position.y = 4;
  chimneyGroup.add(chimneyBase);

  // Решіткова конструкція (спрощено — 4 кута + перекладини)
  for (let ang = 0; ang < 4; ang++) {
    const x = Math.cos(ang * Math.PI/2) * 3.2;
    const z = Math.sin(ang * Math.PI/2) * 3.2;
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 45, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xc63030, roughness: 0.6 })
    );
    leg.position.set(x, 28, z);
    chimneyGroup.add(leg);
  }
  // Білі горизонтальні кільця
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xf0f0e8, roughness: 0.6 });
  for (let y = 15; y < 50; y += 6) {
    const ring = new THREE.Mesh(
      new THREE.BoxGeometry(7.5, 0.4, 7.5),
      ringMat
    );
    ring.position.y = y;
    chimneyGroup.add(ring);
  }
  // Основна труба зверху
  const chimneyTop = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1.2, 10, 16),
    new THREE.MeshStandardMaterial({ color: 0xc63030, roughness: 0.5 })
  );
  chimneyTop.position.y = 55;
  chimneyGroup.add(chimneyTop);

  chimneyGroup.position.set(30, 28, 0);  // на даху реакторного корпусу
  chimneyGroup.traverse(m => { if (m.isMesh) m.castShadow = true; });
  chaes.add(chimneyGroup);

  // -- 3-й БЛОК (такий же) — ліворуч від 4-го --
  const block3 = new THREE.Mesh(
    new THREE.BoxGeometry(22, 28, 22),
    concreteMat
  );
  block3.position.set(-10, 14, 0);
  block3.castShadow = true;
  block3.receiveShadow = true;
  chaes.add(block3);

  const block3top = new THREE.Mesh(
    new THREE.BoxGeometry(24, 4, 24),
    concreteDarkMat
  );
  block3top.position.set(-10, 30, 0);
  chaes.add(block3top);

  // -- Маш зал для генераторів (ліворуч-попереду) --
  const machHall = new THREE.Mesh(
    new THREE.BoxGeometry(60, 10, 14),
    concreteDarkMat
  );
  machHall.position.set(0, 5, 18);
  machHall.castShadow = true;
  machHall.receiveShadow = true;
  chaes.add(machHall);

  // Лінії труб на даху машзалу
  for (let i = -25; i <= 25; i += 8) {
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 14, 8),
      metalMat
    );
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(i, 10.5, 18);
    chaes.add(pipe);
  }

  // -- Огорожа навколо території --
  for (let i = -50; i <= 50; i += 4) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 2, 0.3),
      metalMat
    );
    post.position.set(i, 1, -35);
    chaes.add(post);
    const post2 = post.clone();
    post2.position.z = 35;
    chaes.add(post2);
  }

  // -- Пара бетонних градирень на задньому плані --
  for (let i = 0; i < 2; i++) {
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(12, 16, 30, 24, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0xa8a49c, roughness: 0.9, side: THREE.DoubleSide
      })
    );
    tower.position.set(60 + i * 30, 15, -60);
    tower.castShadow = true;
    tower.receiveShadow = true;
    chaes.add(tower);
  }

  // ============================================================
  // ORBIT CONTROLS
  // ============================================================

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 15;
  controls.maxDistance = 200;
  controls.maxPolarAngle = Math.PI / 2 - 0.05; // не дає опуститись під землю
  controls.target.set(15, 10, 0);

  // ============================================================
  // ЛІЧИЛЬНИК ГЕЙГЕРА — Web Audio API
  // ============================================================

  let audioCtx = null;
  let muted = false;
  let lastBeepTime = 0;

  // Ініціалізуємо AudioContext тільки після першої взаємодії (політика браузерів)
  function ensureAudio() {
    if (audioCtx) return audioCtx;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio not supported');
    }
    return audioCtx;
  }

  // Короткий клік/тик характерний для Гейгера
  function playClick() {
    if (muted || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = 850 + Math.random() * 150;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Клавіша M — вимикач звуку
  document.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M' || e.key === 'ь') {
      muted = !muted;
      console.log('Geiger audio:', muted ? 'MUTED' : 'ON');
    }
  });

  // Перший клік по сцені — "розбудити" аудіо
  renderer.domElement.addEventListener('pointerdown', () => {
    ensureAudio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }, { once: false });

  // ============================================================
  // ОБЧИСЛЕННЯ РАДІАЦІЇ ТА ОНОВЛЕННЯ UI
  // ============================================================

  /**
   * Рахуємо рівень радіації за формулою 1/r²:
   * на 15м (найближче) ~ 500 µSv/h, на 200м ~ 0.02
   */
  function calcRadiation(distance) {
    // Базова інтенсивність на 1 метрі від ядра
    const baseRate = 8000; // µSv/h
    const safeDist = 2;
    const r = Math.max(distance, safeDist);
    return baseRate / (r * r);
  }

  function zoneLabel(usv) {
    if (usv < 0.3)  return { name: 'Безпечна', color: 'safe' };
    if (usv < 5)    return { name: 'Помірна',  color: 'low' };
    if (usv < 100)  return { name: 'Підвищена', color: 'warn' };
    return                  { name: 'НЕБЕЗПЕЧНА', color: 'danger' };
  }

  function beepInterval(usv) {
    // Частота біпів: чим вища радіація, тим частіше
    // 0.1 µSv/h ~ 1 біп/сек, 100 µSv/h ~ 15 біпів/сек, 500 ~ 40 біпів/сек
    if (usv < 0.1) return 2500; // рідкісні кліки у фоні
    const freq = Math.min(40, 0.8 * Math.sqrt(usv));
    return Math.max(25, 1000 / freq);
  }

  function updateGeiger() {
    const distance = camera.position.distanceTo(reactorPosition);
    const usv = calcRadiation(distance);
    const zone = zoneLabel(usv);

    // Формат числа
    let valueText;
    if (usv < 1)      valueText = usv.toFixed(2);
    else if (usv < 100) valueText = usv.toFixed(1);
    else                valueText = Math.round(usv).toString();

    $value.textContent = valueText;
    $distance.textContent = distance.toFixed(1) + ' м';
    $zone.textContent = zone.name;
    $beeps.textContent = (1000 / beepInterval(usv)).toFixed(1) + ' /с';

    // LED-індикація
    $ledSafe .classList.toggle('is-on', zone.color === 'safe' || zone.color === 'low');
    $ledWarn .classList.toggle('is-on', zone.color === 'warn');
    $ledDange.classList.toggle('is-on', zone.color === 'danger');

    // Колір основного значення
    const colors = {
      safe: 'var(--ink)',
      low: 'var(--ink)',
      warn: '#e0a020',
      danger: '#e03020'
    };
    $value.style.color = colors[zone.color];

    // Біпи через Web Audio
    if (audioCtx) {
      const now = performance.now();
      const interval = beepInterval(usv);
      if (now - lastBeepTime > interval) {
        playClick();
        lastBeepTime = now;
      }
    }
  }

  // ============================================================
  // RESIZE & ANIMATION LOOP
  // ============================================================

  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(onResize).observe(container);
  } else {
    window.addEventListener('resize', onResize);
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    updateGeiger();

    // Легка модуляція світіння реактора
    reactorGlow.intensity = 0.5 + Math.sin(performance.now() * 0.002) * 0.2;

    renderer.render(scene, camera);
  }
  animate();
})();
