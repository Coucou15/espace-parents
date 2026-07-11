@echo off
REM Script pour mettre à jour l'app en ligne en un clic.
REM Double-cliquez sur ce fichier depuis l'explorateur Windows.

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ================================================
echo   Espace Parents - Deploiement automatique
echo ================================================
echo.

REM Verifier qu'il y a bien des modifs
git diff --quiet && git diff --cached --quiet
if !errorlevel! equ 0 (
    echo Aucune modification a envoyer.
    echo.
    pause
    exit /b 0
)

REM Afficher ce qui va etre envoye
echo Fichiers modifies :
git status --short
echo.

REM Demander un message court
set /p MSG="Message de mise a jour (ou Entree pour 'MAJ'): "
if "!MSG!"=="" set MSG=MAJ

echo.
echo Envoi en cours...
git add -A
git commit -m "!MSG!"
if !errorlevel! neq 0 (
    echo.
    echo Echec du commit. Rien n'a ete envoye.
    pause
    exit /b 1
)

git push
if !errorlevel! neq 0 (
    echo.
    echo Echec du push. Verifiez votre connexion internet.
    pause
    exit /b 1
)

echo.
echo ================================================
echo   Deploiement declenche sur Vercel !
echo   Nouvelle version en ligne dans 1-2 minutes.
echo ================================================
echo.
pause
