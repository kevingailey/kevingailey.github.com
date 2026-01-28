/**
 * Cloudflare Worker for by.KG Portfolio
 *
 * Handles:
 * - Static asset serving via Cloudflare Assets
 * - Legacy Tumblr URL redirects
 * - Custom routing and error handling
 * - Edge-side optimizations
 */

import { TUMBLR_REDIRECTS } from './redirects';

export interface Env {
  ASSETS: Fetcher;
  CACHE?: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle legacy Tumblr redirects
    // Format: /post/{tumblr_id} or /post/{tumblr_id}/slug
    const tumblrMatch = path.match(/^\/post\/(\d+)/);
    if (tumblrMatch) {
      const tumblrId = tumblrMatch[1];
      const redirectPath = TUMBLR_REDIRECTS[tumblrId];
      if (redirectPath) {
        return Response.redirect(`${url.origin}/${redirectPath}`, 301);
      }
    }

    // Handle common redirects
    const redirects: Record<string, string> = {
      '/blog': '/writing/',
      '/blog/': '/writing/',
      '/posts': '/writing/',
      '/posts/': '/writing/',
      '/photos': '/portfolio/',
      '/photos/': '/portfolio/',
    };

    if (redirects[path]) {
      return Response.redirect(`${url.origin}${redirects[path]}`, 301);
    }

    // Add security headers
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };

    try {
      // Serve static assets
      let response = await env.ASSETS.fetch(request);

      // If not found and path doesn't end with extension, try .html
      if (response.status === 404 && !path.includes('.') && path !== '/') {
        const htmlPath = path.endsWith('/') ? `${path}index.html` : `${path}.html`;
        const htmlRequest = new Request(`${url.origin}${htmlPath}`, request);
        const htmlResponse = await env.ASSETS.fetch(htmlRequest);
        if (htmlResponse.status === 200) {
          response = htmlResponse;
        }
      }

      // If still not found, try directory index
      if (response.status === 404 && !path.endsWith('/')) {
        const dirRequest = new Request(`${url.origin}${path}/index.html`, request);
        const dirResponse = await env.ASSETS.fetch(dirRequest);
        if (dirResponse.status === 200) {
          response = dirResponse;
        }
      }

      // Clone response to add headers
      const newResponse = new Response(response.body, response);

      // Add security headers
      Object.entries(securityHeaders).forEach(([key, value]) => {
        newResponse.headers.set(key, value);
      });

      // Add cache headers for static assets
      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.includes('image/') ||
          contentType.includes('font/') ||
          path.match(/\.(css|js|woff2?|ttf|eot)$/)) {
        newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (contentType.includes('text/html')) {
        newResponse.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
      }

      return newResponse;
    } catch (error) {
      // Return custom 404 page
      try {
        const notFoundResponse = await env.ASSETS.fetch(new Request(`${url.origin}/404.html`));
        return new Response(notFoundResponse.body, {
          status: 404,
          headers: {
            'Content-Type': 'text/html',
            ...securityHeaders,
          },
        });
      } catch {
        return new Response('Not Found', {
          status: 404,
          headers: securityHeaders,
        });
      }
    }
  },
};
