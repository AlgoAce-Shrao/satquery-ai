/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Framework-agnostic handler for POST/GET /api/vision/analyze.
 * Shared by the Vercel function (api/vision/analyze.ts) and the Vite dev
 * middleware (vite.config.ts) so local and deployed behaviour match.
 */

import { analyzeSceneWithGemini, DEFAULT_GEMINI_MODEL, VisionAnalyzeRequest } from './geminiVision.js';

export interface VisionEnv {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

export interface HandlerResult {
  status: number;
  body: unknown;
}

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
// Vercel caps request bodies at ~4.5 MB; the client downsizes well below this.
const MAX_IMAGE_BASE64_CHARS = 3_000_000;
const MAX_IMAGES = 2;

export async function handleVisionRequest(method: string, rawBody: unknown, env: VisionEnv): Promise<HandlerResult> {
  const apiKey = env.GEMINI_API_KEY?.trim();
  const model = env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  // GET = capability probe used by the client to decide whether to route uploads here.
  if (method === 'GET') {
    return { status: 200, body: { configured: Boolean(apiKey), provider: 'gemini', model } };
  }
  if (method !== 'POST') {
    return { status: 405, body: { error: 'Use POST with a JSON body.' } };
  }
  if (!apiKey) {
    return {
      status: 503,
      body: { error: 'GEMINI_API_KEY is not set on the server. Add it to .env.local (local) or the Vercel project settings.' },
    };
  }

  let body: Partial<VisionAnalyzeRequest>;
  try {
    body = typeof rawBody === 'string' ? JSON.parse(rawBody) : (rawBody as Partial<VisionAnalyzeRequest>);
  } catch {
    return { status: 400, body: { error: 'Request body is not valid JSON.' } };
  }

  const images = Array.isArray(body?.images) ? body.images.slice(0, MAX_IMAGES) : [];
  if (images.length === 0) return { status: 400, body: { error: 'At least one image is required.' } };
  for (const img of images) {
    if (!img || typeof img.dataBase64 !== 'string' || !ACCEPTED_MIME.includes(img.mimeType)) {
      return { status: 400, body: { error: 'Images must be JPEG, PNG or WebP, base64-encoded.' } };
    }
    if (img.dataBase64.length > MAX_IMAGE_BASE64_CHARS) {
      return { status: 413, body: { error: 'Image is too large; the client should downscale before upload.' } };
    }
  }

  const mode = body.mode === 'BI_TEMPORAL' || body.mode === 'OPTICAL_SAR' ? body.mode : 'SINGLE_IMAGE';
  const prompt = typeof body.prompt === 'string' && body.prompt.trim() ? body.prompt.trim().slice(0, 1000) : 'Describe this area.';

  try {
    const analysis = await analyzeSceneWithGemini(
      { mode, prompt, images, context: typeof body.context === 'object' ? body.context : undefined },
      { apiKey, model }
    );
    return { status: 200, body: analysis };
  } catch (err) {
    const e = err as { status?: number; message?: string };
    // Never echo the key; Gemini errors do not include it, but keep messages short.
    let message = e?.message ?? 'Gemini request failed.';
    try {
      // The SDK often wraps Google's JSON error body in the message; surface just its text.
      message = JSON.parse(message)?.error?.message ?? message;
    } catch {
      /* plain-text message */
    }
    message = message.slice(0, 300);
    const status = e?.status === 429 ? 429 : e?.status === 400 ? 400 : 502;
    return { status, body: { error: `Gemini analysis failed: ${message}` } };
  }
}
