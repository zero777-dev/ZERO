/**
 * CronTool - Task Scheduling for ZERO
 * 
 * Schedules tasks to run automatically at specified times
 */

import { BaseTool } from "./base.js";
import { Logger } from "../../utils/logger.js";
import type { ToolResult, ScheduledTask } from "../types.js";
import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";

export class CronTool extends BaseTool {
  name = "schedule";
  description = "Schedule and manage periodic tasks (cron jobs) for ZERO";
  
  private tasks: Map<string, ScheduledTask> = new Map();
  private tasksFile: string;
  
  definition = {
    name: this.name,
    description: this.description,
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["add", "remove", "list", "enable", "disable", "run"],
          description: "Schedule action"
        },
        name: {
          type: "string",
          description: "Task name"
        },
        cron: {
          type: "string",
          description: "Cron expression (e.g., '0 * * * *' for hourly)"
        },
        command: {
          type: "string",
          description: "Command or prompt to execute"
        },
        taskId: {
          type: "string",
          description: "Task ID (for remove/enable/disable/run)"
        }
      },
      required: ["action"]
    }
  };
  
  constructor(logger: Logger) {
    super();
    this.tasksFile = join(process.env.ZERO_DATA_PATH || ".", "data", "schedules.json");
  }
  
  async execute(args: Record<string, any>): Promise<ToolResult> {
    const { action, name, cron, command, taskId } = args;
    
    try {
      await this.loadTasks();
      
      switch (action) {
        case "add":
          if (!name || !cron || !command) {
            return this.failure("name, cron, et command requis");
          }
          return await this.addTask(name, cron, command);
          
        case "remove":
          return await this.removeTask(taskId || name || "");
          
        case "list":
          return this.listTasks();
          
        case "enable":
        case "disable":
          return await this.toggleTask(taskId || name || "", action === "enable");
          
        case "run":
          return await this.runTask(taskId || name || "");
          
        default:
          return this.failure(`Action "${action}" non reconnue`);
      }
    } catch (error: any) {
      return this.failure(`Erreur: ${error.message}`);
    }
  }
  
  private async addTask(name: string, cron: string, command: string): Promise<ToolResult> {
    const task: ScheduledTask = {
      id: `task_${Date.now()}`,
      name,
      cron,
      command,
      enabled: true,
      nextRun: this.getNextRun(cron)
    };
    
    this.tasks.set(task.id, task);
    await this.saveTasks();
    
    return this.success({
      task,
      message: `Tâche "${name}" planifiée: ${cron}`
    });
  }
  
  private async removeTask(idOrName: string): Promise<ToolResult> {
    for (const [id, task] of this.tasks) {
      if (id === idOrName || task.name === idOrName) {
        this.tasks.delete(id);
        await this.saveTasks();
        return this.success({ removed: id });
      }
    }
    
    return this.failure(`Tâche "${idOrName}" non trouvée`);
  }
  
  private listTasks(): ToolResult {
    const tasks = Array.from(this.tasks.values());
    return this.success({
      tasks,
      count: tasks.length
    });
  }
  
  private async toggleTask(idOrName: string, enable: boolean): Promise<ToolResult> {
    for (const [id, task] of this.tasks) {
      if (id === idOrName || task.name === idOrName) {
        task.enabled = enable;
        await this.saveTasks();
        return this.success({ task });
      }
    }
    
    return this.failure(`Tâche "${idOrName}" non trouvée`);
  }
  
  private async runTask(idOrName: string): Promise<ToolResult> {
    for (const [id, task] of this.tasks) {
      if (id === idOrName || task.name === idOrName) {
        task.lastRun = new Date();
        task.nextRun = this.getNextRun(task.cron);
        await this.saveTasks();
        
        return this.success({
          task,
          command: task.command,
          executed: true
        });
      }
    }
    
    return this.failure(`Tâche "${idOrName}" non trouvée`);
  }
  
  private getNextRun(cron: string): Date {
    // Simple next run calculation
    const parts = cron.split(" ");
    if (parts.length < 5) return new Date(Date.now() + 3600000);
    
    const [minute, hour, day, month, weekday] = parts;
    const now = new Date();
    const next = new Date(now);
    
    // Basic cron parsing
    if (minute !== "*") {
      const m = parseInt(minute);
      next.setMinutes(m > now.getMinutes() ? m : m + 60);
    }
    
    if (hour !== "*") {
      const h = parseInt(hour);
      if (minute !== "*" || h > now.getHours()) {
        next.setHours(h);
      } else {
        next.setHours(h + 24);
      }
    }
    
    return next;
  }
  
  private async loadTasks(): Promise<void> {
    try {
      const data = await readFile(this.tasksFile, "utf-8");
      const tasks = JSON.parse(data);
      this.tasks = new Map(tasks.map((t: ScheduledTask) => [t.id, t]));
    } catch {
      this.tasks = new Map();
    }
  }
  
  private async saveTasks(): Promise<void> {
    await mkdir(join(this.tasksFile, ".."), { recursive: true });
    const data = JSON.stringify(Array.from(this.tasks.values()), null, 2);
    await writeFile(this.tasksFile, data, "utf-8");
  }
}
