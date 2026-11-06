<p align="center">
  <img src="https://img.shields.io/badge/version-8.1-ee4d2d?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Shopee_Affiliate-Official-ee4d2d?style=for-the-badge" alt="Shopee" />
  <img src="https://img.shields.io/badge/TikTok_Shop-API-000000?style=for-the-badge&logo=tiktok" alt="TikTok" />
  <img src="https://img.shields.io/badge/Lazada_Affiliate-API-0F146D?style=for-the-badge" alt="Lazada" />
  <img src="https://img.shields.io/badge/HERMES_AI-Agent-8b5cf6?style=for-the-badge" alt="Hermes" />
  <img src="https://img.shields.io/badge/PWA-Ready-5C2D91?style=for-the-badge" alt="PWA" />
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge" alt="License" />
</p>

<h1 align="center">⚡ TheViralFindsMY</h1>

<h3 align="center">AI-Powered Multi-Platform Affiliate Manager for the Malaysian Market</h3>

<p align="center">
  <em>Discover. Promote. Earn. — Multi-Platform + AI Supercharged with HERMES Intelligence 🇲🇾</em>
</p>

<p align="center">
  <a href="https://github.com/thisisniagahub/theviralfinds.my.git">Repository</a> ·
  <a href="#getting-started">Quick Start</a> ·
  <a href="#api-reference">API Reference</a> ·
  <a href="#database-schema">Database Schema</a> ·
  <a href="#design-system">Design System</a>
</p>

---

## 📑 Table of Contents

- [Overview](#overview)
- [Competitive Landscape](#competitive-landscape)
- [Key Features at a Glance](#key-features-at-a-glance)
- [Architecture](#architecture)
  - [High-Level Architecture](#high-level-architecture)
  - [Data Flow](#data-flow)
  - [Design Principles](#design-principles)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Feature Modules (5 Fasas)](#feature-modules-5-fasas)
  - [Fasa 1 — Core Platform](#fasa-1--core-platform)
    - [1. Dashboard & Analytics](#1-dashboard--analytics)
    - [2. Product Discovery & Affiliate Links](#2-product-discovery--affiliate-links)
    - [3. Social Media Auto-Post](#3-social-media-auto-post)
    - [4. AI Content Generator](#4-ai-content-generator)
    - [5. Trend & Competitor Spy](#5-trend--competitor-spy)
    - [6. Profit Optimizer](#6-profit-optimizer)
    - [7. Content Studio (Mobile Creator)](#7-content-studio-mobile-creator)
    - [8. HERMES AI Hub](#8-hermes-ai-hub)
    - [9. Earnings & Payouts](#9-earnings--payouts)
    - [10. Gamification](#10-gamification)
    - [11. Login & Registration](#11-login--registration)
    - [12. Settings & Notifications](#12-settings--notifications)
  - [Fasa 2 — Multi-Platform Expansion](#fasa-2--multi-platform-expansion)
    - [13. TikTok Shop Integration](#13-tiktok-shop-integration)
    - [14. Lazada Integration](#14-lazada-integration)
    - [15. Shopee Live Dashboard](#15-shopee-live-dashboard)
    - [16. Multi-Platform Compare](#16-multi-platform-compare)
    - [17. Unified Earnings Dashboard](#17-unified-earnings-dashboard)
    - [18. Cross-Platform Product Matcher](#18-cross-platform-product-matcher)
  - [Fasa 3 — AI Superpowers](#fasa-3--ai-superpowers)
    - [19. AI Product Recommender](#19-ai-product-recommender)
    - [20. AI Video Thumbnails](#20-ai-video-thumbnails)
    - [21. Smart Commission XTRA Alerts](#21-smart-commission-xtra-alerts)
    - [22. A/B Content Testing](#22-ab-content-testing)
    - [23. AI Audience Analyzer](#23-ai-audience-analyzer)
    - [24. Hashtag AI Optimizer](#24-hashtag-ai-optimizer)
    - [25. AI Content Calendar](#25-ai-content-calendar)
  - [Fasa 4 — Monetize & Scale](#fasa-4--monetize--scale)
    - [26. Pricing & Subscription](#26-pricing--subscription)
    - [27. Affiliate Marketplace](#27-affiliate-marketplace)
    - [28. Team Dashboard](#28-team-dashboard)
    - [29. White-Label](#29-white-label)
    - [30. API Keys & Developer Access](#30-api-keys--developer-access)
  - [Fasa 5 — Shopee Pro](#fasa-5--shopee-pro)
    - [31. Market Intelligence](#31-market-intelligence)
    - [32. Account Health Monitor](#32-account-health-monitor)
    - [33. Promotion Hub](#33-promotion-hub)
    - [34. Shopee Ads Dashboard](#34-shopee-ads-dashboard)
    - [35. Seller Chat](#35-seller-chat)
- [Landing Page](#landing-page)
- [Multi-Platform Integration](#multi-platform-integration)
  - [Shopee API Integration](#shopee-api-integration)
  - [TikTok Shop Integration](#tiktok-shop-integration)
  - [Lazada Integration](#lazada-integration)
  - [Real-Time Notifications (Socket.io)](#real-time-notifications-socketio)
- [HERMES AI Agent](#hermes-ai-agent)
  - [Capabilities](#capabilities)
  - [Architecture](#architecture-1)
  - [Pre-built Skills](#pre-built-skills)
  - [Manglish Personality](#manglish-personality)
- [API Reference (80+ Routes)](#api-reference-80-routes)
  - [Authentication](#authentication)
  - [Core](#core)
  - [Products](#products)
  - [Profit & Earnings](#profit--earnings)
  - [Content & Studio](#content--studio)
  - [AI Routes](#ai-routes)
  - [Social & Auto-Post](#social--auto-post)
  - [Hermes AI](#hermes-ai)
  - [Shopee Pro (15+ routes)](#shopee-pro-15-routes)
  - [TikTok Shop](#tiktok-shop)
  - [Lazada](#lazada)
  - [Shopee Live](#shopee-live)
  - [Pricing & Subscription](#pricing--subscription)
  - [A/B Testing](#ab-testing)
  - [Trends](#trends)
  - [Team](#team)
  - [Marketplace](#marketplace)
  - [White-Label](#white-label)
  - [API Keys](#api-keys)
  - [Alerts](#alerts)
  - [Notifications](#notifications)
  - [Export](#export)
  - [System](#system)
- [Database Schema (19+ Models)](#database-schema-19-models)
  - [Entity-Relationship Diagram](#entity-relationship-diagram)
  - [Core Models](#core-models)
  - [HERMES AI Models](#hermes-ai-models)
  - [Social & Content Models](#social--content-models)
  - [Auth Models (NextAuth)](#auth-models-nextauth)
  - [Enums](#enums)
- [Design System](#design-system)
  - [Minimalist Brutalism Philosophy](#minimalist-brutalism-philosophy)
  - [Color System (OKLCH)](#color-system-oklch)
  - [Custom Animations](#custom-animations)
  - [Glass Morphism](#glass-morphism)
  - [Glow Shadows](#glow-shadows)
  - [Brutalist Card Hovers](#brutalist-card-hovers)
  - [Animated Gradient Borders](#animated-gradient-borders)
  - [Mobile / PWA Styling](#mobile--pwa-styling)
  - [Accessibility](#accessibility)
- [Pricing Tiers (RM)](#pricing-tiers-rm)
- [Malaysian Market Focus](#malaysian-market-focus)
- [PWA & Offline Support](#pwa--offline-support)
- [Improvement Roadmap](#improvement-roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**TheViralFindsMY (TVF)** is a comprehensive, production-ready multi-platform affiliate management platform built specifically for the Malaysian market. It combines real-time product discovery, AI-powered content creation, intelligent automation, and deep analytics into a single, unified dashboard.

The platform is designed to help Malaysian affiliates maximize their earnings through:

- 🎯 **Smart product discovery** with AI scoring and Commission XTRA detection
- 🤖 **Automated content creation** in Manglish, Bahasa Malaysia, and English
- 📱 **Social media scheduling** optimized for Malaysian peak engagement times
- 📈 **Trend monitoring** with competitor intelligence and keyword tracking
- 🧠 **HERMES AI Agent** for conversational insights, task automation, and skill management with Manglish personality
- 🛒 **Multi-platform support** — Shopee, TikTok Shop, Lazada, Shopee Live in one dashboard
- 💰 **AI Superpowers** — Product Recommender, Thumbnails, A/B Testing, Audience AI, Hashtag AI, Calendar AI
- 🏢 **Monetize & Scale** — Pricing tiers, Marketplace, Team Dashboard, White-Label, API Keys
- 📊 **Shopee Pro** — Market Intelligence, Account Health, Promotion Hub, Shopee Ads, Seller Chat

> **Target Market:** Malaysia (RM currency, Shopee Malaysia, Malaysian consumer behavior)
> **Language Support:** English, Bahasa Malaysia, Manglish (Malaysian English)
> **Version:** 8.1
> **Repository:** [https://github.com/thisisniagahub/theviralfinds.my.git](https://github.com/thisisniagahub/theviralfinds.my.git)

---

## Competitive Landscape

> **Key Finding:** NO existing platform combines Shopee-specific integration + AI content creation + Malaysian market optimization + multi-platform support. TheViralFindsMY has first-mover advantage.

| Competitor | Shopee | AI Content | Multi-Platform | MY Market | All-in-One | HERMES AI |
|-----------|--------|-----------|----------------|-----------|------------|-----------|
| **TheViralFindsMY** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Shopee Official Dashboard | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Involve Asia | ❌ | ❌ | Partial | Partial | ❌ | ❌ |
| ShopBack | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Hootsuite | ❌ | Partial | ✅ | ❌ | ❌ | ❌ |
| Blaze.ai | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| ContentGenerator.io | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| ShopReel AI | ❌ | ✅ | TikTok only | ❌ | ❌ | ❌ |
| Affilimate | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Our Unique Advantages:**
1. 🇲🇾 **Malaysian-First** — Only tool 100% focused on Malaysian market (RM, Manglish, peak times, seasonal events)
2. 🤖 **AI-Native** — Not "add AI" but built AI-first from ground up (content gen, scoring, insights, HERMES)
3. 🗣️ **Manglish/BM Content** — No other tool generates content in Malaysian languages
4. 📊 **Profit Scoring** — Proprietary 0-100 scoring algorithm for product profitability
5. 🎮 **Gamified** — Achievements + leaderboard motivate consistent engagement
6. 🧠 **HERMES Memory** — AI that remembers preferences and proactively suggests
7. 🛒 **Multi-Platform** — Shopee, TikTok Shop, Lazada, Shopee Live all in one dashboard
8. 🏪 **Shopee Pro** — Deep seller tools: Market Intel, Account Health, Ads, Promotions, Seller Chat

---

## Key Features at a Glance

| # | Feature | Description | Phase | Badge |
|---|---------|-------------|-------|-------|
| 1 | **Dashboard** | Real-time stats, earnings trends, top products, activity feed | Fasa 1 | `Core` |
| 2 | **Product Discovery** | Search Shopee products, generate affiliate links, track commissions | Fasa 1 | `Core` |
| 3 | **Affiliate Links** | Create, manage, and track short affiliate links with click analytics | Fasa 1 | `Core` |
| 4 | **Analytics** | Click/conversion charts, country/device breakdowns, period comparisons | Fasa 1 | `Core` |
| 5 | **Commission Calculator** | Project earnings with same-shop/different-shop models, break-even analysis | Fasa 1 | `Core` |
| 6 | **Campaigns** | Organize links into campaigns with budgets and date ranges | Fasa 1 | `Core` |
| 7 | **Earnings & Payouts** | Track commissions, payout history, earning goals | Fasa 1 | `Core` |
| 8 | **Social Media Auto-Post** | Schedule posts to TikTok, IG, FB, YouTube, Twitter/X with AI captions | Fasa 1 | `NEW` |
| 9 | **AI Content Generator** | Video scripts, captions, hashtags, Shopee Live scripts in Manglish/BM | Fasa 1 | `AI` |
| 10 | **Trend Spy** | Trending products, keyword discovery, competitor analysis, seasonal alerts | Fasa 1 | `NEW` |
| 11 | **Profit Optimizer** | AI product scoring (0-100), Commission XTRA finder, earnings calculator | Fasa 1 | `AI` |
| 12 | **Content Studio** | Video script templates, TTS voiceover, timed captions, SRT export | Fasa 1 | `NEW` |
| 13 | **HERMES AI Hub** | Conversational AI, skills, tasks, insights, memory, automation | Fasa 1 | `AI` |
| 14 | **Achievements** | Badge system for milestones and earning goals | Fasa 1 | `Gamification` |
| 15 | **Leaderboard** | Affiliate ranking with period comparisons | Fasa 1 | `Gamification` |
| 16 | **Referrals** | Referral program management and tracking | Fasa 1 | `Gamification` |
| 17 | **Notifications** | Real-time alerts for conversions, commissions, and system events | Fasa 1 | `System` |
| 18 | **Settings** | Shopee API credentials, app preferences, connection management | Fasa 1 | `System` |
| 19 | **Login / Register** | NextAuth.js authentication with credentials provider | Fasa 1 | `Auth` |
| 20 | **TikTok Shop** | TikTok Shop affiliate product search, link generation, commission tracking | Fasa 2 | `Platform` |
| 21 | **Lazada** | Lazada affiliate product search, link generation, commission tracking | Fasa 2 | `Platform` |
| 22 | **Shopee Live** | Live streaming dashboard, session management, script generation | Fasa 2 | `Platform` |
| 23 | **Multi-Platform Compare** | Side-by-side commission comparison across Shopee/TikTok/Lazada | Fasa 2 | `Platform` |
| 24 | **Unified Earnings** | Aggregated earnings dashboard across all platforms | Fasa 2 | `Platform` |
| 25 | **Product Matcher** | Cross-platform product matching to find best commission rates | Fasa 2 | `Platform` |
| 26 | **AI Recommender** | Audience-based product recommendation engine | Fasa 3 | `AI` |
| 27 | **AI Thumbnails** | Video thumbnail generation with templates and branding | Fasa 3 | `AI` |
| 28 | **Commission XTRA Alerts** | Smart alerts for Commission XTRA opportunities | Fasa 3 | `AI` |
| 29 | **A/B Content Testing** | Generate 3 content variants and track performance | Fasa 3 | `AI` |
| 30 | **Audience AI** | AI-powered audience demographic and behavior analysis | Fasa 3 | `AI` |
| 31 | **Hashtag AI** | AI-powered hashtag scoring and optimization | Fasa 3 | `AI` |
| 32 | **AI Calendar** | AI-generated content calendar with Malaysian seasonal events | Fasa 3 | `AI` |
| 33 | **Pricing** | Subscription management with 4 tiers (Free/Pro/Business/Enterprise) | Fasa 4 | `Monetize` |
| 34 | **Marketplace** | Affiliate content marketplace for buying/selling templates | Fasa 4 | `Monetize` |
| 35 | **Team Dashboard** | Multi-user team management with shared analytics | Fasa 4 | `Scale` |
| 36 | **White-Label** | Custom branding and domain for enterprise clients | Fasa 4 | `Scale` |
| 37 | **API Keys** | Developer API access with usage tracking and playground | Fasa 4 | `Scale` |
| 38 | **Market Intelligence** | Deep Shopee market analysis: category distribution, trending, scoring | Fasa 5 | `Shopee Pro` |
| 39 | **Account Health** | Shopee account health monitoring with penalty tracking | Fasa 5 | `Shopee Pro` |
| 40 | **Promotion Hub** | Flash sales, vouchers, discounts, bundle deals, add-on deals | Fasa 5 | `Shopee Pro` |
| 41 | **Shopee Ads** | Campaign management, keyword bidding, budget optimization | Fasa 5 | `Shopee Pro` |
| 42 | **Seller Chat** | Buyer conversation management with AI suggested replies | Fasa 5 | `Shopee Pro` |
| 43 | **Landing Page** | Bima.framer.media-inspired 12-section marketing page | Landing | `Marketing` |

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser / PWA)                         │
│                                                                         │
│  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Zustand 5 │  │ TanStack │  │ Recharts │  │ Framer   │  │ Socket │ │
│  │ Store     │  │ Query 5  │  │ 2.15     │  │ Motion   │  │ .io    │ │
│  │ (Routing  │  │ (Server  │  │ (Charts) │  │ 12 (Ani- │  │ (Real- │ │
│  │  +State)  │  │  State)  │  │          │  │  mation) │  │  time) │ │
│  └─────┬─────┘  └────┬─────┘  └──────────┘  └──────────┘  └───┬────┘ │
│        │              │                                         │      │
│  ┌─────▼──────────────▼─────────────────────────────────────────▼───┐  │
│  │              shadcn/ui Component Library (New York Style)        │  │
│  │     (55+ components: Cards, Dialogs, Tables, Charts, Forms...)  │  │
│  └─────────────────────────┬───────────────────────────────────────┘  │
└────────────────────────────┼──────────────────────────────────────────┘
                             │ fetch() / WebSocket
┌────────────────────────────▼──────────────────────────────────────────┐
│                      Next.js 16 API Routes (80+)                      │
│                                                                       │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐   │
│  │ /api/    │ │/api/     │ │/api/   │ │/api/   │ │/api/         │   │
│  │ shopee/* │ │ hermes/* │ │trends/*│ │content/*│ │ai/*          │   │
│  │ (15+     │ │ (7)      │ │ (3)    │ │ (3)    │ │recommend,    │   │
│  │  routes) │ │          │ │        │ │        │ │hashtags,     │   │
│  │          │ │          │ │        │ │        │ │audience,     │   │
│  │          │ │          │ │        │ │        │ │thumbnail,    │   │
│  │          │ │          │ │        │ │        │ │calendar      │   │
│  └────┬─────┘ └────┬─────┘ └───┬────┘ └───┬────┘ └──────┬───────┘   │
│       │            │           │          │             │            │
│  ┌────▼────────────▼───────────▼──────────▼─────────────▼────────┐   │
│  │ ┌───────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ │   │
│  │ │/api/      │ │/api/tiktok/* │ │/api/lazada/* │ │/api/     │ │   │
│  │ │social/*   │ │ (4 routes)   │ │ (4 routes)   │ │live/*    │ │   │
│  │ │(7 routes) │ │              │ │              │ │(4 routes)│ │   │
│  │ └───────────┘ └──────────────┘ └──────────────┘ └──────────┘ │   │
│  │ ┌───────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ │   │
│  │ │/api/      │ │/api/team/*   │ │/api/apikeys/*│ │/api/     │ │   │
│  │ │pricing/*  │ │ (4 routes)   │ │ (5 routes)   │ │export/*  │ │   │
│  │ │(5 routes) │ │              │ │              │ │(2 routes)│ │   │
│  │ └───────────┘ └──────────────┘ └──────────────┘ └──────────┘ │   │
│  │ ┌───────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ │   │
│  │ │/api/      │ │/api/         │ │/api/         │ │/api/     │ │   │
│  │ │marketplace│ │whitelabel/*  │ │abtesting/*   │ │alerts/*  │ │   │
│  │ │(4 routes) │ │ (2 routes)   │ │ (2 routes)   │ │(2 routes)│ │   │
│  │ └───────────┘ └──────────────┘ └──────────────┘ └──────────┘ │   │
│  └───────────────────────────────────────────────────────────────┘   │
│       │            │           │          │             │            │
│  ┌────▼────────────▼───────────▼──────────▼─────────────▼────────┐   │
│  │              z-ai-web-dev-sdk (AI Engine)                      │   │
│  │     LLM Chat | Web Search | TTS | Image Generation | VLM     │   │
│  └───────────────────────────────────────────────────────────────┘   │
│       │                                                            │
│  ┌────▼─────────────────────────────────────────────────────────────┐│
│  │              Prisma 6 ORM (SQLite)                               ││
│  │     19+ Models: User, AffiliateLink, Campaign, Conversion...    ││
│  └─────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
         │                    │                        │
    ┌────▼────┐        ┌─────▼──────┐          ┌──────▼──────┐
    │ Shopee  │        │  Socket.io │          │   SQLite    │
    │ GraphQL │        │  Mini-     │          │  Database   │
    │ + Open  │        │  Service   │          │ (db/*.db)   │
    │ API v2  │        │  (:3003/4) │          │             │
    └─────────┘        └────────────┘          └─────────────┘
```

### Data Flow

```
┌──────────────┐     Credentials     ┌──────────────┐
│  User Input  │ ──────────────────► │  AppSetting  │
│  (Settings)  │                     │  (Database)  │
└──────────────┘                     └──────┬───────┘
                                            │
                              ┌──────────────▼──────────────┐
                              │    ShopeeAffiliateService    │
                              │                              │
                              │  if credentials valid:       │
                              │    → ShopeeGraphQLClient     │
                              │       + ShopeeOpenAPIClient  │
                              │  else:                       │
                              │    → ShopeeMockService       │
                              │       + OpenAPIMockService   │
                              └──────────────┬───────────────┘
                                             │
                              ┌──────────────▼───────────────┐
                              │   Unified Response Format    │
                              │   source: "graphql_api" |    │
                              │            "open_api" |      │
                              │            "mock"            │
                              └──────────────────────────────┘
```

### Design Principles

1. **Dual Data Source** — Every Shopee API call gracefully falls back to realistic mock data when API access is unavailable. Every response includes a `source` field.
2. **AI-First** — All content generation, analysis, and insights use z-ai-web-dev-sdk with algorithmic fallbacks
3. **Demo-Ready** — The app is fully functional with demo data out of the box — no external accounts needed
4. **Malaysian-Optimized** — Currency, language, peak times, seasonal events, and consumer behavior tuned for Malaysia
5. **Client-Side Routing** — Single-page app using Zustand store for navigation (not Next.js file-based routing). 35+ pages lazy-loaded as React components.
6. **Real-Time** — Socket.io mini-service for live notifications and updates
7. **PWA-Ready** — Service worker, offline support, installable on mobile devices

---

## Tech Stack

### Core Framework

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16 | React framework with App Router |
| **TypeScript** | 5 | Type-safe JavaScript |
| **React** | 19 | UI library |

### UI & Styling

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Tailwind CSS** | 4 | Utility-first CSS framework |
| **shadcn/ui** | Latest | 55+ pre-built UI components (New York style) |
| **Radix UI** | Latest | Headless UI primitives (Dialog, Popover, Tabs, etc.) |
| **Lucide React** | Latest | Icon library |
| **Framer Motion** | 12 | Animations, transitions, scroll-triggered effects |
| **Recharts** | 2.15 | Data visualization charts |
| **next-themes** | 0.4 | Dark/light mode support |
| **cmdk** | 1 | Command palette (⌘K) |

### State & Data

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Zustand** | 5 | Client-side state management + SPA routing |
| **TanStack Query** | 5 | Server state management & caching |
| **TanStack Table** | 8 | Advanced data tables |
| **React Hook Form** | 7 | Form handling with Zod validation |

### Backend & Database

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Prisma** | 6 | ORM with SQLite |
| **z-ai-web-dev-sdk** | 0.0.18 | AI capabilities (LLM, TTS, Web Search, VLM, Image Gen) |
| **NextAuth.js** | 4 | Authentication (credentials + OAuth) |
| **Socket.io** | Latest | Real-time notifications (mini-service) |

### Utilities

| Technology | Version | Purpose |
|-----------|---------|---------|
| **date-fns** | 4 | Date manipulation |
| **uuid** | 11 | Unique ID generation |
| **sonner** | 2 | Toast notifications |
| **vaul** | 1 | Drawer component |
| **Zod** | Latest | Schema validation |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **Bun** (recommended) or npm
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/thisisniagahub/theviralfinds.my.git
cd theviralfinds.my

# Install dependencies
bun install

# Set up the database
bun run db:push

# Start the development server
bun run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="file:./db/custom.db"

# (Optional) Shopee Affiliate API
# SHOPEE_APP_ID=your_app_id
# SHOPEE_SECRET=your_secret
# SHOPEE_REGION=my

# (Optional) NextAuth
# NEXTAUTH_SECRET=your_secret
# NEXTAUTH_URL=http://localhost:3000
```

> **Note:** The app works fully in demo mode without any API credentials. All Shopee, TikTok, and Lazada features use realistic Malaysian market mock data.

### Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server on port 3000 |
| `bun run build` | Build for production |
| `bun run lint` | Run ESLint checks |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run database migrations |
| `bun run db:reset` | Reset database with fresh schema |

---

## Project Structure

```
theviralfindsmy/
├── prisma/
│   └── schema.prisma              # 19+ Prisma models
├── db/
│   └── custom.db                  # SQLite database
├── src/
│   ├── app/
│   │   ├── page.tsx               # Main SPA entry (landing + all 35+ pages)
│   │   ├── layout.tsx             # Root layout with providers
│   │   ├── error.tsx              # Error boundary
│   │   ├── globals.css            # Global styles + Minimalist Brutalism theme
│   │   └── api/                   # 80+ API route handlers
│   │       ├── auth/              # Authentication routes (4)
│   │       ├── dashboard/         # Dashboard data
│   │       ├── analytics/         # Analytics data
│   │       ├── earnings/          # Earnings + unified (2)
│   │       ├── links/             # Link CRUD
│   │       ├── campaigns/         # Campaign CRUD
│   │       ├── notifications/     # Notifications
│   │       ├── products/search/   # AI product search
│   │       ├── shopee/            # 15+ Shopee-specific routes
│   │       ├── hermes/            # 7 Hermes AI routes
│   │       ├── trends/            # 3 Trend Spy routes
│   │       ├── content/           # 3 Content generation routes
│   │       ├── autopost/          # 3 Auto-post routes
│   │       ├── studio/            # 3 Studio routes
│   │       ├── profit/            # 3 Profit optimizer routes
│   │       ├── ai/                # 5 AI routes (recommend, hashtags, audience, thumbnail, calendar)
│   │       ├── social/            # 7 Social media routes
│   │       ├── tiktok/            # 4 TikTok Shop routes
│   │       ├── lazada/            # 4 Lazada routes
│   │       ├── live/              # 4 Shopee Live routes
│   │       ├── compare/           # Multi-platform comparison
│   │       ├── match/             # Product matcher
│   │       ├── pricing/           # 5 Pricing routes
│   │       ├── marketplace/       # 4 Marketplace routes
│   │       ├── team/              # 4 Team routes
│   │       ├── whitelabel/        # 2 White-label routes
│   │       ├── apikeys/           # 5 API key routes
│   │       ├── abtesting/         # 2 A/B testing routes
│   │       ├── alerts/            # 2 Alert routes
│   │       ├── export/            # 2 Export routes (CSV, PDF)
│   │       ├── health/            # System health check
│   │       └── seed/              # Database seeder
│   ├── components/
│   │   ├── layout/                # 5 layout components
│   │   │   ├── app-shell.tsx      # Main app shell with lazy page loading
│   │   │   ├── sidebar.tsx        # Desktop sidebar navigation
│   │   │   ├── header.tsx         # Top header with search
│   │   │   ├── mobile-nav.tsx     # Bottom nav (mobile)
│   │   │   └── mobile-sheet.tsx   # Slide-out menu (mobile)
│   │   ├── pages/                 # 40+ page components
│   │   │   ├── landing-page.tsx   # Bima-inspired 12-section landing
│   │   │   ├── login-page.tsx     # Authentication
│   │   │   ├── register-page.tsx  # Registration
│   │   │   ├── dashboard-page.tsx # Main dashboard
│   │   │   ├── products-page.tsx  # Product discovery
│   │   │   ├── links-page.tsx     # Link management
│   │   │   ├── analytics-page.tsx # Analytics
│   │   │   ├── campaigns-page.tsx # Campaign management
│   │   │   ├── calculator-page.tsx# Commission calculator
│   │   │   ├── earnings-page.tsx  # Earnings tracking
│   │   │   ├── autopost-page.tsx  # Social scheduling
│   │   │   ├── content-page.tsx   # AI content generator
│   │   │   ├── trends-page.tsx    # Trend spy
│   │   │   ├── profit-page.tsx    # Profit optimizer
│   │   │   ├── studio-page.tsx    # Content studio
│   │   │   ├── hermes-page.tsx    # HERMES AI hub
│   │   │   ├── achievements-page.tsx
│   │   │   ├── leaderboard-page.tsx
│   │   │   ├── referrals-page.tsx
│   │   │   ├── notifications-page.tsx
│   │   │   ├── settings-page.tsx
│   │   │   ├── tiktok-page.tsx    # TikTok Shop
│   │   │   ├── lazada-page.tsx    # Lazada
│   │   │   ├── live-page.tsx      # Shopee Live
│   │   │   ├── compare-page.tsx   # Multi-platform compare
│   │   │   ├── unified-page.tsx   # Unified earnings
│   │   │   ├── matcher-page.tsx   # Product matcher
│   │   │   ├── recommender-page.tsx   # AI Recommender
│   │   │   ├── thumbnails-page.tsx    # AI Thumbnails
│   │   │   ├── alerts-page.tsx        # Commission alerts
│   │   │   ├── abtesting-page.tsx     # A/B Testing
│   │   │   ├── audience-page.tsx      # Audience AI
│   │   │   ├── hashtags-page.tsx      # Hashtag AI
│   │   │   ├── calendar-page.tsx      # AI Calendar
│   │   │   ├── pricing-page.tsx       # Pricing tiers
│   │   │   ├── marketplace-page.tsx   # Content marketplace
│   │   │   ├── team-page.tsx          # Team dashboard
│   │   │   ├── whitelabel-page.tsx    # White-label config
│   │   │   ├── apikeys-page.tsx       # API key management
│   │   │   ├── intelligence-page.tsx  # Market intelligence
│   │   │   ├── health-page.tsx        # Account health
│   │   │   ├── promotions-page.tsx    # Promotion hub
│   │   │   ├── ads-page.tsx           # Shopee Ads
│   │   │   ├── chat-page.tsx          # Seller chat
│   │   │   └── coming-soon-page.tsx   # Placeholder
│   │   ├── ui/                    # 55+ shadcn/ui components
│   │   ├── hermes/                # HERMES-specific components
│   │   │   ├── hermes-mascot.tsx  # Animated mascot
│   │   │   ├── chat-widget.tsx    # Floating chat widget
│   │   │   └── hermes-reactions.tsx # Emoji reactions
│   │   ├── marketing/             # Landing page components
│   │   │   ├── testimonials-carousel.tsx
│   │   │   ├── case-studies.tsx
│   │   │   ├── live-earnings-ticker.tsx
│   │   │   ├── security-badges.tsx
│   │   │   └── changelog-widget.tsx
│   │   ├── social/                # Social media components
│   │   │   └── social-accounts-section.tsx
│   │   ├── pwa/                   # PWA components
│   │   │   ├── register-sw.tsx
│   │   │   ├── offline-banner.tsx
│   │   │   ├── pull-to-refresh-wrapper.tsx
│   │   │   └── pull-to-refresh-indicator.tsx
│   │   ├── onboarding/            # Onboarding flow
│   │   │   └── onboarding-wizard.tsx
│   │   ├── realtime/              # Real-time components
│   │   │   └── realtime-provider.tsx
│   │   ├── illustrations/         # Empty state illustrations
│   │   │   └── empty-illustrations.tsx
│   │   ├── providers.tsx          # App providers (Theme, Query, etc.)
│   │   ├── error-boundary.tsx     # Error boundary component
│   │   └── network-banner.tsx     # Network status banner
│   ├── lib/
│   │   ├── utils.ts               # cn() utility
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── auth.ts                # NextAuth configuration
│   │   ├── validation.ts          # Zod schemas
│   │   ├── fetch-utils.ts         # API fetch helpers
│   │   ├── query-config.ts        # TanStack Query config
│   │   ├── rate-limit.ts          # Rate limiting
│   │   ├── rate-limit-enforce.ts  # Rate limit enforcement
│   │   ├── api-error.ts           # Standardized API errors
│   │   ├── shopee/                # Shopee integration layer
│   │   │   ├── affiliate-api.ts   # Main service (auto-switch real/mock)
│   │   │   ├── graphql-client.ts  # GraphQL + HMAC-SHA256 auth
│   │   │   ├── open-api-client.ts # Open API v2 client (50+ methods)
│   │   │   ├── open-api-mock.ts   # Open API v2 mock service
│   │   │   └── mock-data.ts       # Malaysian market mock data
│   │   ├── tiktok/                # TikTok Shop integration
│   │   │   ├── api-client.ts      # TikTok API client
│   │   │   ├── affiliate-service.ts # TikTok affiliate service
│   │   │   └── mock-data.ts       # TikTok mock data
│   │   ├── lazada/                # Lazada integration
│   │   │   ├── api-client.ts      # Lazada API client
│   │   │   ├── affiliate-service.ts # Lazada affiliate service
│   │   │   └── mock-data.ts       # Lazada mock data
│   │   ├── live/                  # Shopee Live integration
│   │   │   ├── types.ts
│   │   │   ├── mock-data.ts
│   │   │   └── script-templates.ts
│   │   ├── social/                # Social media publishing
│   │   │   ├── types.ts
│   │   │   ├── publisher.ts       # Multi-platform publisher
│   │   │   ├── facebook.ts
│   │   │   ├── instagram.ts
│   │   │   ├── tiktok.ts
│   │   │   └── twitter.ts
│   │   ├── hermes-insights/       # HERMES insight generation
│   │   │   ├── types.ts
│   │   │   ├── mock-data.ts
│   │   │   └── generator.ts
│   │   ├── recommender/           # AI Product Recommender
│   │   │   ├── types.ts
│   │   │   ├── algorithm.ts       # Recommendation algorithm
│   │   │   └── mock-data.ts
│   │   ├── thumbnails/            # AI Thumbnail Generator
│   │   │   ├── types.ts
│   │   │   ├── templates.ts       # Thumbnail templates
│   │   │   └── sizes.ts           # Platform-specific sizes
│   │   ├── abtesting/             # A/B Content Testing
│   │   │   ├── types.ts
│   │   │   ├── scorer.ts          # Variant scoring
│   │   │   └── mock-data.ts
│   │   ├── audience/              # Audience AI
│   │   │   ├── types.ts
│   │   │   └── mock-data.ts
│   │   ├── hashtags/              # Hashtag AI
│   │   │   ├── types.ts
│   │   │   ├── scorer.ts          # Hashtag scoring algorithm
│   │   │   └── mock-data.ts
│   │   ├── calendar/              # AI Content Calendar
│   │   │   ├── types.ts
│   │   │   ├── seasonal-events.ts # Malaysian seasonal events
│   │   │   └── mock-data.ts
│   │   ├── alerts/                # Commission XTRA Alerts
│   │   │   ├── types.ts
│   │   │   ├── matcher.ts         # Alert matching engine
│   │   │   └── mock-data.ts
│   │   ├── compare/               # Multi-platform Compare
│   │   │   ├── types.ts
│   │   │   └── matcher.ts         # Cross-platform matching
│   │   ├── matcher/               # Product Matcher
│   │   │   ├── types.ts
│   │   │   └── service.ts         # Matching service
│   │   ├── pricing/               # Pricing & Subscription
│   │   │   ├── types.ts
│   │   │   ├── plans.ts           # Plan definitions
│   │   │   ├── feature-gate.ts    # Feature gating logic
│   │   │   └── mock-data.ts
│   │   ├── marketplace/           # Content Marketplace
│   │   │   ├── types.ts
│   │   │   └── mock-data.ts
│   │   ├── team/                  # Team Dashboard
│   │   │   ├── types.ts
│   │   │   └── mock-data.ts
│   │   ├── whitelabel/            # White-Label
│   │   │   ├── types.ts
│   │   │   ├── applier.ts         # Brand applier
│   │   │   └── mock-data.ts
│   │   ├── apikeys/               # API Keys
│   │   │   ├── types.ts
│   │   │   ├── endpoints.ts       # API endpoint catalog
│   │   │   ├── store.ts           # Key storage
│   │   │   └── mock-data.ts
│   │   ├── community/             # Community features
│   │   │   └── mock-data.ts
│   │   ├── export/                # Data Export
│   │   │   ├── utils.ts
│   │   │   ├── fetchers.ts
│   │   │   ├── pdf-builder.ts     # PDF generation
│   │   │   └── demo-data.ts
│   │   ├── earnings/              # Earnings types
│   │   │   ├── types.ts
│   │   │   └── mock-data.ts
│   │   └── realtime/              # Real-time features
│   │       ├── constants.ts
│   │       ├── emit.ts
│   │       └── sound.ts
│   ├── store/
│   │   ├── app-store.ts           # Zustand store (7+ state slices)
│   │   └── realtime-store.ts      # Real-time state
│   ├── types/
│   │   ├── index.ts               # TypeScript interfaces
│   │   └── next-auth.d.ts         # NextAuth type extensions
│   ├── hooks/
│   │   ├── use-toast.ts           # Toast notifications
│   │   ├── use-mobile.ts          # Mobile detection
│   │   ├── use-page-transition.ts # Framer Motion transition hooks
│   │   ├── use-count-up.ts        # Animated number counter
│   │   ├── use-realtime.ts        # Real-time Socket.io hook
│   │   ├── use-offline-mode.ts    # Offline detection
│   │   ├── use-network-status.ts  # Network quality
│   │   ├── use-pull-to-refresh.ts # Pull-to-refresh gesture
│   │   ├── use-swipe-gestures.ts  # Swipe gesture detection
│   │   ├── use-keyboard-shortcuts.ts
│   │   ├── use-haptics.ts         # Haptic feedback
│   │   └── use-confetti.ts        # Celebration confetti
│   └── middleware.ts              # NextAuth middleware
├── mini-services/
│   └── notification-service/      # Socket.io real-time service
│       ├── index.ts               # Service entry point
│       ├── package.json           # Independent bun project
│       └── test-e2e.ts           # E2E test
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service worker
│   ├── icons/                     # PWA icons (16-512px)
│   ├── logo.svg / logo.png        # Brand logo
│   └── favicon.ico                # Favicon
├── scripts/
│   ├── generate-icons.ts          # PWA icon generator
│   └── start-notification-service.sh
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── components.json                # shadcn/ui config
├── Caddyfile                      # Gateway config
└── README.md                      # This file
```

---

## Feature Modules (5 Fasas)

### Fasa 1 — Core Platform

#### 1. Dashboard & Analytics

**Dashboard** (`dashboard` page)

The central command center displaying real-time performance metrics:

- **Stats Cards:** Total clicks, conversions, earnings, conversion rate with 30-day trend comparison
- **Activity Feed:** Recent clicks, conversions, and link activity
- **Top Products:** Best-performing affiliate products by earnings
- **Quick Actions:** Generate link, create campaign, post to social
- **Live Earnings Ticker:** Real-time earnings animation

**Analytics** (`analytics` page)

Deep-dive performance analysis:

- **Time-series Charts:** Clicks and conversions over 7/30/90 days
- **Geographic Breakdown:** Click origins by country
- **Device Analysis:** Desktop vs mobile vs tablet distribution
- **Category Performance:** Which product categories convert best
- **Period Comparison:** Compare current vs previous period metrics

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/dashboard` | GET | Aggregated stats with trend calculations |
| `/api/analytics` | GET | Time-series and breakdown data |

---

#### 2. Product Discovery & Affiliate Links

**Products** (`products` page)

Discover and search Shopee products to promote:

- **Product Search:** Search by keyword with real Shopee API or mock data
- **Commission Preview:** See commission rates before generating links
- **One-Click Link Generation:** Create affiliate links instantly
- **Category Filters:** Browse by category, price range, commission rate
- **Demo/Live Badge:** Visual indicator of data source (mock vs real API)

**Affiliate Links** (`links` page)

Manage all your affiliate links:

- **Link Management:** Create, pause, expire links
- **Click Tracking:** Real-time click counts with device/geo data
- **Short Codes:** Auto-generated unique short codes for each link
- **Campaign Association:** Organize links into campaigns
- **Performance Metrics:** CTR, conversion rate, earnings per link

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/shopee/products` | GET | Search products (real or mock) |
| `/api/shopee/generate-link` | POST | Generate affiliate link + save to DB |
| `/api/links` | GET, POST | List/create affiliate links |
| `/api/products/search` | GET | AI-powered product search via web |

---

#### 3. Social Media Auto-Post

**Auto Post** (`autopost` page)

Schedule and manage social media posts optimized for Malaysian audiences:

- **Multi-Platform:** TikTok, Instagram, Facebook, YouTube Shorts, Twitter/X
- **AI Caption Generation:** Auto-generate captions in Manglish/Bahasa/English
- **Affiliate Link Insertion:** Auto-insert Shopee affiliate links into posts
- **Smart Scheduling:** AI-recommended posting times based on Malaysian peak hours
- **Engagement Heatmap:** 24-hour engagement probability chart
- **7-Day Suggestions:** Next optimal posting windows for each platform

**Malaysian Peak Times:**
| Time Slot | Engagement Level | Description |
|-----------|-----------------|-------------|
| 7:00 - 9:00 PM | 🔥 **Golden Hour** | Highest engagement, after work browsing |
| 12:00 - 2:00 PM | 📱 **Lunch Rush** | Second peak, lunch break browsing |
| 9:00 PM - 12:00 AM | 🌙 **Impulse Hour** | Late night shopping, impulse buys |
| 6:00 - 8:00 AM | ☕ **Morning Commute** | Moderate engagement, news/social check |

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/autopost` | POST, GET | Create/list scheduled posts |
| `/api/autopost/suggest-times` | GET | AI-suggested posting times |
| `/api/autopost/[id]` | PATCH, DELETE | Update/delete a post |

---

#### 4. AI Content Generator

**AI Content** (`content` page)

Generate marketing content tailored for the Malaysian market:

- **Content Types:**
  - Social media captions (platform-specific)
  - Video scripts (Hook → Problem → Solution → CTA)
  - Hashtag sets (#RacunShopee, #Budol, #SkincareMalaysia)
  - Shopee Live scripts (interactive, engagement-focused)
  - Product reviews and comparisons

- **Language Options:** English, Bahasa Malaysia, Manglish
- **Tone Options:** Casual, Professional, Excited, Funny
- **Content Library:** Save, favorite, and reuse generated content
- **Template System:** 8 pre-built templates for quick content creation

**Templates:**
| Template | Platform | Style |
|----------|----------|-------|
| Before/After | TikTok | Transformation reveal |
| Unboxing | TikTok | Product reveal + first impressions |
| Demo/Review | TikTok | Feature showcase |
| Try-On Haul | Instagram Reels | Fashion/beauty showcase |
| Live Script | Shopee Live | Interactive selling script |
| Product Comparison | Facebook | Side-by-side analysis |
| Price Reveal | TikTok/IG | Suspense + value reveal |
| Problem-Solution | All Platforms | Pain point → product solution |

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/content/generate` | POST | AI content generation |
| `/api/content/templates` | GET | Pre-built content templates |
| `/api/content/library` | GET, POST, PATCH, DELETE | Content library CRUD |

---

#### 5. Trend & Competitor Spy

**Trend Spy** (`trends` page)

Monitor market trends and competitor activity:

- **Trending Products:** AI-discovered trending products with trend direction indicators
- **Keyword Discovery:** Trending search terms with volume and competition data
- **Competitor Analysis:** Top Malaysian affiliate profiles and strategies
- **Seasonal Alerts:** Upcoming Malaysian shopping events (Raya, 11.11, 12.12, CNY)

**Seasonal Calendar (Malaysia):**
| Event | Period | Commission Boost |
|-------|--------|-----------------|
| Chinese New Year | Jan-Feb | 2-3x |
| Ramadan/Raya | Mar-Apr | 3-5x |
| Mid-Year Sale | Jun-Jul | 2-3x |
| 9.9 Sale | September 9 | 2-4x |
| 10.10 Sale | October 10 | 2-4x |
| 11.11 Sale | November 11 | 3-5x |
| 12.12 Sale | December 12 | 3-5x |
| Year-End Sale | December | 2-3x |

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/trends/discover` | GET | AI-powered trending product discovery |
| `/api/trends/competitor` | GET | Competitor analysis |
| `/api/trends/keywords` | GET | Trending keywords with volume data |

---

#### 6. Profit Optimizer

**Profit Optimizer** (`profit` page)

AI-powered product scoring and commission maximization:

- **Product Scoring Engine:** Multi-factor profitability scoring (0-100)
  | Factor | Weight | Description |
  |--------|--------|-------------|
  | Commission Rate | 25% | Base + XTRA commission percentage |
  | Conversion Rate | 30% | Historical conversion probability |
  | Average Order Value | 20% | Price × commission potential |
  | Competition Level | 10% | Number of competing affiliates |
  | Sales Volume | 10% | Product popularity and demand |
  | Trend Direction | 5% | Growing/stable/declining |

- **Score Levels:**
  - 🔥 `HOT` (80-100): Promote immediately
  - ✅ `GOOD` (60-79): Strong potential
  - ⚠️ `AVERAGE` (40-59): Consider carefully
  - ❌ `SKIP` (0-39): Not recommended

- **Commission XTRA Finder:** Auto-discover products with extra commission bonuses (up to 40-50% additional)
- **Earnings Calculator:** Project daily/monthly/yearly earnings with break-even analysis

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/profit/score` | POST | Product profitability scoring |
| `/api/profit/calculator` | POST | Commission earnings calculator |
| `/api/profit/xtra` | GET | Commission XTRA product finder |

---

#### 7. Content Studio (Mobile Creator)

**Content Studio** (`studio` page)

Create video content optimized for mobile-first creation:

- **Video Script Generator:** 8 script templates with timed scenes
  | Template | Structure |
  |----------|-----------|
  | Before/After | Problem → Product → Application → Result → CTA |
  | Unboxing | Teaser → Unbox → Feature → Demo → CTA |
  | Demo | Hook → Feature → Benefit → Demo → CTA |
  | Price Reveal | Hook → Build-up → Reveal → Justify → CTA |
  | Comparison | Problem → Option A → Option B → Verdict → CTA |
  | Problem-Solution | Pain → Agitate → Solution → Result → CTA |
  | Testimonial | Story → Struggle → Discovery → Result → CTA |
  | Top 5 | Hook → Items → Bonus → CTA |

- **TTS Voiceover:** Text-to-speech in Bahasa Malaysia and English
- **Timed Captions:** SRT and JSON subtitle generation for short-form videos
- **Multi-Language:** Scripts in English, Bahasa, or Manglish

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/studio/script` | POST | AI video script generation |
| `/api/studio/caption` | POST | Timed subtitle generation |
| `/api/studio/tts` | POST | Text-to-speech synthesis |

---

#### 8. HERMES AI Hub

**Hermes AI** (`hermes` page)

Your intelligent affiliate marketing assistant powered by HERMES Agent:

- **Conversational AI:** Chat with HERMES about products, strategies, and insights
- **Skills Management:** Create, activate, and manage AI skills
- **Task Automation:** Schedule recurring tasks with cron expressions
- **Smart Insights:** AI-generated business insights based on your data
- **Persistent Memory:** HERMES remembers conversations and learns preferences
- **Connection Management:** Configure and test AI backend connection
- **Floating Chat Widget:** Always-available chat overlay on any page

**Insight Types:**
| Type | Description |
|------|-------------|
| Trend | Market trend alerts and opportunities |
| Opportunity | Revenue opportunities detected |
| Alert | Performance issues requiring attention |
| Recommendation | Actionable improvement suggestions |

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/hermes/chat` | POST | Chat with HERMES AI |
| `/api/hermes/connection` | GET, POST | Get/test connection |
| `/api/hermes/insights` | GET | AI-generated insights |
| `/api/hermes/insights/generate` | POST | Generate new insights |
| `/api/hermes/skills` | GET, POST | Skill management |
| `/api/hermes/tasks` | GET, POST | Task management |
| `/api/hermes/memory` | GET, DELETE | Memory management |

---

#### 9. Earnings & Payouts

**Earnings** (`earnings` page)

Comprehensive earnings tracking and payout management:

- **Earnings Summary:** Total earnings, pending, confirmed, paid
- **Daily Earnings Chart:** Visual earnings trend over time
- **Recent Conversions:** Latest commission-confirming orders
- **Payout History:** All payout requests with status tracking
- **Earning Goals:** Set and track monthly/weekly/yearly earning targets

**Calculator** (`calculator` page)

Commission projection calculator:

- **Same-Shop Model:** Multiple items from same shop (higher commission)
- **Different-Shop Model:** Items from different shops
- **Projection:** Daily/monthly/yearly earnings estimates
- **Break-Even:** How many clicks needed to hit target

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/earnings` | GET | Earnings data with chart and goals |
| `/api/earnings/unified` | GET | Unified multi-platform earnings |
| `/api/shopee/commissions` | GET | Commission orders from Shopee |
| `/api/profit/calculator` | POST | Earnings projection calculator |

---

#### 10. Gamification

**Achievements** (`achievements` page)

Badge-based milestone system to motivate and track progress:

- Earning milestones (first RM100, RM1,000, RM10,000)
- Click milestones (100, 1,000, 10,000 clicks)
- Conversion milestones (first conversion, 100 conversions)
- Streak achievements (posting streaks, engagement streaks)

**Leaderboard** (`leaderboard` page)

Competitive affiliate ranking:

- Period-based rankings (weekly, monthly, all-time)
- Metrics: total earnings, clicks, conversions
- Compare against top Malaysian affiliates

**Referrals** (`referrals` page)

Referral program management:

- Track referral status (pending, active, converted)
- Commission tracking for referrals
- Referral link generation

---

#### 11. Login & Registration

**Login** (`login` page)

NextAuth.js-powered authentication:

- Email/password credentials provider
- Demo account for quick access
- Session management with JWT
- Protected routes via middleware

**Register** (`register` page)

User registration with:

- Email validation
- Password hashing (bcrypt)
- Role assignment (admin/affiliate/viewer)
- Auto-login after registration

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth handler |
| `/api/auth/register` | POST | User registration |
| `/api/auth/me` | GET | Current user profile |

---

#### 12. Settings & Notifications

**Settings** (`settings` page)

- Shopee API credentials configuration
- App preferences (theme, language, notifications)
- Connection management and testing
- Data export options

**Notifications** (`notifications` page)

- Real-time alerts for conversions, commissions, and system events
- Mark as read/unread
- Filter by type and date
- Sound alerts for important notifications

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/notifications` | GET, PATCH | List and update notifications |
| `/api/shopee/config` | GET, POST, DELETE | Shopee credentials |
| `/api/shopee/connect` | POST, GET | Connection test |
| `/api/shopee/status` | GET | Connection status |

---

### Fasa 2 — Multi-Platform Expansion

#### 13. TikTok Shop Integration

**TikTok Shop** (`tiktok` page)

Full TikTok Shop affiliate integration:

- **Product Search:** Browse TikTok Shop affiliate products
- **Link Generation:** Create TikTok Shop affiliate tracking links
- **Commission Tracking:** Track earnings across TikTok Shop
- **Connect/Disconnect:** Manage TikTok Shop connection

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/tiktok/products` | GET | Search TikTok Shop products |
| `/api/tiktok/generate-link` | POST | Generate TikTok affiliate link |
| `/api/tiktok/commissions` | GET | TikTok commission orders |
| `/api/tiktok/connect` | POST, GET | Connect/test TikTok Shop |

---

#### 14. Lazada Integration

**Lazada** (`lazada` page)

Lazada affiliate network integration:

- **Product Search:** Browse Lazada affiliate product catalog
- **Link Generation:** Create Lazada affiliate links
- **Commission Tracking:** Track Lazada earnings
- **Connect/Disconnect:** Manage Lazada connection

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/lazada/products` | GET | Search Lazada products |
| `/api/lazada/generate-link` | POST | Generate Lazada affiliate link |
| `/api/lazada/commissions` | GET | Lazada commission orders |
| `/api/lazada/connect` | POST, GET | Connect/test Lazada |

---

#### 15. Shopee Live Dashboard

**Shopee Live** (`live` page)

Shopee Live streaming management and analytics:

- **Session Management:** Create and manage live streaming sessions
- **Script Generation:** AI-generated live selling scripts
- **Real-time Analytics:** Viewer count, engagement, conversions during live
- **Performance Tracking:** Post-stream analytics and earnings

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/live/sessions` | GET, POST | List/create live sessions |
| `/api/live/sessions/[id]` | GET, PATCH | Get/update session |
| `/api/live/analytics` | GET | Live streaming analytics |
| `/api/live/script` | POST | AI live script generation |

---

#### 16. Multi-Platform Compare

**Compare** (`compare` page)

Side-by-side commission comparison across platforms:

- **Commission Comparison:** Compare rates across Shopee, TikTok Shop, Lazada
- **Product Matching:** Find same product on different platforms
- **Best Rate Finder:** Automatically identify highest commission
- **Visual Charts:** Bar charts showing commission differences

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/compare` | GET | Multi-platform commission comparison |

---

#### 17. Unified Earnings Dashboard

**Unified Earnings** (`unified` page)

Aggregated earnings view across all platforms:

- **Total Earnings:** Combined earnings from Shopee, TikTok, Lazada
- **Platform Breakdown:** Earnings pie chart by platform
- **Trend Comparison:** Earnings trends across platforms
- **Best Performer:** Identify top-earning platform

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/earnings/unified` | GET | Unified multi-platform earnings |

---

#### 18. Cross-Platform Product Matcher

**Product Matcher** (`matcher` page)

Find the same product across multiple platforms:

- **Product Search:** Search across all platforms simultaneously
- **Smart Matching:** AI-powered product matching algorithm
- **Commission Optimizer:** Find best commission rate for same product
- **Link Generation:** Generate links for the best platform

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/match` | POST | Cross-platform product matching |

---

### Fasa 3 — AI Superpowers

#### 19. AI Product Recommender

**Recommender** (`recommender` page)

Audience-based product recommendation engine:

- **Audience Profile:** Define target audience demographics
- **Smart Recommendations:** AI-powered product suggestions based on audience
- **Scoring Algorithm:** Multi-factor recommendation scoring
- **Category Analysis:** Best categories for your audience

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/ai/recommend` | POST | AI product recommendations |

---

#### 20. AI Video Thumbnails

**Thumbnails** (`thumbnails` page)

Video thumbnail generation with templates:

- **Template Library:** Pre-built thumbnail templates for different niches
- **Platform Sizes:** Auto-resize for TikTok, Instagram, YouTube, Shopee Live
- **Brand Kit:** Apply custom branding colors and logos
- **AI Generation:** AI-powered thumbnail creation

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/ai/thumbnail` | POST | Generate AI thumbnail |

---

#### 21. Smart Commission XTRA Alerts

**Alerts** (`alerts` page)

Smart alerts for Commission XTRA opportunities:

- **XTRA Finder:** Auto-discover products with bonus commissions
- **Alert Preferences:** Configure alert types and thresholds
- **Real-time Notifications:** Push alerts when new XTRA opportunities found
- **Historical Tracking:** Track XTRA commission performance

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/alerts/xtra` | GET | Commission XTRA alerts |
| `/api/alerts/preferences` | GET, PUT | Alert preferences |

---

#### 22. A/B Content Testing

**A/B Testing** (`abtesting` page)

Generate and test multiple content variants:

- **Variant Generation:** AI generates 3 content variants automatically
- **Performance Scoring:** Score variants based on engagement predictions
- **Track Results:** Track which variant performs best
- **Statistical Significance:** Calculate confidence levels

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/abtesting/generate` | POST | Generate A/B test variants |
| `/api/abtesting/track` | POST | Track variant performance |

---

#### 23. AI Audience Analyzer

**Audience AI** (`audience` page)

AI-powered audience demographic and behavior analysis:

- **Demographic Breakdown:** Age, gender, location analysis
- **Interest Mapping:** What your audience cares about
- **Behavioral Patterns:** Purchase timing, platform preferences
- **Content Preferences:** What content format works best

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/ai/audience` | GET | AI audience analysis |

---

#### 24. Hashtag AI Optimizer

**Hashtag AI** (`hashtags` page)

AI-powered hashtag scoring and optimization:

- **Hashtag Scoring:** Score hashtags by reach, competition, relevance
- **Trending Tags:** Discover trending Malaysian hashtags
- **Niche-specific:** Category-optimized hashtag sets
- **Platform Optimization:** Different hashtags for TikTok vs IG vs FB

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/ai/hashtags` | GET, POST | AI hashtag optimization |

---

#### 25. AI Content Calendar

**AI Calendar** (`calendar` page)

AI-generated content calendar with Malaysian seasonal events:

- **Calendar Generation:** AI creates optimal posting schedule
- **Seasonal Events:** Auto-populate Malaysian shopping events
- **Smart Scheduling:** Best times per platform and content type
- **Schedule Management:** Create, edit, and manage calendar entries

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/ai/calendar` | GET | AI content calendar |
| `/api/ai/calendar/schedule` | POST | Create calendar entry |

---

### Fasa 4 — Monetize & Scale

#### 26. Pricing & Subscription

**Pricing** (`pricing` page)

4-tier freemium pricing model:

- **Plan Comparison:** Visual comparison of all 4 tiers
- **Feature Gating:** Real-time feature access checking
- **Checkout Flow:** Subscription payment processing
- **Usage Tracking:** Monitor feature usage against plan limits

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/pricing/plans` | GET | Available pricing plans |
| `/api/pricing/subscription` | GET, POST | Current subscription |
| `/api/pricing/checkout` | POST | Initiate checkout |
| `/api/pricing/usage` | GET | Usage tracking |

---

#### 27. Affiliate Marketplace

**Marketplace** (`marketplace` page)

Content marketplace for buying/selling affiliate templates:

- **Browse Listings:** Search content templates by niche and platform
- **Purchase System:** Buy templates with credits
- **Seller Dashboard:** List and sell your own templates
- **Reviews & Ratings:** Community-driven quality assessment

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/marketplace/listings` | GET, POST | Browse/create listings |
| `/api/marketplace/listings/[id]` | GET, PATCH, DELETE | Manage listing |
| `/api/marketplace/purchase` | POST | Purchase a listing |
| `/api/marketplace/seller` | GET | Seller dashboard |

---

#### 28. Team Dashboard

**Team** (`team` page)

Multi-user team management for agencies:

- **Team Management:** Create and manage teams
- **Member Roles:** Assign roles and permissions
- **Shared Analytics:** Team-wide performance analytics
- **Shared Resources:** Share links, campaigns, content

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/team` | GET, POST | List/create teams |
| `/api/team/[id]` | GET, PATCH, DELETE | Team management |
| `/api/team/[id]/members` | GET, POST | Team member management |
| `/api/team/[id]/analytics` | GET | Team analytics |
| `/api/team/[id]/shared` | GET | Shared resources |

---

#### 29. White-Label

**White-Label** (`whitelabel` page)

Custom branding for enterprise clients:

- **Brand Configuration:** Custom logo, colors, domain
- **Preview Mode:** Live preview of branded version
- **Theme Customization:** Custom color schemes and typography
- **Domain Mapping:** Custom domain support

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/whitelabel/config` | GET, PUT | White-label configuration |
| `/api/whitelabel/preview` | GET | Preview branded version |

---

#### 30. API Keys & Developer Access

**API Keys** (`apikeys` page)

Developer API access management:

- **Key Management:** Create, revoke, rotate API keys
- **Usage Analytics:** Track API usage per key
- **Rate Limits:** Configure rate limits per key
- **API Playground:** Interactive API testing environment

**API Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/apikeys` | GET, POST | List/create API keys |
| `/api/apikeys/[id]` | PATCH, DELETE | Manage API key |
| `/api/apikeys/usage` | GET | Usage analytics |
| `/api/apikeys/playground` | POST | API playground |

---

### Fasa 5 — Shopee Pro

#### 31. Market Intelligence

**Market Intelligence** (`intelligence` page)

Deep Shopee market analysis with 6 sections:

- **Market Overview:** Total products, shops, average price, top categories
- **Category Distribution:** Visual pie chart of market categories
- **Trending Products:** Top trending items with trend indicators
- **Seller Intelligence:** Top seller analysis and strategies
- **Price Intelligence:** Price range analysis by category
- **Product Scoring:** AI-powered product viability scoring

Powered by ShopeeOpenAPIClient with 50+ typed methods across 10 manager classes (Product, Order, Shop, Payment, Logistics, Promotion, AccountHealth, Ads, Push, Chat).

---

#### 32. Account Health Monitor

**Account Health** (`health` page)

Shopee account health monitoring with 6 sections:

- **Health Score Gauge:** SVG circular gauge with animated ring fill (0-100)
- **Key Metrics:** Response rate, ship-on-time, order cancellation, listing quality
- **Penalty Timeline:** Historical penalty events chart
- **Listing Issues:** Product listing quality problems
- **Late Orders:** Orders shipped after deadline
- **Shop Performance:** Overall shop performance metrics

---

#### 33. Promotion Hub

**Promotions** (`promotions` page)

Complete promotion management with 5 tabs:

- **Flash Sales:** Time-limited sales with countdown timers
- **Vouchers:** Create and manage discount vouchers with code reveal animation
- **Discounts:** Product-level discount management
- **Bundle Deals:** Multi-item bundle promotions
- **Add-on Deals:** Purchase-with-purchase promotions

---

#### 34. Shopee Ads Dashboard

**Shopee Ads** (`ads` page)

Campaign management and ad optimization:

- **Overview Cards:** Total spend, revenue, ROAS, active campaigns
- **Campaign Chart:** Dual-axis ComposedChart (spend/revenue lines + ROAS bars)
- **Campaign Table:** All campaigns with status, budget, performance
- **Keywords:** Keyword bidding management
- **Budget Recommendations:** AI budget optimization with apply buttons
- **Ad Types Info:** Educational section on available ad types

---

#### 35. Seller Chat

**Seller Chat** (`chat` page)

Buyer conversation management with AI assistance:

- **Two-Panel Layout:** Conversation list + chat window
- **8 Mock Conversations:** Malaysian buyer conversations with different message types
- **AI Suggested Replies:** Auto-generated response suggestions
- **Typing Indicator:** Animated typing dots
- **Offer Toggle:** Quick offer creation during chat
- **Pin/Unpin:** Pin important conversations
- **Message Read Receipts:** Visual delivery confirmation

---

## Landing Page

A Bima.framer.media-inspired landing page with 12 sections, built with Framer Motion scroll-triggered animations:

| # | Section | Description |
|---|---------|-------------|
| 1 | **Hero** | Headline, subheadline, CTA buttons, animated background |
| 2 | **Pain Points** | 4 common affiliate struggles with illustrations |
| 3 | **Solutions** | Platform features mapped to pain points |
| 4 | **Case Studies** | Real Malaysian affiliate success stories |
| 5 | **Trust/Stats** | User count, total earnings, products listed, success rate |
| 6 | **Tech Stack** | Visual tech stack showcase |
| 7 | **Testimonials** | Carousel of Malaysian affiliate testimonials |
| 8 | **Pricing** | 4-tier pricing comparison table |
| 9 | **FAQ** | Accordion FAQ section |
| 10 | **CTA** | Final call-to-action with urgency |
| 11 | **Live Earnings Ticker** | Real-time animated earnings counter |
| 12 | **Footer** | Links, social media, legal |

---

## Multi-Platform Integration

### Shopee API Integration

The app implements an intelligent dual data source that automatically switches between real and mock data:

#### Shopee Affiliate API (GraphQL)
- **Authentication:** HMAC-SHA256 signature on every request
- **Regional Endpoints:** Malaysia, Singapore, Indonesia, Thailand, Philippines, Vietnam
- **Operations:** Product search, link generation, commission orders, click stats
- **Error Handling:** Graceful fallback to mock data on API errors

#### Shopee Open API v2
- **ShopeeOpenAPIClient** with 10 manager classes and 50+ typed methods
- HMAC-SHA256 signing, auto token refresh, 6 regional endpoints
- Managers: Product, Order, Shop, Payment, Logistics, Promotion, AccountHealth, Ads, Push, Chat
- **ShopeeOpenAPIMockService** with realistic Malaysian market mock data

#### Webhook Events

| Event | Description | Processing |
|-------|-------------|------------|
| `order_conversion` | Customer completed purchase | Save conversion + create notification |
| `click` | Affiliate link clicked | Increment click counter |
| `commission_update` | Commission status changed | Update conversion status |

Webhook verification uses HMAC-SHA256 signature validation.

#### Getting Shopee API Access

1. Register at [Shopee Affiliate Program](https://affiliate.shopee.com.my/)
2. Go to **Account > API > Open API**
3. Request access to the Shopee Affiliate Open API Platform
4. Generate your **App ID** and **Secret**
5. Enter credentials in **Settings > Shopee Integration**

> **Important:** Shopee Affiliate Open API uses GraphQL specification. You must request access separately.

---

### TikTok Shop Integration

- **TikTokApiClient** for TikTok Shop API communication
- **TikTokAffiliateService** for affiliate-specific operations
- Full mock data for Malaysian market
- Product search, link generation, commission tracking

---

### Lazada Integration

- **LazadaApiClient** for Lazada API communication
- **LazadaAffiliateService** for affiliate operations
- Full mock data for Malaysian market
- Product search, link generation, commission tracking

---

### Real-Time Notifications (Socket.io)

A separate mini-service running on port 3003/3004 provides real-time capabilities:

- **WebSocket Connection:** Socket.io with auto-reconnect
- **Event Types:** Conversion alerts, commission updates, system notifications
- **Sound Alerts:** Audio notifications for important events
- **Real-time Store:** Zustand store synchronized with WebSocket events

```typescript
// Frontend connection
import { io } from 'socket.io-client';
const socket = io('/?XTransformPort=3003');
```

---

## HERMES AI Agent

HERMES is an AI agent integration inspired by Nous Research's HERMES architecture, adapted for affiliate marketing intelligence with a unique **Manglish personality**.

### Capabilities

| Feature | Description |
|---------|-------------|
| **Chat** | Natural language conversations about affiliate strategies |
| **Skills** | Custom AI skills that can be created, trained, and deployed |
| **Tasks** | Automated recurring tasks (cron-based scheduling) |
| **Insights** | AI-generated business insights from your data |
| **Memory** | Persistent conversation memory across sessions |
| **Reactions** | Emoji reactions for engaging interactions |
| **Mascot** | Animated HERMES mascot character |

### Architecture

```
User Query → HERMES Chat API → z-ai-web-dev-sdk (LLM)
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
              Skills Engine   Task Runner   Insight Generator
                    │             │             │
                    ▼             ▼             ▼
              HermesSkill    HermesTask    HermesInsight
              (Database)     (Database)    (Database)
                    │
                    ▼
              AgentMemory (Database)
              — Persistent context across sessions
```

### Pre-built Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| Product Analyzer | "analyze product" | Score products for profitability |
| Content Writer | "write content" | Generate marketing content |
| Trend Monitor | "check trends" | Discover trending products |
| Competitor Spy | "spy competitor" | Analyze competitor strategies |
| Commission Finder | "find commission" | Locate Commission XTRA products |

### Manglish Personality

HERMES speaks in Manglish (Malaysian English) to connect with local affiliates:

> "Wah, this product very hot one! Commission rate 12% somemore got XTRA bonus. Confirm can earn one, just promote lah!"

---

## API Reference (80+ Routes)

### Authentication

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth.js handler (login, logout, session) |
| `/api/auth/register` | POST | User registration with email/password |
| `/api/auth/me` | GET | Current authenticated user profile |

### Core

| Route | Method | Description |
|-------|--------|-------------|
| `/api/dashboard` | GET | Dashboard stats with trend calculations |
| `/api/analytics` | GET | Time-series analytics and breakdown data |
| `/api/earnings` | GET | Earnings overview with chart data and goals |
| `/api/earnings/unified` | GET | Unified multi-platform earnings |
| `/api/links` | GET, POST | List and create affiliate links |
| `/api/campaigns` | GET, POST | Campaign CRUD operations |
| `/api/notifications` | GET, PATCH | List and mark notifications as read |
| `/api/seed` | POST | Database seeder for demo data |

### Products

| Route | Method | Description |
|-------|--------|-------------|
| `/api/products/search` | GET | AI-powered product search via web |
| `/api/shopee/products` | GET | Shopee product search (real or mock) |
| `/api/shopee/generate-link` | POST | Generate Shopee affiliate link + save to DB |

### Profit & Earnings

| Route | Method | Description |
|-------|--------|-------------|
| `/api/profit/score` | POST | Product profitability scoring (0-100) |
| `/api/profit/calculator` | POST | Commission earnings calculator |
| `/api/profit/xtra` | GET | Commission XTRA product finder |
| `/api/shopee/commissions` | GET | Shopee commission orders |

### Content & Studio

| Route | Method | Description |
|-------|--------|-------------|
| `/api/content/generate` | POST | AI content generation |
| `/api/content/templates` | GET | Pre-built content templates |
| `/api/content/library` | GET, POST, PATCH, DELETE | Content library CRUD |
| `/api/studio/script` | POST | AI video script generation |
| `/api/studio/caption` | POST | Timed subtitle generation |
| `/api/studio/tts` | POST | Text-to-speech synthesis |

### AI Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/ai/recommend` | POST | AI product recommendations |
| `/api/ai/hashtags` | GET, POST | AI hashtag optimization |
| `/api/ai/audience` | GET | AI audience analysis |
| `/api/ai/thumbnail` | POST | AI thumbnail generation |
| `/api/ai/calendar` | GET | AI content calendar |
| `/api/ai/calendar/schedule` | POST | Create calendar entry |

### Social & Auto-Post

| Route | Method | Description |
|-------|--------|-------------|
| `/api/autopost` | POST, GET | Create/list scheduled posts |
| `/api/autopost/suggest-times` | GET | AI-suggested best posting times |
| `/api/autopost/[id]` | PATCH, DELETE | Update/delete a scheduled post |
| `/api/social/accounts` | GET | List connected social accounts |
| `/api/social/connect/[platform]` | POST | Connect a social platform |
| `/api/social/disconnect/[platform]` | POST | Disconnect a social platform |
| `/api/social/callback/[platform]` | GET | OAuth callback handler |
| `/api/social/post` | POST | Create a social media post |
| `/api/social/post/[id]/retry` | POST | Retry a failed post |
| `/api/social/execute` | POST | Execute a post immediately |

### Hermes AI

| Route | Method | Description |
|-------|--------|-------------|
| `/api/hermes/chat` | POST | Chat with HERMES AI agent |
| `/api/hermes/connection` | GET, POST | Get/test HERMES connection |
| `/api/hermes/insights` | GET | AI-generated business insights |
| `/api/hermes/insights/generate` | POST | Generate new insights |
| `/api/hermes/skills` | GET, POST | Skill management |
| `/api/hermes/tasks` | GET, POST | Task management |
| `/api/hermes/memory` | GET, DELETE | Memory management |

### Shopee Pro (15+ routes)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/shopee/config` | GET, POST, DELETE | Shopee credentials management |
| `/api/shopee/connect` | POST, GET | Connection test |
| `/api/shopee/status` | GET | Connection status |
| `/api/shopee/webhook` | POST | Webhook receiver (HMAC verified) |
| `/api/shopee/stats` | GET | Click statistics |
| `/api/shopee/products` | GET | Product search |
| `/api/shopee/commissions` | GET | Commission orders |
| `/api/shopee/generate-link` | POST | Generate affiliate link |
| `/api/shopee/orders` | GET | Order management |
| `/api/shopee/shop` | GET | Shop information |
| `/api/shopee/payment` | GET | Payment information |
| `/api/shopee/logistics` | GET | Logistics/shipping data |
| `/api/shopee/promotions` | GET | Active promotions |
| `/api/shopee/health` | GET | Account health score |
| `/api/shopee/ads` | GET | Ad campaigns data |
| `/api/shopee/chat` | GET | Buyer conversations |
| `/api/shopee/push` | POST | Push notification |

### TikTok Shop

| Route | Method | Description |
|-------|--------|-------------|
| `/api/tiktok/products` | GET | Search TikTok Shop products |
| `/api/tiktok/generate-link` | POST | Generate TikTok affiliate link |
| `/api/tiktok/commissions` | GET | TikTok commission orders |
| `/api/tiktok/connect` | POST, GET | Connect/test TikTok Shop |

### Lazada

| Route | Method | Description |
|-------|--------|-------------|
| `/api/lazada/products` | GET | Search Lazada products |
| `/api/lazada/generate-link` | POST | Generate Lazada affiliate link |
| `/api/lazada/commissions` | GET | Lazada commission orders |
| `/api/lazada/connect` | POST, GET | Connect/test Lazada |

### Shopee Live

| Route | Method | Description |
|-------|--------|-------------|
| `/api/live/sessions` | GET, POST | List/create live sessions |
| `/api/live/sessions/[id]` | GET, PATCH | Get/update live session |
| `/api/live/analytics` | GET | Live streaming analytics |
| `/api/live/script` | POST | AI live selling script |

### Pricing & Subscription

| Route | Method | Description |
|-------|--------|-------------|
| `/api/pricing/plans` | GET | Available pricing plans |
| `/api/pricing/subscription` | GET, POST | Current subscription management |
| `/api/pricing/checkout` | POST | Initiate checkout session |
| `/api/pricing/usage` | GET | Feature usage tracking |

### A/B Testing

| Route | Method | Description |
|-------|--------|-------------|
| `/api/abtesting/generate` | POST | Generate A/B test content variants |
| `/api/abtesting/track` | POST | Track variant performance data |

### Trends

| Route | Method | Description |
|-------|--------|-------------|
| `/api/trends/discover` | GET | AI trending product discovery |
| `/api/trends/competitor` | GET | Competitor analysis |
| `/api/trends/keywords` | GET | Trending keywords with volume |

### Team

| Route | Method | Description |
|-------|--------|-------------|
| `/api/team` | GET, POST | List/create teams |
| `/api/team/[id]` | GET, PATCH, DELETE | Team CRUD |
| `/api/team/[id]/members` | GET, POST | Team member management |
| `/api/team/[id]/analytics` | GET | Team-wide analytics |
| `/api/team/[id]/shared` | GET | Shared team resources |

### Marketplace

| Route | Method | Description |
|-------|--------|-------------|
| `/api/marketplace/listings` | GET, POST | Browse/create marketplace listings |
| `/api/marketplace/listings/[id]` | GET, PATCH, DELETE | Manage a listing |
| `/api/marketplace/purchase` | POST | Purchase a marketplace listing |
| `/api/marketplace/seller` | GET | Seller dashboard data |

### White-Label

| Route | Method | Description |
|-------|--------|-------------|
| `/api/whitelabel/config` | GET, PUT | White-label configuration |
| `/api/whitelabel/preview` | GET | Preview branded version |

### API Keys

| Route | Method | Description |
|-------|--------|-------------|
| `/api/apikeys` | GET, POST | List/create API keys |
| `/api/apikeys/[id]` | PATCH, DELETE | Manage an API key |
| `/api/apikeys/usage` | GET | API key usage analytics |
| `/api/apikeys/playground` | POST | Interactive API playground |

### Alerts

| Route | Method | Description |
|-------|--------|-------------|
| `/api/alerts/xtra` | GET | Commission XTRA alert feed |
| `/api/alerts/preferences` | GET, PUT | Alert configuration |

### Export

| Route | Method | Description |
|-------|--------|-------------|
| `/api/export/csv` | GET | Export data as CSV |
| `/api/export/pdf` | GET | Export data as PDF |

### System

| Route | Method | Description |
|-------|--------|-------------|
| `/api/health` | GET | System health check |
| `/api/compare` | GET | Multi-platform commission comparison |
| `/api/match` | POST | Cross-platform product matching |

---

## Database Schema (19+ Models)

The app uses Prisma 6 with SQLite. The schema contains 19+ models organized into 4 groups.

### Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CORE MODELS                                  │
│                                                                     │
│  User ──┬── AffiliateLink ──── ClickRecord                         │
│         │                  └── Conversion                           │
│         ├── Campaign                                                │
│         ├── Referral                                               │
│         ├── Account (NextAuth)                                     │
│         └── Session (NextAuth)                                     │
│                                                                     │
│  Payout          EarningGoal        Notification                    │
│  AppSetting      Achievement        LeaderboardEntry                │
│  VerificationToken                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                     HERMES AI MODELS                                │
│                                                                     │
│  HermesConnection ── HermesConversation ── HermesMessage            │
│  HermesSkill       HermesTask           HermesInsight               │
│  AgentMemory                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                   SOCIAL & CONTENT MODELS                           │
│                                                                     │
│  SocialAccount ── PostLog ── ScheduledPost                         │
│  ContentLibrary                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Core Models

#### User
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id @default(cuid())) | Unique identifier |
| email | String (@unique) | User email |
| name | String | Display name |
| passwordHash | String | Bcrypt hashed password |
| role | UserRole | admin / affiliate / viewer |
| avatarUrl | String? | Profile avatar URL |
| image | String? | NextAuth image |
| emailVerified | DateTime? | Email verification timestamp |
| shopeeAffId | String? | Shopee Affiliate ID |
| isActive | Boolean | Account active status |
| lastLoginAt | DateTime? | Last login timestamp |
| Relations | | links[], clickRecords[], accounts[], sessions[] |

#### AffiliateLink
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| name | String | Link name |
| productUrl | String | Original product URL |
| affiliateUrl | String | Generated affiliate URL |
| productId | String? | Shopee product ID |
| productName | String? | Product name |
| productImage | String? | Product image URL |
| productPrice | Decimal? | Product price (RM) |
| commission | Decimal? | Commission amount |
| commissionRate | Decimal? | Commission percentage |
| category | String? | Product category |
| clicks | Int | Total clicks |
| conversions | Int | Total conversions |
| earnings | Decimal | Total earnings (RM) |
| ctr | Decimal? | Click-through rate |
| status | LinkStatus | active / paused / expired |
| shortCode | String (@unique) | Unique short code |
| expiresAt | DateTime? | Link expiration |
| Relations | | campaign?, user?, clickRecords[], conversionRecords[] |

#### Campaign
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| name | String | Campaign name |
| description | String? | Campaign description |
| status | CampaignStatus | active / paused / completed |
| budget | Decimal? | Campaign budget (RM) |
| spent | Decimal | Budget spent (RM) |
| startDate | DateTime? | Campaign start |
| endDate | DateTime? | Campaign end |
| Relations | | links[] |

#### ClickRecord
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| linkId | String | Foreign key → AffiliateLink |
| userId | String? | Foreign key → User |
| ip | String? | Visitor IP |
| country | String? | Visitor country |
| referer | String? | Referrer URL |
| device | String? | Device type |
| browser | String? | Browser name |
| os | String? | Operating system |
| converted | Boolean | Whether click led to conversion |

#### Conversion
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| linkId | String | Foreign key → AffiliateLink |
| orderId | String? | Shopee order ID |
| amount | Decimal | Order amount (RM) |
| commission | Decimal | Commission earned (RM) |
| status | ConversionStatus | pending / confirmed / rejected / paid |

#### Payout
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| userId | String? | Foreign key → User |
| method | String | Payout method (bank_transfer) |
| amount | Decimal | Payout amount (RM) |
| status | PayoutStatus | pending / processing / completed / failed |
| bankName | String? | Bank name |
| accountNo | String? | Bank account number |
| accountName | String? | Account holder name |

#### AppSetting
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| key | String (@unique) | Setting key |
| value | String | Setting value (JSON) |

#### EarningGoal
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| name | String | Goal name |
| targetAmount | Decimal | Target amount (RM) |
| currentAmount | Decimal | Current progress (RM) |
| period | GoalPeriod | monthly / weekly / yearly / custom |
| status | GoalStatus | active / achieved / failed |

#### Notification
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| type | String | Notification type |
| title | String | Notification title |
| description | String | Notification body |
| read | Boolean | Read status |

#### Achievement
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| userId | String? | Foreign key → User |
| type | String | Achievement type |
| title | String | Achievement title |
| description | String | Achievement description |
| icon | String | Icon identifier |
| earnedAt | DateTime | When earned |

#### LeaderboardEntry
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| userId | String? | Foreign key → User |
| userName | String | Display name |
| totalEarnings | Decimal | Total earnings (RM) |
| totalClicks | Int | Total clicks |
| totalConversions | Int | Total conversions |
| period | String | Ranking period |
| rank | Int | Position on leaderboard |

#### Referral
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| referrerId | String? | Foreign key → User (referrer) |
| referredEmail | String | Referred user email |
| referredName | String? | Referred user name |
| status | String | pending / active / converted |
| commission | Decimal? | Referral commission |

### HERMES AI Models

#### HermesConnection
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| name | String | Connection name |
| endpoint | String | API endpoint URL |
| apiKey | String? | API key |
| model | String | AI model (default: hermes-3) |
| isActive | Boolean | Connection active status |
| lastConnected | DateTime? | Last successful connection |
| status | String | connected / disconnected |

#### HermesConversation
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| connectionId | String | Foreign key → HermesConnection |
| title | String | Conversation title |
| summary | String? | Conversation summary |
| messageCount | Int | Number of messages |
| isActive | Boolean | Conversation active status |
| Relations | | messages[] |

#### HermesMessage
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| conversationId | String | Foreign key → HermesConversation |
| role | String | system / user / assistant |
| content | String | Message content |
| tokens | Int? | Token count |
| metadata | String? | JSON metadata |

#### HermesSkill
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| name | String | Skill name |
| description | String | Skill description |
| category | String | Skill category |
| code | String | Skill implementation |
| trigger | String? | Trigger phrase |
| status | HermesSkillStatus | active / draft / archived / learning |
| usageCount | Int | Times used |
| successRate | Decimal? | Success percentage |
| version | Int | Skill version |
| learnedFrom | String? | Learning source |

#### HermesTask
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| name | String | Task name |
| description | String? | Task description |
| schedule | String? | Cron expression |
| skillId | String? | Linked skill |
| status | String | scheduled / running / completed / failed |
| lastRunAt | DateTime? | Last execution time |
| nextRunAt | DateTime? | Next scheduled run |
| runCount | Int | Times executed |
| lastResult | String? | Last execution result |

#### HermesInsight
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| type | String | trend / opportunity / alert / recommendation |
| title | String | Insight title |
| description | String | Insight description |
| severity | String | info / warning / critical |
| data | String? | JSON payload |
| isRead | Boolean | Read status |
| isActioned | Boolean | Action taken status |

#### AgentMemory
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| agentId | String | Agent identifier |
| sessionId | String? | Session identifier |
| role | String | Memory role context |
| content | String | Memory content |
| metadata | String? | JSON metadata |

### Social & Content Models

#### ScheduledPost
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| caption | String | Post caption text |
| platforms | String | JSON array of platform names |
| productUrl | String? | Linked product URL |
| affiliateLink | String? | Affiliate link |
| imageUrl | String? | Image URL |
| hashtags | String? | JSON array of hashtags |
| status | String | scheduled / publishing / published / failed / partial |
| scheduledAt | DateTime | Scheduled posting time |
| publishedAt | DateTime? | Actual publish time |
| result | String? | JSON with platform results |
| retryCount | Int | Retry attempts |
| errorMessage | String? | Error details |

#### ContentLibrary
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| type | String | caption / script / hashtags / live_script / review / comparison |
| platform | String | tiktok / instagram / facebook / youtube / shopee_live |
| niche | String? | Content niche |
| product | String? | Product name |
| content | String | Generated content |
| language | String | english / bahasa / manglish |
| tone | String | casual / professional / excited / funny |
| usageCount | Int | Times used |
| isFavorite | Boolean | Favorite status |

#### SocialAccount
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| userId | String | Foreign key → User |
| platform | String | facebook / instagram / tiktok / twitter |
| platformUserId | String | Platform user ID |
| platformUsername | String? | Platform username |
| accessToken | String | OAuth access token |
| refreshToken | String? | OAuth refresh token |
| expiresAt | DateTime? | Token expiration |
| isConnected | Boolean | Connection status |
| isDemo | Boolean | Demo mode flag |

#### PostLog
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| scheduledPostId | String | Foreign key → ScheduledPost |
| platform | String | Platform name |
| status | String | pending / publishing / published / failed |
| attempt | Int | Attempt number |
| maxAttempts | Int | Max retry attempts |
| platformPostId | String? | Platform's post ID |
| platformUrl | String? | URL of published post |
| errorMessage | String? | Error details |

### Auth Models (NextAuth)

#### Account
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| userId | String | Foreign key → User |
| type | String | Provider type |
| provider | String | Provider name |
| providerAccountId | String | Provider account ID |
| refresh_token | String? | OAuth refresh token |
| access_token | String? | OAuth access token |
| expires_at | Int? | Token expiration |
| token_type | String? | Token type |
| scope | String? | OAuth scope |
| id_token | String? | ID token |
| session_state | String? | Session state |

#### Session
| Field | Type | Description |
|-------|------|-------------|
| id | String (@id) | Unique identifier |
| sessionToken | String (@unique) | Session token |
| userId | String | Foreign key → User |
| expires | DateTime | Expiration timestamp |

#### VerificationToken
| Field | Type | Description |
|-------|------|-------------|
| identifier | String | Token identifier |
| token | String (@unique) | Verification token |
| expires | DateTime | Expiration timestamp |

### Enums

```
LinkStatus:       active | paused | expired
CampaignStatus:   active | paused | completed
ConversionStatus: pending | confirmed | rejected | paid
PayoutStatus:     pending | processing | completed | failed
GoalStatus:       active | achieved | failed
GoalPeriod:       monthly | weekly | yearly | custom
UserRole:         admin | affiliate | viewer
HermesSkillStatus: active | draft | archived | learning
```

---

## Design System

### Minimalist Brutalism Philosophy

TheViralFindsMY uses a **"Minimalist Brutalism"** design system that combines:

- **Stark contrasts** — Deep navy backgrounds with electric blue accents
- **Sharp edges** — Brutalist 4px box-shadow hovers, 0 border-radius
- **Electric energy** — Acid lime (#CCFF00) accent on Electric Blue (#0066FF)
- **Glass morphism** — Translucent panels with backdrop blur
- **Animated gradients** — Shifting brand colors in borders and text
- **Custom animations** — Glitch text, neon flicker, pulse glow effects

### Color System (OKLCH)

All colors use the **OKLCH** color space for perceptual uniformity across light and dark modes:

#### Light Mode
| Token | OKLCH | Hex Equivalent | Usage |
|-------|-------|---------------|-------|
| `--primary` | oklch(0.546 0.232 264) | #0066FF | Electric Blue — buttons, links, active states |
| `--shopee` | oklch(0.546 0.232 264) | #0066FF | Brand primary |
| `--lime` | oklch(0.956 0.218 128) | #CCFF00 | Acid Lime — CTAs, highlights |
| `--hermes` | oklch(0.65 0.22 280) | — | Electric Violet — AI features |
| `--profit` | oklch(0.75 0.22 145) | — | Green — earnings, profit indicators |
| `--background` | oklch(0.985 0.002 264) | — | Near-white with cool undertone |
| `--foreground` | oklch(0.13 0.03 264) | — | Deep navy-black |

#### Dark Mode
| Token | OKLCH | Usage |
|-------|-------|-------|
| `--background` | oklch(0.13 0.025 264) | Deep Navy (#0A1628) |
| `--card` | oklch(0.17 0.03 264) | Navy card (#0F1F38) |
| `--primary` | oklch(0.6 0.232 264) | Brighter blue for dark |
| `--lime` | oklch(0.956 0.218 128) | Acid Lime stays vibrant |

### Custom Animations

| Animation | CSS Class | Description |
|-----------|-----------|-------------|
| **Shimmer** | `.animate-shimmer` | Sweeping light effect (2s) |
| **Pulse Glow** | `.animate-pulse-glow` | Electric blue ring pulse (2s) |
| **Lime Pulse** | `.animate-lime-pulse` | Acid lime CTA pulse (2.5s) |
| **Float** | `.animate-float` | Subtle vertical float (3s) |
| **Gradient Shift** | `.animate-gradient` | Background position animation (8s) |
| **Glitch Text** | `.glitch-text` | RGB split glitch effect (3s) |
| **Neon Flicker** | `.neon-flicker` | Neon sign flicker (4s) |
| **Badge Pulse** | `.badge-pulse` | Scale pulse for badges (2s) |
| **Bell Wiggle** | `.animate-bell-wiggle` | Notification bell shake (0.6s) |
| **Message In** | `.animate-message-in` | Chat message slide-in (0.3s) |
| **Typing Dot** | `.typing-dot` | Chat typing indicator (1.4s) |
| **Soft Glow** | `.animate-soft-glow` | Hermes/Shopee color cycle (4s) |
| **Banner Shimmer** | `.shimmer-banner` | Sweeping light banner (4s) |
| **Pulse Ring** | `.pulse-ring` | Expanding ring pulse (1.8s) |

### Glass Morphism

| Class | Backdrop Blur | Background | Border |
|-------|--------------|------------|--------|
| `.glass` | 12px | rgba(255,255,255,0.05) | rgba(255,255,255,0.1) |
| `.glass-strong` | 20px | rgba(255,255,255,0.1) | rgba(255,255,255,0.15) |

Dark mode variants use rgba(10,22,40) base with lower opacity borders.

### Glow Shadows

| Class | Color | Effect |
|-------|-------|--------|
| `.glow-shopee` | Electric Blue | Blue glow + subtle border |
| `.glow-hermes` | Electric Violet | Purple glow + subtle border |
| `.glow-lime` | Acid Lime | Lime glow + subtle border |
| `.glow-profit` | Green | Green glow + subtle border |

### Brutalist Card Hovers

```css
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 4px 4px 0 oklch(0.13 0.03 264 / 12%);  /* Light */
  box-shadow: 4px 4px 0 oklch(0.546 0.232 264 / 25%); /* Dark */
}
```

### Animated Gradient Borders

```css
.gradient-border::before {
  background: linear-gradient(120deg, var(--shopee), var(--lime), var(--hermes), var(--shopee));
  background-size: 300% 300%;
  animation: gradient-shift 6s ease infinite;
}
```

### Mobile / PWA Styling

| Feature | Implementation |
|---------|---------------|
| Safe Area Insets | `env(safe-area-inset-bottom)` on all edges |
| Standalone Mode | Hidden scrollbars, safe area padding |
| Touch Targets | Minimum 44×44px (`.touch-target`) |
| Active Press | Scale(0.97) on touch devices |
| Pull to Refresh | Custom indicator with haptic feedback |
| Bottom Nav | 3.5rem + safe area inset |
| Scrollbar | 4px brutalist thin style, blue-tinted |

### Accessibility

| Feature | Implementation |
|---------|---------------|
| `prefers-reduced-motion` | All animations disabled (0.01ms duration) |
| `focus-visible` | 2px solid Electric Blue outline |
| WCAG AA | Glass panel text contrast overrides |
| Semantic HTML | `<main>`, `<nav>`, `<section>` throughout |
| Touch Action | `manipulation` on interactive elements |
| Lazy Image | Opacity transition on load |

---

## Pricing Tiers (RM)

| Feature | 🆓 Free | ⚡ Pro | 🏢 Business | 🏛️ Enterprise |
|---------|---------|--------|-------------|-------------|
| **Price** | RM 0/mo | RM 49/mo | RM 149/mo | Custom |
| **Products** | 50 | 500 | Unlimited | Unlimited |
| **Affiliate Links** | 20 | 200 | Unlimited | Unlimited |
| **AI Content** | 5/mo | 50/mo | Unlimited | Unlimited |
| **Platforms** | 1 (Shopee) | All (Shopee+TikTok+Lazada) | All + Live | All + Custom |
| **HERMES AI** | ❌ | ✅ Chat + Skills | ✅ Proactive | ✅ Custom Model |
| **Profit Scoring** | Basic | Full | Full + History | Full + API |
| **Auto-Post** | ❌ | 3 platforms | All platforms | All + API |
| **A/B Testing** | ❌ | ❌ | ✅ 3 variants | ✅ Unlimited |
| **Audience AI** | ❌ | ❌ | ✅ | ✅ Advanced |
| **Team Members** | 1 | 1 | 3 | Unlimited |
| **API Access** | ❌ | ❌ | ✅ Read-only | ✅ Full CRUD |
| **White-Label** | ❌ | ❌ | ❌ | ✅ |
| **Support** | Community | Email | Priority | Dedicated SLA |
| **SLA** | — | — | 99.5% | 99.9% |

### Revenue Projection (Conservative)

```
Free Users:     10,000 (acquisition funnel)
Pro Users:        500 × RM49  = RM24,500/month
Business Users:    50 × RM149 = RM7,450/month
Enterprise:         5 × RM2,000 = RM10,000/month
─────────────────────────────────────────────
Total: ~RM42,000/month (RM504K/year)
```

---

## Malaysian Market Focus

This platform is purpose-built for the Malaysian Shopee affiliate ecosystem:

### Commission Structure
| Type | Rate | Notes |
|------|------|-------|
| Base Commission | 2.5% - 12% | Product category dependent |
| Commission XTRA | Up to 40-50% extra | Promotional periods |
| Shopee Live | Up to 80% | Live streaming commissions |

### Top Malaysian Affiliates (Reference)
| Affiliate | Lifetime Earnings | Platform |
|-----------|------------------|----------|
| Sabrinabeautyhub | RM5M+ | TikTok + Shopee |
| Faisaldotmy | RM5M+ | TikTok |
| Erawan1308 | RM7,200/mo | Multi-platform |

### Best Platforms for Malaysian Affiliates
| Platform | Organic Reach | Conversion | Best For |
|----------|--------------|------------|----------|
| TikTok | Highest | High | Beauty, Fashion, Gadgets |
| Shopee Live | Medium | Very High | Flash sales, Demo |
| Instagram Reels | Medium | Medium | Beauty, Lifestyle |
| Facebook | Medium | Medium | General, Family products |

### Hashtag Strategy
| Hashtag | Usage | Category |
|---------|-------|----------|
| #RacunShopee | Viral products | General |
| #Budol | Wishlist items | General |
| #SkincareMalaysia | Beauty products | Beauty |
| #ShopeeMY | Platform tag | General |
| #ReviewMalaysia | Product reviews | General |
| #BarangMurah | Budget finds | Value |

---

## PWA & Offline Support

The app is a full Progressive Web App with:

- **Service Worker** (`public/sw.js`) — Offline caching and background sync
- **Web App Manifest** (`public/manifest.json`) — Installable on iOS and Android
- **PWA Icons** — Full icon set from 16px to 512px (maskable support)
- **Offline Banner** — Visual indicator when offline
- **Pull-to-Refresh** — Mobile gesture with haptic feedback
- **Network Status Hook** — Real-time connection quality monitoring
- **Standalone Mode** — Optimized for installed app experience

---

## Improvement Roadmap

### Fasa 1: Fix & Strengthen Core ✅ (Q2 2025)

| # | Improvement | Status | Priority |
|---|------------|--------|----------|
| 1.1 | User Authentication (NextAuth.js) | ✅ Complete | URGENT |
| 1.2 | Real Platform API Posting (FB/IG/TikTok) | ✅ Complete | HIGH |
| 1.3 | Real-Time WebSocket Notifications | ✅ Complete | HIGH |
| 1.4 | Mobile UX Polish & PWA Support | ✅ Complete | MEDIUM |
| 1.5 | Data Export (CSV/PDF Reports) | ✅ Complete | MEDIUM |
| 1.6 | Error Handling & Edge Case Hardening | ✅ Complete | MEDIUM |

### Fasa 2: Expand Platforms ✅ (Q3 2025)

| # | Improvement | Status | Priority |
|---|------------|--------|----------|
| 2.1 | TikTok Shop Affiliate API Integration | ✅ Complete | URGENT |
| 2.2 | Lazada Affiliate Integration | ✅ Complete | HIGH |
| 2.3 | Shopee Live Dashboard (80% commission!) | ✅ Complete | HIGH |
| 2.4 | Multi-Platform Commission Comparison | ✅ Complete | HIGH |
| 2.5 | Unified Earnings Dashboard (All Platforms) | ✅ Complete | HIGH |
| 2.6 | Cross-Platform Product Matcher | ✅ Complete | MEDIUM |

### Fasa 3: AI Superpowers ✅ (Q4 2025)

| # | Improvement | Status | Priority |
|---|------------|--------|----------|
| 3.1 | AI Product Recommender (audience-based) | ✅ Complete | HIGH |
| 3.2 | AI Video Thumbnail Generator | ✅ Complete | HIGH |
| 3.3 | Smart Commission XTRA Alert Bot | ✅ Complete | HIGH |
| 3.4 | AI A/B Content Testing (3 variants) | ✅ Complete | MEDIUM |
| 3.5 | HERMES Proactive Insights (push, not pull) | ✅ Complete | MEDIUM |
| 3.6 | AI Audience Analyzer | ✅ Complete | MEDIUM |
| 3.7 | Auto-Hashtag Optimizer | ✅ Complete | LOW |
| 3.8 | AI Content Calendar Generator | ✅ Complete | MEDIUM |

### Fasa 4: Monetize & Scale ✅ (Q1 2026)

| # | Improvement | Status | Priority |
|---|------------|--------|----------|
| 4.1 | Freemium Pricing Model Implementation | ✅ Complete | URGENT |
| 4.2 | Affiliate Content Marketplace | ✅ Complete | HIGH |
| 4.3 | Team/Agency Multi-User Dashboard | ✅ Complete | HIGH |
| 4.4 | White-Label Option for Enterprises | ✅ Complete | MEDIUM |
| 4.5 | API as a Service (Developer Access) | ✅ Complete | MEDIUM |

### Fasa 5: Shopee Pro ✅ (Q2 2026)

| # | Improvement | Status | Priority |
|---|------------|--------|----------|
| 5.1 | Shopee Open API v2 Client Library | ✅ Complete | URGENT |
| 5.2 | Market Intelligence Dashboard | ✅ Complete | HIGH |
| 5.3 | Account Health Monitor | ✅ Complete | HIGH |
| 5.4 | Promotion Hub | ✅ Complete | HIGH |
| 5.5 | Shopee Ads Dashboard | ✅ Complete | HIGH |
| 5.6 | Seller Chat | ✅ Complete | MEDIUM |

> **Full implementation checklist:** See [CHECKLIST.md](./CHECKLIST.md) for detailed task tracking.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- **TypeScript:** Strict mode enabled, no `any` types
- **Components:** Use shadcn/ui components, not custom implementations
- **Styling:** Tailwind CSS utility classes, no inline styles
- **API Routes:** Follow the established response format `{ success, data, meta }`
- **State:** Zustand for client state, TanStack Query for server state
- **Animations:** Framer Motion with `prefers-reduced-motion` support
- **Accessibility:** WCAG AA compliance, semantic HTML, ARIA labels

---

## License

This project is proprietary software for TheViralFindsMY.

---

<p align="center">
  <strong>Built with ❤️ for Malaysian Affiliates 🇲🇾</strong><br/>
  <em>TheViralFindsMY v8.1 — Discover. Promote. Earn. Across Platforms. ⚡</em>
</p>
