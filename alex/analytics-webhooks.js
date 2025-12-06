// Analytics Webhook System
// Sends real-time notifications for important events

(function() {
    'use strict';
    
    // Webhook configuration (replaced during build)
    const WEBHOOK_CONFIG = {
        enabled: '%WEBHOOK_ENABLED%' === 'true' || false,
        endpoints: {
            registration: '%WEBHOOK_REGISTRATION_URL%' || '',
            milestone: '%WEBHOOK_MILESTONE_URL%' || '',
            referral: '%WEBHOOK_REFERRAL_URL%' || '',
            custom: '%WEBHOOK_CUSTOM_URL%' || ''
        },
        secret: '%WEBHOOK_SECRET%' || '',
        retries: parseInt('%WEBHOOK_RETRIES%') || 3,
        timeout: parseInt('%WEBHOOK_TIMEOUT%') || 5000
    };
    
    // Milestone thresholds
    const MILESTONES = {
        visitors: [10, 50, 100, 500, 1000, 5000, 10000],
        registrations: [1, 5, 10, 25, 50, 100, 500],
        referrals: [5, 10, 25, 50, 100]
    };
    
    // Track milestones in localStorage
    const STORAGE_KEY = 'unilive_milestones';
    let achievedMilestones = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    
    // Generate webhook signature
    function generateSignature(payload) {
        if (!WEBHOOK_CONFIG.secret) return '';
        
        // Simple HMAC-like signature (in production, use proper HMAC)
        const data = JSON.stringify(payload);
        const hash = btoa(data + WEBHOOK_CONFIG.secret);
        return hash;
    }
    
    // Send webhook with retry logic
    async function sendWebhook(endpoint, payload, retries = WEBHOOK_CONFIG.retries) {
        if (!WEBHOOK_CONFIG.enabled || !endpoint || endpoint.includes('%')) {
            return;
        }
        
        const signature = generateSignature(payload);
        const headers = {
            'Content-Type': 'application/json',
            'X-UniLive-Signature': signature,
            'X-UniLive-Event': payload.event,
            'X-UniLive-Timestamp': new Date().toISOString()
        };
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_CONFIG.timeout);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok && retries > 0) {
                // Exponential backoff
                const delay = Math.pow(2, WEBHOOK_CONFIG.retries - retries) * 1000;
                setTimeout(() => {
                    sendWebhook(endpoint, payload, retries - 1);
                }, delay);
            }
        } catch (error) {
            if (retries > 0) {
                const delay = Math.pow(2, WEBHOOK_CONFIG.retries - retries) * 1000;
                setTimeout(() => {
                    sendWebhook(endpoint, payload, retries - 1);
                }, delay);
            }
        }
    }
    
    // Check and trigger milestone webhooks
    function checkMilestone(type, value, metadata = {}) {
        const milestoneKey = `${type}_${value}`;
        
        if (!achievedMilestones[milestoneKey] && MILESTONES[type]?.includes(value)) {
            achievedMilestones[milestoneKey] = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(achievedMilestones));
            
            const payload = {
                event: 'milestone_achieved',
                milestone: {
                    type: type,
                    value: value,
                    achieved_at: achievedMilestones[milestoneKey]
                },
                page_owner: {
                    username: window.AnalyticsConfig?.pageOwner?.username || 'alex',
                    invite_code: window.AnalyticsConfig?.pageOwner?.inviteCode || 'zyDK65'
                },
                metadata: metadata
            };
            
            sendWebhook(WEBHOOK_CONFIG.endpoints.milestone, payload);
        }
    }
    
    // Webhook event handlers
    const WebhookEvents = {
        // New registration webhook
        onRegistration: function(visitorData) {
            const payload = {
                event: 'new_registration',
                visitor: {
                    id: visitorData.visitorId,
                    session_id: visitorData.sessionId,
                    device_type: visitorData.deviceType,
                    referral_source: visitorData.referralSource,
                    utm_source: visitorData.utmSource,
                    utm_campaign: visitorData.utmCampaign
                },
                page_owner: {
                    username: window.AnalyticsConfig?.pageOwner?.username || 'alex',
                    invite_code: window.AnalyticsConfig?.pageOwner?.inviteCode || 'zyDK65'
                },
                timestamp: new Date().toISOString()
            };
            
            sendWebhook(WEBHOOK_CONFIG.endpoints.registration, payload);
        },
        
        // Successful referral webhook
        onReferralSuccess: function(referrerData) {
            const payload = {
                event: 'referral_success',
                referrer: {
                    username: referrerData.username,
                    code: referrerData.code
                },
                referred_visitor: {
                    id: referrerData.visitorId,
                    registered: referrerData.registered
                },
                page_owner: {
                    username: window.AnalyticsConfig?.pageOwner?.username || 'alex',
                    invite_code: window.AnalyticsConfig?.pageOwner?.inviteCode || 'zyDK65'
                },
                timestamp: new Date().toISOString()
            };
            
            sendWebhook(WEBHOOK_CONFIG.endpoints.referral, payload);
        },
        
        // Custom event webhook
        onCustomEvent: function(eventType, eventData) {
            const payload = {
                event: 'custom_event',
                type: eventType,
                data: eventData,
                page_owner: {
                    username: window.AnalyticsConfig?.pageOwner?.username || 'alex',
                    invite_code: window.AnalyticsConfig?.pageOwner?.inviteCode || 'zyDK65'
                },
                timestamp: new Date().toISOString()
            };
            
            sendWebhook(WEBHOOK_CONFIG.endpoints.custom, payload);
        },
        
        // High engagement webhook
        onHighEngagement: function(engagementData) {
            const payload = {
                event: 'high_engagement',
                visitor: {
                    id: engagementData.visitorId,
                    time_on_page: engagementData.timeOnPage,
                    clicks: engagementData.clicks,
                    pages_viewed: engagementData.pagesViewed
                },
                page_owner: {
                    username: window.AnalyticsConfig?.pageOwner?.username || 'alex',
                    invite_code: window.AnalyticsConfig?.pageOwner?.inviteCode || 'zyDK65'
                },
                timestamp: new Date().toISOString()
            };
            
            sendWebhook(WEBHOOK_CONFIG.endpoints.custom, payload);
        }
    };
    
    // Integration with main analytics
    function integrateWithAnalytics() {
        if (!window.UniLiveAnalytics) {
            setTimeout(integrateWithAnalytics, 500);
            return;
        }
        
        const originalTrackEvent = window.UniLiveAnalytics.trackEvent;
        window.UniLiveAnalytics.trackEvent = function(eventType, eventData) {
            // Call original function
            if (originalTrackEvent) {
                originalTrackEvent.call(this, eventType, eventData);
            }
            
            // Handle webhook events
            if (eventType === 'registration') {
                WebhookEvents.onRegistration(eventData);
            } else if (eventType === 'referral_success') {
                WebhookEvents.onReferralSuccess(eventData);
            } else if (eventType === 'high_engagement') {
                WebhookEvents.onHighEngagement(eventData);
            } else {
                WebhookEvents.onCustomEvent(eventType, eventData);
            }
        };
        
        // Expose webhook system
        window.UniLiveAnalytics.webhooks = WebhookEvents;
        window.UniLiveAnalytics.checkMilestone = checkMilestone;
    }
    
    // Monitor for milestones
    function monitorMilestones() {
        setInterval(() => {
            if (window.UniLiveAnalytics && window.UniLiveAnalytics.getStats) {
                const stats = window.UniLiveAnalytics.getStats();
                
                if (stats.totalVisitors) {
                    MILESTONES.visitors.forEach(milestone => {
                        if (stats.totalVisitors >= milestone) {
                            checkMilestone('visitors', milestone, stats);
                        }
                    });
                }
                
                if (stats.registrations) {
                    MILESTONES.registrations.forEach(milestone => {
                        if (stats.registrations >= milestone) {
                            checkMilestone('registrations', milestone, stats);
                        }
                    });
                }
            }
        }, 60000); // Check every minute
    }
    
    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        if (WEBHOOK_CONFIG.enabled) {
            integrateWithAnalytics();
            monitorMilestones();
            
            console.log('Analytics webhooks initialized');
        }
    });
    
    // Expose webhook configuration for testing
    window.UniLiveWebhooks = {
        config: WEBHOOK_CONFIG,
        send: sendWebhook,
        events: WebhookEvents,
        testWebhook: function(type = 'test') {
            const testPayload = {
                event: 'webhook_test',
                type: type,
                timestamp: new Date().toISOString()
            };
            
            sendWebhook(WEBHOOK_CONFIG.endpoints.custom, testPayload);
            console.log('Test webhook sent');
        }
    };
})();