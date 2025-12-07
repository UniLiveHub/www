/**
 * UniLive Translation System
 * Handles dynamic language switching and text replacement
 */

class UniLiveTranslator {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {};
        this.fallbackLanguage = 'en';
        this.isLoading = false;
        this.loadedLanguages = new Set();
        
        // Detect browser language or use stored preference
        this.detectLanguage();
        
        // Initialize translation system
        this.init();
    }

    /**
     * Detect user's preferred language
     */
    detectLanguage() {
        // Check for stored language preference
        const stored = localStorage.getItem('unilive_language');
        if (stored) {
            this.currentLanguage = stored;
            return;
        }

        // Detect from browser
        const browserLang = navigator.language.toLowerCase();
        const supportedLanguages = [
            'en', 'ko', 'ru', 'es', 'zh', 'ja', 'ar', 'fr', 'de', 'pt',
            'hi', 'tr', 'it', 'pl', 'th', 'vi', 'nl', 'sv', 'no', 'da'
        ];

        // Check for exact match
        if (supportedLanguages.includes(browserLang)) {
            this.currentLanguage = browserLang;
        } 
        // Check for language code match (e.g., 'en-US' -> 'en')
        else {
            const langCode = browserLang.split('-')[0];
            if (supportedLanguages.includes(langCode)) {
                this.currentLanguage = langCode;
            }
        }
    }

    /**
     * Initialize the translation system
     */
    async init() {
        try {
            // Load translations
            await this.loadTranslations();
            
            // Apply initial translations
            this.applyTranslations();
            
            // Set up language selector
            this.setupLanguageSelector();
            
            // Set up mutation observer for dynamic content
            this.setupMutationObserver();
            
            console.log(`UniLive Translator initialized with language: ${this.currentLanguage}`);
        } catch (error) {
            console.error('Failed to initialize translator:', error);
        }
    }

    /**
     * Load translation data
     */
    async loadTranslations() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        try {
            // Check if translations are embedded in the page
            const embeddedTranslations = window.UNILIVE_TRANSLATIONS;
            if (embeddedTranslations) {
                this.translations = embeddedTranslations;
                this.loadedLanguages.add(this.currentLanguage);
            } else {
                // Fallback: try to load from external file
                const response = await fetch('./translations.json');
                if (response.ok) {
                    const data = await response.json();
                    this.translations = data.translations || {};
                    this.loadedLanguages.add(this.currentLanguage);
                }
            }
        } catch (error) {
            console.warn('Could not load translations:', error);
            // Use fallback/default translations if available
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Get translation for a key
     */
    t(key, params = {}) {
        const translation = this.translations[key];
        
        if (!translation) {
            console.warn(`Translation missing for key: ${key}`);
            return key;
        }

        let text = translation[this.currentLanguage] || 
                   translation[this.fallbackLanguage] || 
                   key;

        // Replace parameters in translation
        Object.keys(params).forEach(param => {
            text = text.replace(new RegExp(`{${param}}`, 'g'), params[param]);
        });

        return text;
    }

    /**
     * Apply translations to all elements with data-i18n attribute
     */
    applyTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const keys = element.getAttribute('data-i18n').split(',');
            
            keys.forEach(keyInfo => {
                const [key, attr = 'textContent'] = keyInfo.split(':');
                const translation = this.t(key.trim());
                
                if (attr === 'textContent' || attr === 'text') {
                    element.textContent = translation;
                } else if (attr === 'innerHTML' || attr === 'html') {
                    element.innerHTML = translation;
                } else {
                    // Set attribute
                    element.setAttribute(attr, translation);
                }
            });
        });

        // Update HTML lang attribute
        document.documentElement.lang = this.getLanguageCode(this.currentLanguage);
        
        // Update direction for RTL languages
        document.documentElement.dir = this.isRTL(this.currentLanguage) ? 'rtl' : 'ltr';
        
        // Trigger custom event
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: this.currentLanguage }
        }));
    }

    /**
     * Change language
     */
    async changeLanguage(langCode) {
        if (langCode === this.currentLanguage) return;
        
        this.currentLanguage = langCode;
        
        // Store preference
        localStorage.setItem('unilive_language', langCode);
        
        // Load translations if not already loaded
        if (!this.loadedLanguages.has(langCode)) {
            await this.loadTranslations();
        }
        
        // Apply translations
        this.applyTranslations();
        
        // Track language change
        if (typeof trackLanguageChange === 'function') {
            trackLanguageChange(langCode);
        }
        
        console.log(`Language changed to: ${langCode}`);
    }

    /**
     * Setup language selector dropdown
     */
    setupLanguageSelector() {
        // Create language selector if it doesn't exist
        let selector = document.getElementById('language-selector');
        
        if (!selector) {
            selector = this.createLanguageSelector();
        }
        
        // Populate with options
        this.populateLanguageSelector(selector);
        
        // Set current selection
        selector.value = this.currentLanguage;
        
        // Add event listener
        selector.addEventListener('change', (e) => {
            this.changeLanguage(e.target.value);
        });
    }

    /**
     * Create language selector element
     */
    createLanguageSelector() {
        const selector = document.createElement('select');
        selector.id = 'language-selector';
        selector.className = 'language-selector';
        selector.setAttribute('aria-label', 'Select Language');
        
        // Add styles
        selector.style.cssText = `
            background: var(--bg-card, #12121a);
            color: var(--text-primary, #ffffff);
            border: 1px solid var(--primary, #7DF05D);
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 14px;
            cursor: pointer;
            outline: none;
            transition: all 0.3s ease;
        `;
        
        // Try to find a good location for the selector
        const nav = document.querySelector('nav, .navbar, .navigation');
        if (nav) {
            nav.appendChild(selector);
        } else {
            // Fallback: add to end of body
            document.body.appendChild(selector);
        }
        
        return selector;
    }

    /**
     * Populate language selector with options
     */
    populateLanguageSelector(selector) {
        const languages = {
            'en': 'English',
            'ko': '한국어',
            'ru': 'Русский', 
            'es': 'Español',
            'zh': '中文',
            'ja': '日本語',
            'ar': 'العربية',
            'fr': 'Français',
            'de': 'Deutsch',
            'pt': 'Português',
            'hi': 'हिन्दी',
            'tr': 'Türkçe',
            'it': 'Italiano',
            'pl': 'Polski',
            'th': 'ไทย',
            'vi': 'Tiếng Việt',
            'nl': 'Nederlands',
            'sv': 'Svenska',
            'no': 'Norsk',
            'da': 'Dansk'
        };
        
        selector.innerHTML = '';
        
        Object.entries(languages).forEach(([code, name]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = name;
            selector.appendChild(option);
        });
    }

    /**
     * Setup mutation observer for dynamic content
     */
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        const elements = node.querySelectorAll ? 
                            node.querySelectorAll('[data-i18n]') : [];
                        
                        if (node.hasAttribute && node.hasAttribute('data-i18n')) {
                            this.translateElement(node);
                        }
                        
                        elements.forEach(element => {
                            this.translateElement(element);
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Translate a single element
     */
    translateElement(element) {
        const keys = element.getAttribute('data-i18n').split(',');
        
        keys.forEach(keyInfo => {
            const [key, attr = 'textContent'] = keyInfo.split(':');
            const translation = this.t(key.trim());
            
            if (attr === 'textContent' || attr === 'text') {
                element.textContent = translation;
            } else if (attr === 'innerHTML' || attr === 'html') {
                element.innerHTML = translation;
            } else {
                element.setAttribute(attr, translation);
            }
        });
    }

    /**
     * Get full language code (e.g., 'en-US')
     */
    getLanguageCode(lang) {
        const langMap = {
            'en': 'en-US',
            'ko': 'ko-KR',
            'ru': 'ru-RU',
            'es': 'es-ES',
            'zh': 'zh-CN',
            'ja': 'ja-JP',
            'ar': 'ar-SA',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'pt': 'pt-BR',
            'hi': 'hi-IN',
            'tr': 'tr-TR',
            'it': 'it-IT',
            'pl': 'pl-PL',
            'th': 'th-TH',
            'vi': 'vi-VN',
            'nl': 'nl-NL',
            'sv': 'sv-SE',
            'no': 'no-NO',
            'da': 'da-DK'
        };
        
        return langMap[lang] || lang;
    }

    /**
     * Check if language is right-to-left
     */
    isRTL(lang) {
        const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        return rtlLanguages.includes(lang);
    }

    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Get available languages
     */
    getAvailableLanguages() {
        return Object.keys(this.translations).length > 0 ? 
            Object.keys(Object.values(this.translations)[0]) : 
            ['en'];
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.uniLiveTranslator = new UniLiveTranslator();
    });
} else {
    window.uniLiveTranslator = new UniLiveTranslator();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniLiveTranslator;
}