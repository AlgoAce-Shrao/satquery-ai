package com.satquery.dto;

import java.util.List;
import java.util.Map;

public record QueryResponse(
    String queryId,
    String rawQuery,
    Map<String, Object> structuredQuery,
    List<Map<String, Object>> results,
    Map<String, Object> visualization,
    String status
) {}
