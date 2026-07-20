import { useState, useRef, useEffect } from 'react'
import { translations } from './translations' // Sözlüğü dışarıdan çekiyoruz
import './App.css'
import { FloatingOctopus } from './FloatingOctopus.jsx'; // Dosya yoluna göre ayarla

function App() {
  const excelConnection = useRef(null)
  const pdfConnection = useRef(null)

  // SÜRÜKLE-BIRAK (DRAG) STATELERİ
  const [isExcelDragActive, setIsExcelDragActive] = useState(false);
  const [isPdfDragActive, setIsPdfDragActive] = useState(false);

  // DİL STATE'İ (Tarayıcı hafızasını kullanarak başlatıyoruz)
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('appLanguage') || 'tr';
  });

  // AL STATE
  const [aiMessage, setAiMessage] = useState("");

  // MODAL STATE
  const [pdfModalOn, setPdfModalOn] = useState(false)
  const [helpModalOn, setHelpModalOn] = useState(false) // YARDIM MODALI İÇİN

  // PDF önizleme linkini tutacağımız state
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null)

  // Aktif dile göre metinleri çağırmak için kısayol
  const t = translations[lang];

  // Modal açıldığında çalışacak olan kod
  useEffect(() => {
    if (pdfModalOn) {
      // Modal açıldıysa Java'dan PDF'i çekiyoruz
      fetch(`${backendUrl}/download/pdf`)
        .then(response => {
          if (!response.ok) throw new Error("PDF bulunamadı");
          return response.blob();
        })
        .then(blob => {
          // Gelen PDF'i sanal bir linke çevir ve state'e kaydet
          const url = window.URL.createObjectURL(blob);
          setPdfPreviewUrl(url);
        })
        .catch(error => {
          console.log(t.pdfPreviewError, error);
        });
    } else {
      // Modal kapandıysa arka planda yer kaplamaması için o sanal linki sil (Temizlik)
      if (pdfPreviewUrl) {
        window.URL.revokeObjectURL(pdfPreviewUrl);
        setPdfPreviewUrl(null);
      }
    }
  }, [pdfModalOn]); // Sadece modal açılıp kapandığında bu bloğu tetikle

  const backendUrl = "http://localhost:8080/api/files";

  // EXCEL İNDİRME
  const handleExcelDownload = async () => {
    try {
      const response = await fetch(`${backendUrl}/download/excel`);
      
      if (!response.ok) {
        alert(t.alertExcelDownloadFail);
        return;
      }

      // Backend'den gelen orijinal dosya adını yakalamaya çalışıyoruz
      let fileName = "indirilen_excel.xlsx"; // Bulamazsa kullanacağı varsayılan isim
      const disposition = response.headers.get('Content-Disposition');
      
      if (disposition && disposition.includes('filename=')) {
        // Gelen metnin içinden sadece isim kısmını cımbızlıyoruz
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName; 
      document.body.appendChild(link);
      link.click();
      
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      alert(t.alertServerFail);
    }
  }

  // PDF İNDİRME
  const handlePdfDownload = async () => {
    try {
      const response = await fetch(`${backendUrl}/download/pdf`);
      
      if (!response.ok) {
        alert(t.alertPdfDownloadFail);
        return;
      }

      // Backend'den gelen orijinal dosya adını yakalamaya çalışıyoruz
      let fileName = "indirilen_pdf.pdf"; // Varsayılan isim
      const disposition = response.headers.get('Content-Disposition');
      
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName; 
      document.body.appendChild(link);
      link.click();
      
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      alert(t.alertServerFail);
    }
  }

  // --- EXCEL DOSYASI İŞLEME ---
  const processExcelFile = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${backendUrl}/upload/excel`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert(t.alertUploadSuccessExcel);
      } else {
        const errorMsg = await response.text();
        alert(t.alertUploadFail + errorMsg);
      }
    } catch (error) {
      alert(t.alertServerFail);
    }
  };

  // --- PDF DOSYASI İŞLEME ---
  const processPdfFile = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${backendUrl}/upload/pdf`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert(t.alertUploadSuccessPdf);
      } else {
        const errorMsg = await response.text();
        alert(t.alertUploadFail + errorMsg);
      }
    } catch (error) {
      alert(t.alertServerFail);
    }
  };

  // 1. INPUT (Buton) İLE YÜKLEME TETİKLEYİCİLERİ
  const handleExcelUpload = (event) => {
    processExcelFile(event.target.files[0]);
    event.target.value = null;
  };

  const handlePdfUpload = (event) => {
    processPdfFile(event.target.files[0]);
    event.target.value = null;
  };

  // 2. SÜRÜKLE-BIRAK (DROP) İLE YÜKLEME TETİKLEYİCİLERİ
  const handleExcelDrop = (e) => {
    e.preventDefault();
    setIsExcelDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processExcelFile(e.dataTransfer.files[0]);
    }
  };

  const handlePdfDrop = (e) => {
    e.preventDefault();
    setIsPdfDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processPdfFile(e.dataTransfer.files[0]);
    }
  };

  // --- YAPAY ZEKA ANALİZ FONKSİYONU (ZARİF ÇÖKÜŞ) ---
  const handleAiAnalysis = async (fileType) => {
    setAiMessage(t.aiWakeUp(fileType));

    try {
      // DİKKAT: Seçilen dili backend'e parametre olarak gönderiyoruz!
      const response = await fetch(`${backendUrl}/analyze/${fileType}?lang=${lang}`);

      if (!response.ok) {
        throw new Error("Sunucuya veya Ollama'ya ulaşılamadı.");
      }

      const data = await response.text();
      setAiMessage(`${t.aiResponse}${data}`);

    } catch (error) {
      // GRACEFUL DEGRADATION BURADA DEVREYE GİRİYOR!
      // Uygulama çökmek yerine kullanıcıya sadece bir bilgi mesajı verir.
      setAiMessage(t.aiCrashError);
    }
  }

  // Dili Değiştiren ve Hafızaya Kaydeden Fonksiyon
  const toggleLanguage = () => {
    setLang(prevLang => {
      const newLang = prevLang === 'tr' ? 'en' : 'tr';
      localStorage.setItem('appLanguage', newLang); // Tarayıcıya kaydet
      return newLang;
    });
    setAiMessage(""); // Dil değiştiğinde hata mesajını sıfırla
  }

  return (
    <div className="main_page">
      <FloatingOctopus />

      {/* SAĞ ÜST AKSİYON BUTONLARI (Dil ve Yardım) */}
      <div className="top_actions">
        <button 
          className="action_button lang_button" 
          onClick={toggleLanguage}
          title={lang === 'tr' ? "Switch to English" : "Türkçe'ye Geç"}
        >
          {lang === 'tr' ? 'EN' : 'TR'}
        </button>
        <button 
          className="action_button" 
          onClick={() => setHelpModalOn(true)}
          title={t.helpTitle}
        >
          ?
        </button>
      </div>

      <h1 className="main_title">{t.title}</h1>
    
      <div className="main_content">

        {/* EXCEL KUTUSU */}
        <div 
          className={`main_content_boxes ${isExcelDragActive ? 'drag_active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsExcelDragActive(true); }}
          onDragLeave={() => setIsExcelDragActive(false)}
          onDrop={handleExcelDrop}
        >
           {/*<button className="excel_button" onClick={handleExcelDownload}>{t.excelBtn}</button>*/}
          
          {/* ANİMASYONLU EXCEL İNDİRME BUTONU */}
          <button className="button-with-icon" onClick={handleExcelDownload}>
            <svg 
              className="icon" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span className="text">Excel</span>
          </button>

          
          <button className="upload_button" onClick={() => excelConnection.current.click()}>
            {t.uploadBtn}
          </button>
          <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} ref={excelConnection} onChange={handleExcelUpload} />
        </div>

        {/* PDF KUTUSU */}
        <div 
          className={`main_content_boxes ${isPdfDragActive ? 'drag_active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsPdfDragActive(true); }}
          onDragLeave={() => setIsPdfDragActive(false)}
          onDrop={handlePdfDrop}
        >
          {/*<button className="pdf_button" onClick={() => setPdfModalOn(true)}>{t.pdfBtn}</button>*/}

          {/* ANİMASYONLU EXCEL İNDİRME BUTONU */}
          <button className="button-with-icon-pdf" onClick={() => setPdfModalOn(true)}>
            <svg 
              className="icon-pdf" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span className="text-pdf">{t.pdfBtn}</span>
          </button>


          <button className="upload_button" onClick={() => pdfConnection.current.click()}>
            {t.uploadBtn}
          </button>
          <input type="file" accept=".pdf" style={{ display: 'none' }} ref={pdfConnection} onChange={handlePdfUpload} />
        </div>
        
      </div>

      {/* YAPAY ZEKA KONTROL ALANI (BAĞIMSIZ BÖLÜM) */}
      <div className="ai_section">
        <h2 className="ai_title">{t.aiTitle}</h2>

        <div className="ai_buttons">
          <button className="ai_btn excel_ai" onClick={() => handleAiAnalysis('excel')}>
            {t.aiExcelBtn}
          </button>
          <button className="ai_btn pdf_ai" onClick={() => handleAiAnalysis('pdf')}>
            {t.aiPdfBtn}
          </button>
        </div>

        {/* Mesaj veya Çöküş Uyarısı Bu Kutuda Çıkacak */}
        {aiMessage && (
          <div className="ai_message_box">
            <p>{aiMessage}</p>
          </div>
        )}
      </div>

      {/* MODAL PENCERESİ */}
      {pdfModalOn && (
        <div className="modal_overlay">
          <div className="modal_box">

            <h2 className="modal_title">{t.pdfBtn}</h2>
            
            <div className="modal_pdf_space">
              {pdfPreviewUrl ? (
                <iframe 
                  src={pdfPreviewUrl} 
                  width="100%" 
                  height="500px" 
                  style={{ border: 'none' }} 
                  title="PDF Önizleme"
                ></iframe>
              ) : (
                <p style={{color: '#888'}}>{t.pdfLoading}</p>
              )}
            </div>
            
            <div className="modal_buttons">
              <button className="modal_btn download_btn" onClick={handlePdfDownload}>
                {t.downloadBtn}
              </button>

              <button className="modal_btn close_btn" onClick={() => setPdfModalOn(false)}>
                {t.closeBtn}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* YARDIM (NASIL KULLANILIR) MODAL PENCERESİ */}
      {helpModalOn && (
        <div className="modal_overlay">
          <div className="modal_box help_modal_box">
            <h2 className="modal_title">{t.helpTitle}</h2>
            
            <div className="help_steps">
              <div className="step">
                <span className="step_number">1</span>
                <p><strong>{t.helpStep1Title}</strong> {t.helpStep1Desc}</p>
              </div>
              
              <div className="step">
                <span className="step_number">2</span>
                <p><strong>{t.helpStep2Title}</strong> {t.helpStep2Desc}</p>
              </div>
              
              <div className="step">
                <span className="step_number">3</span>
                <p><strong>{t.helpStep3Title}</strong> {t.helpStep3Desc}</p>
              </div>
              <div className="step">
                <span className="step_number">4</span>
                <p><strong>{t.helpStep4Title}</strong> {t.helpStep4Desc}</p>
              </div>
            </div>

            <div className="modal_buttons">
              <button 
                className="modal_btn close_btn" 
                onClick={() => setHelpModalOn(false)}
              >
                {t.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}

  </div>
  )
}

export default App