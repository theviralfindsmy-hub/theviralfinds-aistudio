'use client';

import React, { useState } from 'react';
import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core';
import { CopilotPopup } from '@copilotkit/react-ui';
import { 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  ExternalLink,
  Bot,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

// Sample top affiliate items for shared state
const initialTrendingProducts = [
  { id: 'p1', name: 'Wireless Bluetooth Earbuds Pro', platform: 'Shopee MY', commission: '18%', sales: '14.2k', estEarnings: 'RM 12.50 / sale' },
  { id: 'p2', name: 'Smart AI Auto-Tracking Gimbal', platform: 'TikTok Shop', commission: '22%', sales: '8.9k', estEarnings: 'RM 28.00 / sale' },
  { id: 'p3', name: 'Ergonomic Memory Foam Seat Cushion', platform: 'Shopee MY', commission: '15%', sales: '23.1k', estEarnings: 'RM 9.80 / sale' },
];

export function CopilotAntigravityHub() {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [hitlApprovalState, setHitlApprovalState] = useState<{
    pending: boolean;
    campaignName?: string;
    commissionRate?: string;
    onApprove?: () => void;
    onReject?: () => void;
  }>({ pending: false });

  // 1. SHARED STATE: Expose current dashboard state and active affiliate portfolio to CopilotKit
  useCopilotReadable({
    description: "Active TheViralFindsMY Dashboard State, Affiliate Metrics, and Platform Telemetry",
    value: {
      platform: "TheViralFindsMY Shopee & TikTok Affiliate Pro",
      agent: "Google Antigravity Agent",
      currency: "MYR (RM)",
      monthlyRevenue: "RM 42,850.00",
      activeCommissionLinks: 84,
      conversionRate: "4.85%",
      trendingProducts: initialTrendingProducts,
      selectedProduct,
    },
  });

  // 2. FRONTEND TOOLS: Filter products by minimum commission
  useCopilotAction({
    name: "filterProductsByCommission",
    description: "Filters the affiliate trending products list by minimum commission percentage",
    parameters: [
      {
        name: "minCommissionPercent",
        type: "number",
        description: "Minimum commission percentage number (e.g. 15 for 15%)",
        required: true,
      },
    ],
    handler: async ({ minCommissionPercent }) => {
      toast.success(`Filter diaplikasikan: Komisen minima ${minCommissionPercent}%`);
      return `Berjaya menapis produk dengan komisen melebihi ${minCommissionPercent}%.`;
    },
  });

  // 3. FRONTEND TOOLS: Copy generated affiliate link to clipboard
  useCopilotAction({
    name: "copyAffiliateLink",
    description: "Copies a generated Shopee or TikTok affiliate shortlink to user clipboard",
    parameters: [
      {
        name: "productName",
        type: "string",
        description: "Name of the product",
        required: true,
      },
      {
        name: "affiliateUrl",
        type: "string",
        description: "The affiliate tracking URL",
        required: true,
      },
    ],
    handler: async ({ productName, affiliateUrl }) => {
      try {
        await navigator.clipboard.writeText(affiliateUrl);
        toast.success(`Link afiliasi untuk "${productName}" disalin ke clipboard!`);
        return `Link afiliasi untuk ${productName} telah berjaya disalin.`;
      } catch {
        return `Sila salin link secara manual: ${affiliateUrl}`;
      }
    },
  });

  // 4. GENERATIVE UI: Render interactive product card directly inside the Copilot chat stream
  useCopilotAction({
    name: "renderAffiliateProductCard",
    description: "Renders an interactive rich Generative UI card for a recommended viral affiliate product",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "Product title",
        required: true,
      },
      {
        name: "platform",
        type: "string",
        description: "E-commerce platform (e.g. Shopee MY, TikTok Shop)",
        required: true,
      },
      {
        name: "commissionRate",
        type: "string",
        description: "Commission rate (e.g. 20%)",
        required: true,
      },
      {
        name: "estimatedEarnings",
        type: "string",
        description: "Estimated earnings per unit (e.g. RM 25.00)",
        required: true,
      },
      {
        name: "affiliateLink",
        type: "string",
        description: "Shopee/TikTok tracking link",
        required: true,
      },
    ],
    render: ({ args, status }) => {
      return (
        <div className="my-3 p-4 rounded-xl border border-blue-500/30 bg-gradient-to-br from-slate-900/95 via-blue-950/40 to-slate-900/95 backdrop-blur-md shadow-xl text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {args.platform || "Shopee MY"}
            </span>
            <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <TrendingUp className="w-3 h-3 mr-1" />
              Komisen {args.commissionRate}
            </span>
          </div>
          <h4 className="font-medium text-sm text-slate-100 line-clamp-2 mb-2">
            {args.title}
          </h4>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3 bg-black/30 p-2 rounded-lg">
            <span>Anggaran Pendapatan:</span>
            <span className="font-bold text-amber-300">{args.estimatedEarnings}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (args.affiliateLink) {
                  navigator.clipboard.writeText(args.affiliateLink);
                  toast.success("Link afiliasi disalin!");
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all shadow-md active:scale-95"
            >
              <Copy className="w-3.5 h-3.5" />
              Salin Link Afiliasi
            </button>
            {args.affiliateLink && (
              <a
                href={args.affiliateLink}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Buka Produk"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          {status === "complete" && (
            <div className="mt-2 text-[10px] text-emerald-400/80 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Generative UI disahkan oleh Google Antigravity Agent
            </div>
          )}
        </div>
      );
    },
  });

  // 5. HUMAN-IN-THE-LOOP (HITL): High-impact action requiring human confirmation
  useCopilotAction({
    name: "launchAutoAffiliateCampaign",
    description: "Requires human approval before deploying automated affiliate broadcast links",
    parameters: [
      {
        name: "campaignName",
        type: "string",
        description: "Title of the viral campaign",
        required: true,
      },
      {
        name: "targetPlatform",
        type: "string",
        description: "Target platform (Shopee, TikTok, Telegram, Facebook)",
        required: true,
      },
      {
        name: "expectedSpendBudget",
        type: "string",
        description: "Campaign ad budget or spend allowance in MYR",
        required: true,
      },
    ],
    render: ({ args, status, handler }) => {
      const [decision, setDecision] = useState<"pending" | "approved" | "rejected">("pending");

      if (decision === "approved") {
        return (
          <div className="my-2 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Kempen <b>{args.campaignName}</b> diluluskan oleh Admin (HITL Passed).</span>
          </div>
        );
      }

      if (decision === "rejected") {
        return (
          <div className="my-2 p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Kempen <b>{args.campaignName}</b> dibatalkan oleh Admin.</span>
          </div>
        );
      }

      return (
        <div className="my-3 p-4 rounded-xl border-2 border-amber-500/50 bg-amber-950/20 backdrop-blur-md shadow-lg text-white">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-2">
            <AlertTriangle className="w-4 h-4" />
            PENGESAHAN ADMIN DIPERLUKAN (Human In The Loop)
          </div>
          <p className="text-xs text-slate-300 mb-2">
            Antigravity Agent ingin melancarkan kempen penyiaran afiliasi:
          </p>
          <div className="bg-black/40 p-2.5 rounded-lg text-xs space-y-1 text-slate-200 mb-3 border border-amber-500/20">
            <div><b>Nama Kempen:</b> {args.campaignName}</div>
            <div><b>Platform:</b> {args.targetPlatform}</div>
            <div><b>Bajet Diperlukan:</b> {args.expectedSpendBudget}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setDecision("approved");
                toast.success(`Kempen "${args.campaignName}" diluluskan!`);
                handler({ approved: true });
              }}
              className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-all shadow-sm active:scale-95"
            >
              Luluskan Kempen (Approve)
            </button>
            <button
              onClick={() => {
                setDecision("rejected");
                toast.error("Kempen ditolak.");
                handler({ approved: false });
              }}
              className="py-1.5 px-3 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-xs font-semibold text-white transition-all shadow-sm active:scale-95"
            >
              Tolak
            </button>
          </div>
        </div>
      );
    },
  });

  return (
    <>
      {/* 6. HEADLESS UI: Floating Accessible HUD Quick Action bar */}
      <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 p-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs text-slate-200">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-sm">
          <Bot className="w-3.5 h-3.5 animate-pulse text-amber-300" />
          <span>Antigravity AI</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 px-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            NVIDIA NIM (70B)
          </span>
          <span className="text-slate-600">•</span>
          <span>AG-UI Stream: Active</span>
          <span className="text-slate-600">•</span>
          <span>HITL: Ready</span>
        </div>
      </div>

      {/* 7. CHAT POPUP: Integrated Copilot Popup UI */}
      <CopilotPopup
        instructions={
          "Anda adalah Google Antigravity Agent, pembantu AI rasmi untuk TheViralFindsMY (TVF). Anda pakar dalam affiliate marketing Shopee MY dan TikTok Shop Malaysia, analisa komisen, produk viral, dan kempen automasi. Sentiasa berikan jawapan dalam Bahasa Melayu yang padat, direct, dan praktikal."
        }
        labels={{
          title: "Google Antigravity Agent",
          initial: "Salam! Saya Google Antigravity Agent untuk TheViralFindsMY. Ada produk viral Shopee/TikTok yang anda ingin saya analisa atau jana link komisen?",
          placeholder: "Tanya tentang produk viral, semak komisen, atau jana kempen...",
        }}
        defaultOpen={false}
        clickOutsideToClose={true}
      />
    </>
  );
}
