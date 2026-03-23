#!/usr/bin/env bun

/**
 * ZERO - Your Personal AI Assistant
 * Main Entry Point
 * 
 * Like JARVIS from Iron Man - autonomous, intelligent, always ready
 */

import { ZERO } from "./core/zeros.js";
import { CLI } from "./channels/cli.js";
import { Config } from "./utils/config.js";
import { Logger } from "./utils/logger.js";

// Banner ASCII
const BANNER = `
███████╗███████╗██████╗  ██████╗ 
╚══███╔╝██╔════╝██╔══██╗██╔═══██╗
  ███╔╝ █████╗  ██████╔╝██║   ██║
 ███╔╝  ██╔══╝  ██╔══██╗██║   ██║
███████╗███████╗██║  ██║╚██████╔╝
╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ 

╔═══════════════════════════════════════════════════════╗
║              ZERO - Your Personal AI Assistant         ║
║           Like JARVIS from Iron Man 🤖                  ║
╚═══════════════════════════════════════════════════════╝
`;

// CLI Commands
type Command = "start" | "setup" | "config" | "chat" | "status" | "help" | string;

async function main() {
  const args = process.argv.slice(2);
  const command: Command = args[0] || "chat";
  
  // Afficher le banner
  console.log(BANNER);
  
  const logger = new Logger();
  const config = new Config();
  const zero = new ZERO(config, logger);
  
  switch (command) {
    case "setup":
      // Configuration initiale
      console.log("\n🚀 Configuration initiale de ZERO...\n");
      await zero.setup();
      break;
      
    case "config":
      // Afficher/modifier la configuration
      await config.manage();
      break;
      
    case "status":
      // Afficher le statut
      await zero.status();
      break;
      
    case "chat":
    case "":
      // Mode chat interactif
      const cli = new CLI(zero, logger);
      await cli.start();
      break;
      
    case "help":
    case "--help":
    case "-h":
      showHelp();
      break;
      
    default:
      // Traitement d'une commande directe
      await zero.chat(command);
      break;
  }
  
  logger.info("Au revoir ! ZERO se met en veille...");
}

function showHelp() {
  console.log(`
${BANNER}

${BOLD}USAGE:${RESET}
  zero [command] [options]

${BOLD}COMMANDS:${RESET}
  zero           Démarrer ZERO en mode chat interactif
  zero setup     Configurer ZERO pour la première fois
  zero config    Gérer la configuration
  zero status    Afficher le statut de ZERO
  zero "prompt"  Exécuter une commande directe

${BOLD}EXAMPLES:${RESET}
  zero
  zero setup
  zero "Recherche les derniers gigs Python sur Upwork"
  zero status

${BOLD}OPTIONS:${RESET}
  -h, --help     Afficher cette aide
  -v, --version  Afficher la version
  --offline      Mode hors-ligne (LLM local uniquement)

${BOLD}ENVIRONMENT:${RESET}
  ZERO_CONFIG_PATH   Chemin vers le fichier de config
  ZERO_DATA_PATH     Chemin vers les données
  OLLAMA_HOST        Hôte Ollama (défaut: localhost:11434)
`);
}

// Helper pour formater le texte
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

// Lancer l'application
main().catch((error) => {
  console.error("\n❌ Erreur fatale:", error);
  process.exit(1);
});
