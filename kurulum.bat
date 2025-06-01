@echo off
echo Kurulum basliyor...
echo Discord.js modulunu yukluyor...

npm i discord.js

if %errorlevel% equ 0 (
    echo Kurulum basariyla tamamlandi!
    pause
) else (
    echo Kurulumda hata olustu. Lutfen internet baglantinizi kontrol edin ve tekrar deneyin.
    pause
)