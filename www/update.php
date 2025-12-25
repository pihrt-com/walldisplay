<?php
// ===== CONFIG =====
$SECRET_TOKEN = 'SECRET_TOKEN';
$OUTPUT_FILE = __DIR__ . '/status.json';

// ===== ONLY POST =====
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method Not Allowed');
}

// ===== AUTH HEADER =====
$headers = getallheaders();
$auth = $headers['Authorization'] ?? '';

if (!preg_match('/Bearer\s+(.*)$/i', $auth, $m)) {
    http_response_code(401);
    exit('Missing token');
}

$token = trim($m[1]);

if (!hash_equals($SECRET_TOKEN, $token)) {
    http_response_code(403);
    exit('Invalid token');
}

// ===== READ BODY =====
$raw = file_get_contents('php://input');

if (!$raw) {
    http_response_code(400);
    exit('Empty body');
}

// ===== VALIDATE JSON =====
$data = json_decode($raw, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    exit('Invalid JSON');
}

// ===== WRITE FILE (atomic) =====
$tmp = $OUTPUT_FILE . '.tmp';

if (file_put_contents($tmp, json_encode($data, JSON_PRETTY_PRINT)) === false) {
    http_response_code(500);
    exit('Write failed');
}

rename($tmp, $OUTPUT_FILE);

// ===== OK =====
http_response_code(200);
echo 'OK';
