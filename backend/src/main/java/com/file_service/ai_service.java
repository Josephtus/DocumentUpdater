package com.file_service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.core.io.Resource;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.InputStream;
import java.util.Map;
import java.util.HashMap;

@Service
public class ai_service {

    private final file_service fileService;

    // file_service'i buraya bağlıyoruz ki dosyalara ulaşabilelim
    @Autowired
    public ai_service(file_service fileService) {
        this.fileService = fileService;
    }

    public String analyzeFile(String fileType, String lang) {
        String extractedText = "";

        try {
            // 1. DOSYADAN METİN ÇIKARTMA AŞAMASI
            if (fileType.equals("pdf")) {
                extractedText = readPdfContent();
            } else if (fileType.equals("excel")) {
                extractedText = readExcelContent();
            } else {
                throw new RuntimeException("Geçersiz dosya türü.");
            }

            // Güvenlik önlemi: Ollama'nın RAM'ini patlatmamak için metin çok uzunsa kırpıyoruz
            if (extractedText.length() > 3000) {
                extractedText = extractedText.substring(0, 3000);
            }

        } catch (Exception e) {
            throw new RuntimeException("Dosya okunurken hata oluştu: " + e.getMessage());
        }

        // 2. OLLAMA'YA GÖNDERME AŞAMASI
        String ollamaUrl = "http://localhost:11434/api/generate";
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Promt oluşturma
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("Sen bir veri analiz asistanısın. Aşağıdaki veriyi incele ve kısa ve öz bir şekilde ne ile ilgili olduğunu açıkla:\n\n");
        promptBuilder.append(extractedText).append("\n\n");

        // DİL KONTROLÜ
        if ("en".equalsIgnoreCase(lang)) {
            promptBuilder.append("Strict Instruction: Please process the text above and provide your final analysis/summary ONLY in English.");
        } else {
            promptBuilder.append("Kesin Talimat: Lütfen yukarıdaki metni incele ve yanıtını SADECE Türkçe olarak ver.");
        }
        
        String prompt = promptBuilder.toString();

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "qwen2.5-coder:7b"); 
        requestBody.put("prompt", prompt);
        requestBody.put("stream", false); 

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(ollamaUrl, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (String) response.getBody().get("response");
            } else {
                throw new RuntimeException("Ollama'dan geçersiz yanıt geldi.");
            }
        } catch (Exception e) {
            throw new RuntimeException("Ollama bağlantı hatası: " + e.getMessage());
        }
    }

    // --- YARDIMCI METOTLAR ---

    // PDF Dosyasının Metnini Çıkartan Metot
    private String readPdfContent() throws Exception {
        Resource pdfResource = fileService.getPdfFile();
        try (InputStream is = pdfResource.getInputStream();
             PDDocument document = PDDocument.load(is)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    // Excel Dosyasının Metnini Çıkartan Metot
    private String readExcelContent() throws Exception {
        Resource excelResource = fileService.getExcelFile();
        StringBuilder sb = new StringBuilder();
        
        try (InputStream is = excelResource.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {
            
            Sheet sheet = workbook.getSheetAt(0); // İlk excel sayfasını alır
            for (Row row : sheet) {
                for (Cell cell : row) {
                    sb.append(cell.toString()).append(" | "); // Sütunları ayır
                }
                sb.append("\n"); // Alt satıra geç
            }
            return sb.toString();
        }
    }
}