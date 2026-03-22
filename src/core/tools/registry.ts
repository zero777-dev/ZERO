/**
 * Tool Registry - Manages all ZERO tools
 */

import { Logger } from "../../utils/logger.js";
import type { ToolDefinition, Tool } from "../types.js";
import { FileTool } from "./file.js";
import { WebTool } from "./web.js";
import { SearchTool } from "./search.js";
import { CommandTool } from "./command.js";
import { CronTool } from "./cron.js";
import { AutomationTool } from "./automation.js";
import { FreelanceTool } from "./freelance.js";
import { TradingTool } from "./trading.js";
import { NotificationTool } from "./notification.js";

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private logger: Logger;
  
  constructor(logger: Logger) {
    this.logger = logger;
    this.registerBuiltInTools();
  }
  
  /**
   * Register all built-in tools
   */
  private registerBuiltInTools(): void {
    const toolInstances: Tool[] = [
      new FileTool(this.logger),
      new WebTool(this.logger),
      new SearchTool(this.logger),
      new CommandTool(this.logger),
      new CronTool(this.logger),
      new AutomationTool(this.logger),
      new FreelanceTool(this.logger),
      new TradingTool(this.logger),
      new NotificationTool(this.logger),
    ];
    
    for (const tool of toolInstances) {
      this.tools.set(tool.name, tool);
    }
    
    this.logger.info(`Outils enregistrés: ${this.tools.size}`);
  }
  
  /**
   * Get a tool by name
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }
  
  /**
   * Get all tool definitions for LLM
   */
  getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((tool) => tool.definition);
  }
  
  /**
   * Register a custom tool
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
    this.logger.info(`Outil ajouté: ${tool.name}`);
  }
  
  /**
   * List all available tools
   */
  listTools(): string[] {
    return Array.from(this.tools.keys());
  }
}
