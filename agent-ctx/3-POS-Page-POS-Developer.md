# Task 3-POS-Page — POS Developer Agent

## Task
Create the POS (Point of Sale) page at /admin/dashboard/pos

## Work Completed

### 1. Updated Merchandise API for Staff Access
- Modified `/src/app/api/admin/merchandise/route.ts` GET endpoint
- Changed auth check from `role !== "admin"` to `!["admin", "staff"].includes(role)`
- Staff can now view merchandise products needed for POS operations

### 2. Added POS to Admin Sidebar
- Modified `/src/app/admin/dashboard/layout.tsx`
- Added `Monitor` icon import from lucide-react
- Added POS navigation item: `{ label: 'POS', href: '/admin/dashboard/pos', icon: Monitor, roles: ['admin', 'staff'] }`

### 3. Created Full POS Page
- File: `/src/app/admin/dashboard/pos/page.tsx`
- Complete `'use client'` component with all requested features:

**Product Grid (Left - 60%):**
- Category filter tabs: All | Shoes | Apparel | Accessories (with item counts)
- Search bar to filter by product name
- Product cards in responsive grid (2-3 columns) with:
  - Product image thumbnail with error fallback
  - Name, price (₱ formatted), category badge, optional badge
  - "Add" button with orange gradient
- Fetches from `/api/admin/merchandise` on mount

**Order Cart (Right - 40%, sticky):**
- Header with "Current Transaction" title, item count badge, clear button
- Scrollable item list with:
  - Product image thumbnail
  - Item name + size (if applicable)
  - Quantity controls (minus/plus buttons)
  - Unit price and line total
  - Remove button (X, visible on hover)
- Subtotal display
- Customer name input (default "Walk-in Customer")
- Payment method selector: Cash | GCash | Card (toggle-style buttons with icons)
- Big orange gradient "Complete Sale" button with total

**Size Selector Dialog:**
- Opens when adding a product that has sizes
- Shows available sizes as clickable buttons
- Must select a size before adding to cart
- Cancel and Add to Cart buttons

**Receipt Dialog:**
- Clean receipt-style layout with DAPA RUN branding
- Shows: Order number, date/time, customer name, cashier name
- Items table with name, size, quantity, amount
- Bold total amount
- Payment method with icon
- "Thank you for your purchase!" footer
- "Print Receipt" (window.print) and "Close" buttons

**State Management:**
- Local useState for: cart items, category filter, search, customer name, payment method, dialogs, loading states
- Cart item shape: `{ id, name, price, quantity, size, image, category }`
- POST to `/api/admin/pos` with `{ items: [{itemId, quantity, size}], paymentMethod, customerName, staffName }`
- Staff name from `(session?.user as any)?.name` via useSession()

### Verification
- Page returns HTTP 200 at /admin/dashboard/pos
- Lint: only pre-existing CountdownTimer.tsx error, no new issues
- Dev server running successfully
