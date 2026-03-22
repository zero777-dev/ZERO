/**
 * AutomationTool - App Automation via Accessibility
 * 
 * Controls Android apps by reading screen and performing actions
 */

import { BaseTool } from "./base.js";
import { Logger } from "../../utils/logger.js";
import type { ToolResult, AutomationTask, AutomationStep } from "../types.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class AutomationTool extends BaseTool {
  name = "automation";
  description = "Automate Android apps using accessibility - tap, swipe, type, launch apps";
  
  definition = {
    name: this.name,
    description: this.description,
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["tap", "swipe", "type", "screenshot", "launch", "get_screen", "record", "stop"],
          description: "Automation action"
        },
        x: {
          type: "number",
          description: "X coordinate (for tap/swipe)"
        },
        y: {
          type: "number",
          description: "Y coordinate (for tap/swipe)"
        },
        endX: {
          type: "number",
          description: "End X (for swipe)"
        },
        endY: {
          type: "number",
          description: "End Y (for swipe)"
        },
        text: {
          type: "string",
          description: "Text to type"
        },
        app: {
          type: "string",
          description: "App package name (for launch)"
        },
        duration: {
          type: "number",
          description: "Duration in ms (for swipe/delay)"
        }
      },
      required: ["action"]
    }
  };
  
  async execute(args: Record<string, any>): Promise<ToolResult> {
    const { action, x, y, endX, endY, text, app, duration = 300 } = args;
    
    try {
      switch (action) {
        case "tap":
          return await this.tap(x!, y!);
          
        case "swipe":
          return await this.swipe(x!, y!, endX!, endY!, duration);
          
        case "type":
          return await this.typeText(text!);
          
        case "screenshot":
          return await this.screenshot();
          
        case "get_screen":
          return await this.getScreenText();
          
        case "launch":
          return await this.launchApp(app!);
          
        default:
          return this.failure(`Action "${action}" non supportée`);
      }
    } catch (error: any) {
      return this.failure(`Erreur automation: ${error.message}`);
    }
  }
  
  private async tap(x: number, y: number): Promise<ToolResult> {
    try {
      await execAsync(`termux-tts-speak "tap"`);
      
      // Use input tap via ADB if available, otherwise mock
      try {
        await execAsync(`adb shell input tap ${x} ${y}`);
        return this.success({ action: "tap", x, y });
      } catch {
        // Fallback - Termux might not have ADB
        return this.success({ 
          action: "tap", 
          x, 
          y, 
          warning: "ADB not available - this requires a computer or wireless ADB"
        });
      }
    } catch (error: any) {
      return this.failure(`Erreur tap: ${error.message}`);
    }
  }
  
  private async swipe(x1: number, y1: number, x2: number, y2: number, duration: number): Promise<ToolResult> {
    try {
      try {
        await execAsync(`adb shell input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`);
        return this.success({ action: "swipe", from: { x: x1, y: y1 }, to: { x: x2, y: y2 }, duration });
      } catch {
        return this.success({
          action: "swipe",
          from: { x: x1, y: y1 },
          to: { x: x2, y: y2 },
          duration,
          warning: "ADB not available"
        });
      }
    } catch (error: any) {
      return this.failure(`Erreur swipe: ${error.message}`);
    }
  }
  
  private async typeText(text: string): Promise<ToolResult> {
    try {
      try {
        await execAsync(`adb shell input text "${text.replace(/"/g, '\\"')}"`);
        return this.success({ action: "type", text: text.substring(0, 100) });
      } catch {
        return this.success({
          action: "type",
          text: text.substring(0, 100),
          warning: "ADB not available"
        });
      }
    } catch (error: any) {
      return this.failure(`Erreur type: ${error.message}`);
    }
  }
  
  private async screenshot(): Promise<ToolResult> {
    try {
      const { default: fs } = await import("fs/promises");
      const path = "/sdcard/ZERO_screenshot.png";
      
      try {
        await execAsync(`adb shell screencap -p ${path}`);
        await execAsync(`adb pull ${path} .`);
        
        return this.success({
          action: "screenshot",
          path,
          localPath: "./ZERO_screenshot.png",
          saved: true
        });
      } catch {
        return this.success({
          action: "screenshot",
          warning: "ADB not available - requires computer connection"
        });
      }
    } catch (error: any) {
      return this.failure(`Erreur screenshot: ${error.message}`);
    }
  }
  
  private async getScreenText(): Promise<ToolResult> {
    try {
      try {
        await execAsync(`adb shell uiautomator dump /sdcard/ZERO_screen.xml`);
        await execAsync(`adb pull /sdcard/ZERO_screen.xml .`);
        
        const { default: fs } = await import("fs/promises");
        const xml = await fs.readFile("./ZERO_screen.xml", "utf-8");
        
        // Extract text from UI XML
        const textMatches = xml.match(/text="([^"]+)"/g) || [];
        const texts = textMatches.map((m) => m.match(/text="([^"]+)"/)![1]);
        
        return this.success({
          action: "get_screen",
          texts,
          raw: xml
        });
      } catch {
        return this.success({
          action: "get_screen",
          warning: "ADB not available - requires computer connection"
        });
      }
    } catch (error: any) {
      return this.failure(`Erreur get_screen: ${error.message}`);
    }
  }
  
  private async launchApp(app: string): Promise<ToolResult> {
    try {
      try {
        await execAsync(`adb shell am start -n ${app}/.MainActivity`);
        return this.success({ action: "launch", app });
      } catch {
        return this.success({
          action: "launch",
          app,
          warning: "ADB not available"
        });
      }
    } catch (error: any) {
      return this.failure(`Erreur launch: ${error.message}`);
    }
  }
}
