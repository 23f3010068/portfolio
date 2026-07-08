# Deployment Guide — THE SIGNAL

This guide covers deploying THE SIGNAL to production on Vercel, Netlify, or Cloudflare Pages.

---

## Pre-Deployment Checklist

### 1. Environment Variables

Create a `.env.local` file (not committed to git):

```env
# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id

# Optional: Contact form backend
CONTACT_API_ENDPOINT=https://your-api.com/contact

# Optional: Error tracking
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### 2. Build Test

Run a production build locally to verify everything works:

```bash
npm run build
npm start
```

Open http://localhost:3000 and test:
- [ ] All 9 dimensions load correctly
- [ ] Route transitions work smoothly
- [ ] Particle system renders on all hardware tiers
- [ ] Audio toggle works
- [ ] Neural mode requests camera permission
- [ ] Contact form validation works
- [ ] Keyboard navigation works
- [ ] Screen reader announces dimension changes

### 3. Performance Audit

Run Lighthouse audit:

```bash
npm install -g lighthouse
lighthouse http://localhost:3000 --view
```

Target scores:
- **Performance:** 90+
- **Accessibility:** 90+
- **Best Practices:** 90+
- **SEO:** 90+

---

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the recommended platform for Next.js deployments.

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login

```bash
vercel login
```

#### Step 3: Deploy

```bash
# From the-signal directory
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Your account
- **Link to existing project?** No
- **Project name:** the-signal
- **Directory:** ./
- **Override settings?** No

#### Step 4: Set Environment Variables

```bash
vercel env add NEXT_PUBLIC_ANALYTICS_ID
vercel env add CONTACT_API_ENDPOINT
```

#### Step 5: Deploy to Production

```bash
vercel --prod
```

Your site will be live at `https://the-signal.vercel.app` (or your custom domain).

#### Custom Domain Setup

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., `yashovardhan.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning (automatic)

---

### Option 2: Netlify

#### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### Step 2: Login

```bash
netlify login
```

#### Step 3: Initialize

```bash
netlify init
```

Follow the prompts:
- **Create & configure a new site?** Yes
- **Team:** Your team
- **Site name:** the-signal
- **Build command:** `npm run build`
- **Publish directory:** `.next`

#### Step 4: Set Environment Variables

```bash
netlify env:set NEXT_PUBLIC_ANALYTICS_ID your_analytics_id
netlify env:set CONTACT_API_ENDPOINT https://your-api.com/contact
```

#### Step 5: Deploy

```bash
netlify deploy --prod
```

Your site will be live at `https://the-signal.netlify.app` (or your custom domain).

---

### Option 3: Cloudflare Pages

#### Step 1: Create GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yashovardhan/the-signal.git
git push -u origin main
```

#### Step 2: Connect to Cloudflare Pages

1. Go to Cloudflare Dashboard → Pages
2. Click "Create a project"
3. Connect your GitHub account
4. Select `the-signal` repository
5. Configure build settings:
   - **Framework preset:** Next.js
   - **Build command:** `npm run build`
   - **Build output directory:** `.next`
   - **Node version:** 20

#### Step 3: Set Environment Variables

In Cloudflare Pages → Your Project → Settings → Environment Variables:

```
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
CONTACT_API_ENDPOINT=https://your-api.com/contact
```

#### Step 4: Deploy

Click "Save and Deploy". Your site will be live at `https://the-signal.pages.dev`.

---

## Post-Deployment

### 1. Verify Deployment

Test the production site:

- [ ] All 9 dimensions load correctly
- [ ] Route transitions work smoothly
- [ ] Particle system renders on all hardware tiers
- [ ] Audio toggle works
- [ ] Neural mode requests camera permission
- [ ] Contact form validation works
- [ ] Keyboard navigation works
- [ ] Screen reader announces dimension changes
- [ ] Mobile responsive (320px – 3840px)
- [ ] Performance is acceptable (60 FPS on Tier 1/2, 30 FPS on Tier 3)

### 2. Set Up Monitoring (Optional)

#### Vercel Analytics

```bash
npm install @vercel/analytics
```

Add to `src/app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

#### Sentry Error Tracking

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Follow the wizard to configure Sentry.

### 3. Set Up Custom Domain

#### Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Configure DNS:
   - **A Record:** `76.76.21.21`
   - **CNAME Record:** `cname.vercel-dns.com`
4. Wait for SSL certificate provisioning

#### Netlify

1. Go to Netlify Dashboard → Your Site → Domain Settings
2. Add custom domain
3. Configure DNS:
   - **A Record:** `75.2.60.5`
   - **CNAME Record:** `your-site.netlify.app`
4. Wait for SSL certificate provisioning

#### Cloudflare Pages

1. Go to Cloudflare Pages → Your Project → Custom Domains
2. Add your custom domain
3. DNS is automatically configured (Cloudflare manages DNS)
4. SSL is automatically provisioned

---

## Continuous Deployment

### GitHub Actions (Vercel)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

Add secrets to GitHub:
- `VERCEL_TOKEN` (from Vercel Account Settings → Tokens)
- `VERCEL_ORG_ID` (from `.vercel/project.json`)
- `VERCEL_PROJECT_ID` (from `.vercel/project.json`)

### GitHub Actions (Netlify)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Netlify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

Add secrets to GitHub:
- `NETLIFY_AUTH_TOKEN` (from Netlify User Settings → Applications)
- `NETLIFY_SITE_ID` (from Netlify Site Settings → General)

---

## Troubleshooting

### Issue: Canvas not rendering

**Cause:** OffscreenCanvas not supported in browser.

**Solution:** Ensure browser supports OffscreenCanvas (Chrome 69+, Firefox 105+, Safari 16.4+). Static fallback will display if not supported.

### Issue: Slow performance on mobile

**Cause:** Too many particles for mobile GPU.

**Solution:** Particle count is automatically reduced by 50% on mobile (< 768px). If still slow, reduce further in `src/lib/constants.ts`:

```typescript
export const RENDER = {
  MOBILE_PARTICLE_SCALE: 0.3, // Reduce to 30%
};
```

### Issue: Audio not playing

**Cause:** Web Audio API requires user interaction to start.

**Solution:** Audio is disabled by default. User must click the audio toggle in the HUD.

### Issue: Neural mode not working

**Cause:** Camera permission denied or MediaPipe not loaded.

**Solution:** Ensure camera permission is granted. If denied, quantum mode (pointer-based) is used as fallback.

### Issue: Build fails with "Module not found"

**Cause:** Missing dependency.

**Solution:** Run `npm install` to ensure all dependencies are installed.

### Issue: Lighthouse performance score < 90

**Cause:** Large bundle size or slow rendering.

**Solution:**
1. Run `npm run build` and check bundle size
2. Use `webpack-bundle-analyzer` to identify large modules
3. Lazy-load heavy components
4. Optimize images with Next.js Image component

---

## Rollback

### Vercel

```bash
vercel rollback
```

### Netlify

```bash
netlify rollback
```

### Cloudflare Pages

Go to Cloudflare Pages → Your Project → Deployments → Select previous deployment → "Rollback to this deployment"

---

## Support

For deployment issues, contact:

- **Vercel Support:** https://vercel.com/support
- **Netlify Support:** https://www.netlify.com/support/
- **Cloudflare Support:** https://support.cloudflare.com/

For project-specific issues, open an issue on GitHub or contact [yyaasshh@gmail.com](mailto:yyaasshh@gmail.com).

---

**Built with ❤️ by Yashovardhan Thopte**
