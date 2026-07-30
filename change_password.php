<?php
/**
 * change_password.php
 * "Forgot Password" endpoint — user supplies CURRENT password + NEW password.
 * If current password matches json/passwords.json (or default 8982 if file
 * doesn't exist yet), the password is updated and saved to json/passwords.json.
 * This single admin password is shared by: dashboard login, school time
 * change, location change, and teacher management.
 */

header('Content-Type: application/json');
require_once __DIR__ . '/password_helper.php';

$input = json_decode(file_get_contents('php://input'), true);

$currentPassword = isset($input['current_password']) ? (string)$input['current_password'] : '';
$newPassword     = isset($input['new_password']) ? trim((string)$input['new_password']) : '';

if ($currentPassword === '' || $newPassword === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Current aur new password dono zaroori hain']);
    exit;
}

if ($currentPassword !== pw_get_admin_password()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Current password galat hai']);
    exit;
}

if (strlen($newPassword) < 4) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'New password kam se kam 4 characters ka hona chahiye']);
    exit;
}

$ok = pw_set_admin_password($newPassword);

if ($ok === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Password save nahi ho paya']);
    exit;
}

echo json_encode(['success' => true, 'message' => 'Password successfully change ho gaya']);