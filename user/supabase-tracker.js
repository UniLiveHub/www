// Supabase Analytics Tracker
// This module sends visitor analytics to Supabase

(function() {
    'use strict';
    
    // Supabase configuration (will be replaced during build)
    const SUPABASE_URL = '%SUPABASE_URL%' || 'https://your-project.supabase.co';
    const SUPABASE_ANON_KEY = '%SUPABASE_ANON_KEY%' || 'your-anon-key';
    const SUPABASE_SERVICE_KEY = '%SUPABASE_SERVICE_KEY%' || 'your-service-key';
    
    // Page owner info (replaced during build)
    const PAGE_OWNER = {
        username: 'user',
        inviteCode: 'ITfssi',
        fullName: 'UniLiveHub'
    };
    
    // Initialize tracking data
    let visitorData = {
        visitorId: getVisitorId(),
        sessionId: generateSessionId(),
        pageOwnerUsername: PAGE_OWNER.username,
        pageOwnerInviteCode: PAGE_OWNER.inviteCode,
        startTime: Date.now(),
        clicks: 0,
        events: []
    };
    
    // Get or create visitor ID
    function getVisitorId() {
        let visitorId = localStorage.getItem('unilive_visitor_id');
        if (!visitorId) {
            visitorId = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now();
            localStorage.setItem('unilive_visitor_id', visitorId);
        }
        return visitorId;
    }
    
    // Generate session ID
    function generateSessionId() {
        return 's_' + Math.random().toString(36).substr(2, 9) + Date.now();
    }
    
    // Get device info
    function getDeviceInfo() {
        const ua = navigator.userAgent;
        const mobile = /Mobile|Android|iPhone|iPad/i.test(ua);
        const tablet = /iPad|Android(?!.*Mobile)/i.test(ua);
        
        return {
            deviceType: tablet ? 'tablet' : mobile ? 'mobile' : 'desktop',
            userAgent: ua,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            language: navigator.language || 'en'
        };
    }
    
    // Get referral info from URL and storage
    function getReferralInfo() {
        const stored = JSON.parse(localStorage.getItem('unilive_referral') || '{}');
        const urlParams = new URLSearchParams(window.location.search);
        
        return {
            referralSource: stored.referrer || urlParams.get('ref') || null,
            referralCode: stored.code || urlParams.get('code') || null,
            referralType: stored.referrer ? 'referral' : 'organic',
            utmSource: urlParams.get('utm_source') || null,
            utmMedium: urlParams.get('utm_medium') || null,
            utmCampaign: urlParams.get('utm_campaign') || null,
            utmTerm: urlParams.get('utm_term') || null,
            utmContent: urlParams.get('utm_content') || null
        };
    }
    
    // Send data to Supabase
    async function sendToSupabase(data) {
        // Skip if no valid keys
        if (!SUPABASE_URL || SUPABASE_URL.includes('%') || 
            !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('%')) {
            console.log('Supabase not configured, skipping analytics');
            return;
        }
        
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/visitor_analytics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                console.error('Failed to send analytics:', response.status);
            }
        } catch (error) {
            console.error('Analytics error:', error);
        }
    }
    
    // Track page view on load
    function trackPageView() {
        const deviceInfo = getDeviceInfo();
        const referralInfo = getReferralInfo();
        
        const analyticsData = {
            visitor_id: visitorData.visitorId,
            session_id: visitorData.sessionId,
            page_owner_username: visitorData.pageOwnerUsername,
            page_owner_invite_code: visitorData.pageOwnerInviteCode,
            page_url: window.location.href,
            referrer_url: document.referrer || null,
            page_language: deviceInfo.language,
            ...referralInfo,
            ...deviceInfo,
            time_on_page: 0,
            clicks_count: 0
        };
        
        // Store analytics ID for updates
        sendToSupabase(analyticsData).then(() => {
            visitorData.analyticsId = analyticsData.id;
        });
        
        // Update time on page every 30 seconds
        setInterval(() => {
            updateTimeOnPage();
        }, 30000);
    }
    
    // Update time on page
    function updateTimeOnPage() {
        const timeOnPage = Math.floor((Date.now() - visitorData.startTime) / 1000);
        
        if (visitorData.analyticsId) {
            sendToSupabase({
                id: visitorData.analyticsId,
                time_on_page: timeOnPage,
                clicks_count: visitorData.clicks
            });
        }
    }
    
    // Track clicks
    function trackClick(event) {
        visitorData.clicks++;
        
        const target = event.target;
        const isCtaButton = target.classList.contains('cta-button') || 
                           target.closest('.cta-button');
        
        if (isCtaButton && visitorData.analyticsId) {
            sendToSupabase({
                id: visitorData.analyticsId,
                cta_clicked: true,
                clicks_count: visitorData.clicks
            });
        }
    }
    
    // Track registration
    function trackRegistration() {
        if (visitorData.analyticsId) {
            sendToSupabase({
                id: visitorData.analyticsId,
                registered: true
            });
        }
    }
    
    // Send final update before page unload
    function sendFinalUpdate() {
        if (visitorData.analyticsId) {
            const timeOnPage = Math.floor((Date.now() - visitorData.startTime) / 1000);
            
            // Use sendBeacon for reliability
            const data = JSON.stringify({
                id: visitorData.analyticsId,
                time_on_page: timeOnPage,
                clicks_count: visitorData.clicks
            });
            
            navigator.sendBeacon(
                `${SUPABASE_URL}/rest/v1/visitor_analytics?id=eq.${visitorData.analyticsId}`,
                data
            );
        }
    }
    
    // Initialize tracking
    document.addEventListener('DOMContentLoaded', () => {
        trackPageView();
        document.addEventListener('click', trackClick);
        
        // Track registration links
        document.querySelectorAll('a[href*="app.unilivehub.com"]').forEach(link => {
            link.addEventListener('click', trackRegistration);
        });
    });
    
    // Send final update on page unload
    window.addEventListener('beforeunload', sendFinalUpdate);
    
    // Expose tracking functions for external use
    window.UniLiveAnalytics = {
        trackEvent: function(eventType, eventData) {
            if (visitorData.analyticsId) {
                sendToSupabase({
                    visitor_analytics_id: visitorData.analyticsId,
                    event_type: eventType,
                    event_data: eventData
                });
            }
        },
        getVisitorId: () => visitorData.visitorId,
        getSessionId: () => visitorData.sessionId
    };
})();