#!/bin/bash
# ZERO - Installation pour Termux (depuis GitHub direct)
# curl -fsSL https://raw.githubusercontent.com/zero777-dev/ZERO/main/install.sh | bash

set -e

echo "🚀 Installation de ZERO..."

cd $HOME

# Télécharger le zip depuis GitHub
echo "📥 Téléchargement..."
curl -L https://github.com/zero777-dev/ZERO/archive/refs/heads/main.zip -o zero.zip

# Décompresser
echo "📦 Décompression..."
rm -rf ZERO
unzip -q zero.zip
mv ZERO-main ZERO
rm zero.zip

# Installer Bun
if ! command -v bun &> /dev/null; then
    echo "📦 Installation de Bun..."
    curl -fsSL https://bun.sh/install | bash
fi

export PATH="$HOME/.bun/bin:$PATH"

# Installer dépendances
cd $HOME/ZERO
bun install

echo ""
echo "✅ Terminé!"
echo "Lance: cd ~/ZERO && bun run src/index.ts"
