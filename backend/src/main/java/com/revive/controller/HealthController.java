package com.revive.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping({"/health", "/healthz", "/api/health", "/api/healthz"})
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }

    @GetMapping("/api/health/memory")
    public ResponseEntity<Map<String, Object>> memoryStatus() {
        Runtime runtime = Runtime.getRuntime();
        
        long maxMemory = runtime.maxMemory();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        
        Map<String, Object> memoryInfo = new HashMap<>();
        memoryInfo.put("maxMemoryMB", maxMemory / (1024 * 1024));
        memoryInfo.put("totalMemoryMB", totalMemory / (1024 * 1024));
        memoryInfo.put("usedMemoryMB", usedMemory / (1024 * 1024));
        memoryInfo.put("freeMemoryMB", freeMemory / (1024 * 1024));
        memoryInfo.put("usagePercent", (usedMemory * 100) / maxMemory);
        
        return ResponseEntity.ok(memoryInfo);
    }
}
