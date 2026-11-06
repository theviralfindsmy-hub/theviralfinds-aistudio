-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('active', 'paused', 'expired');
CREATE TYPE "CampaignStatus" AS ENUM ('active', 'paused', 'completed');
CREATE TYPE "ConversionStatus" AS ENUM ('pending', 'confirmed', 'rejected', 'paid');
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE "GoalStatus" AS ENUM ('active', 'achieved', 'failed');
CREATE TYPE "GoalPeriod" AS ENUM ('monthly', 'weekly', 'yearly', 'custom');
CREATE TYPE "UserRole" AS ENUM ('admin', 'affiliate', 'viewer');
CREATE TYPE "HermesSkillStatus" AS ENUM ('active', 'draft', 'archived', 'learning', 'paused');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL DEFAULT 'demo',
    "role" "UserRole" NOT NULL DEFAULT 'affiliate',
    "avatarUrl" TEXT,
    "image" TEXT,
    "emailVerified" TIMESTAMP(3),
    "shopeeAffId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "affiliate_links" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productUrl" TEXT NOT NULL,
    "affiliateUrl" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT,
    "productImage" TEXT,
    "productPrice" DECIMAL,
    "commission" DECIMAL,
    "commissionRate" DECIMAL DEFAULT 5,
    "category" TEXT,
    "campaignId" TEXT,
    "userId" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "earnings" DECIMAL NOT NULL DEFAULT 0,
    "ctr" DECIMAL DEFAULT 0,
    "status" "LinkStatus" NOT NULL DEFAULT 'active',
    "shortCode" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'active',
    "budget" DECIMAL,
    "spent" DECIMAL NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "click_records" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT,
    "country" TEXT,
    "referer" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "click_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversions" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "orderId" TEXT,
    "amount" DECIMAL NOT NULL,
    "commission" DECIMAL NOT NULL,
    "status" "ConversionStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "method" TEXT NOT NULL DEFAULT 'bank_transfer',
    "amount" DECIMAL NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "bankName" TEXT,
    "accountNo" TEXT,
    "accountName" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "earning_goals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" DECIMAL NOT NULL,
    "currentAmount" DECIMAL NOT NULL DEFAULT 0,
    "period" "GoalPeriod" NOT NULL DEFAULT 'monthly',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" "GoalStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "earning_goals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'system',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_memories" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "sessionId" TEXT,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_memories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "leaderboard_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "totalEarnings" DECIMAL NOT NULL DEFAULT 0,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "totalConversions" INTEGER NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT,
    "referredEmail" TEXT NOT NULL,
    "referredName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "commission" DECIMAL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hermes_connections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "apiKey" TEXT,
    "model" TEXT NOT NULL DEFAULT 'hermes-3',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastConnected" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hermes_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hermes_conversations" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hermes_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hermes_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokens" INTEGER,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hermes_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hermes_skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "trigger" TEXT,
    "status" "HermesSkillStatus" NOT NULL DEFAULT 'draft',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DECIMAL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "learnedFrom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hermes_skills_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hermes_tasks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schedule" TEXT,
    "skillId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "lastResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hermes_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hermes_insights" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "data" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isActioned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hermes_insights_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scheduled_posts" (
    "id" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "platforms" TEXT NOT NULL,
    "productUrl" TEXT,
    "affiliateLink" TEXT,
    "imageUrl" TEXT,
    "hashtags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "result" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "content_library" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "niche" TEXT,
    "product" TEXT,
    "content" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'manglish',
    "tone" TEXT NOT NULL DEFAULT 'casual',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_library_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "social_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platformUserId" TEXT NOT NULL,
    "platformUsername" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isConnected" BOOLEAN NOT NULL DEFAULT true,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "post_logs" (
    "id" TEXT NOT NULL,
    "scheduledPostId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "platformPostId" TEXT,
    "platformUrl" TEXT,
    "errorMessage" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "userId" TEXT,
    "permissions" TEXT NOT NULL DEFAULT 'read',
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_key_usage" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_key_usage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "maxMembers" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "team_invitations" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "whitelabel_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#0066FF',
    "accentColor" TEXT NOT NULL DEFAULT '#CCFF00',
    "companyName" TEXT NOT NULL,
    "supportEmail" TEXT,
    "headTitle" TEXT,
    "customCss" TEXT,
    "emailTemplate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whitelabel_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marketplace_listings" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "niche" TEXT,
    "platform" TEXT,
    "price" DECIMAL NOT NULL,
    "rating" DECIMAL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marketplace_reviews" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "checkoutUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "usage_tracking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "productsSearched" INTEGER NOT NULL DEFAULT 0,
    "linksCreated" INTEGER NOT NULL DEFAULT 0,
    "contentGenerated" INTEGER NOT NULL DEFAULT 0,
    "postsPublished" INTEGER NOT NULL DEFAULT 0,
    "aiQueries" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_tracking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ab_tests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "linkId" TEXT,
    "variants" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "winnerIndex" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ab_tests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trend_keywords" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "category" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'shopee',
    "searchVolume" INTEGER NOT NULL DEFAULT 0,
    "growthRate" DECIMAL DEFAULT 0,
    "trend" TEXT NOT NULL DEFAULT 'rising',
    "period" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trend_keywords_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "competitor_watches" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "shopName" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'shopee',
    "shopUrl" TEXT,
    "topProduct" TEXT,
    "avgPrice" DECIMAL,
    "followerCount" INTEGER,
    "lastChecked" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitor_watches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "live_sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "viewers" INTEGER NOT NULL DEFAULT 0,
    "peakViewers" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL NOT NULL DEFAULT 0,
    "products" TEXT,
    "script" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "alert_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "threshold" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");
CREATE UNIQUE INDEX "affiliate_links_shortCode_key" ON "affiliate_links"("shortCode");
CREATE INDEX "affiliate_links_status_idx" ON "affiliate_links"("status");
CREATE INDEX "affiliate_links_campaignId_idx" ON "affiliate_links"("campaignId");
CREATE INDEX "affiliate_links_category_idx" ON "affiliate_links"("category");
CREATE INDEX "affiliate_links_createdAt_idx" ON "affiliate_links"("createdAt");
CREATE INDEX "affiliate_links_userId_idx" ON "affiliate_links"("userId");
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");
CREATE INDEX "click_records_linkId_idx" ON "click_records"("linkId");
CREATE INDEX "click_records_createdAt_idx" ON "click_records"("createdAt");
CREATE INDEX "click_records_device_idx" ON "click_records"("device");
CREATE INDEX "click_records_converted_idx" ON "click_records"("converted");
CREATE INDEX "click_records_country_idx" ON "click_records"("country");
CREATE INDEX "conversions_linkId_idx" ON "conversions"("linkId");
CREATE INDEX "conversions_status_idx" ON "conversions"("status");
CREATE INDEX "conversions_createdAt_idx" ON "conversions"("createdAt");
CREATE INDEX "payouts_status_idx" ON "payouts"("status");
CREATE INDEX "payouts_requestedAt_idx" ON "payouts"("requestedAt");
CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");
CREATE INDEX "earning_goals_status_idx" ON "earning_goals"("status");
CREATE INDEX "earning_goals_period_idx" ON "earning_goals"("period");
CREATE INDEX "notifications_read_idx" ON "notifications"("read");
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");
CREATE INDEX "notifications_type_idx" ON "notifications"("type");
CREATE INDEX "agent_memories_agentId_idx" ON "agent_memories"("agentId");
CREATE INDEX "agent_memories_sessionId_idx" ON "agent_memories"("sessionId");
CREATE INDEX "agent_memories_createdAt_idx" ON "agent_memories"("createdAt");
CREATE INDEX "achievements_userId_idx" ON "achievements"("userId");
CREATE INDEX "achievements_type_idx" ON "achievements"("type");
CREATE INDEX "achievements_earnedAt_idx" ON "achievements"("earnedAt");
CREATE INDEX "leaderboard_entries_period_idx" ON "leaderboard_entries"("period");
CREATE INDEX "leaderboard_entries_rank_idx" ON "leaderboard_entries"("rank");
CREATE UNIQUE INDEX "leaderboard_entries_userId_period_key" ON "leaderboard_entries"("userId", "period");
CREATE INDEX "referrals_referrerId_idx" ON "referrals"("referrerId");
CREATE INDEX "referrals_status_idx" ON "referrals"("status");
CREATE INDEX "hermes_conversations_connectionId_idx" ON "hermes_conversations"("connectionId");
CREATE INDEX "hermes_conversations_createdAt_idx" ON "hermes_conversations"("createdAt");
CREATE INDEX "hermes_messages_conversationId_idx" ON "hermes_messages"("conversationId");
CREATE INDEX "hermes_messages_createdAt_idx" ON "hermes_messages"("createdAt");
CREATE INDEX "hermes_skills_category_idx" ON "hermes_skills"("category");
CREATE INDEX "hermes_skills_status_idx" ON "hermes_skills"("status");
CREATE INDEX "hermes_tasks_status_idx" ON "hermes_tasks"("status");
CREATE INDEX "hermes_tasks_nextRunAt_idx" ON "hermes_tasks"("nextRunAt");
CREATE INDEX "hermes_insights_type_idx" ON "hermes_insights"("type");
CREATE INDEX "hermes_insights_isRead_idx" ON "hermes_insights"("isRead");
CREATE INDEX "hermes_insights_createdAt_idx" ON "hermes_insights"("createdAt");
CREATE INDEX "scheduled_posts_status_idx" ON "scheduled_posts"("status");
CREATE INDEX "scheduled_posts_scheduledAt_idx" ON "scheduled_posts"("scheduledAt");
CREATE INDEX "content_library_type_idx" ON "content_library"("type");
CREATE INDEX "content_library_platform_idx" ON "content_library"("platform");
CREATE INDEX "content_library_createdAt_idx" ON "content_library"("createdAt");
CREATE INDEX "content_library_isFavorite_idx" ON "content_library"("isFavorite");
CREATE UNIQUE INDEX "social_accounts_userId_platform_key" ON "social_accounts"("userId", "platform");
CREATE INDEX "social_accounts_userId_idx" ON "social_accounts"("userId");
CREATE INDEX "social_accounts_platform_idx" ON "social_accounts"("platform");
CREATE INDEX "post_logs_scheduledPostId_idx" ON "post_logs"("scheduledPostId");
CREATE INDEX "post_logs_platform_idx" ON "post_logs"("platform");
CREATE INDEX "post_logs_status_idx" ON "post_logs"("status");
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");
CREATE INDEX "api_keys_status_idx" ON "api_keys"("status");
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");
CREATE INDEX "api_key_usage_apiKeyId_idx" ON "api_key_usage"("apiKeyId");
CREATE INDEX "api_key_usage_createdAt_idx" ON "api_key_usage"("createdAt");
CREATE INDEX "api_key_usage_endpoint_idx" ON "api_key_usage"("endpoint");
CREATE INDEX "teams_ownerId_idx" ON "teams"("ownerId");
CREATE UNIQUE INDEX "team_members_teamId_userId_key" ON "team_members"("teamId", "userId");
CREATE INDEX "team_members_teamId_idx" ON "team_members"("teamId");
CREATE INDEX "team_members_userId_idx" ON "team_members"("userId");
CREATE INDEX "team_invitations_teamId_idx" ON "team_invitations"("teamId");
CREATE INDEX "team_invitations_email_idx" ON "team_invitations"("email");
CREATE INDEX "team_invitations_token_idx" ON "team_invitations"("token");
CREATE UNIQUE INDEX "team_invitations_token_key" ON "team_invitations"("token");
CREATE UNIQUE INDEX "whitelabel_configs_domain_key" ON "whitelabel_configs"("domain");
CREATE INDEX "whitelabel_configs_status_idx" ON "whitelabel_configs"("status");
CREATE INDEX "marketplace_listings_sellerId_idx" ON "marketplace_listings"("sellerId");
CREATE INDEX "marketplace_listings_category_idx" ON "marketplace_listings"("category");
CREATE INDEX "marketplace_listings_status_idx" ON "marketplace_listings"("status");
CREATE INDEX "marketplace_reviews_listingId_idx" ON "marketplace_reviews"("listingId");
CREATE INDEX "marketplace_reviews_userId_idx" ON "marketplace_reviews"("userId");
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");
CREATE INDEX "subscriptions_plan_idx" ON "subscriptions"("plan");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");
CREATE UNIQUE INDEX "usage_tracking_userId_period_key" ON "usage_tracking"("userId", "period");
CREATE INDEX "usage_tracking_userId_idx" ON "usage_tracking"("userId");
CREATE INDEX "ab_tests_status_idx" ON "ab_tests"("status");
CREATE INDEX "ab_tests_linkId_idx" ON "ab_tests"("linkId");
CREATE UNIQUE INDEX "trend_keywords_keyword_platform_period_key" ON "trend_keywords"("keyword", "platform", "period");
CREATE INDEX "trend_keywords_keyword_idx" ON "trend_keywords"("keyword");
CREATE INDEX "trend_keywords_platform_idx" ON "trend_keywords"("platform");
CREATE INDEX "trend_keywords_period_idx" ON "trend_keywords"("period");
CREATE INDEX "competitor_watches_userId_idx" ON "competitor_watches"("userId");
CREATE INDEX "competitor_watches_platform_idx" ON "competitor_watches"("platform");
CREATE INDEX "live_sessions_status_idx" ON "live_sessions"("status");
CREATE INDEX "live_sessions_scheduledAt_idx" ON "live_sessions"("scheduledAt");
CREATE UNIQUE INDEX "alert_preferences_userId_alertType_key" ON "alert_preferences"("userId", "alertType");
CREATE INDEX "alert_preferences_userId_idx" ON "alert_preferences"("userId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "click_records" ADD CONSTRAINT "click_records_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "affiliate_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "click_records" ADD CONSTRAINT "click_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "affiliate_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hermes_messages" ADD CONSTRAINT "hermes_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "hermes_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "api_key_usage" ADD CONSTRAINT "api_key_usage_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "marketplace_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
