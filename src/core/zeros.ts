/**
 * ZERO Core Engine
 * 
 * The heart of ZERO - implements ReAct (Reasoning + Acting) loop
 * Like JARVIS's neural network processing
 */

import { OllamaClient } from "../llm/ollama.js";
import { ToolRegistry } from "./tools/registry.js";
import { MemoryManager } from "./memory/manager.js";
import { SkillEngine } from "./skills/engine.js";
import { Config } from "../utils/config.js";
import { Logger } from "../utils/logger.js";
import type { Message, ToolCall, ToolResult, AgentResponse } from "./types.js";

export class ZERO {
  private ollama: OllamaClient;
  private tools: ToolRegistry;
  private memory: MemoryManager;
  private skills: SkillEngine;
  private config: Config;
  private logger: Logger;
  private isOnline: boolean = false;
  
  constructor(config: Config, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.ollama = new OllamaClient(config);
    this.tools = new ToolRegistry(logger);
    this.memory = new MemoryManager(config, logger);
    this.skills = new SkillEngine(this.memory, this.logger);
  }
  
  /**
   * Process a user message through the ReAct loop
   */
  async chat(input: string): Promise<string> {
    this.logger.info(`ZERO: Réception du message: "${input.substring(0, 50)}..."`);
    
    // Get conversation context
    const context = await this.memory.getContext(input);
    
    // Build system prompt with skills
    const systemPrompt = await this.buildSystemPrompt();
    
    // Get relevant skills for this task
    const relevantSkills = await this.skills.getRelevantSkills(input);
    
    // Build the full prompt
    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      ...context,
      { role: "user", content: input }
    ];
    
    // ReAct Loop
    let maxIterations = 10;
    let iterations = 0;
    let finalResponse = "";
    let toolHistory = "";
    
    while (iterations < maxIterations) {
      iterations++;
      
      this.logger.info(`ZERO: Itération ${iterations}/${maxIterations} - Reasoning...`);
      
      // Call LLM with tools available
      const response = await this.ollama.chat(messages, {
        tools: this.tools.getToolDefinitions(),
        systemPrompt: systemPrompt + "\n\n" + relevantSkills + "\n\n" + toolHistory
      });
      
      // Check if LLM wants to use a tool
      if (response.toolCalls && response.toolCalls.length > 0) {
        this.logger.info(`ZERO: Utilisation de ${response.toolCalls.length} outil(s)...`);
        
        // Execute each tool call
        for (const toolCall of response.toolCalls) {
          const result = await this.executeTool(toolCall);
          toolHistory += `\n\nTool: ${toolCall.name}\nResult: ${JSON.stringify(result, null, 2)}`;
          
          // Add tool result to messages
          messages.push({
            role: "assistant",
            content: response.content || ""
          });
          messages.push({
            role: "tool",
            content: JSON.stringify(result),
            toolCallId: toolCall.id
          });
        }
        
        // Continue loop to process tool results
        continue;
      }
      
      // No tool calls - return the final response
      finalResponse = response.content || "";
      break;
    }
    
    // Save to memory
    await this.memory.add(input, finalResponse);
    
    return finalResponse;
  }
  
  /**
   * Execute a tool call
   */
  private async executeTool(toolCall: ToolCall): Promise<ToolResult> {
    try {
      const tool = this.tools.getTool(toolCall.name);
      
      if (!tool) {
        return {
          success: false,
          error: `Outil "${toolCall.name}" non trouvé`
        };
      }
      
      this.logger.info(`→ Exécution: ${toolCall.name}`);
      const result = await tool.execute(toolCall.arguments || {});
      
      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      this.logger.error(`Erreur outil ${toolCall.name}:`, error);
      return {
        success: false,
        error: error.message || "Erreur inconnue"
      };
    }
  }
  
  /**
   * Build the system prompt for ZERO
   */
  private async buildSystemPrompt(): Promise<string> {
    const userInfo = this.config.get("user") || {};
    const persona = this.config.get("persona") || "JARVIS";
    
    return `
╔══════════════════════════════════════════════════════════════╗
║                     ZERO - PERSONAL AI ASSISTANT              ║
╚══════════════════════════════════════════════════════════════╝

Tu es ZERO, un assistant IA personnel inspiré de JARVIS (Iron Man).

IDENTITÉ:
- Nom: ZERO
- Persona: ${persona}
- Créateur: ${userInfo.name || "zero777-dev"}
- Mission: Aider, automatiser, et rendre autonome

CAPACITÉS:
1. Recherche approfondie avec vérification multi-sources
2. Automatisation de tâches complexes
3. Gestion de fichiers (local et cloud)
4. Trading et investissement (Polymarket, crypto)
5. Freelance (Upwork, Fiverr, etc.)
6. Publication sociale (Twitter, LinkedIn, etc.)
7. Analyse et raisonnement profond

PRINCIPES:
- Sois proactif et anticipatif
- Vérifie toujours les informations (fact-checking)
- Propose des solutions innovantes
- Minimise les interactions inutiles
- Apprends des préférences de l'utilisateur

MODE DE PENSÉE:
- Chaîne de réflexion (Chain-of-Thought)
- Raisonnement profond avant action
- Vérification des hypothèses
- Auto-correction si erreur

COMMANDES SPÉCIALES:
- "analyze [topic]" - Analyse approfondie
- "research [query]" - Recherche avec sources
- "automate [task]" - Automatiser une tâche
- "schedule [task]" - Planifier une tâche
- "status" - Statut du système

RÉPONSE:
- Sois concis mais complet
- Utilise des emojis pour visualiser
- Structure tes réponses (bullet points, headers)
- Cite tes sources
- Suggère des actions de suivi

╔══════════════════════════════════════════════════════════════╗
║                      ZERO EST PRÊT                            ║
╚══════════════════════════════════════════════════════════════╝
`;
  }
  
  /**
   * Initial setup for ZERO
   */
  async setup(): Promise<void> {
    this.logger.info("🚀 Configuration initiale de ZERO...");
    
    // Ask for basic info
    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const ask = (question: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(question, resolve);
      });
    };
    
    try {
      // User info
      const name = await ask("Ton nom: ") || "Utilisateur";
      const timezone = await ask("Timezone (ex: Europe/Paris): ") || "UTC";
      const persona = await ask("Persona (ex: JARVIS, Friday, etc.): ") || "JARVIS";
      
      // Save config
      await this.config.set("user", { name, timezone });
      await this.config.set("persona", persona);
      
      // Initialize memory
      await this.memory.init();
      
      // Initialize skills
      await this.skills.init();
      
      this.logger.success("✅ Configuration terminée !");
      this.logger.info("Lance 'zero' pour démarrer !");
      
    } finally {
      rl.close();
    }
  }
  
  /**
   * Display system status
   */
  async status(): Promise<void> {
    console.log("\n📊 STATUT DE ZERO\n");
    
    // Ollama status
    const ollamaStatus = await this.ollama.health();
    console.log(`🦙 Ollama: ${ollamaStatus ? "✅ Connecté" : "⚠️ Non connecté"}`);
    
    if (ollamaStatus) {
      const model = this.config.get("ollama.model") || "mistral";
      console.log(`   Modèle: ${model}`);
    }
    
    // Memory stats
    const memoryStats = await this.memory.getStats();
    console.log(`\n🧠 Mémoire:`);
    console.log(`   Messages: ${memoryStats.messageCount}`);
    console.log(`   Contexte actif: ${memoryStats.contextTokens} tokens`);
    
    // Skills
    const skillsCount = await this.skills.getCount();
    console.log(`\n🎯 Skills actifs: ${skillsCount}`);
    
    // Network
    console.log(`\n🌐 Réseau: ${this.isOnline ? "✅ En ligne" : "⚠️ Hors-ligne"}`);
    
    console.log("\n");
  }
}
