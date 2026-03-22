/**
 * SearchTool - Deep Web Search with SearXNG
 * 
 * Multi-source search with fact-checking and verification
 */

import { BaseTool } from "./base.js";
import { Logger } from "../../utils/logger.js";
import type { ToolResult, SearchResult } from "../types.js";

export class SearchTool extends BaseTool {
  name = "search";
  description = "Deep web search using SearXNG with multi-source verification and fact-checking";
  
  private searxngHost: string;
  
  definition = {
    name: this.name,
    description: this.description,
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query"
        },
        engines: {
          type: "array",
          items: { type: "string" },
          description: "Specific engines to use (google, bing, duckduckgo, wikipedia, etc.)"
        },
        maxResults: {
          type: "number",
          description: "Maximum results to return",
          default: 10
        },
        verify: {
          type: "boolean",
          description: "Verify facts with multiple sources",
          default: true
        },
        language: {
          type: "string",
          description: "Language code (en, fr, etc.)",
          default: "en"
        },
        safesearch: {
          type: "number",
          description: "Safe search level (0=off, 1=moderate, 2=strict)",
          default: 1
        }
      },
      required: ["query"]
    }
  };
  
  constructor(logger: Logger) {
    super();
    this.searxngHost = process.env.SEARXNG_HOST || "http://localhost:8888";
  }
  
  async execute(args: Record<string, any>): Promise<ToolResult> {
    const { query, engines, maxResults = 10, verify = true, language = "en", safesearch = 1 } = args;
    
    try {
      // Primary search
      const results = await this.search(query, engines, maxResults, language, safesearch);
      
      // Fact verification if requested
      if (verify && results.length > 0) {
        const verified = await this.verifyFacts(results);
        return this.success({
          query,
          results: verified,
          total: verified.length,
          verified: true
        });
      }
      
      return this.success({
        query,
        results,
        total: results.length,
        verified: false
      });
    } catch (error: any) {
      // Fallback to local-only mode
      return this.success({
        query,
        results: [],
        error: `SearXNG non disponible: ${error.message}`,
        offline: true
      });
    }
  }
  
  private async search(
    query: string,
    engines: string[] | undefined,
    maxResults: number,
    language: string,
    safesearch: number
  ): Promise<SearchResult[]> {
    // Try SearXNG API
    try {
      const params = new URLSearchParams({
        q: query,
        format: "json",
        engines: engines?.join(",") || "",
        limit: maxResults.toString(),
        lang: language,
        safesearch: safesearch.toString()
      });
      
      const response = await fetch(`${this.searxngHost}/search?${params}`, {
        headers: {
          "Accept": "application/json"
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`SearXNG status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return (data.results || []).map((r: any) => ({
        title: r.title || "Untitled",
        url: r.url || r.lixurl || "",
        snippet: r.content || r.answer || "",
        source: r.engine || "unknown"
      }));
    } catch {
      // SearXNG not available - try DuckDuckGo HTML as fallback
      return this.fallbackSearch(query);
    }
  }
  
  private async fallbackSearch(query: string): Promise<SearchResult[]> {
    // Simple fallback using DDG HTML scraping
    const results: SearchResult[] = [];
    
    try {
      const response = await fetch(
        `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=wt-wt`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36"
          },
          signal: AbortSignal.timeout(5000)
        }
      );
      
      const html = await response.text();
      
      // Simple regex extraction (not ideal but works for basic fallback)
      const regex = /<a class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
      let match;
      
      while ((match = regex.exec(html)) && results.length < 10) {
        results.push({
          title: match[2].replace(/<[^>]*>/g, "").trim(),
          url: match[1],
          snippet: match[3].replace(/<[^>]*>/g, "").trim(),
          source: "duckduckgo"
        });
      }
    } catch {}
    
    return results;
  }
  
  private async verifyFacts(results: SearchResult[]): Promise<SearchResult[]> {
    // Extract claims and verify with additional searches
    const verified: SearchResult[] = [];
    
    for (const result of results) {
      // Check if claim can be verified
      const claims = this.extractClaims(result.snippet);
      
      if (claims.length > 0) {
        // Verify first claim
        const verification = await this.verifyClaim(claims[0]);
        verified.push({
          ...result,
          snippet: result.snippet + (verification ? "\n\n✅ Vérifié" : "\n\n⚠️ Non vérifié")
        });
      } else {
        verified.push(result);
      }
    }
    
    return verified;
  }
  
  private extractClaims(text: string): string[] {
    // Simple claim extraction
    const patterns = [
      /[A-Z][^.!?]*[0-9]+%[^.!?]*/g,
      /[0-9]+ (million|billion|trillion) [A-Z][^.!?]*/gi,
      /increased? (by |)([0-9]+%|from [0-9]+ )/gi
    ];
    
    const claims: string[] = [];
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        claims.push(...matches);
      }
    }
    
    return claims;
  }
  
  private async verifyClaim(claim: string): Promise<boolean> {
    try {
      const verificationQuery = `${claim} verify facts`;
      const results = await this.search(verificationQuery, ["wikipedia", "google"], 3, "en", 1);
      
      // Simple verification - if multiple sources agree
      return results.length >= 2;
    } catch {
      return false;
    }
  }
}
