package com.satquery;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class SatQueryApplication {

    public static void main(String[] args) {
        SpringApplication.run(SatQueryApplication.class, args);
    }

    /**
     * RestTemplate with explicit connect and read timeouts.
     *
     * On Render free-tier, Python microservices (nlp-service, data-service, eo-analysis-service)
     * may be sleeping and take 20-30s to cold-start. Without timeouts, RestTemplate will block
     * indefinitely and cause the Spring Boot gateway to return empty results silently.
     *
     * connect-timeout: time to establish TCP connection (set to 10s)
     * read-timeout:    time to wait for response after connection (set to 30s for cold-start tolerance)
     */
    @Bean
    public RestTemplate restTemplate(
        RestTemplateBuilder builder,
        @Value("${services.connect-timeout-ms:10000}") int connectTimeoutMs,
        @Value("${services.read-timeout-ms:30000}") int readTimeoutMs
    ) {
        return builder
            .setConnectTimeout(Duration.ofMillis(connectTimeoutMs))
            .setReadTimeout(Duration.ofMillis(readTimeoutMs))
            .build();
    }
}
