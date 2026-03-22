/**
 * Tool Interface - Base for all ZERO tools
 */

import type { ToolDefinition, ToolResult } from "../types.js";

export interface Tool {
  name: string;
  description: string;
  definition: ToolDefinition;
  execute(args: Record<string, any>): Promise<ToolResult>;
}

// Base tool class for common functionality
export abstract class BaseTool implements Tool {
  abstract name: string;
  abstract description: string;
  abstract definition: ToolDefinition;
  
  abstract execute(args: Record<string, any>): Promise<ToolResult>;
  
  protected success(data: any): ToolResult {
    return { success: true, data };
  }
  
  protected failure(error: string): ToolResult {
    return { success: false, error };
  }
}
