<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

define('DATA_FILE', __DIR__ . '/data.json');
define('UPLOAD_DIR', __DIR__ . '/uploads/');

if (!file_exists(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0777, true);
if (!file_exists(DATA_FILE)) file_put_contents(DATA_FILE, '[]');

function read_data() {
    $fp = fopen(DATA_FILE, 'r');
    flock($fp, LOCK_SH);
    $content = file_get_contents(DATA_FILE);
    flock($fp, LOCK_UN);
    fclose($fp);
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

function write_data($data) {
    $fp = fopen(DATA_FILE, 'c');
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

function respond($ok, $payload = []) {
    echo json_encode(array_merge(['ok' => $ok], $payload));
    exit;
}

$action = $_REQUEST['action'] ?? '';

switch ($action) {

    case 'list': {
        $data = read_data();
        usort($data, fn($a, $b) => $b['uploadedAt'] <=> $a['uploadedAt']);
        respond(true, ['documents' => $data]);
        break;
    }

    case 'categories': {
        $data = read_data();
        $cats = array_values(array_unique(array_map(fn($d) => $d['category'], $data)));
        sort($cats);
        respond(true, ['categories' => $cats]);
        break;
    }

    case 'upload': {
        if (empty($_FILES['file'])) respond(false, ['error' => 'No file received']);

        $file = $_FILES['file'];
        if ($file['error'] !== UPLOAD_ERR_OK) respond(false, ['error' => 'Upload error code ' . $file['error']]);

        $origName = basename($file['name']);
        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
        $allowed = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!in_array($ext, $allowed)) respond(false, ['error' => 'Only PDF and image files allowed']);

        $id = uniqid('doc_', true);
        $storedName = $id . '.' . $ext;
        $target = UPLOAD_DIR . $storedName;

        if (!move_uploaded_file($file['tmp_name'], $target)) {
            respond(false, ['error' => 'Failed to save file']);
        }

        $type = ($ext === 'pdf') ? 'pdf' : 'image';

        $entry = [
            'id' => $id,
            'storedName' => $storedName,
            'originalName' => $origName,
            'category' => trim($_POST['category'] ?? 'General') ?: 'General',
            'description' => trim($_POST['description'] ?? ''),
            'type' => $type,
            'size' => filesize($target),
            'uploadedAt' => time(),
        ];

        $data = read_data();
        $data[] = $entry;
        write_data($data);

        respond(true, ['document' => $entry]);
        break;
    }

    case 'delete': {
        $id = $_POST['id'] ?? '';
        $data = read_data();
        $found = null;
        $remaining = [];
        foreach ($data as $d) {
            if ($d['id'] === $id) { $found = $d; }
            else { $remaining[] = $d; }
        }
        if (!$found) respond(false, ['error' => 'Not found']);
        $path = UPLOAD_DIR . $found['storedName'];
        if (file_exists($path)) unlink($path);
        write_data($remaining);
        respond(true);
        break;
    }

    case 'rename': {
        $id = $_POST['id'] ?? '';
        $newName = trim($_POST['newName'] ?? '');
        if (!$newName) respond(false, ['error' => 'Name required']);
        $data = read_data();
        $changed = false;
        foreach ($data as &$d) {
            if ($d['id'] === $id) { $d['originalName'] = $newName; $changed = true; break; }
        }
        if (!$changed) respond(false, ['error' => 'Not found']);
        write_data($data);
        respond(true);
        break;
    }

    case 'move': {
        $id = $_POST['id'] ?? '';
        $category = trim($_POST['category'] ?? 'General') ?: 'General';
        $data = read_data();
        $changed = false;
        foreach ($data as &$d) {
            if ($d['id'] === $id) { $d['category'] = $category; $changed = true; break; }
        }
        if (!$changed) respond(false, ['error' => 'Not found']);
        write_data($data);
        respond(true);
        break;
    }

    case 'update_description': {
        $id = $_POST['id'] ?? '';
        $description = trim($_POST['description'] ?? '');
        $data = read_data();
        $changed = false;
        foreach ($data as &$d) {
            if ($d['id'] === $id) { $d['description'] = $description; $changed = true; break; }
        }
        if (!$changed) respond(false, ['error' => 'Not found']);
        write_data($data);
        respond(true);
        break;
    }

    default:
        respond(false, ['error' => 'Unknown action']);
}
