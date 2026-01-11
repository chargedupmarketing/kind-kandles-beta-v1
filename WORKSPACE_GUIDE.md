# 🏗️ Kind Kandles Boutique - Workspace Guide

## 📋 Table of Contents
- [Project Structure](#project-structure)
- [Frontend Organization](#frontend-organization)
- [Backend Organization](#backend-organization)
- [Opening the Workspace](#opening-the-workspace)
- [Development Workflow](#development-workflow)
- [Quick Navigation](#quick-navigation)

---

## 🗂️ Project Structure

This project is organized into a **VS Code Multi-Root Workspace** for better navigation and development experience.

```
kind-kandles-boutique/
├── 🎨 FRONTEND
│   ├── src/components/          # React components
│   │   ├── admin/               # Admin panel components
│   │   │   ├── mobile/          # Mobile-specific admin components
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   ├── OrderManagement.tsx
│   │   │   ├── ProductManagement.tsx
│   │   │   └── ...
│   │   ├── Cart.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ProductCard.tsx
│   │   └── ...
│   ├── src/app/                 # Next.js pages & routes
│   │   ├── (pages)/
│   │   │   ├── about/
│   │   │   ├── blog/
│   │   │   ├── collections/
│   │   │   ├── products/
│   │   │   └── checkout/
│   │   ├── restricted/          # Admin pages
│   │   │   ├── login/
│   │   │   └── admin/
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Homepage
│   │   └── globals.css          # Global styles
│   ├── src/contexts/            # React Context providers
│   │   ├── AdminContext.tsx
│   │   ├── CartContext.tsx
│   │   ├── DarkModeContext.tsx
│   │   └── BannerContext.tsx
│   └── src/hooks/               # Custom React hooks
│       ├── useDebounce.ts
│       ├── useIntersectionObserver.ts
│       └── useLocalStorage.ts
│
├── ⚙️ BACKEND
│   ├── src/app/api/             # API routes
│   │   ├── admin/               # Admin-only endpoints
│   │   │   ├── orders/
│   │   │   ├── products/
│   │   │   ├── users/
│   │   │   └── maintenance/
│   │   ├── analytics/           # Analytics endpoints
│   │   │   ├── overview/
│   │   │   ├── top-products/
│   │   │   └── low-stock/
│   │   ├── auth/                # Authentication
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   └── verify/
│   │   ├── orders/              # Order management
│   │   ├── shipping/            # Shipping calculation
│   │   ├── webhooks/            # External webhooks
│   │   │   └── square/
│   │   └── ...
│   └── src/lib/                 # Backend utilities
│       ├── supabase.ts          # Database client
│       ├── shopify.ts           # Shopify integration
│       ├── email.ts             # Email service
│       ├── errorHandler.ts      # Error handling
│       └── queries/             # Database queries
│           ├── cart.ts
│           ├── collections.ts
│           └── products.ts
│
├── 📦 PUBLIC ASSETS
│   └── public/
│       ├── logos/
│       ├── icons/
│       ├── products/
│       └── manifest.json
│
├── 🗄️ DATABASE
│   └── supabase/
│       └── migrations/          # Database migrations
│
├── 📝 DOCUMENTATION
│   ├── README.md
│   ├── PROJECT_SUMMARY.md
│   ├── WORKSPACE_GUIDE.md
│   ├── SHOPIFY_SETUP_GUIDE.md
│   ├── PIRATE_SHIP_WORKFLOW.md
│   ├── USER_MANAGEMENT_GUIDE.md
│   └── ...
│
└── ⚙️ CONFIGURATION
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── eslint.config.mjs
    ├── postcss.config.js
    ├── .env.example
    └── kind-kandles.code-workspace
```

---

## 🎨 Frontend Organization

### **Components** (`src/components/`)

#### **Customer-Facing Components**
- `Header.tsx` - Main navigation header
- `Footer.tsx` - Site footer with links
- `Cart.tsx` - Shopping cart sidebar
- `ProductCard.tsx` - Product display card
- `ProductPage.tsx` - Individual product page
- `FeaturedProductsSlider.tsx` - Homepage slider
- `FragranceCarousel.tsx` - Scent profile carousel
- `TrustBadges.tsx` - Trust indicators
- `SurveyPopup.tsx` - First-visit survey
- `SimpleBanner.tsx` - Promotional banner
- `CountdownTimer.tsx` - Sale countdown
- `LimitedTimeOffer.tsx` - Flash sale component

#### **Admin Panel Components** (`src/components/admin/`)
- `AdminDashboard.tsx` - Main admin container
- `AdminSidebar.tsx` - Desktop navigation
- `AnalyticsDashboard.tsx` - Analytics & stats
- `OrderManagement.tsx` - Order list & management
- `ProductManagement.tsx` - Product CRUD
- `CustomerManagement.tsx` - Customer database
- `DiscountManagement.tsx` - Discount codes
- `ShippingManagement.tsx` - Shipping settings
- `UserManagement.tsx` - Admin user management
- `PromotionsManagement.tsx` - Banners & promos
- `BlogManagement.tsx` - Blog posts
- `EmailManagement.tsx` - Email templates
- `FileManagement.tsx` - Media library

#### **Mobile Admin Components** (`src/components/admin/mobile/`)
- `MobileAppShell.tsx` - Mobile container
- `MobileOrders.tsx` - Mobile order management
- `MobileProducts.tsx` - Mobile product management
- `OrderDetailsModal.tsx` - Order details view
- `MobileShippingGuide.tsx` - Shipping workflow guide
- `MoreMenu.tsx` - Mobile menu

### **Pages** (`src/app/`)

#### **Public Pages**
- `/` - Homepage
- `/collections/*` - Product collections
- `/products/[handle]` - Product detail pages
- `/blog/*` - Blog posts
- `/about/*` - About, mission, contact, refund policy
- `/faq` - Frequently asked questions
- `/customs` - Custom order requests
- `/write-your-story` - Customer stories
- `/checkout` - Checkout flow

#### **Admin Pages**
- `/restricted/login` - Admin login
- `/restricted/admin` - Admin dashboard

### **Contexts** (`src/contexts/`)
- `CartContext.tsx` - Shopping cart state
- `AdminContext.tsx` - Admin authentication & settings
- `DarkModeContext.tsx` - Theme switching
- `BannerContext.tsx` - Banner visibility

### **Hooks** (`src/hooks/`)
- `useDebounce.ts` - Debounce values
- `useIntersectionObserver.ts` - Lazy loading
- `useLocalStorage.ts` - Local storage sync

---

## ⚙️ Backend Organization

### **API Routes** (`src/app/api/`)

#### **Authentication** (`/api/auth/`)
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/verify` - Verify admin token

#### **Orders** (`/api/orders/`)
- `GET /api/orders` - List orders (admin)
- `POST /api/orders` - Create order (checkout)
- `GET /api/orders/[id]` - Get order details
- `PATCH /api/orders/[id]` - Update order
- `DELETE /api/orders/[id]` - Delete order

#### **Admin Orders** (`/api/admin/orders/`)
- `POST /api/admin/orders/export-csv` - Export orders to CSV
- `POST /api/admin/orders/import-tracking` - Import tracking numbers

#### **Products** (`/api/admin/products/`)
- `GET /api/admin/products` - List products
- `POST /api/admin/products` - Create product
- `PATCH /api/admin/products/[id]` - Update product
- `DELETE /api/admin/products/[id]` - Delete product

#### **Analytics** (`/api/analytics/`)
- `GET /api/analytics/overview` - Dashboard stats
- `GET /api/analytics/top-products` - Best sellers
- `GET /api/analytics/low-stock` - Low inventory alerts

#### **Shipping** (`/api/shipping/`)
- `POST /api/shipping/calculate` - Calculate shipping rates

#### **Webhooks** (`/api/webhooks/`)
- `POST /api/webhooks/square` - Square payment webhooks

#### **Maintenance** (`/api/maintenance/`)
- `GET /api/maintenance/status` - Check maintenance mode (public)
- `GET /api/admin/maintenance` - Get maintenance settings (admin)
- `POST /api/admin/maintenance` - Update maintenance settings (admin)

### **Libraries** (`src/lib/`)

#### **Database**
- `supabase.ts` - Supabase client & helpers
- `database.types.ts` - TypeScript types for database

#### **Integrations**
- `shopify.ts` - Shopify Storefront API
- `email.ts` - Email sending (Resend)
- `square.ts` - Square payment processing

#### **Utilities**
- `errorHandler.ts` - Error handling & logging
- `apiUtils.ts` - API helper functions
- `accessibility.ts` - A11y utilities
- `localStore.ts` - Local storage helpers
- `seo.ts` - SEO utilities

#### **Queries** (`src/lib/queries/`)
- `cart.ts` - Cart-related queries
- `collections.ts` - Collection queries
- `products.ts` - Product queries

---

## 🚀 Opening the Workspace

### **Option 1: Open Workspace File (Recommended)**

1. Open VS Code
2. File → Open Workspace from File...
3. Select `kind-kandles.code-workspace`

### **Option 2: Command Line**

```bash
code kind-kandles.code-workspace
```

### **Benefits of Using the Workspace:**
- ✅ **Organized folders** by functionality
- ✅ **Quick navigation** between frontend/backend
- ✅ **Focused search** within specific areas
- ✅ **Custom tasks** for common operations
- ✅ **Debug configurations** pre-configured
- ✅ **Recommended extensions** auto-suggested

---

## 💻 Development Workflow

### **Starting Development**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or use VS Code task: Ctrl+Shift+P → "Run Task" → "Start Development Server"
```

### **Building for Production**

```bash
# Build production bundle
npm run build

# Start production server
npm start

# Or use VS Code task: "Build Production"
```

### **Code Quality**

```bash
# Run linter
npm run lint

# Or use VS Code task: "Run Linter"
```

### **Available Tasks** (Ctrl+Shift+P → "Run Task")
- 🚀 Start Development Server
- 🏗️ Build Production
- 🧪 Run Linter
- 🧹 Clean Build

### **Debug Configurations** (F5 or Debug panel)
- 🚀 Next.js: Debug Server
- 🌐 Next.js: Debug Client
- 🔍 Next.js: Debug Full Stack

---

## 🧭 Quick Navigation

### **Finding Components**
- **Customer UI**: `src/components/` (non-admin)
- **Admin Desktop**: `src/components/admin/`
- **Admin Mobile**: `src/components/admin/mobile/`

### **Finding Pages**
- **Public Pages**: `src/app/` (excluding `api/` and `restricted/`)
- **Admin Pages**: `src/app/restricted/`

### **Finding API Routes**
- **Public APIs**: `src/app/api/` (auth, orders, shipping, webhooks)
- **Admin APIs**: `src/app/api/admin/` and `src/app/api/analytics/`

### **Finding Business Logic**
- **Database**: `src/lib/supabase.ts` and `src/lib/queries/`
- **Integrations**: `src/lib/shopify.ts`, `src/lib/email.ts`
- **Utilities**: `src/lib/`

### **Finding Styles**
- **Global CSS**: `src/app/globals.css`
- **Tailwind Config**: `tailwind.config.js`
- **Component Styles**: Inline Tailwind classes

### **Finding Types**
- **Database Types**: `src/lib/database.types.ts`
- **Component Props**: Within component files
- **API Types**: Within API route files

---

## 🔍 Search Scopes

The workspace is configured with optimized search scopes:

### **Search Frontend Only**
1. Open search (Ctrl+Shift+F)
2. Click "..." → "files to include"
3. Enter: `src/components, src/app/(pages), src/contexts, src/hooks`

### **Search Backend Only**
1. Open search (Ctrl+Shift+F)
2. Click "..." → "files to include"
3. Enter: `src/app/api, src/lib`

### **Search Documentation**
1. Open search (Ctrl+Shift+F)
2. Click "..." → "files to include"
3. Enter: `**/*.md`

---

## 📦 Recommended Extensions

The workspace recommends these VS Code extensions:
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **TypeScript Next** - Enhanced TypeScript support
- **Auto Rename Tag** - Sync HTML/JSX tag names
- **Path Intellisense** - File path autocomplete
- **Supabase** - Database management

---

## 🎯 Key Features

### **Multi-Root Workspace Benefits**
1. **Logical Separation**: Frontend and backend are clearly separated
2. **Focused Navigation**: Jump directly to the area you need
3. **Scoped Search**: Search only in frontend or backend
4. **Better Organization**: Large codebase feels manageable
5. **Custom Settings**: Different settings per folder if needed

### **Pre-Configured Tasks**
- One-click development server start
- Quick production builds
- Integrated linting
- Clean build option

### **Debug Configurations**
- Server-side debugging
- Client-side debugging
- Full-stack debugging

---

## 📚 Additional Resources

- **Project Summary**: `PROJECT_SUMMARY.md`
- **Shopify Setup**: `SHOPIFY_SETUP_GUIDE.md`
- **Shipping Workflow**: `PIRATE_SHIP_WORKFLOW.md`
- **User Management**: `USER_MANAGEMENT_GUIDE.md`
- **Performance**: `PERFORMANCE_OPTIMIZATIONS.md`
- **Error Handling**: `ERROR_HANDLING_IMPROVEMENTS.md`

---

## 🤝 Contributing

When working on this project:

1. **Frontend changes**: Work in `src/components/` or `src/app/(pages)/`
2. **Backend changes**: Work in `src/app/api/` or `src/lib/`
3. **Both**: Update both areas as needed
4. **Documentation**: Update relevant `.md` files
5. **Commit**: Use clear, descriptive commit messages

---

## 💡 Tips

- Use **Ctrl+P** to quickly open files by name
- Use **Ctrl+Shift+F** to search across the workspace
- Use **F5** to start debugging
- Use **Ctrl+Shift+P** to access all commands
- Use the **Explorer** sidebar to see the organized folder structure
- Use **Ctrl+`** to toggle the integrated terminal

---

**Happy Coding! 🚀**

