<?php
/**
 * set_location.php
 * Password-protected endpoint that updates the school's GPS center.
 */

header('Content-Type: application/json');
require_once __DIR__ . '/password_helper.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['password']) || !pw_verify_password($input['password'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Wrong password']);
    exit;
}

if (!isset($input['lat']) || !isset($input['lng']) || $input['lat'] === '' || $input['lng'] === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Live location missing — allow GPS and try again']);
    exit;
}

$lat = (float)$input['lat'];
$lng = (float)$input['lng'];

$dataDir    = __DIR__ . '/json';
$configFile = $dataDir . '/config.json';

$config = [
    'lat'         => $lat,
    'lng'         => $lng,
    'radius'      => 100,
    'school_time' => '08:00 AM'
];

if (!is_dir($dataDir)) mkdir($dataDir, 0777, true);

// Preserve existing fields (radius, school_time, etc.) instead of wiping them out
if (file_exists($configFile)) {
    $existing = json_decode(file_get_contents($configFile), true);
    if (is_array($existing)) {
        $config = array_merge($config, $existing);
    }
}

// New lat/lng always overwrite whatever was there before
$config['lat']        = $lat;
$config['lng']        = $lng;
$config['updated_at'] = date('Y-m-d H:i:s');

$ok = file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));

if ($ok === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Could not write config.json']);
    exit;
}

echo json_encode(['success' => true, 'config' => $config]);