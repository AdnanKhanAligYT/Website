<?php
/**
 * verify_dashboard_password.php
 * Local replacement for the old "Password" Google-Sheet tab.
 */

header('Content-Type: application/json');
require_once __DIR__ . '/password_helper.php';

$input = json_decode(file_get_contents('php://input'), true);
$pass  = isset($input['password']) ? (string)$input['password'] : '';

if ($pass !== '' && pw_verify_password($pass)) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Incorrect password']);
}