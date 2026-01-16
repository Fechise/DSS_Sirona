# Script para configurar push dual a Azure DevOps y GitHub
# Ejecutar después de clonar el repositorio

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Configurando remotos Git duales" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en un repo Git
if (-not (Test-Path ".git")) {
    Write-Host "ERROR: No estás en un repositorio Git" -ForegroundColor Red
    Write-Host "Asegúrate de ejecutar este script desde la raíz del repositorio" -ForegroundColor Yellow
    exit 1
}

# URLs de los remotos
$azureUrl = "https://dssProyectoG7@dev.azure.com/dssProyectoG7/Sirona/_git/Sirona"
$githubUrl = "https://github.com/Fechise/DSS_Sirona.git"

Write-Host "Configurando push dual..." -ForegroundColor Yellow
Write-Host ""

# Limpiar push URLs existentes (por si acaso)
git remote set-url --delete --push origin $azureUrl 2>$null
git remote set-url --delete --push origin $githubUrl 2>$null

# Agregar ambos push URLs
git remote set-url --add --push origin $azureUrl
git remote set-url --add --push origin $githubUrl

Write-Host "✓ Configuración completada" -ForegroundColor Green
Write-Host ""
Write-Host "Remotos configurados:" -ForegroundColor Cyan
git remote -v
Write-Host ""
Write-Host "Ahora 'git push origin' subirá a ambos repositorios automáticamente" -ForegroundColor Green
Write-Host ""