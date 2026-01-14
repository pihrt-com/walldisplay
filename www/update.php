<?php
// ===== CONFIG =====
$SECRET_TOKEN = 'SECRET_TOKEN';

$OUTPUT_FILE = __DIR__ . '/status.json';

// NEW: power history file
$POWER_HISTORY_FILE = __DIR__ . '/power_history.json';

// save power sample max 1x per 60 seconds
$POWER_SAMPLE_INTERVAL = 60;

// keep last 12 hours
$POWER_HISTORY_SECONDS = 12 * 3600;


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

$data['received_at'] = time();

// ===== WRITE STATUS FILE (atomic) =====
$tmp = $OUTPUT_FILE . '.tmp';

if (file_put_contents($tmp, json_encode($data, JSON_PRETTY_PRINT)) === false) {
    http_response_code(500);
    exit('Write failed');
}

rename($tmp, $OUTPUT_FILE);


// ===== POWER HISTORY =====
$now = time();

// extract power data (if present)
$power = $data['power'] ?? null;
$power_kw = null;

if (is_array($power)) {
    if (isset($power['power_kw']) && is_numeric($power['power_kw'])) {
        $power_kw = (float)$power['power_kw'];
    } elseif (isset($power['power_w']) && is_numeric($power['power_w'])) {
        $power_kw = ((float)$power['power_w']) / 1000.0;
    }
}

// only store if valid power
if ($power_kw !== null) {

    // read existing history
    $history = [
        "generated_at" => $now,
        "samples" => []
    ];

    if (file_exists($POWER_HISTORY_FILE)) {
        $rawHistory = file_get_contents($POWER_HISTORY_FILE);
        $decoded = json_decode($rawHistory, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $history = $decoded;
            if (!isset($history["samples"]) || !is_array($history["samples"])) {
                $history["samples"] = [];
            }
        }
    }

    // check last sample time (avoid writing too frequently)
    $samples = $history["samples"];
    $lastTs = null;
    if (count($samples) > 0) {
        $last = $samples[count($samples) - 1];
        if (isset($last["ts"])) $lastTs = (int)$last["ts"];
    }

    if ($lastTs === null || ($now - $lastTs) >= $POWER_SAMPLE_INTERVAL) {

        // append sample
        $samples[] = [
            "ts" => $now,
            "kw" => round($power_kw, 3),
        ];

        // prune older than 12 hours
        $minTs = $now - $POWER_HISTORY_SECONDS;
        $samples = array_values(array_filter($samples, function($s) use ($minTs) {
            return isset($s["ts"]) && (int)$s["ts"] >= $minTs;
        }));

        $history["generated_at"] = $now;
        $history["samples"] = $samples;

        // write atomic
        $tmp2 = $POWER_HISTORY_FILE . '.tmp';
        file_put_contents($tmp2, json_encode($history, JSON_PRETTY_PRINT));
        rename($tmp2, $POWER_HISTORY_FILE);
    }
}


// ===== OK =====
http_response_code(200);
echo 'OK';
