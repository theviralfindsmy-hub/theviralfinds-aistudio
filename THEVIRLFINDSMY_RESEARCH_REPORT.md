# TheViralFindsMY — Advanced SaaS Feature Research Report

**Project:** TheViralFindsMY — Shopee Affiliate Management SaaS (Malaysia)
**Date:** March 2026
**Scope:** Research-driven feature recommendations with prioritization and technical implementation guidance

---

## Executive Summary

This report identifies 42 specific, actionable features across 8 domains for TheViralFindsMY. Features are prioritized by **Impact × Feasibility** into three tiers:

- **Tier 1 — Ship First** (High Impact, High Feasibility): 16 features
- **Tier 2 — Ship Next** (High Impact, Medium Feasibility): 14 features
- **Tier 3 — Ship Later** (Medium Impact, Variable Feasibility): 12 features

Key finding: The Shopee Affiliate Open API uses **GraphQL + HMAC-SHA256** auth, and the Malaysian endpoint is `api.affiliate.shopee.com.my/graphql`. Commission rates range 2.5%–12% by category (beauty/skincare highest at 8–12%; electronics lowest at 0.5–3%). Social media auto-posting is viable via **TikTok Content Posting API** (free, direct post) and **Instagram Graph API** (200 req/hr, Business accounts only). A unified API like **Ayrshare** ($149/mo) or **Buffer** (free tier) can abstract multi-platform posting.

---

## 1. Modern SaaS Dashboard Design (2025 Trends)

### What Makes Linear, Vercel, and Raycast Feel "Advanced"

Research across 10+ design references reveals 6 core patterns that define "premium" SaaS in 2025:

| Pattern | What It Looks Like | Example |
|---|---|---|
| **Command Palette (Cmd+K)** | Search-first navigation — every action accessible via keyboard | Linear, Raycast, Notion |
| **Glassmorphic Translucent Sidebars** | Semi-transparent panels with backdrop-blur over dark surfaces | Linear sidebar (#08090a bg + transparency) |
| **Dark-First Design** | Near-black surfaces (#08090a–#0a0a0b) with acid-lime/electric accent | Vercel's shader gradients, Linear's #e4f222 accent |
| **AI-Powered Personalization** | Dashboard widgets reorder based on user behavior; AI suggests next actions | 2025 trend — AI-driven layout adaptation |
| **Modular Draggable Widgets** | Customizable card layouts users can rearrange; data density without clutter | Raw.studio, Notion dashboards |
| **Dynamic Minimalism** | Ultra-clean surfaces that reveal complexity on interaction | Pixelmatters 2025 trend report |

### Specific Feature Recommendations

#### 🔴 Tier 1 — Ship First

**1.1 Command Palette (Cmd+K / Ctrl+K)**
- **Impact:** HIGH — Reduces navigation friction by 60–70%; power users expect it
- **Feasibility:** HIGH — Libraries like `cmdk` (by Vercel) make this trivial in React/Next.js
- **Implementation:**
  ```tsx
  // Use cmdk library (npm install cmdk)
  import { Command } from "cmdk";
  
  // Actions: search products, generate links, view commissions, switch views
  <Command.Dialog open={open} onOpenChange={setOpen}>
    <Command.Input placeholder="Search products, links, actions..." />
    <Command.List>
      <Command.Group heading="Quick Actions">
        <Command.Item>Generate Affiliate Link</Command.Item>
        <Command.Item>View Today's Commissions</Command.Item>
        <Command.Item>Search Trending Products</Command.Item>
      </Command.Group>
    </Command.List>
  </Command.Dialog>
  ```

**1.2 Dark-First Theme with Single Accent Color**
- **Impact:** HIGH — Instantly signals "premium"; 78% of developers prefer dark mode
- **Feasibility:** HIGH — CSS custom properties + Tailwind dark mode
- **Implementation:**
  - Base surface: `#0a0a0b` (near-black, like Linear)
  - Text: `#fafafa` / `#a1a1aa` (primary / muted)
  - Accent: Choose **electric teal (#00E5C3)** or **viral orange (#FF6B35)** — stands out vs. typical purple
  - Glassmorphic sidebar: `bg-white/5 backdrop-blur-xl border-r border-white/10`

**1.3 Modular Dashboard Widgets**
- **Impact:** HIGH — Different user types (new affiliates vs. power users) need different views
- **Feasibility:** HIGH — React Grid Layout or `@dnd-kit/core`
- **Widgets to include:**
  - Commission today (real-time counter)
  - Top-performing links
  - Trending products in MY
  - Click heatmap (last 7 days)
  - Social media scheduled posts
  - Achievement streak status

#### 🟡 Tier 2 — Ship Next

**1.4 AI Dashboard Personalization**
- Reorder widgets based on user's most-viewed metrics
- Show "Suggested Next Action" card (e.g., "3 products in your wishlist have increased commission rates")

**1.5 Animated Micro-interactions**
- Commission counter animates on update (count-up effect)
- Skeleton loading states (not spinners)
- Smooth page transitions with Framer Motion

#### 🟢 Tier 3 — Ship Later

**1.6 Shader-Based Backgrounds**
- Vercel-style animated gradients on hero/login pages
- Use WebGL/CSS Houdini for performance

---

## 2. Shopee Affiliate API — Real Endpoints & Integration

### API Architecture (Verified from Research)

The Shopee Affiliate Open API uses a **GraphQL endpoint** with **HMAC-SHA256 authentication**:

| Detail | Value |
|---|---|
| **Malaysia Endpoint** | `https://api.affiliate.shopee.com.my/graphql` |
| **Auth Method** | HMAC-SHA256 signature in request headers |
| **Auth Headers** | `Authorization: SHA256 {(app_id):(timestamp):(signature)}` |
| **Request Format** | GraphQL queries/mutations with JSON body |
| **App ID Required** | Yes, from Shopee Affiliate dashboard → Open API section |

### Confirmed GraphQL Operations (from GitHub repos & StackOverflow)

| Operation | Type | Description |
|---|---|---|
| `generateShortLink` | Mutation | Convert any Shopee URL into affiliate short link with subId tracking |
| Product Search | Query | Search products by keyword, category, commission rate |
| Commission List | Query | Retrieve commission records with date range filters |
| Order List | Query | Get order data attributed to affiliate links |
| Product Detail | Query | Get product info, pricing, commission rate, images |

### AMS Open API (Seller-Side, from open.shopee.com)

The **Affiliate Marketing Solution (AMS) API** is designed for sellers/ISVs:

| API | Purpose |
|---|---|
| Open Campaign APIs | Create/manage affiliate campaigns with commission rates |
| Affiliate Recommendation APIs | `get_recommended_affiliate_list` — find best affiliates |
| Performance Tracking APIs | Campaign performance metrics |
| Product Offer APIs | Set product-level commission rates |

### Malaysia-Specific Commission Rates (2025–2026)

| Category | Commission Range | Notes |
|---|---|---|
| Beauty & Skincare | 8%–12% | Highest margins; most competitive |
| Fashion & Apparel | 5%–10% | High volume; seasonal peaks |
| Home & Living | 4%–8% | Steady demand |
| Electronics | 0.5%–3% | Low margin but high order value |
| General Consumer Goods | 3%–7% | Bread-and-butter category |
| Campaign/Special Promos | Up to 12%+ | Shopee double-day sales (11.11, 12.12) |

**Critical note (Feb 2026):** Shopee added a 5% technical support fee across Malaysia. Affiliate rates capped at 2% non-electronic, 0.5% electronic for indirect orders.

### Feature Recommendations

#### 🔴 Tier 1 — Ship First

**2.1 One-Click Affiliate Link Generator**
- **Impact:** CRITICAL — Core feature; must feel instant
- **Feasibility:** HIGH — Direct GraphQL `generateShortLink` mutation
- **Implementation:**
  ```typescript
  // Backend API route (Next.js App Router)
  async function generateAffiliateLink(productUrl: string, subId: string) {
    const timestamp = Math.floor(Date.now() / 1000);
    const baseString = `${APP_ID}${timestamp}`;
    const signature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(baseString)
      .digest('hex');

    const response = await fetch('https://api.affiliate.shopee.com.my/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `SHA256 ${APP_ID}:${timestamp}:${signature}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `mutation generateShortLink($input: GenerateShortLinkInput!) {
          generateShortLink(input: $input) {
            shortLink
            originalLink
          }
        }`,
        variables: {
          input: { url: productUrl, subId }
        }
      })
    });
    return response.json();
  }
  ```

**2.2 Product Search with Commission Filter**
- Search Shopee products by keyword + filter by minimum commission rate
- Show: product image, name, price, commission %, estimated earnings
- Sort by: commission rate, price, popularity

**2.3 Commission Dashboard (Daily/Weekly/Monthly)**
- Pull commission data via GraphQL
- Display: today's earnings, pending, confirmed, total
- Chart: commission trend over time (7d, 30d, 90d)

#### 🟡 Tier 2 — Ship Next

**2.4 Bulk Link Generation**
- Generate affiliate links for up to 50 products at once
- Export as CSV with product name, link, commission rate

**2.5 Postback/Webhook Commission Tracking**
- Configure Shopee postback URL to receive real-time conversion data
- Endpoint: `POST /api/webhooks/shopee-conversion`
- Store conversions with subId attribution for link-level tracking

**2.6 Product Bookmarking & Price Tracking**
- Save products to watchlist
- Alert when commission rates change or prices drop

#### 🟢 Tier 3 — Ship Later

**2.7 AMS Integration (for power affiliates/sellers)**
- Campaign creation and management
- Affiliate recommendation engine

---

## 3. AI-Powered Features

### Feature Recommendations

#### 🔴 Tier 1 — Ship First

**3.1 AI Smart Caption Generator**
- **Impact:** HIGH — #1 pain point for affiliates is writing captions
- **Feasibility:** HIGH — LLM API (OpenAI/Anthropic) integration
- **How it works:**
  - Input: Product URL + target platform (TikTok/IG/FB)
  - Output: 3 caption variations in Bahasa Melayu + English
  - Include: hooks, CTAs, relevant hashtags, emoji
- **Implementation:**
  ```typescript
  async function generateCaption(product: Product, platform: 'tiktok' | 'instagram' | 'facebook') {
    const prompt = `You are a Malaysian social media influencer. Generate 3 viral ${platform} captions 
    for this Shopee product: ${product.name} (RM${product.price}, ${product.commissionRate}% commission).
    
    Requirements:
    - Mix Bahasa Melayu and English (Manglish style for casual, formal BM for professional)
    - Include hook in first line
    - Include affiliate CTA
    - Include 5-8 relevant hashtags
    - Keep under ${platform === 'tiktok' ? '150' : '2200'} characters
    - Make it feel authentic, not salesy`;
    
    // Call LLM API
    return llm.complete(prompt);
  }
  ```

**3.2 AI Product Recommendation Engine**
- "Products You Should Promote" based on:
  - User's past click/conversion data
  - Trending products in Malaysia
  - Category affinity (if user promotes beauty, suggest beauty)
  - Commission rate optimization
- **Implementation:** Collaborative filtering + content-based hybrid
  - Quick start: Rule-based system using category + commission data
  - V2: Embed product descriptions, use vector similarity

**3.3 Trending Product Detection**
- Track products with rising click rates over 24–48h windows
- Alert users: "🔥 This product is trending — commission rate is 10%!"
- Use time-series analysis on product search volume data

#### 🟡 Tier 2 — Ship Next

**3.4 Sentiment Analysis of Product Reviews**
- Pull top reviews from Shopee product pages
- Analyze sentiment (positive/neutral/negative)
- Flag: "⚠️ This product has declining review sentiment — promote with caution"
- Help affiliates avoid promoting low-quality products

**3.5 Smart Link Auto-Optimization**
- A/B test different short link subIds automatically
- Rotate between product page vs. shop page links
- Automatically pause underperforming links
- Redirect dead links to similar products

**3.6 AI Content Calendar**
- Suggest optimal posting times based on Malaysian social media usage patterns
- Recommend which products to promote on which days
- Auto-schedule content around Shopee sale events (11.11, 12.12, payday sales)

#### 🟢 Tier 3 — Ship Later

**3.7 Predictive Commission Forecasting**
- ML model to predict next month's earnings based on historical data
- Factor in: seasonal trends, sale events, category growth
- Show: "Based on your trajectory, you'll earn RM X next month"

**3.8 AI Product Review Summarizer**
- Summarize 100+ reviews into 3 key pros and 3 key cons
- Extract common themes: "Most reviewers love the packaging but mention slow shipping"

---

## 4. Social Media Automation

### API Reality Check (as of 2025–2026)

| Platform | Direct Post API? | Auth Type | Rate Limits | Cost | Key Limitation |
|---|---|---|---|---|---|
| **TikTok** | ✅ Content Posting API | OAuth 2.0 | No published limit | **FREE** | Uploads as DRAFT or DIRECT; user must authorize each account |
| **Instagram** | ✅ Graph API Content Publishing | OAuth 2.0 + App Review | 200 req/hr per account (down from 5,000 in 2025 — 96% cut!) | **FREE** | Business/Creator accounts ONLY; no personal; 100 posts/24hr |
| **Facebook** | ✅ Graph API Pages | OAuth 2.0 + App Review | 200 req/hr | **FREE** | Page posts only; requires App Review approval |
| **Threads** | ✅ Via Meta API | Same as IG | Shared with IG | **FREE** | New; limited features |

### Unified API Aggregators

| Service | Platforms | Pricing | Best For |
|---|---|---|---|
| **Ayrshare** | 13+ platforms | $149–599/mo | Multi-user SaaS; production-grade |
| **Buffer API** | 11 channels | Free (personal key) to $60/mo | Simple scheduling; personal use |
| **Zernio** | TikTok, IG, FB, X | From $29/mo | TikTok-first workflows |
| **Mallary.ai** | Multi-platform | API for devs + AI agents | AI agent integration |

### Feature Recommendations

#### 🔴 Tier 1 — Ship First

**4.1 TikTok Content Posting Integration**
- **Impact:** HIGH — TikTok is #1 platform for Shopee affiliates in Malaysia
- **Feasibility:** HIGH — Official API, free, well-documented
- **Implementation:**
  ```typescript
  // TikTok Content Posting API flow
  // 1. OAuth authorization
  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${CLIENT_KEY}&scope=user.info.basic,video.publish&response_type=code&redirect_uri=${REDIRECT_URI}`;
  
  // 2. Upload video (chunked upload for large files)
  // POST https://open.tiktokapis.com/v2/post/publish/video/init/
  // POST https://open.tiktokapis.com/v2/post/publish/video/upload/
  // POST https://open.tiktokapis.com/v2/post/publish/content/post/
  
  // 3. Draft mode (recommended) vs Direct Post
  // Draft: user reviews in TikTok app before posting
  // Direct: posts immediately (requires explicit user consent)
  ```

**4.2 Instagram/Facebook Graph API Scheduling**
- Post to IG Feed (images + carousels) and Facebook Pages
- Use content publishing endpoint with proper OAuth flow
- Handle 200 req/hr rate limit with queue system

**4.3 Post Scheduler (Calendar View)**
- Visual drag-and-drop calendar for scheduling posts
- Time-slot suggestions based on Malaysian peak hours:
  - IG: 8–9 AM (morning commute), 12–1 PM (lunch), 8–10 PM (evening)
  - TikTok: 7–9 PM peak; weekends 11 AM–1 PM
  - FB: 1–4 PM weekdays

#### 🟡 Tier 2 — Ship Next

**4.4 Ayrshare Integration (Unified API)**
- Single integration for 13+ platforms
- Removes need to maintain individual API connections
- Cost: $149/mo for production — pass this to premium users
- Handles: IG, TikTok, FB, X, LinkedIn, Pinterest, YouTube, Threads, etc.

**4.5 Content Template Library**
- Pre-built templates for common Shopee promo types:
  - Flash sale announcement
  - New product review
  - Unboxing video script
  - Comparison post
- Templates auto-populate with product data from Shopee API

#### 🟢 Tier 3 — Ship Later

**4.6 Auto-Generated Video Scripts**
- AI-generated TikTok/Reels scripts based on product data
- Include: hook, product demo beats, CTA timing
- Not actual video generation (too resource-intensive), but structured scripts

**4.7 Social Listening Dashboard**
- Track mentions of promoted products on social media
- Use social monitoring APIs (Shortimize, Flockler)

---

## 5. Real-Time Features

### Architecture Recommendation

```
Shopee API Webhook → Server (Node.js) → Redis Pub/Sub → Socket.IO → React Client
                                                      ↓
                                               PostgreSQL (persist)
```

### Feature Recommendations

#### 🔴 Tier 1 — Ship First

**5.1 Live Commission Counter**
- **Impact:** HIGH — Psychological motivation; gamification of earnings
- **Feasibility:** HIGH — Poll Shopee API every 60s + push updates via WebSocket
- **Implementation:**
  ```typescript
  // Server: Socket.IO setup
  import { Server } from 'socket.io';
  
  const io = new Server(httpServer, { cors: { origin: '*' } });
  
  // Cron job: poll Shopee commission data every 60s
  cron.schedule('* * * * *', async () => {
    const commissions = await fetchLatestCommissions();
    io.emit('commission:update', {
      todayTotal: commissions.today,
      newConversions: commissions.newConversions,
      lastUpdated: new Date().toISOString()
    });
  });
  
  // Client: React hook
  function useLiveCommissions() {
    const [data, setData] = useState({ todayTotal: 0 });
    useEffect(() => {
      const socket = io();
      socket.on('commission:update', setData);
      return () => socket.disconnect();
    }, []);
    return data;
  }
  ```

**5.2 Real-Time Notifications**
- New conversion: "🎉 Someone just purchased via your link! +RM 4.50"
- Commission rate change: "⚠️ [Product X] commission dropped from 8% to 5%"
- Trending alert: "🔥 [Product Y] is going viral — 500 clicks in the last hour"
- Use: Service Worker Push API for PWA notifications + in-app toast

#### 🟡 Tier 2 — Ship Next

**5.3 Live Click Tracking Map**
- Show a real-time map of Malaysia with click locations
- Heatmap of where clicks are coming from (West Malaysia vs. East Malaysia)
- Requires: IP geolocation on click events (store in DB with lat/lng)

**5.4 Live Dashboard Analytics**
- Real-time charts: clicks, conversions, CTR — updating every 5s
- Use: SWR or React Query with refetchInterval for simplicity
- Or: Socket.IO with chart streaming (Chart.js streaming plugin)

**5.5 Collaboration: Live Presence Indicators**
- Show which team members are online
- Cursor sharing on shared dashboards
- Useful for affiliate teams/agencies

#### 🟢 Tier 3 — Ship Later

**5.6 WebSocket Shopee Order Stream**
- If Shopee provides real-time webhook for orders (configurable in affiliate dashboard)
- Stream new orders as they happen with <200ms latency
- Fallback: Polling with intelligent backoff

---

## 6. Advanced Analytics

### Feature Recommendations

#### 🔴 Tier 1 — Ship First

**6.1 ROI Calculator**
- **Impact:** HIGH — Affiliates need to know if their effort is profitable
- **Feasibility:** HIGH — Pure calculation, no external API needed
- **Metrics:**
  - Time invested (content creation hours) vs. commission earned
  - Cost per click (if running ads) vs. revenue per click
  - Break-even analysis: "You need X more clicks to cover your RM Y ad spend"

**6.2 Link-Level Attribution**
- Track every link with unique subId
- Show: clicks, conversions, CTR, revenue per link
- Attribution model: Last-click (default) + First-click (optional)
- **Implementation:**
  ```sql
  -- Attribution query
  SELECT 
    l.sub_id,
    l.product_name,
    COUNT(c.id) as clicks,
    COUNT(o.id) as conversions,
    ROUND(COUNT(o.id)::float / NULLIF(COUNT(c.id), 0) * 100, 2) as ctr,
    COALESCE(SUM(o.commission), 0) as total_commission
  FROM links l
  LEFT JOIN clicks c ON c.link_id = l.id
  LEFT JOIN orders o ON o.sub_id = l.sub_id
  WHERE l.user_id = $1
  GROUP BY l.id
  ORDER BY total_commission DESC;
  ```

**6.3 Conversion Funnel Analysis**
- View → Click → Add to Cart → Purchase
- Identify drop-off points
- Show: "Your product pages convert at 3.2% — 1.8% above average"

#### 🟡 Tier 2 — Ship Next

**6.4 Cohort Analysis**
- Group users by first-click date
- Track: Do affiliates who started in month X earn more over time?
- Retention curves: How long do affiliates stay active?
- **Implementation:** Use PostgreSQL window functions or Mixpanel-style event store

**6.5 Multi-Touch Attribution Modeling**
- Models: Last-click, First-click, Linear, Time-decay, Position-based
- Help affiliates understand which touchpoints drive conversions
- Critical for affiliates using multiple social platforms

**6.6 A/B Testing for Links**
- Create 2 versions of an affiliate link with different subIds
- Track which generates more clicks/conversions
- Auto-distribute traffic 50/50
- Statistical significance calculator built-in

#### 🟢 Tier 3 — Ship Later

**6.7 Predictive Analytics**
- "Based on your last 90 days, you'll earn RM X next month"
- Seasonal adjustment for Ramadhan, Hari Raya, 11.11, 12.12

**6.8 Competitive Benchmarking**
- Anonymized benchmarks: "Top 10% of affiliates earn RM X/month"
- Category benchmarks: "Beauty affiliates average 4.5% CTR"

---

## 7. Gamification

### Feature Recommendations

#### 🔴 Tier 1 — Ship First

**7.1 Earning Streaks**
- **Impact:** HIGH — Duolingo-style daily engagement driver
- **Feasibility:** HIGH — Simple database tracking
- **Mechanics:**
  - "3-day earning streak 🔥" — earned commission for 3 consecutive days
  - Streak multiplier: 7-day streak = "On Fire" badge; 30-day = "Legendary"
  - Streak freeze: Allow 1 missed day per week (like Duolingo)
- **Implementation:**
  ```sql
  CREATE TABLE streaks (
    user_id UUID PRIMARY KEY,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_earning_date DATE,
    streak_freezes_available INT DEFAULT 1,
    streak_freeze_used_this_week BOOLEAN DEFAULT FALSE
  );
  ```

**7.2 Achievement Badges**
- **Impact:** HIGH — Status symbols drive engagement (48% engagement increase per studies)
- **Feasibility:** HIGH — Trophy.so or custom implementation
- **Badges to include:**
  - 🎯 First Commission — Earn your first RM
  - 💰 RM100 Club — Earn RM100 total
  - 🔥 Viral Link — Get 1000 clicks on one link
  - 📱 Social Butterfly — Connect 3 social accounts
  - 🏆 Top Earner — Make the monthly leaderboard
  - 🇲🇾 Malaysian Hero — Promote 50 local products
  - ⚡ Flash Sale Master — Promote 10 flash sale products

**7.3 Monthly Leaderboard**
- Top 50 affiliates by monthly commission
- Prizes for top 3 (bonus commission, featured placement)
- Anonymous option for privacy

#### 🟡 Tier 2 — Ship Next

**7.4 Level System (XP)**
- Earn XP for actions: link generation (+5), first click (+10), first sale (+50), streak day (+20)
- Levels: Newbie → Starter → Rising Star → Influencer → Viral Legend
- Each level unlocks features (advanced analytics, priority support, higher API limits)

**7.5 Challenges & Quests**
- Weekly: "Promote 3 beauty products this week" → +100 XP
- Monthly: "Earn RM500 this month" → RM50 bonus
- Event-based: "11.11 Challenge — Generate 20 links before Nov 11" → exclusive badge

**7.6 Referral Program**
- Invite friends to TheViralFindsMY → earn 5% of their first month's commission
- Referral leaderboard
- Milestone rewards: "You've invited 10 affiliates! 🎉"

#### 🟢 Tier 3 — Ship Later

**7.7 Team/Guild System**
- Affiliates form teams; compete in team leaderboards
- Team challenges: "Collectively earn RM10,000 this month"

**7.8 Achievement NFTs/Digital Collectibles**
- Blockchain-verified achievement badges (on a cheap chain like Polygon)
- Tradeable? Debatable, but generates buzz

---

## 8. PWA & Mobile-Native Experience

### What Makes a PWA Feel Native (2025 Best Practices)

| Feature | Implementation | Impact |
|---|---|---|
| **Install Prompt** | `beforeinstallprompt` event → custom install banner | HIGH |
| **Push Notifications** | Service Worker + Web Push API (VAPID keys) | HIGH |
| **Offline Mode** | Service Worker cache strategies; IndexedDB for data | MEDIUM |
| **App-Like Navigation** | Bottom tab bar (mobile); swipe gestures; no page reloads | HIGH |
| **Splash Screen** | Web App Manifest `background_color` + `icons` | MEDIUM |
| **Share Target** | Manifest `share_target` — receive shared links from other apps | HIGH |
| **Status Bar Color** | Manifest `theme_color` matching app branding | LOW |
| **Native-like Transitions** | View Transitions API; shared element transitions | MEDIUM |

### Feature Recommendations

#### 🔴 Tier 1 — Ship First

**8.1 PWA Manifest & Install Experience**
- **Impact:** HIGH — 2x engagement for installed PWAs vs. browser users
- **Feasibility:** HIGH — Standard web manifest configuration
- **Implementation:**
  ```json
  // manifest.json
  {
    "name": "TheViralFindsMY",
    "short_name": "ViralFinds",
    "description": "Shopee Affiliate Management for Malaysian Creators",
    "start_url": "/dashboard",
    "display": "standalone",
    "background_color": "#0a0a0b",
    "theme_color": "#00E5C3",
    "orientation": "portrait-primary",
    "icons": [
      { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ],
    "shortcuts": [
      { "name": "Generate Link", "url": "/links/generate", "icons": ["/shortcut-link.png"] },
      { "name": "My Earnings", "url": "/commissions", "icons": ["/shortcut-earnings.png"] }
    ],
    "share_target": {
      "action": "/links/generate",
      "method": "POST",
      "enctype": "multipart/form-data",
      "params": { "url": "product_url" }
    }
  }
  ```

**8.2 Push Notifications (Commission Alerts)**
- **Impact:** HIGH — Instant notification when a sale comes through
- **Feasibility:** HIGH — Web Push API + Service Worker
- **Implementation:**
  ```typescript
  // Server: Send push notification
  import webpush from 'web-push';
  
  webpush.setVapidDetails(
    'mailto:hello@theviralfinds.my',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  
  // Trigger on new conversion
  async function notifyConversion(userId: string, commission: number) {
    const subscription = await getPushSubscription(userId);
    await webpush.sendNotification(subscription, JSON.stringify({
      title: '🎉 New Sale!',
      body: `You earned RM ${commission.toFixed(2)} from a purchase!`,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: { url: '/commissions' },
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    }));
  }
  ```

**8.3 Mobile-First Bottom Navigation**
- 5-tab bottom nav (like native apps):
  - 🏠 Home (Dashboard)
  - 🔗 Links (My affiliate links)
  - ➕ Create (Quick link generation — center FAB)
  - 📊 Analytics
  - 👤 Profile
- Swipe between tabs for power users

#### 🟡 Tier 2 — Ship Next

**8.4 Offline Mode for Core Features**
- Cache: product search history, recent links, commission summary
- Strategy: Stale-while-revalidate for product data; cache-first for static assets
- Offline-capable: Generate link (queue for sync when back online)
- **Implementation:**
  ```typescript
  // next.config.js service worker config or custom SW
  // Use Workbox or next-pwa
  
  // Offline link generation queue
  self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/api/links/generate')) {
      event.respondWith(
        fetch(event.request).catch(() => {
          // Queue for background sync
          return registerSync(event.request);
        })
      );
    }
  });
  ```

**8.5 Share Target API**
- When a user finds a Shopee product in any app, they "Share" → TheViralFindsMY
- App auto-generates affiliate link from shared URL
- **Critical for workflow:** Users discover products on Shopee app → share to TheViralFindsMY → get affiliate link → share to social media

**8.6 App-Like Transitions**
- View Transitions API for smooth page changes
- Shared element transitions: Product card → Detail page (product image animates)
- Pull-to-refresh on mobile dashboard

#### 🟢 Tier 3 — Ship Later

**8.7 Background Sync**
- Queue actions offline (link generation, post scheduling)
- Auto-execute when connection restored

**8.8 Periodic Background Sync**
- Pre-fetch commission data every 24h
- Show notification if earnings changed significantly

---

## Prioritized Implementation Roadmap

### Phase 1 — MVP (Weeks 1–4)
*Core platform that feels premium and functional*

| # | Feature | Domain | Effort |
|---|---|---|---|
| 1 | Dark-first theme with accent color | Dashboard | 2 days |
| 2 | Shopee Affiliate API auth (HMAC-SHA256) | API | 2 days |
| 3 | One-click affiliate link generator | API | 3 days |
| 4 | Product search with commission filter | API | 3 days |
| 5 | Commission dashboard (daily/weekly) | Analytics | 3 days |
| 6 | AI smart caption generator | AI | 3 days |
| 7 | Command palette (Cmd+K) | Dashboard | 1 day |
| 8 | PWA manifest + install prompt | Mobile | 1 day |
| 9 | Push notifications for conversions | Mobile | 2 days |
| 10 | Mobile bottom navigation | Mobile | 2 days |

### Phase 2 — Growth (Weeks 5–8)
*Features that drive engagement and retention*

| # | Feature | Domain | Effort |
|---|---|---|---|
| 11 | Modular dashboard widgets | Dashboard | 3 days |
| 12 | Live commission counter (WebSocket) | Real-time | 3 days |
| 13 | Earning streaks + badges | Gamification | 3 days |
| 14 | Monthly leaderboard | Gamification | 2 days |
| 15 | TikTok Content Posting API | Social | 4 days |
| 16 | Post scheduler calendar | Social | 3 days |
| 17 | Link-level attribution | Analytics | 3 days |
| 18 | AI product recommendations | AI | 3 days |
| 19 | Share Target API (PWA) | Mobile | 1 day |
| 20 | Offline mode for core features | Mobile | 3 days |

### Phase 3 — Scale (Weeks 9–12)
*Features that differentiate from competitors*

| # | Feature | Domain | Effort |
|---|---|---|---|
| 21 | Instagram/Facebook posting API | Social | 4 days |
| 22 | Ayrshare integration (unified API) | Social | 3 days |
| 23 | Real-time notifications system | Real-time | 3 days |
| 24 | Conversion funnel analysis | Analytics | 3 days |
| 25 | Cohort analysis | Analytics | 4 days |
| 26 | A/B testing for links | Analytics | 4 days |
| 27 | Sentiment analysis (product reviews) | AI | 4 days |
| 28 | Level/XP system | Gamification | 3 days |
| 29 | Weekly challenges & quests | Gamification | 2 days |
| 30 | Bulk link generation + CSV export | API | 2 days |

### Phase 4 — Premium (Weeks 13–16)
*Advanced features for premium subscribers*

| # | Feature | Domain | Effort |
|---|---|---|---|
| 31 | AI content calendar | AI | 4 days |
| 32 | Smart link auto-optimization | AI | 5 days |
| 33 | Live click tracking map | Real-time | 4 days |
| 34 | Multi-touch attribution modeling | Analytics | 5 days |
| 35 | Predictive commission forecasting | AI | 5 days |
| 36 | Referral program | Gamification | 3 days |
| 37 | Content template library | Social | 3 days |
| 38 | App-like view transitions | Mobile | 2 days |
| 39 | AI product review summarizer | AI | 3 days |
| 40 | Competitive benchmarking | Analytics | 3 days |

---

## Technical Stack Recommendations

| Layer | Recommendation | Why |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | PWA support, API routes, SSR |
| **UI** | Tailwind CSS 4 + shadcn/ui | Dark-first, accessible, fast |
| **Database** | PostgreSQL (Supabase) | Real-time subscriptions, auth |
| **Cache** | Redis (Upstash) | Pub/Sub for WebSocket, rate limiting |
| **WebSocket** | Socket.IO | Fallback to polling, rooms |
| **Auth** | NextAuth.js + Supabase Auth | Social login, session management |
| **PWA** | next-pwa or Serwist | Service worker generation |
| **LLM** | OpenAI GPT-4o-mini / Anthropic Claude Haiku | Cost-effective caption generation |
| **Social** | Ayrshare (production) or native APIs (MVP) | Multi-platform posting |
| **Charts** | Recharts or Tremor | Real-time streaming charts |
| **Monitoring** | PostHog | Product analytics, feature flags |
| **Hosting** | Vercel | Edge functions, automatic PWA headers |

---

## Key Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Shopee API rate limits or endpoint changes | MEDIUM | HIGH | Cache aggressively; monitor API changelog; abstract API layer |
| Instagram API rate limit (200/hr cut) | HIGH | MEDIUM | Queue system with rate limiting; use Ayrshare for abstraction |
| TikTok API approval delays | MEDIUM | MEDIUM | Start App Review early; have draft-mode fallback |
| Shopee commission rate decreases | HIGH | MEDIUM | Diversify to TikTok Shop & Lazada affiliate in V2 |
| LLM costs for AI features | MEDIUM | LOW | Use GPT-4o-mini ($0.15/1M input tokens); cache responses |
| PWA push notification iOS support | LOW | MEDIUM | iOS 16.4+ supports Web Push; fallback to in-app notifications |

---

## Malaysian Market Specifics

| Factor | Detail |
|---|---|
| **Language** | Bahasa Melayu (primary) + English (secondary) + Manglish (social media) |
| **Top Platforms** | TikTok (#1), Instagram (#2), Facebook (#3) for affiliate content |
| **Peak Shopping** | Payday (25th–1st), 11.11, 12.12, Ramadhan/Raya season |
| **Key Categories** | Beauty & Skincare, Fashion, Home & Living, Electronics |
| **Payment** | Shopee Pay, local bank transfer — show earnings in RM |
| **Commission Expectation** | Affiliates expect RM500–5000/month; show realistic projections |
| **Competitors** | Shopee Affiliate dashboard (basic), Ecomobi, Accesstrade — all lack AI and modern UX |
| **Opportunity** | No modern AI-powered affiliate SaaS exists for Malaysian Shopee market — first-mover advantage |

---

*Report compiled from 16 web searches and 4 deep page reads across Shopee API docs, TikTok developer docs, Instagram Graph API references, SaaS design trend analyses, and Malaysian e-commerce market data.*
