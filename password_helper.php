<?php
/**
 * password_helper.php
 * Shared functions for reading/writing the single admin password.
 */

function pw_file_path() {
    return __DIR__ . '/json/passwords.json';
}

function pw_get_admin_password() {
    $file = pw_file_path();
    $default = '8982';

    if (!file_exists($file)) {
        return $default;
    }

    $data = json_decode(file_get_contents($file), true);
    if (is_array($data) && !empty($data['admin_password'])) {
        return (string)$data['admin_password'];
    }
    return $default;
}

function pw_set_admin_password($newPassword) {
    $dataDir = __DIR__ . '/json';
    if (!is_dir($dataDir)) mkdir($dataDir, 0777, true);

    $config = [
        'admin_password' => (string)$newPassword,
        'updated_at'     => date('Y-m-d H:i:s')
    ];

    return file_put_contents(pw_file_path(), json_encode($config, JSON_PRETTY_PRINT));
}

// ---- नया verify function ----
function pw_verify_password($input) {
    return (string)$input === pw_get_admin_password();
}