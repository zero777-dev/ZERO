/**
 * Logger - ZERO Logging Utility
 */

type LogLevel = "debug" | "info" | "warn" | "error" | "success";

export class Logger {
  private enableDebug: boolean;
  
  constructor(enableDebug: boolean = process.env.DEBUG === "true") {
    this.enableDebug = enableDebug;
  }
  
  debug(message: string, ...args: any[]): void {
    if (this.enableDebug) {
      console.log(`\x1b[90m[DEBUG]\x1b[0m ${message}`, ...args);
    }
  }
  
  info(message: string, ...args: any[]): void {
    console.log(`\x1b[36m[INFO]\x1b[0m ${message}`, ...args);
  }
  
  warn(message: string, ...args: any[]): void {
    console.warn(`\x1b[33m[WARN]\x1b[0m ${message}`, ...args);
  }
  
  error(message: string, ...args: any[]): void {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`, ...args);
  }
  
  success(message: string, ...args: any[]): void {
    console.log(`\x1b[32m[OK]\x1b[0m ${message}`, ...args);
  }
  
  step(current: number, total: number, message: string): void {
    console.log(`\x1b[35m[${current}/${total}]\x1b[0m ${message}`);
  }
  
  header(title: string): void {
    console.log(`\n\x1b[1m${title}\x1b[0m`);
    console.log("─".repeat(title.length + 2));
  }
}
