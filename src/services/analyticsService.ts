// Analytics and A/B Testing Service for ScheduleBud
// Tracks conversion metrics and manages A/B test variants

interface ABTestVariant {
  id: string;
  name: string;
  traffic: number; // Percentage of traffic (0-100)
  active: boolean;
}

interface ConversionEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
  variant?: string;
}

interface ConversionMetrics {
  totalVisitors: number;
  conversions: number;
  conversionRate: number;
  averageSessionDuration: number;
  bounceRate: number;
}

class AnalyticsService {
  private sessionId: string;
  private variants: Map<string, ABTestVariant> = new Map();
  private events: ConversionEvent[] = [];
  private sessionStartTime: number = Date.now();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeABTests();
  }

  /**
   * Initialize A/B test variants for pricing optimization
   */
  private initializeABTests(): void {
    // Pricing A/B Test: Old vs New Pricing
    this.variants.set('pricing_v1', {
      id: 'pricing_v1',
      name: 'Original Pricing ($4.99/month, $30/year)',
      traffic: 50,
      active: false // Disabled - using new pricing
    });

    this.variants.set('pricing_v2', {
      id: 'pricing_v2', 
      name: 'New Pricing ($3.99/month, $24/year)',
      traffic: 100,
      active: true // Current pricing
    });

    // Free Tier A/B Test
    this.variants.set('free_tier_v1', {
      id: 'free_tier_v1',
      name: 'Enhanced Free Tier (25 files, 3 AI queries)',
      traffic: 100,
      active: true
    });

    // Messaging A/B Test: Canvas Integration vs Canvas Sync
    this.variants.set('messaging_v1', {
      id: 'messaging_v1',
      name: 'Canvas Calendar Sync Messaging',
      traffic: 100,
      active: true
    });
  }

  /**
   * Get active variant for a specific test
   */
  getVariant(testName: string): ABTestVariant | null {
    const variant = this.variants.get(testName);
    if (!variant || !variant.active) {
      return null;
    }

    // Simple traffic allocation based on session ID hash
    const hash = this.hashString(this.sessionId + testName);
    const allocation = hash % 100;
    
    return allocation < variant.traffic ? variant : null;
  }

  /**
   * Track conversion events
   */
  track(event: string, properties: Record<string, any> = {}): void {
    const conversionEvent: ConversionEvent = {
      event,
      properties: {
        ...properties,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
      variant: this.getCurrentVariants()
    };

    // Store event locally
    this.events.push(conversionEvent);
    
    // Store in localStorage for persistence
    this.saveEventToStorage(conversionEvent);

    // Send to external analytics (Google Analytics, etc.)
    this.sendToExternalAnalytics(conversionEvent);

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event, properties);
    }
  }

  /**
   * Track specific conversion funnel events
   */
  trackLandingPageView(): void {
    this.track('landing_page_view', {
      pricing_variant: this.getVariant('pricing_v2')?.name,
      free_tier_variant: this.getVariant('free_tier_v1')?.name,
      messaging_variant: this.getVariant('messaging_v1')?.name
    });
  }

  trackGetStartedClick(location: string): void {
    this.track('get_started_clicked', {
      location,
      pricing_variant: this.getVariant('pricing_v2')?.name,
      session_duration: Date.now() - this.sessionStartTime
    });
  }

  trackPricingView(): void {
    this.track('pricing_viewed', {
      pricing_variant: this.getVariant('pricing_v2')?.name
    });
  }

  trackPlanSelection(planType: string): void {
    this.track('plan_selected', {
      plan: planType,
      pricing_variant: this.getVariant('pricing_v2')?.name
    });
  }

  trackRegistration(method: string = 'email'): void {
    this.track('user_registered', {
      method,
      session_duration: Date.now() - this.sessionStartTime,
      pricing_variant: this.getVariant('pricing_v2')?.name
    });
  }

  trackFeatureInteraction(feature: string): void {
    this.track('feature_interaction', {
      feature,
      messaging_variant: this.getVariant('messaging_v1')?.name
    });
  }

  /**
   * Calculate conversion metrics
   */
  getConversionMetrics(): ConversionMetrics {
    const events = this.getStoredEvents();
    const landingViews = events.filter(e => e.event === 'landing_page_view').length;
    const conversions = events.filter(e => e.event === 'user_registered').length;
    
    return {
      totalVisitors: landingViews,
      conversions,
      conversionRate: landingViews > 0 ? (conversions / landingViews) * 100 : 0,
      averageSessionDuration: this.calculateAverageSessionDuration(events),
      bounceRate: this.calculateBounceRate(events)
    };
  }

  /**
   * Get competitive positioning metrics
   */
  getCompetitiveMetrics(): {
    pricingAdvantage: string;
    featureAdvantage: string[];
    conversionFactors: string[];
  } {
    return {
      pricingAdvantage: '$3.99/month vs MyStudyLife (Free) and Todoist ($4/month)',
      featureAdvantage: [
        'Canvas calendar sync (vs basic task management)',
        'AI syllabus processing (unique differentiator)',
        'Document Q&A chatbot (vs static planners)',
        'Academic year billing (student-focused pricing)'
      ],
      conversionFactors: [
        'University-specific features',
        'Built by student credibility',
        'Free tier with real value',
        'Competitive pricing vs premium alternatives'
      ]
    };
  }

  /**
   * Export analytics data for analysis
   */
  exportData(): {
    events: ConversionEvent[];
    metrics: ConversionMetrics;
    variants: ABTestVariant[];
    competitive: ReturnType<typeof this.getCompetitiveMetrics>;
  } {
    return {
      events: this.getStoredEvents(),
      metrics: this.getConversionMetrics(),
      variants: Array.from(this.variants.values()),
      competitive: this.getCompetitiveMetrics()
    };
  }

  // Private helper methods
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private getCurrentVariants(): string {
    const activeVariants = Array.from(this.variants.values())
      .filter(v => v.active)
      .map(v => v.id);
    return activeVariants.join(',');
  }

  private saveEventToStorage(event: ConversionEvent): void {
    try {
      const stored = JSON.parse(localStorage.getItem('schedulebud_analytics') || '[]');
      stored.push(event);
      
      // Keep only last 1000 events to prevent storage bloat
      const recentEvents = stored.slice(-1000);
      localStorage.setItem('schedulebud_analytics', JSON.stringify(recentEvents));
    } catch (error) {
      console.warn('Failed to save analytics event:', error);
    }
  }

  private getStoredEvents(): ConversionEvent[] {
    try {
      return JSON.parse(localStorage.getItem('schedulebud_analytics') || '[]');
    } catch (error) {
      console.warn('Failed to load analytics events:', error);
      return [];
    }
  }

  private sendToExternalAnalytics(event: ConversionEvent): void {
    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.event, {
        ...event.properties,
        custom_parameter_session_id: event.sessionId,
        custom_parameter_variant: event.variant
      });
    }

    // Could add other analytics services here:
    // - Mixpanel
    // - PostHog  
    // - Amplitude
    // - Custom analytics endpoint
  }

  private calculateAverageSessionDuration(events: ConversionEvent[]): number {
    const sessions = new Map<string, number[]>();
    
    events.forEach(event => {
      if (!sessions.has(event.sessionId)) {
        sessions.set(event.sessionId, []);
      }
      sessions.get(event.sessionId)!.push(event.timestamp);
    });

    let totalDuration = 0;
    let sessionCount = 0;

    sessions.forEach(timestamps => {
      if (timestamps.length > 1) {
        const duration = Math.max(...timestamps) - Math.min(...timestamps);
        totalDuration += duration;
        sessionCount++;
      }
    });

    return sessionCount > 0 ? totalDuration / sessionCount / 1000 : 0; // Convert to seconds
  }

  private calculateBounceRate(events: ConversionEvent[]): number {
    const sessions = new Map<string, number>();
    
    events.forEach(event => {
      sessions.set(event.sessionId, (sessions.get(event.sessionId) || 0) + 1);
    });

    const totalSessions = sessions.size;
    const bouncedSessions = Array.from(sessions.values()).filter(count => count === 1).length;

    return totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Export types for use in components
export type { ConversionEvent, ConversionMetrics, ABTestVariant };