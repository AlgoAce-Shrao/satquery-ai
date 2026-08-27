package com.satquery;

import java.time.Duration;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;

@SpringBootApplication
public class SatQueryApplication {

    public static void main(String[] args) {
        SpringApplication.run(SatQueryApplication.class, args);
    }

    @Bean
    public RestTemplate restTemplate(
        RestTemplateBuilder builder,
        @Value("${services.request-timeout-ms:10000}") int requestTimeoutMs
    ) {
        Duration timeout = Duration.ofMillis(requestTimeoutMs);
        return builder
            .setConnectTimeout(timeout)
            .setReadTimeout(timeout)
            .build();
    }
}
