// Analytics Configuration
// Configure which analytics backend to use and field mappings

window.AnalyticsConfig = {
    // Backend type: 'supabase', 'nestjs', 'laravel', or 'custom'
    backend: '%ANALYTICS_BACKEND%' || 'supabase',
    
    // API endpoints for each backend
    endpoints: {
        supabase: {
            url: '%SUPABASE_URL%' || 'https://your-project.supabase.co',
            anonKey: '%SUPABASE_ANON_KEY%' || '',
            table: 'visitor_analytics'
        },
        nestjs: {
            url: '%NESTJS_API_URL%' || 'https://api.example.com',
            apiKey: '%NESTJS_API_KEY%' || '',
            analyticsEndpoint: '/api/v1/analytics/visitors'
        },
        laravel: {
            url: '%LARAVEL_API_URL%' || 'https://api.example.com',
            apiKey: '%LARAVEL_API_KEY%' || '',
            analyticsEndpoint: '/api/analytics/visitors'
        },
        custom: {
            url: '%CUSTOM_API_URL%' || '',
            apiKey: '%CUSTOM_API_KEY%' || '',
            analyticsEndpoint: '%CUSTOM_ANALYTICS_ENDPOINT%' || '/analytics'
        }
    },
    
    // Field mappings for different backends
    fieldMappings: {
        supabase: {
            // Direct field names for Supabase
            visitorId: 'visitor_id',
            sessionId: 'session_id',
            pageOwnerUsername: 'page_owner_username',
            pageOwnerInviteCode: 'page_owner_invite_code',
            pageUrl: 'page_url',
            referrerUrl: 'referrer_url',
            referralSource: 'referral_source',
            referralCode: 'referral_code',
            referralType: 'referral_type',
            utmSource: 'utm_source',
            utmMedium: 'utm_medium',
            utmCampaign: 'utm_campaign',
            utmTerm: 'utm_term',
            utmContent: 'utm_content',
            deviceType: 'device_type',
            userAgent: 'user_agent',
            screenWidth: 'screen_width',
            screenHeight: 'screen_height',
            language: 'page_language',
            timeOnPage: 'time_on_page',
            clicksCount: 'clicks_count',
            ctaClicked: 'cta_clicked',
            registered: 'registered'
        },
        nestjs: {
            // NestJS/TypeORM typical field names
            visitorId: 'visitorId',
            sessionId: 'sessionId',
            pageOwnerUsername: 'pageOwnerUsername',
            pageOwnerInviteCode: 'pageOwnerInviteCode',
            pageUrl: 'pageUrl',
            referrerUrl: 'referrerUrl',
            referralSource: 'referralSource',
            referralCode: 'referralCode',
            referralType: 'referralType',
            utmSource: 'utmSource',
            utmMedium: 'utmMedium',
            utmCampaign: 'utmCampaign',
            utmTerm: 'utmTerm',
            utmContent: 'utmContent',
            deviceType: 'deviceType',
            userAgent: 'userAgent',
            screenWidth: 'screenWidth',
            screenHeight: 'screenHeight',
            language: 'language',
            timeOnPage: 'timeOnPage',
            clicksCount: 'clicksCount',
            ctaClicked: 'ctaClicked',
            registered: 'hasRegistered'
        },
        laravel: {
            // Laravel/Eloquent typical field names
            visitorId: 'visitor_id',
            sessionId: 'session_id',
            pageOwnerUsername: 'page_owner_username',
            pageOwnerInviteCode: 'page_owner_invite_code',
            pageUrl: 'page_url',
            referrerUrl: 'referrer_url',
            referralSource: 'referral_source',
            referralCode: 'referral_code',
            referralType: 'referral_type',
            utmSource: 'utm_source',
            utmMedium: 'utm_medium',
            utmCampaign: 'utm_campaign',
            utmTerm: 'utm_term',
            utmContent: 'utm_content',
            deviceType: 'device_type',
            userAgent: 'user_agent',
            screenWidth: 'screen_width',
            screenHeight: 'screen_height',
            language: 'language',
            timeOnPage: 'time_on_page',
            clicksCount: 'clicks_count',
            ctaClicked: 'cta_clicked',
            registered: 'is_registered'
        },
        custom: {
            // Custom field mappings (can be overridden)
            visitorId: '%FIELD_VISITOR_ID%' || 'visitor_id',
            sessionId: '%FIELD_SESSION_ID%' || 'session_id',
            pageOwnerUsername: '%FIELD_PAGE_OWNER_USERNAME%' || 'page_owner_username',
            pageOwnerInviteCode: '%FIELD_PAGE_OWNER_INVITE_CODE%' || 'page_owner_invite_code',
            pageUrl: '%FIELD_PAGE_URL%' || 'page_url',
            referrerUrl: '%FIELD_REFERRER_URL%' || 'referrer_url',
            referralSource: '%FIELD_REFERRAL_SOURCE%' || 'referral_source',
            referralCode: '%FIELD_REFERRAL_CODE%' || 'referral_code',
            referralType: '%FIELD_REFERRAL_TYPE%' || 'referral_type',
            utmSource: '%FIELD_UTM_SOURCE%' || 'utm_source',
            utmMedium: '%FIELD_UTM_MEDIUM%' || 'utm_medium',
            utmCampaign: '%FIELD_UTM_CAMPAIGN%' || 'utm_campaign',
            utmTerm: '%FIELD_UTM_TERM%' || 'utm_term',
            utmContent: '%FIELD_UTM_CONTENT%' || 'utm_content',
            deviceType: '%FIELD_DEVICE_TYPE%' || 'device_type',
            userAgent: '%FIELD_USER_AGENT%' || 'user_agent',
            screenWidth: '%FIELD_SCREEN_WIDTH%' || 'screen_width',
            screenHeight: '%FIELD_SCREEN_HEIGHT%' || 'screen_height',
            language: '%FIELD_LANGUAGE%' || 'language',
            timeOnPage: '%FIELD_TIME_ON_PAGE%' || 'time_on_page',
            clicksCount: '%FIELD_CLICKS_COUNT%' || 'clicks_count',
            ctaClicked: '%FIELD_CTA_CLICKED%' || 'cta_clicked',
            registered: '%FIELD_REGISTERED%' || 'registered'
        }
    },
    
    // Additional configuration options
    options: {
        // Enable/disable specific tracking features
        trackPageViews: true,
        trackClicks: true,
        trackTimeOnPage: true,
        trackRegistrations: true,
        trackUtmParams: true,
        
        // Update intervals
        timeOnPageInterval: 30000, // 30 seconds
        
        // Retry settings
        maxRetries: 3,
        retryDelay: 1000,
        
        // Debug mode
        debug: '%ANALYTICS_DEBUG%' === 'true' || false
    },
    
    // Page owner information (replaced during build)
    pageOwner: {
        username: 'alex',
        inviteCode: 'zyDK65',
        fullName: 'Александр Горетой'
    }
};