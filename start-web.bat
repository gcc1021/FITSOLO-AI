@echo off
echo ============================================
echo  FITSOLO local preview server
echo  Open in browser: http://localhost:8000
echo  Close this window to stop the server
echo ============================================
"C:\Users\gcc83\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m http.server 8000 --directory "%~dp0web"
pause
