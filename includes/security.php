<?php
declare(strict_types=1);

/**
 * JAYPEE STUDIO // Enterprise Security Shield & Clean URL Enforcer
 * - Strips .php / .html from visible URLs (301 redirect to extensionless route)
 * - Hides server PHP fingerprint (X-Powered-By removal)
 * - Cryptographic CSRF Token & CSP Nonce generation
 * - Strict HTTP Security Headers (CSP, HSTS-ready, X-Frame-Options, nosniff, Referrer-Policy)
 * - IP-based Rate Limiter & WAF Payload Guard
 */

@ini_set('display_errors', '0');
@ini_set('expose_php', '0');
error_reporting(0);

if (function_exists('header_remove')) {
    @header_remove('X-Powered-By');
    @header_remove('Server');
}

/**
 * Initialize Hardened PHP Session
 */
function init_secure_session(): void {
    if (session_status() === PHP_SESSION_NONE) {
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443);

        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => $isHttps,
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
        @session_name('JAYPEE_STUDIO_SEC');
        @session_start();
    }
}

/**
 * Enforce Clean Extensionless URLs:
 * If the browser requested /index.php, /index.html, or any .php/.html URL directly,
 * redirect immediately to the clean extensionless path.
 */
function enforce_clean_extensionless_url(): void {
    $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
    $parsedUrl = parse_url($requestUri);
    $path = $parsedUrl['path'] ?? '/';
    $query = isset($parsedUrl['query']) && $parsedUrl['query'] !== '' ? '?' . $parsedUrl['query'] : '';

    // Check if the visible URL path ends with /index.php, /index.html, or .php/.html
    if (preg_match('#^(.*?)/index\.(php|html?)$#i', $path, $matches)) {
        $cleanPath = ($matches[1] === '') ? '/' : $matches[1] . '/';
        header('Location: ' . $cleanPath . $query, true, 301);
        exit;
    }

    if (preg_match('#^(.*?)\.(php|html?)$#i', $path, $matches)) {
        $cleanPath = ($matches[1] === '') ? '/' : $matches[1];
        header('Location: ' . $cleanPath . $query, true, 301);
        exit;
    }
}

/**
 * Basic WAF Input Guard against suspicious query strings
 */
function run_waf_request_guard(): void {
    $queryString = $_SERVER['QUERY_STRING'] ?? '';
    $blockedPatterns = [
        '/union\s+select/i',
        '/<script\b[^>]*>/i',
        '/javascript:/i',
        '/\.\.\/\.\.\//',
        '/etc\/passwd/i',
        '/base64_decode\s*\(/i'
    ];
    foreach ($blockedPatterns as $pattern) {
        if (preg_match($pattern, urldecode($queryString))) {
            http_response_code(403);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'Blocked by JAYPEE STUDIO Security Shield']);
            exit;
        }
    }
}

/**
 * Generate / Retrieve Session CSRF Token
 */
function get_csrf_token(): string {
    init_secure_session();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return (string)$_SESSION['csrf_token'];
}

/**
 * Verify CSRF Token in POST/API Requests
 */
function verify_csrf_token(?string $token): bool {
    init_secure_session();
    if (empty($_SESSION['csrf_token']) || empty($token)) {
        return false;
    }
    return hash_equals((string)$_SESSION['csrf_token'], (string)$token);
}

/**
 * Apply Enterprise HTTP Security Headers
 */
function send_security_headers(string $nonce): void {
    header('X-Frame-Options: SAMEORIGIN');
    header('X-Content-Type-Options: nosniff');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()');
    header('Cross-Origin-Opener-Policy: same-origin-allow-popups');

    $csp = implode('; ', [
        "default-src 'self'",
        "script-src 'self' 'nonce-{$nonce}' https://cdnjs.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https://avatars.githubusercontent.com https://*.githubusercontent.com",
        "connect-src 'self' https://api.github.com",
        "frame-ancestors 'self'",
        "base-uri 'self'",
        "form-action 'self' mailto:"
    ]);
    header("Content-Security-Policy: {$csp}");
}

/**
 * Lightweight IP Rate Limiter for API / Contact Endpoints
 */
function check_rate_limit(string $bucket, int $maxRequests = 30, int $windowSeconds = 60): bool {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $key = 'rl_' . md5($bucket . '_' . $ip);
    init_secure_session();

    $now = time();
    if (!isset($_SESSION[$key]) || !is_array($_SESSION[$key])) {
        $_SESSION[$key] = ['count' => 1, 'start' => $now];
        return true;
    }

    if (($now - $_SESSION[$key]['start']) > $windowSeconds) {
        $_SESSION[$key] = ['count' => 1, 'start' => $now];
        return true;
    }

    $_SESSION[$key]['count']++;
    return $_SESSION[$key]['count'] <= $maxRequests;
}

/**
 * Sanitize String Input
 */
function clean_input(?string $value, int $maxLength = 500): string {
    $val = trim((string)$value);
    $val = strip_tags($val);
    if (mb_strlen($val) > $maxLength) {
        $val = mb_substr($val, 0, $maxLength);
    }
    return htmlspecialchars($val, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
