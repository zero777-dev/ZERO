/**
 * MemoryManager - ZERO's Memory System
 * 
 * Manages short-term (conversation) and long-term (vector) memory
 */

import { Config } from "../../utils/config.js";
import { Logger } from "../../utils/logger.js";
import type { Message, MemoryEntry, MemoryStats } from "../types.js";
import { OllamaClient } from "../../llm/ollama.js";
import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";

export class MemoryManager {
  private config: Config;
  private logger: Logger;
  private ollama: OllamaClient;
  private shortTerm: Message[] = [];
  private longTerm: MemoryEntry[] = [];
  private memoryFile: string;
  private maxShortTerm: number = 20;
  
  constructor(config: Config, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.ollama = new OllamaClient(config);
    this.memoryFile = join(process.env.ZERO_DATA_PATH || ".", "data", "memory.json");
  }
  
  /**
   * Initialize memory
   */
  async init(): Promise<void> {
    await this.loadLongTerm();
    this.logger.info("Mémoire initialisée");
  }
  
  /**
   * Add a conversation to memory
   */
  async add(user: string, assistant: string): Promise<void> {
    // Short term
    this.shortTerm.push(
      { role: "user", content: user },
      { role: "assistant", content: assistant }
    );
    
    // Trim short term
    if (this.shortTerm.length > this.maxShortTerm * 2) {
      this.shortTerm = this.shortTerm.slice(-this.maxShortTerm * 2);
    }
    
    // Long term
    const entry: MemoryEntry = {
      id: `mem_${Date.now()}`,
      content: `User: ${user}\nAssistant: ${assistant}`,
      type: "message",
      timestamp: new Date()
    };
    
    // Create embedding
    try {
      const embedding = await this.ollama.embed(user);
      entry.embedding = embedding;
    } catch {}
    
    this.longTerm.push(entry);
    
    // Save periodically
    if (this.longTerm.length % 5 === 0) {
      await this.saveLongTerm();
    }
  }
  
  /**
   * Get relevant context for a query
   */
  async getContext(query: string): Promise<Message[]> {
    // Get short term context
    const shortContext = this.shortTerm.slice(-this.maxShortTerm * 2);
    
    // Get long term context via similarity search
    const longContext = await this.getSimilarMemories(query, 5);
    
    return [...shortContext, ...longContext];
  }
  
  /**
   * Find similar memories using embeddings
   */
  private async getSimilarMemories(query: string, limit: number): Promise<Message[]> {
    if (this.longTerm.length === 0) return [];
    
    try {
      // Create query embedding
      const queryEmbedding = await this.ollama.embed(query);
      
      // Calculate similarities
      const similarities = this.longTerm
        .filter((m) => m.embedding)
        .map((m) => ({
          memory: m,
          similarity: this.cosineSimilarity(queryEmbedding, m.embedding!)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
      
      return similarities.map((s) => ({
        role: "system" as const,
        content: `[Mémoire]: ${s.memory.content.substring(0, 500)}`
      }));
    } catch {
      return [];
    }
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  /**
   * Save a fact to long-term memory
   */
  async remember(fact: string, type: "fact" | "preference" = "fact"): Promise<void> {
    const entry: MemoryEntry = {
      id: `mem_${Date.now()}`,
      content: fact,
      type,
      timestamp: new Date()
    };
    
    try {
      const embedding = await this.ollama.embed(fact);
      entry.embedding = embedding;
    } catch {}
    
    this.longTerm.push(entry);
    await this.saveLongTerm();
    
    this.logger.info(`Mémorisé: ${fact.substring(0, 50)}...`);
  }
  
  /**
   * Forget specific memories
   */
  async forget(pattern: string): Promise<void> {
    const before = this.longTerm.length;
    this.longTerm = this.longTerm.filter(
      (m) => !m.content.toLowerCase().includes(pattern.toLowerCase())
    );
    const removed = before - this.longTerm.length;
    
    if (removed > 0) {
      await this.saveLongTerm();
      this.logger.info(`Effacé ${removed} souvenirs`);
    }
  }
  
  /**
   * Get memory statistics
   */
  async getStats(): Promise<MemoryStats> {
    return {
      messageCount: this.shortTerm.length / 2,
      contextTokens: this.estimateTokens(this.shortTerm),
      vectorCount: this.longTerm.filter((m) => m.embedding).length
    };
  }
  
  /**
   * Load long-term memory from disk
   */
  private async loadLongTerm(): Promise<void> {
    try {
      const data = await readFile(this.memoryFile, "utf-8");
      const entries = JSON.parse(data);
      this.longTerm = entries.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp)
      }));
    } catch {
      this.longTerm = [];
    }
  }
  
  /**
   * Save long-term memory to disk
   */
  private async saveLongTerm(): Promise<void> {
    await mkdir(join(this.memoryFile, ".."), { recursive: true });
    await writeFile(this.memoryFile, JSON.stringify(this.longTerm, null, 2), "utf-8");
  }
  
  /**
   * Estimate token count
   */
  private estimateTokens(messages: Message[]): number {
    const text = messages.map((m) => m.content).join(" ");
    return Math.ceil(text.length / 4);
  }
}
