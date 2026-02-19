# Kind Kandles - Testing Checklist

## Pre-Deployment Testing Checklist

Use this checklist to verify all functionality before deploying to production.

---

## 1. Authentication & Security

### Login Flow
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials shows error
- [ ] Rate limiting triggers after 5 failed attempts
- [ ] Account lockout triggers after 10 failed attempts
- [ ] 2FA email is sent and code works
- [ ] "Remember this device" skips 2FA on subsequent logins
- [ ] Token refresh extends session without re-login
- [ ] Logout clears session and redirects to login

### Authorization
- [ ] Admin users can access admin panel
- [ ] Super Admin can access Developer Tools section
- [ ] Non-Super Admin cannot access Developer Tools
- [ ] User Management is restricted to Super Admin

---

## 2. Admin Panel

### Navigation
- [ ] All sidebar sections expand/collapse correctly
- [ ] Active section is highlighted
- [ ] Mobile menu opens and closes
- [ ] Lazy-loaded components show loading state

### Dashboard
- [ ] Analytics dashboard loads
- [ ] Charts display correctly
- [ ] Data refreshes when requested

### Product Management
- [ ] Product list loads
- [ ] Search filters products
- [ ] Create new product works
- [ ] Edit product works
- [ ] Delete product shows confirmation
- [ ] Image upload works
- [ ] Variant management works

### Order Management
- [ ] Order list loads
- [ ] Order details display correctly
- [ ] Order status can be updated
- [ ] Fulfillment workflow works
- [ ] Shipping labels can be generated

### Customer Management
- [ ] Customer list loads
- [ ] Customer details display
- [ ] Order history shows for customer

### Content Management
- [ ] Blog posts CRUD works
- [ ] Promotions management works
- [ ] Featured products can be set
- [ ] Customer stories management works

### Settings
- [ ] Store settings save correctly
- [ ] Maintenance mode toggle works
- [ ] Shipping settings save correctly

---

## 3. Customer-Facing Pages

### Homepage
- [ ] Page loads without errors
- [ ] Featured products display
- [ ] Promotions banner shows
- [ ] Navigation works

### Product Pages
- [ ] Product details load
- [ ] Images display correctly
- [ ] Variant selection works
- [ ] Add to cart works
- [ ] Out of stock items show correctly

### Cart
- [ ] Cart opens/closes
- [ ] Items can be added
- [ ] Quantity can be updated
- [ ] Items can be removed
- [ ] Subtotal calculates correctly

### Checkout
- [ ] Checkout page loads
- [ ] Shipping address form validates
- [ ] Shipping rates calculate
- [ ] Payment form loads (Square)
- [ ] Payment processes successfully
- [ ] Order confirmation displays
- [ ] Confirmation email sends

### Other Pages
- [ ] Collections page works
- [ ] Search works
- [ ] Contact form submits
- [ ] About pages load

---

## 4. Payment Processing

### Square Integration
- [ ] Payment form renders
- [ ] Card validation works
- [ ] Payment processes successfully
- [ ] Payment errors show user-friendly messages
- [ ] Retry mechanism works on transient failures
- [ ] Idempotency prevents duplicate charges

### Webhooks
- [ ] Square webhooks are received
- [ ] Signature verification works
- [ ] Duplicate events are ignored (idempotency)
- [ ] Order status updates on payment completion

---

## 5. Shipping

### Rate Calculation
- [ ] Shipping rates calculate for valid addresses
- [ ] Invalid state codes show error
- [ ] Invalid postal codes show error
- [ ] Fallback rates show when API fails
- [ ] Rates are cached appropriately

### Fulfillment
- [ ] Orders can be marked as shipped
- [ ] Tracking numbers can be added
- [ ] Shipping notifications send

---

## 6. Performance

### Load Times
- [ ] Homepage loads in < 3 seconds
- [ ] Product pages load in < 2 seconds
- [ ] Admin panel loads in < 3 seconds
- [ ] Lazy-loaded components don't block initial render

### Caching
- [ ] Product API responses are cached
- [ ] Cache invalidates on product updates
- [ ] Cache headers are set correctly

---

## 7. Mobile Responsiveness

- [ ] Homepage displays correctly on mobile
- [ ] Navigation menu works on mobile
- [ ] Product pages work on mobile
- [ ] Cart works on mobile
- [ ] Checkout works on mobile
- [ ] Admin panel mobile view works

---

## 8. Error Handling

- [ ] API errors show user-friendly messages
- [ ] Network errors are handled gracefully
- [ ] Error boundary catches component errors
- [ ] Error recovery options are provided

---

## 9. Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 10. Accessibility

- [ ] All images have alt text
- [ ] Forms have proper labels
- [ ] Focus states are visible
- [ ] Color contrast meets WCAG standards
- [ ] Keyboard navigation works

---

## Pre-Deployment Final Checks

1. [ ] All tests above pass
2. [ ] No console errors in browser
3. [ ] No TypeScript/linting errors
4. [ ] Environment variables are set in Vercel
5. [ ] Database migrations are applied
6. [ ] DNS/domain settings are correct
7. [ ] SSL certificate is valid

---

## Post-Deployment Verification

After deploying to production:

1. [ ] Homepage loads correctly
2. [ ] Login works
3. [ ] Add product to cart works
4. [ ] Checkout flow completes (test order)
5. [ ] Admin panel accessible
6. [ ] Webhooks are receiving events
7. [ ] Emails are sending

---

## Rollback Plan

If critical issues are found:

1. Go to Vercel dashboard
2. Navigate to Deployments
3. Find the previous working deployment
4. Click "..." menu and select "Promote to Production"
5. Verify the rollback was successful

---

## Notes

- Always test locally before deploying
- Use staging environment for major changes
- Keep this checklist updated as features change
