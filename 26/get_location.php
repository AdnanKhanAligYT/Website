<?php
/**
 * get_location.php
 * Returns the current school GPS center (lat/lng), allowed radius,
 * AND the current school_time from json/config.json.
 * Falls back to defaults if not set yet.
 */

header('Content-Type: application/json');
header('Cache-Control: no-store');

$DEFAULTS = [
    'lat'         => 27.554926,
    'lng'         => 78.086247,
    'radius'      => 100,
    'school_time' => '08:00 AM'
];

$file = __DIR__ . '/json/config.json';

if (!file_exists($file)) {
    echo json_encode($DEFAULTS);
    exit;
}

$data = json_decode(file_get_contents($file), true);
if (!is_array($data) || !isset($data['lat']) || !isset($data['lng'])) {
    echo json_encode($DEFAULTS);
    exit;
}

echo json_encode([
    'lat'         => (float)$data['lat'],
    'lng'         => (float)$data['lng'],
    'radius'      => isset($data['radius']) ? (float)$data['radius'] : $DEFAULTS['radius'],
    'school_time' => !empty($data['school_time']) ? $data['school_time'] : $DEFAULTS['school_time']
]);