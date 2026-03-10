# Launch Day Runbook

Step-by-step guide for the Project Genesis launch day.

---

## T-24 Hours (Day Before)

- [ ] Final production build passes all checks
- [ ] All pre-launch checklist items completed
- [ ] Database migrations tested on staging
- [ ] Team briefed on launch plan and responsibilities
- [ ] Communication drafted (social media, email, blog post)
- [ ] Monitoring dashboards opened and bookmarked
- [ ] Roll-back plan reviewed with team

## T-2 Hours (Pre-Launch)

- [ ] Verify staging environment matches production config
- [ ] Run full E2E test suite against staging
- [ ] Complete manual testing checklist on staging
- [ ] Confirm all third-party services are operational
- [ ] Verify DNS propagation for production domain
- [ ] Confirm SSL certificate is valid and configured
- [ ] Clear CDN cache if needed

## T-0 (Launch)

### Deployment Steps

1. **Tag the release**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Deploy API server**
   ```bash
   # Deploy to production (platform-specific)
   # Verify health check: curl https://api.yourdom.com/api/health
   ```

3. **Run database migrations**
   ```bash
   npx prisma migrate deploy
   ```

4. **Deploy web application**
   ```bash
   # Deploy to Vercel / your hosting platform
   # Verify: curl -I https://yourdom.com
   ```

5. **Verify deployment**
   - [ ] Home page loads correctly
   - [ ] Login works
   - [ ] Dashboard accessible
   - [ ] API responding
   - [ ] Images loading from CDN

### Smoke Tests (5 minutes)

- [ ] Register a new account
- [ ] Login with new account
- [ ] Create a new project
- [ ] Navigate through wizard
- [ ] View explore page
- [ ] Check profile page
- [ ] Verify mobile layout

## T+1 Hour (Post-Launch Monitoring)

- [ ] Check error tracking dashboard — zero critical errors
- [ ] Check server metrics — CPU, memory, response times normal
- [ ] Check database metrics — connection pool healthy
- [ ] Review application logs for unexpected warnings
- [ ] Verify email delivery (welcome emails sending)
- [ ] Check CDN hit rates
- [ ] Monitor social media for user feedback

## T+4 Hours

- [ ] Review error rates and trends
- [ ] Analyze most visited pages
- [ ] Check conversion funnel (visit → register → create project)
- [ ] Address any reported bugs
- [ ] Respond to user feedback / support requests

## T+24 Hours (Day After)

- [ ] Full metrics review (users, projects, errors)
- [ ] Team retrospective on launch process
- [ ] Prioritize any issues discovered
- [ ] Update status page if any issues noted
- [ ] Send launch day summary to stakeholders

---

## Rollback Plan

If critical issues are discovered after deployment:

### Quick Rollback (< 5 minutes)
```bash
# Revert to previous deployment
# Vercel: vercel rollback
# Docker: docker-compose up -d --force-recreate <previous-tag>
```

### Database Rollback
```bash
# Only if migration caused issues
npx prisma migrate resolve --rolled-back <migration-name>
# Restore from backup if needed
```

### Communication Template
```
🔧 We're experiencing some issues with Project Genesis and are 
working on a fix. Service will be restored shortly. 
Follow our status page for updates: [status page URL]
```

---

## Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| Engineering Lead | | |
| DevOps / SRE | | |
| Product Owner | | |
| Support Lead | | |

---

## Post-Launch Tasks (Week 1)

- [ ] Set up automated daily reports
- [ ] Configure weekly backup verification
- [ ] Schedule first sprint based on user feedback
- [ ] Set up A/B testing framework
- [ ] Plan first feature update
- [ ] Write launch blog post / case study
- [ ] Submit to Product Hunt / Hacker News (if applicable)
- [ ] Set up user feedback collection (surveys, in-app feedback)
