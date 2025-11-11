# My Kind Kandles & Boutique - Custom Website

A modern, responsive Next.js website for My Kind Kandles & Boutique, featuring natural handmade candles, skincare products, and boutique items.

## 🌟 Features

- **Modern Design**: Beautiful, responsive design with Tailwind CSS
- **Product Collections**: Organized collections for candles, skincare, body oils, and more
- **Multi-level Navigation**: Comprehensive navigation with dropdown menus
- **Product Pages**: Detailed product pages with customization options
- **About Pages**: Complete company information, mission, and contact details
- **Custom Services**: Information about custom orders and mobile candle making
- **Customer Stories**: Platform for customers to share their experiences
- **Mobile Responsive**: Optimized for all screen sizes
- **Performance Optimized**: Fast loading with Next.js optimizations

## 🛍️ Product Categories

- **Candles**: Handcrafted candles in various scent profiles (Citrus, Fresh, Floral, Sweet, Woodsy, Herbal, Earthy)
- **Skincare**: Natural skincare products including body butters, scrubs, lotions, and bar soaps
- **Body Oils**: Nourishing body oils made with natural ingredients
- **Room Sprays**: Fragrant room sprays to freshen any space
- **Clothing & Accessories**: Boutique clothing and accessories
- **Everything Calm Down Girl**: Signature eucalyptus and spearmint collection

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Shopify store with Storefront API access

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd website-custom
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

Edit `.env.local` with your Shopify credentials:
```env
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_access_token_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Shopify Setup

To get your Shopify Storefront API credentials:

1. Go to your Shopify Admin panel
2. Navigate to **Apps** > **Develop apps**
3. Click **Create an app** (or use an existing app)
4. Go to **Configuration** tab
5. Under **Storefront API access**, click **Configure**
6. Enable the required access scopes:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_read_collection_listings`
   - `unauthenticated_write_checkouts`
   - `unauthenticated_read_checkouts`
7. Save and get your **Storefront access token**
8. Your store domain is: `your-store.myshopify.com`

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── about/             # About pages (mission, contact, refund policy)
│   ├── collections/       # Product collection pages
│   ├── customs/           # Custom services page
│   ├── products/          # Individual product pages
│   ├── write-your-story/  # Customer stories page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles
└── components/            # Reusable React components
    ├── Header.tsx         # Navigation header
    ├── Footer.tsx         # Site footer
    └── ProductCard.tsx    # Product display component
```

## 🎨 Design System

### Colors
- **Primary**: Pink (#EC4899)
- **Secondary**: Purple, Blue, Green accents
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Font**: Inter (Google Fonts)
- **Headings**: Bold, various sizes
- **Body**: Regular weight, readable line heights

### Components
- **Buttons**: Primary (pink) and secondary (outlined) styles
- **Cards**: Consistent shadow and hover effects
- **Forms**: Clean, accessible form styling
- **Navigation**: Multi-level dropdown menus

## 📱 Responsive Design

The website is fully responsive with breakpoints for:
- Mobile: 640px and below
- Tablet: 641px - 1024px
- Desktop: 1025px and above

## 🔧 Technologies Used

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Modern icon library
- **Headless UI**: Accessible UI components

## 📄 Pages Overview

### Main Pages
- **Homepage**: Hero section, featured categories, products, and benefits
- **Collections**: Overview of all product categories
- **About Us**: Company story, values, and location
- **Contact**: Contact form, business information, and FAQ
- **Mission**: Detailed mission statement and values
- **Refund Policy**: Customer-friendly return policy

### Collection Pages
- **Candles**: All candle products with scent categories
- **Skincare**: Natural skincare products and benefits
- **Body Oils**: Nourishing body oil collection

### Special Pages
- **My Kind Customs**: Custom orders and services
- **Write Your Story**: Customer testimonial platform
- **Product Details**: Individual product pages with full details

## 🌟 Key Features

### Navigation
- Sticky header with company branding
- Multi-level dropdown menus
- Mobile-responsive hamburger menu
- Search, user account, and cart icons

### Product Display
- Grid layouts for product collections
- Product cards with images, pricing, and descriptions
- Sale badges and pricing displays
- "Choose Options" call-to-action buttons

### Content Sections
- Hero sections with gradient backgrounds
- Feature highlights with icons
- Customer testimonials
- FAQ sections
- Contact forms

## 🎯 Business Information

**My Kind Kandles & Boutique**
- **Tagline**: "Do All Things With Kindness"
- **Location**: 9505 Reisterstown Rd, Suite 2SE, Owings Mills, Maryland 21117
- **Focus**: Natural, handmade products with kindness and quality
- **Services**: Retail products, custom orders, mobile candle making experiences

---

## 🛒 SHOPIFY E-COMMERCE INTEGRATION GUIDE
**(Complete this section when ready to connect Shopify)**

### 📋 Pre-Integration Checklist

Before connecting to Shopify, ensure you have completed:
- [ ] All cosmetic design tweaks
- [ ] All functionality features 
- [ ] Content finalization
- [ ] Testing of static components
- [ ] Final design approval

### 🔧 Integration Overview

Your website is **pre-configured** for Shopify integration with:
- ✅ Dynamic product pages (`/products/[handle]`)
- ✅ Dynamic collection pages (`/collections/[handle]`)
- ✅ Shopify Storefront API client setup
- ✅ GraphQL queries for products, collections, and cart
- ✅ Image optimization for Shopify CDN
- ✅ SEO metadata from Shopify data

### 🏪 Shopify Store Setup

#### Step 1: Create/Configure Your Shopify Store
1. Set up your Shopify store at [shopify.com](https://shopify.com)
2. Add your products with proper:
   - **Handles** (URL-friendly names)
   - **Collections** (organize by categories)
   - **Images** (high-quality product photos)
   - **Descriptions** (detailed product information)
   - **Variants** (sizes, colors, etc.)
   - **SEO settings** (titles, descriptions)

#### Step 2: Enable Storefront API Access
1. Go to **Shopify Admin** → **Apps** → **Develop apps**
2. Click **Create an app** (name it "Website Integration")
3. Go to **Configuration** tab
4. Under **Storefront API access**, click **Configure**
5. Enable these scopes:
   ```
   ✅ unauthenticated_read_product_listings
   ✅ unauthenticated_read_product_inventory  
   ✅ unauthenticated_read_collection_listings
   ✅ unauthenticated_write_checkouts
   ✅ unauthenticated_read_checkouts
   ```
6. **Save** and copy your **Storefront access token**

#### Step 3: Environment Configuration
1. Create `.env.local` file:
   ```bash
   cp env.example .env.local
   ```

2. Add your Shopify credentials:
   ```env
   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_access_token_here
   ```

### 🔄 What Changes After Integration

#### Before Integration (Current State):
- Static product data in components
- Placeholder images
- Hardcoded collections
- No cart functionality

#### After Integration:
- ✨ **Real Shopify products** populate automatically
- 🖼️ **Shopify product images** with CDN optimization
- 🛍️ **Dynamic collections** based on your Shopify setup
- 🛒 **Working cart** with checkout flow
- 📊 **Real inventory** and availability status
- 🔍 **SEO optimization** from Shopify metadata

### 🚀 Integration Steps

#### Step 1: Test Connection
```bash
npm run dev
```
Visit your collections and products pages to verify Shopify data loads.

#### Step 2: Map Your Collections
Ensure your Shopify collection handles match your existing navigation:
- `candles` → Candles collection
- `skincare` → Skincare collection  
- `body-oils` → Body Oils collection
- `room-sprays` → Room Sprays collection
- `calm-down-girl` → Calm Down Girl collection

#### Step 3: Product Data Migration
Your existing static products will be replaced by Shopify products. Ensure you have:
- Migrated all product information to Shopify
- Set up proper product variants (sizes, scents, etc.)
- Added high-quality product images
- Configured proper product handles for SEO

#### Step 4: Cart Functionality (Optional Enhancement)
The cart GraphQL mutations are ready. To add cart functionality:
1. Create cart context/state management
2. Implement "Add to Cart" buttons
3. Build cart sidebar/page
4. Connect to Shopify checkout

### 🌐 Deployment to Vercel

#### Step 1: Vercel Setup
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`
   - `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`

#### Step 2: Deploy
```bash
git add .
git commit -m "Ready for Shopify integration"
git push origin main
```
Vercel will automatically deploy your integrated site.

### 🔍 Testing Checklist

After integration, test:
- [ ] All collection pages load Shopify products
- [ ] Individual product pages display correctly
- [ ] Images load from Shopify CDN
- [ ] Product variants work (sizes, colors)
- [ ] SEO metadata appears correctly
- [ ] Mobile responsiveness maintained
- [ ] Page loading performance
- [ ] 404 handling for non-existent products

### 🛠️ Troubleshooting

**Common Issues:**
- **No products showing**: Check API credentials and scopes
- **Images not loading**: Verify Shopify CDN URLs
- **404 errors**: Ensure product handles match URLs
- **Slow loading**: Check GraphQL query efficiency

**Debug Commands:**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN

# Test API connection
npm run dev
# Check browser console for API errors
```

### 📊 Performance Optimization

Post-integration optimizations:
- Enable Shopify image transformations
- Implement product caching
- Add loading states for better UX
- Optimize GraphQL queries
- Set up error boundaries

### 🎯 Success Metrics

After successful integration:
- ✅ Dynamic product catalog
- ✅ Real-time inventory updates  
- ✅ Seamless checkout experience
- ✅ SEO-optimized product pages
- ✅ Mobile-responsive shopping
- ✅ Fast page load times (<3s)

---

## 🚀 Standard Deployment

For non-Shopify deployment, the website works on:
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Any hosting service supporting Node.js

## 📞 Support

For questions about the website or My Kind Kandles & Boutique:
- Visit: [kindkandlesboutique.com](https://kindkandlesboutique.com)
- Email: hello@kindkandlesboutique.com
- Phone: (555) 123-4567

---

*This website was created with kindness and attention to detail, reflecting the values of My Kind Kandles & Boutique.*#   k i n d - k a n d l e s - b e t a - v 1  
 