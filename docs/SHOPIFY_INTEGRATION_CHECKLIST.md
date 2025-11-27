# Shopify Integration Checklist

**Project**: My Kind Kandles & Boutique  
**Status**: Ready for Shopify Connection  
**Last Updated**: November 26, 2025

---

## Pre-Integration Cleanup ✅ COMPLETED

- [x] Remove hardcoded credentials from codebase
- [x] Consolidate Next.js configuration files
- [x] Remove test infrastructure files
- [x] Clean up console.log statements
- [x] Remove empty directories
- [x] Update Shopify API to latest version (2025-01)
- [x] Verify build succeeds with no errors
- [x] Verify no broken imports

---

## Shopify Setup Steps

### Step 1: Shopify Admin Configuration

- [ ] Access Shopify Admin at `https://kindkandlesboutique.myshopify.com/admin`
- [ ] Navigate to Settings → Apps and sales channels
- [ ] Click "Develop apps" → "Create an app"
- [ ] Name the app (e.g., "Custom Website Integration")
- [ ] Configure Storefront API scopes:
  - [ ] `unauthenticated_read_product_listings`
  - [ ] `unauthenticated_read_product_inventory`
  - [ ] `unauthenticated_read_collection_listings`
  - [ ] `unauthenticated_write_checkouts`
  - [ ] `unauthenticated_read_checkouts`
- [ ] Install the app
- [ ] Copy the Storefront API access token (shown only once!)

### Step 2: Local Environment Setup

- [ ] Create `.env.local` file in project root
- [ ] Add Shopify store domain:
  ```
  NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=kindkandlesboutique.myshopify.com
  ```
- [ ] Add Storefront API token:
  ```
  NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_token_here
  ```
- [ ] Save the file
- [ ] Verify `.env.local` is in `.gitignore` (it should be by default)

### Step 3: Verify Shopify Store Setup

- [ ] Ensure products exist in Shopify store
- [ ] Verify products are published to "Online Store" sales channel
- [ ] Create collections matching website structure:
  - [ ] `candles` collection
  - [ ] `skincare` collection
  - [ ] `body-oils` collection
  - [ ] `room-sprays` collection
  - [ ] `calm-down-girl` collection
- [ ] Ensure product handles match expected URLs
- [ ] Add high-quality product images
- [ ] Set proper product descriptions and metadata

### Step 4: Test Connection Locally

- [ ] Stop development server if running (Ctrl+C)
- [ ] Start development server: `npm run dev`
- [ ] Visit `http://localhost:3000`
- [ ] Navigate to Collections page
- [ ] Verify products load from Shopify
- [ ] Click on a product to test product detail page
- [ ] Check browser console for any errors
- [ ] Verify images load correctly
- [ ] Test on mobile viewport

### Step 5: Verify Data Integration

- [ ] Product titles display correctly
- [ ] Product prices show accurate amounts
- [ ] Product images load from Shopify CDN
- [ ] Product descriptions render properly
- [ ] Inventory levels display (if implemented)
- [ ] Product variants work (sizes, colors, etc.)
- [ ] Collection pages show correct products
- [ ] Search functionality works (if implemented)

### Step 6: Production Deployment

#### Vercel Deployment
- [ ] Go to Vercel dashboard
- [ ] Select your project
- [ ] Navigate to Settings → Environment Variables
- [ ] Add `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`
- [ ] Add `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`
- [ ] Save environment variables
- [ ] Trigger new deployment or push to main branch
- [ ] Wait for deployment to complete

#### Post-Deployment Verification
- [ ] Visit production URL
- [ ] Test all collection pages
- [ ] Test product detail pages
- [ ] Verify images load correctly
- [ ] Test on mobile devices
- [ ] Check page load performance
- [ ] Verify SEO metadata
- [ ] Test checkout flow (when implemented)

---

## Optional Enhancements

### Cart & Checkout Implementation
- [ ] Create cart context/state management
- [ ] Add "Add to Cart" buttons to product pages
- [ ] Build cart drawer/modal component
- [ ] Implement cart quantity updates
- [ ] Connect to Shopify Checkout API
- [ ] Test complete purchase flow

### Advanced Features
- [ ] Set up Shopify webhooks for inventory sync
- [ ] Implement product search functionality
- [ ] Add product filtering (price, category, etc.)
- [ ] Implement product quick view
- [ ] Add wishlist functionality
- [ ] Set up customer reviews integration
- [ ] Configure abandoned cart recovery

### Analytics & Monitoring
- [ ] Set up Google Analytics 4
- [ ] Configure Facebook Pixel
- [ ] Implement conversion tracking
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure performance monitoring

---

## Troubleshooting Guide

### Connection Issues

**Problem**: "Not configured" or missing environment variables
- **Solution**: Verify `.env.local` exists in project root
- **Solution**: Check variable names have `NEXT_PUBLIC_` prefix
- **Solution**: Restart development server

**Problem**: "Connection failed" or 401 error
- **Solution**: Verify Storefront API token is correct
- **Solution**: Ensure app is installed in Shopify admin
- **Solution**: Check API scopes are properly configured

**Problem**: Products not showing
- **Solution**: Publish products to "Online Store" sales channel
- **Solution**: Verify collection handles match
- **Solution**: Check GraphQL query syntax

### Build Issues

**Problem**: Build fails with import errors
- **Solution**: Run `npm install` to ensure dependencies are installed
- **Solution**: Clear `.next` folder and rebuild
- **Solution**: Check for TypeScript errors

**Problem**: Images not loading
- **Solution**: Verify Shopify CDN is in `next.config.js` image domains
- **Solution**: Check product images exist in Shopify
- **Solution**: Inspect network tab for 404 errors

---

## Resources

### Documentation
- **Setup Guide**: `SHOPIFY_SETUP_GUIDE.md` (comprehensive)
- **Quick Start**: `SHOPIFY_QUICK_START.md` (15-minute setup)
- **Visual Guide**: `SHOPIFY_CONNECTION_STEPS.md` (step-by-step with diagrams)
- **Cleanup Summary**: `CLEANUP_SUMMARY.md` (what was cleaned up)

### Code References
- **Shopify Client**: `src/lib/shopify.ts`
- **Product Queries**: `src/lib/queries/products.ts`
- **Collection Queries**: `src/lib/queries/collections.ts`
- **Cart Queries**: `src/lib/queries/cart.ts`
- **Next.js Config**: `next.config.js`

### External Links
- [Shopify Storefront API Docs](https://shopify.dev/docs/api/storefront)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## Success Criteria

Your Shopify integration is successful when:

✅ Products load dynamically from Shopify  
✅ Images display from Shopify CDN  
✅ Prices and inventory are accurate  
✅ Collections organize products correctly  
✅ Product pages show full details  
✅ Mobile experience is optimized  
✅ Page load times are under 3 seconds  
✅ No console errors in production  
✅ SEO metadata is properly set  
✅ Checkout flow works (when implemented)

---

## Support

For questions or issues:
1. Check the troubleshooting guide above
2. Review the documentation files
3. Check browser console and server logs
4. Verify Shopify admin settings
5. Test in incognito/private browsing mode

---

**Ready to Begin?** Start with Step 1: Shopify Admin Configuration

Good luck with your Shopify integration! 🚀

