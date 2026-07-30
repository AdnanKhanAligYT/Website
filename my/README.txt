MY DOCUMENTS - Local Document Manager
=======================================

RUN IN TERMUX:
1. Extract this zip anywhere, e.g:
   unzip document-manager.zip -d ~/document-manager
   cd ~/document-manager

2. Start the server:
   php -S 0.0.0.0:8080

3. Open in Chrome (same device):
   http://localhost:8080

4. To access from another device on same WiFi:
   Find phone IP: ifconfig (look for wlan0 inet)
   Open http://<phone-ip>:8080 on other device

FEATURES:
- Upload PDF and images (jpg/png/gif/webp)
- Categories/folders
- Grid and list view
- Search by filename or note
- Preview PDF/images inline
- Rename, Move, Delete, Download
- Notes/description per file
- Direct Share button (WhatsApp/Email/etc via native share sheet)
- Drag & drop upload

FILES:
- index.php   -> main UI
- api.php     -> backend logic (upload/list/delete/rename/move)
- file.php    -> serves files for preview/download/share
- data.json   -> auto-created, stores file metadata
- uploads/    -> auto-created, stores actual files

NOTE: Share button uses the Web Share API (navigator.share).
It works in Chrome on Android for http://localhost. If sharing
files isn't supported on your browser, it falls back to
sharing a link, or you can just use Download.
