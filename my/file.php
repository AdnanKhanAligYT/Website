<?php
define('DATA_FILE', __DIR__ . '/data.json');
define('UPLOAD_DIR', __DIR__ . '/uploads/');

$id = $_GET['id'] ?? '';
$mode = $_GET['mode'] ?? 'view'; // view (inline) or download (attachment)

$data = json_decode(file_get_contents(DATA_FILE), true) ?: [];
$doc = null;
foreach ($data as $d) {
    if ($d['id'] === $id) { $doc = $d; break; }
}

if (!$doc) {
    http_response_code(404);
    echo 'File not found';
    exit;
}

$path = UPLOAD_DIR . $doc['storedName'];
if (!file_exists($path)) {
    http_response_code(404);
    echo 'File missing on disk';
    exit;
}

$mime = ($doc['type'] === 'pdf') ? 'application/pdf' : mime_content_type($path);
$disposition = ($mode === 'download') ? 'attachment' : 'inline';
$safeName = str_replace('"', '', $doc['originalName']);

header('Content-Type: ' . $mime);
header("Content-Disposition: $disposition; filename=\"$safeName\"");
header('Content-Length: ' . filesize($path));
header('Cache-Control: public, max-age=86400');
readfile($path);
