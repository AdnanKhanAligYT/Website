<?php
/**
 * get_attendance.php
 * Returns the full attendance list as a JSON array, in the exact same
 * shape the app previously received from the Google Sheet (Name, Date,
 * Time, School_Time, "Image Link"). Replaces opensheet.elk.sh.
 */

header('Content-Type: application/json');
header('Cache-Control: no-store');

$file = __DIR__ . '/json/attendance.json';

if (!file_exists($file)) {
    echo '[]';
    exit;
}

$contents = file_get_contents($file);
$data = json_decode($contents, true);

if (!is_array($data)) {
    echo '[]';
    exit;
}

echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
