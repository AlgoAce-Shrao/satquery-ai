/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vercel serverless function: /api/vision/analyze
 * Set GEMINI_API_KEY (and optionally GEMINI_MODEL) in the Vercel project's
 * Environment Variables. vercel.json already routes /api/* here instead of
 * rewriting it to index.html.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleVisionRequest } from '../../server/vision/handler.js';

export const config = { maxDuration: 60 };

async function readBody(req: IncomingMessage & { body?: unknown }): Promise<unknown> {
  if (req.body !== undefined) return req.body; // Vercel pre-parses JSON bodies
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  const body = req.method === 'POST' ? await readBody(req) : undefined;
  const result = await handleVisionRequest(req.method ?? 'GET', body, {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
  });
  res.statusCode = result.status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(result.body));
}
