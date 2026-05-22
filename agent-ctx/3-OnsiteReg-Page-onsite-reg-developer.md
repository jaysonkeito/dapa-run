# Task 3-OnsiteReg-Page - On-site Registration Developer

## Task
Create On-site Registration page at /admin/dashboard/onsite-registration

## Work Completed
1. Created `/src/app/admin/dashboard/onsite-registration/page.tsx` - Full on-site registration page with:
   - Registration form card (event select, participant fields, distance, payment method toggles, amount)
   - Confirmation dialog with print slip functionality
   - Recent registrations table with search filter
   - Color-coded payment method badges
   - Dynamic distance options based on selected event

2. Updated `/src/app/admin/dashboard/layout.tsx`:
   - Added `UserPlus` icon import
   - Added "On-site Registration" sidebar item (admin + staff roles)

## API Integration
- GET `/api/events?status=upcoming` - fetch events for dropdown
- GET `/api/admin/onsite-registration` - list recent registrations
- POST `/api/admin/onsite-registration` - create new registration

## Lint Status
- No new lint errors introduced (only pre-existing CountdownTimer.tsx error)
- Dev server running successfully
