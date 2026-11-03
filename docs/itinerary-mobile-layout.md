# Itinerary Details mobile spacing and overlays

- Saved itinerary routes no longer inherit the global `main` footer spacer (260px), or the extra mobile main top margin below an already-sticky header. Other routes keep their existing layout rules.
- Overview/sidebar cards shrink naturally, use compact mobile padding and one consistent gap, and have no trailing action/day/summary margins. Long destination names and notes wrap within the cards. Buttons retain at least 44px touch targets.
- The mobile bottom navigation accounts for the device safe area. Only layouts actually mounting this navigation reserve its bottom clearance. Chat defaults above the bar/raised center button, rather than covering About or Stay.
- Mobile chat dragging uses the actual widget dimensions, navbar, bottom navigation and visual viewport. Rotation/resizing reclamps it; returning to desktop restores the original bottom/right positioning. Large-phone chat panels also fit above the navigation.
- Itinerary archiving now uses a compact styled `<dialog>` in the browser top layer, instead of `window.confirm`. It stays above chat/navigation, locks background scrolling, starts on Cancel, traps keyboard focus, supports Escape/backdrop cancellation, and restores focus/scroll behavior when closed. During the request, cancellation and duplicate submissions are blocked. Errors remain in the dialog for retry.
- Opening or cancelling the dialog never writes to the API. Explicit confirmation retains the existing CSRF-protected soft-archive request and redirects only after success. It does not permanently delete the itinerary or modify bookings/payments.

## Validation

From `frontend/` (Node 22+ and Chromium/Chrome/Edge, optionally `CHROME_PATH`):

```powershell
node --test --test-concurrency=1 tests/itinerary-detail-responsive.test.mjs
```

The full app and its global CSS are loaded with mocked APIs. Tests cover 320, 360, 393, 480, 640 and 768px widths, short landscape screens, dialog sizing/keyboard focus, drag/resize bounds, dark-mode contrast, desktop positioning, cancellation without writes, inline errors and single-request confirmation. External map/chat/payment services are blocked. Screenshot fixtures are saved in the approved OpenCode temporary directory, not `frontend/dist/`. These are browser-emulation checks, not an assertion of deployment or testing on a physical handset.
