# Kind Kandles - Deployment Guide

## Overview

This document outlines the deployment process for the Kind Kandles website to Vercel.

---

## Prerequisites

Before deploying, ensure you have:

1. **Vercel Account** - Connected to the repository
2. **Environment Variables** - All required env vars set in Vercel
3. **Supabase** - Database is set up and accessible
4. **Square** - Payment integration configured
5. **Resend** - Email service configured

---

## Environment Variables

The following environment variables must be set in Vercel:

### Required

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
JWT_SECRET=your_jwt_secret_at_least_32_chars
ADMIN_USERNAME=admin_fallback_username
ADMIN_PASSWORD=admin_fallback_password

# Square Payment
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_APPLICATION_ID=your_square_app_id
SQUARE_LOCATION_ID=your_square_location_id
SQUARE_ENVIRONMENT=production
SQUARE_WEBHOOK_SIGNATURE_KEY=your_webhook_signature_key

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=Kind Kandles <noreply@kindkandlesboutique.com>
```

### Optional

```
# Rate Limiting
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW_MS=900000

# Session
SESSION_TIMEOUT_MS=3600000

# AI Features (if using)
ANTHROPIC_API_KEY=your_anthropic_key
```

---

## Deployment Process

### Automatic Deployment (Recommended)

1. Push changes to the `main` branch
2. Vercel automatically builds and deploys
3. Monitor the deployment in Vercel dashboard

### Manual Deployment

1. Go to Vercel dashboard
2. Select the project
3. Click "Deploy" or trigger a new deployment

---

## Pre-Deployment Checklist

Before deploying to production:

- [ ] Run `npm run build` locally to check for errors
- [ ] Run `npm run lint` to check for linting issues
- [ ] Complete the testing checklist (see TESTING_CHECKLIST.md)
- [ ] Verify all environment variables are set
- [ ] Check database migrations are up to date

---

## Build Configuration

The project uses the following build settings:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

---

## Vercel Configuration

The `vercel.json` file contains:

- Function configuration
- Headers and redirects
- Region settings

Review this file before deploying major changes.

---

## Post-Deployment Verification

After deployment completes:

1. **Check Build Logs** - Look for any warnings or errors
2. **Test Homepage** - Verify the site loads
3. **Test Login** - Verify authentication works
4. **Test Checkout** - Place a test order
5. **Check Webhooks** - Verify Square webhooks are working
6. **Monitor Errors** - Check Vercel logs for any errors

---

## Rollback Procedure

If issues are found after deployment:

### Quick Rollback (Vercel Dashboard)

1. Go to Vercel dashboard
2. Navigate to "Deployments"
3. Find the last working deployment
4. Click "..." menu → "Promote to Production"

### Git Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push origin main --force  # Use with caution
```

---

## Monitoring

### Vercel Analytics

- Monitor page views and performance
- Check Core Web Vitals
- Review error rates

### Logs

Access logs via:
1. Vercel Dashboard → Project → Logs
2. Filter by function, time, or status

### Alerts

Set up alerts for:
- Build failures
- High error rates
- Performance degradation

---

## Database Migrations

If database changes are needed:

1. Create migration in Supabase
2. Test locally with local Supabase
3. Apply to production Supabase
4. Deploy code changes

**Important**: Always apply database migrations BEFORE deploying code that depends on them.

---

## Caching

### Vercel Edge Cache

- Static assets are cached at the edge
- API routes can set cache headers
- Use `revalidate` for ISR pages

### Application Cache

- In-memory cache for API responses
- Cache invalidates on data changes
- Review `src/lib/cache.ts` for implementation

---

## Performance Optimization

### Build Optimization

- Code splitting via lazy imports
- Tree shaking removes unused code
- Image optimization via Next.js

### Runtime Optimization

- API response caching
- Database query optimization
- Component memoization

---

## Security Considerations

### Before Deployment

- [ ] No secrets in code
- [ ] Environment variables are secure
- [ ] API routes are protected
- [ ] Input validation is in place

### After Deployment

- [ ] HTTPS is enforced
- [ ] Security headers are set
- [ ] Rate limiting is active

---

## Troubleshooting

### Build Failures

1. Check build logs for errors
2. Run `npm run build` locally
3. Fix TypeScript/ESLint errors
4. Verify all imports are valid

### Runtime Errors

1. Check Vercel function logs
2. Look for error patterns
3. Check environment variables
4. Verify external service connectivity

### Performance Issues

1. Check Vercel Analytics
2. Review function execution times
3. Check database query performance
4. Review caching effectiveness

---

## Support Contacts

- **Vercel Support**: support@vercel.com
- **Supabase Support**: support@supabase.io
- **Square Support**: developer support portal

---

## Changelog

Keep track of major deployments:

| Date | Version | Changes | Deployed By |
|------|---------|---------|-------------|
| YYYY-MM-DD | x.x.x | Description | Name |

---

## Important Notes

1. **Never deploy directly to production** without testing
2. **Always have a rollback plan** ready
3. **Monitor closely** after deployments
4. **Document changes** in the changelog
5. **Test locally first** using `npm run dev`
