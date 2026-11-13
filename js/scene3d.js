/**
 * JAYPEE STUDIO // 3D WebGL Engine (Three.js)
 * Features:
 * 1. Anatomically Sculpted Glossy Obsidian Cyber-Bust with Studio Headphones
 *    & Chiaroscuro Rim Lighting (1:1 homage to reference image)
 * 2. Switchable 3D Sculptures:
 *    - [01] CYBER BUST (Reference Studio Android Bust + Headphones)
 *    - [02] RUBIK'S MATRIX (Tribute to Jaypee1031's rubicks_cube repository)
 *    - [03] ORBITAL CORE (Gyroscopic Quantum Reactor)
 *    - [04] DATA NEXUS (Topological Torus Knot & Code Satellites)
 * 3. Live Multi-Theme 3D Lighting & Specular Rim Synchronization
 * 4. Smooth Mouse Tracking, Drag Orbiting, and Scroll Camera Choreography
 */

(function () {
  'use strict';

  const THEME_LIGHT_PALETTES = {
    noir: {
      rimRight: 0xffffff,
      rimLeft: 0x3f3f46,
      foreheadSpot: 0xffffff,
      shoulderFill: 0x27272a,
      accentGlow: 0xffffff,
      headColor: 0x050507,
      shoulderColor: 0x08080b,
      particleColor: 0xffffff
    },
    crimson: {
      rimRight: 0xff2a54,
      rimLeft: 0xffffff,
      foreheadSpot: 0xffe4e8,
      shoulderFill: 0x4c0519,
      accentGlow: 0xff2a54,
      headColor: 0x060304,
      shoulderColor: 0x0a0507,
      particleColor: 0xff2a54
    },
    acid: {
      rimRight: 0xccff00,
      rimLeft: 0x00ff88,
      foreheadSpot: 0xf7fee7,
      shoulderFill: 0x14532d,
      accentGlow: 0xccff00,
      headColor: 0x030504,
      shoulderColor: 0x060a08,
      particleColor: 0xccff00
    },
    cobalt: {
      rimRight: 0x00f0ff,
      rimLeft: 0x3b82f6,
      foreheadSpot: 0xe0f2fe,
      shoulderFill: 0x0c4a6e,
      accentGlow: 0x00f0ff,
      headColor: 0x020408,
      shoulderColor: 0x050912,
      particleColor: 0x00f0ff
    },
    gold: {
      rimRight: 0xffb800,
      rimLeft: 0xfff3d1,
      foreheadSpot: 0xfffaeb,
      shoulderFill: 0x451a03,
      accentGlow: 0xffb800,
      headColor: 0x060503,
      shoulderColor: 0x0b0905,
      particleColor: 0xffb800
    },
    prism: {
      rimRight: 0x00f0ff,
      rimLeft: 0xe838f5,
      foreheadSpot: 0xffffff,
      shoulderFill: 0x3b0764,
      accentGlow: 0xe838f5,
      headColor: 0x050309,
      shoulderColor: 0x090510,
      particleColor: 0xe838f5
    },
    ivory: {
      rimRight: 0xffffff,
      rimLeft: 0xff2a54,
      foreheadSpot: 0xffffff,
      shoulderFill: 0x52525b,
      accentGlow: 0xff2a54,
      headColor: 0x09090c,
      shoulderColor: 0x121216,
      particleColor: 0x18181b
    }
  };

  class StudioScene3D {
    constructor() {
      this.container = document.getElementById('webgl-container');
      if (!this.container || typeof THREE === 'undefined') return;

      this.currentMode = 'bust';
      this.currentTheme = document.documentElement.getAttribute('data-theme') || 'noir';

      this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
      this.drag = { active: false, prevX: 0, prevY: 0, offsetRotY: 0, offsetRotX: 0 };
      this.scrollY = 0;
      this.clock = new THREE.Clock();

      this.models = {};
      this.accentMaterials = [];

      this.initScene();
      this.initLights();
      this.createProceduralEnvMap();
      this.buildCyberBust();
      this.buildRubiksMatrix();
      this.buildOrbitalCore();
      this.buildDataNexus();
      this.buildCosmicParticles();
      this.setMode('bust');
      this.applyThemePalette(this.currentTheme);
      this.bindEvents();
      this.animate();
    }

    initScene() {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;

      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
      this.camera.position.set(0, -0.15, 7.2);

      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.25;
      if ('outputColorSpace' in this.renderer) {
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      }

      this.container.innerHTML = '';
      this.container.appendChild(this.renderer.domElement);

      this.rootGroup = new THREE.Group();
      this.scene.add(this.rootGroup);
    }

    /**
     * Generates a high-contrast studio softbox environment reflection map
     * so the glossy obsidian visor head gets razor-sharp studio reflections
     * matching the reference image's forehead & cheek highlights.
     */
    createProceduralEnvMap() {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#020203';
      ctx.fillRect(0, 0, 512, 256);

      // Primary right-side vertical studio strip softbox (creates the sweeping right-cheek rim)
      const gradRight = ctx.createLinearGradient(320, 0, 430, 0);
      gradRight.addColorStop(0, 'rgba(255,255,255,0)');
      gradRight.addColorStop(0.5, 'rgba(255,255,255,0.98)');
      gradRight.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradRight;
      ctx.fillRect(310, 15, 130, 220);

      // Forehead oval studio softbox reflection
      const gradSpot = ctx.createRadialGradient(305, 72, 4, 305, 72, 34);
      gradSpot.addColorStop(0, 'rgba(255,255,255,1)');
      gradSpot.addColorStop(0.6, 'rgba(255,255,255,0.65)');
      gradSpot.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradSpot;
      ctx.beginPath();
      ctx.arc(305, 72, 36, 0, Math.PI * 2);
      ctx.fill();

      // Subtle left fill strip
      const gradLeft = ctx.createLinearGradient(90, 0, 150, 0);
      gradLeft.addColorStop(0, 'rgba(255,255,255,0)');
      gradLeft.addColorStop(0.5, 'rgba(180,180,195,0.22)');
      gradLeft.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradLeft;
      ctx.fillRect(85, 40, 70, 180);

      const texture = new THREE.CanvasTexture(canvas);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = texture;
    }

    initLights() {
      this.ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
      this.scene.add(this.ambientLight);

      // Intense Right-Side Rim Light (Creates the iconic stark white edge down the right side of the head)
      this.rimLightRight = new THREE.SpotLight(0xffffff, 18, 20, Math.PI * 0.28, 0.35, 1.2);
      this.rimLightRight.position.set(3.6, 0.75, 1.35);
      this.scene.add(this.rimLightRight);

      // Secondary Right-Back Grazing Rim Light for jaw/cheekbone contour
      this.grazingRimRight = new THREE.PointLight(0xffffff, 9, 12);
      this.grazingRimRight.position.set(2.4, -0.45, 0.4);
      this.scene.add(this.grazingRimRight);

      // Top-Right Forehead Specular Highlight Light (Matches the oval reflection on the forehead)
      this.foreheadLight = new THREE.DirectionalLight(0xffffff, 4.2);
      this.foreheadLight.position.set(1.25, 2.35, 2.9);
      this.scene.add(this.foreheadLight);

      // Left Subtle Rim / Chromatic Fill Light
      this.rimLightLeft = new THREE.SpotLight(0x52525b, 6.5, 18, Math.PI * 0.35, 0.6, 1.2);
      this.rimLightLeft.position.set(-3.8, 0.5, 1.2);
      this.scene.add(this.rimLightLeft);

      // Shoulder & Chest Top-Down Silhouette Fill Light
      this.shoulderLight = new THREE.PointLight(0x3f3f46, 4.5, 10);
      this.shoulderLight.position.set(0, 1.8, 2.2);
      this.scene.add(this.shoulderLight);
    }

    /**
     * MODEL 01: SCULPTED GLOSSY OBSIDIAN CYBER-BUST WITH STUDIO HEADPHONES
     * Built to match the exact silhouette, proportions, and specular reflections
     * of the reference image.
     */
    buildCyberBust() {
      const bustGroup = new THREE.Group();
      bustGroup.position.set(0, -0.58, 0);

      // 1. Glossy Obsidian Visor / Cranium Material
      this.headMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x040406,
        metalness: 0.22,
        roughness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        reflectivity: 1.0,
        envMapIntensity: 2.2
      });

      // 2. Satin Matte Charcoal-Black Skin Material for Neck & Muscular Shoulders
      this.shoulderMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x09090c,
        metalness: 0.12,
        roughness: 0.42,
        clearcoat: 0.28,
        clearcoatRoughness: 0.35,
        envMapIntensity: 0.9
      });

      // 3. Brushed Chrome & Gloss Black Headphone Materials
      const headphoneBodyMat = new THREE.MeshPhysicalMaterial({
        color: 0x060608,
        metalness: 0.65,
        roughness: 0.18,
        clearcoat: 0.9,
        envMapIntensity: 1.8
      });

      const chromeTrimMat = new THREE.MeshStandardMaterial({
        color: 0xe4e4e7,
        metalness: 0.95,
        roughness: 0.12
      });

      const accentRingMat = new THREE.MeshBasicMaterial({
        color: 0xffffff
      });
      this.accentMaterials.push(accentRingMat);

      // --- SCULPT THE ANATOMICAL FACIAL VISOR & CRANIUM ---
      const headGeo = new THREE.SphereGeometry(1.06, 96, 96);
      const pos = headGeo.attributes.position;
      const v = new THREE.Vector3();

      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);

        // Normalize coordinates
        const ny = v.y / 1.06; // -1 (chin) to +1 (crown)

        // Vertical elongation for sleek humanoid head
        v.y *= 1.34;

        // Taper lower half into defined jawline & narrow rounded chin
        if (ny < 0.15) {
          const t = Math.min(1, (0.15 - ny) / 1.15); // 0 at temple, 1 at bottom of chin
          const jawWidthScale = 1.0 - 0.36 * Math.pow(t, 1.35);
          v.x *= jawWidthScale;

          // Bring chin slightly forward and taper back of skull into neck
          if (v.z > 0) {
            v.z *= 1.0 - 0.18 * Math.pow(t, 1.7);
            // Subtle chin projection
            v.z += 0.06 * Math.sin(t * Math.PI) * Math.max(0, 1 - Math.abs(v.x) * 1.2);
          } else {
            // Occipital curve at back of skull
            v.z *= 1.0 - 0.42 * Math.pow(t, 1.2);
          }
        } else {
          // Slight cranium dome narrowing at very top
          const topT = (ny - 0.15) / 0.85;
          v.x *= 1.0 - 0.06 * Math.pow(topT, 2);
        }

        // Cheekbone & facial visor contour planes (enhances the sweeping right rim light!)
        if (v.z > 0.2 && ny > -0.65 && ny < 0.35) {
          const cheekZone = Math.exp(-Math.pow((ny + 0.12) * 2.8, 2));
          const sideFactor = Math.exp(-Math.pow((Math.abs(v.x) - 0.58) * 3.5, 2));
          v.z += 0.045 * cheekZone * sideFactor;
        }

        // Flatten temples slightly where headphones rest
        const earZone = Math.exp(-Math.pow(ny * 2.6, 2)) * Math.exp(-Math.pow(v.z * 2.0, 2));
        if (Math.abs(v.x) > 0.7) {
          v.x *= 1.0 - 0.06 * earZone;
        }

        pos.setXYZ(i, v.x, v.y, v.z);
      }
      headGeo.computeVertexNormals();

      this.headGroup = new THREE.Group();
      this.headGroup.position.set(0, 0.72, 0.15);

      const headMesh = new THREE.Mesh(headGeo, this.headMaterial);
      this.headGroup.add(headMesh);

      // --- SCULPT FUTURISTIC OVER-EAR STUDIO HEADPHONES (Left & Right) ---
      [-1, 1].forEach((side) => {
        const earGroup = new THREE.Group();
        earGroup.position.set(side * 1.01, -0.08, -0.02);
        earGroup.rotation.z = side * 0.08;

        // Cushion pad against temple
        const padGeo = new THREE.CylinderGeometry(0.42, 0.44, 0.16, 48);
        padGeo.rotateZ(Math.PI / 2);
        padGeo.scale(1, 1.28, 0.92);
        const padMesh = new THREE.Mesh(padGeo, this.shoulderMaterial);
        earGroup.add(padMesh);

        // Main outer metallic acoustic housing
        const cupGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.18, 48);
        cupGeo.rotateZ(Math.PI / 2);
        cupGeo.scale(1, 1.26, 0.9);
        const cupMesh = new THREE.Mesh(cupGeo, headphoneBodyMat);
        cupMesh.position.x = side * 0.11;
        earGroup.add(cupMesh);

        // Chrome Vertical Rim Accent (matches the white/silver vertical edge on the headphones in reference!)
        const rimRingGeo = new THREE.TorusGeometry(0.39, 0.018, 20, 64);
        rimRingGeo.rotateY(Math.PI / 2);
        rimRingGeo.scale(0.9, 1.25, 1);
        const rimRingMesh = new THREE.Mesh(rimRingGeo, chromeTrimMat);
        rimRingMesh.position.x = side * 0.19;
        earGroup.add(rimRingMesh);

        // Outer cap plate + accent glowing LED ring
        const capGeo = new THREE.CylinderGeometry(0.28, 0.34, 0.08, 48);
        capGeo.rotateZ(Math.PI / 2);
        capGeo.scale(1, 1.22, 0.88);
        const capMesh = new THREE.Mesh(capGeo, headphoneBodyMat);
        capMesh.position.x = side * 0.21;
        earGroup.add(capMesh);

        const ledRingGeo = new THREE.TorusGeometry(0.29, 0.009, 16, 48);
        ledRingGeo.rotateY(Math.PI / 2);
        ledRingGeo.scale(0.88, 1.2, 1);
        const ledRingMesh = new THREE.Mesh(ledRingGeo, accentRingMat);
        ledRingMesh.position.x = side * 0.25;
        earGroup.add(ledRingMesh);

        // Mechanical Yoke Bracket Bar
        const yokeGeo = new THREE.BoxGeometry(0.05, 0.62, 0.09);
        const yokeMesh = new THREE.Mesh(yokeGeo, chromeTrimMat);
        yokeMesh.position.set(side * 0.24, 0.04, 0);
        earGroup.add(yokeMesh);

        this.headGroup.add(earGroup);
      });

      bustGroup.add(this.headGroup);

      // --- SCULPT ANATOMICAL NECK, TRAPEZIUS & MUSCULAR SHOULDERS ---
      const torsoGeo = new THREE.CylinderGeometry(0.52, 2.55, 2.35, 96, 64, false);
      const tPos = torsoGeo.attributes.position;
      const tv = new THREE.Vector3();

      for (let i = 0; i < tPos.count; i++) {
        tv.fromBufferAttribute(tPos, i);
        // Cylinder height is 2.35 (-1.175 to +1.175)
        const u = (tv.y + 1.175) / 2.35; // 1 at top of neck, 0 at bottom of chest
        const angle = Math.atan2(tv.z, tv.x);

        // Smooth S-curve transition from cylindrical neck (u > 0.62) to broad trapezius & deltoids (u <= 0.62)
        let widthRadius;
        let depthRadius;

        if (u > 0.62) {
          // Neck column with subtle sternocleidomastoid contour
          const nt = (u - 0.62) / 0.38;
          widthRadius = 0.56 - 0.04 * nt;
          depthRadius = 0.52 - 0.04 * nt;
        } else {
          // Trapezius slope into broad rounded deltoid shoulders
          const st = (0.62 - u) / 0.62; // 0 at base of neck, 1 at bottom of bust
          const shoulderCurve = Math.sin(st * Math.PI * 0.58);
          widthRadius = 0.56 + 2.05 * Math.pow(shoulderCurve, 1.15);
          depthRadius = 0.52 + 0.58 * Math.pow(shoulderCurve, 1.3);
        }

        tv.x = Math.cos(angle) * widthRadius;
        tv.z = Math.sin(angle) * depthRadius;

        // Anatomical shoulder droop & collarbone / pectoral definition
        if (u < 0.65) {
          const lateralDist = Math.abs(tv.x) / 2.6;
          // Round down outer deltoids naturally like the reference silhouette
          tv.y -= 0.42 * Math.pow(lateralDist, 2.1);

          // Subtle pectoral & collarbone rise in front
          if (tv.z > 0) {
            tv.z += 0.14 * Math.sin((1 - u) * Math.PI) * Math.cos(lateralDist * Math.PI * 0.45);
          }
        }

        tPos.setXYZ(i, tv.x, tv.y, tv.z);
      }
      torsoGeo.computeVertexNormals();

      const torsoMesh = new THREE.Mesh(torsoGeo, this.shoulderMaterial);
      torsoMesh.position.set(0, -1.25, -0.08);
      bustGroup.add(torsoMesh);

      this.models.bust = bustGroup;
      this.rootGroup.add(bustGroup);
    }

    /**
     * MODEL 02: 3D RUBIK'S MATRIX (Tribute to Jaypee1031's `rubicks_cube` repo)
     */
    buildRubiksMatrix() {
      const rubikGroup = new THREE.Group();
      rubikGroup.position.set(0, -0.1, 0);
      this.rubikCubies = [];

      const cubeGeo = new THREE.BoxGeometry(0.56, 0.56, 0.56);
      const edgesGeo = new THREE.EdgesGeometry(cubeGeo);

      const coreMat = new THREE.MeshPhysicalMaterial({
        color: 0x060609,
        metalness: 0.4,
        roughness: 0.12,
        clearcoat: 1.0
      });

      const edgeMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.65
      });
      this.accentMaterials.push(edgeMat);

      const spacing = 0.64;
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            const cubie = new THREE.Group();
            const mesh = new THREE.Mesh(cubeGeo, coreMat);
            const wire = new THREE.LineSegments(edgesGeo, edgeMat);
            cubie.add(mesh);
            cubie.add(wire);

            cubie.position.set(x * spacing, y * spacing, z * spacing);
            cubie.userData = {
              basePos: new THREE.Vector3(x * spacing, y * spacing, z * spacing),
              grid: { x, y, z },
              phase: (x + y + z) * 0.7
            };
            this.rubikCubies.push(cubie);
            rubikGroup.add(cubie);
          }
        }
      }

      rubikGroup.rotation.set(0.45, 0.65, 0.15);
      rubikGroup.visible = false;
      this.models.rubik = rubikGroup;
      this.rootGroup.add(rubikGroup);
    }

    /**
     * MODEL 03: ORBITAL QUANTUM CORE
     */
    buildOrbitalCore() {
      const coreGroup = new THREE.Group();
      coreGroup.position.set(0, -0.1, 0);

      const icoGeo = new THREE.IcosahedronGeometry(0.92, 1);
      const icoMat = new THREE.MeshPhysicalMaterial({
        color: 0x07070b,
        metalness: 0.5,
        roughness: 0.08,
        clearcoat: 1.0,
        flatShading: true
      });
      this.orbitalCenterMesh = new THREE.Mesh(icoGeo, icoMat);
      coreGroup.add(this.orbitalCenterMesh);

      const wireMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.45
      });
      this.accentMaterials.push(wireMat);

      const outerWire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.12, 1), wireMat);
      coreGroup.add(outerWire);

      this.orbitalRings = [];
      const ringRadii = [1.45, 1.78, 2.12];
      ringRadii.forEach((r, idx) => {
        const ringGeo = new THREE.TorusGeometry(r, 0.018, 16, 100);
        const ringMesh = new THREE.Mesh(ringGeo, idx % 2 === 0 ? wireMat : icoMat);
        ringMesh.rotation.set(idx * 0.8, idx * 0.5, 0);
        this.orbitalRings.push(ringMesh);
        coreGroup.add(ringMesh);
      });

      coreGroup.visible = false;
      this.models.orbital = coreGroup;
      this.rootGroup.add(coreGroup);
    }

    /**
     * MODEL 04: TOPOLOGICAL DATA NEXUS
     */
    buildDataNexus() {
      const nexusGroup = new THREE.Group();
      nexusGroup.position.set(0, -0.1, 0);

      const knotGeo = new THREE.TorusKnotGeometry(0.95, 0.28, 180, 32, 2, 3);
      const knotMat = new THREE.MeshPhysicalMaterial({
        color: 0x060609,
        metalness: 0.45,
        roughness: 0.1,
        clearcoat: 1.0
      });
      this.nexusMesh = new THREE.Mesh(knotGeo, knotMat);
      nexusGroup.add(this.nexusMesh);

      const wireOverlayMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.18
      });
      this.accentMaterials.push(wireOverlayMat);

      const wireKnot = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.965, 0.285, 120, 16, 2, 3),
        wireOverlayMat
      );
      nexusGroup.add(wireKnot);

      nexusGroup.visible = false;
      this.models.nexus = nexusGroup;
      this.rootGroup.add(nexusGroup);
    }

    /**
     * COSMIC STARFIELD & FLOATING DUST PARTICLES
     */
    buildCosmicParticles() {
      const count = 240;
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 18;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1.5;
      }

      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      this.particleMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.032,
        transparent: true,
        opacity: 0.55
      });

      this.particles = new THREE.Points(geo, this.particleMat);
      this.scene.add(this.particles);
    }

    setMode(modeName) {
      if (!this.models[modeName]) return;
      this.currentMode = modeName;
      Object.keys(this.models).forEach((key) => {
        this.models[key].visible = key === modeName;
      });
      this.drag.offsetRotX = 0;
      this.drag.offsetRotY = 0;
    }

    applyThemePalette(themeName) {
      this.currentTheme = themeName;
      const palette = THEME_LIGHT_PALETTES[themeName] || THEME_LIGHT_PALETTES.noir;

      if (this.rimLightRight) this.rimLightRight.color.setHex(palette.rimRight);
      if (this.grazingRimRight) this.grazingRimRight.color.setHex(palette.rimRight);
      if (this.rimLightLeft) this.rimLightLeft.color.setHex(palette.rimLeft);
      if (this.foreheadLight) this.foreheadLight.color.setHex(palette.foreheadSpot);
      if (this.shoulderLight) this.shoulderLight.color.setHex(palette.shoulderFill);
      if (this.headMaterial) this.headMaterial.color.setHex(palette.headColor);
      if (this.shoulderMaterial) this.shoulderMaterial.color.setHex(palette.shoulderColor);
      if (this.particleMat) this.particleMat.color.setHex(palette.particleColor);

      this.accentMaterials.forEach((mat) => {
        mat.color.setHex(palette.accentGlow);
      });
    }

    bindEvents() {
      window.addEventListener('mousemove', (e) => {
        this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;

        if (this.drag.active) {
          const dx = e.clientX - this.drag.prevX;
          const dy = e.clientY - this.drag.prevY;
          this.drag.offsetRotY += dx * 0.008;
          this.drag.offsetRotX = Math.max(-0.5, Math.min(0.5, this.drag.offsetRotX + dy * 0.006));
          this.drag.prevX = e.clientX;
          this.drag.prevY = e.clientY;
        }
      });

      const stageZone = document.getElementById('hero-3d-stage');
      if (stageZone) {
        stageZone.addEventListener('mousedown', (e) => {
          this.drag.active = true;
          this.drag.prevX = e.clientX;
          this.drag.prevY = e.clientY;
        });
        stageZone.addEventListener('touchstart', (e) => {
          if (e.touches.length === 1) {
            this.drag.active = true;
            this.drag.prevX = e.touches[0].clientX;
            this.drag.prevY = e.touches[0].clientY;
          }
        }, { passive: true });
      }

      window.addEventListener('mouseup', () => {
        this.drag.active = false;
      });
      window.addEventListener('touchend', () => {
        this.drag.active = false;
      });
      window.addEventListener('touchmove', (e) => {
        if (this.drag.active && e.touches.length === 1) {
          const dx = e.touches[0].clientX - this.drag.prevX;
          const dy = e.touches[0].clientY - this.drag.prevY;
          this.drag.offsetRotY += dx * 0.008;
          this.drag.offsetRotX = Math.max(-0.5, Math.min(0.5, this.drag.offsetRotX + dy * 0.006));
          this.drag.prevX = e.touches[0].clientX;
          this.drag.prevY = e.touches[0].clientY;
        }
      }, { passive: true });

      window.addEventListener('scroll', () => {
        this.scrollY = window.scrollY || window.pageYOffset;
      }, { passive: true });

      window.addEventListener('resize', () => {
        if (!this.container) return;
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      });
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      const t = this.clock.getElapsedTime();

      // Smooth mouse damping
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.06;
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.06;

      // Scroll-driven subtle parallax & atmosphere transition
      const vh = window.innerHeight || 900;
      const scrollRatio = Math.min(1.5, this.scrollY / vh);

      // Keep the bust centered in hero, gently drift & scale down as user scrolls into content sections
      this.rootGroup.position.y = scrollRatio * 0.55;
      this.rootGroup.position.z = -scrollRatio * 1.65;

      // Animate active 3D sculpture
      if (this.currentMode === 'bust' && this.models.bust) {
        // Subtle autonomous breathing + head tracking cursor
        const breath = Math.sin(t * 1.6) * 0.025;
        this.models.bust.position.y = -0.58 + breath;

        if (this.headGroup) {
          const targetHeadY = this.mouse.x * 0.38 + this.drag.offsetRotY + Math.sin(t * 0.7) * 0.06;
          const targetHeadX = -this.mouse.y * 0.22 + this.drag.offsetRotX + 0.06;
          this.headGroup.rotation.y += (targetHeadY - this.headGroup.rotation.y) * 0.08;
          this.headGroup.rotation.x += (targetHeadX - this.headGroup.rotation.x) * 0.08;
          this.headGroup.rotation.z = -this.mouse.x * 0.06;
        }
        // Subtle torso follow
        this.models.bust.rotation.y = this.mouse.x * 0.12 + this.drag.offsetRotY * 0.35;
      } else if (this.currentMode === 'rubik' && this.models.rubik) {
        this.models.rubik.rotation.y = t * 0.35 + this.mouse.x * 0.5 + this.drag.offsetRotY;
        this.models.rubik.rotation.x = 0.4 + Math.sin(t * 0.5) * 0.2 - this.mouse.y * 0.4 + this.drag.offsetRotX;

        // Breathing expansion of the 27 Rubik's cubies
        const pulse = 1 + Math.max(0, Math.sin(t * 1.8)) * 0.14;
        this.rubikCubies.forEach((cubie) => {
          cubie.position.copy(cubie.userData.basePos).multiplyScalar(pulse);
        });
      } else if (this.currentMode === 'orbital' && this.models.orbital) {
        this.models.orbital.rotation.y = t * 0.25 + this.mouse.x * 0.5 + this.drag.offsetRotY;
        this.models.orbital.rotation.x = -this.mouse.y * 0.35 + this.drag.offsetRotX;
        if (this.orbitalCenterMesh) {
          this.orbitalCenterMesh.rotation.y = -t * 0.6;
          this.orbitalCenterMesh.rotation.z = t * 0.4;
        }
        this.orbitalRings.forEach((ring, i) => {
          ring.rotation.x += 0.008 * (i + 1);
          ring.rotation.y += 0.006 * (i % 2 === 0 ? 1 : -1);
        });
      } else if (this.currentMode === 'nexus' && this.models.nexus) {
        this.models.nexus.rotation.y = t * 0.4 + this.mouse.x * 0.5 + this.drag.offsetRotY;
        this.models.nexus.rotation.x = t * 0.2 - this.mouse.y * 0.4 + this.drag.offsetRotX;
      }

      // Dynamic rim light subtle movement with cursor
      if (this.rimLightRight) {
        this.rimLightRight.position.x = 3.6 + this.mouse.x * 0.45;
        this.rimLightRight.position.y = 0.75 + this.mouse.y * 0.35;
      }

      // Cosmic dust gentle drift
      if (this.particles) {
        this.particles.rotation.y = t * 0.02 + this.mouse.x * 0.05;
        this.particles.rotation.x = -this.mouse.y * 0.04;
      }

      this.renderer.render(this.scene, this.camera);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.studioScene3D = new StudioScene3D();
  });
})();
