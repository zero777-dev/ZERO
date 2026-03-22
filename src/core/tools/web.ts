/**
 * WebTool - Web Scraping and Browser Control
 */

import { BaseTool } from "./base.js";
import { Logger } from "../../utils/logger.js";
import type { ToolResult } from "../types.js";
import * as cheerio from "cheerio";

export class WebTool extends BaseTool {
  name = "web";
  description = "Scrape web pages, extract structured data, take screenshots of URLs";
  
  definition = {
    name: this.name,
    description: this.description,
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["scrape", "extract", "screenshot", "headers"],
          description: "Web action"
        },
        url: {
          type: "string",
          description: "URL to scrape"
        },
        selector: {
          type: "string",
          description: "CSS selector for extraction"
        },
        waitFor: {
          type: "string",
          description: "Selector to wait for before scraping"
        }
      },
      required: ["action", "url"]
    }
  };
  
  async execute(args: Record<string, any>): Promise<ToolResult> {
    const { action, url, selector, waitFor } = args;
    
    try {
      switch (action) {
        case "scrape":
          return await this.scrape(url, selector, waitFor);
        case "extract":
          return await this.extract(url, selector);
        case "headers":
          return await this.getHeaders(url);
        default:
          return this.failure(`Action "${action}" non reconnue`);
      }
    } catch (error: any) {
      return this.failure(`Erreur web: ${error.message}`);
    }
  }
  
  private async scrape(url: string, selector?: string, waitFor?: string): Promise<ToolResult> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9"
        },
        signal: AbortSignal.timeout(15000)
      });
      
      if (!response.ok) {
        return this.failure(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Remove scripts and styles
      $("script, style, nav, footer, header").remove();
      
      if (selector) {
        const content = $(selector).text().trim();
        return this.success({
          url,
          content: content.substring(0, 10000),
          length: content.length
        });
      }
      
      // Extract main content
      const title = $("title").text();
      const meta = {
        description: $('meta[name="description"]').attr("content"),
        keywords: $('meta[name="keywords"]').attr("content")
      };
      
      const paragraphs = $("p")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter((t) => t.length > 50)
        .slice(0, 20);
      
      const links = $("a[href]")
        .map((_, el) => ({
          text: $(el).text().trim(),
          href: $(el).attr("href")
        }))
        .get()
        .filter((l) => l.text && l.href)
        .slice(0, 20);
      
      return this.success({
        url,
        title,
        meta,
        content: paragraphs.join("\n\n"),
        links,
        scraped: true
      });
    } catch (error: any) {
      return this.failure(`Erreur scrape: ${error.message}`);
    }
  }
  
  private async extract(url: string, selector: string): Promise<ToolResult> {
    if (!selector) return this.failure("Selector requis");
    
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36"
        },
        signal: AbortSignal.timeout(10000)
      });
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const elements = $(selector)
        .map((_, el) => ({
          text: $(el).text().trim(),
          html: $(el).html(),
          attributes: $(el).attr()
        }))
        .get();
      
      return this.success({
        url,
        selector,
        elements,
        count: elements.length
      });
    } catch (error: any) {
      return this.failure(`Erreur extract: ${error.message}`);
    }
  }
  
  private async getHeaders(url: string): Promise<ToolResult> {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000)
      });
      
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      return this.success({
        url,
        status: response.status,
        headers
      });
    } catch (error: any) {
      return this.failure(`Erreur headers: ${error.message}`);
    }
  }
}
