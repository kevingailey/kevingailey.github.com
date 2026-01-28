# Cloudflare Workers Deployment

This directory contains the Cloudflare Workers configuration for deploying the by.KG portfolio site.

## Prerequisites

- Node.js 18+ installed
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)
- Ruby with Jekyll (for building the static site)

## Setup

1. **Install dependencies:**
   ```bash
   cd workers
   npm install
   ```

2. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

3. **Configure your account:**
   Update `wrangler.toml` with your account details if needed, or let Wrangler auto-detect.

## Development

Run the development server with hot reload:

```bash
npm run dev
```

This will:
- Build the Jekyll site to `_site/`
- Start the Wrangler dev server
- Serve the site locally with the Worker handling requests

## Deployment

### Build and Deploy

```bash
npm run deploy
```

This command:
1. Builds the Jekyll site
2. Deploys the Worker and static assets to Cloudflare

### Preview Deployment

```bash
npm run deploy:preview
```

Deploys to a preview environment for testing.

## Configuration

### Custom Domain

To use a custom domain, uncomment and update the routes in `wrangler.toml`:

```toml
routes = [
  { pattern = "by.kevingailey.com/*", zone_name = "kevingailey.com" }
]
```

Ensure your domain is configured in Cloudflare DNS.

### Environment Variables

No environment variables are required for basic operation.

## Architecture

### Worker Features

- **Static Asset Serving**: Serves Jekyll-built static files via Cloudflare Assets
- **Legacy Redirects**: Handles old Tumblr URLs (`/post/{id}`) with 301 redirects
- **Security Headers**: Adds security headers to all responses
- **Smart Routing**: Handles clean URLs (e.g., `/writing` -> `/writing/index.html`)
- **Caching**: Optimized cache headers for static assets

### File Structure

```
workers/
├── src/
│   ├── index.ts      # Main Worker entry point
│   └── redirects.ts  # Tumblr URL redirect mappings
├── wrangler.toml     # Cloudflare configuration
├── package.json      # Dependencies and scripts
└── tsconfig.json     # TypeScript configuration
```

## Monitoring

View real-time logs:

```bash
npm run tail
```

## Migration from GitHub Pages

This Worker-based deployment replaces the GitHub Pages hosting while maintaining:
- All existing URLs
- RSS feed (`/feed.xml`)
- Legacy Tumblr post redirects
- Custom 404 page

### DNS Changes

When migrating, update DNS to point to Cloudflare:
1. Add your domain to Cloudflare
2. Update nameservers at your registrar
3. Configure the Worker route for your domain
