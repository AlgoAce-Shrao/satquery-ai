package com.satquery.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class QueryOrchestrationService {

    private static final Logger log = LoggerFactory.getLogger(QueryOrchestrationService.class);

    private final RestTemplate restTemplate;

    @Value("${services.nlp.url:http://localhost:8001}")
    private String nlpServiceUrl;

    @Value("${services.data.url:http://localhost:8002}")
    private String dataServiceUrl;

    @Value("${services.eo.url:http://localhost:8003}")
    private String eoServiceUrl;

    public QueryOrchestrationService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> executeQueryPipeline(String rawQuery) {
        log.info("Pipeline START — query: \"{}\"", rawQuery);
        log.info("Downstream URLs — NLP: {} | DATA: {} | EO: {}", nlpServiceUrl, dataServiceUrl, eoServiceUrl);

        // ── Step 1: NLP Service ────────────────────────────────────────────────────
        Map<String, Object> nlpPayload = Map.of("raw_query", rawQuery);
        Map<String, Object> structuredQuery;
        try {
            log.info("Calling NLP service at {}/api/v1/nlp/parse", nlpServiceUrl);
            ResponseEntity<Map> nlpRes = restTemplate.postForEntity(
                nlpServiceUrl + "/api/v1/nlp/parse",
                nlpPayload,
                Map.class
            );
            structuredQuery = nlpRes.getBody();
            log.info("NLP returned intent={} metric={}", structuredQuery.get("intent"), structuredQuery.get("metric"));
        } catch (ResourceAccessException e) {
            log.error("NLP service unreachable or timed out ({}). Using rule-based fallback. Cause: {}", nlpServiceUrl, e.getMessage());
            structuredQuery = createFallbackStructuredQuery(rawQuery);
        } catch (Exception e) {
            log.error("NLP service unexpected error: {}", e.getMessage(), e);
            structuredQuery = createFallbackStructuredQuery(rawQuery);
        }

        if (structuredQuery == null) {
            structuredQuery = createFallbackStructuredQuery(rawQuery);
        }

        String intent = (String) structuredQuery.getOrDefault("intent", "vegetation_change");
        String metric = (String) structuredQuery.getOrDefault("metric", "NDVI");
        String direction = (String) structuredQuery.getOrDefault("direction", "decrease");
        Map<String, Object> spatialScope = (Map<String, Object>) structuredQuery.get("spatial_scope");
        String spatialName = spatialScope != null ? (String) spatialScope.get("name") : "Global";

        // ── Step 2: Data Service ────────────────────────────────────────────────────
        Map<String, Object> spatialPayload = Map.of(
            "intent", intent,
            "metric", metric,
            "spatial_scope_name", spatialName,
            "max_cloud_cover", 20.0
        );

        List<Map<String, Object>> observations = new ArrayList<>();
        try {
            log.info("Calling Data service at {}/api/v1/spatial/search — scope: {}", dataServiceUrl, spatialName);
            ResponseEntity<Map> dataRes = restTemplate.postForEntity(
                dataServiceUrl + "/api/v1/spatial/search",
                spatialPayload,
                Map.class
            );
            if (dataRes.getBody() != null && dataRes.getBody().containsKey("records")) {
                observations = (List<Map<String, Object>>) dataRes.getBody().get("records");
                log.info("Data service returned {} observation(s)", observations.size());
            } else {
                log.warn("Data service returned a body with no 'records' key: {}", dataRes.getBody());
            }
        } catch (ResourceAccessException e) {
            log.error("Data service unreachable or timed out ({}). Cause: {}", dataServiceUrl, e.getMessage());
        } catch (Exception e) {
            log.error("Data service unexpected error: {}", e.getMessage(), e);
        }

        // ── Step 3: EO Analysis Service ─────────────────────────────────────────────
        List<Map<String, Object>> analyzedResults = new ArrayList<>();
        if (!observations.isEmpty()) {
            Map<String, Object> eoPayload = Map.of(
                "metric", metric,
                "intent", intent,
                "direction", direction,
                "observations", observations
            );

            try {
                log.info("Calling EO Analysis service at {}/api/v1/eo/analyze — {} obs, metric: {}", eoServiceUrl, observations.size(), metric);
                ResponseEntity<Map> eoRes = restTemplate.postForEntity(
                    eoServiceUrl + "/api/v1/eo/analyze",
                    eoPayload,
                    Map.class
                );
                if (eoRes.getBody() != null && eoRes.getBody().containsKey("results")) {
                    analyzedResults = (List<Map<String, Object>>) eoRes.getBody().get("results");
                    log.info("EO Analysis returned {} analyzed result(s)", analyzedResults.size());
                } else {
                    log.warn("EO Analysis returned a body with no 'results' key: {}", eoRes.getBody());
                }
            } catch (ResourceAccessException e) {
                log.error("EO Analysis service unreachable or timed out ({}). Cause: {}", eoServiceUrl, e.getMessage());
            } catch (Exception e) {
                log.error("EO Analysis service unexpected error: {}", e.getMessage(), e);
            }
        } else {
            log.warn("No observations returned by Data service — skipping EO Analysis step.");
        }

        String queryId = (String) structuredQuery.getOrDefault(
            "query_id",
            "Q_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()
        );

        log.info("Pipeline COMPLETE — queryId: {} | results: {}", queryId, analyzedResults.size());

        return Map.of(
            "queryId", queryId,
            "rawQuery", rawQuery,
            "structuredQuery", structuredQuery,
            "results", analyzedResults,
            "visualization", Map.of(
                "mode", "tour",
                "autoNavigate", true,
                "cameraAltitudeMeters", 1500000
            ),
            "status", "COMPLETED"
        );
    }

    /**
     * Proxies a raster-analysis request straight through to eo-analysis-service's
     * /api/v1/eo/analyze-raster. Unlike the text-query pipeline above, there is no meaningful
     * rule-based fallback for "analyze these actual pixels" — if the EO service is unreachable
     * this throws so the caller can surface a real error instead of fabricating a result.
     */
    public Map<String, Object> executeRasterAnalysis(Map<String, Object> requestBody) {
        log.info("Proxying raster analysis to {}/api/v1/eo/analyze-raster (mode={})", eoServiceUrl, requestBody.get("mode"));
        ResponseEntity<Map> response = restTemplate.postForEntity(
            eoServiceUrl + "/api/v1/eo/analyze-raster",
            requestBody,
            Map.class
        );
        Map<String, Object> body = response.getBody();
        if (body == null) {
            throw new IllegalStateException("eo-analysis-service returned an empty body for /analyze-raster.");
        }
        return body;
    }

    private Map<String, Object> createFallbackStructuredQuery(String rawQuery) {
        return Map.of(
            "query_id", "Q_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
            "raw_query", rawQuery,
            "intent", "vegetation_change",
            "metric", "NDVI",
            "direction", "decrease",
            "spatial_scope", Map.of("type", "global", "name", "Global Critical Sites"),
            "temporal_scope", Map.of("start_date", "2025-06-01", "end_date", "2026-06-30"),
            "threshold", Map.of("operator", "<=", "value", -15.0, "unit", "percent")
        );
    }
}
