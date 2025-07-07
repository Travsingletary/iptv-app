# 📊 Monitoring & Observability Setup Guide

## Overview

This guide covers setting up comprehensive monitoring for:
- Error tracking (Sentry)
- Analytics (PostHog)
- Performance monitoring (Vercel Analytics)
- Uptime monitoring (GitHub Actions)
- Custom dashboards

## 1. Error Tracking (Sentry)

### Setup Sentry Account

1. Sign up at https://sentry.io
2. Create new project (React)
3. Copy DSN from project settings

### Install Sentry SDK

```bash
npm install @sentry/react @sentry/tracing
```

### Configure Sentry (src/lib/sentry.ts)

```typescript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export function initSentry() {
  if (import.meta.env.VITE_ENABLE_ERROR_REPORTING !== 'true') {
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new BrowserTracing(),
    ],
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Filter out non-error events in production
      if (import.meta.env.MODE === 'production' && event.level !== 'error') {
        return null;
      }
      return event;
    },
  });
}
```

### Sentry Alert Rules

1. Navigate to Alerts → Create Alert Rule
2. Set up alerts for:
   - Error rate spike (> 100 errors/hour)
   - New error types
   - Performance degradation
   - Crash rate increase

### Slack Integration

1. Settings → Integrations → Slack
2. Add to workspace
3. Configure alert channels

## 2. Analytics (PostHog)

### Setup PostHog

1. Sign up at https://posthog.com
2. Create project
3. Copy project API key

### Install PostHog

```bash
npm install posthog-js
```

### Configure PostHog (src/lib/posthog.ts)

```typescript
import posthog from 'posthog-js';

export function initPostHog() {
  if (import.meta.env.VITE_ENABLE_ANALYTICS !== 'true') {
    return;
  }

  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: {
      dom_event_allowlist: ['click', 'submit'],
      element_allowlist: ['button', 'form', 'input', 'a'],
    },
  });
}
```

### Key Metrics to Track

- User sessions
- Feature adoption
- Error rates
- Performance metrics
- Conversion funnels

### Create Dashboards

1. **User Activity Dashboard**
   - Daily active users
   - Session duration
   - Page views
   - Bounce rate

2. **Feature Usage Dashboard**
   - Feature adoption rate
   - Most used features
   - User flow analysis

3. **Performance Dashboard**
   - Page load times
   - API response times
   - Error rates

## 3. Vercel Analytics

### Enable Vercel Analytics

1. Vercel Dashboard → Project → Analytics
2. Enable Web Analytics
3. Install package:

```bash
npm install @vercel/analytics
```

### Add to App (src/main.tsx)

```typescript
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

### Metrics Tracked

- Page views
- Unique visitors
- Top pages
- Top referrers
- Device types
- Geographic data

## 4. Custom Monitoring

### Health Check Endpoint

Already configured in `/api/health.ts`

### Uptime Monitoring

GitHub Actions workflow runs every 5 minutes:
- `.github/workflows/health-check.yml`

### Custom Metrics

Create custom tracking for business metrics:

```typescript
// src/lib/metrics.ts
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  // PostHog
  if (window.posthog) {
    window.posthog.capture(eventName, properties);
  }
  
  // Google Analytics (if using)
  if (window.gtag) {
    window.gtag('event', eventName, properties);
  }
}

// Usage
trackEvent('stream_started', {
  stream_id: '123',
  quality: '1080p',
  source: 'youtube'
});
```

## 5. Performance Monitoring

### Web Vitals

```bash
npm install web-vitals
```

```typescript
// src/lib/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics service
  console.log(metric);
  
  // Send to PostHog
  if (window.posthog) {
    window.posthog.capture('web_vital', {
      metric: metric.name,
      value: metric.value,
      rating: metric.rating
    });
  }
}

export function trackWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}
```

### Performance Budgets

Set in `vite.config.ts`:

```typescript
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
    // Warn if bundle exceeds size
    chunkSizeWarningLimit: 500,
  },
};
```

## 6. Log Management

### Browser Logs

```typescript
// src/lib/logger.ts
class Logger {
  private sendToServer(level: string, message: string, extra?: any) {
    if (import.meta.env.MODE === 'production') {
      // Send to logging service
      fetch('/api/logs', {
        method: 'POST',
        body: JSON.stringify({ level, message, extra, timestamp: new Date() }),
      });
    }
  }

  error(message: string, error?: Error) {
    console.error(message, error);
    this.sendToServer('error', message, { error: error?.stack });
    Sentry.captureException(error || new Error(message));
  }

  warn(message: string, extra?: any) {
    console.warn(message, extra);
    this.sendToServer('warn', message, extra);
  }

  info(message: string, extra?: any) {
    console.info(message, extra);
    if (import.meta.env.VITE_ENABLE_DEBUG) {
      this.sendToServer('info', message, extra);
    }
  }
}

export const logger = new Logger();
```

## 7. Alerting Setup

### Alert Channels

1. **Slack** (Primary)
   - #alerts-production
   - #alerts-staging
   - #alerts-performance

2. **Email** (Backup)
   - ops-team@company.com

3. **PagerDuty** (Critical)
   - For P0 incidents only

### Alert Rules

| Alert | Condition | Channel | Priority |
|-------|-----------|---------|----------|
| Site Down | Health check fails 3x | PagerDuty | P0 |
| High Error Rate | >100 errors/hour | Slack | P1 |
| Slow Performance | Load time >5s | Slack | P2 |
| Low Traffic | <10 visits/hour | Email | P3 |

## 8. Dashboards

### Grafana Setup (Optional)

```yaml
# docker-compose.monitoring.yml
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Key Dashboards

1. **System Health**
   - Uptime percentage
   - Response times
   - Error rates
   - Active users

2. **Business Metrics**
   - User signups
   - Feature usage
   - Stream quality
   - User retention

3. **Technical Metrics**
   - API latency
   - Database performance
   - CDN hit rate
   - Bundle sizes

## 9. Incident Response

### Runbook Template

```markdown
# Incident: [Name]

## Symptoms
- What users see
- Error messages
- Affected features

## Detection
- How it was discovered
- Monitoring alerts triggered

## Impact
- Number of users affected
- Business impact
- Duration

## Resolution Steps
1. Immediate mitigation
2. Root cause analysis
3. Long-term fix

## Prevention
- How to prevent recurrence
- Monitoring improvements
```

## 10. Monthly Review

### Metrics to Review

1. **Reliability**
   - Uptime percentage
   - Incident count
   - MTTR (Mean Time To Recovery)

2. **Performance**
   - P95 response times
   - Core Web Vitals
   - Error rates

3. **Usage**
   - MAU/DAU
   - Feature adoption
   - User satisfaction

### Action Items

- Address top errors
- Optimize slow endpoints
- Update alert thresholds
- Improve documentation

## Useful Commands

```bash
# Check current alerts
curl https://your-domain.com/api/health

# View Sentry issues
open https://sentry.io/organizations/your-org/issues/

# PostHog dashboard
open https://app.posthog.com/project/your-project

# Vercel Analytics
open https://vercel.com/your-team/your-project/analytics
```