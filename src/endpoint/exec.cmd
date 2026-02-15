@echo off
wt --window minimized -d %~dp0 pwsh --window minimized -Command "npm run start"
