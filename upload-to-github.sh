#!/bin/bash
# ════════════════════════════════════════════════════════════
#   UPLOAD SCRIPT - Pour les nuls (aucune offense!) 😅
# ════════════════════════════════════════════════════════════

echo "📦 Création du fichier ZIP..."
cd /root/zero
zip -r $HOME/zero.zip *

echo ""
echo "✅ ZIP créé !"
echo ""
echo "📍 Le fichier est ici : $HOME/zero.zip"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "   INSTRUCTIONS :"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "1. Ouvre l'app 'Fichiers' sur ton téléphone"
echo ""
echo "2. Va dans 'Stockage interne' ou 'Internal Storage'"
echo ""
echo "3. Cherche le fichier 'zero.zip'"
echo ""
echo "4. Ouvre github.com et connecte-toi"
echo ""
echo "5. Clique 'New repository' → Nom: 'zero' → Create"
echo ""
echo "6. Clique 'uploading an existing file'"
echo ""
echo "7. Glisse-dépose 'zero.zip'"
echo ""
echo "8. Clique vert 'Commit changes'"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "   APRÈS UPLOAD :"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Dans Termux, tape :"
echo ""
echo "   curl -sL github.com/zero777-dev/zero/raw/main/install.sh | bash"
echo ""
echo "═══════════════════════════════════════════════════════"
