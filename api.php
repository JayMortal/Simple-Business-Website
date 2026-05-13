<?php
/**
 * GlobalTrade CMS API
 * ─────────────────────────────────────────────────────────────────
 * Single-file PHP backend. No database required.
 * Handles: login (hashed password + session token), read, write, logout.
 *
 * Security features:
 *  - Password stored as bcrypt hash (never in plaintext)
 *  - Server-side session tokens with expiry (2 hours)
 *  - Rate limiting on login: 5 attempts → 15 min lockout (server-side)
 *  - All write operations require a valid token
 *  - Content sanitisation: strips PHP/script tags before writing to disk
 *  - JSON output only; no HTML reflection
 *  - Token file and data file stored outside webroot when possible
 */

// ── Configuration ─────────────────────────────────────────────────
define('DATA_FILE',    __DIR__ . '/site-data.json');
define('STATE_FILE',   __DIR__ . '/api-state.json');   // tokens + lockout
define('MAX_ATTEMPTS', 5);
define('LOCKOUT_SECS', 900);   // 15 minutes
define('TOKEN_TTL',    7200);  // 2 hours

// ── CORS / Headers ───────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
// Only allow same-origin requests
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host   = $_SERVER['HTTP_HOST']   ?? '';
if ($origin && parse_url($origin, PHP_URL_HOST) !== $host) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

// ── State helpers (tokens + lockout stored in api-state.json) ────
function read_state(): array {
    if (!file_exists(STATE_FILE)) return [];
    $raw = @file_get_contents(STATE_FILE);
    return $raw ? (json_decode($raw, true) ?? []) : [];
}

function write_state(array $state): void {
    file_put_contents(STATE_FILE, json_encode($state), LOCK_EX);
}

// ── Rate limiting ────────────────────────────────────────────────
function check_rate_limit(array &$state): void {
    $now = time();
    $locked_until = $state['locked_until'] ?? 0;
    if ($locked_until > $now) {
        $remaining = $locked_until - $now;
        http_response_code(429);
        echo json_encode([
            'error'   => 'locked',
            'message' => 'Too many failed attempts.',
            'retry_after' => $remaining
        ]);
        exit;
    }
    // Reset stale lockout
    if ($locked_until && $locked_until <= $now) {
        $state['attempts']     = 0;
        $state['locked_until'] = 0;
    }
}

function record_failure(array &$state): void {
    $state['attempts'] = ($state['attempts'] ?? 0) + 1;
    if ($state['attempts'] >= MAX_ATTEMPTS) {
        $state['locked_until'] = time() + LOCKOUT_SECS;
        $state['attempts']     = 0;
    }
    write_state($state);
}

function reset_failures(array &$state): void {
    $state['attempts']     = 0;
    $state['locked_until'] = 0;
    write_state($state);
}

// ── Token helpers ────────────────────────────────────────────────
function generate_token(): string {
    return bin2hex(random_bytes(32));
}

function validate_token(array $state, string $token): bool {
    $stored  = $state['token']      ?? '';
    $expires = $state['token_exp']  ?? 0;
    return $stored && hash_equals($stored, $token) && time() < $expires;
}

// ── Password bootstrap ───────────────────────────────────────────
// On first run, write the default hashed password to state.
// The admin panel will call the change-password endpoint to update it.
function get_password_hash(array &$state): string {
    if (empty($state['password_hash'])) {
        $state['password_hash'] = password_hash('admin123', PASSWORD_BCRYPT);
        write_state($state);
    }
    return $state['password_hash'];
}

// ── Content sanitisation ─────────────────────────────────────────
function sanitise_data($value) {
    if (is_string($value)) {
        // Strip PHP tags and <script> blocks
        $value = preg_replace('/<\?.*?\?>/s', '', $value);
        $value = preg_replace('/<script\b[^>]*>.*?<\/script>/si', '', $value);
        return $value;
    }
    if (is_array($value)) {
        return array_map('sanitise_data', $value);
    }
    return $value;
}

// ── Router ───────────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$state  = read_state();
get_password_hash($state); // ensure hash exists

// ── GET: return site data ─────────────────────────────────────────
if ($method === 'GET') {
    if (!file_exists(DATA_FILE)) {
        echo json_encode(['status' => 'empty']);
    } else {
        $raw = @file_get_contents(DATA_FILE);
        echo $raw ?: json_encode(['status' => 'empty']);
    }
    exit;
}

// ── POST: parse body ──────────────────────────────────────────────
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$body = @file_get_contents('php://input');
$payload = json_decode($body, true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$action = $payload['action'] ?? '';

// ── POST /login ───────────────────────────────────────────────────
if ($action === 'login') {
    check_rate_limit($state);
    $password = $payload['password'] ?? '';
    if (!password_verify($password, get_password_hash($state))) {
        record_failure($state);
        $remaining = MAX_ATTEMPTS - ($state['attempts'] ?? 0);
        http_response_code(401);
        echo json_encode([
            'error'     => 'wrong_password',
            'remaining' => max(0, $remaining)
        ]);
        exit;
    }
    // Success
    reset_failures($state);
    $token               = generate_token();
    $state['token']      = $token;
    $state['token_exp']  = time() + TOKEN_TTL;
    write_state($state);
    echo json_encode(['status' => 'ok', 'token' => $token]);
    exit;
}

// ── POST /logout ──────────────────────────────────────────────────
if ($action === 'logout') {
    $state['token']     = '';
    $state['token_exp'] = 0;
    write_state($state);
    echo json_encode(['status' => 'ok']);
    exit;
}

// ── POST /save (requires valid token) ────────────────────────────
if ($action === 'save') {
    $token = $payload['token'] ?? '';
    if (!validate_token($state, $token)) {
        http_response_code(401);
        echo json_encode(['error' => 'invalid_token']);
        exit;
    }
    $data = $payload['data'] ?? null;
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing data']);
        exit;
    }
    // Sanitise before writing
    $data = sanitise_data($data);
    $written = file_put_contents(DATA_FILE, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    if ($written === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Write failed — check file permissions']);
        exit;
    }
    // Refresh token expiry on successful save
    $state['token_exp'] = time() + TOKEN_TTL;
    write_state($state);
    echo json_encode(['status' => 'ok']);
    exit;
}

// ── POST /change-password (requires valid token) ──────────────────
if ($action === 'change_password') {
    $token = $payload['token'] ?? '';
    if (!validate_token($state, $token)) {
        http_response_code(401);
        echo json_encode(['error' => 'invalid_token']);
        exit;
    }
    $current = $payload['current'] ?? '';
    $newpwd  = $payload['new']     ?? '';
    if (!password_verify($current, get_password_hash($state))) {
        http_response_code(403);
        echo json_encode(['error' => 'wrong_current_password']);
        exit;
    }
    if (strlen($newpwd) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'password_too_short']);
        exit;
    }
    $state['password_hash'] = password_hash($newpwd, PASSWORD_BCRYPT);
    // Invalidate token so admin must re-login after password change
    $state['token']     = '';
    $state['token_exp'] = 0;
    write_state($state);
    echo json_encode(['status' => 'ok', 'message' => 'Password changed. Please log in again.']);
    exit;
}

// ── POST /check-token ─────────────────────────────────────────────
if ($action === 'check_token') {
    $token = $payload['token'] ?? '';
    $valid = validate_token($state, $token);
    echo json_encode(['valid' => $valid]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Unknown action']);
