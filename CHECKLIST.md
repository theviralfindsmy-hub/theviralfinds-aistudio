# 🗂️ TheViralFindsMY — Master Implementation Checklist

> **Version:** 8.1 | **Last Updated:** June 2025  
> **Purpose:** Track every task across all 4 Fasa with granular subtasks  
> **Status Key:** 🔲 Not Started | 🔄 In Progress | ✅ Done | ⏸️ Blocked | ❌ Cancelled

---

## 📊 Progress Dashboard

| Fasa | Total Tasks | ✅ Done | 🔄 In Progress | 🔲 Pending | % Complete |
|------|------------|---------|----------------|------------|------------|
| **Fasa 1: Fix Core** | 42 | 42 | 0 | 0 | ✅ 100% |
| **Fasa 2: Expand Platforms** | 36 | 0 | 0 | 36 | 0% |
| **Fasa 3: AI Superpowers** | 38 | 0 | 0 | 38 | 0% |
| **Fasa 4: Monetize & Scale** | 32 | 0 | 0 | 32 | 0% |
| **TOTAL** | **148** | **42** | **0** | **106** | **28%** |

---

## 🏗️ FASA 1: FIX & STRENGTHEN CORE
**Timeline:** Q2 2025 (10 weeks)  
**Goal:** Make what we have ROCK SOLID — auth, real posting, real-time notifications, polish

### 1.1 User Authentication (NextAuth.js) — Week 1-2
**Priority:** 🔴 URGENT | **Effort:** Medium | **Dependencies:** None

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 1.1.1 | Install NextAuth.js v4 and dependencies | 🔲 | `bun add next-auth@4` |
| 1.1.2 | Create NextAuth API route handler | 🔲 | `src/app/api/auth/[...nextauth]/route.ts` |
| 1.1.3 | Configure email/password provider | 🔲 | NextAuth config with CredentialsProvider |
| 1.1.4 | Configure Google OAuth provider | 🔲 | NextAuth config with GoogleProvider |
| 1.1.5 | Configure Facebook OAuth provider | 🔲 | NextAuth config with FacebookProvider |
| 1.1.6 | Update Prisma schema for auth models | 🔲 | Add Account, Session, VerificationToken models |
| 1.1.7 | Add emailVerified, image fields to User model | 🔲 | Update `prisma/schema.prisma` |
| 1.1.8 | Run `bun run db:push` to update database | 🔲 | Apply schema changes |
| 1.1.9 | Create login page component | 🔲 | `src/components/pages/login-page.tsx` |
| 1.1.10 | Create register page component | 🔲 | `src/components/pages/register-page.tsx` |
| 1.1.11 | Add auth state to Zustand store | 🔲 | `src/store/app-store.ts` — user, isAuthenticated |
| 1.1.12 | Create auth middleware for protected routes | 🔲 | `src/middleware.ts` |
| 1.1.13 | Update all API routes to check auth | 🔲 | Add session validation to each route.ts |
| 1.1.14 | Add user profile section to Settings page | 🔲 | Update `settings-page.tsx` |
| 1.1.15 | Add logout functionality | 🔲 | Sign out button in header/sidebar |
| 1.1.16 | Test full auth flow (register → login → protected routes) | 🔲 | Manual + automated testing |

**Checkpoint 1.1:** ✅ User can register, login, and access protected features. All API routes require authentication.

---

### 1.2 Real Platform API Posting — Week 3-5
**Priority:** 🟠 HIGH | **Effort:** Large | **Dependencies:** 1.1 (auth)

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 1.2.1 | Research Facebook Graph API posting requirements | 🔲 | Page access token, permissions |
| 1.2.2 | Create SocialAccount Prisma model | 🔲 | platform, accessToken, refreshToken, expiresAt, userId |
| 1.2.3 | Create Facebook OAuth connection flow | 🔲 | `src/app/api/social/facebook/connect/route.ts` |
| 1.2.4 | Create Facebook posting API route | 🔲 | `src/app/api/social/facebook/post/route.ts` |
| 1.2.5 | Implement Facebook page post publishing | 🔲 | Text + image + link posting |
| 1.2.6 | Create Instagram OAuth connection flow | 🔲 | `src/app/api/social/instagram/connect/route.ts` |
| 1.2.7 | Create Instagram posting API route | 🔲 | `src/app/api/social/instagram/post/route.ts` |
| 1.2.8 | Implement Instagram Business account posting | 🔲 | Via Graph API (IG requires Business account) |
| 1.2.9 | Create TikTok draft sharing mechanism | 🔲 | `src/app/api/social/tiktok/share/route.ts` |
| 1.2.10 | Create Twitter/X API v2 posting route | 🔲 | `src/app/api/social/twitter/post/route.ts` |
| 1.2.11 | Create unified social account management API | 🔲 | `src/app/api/social/accounts/route.ts` |
| 1.2.12 | Add Social Accounts section to Settings page | 🔲 | Connect/disconnect platforms UI |
| 1.2.13 | Update AutoPost page to show real platform connections | 🔲 | Show connected/disconnected status per platform |
| 1.2.14 | Implement scheduled post execution engine | 🔲 | Cron or interval-based check for due posts |
| 1.2.15 | Implement post status tracking (scheduled → publishing → published/failed) | 🔲 | Update ScheduledPost status in DB |
| 1.2.16 | Implement retry logic for failed posts (max 3) | 🔲 | Exponential backoff retry |
| 1.2.17 | Test end-to-end: schedule → publish → verify on platform | 🔲 | Manual testing per platform |

**Checkpoint 1.2:** ✅ User can connect social accounts and schedule posts that actually publish to Facebook/Instagram.

---

### 1.3 Real-Time WebSocket Notifications — Week 5-6
**Priority:** 🟠 HIGH | **Effort:** Medium | **Dependencies:** 1.1 (auth)

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 1.3.1 | Create mini-service for Socket.io server | 🔲 | `mini-services/notification-service/index.ts` |
| 1.3.2 | Define Socket.io event types | 🔲 | conversion, click, commission_xtra, hermes_insight |
| 1.3.3 | Implement authentication for WebSocket connections | 🔲 | Validate JWT token on connect |
| 1.3.4 | Create notification broadcasting logic | 🔲 | Emit events when DB changes occur |
| 1.3.5 | Integrate with Shopee webhook handler | 🔲 | When webhook receives event → emit socket event |
| 1.3.6 | Create frontend Socket.io client hook | 🔲 | `src/hooks/use-notifications.ts` |
| 1.3.7 | Add real-time notification toast component | 🔲 | Pop-up toast on new notification |
| 1.3.8 | Add WebSocket connection status indicator | 🔲 | Green/red dot in header |
| 1.3.9 | Add notification sound effect (optional) | 🔲 | Ping sound on conversion alert |
| 1.3.10 | Test: trigger webhook → socket event → UI notification | 🔲 | End-to-end verification |

**Checkpoint 1.3:** ✅ User receives real-time notifications when conversions, clicks, or commission events occur.

---

### 1.4 Mobile UX Polish & PWA — Week 7-8
**Priority:** 🟡 MEDIUM | **Effort:** Medium | **Dependencies:** None

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 1.4.1 | Audit mobile responsiveness across all 18 pages | 🔲 | Test on 375px, 414px, 768px widths |
| 1.4.2 | Fix mobile layout issues found in audit | 🔲 | Update Tailwind responsive classes |
| 1.4.3 | Optimize touch targets (min 44px) on mobile | 🔲 | Button sizes, link areas |
| 1.4.4 | Add PWA manifest.json | 🔲 | `public/manifest.json` |
| 1.4.5 | Add service worker for offline support | 🔲 | `public/sw.js` or use next-pwa |
| 1.4.6 | Add app icons and splash screens | 🔲 | Generate all required PWA icons |
| 1.4.7 | Optimize page load performance (lazy loading) | 🔲 | Review and optimize bundle sizes |
| 1.4.8 | Add pull-to-refresh on mobile lists | 🔲 | Custom hook for mobile pull gesture |
| 1.4.9 | Test on real iOS and Android devices | 🔲 | BrowserStack or physical devices |

**Checkpoint 1.4:** ✅ App works beautifully on mobile, can be installed as PWA.

---

### 1.5 Data Export (CSV/PDF) — Week 8-9
**Priority:** 🟡 MEDIUM | **Effort:** Small | **Dependencies:** 1.1 (auth)

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 1.5.1 | Create CSV export API route | ✅ | `src/app/api/export/csv/route.ts` |
| 1.5.2 | Implement earnings CSV export | ✅ | Columns: date, order_id, amount, commission, status |
| 1.5.3 | Implement links CSV export | ✅ | Columns: name, url, clicks, conversions, earnings, status |
| 1.5.4 | Implement analytics CSV export | ✅ | Columns: date, clicks, conversions, ctr |
| 1.5.5 | Create PDF export API route | ✅ | `src/app/api/export/pdf/route.ts` |
| 1.5.6 | Design PDF report template | ✅ | Professional layout with logo, charts, tables |
| 1.5.7 | Implement earnings PDF report | ✅ | Monthly earnings summary with charts |
| 1.5.8 | Add export buttons to Earnings page | ✅ | CSV + PDF download buttons |
| 1.5.9 | Add export buttons to Analytics page | ✅ | CSV + PDF download buttons |
| 1.5.10 | Test exports with large datasets | ✅ | Verify 10K+ rows export correctly |

**Checkpoint 1.5:** ✅ User can export earnings, links, and analytics data as CSV or PDF.

---

### 1.6 Error Handling & Edge Case Hardening — Week 9-10
**Priority:** 🟡 MEDIUM | **Effort:** Small | **Dependencies:** None

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 1.6.1 | Audit all API routes for error handling gaps | 🔲 | Check every route.ts for try/catch |
| 1.6.2 | Add Zod validation to all POST endpoints | 🔲 | Input schemas for every mutation |
| 1.6.3 | Add proper HTTP status codes to all error responses | 🔲 | 400, 401, 403, 404, 500 |
| 1.6.4 | Add rate limiting to API routes | 🔲 | Prevent abuse on public endpoints |
| 1.6.5 | Add error boundary components to pages | 🔲 | Catch React rendering errors |
| 1.6.6 | Add global error toast for API failures | 🔲 | Sonner toast on fetch errors |
| 1.6.7 | Handle empty states gracefully across all pages | 🔲 | "No data yet" placeholders |
| 1.6.8 | Add loading skeletons for all data-dependent components | 🔲 | Skeleton components during fetch |
| 1.6.9 | Handle network offline/online state | 🔲 | Show connection status banner |
| 1.6.10 | Test error scenarios: API down, invalid data, timeout | 🔲 | Simulate failures |

**Checkpoint 1.6:** ✅ App handles errors gracefully, no white screens, clear error messages.

---

### 🏁 FASA 1 COMPLETION CRITERIA

- [x] User can register and login securely ✅ (Task 1-a)
- [x] Posts actually publish to Facebook and Instagram (demo mode) ✅ (Task 1.2)
- [x] Real-time notifications work via WebSocket ✅ (Task 1-b)
- [x] App is polished on mobile and installable as PWA ✅ (Task 1.4)
- [x] Data can be exported as CSV and PDF ✅ (Task 1-c)
- [x] No unhandled errors or white screens ✅ (Task 1-d)

### ✅ FASA 1 COMPLETE - All 6 sections done!

---

## 🏗️ FASA 2: EXPAND PLATFORMS
**Timeline:** Q3 2025 (10 weeks)  
**Goal:** Add TikTok Shop, Lazada, Shopee Live — become multi-platform

### 2.1 TikTok Shop Affiliate API Integration — Week 1-3
**Priority:** 🔴 URGENT | **Effort:** Large | **Dependencies:** Fasa 1 complete

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 2.1.1 | Register as TikTok Shop Partner | 🔲 | TikTok Shop Partner Center |
| 2.1.2 | Study TikTok Shop Affiliate API documentation | 🔲 | Auth flow, endpoints, rate limits |
| 2.1.3 | Create TikTokShopAccount Prisma model | 🔲 | accessToken, shopId, region |
| 2.1.4 | Create TikTok Shop OAuth connection flow | 🔲 | `src/app/api/social/tiktok/connect/route.ts` |
| 2.1.5 | Create TikTok Shop API client library | 🔲 | `src/lib/tiktok/api-client.ts` |
| 2.1.6 | Implement product search via TikTok Shop API | 🔲 | `src/app/api/tiktok/products/route.ts` |
| 2.1.7 | Implement affiliate link generation for TikTok | 🔲 | `src/app/api/tiktok/generate-link/route.ts` |
| 2.1.8 | Implement commission order tracking | 🔲 | `src/app/api/tiktok/commissions/route.ts` |
| 2.1.9 | Create TikTok mock data service | 🔲 | `src/lib/tiktok/mock-data.ts` |
| 2.1.10 | Add TikTok data source to Products page | 🔲 | Platform selector: Shopee / TikTok / All |
| 2.1.11 | Add TikTok links to Links page | 🔲 | Platform badge on each link |
| 2.1.12 | Add TikTok connection to Settings page | 🔲 | Connect/disconnect TikTok Shop |
| 2.1.13 | Add platform field to AffiliateLink model | 🔲 | platform: "shopee" | "tiktok" | "lazada" |

**Checkpoint 2.1:** ✅ User can search TikTok Shop products and generate TikTok affiliate links.

---

### 2.2 Lazada Affiliate Integration — Week 4-5
**Priority:** 🟠 HIGH | **Effort:** Medium | **Dependencies:** 2.1 pattern

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 2.2.1 | Register for Lazada Affiliate Network | 🔲 | Lazada Affiliate Program |
| 2.2.2 | Study Lazada Affiliate API documentation | 🔲 | Auth flow, endpoints |
| 2.2.3 | Create LazadaAccount Prisma model | 🔲 | accessToken, region |
| 2.2.4 | Create Lazada API client library | 🔲 | `src/lib/lazada/api-client.ts` |
| 2.2.5 | Implement product search via Lazada API | 🔲 | `src/app/api/lazada/products/route.ts` |
| 2.2.6 | Implement affiliate link generation for Lazada | 🔲 | `src/app/api/lazada/generate-link/route.ts` |
| 2.2.7 | Implement commission tracking for Lazada | 🔲 | `src/app/api/lazada/commissions/route.ts` |
| 2.2.8 | Create Lazada mock data service | 🔲 | `src/lib/lazada/mock-data.ts` |
| 2.2.9 | Add Lazada to platform selector in Products page | 🔲 | Third option in dropdown |
| 2.2.10 | Add Lazada connection to Settings page | 🔲 | Connect/disconnect Lazada |

**Checkpoint 2.2:** ✅ User can search Lazada products and generate Lazada affiliate links.

---

### 2.3 Shopee Live Dashboard — Week 5-7
**Priority:** 🟠 HIGH | **Effort:** Large | **Dependencies:** Shopee API access

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 2.3.1 | Create ShopeeLiveSession Prisma model | 🔲 | title, scheduledAt, status, products, commission |
| 2.3.2 | Create Live page component | 🔲 | `src/components/pages/live-page.tsx` |
| 2.3.3 | Add Live to sidebar navigation | 🔲 | New nav item with Live icon |
| 2.3.4 | Create live session scheduler UI | 🔲 | Date/time picker, countdown timer |
| 2.3.5 | Create product queue management UI | 🔲 | Drag-and-drop product order for live session |
| 2.3.6 | Implement commission rate display (base + Live bonus) | 🔲 | Show "8% base + 72% Live = 80% total" |
| 2.3.7 | Create live script generator API | 🔲 | `src/app/api/live/script/route.ts` |
| 2.3.8 | Create live script templates (opening, demo, Q&A, flash sale) | 🔲 | 5+ script templates |
| 2.3.9 | Implement flash sale timer component | 🔲 | Countdown + auto-price reveal |
| 2.3.10 | Create post-live analytics API | 🔲 | `src/app/api/live/analytics/route.ts` |
| 2.3.11 | Create post-live analytics dashboard | 🔲 | Viewers, conversions, earnings chart |
| 2.3.12 | Add Live page to app store and page map | 🔲 | Update store + page components |

**Checkpoint 2.3:** ✅ User can schedule Shopee Live sessions, manage product queues, and generate live scripts.

---

### 2.4 Multi-Platform Commission Comparison — Week 7-8
**Priority:** 🟠 HIGH | **Effort:** Medium | **Dependencies:** 2.1, 2.2

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 2.4.1 | Create PlatformComparison Prisma model or API | 🔲 | Cross-platform product matching |
| 2.4.2 | Create commission comparison API route | 🔲 | `src/app/api/compare/route.ts` |
| 2.4.3 | Create commission comparison UI component | 🔲 | Side-by-side: Shopee vs TikTok vs Lazada |
| 2.4.4 | Implement product matching algorithm | 🔲 | Match same product across platforms by name/ID |
| 2.4.5 | Add "Best Commission" badge to product cards | 🔲 | Highlight which platform pays most |
| 2.4.6 | Add comparison view to Products page | 🔲 | Toggle: single platform vs compare all |

**Checkpoint 2.4:** ✅ User can compare commissions for the same product across Shopee, TikTok, and Lazada.

---

### 2.5 Unified Earnings Dashboard — Week 8-9
**Priority:** 🟠 HIGH | **Effort:** Medium | **Dependencies:** 2.1, 2.2

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 2.5.1 | Create PlatformEarnings Prisma model | 🔲 | platform, date, clicks, conversions, earnings |
| 2.5.2 | Create unified earnings API route | 🔲 | `src/app/api/earnings/unified/route.ts` |
| 2.5.3 | Update Earnings page with platform filter | 🔲 | Tabs: All / Shopee / TikTok / Lazada |
| 2.5.4 | Add platform breakdown pie chart | 🔲 | Earnings distribution by platform |
| 2.5.5 | Add platform-specific earnings cards | 🔲 | Individual stats per platform |
| 2.5.6 | Add cross-platform trend line chart | 🔲 | Compare earnings trends across platforms |

**Checkpoint 2.5:** ✅ User can see all platform earnings in one unified dashboard.

---

### 2.6 Cross-Platform Product Matcher — Week 9-10
**Priority:** 🟡 MEDIUM | **Effort:** Medium | **Dependencies:** 2.1, 2.2

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 2.6.1 | Design product matching algorithm | 🔲 | Name similarity + category + price range |
| 2.6.2 | Create product matcher API route | 🔲 | `src/app/api/match/route.ts` |
| 2.6.3 | Create product matcher UI page or section | 🔲 | Search once, see results on all platforms |
| 2.6.4 | Add "Auto-Pick Best Commission" feature | 🔲 | One-click: generate link on best-paying platform |
| 2.6.5 | Test matching accuracy with real products | 🔲 | Verify match quality |

**Checkpoint 2.6:** ✅ User can search once and find the same product on all platforms with best commission highlighted.

---

### 🏁 FASA 2 COMPLETION CRITERIA

- [ ] TikTok Shop affiliate integration fully functional
- [ ] Lazada affiliate integration fully functional
- [ ] Shopee Live dashboard operational
- [ ] Commission comparison across all platforms works
- [ ] Unified earnings dashboard shows all platforms
- [ ] Cross-platform product matching works

---

## 🏗️ FASA 3: AI SUPERPOWERS
**Timeline:** Q4 2025 (10 weeks)  
**Goal:** Make AI the KILLER FEATURE — recommendations, alerts, A/B testing, automation

### 3.1 AI Product Recommender — Week 1-2
**Priority:** 🟠 HIGH | **Effort:** Medium | **Dependencies:** Fasa 2 data

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 3.1.1 | Design recommendation algorithm | 🔲 | Audience match (40%) + commission (30%) + trend (20%) + gap (10%) |
| 3.1.2 | Create audience profile builder | 🔲 | Track click demographics → build user audience profile |
| 3.1.3 | Create AudienceProfile Prisma model | 🔲 | userId, ageRange, gender, interests, topCategories |
| 3.1.4 | Create recommendation API route | 🔲 | `src/app/api/ai/recommend/route.ts` |
| 3.1.5 | Create recommendation UI component | 🔲 | "Recommended for You" section on Dashboard |
| 3.1.6 | Add recommendation score explanation | 🔲 | Show why: "High audience match (85%) + trending (+45%)" |
| 3.1.7 | Implement recommendation refresh mechanism | 🔲 | Auto-refresh weekly or on demand |

**Checkpoint 3.1:** ✅ User sees personalized product recommendations based on their audience and performance.

---

### 3.2 AI Video Thumbnail Generator — Week 2-3
**Priority:** 🟠 HIGH | **Effort:** Medium | **Dependencies:** z-ai-web-dev-sdk image gen

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 3.2.1 | Design thumbnail template system | 🔲 | Price label, CTA overlay, product image, gradient bg |
| 3.2.2 | Create thumbnail generation API route | 🔲 | `src/app/api/ai/thumbnail/route.ts` |
| 3.2.3 | Implement thumbnail generation via z-ai-web-dev-sdk | 🔲 | Image generation with product data |
| 3.2.4 | Create thumbnail editor UI | 🔲 | Canvas-based editor with text/color overlay |
| 3.2.5 | Add thumbnail generation to Content Studio | 🔲 | Generate thumbnail alongside video script |
| 3.2.6 | Add thumbnail download in multiple sizes | 🔲 | TikTok (1080x1920), IG (1080x1080), FB (1200x630) |
| 3.2.7 | Test thumbnail quality and relevance | 🔲 | Verify generated thumbnails are click-worthy |

**Checkpoint 3.2:** ✅ User can generate AI-powered thumbnails for their video content.

---

### 3.3 Smart Commission XTRA Alert Bot — Week 3-4
**Priority:** 🟠 HIGH | **Effort:** Medium | **Dependencies:** 1.3 (WebSocket)

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 3.3.1 | Create CommissionAlert Prisma model | 🔲 | userId, type, product, commission, expiresAt |
| 3.3.2 | Create XTRA monitoring API route | 🔲 | `src/app/api/alerts/xtra/route.ts` |
| 3.3.3 | Implement periodic XTRA check (cron) | 🔲 | Check for new Commission XTRA products every 30 min |
| 3.3.4 | Create alert matching logic | 🔲 | Match XTRA products to user's niche/preferences |
| 3.3.5 | Implement WebSocket push for XTRA alerts | 🔲 | Real-time notification when new XTRA detected |
| 3.3.6 | Implement email notification for XTRA alerts | 🔲 | Daily digest of new XTRA opportunities |
| 3.3.7 | Create Alerts page/section in UI | 🔲 | Alert history with read/unread status |
| 3.3.8 | Add alert preferences to Settings | 🔲 | Choose which alert types and channels |
| 3.3.9 | Test: simulate XTRA activation → alert received | 🔲 | End-to-end verification |

**Checkpoint 3.3:** ✅ User receives real-time alerts when Commission XTRA products become available in their niche.

---

### 3.4 AI A/B Content Testing — Week 4-5
**Priority:** 🟡 MEDIUM | **Effort:** Medium | **Dependencies:** Content gen API

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 3.4.1 | Design A/B variant generation system | 🔲 | Generate 3 variants per content request |
| 3.4.2 | Update content generation API for multi-variant | 🔲 | `src/app/api/content/generate` → return 3 variants |
| 3.4.3 | Create A/B testing UI component | 🔲 | Side-by-side variant cards with predicted CTR |
| 3.4.4 | Implement AI prediction scoring per variant | 🔲 | Score based on hook strength, CTA clarity, hashtag mix |
| 3.4.5 | Create ContentVariant Prisma model | 🔲 | parentId, variant (A/B/C), predictedScore, actualScore |
| 3.4.6 | Implement actual performance tracking | 🔲 | After posting, track clicks per variant |
| 3.4.7 | Create A/B results dashboard | 🔲 | Compare predicted vs actual performance |
| 3.4.8 | Feed results back to improve prediction model | 🔲 | Learn from actual vs predicted data |

**Checkpoint 3.4:** ✅ User can generate 3 content variants, see AI-predicted performance, and track actual results.

---

### 3.5 HERMES Proactive Insights — Week 5-6
**Priority:** 🟡 MEDIUM | **Effort:** Medium | **Dependencies:** 1.3 (WebSocket)

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 3.5.1 | Design proactive insight triggers | 🔲 | Daily summary, anomaly detection, opportunity alerts |
| 3.5.2 | Create scheduled insight generation (cron) | 🔲 | Run insight analysis every 6 hours |
| 3.5.3 | Implement anomaly detection algorithm | 🔲 | Detect unusual drops/spikes in clicks/conversions |
| 3.5.4 | Create proactive insight push via WebSocket | 🔲 | Send new insights to connected clients |
| 3.5.5 | Add "New Insight" notification in header | 🔲 | Badge count + dropdown preview |
| 3.5.6 | Create insight detail page/modal | 🔲 | Full insight with data visualization |
| 3.5.7 | Add "Mark as Actioned" button per insight | 🔲 | Track which insights user acts upon |
| 3.5.8 | Implement insight quality scoring | 🔲 | Rate insight relevance based on user actions |

**Checkpoint 3.5:** ✅ HERMES proactively pushes insights to users without being asked.

---

### 3.6 AI Audience Analyzer — Week 6-7
**Priority:** 🟡 MEDIUM | **Effort:** Medium | **Dependencies:** Click/conversion data

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 3.6.1 | Create audience analysis API route | 🔲 | `src/app/api/ai/audience/route.ts` |
| 3.6.2 | Aggregate click data into audience segments | 🔲 | Age, gender, location, device, time patterns |
| 3.6.3 | Create audience profile visualization | 🔲 | Demographics charts, interest map, active hours |
| 3.6.4 | Add audience insights to Analytics page | 🔲 | "Your Audience" tab with profile data |
| 3.6.5 | Create audience-based content suggestions | 🔲 | "Your audience likes beauty content at 8 PM" |
| 3.6.6 | Implement audience trend tracking over time | 🔲 | How audience changes month-to-month |

**Checkpoint 3.6:** ✅ User can see detailed audience analysis and get content suggestions based on audience data.

---

### 3.7 Auto-Hashtag Optimizer — Week 7-8
**Priority:** 🟢 LOW | **Effort:** Small | **Dependencies:** Content gen API

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 3.7.1 | Create hashtag performance tracking model | 🔲 | HashtagPerformance: tag, platform, impressions, clicks |
| 3.7.2 | Track hashtag usage and link to performance | 🔲 | Associate hashtags in posts with click data |
| 3.7.3 | Create hashtag optimizer API route | 🔲 | `src/app/api/ai/hashtags/route.ts` |
| 3.7.4 | Implement hashtag scoring algorithm | 🔲 | Score based on reach, competition, relevance |
| 3.7.5 | Add hashtag suggestions to Content Generator | 🔲 | "Top performing hashtags for this niche" |
| 3.7.6 | Create hashtag analytics dashboard | 🔲 | Track hashtag performance over time |

**Checkpoint 3.7:** ✅ User gets optimized hashtag suggestions based on performance data.

---

### 3.8 AI Content Calendar Generator — Week 8-10
**Priority:** 🟡 MEDIUM | **Effort:** Medium | **Dependencies:** 3.1, 3.3

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 3.8.1 | Create ContentCalendar Prisma model | 🔲 | userId, weekStartDate, entries (JSON), generatedAt |
| 3.8.2 | Create calendar generation API route | 🔲 | `src/app/api/ai/calendar/route.ts` |
| 3.8.3 | Implement calendar generation algorithm | 🔲 | Trends + seasonal + audience + preferences → weekly plan |
| 3.8.4 | Create calendar UI component | 🔲 | Weekly view with day/time slots, drag-to-reorder |
| 3.8.5 | Add "Generate Next Week's Calendar" button | 🔲 | One-click AI calendar generation |
| 3.8.6 | Implement calendar → Auto-Post integration | 🔲 | Convert calendar entries to scheduled posts |
| 3.8.7 | Add calendar to sidebar navigation | 🔲 | "AI Calendar" page |
| 3.8.8 | Add seasonal event awareness to calendar | 🔲 | Raya, 11.11, etc. auto-scheduled |
| 3.8.9 | Test: generate calendar → review → approve → auto-post | 🔲 | End-to-end flow |

**Checkpoint 3.8:** ✅ User can generate a weekly content calendar with AI and convert it to scheduled posts.

---

### 🏁 FASA 3 COMPLETION CRITERIA

- [ ] AI product recommendations work based on audience data
- [ ] AI thumbnail generation produces click-worthy images
- [ ] Commission XTRA alerts push in real-time
- [ ] A/B content testing generates and tracks 3 variants
- [ ] HERMES proactively pushes insights
- [ ] Audience analyzer provides actionable data
- [ ] Hashtag optimizer suggests high-performing tags
- [ ] AI content calendar generates and schedules weekly plans

---

## 🏗️ FASA 4: MONETIZE & SCALE
**Timeline:** Q1 2026 (10 weeks)  
**Goal:** Turn the tool into a revenue-generating business

### 4.1 Freemium Pricing Model — Week 1-3
**Priority:** 🔴 URGENT | **Effort:** Medium | **Dependencies:** Fasa 1 (auth)

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 4.1.1 | Create Subscription Prisma model | 🔲 | userId, tier, startDate, endDate, status |
| 4.1.2 | Create UsageTracking Prisma model | 🔲 | userId, feature, count, period |
| 4.1.3 | Implement usage tracking middleware | 🔲 | Count API calls per feature per user per month |
| 4.1.4 | Create feature gating middleware | 🔲 | Check subscription tier before allowing access |
| 4.1.5 | Create pricing page UI | 🔲 | 4-tier pricing cards with feature comparison |
| 4.1.6 | Create upgrade/downgrade flow UI | 🔲 | Subscription management page |
| 4.1.7 | Integrate Stripe for international payments | 🔲 | Stripe checkout + webhook handler |
| 4.1.8 | Integrate Billplz/SenangPay for Malaysian FPX | 🔲 | Local payment gateway |
| 4.1.9 | Implement free tier limits (50 products, 20 links, 5 content) | 🔲 | Per-month usage caps |
| 4.1.10 | Create upgrade prompts at limit boundaries | 🔲 | "You've used 5/5 free content generations" → upgrade CTA |
| 4.1.11 | Implement subscription webhook handlers | 🔲 | payment_success, payment_failed, subscription_cancelled |
| 4.1.12 | Test: free user → hit limit → upgrade → access pro features | 🔲 | End-to-end subscription flow |

**Checkpoint 4.1:** ✅ Users can subscribe to paid tiers, feature gating works, payments process.

---

### 4.2 Affiliate Content Marketplace — Week 3-5
**Priority:** 🟠 HIGH | **Effort:** Large | **Dependencies:** 4.1 (payments)

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 4.2.1 | Create MarketplaceListing Prisma model | 🔲 | sellerId, contentId, price, downloads, rating |
| 4.2.2 | Create marketplace listing API routes | 🔲 | CRUD for marketplace items |
| 4.2.3 | Create marketplace browsing UI | 🔲 | Browse templates by category, platform, niche |
| 4.2.4 | Create listing detail page | 🔲 | Preview, reviews, buy button |
| 4.2.5 | Implement purchase flow | 🔲 | Buy → payment → download content |
| 4.2.6 | Create seller dashboard | 🔲 | Track sales, revenue, reviews |
| 4.2.7 | Implement seller payout system | 🔲 | Monthly payouts to content sellers |
| 4.2.8 | Add rating/review system | 🔲 | Star ratings + text reviews |
| 4.2.9 | Add "Sell Your Content" flow | 🔲 | List content for sale, set price |
| 4.2.10 | Implement content preview (watermarked) | 🔲 | Free preview, full version after purchase |

**Checkpoint 4.2:** ✅ Users can buy and sell content templates in the marketplace.

---

### 4.3 Team/Agency Multi-User Dashboard — Week 5-7
**Priority:** 🟠 HIGH | **Effort:** Large | **Dependencies:** 4.1 (subscriptions)

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 4.3.1 | Create Team Prisma model | 🔲 | name, ownerId, plan, memberLimit |
| 4.3.2 | Create TeamMember Prisma model | 🔲 | teamId, userId, role, joinedAt |
| 4.3.3 | Create team management API routes | 🔲 | Create team, invite member, remove member |
| 4.3.4 | Implement team invitation flow (email) | 🔲 | Send invite → accept → join team |
| 4.3.5 | Create team dashboard UI | 🔲 | Team overview, member list, shared data |
| 4.3.6 | Implement shared affiliate links within team | 🔲 | Team members see shared links |
| 4.3.7 | Implement shared content library within team | 🔲 | Team content pool |
| 4.3.8 | Create team analytics aggregation | 🔲 | Combined team performance metrics |
| 4.3.9 | Implement role-based permissions (owner, admin, member) | 🔲 | Different access levels |
| 4.3.10 | Add team management to Settings page | 🔲 | Team settings section |

**Checkpoint 4.3:** ✅ Agency users can create teams, invite members, and manage shared affiliate operations.

---

### 4.4 White-Label Option — Week 7-8
**Priority:** 🟡 MEDIUM | **Effort:** Medium | **Dependencies:** 4.1, 4.3

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 4.4.1 | Create WhiteLabelConfig Prisma model | 🔲 | orgId, logo, brandName, primaryColor, customDomain |
| 4.4.2 | Implement dynamic branding system | 🔲 | Replace logo, name, colors based on config |
| 4.4.3 | Create custom domain support | 🔲 | CNAME routing + SSL |
| 4.4.4 | Create white-label admin panel | 🔲 | Configure branding, manage users |
| 4.4.5 | Implement custom email templates | 🔲 | Branded notification emails |
| 4.4.6 | Test: apply custom branding → verify all pages reflect brand | 🔲 | Full visual verification |

**Checkpoint 4.4:** ✅ Enterprise clients can apply their own branding to the platform.

---

### 4.5 API as a Service — Week 8-9
**Priority:** 🟡 MEDIUM | **Effort:** Medium | **Dependencies:** 4.1 (auth + subscriptions)

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 4.5.1 | Create ApiKey Prisma model | 🔲 | userId, key, name, permissions, rateLimit |
| 4.5.2 | Create API key management UI | 🔲 | Generate, revoke, view usage |
| 4.5.3 | Create API documentation (OpenAPI/Swagger) | 🔲 | Auto-generated API docs |
| 4.5.4 | Implement API key authentication middleware | 🔲 | Bearer token validation |
| 4.5.5 | Implement rate limiting per API key | 🔲 | Tiered limits: 100/1000/10000 req/day |
| 4.5.6 | Create API usage analytics dashboard | 🔲 | Track calls, errors, latency per key |
| 4.5.7 | Create API playground / testing UI | 🔲 | Interactive API testing tool |

**Checkpoint 4.5:** ✅ Enterprise users can generate API keys and access platform data programmatically.

---

### 4.6 React Native Mobile App — Week 9-10+
**Priority:** 🟡 MEDIUM | **Effort:** Large | **Dependencies:** All Fasas

| # | Task | Status | Files/Notes |
|---|------|--------|-------------|
| 4.6.1 | Initialize React Native project with Expo | 🔲 | `npx create-expo-app` |
| 4.6.2 | Set up navigation (tabs + stack) | 🔲 | Dashboard, Products, AI, Earnings tabs |
| 4.6.3 | Implement authentication screens | 🔲 | Login, Register, Forgot Password |
| 4.6.4 | Build Dashboard screen | 🔲 | Stats cards, recent activity |
| 4.6.5 | Build Product Search screen | 🔲 | Search + product cards + generate link |
| 4.6.6 | Build AI Content screen | 🔲 | Generate content on the go |
| 4.6.7 | Build Notifications screen | 🔲 | Real-time push notifications |
| 4.6.8 | Build Earnings screen | 🔲 | Earnings chart + payout status |
| 4.6.9 | Implement push notification service | 🔲 | APNs + FCM integration |
| 4.6.10 | Test on iOS and Android | 🔲 | Both platforms, multiple devices |

**Checkpoint 4.6:** ✅ Mobile app available on App Store and Google Play.

---

### 🏁 FASA 4 COMPLETION CRITERIA

- [ ] Freemium model with 4 tiers is operational
- [ ] Content marketplace allows buying/selling
- [ ] Team/Agency dashboard supports multi-user
- [ ] White-label option available for enterprises
- [ ] API access available for developers
- [ ] Mobile app published on app stores

---

## 📈 KEY MILESTONES

| Milestone | Target Date | Fasa | Success Criteria |
|-----------|------------|------|------------------|
| 🏆 **M1: Auth Launch** | Week 2 | 1 | Users can register and login |
| 🏆 **M2: Real Posting** | Week 5 | 1 | Posts publish to FB/IG |
| 🏆 **M3: Real-Time Alerts** | Week 6 | 1 | WebSocket notifications live |
| 🏆 **M4: Core Complete** | Week 10 | 1 | All Fasa 1 checkpoints passed |
| 🏆 **M5: TikTok Integration** | Week 13 | 2 | TikTok Shop links working |
| 🏆 **M6: Shopee Live** | Week 17 | 2 | Live dashboard operational |
| 🏆 **M7: Multi-Platform** | Week 20 | 2 | All 3 platforms unified |
| 🏆 **M8: AI Recommender** | Week 22 | 3 | Personalized recommendations |
| 🏆 **M9: Smart Alerts** | Week 24 | 3 | Commission XTRA push alerts |
| 🏆 **M10: AI Calendar** | Week 30 | 3 | Weekly content calendar auto-gen |
| 🏆 **M11: Paid Launch** | Week 32 | 4 | First paying customer |
| 🏆 **M12: Marketplace** | Week 35 | 4 | Content marketplace live |
| 🏆 **M13: Team Dashboard** | Week 37 | 4 | Agency users onboarded |
| 🏆 **M14: Mobile App** | Week 40 | 4 | App Store + Play Store launch |

---

## 🚨 RISKS & MITIGATIONS

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Shopee API access denied | High | Medium | Mock mode is robust; apply for access ASAP |
| TikTok Shop API limitations | High | Low | Build abstraction layer; fallback to mock |
| Social platform API changes | Medium | Medium | Version our integrations; monitor changelogs |
| AI generation quality inconsistent | Medium | Medium | Human review step; algorithmic fallback |
| User adoption slower than projected | High | Medium | Free tier is generous; community building |
| Payment gateway integration issues | Medium | Low | Use established providers (Stripe, Billplz) |
| Competition enters market | High | Low | Move fast; build community; HERMES lock-in |

---

## 📝 HOW TO USE THIS CHECKLIST

1. **Start at the top** — Fasa 1 must be complete before Fasa 2
2. **Within each Fasa**, tasks in the same section can be parallelized
3. **Update status** as you work: 🔲 → 🔄 → ✅
4. **Never skip checkpoints** — each checkpoint must pass before moving to next section
5. **Log blockers** in worklog.md with ⏸️ status
6. **Weekly review** — check progress against milestones
7. **Celebrate wins** 🎉 — mark milestones when achieved!

---

<p align="center">
  <strong>TheViralFindsMY — Master Implementation Checklist v8.1</strong><br/>
  <em>148 tasks across 4 Fasas | Track everything | Ship like a PRO 🚀</em>
</p>
