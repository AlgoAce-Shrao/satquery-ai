/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Serves /api/vision/analyze during `npm run dev`, using the same handler as
 * the Vercel function. Registered before Vite's /api proxy (which forwards the
 * rest of /api to the Spring Boot gateway), so only this path is intercepted.
 */

import type { Plugin } from 'vite';
import { handleVisionRequest, VisionEnv } from './handler.js';

export const VISION_API_PATH = '/api/vision/analyze';

export function satqueryVisionDevApi(env: VisionEnv): Plugin {
  return {
    name: 'satquery-vision-dev-api',
    configureServer(server) {
      server.middlewares.use(VISION_API_PATH, async (req, res) => {
        let body: string | undefined;
        if (req.method === 'POST') {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          body = Buffer.concat(chunks).toString('utf8');
        }
        const result = await handleVisionRequest(req.method ?? 'GET', body, env);
        res.statusCode = result.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result.body));
      });
    },
  };
}
