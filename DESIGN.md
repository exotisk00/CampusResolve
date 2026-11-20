# CampusResolve AI — Design System

> **Campus:** Lovely Professional University (LPU), Phagwara Campus  
> **Audience:** Exclusively for LPU students and campus staff  
> **Core Tagline:** *"One Campus. One Platform. Smarter Complaint Resolution."*  
> **Version:** 2.1.0 · LPU Dedicated Identity

---

## 1. Project Scope & Institutional Identity

CampusResolve AI is custom-engineered **exclusively for Lovely Professional University (LPU), Phagwara campus**. It is a single-campus platform, not a multi-university platform.

- **Campus Context:** Tailored to LPU Phagwara's extensive infrastructure — covering academic blocks (e.g., Block 32, 34, 38), boys' hostels (BH-1 to BH-8), girls' hostels (GH-1 to GH-6), student food messes, and campus facilities.
- **Audience:** Dedicated solely to enrolled LPU students, faculty, wardens, maintenance teams, and campus administrative staff.
- **Tone:** Practical, responsive, institutional, and student-friendly. Supports natural student Hinglish, Hindi, and English expressions.
- **Accuracy Policy:** Strictly no unverified claims, fabricated stats, or invented official endorsements. Transparent and accountable.

---

## 2. Campus Location Schema

Every complaint within CampusResolve AI must accurately pin its physical location using the standard LPU 3-tier structure:

| Field | Purpose | LPU Examples |
|---|---|---|
| **Block** | Building / Hostel / Facility identifier | `Block 34`, `Block 38`, `BH-1`, `BH-4`, `GH-2`, `Uni-Mall`, `Central Library` |
| **Floor** | Level inside the block | `Ground Floor`, `1st Floor`, `2nd Floor`, `3rd Floor`, `4th Floor` |
| **Room Number** | Specific room or landmark | `Room 304`, `Lab 201`, `Washroom near Staircase B`, `Mess Hall 2` |

---

## 3. The Six Official Departments

Routing and ticket classification are strictly constrained to exactly **six departments**:

1. **Plumbing** — Water supply, washroom leakages, drainage issues, taps, geysers, RO water purifiers.
2. **Electrical** — Lighting, fans, switches, AC units, power outages, socket sparking.
3. **Wi-Fi** — Campus LPU Wi-Fi connectivity, hostel router issues, authentication errors, dead zones.
4. **Mess** — Food quality, hygiene, drinking water, dining hall cleanliness, mess staff conduct.
5. **Academic** — Classroom projector/audio issues, seating, timetable or lecture hall access.
6. **Other** — General campus infrastructure, security, lost & found, transport, miscellaneous campus concerns.

---

## 4. Realistic LPU Complaint Scenarios

The AI classifier and UI mockups should utilize realistic student and staff submissions from LPU Phagwara:

- **Hostel Wi-Fi:** *"BH-2 Room 314 me LPU Wi-Fi connect nahi ho raha hai morning se, roll no authenticate nahi ho raha."*
- **Washroom Plumbing:** *"Block 34, 2nd floor washroom near water cooler me tap continuously leak ho raha hai."*
- **Academic Electrical:** *"Block 38 Room 402 AC switchboard spark kar raha hai and fan band ho gaya hai."*
- **Mess Food:** *"Mess 4 me aaj lunch me hygiene issue tha and food quality standard nahi thi."*

---

## 5. Visual Design Tokens (Bright Light Theme)

### Canvas & Surface Tokens

| Token | Hex / Value | Usage |
|---|---|---|
| `--color-bg-base` | `#F8FAFC` | Main application canvas, clean light slate background |
| `--color-bg-surface` | `#FFFFFF` | Card surface, table rows, form cards |
| `--color-bg-subtle` | `#F1F5F9` | Secondary section background, alternate rows |
| `--color-bg-elevated` | `#FFFFFF` | Floating panels, dropdown menus, modals |
| `--color-bg-blue-tint` | `#EFF6FF` | Subtle brand tint for badges, active tabs, pill containers |

### Brand & Accent Tokens

| Token | Hex / Value | Usage |
|---|---|---|
| `--color-brand-blue` | `#1F47E8` | Primary brand color, CTA buttons, active states |
| `--color-brand-blue-hover` | `#1738C0` | Hover state for primary buttons |
| `--color-brand-blue-mid` | `#3B82F6` | Secondary accent, link color, informational icons |
| `--color-brand-blue-light` | `#DBEAFE` | Soft blue border tint, highlighted row backdrops |
| `--color-accent-green` | `#10B981` | Success states, resolved complaints badge |
| `--color-accent-amber` | `#F59E0B` | Pending / in-review status indicators |
| `--color-accent-red` | `#EF4444` | Escalated / urgent priority alerts |

### Typography Tokens (Dark Navy / Charcoal for High Contrast)

| Token | Hex / Value | Usage |
|---|---|---|
| `--color-text-heading` | `#0B132B` | Page titles, section headings, card titles (High Contrast) |
| `--color-text-primary` | `#1E293B` | Body copy, form inputs, table data |
| `--color-text-secondary` | `#475569` | Sub-labels, descriptions, secondary metadata |
| `--color-text-muted` | `#64748B` | Placeholders, inactive indicators, helper copy |
| `--color-text-inverse` | `#FFFFFF` | Text on vivid blue primary buttons |

### Typography Scale
- **Headings:** `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
- **Body & Forms:** `'Inter', system-ui, -apple-system, sans-serif`
- **Reference / Ticket IDs:** `'JetBrains Mono', 'Fira Code', monospace`

---

## 6. Card & Component Design

- **Background:** `#FFFFFF`
- **Borders:** `1px solid #E2E8F0`
- **Border Radius:** `16px` for cards, `10px` for inputs/buttons, `9999px` for status pills.
- **Shadows:** Soft, subtle ambient shadows (`box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 10px 15px -3px rgba(15, 23, 42, 0.04)`).
- **Status Badges:**
  - *In Review:* `#EFF6FF` background, `#1F47E8` text, `rgba(31, 71, 232, 0.2)` border.
  - *Resolved:* `#ECFDF5` background, `#065F46` text, `rgba(16, 185, 129, 0.2)` border.
  - *Pending:* `#FFFBEB` background, `#B45309` text, `rgba(245, 158, 11, 0.2)` border.
  - *Escalated:* `#FEF2F2` background, `#B91C1C` text, `rgba(239, 68, 68, 0.2)` border.

---

## 7. Department Taxonomy Badges

For quick visual identification, each of the 6 official departments has a consistent theme:

| Department | Icon | Background | Text Color |
|---|---|---|---|
| **Plumbing** | Wrench / Droplet | `#EFF6FF` | `#1F47E8` |
| **Electrical** | Zap | `#FFFBEB` | `#D97706` |
| **Wi-Fi** | Wifi | `#F0FDF4` | `#15803D` |
| **Mess** | UtensilsCrossed | `#FFF1F2` | `#E11D48` |
| **Academic** | BookOpen | `#FAF5FF` | `#7E22CE` |
| **Other** | HelpCircle | `#F8FAFC` | `#475569` |

---

*CampusResolve AI — Exclusively dedicated to Lovely Professional University (LPU), Phagwara Campus.*
