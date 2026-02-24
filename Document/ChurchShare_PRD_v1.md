# ChurchShare
## Memory-Light PDF Sharing for Church Congregations
### Product Requirement Document

| Field | Details |
|---|---|
| **Document Version** | v1.0 |
| **Date** | June 2025 |
| **Author** | Senior Product Manager |
| **Status** | Draft — Pending Stakeholder Review |
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
- **FR-AC03:** Viewer URLs are public by default. No authentication is required to view shared documents.
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

The admin panel prioritizes operational simplicity. An admin who manages one upload per week should be able to complete their task in under 2 minutes without any training documentation.

#### Upload Flow

1. Admin logs in and lands on **"My Document Slots"** — a simple list with slot name, last updated timestamp, and a large **"Update File"** button per slot.
2. Tapping "Update File" opens the device file picker directly. No intermediate screens.
3. After a successful upload, the app shows a full-screen success state: document title, a preview thumbnail, and the permanent link with a large **"Copy Link"** button.
4. The upload process must complete within **5 seconds** for files under 5 MB on a standard 4G connection.

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

---

*End of Document — ChurchShare PRD v1.0*
