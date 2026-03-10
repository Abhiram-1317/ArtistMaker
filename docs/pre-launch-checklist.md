# Pre-Launch Checklist

Complete every item before going live with Project Genesis.

---

## Infrastructure

- [ ] **Production database** provisioned (PostgreSQL 15+)
- [ ] **Database migrations** run successfully (`npx prisma migrate deploy`)
- [ ] **Redis instance** configured for sessions/caching
- [ ] **CDN** configured for static assets (Vercel Edge, Cloudflare, or AWS CloudFront)
- [ ] **Domain** purchased and DNS configured
- [ ] **SSL certificate** active (HTTPS enforced)
- [ ] **Environment variables** set in production (see `.env.example`)
- [ ] **DEMO_MODE** set to `false` in production
- [ ] **NEXTAUTH_SECRET** is a strong random value (min 32 chars)
- [ ] **NEXTAUTH_URL** set to production domain

## Application

- [ ] Production build passes without errors (`npx turbo build`)
- [ ] TypeScript compilation clean — zero errors
- [ ] No `console.log` statements in production code (use structured logging)
- [ ] All API endpoints return correct responses
- [ ] Error boundaries catch and display errors gracefully
- [ ] 404 page works for invalid routes
- [ ] Loading states display for all async operations
- [ ] All forms validate inputs before submission
- [ ] Image optimization enabled and working

## Security

- [ ] CSP headers configured and tested
- [ ] X-Frame-Options set to DENY
- [ ] X-Content-Type-Options set to nosniff
- [ ] HSTS enabled with proper max-age
- [ ] CSRF protection active on mutating endpoints
- [ ] Input sanitization applied on all user inputs
- [ ] Authentication required on all protected routes
- [ ] API rate limiting configured
- [ ] File upload size limits set
- [ ] SQL injection prevention verified (Prisma ORM)
- [ ] No secrets committed to git (check git history)
- [ ] Source maps disabled in production build

## SEO & Marketing

- [ ] `robots.txt` serves correctly
- [ ] `sitemap.xml` serves correctly and has all public pages
- [ ] Open Graph meta tags on all public pages
- [ ] Twitter Card meta tags configured
- [ ] JSON-LD structured data on home page
- [ ] Page titles unique and descriptive
- [ ] Meta descriptions set for all pages
- [ ] Canonical URLs set
- [ ] Google Search Console verified
- [ ] Google Analytics / Plausible / PostHog installed

## Monitoring & Logging

- [ ] Error tracking configured (Sentry or equivalent)
- [ ] Application performance monitoring (APM) active
- [ ] Uptime monitoring configured (UptimeRobot, Pingdom, or equivalent)
- [ ] Health check endpoint (`/api/health`) responding
- [ ] Structured logging in API server
- [ ] Log aggregation configured (Datadog, Logtail, or similar)
- [ ] Alert thresholds set (error rate, response time, CPU, memory)

## Backup & Recovery

- [ ] Database backup schedule configured (daily minimum)
- [ ] Backup restoration tested
- [ ] Point-in-time recovery available
- [ ] File/media storage backups configured
- [ ] Disaster recovery plan documented

## Performance

- [ ] Lighthouse score > 90 (Performance, Accessibility, Best Practices, SEO)
- [ ] Core Web Vitals passing (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] Database queries optimized (no N+1 queries)
- [ ] API response times < 200ms for standard endpoints
- [ ] Static assets cached with proper headers
- [ ] Image assets optimized and using WebP/AVIF
- [ ] Bundle size analyzed — no unnecessary dependencies

## Legal & Compliance

- [ ] Privacy Policy published and linked
- [ ] Terms of Service published and linked
- [ ] Cookie Policy published and linked
- [ ] Cookie consent banner implemented (if serving EU users)
- [ ] GDPR compliance verified (data export, deletion)
- [ ] CCPA compliance verified (if serving California users)
- [ ] Content moderation policy documented
- [ ] DMCA takedown process documented
- [ ] Data Processing Agreement available (if needed)

## Email & Notifications

- [ ] Transactional email service configured (SendGrid, Postmark, or SES)
- [ ] Welcome email template designed
- [ ] Password reset email working
- [ ] Email deliverability verified (SPF, DKIM, DMARC)
- [ ] Notification preferences page functional
- [ ] Unsubscribe link in all marketing emails

## Documentation

- [ ] User Guide complete and accessible
- [ ] Developer Guide complete
- [ ] API Reference complete
- [ ] README.md up to date
- [ ] Contributing guidelines published
- [ ] Architecture decision records (ADRs) documented

## Team & Process

- [ ] On-call rotation established
- [ ] Incident response runbook created
- [ ] Rollback procedure documented and tested
- [ ] Communication channels set up (Slack, Discord, etc.)
- [ ] Support email or ticketing system configured
- [ ] Status page configured (Statuspage, Instatus, etc.)

---

## Sign-Off

| Area | Approved By | Date |
|------|------------|------|
| Engineering | | |
| Security | | |
| Legal | | |
| Product | | |
| Marketing | | |
