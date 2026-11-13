<?php
declare(strict_types=1);

/**
 * JAYPEE STUDIO // Real-Time Visitors & Live Session Telemetry Engine
 * Routed via clean extensionless endpoint: /api/visitors
 * Tracks:
 * - Active Online Visitors (real-time 45-second heartbeat window)
 * - Today's Visitors (resets daily)
 * - Total Unique Visitors & Total Studio Views
 * - Active Section Heatmap & Anonymized Live Node Feed
 */

@ini_set('display_errors', '0');
error_reporting(0);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$cacheDir = __DIR__ . '/cache';
if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0755, true);
}

$dataFile = $cacheDir . '/visitors_telemetry.json';
$now = time();
$todayKey = gmdate('Y-m-d');
$activeWindowSeconds = 45; // Visitors active within the last 45s are counted as ONLINE NOW

// Read incoming heartbeat payload (if POST) or query params
$rawInput = file_get_contents('php://input');
$payload = json_decode($rawInput ?: '{}', true);
if (!is_array($payload)) {
    $payload = [];
}

$clientSection = isset($payload['section']) ? preg_replace('/[^a-z0-9\-_]/i', '', (string)$payload['section']) : 'home';
if ($clientSection === '') {
    $clientSection = 'home';
}
$clientTheme = isset($payload['theme']) ? preg_replace('/[^a-z0-9\-_]/i', '', (string)$payload['theme']) : 'noir';
$isNewPageLoad = !empty($payload['initial']);

// Create an anonymized visitor node ID from session + IP + User-Agent
if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}
$ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Browser';
$clientTabId = isset($payload['tab_id']) ? preg_replace('/[^a-zA-Z0-9\-_]/', '', (string)$payload['tab_id']) : '';

// Detect readable platform/browser badge (anonymized)
$platform = 'Desktop Web';
if (stripos($ua, 'Android') !== false) $platform = 'Android Mobile';
elseif (stripos($ua, 'iPhone') !== false || stripos($ua, 'iPad') !== false) $platform = 'iOS Device';
elseif (stripos($ua, 'Windows') !== false) $platform = 'Windows PC';
elseif (stripos($ua, 'Mac') !== false) $platform = 'macOS';
elseif (stripos($ua, 'Linux') !== false) $platform = 'Linux';

$browser = 'Browser';
if (stripos($ua, 'Edg/') !== false) $browser = 'Edge';
elseif (stripos($ua, 'OPR/') !== false || stripos($ua, 'Opera') !== false) $browser = 'Opera';
elseif (stripos($ua, 'Chrome/') !== false) $browser = 'Chrome';
elseif (stripos($ua, 'Firefox/') !== false) $browser = 'Firefox';
elseif (stripos($ua, 'Safari/') !== false) $browser = 'Safari';

// Unique visitor fingerprint (per user/browser) & session node ID (per open tab/session)
$visitorHash = substr(hash('sha256', $ip . '|' . $ua . '|jaypee_salt_2026'), 0, 12);
$sessionNodeKey = $clientTabId !== '' ? substr(hash('sha256', $visitorHash . '|' . $clientTabId), 0, 8) : substr($visitorHash, 0, 8);
$nodeLabel = 'NODE-' . strtoupper(substr($sessionNodeKey, 0, 4));

// Default telemetry state
$defaultState = [
    'total_views' => 42,
    'unique_visitors' => [],
    'daily' => [
        $todayKey => 1
    ],
    'active_nodes' => [],
    'recent_events' => []
];

$fp = @fopen($dataFile, 'c+');
if ($fp) {
    @flock($fp, LOCK_EX);
    $contents = stream_get_contents($fp);
    $state = $contents ? json_decode($contents, true) : null;
    if (!is_array($state)) {
        $state = $defaultState;
    }

    if (!isset($state['total_views'])) $state['total_views'] = 42;
    if (!isset($state['unique_visitors']) || !is_array($state['unique_visitors'])) $state['unique_visitors'] = [];
    if (!isset($state['daily']) || !is_array($state['daily'])) $state['daily'] = [];
    if (!isset($state['active_nodes']) || !is_array($state['active_nodes'])) $state['active_nodes'] = [];
    if (!isset($state['recent_events']) || !is_array($state['recent_events'])) $state['recent_events'] = [];

    // Register unique visitor
    $isBrandNewVisitor = !isset($state['unique_visitors'][$visitorHash]);
    $state['unique_visitors'][$visitorHash] = $now;

    // Increment view counter on initial page load or new session node
    $isNewNode = !isset($state['active_nodes'][$sessionNodeKey]);
    if ($isNewPageLoad || $isNewNode) {
        $state['total_views'] = (int)$state['total_views'] + 1;
        $state['daily'][$todayKey] = (int)($state['daily'][$todayKey] ?? 0) + 1;
    }

    // Update this active visitor node
    $state['active_nodes'][$sessionNodeKey] = [
        'node' => $nodeLabel,
        'section' => $clientSection,
        'theme' => $clientTheme,
        'platform' => "{$browser} • {$platform}",
        'last_seen' => $now,
        'joined_at' => $state['active_nodes'][$sessionNodeKey]['joined_at'] ?? $now
    ];

    // Prune expired nodes older than $activeWindowSeconds
    foreach ($state['active_nodes'] as $k => $nodeData) {
        if (($now - (int)($nodeData['last_seen'] ?? 0)) > $activeWindowSeconds) {
            unset($state['active_nodes'][$k]);
        }
    }

    // Record recent activity log if new node or section changed
    $lastEvent = $state['recent_events'][0] ?? null;
    if (!$lastEvent || $lastEvent['node'] !== $nodeLabel || $lastEvent['section'] !== $clientSection) {
        array_unshift($state['recent_events'], [
            'node' => $nodeLabel,
            'section' => strtoupper($clientSection),
            'theme' => strtoupper($clientTheme),
            'platform' => "{$browser} on {$platform}",
            'timestamp' => gmdate('c', $now)
        ]);
        $state['recent_events'] = array_slice($state['recent_events'], 0, 10);
    }

    // Keep only last 14 days in daily stats
    if (count($state['daily']) > 14) {
        $state['daily'] = array_slice($state['daily'], -14, 14, true);
    }

    rewind($fp);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($state));
    fflush($fp);
    @flock($fp, LOCK_UN);
    fclose($fp);
} else {
    $state = $defaultState;
}

// Compute live section breakdown
$sectionCounts = [
    'home' => 0,
    'works' => 0,
    'creations' => 0,
    'about' => 0,
    'services' => 0,
    'contacts' => 0
];

$activeList = [];
foreach ($state['active_nodes'] as $node) {
    $sec = strtolower($node['section'] ?? 'home');
    if (isset($sectionCounts[$sec])) {
        $sectionCounts[$sec]++;
    } else {
        $sectionCounts['home']++;
    }
    $activeList[] = [
        'node' => $node['node'],
        'section' => strtoupper($sec),
        'theme' => strtoupper($node['theme'] ?? 'noir'),
        'platform' => $node['platform'],
        'seconds_ago' => max(0, $now - (int)$node['last_seen'])
    ];
}

$onlineCount = max(1, count($activeList));
$uniqueCount = max(1, count($state['unique_visitors']));
$todayViews = max(1, (int)($state['daily'][$todayKey] ?? 1));
$totalViews = max($onlineCount, (int)$state['total_views']);

echo json_encode([
    'ok' => true,
    'your_node' => $nodeLabel,
    'online_now' => $onlineCount,
    'today_visits' => $todayViews,
    'unique_visitors' => $uniqueCount,
    'total_views' => $totalViews,
    'section_counts' => $sectionCounts,
    'active_nodes' => array_values($activeList),
    'recent_events' => $state['recent_events'],
    'server_time' => gmdate('c', $now)
]);
