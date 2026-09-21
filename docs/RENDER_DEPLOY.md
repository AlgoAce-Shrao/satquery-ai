# SatQuery AI — Render deployment (current live topology)

**Status as of this audit:** all 4 backend services are already deployed and reachable.
Render assigned different hostnames than their service names because the plain names were
taken globally — the actual live URLs are:

| Service | Real URL |
|---|---|
| Gateway (Spring Boot) | `https://satquery-ai-backend-itzg.onrender.com` |
| nlp-service | `https://satquery-ai-nlp-service.onrender.com` |
| data-service | `https://satquery-ai-rtc5.onrender.com` |
| eo-analysis-service | `https://satquery-ai-eo-analysis-service.onrender.com` |

The gateway's env vars (`NLP_SERVICE_URL`, `DATA_SERVICE_URL`, `EO_SERVICE_URL`) are already
correctly pointed at these real hostnames — verified with a live end-to-end query.

**What was actually broken:** Vercel's `VITE_SPRING_BOOT_API_URL` was pointed at
`satquery-gateway.onrender.com`, a hostname nobody owns (`x-render-routing: no-server`) — not
any of the 4 real services above. This has been corrected in production
(`https://satquery-ai-seven.vercel.app` now points at the real gateway).

**What's still empty:** the production PostGIS database has zero rows — confirmed via a
direct global-scope query against `data-service` returning `{"total_matched":0,"records":[]}`.
The migrations/seed SQL were never applied. `spatial_repository.py::_apply_migrations` (added
in this pass) fixes this automatically on next boot — no manual `psql` step needed — but it
only takes effect once `data-service` redeploys with the updated code.

## Getting the fixes live

Render auto-deploys each service on push to `main`. Once this branch's changes are pushed:

1. **data-service** redeploys → self-applies the PostGIS schema + seed catalogue on boot.
   Verify: `curl https://satquery-ai-rtc5.onrender.com/health` should still say `"PostGIS"`,
   and a spatial search should now return the 4 seeded observations instead of an empty list.
2. **eo-analysis-service** redeploys → gains the new `/api/v1/eo/analyze-raster` endpoint
   (real rasterio/Pillow pixel decoding, real NDVI/NDWI/VARI, real bi-temporal diffing).
3. **nlp-service** redeploys → confidence score becomes a real heuristic instead of the flat
   `0.96` constant.
4. **satquery-ai-backend-itzg** (gateway) redeploys → gains the CORS wildcard fix
   (`allowedOriginPatterns` for `https://*.vercel.app`) and the new
   `POST /api/v1/analyze/raster` proxy endpoint that the frontend's `RealAnalysisProvider`
   calls for uploaded-image analysis.

## Verifying after redeploy

```
curl https://satquery-ai-rtc5.onrender.com/api/v1/spatial/search -X POST \
  -H "Content-Type: application/json" \
  -d '{"intent":"vegetation_change","metric":"NDVI","spatial_scope_name":"Global Critical Sites","max_cloud_cover":20,"limit":10}'
# expect 4 seeded observations, not an empty array

curl https://satquery-ai-backend-itzg.onrender.com/api/v1/query -X POST \
  -H "Content-Type: application/json" -d '{"query":"deforestation in the amazon"}'
# expect a non-empty "results" array sourced from the now-seeded PostGIS catalogue
```

## Free-tier limitations (unchanged)

- All 4 services sleep after ~15 minutes idle; first request after idle takes 20–30s
  (already tuned for via `services.read-timeout-ms` in `application.yml` and the frontend's
  30s fetch timeout).
- The free Postgres instance backing `data-service` expires after 30 days unless upgraded —
  if it expires, `_apply_migrations` will re-seed automatically the moment a new free instance
  is attached and `DATABASE_URL` is updated.
- `render.yaml` at the repo root remains useful only as a disaster-recovery / fresh-environment
  blueprint (e.g. rebuilding everything from scratch in a new Render account) — do **not**
  apply it against the current account, since it would create 4 duplicate services rather
  than update the ones listed above.
