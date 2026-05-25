# Task 1: Rewrite DAPA RUN Events Admin Page Form Section

## Summary
Modified `/home/z/my-project/src/app/admin/dashboard/events/page.tsx` to implement 8 specific changes to the dialog form section.

## Changes Made

### 1. Removed "Required" red asterisk from Race Time & Registration Close Time labels
- Line 610: Changed `Race Time <span className="text-red-400">*</span>` to just `Race Time`
- Line 635: Changed `Registration Close Time <span className="text-red-400">*</span>` to just `Registration Close Time`
- Removed `required` prop from TimePicker usage (line 639)
- Kept red asterisk on Race Date and Registration Close Date labels

### 2. Reordered Distance & Pricing section
- New order: Distances selection → Registration Fee Per Distance → Package Registration toggle
- Previously: Distances selection → Package Event toggle → Registration Fee Per Distance

### 3. Renamed "Package Event" to "Package Registration"
- All references to "Package Event" changed to "Package Registration"

### 4. Restructured Non-Package (Standard) mode Registration Fee Per Distance section
- When toggle OFF: Registration Fee Per Distance header → Distance pricing cards → Package Registration toggle → Optional Add-ons section
  - Sub-header: "Optional Add-ons"
  - Finisher Shirt: pill button sizes + price input
  - Race Singlet: pill button sizes + price input
  - Add-ons note preserved
- When toggle ON: Package Fee input → Included Sizes section with pill buttons

### 5. Changed size selection from checkbox to pill button style
- All size selectors (Finisher Shirt & Race Singlet) now use pill buttons
- Selected: orange bg (bg-orange-600 text-white border-orange-600)
- Unselected: white bg (bg-white text-gray-700 border-gray-200)
- "Other" option shows PlusCircle icon and reveals text input when selected

### 6. Changed Featured Event from checkbox to toggle button
- Green switch style (bg-emerald-500 when on, bg-gray-300 when off)
- Same style as Package Registration toggle

### 7. Added View Summary button
- Outline button style, full width
- Placed before Create/Update Event button
- Opens a Summary Dialog showing event details

### 8. Removed Price Range display from form
- The price range auto-calculation still works (hidden input)
- Price Range is shown in the Summary Dialog instead

### Additional changes (supporting)
- Added `standardSingletSizes` constant (XS, S, M, XL, XXL, 3XL - no L) for singlet size pills
- Added `summaryOpen` state for the Summary Dialog
- Updated singlet parsing in `openEdit` to use `standardSingletSizes` 
- Removed unused `Checkbox` import
- Removed unused `EventDateInfo` type import
- Added Summary Dialog component after main dialog

## File Stats
- Original: 1107 lines
- Final: 1141 lines
- Lint: No errors in this file
