/**
 * Config - ZERO Configuration Manager
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import type { ZEROConfig } from "../core/types.js";

export class Config {
  private config: ZEROConfig = {};
  private configFile: string;
  
  constructor() {
    this.configFile = join(
      process.env.ZERO_CONFIG_PATH || 
      process.env.HOME || 
      ".", 
      ".zero", 
      "config.json"
    );
    this.load();
  }
  
  /**
   * Load config from file
   */
  private async load(): Promise<void> {
    try {
      const data = await readFile(this.configFile, "utf-8");
      this.config = JSON.parse(data);
    } catch {
      this.config = this.getDefaults();
    }
  }
  
  /**
   * Save config to file
   */
  async save(): Promise<void> {
    await mkdir(join(this.configFile, ".."), { recursive: true });
    await writeFile(this.configFile, JSON.stringify(this.config, null, 2), "utf-8");
  }
  
  /**
   * Get a config value
   */
  get(key: string): any {
    const keys = key.split(".");
    let value: any = this.config;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value;
  }
  
  /**
   * Set a config value
   */
  async set(key: string, value: any): Promise<void> {
    const keys = key.split(".");
    let obj: any = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!obj[k]) obj[k] = {};
      obj = obj[k];
    }
    
    obj[keys[keys.length - 1]] = value;
    await this.save();
  }
  
  /**
   * Get all config
   */
  all(): ZEROConfig {
    return { ...this.config };
  }
  
  /**
   * Manage config interactively
   */
  async manage(): Promise<void> {
    const readline = await import("readline/promises");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const ask = (q: string): Promise<string> => {
      return new Promise((r) => rl.question(q, r));
    };
    
    try {
      console.log("\n⚙️ Configuration de ZERO\n");
      console.log("1. Modifier le persona");
      console.log("2. Configurer Ollama");
      console.log("3. Configurer SearXNG");
      console.log("4. Configurer Telegram");
      console.log("5. Voir la config actuelle");
      console.log("6. Quitter\n");
      
      const choice = await ask("Choix: ");
      
      switch (choice) {
        case "1":
          const persona = await ask("Nouveau persona (ex: JARVIS, Friday): ");
          await this.set("persona", persona || "JARVIS");
          console.log("✅ Persona mis à jour");
          break;
          
        case "2":
          const host = await ask("Ollama host (localhost:11434): ");
          const model = await ask("Modèle (mistral): ");
          await this.set("ollama.host", host || "localhost:11434");
          await this.set("ollama.model", model || "mistral");
          console.log("✅ Ollama configuré");
          break;
          
        case "3":
          const searxng = await ask("SearXNG host (http://localhost:8888): ");
          await this.set("search.searxng", searxng || "http://localhost:8888");
          console.log("✅ SearXNG configuré");
          break;
          
        case "4":
          const token = await ask("Bot Token Telegram: ");
          const chatId = await ask("Chat ID: ");
          await this.set("telegram.token", token);
          await this.set("telegram.chatId", chatId);
          console.log("✅ Telegram configuré");
          break;
          
        case "5":
          console.log("\n📋 Configuration actuelle:\n");
          console.log(JSON.stringify(this.config, null, 2));
          break;
      }
    } finally {
      rl.close();
    }
  }
  
  /**
   * Get default config
   */
  private getDefaults(): ZEROConfig {
    return {
      user: {
        name: "Utilisateur",
        timezone: "UTC"
      },
      persona: "JARVIS",
      ollama: {
        host: "localhost:11434",
        model: "mistral",
        embedding: "nomic-embed-text"
      },
      search: {
        searxng: process.env.SEARXNG_HOST || "http://localhost:8888",
        engines: ["google", "bing", "wikipedia"]
      },
      telegram: {
        enabled: false
      }
    };
  }
}
