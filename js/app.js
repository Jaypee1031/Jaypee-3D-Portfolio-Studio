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
   * 5. Navigation Active Spy
   */
  function initScrollSpy() {
    const links = document.querySelectorAll('.hud-nav-links a[href^="#"]');
    const sections = Array.from(links)
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);

    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + 240;
      let currentId = 'home';

      sections.forEach((sec) => {
        if (sec.offsetTop <= scrollPos) {
          currentId = sec.id;
        }
      });

      links.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
      });
    }, { passive: true });
  }

  /**
   * 6. Contact Form Direct Dispatch Handler
   */
  function initContactForm() {
    const form = document.getElementById('studio-contact-form');
    const feedback = document.getElementById('contact-form-feedback');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (document.getElementById('cf-name')?.value || 'Visitor').trim();
      const email = (document.getElementById('cf-email')?.value || '').trim();
      const project = (document.getElementById('cf-project')?.value || 'Project Inquiry').trim();
      const message = (document.getElementById('cf-message')?.value || '').trim();

      if (feedback) {
        feedback.style.display = 'block';
        feedback.innerHTML = `✓ TRANSMISSION PREPARED FOR JOHN PAUL TUANGCO (@Jaypee1031) — Ready to connect regarding <strong>${project}</strong>.`;
      }

      // Also open mailto or copy summary smoothly
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

  window.addEventListener('DOMContentLoaded', () => {
    initHudClock();
    initThemeEngine();
    init3DModeSwitcher();
    initSpatialInteractions();
    initScrollSpy();
    initContactForm();
    window.cyberSnakeGame = new CyberSnakeGame();
  });
})();
