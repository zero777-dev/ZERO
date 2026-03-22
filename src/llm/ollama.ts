/**
 * Ollama Client - Local LLM Integration
 * 
 * Handles communication with Ollama for local AI inference
 */

import { Ollama } from "ollama";
import { Config } from "../utils/config.js";
import type { Message, LLMResponse, ToolDefinition } from "../core/types.js";

export class OllamaClient {
  private client: Ollama;
  private host: string;
  private model: string;
  private embeddingModel: string;
  
  constructor(config: Config) {
    this.host = config.get("ollama.host") || "localhost:11434";
    this.model = config.get("ollama.model") || "mistral";
    this.embeddingModel = config.get("ollama.embedding") || "nomic-embed-text";
    
    this.client = new Ollama({ host: `http://${this.host}` });
  }
  
  /**
   * Chat with the LLM
   */
  async chat(
    messages: Message[],
    options?: {
      tools?: ToolDefinition[];
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<LLMResponse> {
    try {
      const ollamaMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.name && { name: m.name })
      }));
      
      const response = await this.client.chat({
        model: this.model,
        messages: ollamaMessages as any,
        tools: options?.tools as any,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 4096,
        },
        stream: false,
      });
      
      // Extract tool calls if present
      const toolCalls = response.message.tool_calls?.map((tc: any) => ({
        id: tc.function.id || `call_${Date.now()}`,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments || "{}")
      }));
      
      return {
        content: response.message.content || "",
        toolCalls,
        model: this.model,
        tokens: response.eval_count || 0
      };
    } catch (error: any) {
      console.error("Ollama chat error:", error.message);
      
      // Fallback to non-tool call
      return {
        content: `Erreur de connexion à Ollama: ${error.message}`,
        model: this.model
      };
    }
  }
  
  /**
   * Generate embeddings for search
   */
  async embed(text: string): Promise<number[]> {
    try {
      const response = await this.client.embed({
        model: this.embeddingModel,
        prompt: text,
      });
      
      return response.embeddings[0] || [];
    } catch (error: any) {
      console.error("Ollama embed error:", error.message);
      return [];
    }
  }
  
  /**
   * Check if Ollama is healthy
   */
  async health(): Promise<boolean> {
    try {
      const models = await this.client.list();
      return models.models && models.models.length > 0;
    } catch {
      return false;
    }
  }
  
  /**
   * Get available models
   */
  async listModels(): Promise<string[]> {
    try {
      const models = await this.client.list();
      return models.models?.map((m: any) => m.name) || [];
    } catch {
      return [];
    }
  }
  
  /**
   * Pull/update a model
   */
  async pullModel(modelName: string, onProgress?: (progress: number) => void): Promise<void> {
    try {
      await this.client.pull({
        model: modelName,
        stream: true,
      }, onProgress as any);
    } catch (error: any) {
      throw new Error(`Erreur téléchargement ${modelName}: ${error.message}`);
    }
  }
  
  /**
   * Generate text (non-chat)
   */
  async generate(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    try {
      const response = await this.client.generate({
        model: this.model,
        prompt,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 2048,
        },
        stream: false,
      });
      
      return response.response || "";
    } catch (error: any) {
      return `Erreur: ${error.message}`;
    }
  }
}
