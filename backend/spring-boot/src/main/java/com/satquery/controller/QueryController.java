package com.satquery.controller;

import com.satquery.dto.QueryRequest;
import com.satquery.service.QueryOrchestrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class QueryController {

    private final QueryOrchestrationService orchestrationService;

    public QueryController(QueryOrchestrationService orchestrationService) {
        this.orchestrationService = orchestrationService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "spring-boot-orchestrator",
            "version", "1.0.0"
        ));
    }

    @PostMapping("/query")
    public ResponseEntity<Map<String, Object>> executeQuery(@RequestBody QueryRequest request) {
        if (request.query() == null || request.query().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Query string cannot be empty."));
        }

        Map<String, Object> response = orchestrationService.executeQueryPipeline(request.query().trim());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/analyze/raster")
    public ResponseEntity<Map<String, Object>> analyzeRaster(@RequestBody Map<String, Object> request) {
        try {
            Map<String, Object> response = orchestrationService.executeRasterAnalysis(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of(
                "error", "Raster analysis service is unavailable.",
                "detail", String.valueOf(e.getMessage())
            ));
        }
    }
}
