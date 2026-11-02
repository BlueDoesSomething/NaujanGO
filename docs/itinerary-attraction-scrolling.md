# Itinerary Builder attraction scrolling

## Fix

On viewports up to 768px, the attraction picker is a horizontal rail. It had two
problems: centering an overflowing flex row pushed its first cards into negative,
unreachable positions, and rendering only eight items while hiding pagination
made all subsequent attractions inaccessible.

- Align the rail to the start, remove card auto margins, and snap at each card's
  start so Naujan Lake/the first matching attraction is fully reachable.
- Render every **filtered** attraction in the mobile rail. Desktop keeps its
  eight-card pagination and existing filter/sort behavior.
- Reset horizontal position when results, desktop page, layout mode, or the
  attraction/template tab changes. Adding a place to a day does not reset it.
- Give small-screen cards enough height for their title, location, rating and
  day actions. Maintain a visible thin scrollbar and make the region focusable
  for native keyboard scrolling. Do not block vertical touch scrolling.
- Lazy-load images for the longer mobile list. Existing add-to-day actions,
  itinerary data, ordering and saving behavior are unchanged.

No backend change, migration, or stored itinerary rewrite is needed. The pending
System Logs fix is a separate change and is not required for this layout fix.

## Validation

`frontend/tests/itinerary-attractions-responsive.test.mjs` runs the real app in an
installed Chromium browser against **mocked APIs** with 13 fixture attractions.
It verifies widths 320, 375, 393, 480, 640 and 768px; first/last card reachability;
no document-level horizontal overflow; title visibility; desktop pagination at
769, 1024 and 1280px; desktop-to-mobile resizing; search/reset; dark-mode keyboard
scrolling; local add-to-day behavior; horizontal touch swipes and vertical page
scrolling over the rail. No live account, email, payment, map API or itinerary is
created or changed.

From `frontend/`:

```powershell
node --test tests/itinerary-attractions-responsive.test.mjs
```

Requires Node 22+ and installed Chrome/Chromium/Edge (or `CHROME_PATH`). Tests skip
if a browser is unavailable. These are emulated Chromium checks, not a substitute
for final testing on physical Android and iOS/Safari devices.
