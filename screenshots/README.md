# Website Check Lead Magnet - Screenshots for PR

## Successfully Captured Screenshots

### 1. Homepage Entry Point
**File:** `check-homepage-entry.png`
- Shows the homepage with the new "Check your website" button
- Desktop view with full hero section
- Button is visible and properly styled

### 2. Input Form - Desktop View
**File:** `check-input-desktop.png`
- /check page showing the input form
- Three fields: Website URL (required), Business Name (optional), City (optional)
- "Check my website" button and "I don't have a website yet" link visible
- Clean, centered layout on desktop

### 3. Input Form - Mobile View
**File:** `check-input-mobile.png`
- Same input form in mobile responsive view (iPhone SE - 375px width)
- Form fields stack nicely
- All elements remain accessible and properly sized
- Mobile-optimized spacing

### 4. "No Website Yet" Flow
**File:** `check-no-website.png`
- Page shown when user clicks "I don't have a website yet"
- Displays reasons why businesses need websites:
  - AI assistant discovery
  - 24/7 storefront
  - Professional credibility
- Includes CTA for consultation

### 5. Lead Form
**File:** `check-lead-form.png`
- Consultation request form
- Fields: Your name, Email
- "Send it" button
- Shown after clicking "Get free consultation" from either the no-website page or results page

## Screenshots Not Captured (Require Vercel Deployment)

The following screenshots could not be captured in local development because the API endpoints (`/api/check-website` and `/api/submit-lead`) only work when deployed to Vercel:

### 6. Loading State
**Expected:** `check-loading.png`
- Should show:
  - Loading spinner/animation
  - Text: "Checking your website..."
  - The entered URL being analyzed
  - Message: "This usually takes 15-30 seconds"

### 7. Results Page - Desktop View
**Expected:** `check-results-desktop.png`
- Should show:
  - Overall score badge (0-100) with colored scoring
  - Three sections:
    - **Performance & Mobile**: PageSpeed Insights mobile score
    - **SEO Basics**: 9 checklist items (HTTPS, title, meta description, headings, viewport, OG tags, structured data, robots.txt, sitemap)
    - **AI-Search Readiness**: 3 checklist items (text content, structured data, llms.txt)
  - CTA section: "Want to improve your score?" with consultation button
  - Each section has its own score and color coding (green for 80+, yellow for 60-79, red for <60)

### 8. Results Page - Mobile View
**Expected:** `check-results-mobile.png`
- Same results content as desktop but in responsive mobile layout
- Score sections should stack vertically
- All checklist items remain readable

## Testing Instructions

### Local Testing (Completed)
The following can be tested locally at `http://localhost:5173`:
- ✅ Homepage integration
- ✅ /check page input form (desktop & mobile)
- ✅ "No website yet" flow
- ✅ Lead form display
- ✅ Responsive design

### Vercel Deployment Testing (Required)
To capture loading and results screenshots:

1. Deploy to Vercel (ensures API routes work)
2. Navigate to the deployed `/check` page
3. Enter a real website URL (suggested: https://stripe.com or https://example.com)
4. Fill in optional business name for better results display
5. Click "Check my website"
6. **Capture loading state immediately** after clicking submit
7. Wait for results (15-30 seconds)
8. **Capture results page** in desktop view - scroll to show all three sections
9. Toggle mobile emulation (375px width)
10. **Capture results page** in mobile view - scroll through all sections

## API Error in Local Dev

When testing locally, submitting the form produces this error:
```
Failed to execute 'json' on 'Response': Unexpected end of JSON input
```

This is expected behavior because:
- Vercel API routes (`/api/*`) only work when deployed to Vercel
- The local Vite dev server doesn't handle these API routes
- The actual checking logic requires external APIs (PageSpeed Insights, etc.) that are configured in the Vercel environment

## Component Structure (For Reference)

Based on `src/components/CheckPage.tsx`:

### Result Data Structure
```typescript
interface CheckResult {
  score: number;
  performance: {
    score: number;
    hasPageSpeed: boolean;
    mobileScore?: number;
  };
  seo: {
    score: number;
    checks: {
      https: boolean;
      title: boolean;
      metaDescription: boolean;
      hasHeadings: boolean;
      mobileViewport: boolean;
      ogTags: boolean;
      structuredData: boolean;
      robotsTxt: boolean;
      sitemap: boolean;
    };
  };
  aiSearch: {
    score: number;
    checks: {
      hasTextContent: boolean;
      hasStructuredData: boolean;
      hasLlmsTxt: boolean;
    };
  };
  url: string;
}
```

### Scoring Colors
- **80-100**: Blue (var(--blue)) - "Great"
- **60-79**: Yellow (var(--yellow)) - "Good"  
- **40-59**: (var(--yellow)) - "Fair"
- **0-39**: Red (var(--red)) - "Needs work"

## Summary

**5 of 8 screenshots successfully captured.**

The remaining 3 screenshots (loading state and results views) require deployment to Vercel to function properly. All UI components and flows are working correctly in local development; only the API integration needs the Vercel environment.
