<?php
declare(strict_types=1);

/**
 * JAYPEE STUDIO // Main PHP Front Controller & Extensionless Clean Router
 * Author: John Paul Tuangco (@Jaypee1031)
 * Security: CSP Nonce, CSRF Token, WAF Input Guard, Rate Limiting & Extensionless URLs
 */

// Allow PHP Built-in Web Server (php -S) to serve static CSS/JS assets cleanly
if (PHP_SAPI === 'cli-server') {
    $reqPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $fullFile = __DIR__ . $reqPath;
    if ($reqPath !== '/' && is_file($fullFile) && !preg_match('/\.(php|html?)$/i', $reqPath)) {
        return false;
    }
}

require_once __DIR__ . '/includes/security.php';

// 1. Strip any .php or .html from the URL bar immediately via 301 redirect
enforce_clean_extensionless_url();

// 2. Run Web Application Firewall (WAF) check on incoming request
run_waf_request_guard();

// 3. Determine clean route path relative to project base directory
$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
$basePath = ($scriptDir === '/' || $scriptDir === '.') ? '' : rtrim($scriptDir, '/');

$route = $requestUri;
if ($basePath !== '' && strpos($requestUri, $basePath) === 0) {
    $route = substr($requestUri, strlen($basePath));
}
$route = '/' . ltrim($route, '/');
$routeKey = rtrim($route, '/') ?: '/';

// ============================================================================
// EXTENSIONLESS API ROUTES (/api/github-sync & /api/contact)
// ============================================================================

if ($routeKey === '/rubicks-cube' || $routeKey === '/rubicks_cube') {
    require __DIR__ . '/rubicks_cube/index.php';
    exit;
}

if ($routeKey === '/api/visitors') {
    if (!check_rate_limit('visitors_heartbeat', 120, 60)) {
        http_response_code(429);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'Rate limit exceeded']);
        exit;
    }
    require __DIR__ . '/api/visitors-tracker.php';
    exit;
}

if ($routeKey === '/api/github-sync') {
    if (!check_rate_limit('github_sync', 60, 60)) {
        http_response_code(429);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Rate limit exceeded. Please wait a moment.']);
        exit;
    }
    define('JAYPEE_INTERNAL_ROUTED', true);
    require __DIR__ . '/api/github-proxy.php';
    exit;
}

if ($routeKey === '/api/contact' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json; charset=utf-8');

    if (!check_rate_limit('contact_form', 6, 60)) {
        http_response_code(429);
        echo json_encode(['ok' => false, 'error' => 'Too many transmissions. Please wait 60 seconds.']);
        exit;
    }

    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput ?: '{}', true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    // Anti-Bot Honeypot Check
    if (!empty($payload['website_hp'])) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Bot activity blocked.']);
        exit;
    }

    // Verify Cryptographic CSRF Token
    $submittedCsrf = (string)($payload['csrf_token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''));
    if (!verify_csrf_token($submittedCsrf)) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Invalid security CSRF token. Please refresh the page.']);
        exit;
    }

    $senderName = clean_input((string)($payload['name'] ?? ''), 120);
    $senderEmail = filter_var(trim((string)($payload['email'] ?? '')), FILTER_VALIDATE_EMAIL);
    $projectScope = clean_input((string)($payload['project'] ?? ''), 160);
    $messageBody = clean_input((string)($payload['message'] ?? ''), 2000);

    if ($senderName === '' || !$senderEmail || $messageBody === '') {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'Please provide a valid name, email, and project brief.']);
        exit;
    }

    echo json_encode([
        'ok' => true,
        'timestamp' => gmdate('c'),
        'recipient' => 'John Paul Tuangco (@Jaypee1031)',
        'summary' => "Secured transmission verified for {$senderName} ({$projectScope})."
    ]);
    exit;
}

// ============================================================================
// EXTENSIONLESS PAGE ROUTES (/, /home, /works, /creations, /about, /services, /contacts)
// ============================================================================
$validSections = [
    '/' => 'home',
    '/home' => 'home',
    '/works' => 'works',
    '/creations' => 'creations',
    '/about' => 'about',
    '/services' => 'services',
    '/contacts' => 'contacts'
];

$initialSection = $validSections[strtolower($routeKey)] ?? 'home';

// Generate per-request cryptographic CSP Nonce & CSRF Token
$cspNonce = base64_encode(random_bytes(16));
$csrfToken = get_csrf_token();
send_security_headers($cspNonce);

// Compute clean base href so assets resolve whether accessed at / or /works
$baseHref = ($basePath === '' ? '/' : $basePath . '/');
?>
<!DOCTYPE html>
<html lang="en" data-theme="noir" data-initial-section="<?= htmlspecialchars($initialSection, ENT_QUOTES, 'UTF-8') ?>" data-base-path="<?= htmlspecialchars($baseHref, ENT_QUOTES, 'UTF-8') ?>">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <base href="<?= htmlspecialchars($baseHref, ENT_QUOTES, 'UTF-8') ?>" />
  <meta name="csrf-token" content="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>" />
  <title>JAYPEE STUDIO — John Paul Tuangco (@Jaypee1031) | 3D Full-Stack &amp; Flutter Portfolio</title>
  <meta name="description" content="Interactive 3D Portfolio &amp; Live GitHub Studio of John Paul Tuangco (@Jaypee1031) — Full-Stack Developer, Flutter Architect &amp; Creative Technologist." />

  <!-- Google Fonts: Ultra-Condensed Monumental Display (Teko, Six Caps, Anton) + Technical Sans & Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Anton&amp;family=JetBrains+Mono:wght@300;400;500;600&amp;family=Six+Caps&amp;family=Space+Grotesk:wght@300;400;500;600;700&amp;family=Teko:wght@600;700&amp;display=swap" rel="stylesheet" />

  <!-- Studio Stylesheet -->
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>

  <!-- Fixed Corner Crosshairs (+) Matching Reference HUD Frame -->
  <div class="hud-cross tl">+</div>
  <div class="hud-cross tr">+</div>
  <div class="hud-cross bl">+</div>
  <div class="hud-cross br">+</div>

  <!-- Fixed 3D WebGL Scene Container (Sits at z-index: 5 — in front of giant hero display text, behind UI cards) -->
  <div id="webgl-container" aria-hidden="true"></div>
  <div class="atmosphere-overlay" aria-hidden="true"></div>

  <!-- Top Notched HUD Header Bar (1:1 Reference Geometry + Clean Extensionless Routes) -->
  <header class="hud-header">
    <div class="hud-top-bar">
      <!-- Top-Left Coordinates & GitHub Live Sync Indicator -->
      <div class="hud-telemetry-left">
        <span><strong class="loc-city">ISABELA, PH</strong> &nbsp; 16° 40' 19.2000" N &nbsp; 121° 27' 25.2000" E</span>
        <a href="https://github.com/Jaypee1031" target="_blank" rel="noopener" class="gh-live-pill" title="Connected to GitHub @Jaypee1031">
          <span class="pulse-dot"></span>
          <span id="gh-sync-status-text">GH://JAYPEE1031 • 24 REPOS LIVE</span>
        </a>
      </div>

      <!-- Top-Center Trapezoidal Notched Navigation Cradle (Clean Extensionless Links — No .php or .html) -->
      <nav class="hud-nav-cradle" aria-label="Primary Navigation">
        <div class="notch-top-line-left"></div>
        <div class="notch-wing-left"></div>
        <ul class="hud-nav-links">
          <li><a href="home" data-nav-section="home" class="active">Home</a></li>
          <li><a href="works" data-nav-section="works">Works</a></li>
          <li><a href="creations" data-nav-section="creations">Creations</a></li>
          <li><a href="about" data-nav-section="about">About</a></li>
          <li><a href="services" data-nav-section="services">Services</a></li>
          <li><a href="contacts" data-nav-section="contacts">Contacts</a></li>
        </ul>
        <div class="notch-wing-right"></div>
        <div class="notch-top-line-right"></div>
      </nav>

      <!-- Top-Right Live Local Time Readout, Real-Time Visitors Pill & Security Shield Badge -->
      <div class="hud-telemetry-right">
        <button type="button" id="hud-visitors-btn" class="gh-live-pill" data-open-visitors="true" title="Click to open Real-Time Visitor Telemetry Radar">
          <span class="pulse-dot"></span>
          <span id="hud-visitors-text">1 ONLINE • LIVE</span>
        </button>
        <span class="gh-live-pill" title="CSP Nonce + CSRF Token + WAF Shield + Extensionless Routing Active">
          🛡️ SECURED
        </span>
        <span id="hud-live-clock">Local time: 14:45:00 (2:45 PM)</span>
      </div>
    </div>
  </header>

  <!-- Floating Bottom Theme & 3D Sculpture Control Dock -->
  <aside class="studio-control-dock" aria-label="Theme and 3D Scene Controls">
    <div class="dock-group">
      <span class="dock-label">THEME (<span id="active-theme-label">NOIR B&amp;W</span>):</span>
      <button type="button" class="theme-swatch active" data-set-theme="noir" title="Noir Monochrome (Black &amp; White Reference)"></button>
      <button type="button" class="theme-swatch" data-set-theme="crimson" title="Cyber Crimson (Black &amp; White + Electric Red)"></button>
      <button type="button" class="theme-swatch" data-set-theme="acid" title="Acid Volt (Black &amp; White + Cyber Lime)"></button>
      <button type="button" class="theme-swatch" data-set-theme="cobalt" title="Quantum Cobalt (Black &amp; White + Cyan)"></button>
      <button type="button" class="theme-swatch" data-set-theme="gold" title="Solar Gold (Black &amp; White + Liquid Gold)"></button>
      <button type="button" class="theme-swatch" data-set-theme="prism" title="Cyber Prism (Magenta + Cyan Synth)"></button>
      <button type="button" class="theme-swatch" data-set-theme="ivory" title="Stark Ivory (Daylight White &amp; Black)"></button>
    </div>
    <div class="dock-divider"></div>
    <div class="dock-group">
      <span class="dock-label">3D RIG:</span>
      <button type="button" class="model-btn active" data-3d-mode="bust">01 BUST</button>
      <button type="button" class="model-btn" data-3d-mode="rubik">02 RUBIK</button>
      <button type="button" class="model-btn" data-3d-mode="orbital">03 ORBITAL</button>
      <button type="button" class="model-btn" data-3d-mode="nexus">04 NEXUS</button>
    </div>
  </aside>

  <!-- Outer Framed Studio Shell -->
  <div class="studio-shell">
    <main class="hud-frame">

      <!-- ====================================================================
           SECTION 01 // HERO ("JAYPEE STUDIO" — EXACT REFERENCE ARCHITECTURE)
           ==================================================================== -->
      <section id="home" class="hero-section">
        <div>
          <div class="hero-monument-wrap">
            <svg class="hero-monument-svg" viewBox="0 0 1600 400" preserveAspectRatio="none" role="img" aria-label="JAYPEE STUDIO">
              <text
                x="800"
                y="368"
                text-anchor="middle"
                font-size="455"
                textLength="1575"
                lengthAdjust="spacingAndGlyphs"
              >JAYPEE STUDIO</text>
            </svg>
          </div>

          <div class="hero-title-meta-row">
            <div class="hero-since-block">
              <div>since</div>
              <div>
                <span class="year-indent">2024</span>
                <span class="dot-marker">•</span>
              </div>
            </div>

            <div class="hero-staggered-tagline">
              <span class="line-1">CREATING</span>
              <span class="line-2">MEMORABLE</span>
              <span class="line-3">DIGITAL</span>
              <span class="line-4">EXPERIENCES</span>
            </div>
          </div>
        </div>

        <!-- Center Interactive 3D Drag/Orbit Zone over the Sculpted Cyber-Bust -->
        <div id="hero-3d-stage" class="hero-3d-stage-zone" title="Drag to rotate 3D sculpture • Press T to switch color themes">
          <span class="stage-hint-pill">DRAG TO ORBIT 3D SCULPTURE • PRESS [T] FOR COLOR THEMES</span>
        </div>

        <!-- Bottom Left Role Typography & Bottom Right Glowing Spherical "CONTACT" Orb -->
        <div class="hero-bottom-bar">
          <div class="hero-bottom-left">
            <h1 class="hero-role-stack">
              CREATIVE<br />
              <span class="accent-word">FULL-STACK</span><br />
              DEV STUDIO
            </h1>
            <div class="hero-sub-identity">
              <span class="identity-tag">JOHN PAUL TUANGCO</span>
              <span class="identity-tag">@JAYPEE1031</span>
              <span class="identity-tag">FLUTTER • REACT • PHP • 3D</span>
            </div>
          </div>

          <div class="orb-cta-wrap">
            <a href="contacts" data-nav-section="contacts" id="hero-orb-cta" class="orb-cta-btn">
              <span>CONTACT</span>
              <span class="orb-cta-sub">INITIATE ↗</span>
            </a>
          </div>
        </div>
      </section>

      <!-- ====================================================================
           FOREGROUND CONTENT LAYER (z-index: 20)
           ==================================================================== -->
      <div class="content-layer">
        <div class="section-divider"></div>

        <!-- ==================================================================
             SECTION 02 // FEATURED WORKS & ARCHITECTURAL CREATIONS
             ================================================================== -->
        <section id="works" class="studio-section">
          <div class="section-header">
            <div>
              <div class="section-index">01 // FLAGSHIP ARCHITECTURES</div>
              <h2 class="section-title">SELECTED WORKS &amp; SYSTEMS</h2>
            </div>
            <p class="section-desc">
              Production full-stack platforms, cross-platform Flutter mobile &amp; desktop ecosystems, municipal analytics portals, and interactive 3D/CV experiments engineered by <strong>John Paul Tuangco (@Jaypee1031)</strong>.
            </p>
          </div>

          <!-- Live GitHub Telemetry Counters -->
          <div class="telemetry-strip">
            <div class="telemetry-card">
              <div class="telemetry-value" id="stat-repo-count">24<span>+</span></div>
              <div class="telemetry-label">Public GitHub Repositories</div>
              <div class="telemetry-sub" id="stat-sync-source">Connected to github.com/Jaypee1031</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-value" id="stat-total-volume">281.4<span>MB</span></div>
              <div class="telemetry-label">Total Codebase Footprint</div>
              <div class="telemetry-sub" id="stat-latest-push">Auto-synced with latest commits</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-value">5<span>×</span></div>
              <div class="telemetry-label">Core Engineering Domains</div>
              <div class="telemetry-sub">Flutter • Full-Stack MVC • Three.js 3D • CV • Civic Tech</div>
            </div>
            <div class="telemetry-card" data-open-visitors="true" style="cursor:pointer;" title="Click to inspect Live Visitor Radar">
              <div class="telemetry-value"><span id="stat-live-online" style="color:var(--status-online);">1</span><span> ONLINE</span></div>
              <div class="telemetry-label">Real-Time Active Visitors</div>
              <div class="telemetry-sub" id="stat-total-visits">Syncing live visitor telemetry...</div>
            </div>
          </div>

          <!-- Flagship Featured Creations Grid -->
          <div class="featured-grid">

            <!-- 1. FLAGSHIP: GuideSched & Appointment in Guidance Ecosystem -->
            <article class="creation-card flagship">
              <div>
                <div class="creation-top-meta">
                  <span>01 // DUAL-PLATFORM ECOSYSTEM (WEB + MOBILE + DESKTOP)</span>
                  <span class="creation-badge">FLUTTER 3.47 + PHP 8 API</span>
                </div>
                <h3 class="creation-title">GUIDESCHED — COUNSELING &amp; SCHEDULING SYSTEM</h3>
                <div class="creation-subtitle">Appointment-in-Guidance • GuideSched-App • Appointment-in-Guidance-App</div>
                <p class="creation-desc">
                  A comprehensive guidance counseling appointment and scheduling platform engineered for <strong>Cagasat High School</strong>. Built with a unified multi-role architecture (<strong>Student, Guidance Counselor &amp; Principal</strong>) across a full-featured <strong>PHP 8 Web Portal</strong> and a cross-platform <strong>Flutter 3.47 / Dart 3.13 Mobile &amp; Desktop Application</strong>.
                </p>
                <ul class="creation-highlights">
                  <li>Cross-Platform Flutter Mobile, Desktop &amp; Web App</li>
                  <li>RESTful `/api/v2/` Backend with Smart Concern Suggestion</li>
                  <li>Student, Counselor &amp; Principal Multi-Role Dashboards</li>
                  <li>Real-Time Urgent Notifications, Handover &amp; Analytics</li>
                </ul>
                <div class="tech-stack-row">
                  <span class="tech-pill">Flutter 3.47.2</span>
                  <span class="tech-pill">Dart 3.13.2</span>
                  <span class="tech-pill">PHP 8.x REST API</span>
                  <span class="tech-pill">MySQL / MariaDB</span>
                  <span class="tech-pill">JavaScript</span>
                </div>
                <div class="creation-actions">
                  <a href="https://github.com/Jaypee1031/Appointment-in-Guidance" target="_blank" rel="noopener" class="btn-hud primary">APPOINTMENT IN GUIDANCE V2 ↗</a>
                  <a href="https://github.com/Jaypee1031/GuideSched-App" target="_blank" rel="noopener" class="btn-hud">GUIDESCHED-APP (FLUTTER) ↗</a>
                  <a href="https://github.com/Jaypee1031/Appointment-in-Guidance-App" target="_blank" rel="noopener" class="btn-hud">FULL SUITE REPO ↗</a>
                  <button type="button" class="btn-hud" data-inspect-repo="guidesched">📄 LIVE README</button>
                </div>
              </div>

              <div class="creation-visual-preview">
                <div class="arch-terminal-header">
                  <span>SYS_ARCH // GUIDESCHED_V3.47</span>
                  <span style="color:var(--accent-primary);">● ONLINE</span>
                </div>
                <div class="arch-diagram-nodes">
                  <div class="arch-node">
                    <strong>FLUTTER CLIENT</strong>
                    <span>Dart 3.13 • Mobile &amp; Desktop</span>
                  </div>
                  <div class="arch-node" style="border-color:var(--accent-primary);">
                    <strong>PHP 8 REST API</strong>
                    <span>Unified /api/v2 • Auth &amp; Sync</span>
                  </div>
                  <div class="arch-node">
                    <strong>MYSQL / MARIADB</strong>
                    <span>Relational Counseling Schema</span>
                  </div>
                </div>
                <div style="font-family:'JetBrains Mono',monospace;font-size:0.72rem;line-height:1.6;color:rgba(255,255,255,0.72);background:rgba(255,255,255,0.03);padding:14px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);">
                  <div>&gt; ROLES: [Student] ⇄ [Counselor] ⇄ [Principal]</div>
                  <div>&gt; DESIGN: Emerald &amp; Forest Green Calming UI System</div>
                  <div>&gt; DEPLOYMENT: Cagasat High School Guidance Office</div>
                </div>
              </div>
            </article>

            <!-- 2. Smart Brew & Car Wash -->
            <article class="creation-card">
              <div>
                <div class="creation-top-meta">
                  <span>02 // COMMERCIAL FULL-STACK SYSTEM</span>
                  <span class="creation-badge">REACT 18 + JWT + PHP</span>
                </div>
                <h3 class="creation-title">SMART BREW &amp; CAR WASH MANAGEMENT</h3>
                <div class="creation-subtitle">github.com/Jaypee1031/Smart-Brew-and-Car-Wash---Full-stack-caf-management-system</div>
                <p class="creation-desc">
                  Full-stack commercial web application for a café and car wash business in <strong>Cordon, Isabela, Philippines</strong>. Combines a reactive <strong>React 18 &amp; TailwindCSS</strong> storefront with a secure <strong>PHP 8 + MySQL</strong> backend protected by <strong>JWT authentication</strong> and <strong>bcrypt</strong> password hashing.
                </p>
                <ul class="creation-highlights">
                  <li>JWT Authentication &amp; bcrypt Security</li>
                  <li>Multi-Category Menu &amp; Add-On Customizer</li>
                  <li>Real-Time Order Pipeline &amp; Status Tracking</li>
                  <li>Admin Revenue, Customer &amp; Inventory Dashboard</li>
                </ul>
                <div class="tech-stack-row">
                  <span class="tech-pill">React 18</span>
                  <span class="tech-pill">TailwindCSS</span>
                  <span class="tech-pill">PHP 8+</span>
                  <span class="tech-pill">MySQL</span>
                  <span class="tech-pill">JWT Auth</span>
                  <span class="tech-pill">bcrypt</span>
                </div>
              </div>
              <div class="creation-actions">
                <a href="https://github.com/Jaypee1031/Smart-Brew-and-Car-Wash---Full-stack-caf-management-system" target="_blank" rel="noopener" class="btn-hud primary">OPEN GITHUB REPO ↗</a>
                <button type="button" class="btn-hud" data-inspect-repo="Smart-Brew-and-Car-Wash---Full-stack-caf-management-system">📄 LIVE README</button>
              </div>
            </article>

            <!-- 3. University Admission Portal V2 & V1 -->
            <article class="creation-card">
              <div>
                <div class="creation-top-meta">
                  <span>03 // HIGHER-EDUCATION ENTERPRISE PORTAL</span>
                  <span class="creation-badge">PHP MVC + OMR + F1-A/F2 PDF</span>
                </div>
                <h3 class="creation-title">QSU UNIVERSITY ADMISSION PORTAL V2</h3>
                <div class="creation-subtitle">Admission-Portal-V2-Update &amp; admission-portal</div>
                <p class="creation-desc">
                  End-to-end university admission and applicant management system for <strong>Quirino State University (QSU)</strong> allowing Freshman and Transferee students to register, upload credentials, complete assessment questionnaires, schedule exam permits, and generate official <strong>F1-A/F2 format PDFs</strong>.
                </p>
                <ul class="creation-highlights">
                  <li>Automated Official F1-A &amp; F2 PDF Claim Stubs</li>
                  <li>OMR Exam Scanner &amp; Test Result Analytics</li>
                  <li>AI Assistant Chat Widget &amp; Path Obfuscation Security</li>
                  <li>Admin Document Verification &amp; Slot Scheduling</li>
                </ul>
                <div class="tech-stack-row">
                  <span class="tech-pill">PHP 8 MVC</span>
                  <span class="tech-pill">MySQL</span>
                  <span class="tech-pill">TCPDF</span>
                  <span class="tech-pill">OMR Scanner</span>
                  <span class="tech-pill">AI Chat Widget</span>
                </div>
              </div>
              <div class="creation-actions">
                <a href="https://github.com/Jaypee1031/Admission-Portal-V2-Update" target="_blank" rel="noopener" class="btn-hud primary">ADMISSION PORTAL V2 REPO ↗</a>
                <a href="https://github.com/Jaypee1031/admission-portal" target="_blank" rel="noopener" class="btn-hud">V1 PORTAL REPO ↗</a>
                <button type="button" class="btn-hud" data-inspect-repo="Admission-Portal-V2-Update">📄 LIVE README</button>
              </div>
            </article>

            <!-- 4. Cordon Municipal Incident & Rescue Analytics Platform -->
            <article class="creation-card">
              <div>
                <div class="creation-top-meta">
                  <span>04 // MUNICIPAL CIVIC-TECH &amp; ANALYTICS</span>
                  <span class="creation-badge">OTP + CHART.JS + PHP</span>
                </div>
                <h3 class="creation-title">CORDON RESCUE &amp; MUNICIPAL INCIDENT SYSTEM</h3>
                <div class="creation-subtitle">github.com/Jaypee1031/cordon &amp; /Cordon-Rescue</div>
                <p class="creation-desc">
                  Emergency incident reporting, rescue dispatch, and statistical intelligence system built for the <strong>Municipality of Cordon, Isabela</strong>. Features OTP-verified citizen incident submissions, photo uploads, purok/barangay mapping, and multi-horizon analytics.
                </p>
                <ul class="creation-highlights">
                  <li>OTP-Verified Citizen Accident &amp; Emergency Reports</li>
                  <li>Barangay, Weekly, Monthly &amp; Quarterly Chart.js Analytics</li>
                  <li>Dedicated Staff, User &amp; Admin Dashboards</li>
                  <li>Automated Municipal PDF Report Export</li>
                </ul>
                <div class="tech-stack-row">
                  <span class="tech-pill">PHP</span>
                  <span class="tech-pill">MySQL</span>
                  <span class="tech-pill">Chart.js</span>
                  <span class="tech-pill">OTP Verification</span>
                  <span class="tech-pill">PDF Maker</span>
                </div>
              </div>
              <div class="creation-actions">
                <a href="https://github.com/Jaypee1031/cordon" target="_blank" rel="noopener" class="btn-hud primary">CORDON ANALYTICS ↗</a>
                <a href="https://github.com/Jaypee1031/Cordon-Rescue" target="_blank" rel="noopener" class="btn-hud">CORDON RESCUE ↗</a>
              </div>
            </article>

            <!-- 5. HOLO HAND v3.0 — Webcam Hand-Tracking & Mystic 3D HUD -->
            <article class="creation-card">
              <div>
                <div class="creation-top-meta">
                  <span>05 // COMPUTER VISION &amp; HOLOGRAPHIC 3D HUD</span>
                  <span class="creation-badge">WEBCAM HAND TRACKING + WEBGL</span>
                </div>
                <h3 class="creation-title">HOLO HAND V3.0 — MYSTIC HOLOGRAPHIC SUITE</h3>
                <div class="creation-subtitle">github.com/Jaypee1031/3D-Hand-Holo</div>
                <p class="creation-desc">
                  Real-time webcam computer-vision hand-tracking and holographic Doctor Strange mystic spell/HUD interface built with <strong>HTML5 Canvas, WebGL Shaders, and JavaScript</strong>. Tracks finger landmarks in real time to cast interactive geometric mandalas, energy shields, and futuristic HUD controls.
                </p>
                <ul class="creation-highlights">
                  <li>Real-Time Webcam Hand Landmark Tracking</li>
                  <li>Interactive Holographic &amp; Mystic Mandala Shaders</li>
                  <li>Multi-Color Neon Cyberpunk HUD Modes</li>
                  <li>60FPS GPU-Accelerated Canvas Particle Engine</li>
                </ul>
                <div class="tech-stack-row">
                  <span class="tech-pill">Hand Tracking CV</span>
                  <span class="tech-pill">HTML5 Canvas</span>
                  <span class="tech-pill">WebGL Shaders</span>
                  <span class="tech-pill">Orbitron HUD</span>
                </div>
              </div>
              <div class="creation-actions">
                <a href="https://github.com/Jaypee1031/3D-Hand-Holo" target="_blank" rel="noopener" class="btn-hud primary">OPEN 3D-HAND-HOLO REPO ↗</a>
                <button type="button" class="btn-hud" data-inspect-repo="3D-Hand-Holo">📄 LIVE README</button>
              </div>
            </article>

            <!-- 6. QSU OSAS Ecosystem: Scholarship MVC, Digital Logbook Kiosk & Student Council 3D -->
            <article class="creation-card">
              <div>
                <div class="creation-top-meta">
                  <span>06 // QUIRINO STATE UNIVERSITY (QSU) DIGITAL SUITE</span>
                  <span class="creation-badge">PHP 8 MVC + THREE.JS + KIOSK</span>
                </div>
                <h3 class="creation-title">QSU SCHOLARSHIP, OSAS LOGBOOK &amp; 3D STUDENT COUNCIL</h3>
                <div class="creation-subtitle">Scholarship-Management-System • Log-Book-OSAS • Student-Council-Portal</div>
                <p class="creation-desc">
                  A suite of institutional platforms engineered for <strong>Quirino State University (QSU)</strong>: an <strong>Academic &amp; Service Scholarship MVC Portal</strong> with TCPDF generation, a full-screen <strong>OSAS Walk-In Digital Logbook Kiosk</strong> with audit trails, and a <strong>Three.js + PHP 8 Supreme Student Council 3D Portal</strong>.
                </p>
                <ul class="creation-highlights">
                  <li>Custom PHP 8 MVC Scholarship Router &amp; TCPDF Engine</li>
                  <li>OSAS Walk-In Touch Kiosk, Audit Logs &amp; CSV Export</li>
                  <li>Three.js r187 + esbuild 3D Student Council Hub &amp; CMS</li>
                  <li>Multi-Campus Support (Diffun • Cabarroguis • Maddela)</li>
                </ul>
                <div class="tech-stack-row">
                  <span class="tech-pill">PHP 8 MVC</span>
                  <span class="tech-pill">Three.js r187</span>
                  <span class="tech-pill">TCPDF</span>
                  <span class="tech-pill">PDO MySQL</span>
                  <span class="tech-pill">esbuild</span>
                </div>
              </div>
              <div class="creation-actions">
                <a href="https://github.com/Jaypee1031/Scholarship-Management-System" target="_blank" rel="noopener" class="btn-hud primary">SCHOLARSHIP REPO ↗</a>
                <a href="https://github.com/Jaypee1031/Log-Book-OSAS" target="_blank" rel="noopener" class="btn-hud">OSAS LOGBOOK ↗</a>
                <a href="https://github.com/Jaypee1031/Student-Council-Portal" target="_blank" rel="noopener" class="btn-hud">STUDENT COUNCIL 3D ↗</a>
              </div>
            </article>

            <!-- 7. DTC — QR Code Attendance, Foot Traffic & Training System -->
            <article class="creation-card">
              <div>
                <div class="creation-top-meta">
                  <span>07 // DIGITAL TRANSFORMATION CENTER (DTC)</span>
                  <span class="creation-badge">QR SCANNER + FOOT TRAFFIC + PHP</span>
                </div>
                <h3 class="creation-title">DTC QR ATTENDANCE &amp; FOOT TRAFFIC SYSTEM</h3>
                <div class="creation-subtitle">github.com/Jaypee1031/DTC &amp; /DTC-PROJECT</div>
                <p class="creation-desc">
                  Comprehensive <strong>Digital Transformation Center (DTC)</strong> platform featuring real-time <strong>QR Code Attendance Scanning</strong> (`scan_qr.php`, `qr_in.php`), <strong>Foot Traffic Monitoring</strong> (`Dtc_foot_traffic.php`), event attendance logs, and training submission workflows across Admin, Staff, and User dashboards.
                </p>
                <ul class="creation-highlights">
                  <li>Real-Time QR Code Check-In &amp; Event Attendance</li>
                  <li>Facility Foot Traffic Tracking &amp; Telemetry</li>
                  <li>Training Program Submission &amp; Approval Pipeline</li>
                  <li>Role-Based Admin, Staff &amp; User Dashboards</li>
                </ul>
                <div class="tech-stack-row">
                  <span class="tech-pill">PHP 8</span>
                  <span class="tech-pill">MySQL (salunat_dtc)</span>
                  <span class="tech-pill">QR Scanner</span>
                  <span class="tech-pill">Foot Traffic Analytics</span>
                </div>
              </div>
              <div class="creation-actions">
                <a href="https://github.com/Jaypee1031/DTC" target="_blank" rel="noopener" class="btn-hud primary">OPEN DTC REPO ↗</a>
                <a href="https://github.com/Jaypee1031/DTC-PROJECT" target="_blank" rel="noopener" class="btn-hud">DTC-PROJECT ↗</a>
                <button type="button" class="btn-hud" data-inspect-repo="DTC">📄 LIVE README</button>
              </div>
            </article>

            <!-- 8. Cyberpunk Neon Snake & Interactive 3D / Canvas Lab -->
            <article class="creation-card">
              <div>
                <div class="creation-top-meta">
                  <span>08 // CREATIVE CODING &amp; INTERACTIVE ARCADE</span>
                  <span class="creation-badge">PLAYABLE LIVE IN BROWSER</span>
                </div>
                <h3 class="creation-title">CYBERPUNK SNAKE, 3D RUBIK'S MATRIX &amp; MOSAIC LAB</h3>
                <div class="creation-subtitle">github.com/Jaypee1031/Snake • /rubicks_cube • /mosiac</div>
                <p class="creation-desc">
                  A collection of interactive frontend experiments, including a <strong>Neon Cyberpunk Snake Arcade Game</strong> built with HTML5 Canvas and vanilla JavaScript, a <strong>3D Rubik’s Cube</strong> matrix experiment, and a typographic <strong>Photo Mosaic</strong> renderer.
                </p>
                <div class="tech-stack-row">
                  <span class="tech-pill">HTML5 Canvas</span>
                  <span class="tech-pill">Vanilla JS</span>
                  <span class="tech-pill">3D WebGL</span>
                  <span class="tech-pill">CSS3 Shaders</span>
                </div>
              </div>
              <div class="creation-actions">
                <button type="button" class="btn-hud primary" data-open-snake="true">🎮 PLAY CYBERPUNK SNAKE LIVE</button>
                <button type="button" class="btn-hud primary" data-open-rubik="true">🧊 PLAY 3D RUBIK'S CUBE LIVE</button>
                <a href="https://github.com/Jaypee1031/rubicks_cube" target="_blank" rel="noopener" class="btn-hud">RUBIK'S REPO ↗</a>
                <a href="https://github.com/Jaypee1031/Snake" target="_blank" rel="noopener" class="btn-hud">SNAKE REPO ↗</a>
                <a href="https://github.com/Jaypee1031/mosiac" target="_blank" rel="noopener" class="btn-hud">MOSAIC REPO ↗</a>
              </div>
            </article>

          </div>

          <!-- Dynamic Container for Brand-New Repos Pushed to GitHub in the Future -->
          <div id="dynamic-new-creations" class="featured-grid" style="margin-top:24px;"></div>
        </section>

        <div class="section-divider"></div>

        <!-- ==================================================================
             SECTION 03 // LIVE GITHUB AUTO-SYNC MATRIX (ALL REPOSITORIES)
             ================================================================== -->
        <section id="creations" class="studio-section">
          <div class="section-header">
            <div>
              <div class="section-index">02 // AUTO-UPDATING GITHUB MATRIX</div>
              <h2 class="section-title">LIVE GITHUB REPOSITORIES</h2>
            </div>
            <p class="section-desc">
              Directly wired to <strong><a href="https://github.com/Jaypee1031" target="_blank" rel="noopener" style="color:var(--accent-primary);">github.com/Jaypee1031</a></strong> via our extensionless <code>/api/github-sync</code> endpoint. New repositories pushed to GitHub automatically appear here.
            </p>
          </div>

          <div class="lang-distribution-box">
            <div style="display:flex;justify-content:space-between;align-items:center;font-family:'JetBrains Mono',monospace;font-size:0.74rem;">
              <span>MULTI-REPOSITORY LANGUAGE &amp; ARCHITECTURE TELEMETRY</span>
              <span id="repo-visible-count" style="color:var(--accent-primary);">LOADING REPOSITORIES...</span>
            </div>
            <div id="lang-bar-track" class="lang-bar-track"></div>
            <div id="lang-legend" class="lang-legend"></div>
          </div>

          <div class="gh-control-bar">
            <div class="gh-filter-tabs">
              <button type="button" class="gh-filter-btn active" data-gh-filter="all">ALL REPOS</button>
              <button type="button" class="gh-filter-btn" data-gh-filter="fullstack">FULL-STACK</button>
              <button type="button" class="gh-filter-btn" data-gh-filter="mobile">FLUTTER / MOBILE</button>
              <button type="button" class="gh-filter-btn" data-gh-filter="system">ENTERPRISE / CIVIC</button>
              <button type="button" class="gh-filter-btn" data-gh-filter="creative">CREATIVE / 3D / GAMES</button>
            </div>

            <div class="gh-search-wrap">
              <input
                type="search"
                id="gh-repo-search"
                class="gh-search-input"
                placeholder="Search Jaypee1031 repos by name, tech, or keyword..."
                aria-label="Search GitHub repositories"
              />
              <button type="button" id="btn-force-sync" class="btn-hud" style="white-space:nowrap;">
                ↻ FORCE GITHUB SYNC
              </button>
            </div>
          </div>

          <div id="repo-auto-grid" class="repo-auto-grid"></div>
        </section>

        <div class="section-divider"></div>

        <!-- ==================================================================
             SECTION 04 // ABOUT JOHN PAUL TUANGCO & SKILL MATRIX
             ================================================================== -->
        <section id="about" class="studio-section">
          <div class="section-header">
            <div>
              <div class="section-index">03 // ARCHITECT DOSSIER</div>
              <h2 class="section-title">ABOUT JOHN PAUL TUANGCO</h2>
            </div>
            <p class="section-desc">
              Full-Stack Developer, Flutter Cross-Platform Engineer &amp; Creative Technologist building production systems for institutions, universities, municipalities, and modern businesses.
            </p>
          </div>

          <div class="about-grid">
            <div class="architect-dossier">
              <div class="dossier-header">
                <img
                  id="dossier-avatar-img"
                  src="https://avatars.githubusercontent.com/u/167046025?v=4"
                  alt="John Paul Tuangco (@Jaypee1031)"
                  class="dossier-avatar"
                />
                <div>
                  <h3 class="dossier-name">JOHN PAUL TUANGCO</h3>
                  <div class="dossier-handle">@Jaypee1031 // Fungus101</div>
                </div>
              </div>

              <p class="dossier-bio">
                Based in <strong>Cordon, Isabela, Philippines</strong>, I design and engineer complete digital ecosystems—from cross-platform <strong>Flutter &amp; Dart</strong> mobile/desktop applications and <strong>Three.js / React 18</strong> web frontends to hardened <strong>PHP 8 MVC &amp; MySQL</strong> enterprise backends.
              </p>
              <p class="dossier-bio" style="margin-bottom:28px;">
                My portfolio spans <strong>24+ public repositories</strong> including Quirino State University (QSU) admission, scholarship &amp; OSAS kiosk systems, Cagasat High School guidance counseling platforms (<em>GuideSched</em>), Cordon municipal emergency analytics, real-time webcam hand-tracking 3D HUDs (<em>HOLO HAND v3.0</em>), and commercial management portals.
              </p>

              <div class="dossier-kv-grid">
                <div class="kv-item">
                  <span>LOCATION</span>
                  <strong>Cordon, Isabela, PH</strong>
                </div>
                <div class="kv-item">
                  <span>GITHUB HANDLE</span>
                  <strong>github.com/Jaypee1031</strong>
                </div>
                <div class="kv-item">
                  <span>PRIMARY FOCUS</span>
                  <strong>Full-Stack MVC, Flutter &amp; 3D Web</strong>
                </div>
                <div class="kv-item">
                  <span>SECURITY ARCHITECTURE</span>
                  <strong style="color:var(--accent-primary);">CSP • CSRF • WAF • Clean URLs</strong>
                </div>
              </div>
            </div>

            <div class="skills-matrix-grid">
              <div class="skill-domain-card">
                <div class="skill-domain-title">
                  <h4>FLUTTER &amp; MOBILE</h4>
                  <span>01</span>
                </div>
                <div class="skill-bar-list">
                  <div class="skill-bar-item">
                    <div class="skill-bar-top"><span>Flutter 3.x (Mobile/Desktop/Web)</span><span>95%</span></div>
                    <div class="skill-bar-rail"><div class="skill-bar-fill" style="width:95%"></div></div>
                  </div>
                  <div class="skill-bar-item">
                    <div class="skill-bar-top"><span>Dart 3 &amp; Multi-Role State</span><span>92%</span></div>
                    <div class="skill-bar-rail"><div class="skill-bar-fill" style="width:92%"></div></div>
                  </div>
                  <div class="skill-bar-item">
                    <div class="skill-bar-top"><span>REST API v2 Client Sync</span><span>94%</span></div>
                    <div class="skill-bar-rail"><div class="skill-bar-fill" style="width:94%"></div></div>
                  </div>
                </div>
              </div>

              <div class="skill-domain-card">
                <div class="skill-domain-title">
                  <h4>FRONTEND &amp; 3D WEB</h4>
                  <span>02</span>
                </div>
                <div class="skill-bar-list">
                  <div class="skill-bar-item">
                    <div class="skill-bar-top"><span>JavaScript (ES6+) &amp; React 18</span><span>94%</span></div>
                    <div class="skill-bar-rail"><div class="skill-bar-fill" style="width:94%"></div></div>
                  </div>
                  <div class="skill-bar-item">
                    <div class="skill-bar-top"><span>Three.js / WebGL &amp; Hand-Tracking CV</span><span>90%</span></div>
                    <div class="skill-bar-rail"><div class="skill-bar-fill" style="width:90%"></div></div>
                  </div>
                  <div class="skill-bar-item">
                    <div class="skill-bar-top"><span>TailwindCSS / Bootstrap / CSS3</span><span>96%</span></div>
                    <div class="skill-bar-rail"><div class="skill-bar-fill" style="width:96%"></div></div>
                  </div>
                </div>
              </div>

              <div class="skill-domain-card">
                <div class="skill-domain-title">
                  <h4>BACKEND &amp; SECURITY</h4>
                  <span>03</span>
                </div>
                <div class="skill-bar-list">
                  <div class="skill-bar-item">
                    <div class="skill-bar-top"><span>PHP 8+ MVC &amp; Clean Routing</span><span>96%</span></div>
                    <div class="skill-bar-rail"><div class="skill-bar-fill" style="width:96%"></div></div>
                  </div>
                  <div class="skill-bar-item">
                    <div class="skill-bar-top"><span>JWT, CSRF, CSP, OTP &amp; bcrypt</span><span>94%</span></div>
                    <div class="skill-bar-rail"><div class="skill-bar-fill" style="width:94%"></div></div>
                  </div>
                  <div class="skill-bar-item">
                    <div class="skill-bar-top"><span>TCPDF / F1-A Automated PDFs</span><span>95%</span></div>
                    <div class="skill-bar-rail"><div class="skill-bar-fill" style="width:95%"></div></div>
                  </div>
                </div>
              </div>

              <div class="skill-domain-card">
                <div class="skill-domain-title">
                  <h4>DATA &amp; ANALYTICS</h4>
                  <span>04</span>
                </div>
                <div class="skill-bar-list">
                  <div class="skill-bar-item">
                    <div class="skill-bar-top"><span>MySQL / MariaDB / PDO</span><span>95%</span></div>
                    <div class="skill-bar-rail"><div class="skill-bar-fill" style="width:95%"></div></div>
                  </div>
                  <div class="skill-bar-item">
                    <div class="skill-bar-top"><span>Chart.js, OMR &amp; Audit Trails</span><span>93%</span></div>
                    <div class="skill-bar-rail"><div class="skill-bar-fill" style="width:93%"></div></div>
                  </div>
                  <div class="skill-bar-item">
                    <div class="skill-bar-top"><span>Git, GitHub API &amp; esbuild</span><span>94%</span></div>
                    <div class="skill-bar-rail"><div class="skill-bar-fill" style="width:94%"></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div class="section-divider"></div>

        <!-- ==================================================================
             SECTION 05 // STUDIO SERVICES & CAPABILITIES
             ================================================================== -->
        <section id="services" class="studio-section">
          <div class="section-header">
            <div>
              <div class="section-index">04 // STUDIO DISCIPLINES</div>
              <h2 class="section-title">WHAT I ARCHITECT &amp; BUILD</h2>
            </div>
            <p class="section-desc">
              End-to-end software engineering from hardened PHP MVC backends and MySQL schemas to cross-platform Flutter apps and 3D WebGL interfaces.
            </p>
          </div>

          <div class="services-grid">
            <div class="service-card">
              <div>
                <div class="service-num">01 // ENTERPRISE &amp; UNIVERSITY PORTALS</div>
                <h3 class="service-title">FULL-STACK MVC &amp; MANAGEMENT SYSTEMS</h3>
                <p class="creation-desc">
                  Custom university admission &amp; scholarship portals, OSAS kiosks, municipal incident analytics dashboards, and commercial POS platforms engineered with React, PHP 8 MVC, MySQL, and automated PDF engines.
                </p>
              </div>
              <div class="tech-stack-row" style="margin-bottom:0;">
                <span class="tech-pill">PHP 8 MVC</span>
                <span class="tech-pill">React 18</span>
                <span class="tech-pill">MySQL</span>
                <span class="tech-pill">CSRF / JWT</span>
              </div>
            </div>

            <div class="service-card">
              <div>
                <div class="service-num">02 // CROSS-PLATFORM APPS</div>
                <h3 class="service-title">FLUTTER MOBILE &amp; DESKTOP ECOSYSTEMS</h3>
                <p class="creation-desc">
                  Native-performance Android, iOS, Windows Desktop, and Web applications powered by Flutter &amp; Dart, seamlessly synchronized with REST APIs, multi-role portals, and real-time scheduling databases.
                </p>
              </div>
              <div class="tech-stack-row" style="margin-bottom:0;">
                <span class="tech-pill">Flutter 3.47</span>
                <span class="tech-pill">Dart 3.13</span>
                <span class="tech-pill">REST APIs</span>
                <span class="tech-pill">Material 3</span>
              </div>
            </div>

            <div class="service-card">
              <div>
                <div class="service-num">03 // IMMERSIVE FRONTENDS</div>
                <h3 class="service-title">3D WEBGL, COMPUTER VISION &amp; UI/UX</h3>
                <p class="creation-desc">
                  High-contrast cyber-brutalist studio websites, interactive Three.js 3D showcases, webcam hand-tracking holographic interfaces, and HTML5 Canvas games.
                </p>
              </div>
              <div class="tech-stack-row" style="margin-bottom:0;">
                <span class="tech-pill">Three.js / WebGL</span>
                <span class="tech-pill">Hand-Tracking CV</span>
                <span class="tech-pill">HTML5 Canvas</span>
                <span class="tech-pill">UI/UX</span>
              </div>
            </div>
          </div>
        </section>

        <div class="section-divider"></div>

        <!-- ==================================================================
             SECTION 06 // INTERACTIVE CONTACT TERMINAL (CSRF + HONEYPOT SECURED)
             ================================================================== -->
        <section id="contacts" class="studio-section">
          <div class="section-header">
            <div>
              <div class="section-index">05 // DIRECT TRANSMISSION</div>
              <h2 class="section-title">INITIATE COLLABORATION</h2>
            </div>
            <p class="section-desc">
              Looking to build a full-stack web system, a cross-platform Flutter app, or an interactive 3D website? Connect directly with John Paul Tuangco.
            </p>
          </div>

          <div class="contact-grid">
            <div class="contact-panel">
              <h3 style="font-family:'Teko',sans-serif;font-size:2.2rem;text-transform:uppercase;margin-bottom:10px;">
                DIRECT CHANNELS // JAYPEE STUDIO
              </h3>
              <p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.6;">
                All 24+ repositories and open-source creations are live on GitHub. Reach out via GitHub, Facebook, or direct CSRF-protected transmission.
              </p>

              <div class="contact-channels">
                <a href="https://github.com/Jaypee1031" target="_blank" rel="noopener" class="channel-row">
                  <div>
                    <div style="font-family:'JetBrains Mono',monospace;font-size:0.68rem;color:var(--text-muted);">GITHUB PROFILE &amp; 24+ REPOSITORIES</div>
                    <strong style="font-size:1.02rem;">github.com/Jaypee1031</strong>
                  </div>
                  <span style="color:var(--accent-primary);font-family:'JetBrains Mono',monospace;">OPEN ↗</span>
                </a>

                <a href="https://www.facebook.com/search/top?q=jp%20tuangco" target="_blank" rel="noopener" class="channel-row">
                  <div>
                    <div style="font-family:'JetBrains Mono',monospace;font-size:0.68rem;color:var(--text-muted);">FACEBOOK MESSENGER / SOCIAL</div>
                    <strong style="font-size:1.02rem;">JP Tuangco (Cordon, Isabela)</strong>
                  </div>
                  <span style="color:var(--accent-primary);font-family:'JetBrains Mono',monospace;">CONNECT ↗</span>
                </a>

                <div class="channel-row">
                  <div>
                    <div style="font-family:'JetBrains Mono',monospace;font-size:0.68rem;color:var(--text-muted);">SECURITY &amp; ROUTING STATUS</div>
                    <strong style="font-size:1.02rem;">Extensionless Clean URLs • CSP + CSRF Shield</strong>
                  </div>
                  <span style="color:var(--status-online);font-family:'JetBrains Mono',monospace;">● PROTECTED</span>
                </div>
              </div>
            </div>

            <div class="contact-panel">
              <form id="studio-contact-form" class="contact-form" autocomplete="on">
                <input type="hidden" id="cf-csrf-token" name="csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>" />
                <!-- Anti-Bot Honeypot Field (Hidden from real users) -->
                <div style="position:absolute;left:-9999px;opacity:0;pointer-events:none;" aria-hidden="true">
                  <label for="cf-website-hp">Leave this field blank</label>
                  <input type="text" id="cf-website-hp" name="website_hp" tabindex="-1" autocomplete="off" />
                </div>

                <div class="form-group">
                  <label for="cf-name">YOUR NAME / ORGANIZATION</label>
                  <input type="text" id="cf-name" name="name" class="form-control" placeholder="e.g. Alex Rivera / Studio Client" maxlength="120" required />
                </div>
                <div class="form-group">
                  <label for="cf-email">YOUR EMAIL OR CONTACT HANDLE</label>
                  <input type="email" id="cf-email" name="email" class="form-control" placeholder="you@domain.com" maxlength="160" required />
                </div>
                <div class="form-group">
                  <label for="cf-project">PROJECT ARCHITECTURE / SCOPE</label>
                  <input type="text" id="cf-project" name="project" class="form-control" placeholder="Full-Stack System / Flutter App / 3D Website" maxlength="160" required />
                </div>
                <div class="form-group">
                  <label for="cf-message">TRANSMISSION BRIEF</label>
                  <textarea id="cf-message" name="message" rows="4" class="form-control" placeholder="Tell me about your project goals, timeline, and system requirements..." maxlength="2000" required></textarea>
                </div>
                <button type="submit" class="btn-hud primary" style="justify-content:center;padding:14px;">
                  🔒 SEND SECURED TRANSMISSION TO JAYPEE STUDIO ↗
                </button>
                <div id="contact-form-feedback" style="display:none;margin-top:8px;padding:12px;border:1px solid var(--accent-primary);border-radius:8px;font-family:'JetBrains Mono',monospace;font-size:0.74rem;color:var(--text-primary);"></div>
              </form>
            </div>
          </div>
        </section>

        <!-- Studio Footer -->
        <footer class="studio-footer">
          <div>© 2024–2026 JAYPEE STUDIO // JOHN PAUL TUANGCO (@Jaypee1031). ALL RIGHTS RESERVED.</div>
          <div>🛡️ SECURED PHP ROUTER (ZERO .PHP/.HTML IN URL) • AUTO-SYNCED WITH GITHUB API</div>
        </footer>
      </div>

    </main>
  </div>

  <!-- ======================================================================
       MODAL 01 // LIVE GITHUB README.MD INSPECTOR
       ====================================================================== -->
  <div id="readme-modal-backdrop" class="hud-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="readme-modal-title">
    <div class="hud-modal">
      <div class="hud-modal-header">
        <span id="readme-modal-title">README.MD // GITHUB INSPECTOR</span>
        <div style="display:flex;gap:10px;align-items:center;">
          <a id="readme-modal-gh-link" href="https://github.com/Jaypee1031" target="_blank" rel="noopener" class="hud-modal-close" style="text-decoration:none;">OPEN ON GITHUB ↗</a>
          <button type="button" class="hud-modal-close" data-close-modal="true">ESC / CLOSE ✕</button>
        </div>
      </div>
      <div id="readme-modal-body" class="hud-modal-body"></div>
    </div>
  </div>

  <!-- ======================================================================
       MODAL 02 // PLAYABLE CYBERPUNK NEON SNAKE ARCADE (Jaypee1031/Snake)
       ====================================================================== -->
  <div id="snake-modal-backdrop" class="hud-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="snake-modal-title">
    <div class="hud-modal" style="width:min(540px, 95vw);">
      <div class="hud-modal-header">
        <span id="snake-modal-title">🎮 CYBERPUNK SNAKE // JAYPEE1031/SNAKE</span>
        <button type="button" class="hud-modal-close" data-close-modal="true">CLOSE ✕</button>
      </div>
      <div class="hud-modal-body" style="text-align:center;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-family:'JetBrains Mono',monospace;font-size:0.78rem;">
          <span>CONTROLS: [W A S D] or [ARROW KEYS]</span>
          <span>SCORE: <strong id="snake-score" style="color:var(--accent-primary);">0</strong></span>
          <button type="button" id="btn-restart-snake" class="hud-modal-close">RESTART</button>
        </div>
        <canvas id="snake-canvas" width="440" height="360"></canvas>
      </div>
    </div>
  </div>

  <!-- ======================================================================
       MODAL 03 // PLAYABLE 3D RUBIK'S CUBE MATRIX (Jaypee1031/rubicks_cube)
       ====================================================================== -->
  <div id="rubik-modal-backdrop" class="hud-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="rubik-modal-title">
    <div class="hud-modal" style="width:min(680px, 96vw);">
      <div class="hud-modal-header">
        <span id="rubik-modal-title">🧊 3D RUBIK'S CUBE MATRIX // JAYPEE1031/RUBICKS_CUBE</span>
        <button type="button" class="hud-modal-close" data-close-modal="true">CLOSE ✕</button>
      </div>
      <div class="hud-modal-body" style="text-align:center;">
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;font-family:'JetBrains Mono',monospace;font-size:0.76rem;">
          <span>DRAG CUBE TO ORBIT 360° • KEYS: [U D L R F B]</span>
          <span>MOVES: <strong id="rubik-move-count" style="color:var(--accent-primary);">0</strong></span>
          <span>TIME: <strong id="rubik-timer" style="color:var(--accent-primary);">00:00</strong></span>
          <span>STATUS: <strong id="rubik-status" style="color:var(--status-online);">SOLVED</strong></span>
        </div>

        <div id="rubik-stage-box" style="width:100%;height:340px;background:#050508;border:1px solid var(--accent-primary);border-radius:10px;position:relative;overflow:hidden;cursor:grab;margin-bottom:14px;"></div>

        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-bottom:10px;">
          <button type="button" class="hud-modal-close" data-rubik-turn="U">U (Top)</button>
          <button type="button" class="hud-modal-close" data-rubik-turn="D">D (Bottom)</button>
          <button type="button" class="hud-modal-close" data-rubik-turn="L">L (Left)</button>
          <button type="button" class="hud-modal-close" data-rubik-turn="R">R (Right)</button>
          <button type="button" class="hud-modal-close" data-rubik-turn="F">F (Front)</button>
          <button type="button" class="hud-modal-close" data-rubik-turn="B">B (Back)</button>
        </div>

        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;">
          <button type="button" id="btn-rubik-scramble" class="btn-hud primary" style="padding:8px 16px;">🔀 SCRAMBLE CUBE</button>
          <button type="button" id="btn-rubik-solve" class="btn-hud" style="padding:8px 16px;border-color:var(--accent-primary);color:var(--accent-primary);">⚡ AUTO-SOLVE</button>
          <button type="button" id="btn-rubik-reset" class="btn-hud" style="padding:8px 16px;">↺ RESET</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ======================================================================
       MODAL 04 // REAL-TIME VISITOR TELEMETRY & LIVE SESSION RADAR
       ====================================================================== -->
  <div id="visitors-modal-backdrop" class="hud-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="visitors-modal-title">
    <div class="hud-modal" style="width:min(760px, 96vw);">
      <div class="hud-modal-header">
        <span id="visitors-modal-title" style="display:flex;align-items:center;gap:8px;">
          <span class="pulse-dot"></span> REAL-TIME VISITOR TELEMETRY // LIVE RADAR
        </span>
        <button type="button" class="hud-modal-close" data-close-modal="true">CLOSE ✕</button>
      </div>
      <div class="hud-modal-body">
        <!-- 4 Real-Time KPI Counters -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:22px;">
          <div style="padding:16px;border:1px solid var(--border-hud);border-radius:10px;background:rgba(255,255,255,0.03);">
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.66rem;color:var(--text-muted);">ONLINE RIGHT NOW</div>
            <div id="vm-online-now" style="font-family:'Teko',sans-serif;font-size:2.7rem;line-height:1;color:var(--status-online);margin-top:4px;">1</div>
          </div>
          <div style="padding:16px;border:1px solid var(--border-hud);border-radius:10px;background:rgba(255,255,255,0.03);">
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.66rem;color:var(--text-muted);">TODAY'S VISITS</div>
            <div id="vm-today-visits" style="font-family:'Teko',sans-serif;font-size:2.7rem;line-height:1;color:var(--text-primary);margin-top:4px;">1</div>
          </div>
          <div style="padding:16px;border:1px solid var(--border-hud);border-radius:10px;background:rgba(255,255,255,0.03);">
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.66rem;color:var(--text-muted);">UNIQUE VISITORS</div>
            <div id="vm-unique-visitors" style="font-family:'Teko',sans-serif;font-size:2.7rem;line-height:1;color:var(--accent-primary);margin-top:4px;">1</div>
          </div>
          <div style="padding:16px;border:1px solid var(--border-hud);border-radius:10px;background:rgba(255,255,255,0.03);">
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.66rem;color:var(--text-muted);">TOTAL STUDIO VIEWS</div>
            <div id="vm-total-views" style="font-family:'Teko',sans-serif;font-size:2.7rem;line-height:1;color:var(--text-primary);margin-top:4px;">43</div>
          </div>
        </div>

        <!-- Active Connected Nodes List -->
        <div style="margin-bottom:22px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-family:'JetBrains Mono',monospace;font-size:0.72rem;color:var(--accent-primary);">
            <span>ACTIVE CONNECTED VISITOR NODES (45S HEARTBEAT WINDOW)</span>
            <span id="vm-your-node">YOUR SESSION: NODE-0000</span>
          </div>
          <div id="vm-active-nodes-list" style="display:flex;flex-direction:column;gap:8px;"></div>
        </div>

        <!-- Recent Activity Stream -->
        <div>
          <div style="margin-bottom:10px;font-family:'JetBrains Mono',monospace;font-size:0.72rem;color:var(--text-muted);">
            RECENT LIVE SECTION &amp; THEME TELEMETRY LOG
          </div>
          <div id="vm-recent-events" style="display:flex;flex-direction:column;gap:6px;font-family:'JetBrains Mono',monospace;font-size:0.71rem;"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Three.js WebGL Library + CSP Nonce-Secured Studio Scripts -->
  <script nonce="<?= htmlspecialchars($cspNonce, ENT_QUOTES, 'UTF-8') ?>" src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script nonce="<?= htmlspecialchars($cspNonce, ENT_QUOTES, 'UTF-8') ?>" src="js/scene3d.js"></script>
  <script nonce="<?= htmlspecialchars($cspNonce, ENT_QUOTES, 'UTF-8') ?>" src="js/github-sync.js"></script>
  <script nonce="<?= htmlspecialchars($cspNonce, ENT_QUOTES, 'UTF-8') ?>" src="js/app.js"></script>
</body>
</html>
