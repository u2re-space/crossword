@echo off
wt --window minimized -d %~dp0 pwsh --window minimized -Command "node ./Receive.ts"
