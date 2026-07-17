package com.file_route;

import com.file_service.ai_service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/files/analyze")
@CrossOrigin(origins = "*") // CORS izni
public class ai_route {

    private final ai_service aiService;

    @Autowired
    public ai_route(ai_service aiService) {
        this.aiService = aiService;
    }

    // React'ten gelen /api/files/analyze/excel veya /pdf isteklerini yakalar
    @GetMapping("/{fileType}")
    public ResponseEntity<String> analyze(@PathVariable String fileType, @RequestParam(defaultValue = "tr") String lang) {
        try {
            String aiResponse = aiService.analyzeFile(fileType, lang);
            return ResponseEntity.ok(aiResponse);
        } catch (Exception e) {
            // Hata olursa React'e 500 koduyla dön ki 'Zarif Çöküş' mesajı ekrana basılsın
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}