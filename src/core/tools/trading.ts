/**
 * TradingTool - Market Data & Trading Integration
 * 
 * Fetches market data, tracks prices, analyzes trends
 * Supports Polymarket, crypto, and stock markets
 */

import { BaseTool } from "./base.js";
import { Logger } from "../../utils/logger.js";
import type { ToolResult, MarketData } from "../types.js";
import * as cheerio from "cheerio";

export class TradingTool extends BaseTool {
  name = "trading";
  description = "Get market data, prices, trends from Polymarket, crypto exchanges, stocks";
  
  definition = {
    name: this.name,
    description: this.description,
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["price", "search", "trending", "portfolio", "alert", "analyze"],
          description: "Trading action"
        },
        market: {
          type: "string",
          enum: ["polymarket", "coinbase", "binance", "yahoo"],
          description: "Market platform",
          default: "polymarket"
        },
        query: {
          type: "string",
          description: "Search query (market/asset name)"
        },
        limit: {
          type: "number",
          description: "Number of results",
          default: 10
        }
      },
      required: ["action"]
    }
  };
  
  async execute(args: Record<string, any>): Promise<ToolResult> {
    const { action, market = "polymarket", query, limit = 10 } = args;
    
    try {
      switch (action) {
        case "price":
          return await this.getPrice(market, query);
          
        case "search":
          return await this.searchMarket(market, query, limit);
          
        case "trending":
          return await this.getTrending(market);
          
        case "portfolio":
          return this.getPortfolio();
          
        case "alert":
          return this.setAlert(query);
          
        case "analyze":
          return await this.analyzeMarket(query);
          
        default:
          return this.failure(`Action "${action}" non reconnue`);
      }
    } catch (error: any) {
      return this.failure(`Erreur trading: ${error.message}`);
    }
  }
  
  private async getPrice(market: string, query?: string): Promise<ToolResult> {
    if (!query) return this.failure("Query requis pour getPrice");
    
    switch (market) {
      case "polymarket":
        return await this.getPolymarketPrice(query);
      case "coinbase":
        return await this.getCoinbasePrice(query);
      default:
        return this.failure(`Market "${market}" non supporté`);
    }
  }
  
  private async getPolymarketPrice(query: string): Promise<ToolResult> {
    try {
      // Search for the market
      const searchUrl = `https://api.polymarket.com/markets?search=${encodeURIComponent(query)}&closed=false`;
      
      const response = await fetch(searchUrl, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(10000)
      });
      
      const data = await response.json();
      
      if (!data.markets || data.markets.length === 0) {
        return this.failure(`Aucun marché trouvé pour "${query}"`);
      }
      
      const market = data.markets[0];
      
      const outcomes = market.outcomes || ["Yes", "No"];
      const prices = market.outcomePrices ? 
        JSON.parse(market.outcomePrices) : [0.5, 0.5];
      
      return this.success({
        platform: "polymarket",
        question: market.question,
        url: `https://polymarket.com/market/${market.slug}`,
        volume: parseFloat(market.volume || "0"),
        liquidity: parseFloat(market.liquidity || "0"),
        outcomes: outcomes.map((name: string, i: number) => ({
          name,
          probability: parseFloat(prices[i]) * 100,
          price: prices[i]
        })),
        market
      });
    } catch (error: any) {
      return this.failure(`Erreur Polymarket: ${error.message}`);
    }
  }
  
  private async getCoinbasePrice(query: string): Promise<ToolResult> {
    try {
      // Coinbase simple price API
      const symbol = query.toUpperCase().replace(/[^A-Z]/g, "-");
      const response = await fetch(
        `https://api.coinbase.com/v2/prices/${symbol}/spot`,
        { signal: AbortSignal.timeout(5000) }
      );
      
      const data = await response.json();
      
      return this.success({
        platform: "coinbase",
        symbol,
        price: data.data?.amount,
        currency: data.data?.currency,
        timestamp: new Date()
      });
    } catch (error: any) {
      return this.failure(`Erreur Coinbase: ${error.message}`);
    }
  }
  
  private async searchMarket(market: string, query?: string, limit: number = 10): Promise<ToolResult> {
    if (!query) return this.failure("Query requis pour search");
    
    if (market === "polymarket") {
      return await this.searchPolymarket(query, limit);
    }
    
    return this.failure(`Search pour "${market}" non implémenté`);
  }
  
  private async searchPolymarket(query: string, limit: number): Promise<ToolResult> {
    try {
      const searchUrl = `https://api.polymarket.com/markets?search=${encodeURIComponent(query)}&closed=false&limit=${limit}`;
      
      const response = await fetch(searchUrl, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(10000)
      });
      
      const data = await response.json();
      
      const markets = (data.markets || []).map((m: any) => ({
        question: m.question,
        slug: m.slug,
        url: `https://polymarket.com/market/${m.slug}`,
        volume: parseFloat(m.volume || "0"),
        liquidity: parseFloat(m.liquidity || "0"),
        outcomes: m.outcomes || [],
        prices: m.outcomePrices ? JSON.parse(m.outcomePrices) : []
      }));
      
      return this.success({
        platform: "polymarket",
        query,
        markets,
        total: markets.length
      });
    } catch (error: any) {
      return this.failure(`Erreur search: ${error.message}`);
    }
  }
  
  private async getTrending(market: string): Promise<ToolResult> {
    if (market === "polymarket") {
      return await this.getPolymarketTrending();
    }
    
    return this.failure(`Trending pour "${market}" non implémenté`);
  }
  
  private async getPolymarketTrending(): Promise<ToolResult> {
    try {
      // Get trending markets
      const url = "https://api.polymarket.com/markets?closed=false&limit=20&sortBy=volume";
      
      const response = await fetch(url, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(10000)
      });
      
      const data = await response.json();
      
      const markets = (data.markets || []).slice(0, 10).map((m: any) => ({
        question: m.question,
        url: `https://polymarket.com/market/${m.slug}`,
        volume: parseFloat(m.volume || "0"),
        liquidity: parseFloat(m.liquidity || "0"),
        outcomes: m.outcomes || [],
        prices: m.outcomePrices ? JSON.parse(m.outcomePrices) : []
      }));
      
      return this.success({
        platform: "polymarket",
        type: "trending",
        markets
      });
    } catch (error: any) {
      return this.failure(`Erreur trending: ${error.message}`);
    }
  }
  
  private getPortfolio(): ToolResult {
    return this.success({
      positions: [],
      total_value: 0,
      pnl: 0,
      message: "Connectez vos wallets pour suivre votre portfolio"
    });
  }
  
  private setAlert(query?: string): ToolResult {
    if (!query) return this.failure("Condition d'alerte requise");
    
    return this.success({
      alert: {
        condition: query,
        created: new Date(),
        message: `Alerte créée: ${query}`
      },
      note: "Les alertes seront surveillées par ZERO"
    });
  }
  
  private async analyzeMarket(query?: string): Promise<ToolResult> {
    if (!query) return this.failure("Query requis pour analyze");
    
    // Get market data
    const marketData = await this.getPolymarketPrice(query);
    
    if (!marketData.success) {
      return marketData;
    }
    
    const data = marketData.data as any;
    
    // Simple analysis
    const analysis = {
      market: data.question,
      volume_24h: data.volume,
      liquidity: data.liquidity,
      recommendations: [] as string[],
      risk_level: data.liquidity < 1000 ? "HIGH" : data.liquidity < 10000 ? "MEDIUM" : "LOW",
      opportunities: [] as string[]
    };
    
    // Check for opportunities
    if (data.outcomes && data.outcomes.length === 2) {
      const yesPrice = data.outcomes[1]?.probability || data.outcomes[0]?.probability;
      
      if (yesPrice < 30) {
        analysis.opportunities.push("Probabilité faible - high risk/high reward");
      } else if (yesPrice > 70) {
        analysis.opportunities.push("Probabilité élevée - faible value selon les cotes");
      }
    }
    
    // Recommendations
    if (data.liquidity < 1000) {
      analysis.recommendations.push("⚠️ Liquidité faible - attention au slippage");
    }
    if (data.volume > 10000) {
      analysis.recommendations.push("📊 Volume élevé - marché actif");
    }
    
    return this.success({
      analysis,
      raw: data
    });
  }
}
