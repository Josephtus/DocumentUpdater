package com.file_route;

import com.file_service.file_service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*") // CORS

public class file_route {

    private final file_service fileService;

    @Autowired
    public file_route(file_service fileService) {
        this.fileService = fileService;
    }

    // EXCEL YÜKLEME API
    @PostMapping("/upload/excel")
    public ResponseEntity<String> uploadExcel(@RequestParam("file") MultipartFile file) {
        try {
            // Sadece Excel yükleyen
            String fileName = fileService.storeExcelFile(file);
            return ResponseEntity.ok("Excel dosyası başarıyla yüklendi: " + fileName);
        } catch (Exception e) {
            // Error
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // PDF YÜKLEME API
    @PostMapping("/upload/pdf")
    public ResponseEntity<String> uploadPdf(@RequestParam("file") MultipartFile file) {
        try {
            // Sadece PDF yükleyen
            String fileName = fileService.storePdfFile(file);
            return ResponseEntity.ok("PDF dosyası başarıyla yüklendi: " + fileName);
        } catch (Exception e) {
            // Error
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // EXCEL İNDİRME APİ UCU
    @GetMapping("/download/excel")
    public ResponseEntity<Resource> downloadExcel() {
        try {
            // Servisten dosyayı alıyoruz
            Resource resource = fileService.getExcelFile();
            
            // Dosyanın MIME tipini (türünü) belirliyoruz (Excel için genel tip)
            String contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    // Tarayıcıya "Bu dosyayı indir, adı da şu olsun" diyoruz
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                    .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                    .body(resource);
                    
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    // PDF İNDİRME APİ UCU
    @GetMapping("/download/pdf")
    public ResponseEntity<Resource> downloadPdf() {
        try {
            // Servisten dosyayı alıyoruz
            Resource resource = fileService.getPdfFile();
            
            // Dosyanın MIME tipini belirliyoruz (PDF için)
            String contentType = "application/pdf";
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    // Tarayıcıya "Bu dosyayı indir, adı da şu olsun" diyoruz
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                    .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                    .body(resource);
                    
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

}