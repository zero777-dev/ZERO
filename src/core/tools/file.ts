/**
 * FileTool - File Management for ZERO
 * 
 * Reads, writes, searches, and organizes files
 */

import { BaseTool } from "./base.js";
import { Logger } from "../../utils/logger.js";
import type { ToolResult, FileInfo } from "../types.js";
import { readdir, stat, readFile, writeFile, mkdir, rm, cp, mv } from "fs/promises";
import { join, extname, basename } from "path";

export class FileTool extends BaseTool {
  name = "file";
  description = "Manage files - read, write, list, search, organize on internal/external storage";
  
  definition = {
    name: this.name,
    description: this.description,
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["read", "write", "list", "search", "info", "create_dir", "delete", "copy", "move"],
          description: "The file action to perform"
        },
        path: {
          type: "string",
          description: "File or directory path"
        },
        content: {
          type: "string",
          description: "Content to write (for write action)"
        },
        search: {
          type: "string",
          description: "Search query (for search action)"
        },
        recursive: {
          type: "boolean",
          description: "Search recursively",
          default: true
        },
        dest: {
          type: "string",
          description: "Destination path (for copy/move)"
        }
      },
      required: ["action", "path"]
    }
  };
  
  async execute(args: Record<string, any>): Promise<ToolResult> {
    const { action, path, content, search, recursive = true, dest } = args;
    
    try {
      switch (action) {
        case "read":
          return await this.readFile(path);
          
        case "write":
          if (!content) return this.failure("Contenu requis pour écriture");
          return await this.writeFile(path, content);
          
        case "list":
          return await this.listDirectory(path, recursive);
          
        case "search":
          return await this.searchFiles(path, search || "", recursive);
          
        case "info":
          return await this.getFileInfo(path);
          
        case "create_dir":
          return await this.createDirectory(path);
          
        case "delete":
          return await this.deleteFile(path);
          
        case "copy":
          if (!dest) return this.failure("Destination requise pour copie");
          return await this.copyFile(path, dest);
          
        case "move":
          if (!dest) return this.failure("Destination requise pour déplacement");
          return await this.moveFile(path, dest);
          
        default:
          return this.failure(`Action "${action}" non reconnue`);
      }
    } catch (error: any) {
      return this.failure(`Erreur: ${error.message}`);
    }
  }
  
  private async readFile(path: string): Promise<ToolResult> {
    try {
      const content = await readFile(path, "utf-8");
      return this.success({
        path,
        content,
        size: content.length
      });
    } catch (error: any) {
      // Try common directories
      const commonPaths = [
        join(process.env.HOME || "", path),
        join(process.cwd(), path),
        `/storage/emulated/0/${path}`,
        `/sdcard/${path}`
      ];
      
      for (const tryPath of commonPaths) {
        try {
          const content = await readFile(tryPath, "utf-8");
          return this.success({
            path: tryPath,
            content,
            size: content.length
          });
        } catch {}
      }
      
      return this.failure(`Impossible de lire: ${error.message}`);
    }
  }
  
  private async writeFile(path: string, content: string): Promise<ToolResult> {
    try {
      await mkdir(join(path, ".."), { recursive: true });
      await writeFile(path, content, "utf-8");
      return this.success({ path, written: content.length });
    } catch (error: any) {
      return this.failure(`Erreur d'écriture: ${error.message}`);
    }
  }
  
  private async listDirectory(path: string, recursive: boolean): Promise<ToolResult> {
    try {
      const files = await this.getFilesRecursively(path, recursive ? 10 : 1, 0);
      return this.success({
        path,
        files,
        total: files.length
      });
    } catch (error: any) {
      return this.failure(`Erreur listage: ${error.message}`);
    }
  }
  
  private async getFilesRecursively(
    dir: string,
    maxDepth: number,
    currentDepth: number
  ): Promise<FileInfo[]> {
    if (currentDepth >= maxDepth) return [];
    
    const files: FileInfo[] = [];
    
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        try {
          const stats = await stat(fullPath);
          
          files.push({
            name: entry.name,
            path: fullPath,
            size: stats.size,
            type: entry.isDirectory() ? "directory" : entry.isSymbolicLink() ? "link" : "file",
            modified: stats.mtime,
            permissions: stats.mode.toString(8).slice(-3)
          });
          
          if (entry.isDirectory() && !entry.name.startsWith(".")) {
            const subFiles = await this.getFilesRecursively(fullPath, maxDepth, currentDepth + 1);
            files.push(...subFiles);
          }
        } catch {}
      }
    } catch {}
    
    return files;
  }
  
  private async searchFiles(path: string, query: string, recursive: boolean): Promise<ToolResult> {
    try {
      const allFiles = await this.getFilesRecursively(path, recursive ? 10 : 1, 0);
      const queryLower = query.toLowerCase();
      
      const results = allFiles.filter(
        (f) =>
          f.name.toLowerCase().includes(queryLower) ||
          (f.type === "file" && extname(f.name).toLowerCase().includes(queryLower))
      );
      
      return this.success({
        query,
        files: results,
        total: results.length
      });
    } catch (error: any) {
      return this.failure(`Erreur recherche: ${error.message}`);
    }
  }
  
  private async getFileInfo(path: string): Promise<ToolResult> {
    try {
      const stats = await stat(path);
      return this.success({
        path,
        size: stats.size,
        type: stats.isDirectory() ? "directory" : "file",
        created: stats.birthtime,
        modified: stats.mtime,
        permissions: stats.mode.toString(8).slice(-3)
      });
    } catch (error: any) {
      return this.failure(`Erreur info: ${error.message}`);
    }
  }
  
  private async createDirectory(path: string): Promise<ToolResult> {
    try {
      await mkdir(path, { recursive: true });
      return this.success({ path, created: true });
    } catch (error: any) {
      return this.failure(`Erreur création dossier: ${error.message}`);
    }
  }
  
  private async deleteFile(path: string): Promise<ToolResult> {
    try {
      await rm(path, { recursive: true, force: true });
      return this.success({ path, deleted: true });
    } catch (error: any) {
      return this.failure(`Erreur suppression: ${error.message}`);
    }
  }
  
  private async copyFile(src: string, dest: string): Promise<ToolResult> {
    try {
      await cp(src, dest, { recursive: true });
      return this.success({ src, dest, copied: true });
    } catch (error: any) {
      return this.failure(`Erreur copie: ${error.message}`);
    }
  }
  
  private async moveFile(src: string, dest: string): Promise<ToolResult> {
    try {
      await mv(src, dest, { recursive: true });
      return this.success({ src, dest, moved: true });
    } catch (error: any) {
      return this.failure(`Erreur déplacement: ${error.message}`);
    }
  }
}
