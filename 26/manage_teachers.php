<?php
/**
 * manage_teachers.php
 * Password-protected endpoint for Dashboard's "Admin Tools" panel.
 * Adds, renames, or deletes teachers in json/Teachers.json.
 *
 * POST body examples:
 *   { "password":"8982", "action":"add",    "name":"Miss New Teacher" }
 *   { "password":"8982", "action":"rename", "old_name":"Miss Ifra", "new_name":"Mrs. Ifra Khan" }
 *   { "password":"8982", "action":"delete", "name":"Miss Ifra" }
 *
 * Password is stored in json/passwords.json (see password_helper.php).
 */

header('Content-Type: application/json');
require_once __DIR__ . '/password_helper.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['password']) || !pw_verify_password($input['password'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Wrong password']);
    exit;
}

$action = isset($input['action']) ? $input['action'] : '';
$dataDir = __DIR__ . '/json';
$teachersFile = $dataDir . '/Teachers.json';

if (!is_dir($dataDir)) mkdir($dataDir, 0755, true);

$teachers = [];
if (file_exists($teachersFile)) {
    $decoded = json_decode(file_get_contents($teachersFile), true);
    if (is_array($decoded)) $teachers = $decoded;
}

function respond_with_list($teachers, $extra = []) {
    echo json_encode(array_merge(['success' => true, 'teachers' => $teachers], $extra));
    exit;
}

if ($action === 'add') {
    $name = isset($input['name']) ? trim($input['name']) : '';
    if ($name === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Teacher ka naam required hai']);
        exit;
    }

    foreach ($teachers as $t) {
        if (isset($t['name']) && strcasecmp(trim($t['name']), $name) === 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Ye teacher pehle se maujood hai']);
            exit;
        }
    }

    $maxId = 0;
    foreach ($teachers as $t) {
        if (isset($t['id']) && (int)$t['id'] > $maxId) $maxId = (int)$t['id'];
    }

    $teachers[] = [
        'house'            => '',
        'id'               => $maxId + 1,
        'class_teacher'    => '',
        'extra_roles'      => [''],
        'name'             => $name,
        'subject'          => '',
        'house_role'       => '',
        'Employee ID'      => '',
        'Photo URL'        => '',
        'Gender'           => '',
        'DOB'              => '',
        'Phone'            => '',
        'Email'            => '',
        'Address'          => '',
        'Qualification'    => '',
        'Employment Type'  => 'Full-Time',
        'Documents'        => ['Aadhar' => false, 'Certificates' => false],
        'Status'           => 'Active',
        'Shift'            => 'Morning',
        'Service'          => [['Join' => date('n/j/Y'), 'Leave' => '']]
    ];

} elseif ($action === 'rename') {
    $oldName = isset($input['old_name']) ? trim($input['old_name']) : '';
    $newName = isset($input['new_name']) ? trim($input['new_name']) : '';

    if ($oldName === '' || $newName === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Old aur new naam dono required hain']);
        exit;
    }

    $found = false;
    foreach ($teachers as &$t) {
        if (isset($t['name']) && trim($t['name']) === $oldName) {
            $t['name'] = $newName;
            $found = true;
            break;
        }
    }
    unset($t);

    if (!$found) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Teacher nahi mila']);
        exit;
    }

} elseif ($action === 'delete') {
    $name = isset($input['name']) ? trim($input['name']) : '';
    if ($name === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Teacher ka naam required hai']);
        exit;
    }

    $before = count($teachers);
    $teachers = array_values(array_filter($teachers, function($t) use ($name) {
        return !(isset($t['name']) && trim($t['name']) === $name);
    }));

    if (count($teachers) === $before) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Teacher nahi mila']);
        exit;
    }

} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid action']);
    exit;
}

$ok = file_put_contents($teachersFile, json_encode($teachers, JSON_PRETTY_PRINT));

if ($ok === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Teachers.json save nahi ho paya']);
    exit;
}

respond_with_list($teachers);