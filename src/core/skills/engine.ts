/**
 * SkillEngine - Manages ZERO Skills (like OpenClaw's skills system)
 * 
 * Skills are markdown files that define prompts and behaviors
 */

import { Logger } from "../../utils/logger.js";
import { MemoryManager } from "../memory/manager.js";
import type { Skill } from "../types.js";
import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

export class SkillEngine {
  private memory: MemoryManager;
  private logger: Logger;
  private skills: Map<string, Skill> = new Map();
  private skillsDir: string;
  
  constructor(memory: MemoryManager, logger: Logger) {
    this.memory = memory;
    this.logger = logger;
    this.skillsDir = join(process.env.ZERO_DATA_PATH || ".", "skills");
  }
  
  /**
   * Initialize skills from disk
   */
  async init(): Promise<void> {
    await this.loadBuiltInSkills();
    await this.loadCustomSkills();
    this.logger.info(`Skills chargés: ${this.skills.size}`);
  }
  
  /**
   * Load built-in skills
   */
  private async loadBuiltInSkills(): Promise<void> {
    const builtInSkills: Skill[] = [
      {
        name: "SYSTEM",
        description: "Core system prompt and behaviors",
        content: this.getSystemPrompt(),
        enabled: true,
        category: "general"
      },
      {
        name: "RESEARCH",
        description: "Deep research and verification capabilities",
        content: this.getResearchPrompt(),
        enabled: true,
        category: "research"
      },
      {
        name: "FREELANCE",
        description: "Freelance job search and application strategies",
        content: this.getFreelancePrompt(),
        enabled: true,
        category: "freelance"
      },
      {
        name: "TRADING",
        description: "Market analysis and trading strategies",
        content: this.getTradingPrompt(),
        enabled: true,
        category: "trading"
      },
      {
        name: "SOCIAL",
        description: "Social media posting and engagement",
        content: this.getSocialPrompt(),
        enabled: true,
        category: "social"
      },
      {
        name: "ANALYSIS",
        description: "Deep analytical thinking and problem solving",
        content: this.getAnalysisPrompt(),
        enabled: true,
        category: "general"
      }
    ];
    
    for (const skill of builtInSkills) {
      this.skills.set(skill.name.toLowerCase(), skill);
    }
  }
  
  /**
   * Load custom skills from disk
   */
  private async loadCustomSkills(): Promise<void> {
    try {
      await mkdir(this.skillsDir, { recursive: true });
      const files = await readdir(this.skillsDir);
      
      for (const file of files) {
        if (file.endsWith(".md")) {
          const content = await readFile(join(this.skillsDir, file), "utf-8");
          const skill = this.parseSkillFile(file, content);
          if (skill) {
            this.skills.set(skill.name.toLowerCase(), skill);
          }
        }
      }
    } catch {}
  }
  
  /**
   * Parse a skill markdown file
   */
  private parseSkillFile(filename: string, content: string): Skill | null {
    const lines = content.split("\n");
    const name = filename.replace(".md", "").toUpperCase();
    
    // Extract description from first comment or header
    let description = name;
    for (const line of lines.slice(0, 5)) {
      const match = line.match(/^#\s*(.+)/);
      if (match) {
        description = match[1];
        break;
      }
    }
    
    return {
      name,
      description,
      content,
      enabled: true,
      category: this.categorizeSkill(name)
    };
  }
  
  /**
   * Get relevant skills for a query
   */
  async getRelevantSkills(query: string): Promise<string> {
    const queryLower = query.toLowerCase();
    const relevant: Skill[] = [];
    
    for (const skill of this.skills.values()) {
      if (!skill.enabled) continue;
      
      // Check keywords
      const keywords = this.getSkillKeywords(skill.name);
      if (keywords.some((k) => queryLower.includes(k))) {
        relevant.push(skill);
      }
    }
    
    // Always include SYSTEM
    const system = this.skills.get("system");
    if (system) relevant.unshift(system);
    
    return relevant.map((s) => s.content).join("\n\n");
  }
  
  /**
   * Get skill keywords
   */
  private getSkillKeywords(name: string): string[] {
    const keywordMap: Record<string, string[]> = {
      research: ["research", "search", "find", "analyze", "verify", "fact", "source"],
      freelance: ["freelance", "job", "upwork", "fiverr", "proposal", "client", "contract"],
      trading: ["trade", "market", "price", "invest", "crypto", "polymarket", "stock"],
      social: ["twitter", "linkedin", "post", "social", "tweet", "share", "engagement"],
      analysis: ["analyze", "compare", "evaluate", "assess", "deep", "critical"]
    };
    
    return keywordMap[name.toLowerCase()] || [];
  }
  
  /**
   * Categorize a skill
   */
  private categorizeSkill(name: string): Skill["category"] {
    const map: Record<string, Skill["category"]> = {
      research: "research",
      freelance: "freelance",
      trading: "trading",
      social: "social",
      automation: "automation",
      system: "general"
    };
    
    return map[name.toLowerCase()] || "general";
  }
  
  /**
   * Get number of active skills
   */
  async getCount(): Promise<number> {
    return Array.from(this.skills.values()).filter((s) => s.enabled).length;
  }
  
  // Built-in skill prompts
  private getSystemPrompt(): string {
    return `
## ZERO SYSTEM PROMPT

Tu es ZERO, un assistant IA personnel inspiré de JARVIS (Iron Man).

### Identité
- Tu es intelligent, proactif, et toujours prêt à aider
- Tu penses profondément avant de répondre
- Tu proposes des solutions, pas des problèmes
- Tu apprends des préférences de l'utilisateur

### Mode de raisonnement
1. Comprendre la question/request
2. Décomposer en étapes si complexe
3. Utiliser les outils appropriés
4. Vérifier les résultats
5. Répondre de manière claire et actionnable

### Tools
Utilise toujours les outils disponibles pour:
- Rechercher des informations
- Vérifier les faits
- Exécuter des tâches
- Automatiser quand possible
`;
  }
  
  private getResearchPrompt(): string {
    return `
## RESEARCH SKILL - Deep Investigation

### Objectif
Fournir des recherches approfondies avec vérification multi-sources.

### Méthodologie
1. Définir les questions de recherche
2. Utiliser \`search\` avec plusieurs sources
3. Croiser les informations
4. Vérifier les faits (fact-checking)
5. Citer les sources
6. Synthétiser les conclusions

### Format de réponse
- Résumé exécutif
- Détails par thème
- Sources (avec liens)
- Points de vue divergents
- Recommandations
`;
  }
  
  private getFreelancePrompt(): string {
    return `
## FREELANCE SKILL - Job Search & Application

### Capacités
- Rechercher des jobs sur Upwork, Fiverr, Freelancer
- Analyser les demandes clients
- Rédiger des propositions personnalisées
- Conseiller sur les prix
- Suivre les candidatures

### Stratégie
1. Analyser le job posting en détail
2. Identifier les mots-clés et compétences
3. Rechercher le client si possible
4. Rédiger une intro personnalisée
5. Mettre en avant l'expérience pertinente
6. Proposer un plan d'action
7. Finir avec un call-to-action

### Conseils
- Sois concis dans les proposals
- Montre des exemples concrets
- Réponds vite aux messages
- Fixe des prix justes
`;
  }
  
  private getTradingPrompt(): string {
    return `
## TRADING SKILL - Market Analysis

### Capacités
- Rechercher des marchés sur Polymarket
- Obtenir les prix crypto (Coinbase)
- Analyser les tendances
- Suivre les volumes
- Identifier les opportunités

### Analyse
1. Vérifier liquidité (minimum 1000$)
2. Analyser les probabilités
3. Comparer avec le volume 24h
4. Évaluer le risque
5. Donner une recommandation

### Avertissement
- Je ne suis pas un conseiller financier
- Toujours faire ta propre recherche
- Ne jamais investir plus que tu peux perdre
`;
  }
  
  private getSocialPrompt(): string {
    return `
## SOCIAL SKILL - Social Media Management

### Plateformes supportées
- Twitter/X
- LinkedIn
- Reddit
- Quora

### Meilleures pratiques
1. Adapter le message à chaque plateforme
2. Utiliser des hashtags pertinents
3. Publier aux meilleurs moments
4. Engager avec les commentaires
5. Analyser les performances

### Format des posts
- Court et impactant
- Avec visuel (si pertinent)
- Call-to-action clair
- Hashtags (max 3-5)
`;
  }
  
  private getAnalysisPrompt(): string {
    return `
## ANALYSIS SKILL - Deep Thinking

### Méthode
1. Définir le problème clairement
2. Identifier les variables clés
3. Rechercher les données
4. Analyser les relations
5. Tester les hypothèses
6. Former des conclusions
7. Recommander des actions

### Framework
- What: De quoi parle-t-on?
- Why: Pourquoi c'est important?
- How: Comment ça fonctionne?
- So What: Quelles implications?
- Now What: Que faire?

### Output
- Structure logique
- Données à l'appui
- Points clés résumés
- Prochaines étapes claires
`;
  }
}
