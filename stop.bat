@echo off
echo Stopping all services...
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq MySQL*"
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq Backend*"
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq Frontend*"
taskkill /f /im mysqld.exe
echo All services stopped!
pause