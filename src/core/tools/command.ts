/**
 * CommandTool - Shell Command Execution
 */

import { BaseTool } from "./base.js";
import { Logger } from "../../utils/logger.js";
import type { ToolResult } from "../types.js";
import { exec, spawn } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class CommandTool extends BaseTool {
  name = "command";
  description = "Execute shell commands on the system (Termux/Linux)";
  
  private allowedCommands = [
    "ls", "cat", "grep", "find", "echo", "pwd", "cd", "mkdir", "touch",
    "curl", "wget", "git", "npm", "bun", "node", "python", "pip",
    "termux-", "pkg", "df", "du", "free", "ps", "top", "kill",
    "zip", "unzip", "tar", "gzip", "md5sum", "sha256sum"
  ];
  
  private blockedPatterns = [
    /rm\s+-rf\s+\//i, /dd\s+if=.*of=\/dev\//i, /mkfs/i, /fdisk/i,
    /curl.*\|.*sh/i, /wget.*\|.*sh/i
  ];
  
  definition = {
    name: this.name,
    description: this.description,
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "Shell command to execute"
        },
        cwd: {
          type: "string",
          description: "Working directory"
        },
        timeout: {
          type: "number",
          description: "Timeout in seconds",
          default: 30
        }
      },
      required: ["command"]
    }
  };
  
  async execute(args: Record<string, any>): Promise<ToolResult> {
    const { command, cwd, timeout = 30 } = args;
    
    // Security check
    if (!this.isSafe(command)) {
      return this.failure("Commande non autorisée pour des raisons de sécurité");
    }
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: cwd || process.cwd(),
        timeout: timeout * 1000,
        maxBuffer: 1024 * 1024
      });
      
      return this.success({
        command,
        stdout: stdout.substring(0, 50000),
        stderr: stderr.substring(0, 5000),
        exitCode: 0
      });
    } catch (error: any) {
      return this.success({
        command,
        stdout: "",
        stderr: error.message,
        exitCode: error.code || 1,
        error: true
      });
    }
  }
  
  private isSafe(command: string): boolean {
    // Check if first word is allowed
    const firstWord = command.trim().split(/\s+/)[0];
    
    // Allow termux- commands unconditionally
    if (firstWord.startsWith("termux-")) return true;
    
    // Check against blocked patterns
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(command)) return false;
    }
    
    // Check against allowed commands
    return this.allowedCommands.some((cmd) => 
      firstWord === cmd || firstWord.startsWith(cmd + "-")
    );
  }
}
