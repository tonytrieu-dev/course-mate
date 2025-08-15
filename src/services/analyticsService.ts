// Basic Analytics Service for ScheduleBud
// Tracks basic conversion events for landing page optimization
// NOTE: Stripe handles all payment analytics - this is only for landing page conversion optimization

interface ConversionEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

class AnalyticsService {
  private sessionId: string;
  private events: ConversionEvent[] = [];
  private sessionStartTime: number = Date.now();

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Track conversion events
   */
  track(event: string, properties: Record<string, any> = {}): void {
    const conversionEvent: ConversionEvent = {
      event,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.events.push(conversionEvent);
    this.saveEventToStorage(conversionEvent);
    this.sendToExternalAnalytics(conversionEvent);
  }

  /**
   * Track landing page view
   */
  trackLandingPageView(): void {
    this.track('landing_page_view', {
      referrer: document.referrer,
      userAgent: navigator.userAgent
    });
  }

  /**
   * Track get started button clicks
   */
  trackGetStartedClick(location: string = 'unknown'): void {
    this.track('get_started_clicked', {
      location,
      sessionDuration: Date.now() - this.sessionStartTime
    });
  }

  /**
   * Track pricing view
   */
  trackPricingView(): void {
    this.track('pricing_viewed', {
      sessionDuration: Date.now() - this.sessionStartTime
    });
  }

  /**
   * Track plan selection
   */
  trackPlanSelection(plan: string): void {
    this.track('plan_selected', {
      plan,
      sessionDuration: Date.now() - this.sessionStartTime
    });
  }

  /**
   * Track feature interaction
   */
  trackFeatureInteraction(feature: string): void {
    this.track('feature_interaction', {
      feature
    });
  }

  /**
   * Track user registration
   */
  trackUserRegistration(method: string = 'email'): void {
    this.track('user_registered', {
      method,
      sessionDuration: Date.now() - this.sessionStartTime
    });
  }

  // Private helper methods
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private saveEventToStorage(event: ConversionEvent): void {
    try {
      const stored = JSON.parse(localStorage.getItem('schedulebud_analytics') || '[]');
      stored.push(event);
      
      // Keep only last 100 events to prevent storage bloat
      const recentEvents = stored.slice(-100);
      localStorage.setItem('schedulebud_analytics', JSON.stringify(recentEvents));
    } catch (error) {
      console.warn('Failed to save analytics event:', error);
    }
  }

  private sendToExternalAnalytics(event: ConversionEvent): void {
    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.event, {
        ...event.properties,
        session_id: event.sessionId
      });
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Export types for use in components
export type { ConversionEvent };