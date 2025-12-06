// Universal Analytics Tracker
// Works with Supabase, NestJS, Laravel, or custom API backends

(function() {
    'use strict';
    
    const config = window.AnalyticsConfig;
    if (!config) {
        console.error('Analytics configuration not found');
        return;
    }
    
    // Initialize tracking data
    let analyticsData = {
        recordId: null,
        visitorId: getVisitorId(),
        sessionId: generateSessionId(),
        startTime: Date.now(),
        clicks: 0,
        events: [],
        lastUpdate: Date.now()
    };
    
    // Utility functions
    function getVisitorId() {
        let visitorId = localStorage.getItem('unilive_visitor_id');
        if (!visitorId) {
            visitorId = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now();
            localStorage.setItem('unilive_visitor_id', visitorId);
        }
        return visitorId;
    }
    
    function generateSessionId() {
        return 's_' + Math.random().toString(36).substr(2, 9) + Date.now();
    }
    
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
    
    // Map data to backend-specific field names
    function mapFields(data) {
        const mapping = config.fieldMappings[config.backend];
        if (!mapping) {
            console.error('No field mapping for backend:', config.backend);
            return data;
        }
        
        const mapped = {};
        for (const [key, value] of Object.entries(data)) {
            if (mapping[key]) {
                mapped[mapping[key]] = value;
            } else {
                mapped[key] = value; // Keep unmapped fields
            }
        }
        return mapped;
    }
    
    // Backend-specific API calls
    async function sendToBackend(data, isUpdate = false) {
        const backend = config.backend;
        const endpoint = config.endpoints[backend];
        
        if (!endpoint || !endpoint.url || endpoint.url.includes('%')) {
            if (config.options.debug) {
                console.log('Analytics backend not configured');
            }
            return;
        }
        
        const mappedData = mapFields(data);
        
        try {
            let response;
            
            switch (backend) {
                case 'supabase':
                    response = await sendToSupabase(mappedData, isUpdate);
                    break;
                case 'nestjs':
                    response = await sendToNestJS(mappedData, isUpdate);
                    break;
                case 'laravel':
                    response = await sendToLaravel(mappedData, isUpdate);
                    break;
                case 'custom':
                    response = await sendToCustom(mappedData, isUpdate);
                    break;
                default:
                    console.error('Unknown backend:', backend);
                    return;
            }
            
            if (response && response.id && !analyticsData.recordId) {
                analyticsData.recordId = response.id;
            }
            
            return response;
        } catch (error) {
            if (config.options.debug) {
                console.error('Analytics error:', error);
            }
            // Implement retry logic
            if (config.options.maxRetries > 0) {
                setTimeout(() => {
                    config.options.maxRetries--;
                    sendToBackend(data, isUpdate);
                }, config.options.retryDelay);
            }
        }
    }
    
    async function sendToSupabase(data, isUpdate) {
        const endpoint = config.endpoints.supabase;
        const url = isUpdate && analyticsData.recordId
            ? `${endpoint.url}/rest/v1/${endpoint.table}?id=eq.${analyticsData.recordId}`
            : `${endpoint.url}/rest/v1/${endpoint.table}`;
        
        const response = await fetch(url, {
            method: isUpdate ? 'PATCH' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': endpoint.anonKey,
                'Authorization': `Bearer ${endpoint.anonKey}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error(`Supabase error: ${response.status}`);
        return isUpdate ? null : await response.json();
    }
    
    async function sendToNestJS(data, isUpdate) {
        const endpoint = config.endpoints.nestjs;
        const url = isUpdate && analyticsData.recordId
            ? `${endpoint.url}${endpoint.analyticsEndpoint}/${analyticsData.recordId}`
            : `${endpoint.url}${endpoint.analyticsEndpoint}`;
        
        const response = await fetch(url, {
            method: isUpdate ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${endpoint.apiKey}`,
                'X-API-Key': endpoint.apiKey
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error(`NestJS error: ${response.status}`);
        return await response.json();
    }
    
    async function sendToLaravel(data, isUpdate) {
        const endpoint = config.endpoints.laravel;
        const url = isUpdate && analyticsData.recordId
            ? `${endpoint.url}${endpoint.analyticsEndpoint}/${analyticsData.recordId}`
            : `${endpoint.url}${endpoint.analyticsEndpoint}`;
        
        const response = await fetch(url, {
            method: isUpdate ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${endpoint.apiKey}`,
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error(`Laravel error: ${response.status}`);
        return await response.json();
    }
    
    async function sendToCustom(data, isUpdate) {
        const endpoint = config.endpoints.custom;
        const url = isUpdate && analyticsData.recordId
            ? `${endpoint.url}${endpoint.analyticsEndpoint}/${analyticsData.recordId}`
            : `${endpoint.url}${endpoint.analyticsEndpoint}`;
        
        const response = await fetch(url, {
            method: isUpdate ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${endpoint.apiKey}`
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error(`Custom API error: ${response.status}`);
        return await response.json();
    }
    
    // Tracking functions
    function trackPageView() {
        if (!config.options.trackPageViews) return;
        
        const deviceInfo = getDeviceInfo();
        const referralInfo = getReferralInfo();
        
        const data = {
            visitorId: analyticsData.visitorId,
            sessionId: analyticsData.sessionId,
            pageOwnerUsername: config.pageOwner.username,
            pageOwnerInviteCode: config.pageOwner.inviteCode,
            pageUrl: window.location.href,
            referrerUrl: document.referrer || null,
            ...referralInfo,
            ...deviceInfo,
            timeOnPage: 0,
            clicksCount: 0,
            ctaClicked: false,
            registered: false
        };
        
        sendToBackend(data, false);
        
        // Start time tracking
        if (config.options.trackTimeOnPage) {
            setInterval(updateTimeOnPage, config.options.timeOnPageInterval);
        }
    }
    
    function updateTimeOnPage() {
        if (!analyticsData.recordId) return;
        
        const timeOnPage = Math.floor((Date.now() - analyticsData.startTime) / 1000);
        
        sendToBackend({
            timeOnPage: timeOnPage,
            clicksCount: analyticsData.clicks
        }, true);
    }
    
    function trackClick(event) {
        if (!config.options.trackClicks) return;
        
        analyticsData.clicks++;
        
        const target = event.target;
        const isCtaButton = target.classList.contains('cta-button') || 
                           target.closest('.cta-button') ||
                           target.href?.includes('app.unilivehub.com');
        
        if (isCtaButton && analyticsData.recordId) {
            sendToBackend({
                ctaClicked: true,
                clicksCount: analyticsData.clicks
            }, true);
        }
    }
    
    function trackRegistration() {
        if (!config.options.trackRegistrations || !analyticsData.recordId) return;
        
        sendToBackend({
            registered: true
        }, true);
    }
    
    // Send final update before page unload
    function sendFinalUpdate() {
        if (!analyticsData.recordId) return;
        
        const timeOnPage = Math.floor((Date.now() - analyticsData.startTime) / 1000);
        const data = mapFields({
            timeOnPage: timeOnPage,
            clicksCount: analyticsData.clicks
        });
        
        // Use sendBeacon for reliability
        const endpoint = config.endpoints[config.backend];
        if (endpoint && navigator.sendBeacon) {
            const beaconData = new Blob([JSON.stringify(data)], { type: 'application/json' });
            navigator.sendBeacon(
                `${endpoint.url}${endpoint.analyticsEndpoint || '/analytics'}/${analyticsData.recordId}`,
                beaconData
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
    
    window.addEventListener('beforeunload', sendFinalUpdate);
    
    // Track high engagement
    let engagementTimer = null;
    function checkHighEngagement() {
        const timeOnPage = Math.floor((Date.now() - analyticsData.startTime) / 1000);
        
        // High engagement: >2 minutes on page or >10 clicks
        if ((timeOnPage > 120 || analyticsData.clicks > 10) && !analyticsData.highEngagementTracked) {
            analyticsData.highEngagementTracked = true;
            
            if (window.UniLiveAnalytics && window.UniLiveAnalytics.trackEvent) {
                window.UniLiveAnalytics.trackEvent('high_engagement', {
                    visitorId: analyticsData.visitorId,
                    timeOnPage: timeOnPage,
                    clicks: analyticsData.clicks,
                    pagesViewed: 1
                });
            }
        }
    }
    
    // Start engagement monitoring
    engagementTimer = setInterval(checkHighEngagement, 30000);
    
    // Public API
    window.UniLiveAnalytics = {
        trackEvent: function(eventType, eventData) {
            const data = {
                visitorAnalyticsId: analyticsData.recordId,
                eventType: eventType,
                eventData: eventData,
                timestamp: new Date().toISOString()
            };
            
            // Send event to backend
            sendToBackend(data, false);
            
            // Special handling for registration events
            if (eventType === 'registration' && !eventData) {
                // Auto-populate registration data
                eventData = {
                    visitorId: analyticsData.visitorId,
                    sessionId: analyticsData.sessionId,
                    deviceType: getDeviceInfo().deviceType,
                    referralSource: getReferralInfo().referralSource,
                    utmSource: getReferralInfo().utmSource,
                    utmCampaign: getReferralInfo().utmCampaign
                };
            }
        },
        getVisitorId: () => analyticsData.visitorId,
        getSessionId: () => analyticsData.sessionId,
        getRecordId: () => analyticsData.recordId,
        updateField: (field, value) => {
            if (analyticsData.recordId) {
                const data = {};
                data[field] = value;
                sendToBackend(data, true);
            }
        },
        getStats: () => {
            // This would ideally fetch from backend, but for now return current session
            return {
                totalVisitors: 1,
                registrations: analyticsData.registered ? 1 : 0,
                currentSession: {
                    timeOnPage: Math.floor((Date.now() - analyticsData.startTime) / 1000),
                    clicks: analyticsData.clicks,
                    ctaClicked: analyticsData.ctaClicked
                }
            };
        }
    };
})();