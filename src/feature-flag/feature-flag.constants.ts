import { FeatureFlagScope } from '@prisma/client';

export type FeatureFlagDefinition = {
  key: string;
  group: string;
  description: string;
  scope: FeatureFlagScope;
};

/**
 * Default feature flags (all enabled). Upserted on API startup; `enabled` is preserved for existing rows.
 */
export const FEATURE_FLAG_DEFINITIONS: FeatureFlagDefinition[] = [
  // 1. Account and Authentication
  {
    key: 'auth.emailPasswordLogin',
    group: 'Account and Authentication',
    description: 'Username/email + password login',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'auth.googleLogin',
    group: 'Account and Authentication',
    description: 'Google OAuth login and signup',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'auth.publicSignup',
    group: 'Account and Authentication',
    description: 'Public account registration',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'auth.forgotPasswordUi',
    group: 'Account and Authentication',
    description: 'Forgot-password UI (reset flow may be incomplete)',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'auth.deviceManagement',
    group: 'Account and Authentication',
    description: 'Device registration, list, revoke for E2EE messaging',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },

  // 2. Social Feed and Discovery
  {
    key: 'social.homeFeed',
    group: 'Social Feed and Discovery',
    description: 'Home feed and ranked timeline',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'social.feedRanking',
    group: 'Social Feed and Discovery',
    description: 'Advanced feed ranking (reply boost, weights)',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'social.exploreSearch',
    group: 'Social Feed and Discovery',
    description: 'Explore search and post/user search APIs',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'social.profiles',
    group: 'Social Feed and Discovery',
    description: 'Public profiles and user post grids',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'social.history',
    group: 'Social Feed and Discovery',
    description: 'Watch history, liked videos, unlocked library',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'social.watchTogether',
    group: 'Social Feed and Discovery',
    description: 'Watch Together video co-viewing sessions',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'social.watchTogetherHostApproval',
    group: 'Social Feed and Discovery',
    description: 'Watch Together host approval for join requests',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'social.watchTogetherSessionChat',
    group: 'Social Feed and Discovery',
    description: 'Watch Together in-session chat (session-scoped messages)',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'social.watchTogetherSessionReactions',
    group: 'Social Feed and Discovery',
    description: 'Watch Together ephemeral emoji reactions overlay',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'social.ads',
    group: 'Social Feed and Discovery',
    description: 'Third-party ads on web feed (e.g. AdSense)',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },

  // 3. Posting and Engagement
  {
    key: 'posting.createShortPost',
    group: 'Posting and Engagement',
    description: 'Create short text/media posts',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'posting.createLongPost',
    group: 'Posting and Engagement',
    description: 'Create long multi-slide posts',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'posting.uploadVideo',
    group: 'Posting and Engagement',
    description: 'Dedicated video upload / video-oriented posts',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'posting.drafts',
    group: 'Posting and Engagement',
    description: 'Draft posts and publish flow',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'posting.comments',
    group: 'Posting and Engagement',
    description: 'Comments and replies',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'posting.likes',
    group: 'Posting and Engagement',
    description: 'Post likes',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'posting.bookmarks',
    group: 'Posting and Engagement',
    description: 'Post bookmarks',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'posting.mentions',
    group: 'Posting and Engagement',
    description: 'Mention notifications in posts',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'posting.quotes',
    group: 'Posting and Engagement',
    description: 'Quoted posts display and creation',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },

  // 4. Media, Playback, and Processing
  {
    key: 'media.uploads',
    group: 'Media, Playback, and Processing',
    description: 'File uploads',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'media.imageUploads',
    group: 'Media, Playback, and Processing',
    description: 'Image uploads',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'media.videoUploads',
    group: 'Media, Playback, and Processing',
    description: 'Video uploads',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'media.audioUploads',
    group: 'Media, Playback, and Processing',
    description: 'Audio uploads',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'media.publicMediaServing',
    group: 'Media, Playback, and Processing',
    description: 'Public media URLs (/file/media)',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'media.secureStreaming',
    group: 'Media, Playback, and Processing',
    description: 'Gated ranged streaming (/file/stream)',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'media.videoTranscoding',
    group: 'Media, Playback, and Processing',
    description: 'Background video transcode queue (HLS/R2)',
    scope: FeatureFlagScope.ADMIN_ONLY,
  },
  {
    key: 'media.autoplayTrailers',
    group: 'Media, Playback, and Processing',
    description: 'Feed/profile trailer autoplay (client UX)',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },

  // 5. Coins, Unlocks, and Paid Content
  {
    key: 'coins.wallet',
    group: 'Coins and Paid Content',
    description: 'Coin wallet balance',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'coins.packages',
    group: 'Coins and Paid Content',
    description: 'Coin packages listing',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'coins.stripeCheckout',
    group: 'Coins and Paid Content',
    description: 'Stripe checkout for coin purchases',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'coins.appleIap',
    group: 'Coins and Paid Content',
    description: 'Apple In-App Purchase verification',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'coins.googlePlayBilling',
    group: 'Coins and Paid Content',
    description: 'Google Play billing verification',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'coins.paidUnlocks',
    group: 'Coins and Paid Content',
    description: 'Paid post unlocks and quotes',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'coins.autoPricing',
    group: 'Coins and Paid Content',
    description: 'Automatic monetization pricing / repricing',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'coins.adminAdjustments',
    group: 'Coins and Paid Content',
    description: 'Admin coin ledger adjustments',
    scope: FeatureFlagScope.ADMIN_ONLY,
  },

  // 6. Creator Studio and Payouts
  {
    key: 'creator.studioAccess',
    group: 'Creator Studio',
    description: 'Creator studio app access',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'creator.walletDashboard',
    group: 'Creator Studio',
    description: 'Creator wallet summary dashboard',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'creator.analyticsLedger',
    group: 'Creator Studio',
    description: 'Creator wallet ledger analytics',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'creator.stripeConnect',
    group: 'Creator Studio',
    description: 'Stripe Connect onboarding and status',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'creator.payoutRequests',
    group: 'Creator Studio',
    description: 'Creator payout requests',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'creator.payoutConversionConfig',
    group: 'Creator Studio',
    description: 'Expose payout conversion copy/config to studio',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },

  // 7. Messaging and E2EE
  {
    key: 'messaging.rooms',
    group: 'Messaging',
    description: 'Chat rooms list and room REST APIs',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'messaging.directMessages',
    group: 'Messaging',
    description: 'DM compose and find-create flows',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'messaging.realtimeSocket',
    group: 'Messaging',
    description: 'Socket.IO realtime messaging',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'messaging.e2ee',
    group: 'Messaging',
    description: 'End-to-end encrypted envelopes',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'messaging.multiDeviceSync',
    group: 'Messaging',
    description: 'Multi-device envelope fanout',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'messaging.unreadBadges',
    group: 'Messaging',
    description: 'Unread message badges (client)',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },

  // 8. Notifications
  {
    key: 'notifications.inApp',
    group: 'Notifications',
    description: 'In-app notification list and mutations',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'notifications.realtimeSse',
    group: 'Notifications',
    description: 'SSE live notification stream',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'notifications.pushTokens',
    group: 'Notifications',
    description: 'Push token registration',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'notifications.expoPush',
    group: 'Notifications',
    description: 'Expo push delivery',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },
  {
    key: 'notifications.socialEvents',
    group: 'Notifications',
    description: 'Social event notifications (post, comment, like)',
    scope: FeatureFlagScope.CLIENT_SAFE,
  },

  // 9. Admin Operations
  {
    key: 'admin.dashboard',
    group: 'Admin',
    description: 'Admin operational dashboard',
    scope: FeatureFlagScope.ADMIN_ONLY,
  },
  {
    key: 'admin.users',
    group: 'Admin',
    description: 'Admin user management',
    scope: FeatureFlagScope.ADMIN_ONLY,
  },
  {
    key: 'admin.posts',
    group: 'Admin',
    description: 'Admin post moderation',
    scope: FeatureFlagScope.ADMIN_ONLY,
  },
  {
    key: 'admin.videos',
    group: 'Admin',
    description: 'Admin video post moderation',
    scope: FeatureFlagScope.ADMIN_ONLY,
  },
  {
    key: 'admin.files',
    group: 'Admin',
    description: 'Admin file moderation',
    scope: FeatureFlagScope.ADMIN_ONLY,
  },
  {
    key: 'admin.coinPackages',
    group: 'Admin',
    description: 'Admin coin package management',
    scope: FeatureFlagScope.ADMIN_ONLY,
  },
  {
    key: 'admin.coinLedger',
    group: 'Admin',
    description: 'Admin coin ledger browse',
    scope: FeatureFlagScope.ADMIN_ONLY,
  },
  {
    key: 'admin.featureFlags',
    group: 'Admin',
    description:
      'Manage feature flags (always keep enabled in production unless locked)',
    scope: FeatureFlagScope.ADMIN_ONLY,
  },

  // 10. Platform
  {
    key: 'platform.healthChecks',
    group: 'Platform',
    description: 'Public health check endpoints',
    scope: FeatureFlagScope.ADMIN_ONLY,
  },
  {
    key: 'platform.rateLimiting',
    group: 'Platform',
    description: 'HTTP rate limiting (Throttler)',
    scope: FeatureFlagScope.ADMIN_ONLY,
  },
  {
    key: 'platform.redisQueues',
    group: 'Platform',
    description: 'Redis-backed BullMQ queues',
    scope: FeatureFlagScope.ADMIN_ONLY,
  },
  {
    key: 'platform.objectStorageR2',
    group: 'Platform',
    description: 'Cloudflare R2 object storage paths',
    scope: FeatureFlagScope.ADMIN_ONLY,
  },
  {
    key: 'platform.cdnMediaUrls',
    group: 'Platform',
    description: 'CDN / FILE_BASE_URL for media',
    scope: FeatureFlagScope.ADMIN_ONLY,
  },
];
