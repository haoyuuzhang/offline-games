@echo off
setlocal

set "HTML=%~dp0index.html"
if not exist "%HTML%" (
  echo Cannot find index.html in this folder.
  pause
  exit /b 1
)

set "URL=file:///%HTML:\=/%"
set "CHROME="

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"

if defined CHROME (
  start "" "%CHROME%" "%URL%"
) else (
  start "" chrome "%URL%"
)
