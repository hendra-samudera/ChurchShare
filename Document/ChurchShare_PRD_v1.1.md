# ChurchShare
## Memory-Light PDF Sharing for Church Congregations
### Product Requirement Document

| Field | Details |
|---|---|
| **Document Version** | v1.1 |
| **Date** | February 2026 |
| **Author** | Senior Product Manager |
| **Status** | Draft — Pending Stakeholder Review |
| **Change Summary** | Section 4.3 fully revised — Admin Dashboard redesigned to modern card-based layout with sidebar navigation, summary stats, slot grid, and category tagging system |
| **Target Audience** | Engineering, Design, Church Admin Stakeholders |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [User Personas](#2-user-personas)
3. [Functional Requirements](#3-functional-requirements)
4. [User Experience (UX) Guidelines](#4-user-experience-ux-guidelines)
5. [Success Metrics](#5-success-metrics)
6. [Future Roadmap](#6-future-roadmap)
- [Appendix A: Glossary](#appendix-a-glossary)

---

## 1. Executive Summary

ChurchShare is a purpose-built, zero-download PDF sharing platform designed specifically for church communities. Its singular mission is to eliminate the friction elderly congregation members face when accessing liturgical materials — without requiring a single byte of permanent storage on their devices.

### The Problem in Plain Terms

Today, most churches distribute PDFs — liturgies, song lyrics, weekly announcements, prayer guides — via WhatsApp group chats. While WhatsApp is already installed on most phones, this workflow creates two compounding problems that disproportionately hurt elderly users:

| Problem 1: Storage Overload | Problem 2: Version Chaos |
|---|---|
| Elderly users with low-spec phones frequently see "Storage Full" errors and cannot download newly shared PDFs. They arrive at church empty-handed, unable to follow along. | When a PDF is corrected, the admin re-sends it. Now "Liturgy v1", "Liturgy v2", "Liturgy FINAL USE THIS" all sit in the same chat. Elderly users consistently open the wrong version. |

### The Strategic Solution

ChurchShare solves both problems simultaneously with two core architectural decisions:

- **Zero-Download Viewing** — PDFs render directly in the mobile browser via a web viewer. No file is saved to the device. No storage is consumed.
- **Hot-Swap Links** — Each document has one permanent URL. When an admin replaces a PDF, the link automatically serves the new version. There is no new link to communicate, no old version to confuse anyone.

> 💡 **Strategic Value Proposition:** ChurchShare gives Opa and Oma the bulletin they need, every week, without ever asking them to manage files, clear storage, or find the right link. For the church admin, it replaces five follow-up messages with one link that always works.

### Target Users

ChurchShare serves two distinct user groups with fundamentally different needs: elderly congregation members aged 50–70+ (viewers) and church administrators (content managers). Both groups are addressed in depth in Section 2.

---

## 2. User Personas

Understanding the lived experience of our users is foundational. ChurchShare is not a generic file-sharing tool — it is an empathy-first product built around the specific constraints and capabilities of its audience.

---

### Persona 1 — The Viewer
# "Opa Willem & Oma Siti"
*The Congregation Member*

#### Demographics

| Attribute | Detail |
|---|---|
| **Age Range** | 55 – 78 years old |
| **Device** | Entry-level Android smartphone (8–16 GB total storage) |
| **Available Storage** | Often below 500 MB free — photos and WhatsApp media accumulate over years |
| **Technical Proficiency** | Comfortable with calling and messaging; struggles with app management |
| **Vision** | Reading glasses required for small text; prefers 16pt+ font sizes |
| **Primary Contact with Church Tech** | WhatsApp, occasionally email |

#### Goals

- Follow along with the liturgy and song lyrics during Sunday service.
- Access the weekly bulletin and announcements before or after church.
- Avoid asking their children or grandchildren for tech help.

#### Frustrations & Pain Points

- Sees a WhatsApp notification about a new bulletin PDF, taps download, and receives an error: "Insufficient storage."
- Finds three versions of the liturgy in the chat and asks a neighbor which one is correct.
- Has accidentally opened a link in an unfamiliar app and cannot navigate back.
- Small text and closely-spaced buttons cause accidental taps on the wrong action.

#### Emotional Context

> *"I just want to read along like everyone else. I don't want to bother my son every Sunday to fix my phone."* — Archetypal Oma user sentiment

---

### Persona 2 — The Admin
# "Pak Rudi / Sister Maria"
*The Church Administrator*

#### Demographics

| Attribute | Detail |
|---|---|
| **Age Range** | 30 – 55 years old |
| **Device** | Mid-range smartphone or laptop |
| **Technical Proficiency** | Comfortable with Google Drive, WhatsApp, basic admin tasks |
| **Role** | Volunteer or part-time church secretary; manages bulletin, liturgy, announcements |
| **Pain Points** | Spends significant time re-sending corrected files and managing confused member messages |

#### Goals

- Upload the weekly bulletin once and know that every member automatically gets the latest version.
- Replace a document that has a typo without sending a new message or link.
- Spend less time answering "which file do I open?" questions on Sunday morning.
- Share one permanent link per document category (e.g., one link for "Weekly Liturgy") to the WhatsApp group and never need to share a new one.

#### Key Admin Insight

> The admin does not need a complex CMS. They need three things: a dead-simple upload interface, the confidence that the link never changes, and a quick confirmation that the update went live.

---

## 3. Functional Requirements

All features are organized by user role and prioritized using MoSCoW (Must Have, Should Have, Could Have, Won't Have for this version).

---

### 3.1 Core Architecture: The Permanent-Link, Hot-Swap System

This is the single most important technical concept in ChurchShare. It must be understood before any other requirement.

#### How It Works

- Each document category (e.g., "Weekly Liturgy") is assigned a unique **Slot ID** by the admin upon creation (e.g., `slot-liturgy-sunday`).
- This Slot ID produces a permanent, shareable URL: `churchshare.app/view/slot-liturgy-sunday`
- When the admin uploads a new PDF to that slot, the backend replaces the file stored behind the slot ID.
- Any user who opens the permanent URL will always receive the most recently uploaded file — automatically, silently, without any notification or new link required.
- Old file versions are not stored on the server by default, eliminating version confusion at the source.

> 🔧 **Engineering Note:** Implement slots as database records linking a stable slug to a file storage pointer. File uploads overwrite the pointer, not the slug. A simple cache-bust header (`Cache-Control: no-store`) ensures browsers always fetch the current version rather than serving a cached older PDF.

---

### Admin: Document Slot Management

| Req ID | Requirement | Priority |
|---|---|---|
| FR-A01 | Admin can create a named document slot with a custom slug (e.g., `weekly-bulletin`) | **Must Have** |
| FR-A02 | Admin can upload a PDF to an existing slot, replacing the current file | **Must Have** |
| FR-A03 | Admin receives visual confirmation with the permanent link after upload | **Must Have** |
| FR-A04 | Admin can view upload timestamp of the currently active file | **Must Have** |
| FR-A05 | Admin can archive (deactivate) a slot, causing the URL to show a graceful "No content yet" message | Should Have |
| FR-A06 | Admin can preview the document in-browser after upload before it goes live | Should Have |
| FR-A07 | Admin can set an optional display title visible to viewers (e.g., "Sunday, 15 June 2025 — Morning Liturgy") | Should Have |
| FR-A08 | Admin receives a one-time QR code per slot for printing on physical bulletins | Could Have |
| **FR-A09** | **Admin can assign a category tag to each slot (e.g., Bulletin, Newsletter, Sermon Notes, Forms, Events, Announcements) for visual organization in the dashboard** | **Should Have** |
| **FR-A10** | **Admin can add an optional short description to each slot (visible in the dashboard card)** | **Should Have** |
| **FR-A11** | **Admin can set slot status to Active or Draft; Draft slots are not publicly accessible** | **Should Have** |
| **FR-A12** | **Dashboard displays aggregate summary statistics: Total Slots, Active Slots, Slots with Files, Total Views** | **Should Have** |
| **FR-A13** | **Admin can search and filter slots by name, category, and status from the dashboard** | **Should Have** |
| **FR-A14** | **Dashboard supports both grid view and list view for slot display** | **Could Have** |

---

### Viewer: Zero-Download PDF Viewing

| Req ID | Requirement | Priority |
|---|---|---|
| FR-V01 | Viewer opens a link in any mobile browser and PDF renders immediately in the browser viewport | **Must Have** |
| FR-V02 | No login, sign-up, app download, or account required to view | **Must Have** |
| FR-V03 | PDF is rendered via a web-based viewer (e.g., PDF.js) — file is never saved to device storage | **Must Have** |
| FR-V04 | Viewer can pinch-to-zoom and scroll through multi-page PDFs | **Must Have** |
| FR-V05 | Viewer sees a loading indicator while the PDF renders | **Must Have** |
| FR-V06 | If a slot has no PDF yet, viewer sees a friendly "Nothing here yet" message in large text | **Must Have** |
| FR-V07 | Page renders acceptably on screen widths from 320px to 768px (covers 95%+ of phones in use) | **Must Have** |
| FR-V08 | Viewer has access to a single large "Save to My Phone" button as an optional secondary action | Should Have |
| FR-V09 | Viewer can increase text size via pinch gesture or a large "A+" button | Should Have |
| FR-V10 | High-contrast mode toggle available for visually impaired users | Could Have |

---

### 3.2 Authentication & Access Control

- **FR-AC01:** Admin access is protected by email/password login.
- **FR-AC02:** Admin login must include a "Keep me logged in" option defaulted to ON, minimizing repeated authentication.
- **FR-AC03:** Viewer URLs are public by default. No authentication is required to view shared documents. Draft slots return a friendly unavailable message to public viewers.
- **FR-AC04:** Church-level account controls which slots exist. One church = one admin account (expandable in v2 with multi-user roles).

---

### 3.3 Notification System (Light-touch, WhatsApp-Compatible)

ChurchShare does not replace WhatsApp — it integrates with the existing workflow. The admin shares the permanent link to WhatsApp once, and thereafter never needs to resend it. The system's design *is* the notification.

- The admin dashboard provides a one-tap **"Copy Link"** button that copies the permanent URL to the clipboard.
- Optional: Admin can type a short announcement message in the dashboard; the system generates a pre-composed WhatsApp share text: *"This Sunday's bulletin is ready: [link]"*
- No push notification system is required for v1.0. The permanent link is the notification system.

---

## 4. User Experience (UX) Guidelines

> Every design decision must pass a single test: **Can Oma open the file and read it, alone, in under 30 seconds, without any help?** If the answer is no, the design must be revised.

---

### 4.1 Guiding Design Principles

| Principle | Definition |
|---|---|
| **Forgiveness over precision** | Every interactive element must be large enough that an accidental mis-tap does not trigger a destructive or confusing action. Minimum tap target size: 48×48 dp. |
| **Clarity over cleverness** | No icons without labels. No hamburger menus. No nested navigation. Every action must be described in plain language. |
| **One task per screen** | The viewer has one job: read the PDF. Do not clutter the viewer screen with social features, ads, banners, or unrelated actions. |
| **Progressive disclosure** | Advanced options (download, share, print) are available but secondary. The primary experience is tap-and-read. |
| **Low cognitive load** | Avoid choices. A user who opens a link should never have to make a decision. The PDF should appear automatically. |

---

### 4.2 Viewer Screen UX Specification

#### Typography
- Minimum body font size for UI elements: **18sp** (not px — must respect user's system font size setting).
- Document title displayed above the viewer in a minimum **20sp, bold, high-contrast** label.
- Document subtitle (e.g., date) displayed at **16sp** in a secondary color.

#### Color & Contrast
- Minimum contrast ratio: **4.5:1** for all body text (WCAG AA compliance).
- High-contrast mode (optional toggle): Pure black text on white background, **7:1** ratio (WCAG AAA).
- Avoid purely color-based status indicators. Always pair color with an icon or text label.

#### Viewer Navigation Flow

```
Step 1: User receives WhatsApp link → Taps link → Browser opens automatically.
Step 2: Viewer sees document title, optional subtitle, and PDF immediately below.
Step 3: User scrolls through PDF with native touch gestures. No tutorial needed.
Step 4 (optional): User taps large "Save to Phone" button only if desired.
```

#### Error & Edge State UX

| Scenario | What the User Sees | Design Notes |
|---|---|---|
| Slot has no PDF yet | Large centered icon + text: "Nothing uploaded here yet. Check back soon!" | Friendly, no technical jargon |
| Slot link is invalid | "This link doesn't exist. Please check the link you received." | Do not show a raw 404 page |
| PDF is loading slowly | Animated spinner with "Loading your document…" text. No timeout below 10 seconds. | Elderly users have slower connections; be patient |
| PDF fails to render | "Something went wrong. Tap here to try again." Large retry button. | Never show a technical error message |

---

### 4.3 Admin Dashboard UX Specification

The admin panel is designed for two audiences: the primary user (church volunteer managing weekly uploads) who needs frictionless task completion, and the secondary context (quick status overview on Sunday morning) which requires at-a-glance clarity. The interface is a modern, dense-but-scannable dashboard — not a simplified mobile-first form.

---

#### 4.3.1 Overall Layout

The dashboard uses a **two-panel layout**: a fixed left sidebar for navigation, and a main content area with a top header bar.

```
┌──────────────────────────────────────────────────────────────┐
│  SIDEBAR (fixed, dark)  │  HEADER BAR (top, light)          │
│  ─────────────────────  │  ─────────────────────────────    │
│  [Logo + Church Name]   │  [Breadcrumb]  [Bell] [Settings]  │
│  [Church Tagline]       │  ─────────────────────────────    │
│                         │  MAIN CONTENT AREA                │
│  NAVIGATION             │  [Page title + subtitle]          │
│  ● Dashboard            │  [+ New Slot button]              │
│    Create Slot          │                                   │
│    Upload Flow          │  [Summary Stats Row]              │
│    Success              │                                   │
│                         │  [Search] [Filter] [View Toggle]  │
│  UPCOMING               │                                   │
│  ✦ Smart Insights [Soon]│  [Slot Card Grid]                 │
│                         │                                   │
│  ─────────────────────  │                                   │
│  [User Avatar + Name]   │                                   │
│  [Admin role label]     │                                   │
│  [Logout icon]          │                                   │
└──────────────────────────────────────────────────────────────┘
```

---

#### 4.3.2 Sidebar Navigation

**Visual design:** Dark background (near-black), white text and icons, red accent color for active states and branding elements.

**Church identity block (top):** Displays a red square logo/avatar, the church name in bold white, and a small descriptor label (e.g., "Doc Manager"). This anchors the admin's context — especially important for multi-church deployments in future versions.

**Navigation sections:**

The sidebar is organized into named sections separated by subtle section labels:

*NAVIGATION section* contains the primary task flows in logical order:
- **Dashboard** — the slot overview (default landing page). Active state uses a red filled background with a right-side indicator bar.
- **Create Slot** — leads to the slot creation form.
- **Upload Flow** — leads directly to the file upload interface for an existing slot.
- **Success** — a confirmation/receipt screen accessible for review.

*UPCOMING section* contains roadmap features that are visible but not yet active. These items display a "Soon" badge in a muted accent color (e.g., amber/gold) to communicate future availability without creating confusion about whether they are broken.
- **Smart Insights** — future analytics feature.

**User block (bottom):** Pinned to the bottom of the sidebar. Displays the admin's avatar initials, full name (truncated if needed), role label ("Administrator"), and a logout/exit icon. This should never overlap with navigation items regardless of sidebar height.

**Active state:** The active nav item has a filled red background, slightly rounded corners, and a brighter text weight. All inactive items are white with reduced opacity on hover.

---

#### 4.3.3 Header Bar

The top header bar spans the full width of the main content area (excluding the sidebar).

**Left:** Breadcrumb navigation showing the current section context (e.g., "Grace Community Church" when on the dashboard). Uses a document/building icon prefix.

**Right:** Notification bell icon (with badge capability for future use) and a settings/gear icon. Both are icon-only, but sized at minimum 40×40px tap target. These are secondary controls and must not dominate the header visually.

**No page title in the header** — the page title lives in the main content area below the header.

---

#### 4.3.4 Summary Statistics Row

Immediately below the page title and subtitle, display a horizontal row of **four summary stat cards**. These give the admin an instant status snapshot without requiring them to read individual slot cards.

| Card | Label | Value | Icon |
|---|---|---|---|
| 1 | Total Slots | Count of all slots | Document icon |
| 2 | Active Slots | Count of slots with Active status | Green checkmark circle |
| 3 | With Files | Count of slots that have a PDF uploaded | Upload/file icon |
| 4 | Total Views | Cumulative viewer opens across all slots | Trending arrow icon |

**Card design:** White background, light border, no colored accent. The metric value is displayed in a large bold number (28–32px). The label is displayed above the number in small secondary text. The icon is displayed in the top-right corner of the card in a muted accent color matching its semantic meaning (green for active, blue-teal for views, etc.).

**Stat cards are read-only.** They are not clickable filters in v1.0, though they may become so in a later version.

---

#### 4.3.5 Slot Toolbar (Search, Filter, View Toggle)

Between the stats row and the slot grid, a toolbar row provides three controls:

**Search input (left, wide):** A text input with a magnifying glass icon placeholder labeled "Search slots…". Searches across slot name, description, and category tag in real time. The input should be wide enough to be usable without expanding — approximately 50% of the available width.

**Category filter dropdown (center):** A dropdown labeled "All" by default. Filters the grid to show only slots of a selected category (e.g., Bulletin, Newsletter, Sermon Notes). The dropdown shows the category color indicator alongside each option name.

**Status filter dropdown (center-right):** A dropdown labeled "All Status" by default. Filters to Active, Draft, or Archived slots.

**View toggle (right):** Two icon buttons — a grid icon and a list icon — toggle between grid view (default) and list view. The active view icon appears filled/highlighted.

**Results count:** Below the toolbar, a small secondary text label shows the current result count, e.g., "Showing 6 of 6 slots." This updates live with search and filter results.

---

#### 4.3.6 Slot Card Design (Grid View)

Slots are displayed in a **3-column responsive card grid**. Each card represents one document slot and contains the following elements from top to bottom:

**Status accent border (top edge):** A 3–4px colored top border on the card indicates the slot's status at a glance — green for Active, amber/orange for Draft. This provides immediate visual differentiation without relying solely on the text badge.

**Card header row:** Displays a left-aligned document type icon (PDF icon in a soft tinted background circle), the slot title in bold, and a three-dot overflow menu icon (⋯) on the far right. The title is the admin-defined display name (e.g., "Weekly Bulletin"). Below the title, a truncated description line in secondary gray text provides context (e.g., "Sunday service order of worship and announ…").

**Tag row:** A horizontal row of small pill-shaped tags. Each slot shows:
- **Category tag** — color-coded by category (e.g., green for Bulletin, blue for Newsletter, purple for Sermon Notes, teal for Forms, orange for Events). The color is unique per category and consistent across all cards.
- **Status badge** — "Active" in green with a dot prefix, or "Draft" in amber/orange with a clock/warning icon.
- **PDF Ready badge** — displayed only when a file exists. Uses a neutral color (dark gray or similar) to distinguish it from the status badge. Hidden when no file is uploaded.

**File information row:** When a file is uploaded, displays the filename, file size, and last updated date in small secondary text. A view count (eye icon + number) is right-aligned on the same row. Example: `KIA Galvinsky.pdf · 0.1 MB · Updated Feb 26 ◎ 245`.

**Empty state banner:** When no file has been uploaded to the slot, replaces the file information row with an amber/orange tinted banner containing a warning circle icon and the text "No file uploaded yet." This uses a warm, non-alarming color — not red — to signal that the slot exists and is ready, but has no content yet.

**Permanent link row:** Displays the slot's permanent URL in a monospace or code-styled text box with reduced opacity. A copy icon (two overlapping squares) on the right copies the link to clipboard on tap. The URL is truncated if too long but the full URL is copied.

**Action row (bottom):** Contains the primary and secondary actions for the slot:
- **Primary: "Replace PDF" button** — full-width red button with an upload icon prefix. This is the most important action and dominates the bottom of the card visually. Tapping it opens the device file picker directly.
- **Secondary: Preview icon button** — a small square icon button (external link / preview icon) placed to the right of the primary button. This opens the viewer in a new tab.

---

#### 4.3.7 Empty Slot State (No File Uploaded)

When a slot exists but has no PDF:
- The status accent border uses amber/orange instead of green.
- The tag row shows only the Category tag and a "Draft" or partial status badge — no "PDF Ready" badge.
- The file information row is replaced by the amber empty state banner described above.
- The primary action button label changes to **"Upload PDF"** (instead of "Replace PDF") to match the first-time context.
- The view count is hidden (no views to report yet).

---

#### 4.3.8 Three-Dot Overflow Menu

Each slot card has a three-dot menu (⋯) in the card header. This provides access to secondary actions that should not clutter the card surface:

- Rename slot
- Archive slot
- Copy link
- Download QR code *(v1.1 roadmap — greyed out in v1.0)*
- Delete slot *(requires confirmation dialog)*

Destructive actions (Delete) must always show a confirmation dialog with plain-language consequences before executing.

---

#### 4.3.9 "+ New Slot" Button

A prominent red button labeled "+ New Slot" is pinned to the top-right of the main content area, adjacent to the page title. It is always visible on the dashboard regardless of scroll position (sticky positioning). Tapping it opens the slot creation flow.

---

#### 4.3.10 Category Tag System

Category tags provide visual organization across the slot grid. The system supports the following default categories, each with a distinct pill color:

| Category | Suggested Color | Use Case |
|---|---|---|
| Bulletin | Green | Weekly service bulletin |
| Newsletter | Blue | Community newsletters |
| Sermon Notes | Purple | Study guides and sermon materials |
| Forms | Teal | Applications, registrations |
| Events | Orange | Event programs and schedules |
| Announcements | Olive/Green | General notices |

Category colors must meet 4.5:1 contrast ratio against the tag background. The tag background is a light tint of the category color; the text is a dark shade of the same color (not pure white or black, to maintain the color family).

Admins can select a category from a predefined list when creating or editing a slot. Custom categories are a Could Have for v1.1.

---

#### 4.3.11 Upload Flow (from "Replace PDF" Button)

1. Admin taps "Replace PDF" (or "Upload PDF" for a new slot).
2. Device native file picker opens immediately — no intermediate confirmation screen.
3. Admin selects a PDF file.
4. Client-side validation runs before any upload begins: file must be `application/pdf` type and under 20 MB. Violations show an inline error banner on the slot card — not a page-level modal.
5. Upload begins. The slot card shows a **progress bar replacing the action button**, with a percentage complete indicator. Other cards remain usable during upload.
6. On success, the interface transitions to the **Success screen** (see Section 4.3.12).
7. On failure, the slot card shows a plain-language error banner: "The file couldn't be uploaded. Tap to try again." The slot continues to show the previously uploaded file.

---

#### 4.3.12 Success Screen

After a successful upload, the admin is taken to a dedicated success screen:

- Large green checkmark or success illustration (not full-screen modal — a distinct view within the same layout)
- Slot name and "File Updated!" confirmation headline
- Permanent viewer URL in a styled code block
- **"Copy Link"** button — primary action, red
- **"Share via WhatsApp"** button — secondary action, opens a pre-composed WhatsApp share message:
  > *"📖 [Slot Name] is ready! Tap the link below to read it — no download needed: [URL] (This link always shows the latest version 🙏)"*
- **"Back to Dashboard"** link to return to the slot grid

---

#### 4.3.13 Roadmap Indicator in Navigation

Features on the product roadmap that are not yet live must be visibly present in the sidebar navigation, marked with a "Soon" badge. This communicates product vision to admins and manages expectations without implying the features are broken or inaccessible. "Soon" items are non-interactive — they do not navigate to an empty page.

---

## 5. Success Metrics

Success metrics for ChurchShare are deliberately human-centered. The product does not optimize for time-on-platform or engagement — it optimizes for **access reliability and ease of use** for elderly users.

---

### 5.1 Primary Metrics *(Reviewed Monthly)*

| Metric | Definition | Target at 90 Days |
|---|---|---|
| **View-to-Download Ratio** | % of unique opens where the user did NOT tap "Save to Phone" (proxy for successful zero-download adoption) | 80%+ views with no download action |
| **View Success Rate** | % of link opens that result in a fully rendered PDF (no error state) | > 95% |
| **Repeat Open Rate** | % of unique phone fingerprints (no login) that open any slot more than once per week | > 50% of active viewers |
| **Admin Upload Completion Rate** | % of admin upload sessions completed without abandonment | > 98% |
| **Time to First PDF Render** | Median time from link tap to PDF page 1 visible on screen | < 3 seconds on 4G |

---

### 5.2 Secondary Metrics *(Reviewed Quarterly)*

| Metric | Definition | Notes |
|---|---|---|
| **Admin Re-upload Frequency** | Number of times per week an admin updates a given slot | A high number suggests document prep issues, not app issues |
| **Error Rate per 1,000 Opens** | Count of users who saw any error state per 1,000 link opens | Target: < 5 per 1,000 |
| **WhatsApp Click-Through Rate** | Inferred via weekly active viewer count growth | Qualitative validation from admin interviews |
| **Admin Support Ticket Volume** | Number of admin "how do I use this?" inquiries per month | Target: < 1 per 10 churches onboarded |

---

### 5.3 Anti-Metrics *(What We Deliberately Do Not Track)*

The following metrics are consciously excluded from our optimization targets, because optimizing for them would corrupt the product's mission:

- **Time Spent in App** — Maximizing session duration is a dark pattern for a utility app. Users should find what they need and leave.
- **Downloads per User** — We actively want this number to be low. High downloads indicate the zero-download model is failing.
- **Return Visits per Day** — Church materials are weekly. Daily return optimization would lead to spam.

---

### 5.4 Qualitative Validation

Alongside quantitative metrics, ChurchShare must conduct quarterly interviews with a minimum of **5 elderly users** and **2 church admins** per cohort. Specific questions to ask include:

- *"Did you open the Sunday bulletin this week? How did you do it?"*
- *"Did you ever get confused about which file to open?"*
- *"Did your phone ever say it didn't have enough space?"*
- *(For admins) "How many messages did you receive asking about which file to use?"*

> ⚠️ **Qualitative signal is the ground truth for this product.** If Oma says she was confused, a metric that says 95% success rate is wrong — not Oma.

---

## 6. Future Roadmap

The following features are explicitly out of scope for v1.0 but represent a coherent evolution of ChurchShare as adoption grows within and beyond the initial congregation.

---

### Version 1.1 — QR Code Integration *(Physical-Digital Bridge)*

QR codes represent the most natural bridge between the physical church bulletin and digital access. In many elderly communities, a printed bulletin handed at the door is still the primary touchpoint.

**Proposed Feature:**
- Each document slot automatically generates a unique, printable QR code.
- The admin can download a print-ready QR code image (300 DPI, PNG) from the dashboard.
- This QR code is printed on the physical bulletin or displayed on a church screen.
- When a congregant scans it with their phone camera (no app required), it opens directly to the PDF viewer in their browser.
- Because the QR code encodes the permanent slot URL, it **never needs to be reprinted** when the file is updated.

**Expected Impact:** This feature eliminates the need for WhatsApp distribution entirely for tech-reluctant elderly users. It also removes the last remaining step where user error is possible (mistyping or mis-tapping a link).

---

### Version 1.1 — Smart Insights *(Admin Analytics Dashboard)*

Visible as a "Soon" item in the sidebar navigation from day one, this feature surfaces meaningful usage data to admins:

- Per-slot view counts over time (daily, weekly trend)
- Most-viewed slots in the past 7 days
- Upload history with timestamps per slot
- Simple charts — not complex analytics; accessible to non-technical admins

---

### Version 1.2 — Multi-Admin & Role-Based Access

- Allow one church to have multiple admin accounts with different permissions (e.g., "Liturgy Manager" can only update liturgy slots; "Bulletin Editor" can only update the bulletin slot).
- Add an audit log: *"File updated by [Admin Name] on [Date] at [Time]"* — visible to super-admins only.

---

### Version 1.3 — Scheduled Slot Publishing

- Admin uploads the Sunday liturgy on Thursday and sets a publish date/time: "Go live Saturday 8 PM."
- Before that time, viewers see a *"This week's bulletin will be available Saturday evening"* message.
- This decouples the admin's work schedule from Sunday morning pressure.

---

### Version 2.0 — Multi-Church Network

- Allow a diocese, denomination, or church network to manage centralized document templates that are pushed to member churches.
- Individual church admins can localize (customize) centrally-pushed documents.
- This is a significant architectural expansion and is considered a separate product line.

---

### Version 2.1 — Audio Companion *(Experimental)*

For deeply visually impaired elderly users, PDF reading is still a barrier. This exploratory feature would provide:

- Admin records or uploads a short audio message alongside a PDF slot (e.g., "This week's announcements read aloud").
- Viewer sees a large **"Play Announcements"** button alongside the PDF.
- This does not replace the visual PDF but provides an auditory alternative.

---

## Appendix A: Glossary

| Term | Definition |
|---|---|
| **Document Slot** | A named placeholder in the system that holds one active PDF at a time. It has a permanent URL that never changes. |
| **Hot-Swap** | The action of replacing the PDF file behind a slot URL without changing the URL itself. |
| **Zero-Download Viewing** | The act of reading a PDF in a web browser without saving any file to the device's local storage. |
| **Permanent Link / Slug** | A URL that is stable and persistent. E.g., `churchshare.app/view/sunday-liturgy` |
| **PDF.js** | Mozilla's open-source JavaScript library for rendering PDF files natively in web browsers, used as the core rendering engine. |
| **MoSCoW Prioritization** | A project management framework: Must Have, Should Have, Could Have, Won't Have (for this version). |
| **WCAG AA / AAA** | Web Content Accessibility Guidelines standards for contrast ratios and accessibility compliance. |
| **Viewer** | A congregation member who accesses a document slot via its URL. No account or login is required. |
| **Admin** | A church staff member or volunteer with login access to manage document slots. |
| **Category Tag** | A color-coded label assigned to a slot to indicate its document type (e.g., Bulletin, Newsletter, Sermon Notes). |
| **Status Badge** | A visual indicator on a slot card showing whether the slot is Active, Draft, or Archived. |
| **Draft Status** | A slot state where the slot exists but is not publicly accessible. Used for work-in-progress or scheduled content. |
| **Summary Stats** | The four aggregate metrics displayed at the top of the dashboard: Total Slots, Active Slots, With Files, Total Views. |
| **Smart Insights** | A planned v1.1 analytics feature visible as a "Soon" item in the admin sidebar. |

---

*End of Document — ChurchShare PRD v1.1*
