<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
session_start();


/* ---------- MAIN FILE MANAGER CODE STARTS HERE ---------- */

/* ---------- PATH HANDLING ---------- */
$root = realpath(__DIR__);
$dir = $_GET['dir'] ?? '';
$dir = str_replace(['..','//'], '', $dir);
$path = realpath($root.'/'.$dir);
if ($path === false || strpos($path,$root)!==0 || !is_readable($path)) {
    $path = $root;
    $dir = '';
}

/* ---------- FUNCTION TO BUILD FOLDER TREE ---------- */
function buildFolderTree($root, $current_dir, $base_path = '') {
    $html = '';
    $items = @scandir($root);
    if ($items === false) return ''; // permission denied ya unreadable folder - silently skip
    $folders = [];
    
    foreach ($items as $item) {
        if ($item == '.' || $item == '..') continue;
        if ($item[0] === '.') continue; // hidden folders skip karo (.cache, .cargo, .termux, etc.)
        $item_path = $root . '/' . $item;
        if (is_dir($item_path) && is_readable($item_path)) {
            $folders[] = $item;
        }
    }
    
    sort($folders);
    
    foreach ($folders as $folder) {
        $folder_path = $base_path ? $base_path . '/' . $folder : $folder;
        $full_path = $root . '/' . $folder;
        $is_active = ($current_dir == $folder_path);
        
        $html .= '<div class="tree-item">';
        $html .= '<div class="tree-folder ' . ($is_active ? 'active' : '') . '">';
        $html .= '<a href="?dir=' . urlencode($folder_path) . '">📁 ' . htmlspecialchars($folder) . '</a>';
        $html .= '</div>';
        
        // Recursively build subfolders
        $subfolders = buildFolderTree($full_path, $current_dir, $folder_path);
        if ($subfolders) {
            $html .= '<div class="tree-children">' . $subfolders . '</div>';
        }
        
        $html .= '</div>';
    }
    
    return $html;
}

/* ---------- CREATE FOLDER ---------- */
if (isset($_POST['create_folder'])) {
    $name = basename($_POST['folder_name']);
    if ($name) mkdir($path.'/'.$name, 0777, true);
    header("Location:?dir=$dir"); exit;
}

/* ---------- CREATE NEW FILE ---------- */
if (isset($_POST['create_file'])) {
    $filename = basename($_POST['file_name']);
    $extension = $_POST['file_extension'];
    $full_filename = $filename . '.' . $extension;
    
    if ($filename && $extension) {
        $filepath = $path . '/' . $full_filename;
        if (!file_exists($filepath)) {
            $template = "<?php\n// " . $full_filename . " created on " . date('Y-m-d H:i:s') . "\n?>";
            
            // Different templates for different file types
            if ($extension == 'html') {
                $template = "<!DOCTYPE html>\n<html>\n<head>\n    <title>" . $filename . "</title>\n</head>\n<body>\n    \n</body>\n</html>";
            } elseif ($extension == 'css') {
                $template = "/* " . $filename . ".css - Created on " . date('Y-m-d H:i:s') . " */\n\n";
            } elseif ($extension == 'js') {
                $template = "// " . $filename . ".js - Created on " . date('Y-m-d H:i:s') . "\n\n";
            } elseif ($extension == 'json') {
                $template = "{\n    \n}";
            } elseif ($extension == 'sql') {
                $template = "-- " . $filename . ".sql - Created on " . date('Y-m-d H:i:s') . "\n\n";
            } elseif ($extension == 'txt') {
                $template = $filename . " - Created on " . date('Y-m-d H:i:s') . "\n\n";
            } elseif ($extension == 'md') {
                $template = "# " . $filename . "\n\nCreated on " . date('Y-m-d H:i:s') . "\n";
            }
            
            file_put_contents($filepath, $template);
        }
    }
    header("Location:?dir=$dir"); exit;
}

/* ---------- DELETE FOLDER ---------- */
if (isset($_POST['delete_folder'])) {
    $folder_path = realpath($_POST['folder_path']);
    if ($folder_path && strpos($folder_path,$root)===0 && is_dir($folder_path)) {
        // Function to delete folder recursively
        function deleteFolder($folder) {
            if (!is_dir($folder)) return;
            $files = array_diff(scandir($folder), array('.','..'));
            foreach ($files as $file) {
                $path = $folder . '/' . $file;
                if (is_dir($path)) {
                    deleteFolder($path);
                } else {
                    unlink($path);
                }
            }
            rmdir($folder);
        }
        deleteFolder($folder_path);
    }
    header("Location:?dir=$dir"); exit;
}

/* ---------- RENAME FOLDER ---------- */
if (isset($_POST['rename_folder'])) {
    $old = realpath($_POST['old_path']);
    $new = basename($_POST['new_name']);
    if ($old && $new && strpos($old,$root)===0) {
        rename($old, dirname($old)."/$new");
    }
    header("Location:?dir=$dir"); exit;
}

/* ---------- SINGLE FILE UPLOAD ---------- */
if (isset($_POST['upload'])) {
    if ($_FILES['file']['error'] === 0) {
        $original = $_FILES['file']['name'];
        $ext = pathinfo($original, PATHINFO_EXTENSION);
        $custom = trim($_POST['custom_name'] ?? '');
        
        if ($custom) {
            $filename = $custom . ($ext ? ".$ext" : '');
        } else {
            $filename = $original;
        }
        
        $target_path = $path . '/' . $filename;
        
        // Handle duplicate filenames
        if (file_exists($target_path)) {
            $counter = 1;
            $file_info = pathinfo($filename);
            while (file_exists($path . '/' . $file_info['filename'] . '_' . $counter . '.' . $file_info['extension'])) {
                $counter++;
            }
            $filename = $file_info['filename'] . '_' . $counter . '.' . $file_info['extension'];
            $target_path = $path . '/' . $filename;
        }
        
        if (move_uploaded_file($_FILES['file']['tmp_name'], $target_path)) {
            $_SESSION['upload_success'] = "File uploaded successfully: " . $filename;
        } else {
            $_SESSION['upload_error'] = "Failed to upload file";
        }
    }
    header("Location:?dir=$dir"); exit;
}

/* ---------- MULTIPLE FILE UPLOAD (AJAX HANDLER) ---------- */
if (isset($_GET['ajax_upload']) && $_GET['ajax_upload'] == 1) {
    header('Content-Type: application/json');
    
    if (empty($_FILES['files'])) {
        echo json_encode(['success' => false, 'error' => 'No files uploaded']);
        exit;
    }
    
    $files = $_FILES['files'];
    $upload_option = $_POST['upload_option'] ?? 'keep';
    $custom_name = trim($_POST['custom_name'] ?? '');
    $overwrite = isset($_POST['overwrite']) && $_POST['overwrite'] == '1';
    
    $results = [];
    $success_count = 0;
    $failed_count = 0;
    
    // Handle multiple files
    if (is_array($files['name'])) {
        for ($i = 0; $i < count($files['name']); $i++) {
            if ($files['error'][$i] === 0) {
                $result = processUploadedFile(
                    $files['tmp_name'][$i],
                    $files['name'][$i],
                    $upload_option,
                    $custom_name,
                    $overwrite,
                    $i,
                    count($files['name'])
                );
                $results[] = $result;
                if ($result['success']) {
                    $success_count++;
                } else {
                    $failed_count++;
                }
            } else {
                $failed_count++;
                $results[] = [
                    'success' => false,
                    'original' => $files['name'][$i],
                    'error' => 'Upload error: ' . $files['error'][$i]
                ];
            }
        }
    } else {
        // Single file
        if ($files['error'] === 0) {
            $result = processUploadedFile(
                $files['tmp_name'],
                $files['name'],
                $upload_option,
                $custom_name,
                $overwrite,
                0,
                1
            );
            $results[] = $result;
            if ($result['success']) {
                $success_count++;
            } else {
                $failed_count++;
            }
        } else {
            $failed_count++;
            $results[] = [
                'success' => false,
                'original' => $files['name'],
                'error' => 'Upload error: ' . $files['error']
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'results' => $results,
        'success_count' => $success_count,
        'failed_count' => $failed_count,
        'total' => count($results)
    ]);
    exit;
}

function processUploadedFile($tmp_name, $original_name, $upload_option, $custom_name, $overwrite, $index, $total) {
    global $path;
    
    $ext = pathinfo($original_name, PATHINFO_EXTENSION);
    $filename_without_ext = pathinfo($original_name, PATHINFO_FILENAME);
    
    // Determine filename based on upload option
    if ($upload_option === 'custom' && !empty($custom_name)) {
        if ($total > 1) {
            $filename = $custom_name . '_' . ($index + 1) . ($ext ? ".$ext" : '');
        } else {
            $filename = $custom_name . ($ext ? ".$ext" : '');
        }
    } elseif ($upload_option === 'timestamp') {
        $filename = $filename_without_ext . '_' . time() . '_' . $index . ($ext ? ".$ext" : '');
    } else {
        $filename = $original_name;
    }
    
    $target_path = $path . '/' . $filename;
    
    // Handle overwrite option
    if (file_exists($target_path) && !$overwrite) {
        $counter = 1;
        $file_info = pathinfo($filename);
        while (file_exists($path . '/' . $file_info['filename'] . '_' . $counter . '.' . $file_info['extension'])) {
            $counter++;
        }
        $filename = $file_info['filename'] . '_' . $counter . '.' . $file_info['extension'];
        $target_path = $path . '/' . $filename;
    }
    
    if (move_uploaded_file($tmp_name, $target_path)) {
        return [
            'success' => true,
            'original' => $original_name,
            'saved_as' => $filename,
            'size' => filesize($target_path)
        ];
    } else {
        return [
            'success' => false,
            'original' => $original_name,
            'error' => 'Failed to move uploaded file. Check permissions.'
        ];
    }
}

/* ---------- DELETE FILE ---------- */
if (isset($_GET['del'])) {
    $f = realpath($_GET['del']);
    if ($f && strpos($f,$root)===0 && is_file($f)) unlink($f);
    header("Location:?dir=$dir"); exit;
}

/* ---------- DOWNLOAD FILE ---------- */
if (isset($_GET['download'])) {
    $f = realpath($_GET['download']);
    if ($f && strpos($f,$root)===0 && is_file($f)) {
        header("Content-Disposition: attachment; filename=".basename($f));
        header("Content-Type: application/octet-stream");
        header("Content-Length: ".filesize($f));
        readfile($f);
        exit;
    }
}

/* ---------- EDIT FILE ---------- */
if (isset($_GET['edit'])) {
    $f = realpath($_GET['edit']);
    if ($f && strpos($f,$root)===0 && is_file($f)) {
        $content = file_get_contents($f);
        $filename = basename($f);
        $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Edit File - <?= htmlspecialchars($filename) ?></title>
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'DM Sans', sans-serif;
                }
                body {
                    background: #f0f2f8;
                    min-height: 100vh;
                    padding: 20px;
                }
                .container {
                    max-width: 900px;
                    margin: 0 auto;
                }
                .editor-card {
                    background: white;
                    border: 1px solid #d0d5e8;
                    border-radius: 14px;
                    padding: 25px;
                    box-shadow: 0 4px 24px rgba(0,0,0,.10);
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                h2 {
                    font-family: 'Syne', sans-serif;
                    color: #1a1d2e;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #e8ecf5;
                }
                .file-info {
                    background: #f5f7fc;
                    padding: 12px 15px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    color: #4a5070;
                    border-left: 4px solid #e63946;
                }
                textarea {
                    width: 100%;
                    min-height: 500px;
                    padding: 20px;
                    border: 2px solid #d0d5e8;
                    border-radius: 12px;
                    font-family: 'DM Mono', monospace;
                    font-size: 14px;
                    background: #f5f7fc;
                    color: #1a1d2e;
                }
                textarea:focus {
                    outline: none;
                    border-color: #e63946;
                }
                .button-group {
                    display: flex;
                    gap: 12px;
                    margin-top: 20px;
                    flex-wrap: wrap;
                }
                .btn {
                    background: #e63946;
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    font-family: 'DM Sans', sans-serif;
                    font-weight: 700;
                    font-size: 1rem;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }
                .btn.secondary {
                    background: #9098b8;
                }
                .btn.danger {
                    background: #ff4d4d;
                }
                .language-badge {
                    display: inline-block;
                    background: #e63946;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    margin-left: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="editor-card">
                    <h2>
                        <span>📝 Edit File: <?= htmlspecialchars($filename) ?></span>
                        <span class="language-badge"><?= strtoupper($ext) ?></span>
                    </h2>
                    
                    <div class="file-info">
                        <strong>📍 File Path:</strong> <?= htmlspecialchars($f) ?><br>
                        <strong>📦 File Size:</strong> <?= number_format(filesize($f)) ?> bytes
                    </div>
                    
                    <form method="post" action="?dir=<?= urlencode($dir) ?>">
                        <input type="hidden" name="edit_file_path" value="<?= htmlspecialchars($f) ?>">
                        
                        <textarea name="file_content"><?= htmlspecialchars($content) ?></textarea>
                        
                        <div class="button-group">
                            <button type="submit" name="save_file" class="btn">💾 Save Changes</button>
                            <a href="?dir=<?= urlencode($dir) ?>" class="btn secondary">⬅ Back</a>
                            <a href="?dir=<?= urlencode($dir) ?>&del=<?= urlencode($f) ?>" 
                               class="btn danger" 
                               onclick="return confirm('Delete this file?')">🗑 Delete</a>
                        </div>
                    </form>
                </div>
            </div>
        </body>
        </html>
        <?php
        exit;
    }
}

/* ---------- SAVE FILE ---------- */
if (isset($_POST['save_file'])) {
    $file_path = realpath($_POST['edit_file_path']);
    $content = $_POST['file_content'];
    
    if ($file_path && strpos($file_path,$root)===0 && is_file($file_path)) {
        file_put_contents($file_path, $content);
    }
    header("Location:?dir=" . urlencode($dir)); 
    exit;
}

/* ---------- ZIP DOWNLOAD ---------- */
if (isset($_GET['zip'])) {
    $zipName = "folder.zip";
    $zip = new ZipArchive();
    $zip->open($zipName, ZipArchive::CREATE | ZipArchive::OVERWRITE);

    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($path),
        RecursiveIteratorIterator::LEAVES_ONLY
    );
    foreach ($files as $file) {
        if (!$file->isDir()) {
            $filePath = $file->getRealPath();
            $relative = substr($filePath, strlen($path) + 1);
            $zip->addFile($filePath, $relative);
        }
    }
    $zip->close();

    header("Content-Type: application/zip");
    header("Content-Disposition: attachment; filename=$zipName");
    readfile($zipName);
    unlink($zipName);
    exit;
}

/* ---------- BACK ---------- */
$back = $dir ? dirname($dir) : '';
if ($back === '.') $back = '';

/* ---------- EDITABLE FILE EXTENSIONS ---------- */
$editable_extensions = ['php', 'css', 'html', 'json', 'js', 'txt', 'xml', 'md', 'sql', 'ini', 'conf', 'py', 'rb', 'java', 'c', 'cpp', 'h', 'sh', 'bat', 'ps1', 'yaml', 'yml', 'twig', 'vue', 'jsx', 'tsx', 'scss', 'less'];

function humanFileSize($bytes) {
    if ($bytes >= 1073741824) return number_format($bytes / 1073741824, 2) . ' GB';
    if ($bytes >= 1048576) return number_format($bytes / 1048576, 2) . ' MB';
    if ($bytes >= 1024) return number_format($bytes / 1024, 1) . ' KB';
    return $bytes . ' B';
}
?>

<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>File Manager - Mohammad Adnan (AMU)</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'DM Sans', sans-serif;
}

body {
    background: #f0f2f8;
    min-height: 100vh;
    padding: 20px;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
}

.main-layout {
    display: flex;
    gap: 20px;
}

/* Sidebar Styles */
.sidebar {
    width: 280px;
    flex-shrink: 0;
}

.sidebar-card {
    background: #ffffff;
    border: 1px solid #d0d5e8;
    border-radius: 14px;
    padding: 15px;
    box-shadow: 0 4px 24px rgba(0,0,0,.08);
    position: sticky;
    top: 20px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
}

.sidebar-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 2px solid #e8ecf5;
}

.sidebar-header h3 {
    color: #1a1d2e;
    font-family: 'Syne', sans-serif;
    font-size: 1.1rem;
}

/* Tree View Styles */
.tree-view {
    list-style: none;
    padding-left: 0;
}

.tree-item {
    margin: 2px 0;
}

.tree-folder {
    padding: 6px 8px;
    border-radius: 6px;
    transition: all 0.22s ease;
}

.tree-folder:hover {
    background: #f5f7fc;
}

.tree-folder.active {
    background: #e63946;
}

.tree-folder.active a {
    color: white;
}

.tree-folder a {
    color: #4a5070;
    text-decoration: none;
    display: block;
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.tree-children {
    padding-left: 20px;
    margin-left: 10px;
    border-left: 2px dashed #d0d5e8;
}

.root-link {
    margin-bottom: 15px;
    padding: 8px;
    background: #f5f7fc;
    border-radius: 8px;
}

.root-link a {
    color: #e63946;
    text-decoration: none;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 5px;
}

/* Main Content Styles */
.main-content {
    flex: 1;
    min-width: 0;
}

header {
    background: #ffffff;
    border: 1px solid #d0d5e8;
    padding: 20px;
    border-radius: 14px 14px 0 0;
    box-shadow: 0 4px 24px rgba(0,0,0,.08);
    margin-bottom: 20px;
}

.header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 15px;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 15px;
}

.logo-img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 3px solid #e63946;
}

.header-text h1 {
    font-family: 'Syne', sans-serif;
    font-size: 1.5rem;
    color: #1a1d2e;
}

.header-text p {
    color: #4a5070;
    font-size: 0.9rem;
}

.header-buttons {
    display: flex;
    gap: 10px;
}

.btn {
    background: #e63946;
    color: white;
    border: none;
    padding: 10px 18px;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    transition: all 0.22s ease;
}

.btn:hover {
    background: #ff5c5c;
}

.btn:active {
    transform: scale(0.97);
}

.btn.small {
    padding: 5px 12px;
    font-size: 0.8rem;
}

.btn.danger {
    background: #ff4d4d;
}

.btn.success {
    background: #34d399;
}

.logout-btn {
    background: #ff4d4d;
}

/* Card Styles */
.card {
    background: #ffffff;
    border: 1px solid #d0d5e8;
    border-radius: 14px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 4px 24px rgba(0,0,0,.08);
    animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.card h4 {
    color: #1a1d2e;
    font-family: 'Syne', sans-serif;
    font-size: 1.1rem;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 2px solid #e8ecf5;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Form Styles */
input, select {
    padding: 12px 15px;
    width: 100%;
    margin: 8px 0;
    border: 2px solid #d0d5e8;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    color: #1a1d2e;
}

input:focus, select:focus {
    outline: none;
    border-color: #e63946;
}

/* Upload Area Styles */
.upload-area {
    border: 3px dashed #d0d5e8;
    padding: 30px;
    text-align: center;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.22s ease;
    background: #f5f7fc;
    margin-bottom: 15px;
}

.upload-area.dragover {
    border-color: #e63946;
    background: #fff0f0;
    transform: scale(1.02);
}

.upload-area i {
    font-size: 48px;
    color: #e63946;
    margin-bottom: 10px;
    display: block;
}

.upload-area p {
    color: #4a5070;
    margin: 5px 0;
}

.upload-area small {
    color: #9098b8;
    font-size: 0.8rem;
}

/* Upload Options */
.upload-options {
    background: #f5f7fc;
    padding: 15px;
    border-radius: 10px;
    margin: 15px 0;
}

.upload-option-group {
    margin: 10px 0;
}

.upload-option-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 5px 0;
    cursor: pointer;
}

.upload-option-group input[type="radio"],
.upload-option-group input[type="checkbox"] {
    width: auto;
    margin: 0;
}

/* File List */
.file-list {
    margin: 15px 0;
    max-height: 200px;
    overflow-y: auto;
    background: #f5f7fc;
    border-radius: 8px;
    padding: 10px;
}

.file-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    background: white;
    margin: 5px 0;
    border-radius: 8px;
    border: 1px solid #e8ecf5;
}

.file-item span {
    font-size: 0.9rem;
    color: #4a5070;
}

/* Progress Container */
.progress-container {
    margin-top: 20px;
    padding: 15px;
    background: #f5f7fc;
    border-radius: 10px;
    display: none;
}

.progress-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
    font-weight: 500;
    color: #1a1d2e;
}

.progress-items {
    max-height: 250px;
    overflow-y: auto;
    margin-bottom: 15px;
}

.progress-item {
    margin-bottom: 12px;
    background: white;
    border-radius: 8px;
    padding: 10px;
    border: 1px solid #e8ecf5;
}

.progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-size: 0.85rem;
}

.filename-progress {
    color: #1a1d2e;
    font-weight: 500;
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.progress-percent {
    color: #e63946;
    font-weight: 600;
}

.progress-bar-bg {
    width: 100%;
    height: 20px;
    background: #e8ecf5;
    border-radius: 10px;
    overflow: hidden;
}

.progress-bar-fill {
    height: 100%;
    background: #e63946;
    border-radius: 10px;
    transition: width 0.3s ease;
}

.progress-status {
    font-size: 0.85rem;
    color: #9098b8;
    margin-top: 5px;
}

.progress-complete {
    color: #34d399;
    font-weight: 600;
}

/* Item Styles */
.item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 10px;
    border-bottom: 1px solid #e8ecf5;
    transition: background 0.22s ease;
    flex-wrap: wrap;
    gap: 10px;
}

.item:hover {
    background: #f5f7fc;
}

.item a {
    color: #4a5070;
    text-decoration: none;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
}

.item img {
    max-width: 70px;
    max-height: 70px;
    border-radius: 10px;
    margin-top: 8px;
    border: 3px solid white;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

/* Actions */
.actions {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
}

.actions a, .actions button {
    color: #e63946;
    font-size: 0.9rem;
    padding: 5px 10px;
    border-radius: 6px;
    background: #fff0f0;
    border: none;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.22s ease;
    font-family: 'DM Sans', sans-serif;
}

.actions a:hover, .actions button:hover {
    background: #e63946;
    color: white;
}

.actions .delete-btn {
    color: #ff4d4d;
    background: #fff0f0;
}

.actions .delete-btn:hover {
    background: #ff4d4d;
    color: white;
}

.actions .edit-btn {
    background: #34d399;
    color: white;
}

/* Folder Actions */
.folder-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
}

.folder-actions form {
    display: inline-flex;
    gap: 5px;
    align-items: center;
}

.folder-actions input {
    width: 120px;
    margin: 0;
    padding: 8px 10px;
}

/* File Creation Row */
.file-creation-row {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
}

.file-creation-row input {
    flex: 2;
    min-width: 150px;
}

.file-creation-row select {
    flex: 1;
    min-width: 100px;
}

/* Ext Badge */
.ext-badge {
    display: inline-block;
    background: #e63946;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.7rem;
    margin-left: 8px;
}

/* Success/Error Messages */
.success-message {
    background: #d3f8e2;
    border-left: 4px solid #34d399;
    padding: 12px 15px;
    border-radius: 8px;
    margin-bottom: 20px;
    color: #1a7a4c;
    animation: slideDown 0.3s ease;
}

.error-message {
    background: #ffe0e0;
    border-left: 4px solid #ff4d4d;
    padding: 12px 15px;
    border-radius: 8px;
    margin-bottom: 20px;
    color: #b91c1c;
    animation: slideDown 0.3s ease;
}

@keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Responsive */
@media (max-width: 768px) {
    .main-layout {
        flex-direction: column;
    }
    
    .sidebar {
        width: 100%;
    }
    
    .sidebar-card {
        position: static;
        max-height: 300px;
    }
    
    .header-content {
        flex-direction: column;
        text-align: center;
    }
    
    .file-creation-row {
        flex-direction: column;
    }
    
    .file-creation-row input,
    .file-creation-row select,
    .file-creation-row button {
        width: 100%;
    }
    
    .folder-actions {
        width: 100%;
    }
    
    .folder-actions input {
        width: 100%;
    }
}

/* Scrollbar */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

::-webkit-scrollbar-thumb {
    background: #e63946;
    border-radius: 10px;
}
</style>
</head>
<body>

<?php $__navBase = 'Study/'; include __DIR__ . '/Study/nav_render.php'; ?>

<div class="container">
    <header>
        <div class="header-content">
            <div class="header-left">
                <img src="https://adnansmps.free.nf/wp-content/uploads/2026/03/12.jpg" alt="Logo" class="logo-img" onerror="this.style.display='none'">
                <div class="header-text">
                    <h1>📂 File Manager</h1>
                    <p>Mohammad Adnan • Aligarh Muslim University</p>
                </div>
            </div>
            <div class="header-buttons">
            </div>
        </div>
    </header>

    <div class="main-layout">
        <!-- Sidebar with Folder Tree -->
        <div class="sidebar">
            <div class="sidebar-card">
                <div class="sidebar-header">
                    <span>📁</span>
                    <h3>Folder Tree</h3>
                </div>
                
                <div class="root-link">
                    <a href="?dir=">📂 Root Directory</a>
                </div>
                
                <div class="tree-view">
                    <?= buildFolderTree($root, $dir) ?>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <?php if(isset($_SESSION['upload_success'])): ?>
                <div class="success-message"><?= $_SESSION['upload_success'] ?></div>
                <?php unset($_SESSION['upload_success']); ?>
            <?php endif; ?>
            
            <?php if(isset($_SESSION['upload_error'])): ?>
                <div class="error-message"><?= $_SESSION['upload_error'] ?></div>
                <?php unset($_SESSION['upload_error']); ?>
            <?php endif; ?>

            <div id="uploadSuccess" class="success-message" style="display: none;"></div>
            <div id="uploadError" class="error-message" style="display: none;"></div>

            <?php if($dir): ?>
            <a class="btn" href="?dir=<?=$back?>">⬅ Back</a>
            <?php endif; ?>

            <!-- Create Folder Card -->
            <div class="card">
                <h4>🗂 Create Folder</h4>
                <form method="post">
                    <input name="folder_name" placeholder="Enter folder name" required>
                    <button class="btn" name="create_folder">Create Folder</button>
                </form>
            </div>

            <!-- Create New File Card -->
            <div class="card">
                <h4>📄 Create New File</h4>
                <form method="post">
                    <div class="file-creation-row">
                        <input type="text" name="file_name" placeholder="File name (without extension)" required>
                        <select name="file_extension" required>
                            <option value="">Select extension</option>
                            <option value="php">PHP</option>
                            <option value="css">CSS</option>
                            <option value="html">HTML</option>
                            <option value="js">JavaScript</option>
                            <option value="json">JSON</option>
                            <option value="txt">Text</option>
                            <option value="md">Markdown</option>
                            <option value="sql">SQL</option>
                            <option value="py">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                        </select>
                        <button class="btn success" name="create_file">Create File</button>
                    </div>
                </form>
            </div>

            <!-- Single File Upload Card -->
            <div class="card">
                <h4>⬆ Single File Upload</h4>
                <form method="post" enctype="multipart/form-data">
                    <input type="file" name="file" required>
                    <input type="text" name="custom_name" placeholder="Custom file name (without extension)">
                    <button class="btn" name="upload">Upload Single File</button>
                </form>
            </div>

            <!-- Drag & Drop Multiple File Upload Card -->
            <div class="card">
                <h4>⬆ Multiple File Upload (Drag & Drop)</h4>
                <form id="uploadForm" enctype="multipart/form-data">
                    <div class="upload-area" id="dropZone">
                        <i>📁</i>
                        <p>Drag & drop files here or click to select</p>
                        <small>Supports multiple files</small>
                        <input type="file" name="files[]" id="fileInput" multiple style="display: none;">
                    </div>
                    
                    <div id="selectedFiles" class="file-list" style="display: none;"></div>
                    
                    <div class="upload-options">
                        <h5>Upload Options:</h5>
                        
                        <div class="upload-option-group">
                            <label>
                                <input type="radio" name="upload_option" value="keep" checked>
                                Keep original filenames
                            </label>
                            <label>
                                <input type="radio" name="upload_option" value="custom">
                                Use custom base name (adds numbers for multiple files)
                            </label>
                            <label>
                                <input type="radio" name="upload_option" value="timestamp">
                                Add timestamp to filename
                            </label>
                        </div>
                        
                        <div class="upload-option-group" id="customNameGroup" style="display: none;">
                            <input type="text" name="custom_name" placeholder="Enter custom base name">
                        </div>
                        
                        <div class="upload-option-group">
                            <label>
                                <input type="checkbox" name="overwrite" value="1">
                                Overwrite existing files
                            </label>
                        </div>
                    </div>
                    
                    <!-- Progress Container -->
                    <div id="progressContainer" class="progress-container">
                        <div class="progress-header">
                            <span>Upload Progress</span>
                            <span id="overallProgress">0%</span>
                        </div>
                        <div id="progressItems" class="progress-items"></div>
                        <div class="progress-status" id="progressStatus">Ready to upload</div>
                    </div>
                    
                    <button type="button" class="btn success" id="uploadBtn" onclick="startUpload()">Upload Files</button>
                    <button type="button" class="btn danger" id="cancelUploadBtn" style="display: none;" onclick="cancelUpload()">Cancel Upload</button>
                </form>
            </div>

            <!-- Folders List Card -->
            <div class="card">
                <h4>📁 Folders</h4>
                <?php 
                $hasFolders = false;
                foreach(scandir($path) as $f):
                    if($f=='.'||$f=='..')continue;
                    if(is_dir("$path/$f")):
                        $hasFolders = true;
                        $next=trim("$dir/$f",'/');?>
                        <div class="item">
                            <div style="flex:1">
                                <a href="?dir=<?=$next?>">📁 <?=$f?></a>
                            </div>
                            <div class="folder-actions">
                                <form method="post" style="display:flex;gap:5px">
                                    <input type="hidden" name="old_path" value="<?=$path.'/'.$f?>">
                                    <input name="new_name" placeholder="Rename to...">
                                    <button class="btn small" name="rename_folder">✏️ Rename</button>
                                </form>
                                <form method="post" onsubmit="return confirm('Delete folder \'<?=$f?>\' and all its contents?')">
                                    <input type="hidden" name="folder_path" value="<?=$path.'/'.$f?>">
                                    <button class="btn small danger" name="delete_folder">🗑 Delete</button>
                                </form>
                            </div>
                        </div>
                    <?php endif; 
                endforeach;
                if(!$hasFolders): ?>
                    <p>No folders found</p>
                <?php endif; ?>
            </div>

            <!-- Files List Card -->
            <div class="card">
                <h4>📄 Files</h4>
                <?php 
                $hasFiles = false;
                foreach(scandir($path) as $f):
                    if($f=='.'||$f=='..')continue;
                    if(is_file("$path/$f")):
                        $hasFiles = true;
                        $rel=trim("$dir/$f",'/');
                        $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
                        $editable = in_array($ext, $editable_extensions);
                        ?>
                        <div class="item">
                            <div style="flex:1">
                                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                    <span>📄 <?= htmlspecialchars($f) ?></span>
                                    <span class="ext-badge" style="background:#edf2f7;color:#4a5568;"><?= humanFileSize(filesize("$path/$f")) ?></span>
                                    <?php if($editable): ?>
                                        <span class="ext-badge"><?= strtoupper($ext) ?></span>
                                    <?php endif; ?>
                                </div>
                                <?php if(preg_match('/\.(jpg|jpeg|png|gif|webp)$/i',$f)): ?>
                                    <br><img src="<?=$rel?>" alt="<?=htmlspecialchars($f)?>">
                                <?php endif; ?>
                            </div>
                            <div class="actions">
                                <a href="<?=htmlspecialchars($rel)?>" target="_blank">👁 View</a>
                                <?php if($editable): ?>
                                    <a href="?dir=<?=urlencode($dir)?>&edit=<?=urlencode($path.'/'.$f)?>" class="edit-btn">✏️ Edit</a>
                                <?php endif; ?>
                                <a href="?dir=<?=urlencode($dir)?>&download=<?=urlencode($path.'/'.$f)?>">⬇ Download</a>
                                <a href="?dir=<?=urlencode($dir)?>&del=<?=urlencode($path.'/'.$f)?>" class="delete-btn" onclick="return confirm('Delete this file?')">🗑 Delete</a>
                            </div>
                        </div>
                    <?php endif; 
                endforeach;
                if(!$hasFiles): ?>
                    <p>No files found</p>
                <?php endif; ?>
            </div>

            <!-- Download ZIP Card -->
            <div class="card">
                <h4>📦 Download as ZIP</h4>
                <a class="btn" href="?dir=<?=urlencode($dir)?>&zip=1" style="display:block;text-align:center">Download ZIP Archive</a>
            </div>
        </div>
    </div>
</div>

<script>
// Global variables
let uploadActive = false;
let uploadXHR = null;
let totalFiles = 0;
let uploadedFiles = 0;

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const selectedFilesDiv = document.getElementById('selectedFiles');
const customNameGroup = document.getElementById('customNameGroup');
const progressContainer = document.getElementById('progressContainer');
const progressItems = document.getElementById('progressItems');
const overallProgress = document.getElementById('overallProgress');
const progressStatus = document.getElementById('progressStatus');
const uploadBtn = document.getElementById('uploadBtn');
const cancelUploadBtn = document.getElementById('cancelUploadBtn');
const uploadSuccess = document.getElementById('uploadSuccess');
const uploadError = document.getElementById('uploadError');

// Radio buttons for upload options
document.querySelectorAll('input[name="upload_option"]').forEach(radio => {
    radio.addEventListener('change', function() {
        customNameGroup.style.display = this.value === 'custom' ? 'block' : 'none';
    });
});

// Click on drop zone to open file selector
dropZone.addEventListener('click', () => {
    fileInput.click();
});

// Drag and drop events
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    handleFiles(files);
});

// File input change
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Handle selected files
function handleFiles(files) {
    if (files.length === 0) return;
    
    selectedFilesDiv.style.display = 'block';
    selectedFilesDiv.innerHTML = '<h6 style="margin-bottom:10px;">Selected Files:</h6>';
    
    totalFiles = files.length;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span>📄 ${file.name}</span>
            <span style="margin-left: auto; font-size: 0.8rem;">${(file.size / 1024).toFixed(2)} KB</span>
        `;
        selectedFilesDiv.appendChild(fileItem);
    }
}

// Start upload
function startUpload() {
    const files = fileInput.files;
    
    if (files.length === 0) {
        alert('Please select files to upload');
        return;
    }
    
    // Hide any previous messages
    uploadSuccess.style.display = 'none';
    uploadError.style.display = 'none';
    
    totalFiles = files.length;
    uploadedFiles = 0;
    
    // Show progress container
    progressContainer.style.display = 'block';
    uploadBtn.style.display = 'none';
    cancelUploadBtn.style.display = 'inline-block';
    
    // Create progress items
    progressItems.innerHTML = '';
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';
        progressItem.id = `progress-${i}`;
        progressItem.innerHTML = `
            <div class="progress-info">
                <span class="filename-progress">${file.name}</span>
                <span class="progress-percent" id="percent-${i}">0%</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" id="progress-${i}-fill" style="width: 0%"></div>
            </div>
            <div class="progress-status" id="status-${i}">Waiting...</div>
        `;
        progressItems.appendChild(progressItem);
    }
    
    uploadActive = true;
    
    // Create FormData
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
        formData.append('files[]', files[i]);
    }
    
    // Add upload options
    const uploadOption = document.querySelector('input[name="upload_option"]:checked').value;
    formData.append('upload_option', uploadOption);
    
    const customName = document.querySelector('input[name="custom_name"]').value;
    if (customName) {
        formData.append('custom_name', customName);
    }
    
    const overwrite = document.querySelector('input[name="overwrite"]').checked;
    if (overwrite) {
        formData.append('overwrite', '1');
    }
    
    // AJAX upload
    uploadXHR = new XMLHttpRequest();
    
    uploadXHR.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            overallProgress.textContent = percentComplete + '%';
            
            // Update progress for each file (simulated)
            simulateFileProgress(files, e.loaded, e.total);
        }
    });
    
    uploadXHR.onreadystatechange = function() {
        if (uploadXHR.readyState === 4) {
            uploadActive = false;
            uploadBtn.style.display = 'inline-block';
            cancelUploadBtn.style.display = 'none';
            
            if (uploadXHR.status === 200) {
                try {
                    const response = JSON.parse(uploadXHR.responseText);
                    
                    if (response.success) {
                        // Update all progress to 100%
                        for (let i = 0; i < totalFiles; i++) {
                            updateProgress(i, 100);
                            document.getElementById(`status-${i}`).innerHTML = '<span class="progress-complete">✓ Complete</span>';
                        }
                        
                        overallProgress.textContent = '100%';
                        progressStatus.innerHTML = '<span class="progress-complete">✓ Upload complete!</span>';
                        
                        // Show success message
                        const successCount = response.success_count || totalFiles;
                        uploadSuccess.style.display = 'block';
                        uploadSuccess.textContent = `Successfully uploaded ${successCount} file(s)`;
                        
                        // Reset form after successful upload
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                    } else {
                        progressStatus.textContent = 'Upload failed: ' + (response.error || 'Unknown error');
                        uploadError.style.display = 'block';
                        uploadError.textContent = 'Upload failed: ' + (response.error || 'Unknown error');
                    }
                } catch (e) {
                    console.error('Parse error:', e);
                    progressStatus.textContent = 'Upload completed. Refreshing page...';
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                }
            } else {
                progressStatus.textContent = 'Upload failed. Please try again.';
                uploadError.style.display = 'block';
                uploadError.textContent = 'Upload failed. Please try again.';
            }
        }
    };
    
    uploadXHR.onerror = function() {
        uploadActive = false;
        uploadBtn.style.display = 'inline-block';
        cancelUploadBtn.style.display = 'none';
        progressStatus.textContent = 'Network error. Please try again.';
        uploadError.style.display = 'block';
        uploadError.textContent = 'Network error. Please try again.';
    };
    
    uploadXHR.open('POST', window.location.href + '?ajax_upload=1', true);
    uploadXHR.send(formData);
}

// Simulate file progress
function simulateFileProgress(files, loaded, total) {
    const fileSizes = [];
    let totalSize = 0;
    
    for (let i = 0; i < files.length; i++) {
        fileSizes.push(files[i].size);
        totalSize += files[i].size;
    }
    
    let remainingLoaded = loaded;
    
    for (let i = 0; i < files.length; i++) {
        const fileSize = fileSizes[i];
        const fileProgress = totalSize > 0 ? Math.min(100, Math.round((Math.min(remainingLoaded, fileSize) / fileSize) * 100)) : 0;
        
        updateProgress(i, fileProgress);
        
        remainingLoaded = Math.max(0, remainingLoaded - fileSize);
        
        if (fileProgress >= 100) {
            document.getElementById(`status-${i}`).innerHTML = '<span class="progress-complete">✓ Complete</span>';
            uploadedFiles = Math.max(uploadedFiles, i + 1);
        } else if (fileProgress > 0) {
            document.getElementById(`status-${i}`).textContent = 'Uploading...';
        }
    }
    
    progressStatus.textContent = `Uploaded ${uploadedFiles} of ${totalFiles} files`;
}

// Update progress for a specific file
function updateProgress(index, percent) {
    document.getElementById(`percent-${index}`).textContent = percent + '%';
    document.getElementById(`progress-${index}-fill`).style.width = percent + '%';
}

// Cancel upload
function cancelUpload() {
    if (uploadActive && uploadXHR) {
        uploadXHR.abort();
        uploadActive = false;
        
        progressStatus.textContent = 'Upload cancelled';
        uploadBtn.style.display = 'inline-block';
        cancelUploadBtn.style.display = 'none';
        
        uploadError.style.display = 'block';
        uploadError.textContent = 'Upload cancelled';
    }
}

</script>

</body>
</html>
