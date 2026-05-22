# Task 3 - API Developer: POS Orders & On-site Registration API Routes

## Task Summary
Created 3 API route files for the DAPA RUN admin dashboard handling POS orders and on-site event registrations.

## Files Created

### 1. `/src/app/api/admin/pos/route.ts`
- **GET**: Lists all POS orders with items, sorted by createdAt desc
  - Returns formatted: `{ id, orderNumber, totalAmount, paymentMethod, customerName, staffName, createdAt, items: [{ id, itemName, price, quantity, size }] }`
- **POST**: Creates a new POS order
  - Validates items array and payment method
  - Looks up merch items by ID to get current name/price
  - Generates order number: `POS-YYYYMMDD-XXXX` (auto-incrementing per day)
  - Calculates totalAmount as sum of (price × quantity)
  - Creates POSOrder with all POSOrderItems in single create with nested items
  - Returns 201 with created order including items

### 2. `/src/app/api/admin/pos/[id]/route.ts`
- **GET**: Fetches a single POS order by ID with items
  - Returns 404 if order not found
  - Used for receipt viewing

### 3. `/src/app/api/admin/onsite-registration/route.ts`
- **GET**: Lists all on-site registrations with event details
  - Returns formatted with event title and date included
- **POST**: Creates a new on-site registration
  - Validates required fields: eventId, participantName, distance, paymentMethod
  - Validates event exists (returns 404 if not)
  - Creates OnSiteRegistration record
  - Returns 201 with created registration including event details

## Auth Pattern
All routes use: `getServerSession(authOptions)` with role check for both 'admin' and 'staff' roles.

## Error Handling
- 400: Missing/invalid required fields
- 401: Unauthorized (not logged in or wrong role)
- 404: Resource not found (single order or event)
- 500: Internal server error (try/catch)
