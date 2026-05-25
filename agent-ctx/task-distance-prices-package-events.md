# Task: Per-Distance Registration Fees & Package/Bundle Events

## Summary
Implemented two major features:
1. **Per-Distance Registration Fees**: Each event distance can have its own registration price (e.g., 3K = ₱250, 5K = ₱350, 10K = ₱500)
2. **Package/Bundle Events**: Events can be marked as "complete package" where registration includes everything (no optional add-ons), but size selection is still available

## Files Changed

### Schema
- `prisma/schema.prisma` — Added `EventDistancePrice` model and `isPackage` boolean to Event model

### API Routes
- `src/app/api/admin/events/route.ts` — Updated GET (include distancePrices), POST (create distance prices + isPackage)
- `src/app/api/admin/events/[id]/route.ts` — Updated PUT (delete+recreate distance prices, handle isPackage)
- `src/app/api/admin/events/[id]/detail/route.ts` — Updated GET (include distancePrices)
- `src/app/api/events/route.ts` — Updated GET (include distancePrices)
- `src/app/api/auth/event-register/route.ts` — Updated POST (use distance-specific prices, handle isPackage for total calculation)

### Admin UI
- `src/app/admin/dashboard/events/page.tsx` — Added distance price inputs, package toggle, conditional add-on pricing fields
- `src/app/admin/dashboard/events/[id]/page.tsx` — Updated to show distance-specific pricing, package badge
- `src/app/admin/dashboard/onsite-registration/page.tsx` — Added distance pricing, package event support, size selection for packages

### Public UI
- `src/components/pages/UpcomingEventsPage.tsx` — Added distance price display, package event registration dialog, distance price calculation

## Key Implementation Details
- Distance prices stored in `EventDistancePrice` table with cascade delete
- Fallback to `basePrice` when no distance prices are set
- Package events: distance price = full package price, add-ons included, sizes still selectable
- Non-package events: distance price + optional add-on checkboxes with prices
- Server-side total validation in event-register API using distance prices
