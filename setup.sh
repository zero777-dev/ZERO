#!/bin/bash
# ============================================
# ZERO - Setup Complet Automatique
# ============================================
# Un seul script qui fait TOUT:
# 1. Installe les dépendances
# 2. Installe les outils de build
# 3. Télécharge le projet
# 4. Compile l'APK
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

OK="✅"
WARN="⚠️"
ERROR="❌"

clear
echo -e "${CYAN}"
cat << 'EOF'

███████╗███████╗██████╗  ██████╗ 
╚══███╔╝██╔════╝██╔══██╗██╔═══██╗
  ███╔╝ █████╗  ██████╔╝██║   ██║
 ███╔╝  ██╔══╝  ██╔══██╗██║   ██║
███████╗███████╗██║  ██║╚██████╔╝
╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ 

    SETUP COMPLET AUTOMATIQUE

EOF
echo -e "${NC}"

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}    Installation & Build APK - Automatique${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# ============================================
# FONCTIONS
# ============================================

install_dependencies() {
    echo -e "${YELLOW}📦 Étape 1/4: Installation des dépendances...${NC}"
    echo ""
    
    pkg update -y 2>/dev/null || true
    pkg upgrade -y 2>/dev/null || true
    
    # Outils de base
    for pkg in git curl wget unzip; do
        if ! command -v $pkg &> /dev/null; then
            echo -e "  📥 Installation de $pkg..."
            pkg install -y $pkg 2>/dev/null || true
        else
            echo -e "  ${OK} $pkg"
        fi
    done
    
    # Java
    echo -e "  📥 Installation Java JDK 17..."
    pkg install openjdk-17 -y 2>/dev/null || {
        pkg install openjdk-18 -y 2>/dev/null || {
            pkg install openjdk-11 -y 2>/dev/null || true
        }
    }
    
    if command -v java &> /dev/null; then
        echo -e "  ${OK} Java: $(java -version 2>&1 | head -1)"
    fi
    
    echo ""
}

install_android_sdk() {
    echo -e "${YELLOW}📦 Étape 2/4: Installation Android SDK...${NC}"
    echo ""
    
    # Configurer JAVA_HOME
    export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
    echo -e "  JAVA_HOME: $JAVA_HOME"
    
    # Créer répertoire SDK
    mkdir -p $HOME/android-sdk/cmdline-tools
    cd $HOME/android-sdk/cmdline-tools
    
    # Télécharger SDK si pas déjà fait
    if [ ! -d "latest" ]; then
        echo -e "  📥 Téléchargement Android SDK..."
        curl -L -o cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
        unzip -o cmdline-tools.zip
        mv cmdline-tools latest
        rm cmdline-tools.zip
        echo -e "  ${OK} SDK téléchargé"
    else
        echo -e "  ${OK} SDK déjà présent"
    fi
    
    # Configurer PATH
    export ANDROID_HOME=$HOME/android-sdk
    export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
    
    # Ajouter au bashrc
    cat >> $HOME/.bashrc << 'ENV'

# ZERO Environment
export ANDROID_HOME=$HOME/android-sdk
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
ENV
    
    # Installer composants
    echo -e "  📥 Installation composants SDK..."
    yes | sdkmanager --licenses 2>/dev/null || true
    sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" 2>/dev/null || {
        sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.2" 2>/dev/null || true
    }
    
    echo ""
}

download_project() {
    echo -e "${YELLOW}📦 Étape 3/4: Téléchargement du projet ZERO...${NC}"
    echo ""
    
    ZERO_DIR="$HOME/zero"
    
    if [ -d "$ZERO_DIR" ]; then
        echo -e "  ${WARN} Projet ZERO déjà présent"
        cd "$ZERO_DIR"
    else
        echo -e "  📥 Téléchargement du projet..."
        
        # Méthode 1: Git clone (si URL disponible)
        # Remplacez par votre URL Git
        # git clone https://github.com/VOTRE_USER/zero.git "$ZERO_DIR"
        
        # Méthode 2: Créer le projet manuellement
        mkdir -p "$ZERO_DIR"
        cd "$ZERO_DIR"
        
        # Le projet sera créé automatiquement par les scripts suivants
        echo -e "  ${OK} Répertoire créé"
    fi
    
    echo ""
}

build_apk() {
    echo -e "${YELLOW}📦 Étape 4/4: Compilation de l'APK...${NC}"
    echo ""
    
    # Configurer environnement
    export ANDROID_HOME=$HOME/android-sdk
    export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
    export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
    
    cd $HOME/zero/app
    
    # Préparer projet
    echo -e "  📦 Préparation du projet..."
    
    if [ ! -f "local.properties" ]; then
        echo "sdk.dir=$ANDROID_HOME" > local.properties
        echo -e "  ${OK} local.properties créé"
    fi
    
    chmod +x gradlew 2>/dev/null || true
    
    # Nettoyer
    echo -e "  🧹 Nettoyage..."
    ./gradlew clean 2>/dev/null || true
    
    # Build
    echo ""
    echo -e "  ${YELLOW}🔨 Compilation APK...${NC}"
    echo -e "  ${YELLOW}Attendez 10-20 minutes...${NC}"
    echo ""
    
    ./gradlew assembleDebug --no-daemon 2>&1 | tee /tmp/build.log
    
    # Vérifier résultat
    echo ""
    if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
        SIZE=$(du -h app/build/outputs/apk/debug/app-debug.apk | cut -f1)
        echo ""
        echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║${NC}         ${CYAN}BUILD RÉUSSI!${NC}                         ${GREEN}║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "  ${OK} APK: app/build/outputs/apk/debug/app-debug.apk"
        echo -e "  📊 Taille: $SIZE"
        echo ""
        echo -e "  ${BLUE}Commandes:${NC}"
        echo -e "  cp app/build/outputs/apk/debug/app-debug.apk /sdcard/zero.apk"
        echo -e "  am install /sdcard/zero.apk"
        echo ""
    else
        echo -e "  ${ERROR} Build échoué!"
        echo -e "  Voir logs: /tmp/build.log"
    fi
    
    echo ""
}

# ============================================
# EXÉCUTION
# ============================================

main() {
    install_dependencies
    install_android_sdk
    download_project
    build_apk
    
    echo -e "${GREEN}✅ Setup terminé!${NC}"
}

# Lancer
main
