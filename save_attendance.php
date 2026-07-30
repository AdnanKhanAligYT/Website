<?php
/**
 * save_attendance.php
 * Saves attendance record with teacher validation and consistent date format.
 */

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

$dataDir        = __DIR__ . '/json';
$imgDir         = __DIR__ . '/images/attendance';
$attendanceFile = $dataDir . '/attendance.json';
$teachersFile   = $dataDir . '/Teachers.json';

if (!is_dir($dataDir)) mkdir($dataDir, 0755, true);
if (!is_dir($imgDir))  mkdir($imgDir, 0755, true);
if (!file_exists($attendanceFile)) file_put_contents($attendanceFile, '[]');

$raw   = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!$input || empty($input['name'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid or missing data (name required)']);
    exit;
}

$name  = trim($input['name']);
$lat   = (isset($input['lat']) && is_numeric($input['lat'])) ? (float)$input['lat'] : null;
$lng   = (isset($input['lng']) && is_numeric($input['lng'])) ? (float)$input['lng'] : null;
$date  = !empty($input['date']) ? $input['date'] : date('n/j/Y');
$time  = !empty($input['time']) ? $input['time'] : date('h:i:s A');
$photoData = isset($input['photo']) ? $input['photo'] : null;

// ---- 1. Validate teacher exists ----
if (!file_exists($teachersFile)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Teachers.json not found']);
    exit;
}
$teachers = json_decode(file_get_contents($teachersFile), true);
if (!is_array($teachers)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Invalid Teachers.json']);
    exit;
}
$validNames = array_map('trim', array_column($teachers, 'name'));
if (!in_array($name, $validNames)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Teacher not found in system']);
    exit;
}

// ---- 2. Photo size guard (max ~5MB decoded) ----
if ($photoData !== null) {
    // Extract base64 part
    if (preg_match('/^data:image\/\w+;base64,/', $photoData)) {
        $base64 = substr($photoData, strpos($photoData, ',') + 1);
        $decoded = base64_decode($base64, true);
        if ($decoded === false) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid image data']);
            exit;
        }
        if (strlen($decoded) > 5 * 1024 * 1024) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Photo too large (max 5MB)']);
            exit;
        }
    }
}

// ---- 3. Duplicate check with normalized date ----
// Ensure date is in n/j/Y format (consistent with server's date('n/j/Y'))
$dateParts = date_parse($date);
if ($dateParts === false || $dateParts['error_count'] > 0) {
    // fallback: use current date
    $date = date('n/j/Y');
} else {
    // Reformat to n/j/Y (e.g., 7/1/2026)
    $date = $dateParts['month'] . '/' . $dateParts['day'] . '/' . $dateParts['year'];
}

if (file_exists($attendanceFile)) {
    $existingRecords = json_decode(file_get_contents($attendanceFile), true);
    if (is_array($existingRecords)) {
        foreach ($existingRecords as $r) {
            if (isset($r['Name'], $r['Date']) && trim($r['Name']) === $name && $r['Date'] === $date) {
                http_response_code(409);
                echo json_encode(['success' => false, 'error' => 'Aaj ki attendance already mark ho chuki hai']);
                exit;
            }
        }
    }
}

// ---- 4. Get School_Time ----
$schoolTime = '';
if (file_exists($teachersFile)) {
    $teachers = json_decode(file_get_contents($teachersFile), true);
    if (is_array($teachers)) {
        foreach ($teachers as $t) {
            if (isset($t['name']) && trim($t['name']) === $name) {
                if (isset($t['school_time']))      $schoolTime = $t['school_time'];
                elseif (isset($t['School_Time']))  $schoolTime = $t['School_Time'];
                break;
            }
        }
    }
}

if ($schoolTime === '') {
    $configFile = $dataDir . '/config.json';
    if (file_exists($configFile)) {
        $cfg = json_decode(file_get_contents($configFile), true);
        if (is_array($cfg) && !empty($cfg['school_time'])) {
            $schoolTime = $cfg['school_time'];
        }
    }
    if ($schoolTime === '') $schoolTime = '08:00 AM';
}

// ---- 5. Save photo ----
$imageLink = '';
if ($photoData && preg_match('/^data:image\/(\w+);base64,/', $photoData, $m)) {
    $ext    = ($m[1] === 'jpeg') ? 'jpg' : $m[1];
    $base64 = substr($photoData, strpos($photoData, ',') + 1);
    $rawImg = base64_decode($base64);
    if ($rawImg !== false) {
        $safeName = preg_replace('/[^A-Za-z0-9]+/', '_', $name);
        $filename = $safeName . '_' . date('Ymd_His') . '_' . substr(uniqid(), -4) . '.' . $ext;
        $filepath = $imgDir . '/' . $filename;
        file_put_contents($filepath, $rawImg);
        $imageLink = 'images/attendance/' . $filename;
    }
}

$record = [
    'Name'        => $name,
    'Date'        => $date,
    'Time'        => $time,
    'School_Time' => $schoolTime,
    'Image Link'  => $imageLink,
    'Lat'         => $lat,
    'Lng'         => $lng,
];

// ---- 6. Append with locking ----
$fp = fopen($attendanceFile, 'c+');
if (!$fp) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Could not open attendance.json']);
    exit;
}

if (flock($fp, LOCK_EX)) {
    $contents = stream_get_contents($fp);
    $records  = json_decode($contents, true);
    if (!is_array($records)) $records = [];

    $records[] = $record;

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($records, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    fflush($fp);
    flock($fp, LOCK_UN);
} else {
    fclose($fp);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Could not lock attendance.json']);
    exit;
}
fclose($fp);

echo json_encode(['success' => true, 'record' => $record]);