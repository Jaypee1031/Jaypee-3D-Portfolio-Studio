<?php
/**
 * GitHub Live Auto-Sync Proxy & Cache for Jaypee1031 Portfolio
 * Automatically fetches live data from GitHub REST API with local caching
 * so the portfolio never hits unauthenticated rate limits when served via XAMPP.
 */
@ini_set('display_errors', '0');
error_reporting(0);
ob_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$username = isset($_GET['user']) ? preg_replace('/[^a-zA-Z0-9\-]/', '', $_GET['user']) : 'Jaypee1031';
$type = isset($_GET['type']) ? $_GET['type'] : 'bundle';
$repo = isset($_GET['repo']) ? preg_replace('/[^a-zA-Z0-9\-_\.]/', '', $_GET['repo']) : '';
$force = isset($_GET['force']) && $_GET['force'] === '1';

$cacheDir = __DIR__ . '/cache';
if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0755, true);
}

$cacheTtl = 300; // 5 minutes fresh cache

function fetchGitHubEndpoint($url) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_HTTPHEADER => [
            'Accept: application/vnd.github.v3+json',
            'User-Agent: Jaypee1031-3D-Portfolio-Studio/2.0'
        ]
    ]);
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($status >= 200 && $status < 300 && $response) {
        return json_decode($response, true);
    }
    return null;
}

if ($type === 'readme' && !empty($repo)) {
    $cacheFile = "$cacheDir/readme_{$username}_{$repo}.json";
    if (!$force && file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTtl)) {
        readfile($cacheFile);
        exit;
    }
    $data = fetchGitHubEndpoint("https://api.github.com/repos/{$username}/{$repo}/readme");
    if ($data) {
        @file_put_contents($cacheFile, json_encode($data));
        echo json_encode($data);
        exit;
    }
    if (file_exists($cacheFile)) {
        readfile($cacheFile);
        exit;
    }
    http_response_code(404);
    echo json_encode(['error' => 'README not found']);
    exit;
}

$cacheFile = "$cacheDir/bundle_{$username}.json";
if (!$force && file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTtl)) {
    readfile($cacheFile);
    exit;
}

$profile = fetchGitHubEndpoint("https://api.github.com/users/{$username}");
$repos = fetchGitHubEndpoint("https://api.github.com/users/{$username}/repos?per_page=100&sort=updated");
$events = fetchGitHubEndpoint("https://api.github.com/users/{$username}/events/public?per_page=15");

if ($profile && is_array($repos)) {
    $bundle = [
        'synced_at' => gmdate('c'),
        'source' => 'github_live_php_proxy',
        'profile' => $profile,
        'repos' => $repos,
        'events' => is_array($events) ? $events : []
    ];
    $json = json_encode($bundle);
    @file_put_contents($cacheFile, $json);
    echo $json;
    exit;
}

if (file_exists($cacheFile)) {
    readfile($cacheFile);
    exit;
}

http_response_code(503);
echo json_encode(['error' => 'GitHub API temporarily unavailable, using client fallback']);
