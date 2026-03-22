#!/bin/bash
# ZERO - Installation ultra-simple en UNE COMMANDE
# Copie-colle cette ligne ENTIÈRE dans Termux:

# curl -sL https://git.io/J0E0z | bash

set -e

echo "███████╗███████╗██████╗  ██████╗ "
echo "╚══███╔╝██╔════╝██╔══██╗██╔═══██╗"
echo "  ███╔╝ █████╗  ██████╔╝██║   ██║"
echo " ███╔╝  ██╔══╝  ██╔══██╗██║   ██║"
echo "███████╗███████╗██║  ██║╚██████╔╝"
echo "╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ "
echo ""
echo "Installation ZERO..."

# Variables
HOME_DIR="$HOME"
ZERO_DIR="$HOME_DIR/ZERO"
BUN_INSTALL="$HOME_DIR/.bun"

# 1. Installer Bun
if ! command -v bun &> /dev/null; then
    echo "[1/4] Installation Bun..."
    curl -fsSL https://bun.sh/install | bash
fi

# 2. Cloner ZERO
echo "[2/4] Téléchargement ZERO..."
if [ -d "$ZERO_DIR" ]; then
    cd "$ZERO_DIR" && git pull
else
    git clone https://github.com/zero777-dev/ZERO.git "$ZERO_DIR"
    cd "$ZERO_DIR"
fi

# 3. Installer dépendances
echo "[3/4] Installation dépendances..."
bun install

# 4. Vérifier Ollama
echo "[4/4] Vérification Ollama..."
if command -v ollama &> /dev/null; then
    if ! ollama list 2>/dev/null | grep -q mistral; then
        echo "Téléchargement mistral (3.8GB)..."
        ollama pull mistral
    fi
fi

echo ""
echo "✅ INSTALLATION TERMINÉE!"
echo ""
echo "Lance avec: cd ~/ZERO && bun run src/index.ts"
echo "Ou tape: zero"
