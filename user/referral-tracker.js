/**
 * UniLive Referral Tracking System
 * Tracks referral codes and usernames from URL parameters
 * Ensures proper credit attribution for referrals
 */

(function() {
    'use strict';
    
    // Configuration
    const REFERRAL_CONFIG = {
        storageKey: 'unilive_referral',
        cookieName: 'unilive_ref',
        cookieDays: 30,
        defaultReferrer: 'alex',
        defaultCode: 'zyDK65',
        validParams: ['ref', 'code', 'invite', 'referrer', 'from', 'invitecode', 'refcode'],
        utmParams: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'],
        registrationUrls: [
            'https://h.unilive.io',
            'https://unilive.io',
            'https://app.unilive.io'
        ]
    };
    
    // Referral data structure
    let referralData = {
        referrer: 'user',     // Will be replaced during build
        inviteCode: 'ITfssi', // Will be replaced during build
        source: 'direct',
        timestamp: new Date().toISOString(),
        landingPage: window.location.href,
        utm: {
            source: null,
            medium: null,
            campaign: null,
            term: null,
            content: null
        }
    };
    
    /**
     * Get URL parameters
     */
    function getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key.toLowerCase()] = value;
        }
        return result;
    }
    
    /**
     * Validate invite code format
     */
    function isValidInviteCode(code) {
        // UniLive invite codes are typically 6 characters alphanumeric
        return /^[a-zA-Z0-9]{5,8}$/.test(code);
    }
    
    /**
     * Validate username format
     */
    function isValidUsername(username) {
        // Usernames are typically alphanumeric with possible underscores
        return /^[a-zA-Z0-9_]{3,20}$/.test(username);
    }
    
    /**
     * Extract UTM parameters from URL
     */
    function extractUTMParams() {
        const params = getUrlParams();
        const utm = {};
        
        REFERRAL_CONFIG.utmParams.forEach(param => {
            const shortName = param.replace('utm_', '');
            utm[shortName] = params[param] || null;
        });
        
        return utm;
    }
    
    /**
     * Send event to Google Analytics
     */
    function sendToGoogleAnalytics(eventName, parameters) {
        // Check if gtag is available
        if (typeof gtag === 'function') {
            gtag('event', eventName, parameters);
        } else if (typeof ga === 'function') {
            // Fallback for older Google Analytics
            ga('send', 'event', {
                eventCategory: 'Referral',
                eventAction: eventName,
                eventLabel: JSON.stringify(parameters)
            });
        }
    }
    
    /**
     * Track page view with UTM and referral data
     */
    function trackPageView(data) {
        const trackingData = {
            page_location: window.location.href,
            referrer: data.referrer,
            invite_code: data.inviteCode,
            source: data.source
        };
        
        // Add UTM parameters if they exist
        Object.keys(data.utm).forEach(key => {
            if (data.utm[key]) {
                trackingData[`utm_${key}`] = data.utm[key];
            }
        });
        
        // Send to Google Analytics
        sendToGoogleAnalytics('page_view_with_referral', trackingData);
    }
    
    /**
     * Extract referral info from URL parameters
     */
    function extractReferralFromUrl() {
        const params = getUrlParams();
        let referrer = null;
        let inviteCode = null;
        let source = 'url_param';
        
        // Check for various parameter names that might contain referral info
        for (const paramName of REFERRAL_CONFIG.validParams) {
            if (params[paramName]) {
                const value = params[paramName];
                
                // Check if it's a valid invite code
                if (isValidInviteCode(value)) {
                    inviteCode = value;
                }
                // Check if it's a valid username
                else if (isValidUsername(value)) {
                    referrer = value;
                }
            }
        }
        
        // Check specific parameter combinations
        if (params.ref && isValidUsername(params.ref)) {
            referrer = params.ref;
        }
        if (params.code && isValidInviteCode(params.code)) {
            inviteCode = params.code;
        }
        if (params.from && isValidUsername(params.from)) {
            referrer = params.from;
            source = 'shared_link';
        }
        
        return { referrer, inviteCode, source };
    }
    
    /**
     * Set cookie
     */
    function setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + expires.toUTCString() + ';path=/;SameSite=Lax';
    }
    
    /**
     * Get cookie
     */
    function getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
        return null;
    }
    
    /**
     * Save referral data to storage
     */
    function saveReferralData(data) {
        // Save to localStorage
        try {
            localStorage.setItem(REFERRAL_CONFIG.storageKey, JSON.stringify(data));
        } catch (e) {
            console.warn('LocalStorage not available');
        }
        
        // Save to cookie as backup (simplified version)
        const cookieData = `${data.referrer}|${data.inviteCode}`;
        setCookie(REFERRAL_CONFIG.cookieName, cookieData, REFERRAL_CONFIG.cookieDays);
        
        // Save UTM parameters separately if they exist
        if (data.utm && Object.values(data.utm).some(v => v !== null)) {
            setCookie('unilive_utm', JSON.stringify(data.utm), REFERRAL_CONFIG.cookieDays);
        }
    }
    
    /**
     * Load referral data from storage
     */
    function loadReferralData() {
        // Try localStorage first
        try {
            const stored = localStorage.getItem(REFERRAL_CONFIG.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Could not load from localStorage');
        }
        
        // Try cookie as fallback
        const cookieData = getCookie(REFERRAL_CONFIG.cookieName);
        let utmData = null;
        try {
            const utmCookie = getCookie('unilive_utm');
            if (utmCookie) {
                utmData = JSON.parse(utmCookie);
            }
        } catch (e) {
            console.warn('Could not parse UTM cookie');
        }
        
        if (cookieData) {
            const [referrer, inviteCode] = cookieData.split('|');
            return {
                referrer: referrer || REFERRAL_CONFIG.defaultReferrer,
                inviteCode: inviteCode || REFERRAL_CONFIG.defaultCode,
                source: 'cookie',
                timestamp: new Date().toISOString(),
                utm: utmData || { source: null, medium: null, campaign: null, term: null, content: null }
            };
        }
        
        return null;
    }
    
    /**
     * Update all registration links with referral parameters
     */
    function updateRegistrationLinks(data) {
        // Find all links that might be registration links
        const links = document.querySelectorAll('a[href*="unilive"]');
        
        links.forEach(element => {
            const href = element.getAttribute('href');
            if (href && REFERRAL_CONFIG.registrationUrls.some(url => href.includes(url))) {
                // Check if the link already has recomId parameter
                const url = new URL(href, window.location.origin);
                
                // Update or add recomId parameter
                url.searchParams.set('recomId', data.inviteCode);
                
                // Add referrer and source if not already present
                if (!url.searchParams.has('referrer')) {
                    url.searchParams.set('referrer', data.referrer);
                }
                if (!url.searchParams.has('source')) {
                    url.searchParams.set('source', data.source);
                }
                
                element.setAttribute('href', url.toString());
            }
        });
        
        // Also update any onclick handlers that might open registration
        const registrationButtons = document.querySelectorAll('[onclick*="trackSignup"]');
        registrationButtons.forEach(button => {
            const originalOnclick = button.getAttribute('onclick');
            if (originalOnclick && !originalOnclick.includes('updateReferralParams')) {
                // Wrap the original onclick to update URL parameters
                button.setAttribute('onclick', `updateReferralParams(event, '${data.inviteCode}', '${data.referrer}', '${data.source}'); ${originalOnclick}`);
            }
        });
    }
    
    /**
     * Helper function to update referral params before navigation
     */
    window.updateReferralParams = function(event, inviteCode, referrer, source) {
        // Find the link element that was clicked
        const link = event.currentTarget;
        if (link && link.tagName === 'A') {
            const href = link.getAttribute('href');
            if (href) {
                const url = new URL(href, window.location.origin);
                url.searchParams.set('recomId', inviteCode);
                url.searchParams.set('referrer', referrer);
                url.searchParams.set('source', source);
                link.setAttribute('href', url.toString());
            }
        }
    }
    
    /**
     * Initialize referral tracking
     */
    function initReferralTracking() {
        // Check URL parameters first
        const urlReferral = extractReferralFromUrl();
        const utmParams = extractUTMParams();
        
        // Load any existing referral data
        const storedReferral = loadReferralData();
        
        // Determine final referral data
        if (urlReferral.referrer || urlReferral.inviteCode || Object.values(utmParams).some(v => v !== null)) {
            // URL parameters take precedence
            referralData.referrer = urlReferral.referrer || referralData.referrer;
            referralData.inviteCode = urlReferral.inviteCode || referralData.inviteCode;
            referralData.source = urlReferral.source;
            referralData.timestamp = new Date().toISOString();
            referralData.utm = utmParams;
            
            // Save the new referral data
            saveReferralData(referralData);
        } else if (storedReferral) {
            // Use stored referral data
            referralData = storedReferral;
        } else {
            // Use page owner's referral data (from template variables)
            // These will be replaced during build
            if (referralData.referrer === 'user' || !isValidUsername(referralData.referrer)) {
                referralData.referrer = REFERRAL_CONFIG.defaultReferrer;
            }
            if (referralData.inviteCode === 'ITfssi' || !isValidInviteCode(referralData.inviteCode)) {
                referralData.inviteCode = REFERRAL_CONFIG.defaultCode;
            }
            
            // Save the default referral data
            saveReferralData(referralData);
        }
        
        // Update all registration links
        updateRegistrationLinks(referralData);
        
        // Track page view with referral and UTM data
        trackPageView(referralData);
        
        // Log referral data for debugging
        console.log('UniLive Referral Data:', referralData);
        
        // Make referral data available globally
        window.uniliveReferral = referralData;
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initReferralTracking);
    } else {
        initReferralTracking();
    }
    
    // Re-initialize when new content is added dynamically
    window.addEventListener('unilive:content-updated', function() {
        updateRegistrationLinks(referralData);
    });
    
    // Track registration button clicks
    window.trackSignup = function(source) {
        const trackingData = {
            event_category: 'Registration',
            event_label: source,
            referrer: referralData.referrer,
            invite_code: referralData.inviteCode,
            referral_source: referralData.source
        };
        
        // Add UTM parameters
        Object.keys(referralData.utm).forEach(key => {
            if (referralData.utm[key]) {
                trackingData[`utm_${key}`] = referralData.utm[key];
            }
        });
        
        sendToGoogleAnalytics('signup_click', trackingData);
    };
    
})();