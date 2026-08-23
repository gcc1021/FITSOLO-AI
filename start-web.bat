@echo off
chcp 65001 >nul
echo ============================================
echo  FITSOLO ???????
echo  ????????? http://localhost:8000
echo  ???????????
echo ============================================
"C:\Users\gcc83\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m http.server 8000 --directory "%~dp0web"
pause
