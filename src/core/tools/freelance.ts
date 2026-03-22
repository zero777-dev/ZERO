/**
 * FreelanceTool - Multi-Platform Freelance Job Search & Application
 * 
 * Searches and applies to jobs on Upwork, Fiverr, Freelancer, etc.
 */

import { BaseTool } from "./base.js";
import { Logger } from "../../utils/logger.js";
import type { ToolResult, FreelanceJob } from "../types.js";
import * as cheerio from "cheerio";

export class FreelanceTool extends BaseTool {
  name = "freelance";
  description = "Search and apply to freelance jobs on Upwork, Fiverr, Freelancer, Guru, Toptal";
  
  definition = {
    name: this.name,
    description: this.description,
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["search", "apply", "track", "proposals", "stats"],
          description: "Freelance action"
        },
        platform: {
          type: "string",
          enum: ["upwork", "fiverr", "freelancer", "guru", "toptal", "all"],
          description: "Platform to search",
          default: "all"
        },
        query: {
          type: "string",
          description: "Search query (skills, keywords)"
        },
        budget: {
          type: "string",
          description: "Budget range filter (e.g., '100-500')"
        },
        jobId: {
          type: "string",
          description: "Job ID for applying"
        },
        proposal: {
          type: "string",
          description: "Proposal/cover letter text"
        }
      },
      required: ["action"]
    }
  };
  
  async execute(args: Record<string, any>): Promise<ToolResult> {
    const { action, platform = "all", query, budget, jobId, proposal } = args;
    
    try {
      switch (action) {
        case "search":
          return await this.searchJobs(platform, query, budget);
          
        case "apply":
          return await this.applyToJob(platform, jobId!, proposal);
          
        case "track":
          return this.trackApplications();
          
        case "proposals":
          return this.getSavedProposals();
          
        case "stats":
          return this.getStats();
          
        default:
          return this.failure(`Action "${action}" non reconnue`);
      }
    } catch (error: any) {
      return this.failure(`Erreur freelance: ${error.message}`);
    }
  }
  
  private async searchJobs(
    platform: string,
    query?: string,
    budget?: string
  ): Promise<ToolResult> {
    const allJobs: FreelanceJob[] = [];
    
    if (platform === "all" || platform === "upwork") {
      const upworkJobs = await this.searchUpwork(query, budget);
      allJobs.push(...upworkJobs);
    }
    
    if (platform === "all" || platform === "fiverr") {
      const fiverrJobs = await this.searchFiverr(query);
      allJobs.push(...fiverrJobs);
    }
    
    if (platform === "all" || platform === "freelancer") {
      const freelancerJobs = await this.searchFreelancer(query, budget);
      allJobs.push(...freelancerJobs);
    }
    
    // Sort by relevance and budget
    allJobs.sort((a, b) => {
      const budgetA = this.parseBudget(a.budget);
      const budgetB = this.parseBudget(b.budget);
      return budgetB - budgetA;
    });
    
    return this.success({
      platform,
      query,
      jobs: allJobs.slice(0, 20),
      total: allJobs.length
    });
  }
  
  private async searchUpwork(query?: string, budget?: string): Promise<FreelanceJob[]> {
    // Upwork search URL
    const searchUrl = query
      ? `https://www.upwork.com/search/jobs/?q=${encodeURIComponent(query)}`
      : "https://www.upwork.com/search/jobs/";
    
    try {
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
          "Accept": "text/html"
        },
        signal: AbortSignal.timeout(15000)
      });
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const jobs: FreelanceJob[] = [];
      
      $(".job-tile").each((_, el) => {
        const title = $(el).find(".job-title").text().trim();
        const link = "https://www.upwork.com" + $(el).find("a").attr("href");
        const desc = $(el).find(".job-description").text().trim();
        const budgetText = $(el).find(".budget").text().trim() || 
                          $(el).find(".hourly-rate").text().trim();
        
        if (title) {
          jobs.push({
            id: link.split("/").pop() || "",
            title,
            platform: "upwork",
            url: link,
            budget: budgetText,
            skills: this.extractSkills(desc),
            description: desc.substring(0, 300),
            postedDate: new Date()
          });
        }
      });
      
      return jobs.slice(0, 10);
    } catch {
      return [];
    }
  }
  
  private async searchFiverr(query?: string): Promise<FreelanceJob[]> {
    // Fiverr gigs search
    const searchUrl = query
      ? `https://www.fiverr.com/search/gigs?query=${encodeURIComponent(query)}`
      : "https://www.fiverr.com/categories";
    
    try {
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36"
        },
        signal: AbortSignal.timeout(10000)
      });
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const jobs: FreelanceJob[] = [];
      
      $(".gig-card").each((_, el) => {
        const title = $(el).find(". gig-title").text().trim();
        const link = "https://www.fiverr.com" + $(el).find("a").attr("href");
        const priceText = $(el).find(".price").text().trim();
        
        if (title) {
          jobs.push({
            id: link.split("/").pop() || "",
            title,
            platform: "fiverr",
            url: link,
            budget: priceText || "Gig disponible",
            skills: [],
            description: title,
            postedDate: new Date()
          });
        }
      });
      
      return jobs.slice(0, 10);
    } catch {
      return [];
    }
  }
  
  private async searchFreelancer(query?: string, budget?: string): Promise<FreelanceJob[]> {
    const searchUrl = query
      ? `https://www.freelancer.com/job-search/${encodeURIComponent(query)}/`
      : "https://www.freelancer.com/job-search/";
    
    try {
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36"
        },
        signal: AbortSignal.timeout(10000)
      });
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const jobs: FreelanceJob[] = [];
      
      $(".JobSearchCard").each((_, el) => {
        const title = $(el).find(".JobSearchCard-title").text().trim();
        const link = "https://www.freelancer.com" + $(el).find("a").attr("href");
        const budgetText = $(el).find(".JobSearchCard-price").text().trim();
        const desc = $(el).find(".JobSearchCard-description").text().trim();
        
        if (title) {
          jobs.push({
            id: link.split("/").pop() || "",
            title,
            platform: "freelancer",
            url: link,
            budget: budgetText,
            skills: this.extractSkills(desc),
            description: desc.substring(0, 300),
            postedDate: new Date()
          });
        }
      });
      
      return jobs.slice(0, 10);
    } catch {
      return [];
    }
  }
  
  private async applyToJob(platform: string, jobId: string, proposal?: string): Promise<ToolResult> {
    return this.success({
      platform,
      jobId,
      proposal: proposal || "",
      status: "manual_required",
      message: "La postulation automatique nécessite des identifiants de connexion. " +
               "ZERO peut préparer une proposition, mais vous devez postuler manuellement."
    });
  }
  
  private trackApplications(): ToolResult {
    // Return tracked applications from storage
    return this.success({
      applications: [],
      total: 0,
      message: "Système de suivi en développement"
    });
  }
  
  private getSavedProposals(): ToolResult {
    return this.success({
      proposals: [],
      message: "Proposez-moi un projet et je générerai une proposition"
    });
  }
  
  private getStats(): ToolResult {
    return this.success({
      jobs_applied: 0,
      jobs_won: 0,
      success_rate: 0,
      earnings: 0,
      message: "Commencez à postuler pour voir vos statistiques"
    });
  }
  
  private extractSkills(text: string): string[] {
    const skillPatterns = [
      /python/i, /javascript/i, /typescript/i, /react/i, /node\.?js/i,
      /java/i, /kotlin/i, /swift/i, /golang/i, /rust/i,
      /php/i, /ruby/i, /c\+\+/i, /c#/i, /scala/i,
      /aws/i, /azure/i, /gcp/i, /docker/i, /kubernetes/i,
      /sql/i, /mongodb/i, /postgresql/i, /redis/i,
      /machine learning/i, /ai/i, /data science/i,
      /web scraping/i, /automation/i, /api/i, /frontend/i, /backend/i,
      /mobile/i, /ios/i, /android/i, /react native/i,
      /wordpress/i, /shopify/i, /magento/i,
      /seo/i, /marketing/i, /writing/i, /translation/i,
      /video/i, /animation/i, /design/i, /ui.*ux/i
    ];
    
    return skillPatterns
      .filter((p) => p.test(text))
      .map((p) => p.source.replace(/[^a-z0-9 ]/gi, "").trim());
  }
  
  private parseBudget(budgetStr: string): number {
    const match = budgetStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
}
