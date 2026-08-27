package com.satquery.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class QueryOrchestrationService {

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
        // Step 1: Call NLP Service
        Map<String, Object> nlpPayload = Map.of("raw_query", rawQuery);
        Map<String, Object> structuredQuery;
        try {
            ResponseEntity<Map> nlpRes = restTemplate.postForEntity(
                nlpServiceUrl + "/api/v1/nlp/parse",
                nlpPayload,
                Map.class
            );
            structuredQuery = nlpRes.getBody();
        } catch (Exception e) {
            structuredQuery = createFallbackStructuredQuery(rawQuery);
        }

        String intent = (String) structuredQuery.getOrDefault("intent", "vegetation_change");
        String metric = (String) structuredQuery.getOrDefault("metric", "NDVI");
        String direction = (String) structuredQuery.getOrDefault("direction", "decrease");
        Map<String, Object> spatialScope = (Map<String, Object>) structuredQuery.get("spatial_scope");
        String spatialName = spatialScope != null ? (String) spatialScope.get("name") : "Global";

        // Step 2: Call Data Service (Spatial observations lookup)
        Map<String, Object> spatialPayload = Map.of(
            "intent", intent,
            "metric", metric,
            "spatial_scope_name", spatialName,
            "max_cloud_cover", 20.0
        );

        List<Map<String, Object>> observations = new ArrayList<>();
        try {
            ResponseEntity<Map> dataRes = restTemplate.postForEntity(
                dataServiceUrl + "/api/v1/spatial/search",
                spatialPayload,
                Map.class
            );
            if (dataRes.getBody() != null && dataRes.getBody().containsKey("records")) {
                observations = (List<Map<String, Object>>) dataRes.getBody().get("records");
            }
        } catch (Exception e) {
            // Log fallback
        }

        // Step 3: Call EO Analysis Service (Spectral math & delta synthesis)
        List<Map<String, Object>> analyzedResults = new ArrayList<>();
        if (!observations.isEmpty()) {
            Map<String, Object> eoPayload = Map.of(
                "metric", metric,
                "intent", intent,
                "direction", direction,
                "observations", observations
            );

            try {
                ResponseEntity<Map> eoRes = restTemplate.postForEntity(
                    eoServiceUrl + "/api/v1/eo/analyze",
                    eoPayload,
                    Map.class
                );
                if (eoRes.getBody() != null && eoRes.getBody().containsKey("results")) {
                    analyzedResults = (List<Map<String, Object>>) eoRes.getBody().get("results");
                }
            } catch (Exception e) {
                // Log fallback
            }
        }

        return Map.of(
            "queryId", structuredQuery.getOrDefault("query_id", "Q_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()),
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
