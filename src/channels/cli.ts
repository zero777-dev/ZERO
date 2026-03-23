/**
 * CLI - Command Line Interface for ZERO
 * 
 * Interactive chat interface in the terminal
 */

import { ZERO } from "../core/zeros.js";
import { Logger } from "../utils/logger.js";
import readline from "readline/promises";

export class CLI {
  private zero: ZERO;
  private logger: Logger;
  private rl: readline;
  private isRunning: boolean = false;
  
  constructor(zero: ZERO, logger: Logger) {
    this.zero = zero;
    this.logger = logger;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
  }
  
  /**
   * Start the interactive CLI
   */
  async start(): Promise<void> {
    this.isRunning = true;
    
    console.log(`
╔══════════════════════════════════════════════════════════╗
║              ZERO - Mode Conversationnel                   ║
╠══════════════════════════════════════════════════════════╣
║  Tape ton message et appuie sur Entrée                    ║
║  Commandes spéciales:                                     ║
║    /help     - Aide                                       ║
║    /status   - Statut système                             ║
║    /skills   - Liste des skills                           ║
║    /clear    - Effacer l'écran                            ║
║    /quit     - Quitter ZERO                               ║
╚══════════════════════════════════════════════════════════╝
`);
    
    while (this.isRunning) {
      try {
        const input = await this.rl.question("\n👤 Tu: ");
        
        if (!input.trim()) continue;
        
        // Handle commands
        if (input.startsWith("/")) {
          await this.handleCommand(input);
          continue;
        }
        
        // Process with ZERO
        console.log("\n🤖 ZERO: ");
        console.log("─".repeat(50));
        
        const response = await this.zero.chat(input);
        
        console.log(response);
        console.log("─".repeat(50));
        
      } catch (error: any) {
        if (error.message !== "EOF") {
          console.error("\n❌ Erreur:", error.message);
        }
      }
    }
    
    this.rl.close();
    console.log("\n👋 À bientôt !\n");
  }
  
  /**
   * Handle slash commands
   */
  private async handleCommand(input: string): Promise<void> {
    const [cmd, ...args] = input.slice(1).split(" ");
    
    switch (cmd.toLowerCase()) {
      case "help":
        this.showHelp();
        break;
        
      case "status":
        await this.zero.status();
        break;
        
      case "skills":
        this.showSkills();
        break;
        
      case "clear":
        console.clear();
        break;
        
      case "quit":
      case "exit":
        this.isRunning = false;
        break;
        
      case "search":
        if (args.length > 0) {
          console.log("\n🔍 Recherche...");
          const response = await this.zero.chat(`Recherche: ${args.join(" ")}`);
          console.log(response);
        } else {
          console.log("Usage: /search <query>");
        }
        break;
        
      case "research":
        if (args.length > 0) {
          console.log("\n📚 Recherche approfondie...");
          const response = await this.zero.chat(`Fais une recherche approfondie sur: ${args.join(" ")}`);
          console.log(response);
        } else {
          console.log("Usage: /research <topic>");
        }
        break;
        
      case "freelance":
        if (args.length > 0) {
          console.log("\n💼 Recherche de jobs freelance...");
          const response = await this.zero.chat(`Recherche des jobs freelance pour: ${args.join(" ")}`);
          console.log(response);
        } else {
          console.log("Usage: /freelance <skills>");
        }
        break;
        
      case "trade":
        if (args.length > 0) {
          console.log("\n📈 Analyse de marché...");
          const response = await this.zero.chat(`Analyse le marché: ${args.join(" ")}`);
          console.log(response);
        } else {
          console.log("Usage: /trade <market>");
        }
        break;
        
      default:
        console.log(`Commande inconnue: /${cmd}`);
        console.log("Tape /help pour la liste des commandes");
    }
  }
  
  private showHelp(): void {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                        AIDE ZERO                          ║
╠══════════════════════════════════════════════════════════╣
║  Commandes disponibles:                                   ║
║                                                            ║
║  /help         - Cette aide                               ║
║  /status       - Statut du système                        ║
║  /skills       - Liste des skills actifs                  ║
║  /clear        - Effacer l'écran                          ║
║  /quit         - Quitter ZERO                             ║
║                                                            ║
║  Commandes rapides:                                       ║
║  /search <q>   - Rechercher sur le web                    ║
║  /research <t> - Recherche approfondie                    ║
║  /freelance <s>- Jobs freelance                           ║
║  /trade <m>    - Données marché                           ║
║                                                            ║
║  Tu peux aussi parler naturellement à ZERO !             ║
╚══════════════════════════════════════════════════════════╝
`);
  }
  
  private showSkills(): void {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                    SKILLS ACTIVÉS                          ║
╠══════════════════════════════════════════════════════════╣
║  🎯 SYSTEM       - Comportement core de ZERO              ║
║  🔬 RESEARCH     - Recherche et vérification              ║
║  💼 FREELANCE    - Jobs et proposals                      ║
║  📈 TRADING      - Analyse de marché                       ║
║  📱 SOCIAL       - Gestion réseaux sociaux                 ║
║  🧠 ANALYSIS     - Raisonnement profond                    ║
╚══════════════════════════════════════════════════════════╝
`);
  }
}
