@echo off
echo Bot baslatiliyor...
node index.js
if %errorlevel% equ 0 (
    echo Bot basariyla calisti!
) else (
    echo Bot baslatilamadi. Hata olustu. Lutfen loglari kontrol edin.
)
pause