/**
 * ZERO Type Definitions
 */

// Messages
export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  name?: string;
}

// Tool System
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

// LLM Responses
export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  model?: string;
  tokens?: number;
}

// Search
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface SearchOptions {
  maxResults?: number;
  engines?: string[];
  safeSearch?: boolean;
}

// File Operations
export interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: "file" | "directory" | "link";
  modified: Date;
  permissions: string;
}

export interface FileSearchResult {
  files: FileInfo[];
  total: number;
}

// Automation
export interface AutomationTask {
  id: string;
  name: string;
  description: string;
  app: string;
  steps: AutomationStep[];
  status: "pending" | "running" | "completed" | "failed";
}

export interface AutomationStep {
  action: "tap" | "swipe" | "type" | "wait" | "screenshot" | "launch";
  params: Record<string, any>;
}

// Cron/Scheduling
export interface ScheduledTask {
  id: string;
  name: string;
  cron: string;
  command: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

// Memory
export interface MemoryEntry {
  id: string;
  content: string;
  embedding?: number[];
  type: "message" | "fact" | "preference" | "skill";
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface MemoryStats {
  messageCount: number;
  contextTokens: number;
  vectorCount: number;
}

// Skills
export interface Skill {
  name: string;
  description: string;
  content: string;
  enabled: boolean;
  category: "research" | "freelance" | "trading" | "social" | "automation" | "general";
}

// Freelance
export interface FreelanceJob {
  id: string;
  title: string;
  platform: "upwork" | "fiverr" | "freelancer" | "guru";
  url: string;
  budget: string;
  skills: string[];
  description: string;
  postedDate: Date;
  clientRating?: number;
}

// Trading
export interface MarketData {
  market: string;
  question: string;
  volume: number;
  liquidity: number;
  outcomes: {
    name: string;
    probability: number;
    price: number;
  }[];
}

// Config
export interface ZEROConfig {
  user?: {
    name?: string;
    email?: string;
    timezone?: string;
  };
  persona?: string;
  ollama?: {
    host?: string;
    model?: string;
    embedding?: string;
  };
  search?: {
    searxng?: string;
    engines?: string[];
  };
  telegram?: {
    enabled?: boolean;
    token?: string;
    chatId?: string;
  };
}
