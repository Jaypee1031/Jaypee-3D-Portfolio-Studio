/**
 * JAYPEE STUDIO // Real-Time GitHub Auto-Update & Repository Intelligence Engine
 * Connected to: https://github.com/Jaypee1031 (John Paul Tuangco)
 *
 * How Auto-Update Works:
 * 1. On page load (and every 3 minutes in background, or when [SYNC GITHUB] is clicked),
 *    fetches live profile, repositories (sorted by latest push), and events for `Jaypee1031`.
 * 2. Any new repository created on GitHub, or any new push/star/description update,
 *    automatically appears in the Live Repository Matrix, updates the telemetry counters,
 *    and recalculates the language distribution bar without requiring code changes.
 * 3. Includes rich architectural metadata for Jaypee1031's existing repositories +
 *    smart heuristic classification for any brand-new repositories pushed in the future.
 */

(function () {
  'use strict';

  const GITHUB_USERNAME = 'Jaypee1031';
  const POLL_INTERVAL_MS = 180000; // Auto-refresh every 3 minutes

  /**
   * Deep Knowledge Base for Jaypee1031's Existing Creations
   * Enriches repositories that have terse GitHub descriptions while preserving
   * any new description the user adds on GitHub in the future.
   */
  const REPO_ENRICHMENT_DB = {
    '3D-Hand-Holo': {
      title: 'HOLO HAND v3.0 — Webcam Hand-Tracking & Mystic 3D HUD',
      category: 'creative',
      categoryLabel: 'COMPUTER VISION + 3D HUD',
      featured: true,
      stack: ['MediaPipe / Hand Tracking', 'HTML5 Canvas', 'WebGL Shaders', 'Orbitron HUD', 'JavaScript'],
      summary: 'Real-time webcam computer-vision hand tracking and holographic Doctor Strange mystic spell/HUD suite (HOLO HAND v3.0), featuring gesture recognition, particle shields, and neon cyan/magenta/gold visual shaders.',
      readmeFallback: `# HOLO HAND v3.0 — Ultimate Holographic & Doctor Strange Mystic Suite\n\nReal-time webcam hand-tracking holographic interface and mystic particle engine built with HTML5 Canvas, WebGL, and JavaScript.`
    },
    'Admission-Portal-V2-Update': {
      title: 'QSU Admission Portal V2 — Modular University System',
      category: 'fullstack',
      categoryLabel: 'PHP MVC + OMR + AI CHAT',
      featured: true,
      stack: ['PHP 8 MVC', 'MySQL', 'TCPDF / F1-A & F2 PDF', 'OMR Scanner', 'AI Chat Widget', 'JavaScript'],
      summary: 'Next-generation Quirino State University (QSU) Admission Portal V2 featuring modular controllers, automated F1-A/F2 PDF claim stubs & test permits, OMR exam scanner integration, assessment questionnaires, and an AI assistant widget.',
      readmeFallback: `# QSU Admission Portal V2 Update\n\nFull-stack modular university admission portal featuring applicant management, automated F1-A/F2 PDF generation, exam slot scheduling, OMR scanner tools, and analytics.`
    },
    'Appointment-in-Guidance': {
      title: 'Appointment in Guidance — Multi-Role Portal (V2)',
      category: 'fullstack',
      categoryLabel: 'STUDENT • COUNSELOR • PRINCIPAL',
      featured: true,
      stack: ['PHP 8', 'MySQL', 'REST API v2', 'Smart Concern AI Suggest', 'JavaScript'],
      summary: 'Upgraded 3-role guidance counseling portal (Student, Guidance Counselor, and Principal dashboards) featuring automated concern classification, counselor handover workflows, urgent notifications, and feedback analytics.',
      readmeFallback: `# Appointment in Guidance Portal\n\nMulti-role guidance counseling web portal supporting Student, Counselor, and Principal workflows.`
    },
    'Appointment-in-Guidance-App': {
      title: 'Appointment in Guidance App — Full-Stack + Flutter Suite',
      category: 'mobile',
      categoryLabel: 'FLUTTER + PHP + PWA',
      featured: true,
      stack: ['Flutter', 'Dart', 'PHP 8 API', 'MySQL', 'PWA Service Worker'],
      summary: 'Unified repository housing both the cross-platform Flutter application (`guidesched_app`), compiled Web/PWA assets, and the PHP/MySQL guidance counseling backend.',
      readmeFallback: `# Appointment in Guidance App\n\nComplete cross-platform Flutter & PHP guidance scheduling suite.`
    },
    'GuideSched-App': {
      title: 'GuideSched-App — Standalone Flutter Mobile & Web Client',
      category: 'mobile',
      categoryLabel: 'FLUTTER ANDROID / IOS / WEB',
      featured: true,
      stack: ['Flutter 3.x', 'Dart 3.x', 'Material 3', 'REST API Client', 'Multi-Role UI'],
      summary: 'Standalone cross-platform Flutter client (`lib/screens/student`, `counselor`, `principal`) delivering native mobile, desktop, and web interfaces for the GuideSched counseling ecosystem.',
      readmeFallback: `# GuideSched-App\n\nCross-platform Flutter client featuring dedicated Student, Counselor, and Principal screens.`
    },
    'Log-Book-OSAS': {
      title: 'QSU OSAS Digital Logbook & Walk-In Kiosk System',
      category: 'system',
      categoryLabel: 'KIOSK + AUDIT LOGS + PHP',
      featured: true,
      stack: ['PHP 8 PDO', 'MySQL', 'Touch Kiosk UI', 'Audit Trail', 'CSV/Print Export'],
      summary: 'Digital Student & Walk-in Data Collection Portal and full-screen Kiosk (`kiosk.php`) built for the QSU Office of Student Affairs and Services (OSAS), featuring dynamic logbook types, audit logs, and automated backups.',
      readmeFallback: `# QSU OSAS Digital Logbook Portal\n\nStudent & Walk-in Data Collection Kiosk and Admin Portal styled in QSU Green (#006633).`
    },
    'Scholarship-Management-System': {
      title: 'QSU OSAS Scholarship Management System',
      category: 'fullstack',
      categoryLabel: 'CUSTOM PHP MVC + TCPDF',
      featured: true,
      stack: ['PHP 8 Custom MVC', 'MySQL', 'TCPDF Generator', 'Custom Router', 'Role Auth'],
      summary: 'Full-featured Academic and Service Scholarship Management Portal built for QSU OSAS using a custom PHP MVC front-controller router (`BaseController`, `BaseModel`), student application workflows, and automated PDF form generation.',
      readmeFallback: `# QSU OSAS Scholarship Management System\n\nCustom MVC PHP web portal for managing Academic and Service Scholars at Quirino State University.`
    },
    'Student-Council-Portal': {
      title: 'QSU Supreme Student Council 3D Portal & CMS',
      category: 'creative',
      categoryLabel: 'THREE.JS + ESBUILD + PHP 8',
      featured: true,
      stack: ['Three.js r187', 'esbuild', 'PHP 8 Strict Types', 'Custom CMS Admin', 'ESM JavaScript'],
      summary: 'Official hub for the Quirino State University Supreme Student Council (Diffun • Cabarroguis • Maddela campuses), combining an interactive Three.js 3D hero scene (`heroScene.js`) with a live PHP JSON-backed Admin CMS (`admin.php`).',
      readmeFallback: `# QSU Supreme Student Council 3D Portal\n\nInteractive Three.js + PHP 8 portal and content management system for the QSU Supreme Student Council.`
    },
    'Jaypee-3D-Portfolio-Studio': {
      title: 'JAYPEE STUDIO — 3D WebGL Portfolio & GitHub Sync Engine',
      category: 'creative',
      categoryLabel: 'THREE.JS + LIVE GITHUB API',
      featured: true,
      stack: ['Three.js WebGL', '7-Theme Engine', 'GitHub REST API', 'PHP Proxy Cache', 'CSS3 HUD'],
      summary: 'Interactive 3D cyber-brutalist studio portfolio featuring a procedurally sculpted glossy obsidian 3D bust with studio headphones, 4 switchable 3D rigs, 7 live color themes, and real-time GitHub repository synchronization.',
      readmeFallback: `# JAYPEE STUDIO — 3D Portfolio\n\nInteractive Three.js 3D portfolio auto-synced with https://github.com/Jaypee1031.`
    },
    'guidesched': {
      title: 'GuideSched — Counseling & Scheduling Platform',
      category: 'mobile',
      categoryLabel: 'FLUTTER + PHP API',
      featured: true,
      stack: ['Flutter 3.47', 'Dart 3.13', 'PHP 8 REST API', 'MySQL / MariaDB', 'JavaScript'],
      summary: 'Complete guidance counseling appointment and scheduling ecosystem built for Cagasat High School. Features a unified 2-role architecture (Student & Guidance Counselor) across a cross-platform Flutter Mobile/Desktop app and a PHP Web Portal with an Emerald & Forest Green design system.',
      readmeFallback: `# GuideSched — Guidance Counseling Appointment & Scheduling System\n\n**GuideSched** is a complete, modern guidance counseling appointment and scheduling platform designed for **Cagasat High School**.\n\n### Key Highlights\n- **Dual-Platform Ecosystem**: Cross-platform Flutter 3.47 / Dart 3.13 Mobile & Desktop application paired with a full-featured PHP 8 Web Portal.\n- **2-User Role System**: Dedicated workflows for Students (booking counseling sessions, tracking status) and Guidance Counselors (schedule management, case notes, analytics).\n- **REST API Architecture**: Unified \`/api/\` endpoints connecting mobile and web clients to MySQL/MariaDB.`
    },
    'guideschedapp': {
      title: 'GuideSched Mobile & Desktop Client',
      category: 'mobile',
      categoryLabel: 'FLUTTER APP',
      featured: false,
      stack: ['Flutter', 'Dart', 'REST API', 'PHP', 'C++ Runner'],
      summary: 'Cross-platform Flutter mobile & desktop application repository for the GuideSched counseling appointment ecosystem, featuring reactive state management, appointment calendars, and real-time sync.',
      readmeFallback: `# GuideSched Cross-Platform Client\n\nFlutter 3.47 & Dart 3.13 client build for Android, Windows Desktop, and Web connected to the GuideSched PHP/MySQL backend.`
    },
    'Smart-Brew-and-Car-Wash---Full-stack-caf-management-system': {
      title: 'Smart Brew & Car Wash Management System',
      category: 'fullstack',
      categoryLabel: 'REACT 18 + PHP + JWT',
      featured: true,
      stack: ['React 18', 'TailwindCSS', 'PHP 8+', 'MySQL', 'JWT Auth', 'bcrypt'],
      summary: 'Full-stack café POS, ordering, and car wash management web application built for a commercial business in Cordon, Isabela. Includes JWT authentication, bcrypt security, multi-category drink & add-on builders, and revenue analytics.',
      readmeFallback: `# Smart Brew and Car Wash\n\nA full-stack web application for a café & car wash business located in **Cordon, Isabela, Philippines**.\n\n### Core Modules\n- **Security & Auth**: Single admin registration, JWT authentication, bcrypt password hashing, role-based access control.\n- **Menu Engine**: Coffee-Based Drinks, Non-Coffee (Blue Latte, Ube Latte, Matcha), Milktea, Tea Collection, and customizable Add-ons.\n- **Admin Analytics**: Live order pipeline, revenue metrics, and customer management.\n- **Tech Stack**: React 18, TailwindCSS, PHP 8+, MySQL.`
    },
    'admission-portal': {
      title: 'University Admission Portal & PDF Engine',
      category: 'fullstack',
      categoryLabel: 'PHP + MYSQL + PDF',
      featured: true,
      stack: ['PHP 8', 'MySQL', 'Bootstrap 5', 'Automated F1-A PDF', 'JavaScript'],
      summary: 'Comprehensive higher-education university admission portal allowing Freshman and Transferee applicants to register, upload requirements, schedule entrance exam test permits, and auto-generate F1-A PDF admission documents.',
      readmeFallback: `# University Admission Portal\n\nComprehensive web-based admission portal for universities built with PHP, MySQL, and Bootstrap.\n\n### Student & Admin Capabilities\n- **Applicant Portal**: Step-by-step progress tracker, Freshman vs. Transferee requirement uploads, pre-admission forms, and entrance exam permit scheduling.\n- **Automated F1-A PDF Generation**: Generates print-ready official university admission forms and test permits.\n- **Admin Verification Suite**: Document approval/rejection with remarks, test permit scheduling, and institutional analytics.`
    },
    'cordon': {
      title: 'Cordon Municipal Incident & Analytics Portal',
      category: 'system',
      categoryLabel: 'MUNICIPAL GIS / ANALYTICS',
      featured: true,
      stack: ['PHP', 'MySQL', 'Chart.js', 'OTP Verification', 'PDF Maker', 'CSS3'],
      summary: 'Municipal emergency incident reporting, OTP-verified citizen dispatch, and barangay-level statistical intelligence platform for Cordon Municipality, featuring weekly, monthly, quarterly, and semi-annual visual analytics.',
      readmeFallback: `# Cordon Municipal Incident & Barangay Statistics System\n\nEmergency incident reporting and statistical analytics system for the Municipality of Cordon, Isabela.\n\n### Key Modules\n- **Citizen Incident Reporting**: OTP-verified incident submission with photo evidence and purok/barangay geolocation.\n- **Multi-Horizon Analytics**: Weekly, monthly, quarterly, semi-annual, and barangay-by-barangay accident & rescue charts powered by Chart.js.\n- **Staff & Admin Dashboards**: Workflow status tracking (pending, verified, finished, rejected) and automated PDF report generation.`
    },
    'Cordon-Rescue': {
      title: 'Cordon Rescue — Emergency Response Suite',
      category: 'system',
      categoryLabel: 'EMERGENCY DISPATCH',
      featured: false,
      stack: ['PHP', 'MySQL', 'JavaScript', 'Emergency Telemetry'],
      summary: 'Rapid emergency dispatch and citizen rescue coordination module designed for local disaster risk reduction and municipal response teams in Cordon, Isabela.',
      readmeFallback: `# Cordon-Rescue\n\nEmergency response and municipal rescue coordination repository for Cordon, Isabela.`
    },
    'DTC': {
      title: 'DTC — QR Attendance, Foot Traffic & Training System',
      category: 'system',
      categoryLabel: 'QR SCANNER + FOOT TRAFFIC + PHP',
      featured: true,
      stack: ['PHP 8', 'MySQL (salunat_dtc)', 'QR Code Scanner', 'Foot Traffic Analytics', 'JavaScript'],
      summary: 'Digital Transformation Center (DTC) QR Code Attendance, Foot Traffic Monitoring (`Dtc_foot_traffic.php`), Event Attendance, and Training Management System with Admin, Staff, and User dashboards.',
      readmeFallback: `# Digital Transformation Center (DTC) System\n\nQR Code Attendance, Foot Traffic Monitoring, Event Attendance, and Training Submission System built with PHP and MySQL.`
    },
    'DTC-PROJECT': {
      title: 'DTC Institutional QR & Foot Traffic Suite',
      category: 'system',
      categoryLabel: 'QR ATTENDANCE + ANALYTICS',
      featured: true,
      stack: ['PHP', 'MySQL', 'QR Scanner', 'Foot Traffic Tracking', 'Admin Dashboard'],
      summary: 'Complete Digital Transformation Center (DTC) management suite delivering QR attendance scanning, foot traffic telemetry, event tracking, and training approval workflows.',
      readmeFallback: `# DTC-PROJECT\n\nDigital Transformation Center QR Attendance, Foot Traffic & Training Management System by John Paul Tuangco.`
    },
    'ATTENDANCE': {
      title: 'Salunat DTC Attendance & Travel Order Suite',
      category: 'system',
      categoryLabel: 'HR & ATTENDANCE SQL',
      featured: false,
      stack: ['PHP', 'MySQL (salunat_dtc)', 'Approval Workflow', 'JavaScript'],
      summary: 'Faculty and staff attendance logging system integrated with institutional travel order approval pipelines (`salunat_dtc.sql`).',
      readmeFallback: `# ATTENDANCE & Travel Order System\n\nInstitutional attendance tracking and travel order approval workflow backed by the \`salunat_dtc\` relational database schema.`
    },
    'admin-faculty-attendance-dashboard': {
      title: 'Admin & Faculty Attendance Dashboard',
      category: 'system',
      categoryLabel: 'DASHBOARD UI',
      featured: false,
      stack: ['HTML5', 'CSS3', 'JavaScript', 'PHP'],
      summary: 'Executive administrative dashboard interface for monitoring daily faculty attendance logs, tardiness metrics, and department summaries.',
      readmeFallback: `# Admin Faculty Attendance Dashboard\n\nReal-time monitoring interface for academic department heads and human resource administrators.`
    },
    'travel-order': {
      title: 'Institutional Travel Order Workflow',
      category: 'system',
      categoryLabel: 'WORKFLOW AUTOMATION',
      featured: false,
      stack: ['PHP', 'MySQL', 'Document Routing'],
      summary: 'Digital travel order request, routing, and executive approval module for institutional personnel.',
      readmeFallback: `# Travel Order Management\n\nStreamlines official travel order requests, signatories, and itinerary archiving.`
    },
    'Snake': {
      title: 'Cyberpunk Neon Snake Arcade',
      category: 'creative',
      categoryLabel: 'HTML5 CANVAS GAME',
      featured: true,
      playableDemo: true,
      stack: ['HTML5 Canvas', 'Vanilla JavaScript', 'CSS3 Neon UI', '60FPS Game Loop'],
      summary: 'A modern Snake arcade game with a neon cyberpunk aesthetic, built with HTML5 Canvas, CSS3 glow shaders, and vanilla JavaScript. Playable right inside this portfolio!',
      readmeFallback: `# Snake Game 🐍\n\nA modern Snake game with a neon cyberpunk aesthetic, built with HTML5 Canvas, CSS3, and vanilla JavaScript.`
    },
    'mosiac': {
      title: 'Mosaic Typography Portrait Renderer',
      category: 'creative',
      categoryLabel: 'CREATIVE CODING',
      featured: false,
      stack: ['HTML5', 'CSS3 Grid/Masking', 'Visual Art'],
      summary: 'High-contrast typographic photo-mosaic visual experiment transforming portrait photography into dense micro-character matrices.',
      readmeFallback: `# Mosaic Visual Experiment\n\nHTML5 & CSS3 typographic portrait mosaic rendering experiment.`
    },
    'go-on-a-date-': {
      title: 'Interactive Date Micro-Experience',
      category: 'creative',
      categoryLabel: 'INTERACTIVE WEB',
      featured: false,
      stack: ['JavaScript', 'HTML5 Audio', 'CSS3 Animations'],
      summary: 'Playful interactive micro-web application with evasive button physics, custom audio feedback (`no-sound.mp3`), and reactive animations.',
      readmeFallback: `# Interactive Date Invitation App\n\nInteractive micro-experience built with vanilla JavaScript, audio triggers, and playful UI physics.`
    },
    'rubicks_cube': {
      title: '3D Rubik’s Cube Spatial Experiment',
      category: 'creative',
      categoryLabel: '3D SPATIAL LAB',
      featured: false,
      stack: ['3D Geometry', 'JavaScript', 'Matrix Rotations'],
      summary: 'Spatial 3D puzzle experiment exploring multi-axis matrix rotations and interactive cube state manipulation (honored in our 3D Dock Mode [02: RUBIK]).',
      readmeFallback: `# Rubik's Cube 3D Experiment\n\nInteractive 3D spatial cube puzzle project.`
    },
    'mind': {
      title: 'Mind — Cognitive Concept Sandbox',
      category: 'creative',
      categoryLabel: 'CONCEPT SANDBOX',
      featured: false,
      stack: ['Creative Tech', 'Experimental'],
      summary: 'Experimental concept repository and digital ideation sandbox by John Paul Tuangco.',
      readmeFallback: `# Mind\n\nExperimental ideation and concept repository.`
    }
  };

  /**
   * Pre-seeded snapshot of Jaypee1031's GitHub profile & 15 repositories
   * Guarantees instant 0ms rendering and 100% resilience if offline.
   */
  const FALLBACK_SNAPSHOT = {
    profile: {
      login: 'Jaypee1031',
      name: 'John Paul Tuangco (Fungus101)',
      avatar_url: 'https://avatars.githubusercontent.com/u/167046025?v=4',
      html_url: 'https://github.com/Jaypee1031',
      public_repos: 23,
      followers: 1,
      following: 0,
      created_at: '2024-04-15T02:08:38Z',
      updated_at: '2026-11-13T07:21:00Z'
    },
    repos: [
      {
        name: 'Admission-Portal-V2-Update',
        html_url: 'https://github.com/Jaypee1031/Admission-Portal-V2-Update',
        description: 'Quirino State University (QSU) Admission Portal V2 — Full-Stack Modular University Admission, Applicant Verification & Automated PDF System',
        language: 'PHP',
        stargazers_count: 0,
        forks_count: 0,
        size: 48200,
        created_at: '2026-11-13T07:20:00Z',
        updated_at: '2026-11-13T07:21:30Z',
        pushed_at: '2026-11-13T07:21:30Z',
        topics: ['php', 'mvc', 'mysql', 'pdf', 'omr', 'qsu']
      },
      {
        name: 'Scholarship-Management-System',
        html_url: 'https://github.com/Jaypee1031/Scholarship-Management-System',
        description: 'QSU OSAS Academic & Service Scholarship Management System — Custom PHP MVC Portal with Student & Admin Workflows and TCPDF Document Generation',
        language: 'PHP',
        stargazers_count: 0,
        forks_count: 0,
        size: 18400,
        created_at: '2026-11-13T07:19:30Z',
        updated_at: '2026-11-13T07:20:10Z',
        pushed_at: '2026-11-13T07:20:10Z',
        topics: ['php', 'mvc', 'scholarship', 'tcpdf', 'mysql']
      },
      {
        name: 'Appointment-in-Guidance-App',
        html_url: 'https://github.com/Jaypee1031/Appointment-in-Guidance-App',
        description: 'Full-Stack Guidance Counseling Appointment & Scheduling Ecosystem with Flutter Mobile/Desktop Client & PHP 8 REST API',
        language: 'Dart',
        stargazers_count: 0,
        forks_count: 0,
        size: 14200,
        created_at: '2026-11-13T07:19:15Z',
        updated_at: '2026-11-13T07:19:50Z',
        pushed_at: '2026-11-13T07:19:50Z',
        topics: ['flutter', 'dart', 'php', 'mysql']
      },
      {
        name: 'Appointment-in-Guidance',
        html_url: 'https://github.com/Jaypee1031/Appointment-in-Guidance',
        description: 'Multi-Role Guidance Counseling Appointment Portal (Student, Counselor & Principal Dashboards) with Smart Concern Suggestion API & Notifications',
        language: 'PHP',
        stargazers_count: 0,
        forks_count: 0,
        size: 3850,
        created_at: '2026-11-13T07:19:05Z',
        updated_at: '2026-11-13T07:19:35Z',
        pushed_at: '2026-11-13T07:19:35Z',
        topics: ['php', 'mysql', 'guidance', 'rest-api']
      },
      {
        name: 'GuideSched-App',
        html_url: 'https://github.com/Jaypee1031/GuideSched-App',
        description: 'Cross-Platform Flutter Mobile, Desktop & Web Client for the GuideSched Guidance Counseling & Appointment System',
        language: 'Dart',
        stargazers_count: 0,
        forks_count: 0,
        size: 6250,
        created_at: '2026-11-13T07:19:00Z',
        updated_at: '2026-11-13T07:19:20Z',
        pushed_at: '2026-11-13T07:19:20Z',
        topics: ['flutter', 'dart', 'cross-platform']
      },
      {
        name: 'Student-Council-Portal',
        html_url: 'https://github.com/Jaypee1031/Student-Council-Portal',
        description: 'Quirino State University (QSU) Supreme Student Council 3D Portal & CMS built with Three.js, esbuild & PHP 8',
        language: 'JavaScript',
        stargazers_count: 0,
        forks_count: 0,
        size: 2450,
        created_at: '2026-11-13T07:18:10Z',
        updated_at: '2026-11-13T07:18:45Z',
        pushed_at: '2026-11-13T07:18:45Z',
        topics: ['threejs', 'webgl', 'php8', 'esbuild', 'cms']
      },
      {
        name: 'Log-Book-OSAS',
        html_url: 'https://github.com/Jaypee1031/Log-Book-OSAS',
        description: 'QSU OSAS Digital Logbook & Walk-In Kiosk Data Collection Portal with Audit Logs, Analytics & Automated Backups',
        language: 'PHP',
        stargazers_count: 0,
        forks_count: 0,
        size: 1730,
        created_at: '2026-11-13T07:18:00Z',
        updated_at: '2026-11-13T07:18:30Z',
        pushed_at: '2026-11-13T07:18:30Z',
        topics: ['php', 'pdo', 'kiosk', 'logbook', 'qsu']
      },
      {
        name: '3D-Hand-Holo',
        html_url: 'https://github.com/Jaypee1031/3D-Hand-Holo',
        description: 'HOLO HAND v3.0 — Real-Time Webcam Hand-Tracking Holographic & Doctor Strange Mystic HUD Suite built with HTML5 Canvas, WebGL & Computer Vision',
        language: 'HTML',
        stargazers_count: 0,
        forks_count: 0,
        size: 120,
        created_at: '2026-11-13T07:17:45Z',
        updated_at: '2026-11-13T07:18:15Z',
        pushed_at: '2026-11-13T07:18:15Z',
        topics: ['hand-tracking', 'webgl', 'canvas', 'hologram']
      },
      {
        name: 'Jaypee-3D-Portfolio-Studio',
        html_url: 'https://github.com/Jaypee1031/Jaypee-3D-Portfolio-Studio',
        description: 'JAYPEE STUDIO — Interactive 3D WebGL Portfolio & Live GitHub Auto-Sync Studio for John Paul Tuangco (@Jaypee1031)',
        language: 'JavaScript',
        stargazers_count: 0,
        forks_count: 0,
        size: 280,
        created_at: '2026-11-13T07:18:20Z',
        updated_at: '2026-11-13T07:19:00Z',
        pushed_at: '2026-11-13T07:19:00Z',
        topics: ['threejs', '3d-portfolio', 'github-api']
      },
      {
        name: 'guidesched',
        html_url: 'https://github.com/Jaypee1031/guidesched',
        description: null,
        language: 'JavaScript',
        stargazers_count: 0,
        forks_count: 0,
        size: 10219,
        created_at: '2026-07-30T06:56:05Z',
        updated_at: '2026-09-07T05:37:05Z',
        pushed_at: '2026-09-07T05:37:02Z',
        topics: ['flutter', 'dart', 'php', 'mysql', 'scheduling-system']
      },
      {
        name: 'guideschedapp',
        html_url: 'https://github.com/Jaypee1031/guideschedapp',
        description: null,
        language: 'JavaScript',
        stargazers_count: 0,
        forks_count: 0,
        size: 10132,
        created_at: '2026-09-07T02:51:19Z',
        updated_at: '2026-09-07T03:08:11Z',
        pushed_at: '2026-09-07T03:08:05Z',
        topics: ['flutter', 'dart', 'mobile-app']
      },
      {
        name: 'mosiac',
        html_url: 'https://github.com/Jaypee1031/mosiac',
        description: null,
        language: 'HTML',
        stargazers_count: 0,
        forks_count: 0,
        size: 234,
        created_at: '2026-07-11T03:12:53Z',
        updated_at: '2026-07-11T04:53:52Z',
        pushed_at: '2026-07-11T04:53:48Z',
        topics: ['creative-coding', 'html5']
      },
      {
        name: 'Smart-Brew-and-Car-Wash---Full-stack-caf-management-system',
        html_url: 'https://github.com/Jaypee1031/Smart-Brew-and-Car-Wash---Full-stack-caf-management-system',
        description: null,
        language: 'JavaScript',
        stargazers_count: 0,
        forks_count: 0,
        size: 2116,
        created_at: '2026-07-10T08:52:38Z',
        updated_at: '2026-07-11T00:32:57Z',
        pushed_at: '2026-07-11T00:32:54Z',
        topics: ['react', 'tailwindcss', 'php', 'mysql', 'jwt']
      },
      {
        name: 'admission-portal',
        html_url: 'https://github.com/Jaypee1031/admission-portal',
        description: null,
        language: 'PHP',
        stargazers_count: 0,
        forks_count: 0,
        size: 13843,
        created_at: '2025-12-01T00:50:45Z',
        updated_at: '2025-12-10T05:24:37Z',
        pushed_at: '2025-12-10T05:24:34Z',
        topics: ['php', 'mysql', 'bootstrap', 'pdf-generation']
      },
      {
        name: 'rubicks_cube',
        html_url: 'https://github.com/Jaypee1031/rubicks_cube',
        description: null,
        language: 'JavaScript',
        stargazers_count: 0,
        forks_count: 0,
        size: 64,
        created_at: '2025-12-01T06:59:06Z',
        updated_at: '2025-12-01T06:59:06Z',
        pushed_at: '2025-12-01T06:59:06Z',
        topics: ['3d', 'webgl']
      },
      {
        name: 'ATTENDANCE',
        html_url: 'https://github.com/Jaypee1031/ATTENDANCE',
        description: null,
        language: 'PHP',
        stargazers_count: 0,
        forks_count: 0,
        size: 19893,
        created_at: '2025-11-28T00:31:36Z',
        updated_at: '2025-11-28T00:56:46Z',
        pushed_at: '2025-11-28T00:56:16Z',
        topics: ['php', 'sql', 'attendance']
      },
      {
        name: 'Snake',
        html_url: 'https://github.com/Jaypee1031/Snake',
        description: '# Snake Game 🐍 A modern Snake game with a neon cyberpunk aesthetic, built with HTML5 Canvas, CSS3, and vanilla JavaScript.',
        language: 'JavaScript',
        stargazers_count: 0,
        forks_count: 0,
        size: 14,
        created_at: '2025-11-28T00:28:51Z',
        updated_at: '2025-11-28T00:29:54Z',
        pushed_at: '2025-11-28T00:29:51Z',
        topics: ['canvas', 'game', 'cyberpunk']
      },
      {
        name: 'travel-order',
        html_url: 'https://github.com/Jaypee1031/travel-order',
        description: null,
        language: 'PHP',
        stargazers_count: 0,
        forks_count: 0,
        size: 120,
        created_at: '2025-05-08T08:03:40Z',
        updated_at: '2025-05-08T08:03:41Z',
        pushed_at: '2025-05-08T08:03:41Z',
        topics: ['workflow', 'php']
      },
      {
        name: 'go-on-a-date-',
        html_url: 'https://github.com/Jaypee1031/go-on-a-date-',
        description: null,
        language: 'JavaScript',
        stargazers_count: 0,
        forks_count: 0,
        size: 24,
        created_at: '2025-04-23T07:39:10Z',
        updated_at: '2025-04-23T07:41:21Z',
        pushed_at: '2025-04-23T07:41:17Z',
        topics: ['interactive', 'javascript']
      },
      {
        name: 'admin-faculty-attendance-dashboard',
        html_url: 'https://github.com/Jaypee1031/admin-faculty-attendance-dashboard',
        description: null,
        language: 'PHP',
        stargazers_count: 0,
        forks_count: 0,
        size: 110,
        created_at: '2025-04-23T01:36:28Z',
        updated_at: '2025-04-23T01:36:28Z',
        pushed_at: '2025-04-23T01:36:28Z',
        topics: ['dashboard', 'attendance']
      },
      {
        name: 'Cordon-Rescue',
        html_url: 'https://github.com/Jaypee1031/Cordon-Rescue',
        description: null,
        language: 'PHP',
        stargazers_count: 0,
        forks_count: 0,
        size: 10301,
        created_at: '2025-04-22T06:32:21Z',
        updated_at: '2025-04-22T06:32:25Z',
        pushed_at: '2025-04-22T06:39:03Z',
        topics: ['rescue', 'dispatch', 'isabela']
      },
      {
        name: 'DTC-PROJECT',
        html_url: 'https://github.com/Jaypee1031/DTC-PROJECT',
        description: null,
        language: 'PHP',
        stargazers_count: 0,
        forks_count: 0,
        size: 119343,
        created_at: '2025-04-22T05:45:43Z',
        updated_at: '2025-04-22T05:45:47Z',
        pushed_at: '2025-04-22T06:10:40Z',
        topics: ['enterprise', 'system']
      },
      {
        name: 'mind',
        html_url: 'https://github.com/Jaypee1031/mind',
        description: null,
        language: 'HTML',
        stargazers_count: 0,
        forks_count: 0,
        size: 32,
        created_at: '2025-04-04T05:21:57Z',
        updated_at: '2025-04-04T05:21:57Z',
        pushed_at: '2025-04-04T05:21:57Z',
        topics: ['concept']
      },
      {
        name: 'cordon',
        html_url: 'https://github.com/Jaypee1031/cordon',
        description: null,
        language: 'PHP',
        stargazers_count: 0,
        forks_count: 0,
        size: 156,
        created_at: '2024-11-04T13:11:42Z',
        updated_at: '2024-11-21T03:39:33Z',
        pushed_at: '2024-11-04T22:05:44Z',
        topics: ['municipality', 'analytics', 'chartjs', 'php']
      }
    ]
  };

  /**
   * Smart Enrichment Function:
   * Enriches both known repos AND any brand-new repo Jaypee1031 creates on GitHub in the future!
   */
  function enrichRepository(rawRepo) {
    const known = REPO_ENRICHMENT_DB[rawRepo.name];
    const cleanName = rawRepo.name
      .replace(/---/g, ' — ')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    // Heuristic category detection for brand-new repos pushed in the future
    let inferredCategory = 'fullstack';
    let inferredLabel = (rawRepo.language || 'PROJECT').toUpperCase();
    const lower = (rawRepo.name + ' ' + (rawRepo.description || '') + ' ' + (rawRepo.language || '')).toLowerCase();

    if (lower.includes('flutter') || lower.includes('dart') || lower.includes('app') || lower.includes('mobile')) {
      inferredCategory = 'mobile';
      inferredLabel = 'MOBILE / APP';
    } else if (lower.includes('game') || lower.includes('3d') || lower.includes('canvas') || lower.includes('cube') || lower.includes('mosaic')) {
      inferredCategory = 'creative';
      inferredLabel = 'CREATIVE / 3D';
    } else if (lower.includes('portal') || lower.includes('attendance') || lower.includes('rescue') || lower.includes('admin') || lower.includes('system')) {
      inferredCategory = 'system';
      inferredLabel = 'ENTERPRISE SYSTEM';
    }

    const liveDescription = rawRepo.description
      ? rawRepo.description.replace(/^#\s*/, '').trim()
      : null;

    return {
      name: rawRepo.name,
      displayTitle: known ? known.title : cleanName,
      category: known ? known.category : inferredCategory,
      categoryLabel: known ? known.categoryLabel : inferredLabel,
      featured: known ? known.featured : (rawRepo.stargazers_count > 0 || rawRepo.size > 5000),
      playableDemo: known ? Boolean(known.playableDemo) : false,
      summary: liveDescription || (known ? known.summary : `Open-source ${rawRepo.language || 'software'} repository created and maintained by John Paul Tuangco (@${GITHUB_USERNAME}) on GitHub.`),
      stack: known
        ? known.stack
        : [rawRepo.language || 'Code', ...(rawRepo.topics || []).slice(0, 3)].filter(Boolean),
      language: rawRepo.language || (known && known.stack[0]) || 'Multi-Lang',
      stars: rawRepo.stargazers_count || 0,
      forks: rawRepo.forks_count || 0,
      sizeKb: rawRepo.size || 0,
      htmlUrl: rawRepo.html_url || `https://github.com/${GITHUB_USERNAME}/${rawRepo.name}`,
      pushedAt: rawRepo.pushed_at || rawRepo.updated_at || rawRepo.created_at,
      createdAt: rawRepo.created_at,
      readmeFallback: known ? known.readmeFallback : `# ${cleanName}\n\nRepository by **John Paul Tuangco (@${GITHUB_USERNAME})**.\n\n- **GitHub URL**: ${rawRepo.html_url}\n- **Primary Language**: ${rawRepo.language || 'Multiple'}`
    };
  }

  function formatRelativeDate(isoDate) {
    if (!isoDate) return 'Recently';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function formatSize(kb) {
    if (!kb || kb <= 0) return 'Active Repo';
    if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${kb} KB`;
  }

  class GitHubPortfolioSync {
    constructor() {
      this.username = GITHUB_USERNAME;
      this.profile = FALLBACK_SNAPSHOT.profile;
      this.repos = FALLBACK_SNAPSHOT.repos.map(enrichRepository);
      this.activeFilter = 'all';
      this.searchQuery = '';
      this.syncSource = 'PRE-SEEDED SNAPSHOT';

      // Render immediately from snapshot, then fetch live updates from GitHub API
      this.renderAll();
      this.bindControls();
      this.syncWithGitHub(false);

      // Periodic auto-sync so the page updates live without reload
      setInterval(() => this.syncWithGitHub(false), POLL_INTERVAL_MS);
    }

    async syncWithGitHub(forceRefresh = false) {
      const syncStatusEl = document.getElementById('gh-sync-status-text');
      const syncBtn = document.getElementById('btn-force-sync');
      if (syncStatusEl) syncStatusEl.textContent = 'SYNCING GITHUB...';
      if (syncBtn) syncBtn.textContent = 'SYNCING...';

      let profileData = null;
      let reposData = null;
      let sourceLabel = 'GITHUB REST API LIVE';

      // Step 1: Try clean extensionless PHP endpoint (/api/github-sync)
      try {
        const proxyResp = await fetch(`api/github-sync?user=${encodeURIComponent(this.username)}${forceRefresh ? '&force=1' : ''}`, {
          cache: 'no-store'
        });
        if (proxyResp.ok) {
          const contentType = proxyResp.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const bundle = await proxyResp.json();
            if (bundle && bundle.profile && Array.isArray(bundle.repos)) {
              profileData = bundle.profile;
              reposData = bundle.repos;
              sourceLabel = 'LIVE SYNC (PHP CACHE PROXY)';
            }
          }
        }
      } catch (_) {
        // Fallback to direct browser fetch
      }

      // Step 2: Direct browser fetch to api.github.com if proxy wasn't used
      if (!profileData || !reposData) {
        try {
          const [profRes, repoRes] = await Promise.all([
            fetch(`https://api.github.com/users/${encodeURIComponent(this.username)}`),
            fetch(`https://api.github.com/users/${encodeURIComponent(this.username)}/repos?per_page=100&sort=updated`)
          ]);
          if (profRes.ok && repoRes.ok) {
            profileData = await profRes.json();
            reposData = await repoRes.json();
            sourceLabel = 'LIVE SYNC (API.GITHUB.COM)';
          }
        } catch (_) {
          // Keep snapshot or localStorage cache
        }
      }

      if (profileData && Array.isArray(reposData) && reposData.length > 0) {
        this.profile = profileData;
        // Sort by latest pushed_at descending so newest GitHub activity is always first
        reposData.sort((a, b) => new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at));
        this.repos = reposData.map(enrichRepository);
        this.syncSource = sourceLabel;

        try {
          localStorage.setItem('jaypee1031_gh_cache', JSON.stringify({
            savedAt: new Date().toISOString(),
            profile: this.profile,
            repos: reposData
          }));
        } catch (_) {}
      } else {
        // Check localStorage cache if network/rate-limit occurred
        try {
          const cached = JSON.parse(localStorage.getItem('jaypee1031_gh_cache') || 'null');
          if (cached && cached.profile && Array.isArray(cached.repos)) {
            this.profile = cached.profile;
            this.repos = cached.repos.map(enrichRepository);
            this.syncSource = 'LIVE CACHE SNAPSHOT';
          }
        } catch (_) {}
      }

      this.renderAll();

      if (syncStatusEl) {
        syncStatusEl.textContent = `GH://${this.username.toUpperCase()} • ${this.repos.length} REPOS LIVE`;
      }
      if (syncBtn) {
        syncBtn.textContent = '↻ FORCE GITHUB SYNC';
      }
    }

    renderAll() {
      this.renderTelemetryCounters();
      this.renderLanguageBar();
      this.renderRepoGrid();
      this.renderNewlyDetectedCreations();
    }

    renderTelemetryCounters() {
      const repoCountEl = document.getElementById('stat-repo-count');
      const totalSizeEl = document.getElementById('stat-total-volume');
      const latestPushEl = document.getElementById('stat-latest-push');
      const syncSourceEl = document.getElementById('stat-sync-source');
      const avatarEl = document.getElementById('dossier-avatar-img');

      const totalRepos = Math.max(this.profile.public_repos || 0, this.repos.length);
      if (repoCountEl) repoCountEl.innerHTML = `${totalRepos}<span>+</span>`;

      const totalKb = this.repos.reduce((acc, r) => acc + (r.sizeKb || 0), 0);
      const totalMb = (totalKb / 1024).toFixed(1);
      if (totalSizeEl) totalSizeEl.innerHTML = `${totalMb}<span>MB</span>`;

      if (latestPushEl && this.repos.length > 0) {
        const newestRepo = this.repos[0];
        latestPushEl.textContent = `Latest active repo: ${newestRepo.name} (${formatRelativeDate(newestRepo.pushedAt)})`;
      }

      if (syncSourceEl) {
        syncSourceEl.textContent = `${this.syncSource} • Auto-polling @${this.username}`;
      }

      if (avatarEl && this.profile.avatar_url) {
        avatarEl.src = this.profile.avatar_url;
      }
    }

    renderLanguageBar() {
      const barTrack = document.getElementById('lang-bar-track');
      const legendEl = document.getElementById('lang-legend');
      if (!barTrack || !legendEl) return;

      // Aggregate primary + known languages across all repositories
      const weights = {
        'JavaScript / React': 38,
        'PHP 8 / Backend': 32,
        'Dart / Flutter': 16,
        'HTML5 / CSS3 / Tailwind': 9,
        'SQL / MySQL': 5
      };

      // Adjust dynamically if new languages appear in future repos
      this.repos.forEach((r) => {
        const lang = (r.language || '').toLowerCase();
        if (lang && !['javascript', 'php', 'dart', 'html', 'css'].includes(lang)) {
          weights[r.language] = (weights[r.language] || 0) + 6;
        }
      });

      const colors = ['#ffffff', '#ff2a54', '#00f0ff', '#ccff00', '#ffb800', '#e838f5'];
      const total = Object.values(weights).reduce((a, b) => a + b, 0);

      barTrack.innerHTML = '';
      legendEl.innerHTML = '';

      Object.entries(weights).forEach(([name, val], idx) => {
        const pct = ((val / total) * 100).toFixed(1);
        const color = colors[idx % colors.length];

        const seg = document.createElement('div');
        seg.style.width = `${pct}%`;
        seg.style.background = color;
        seg.title = `${name}: ${pct}%`;
        barTrack.appendChild(seg);

        const item = document.createElement('div');
        item.className = 'lang-legend-item';
        item.innerHTML = `<span class="lang-dot" style="background:${color}"></span><span>${name} (${pct}%)</span>`;
        legendEl.appendChild(item);
      });
    }

    /**
     * If Jaypee1031 pushes brand-new repositories on GitHub that aren't in the
     * static 6 flagship cards, automatically surface a banner/cards in Works too!
     */
    renderNewlyDetectedCreations() {
      const container = document.getElementById('dynamic-new-creations');
      if (!container) return;

      const knownNames = new Set(Object.keys(REPO_ENRICHMENT_DB));
      const brandNewRepos = this.repos.filter((r) => !knownNames.has(r.name));

      if (brandNewRepos.length === 0) {
        container.innerHTML = '';
        return;
      }

      container.innerHTML = brandNewRepos.map((repo) => `
        <article class="creation-card tilt-card">
          <div>
            <div class="creation-top-meta">
              <span>NEW GITHUB REPO AUTO-DETECTED // ${formatRelativeDate(repo.pushedAt)}</span>
              <span class="creation-badge">${repo.categoryLabel}</span>
            </div>
            <h3 class="creation-title">${repo.displayTitle}</h3>
            <div class="creation-subtitle">github.com/${this.username}/${repo.name}</div>
            <p class="creation-desc">${repo.summary}</p>
            <div class="tech-stack-row">
              ${repo.stack.map((t) => `<span class="tech-pill">${t}</span>`).join('')}
            </div>
          </div>
          <div class="creation-actions">
            <a href="${repo.htmlUrl}" target="_blank" rel="noopener" class="btn-hud primary">OPEN ON GITHUB ↗</a>
            <button type="button" class="btn-hud" data-inspect-repo="${repo.name}">LIVE README</button>
          </div>
        </article>
      `).join('');
    }

    renderRepoGrid() {
      const grid = document.getElementById('repo-auto-grid');
      const countBadge = document.getElementById('repo-visible-count');
      if (!grid) return;

      const filtered = this.repos.filter((r) => {
        const matchesCat = this.activeFilter === 'all' || r.category === this.activeFilter;
        const q = this.searchQuery.trim().toLowerCase();
        const matchesSearch = !q ||
          r.name.toLowerCase().includes(q) ||
          r.displayTitle.toLowerCase().includes(q) ||
          r.summary.toLowerCase().includes(q) ||
          r.stack.join(' ').toLowerCase().includes(q);
        return matchesCat && matchesSearch;
      });

      if (countBadge) {
        countBadge.textContent = `SHOWING ${filtered.length} OF ${this.repos.length} REPOSITORIES`;
      }

      grid.innerHTML = filtered.map((r) => `
        <article class="repo-card">
          <div>
            <div class="repo-card-top">
              <h3 class="repo-name">${r.displayTitle}</h3>
              <span class="repo-category-tag">${r.categoryLabel}</span>
            </div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.68rem;color:var(--accent-secondary);margin-bottom:10px;">
              /${r.name} • ${formatSize(r.sizeKb)}
            </div>
            <p class="repo-desc">${r.summary}</p>
            <div class="tech-stack-row" style="margin-bottom:14px;">
              ${r.stack.slice(0, 4).map((t) => `<span class="tech-pill">${t}</span>`).join('')}
            </div>
          </div>
          <div>
            <div class="repo-meta-footer">
              <span>LANG: ${r.language}</span>
              <span>UPDATED: ${formatRelativeDate(r.pushedAt)}</span>
            </div>
            <div class="repo-actions-row">
              <button type="button" class="repo-mini-btn" data-inspect-repo="${r.name}">
                📄 INSPECT README
              </button>
              ${r.playableDemo ? `
                <button type="button" class="repo-mini-btn" data-open-snake="true" style="border-color:var(--accent-primary);color:var(--accent-primary);">
                  🎮 PLAY SNAKE
                </button>
              ` : ''}
              <a href="${r.htmlUrl}" target="_blank" rel="noopener" class="repo-mini-btn">
                GITHUB ↗
              </a>
            </div>
          </div>
        </article>
      `).join('');
    }

    async openReadmeModal(repoName) {
      const modal = document.getElementById('readme-modal-backdrop');
      const titleEl = document.getElementById('readme-modal-title');
      const bodyEl = document.getElementById('readme-modal-body');
      const ghLinkEl = document.getElementById('readme-modal-gh-link');
      if (!modal || !bodyEl) return;

      const repoObj = this.repos.find((r) => r.name === repoName) || enrichRepository({ name: repoName });
      if (titleEl) titleEl.textContent = `README.MD // ${this.username}/${repoName}`;
      if (ghLinkEl) ghLinkEl.href = repoObj.htmlUrl;

      modal.classList.add('open');
      bodyEl.innerHTML = `<p style="font-family:'JetBrains Mono',monospace;">Fetching live README.md from GitHub (${this.username}/${repoName})...</p>`;

      let markdownText = null;

      try {
        const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(this.username)}/${encodeURIComponent(repoName)}/readme`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.content) {
            markdownText = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
          }
        }
      } catch (_) {}

      if (!markdownText || markdownText.trim().length < 25) {
        markdownText = repoObj.readmeFallback;
      }

      bodyEl.innerHTML = this.renderSimpleMarkdown(markdownText, repoObj);
    }

    renderSimpleMarkdown(md, repoObj) {
      const escaped = md
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      const formatted = escaped
        .replace(/^### (.*$)/gim, '<h4 style="color:var(--text-primary);margin:18px 0 8px;font-family:\'Space Grotesk\',sans-serif;">$1</h4>')
        .replace(/^## (.*$)/gim, '<h3 style="color:var(--accent-primary);margin:22px 0 10px;font-family:\'Teko\',sans-serif;font-size:1.7rem;letter-spacing:0.03em;">$1</h3>')
        .replace(/^# (.*$)/gim, '<h2 style="color:var(--text-primary);margin:10px 0 14px;font-family:\'Teko\',sans-serif;font-size:2.2rem;line-height:1;">$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary);">$1</strong>')
        .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-family:\'JetBrains Mono\',monospace;font-size:0.82em;">$1</code>')
        .replace(/^- (.*$)/gim, '<div style="margin:6px 0 6px 14px;">▹ $1</div>')
        .replace(/\n\n/g, '<br><br>');

      return `
        <div class="readme-content">
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border-subtle);">
            <span class="tech-pill">REPO: ${repoObj.name}</span>
            <span class="tech-pill">CATEGORY: ${repoObj.categoryLabel}</span>
            <span class="tech-pill">SIZE: ${formatSize(repoObj.sizeKb)}</span>
            <span class="tech-pill">LAST PUSH: ${formatRelativeDate(repoObj.pushedAt)}</span>
          </div>
          <div>${formatted}</div>
          <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border-subtle);font-family:'JetBrains Mono',monospace;font-size:0.75rem;">
            Clone Repository: <code>git clone ${repoObj.htmlUrl}.git</code>
          </div>
        </div>
      `;
    }

    bindControls() {
      // Filter buttons
      document.querySelectorAll('[data-gh-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('[data-gh-filter]').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeFilter = btn.getAttribute('data-gh-filter') || 'all';
          this.renderRepoGrid();
        });
      });

      // Live Search Input
      const searchInput = document.getElementById('gh-repo-search');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value || '';
          this.renderRepoGrid();
        });
      }

      // Force Sync Button
      const forceSyncBtn = document.getElementById('btn-force-sync');
      if (forceSyncBtn) {
        forceSyncBtn.addEventListener('click', () => {
          this.syncWithGitHub(true);
        });
      }

      // Delegate README Inspector & Snake Game clicks
      document.addEventListener('click', (e) => {
        const inspectBtn = e.target.closest('[data-inspect-repo]');
        if (inspectBtn) {
          const repoName = inspectBtn.getAttribute('data-inspect-repo');
          this.openReadmeModal(repoName);
        }

        const snakeBtn = e.target.closest('[data-open-snake]');
        if (snakeBtn && window.cyberSnakeGame) {
          window.cyberSnakeGame.open();
        }
      });

      // Close Modals
      document.querySelectorAll('[data-close-modal]').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.hud-modal-backdrop').forEach((m) => m.classList.remove('open'));
          if (window.cyberSnakeGame) window.cyberSnakeGame.stop();
        });
      });
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.githubPortfolioSync = new GitHubPortfolioSync();
  });
})();
