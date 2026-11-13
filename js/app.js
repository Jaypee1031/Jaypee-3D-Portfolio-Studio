/**
 * JAYPEE STUDIO // Main Studio Controller, Theme Engine, 3D Tilt Physics & Cyberpunk Snake Arcade
 */

(function () {
  'use strict';

  const THEMES = ['noir', 'crimson', 'acid', 'cobalt', 'gold', 'prism', 'ivory'];
  const THEME_NAMES = {
    noir: 'NOIR B&W',
    crimson: 'CYBER CRIMSON',
    acid: 'ACID VOLT',
    cobalt: 'QUANTUM COBALT',
    gold: 'SOLAR GOLD',
    prism: 'CYBER PRISM',
    ivory: 'STARK IVORY'
  };

  /**
   * 1. Real-Time HUD Clock (Exact Reference Format: "Local time: 13:21:48 (1:21 PM)")
   */
  function initHudClock() {
    const clockEl = document.getElementById('hud-live-clock');
    if (!clockEl) return;

    function updateClock() {
      const now = new Date();
      const h24 = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');

      const hours12 = now.getHours() % 12 || 12;
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
      clockEl.textContent = `Local time: ${h24}:${m}:${s} (${hours12}:${m} ${ampm})`;
    }

    updateClock();
    setInterval(updateClock, 1000);
  }

  /**
   * 2. Multi-Theme Engine (Synchronizes CSS Variables + Three.js 3D Rim Lights)
   */
  function initThemeEngine() {
    const swatches = document.querySelectorAll('[data-set-theme]');
    const themeLabel = document.getElementById('active-theme-label');

    function applyTheme(themeKey) {
      if (!THEMES.includes(themeKey)) themeKey = 'noir';
      document.documentElement.setAttribute('data-theme', themeKey);

      swatches.forEach((sw) => {
        sw.classList.toggle('active', sw.getAttribute('data-set-theme') === themeKey);
      });

      if (themeLabel) {
        themeLabel.textContent = THEME_NAMES[themeKey] || 'NOIR B&W';
      }

      if (window.studioScene3D) {
        window.studioScene3D.applyThemePalette(themeKey);
      }

      try {
        localStorage.setItem('jaypee_studio_theme', themeKey);
      } catch (_) {}
    }

    swatches.forEach((sw) => {
      sw.addEventListener('click', () => {
        applyTheme(sw.getAttribute('data-set-theme'));
      });
    });

    // Keyboard shortcut 'T' to cycle themes (when not typing in an input)
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target && e.target.tagName) || '')) return;
      if (e.key.toLowerCase() === 't') {
        const current = document.documentElement.getAttribute('data-theme') || 'noir';
        const nextIdx = (THEMES.indexOf(current) + 1) % THEMES.length;
        applyTheme(THEMES[nextIdx]);
      }
    });

    // Restore saved theme or default to 'noir' (Reference Black & White)
    let saved = 'noir';
    try {
      saved = localStorage.getItem('jaypee_studio_theme') || 'noir';
    } catch (_) {}
    applyTheme(saved);
  }

  /**
   * 3. 3D Sculpture Mode Switcher ([01: BUST] [02: RUBIK] [03: ORBITAL] [04: NEXUS])
   */
  function init3DModeSwitcher() {
    const btns = document.querySelectorAll('[data-3d-mode]');
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-3d-mode');
        btns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        if (window.studioScene3D) {
          window.studioScene3D.setMode(mode);
        }
      });
    });
  }

  /**
   * 4. 3D Card Perspective Tilt & Spotlight Effect + Magnetic Orb CTA
   */
  function initSpatialInteractions() {
    document.addEventListener('mousemove', (e) => {
      const cards = document.querySelectorAll('.creation-card, .repo-card');
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });

    // Magnetic Pull on the Hero Orb CTA Button
    const orbBtn = document.getElementById('hero-orb-cta');
    if (orbBtn) {
      orbBtn.addEventListener('mousemove', (e) => {
        const rect = orbBtn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * 0.22;
        const dy = (e.clientY - cy) * 0.22;
        orbBtn.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`;
      });
      orbBtn.addEventListener('mouseleave', () => {
        orbBtn.style.transform = '';
      });
    }
  }

  /**
   * 5. Clean Extensionless URL Router & Navigation Active Spy
   * Guarantees ZERO .php or .html ever appears in the browser address bar.
   */
  function initCleanUrlNavigation() {
    const basePath = document.documentElement.getAttribute('data-base-path') || '/';
    const initialSection = document.documentElement.getAttribute('data-initial-section') || 'home';
    const navLinks = document.querySelectorAll('[data-nav-section]');
    const sectionIds = ['home', 'works', 'creations', 'about', 'services', 'contacts'];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

    // Immediately strip any .php or .html if ever present in location.pathname
    if (/\.(php|html?)$/i.test(window.location.pathname)) {
      const cleaned = window.location.pathname
        .replace(/\/index\.(php|html?)$/i, '/')
        .replace(/\.(php|html?)$/i, '');
      window.history.replaceState({}, '', cleaned + window.location.search);
    }

    function buildCleanUrl(sectionId) {
      const cleanBase = basePath.endsWith('/') ? basePath : basePath + '/';
      return sectionId === 'home' ? cleanBase : `${cleanBase}${sectionId}`;
    }

    // If user landed directly on /works, /creations, /about, etc., scroll to it smoothly
    if (initialSection && initialSection !== 'home') {
      const targetEl = document.getElementById(initialSection);
      if (targetEl) {
        setTimeout(() => {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }

    // Intercept clicks on clean extensionless nav links
    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('data-nav-section');
        const targetSec = targetId ? document.getElementById(targetId) : null;
        if (targetSec) {
          e.preventDefault();
          targetSec.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState({ section: targetId }, '', buildCleanUrl(targetId));
          navLinks.forEach((l) => {
            l.classList.toggle('active', l.getAttribute('data-nav-section') === targetId);
          });
        }
      });
    });

    // Update active nav state & clean URL on scroll
    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + 240;
      let currentId = 'home';

      sections.forEach((sec) => {
        if (sec.offsetTop <= scrollPos) {
          currentId = sec.id;
        }
      });

      navLinks.forEach((link) => {
        if (link.closest('.hud-nav-links')) {
          link.classList.toggle('active', link.getAttribute('data-nav-section') === currentId);
        }
      });
    }, { passive: true });
  }

  /**
   * 6. CSRF-Protected Contact Form Dispatch Handler (Posts to clean /api/contact endpoint)
   */
  function initContactForm() {
    const form = document.getElementById('studio-contact-form');
    const feedback = document.getElementById('contact-form-feedback');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (document.getElementById('cf-name')?.value || '').trim();
      const email = (document.getElementById('cf-email')?.value || '').trim();
      const project = (document.getElementById('cf-project')?.value || 'Project Inquiry').trim();
      const message = (document.getElementById('cf-message')?.value || '').trim();
      const csrfToken = document.getElementById('cf-csrf-token')?.value || '';
      const websiteHp = document.getElementById('cf-website-hp')?.value || '';

      try {
        const res = await fetch('api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
          },
          body: JSON.stringify({
            csrf_token: csrfToken,
            website_hp: websiteHp,
            name,
            email,
            project,
            message
          })
        });
        const data = await res.json();
        if (feedback) {
          feedback.style.display = 'block';
          if (res.ok && data.ok) {
            feedback.textContent = `🔒 CSRF VERIFIED — ${data.summary}`;
          } else {
            feedback.textContent = `⚠️ ${data.error || 'Validation check failed.'}`;
            return;
          }
        }
      } catch (_) {
        if (feedback) {
          feedback.style.display = 'block';
          feedback.textContent = `✓ TRANSMISSION PREPARED FOR JOHN PAUL TUANGCO (@Jaypee1031) — Scope: ${project}`;
        }
      }

      const subject = encodeURIComponent(`[JAYPEE STUDIO] ${project} — from ${name}`);
      const body = encodeURIComponent(`Hi John Paul (@Jaypee1031),\n\nName: ${name}\nEmail: ${email}\nScope: ${project}\n\nMessage:\n${message}`);
      window.location.href = `mailto:jptuangco1031@gmail.com?subject=${subject}&body=${body}`;
    });
  }

  /**
   * 7. Playable Cyberpunk Neon Snake Arcade (Honoring Jaypee1031's `Snake` GitHub Repo!)
   */
  class CyberSnakeGame {
    constructor() {
      this.modal = document.getElementById('snake-modal-backdrop');
      this.canvas = document.getElementById('snake-canvas');
      this.scoreEl = document.getElementById('snake-score');
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d');
      this.gridSize = 20;
      this.tileCountX = Math.floor(this.canvas.width / this.gridSize);
      this.tileCountY = Math.floor(this.canvas.height / this.gridSize);
      this.timer = null;

      window.addEventListener('keydown', (e) => {
        if (!this.modal || !this.modal.classList.contains('open')) return;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
          e.preventDefault();
        }
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            if (this.dy === 0) { this.dx = 0; this.dy = -1; }
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            if (this.dy === 0) { this.dx = 0; this.dy = 1; }
            break;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            if (this.dx === 0) { this.dx = -1; this.dy = 0; }
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            if (this.dx === 0) { this.dx = 1; this.dy = 0; }
            break;
        }
      });

      const restartBtn = document.getElementById('btn-restart-snake');
      if (restartBtn) {
        restartBtn.addEventListener('click', () => this.reset());
      }
    }

    open() {
      if (!this.modal) return;
      this.modal.classList.add('open');
      this.reset();
    }

    stop() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }

    reset() {
      this.stop();
      this.snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
      ];
      this.dx = 1;
      this.dy = 0;
      this.score = 0;
      this.spawnFood();
      if (this.scoreEl) this.scoreEl.textContent = '0';
      this.timer = setInterval(() => this.step(), 95);
    }

    spawnFood() {
      this.food = {
        x: Math.floor(Math.random() * this.tileCountX),
        y: Math.floor(Math.random() * this.tileCountY)
      };
    }

    step() {
      const head = {
        x: (this.snake[0].x + this.dx + this.tileCountX) % this.tileCountX,
        y: (this.snake[0].y + this.dy + this.tileCountY) % this.tileCountY
      };

      // Self collision check
      if (this.snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
        this.reset();
        return;
      }

      this.snake.unshift(head);

      if (head.x === this.food.x && head.y === this.food.y) {
        this.score += 10;
        if (this.scoreEl) this.scoreEl.textContent = String(this.score);
        this.spawnFood();
      } else {
        this.snake.pop();
      }

      this.draw();
    }

    draw() {
      const ctx = this.ctx;
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Subtle grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      for (let x = 0; x < this.canvas.width; x += this.gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < this.canvas.height; y += this.gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.canvas.width, y);
        ctx.stroke();
      }

      // Draw Food
      ctx.fillStyle = '#ff2a54';
      ctx.shadowColor = '#ff2a54';
      ctx.shadowBlur = 12;
      ctx.fillRect(
        this.food.x * this.gridSize + 2,
        this.food.y * this.gridSize + 2,
        this.gridSize - 4,
        this.gridSize - 4
      );

      // Draw Snake
      this.snake.forEach((seg, idx) => {
        ctx.fillStyle = idx === 0 ? '#ffffff' : '#00f0ff';
        ctx.shadowColor = idx === 0 ? '#ffffff' : '#00f0ff';
        ctx.shadowBlur = idx === 0 ? 14 : 6;
        ctx.fillRect(
          seg.x * this.gridSize + 1,
          seg.y * this.gridSize + 1,
          this.gridSize - 2,
          this.gridSize - 2
        );
      });
      ctx.shadowBlur = 0;
    }
  }

  /**
   * 8. Playable 3D Rubik's Cube Matrix Modal (Honoring Jaypee1031's `rubicks_cube` Repo!)
   */
  class CyberRubikGame {
    constructor() {
      this.modal = document.getElementById('rubik-modal-backdrop');
      this.stageBox = document.getElementById('rubik-stage-box');
      this.moveEl = document.getElementById('rubik-move-count');
      this.timerEl = document.getElementById('rubik-timer');
      this.statusEl = document.getElementById('rubik-status');
      if (!this.modal || !this.stageBox || typeof THREE === 'undefined') return;

      this.initialized = false;
      this.active = false;
      this.isAnimating = false;
      this.cubies = [];
      this.moveHistory = [];
      this.moveCount = 0;
      this.startTime = Date.now();
      this.clockInterval = null;

      this.MOVE_MAP = {
        U: { axis: 'y', coord: 1, dir: -1 },
        D: { axis: 'y', coord: -1, dir: 1 },
        R: { axis: 'x', coord: 1, dir: -1 },
        L: { axis: 'x', coord: -1, dir: 1 },
        F: { axis: 'z', coord: 1, dir: -1 },
        B: { axis: 'z', coord: -1, dir: 1 }
      };

      this.bindControls();
    }

    initWebGL() {
      if (this.initialized) return;
      this.initialized = true;

      const w = this.stageBox.clientWidth || 600;
      const h = this.stageBox.clientHeight || 340;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 100);
      this.camera.position.set(5.2, 4.3, 6.2);
      this.camera.lookAt(0, 0, 0);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.stageBox.innerHTML = '';
      this.stageBox.appendChild(this.renderer.domElement);

      this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      const dLight = new THREE.DirectionalLight(0xffffff, 1.5);
      dLight.position.set(6, 10, 8);
      this.scene.add(dLight);

      this.cubeRoot = new THREE.Group();
      this.cubeRoot.rotation.set(0.15, -0.35, 0);
      this.scene.add(this.cubeRoot);

      // Drag Orbit Controls
      let dragging = false;
      let px = 0;
      let py = 0;

      this.stageBox.addEventListener('mousedown', (e) => {
        dragging = true;
        px = e.clientX;
        py = e.clientY;
      });
      window.addEventListener('mouseup', () => {
        dragging = false;
      });
      window.addEventListener('mousemove', (e) => {
        if (!dragging || !this.active) return;
        this.cubeRoot.rotation.y += (e.clientX - px) * 0.009;
        this.cubeRoot.rotation.x = Math.max(-1.2, Math.min(1.2, this.cubeRoot.rotation.x + (e.clientY - py) * 0.009));
        px = e.clientX;
        py = e.clientY;
      });

      this.createCubies();
      this.renderLoop();
    }

    createCubies() {
      if (!this.cubeRoot) return;
      this.cubies.forEach((c) => this.cubeRoot.remove(c));
      this.cubies = [];
      this.moveHistory = [];
      this.moveCount = 0;
      this.startTime = Date.now();
      if (this.moveEl) this.moveEl.textContent = '0';
      if (this.statusEl) this.statusEl.textContent = 'SOLVED';

      const FACE_COLORS = [0xff2a54, 0xff7a00, 0xffffff, 0xccff00, 0x00ff88, 0x00f0ff];
      const INNER_COLOR = 0x0a0a0f;
      const geo = new THREE.BoxGeometry(0.91, 0.91, 0.91);

      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            const mats = [
              new THREE.MeshStandardMaterial({ color: x === 1 ? FACE_COLORS[0] : INNER_COLOR, roughness: 0.18, metalness: 0.15 }),
              new THREE.MeshStandardMaterial({ color: x === -1 ? FACE_COLORS[1] : INNER_COLOR, roughness: 0.18, metalness: 0.15 }),
              new THREE.MeshStandardMaterial({ color: y === 1 ? FACE_COLORS[2] : INNER_COLOR, roughness: 0.18, metalness: 0.15 }),
              new THREE.MeshStandardMaterial({ color: y === -1 ? FACE_COLORS[3] : INNER_COLOR, roughness: 0.18, metalness: 0.15 }),
              new THREE.MeshStandardMaterial({ color: z === 1 ? FACE_COLORS[4] : INNER_COLOR, roughness: 0.18, metalness: 0.15 }),
              new THREE.MeshStandardMaterial({ color: z === -1 ? FACE_COLORS[5] : INNER_COLOR, roughness: 0.18, metalness: 0.15 })
            ];
            const mesh = new THREE.Mesh(geo, mats);
            mesh.position.set(x, y, z);
            this.cubeRoot.add(mesh);
            this.cubies.push(mesh);
          }
        }
      }
    }

    rotateLayer(axis, layerCoord, dir, recordMove = true, onDone = null) {
      if (this.isAnimating || !this.cubeRoot) return;
      this.isAnimating = true;

      const activeCubies = this.cubies.filter((c) => Math.round(c.position[axis]) === layerCoord);
      const pivot = new THREE.Group();
      this.cubeRoot.add(pivot);
      activeCubies.forEach((c) => pivot.attach(c));

      const targetAngle = (Math.PI / 2) * dir;
      const duration = 165;
      const t0 = performance.now();

      const stepAnim = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        const ease = 1 - Math.pow(1 - p, 3);
        pivot.rotation[axis] = targetAngle * ease;

        if (p < 1) {
          requestAnimationFrame(stepAnim);
        } else {
          pivot.updateMatrixWorld();
          activeCubies.forEach((c) => {
            this.cubeRoot.attach(c);
            c.position.set(
              Math.round(c.position.x),
              Math.round(c.position.y),
              Math.round(c.position.z)
            );
          });
          this.cubeRoot.remove(pivot);
          if (recordMove) {
            this.moveHistory.push({ axis, layerCoord, dir });
            this.moveCount++;
            if (this.moveEl) this.moveEl.textContent = String(this.moveCount);
            if (this.statusEl) this.statusEl.textContent = 'IN PLAY';
          }
          this.isAnimating = false;
          if (onDone) onDone();
        }
      };
      requestAnimationFrame(stepAnim);
    }

    bindControls() {
      document.querySelectorAll('[data-rubik-turn]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const m = this.MOVE_MAP[btn.getAttribute('data-rubik-turn')];
          if (m) this.rotateLayer(m.axis, m.coord, m.dir, true);
        });
      });

      window.addEventListener('keydown', (e) => {
        if (!this.active) return;
        const key = e.key.toUpperCase();
        if (this.MOVE_MAP[key]) {
          const m = this.MOVE_MAP[key];
          this.rotateLayer(m.axis, m.coord, m.dir, true);
        }
      });

      const scrambleBtn = document.getElementById('btn-rubik-scramble');
      if (scrambleBtn) {
        scrambleBtn.addEventListener('click', () => {
          if (this.isAnimating) return;
          const keys = Object.keys(this.MOVE_MAP);
          let steps = 12;
          const nextScramble = () => {
            if (steps <= 0) {
              if (this.statusEl) this.statusEl.textContent = 'SCRAMBLED';
              return;
            }
            steps--;
            const m = this.MOVE_MAP[keys[Math.floor(Math.random() * keys.length)]];
            const dir = Math.random() > 0.5 ? m.dir : -m.dir;
            this.rotateLayer(m.axis, m.coord, dir, true, nextScramble);
          };
          nextScramble();
        });
      }

      const solveBtn = document.getElementById('btn-rubik-solve');
      if (solveBtn) {
        solveBtn.addEventListener('click', () => {
          if (this.isAnimating || this.moveHistory.length === 0) return;
          if (this.statusEl) this.statusEl.textContent = 'SOLVING...';
          const nextSolve = () => {
            if (this.moveHistory.length === 0) {
              if (this.statusEl) this.statusEl.textContent = 'SOLVED!';
              return;
            }
            const last = this.moveHistory.pop();
            this.rotateLayer(last.axis, last.layerCoord, -last.dir, false, nextSolve);
          };
          nextSolve();
        });
      }

      const resetBtn = document.getElementById('btn-rubik-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (!this.isAnimating) this.createCubies();
        });
      }
    }

    open() {
      if (!this.modal) return;
      this.modal.classList.add('open');
      this.active = true;
      this.initWebGL();

      // Ensure canvas matches modal layout dimensions
      const w = this.stageBox.clientWidth || 600;
      const h = this.stageBox.clientHeight || 340;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);

      this.startTime = Date.now();
      if (this.clockInterval) clearInterval(this.clockInterval);
      this.clockInterval = setInterval(() => {
        const sec = Math.floor((Date.now() - this.startTime) / 1000);
        const m = String(Math.floor(sec / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        if (this.timerEl) this.timerEl.textContent = `${m}:${s}`;
      }, 1000);
    }

    stop() {
      this.active = false;
      if (this.clockInterval) {
        clearInterval(this.clockInterval);
        this.clockInterval = null;
      }
    }

    renderLoop() {
      requestAnimationFrame(() => this.renderLoop());
      if (!this.active || !this.renderer) return;
      this.renderer.render(this.scene, this.camera);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    initHudClock();
    initThemeEngine();
    init3DModeSwitcher();
    initSpatialInteractions();
    initCleanUrlNavigation();
    initContactForm();
    window.cyberSnakeGame = new CyberSnakeGame();
    window.cyberRubikGame = new CyberRubikGame();
  });
})();
