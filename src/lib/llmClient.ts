import { Email } from "./types";

// Minimal OpenRouter chat client for generating support replies.
// NOTE: Calling this from the browser exposes your API key if you put it in Vite envs.
// Prefer proxying through a server. This client will fall back to a heuristic draft if no key.

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const DEFAULT_MODEL = import.meta.env.VITE_OPENROUTER_MODEL ||
  "deepseek/deepseek-r1-0528-qwen3-8b:free";

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;
const APP_NAME = import.meta.env.VITE_APP_NAME || "AI Email Support";

export interface LLMResult {
  draftText: string;
  model: string;
  raw?: unknown;
  errorMessage?: string;
}

function buildSystemPrompt() {
  return [
    "You are a senior customer support assistant.",
    "Write concise, professional, friendly replies.",
    "Be empathetic if the customer is frustrated; acknowledge their emotion.",
    "Use only provided context and facts; avoid speculation.",
    "If policy or info is missing, ask 1-2 clarifying questions.",
  "Aim for 8-12 sentences; for low-priority or simple requests, keep it to 4-6 sentences.",
  ].join(" ");
}

function buildUserPrompt(email: Email, knowledgeSnippets: string[] = [], opts?: { verbosity?: "default" | "more_detail"; variant?: number; previousDraft?: string; regenerate?: boolean; }) {
  const lines: string[] = [];

  lines.push("[TICKET]");
  lines.push(`From: ${email.fromEmail}`);
  lines.push(`Subject: ${email.subject}`);
  lines.push(`Priority: ${email.priority}`);
  lines.push(`Sentiment: ${email.sentiment}`);
  lines.push("");
  lines.push("Body:");
  lines.push(email.bodyText);

  if (email.entities && email.entities.length > 0) {
    lines.push("");
    lines.push("Extracted entities:");
    email.entities.forEach((e) => {
      lines.push(`- ${e.entityType}: ${e.value}`);
    });
  }

  if (knowledgeSnippets.length > 0) {
    lines.push("");
    lines.push("[KNOWLEDGE BASE SNIPPETS]");
    knowledgeSnippets.forEach((s, i) => {
      lines.push(`KB#${i + 1}: ${s}`);
    });
  }

  lines.push("");
  lines.push("Task: Draft a helpful reply that addresses the customer directly, references the product or issue if mentioned, and provides next steps or resolution information. If sentiment is negative, start with an empathetic acknowledgment. End with a friendly closing.");
  lines.push("");
  lines.push("Please include the following structure when appropriate:");
  lines.push("1) One-sentence empathy/opening if sentiment is negative");
  lines.push("2) 2-3 numbered actions you will take next");
  lines.push("3) An expected ETA or next update window");
  lines.push("4) One clarifying question only if necessary");
  lines.push("5) A brief, friendly closing mentioning the product/issue");

  // Verbosity guidance
  if (opts?.verbosity === "more_detail") {
    lines.push("");
    lines.push("Length: Aim for 10-14 sentences with slightly more explanation where helpful.");
  } else {
    lines.push("");
    lines.push("Length: Aim for 5-7 sentences unless the issue is complex.");
  }

  // Style variants to encourage diversity across regenerations
  const variant = Math.max(1, Math.min(5, Math.floor(opts?.variant ?? 1)));
  lines.push("");
  lines.push("Style variants (pick the specified one):");
  lines.push("1) Formal and precise, short paragraphs");
  lines.push("2) Warm and empathetic, friendly tone");
  lines.push("3) Step-by-step bullets for actions");
  lines.push("4) Numbered plan with ETA focus");
  lines.push("5) Concise first, details after");
  lines.push(`Use style variant: ${variant}.`);

  // If regenerating, provide alternative wording
  if (opts?.regenerate && opts?.previousDraft) {
    lines.push("");
    lines.push("Previous draft (for reference, do NOT copy):");
    lines.push("---");
    lines.push(opts.previousDraft);
    lines.push("---");
    lines.push("Produce an alternative with different phrasing and order. Keep facts and commitments consistent.");
  }

  return lines.join("\n");
}

function heuristicDraft(
  email: Email,
  opts?: { verbosity?: "default" | "more_detail"; variant?: number; regenerate?: boolean; previousDraft?: string }
): string {
  const name = email.fromEmail.split("@")[0];
  const issue = email.entities?.find((e) => e.entityType === "issue")?.value || "your request";
  const isNeg = email.sentiment === "negative";
  const v = opts?.verbosity ?? "default";
  const variant = Math.max(1, Math.min(5, Math.floor(opts?.variant ?? 1)));

  // Synonym pools for light variation
  const escalate = [
    "I’m escalating this right away",
    "I’m prioritizing this immediately",
    "I’ve flagged this for urgent handling",
    "I’m moving this to our priority queue",
    "I’m fast-tracking this with the team",
  ];
  const investigate = [
    "I’m looking into this now",
    "I’m investigating the details",
    "I’m reviewing your account and logs",
    "I’m checking relevant systems",
    "I’m verifying the configuration",
  ];
  const etaUrgent = [
    "I’ll update you within 30–60 minutes.",
    "Expect an update within the hour.",
    "I’ll follow up in under an hour.",
  ];
  const etaMedium = [
    "I’ll follow up within 2 business hours.",
    "Expect an update in the next couple of hours.",
  ];
  const etaLow = [
    "I’ll get back to you within 1 business day.",
    "Expect a response from me by tomorrow.",
  ];

  // Openers
  const opening = isNeg
    ? [`Hi ${name}, I’m sorry about the trouble with ${issue}.`, `Hi ${name}, I understand this has been frustrating—thanks for your patience with ${issue}.`][variant % 2]
    : [`Hi ${name}, thanks for contacting us about ${issue}.`, `Hi ${name}, appreciate you reaching out regarding ${issue}.`][variant % 2];

  // Core intent sentence tuned by priority
  let intent: string;
  if (email.priority === "urgent") {
    intent = `${escalate[variant % escalate.length]} and coordinating with our engineers.`;
  } else if (email.priority === "medium") {
    intent = `${investigate[variant % investigate.length]} and preparing next steps.`;
  } else {
    intent = "I’ll review the details and get this resolved for you.";
  }

  // Steps for more detail or certain variants
  const steps: string[] = [];
  if (v === "more_detail" || variant === 3 || variant === 4) {
    steps.push("1) Review your account and recent activity");
    steps.push("2) Check system status and related logs");
    if (email.priority === "urgent") {
      steps.push("3) Engage on-call engineer for immediate triage");
    } else {
      steps.push("3) Prepare recommended fix or guidance");
    }
  }

  // ETA line by priority
  const eta = email.priority === "urgent" ? etaUrgent[variant % etaUrgent.length] : email.priority === "medium" ? etaMedium[variant % etaMedium.length] : etaLow[variant % etaLow.length];

  // Optional clarifying question if we lack structured context
  let question = "";
  const hasOrderOrProduct = email.entities?.some((e) => e.entityType === "order_id" || e.entityType === "product");
  if (v === "more_detail" && !hasOrderOrProduct) {
    question = "Could you share any relevant screenshots or exact error messages to speed things up?";
  }

  // Build paragraphs based on variant
  const lines: string[] = [];
  lines.push(opening);
  lines.push(intent);
  if (steps.length) {
    lines.push("Here’s the plan:");
    steps.forEach((s) => lines.push(s));
  }
  lines.push(eta);
  if (question) lines.push(question);
  lines.push("");
  lines.push("Best regards,");
  lines.push("Support Team");

  return lines.join("\n");
}

export async function generateSupportReply(email: Email, options?: {
  model?: string;
  knowledgeSnippets?: string[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  verbosity?: "default" | "more_detail";
  variant?: number;
  previousDraft?: string;
  regenerate?: boolean;
}): Promise<LLMResult> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const model = options?.model || DEFAULT_MODEL;
  const knowledgeSnippets = options?.knowledgeSnippets || [];

  // If no key, return heuristic draft
  if (!apiKey) {
    return { draftText: heuristicDraft(email, { verbosity: options?.verbosity, variant: options?.variant, regenerate: options?.regenerate, previousDraft: options?.previousDraft }), model: "heuristic", errorMessage: "No API key set" };
  }

  const system = buildSystemPrompt();
  const user = buildUserPrompt(email, knowledgeSnippets, {
    verbosity: options?.verbosity,
    variant: options?.variant,
    previousDraft: options?.previousDraft,
    regenerate: options?.regenerate,
  });

  const body = {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature:
      options?.temperature ?? (options?.verbosity === "more_detail" || options?.regenerate ? 0.5 : 0.35),
    // Slightly larger default; dynamic by urgency/sentiment
    max_tokens:
      options?.maxTokens ??
      (options?.verbosity === "more_detail"
        ? 900
        : email.priority === "urgent" || email.sentiment === "negative"
        ? 800
        : 600),
  } as const;

  const modelsToTry = [
    model,
    // Common free fallbacks on OpenRouter (subject to availability)
    "meta-llama/llama-3.1-8b-instruct:free",
    "qwen/qwen2.5-7b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
  ];

  let lastError = "";
  for (const m of modelsToTry) {
    try {
      const attemptBody = { ...body, model: m } as const;
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": APP_URL,
          "X-Title": APP_NAME,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(attemptBody),
        signal: options?.signal,
      });
      let errorText = "";
      if (!res.ok) {
        try {
          const errJson: any = await res.json();
          errorText = errJson?.error?.message || JSON.stringify(errJson);
        } catch {
          errorText = await res.text();
        }
        lastError = `${res.status}: ${errorText || res.statusText}`;
        continue; // try next model
      }
      const data: any = await res.json();
      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (content) {
        return { draftText: content, model: m, raw: data };
      } else {
        lastError = `200 but empty content for model ${m}`;
        continue;
      }
    } catch (e: any) {
      lastError = e?.message || String(e);
      continue;
    }
  }

  // All attempts failed → heuristic fallback with error message
  return {
    draftText: heuristicDraft(email, { verbosity: options?.verbosity, variant: options?.variant, regenerate: options?.regenerate, previousDraft: options?.previousDraft }),
    model: "heuristic",
    errorMessage: lastError || "LLM call failed",
  };
}

// Rewrite an existing draft into a shorter 3–4 sentence version
export async function rewriteDraftShort(email: Email, draft: string, options?: {
  model?: string;
  signal?: AbortSignal;
}): Promise<LLMResult> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const model = options?.model || DEFAULT_MODEL;
  if (!apiKey) {
    // Heuristic: take first sentences and compress
    const sentences = draft.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 4);
    const compressed = sentences.join(" ");
    return { draftText: compressed || draft, model: "heuristic" };
  }
  const system = "You are a helpful support assistant that can edit drafts.";
  const user = [
    "Rewrite the following support reply to be concise: 3–4 sentences maximum.",
    "Preserve empathy and commitments (ETA/next steps).",
    "Avoid bullet lists; keep it as short paragraphs.",
    "---",
    draft,
    "---",
  ].join("\n");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": APP_URL,
      "X-Title": APP_NAME,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      max_tokens: 300,
    }),
    signal: options?.signal,
  });

  if (!res.ok) {
    const sentences = draft.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 4);
    const compressed = sentences.join(" ");
    return { draftText: compressed || draft, model: `${model} (fallback:heuristic)` };
  }
  const data: any = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  return { draftText: content || draft, model, raw: data };
}
