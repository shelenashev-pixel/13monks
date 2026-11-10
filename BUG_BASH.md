# Bug Bash — 13 Assyrian Fathers of Georgia

## Scope and method

Read-only review of the data, map/card code, responsive CSS, image paths, and accessibility behavior. Rendered checks were run at 375×568, 375×667, and 375×812, plus desktop widths of 761, 800, 900, 1024, and 1365 pixels. The working tree was clean before this report; no application files were changed.

No P0 blocker was found. All 13 coordinate pairs are within Georgia, and all 13 monastery-photo paths resolve. Several named-site pins do not match the corresponding map destination, however. Historical notes below distinguish source-backed tradition from independently verified fact; this was not an archival or on-site survey.

## 1. Fact checking and data

### P1 — Important

- **The roster substitutes Tate of Shuamta for a commonly listed father.** The app calls this a list of the Thirteen Assyrian Fathers, but the record at [data/monks.json](./data/monks.json#L103) names Tate of Shuamta; a commonly listed roster includes Tadeoz (Thaddeus) of Stepantsminda instead. Traditions do vary and may name more than thirteen, so the current selection needs an explicit source rather than an unexplained substitution. **Quick fix:** use the cited roster consistently, or retain Tate but label and cite the variant and identify the omitted figure.

- **Ise's Georgian name does not match the displayed saint.** [data/monks.json](./data/monks.json#L18) gives `ელისე წეროვნელი` (“Elise of Tserovani”), while the conventional name for Iese of Tsilkani is `იესე წილკნელი`. **Quick fix:** have a Georgian-language source/editor verify and correct the Georgian name, or correct the English/monastery identity if the current Georgian form was intended.

- **Five marker coordinates disagree with the linked destination for the named site.** MapLibre reads the arrays as `[longitude, latitude]`. The coordinates below are the data values; distances compare them to the destination point embedded in each record's `gmapsUrl`. Treat these as pin mismatches to resolve, not proof that a particular entrance or complex centroid is the only correct point.

  | Record | File/line | Data `[lon, lat]` | Linked destination `[lon, lat]` | Approx. gap |
  |---|---|---:|---:|---:|
  | Isidore of Samtavisi | [data/monks.json](./data/monks.json#L45) | `[44.4069, 41.9961]` | `[44.4089, 42.0063]` | 1.15 km |
  | Mikhail of Ulumbo | [data/monks.json](./data/monks.json#L71) | `[43.6820, 42.0520]` | `[43.5845, 42.1414]` | 12.79 km |
  | Anton of Martqopi | [data/monks.json](./data/monks.json#L83) | `[45.0294, 41.7892]` | `[44.9678, 41.8274]` | 6.64 km |
  | Ioseb of Alaverdi | [data/monks.json](./data/monks.json#L121) | `[45.3670, 42.0108]` | `[45.3772, 42.0325]` | 2.55 km |
  | Stephane of Khirsa | [data/monks.json](./data/monks.json#L146) | `[45.8944, 41.5794]` | `[45.9992, 41.5777]` | 8.72 km |

  OpenStreetMap's Nominatim monastery results independently support the Martqopi point near `[44.9685, 41.8272]` and the Khirsa point near `[46.0007, 41.5777]`; the Ulumbo query returned a road rather than the monastery itself, so it is not used as an exact site pin. **Quick fix:** verify each pin against a reliable site/heritage map and use the same verified location in the map marker and outbound link. Recheck all 13 points after correction.

- **Hagiographic claims and precise dates are presented without citations or qualification.** For example, [data/monks.json](./data/monks.json#L11) states the bear story and a specific repose date; [data/monks.json](./data/monks.json#L86) states the Mandylion story; [data/monks.json](./data/monks.json#L125) gives another precise year. The reference article describes the lives as medieval Georgian hagiographic texts, unattested beyond those sources, with contested dating/authorship. **Quick fix:** cite a source for each biographical claim, label traditional accounts as such, and avoid presenting disputed dates as independently verified facts.

### P2 — Cosmetics/content clarity

- **“Clay tile (Mandylion)” conflates relic descriptions without a source.** [data/monks.json](./data/monks.json#L86) identifies a clay tile as the Mandylion. The Image of Edessa article describes the Mandylion as an image on cloth; if the Georgian tradition refers to a different tile relic, the current parenthetical obscures that distinction. **Quick fix:** cite the Georgian account and name the tile relic separately, or remove “(Mandylion)” unless the source supports that identification.

## 2. Map logic and interactivity

### P1 — Important

- **Search filters only the list, not the map or mobile carousel.** [js/app.js](./js/app.js#L87) initializes markers from all records; [js/app.js](./js/app.js#L99) rerenders only the filtered list, and selection passes all records to the carousel at [js/app.js](./js/app.js#L77). Browser check: searching `Tsilkani` left one list row but all 13 markers remained; selecting that result still exposed all 13 swipe cards. **Quick fix:** make the active filtered set the source for markers and swipe navigation, or explicitly scope/label search as “list only” and keep selection navigation within the filtered results.

- **Desktop camera offset ignores the actual panels and hides the selected pin/card behind the detail panel at narrower desktop widths.** [js/map.js](./js/map.js#L65) always shifts the camera by 33% of viewport width (up to 450px) plus 165px vertically. The detail panel begins at x=400 and overlays the popup. At 761px, browser geometry showed the selected marker at x=613 and popup x=507–747, mostly behind the detail panel; the popup still overlapped that panel at 800, 900, and 1024px. **Quick fix:** compute camera padding/offset from the visible map rectangle after accounting for both panels, and verify popup placement as well as marker placement at the 761px breakpoint and up.

### P2 — Minor

- **Clicking empty map space does not dismiss the active popup.** [js/map.js](./js/map.js#L155) sets `closeOnClick: false`, and there is no replacement blank-map close handler. Confirmed by clicking an unoccupied map area while a card was open. **Quick fix:** enable popup close-on-click or add a map-background handler that closes the popup without treating marker/control clicks as blank-map clicks.

- **A zero-result search leaves an unexplained empty list.** [js/app.js](./js/app.js#L94) filters to an empty array, and [js/cards.js](./js/cards.js#L16) clears the list before rendering; the count is visually clipped. Browser check with a no-match query showed a blank list and no visible explanation. **Quick fix:** render a visible “No monasteries found” message and a clear-search action.

## 3. Mobile adaptability and layout

### P1 — Important

- **Card action buttons are clipped on a short 375px-wide viewport.** At 375×568, the card is 270px high, but its action row extends to y=570 while the card ends at y=560; `overflow: hidden` clips the bottom 10px. At 375×667 the row fits. Relevant sizing is in [index.html](./index.html#L305) and the action row in [index.html](./index.html#L337). **Quick fix:** let the card adapt to the available viewport height, reduce image/content allocation at short heights, or make the card body scroll; keep the entire action hit area visible.

### P2 — Minor

- **The layout relies on fixed `vh` sizing and does not account consistently for iOS dynamic viewport/safe-area changes.** [index.html](./index.html#L5) has no `viewport-fit=cover`; [index.html](./index.html#L42) fixes the document to `height: 100%`, while the mobile card and detail sheet use `44vh` and `16vh` at [index.html](./index.html#L305) and [index.html](./index.html#L346). Only selected bottom elements include safe-area insets. The short-viewport crop above is reproducible; address-bar behavior was not tested on a physical iOS device. **Quick fix:** use `dvh` with a `vh` fallback where appropriate, apply safe-area insets to fixed edges, and validate Safari with its browser bars expanded and collapsed.

- **Map markers and the compact-card close control have small touch targets.** Marker elements are only 28×28px in [js/map.js](./js/map.js#L25); the close button is 32×32px in [index.html](./index.html#L315). These are below the commonly recommended 44px mobile target, especially difficult to hit on a dense map. **Quick fix:** enlarge the interactive hit areas to at least 44×44px while preserving the smaller visual marker.

## 4. Broken assets and accessibility

### P1 — Important

- **Map markers are not keyboard-operable controls.** [js/map.js](./js/map.js#L25) creates a clickable `div` and attaches only a pointer `click` listener at [js/map.js](./js/map.js#L41); the rendered markers have an accessible label but no `tabindex`, button role, or keyboard handler. The list cards do support keyboard activation, but keyboard users cannot operate pins directly. **Quick fix:** use a semantic button for the marker or add button semantics, focus styling, and Enter/Space activation.

### P2 — Minor

- **Two icon fallback paths do not exist, and the detail view has no image-error fallback.** [data/monks.json](./data/monks.json#L103) and [data/monks.json](./data/monks.json#L128) omit `iconUrl`; the fallback in [js/app.js](./js/app.js#L14) requests `images/icons/tate-dzveli-shuamta.jpg` and `images/icons/abibos-nekresi.jpg`, neither of which exists. The detail image has no `onerror` handler and an empty `alt` at [index.html](./index.html#L425), so opening either record can show a broken-image indicator. All 13 monastery photos do exist. **Quick fix:** add the intended icons or point to a shared placeholder, handle image failure in the detail view, and provide appropriate alternative text when the image conveys content.

- **The detail dialog does not move/manage focus or close on Escape.** The dialog is declared at [index.html](./index.html#L416), but opening/closing in [js/app.js](./js/app.js#L7) and [js/app.js](./js/app.js#L34) does not focus the dialog, trap/restore focus, or register Escape. Browser check confirmed focus remained on the background list card and Escape left the dialog open. **Quick fix:** follow the dialog keyboard pattern: focus inside on open, constrain/restore focus, and close on Escape.

- **The flag “language switch” is inert and hidden from assistive technology.** [index.html](./index.html#L383) renders static flag spans inside `aria-hidden="true"`; there are no buttons or language-change handlers. **Quick fix:** implement labeled language buttons and translation behavior, or remove the switch styling/flags if they are decorative.

## Sources and evidence

- [Thirteen Assyrian Fathers](https://en.wikipedia.org/wiki/Thirteen_Assyrian_Fathers) — roster and caveats about the hagiographic source record and variant traditions.
- [Image of Edessa / Mandylion](https://en.wikipedia.org/wiki/Image_of_Edessa) — traditional description of the Mandylion as an image on cloth.
- [OpenStreetMap Nominatim: Martqopi monastery](https://nominatim.openstreetmap.org/search?q=Martkopi%20monastery&format=jsonv2)
- [OpenStreetMap Nominatim: Khirsa Monastery](https://nominatim.openstreetmap.org/search?q=Khirsa%20Monastery%20Georgia&format=jsonv2)
- [OpenStreetMap Nominatim: Ulumbo monastery](https://nominatim.openstreetmap.org/search?q=Ulumbo%20monastery%20Georgia&format=jsonv2) — returns a monastery road, not an exact site point.
- The Google Maps destination points used for the coordinate comparison are embedded in each record's `gmapsUrl` in [data/monks.json](./data/monks.json).
- Browser layout and interaction measurements were taken from the local page at the viewport sizes listed under Scope and method.
