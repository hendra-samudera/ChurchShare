# ChurchShare Test Suite

Comprehensive test coverage for ChurchShare - ensuring reliability, accessibility, and correctness for elderly users.

## Testing Philosophy

> A failure in ChurchShare is not just a bug — it is an elderly person arriving at church unable to follow the liturgy because the app showed them an error they don't understand.

### Testing Priorities (Highest to Lowest)

1. **Hot-swap correctness** — the right PDF must always be served at the permanent URL
2. **Viewer rendering reliability** — PDF must always load or fail gracefully
3. **Zero-download guarantee** — no file must ever be silently saved to device storage
4. **Upload atomicity** — a failed upload must never corrupt the live slot
5. **Accessibility compliance** — tap targets, contrast, font sizes
6. **Admin session management** — login persistence, token expiry

---

## Backend Tests (Java/JUnit/Mockito)

### Location
`backend/src/test/java/com/churchshare/`

### Test Files

| File | Description |
|------|-------------|
| `service/SlotServiceTest.java` | Slot CRUD, hot-swap, validation, archive |
| `service/JwtServiceTest.java` | Token generation, validation, expiration |
| `service/R2StorageServiceTest.java` | File upload, delete, presigned URLs |
| `controller/SlotControllerTest.java` | Admin API endpoints |
| `controller/ViewerControllerTest.java` | Public viewer endpoints, cache headers |
| `integration/SlotIntegrationTest.java` | Full flow with Testcontainers PostgreSQL |

### Running Backend Tests

```bash
# Run all tests
cd backend
./mvnw test

# Run specific test class
./mvnw test -Dtest=SlotServiceTest

# Run with coverage
./mvnw test jacoco:report

# Run integration tests only
./mvnw test -Dtest=SlotIntegrationTest
```

### Test Dependencies

The following dependencies are required in `pom.xml`:

```xml
<!-- Testing -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>testcontainers</artifactId>
    <version>1.19.3</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <version>1.19.3</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>1.19.3</version>
    <scope>test</scope>
</dependency>
```

---

## Frontend Tests (React Testing Library/Jest)

### Location
`frontend/src/**/*.test.jsx`

### Test Files

| File | Description |
|------|-------------|
| `components/common/Button.test.jsx` | Button rendering, click, disabled, loading states |
| `components/viewer/ViewerControls.test.jsx` | Navigation, zoom, accessibility |
| `pages/admin/LoginPage.test.jsx` | Login form, validation, "Keep me logged in" |
| `components/admin/SlotCard.test.jsx` | Slot display, menu actions, archive |

### Running Frontend Tests

```bash
# Run all tests (watch mode)
cd frontend
npm test

# Run tests once
npm test -- --watchAll=false

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- Button.test.jsx

# Run tests matching pattern
npm test -- --testNamePattern="loading state"
```

### Test Dependencies

Install testing dependencies:

```bash
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @playwright/test \
  @axe-core/playwright \
  eslint-plugin-testing-library \
  eslint-plugin-jest
```

---

## E2E Tests (Playwright)

### Location
`frontend/e2e/`

### Test Files

| File | Description |
|------|-------------|
| `viewer.spec.js` | Full viewer experience, zoom, navigation, empty state |

### Running E2E Tests

```bash
# Run all E2E tests
cd frontend
npm run e2e

# Run in headed mode (see browser)
npm run e2e:headed

# Run with UI mode
npm run e2e:ui

# Run on mobile devices only
npm run e2e:mobile

# Run specific test
npm run e2e -- --grep "zoom"

# Generate HTML report
npm run e2e:report
```

### E2E Test Scenarios

1. **PDF Rendering**
   - User opens viewer link → PDF renders
   - Loading spinner appears before PDF renders
   - Multi-page PDF shows page indicator

2. **Zoom Functionality**
   - User can zoom in/out
   - Zoom buttons disabled at boundaries
   - Zoom percentage displayed correctly

3. **Page Navigation**
   - User can navigate previous/next
   - Buttons disabled at boundaries
   - Quick jump for long documents

4. **Empty State**
   - Empty slot shows friendly message (not 404)
   - Returns 200 status, not 404
   - No technical language

5. **Zero-Download Guarantee**
   - PDF served inline, not as download
   - Save button is secondary action
   - No download prompt on page load

6. **Accessibility**
   - All interactive elements have accessible names
   - Tap targets meet 48x48dp minimum
   - Focus indicators visible
   - Color contrast meets WCAG AA

---

## Critical Test Scenarios

### Slot & Hot-Swap Tests

```javascript
// Must test: viewer always gets the latest file after a hot-swap
test('viewer receives new PDF immediately after admin hot-swap', async () => {
  // 1. Create slot with PDF v1
  // 2. Fetch /api/slots/:slug/file → assert it serves v1
  // 3. Admin uploads PDF v2 (hot-swap)
  // 4. Fetch /api/slots/:slug/file again → assert it serves v2, NOT v1
  // 5. Assert v1 file no longer exists in storage
});
```

### Cache-Busting Tests

```javascript
// Must verify no caching occurs on PDF serve endpoint
test('PDF serve endpoint has correct no-cache headers', async () => {
  const res = await fetch('/api/slots/sunday-liturgy/file');
  expect(res.headers.get('Cache-Control')).toContain('no-store');
  expect(res.headers.get('Cache-Control')).toContain('must-revalidate');
});
```

### Zero-Download Guarantee Tests

```javascript
// Verify PDF is served inline, not as an attachment
test('PDF is served as inline, not as a download attachment', async () => {
  const res = await fetch('/api/slots/:slug/file');
  const disposition = res.headers.get('Content-Disposition');
  expect(disposition).toMatch(/^inline/);
});
```

### Accessibility Tests

```javascript
// Run axe-core accessibility audit on all screens
test('viewer screen passes WCAG AA accessibility audit', async () => {
  await page.goto('/view/sunday-liturgy');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

---

## Success Metrics Test Coverage

| PRD Metric | Test Coverage |
|------------|---------------|
| View Success Rate > 95% | All PDF render success/fail paths tested |
| Time to First Render < 3s | Performance test in E2E suite |
| Admin Upload Completion > 98% | Happy path + all error recovery flows |
| Zero-Download: 80%+ no download | Verify no auto-download; "Save" is secondary |
| Error Rate < 5/1,000 | All edge cases return graceful responses |

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Run backend tests
        run: cd backend && ./mvnw test

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Run frontend tests
        run: cd frontend && npm run test:ci

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Install Playwright
        run: cd frontend && npx playwright install --with-deps
      - name: Run E2E tests
        run: cd frontend && npm run e2e
```

---

## Test Naming Convention

Test names should describe the user scenario, not the technical implementation:

✅ **Good:**
- `shouldCreateSlotWithValidSlug`
- `shouldShowFriendlyMessageForEmptySlot`
- `shouldDisablePreviousButtonOnFirstPage`

❌ **Bad:**
- `testCreateSlot`
- `testEmptySlot`
- `testButtonDisabled`

---

## Coverage Requirements

### Backend
- **Lines:** 80%
- **Branches:** 70%
- **Methods:** 80%

### Frontend
- **Lines:** 70%
- **Branches:** 70%
- **Functions:** 70%

### E2E
- All critical user journeys covered
- All accessibility requirements tested
- All error states tested

---

## Troubleshooting

### Testcontainers Issues

If integration tests fail with Docker errors:

```bash
# Ensure Docker is running
docker ps

# Check Testcontainers can access Docker
docker run --rm hello-world
```

### Frontend Test Issues

If tests fail with module errors:

```bash
# Clear cache
npm test -- --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### E2E Test Issues

If Playwright tests fail:

```bash
# Install browser binaries
npx playwright install

# Install system dependencies (Linux)
npx playwright install-deps
```

---

## Contact

For questions about the test suite, contact the ChurchShare development team.
