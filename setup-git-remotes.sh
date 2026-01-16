#!/bin/bash
# Script para configurar push dual a Azure DevOps y GitHub
# Ejecutar después de clonar el repositorio

echo "================================="
echo "Configurando remotos Git duales"
echo "================================="
echo ""

# Verificar que estamos en un repo Git
if [ ! -d ".git" ]; then
    echo "ERROR: No estás en un repositorio Git"
    echo "Asegúrate de ejecutar este script desde la raíz del repositorio"
    exit 1
fi

# URLs de los remotos
AZURE_URL="https://dssProyectoG7@dev.azure.com/dssProyectoG7/Sirona/_git/Sirona"
GITHUB_URL="https://github.com/Fechise/DSS_Sirona.git"

echo "Configurando push dual..."
echo ""

# Limpiar push URLs existentes (por si acaso)
git remote set-url --delete --push origin "$AZURE_URL" 2>/dev/null
git remote set-url --delete --push origin "$GITHUB_URL" 2>/dev/null

# Agregar ambos push URLs
git remote set-url --add --push origin "$AZURE_URL"
git remote set-url --add --push origin "$GITHUB_URL"

echo "✓ Configuración completada"
echo ""
echo "Remotos configurados:"
git remote -v
echo ""
echo "Ahora 'git push origin' subirá a ambos repositorios automáticamente"
echo ""