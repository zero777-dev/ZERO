#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
#   ZERO - ONE COMMAND INSTALLATION
#   Usage: curl -sL https://zero777-dev.github.io/ZERO/install.sh | bash
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

OK="✅"
WARN="⚠️"
ERROR="❌"

# ZERO ASCII Art
echo -e "${CYAN}"
echo "███████╗███████╗██████╗  ██████╗ "
echo "╚══███╔╝██╔════╝██╔══██╗██╔═══██╗"
echo "  ███╔╝ █████╗  ██████╔╝██║   ██║"
echo " ███╔╝  ██╔══╝  ██╔══██╗██║   ██║"
echo "███████╗███████╗██║  ██║╚██████╔╝"
echo "╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ "
echo ""
echo -e "${NC}"

echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          INSTALLATION EN UNE COMMANDE               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# ÉTAPE 1 : Vérifier Bun
# ============================================
echo -e "${YELLOW}[1/4]${NC} Vérification de Bun..."

if command -v bun &> /dev/null; then
    echo -e "  ${OK} Bun: $(bun --version)"
else
    echo -e "  📥 Installation de Bun..."
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    source ~/.bashrc 2>/dev/null || true
fi

# ============================================
# ÉTAPE 2 : Cloner le projet
# ============================================
echo -e "${YELLOW}[2/4]${NC} Téléchargement de ZERO..."

ZERO_DIR="$HOME/ZERO"

if [ -d "$ZERO_DIR" ]; then
    echo -e "  ${OK} ZERO déjà présent, mise à jour..."
    cd "$ZERO_DIR"
    git pull origin main 2>/dev/null || git pull origin master
else
    echo -e "  📥 Clonage du projet..."
    git clone https://github.com/zero777-dev/ZERO.git "$ZERO_DIR"
    cd "$ZERO_DIR"
fi

# ============================================
# ÉTAPE 3 : Installer les dépendances
# ============================================
echo -e "${YELLOW}[3/4]${NC} Installation des dépendances..."

bun install
echo -e "  ${OK} Dépendances installées"

# ============================================
# ÉTAPE 4 : Vérifier Ollama
# ============================================
echo -e "${YELLOW}[4/4]${NC} Vérification d'Ollama..."

if command -v ollama &> /dev/null; then
    echo -e "  ${OK} Ollama détecté: $(ollama --version 2>&1 || echo 'OK')"
    
    # Vérifier si mistral est installé
    if ! ollama list | grep -q "mistral"; then
        echo -e "  📥 Téléchargement du modèle mistral..."
        echo -e "  ${WARN} Cela peut prendre 5-10 minutes (3.8GB)..."
        ollama pull mistral
    else
        echo -e "  ${OK} Modèle mistral déjà présent"
    fi
else
    echo -e "  ${WARN} Ollama non détecté"
    echo -e "  Installe avec: curl -fsSL https://ollama.com/install.sh | sh"
fi

# ============================================
# CRÉER RACCOURCI
# ============================================
echo ""
echo -e "${YELLOW}Création du raccourci 'zero'...${NC}"

# Raccourci bashrc
if ! grep -q "alias zero=" ~/.bashrc 2>/dev/null; then
    echo 'alias zero="cd $HOME/ZERO && bun run src/index.ts"' >> ~/.bashrc
fi

echo -e "  ${OK} Raccourci créé!"

# ============================================
# FIN !
# ============================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                     INSTALLATION TERMINÉE !                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Prochaines étapes :${NC}"
echo ""
echo -e "  1. ${GREEN}Lancer ZERO:${NC}"
echo -e "     cd ~/ZERO && bun run src/index.ts"
echo ""
echo -e "     Ou simplement:${NC}"
echo -e "     zero"
echo ""
echo -e "  2. ${GREEN}Première utilisation:${NC}"
echo -e "     bun run src/index.ts setup"
echo ""
echo -e "  3. ${GREEN}Commandes rapides:${NC}"
echo -e "     /help    - Aide"
echo -e "     /search  - Rechercher"
echo -e "     /status  - Statut système"
echo -e "     /quit    - Quitter"
echo ""
echo -e "${CYAN}Amuse-toi bien avec ZERO ! 🚀${NC}"
echo ""
