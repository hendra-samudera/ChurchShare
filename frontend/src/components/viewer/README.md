# ChurchShare PDF Viewer Components

Accessibility-first PDF viewer components designed for elderly church congregation members (ages 50–70+).

## Core Principle: Zero-Download Viewing

PDFs render directly in the mobile browser using PDF.js — **no file is ever saved to the user's device storage** unless they explicitly tap "Save to My Phone." This solves the #1 pain point of elderly users with full phone storage.

## Components

### PdfViewer (`PdfViewer.jsx`)
Main PDF rendering component with PDF.js integration.

**Features:**
- Progressive rendering (page 1 first, then remaining pages)
- Virtual scrolling with Intersection Observer for lazy loading
- Pinch-to-zoom via touch events
- High-DPI scaling for crisp rendering
- Cache-bust headers to always fetch latest version

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `pdfUrl` | string | Yes | URL to fetch the PDF file |
| `documentTitle` | string | No | Title displayed above viewer |
| `onDownload` | function | No | Handler for explicit download |
| `showDownload` | boolean | No | Show download button (default: true) |

### ViewerControls (`ViewerControls.jsx`)
Large, touch-friendly navigation and zoom controls.

**Features:**
- Previous/Next page navigation
- Zoom In/Out/Reset buttons
- Quick jump buttons for long documents (-5/+5 pages)
- Minimum 48x48px tap targets

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `currentPage` | number | Yes | Current page (1-indexed) |
| `totalPages` | number | Yes | Total pages in document |
| `scale` | number | Yes | Current zoom scale |
| `onPrevious` | function | Yes | Previous page handler |
| `onNext` | function | Yes | Next page handler |
| `onZoomIn` | function | Yes | Zoom in handler |
| `onZoomOut` | function | Yes | Zoom out handler |
| `onResetZoom` | function | Yes | Reset zoom handler |
| `canPrevious` | boolean | No | Can navigate previous |
| `canNext` | boolean | No | Can navigate next |

### PageIndicator (`PageIndicator.jsx`)
Clear, large page counter showing "Page X of Y".

**Features:**
- 20sp+ font sizes
- High contrast colors
- aria-live for screen readers

**Variants:**
- `PageIndicator` - Full "Page X of Y" format
- `CompactPageIndicator` - Simplified "X / Y" format
- `ProgressBarIndicator` - Visual progress bar

## Accessibility Standards

All components meet these requirements:

| Requirement | Implementation |
|-------------|----------------|
| Minimum tap target | 48×48 dp (56px for primary actions) |
| Minimum font size | 18sp (respecting system settings) |
| Document title | 20sp, bold, high-contrast |
| Contrast ratio | 4.5:1 minimum (WCAG AA), 7:1 for high-contrast mode |
| Zoom assist | Large "A+" style zoom buttons |
| Download button | Secondary action, not primary CTA |

## Error States

| Situation | User Message |
|-----------|--------------|
| No PDF uploaded | "Nothing uploaded here yet. Check back soon! 🙏" |
| Invalid link | "This link doesn't exist. Please check the link you received." |
| PDF fails to render | "Something went wrong. [Tap here to try again]" |
| Slow load (>5s) | Keep spinner running; never timeout under 10 seconds |

## Mobile Browser Support

Tested and optimized for:
- Chrome for Android (v90+)
- Safari iOS (v14+)
- Samsung Internet (v15+)

Target screen widths: **320px to 768px** (covers 95%+ of phones)

## Performance Targets

| Metric | Target |
|--------|--------|
| Time to first page visible | < 3 seconds on 4G |
| PDF.js worker load | From CDN (no bundle bloat) |
| Initial render | Page 1 only, lazy load rest |

## Usage Example

```jsx
import { PdfViewer } from './components/viewer';

function MyPage() {
  const handleDownload = async () => {
    // Only called when user explicitly taps download
    const response = await fetch('/api/file.pdf');
    const blob = await response.blob();
    // Trigger download...
  };

  return (
    <PdfViewer
      pdfUrl="/api/slots/welcome/file"
      documentTitle="Sunday Bulletin"
      onDownload={handleDownload}
      showDownload={true}
    />
  );
}
```

## PDF.js Configuration

The worker is loaded from CDN for optimal compatibility:

```javascript
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = 
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
```

## File Structure

```
src/components/viewer/
├── index.js              # Component exports
├── PdfViewer.jsx         # Main PDF renderer
├── PdfViewer.css         # Viewer styles
├── ViewerControls.jsx    # Navigation/zoom controls
├── ViewerControls.css    # Control styles
├── PageIndicator.jsx     # Page counter
└── PageIndicator.css     # Indicator styles
```

## Testing Checklist

- [ ] Works on 320px width (small phones)
- [ ] Pinch-to-zoom works on touch devices
- [ ] Native browser zoom is NOT disabled
- [ ] Loading spinner shows "Loading your document…"
- [ ] Empty state shows friendly message
- [ ] Error state has large retry button
- [ ] Download only happens on explicit tap
- [ ] All tap targets are 48x48px minimum
- [ ] Contrast ratio passes 4.5:1
- [ ] Screen reader announces page changes
