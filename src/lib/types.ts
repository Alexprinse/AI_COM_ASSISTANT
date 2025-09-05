export type Priority = "urgent" | "medium" | "low";
export type Sentiment = "positive" | "neutral" | "negative";
export type EmailStatus = "pending" | "drafted" | "sent" | "skipped";

export interface Email {
  id: string;
  messageId: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  bodyText: string;
  receivedAt: Date;
  isFiltered: boolean;
  sentiment: Sentiment;
  priority: Priority;
  priorityScore: number;
  status: EmailStatus;
  entities?: EmailEntity[];
  response?: EmailResponse;
}

export interface EmailEntity {
  id: string;
  emailId: string;
  entityType: "phone" | "email" | "product" | "order_id" | "issue" | "keyword";
  value: string;
  startIdx?: number;
  endIdx?: number;
}

export interface EmailResponse {
  id: string;
  emailId: string;
  draftText: string;
  finalText?: string;
  ragSources: string[];
  generatedAt: Date;
  sentAt?: Date;
  sentBy: string;
  // Optional LLM metadata
  modelUsed?: string;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    costUsd?: number;
  };
  errorMessage?: string;
}

export interface AnalyticsData {
  totalEmails: number;
  filteredEmails: number;
  urgentEmails: number;
  sentEmails: number;
  pendingEmails: number;
  sentimentBreakdown: Record<Sentiment, number>;
  priorityBreakdown: Record<Priority, number>;
  volumeData: Array<{ time: string; count: number }>;
}