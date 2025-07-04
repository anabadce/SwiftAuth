// Dark Mode Utility for SwiftAuth
// Provides synchronized dark/light mode transitions across all elements

class DarkModeManager {
    constructor() {
        this.listeners = new Set();
        this.transitionDuration = 300; // ms
        this.isTransitioning = false;
        
        // Initialize on construction
        this.init();
    }
    
    init() {
        // Apply saved theme immediately without transition to prevent flashing
        this.applySavedTheme(false);
        
        // Add global transition styles after a brief delay
        setTimeout(() => {
            this.addGlobalTransitionStyles();
        }, 50);
        
        // Listen for system theme changes
        this.setupSystemThemeListener();
        
        // Listen for messages from other windows/tabs
        this.setupCrossTabSync();
    }
    
    applySavedTheme(withTransition = true) {
        const savedTheme = this.getSavedTheme();
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = savedTheme === 'dark' || (savedTheme === 'system' && systemPrefersDark);
        
        if (withTransition && !this.isTransitioning) {
            this.setTheme(shouldBeDark ? 'dark' : 'light');
        } else {
            // Apply immediately without transition
            if (shouldBeDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }
    
    addGlobalTransitionStyles() {
        if (document.getElementById('dark-mode-transitions')) return;
        
        const style = document.createElement('style');
        style.id = 'dark-mode-transitions';
        style.textContent = `
            /* Dark mode transitions for all elements */
            *,
            *::before,
            *::after {
                transition-property: background-color, border-color, color, fill, stroke, box-shadow;
                transition-duration: ${this.transitionDuration}ms;
                transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            /* Faster transitions for interactive elements */
            button,
            input,
            select,
            textarea,
            [role="button"],
            .btn {
                transition-duration: 200ms;
            }
            
            /* Preserve specific animations */
            .animate-spin,
            .animate-ping,
            .animate-pulse,
            .animate-bounce,
            [class*="animate-"] {
                transition: none !important;
            }
            
            /* Enhanced transitions for common elements */
            .bg-white,
            .bg-gray-50,
            .bg-gray-100,
            .bg-gray-200,
            .bg-gray-300,
            .bg-gray-400,
            .bg-gray-500,
            .bg-gray-600,
            .bg-gray-700,
            .bg-gray-800,
            .bg-gray-900,
            .dark\\:bg-gray-800,
            .dark\\:bg-gray-900,
            .dark\\:bg-gray-700 {
                transition-property: background-color, border-color, box-shadow;
                transition-duration: ${this.transitionDuration}ms;
            }
            
            /* Text color transitions */
            .text-gray-300,
            .text-gray-400,
            .text-gray-500,
            .text-gray-600,
            .text-gray-700,
            .text-gray-800,
            .text-gray-900,
            .dark\\:text-white,
            .dark\\:text-gray-300,
            .dark\\:text-gray-400 {
                transition-property: color;
                transition-duration: ${this.transitionDuration}ms;
            }
            
            /* Border transitions */
            .border-gray-200,
            .border-gray-300,
            .border-gray-400,
            .border-gray-500,
            .border-gray-600,
            .border-gray-700,
            .dark\\:border-gray-600,
            .dark\\:border-gray-700 {
                transition-property: border-color;
                transition-duration: ${this.transitionDuration}ms;
            }
            
            /* Special handling for progress bars and animations */
            .timer-bar,
            .progress-bar {
                transition-property: width, background-color !important;
                transition-duration: 900ms, ${this.transitionDuration}ms !important;
            }
            
            /* Smooth transitions for modals and overlays */
            .modal,
            .overlay,
            .backdrop-blur-lg {
                transition-property: background-color, backdrop-filter, opacity;
                transition-duration: ${this.transitionDuration}ms;
            }
        `;
        document.head.appendChild(style);
    }
    
    setTheme(theme) {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        const isDark = theme === 'dark';
        
        // Update DOM
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        // Save preference
        this.saveTheme(theme);
        
        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(isDark);
        
        // Update all registered dark mode toggles
        this.updateAllToggles();
        
        // Notify listeners
        this.notifyListeners(theme);
        
        // Sync across tabs
        this.syncAcrossTabs(theme);
        
        // Reset transition flag
        setTimeout(() => {
            this.isTransitioning = false;
        }, this.transitionDuration);
    }
    
    toggle() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
    
    getCurrentTheme() {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    
    getSavedTheme() {
        // Check cookie first
        const cookieTheme = this.getCookie('darkMode');
        if (cookieTheme === 'true') return 'dark';
        if (cookieTheme === 'false') return 'light';
        
        // Check localStorage
        const localTheme = localStorage.getItem('theme');
        if (localTheme) return localTheme;
        
        // Default to system preference
        return 'system';
    }
    
    saveTheme(theme) {
        // Save to cookie for server-side rendering
        this.setCookie('darkMode', theme === 'dark');
        
        // Save to localStorage for client-side preference
        localStorage.setItem('theme', theme);
    }
    
    updateMetaThemeColor(isDark) {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', isDark ? '#1f2937' : '#ffffff');
        }
    }
    
    registerToggle(toggleElement) {
        if (!toggleElement) return;
        
        toggleElement.addEventListener('click', () => {
            this.toggle();
        });
        
        // Update initial state
        this.updateToggleIcon(toggleElement);
    }
    
    updateAllToggles() {
        // Find all dark mode toggles and update them
        const toggles = document.querySelectorAll('#darkModeToggle, [data-dark-mode-toggle]');
        toggles.forEach(toggle => this.updateToggleIcon(toggle));
    }
    
    updateToggleIcon(toggleElement) {
        if (!toggleElement) return;
        
        const icon = toggleElement.querySelector('svg path');
        const isDark = this.getCurrentTheme() === 'dark';
        
        if (icon) {
            if (isDark) {
                // Sun icon (switch to light mode)
                icon.setAttribute('d', 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z');
            } else {
                // Moon icon (switch to dark mode)
                icon.setAttribute('d', 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z');
            }
        }
    }
    
    addListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }
    
    notifyListeners(theme) {
        this.listeners.forEach(callback => {
            try {
                callback(theme);
            } catch (error) {
                console.warn('Dark mode listener error:', error);
            }
        });
    }
    
    setupSystemThemeListener() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addListener((e) => {
            if (this.getSavedTheme() === 'system') {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    
    setupCrossTabSync() {
        // Listen for storage changes from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'theme') {
                this.applySavedTheme(true);
            }
        });
        
        // Listen for messages from other windows
        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'themeChanged') {
                this.applySavedTheme(true);
            }
        });
    }
    
    syncAcrossTabs(theme) {
        // Dispatch storage event for same-domain tabs
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'theme',
            newValue: theme
        }));
        
        // Post message for cross-origin communication
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'themeChanged',
                theme: theme
            }, '*');
        }
    }
    
    // Utility methods
    setCookie(name, value, days = 365) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
    }
    
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    
    // Enhanced functionality
    preloadTheme() {
        // Preload theme before page render to prevent flash
        const savedTheme = this.getSavedTheme();
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = savedTheme === 'dark' || (savedTheme === 'system' && systemPrefersDark);
        
        if (shouldBeDark) {
            document.documentElement.classList.add('dark');
        }
    }
    
    // Animation helpers
    async animateThemeChange() {
        if (this.isTransitioning) return;
        
        // Add a subtle animation during theme change
        document.body.style.transition = `opacity ${this.transitionDuration / 2}ms ease`;
        document.body.style.opacity = '0.95';
        
        setTimeout(() => {
            document.body.style.opacity = '';
            document.body.style.transition = '';
        }, this.transitionDuration / 2);
    }
}

// Create global instance
const darkModeManager = new DarkModeManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = darkModeManager;
}

// Global access
window.darkModeManager = darkModeManager;

// Legacy compatibility functions
window.initDarkMode = () => darkModeManager.applySavedTheme(false);
window.initDarkModeToggle = () => {
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) {
        darkModeManager.registerToggle(toggle);
    }
};
window.updateDarkModeIcon = () => darkModeManager.updateAllToggles();
