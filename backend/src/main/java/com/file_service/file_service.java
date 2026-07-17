package com.file_service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.StandardCopyOption;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

@Service
public class file_service {

    private final Path excelStorageLocation;
    private final Path pdfStorageLocation;
    
    // application.properties dosyasındaki 'file.upload-dir'
    public file_service(@Value("${file.upload-dir}") String uploadDir) {
        
        // uploads klasörünün içindeki excel ve pdf klasörleri
        this.excelStorageLocation = Paths.get(uploadDir + "/excel").toAbsolutePath().normalize();
        this.pdfStorageLocation = Paths.get(uploadDir + "/pdf").toAbsolutePath().normalize();

        try {
            // Yoksa oluştur.
            Files.createDirectories(this.excelStorageLocation);
            Files.createDirectories(this.pdfStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Klasor olusmadi!", ex);
        }
    }
    
    // SADECE EXCEL YÜKLEME METODU
    public String storeExcelFile(MultipartFile file) {
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());

        // Backend tarafında kesin kural: Sadece .xlsx veya .xls kabul et
        if (!(fileName.toLowerCase().endsWith(".xlsx") || fileName.toLowerCase().endsWith(".xls"))) {
            throw new RuntimeException("Hata: Bu alana sadece Excel dosyası yükleyebilirsiniz!");
        }

        try {
            cleanFolder(this.excelStorageLocation); // Eski Excel'i sil
            Path targetLocation = this.excelStorageLocation.resolve(fileName); // Yeni hedefi belirle
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING); // Kaydet
            return fileName; 
        } catch (IOException ex) {
            throw new RuntimeException("Excel dosyası kaydedilemedi: " + fileName, ex);
        }
    }

    // SADECE PDF YÜKLEME METODU
    public String storePdfFile(MultipartFile file) {
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());

        // Backend tarafında kesin kural: Sadece .pdf kabul et
        if (!fileName.toLowerCase().endsWith(".pdf")) {
            throw new RuntimeException("Hata: Bu alana sadece PDF dosyası yükleyebilirsiniz!");
        }

        try {
            cleanFolder(this.pdfStorageLocation); // Eski PDF'i sil
            Path targetLocation = this.pdfStorageLocation.resolve(fileName); // Yeni hedefi belirle
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING); // Kaydet
            return fileName; 
        } catch (IOException ex) {
            throw new RuntimeException("PDF dosyası kaydedilemedi: " + fileName, ex);
        }
    }

    // KLASÖR TEMİZLEME METODU
    private void cleanFolder(Path folderPath) throws IOException {
        Files.list(folderPath).forEach(file -> {
            try {
                Files.delete(file);
            } catch (IOException e) {
                System.out.println("Eski dosya silinemedi: " + file.getFileName());
            }
        });
    }

    // EXCEL İNDİRME METODU
    public Resource getExcelFile() {
        try {
            // Klasördeki ilk (ve tek) dosyayı buluyoruz
            Path filePath = Files.list(this.excelStorageLocation).findFirst()
                    .orElseThrow(() -> new RuntimeException("Klasörde indirilecek Excel dosyası bulunamadı!"));
            
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Excel dosyası okunamadı!");
            }
        } catch (Exception ex) {
            throw new RuntimeException("Excel dosyası getirilirken hata oluştu.", ex);
        }
    }

    // PDF İNDİRME METODU 
    public Resource getPdfFile() {
        try {
            // Klasördeki ilk (ve tek) dosyayı buluyoruz
            Path filePath = Files.list(this.pdfStorageLocation).findFirst()
                    .orElseThrow(() -> new RuntimeException("Klasörde indirilecek PDF dosyası bulunamadı!"));
            
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("PDF dosyası okunamadı!");
            }
        } catch (Exception ex) {
            throw new RuntimeException("PDF dosyası getirilirken hata oluştu.", ex);
        }
    }
}