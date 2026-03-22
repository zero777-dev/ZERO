#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
#   ZERO - One-Command Installation Script
#   Usage: curl -sL github.com/zero777-dev/zero/raw/main/install.sh | bash
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REPO_URL="github.com/zero777-dev/zero"
INSTALL_DIR="$HOME/zero"

# Banner
echo -e "${BLUE}"
echo "  ██╗   ██╗ ██████╗ ██╗██████╗ "
echo "  ██║   ██║██╔═══██╗██║██╔══██╗"
echo "  ██║   ██║██║   ██║██║██║  ██║"
echo "  ╚██╗ ██╔╝██║   ██║██║██║  ██║"
echo "   ╚████╔╝ ╚██████╔╝██║██████╔╝"
echo "    ╚═══╝   ╚═════╝ ╚═╝╚═════╝ "
echo -e "${NC}"
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ZERO - Your Personal AI Assistant    ║${NC}"
echo -e "${GREEN}║  Like JARVIS from Iron Man            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Étape 1: Vérifier les dépendances
echo -e "${YELLOW}[1/6]${NC} Vérification des dépendances..."

if ! command -v termux-setup-storage &> /dev/null; then
    echo -e "${RED}❌ Ce script doit être exécuté dans Termux !${NC}"
    exit 1
fi

# Étape 2: Installer les dépendances système
echo -e "${YELLOW}[2/6]${NC} Installation des dépendances système..."

pkg update -y
pkg install -y nodejs git curl unzip

# Étape 3: Installer Bun (runtime rapide)
echo -e "${YELLOW}[3/6]${NC} Installation de Bun (runtime)..."

if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
fi

# Étape 4: Cloner ou mettre à jour le repo
echo -e "${YELLOW}[4/6]${NC} Téléchargement de ZERO..."

if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}→ Mise à jour de ZERO...${NC}"
    cd "$INSTALL_DIR"
    git pull origin main
else
    # Cloner le repo (utilise HTTPS avec token si disponible)
    GIT_TOKEN="${GITHUB_TOKEN:-}"
    if [ -n "$GIT_TOKEN" ]; then
        git clone "https://$GIT_TOKEN@$REPO_URL" "$INSTALL_DIR"
    else
        git clone "https://$REPO_URL" "$INSTALL_DIR"
    fi
    cd "$INSTALL_DIR"
fi

# Étape 5: Installer les dépendances Node.js
echo -e "${YELLOW}[5/6]${NC} Installation des dépendances JavaScript..."
bun install

# Étape 6: Configurer Ollama (optionnel)
echo -e "${YELLOW}[6/6]${NC} Configuration..."

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Installation terminée !${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Prochaines étapes :${NC}"
echo ""
echo -e "  1. ${YELLOW}Installer Ollama (LLM local):${NC}"
echo -e "     curl -fsSL https://ollama.com/install.sh | sh"
echo -e "     ollama pull mistral"
echo ""
echo -e "  2. ${YELLOW}Lancer ZERO:${NC}"
echo -e "     cd $INSTALL_DIR"
echo -e "     bun run src/index.ts"
echo ""
echo -e "  3. ${YELLOW}Première configuration:${NC}"
echo -e "     bun run src/index.ts setup"
echo ""
echo -e "${GREEN}Pour démarrer rapidement :${NC}"
echo -e "  ${YELLOW}bun run src/index.ts${NC}"
echo ""

# Make zero command available
ln -sf "$INSTALL_DIR/src/index.ts" "$HOME/.local/bin/zero" 2>/dev/null || true
chmod +x "$INSTALL_DIR/src/index.ts"
