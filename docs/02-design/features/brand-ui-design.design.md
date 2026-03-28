# Design Document - Brand UI Design

## 1. Design Overview
The dashboard will transition from generic blue/indigo themes to a cohesive brand identity using Arkadaş Özel Eğitim's Primary Green (`#689F38`) and Secondary Orange (`#E67E22`).

## 2. Component Specifications

### 2.1. DashboardSidebar
- **Header Background:** Linear gradient from `primary.DEFAULT` to `primary.dark`.
- **Active Item:** 
    - Background: `primary.light` with 10% opacity (or `bg-primary/10`).
    - Text: `primary.dark`.
    - Indicator Dot: `secondary.DEFAULT`.
- **Icons (Active):** `primary.DEFAULT`.

### 2.2. TopBar
- **Border Bottom:** Subtle border using `primary.light` (low opacity).
- **Search Focus:** `primary.DEFAULT` ring.

### 2.3. Widgets & Stats
- **Icon Backgrounds:** Soft gradients of `primary` or `secondary` based on the metric type.
- **Trend Indicators:** `success` (green) or `error` (red) stay standard, but with brand-consistent shades.

### 2.4. Typography
- Keep **Playfair Display** for headings where appropriate (headers, large stats).
- Keep **Inter** for all UI body text.

## 3. Implementation Details
- Use Tailwind's arbitrary opacity `bg-primary/10`.
- Update `DashboardSidebar.tsx` first as it's the most prominent element.
- Follow up with `Overview.tsx` chart colors.

## 4. Brand Color Palette Reference
- **Primary Green:** `#689F38`
- **Secondary Orange:** `#E67E22`
- **Accent Green:** `#A5D6A7`
