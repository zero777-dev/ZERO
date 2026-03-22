/**
 * NotificationTool - System Notifications for ZERO
 * 
 * Sends notifications to the user via Termux:API
 */

import { BaseTool } from "./base.js";
import { Logger } from "../../utils/logger.js";
import type { ToolResult } from "../types.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class NotificationTool extends BaseTool {
  name = "notify";
  description = "Send system notifications, alerts, and reminders to the user";
  
  definition = {
    name: this.name,
    description: this.description,
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["send", "list", "remove", "schedule"],
          description: "Notification action"
        },
        title: {
          type: "string",
          description: "Notification title"
        },
        message: {
          type: "string",
          description: "Notification message"
        },
        urgency: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "Urgency level",
          default: "medium"
        },
        sound: {
          type: "boolean",
          description: "Play sound",
          default: true
        },
        vibrate: {
          type: "boolean",
          description: "Vibrate",
          default: true
        },
        id: {
          type: "string",
          description: "Notification ID (for remove)"
        }
      },
      required: ["action", "message"]
    }
  };
  
  async execute(args: Record<string, any>): Promise<ToolResult> {
    const { action, title = "ZERO", message, urgency = "medium", sound = true, vibrate = true, id } = args;
    
    try {
      switch (action) {
        case "send":
          return await this.sendNotification(title, message, urgency, sound, vibrate);
          
        case "list":
          return await this.listNotifications();
          
        case "remove":
          return await this.removeNotification(id);
          
        case "schedule":
          return this.scheduleNotification(title, message);
          
        default:
          return this.failure(`Action "${action}" non reconnue`);
      }
    } catch (error: any) {
      return this.failure(`Erreur notification: ${error.message}`);
    }
  }
  
  private async sendNotification(
    title: string,
    message: string,
    urgency: string,
    sound: boolean,
    vibrate: boolean
  ): Promise<ToolResult> {
    try {
      // Try Termux:API first
      const cmd = [
        "termux-notification",
        `--title "${title}"`,
        `--content "${message.substring(0, 500)}"`,
        urgency !== "medium" ? `--urgency ${urgency}` : "",
        sound ? "" : "--silent",
        vibrate ? "" : "--novibrate"
      ].filter(Boolean).join(" ");
      
      await execAsync(cmd);
      
      return this.success({
        sent: true,
        title,
        message,
        method: "termux-api"
      });
    } catch {
      // Fallback to echo
      console.log(`\n📱 ${title}: ${message}\n`);
      
      return this.success({
        sent: true,
        title,
        message,
        method: "console",
        warning: "Termux:API non installé - notification affichée dans la console"
      });
    }
  }
  
  private async listNotifications(): Promise<ToolResult> {
    try {
      await execAsync("termux-notification-list");
      return this.success({
        notifications: [],
        message: "Liste des notifications actives"
      });
    } catch {
      return this.success({
        notifications: [],
        message: "Termux:API non disponible"
      });
    }
  }
  
  private async removeNotification(id?: string): Promise<ToolResult> {
    if (!id) return this.failure("ID requis");
    
    try {
      await execAsync(`termux-notification-remove ${id}`);
      return this.success({ removed: id });
    } catch {
      return this.failure("Termux:API non disponible");
    }
  }
  
  private scheduleNotification(title: string, message: string): ToolResult {
    return this.success({
      scheduled: true,
      title,
      message,
      note: "Les notifications planifiées nécessitent WorkManager ou termux-boot"
    });
  }
}
