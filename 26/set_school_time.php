<?php
/**
 * set_school_time.php
 * Updates school time — password protected.
 */

header('Content-Type: application/json');
require_once __DIR__ . '/password_helper.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['password']) || !pw_verify_password($input['password'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Wrong password']);
    exit;
}

$schoolTime = isset($input['school_time']) ? trim($input['school_time']) : '';

if ($schoolTime === '' || !preg_match('/^\d{1,2}:\d{2}\s?(AM|PM)$/i', $schoolTime)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid time format. Use hh:mm AM/PM']);
    exit;
}

// Normalize
if (preg_match('/^(\d{1,2}):(\d{2})\s?(am|pm)$/i', $schoolTime, $m)) {
    $h = str_pad($m[1], 2, '0', STR_PAD_LEFT);
    $schoolTime = "{$h}:{$m[2]} " . strtoupper($m[3]);
}

$dataDir    = __DIR__ . '/json';
$configFile = $dataDir . '/config.json';

if (!is_dir($dataDir)) mkdir($dataDir, 0777, true);

$config = [
    'lat'         => 27.554926,
    'lng'         => 78.086247,
    'radius'      => 100,
    'school_time' => '08:00 AM'
];

if (file_exists($configFile)) {
    $existing = json_decode(file_get_contents($configFile), true);
    if (is_array($existing)) {
        $config = array_merge($config, $existing);
    }
}

$config['school_time'] = $schoolTime;
$config['updated_at']  = date('Y-m-d H:i:s');

$ok = file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));

if ($ok === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Could not write config.json']);
    exit;
}

echo json_encode(['success' => true, 'config' => $config]);