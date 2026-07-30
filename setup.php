<?php
/**
 * Study Topic Manager — Termux Setup & Config Manager
 * File: setup.php (same folder mein rakhna jahan api.php aur study.html hai)
 */

define('BASE_DIR', __DIR__);
define('DATA_DIR', BASE_DIR . '/data');
define('CONFIG_FILE', DATA_DIR . '/config.json');
define('LOGO_FILE', DATA_DIR . '/logo.txt'); // base64 encoded logo

// ── Directory banao agar nahi hai ──
if (!is_dir(DATA_DIR)) @mkdir(DATA_DIR, 0775, true);

// ── PHP.ini location dhundo (Termux) ──
function findPhpIni() {
    $candidates = [
        '/data/data/com.termux/files/usr/lib/php.ini',
        '/data/data/com.termux/files/usr/etc/php.ini',
        ini_get('cfg_file_path'),
        php_ini_loaded_file(),
    ];
    foreach ($candidates as $p) {
        if ($p && file_exists($p)) return $p;
    }
    // php --ini se dhundo
    $out = shell_exec('php --ini 2>/dev/null | grep "Loaded Configuration"');
    if ($out && preg_match('/:\s*(.+)/', $out, $m)) {
        $p = trim($m[1]);
        if ($p && file_exists($p)) return $p;
    }
    return null;
}

// ── Config read/write ──
function readConfig() {
    if (!file_exists(CONFIG_FILE)) {
        return [
            'appTitle'   => 'Study Topic Manager',
            'accentColor'=> '#e63946',
            'darkMode'   => true,
        ];
    }
    return json_decode(file_get_contents(CONFIG_FILE), true) ?? [];
}
function writeConfig($cfg) {
    file_put_contents(CONFIG_FILE, json_encode($cfg, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// ── Logo read/write ──
function readLogo() {
    if (!file_exists(LOGO_FILE)) return null;
    return trim(file_get_contents(LOGO_FILE));
}
function writeLogo($b64) {
    file_put_contents(LOGO_FILE, $b64);
}

// ── JSON responses ──
function jsonOut($data) {
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// ── AJAX Handler ──
if (isset($_GET['ajax'])) {
    $action = $_GET['ajax'];

    // Save logo
    if ($action === 'saveLogo') {
        $b64 = $_POST['logo'] ?? '';
        if (!$b64) jsonOut(['ok'=>false, 'msg'=>'Logo data missing']);
        writeLogo($b64);
        jsonOut(['ok'=>true]);
    }

    // Delete logo
    if ($action === 'deleteLogo') {
        if (file_exists(LOGO_FILE)) @unlink(LOGO_FILE);
        jsonOut(['ok'=>true]);
    }

    // Save config
    if ($action === 'saveConfig') {
        $cfg = readConfig();
        $cfg['appTitle']    = trim($_POST['appTitle'] ?? 'Study Topic Manager') ?: 'Study Topic Manager';
        $cfg['accentColor'] = $_POST['accentColor'] ?? '#e63946';
        $cfg['darkMode']    = ($_POST['darkMode'] ?? '1') === '1';
        writeConfig($cfg);
        jsonOut(['ok'=>true, 'config'=>$cfg]);
    }

    // Fix php.ini
    if ($action === 'fixPhpIni') {
        $iniPath = findPhpIni();
        if (!$iniPath) {
            // Create a new one
            $iniPath = '/data/data/com.termux/files/usr/lib/php.ini';
        }
        $maxSize   = $_POST['maxSize'] ?? '50M';
        $postSize  = $_POST['postSize'] ?? '55M';
        $execTime  = $_POST['execTime'] ?? '120';
        $memLimit  = $_POST['memLimit'] ?? '256M';
        $tmpDir    = DATA_DIR . '/tmp';
        if (!is_dir($tmpDir)) @mkdir($tmpDir, 0775, true);

        $settings = [
            'upload_max_filesize' => $maxSize,
            'post_max_size'       => $postSize,
            'max_execution_time'  => $execTime,
            'memory_limit'        => $memLimit,
            'upload_tmp_dir'      => $tmpDir,
            'file_uploads'        => 'On',
        ];

        if (file_exists($iniPath) && is_writable($iniPath)) {
            $content = file_get_contents($iniPath);
            foreach ($settings as $key => $val) {
                $pattern = '/^\s*;?\s*' . preg_quote($key, '/') . '\s*=.*/m';
                $replace = $key . ' = ' . $val;
                if (preg_match($pattern, $content)) {
                    $content = preg_replace($pattern, $replace, $content);
                } else {
                    $content .= "\n" . $replace;
                }
            }
            file_put_contents($iniPath, $content);
            jsonOut(['ok'=>true, 'path'=>$iniPath, 'applied'=>$settings]);
        } else {
            // Write a custom ini using PHP_INI_SCAN_DIR
            $customIni = BASE_DIR . '/custom.ini';
            $lines = ["[PHP]\n"];
            foreach ($settings as $k => $v) $lines[] = "$k = $v\n";
            file_put_contents($customIni, implode('', $lines));
            jsonOut([
                'ok'      => true,
                'partial' => true,
                'path'    => $customIni,
                'msg'     => 'custom.ini banaya gaya. Ab server restart karo: php -S localhost:8080 (PHP_INI_SCAN_DIR=. se run karo)',
                'cmd'     => 'PHP_INI_SCAN_DIR="' . BASE_DIR . '" php -S localhost:8080',
                'applied' => $settings
            ]);
        }
    }

    // Upload test
    if ($action === 'testUpload') {
        if (!isset($_FILES['testfile'])) jsonOut(['ok'=>false, 'msg'=>'No file received']);
        $err = $_FILES['testfile']['error'];
        if ($err !== UPLOAD_ERR_OK) {
            $msgs = [
                1=>'file php.ini upload_max_filesize se bada',
                2=>'form MAX_FILE_SIZE se bada',
                3=>'partially upload hua',
                4=>'koi file nahi',
                6=>'tmp folder nahi mila',
                7=>'disk write nahi hua',
                8=>'extension ne roka',
            ];
            jsonOut(['ok'=>false, 'msg'=>'Error '.$err.': '.($msgs[$err]??'Unknown'), 'error_code'=>$err]);
        }
        $size = $_FILES['testfile']['size'];
        $name = $_FILES['testfile']['name'];
        $type = $_FILES['testfile']['type'];
        $tmp  = $_FILES['testfile']['tmp_name'];

        // Save to tmp
        $dest = DATA_DIR . '/tmp/test_upload_' . time();
        $saved = @move_uploaded_file($tmp, $dest);
        if (!$saved) $saved = @copy($tmp, $dest);
        if ($saved && file_exists($dest)) @unlink($dest);

        jsonOut([
            'ok'    => true,
            'name'  => $name,
            'size'  => $size,
            'type'  => $type,
            'saved' => $saved,
            'msg'   => $saved ? 'Upload + save dono kaamyab! ✅' : 'File receive hui lekin save nahi hui ❌'
        ]);
    }

    // Get system info
    if ($action === 'sysinfo') {
        $iniPath = findPhpIni();
        jsonOut([
            'php_version'        => PHP_VERSION,
            'php_ini'            => $iniPath ?? 'Nahi mila',
            'upload_max_filesize'=> ini_get('upload_max_filesize'),
            'post_max_size'      => ini_get('post_max_size'),
            'max_execution_time' => ini_get('max_execution_time'),
            'memory_limit'       => ini_get('memory_limit'),
            'upload_tmp_dir'     => ini_get('upload_tmp_dir') ?: sys_get_temp_dir(),
            'file_uploads'       => ini_get('file_uploads') ? 'On' : 'Off',
            'data_dir'           => DATA_DIR,
            'data_writable'      => is_writable(DATA_DIR),
            'tmp_dir'            => DATA_DIR . '/tmp',
            'tmp_writable'       => is_writable(DATA_DIR . '/tmp'),
            'server_software'    => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        ]);
    }

    jsonOut(['ok'=>false, 'msg'=>'Unknown action']);
}

// ── Load data for page ──
$config = readConfig();
$logo   = readLogo();
$iniPath = findPhpIni();
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Setup — Study Topic Manager</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root {
    --bg:      #080505;
    --surf:    #130b0b;
    --surf2:   #1c1010;
    --surf3:   #261515;
    --border:  #3a1818;
    --accent:  #e63946;
    --accent2: #ff6b6b;
    --green:   #34d399;
    --warn:    #fb923c;
    --text:    #f3e8e8;
    --text2:   #b08a8a;
    --text3:   #6b4a4a;
    --mono:    'DM Mono', monospace;
    --r:       12px;
    --tr:      .2s ease;
}
*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'DM Sans',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; }

/* Header */
.top-bar {
    position:sticky; top:0; z-index:100;
    background:var(--surf); border-bottom:1px solid var(--border);
    padding:0 16px; height:56px;
    display:flex; align-items:center; gap:12px;
}
.top-bar-logo { font-size:1.4rem; }
.top-bar-title { font-family:'Syne',sans-serif; font-size:1rem; font-weight:700; color:var(--text); }
.top-bar-sub { font-size:.75rem; color:var(--text3); font-family:var(--mono); }
.back-link {
    margin-left:auto; padding:6px 14px;
    background:var(--surf3); border:1px solid var(--border);
    border-radius:8px; color:var(--text2); font-size:.8rem;
    text-decoration:none; transition:var(--tr);
}
.back-link:hover { color:var(--text); border-color:var(--accent); }

/* Main */
.page { max-width:680px; margin:0 auto; padding:20px 16px 60px; }

/* Section cards */
.card {
    background:var(--surf); border:1px solid var(--border);
    border-radius:var(--r); margin-bottom:16px; overflow:hidden;
}
.card-head {
    padding:14px 18px; border-bottom:1px solid var(--border);
    display:flex; align-items:center; gap:10px;
}
.card-head-icon { font-size:1.2rem; }
.card-head-text { }
.card-head-text h3 { font-family:'Syne',sans-serif; font-size:.95rem; font-weight:700; }
.card-head-text p { font-size:.78rem; color:var(--text2); margin-top:2px; }
.card-body { padding:18px; }

/* Status badge */
.badge {
    display:inline-flex; align-items:center; gap:5px;
    padding:3px 10px; border-radius:99px; font-size:.72rem;
    font-family:var(--mono); font-weight:500;
}
.badge.ok  { background:rgba(52,211,153,.12); color:var(--green); border:1px solid rgba(52,211,153,.25); }
.badge.bad { background:rgba(230,57,70,.12); color:var(--accent); border:1px solid rgba(230,57,70,.25); }
.badge.warn{ background:rgba(251,146,60,.12); color:var(--warn); border:1px solid rgba(251,146,60,.25); }

/* Sysinfo grid */
.info-grid { display:grid; gap:8px; }
.info-row {
    display:flex; align-items:flex-start; justify-content:space-between; gap:12px;
    padding:8px 12px; background:var(--surf2); border-radius:8px;
    font-size:.8rem;
}
.info-key { color:var(--text2); white-space:nowrap; flex-shrink:0; }
.info-val { color:var(--text); font-family:var(--mono); word-break:break-all; text-align:right; }

/* Form elements */
label.field-label { display:block; font-size:.78rem; color:var(--text2); margin-bottom:6px; margin-top:14px; }
label.field-label:first-child { margin-top:0; }
input[type=text], input[type=color], select {
    width:100%; padding:9px 13px;
    background:var(--surf2); border:1px solid var(--border);
    border-radius:8px; color:var(--text); font-size:.85rem;
    outline:none; transition:var(--tr);
}
input[type=text]:focus, select:focus { border-color:var(--accent); }
input[type=color] { height:42px; cursor:pointer; padding:4px 8px; }

/* Row of inputs */
.row2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
@media(max-width:420px) { .row2 { grid-template-columns:1fr; } }

/* Buttons */
.btn {
    display:inline-flex; align-items:center; gap:7px;
    padding:9px 18px; border-radius:8px; font-size:.85rem;
    font-weight:600; cursor:pointer; border:none;
    transition:var(--tr); font-family:'DM Sans',sans-serif;
}
.btn-primary { background:var(--accent); color:#fff; }
.btn-primary:hover { background:var(--accent2); }
.btn-ghost { background:var(--surf3); color:var(--text); border:1px solid var(--border); }
.btn-ghost:hover { border-color:var(--accent); color:var(--accent); }
.btn-danger { background:rgba(230,57,70,.15); color:var(--accent); border:1px solid rgba(230,57,70,.3); }
.btn-danger:hover { background:rgba(230,57,70,.25); }
.btn:disabled { opacity:.4; cursor:not-allowed; }
.btn-row { display:flex; gap:10px; flex-wrap:wrap; margin-top:14px; }

/* Logo upload area */
.logo-zone {
    border:2px dashed var(--border); border-radius:10px;
    padding:24px; text-align:center; cursor:pointer;
    transition:var(--tr); position:relative;
    min-height:100px; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:8px;
}
.logo-zone:hover { border-color:var(--accent); background:rgba(230,57,70,.04); }
.logo-zone.has-logo { border-style:solid; border-color:var(--accent); }
.logo-preview { max-height:70px; max-width:200px; object-fit:contain; }
.logo-placeholder { font-size:2rem; }
.logo-zone-text { font-size:.78rem; color:var(--text2); }
#logo-file { display:none; }

/* Mono code block */
.code-block {
    background:var(--surf2); border:1px solid var(--border);
    border-radius:8px; padding:12px 14px;
    font-family:var(--mono); font-size:.78rem; color:var(--text2);
    word-break:break-all; white-space:pre-wrap;
    user-select:all; cursor:text;
}

/* Upload test */
.upload-test-area {
    border:2px dashed var(--border); border-radius:10px;
    padding:20px; text-align:center; cursor:pointer;
    transition:var(--tr);
}
.upload-test-area:hover { border-color:var(--warn); }
.upload-test-area input { display:none; }

/* Result area */
.result-box {
    padding:12px 14px; border-radius:8px; font-size:.82rem;
    margin-top:12px; display:none; line-height:1.6;
}
.result-box.show { display:block; }
.result-box.ok-box  { background:rgba(52,211,153,.1); border:1px solid rgba(52,211,153,.2); color:var(--green); }
.result-box.err-box { background:rgba(230,57,70,.1); border:1px solid rgba(230,57,70,.2); color:var(--accent); }
.result-box.info-box{ background:rgba(167,139,250,.1); border:1px solid rgba(167,139,250,.2); color:#c4b5fd; }

/* Spinner */
.spin {
    display:inline-block; width:14px; height:14px;
    border:2px solid rgba(255,255,255,.25); border-top-color:#fff;
    border-radius:50%; animation:spin .7s linear infinite;
}
@keyframes spin { to { transform:rotate(360deg); } }

/* Toast */
#toast {
    position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
    background:var(--surf3); border:1px solid var(--border);
    color:var(--text); padding:10px 20px; border-radius:99px;
    font-size:.83rem; z-index:999; opacity:0; pointer-events:none;
    transition:.3s; white-space:nowrap;
}
#toast.show { opacity:1; }
</style>
</head>
<body>

<div class="top-bar">
    <span class="top-bar-logo">⚙️</span>
    <div>
        <div class="top-bar-title">Setup Manager</div>
        <div class="top-bar-sub">Study Topic Manager · Termux</div>
    </div>
    <a class="back-link" href="study.html">← App kholo</a>
</div>

<div class="page">

    <!-- ══ 1. System Info ══ -->
    <div class="card" id="card-sysinfo">
        <div class="card-head">
            <span class="card-head-icon">📊</span>
            <div class="card-head-text">
                <h3>System Info</h3>
                <p>PHP aur upload settings ki current state</p>
            </div>
            <button class="btn btn-ghost" style="margin-left:auto;padding:6px 12px;font-size:.78rem;" onclick="loadSysInfo()">🔄 Refresh</button>
        </div>
        <div class="card-body">
            <div class="info-grid" id="sysinfo-grid">
                <div class="info-row"><span class="info-key">Status</span><span class="info-val"><span class="badge warn">⏳ Loading...</span></span></div>
            </div>
        </div>
    </div>

    <!-- ══ 2. Fix PHP.ini ══ -->
    <div class="card">
        <div class="card-head">
            <span class="card-head-icon">🔧</span>
            <div class="card-head-text">
                <h3>PHP.ini Fix — Upload Limits</h3>
                <p>Photo aur PDF upload ke liye limits badha lo</p>
            </div>
        </div>
        <div class="card-body">
            <p style="font-size:.8rem;color:var(--text2);margin-bottom:16px;">
                Termux mein by default upload_max_filesize sirf 2MB hoti hai. Yahan badha lo:
            </p>
            <div class="row2">
                <div>
                    <label class="field-label">upload_max_filesize</label>
                    <input type="text" id="ini-upload" value="50M" placeholder="50M">
                </div>
                <div>
                    <label class="field-label">post_max_size</label>
                    <input type="text" id="ini-post" value="55M" placeholder="55M">
                </div>
                <div>
                    <label class="field-label">max_execution_time (sec)</label>
                    <input type="text" id="ini-exec" value="120" placeholder="120">
                </div>
                <div>
                    <label class="field-label">memory_limit</label>
                    <input type="text" id="ini-mem" value="256M" placeholder="256M">
                </div>
            </div>
            <div class="btn-row">
                <button class="btn btn-primary" onclick="fixPhpIni()">⚡ PHP.ini Fix Karo</button>
            </div>
            <div class="result-box" id="ini-result"></div>

            <div style="margin-top:16px; padding:12px 14px; background:var(--surf2); border-radius:8px; font-size:.78rem; color:var(--text2); line-height:1.7;">
                <b style="color:var(--warn);">💡 Manual fix bhi kar sakte ho:</b><br>
                Termux mein yeh command run karo:<br>
                <div class="code-block" style="margin-top:8px;">nano <?php echo $iniPath ?? '/data/data/com.termux/files/usr/lib/php.ini'; ?></div>
                Phir yeh lines add/edit karo:<br>
                <div class="code-block" style="margin-top:6px;">upload_max_filesize = 50M
post_max_size = 55M
max_execution_time = 120
memory_limit = 256M
upload_tmp_dir = <?php echo DATA_DIR; ?>/tmp
file_uploads = On</div>
                Server restart karo: <div class="code-block" style="margin-top:4px;">pkill php; php -S localhost:8080</div>
            </div>
        </div>
    </div>

    <!-- ══ 3. Upload Test ══ -->
    <div class="card">
        <div class="card-head">
            <span class="card-head-icon">📤</span>
            <div class="card-head-text">
                <h3>Upload Test</h3>
                <p>Check karo ki photo/PDF upload kaam kar raha hai</p>
            </div>
        </div>
        <div class="card-body">
            <div class="upload-test-area" onclick="document.getElementById('test-file').click()">
                <input type="file" id="test-file" accept="image/*,.pdf" onchange="runUploadTest(event)">
                <div style="font-size:1.8rem;">📁</div>
                <div style="font-size:.85rem; color:var(--text2); margin-top:6px;">Koi bhi image ya PDF select karo test ke liye</div>
                <div style="font-size:.75rem; color:var(--text3); margin-top:4px;">Yeh file save nahi hogi</div>
            </div>
            <div class="result-box" id="upload-result"></div>
        </div>
    </div>

    <!-- ══ 4. Logo ══ -->
    <div class="card">
        <div class="card-head">
            <span class="card-head-icon">🖼️</span>
            <div class="card-head-text">
                <h3>App Logo</h3>
                <p>Header mein dikhane ke liye logo set karo</p>
            </div>
        </div>
        <div class="card-body">
            <input type="file" id="logo-file" accept="image/*" onchange="previewLogo(event)">
            <div class="logo-zone <?php echo $logo ? 'has-logo' : ''; ?>" onclick="document.getElementById('logo-file').click()" id="logo-zone">
                <?php if ($logo): ?>
                    <img src="<?php echo htmlspecialchars($logo); ?>" class="logo-preview" id="logo-img" alt="Logo">
                    <div class="logo-zone-text">Tap karke badlo</div>
                <?php else: ?>
                    <div class="logo-placeholder">📷</div>
                    <div class="logo-zone-text">Tap karke logo upload karo<br><small style="color:var(--text3);">PNG, JPG, SVG — koi bhi</small></div>
                <?php endif; ?>
            </div>
            <div class="btn-row">
                <button class="btn btn-primary" onclick="saveLogo()" id="save-logo-btn" <?php echo $logo ? '' : 'disabled'; ?>>💾 Logo Save Karo</button>
                <?php if ($logo): ?>
                <button class="btn btn-danger" onclick="deleteLogo()">🗑️ Hatao</button>
                <?php endif; ?>
            </div>
            <div class="result-box" id="logo-result"></div>

            <div style="margin-top:16px; padding:12px 14px; background:var(--surf2); border-radius:8px; font-size:.78rem; color:var(--text2); line-height:1.7;">
                <b style="color:var(--text);">Logo kaise use hoga?</b><br>
                Logo base64 mein save hoga. study.html apne aap localStorage se load karega. Yahan save karne ke baad <b>App kholo → Reload karo</b> — logo header mein aa jayega.
            </div>
        </div>
    </div>

    <!-- ══ 5. App Config ══ -->
    <div class="card">
        <div class="card-head">
            <span class="card-head-icon">✏️</span>
            <div class="card-head-text">
                <h3>App Settings</h3>
                <p>Title, accent color wagera</p>
            </div>
        </div>
        <div class="card-body">
            <label class="field-label">App Title (header mein dikhega)</label>
            <input type="text" id="cfg-title" value="<?php echo htmlspecialchars($config['appTitle'] ?? 'Study Topic Manager'); ?>" placeholder="Study Topic Manager">

            <label class="field-label" style="margin-top:14px;">Accent Color (primary color)</label>
            <div style="display:flex; gap:10px; align-items:center;">
                <input type="color" id="cfg-color" value="<?php echo htmlspecialchars($config['accentColor'] ?? '#e63946'); ?>" style="width:70px;">
                <span style="font-size:.78rem; color:var(--text2);">Default: #e63946 (lal)</span>
            </div>

            <label class="field-label" style="margin-top:14px;">Default Theme</label>
            <select id="cfg-theme">
                <option value="1" <?php echo ($config['darkMode'] ?? true) ? 'selected' : ''; ?>>🌙 Dark (recommended)</option>
                <option value="0" <?php echo (!($config['darkMode'] ?? true)) ? 'selected' : ''; ?>>☀️ Light</option>
            </select>

            <div class="btn-row">
                <button class="btn btn-primary" onclick="saveConfig()">💾 Settings Save Karo</button>
            </div>
            <div class="result-box" id="config-result"></div>
        </div>
    </div>

    <!-- ══ 6. Quick Commands ══ -->
    <div class="card">
        <div class="card-head">
            <span class="card-head-icon">💻</span>
            <div class="card-head-text">
                <h3>Termux Quick Commands</h3>
                <p>Copy karke Termux mein paste karo</p>
            </div>
        </div>
        <div class="card-body">
            <?php
            $appDir = BASE_DIR;
            $cmds = [
                'Server Start' => "cd {$appDir} && php -S localhost:8080",
                'Server Start (Custom ini)' => "cd {$appDir} && PHP_INI_SCAN_DIR=\"{$appDir}\" php -S localhost:8080",
                'Server Restart' => "pkill php 2>/dev/null; sleep 1; cd {$appDir} && php -S localhost:8080",
                'PHP.ini Check' => "php --ini",
                'Current php.ini' => "php -r \"echo php_ini_loaded_file();\"",
                'Upload limit check' => "php -r \"echo ini_get('upload_max_filesize');\"",
                'Permissions Fix' => "chmod -R 755 {$appDir}/data",
                'Data Folder Check' => "ls -la {$appDir}/data/",
            ];
            foreach ($cmds as $label => $cmd):
            ?>
            <div style="margin-bottom:10px;">
                <div style="font-size:.75rem; color:var(--text2); margin-bottom:4px;"><?php echo htmlspecialchars($label); ?></div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <div class="code-block" style="flex:1; margin:0;"><?php echo htmlspecialchars($cmd); ?></div>
                    <button class="btn btn-ghost" style="padding:6px 10px;font-size:.75rem;flex-shrink:0;" onclick="copyCmd(this, <?php echo htmlspecialchars(json_encode($cmd)); ?>)">📋</button>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>

</div><!-- /page -->

<div id="toast"></div>

<script>
// ── Helpers ──
function showToast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 2800);
}
function showResult(id, msg, type) {
    var el = document.getElementById(id);
    el.className = 'result-box show ' + (type==='ok'?'ok-box':type==='err'?'err-box':'info-box');
    el.innerHTML = msg;
}
async function api(params) {
    var fd = new FormData();
    for (var k in params) fd.append(k, params[k]);
    var r = await fetch('setup.php?ajax=' + params._action, { method:'POST', body:fd });
    return await r.json();
}
function copyCmd(btn, text) {
    navigator.clipboard.writeText(text).then(function() {
        btn.textContent = '✅';
        setTimeout(function() { btn.textContent = '📋'; }, 1500);
    });
}

// ── System Info ──
async function loadSysInfo() {
    var grid = document.getElementById('sysinfo-grid');
    grid.innerHTML = '<div class="info-row"><span class="info-key">Loading...</span><span class="info-val"><span class="badge warn">⏳</span></span></div>';
    try {
        var r = await fetch('setup.php?ajax=sysinfo');
        var d = await r.json();
        var uploadOk = parseInt(d.upload_max_filesize) >= 10 || d.upload_max_filesize.toUpperCase().replace('M','') >= 10;

        function sizeBadge(val) {
            var mb = parseFloat(val);
            if (isNaN(mb)) mb = 0;
            if (val.toLowerCase().indexOf('m') >= 0) mb = parseFloat(val);
            if (val.toLowerCase().indexOf('g') >= 0) mb = parseFloat(val) * 1024;
            var ok = mb >= 10;
            return '<span class="badge '+(ok?'ok':'bad')+'">'+(ok?'✅':'❌')+' '+val+'</span>';
        }

        var rows = [
            ['PHP Version', '<span class="badge ok">✅ ' + d.php_version + '</span>'],
            ['php.ini', '<span style="font-size:.72rem;word-break:break-all;color:var(--text2);">' + d.php_ini + '</span>'],
            ['file_uploads', d.file_uploads==='On' ? '<span class="badge ok">✅ On</span>' : '<span class="badge bad">❌ Off</span>'],
            ['upload_max_filesize', sizeBadge(d.upload_max_filesize)],
            ['post_max_size', sizeBadge(d.post_max_size)],
            ['memory_limit', '<span class="badge warn">' + d.memory_limit + '</span>'],
            ['max_execution_time', '<span style="color:var(--text2);">' + d.max_execution_time + 's</span>'],
            ['upload_tmp_dir', '<span style="font-size:.72rem;word-break:break-all;color:var(--text2);">' + d.upload_tmp_dir + '</span>'],
            ['data/ folder', d.data_writable ? '<span class="badge ok">✅ Writable</span>' : '<span class="badge bad">❌ Not writable</span>'],
            ['data/tmp/', d.tmp_writable ? '<span class="badge ok">✅ Writable</span>' : '<span class="badge bad">❌ Not writable — fix karo!</span>'],
        ];

        grid.innerHTML = rows.map(function(r) {
            return '<div class="info-row"><span class="info-key">' + r[0] + '</span><span class="info-val">' + r[1] + '</span></div>';
        }).join('');
    } catch(e) {
        grid.innerHTML = '<div class="info-row"><span class="info-key">Error</span><span class="info-val"><span class="badge bad">❌ ' + e.message + '</span></span></div>';
    }
}

// ── Fix PHP.ini ──
async function fixPhpIni() {
    var btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="spin"></span> Fix ho raha hai...';
    try {
        var fd = new FormData();
        fd.append('maxSize',  document.getElementById('ini-upload').value || '50M');
        fd.append('postSize', document.getElementById('ini-post').value || '55M');
        fd.append('execTime', document.getElementById('ini-exec').value || '120');
        fd.append('memLimit', document.getElementById('ini-mem').value || '256M');
        var r = await fetch('setup.php?ajax=fixPhpIni', { method:'POST', body:fd });
        var d = await r.json();
        if (d.ok) {
            var msg = '';
            if (d.partial) {
                msg = '⚠️ php.ini directly edit nahi ho saka (permission issue).<br>';
                msg += 'custom.ini banaya: <code>' + d.path + '</code><br><br>';
                msg += 'Ab yeh command se server start karo:<br>';
                msg += '<div class="code-block" style="margin-top:6px;">' + d.cmd + '</div>';
            } else {
                msg = '✅ PHP.ini fix ho gaya!<br>Path: <code>' + d.path + '</code><br>';
                msg += '<br>Ab server restart karo: <code>pkill php && php -S localhost:8080</code>';
            }
            showResult('ini-result', msg, d.partial ? 'info' : 'ok');
            loadSysInfo();
        } else {
            showResult('ini-result', '❌ ' + d.msg, 'err');
        }
    } catch(e) {
        showResult('ini-result', '❌ Error: ' + e.message, 'err');
    }
    btn.disabled = false;
    btn.innerHTML = '⚡ PHP.ini Fix Karo';
}

// ── Upload Test ──
async function runUploadTest(event) {
    var file = event.target.files[0];
    if (!file) return;
    var result = document.getElementById('upload-result');
    result.className = 'result-box show info-box';
    result.innerHTML = '<span class="spin"></span> Upload test ho raha hai (' + (file.size/1024/1024).toFixed(2) + ' MB)...';

    var fd = new FormData();
    fd.append('testfile', file);
    try {
        var r = await fetch('setup.php?ajax=testUpload', { method:'POST', body:fd });
        var d = await r.json();
        if (d.ok) {
            var msg = (d.saved ? '✅ ' : '⚠️ ') + d.msg + '<br>';
            msg += '📄 File: ' + d.name + '<br>';
            msg += '📦 Size: ' + (d.size/1024/1024).toFixed(2) + ' MB<br>';
            msg += '🏷️ Type: ' + d.type;
            showResult('upload-result', msg, d.saved ? 'ok' : 'info');
        } else {
            showResult('upload-result', '❌ ' + d.msg + '<br><small>Error Code: ' + (d.error_code||'?') + '</small><br><br>👇 PHP.ini Fix karo neeche se.', 'err');
        }
    } catch(e) {
        showResult('upload-result', '❌ Request fail: ' + e.message, 'err');
    }
    event.target.value = '';
}

// ── Logo ──
var pendingLogoData = null;

function previewLogo(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        pendingLogoData = e.target.result;
        var zone = document.getElementById('logo-zone');
        zone.className = 'logo-zone has-logo';
        zone.innerHTML = '<img src="' + pendingLogoData + '" class="logo-preview" id="logo-img" alt="Logo">' +
                         '<div class="logo-zone-text">Tap karke badlo</div>';
        document.getElementById('save-logo-btn').disabled = false;
    };
    reader.readAsDataURL(file);
}

async function saveLogo() {
    var data = pendingLogoData;
    if (!data) {
        // Already saved logo use karo
        var img = document.getElementById('logo-img');
        if (!img) { showToast('Pehle logo select karo'); return; }
        data = img.src;
    }
    var btn = document.getElementById('save-logo-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spin"></span> Saving...';
    try {
        var fd = new FormData();
        fd.append('logo', data);
        var r = await fetch('setup.php?ajax=saveLogo', { method:'POST', body:fd });
        var d = await r.json();
        if (d.ok) {
            // Also save to localStorage for study.html
            try { localStorage.setItem('stm_logo', data); } catch(e) {}
            showResult('logo-result', '✅ Logo save ho gaya! App reload karo — logo header mein dikhai dega.', 'ok');
            showToast('Logo saved ✓');
            pendingLogoData = null;
        } else {
            showResult('logo-result', '❌ ' + d.msg, 'err');
        }
    } catch(e) {
        showResult('logo-result', '❌ ' + e.message, 'err');
    }
    btn.disabled = false;
    btn.innerHTML = '💾 Logo Save Karo';
}

async function deleteLogo() {
    if (!confirm('Logo hatana chahte ho?')) return;
    try {
        var r = await fetch('setup.php?ajax=deleteLogo', { method:'POST' });
        var d = await r.json();
        if (d.ok) {
            try { localStorage.removeItem('stm_logo'); } catch(e) {}
            var zone = document.getElementById('logo-zone');
            zone.className = 'logo-zone';
            zone.innerHTML = '<div class="logo-placeholder">📷</div><div class="logo-zone-text">Tap karke logo upload karo</div>';
            document.getElementById('save-logo-btn').disabled = true;
            showToast('Logo hata diya ✓');
            document.getElementById('logo-result').className = 'result-box';
        }
    } catch(e) { showToast('Error: ' + e.message); }
}

// ── Config ──
async function saveConfig() {
    var btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="spin"></span> Saving...';
    try {
        var fd = new FormData();
        fd.append('appTitle',    document.getElementById('cfg-title').value);
        fd.append('accentColor', document.getElementById('cfg-color').value);
        fd.append('darkMode',    document.getElementById('cfg-theme').value);
        var r = await fetch('setup.php?ajax=saveConfig', { method:'POST', body:fd });
        var d = await r.json();
        if (d.ok) {
            // Save to localStorage for study.html
            try {
                localStorage.setItem('stm_appTitle', d.config.appTitle);
                localStorage.setItem('stm_accentColor', d.config.accentColor);
                if (!d.config.darkMode) localStorage.setItem('stm_theme', 'light');
                else localStorage.removeItem('stm_theme');
            } catch(e) {}
            showResult('config-result', '✅ Settings save ho gayi! App reload karo effect ke liye.', 'ok');
            showToast('Settings saved ✓');
        } else {
            showResult('config-result', '❌ ' + d.msg, 'err');
        }
    } catch(e) {
        showResult('config-result', '❌ ' + e.message, 'err');
    }
    btn.disabled = false;
    btn.innerHTML = '💾 Settings Save Karo';
}

// ── Init ──
loadSysInfo();
</script>
</body>
</html>
