<?php
declare(strict_types=1);

/**
 * JAYPEE STUDIO // Real-Time Visitors & Multi-Horizon Analytics Engine
 * Routed via clean extensionless endpoint: /api/visitors
 * Tracks & Aggregates:
 * - ONLINE NOW (Real-time 45s heartbeat window)
 * - TODAY (Current Day Y-m-d)
 * - THIS WEEK (Last 7 Days / Current ISO Week)
 * - THIS MONTH (Current Month Y-m)
 * - THIS YEAR (Current Year Y)
 * - ALL-TIME TOTAL & UNIQUE VISITORS
 * - Time-series breakdown for Weekly (7 days), Monthly (Jan-Dec), and Yearly charts
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
$todayKey = gmdate('Y-m-d', $now);
$weekKey = gmdate('o-\WW', $now);
$monthKey = gmdate('Y-m', $now);
$yearKey = gmdate('Y', $now);
$activeWindowSeconds = 45;

// Read incoming heartbeat payload
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

if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}
$ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Browser';
$clientTabId = isset($payload['tab_id']) ? preg_replace('/[^a-zA-Z0-9\-_]/', '', (string)$payload['tab_id']) : '';

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

$visitorHash = substr(hash('sha256', $ip . '|' . $ua . '|jaypee_salt_2026'), 0, 12);
$sessionNodeKey = $clientTabId !== '' ? substr(hash('sha256', $visitorHash . '|' . $clientTabId), 0, 8) : substr($visitorHash, 0, 8);
$nodeLabel = 'NODE-' . strtoupper(substr($sessionNodeKey, 0, 4));

$defaultState = [
    'total_views' => 1,
    'unique_visitors' => [],
    'daily' => [],
    'weekly' => [],
    'monthly' => [],
    'yearly' => [],
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

    foreach (['unique_visitors', 'daily', 'weekly', 'monthly', 'yearly', 'active_nodes', 'recent_events'] as $arrKey) {
        if (!isset($state[$arrKey]) || !is_array($state[$arrKey])) {
            $state[$arrKey] = [];
        }
    }
    if (!isset($state['total_views'])) {
        $state['total_views'] = 1;
    }

    // Register unique visitor
    $state['unique_visitors'][$visitorHash] = $now;

    // Increment counters on initial page load or new session node
    $isNewNode = !isset($state['active_nodes'][$sessionNodeKey]);
    if ($isNewPageLoad || $isNewNode) {
        $state['total_views'] = (int)$state['total_views'] + 1;
        $state['daily'][$todayKey] = (int)($state['daily'][$todayKey] ?? 0) + 1;
        $state['weekly'][$weekKey] = (int)($state['weekly'][$weekKey] ?? 0) + 1;
        $state['monthly'][$monthKey] = (int)($state['monthly'][$monthKey] ?? 0) + 1;
        $state['yearly'][$yearKey] = (int)($state['yearly'][$yearKey] ?? 0) + 1;
    } else {
        // Ensure current buckets exist with at least current daily count
        if (!isset($state['daily'][$todayKey])) $state['daily'][$todayKey] = 1;
        if (!isset($state['weekly'][$weekKey])) $state['weekly'][$weekKey] = (int)$state['daily'][$todayKey];
        if (!isset($state['monthly'][$monthKey])) $state['monthly'][$monthKey] = (int)$state['weekly'][$weekKey];
        if (!isset($state['yearly'][$yearKey])) $state['yearly'][$yearKey] = (int)$state['monthly'][$monthKey];
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

    // Prune expired nodes older than 45 seconds
    foreach ($state['active_nodes'] as $k => $nodeData) {
        if (($now - (int)($nodeData['last_seen'] ?? 0)) > $activeWindowSeconds) {
            unset($state['active_nodes'][$k]);
        }
    }

    // Record recent activity log
    $lastEvent = $state['recent_events'][0] ?? null;
    if (!$lastEvent || $lastEvent['node'] !== $nodeLabel || $lastEvent['section'] !== strtoupper($clientSection)) {
        array_unshift($state['recent_events'], [
            'node' => $nodeLabel,
            'section' => strtoupper($clientSection),
            'theme' => strtoupper($clientTheme),
            'platform' => "{$browser} on {$platform}",
            'timestamp' => gmdate('c', $now)
        ]);
        $state['recent_events'] = array_slice($state['recent_events'], 0, 12);
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

// Compute live active nodes
$activeList = [];
foreach ($state['active_nodes'] as $node) {
    $sec = strtolower($node['section'] ?? 'home');
    $activeList[] = [
        'node' => $node['node'],
        'section' => strtoupper($sec),
        'theme' => strtoupper($node['theme'] ?? 'noir'),
        'platform' => $node['platform'],
        'seconds_ago' => max(0, $now - (int)$node['last_seen'])
    ];
}

// Calculate Rolling 7-Day (Weekly), Current Month, and Current Year Totals accurately
$weekSeries = [];
$rolling7DayTotal = 0;
for ($i = 6; $i >= 0; $i--) {
    $ts = $now - ($i * 86400);
    $dKey = gmdate('Y-m-d', $ts);
    $dLabel = gmdate('D m/d', $ts);
    $val = (int)($state['daily'][$dKey] ?? 0);
    $rolling7DayTotal += $val;
    $weekSeries[] = ['label' => $dLabel, 'value' => $val];
}

$monthSeries = [];
$yearRollingTotal = 0;
$monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
for ($m = 1; $m <= 12; $m++) {
    $mKey = sprintf('%s-%02d', $yearKey, $m);
    $val = (int)($state['monthly'][$mKey] ?? 0);
    // Ensure current month reflects at least the sum of daily logs in this month
    if ($mKey === $monthKey) {
        $dailyMonthSum = 0;
        foreach ($state['daily'] as $dk => $dv) {
            if (strpos($dk, $monthKey) === 0) {
                $dailyMonthSum += (int)$dv;
            }
        }
        $val = max($val, $dailyMonthSum);
        $state['monthly'][$monthKey] = $val;
    }
    $yearRollingTotal += $val;
    $monthSeries[] = ['label' => $monthNames[$m - 1], 'value' => $val];
}

$yearSeries = [];
$yearsToTrack = ['2024', '2025', $yearKey];
$yearsToTrack = array_values(array_unique($yearsToTrack));
foreach ($yearsToTrack as $y) {
    $val = (int)($state['yearly'][$y] ?? 0);
    if ($y === $yearKey) {
        $val = max($val, $yearRollingTotal);
    }
    $yearSeries[] = ['label' => (string)$y, 'value' => $val];
}

$onlineCount = max(1, count($activeList));
$todayVisits = max(1, (int)($state['daily'][$todayKey] ?? 1));
$weekVisits = max($todayVisits, $rolling7DayTotal, (int)($state['weekly'][$weekKey] ?? 0));
$monthVisits = max($weekVisits, (int)($state['monthly'][$monthKey] ?? 0));
$yearVisits = max($monthVisits, $yearRollingTotal, (int)($state['yearly'][$yearKey] ?? 0));
$totalViews = max($yearVisits, (int)$state['total_views']);
$uniqueCount = max(1, count($state['unique_visitors']));

echo json_encode([
    'ok' => true,
    'your_node' => $nodeLabel,
    'online_now' => $onlineCount,
    'today_visits' => $todayVisits,
    'week_visits' => $weekVisits,
    'month_visits' => $monthVisits,
    'year_visits' => $yearVisits,
    'unique_visitors' => $uniqueCount,
    'total_views' => $totalViews,
    'series' => [
        'weekly' => $weekSeries,
        'monthly' => $monthSeries,
        'yearly' => $yearSeries
    ],
    'active_nodes' => array_values($activeList),
    'recent_events' => $state['recent_events'],
    'server_time' => gmdate('c', $now)
]);
