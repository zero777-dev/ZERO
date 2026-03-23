#!/bin/bash
# ZERO - Installation via proxy GitHub pour Termux
# bash <(curl -L https://ghproxy.com/https://raw.githubusercontent.com/zero777-dev/ZERO/main/install-mini.sh)

set -e

echo "🚀 Installation de ZERO..."

# Config
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Si bun pas installé, installer
if ! command -v bun &> /dev/null; then
    echo "📦 Installation de Bun..."
    curl -fsSL https://bun.sh/install | bash
fi

# Aller dans home
cd $HOME

# Cloner ou mettre à jour via proxy
if [ -d "ZERO" ]; then
    cd ZERO && git pull
else
    git clone https://ghproxy.com/https://github.com/zero777-dev/ZERO.git ZERO
fi

cd ZERO
bun install

echo "✅ Terminé!"
echo "Lance: cd ~/ZERO && bun run src/index.ts"
