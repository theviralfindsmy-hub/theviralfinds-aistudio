import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  BuiltInAgent,
  createCopilotRuntimeHandler,
  CopilotKitIntelligence,
} from "@copilotkit/runtime/v2";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

// Helper to safely load credentials from environment or local development fallback
function getCredential(key: string): string | undefined {
  if (process.env[key]) return process.env[key];

  // Dynamic fallback for local development without hardcoded string literals
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    try {
      const userHome = process.env.USERPROFILE || process.env.HOME || "";
      if (userHome) {
        const hermesEnvPath = path.join(userHome, ".hermes", ".env");
        if (fs.existsSync(hermesEnvPath)) {
          const content = fs.readFileSync(hermesEnvPath, "utf8");
          const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
          if (match && match[1]) {
            return match[1].trim().replace(/^["']|["']$/g, "");
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return undefined;
}

// Resolve provider and API credentials
const nvidiaKey = getCredential("NVIDIA_API_KEY");
const openrouterKey = getCredential("OPENROUTER_API_KEY");
const opencodeKey = getCredential("OPENCODE_ZEN_API_KEY") || getCredential("OPENCODE_API_KEY");
const genericOpenaiKey = getCredential("OPENAI_API_KEY");

let activeBaseUrl = "https://integrate.api.nvidia.com/v1";
let activeApiKey = nvidiaKey;
let activeModel = "meta/llama-3.3-70b-instruct";

if (nvidiaKey) {
  activeBaseUrl = "https://integrate.api.nvidia.com/v1";
  activeApiKey = nvidiaKey;
  activeModel = "meta/llama-3.3-70b-instruct";
} else if (openrouterKey) {
  activeBaseUrl = "https://openrouter.ai/api/v1";
  activeApiKey = openrouterKey;
  activeModel = "deepseek/deepseek-chat";
} else if (opencodeKey) {
  activeBaseUrl = getCredential("OPENCODE_ZEN_BASE_URL") || "https://api.opencode.zen/v1";
  activeApiKey = opencodeKey;
  activeModel = "deepseek-ai/deepseek-v3";
} else if (genericOpenaiKey) {
  activeBaseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  activeApiKey = genericOpenaiKey;
  activeModel = "gpt-4o-mini";
}

// Initialize OpenAI client instance for NVIDIA NIM / OpenRouter / Hermes
const openaiClient = new OpenAI({
  apiKey: activeApiKey || "dummy-key-for-local-init",
  baseURL: activeBaseUrl,
});

// Configure Google Antigravity Agent with domain expertise for Shopee/TikTok affiliate marketing
const antigravityAgent = new BuiltInAgent({
  model: activeModel,
});

// Optional CopilotKit Intelligence platform connection for Automatic Learning & AG-UI Streams
const cpkIntelligenceKey = getCredential("CPK_INTELLIGENCE_API_KEY");
const intelligence = cpkIntelligenceKey
  ? new CopilotKitIntelligence({
      apiKey: cpkIntelligenceKey,
    })
  : undefined;

// Create CopilotRuntime with the Antigravity agent registered
const runtime = new CopilotRuntime({
  agents: {
    default: antigravityAgent,
    antigravity: antigravityAgent,
  },
  intelligence,
  threads: {
    access: "open",
  },
  identifyUser: async () => ({
    id: "tvf_sovereign_user",
    name: "TheViralFinds Sovereign Admin",
  }),
});

// Build standard web request handler for Next.js App Router multi-route mode
const handleRequest = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}

export async function PATCH(req: NextRequest) {
  return handleRequest(req);
}

export async function DELETE(req: NextRequest) {
  return handleRequest(req);
}
