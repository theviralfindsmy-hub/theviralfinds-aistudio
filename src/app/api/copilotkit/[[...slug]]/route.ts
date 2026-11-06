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

// Helper to safely load credentials from environment or local development fallback without hardcoded paths
function getCredential(key: string): string | undefined {
  if (process.env[key]) return process.env[key];

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

// 1. Resolve API keys from Hermes Agent (.hermes/.env) and environment
const nvidiaKey = getCredential("NVIDIA_API_KEY");
const openrouterKey = getCredential("OPENROUTER_API_KEY");
const opencodeZenKey = getCredential("OPENCODE_ZEN_API_KEY") || getCredential("OPENCODE_API_KEY");
const genericOpenaiKey = getCredential("OPENAI_API_KEY");

// 2. Configure Smartest Free Model Cascade (NVIDIA NIM -> OpenRouter -> Kilo/OpenCode Zen)
// NVIDIA NIM smart free models: deepseek-ai/deepseek-v4.1-flash, minimaxai/minimax-m3.1-flash
// OpenRouter smart free models: deepseek/deepseek-r1:free, deepseek/deepseek-chat:free
// Kilo / OpenCode Zen free models: nemotron-3-ultra-free (1M context), x-preview-f-free
let activeBaseUrl = "https://integrate.api.nvidia.com/v1";
let activeApiKey = nvidiaKey || openrouterKey || opencodeZenKey || genericOpenaiKey;
let activeModel = "deepseek-ai/deepseek-v4.1-flash";

if (nvidiaKey) {
  activeBaseUrl = "https://integrate.api.nvidia.com/v1";
  activeApiKey = nvidiaKey;
  activeModel = "deepseek-ai/deepseek-v4.1-flash";
} else if (openrouterKey) {
  activeBaseUrl = "https://openrouter.ai/api/v1";
  activeApiKey = openrouterKey;
  activeModel = "deepseek/deepseek-r1:free";
} else if (opencodeZenKey) {
  activeBaseUrl = getCredential("OPENCODE_ZEN_BASE_URL") || "https://opencode.ai/zen/v1";
  activeApiKey = opencodeZenKey;
  activeModel = "nemotron-3-ultra-free";
} else if (genericOpenaiKey) {
  activeBaseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  activeApiKey = genericOpenaiKey;
  activeModel = "gpt-4o-mini";
}

// Sync process environment for internal SDK routing
if (activeApiKey) {
  process.env.OPENAI_API_KEY = activeApiKey;
  process.env.OPENAI_BASE_URL = activeBaseUrl;
}

// OpenAI client instance configured for the active smart free provider
export const smartOpenAiClient = new OpenAI({
  apiKey: activeApiKey || "dummy-key-for-local-init",
  baseURL: activeBaseUrl,
});

// Configure Google Antigravity Agent and specialized agent profiles
const antigravityAgent = new BuiltInAgent({
  model: activeModel,
});

const deepseekAgent = new BuiltInAgent({
  model: nvidiaKey ? "deepseek-ai/deepseek-v4.1-flash" : "deepseek/deepseek-r1:free",
});

const minimaxAgent = new BuiltInAgent({
  model: nvidiaKey ? "minimaxai/minimax-m3.1-flash" : "deepseek/deepseek-chat:free",
});

const kiloAgent = new BuiltInAgent({
  model: opencodeZenKey ? "nemotron-3-ultra-free" : activeModel,
});

// Optional CopilotKit Intelligence platform connection
const cpkIntelligenceKey = getCredential("CPK_INTELLIGENCE_API_KEY");
const intelligence = cpkIntelligenceKey
  ? new CopilotKitIntelligence({
      apiKey: cpkIntelligenceKey,
    })
  : undefined;

// Create CopilotRuntime with registered smart agents
const runtime = new CopilotRuntime({
  agents: {
    default: antigravityAgent,
    antigravity: antigravityAgent,
    deepseek: deepseekAgent,
    minimax: minimaxAgent,
    kilo: kiloAgent,
  },
  intelligence,
  threads: {
    access: "open",
  },
  identifyUser: async () => ({
    id: "theviralfinds_sovereign_user",
    name: "TheViralFinds Sovereign Admin",
    email: "theviralfinds.my@gmail.com",
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
