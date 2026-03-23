#!/bin/bash

# ZERO - Installation pour Termux (1 commande)
# curl -fsSL https://raw.githubusercontent.com/zero777-dev/ZERO/main/install-termux.sh | bash

set -e

echo "🚀 Installation de ZERO sur Termux..."
echo "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 0%"

# Mettre à jour Termux
pkg update -y
echo "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 20%"

# Installer dépendances
pkg install -y curl unzip git
echo "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 40%"

# Installer Bun
echo "📦 Installation de Bun..."
curl -fsSL https://bun.sh/install | bash
echo "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 60%"

# Configurer PATH
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Cloner ou mettre à jour ZERO
if [ -d "$HOME/ZERO" ]; then
    echo "📁 Mise à jour de ZERO..."
    cd $HOME/ZERO && git pull
else
    echo "📥 Clonage de ZERO..."
    cd $HOME
    git clone https://github.com/zero777-dev/ZERO.git
fi
echo "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 80%"

# Installer les dépendances ZERO
cd $HOME/ZERO
bun install
echo "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%"

echo ""
echo "✅ ZERO installé avec succès!"
echo ""
echo "Pour lancer ZERO:"
echo "  cd ~/ZERO && bun run src/index.ts"
echo ""
echo "Ou ajoute ceci à ~/.bashrc pour accès permanent:"
echo '  export PATH="$HOME/.bun/bin:$PATH"'
