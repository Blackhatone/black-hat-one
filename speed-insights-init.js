// Vercel Speed Insights initialization for vanilla JavaScript
(function() {
  'use strict';

  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;

  // Initialize the queue for Speed Insights
  if (!window.si) {
    window.si = function() {
      window.siq = window.siq || [];
      window.siq.push(Array.prototype.slice.call(arguments));
    };
  }

  // Load the Speed Insights script
  function loadSpeedInsights() {
    // Check if script is already loaded
    var scriptSrc = '/_vercel/speed-insights/script.js';
    if (document.head.querySelector('script[src*="' + scriptSrc + '"]')) {
      return;
    }

    var script = document.createElement('script');
    script.src = scriptSrc;
    script.defer = true;
    
    // Add dataset attributes for configuration
    script.dataset.sdkn = '@vercel/speed-insights';
    script.dataset.sdkv = '2.0.0';

    script.onerror = function() {
      console.log(
        '[Vercel Speed Insights] Failed to load script from ' + scriptSrc + 
        '. Please check if any content blockers are enabled and try again.'
      );
    };

    document.head.appendChild(script);
  }

  // Load immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSpeedInsights);
  } else {
    loadSpeedInsights();
  }
})();
