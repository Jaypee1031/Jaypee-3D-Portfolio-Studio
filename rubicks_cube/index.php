<?php
declare(strict_types=1);

/**
 * 3D RUBIK'S CUBE STUDIO // JOHN PAUL TUANGCO (@Jaypee1031)
 * Interactive Three.js WebGL 3x3x3 Rubik's Cube Solver & Simulator
 * Secured PHP Front-Controller with Extensionless Clean URL Support
 */

@ini_set('display_errors', '0');
@header_remove('X-Powered-By');
header('X-Frame-Options: SAMEORIGIN');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Redirect /index.php to clean extensionless directory URL
$reqUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($reqUri, PHP_URL_PATH) ?: '/';
if (preg_match('#^(.*?)/index\.(php|html?)$#i', $path, $m)) {
    $clean = ($m[1] === '') ? '/' : $m[1] . '/';
    header('Location: ' . $clean, true, 301);
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>3D RUBIK'S CUBE STUDIO — John Paul Tuangco (@Jaypee1031)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&amp;family=Space+Grotesk:wght@400;600;700&amp;family=Teko:wght@700&amp;display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #040406;
      color: #ffffff;
      font-family: 'Space Grotesk', sans-serif;
      overflow: hidden;
      height: 100vh;
      width: 100vw;
      user-select: none;
    }
    #canvas-wrap {
      position: fixed;
      inset: 12px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 14px;
      overflow: hidden;
      background: radial-gradient(circle at 50% 50%, #101018 0%, #030305 100%);
    }
    .hud-top {
      position: fixed;
      top: 28px;
      left: 36px;
      right: 36px;
      z-index: 20;
      display: flex;
      justify-content: space-between;
      align-items: center;
      pointer-events: none;
    }
    .brand {
      pointer-events: auto;
    }
    .brand h1 {
      font-family: 'Teko', sans-serif;
      font-size: 2.6rem;
      line-height: 0.9;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .brand span {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.55);
    }
    .stats-bar {
      pointer-events: auto;
      display: flex;
      gap: 16px;
      background: rgba(10, 10, 14, 0.78);
      border: 1px solid rgba(255, 255, 255, 0.16);
      padding: 10px 18px;
      border-radius: 999px;
      backdrop-filter: blur(12px);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
    }
    .stats-bar strong {
      color: #00f0ff;
    }
    .controls-dock {
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 20;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      background: rgba(10, 10, 14, 0.82);
      border: 1px solid rgba(255, 255, 255, 0.18);
      padding: 14px 22px;
      border-radius: 16px;
      backdrop-filter: blur(16px);
    }
    .face-btns, .action-btns {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }
    button {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.74rem;
      padding: 8px 13px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    button:hover {
      background: #ffffff;
      color: #040406;
      border-color: #ffffff;
    }
    button.primary {
      background: #00f0ff;
      color: #040406;
      border-color: #00f0ff;
      font-weight: 600;
    }
    button.accent {
      background: #ff2a54;
      color: #ffffff;
      border-color: #ff2a54;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div id="canvas-wrap"></div>

  <header class="hud-top">
    <div class="brand">
      <h1>3D RUBIK'S CUBE MATRIX</h1>
      <span>JOHN PAUL TUANGCO // @JAYPEE1031</span>
    </div>
    <div class="stats-bar">
      <span>MOVES: <strong id="move-count">0</strong></span>
      <span>TIME: <strong id="timer-readout">00:00</strong></span>
      <span>STATUS: <strong id="cube-status">SOLVED</strong></span>
    </div>
  </header>

  <aside class="controls-dock">
    <div class="face-btns">
      <button type="button" data-turn="U">U (Top)</button>
      <button type="button" data-turn="D">D (Bottom)</button>
      <button type="button" data-turn="L">L (Left)</button>
      <button type="button" data-turn="R">R (Right)</button>
      <button type="button" data-turn="F">F (Front)</button>
      <button type="button" data-turn="B">B (Back)</button>
    </div>
    <div class="action-btns">
      <button type="button" id="btn-scramble" class="accent">🔀 SCRAMBLE CUBE</button>
      <button type="button" id="btn-solve" class="primary">⚡ AUTO-SOLVE</button>
      <button type="button" id="btn-reset">↺ RESET</button>
    </div>
  </aside>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script>
    (function () {
      const wrap = document.getElementById('canvas-wrap');
      const moveEl = document.getElementById('move-count');
      const timerEl = document.getElementById('timer-readout');
      const statusEl = document.getElementById('cube-status');

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
      camera.position.set(5.2, 4.4, 6.2);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      wrap.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
      dirLight.position.set(6, 10, 8);
      scene.add(dirLight);

      const cubeRoot = new THREE.Group();
      scene.add(cubeRoot);

      // Standard Cyber Rubik Colors: Right(Red), Left(Orange), Top(White), Bottom(Yellow), Front(Green), Back(Blue)
      const FACE_COLORS = [0xff2a54, 0xff7a00, 0xffffff, 0xccff00, 0x00ff88, 0x00f0ff];
      const INNER_COLOR = 0x0a0a0f;

      let cubies = [];
      let moveHistory = [];
      let moveCount = 0;
      let isAnimating = false;
      let startTime = Date.now();

      function createCubies() {
        cubies.forEach((c) => cubeRoot.remove(c));
        cubies = [];
        moveHistory = [];
        moveCount = 0;
        moveEl.textContent = '0';
        statusEl.textContent = 'SOLVED';
        startTime = Date.now();

        const geo = new THREE.BoxGeometry(0.92, 0.92, 0.92);

        for (let x = -1; x <= 1; x++) {
          for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
              const mats = [
                new THREE.MeshStandardMaterial({ color: x === 1 ? FACE_COLORS[0] : INNER_COLOR, roughness: 0.2, metalness: 0.15 }),
                new THREE.MeshStandardMaterial({ color: x === -1 ? FACE_COLORS[1] : INNER_COLOR, roughness: 0.2, metalness: 0.15 }),
                new THREE.MeshStandardMaterial({ color: y === 1 ? FACE_COLORS[2] : INNER_COLOR, roughness: 0.2, metalness: 0.15 }),
                new THREE.MeshStandardMaterial({ color: y === -1 ? FACE_COLORS[3] : INNER_COLOR, roughness: 0.2, metalness: 0.15 }),
                new THREE.MeshStandardMaterial({ color: z === 1 ? FACE_COLORS[4] : INNER_COLOR, roughness: 0.2, metalness: 0.15 }),
                new THREE.MeshStandardMaterial({ color: z === -1 ? FACE_COLORS[5] : INNER_COLOR, roughness: 0.2, metalness: 0.15 })
              ];
              const mesh = new THREE.Mesh(geo, mats);
              mesh.position.set(x, y, z);
              cubeRoot.add(mesh);
              cubies.push(mesh);
            }
          }
        }
      }

      function rotateLayer(axis, layerCoord, dir, recordMove = true, onDone = null) {
        if (isAnimating) return;
        isAnimating = true;

        const active = cubies.filter((c) => Math.round(c.position[axis]) === layerCoord);
        const pivot = new THREE.Group();
        cubeRoot.add(pivot);
        active.forEach((c) => pivot.attach(c));

        const targetAngle = (Math.PI / 2) * dir;
        const duration = 170;
        const t0 = performance.now();

        function stepAnim(now) {
          const p = Math.min(1, (now - t0) / duration);
          const ease = 1 - Math.pow(1 - p, 3);
          pivot.rotation[axis] = targetAngle * ease;

          if (p < 1) {
            requestAnimationFrame(stepAnim);
          } else {
            pivot.updateMatrixWorld();
            active.forEach((c) => {
              cubeRoot.attach(c);
              c.position.set(
                Math.round(c.position.x),
                Math.round(c.position.y),
                Math.round(c.position.z)
              );
            });
            cubeRoot.remove(pivot);
            if (recordMove) {
              moveHistory.push({ axis, layerCoord, dir });
              moveCount++;
              moveEl.textContent = String(moveCount);
              statusEl.textContent = 'IN PLAY';
            }
            isAnimating = false;
            if (onDone) onDone();
          }
        }
        requestAnimationFrame(stepAnim);
      }

      const MOVE_MAP = {
        U: { axis: 'y', coord: 1, dir: -1 },
        D: { axis: 'y', coord: -1, dir: 1 },
        R: { axis: 'x', coord: 1, dir: -1 },
        L: { axis: 'x', coord: -1, dir: 1 },
        F: { axis: 'z', coord: 1, dir: -1 },
        B: { axis: 'z', coord: -1, dir: 1 }
      };

      document.querySelectorAll('[data-turn]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const m = MOVE_MAP[btn.getAttribute('data-turn')];
          if (m) rotateLayer(m.axis, m.coord, m.dir, true);
        });
      });

      document.getElementById('btn-scramble').addEventListener('click', () => {
        if (isAnimating) return;
        const keys = Object.keys(MOVE_MAP);
        let steps = 14;
        function nextScramble() {
          if (steps <= 0) {
            statusEl.textContent = 'SCRAMBLED';
            return;
          }
          steps--;
          const m = MOVE_MAP[keys[Math.floor(Math.random() * keys.length)]];
          const dir = Math.random() > 0.5 ? m.dir : -m.dir;
          rotateLayer(m.axis, m.coord, dir, true, nextScramble);
        }
        nextScramble();
      });

      document.getElementById('btn-solve').addEventListener('click', () => {
        if (isAnimating || moveHistory.length === 0) return;
        statusEl.textContent = 'SOLVING...';
        function nextSolve() {
          if (moveHistory.length === 0) {
            statusEl.textContent = 'SOLVED!';
            return;
          }
          const last = moveHistory.pop();
          rotateLayer(last.axis, last.layerCoord, -last.dir, false, nextSolve);
        }
        nextSolve();
      });

      document.getElementById('btn-reset').addEventListener('click', () => {
        if (!isAnimating) createCubies();
      });

      // Drag Orbit Camera
      let dragging = false, px = 0, py = 0;
      wrap.addEventListener('mousedown', (e) => { dragging = true; px = e.clientX; py = e.clientY; });
      window.addEventListener('mouseup', () => { dragging = false; });
      window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        cubeRoot.rotation.y += (e.clientX - px) * 0.008;
        cubeRoot.rotation.x = Math.max(-1.2, Math.min(1.2, cubeRoot.rotation.x + (e.clientY - py) * 0.008));
        px = e.clientX;
        py = e.clientY;
      });

      setInterval(() => {
        const sec = Math.floor((Date.now() - startTime) / 1000);
        const m = String(Math.floor(sec / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        timerEl.textContent = `${m}:${s}`;
      }, 1000);

      window.addEventListener('resize', () => {
        camera.aspect = wrap.clientWidth / wrap.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      });

      createCubies();

      function animate() {
        requestAnimationFrame(animate);
        if (!dragging && !isAnimating) {
          cubeRoot.rotation.y += 0.0025;
        }
        renderer.render(scene, camera);
      }
      animate();
    })();
  </script>
</body>
</html>
