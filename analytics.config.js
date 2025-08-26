/**
 * Google Analytics Configuration
 * 
 * To enable Google Analytics tracking:
 * 1. Replace 'GA_MEASUREMENT_ID' with your actual Google Analytics Measurement ID
 * 2. Optionally customize the tracking events and parameters below
 */

// Google Analytics Configuration
window.ANALYTICS_CONFIG = {
    // Replace with your Google Analytics Measurement ID (e.g., 'G-XXXXXXXXXX')
    measurementId: 'GA_MEASUREMENT_ID',
    
    // Enable/disable analytics tracking
    enabled: true,
    
    // Custom event categories (can be customized)
    eventCategories: {
        userInteraction: 'User Interaction',
        pdfProcessing: 'PDF Processing',
        applicationError: 'Application Error',
        userFlow: 'User Flow'
    },
    
    // Custom dimensions mapping
    customDimensions: {
        dimension1: 'pdf_merger_app',
        dimension2: 'file_count',
        dimension3: 'file_size_mb'
    }
};

// Initialize Google Analytics with the configuration
if (window.ANALYTICS_CONFIG.enabled && window.ANALYTICS_CONFIG.measurementId !== 'GA_MEASUREMENT_ID') {
    // Update the HTML script tags dynamically
    const scripts = document.querySelectorAll('script[src*="googletagmanager"]');
    scripts.forEach(script => {
        script.src = script.src.replace('GA_MEASUREMENT_ID', window.ANALYTICS_CONFIG.measurementId);
    });
    
    // Update gtag config
    if (typeof gtag !== 'undefined') {
        gtag('config', window.ANALYTICS_CONFIG.measurementId, {
            page_title: 'PDF Merger - Junte seus PDFs',
            custom_map: window.ANALYTICS_CONFIG.customDimensions
        });
    }
}