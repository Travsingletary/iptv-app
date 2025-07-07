# 🚀 Production Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [GitHub Secrets Setup](#github-secrets-setup)
5. [Vercel Configuration](#vercel-configuration)
6. [Deployment Process](#deployment-process)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

- GitHub repository with admin access
- Vercel account (Pro recommended for team features)
- Supabase project (for database)
- Slack workspace (optional, for notifications)
- Sentry account (for error tracking)
- PostHog account (for analytics)

## Initial Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd <project-name>
npm install
```

### 2. Create Environment Files

```bash
cp .env.example .env.local
cp .env.production.example .env.production
```

### 3. Install Vercel CLI

```bash
npm i -g vercel
vercel login
```

## Environment Configuration

### Development Environment (.env.local)

Fill in your local development values:

```env
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-anon-key
# ... other variables
```

### Production Environment (.env.production)

⚠️ **Never commit production secrets to git!**

Production environment variables should be configured directly in Vercel.

## GitHub Secrets Setup

Navigate to Settings → Secrets and Variables → Actions in your GitHub repository.

### Required Secrets:

1. **VERCEL_TOKEN**
   - Get from: https://vercel.com/account/tokens
   - Scope: Full access

2. **VERCEL_ORG_ID**
   ```bash
   vercel whoami
   # Copy the org ID from output
   ```

3. **VERCEL_PROJECT_ID**
   ```bash
   vercel link
   # Copy the project ID from .vercel/project.json
   ```

4. **SLACK_WEBHOOK** (Optional)
   - Get from: Slack App → Incoming Webhooks
   - Format: `https://hooks.slack.com/services/XXX/YYY/ZZZ`

### Setting Secrets via CLI:

```bash
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID
gh secret set SLACK_WEBHOOK
```

## Vercel Configuration

### 1. Link Project

```bash
vercel link
# Follow prompts to create/link project
```

### 2. Configure Environment Variables

```bash
# Production variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_SENTRY_DSN production
# ... add all production variables
```

### 3. Configure Domain

```bash
vercel domains add your-domain.com
# Follow DNS configuration instructions
```

### 4. Configure Production Build Settings

In Vercel Dashboard:
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm ci`

## Deployment Process

### Automatic Deployments

#### Production (main branch)
1. Create PR to main branch
2. Automated checks run
3. Merge PR
4. Production deployment triggers automatically
5. Health checks verify deployment

#### Staging (Pull Requests)
1. Open PR against main
2. Staging deployment creates automatically
3. Preview URL posted to PR
4. Test changes in staging

### Manual Deployment

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

## Monitoring & Alerts

### Health Checks
- Automated health checks run every 5 minutes
- Check endpoint: `https://your-domain.com/api/health`
- Alerts sent to Slack on failure

### Performance Monitoring
- Page load time threshold: 3 seconds
- Monitored via GitHub Actions
- Alerts on performance degradation

### Error Tracking (Sentry)
1. View errors: https://sentry.io/organizations/your-org/
2. Configure alerts in Sentry dashboard
3. Integration with Slack for real-time alerts

### Analytics (PostHog)
1. Dashboard: https://app.posthog.com/project/your-project
2. Key metrics:
   - User sessions
   - Feature usage
   - Performance metrics

## Rollback Procedures

### Quick Rollback (< 2 minutes)

1. Go to GitHub Actions
2. Run "Production Rollback" workflow
3. Enter either:
   - Vercel deployment ID
   - Git commit SHA
4. Confirm rollback

### Manual Rollback

```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel alias set [deployment-url] your-domain.com
```

### Finding Deployment IDs

```bash
# Via Vercel CLI
vercel ls --prod

# Via Vercel Dashboard
# Navigate to Project → Deployments
```

## Troubleshooting

### Build Failures

1. **Check build logs**
   ```bash
   vercel logs [deployment-url]
   ```

2. **Common issues:**
   - Missing environment variables
   - Type errors (run `npm run type-check`)
   - Dependency issues (clear cache: `npm ci`)

### Deployment Not Triggering

1. Check GitHub Actions tab
2. Verify secrets are set correctly
3. Check branch protection rules
4. Ensure workflows are enabled

### Health Check Failures

1. Check API endpoint: `/api/health`
2. Verify environment variables
3. Check Supabase connection
4. Review error logs in Vercel

### Performance Issues

1. Check Vercel Analytics
2. Review bundle size: `npm run analyze`
3. Check CDN cache headers
4. Review API response times

### Domain/SSL Issues

1. Verify DNS configuration
2. Check SSL certificate status
3. Clear DNS cache
4. Wait for propagation (up to 48h)

## Emergency Contacts

- **On-call Engineer**: Check Slack #on-call
- **Vercel Support**: support@vercel.com
- **Critical Issues**: Use PagerDuty

## Best Practices

1. **Always test in staging first**
2. **Monitor deployments actively**
3. **Keep rollback information handy**
4. **Document any manual changes**
5. **Review logs after deployment**

## Deployment Checklist

- [ ] Environment variables configured
- [ ] GitHub secrets set
- [ ] Vercel project linked
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Team notified of deployment