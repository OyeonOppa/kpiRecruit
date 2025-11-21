// ===============================
// Configuration - กรุณาแก้ไขค่าเหล่านี้
// ===============================

const CONFIG = {
  // Google Drive Folder IDs
  MAIN_FOLDER_ID: '1gbU-dEM48rVJFBkr_k9_au9VT9Ws7ylB',           // โฟลเดอร์หลักเก็บข้อมูลผู้สมัคร
  TEMPLATE_SLIDE_ID: '10FOJD-7Ru6HHHrWgRXKTfSf8tOMCouy3uqUbepvAtkk',     // Google Slides Template
  
  // Email Configuration
  ADMIN_EMAIL: 'worasit.ko@kpi.ac.th',                 // อีเมลแอดมิน
  APPLICANT_EMAIL_TEMPLATE: 'APPLICANT_TEMPLATE',  // ชื่อ template อีเมลผู้สมัคร (optional)
  
  // Organization Info
  ORG_NAME: 'องค์กร/หน่วยงาน',
  ORG_ADDRESS: 'ที่อยู่องค์กร'
};

// ===============================
// Main Function - รับข้อมูลจาก Frontend
// ===============================

function doPost(e) {
  try {
    // Parse JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Log for debugging
    Logger.log('Received application data');
    
    // Process application
    const result = processApplication(data);
    
    // Return response
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('❌ Error in doPost: ' + error.toString());
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===============================
// Process Application
// ===============================

function processApplication(data) {
  try {
    // 1. Create applicant folder
    const mainFolder = DriveApp.getFolderById(CONFIG.MAIN_FOLDER_ID);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const folderName = `${data.firstNameTH}_${data.lastNameTH}_${timestamp}`;
    const applicantFolder = mainFolder.createFolder(folderName);
    
    Logger.log('✓ Created folder: ' + folderName);
    
    // 2. Create PDF application from Slides template
    const pdfUrl = createApplicationPDF(data, applicantFolder);
    Logger.log('✓ Created PDF application');
    
    // 3. Save data to Google Sheets
    saveToSheet(data, applicantFolder.getUrl(), pdfUrl);
    Logger.log('✓ Saved to Google Sheets');
    
    // 4. Send emails
    sendApplicantEmail(data, pdfUrl);
    sendAdminEmail(data, applicantFolder.getUrl());
    Logger.log('✓ Sent emails');
    
    return {
      folderId: applicantFolder.getId(),
      folderUrl: applicantFolder.getUrl(),
      pdfUrl: pdfUrl
    };
    
  } catch (error) {
    Logger.log('❌ Error processing application: ' + error.toString());
    throw error;
  }
}

// ===============================
// Create PDF from Google Slides Template
// ===============================

function createApplicationPDF(data, folder) {
  try {
    // 1. Copy template
    const templateSlide = DriveApp.getFileById(CONFIG.TEMPLATE_SLIDE_ID);
    const slideName = `ใบสมัคร_${data.firstNameTH}_${data.lastNameTH}`;
    const newSlide = templateSlide.makeCopy(slideName, folder);
    
    // 2. Open presentation
    const presentation = SlidesApp.openById(newSlide.getId());
    const slides = presentation.getSlides();
    
    // 3. Replace placeholders in all slides
    slides.forEach(slide => {
      replacePlaceholdersInSlide(slide, data);
    });
    
    // 4. Insert photo if provided
    if (data.photo) {
      insertPhotoInSlide(slides, data.photo);
    }
    
    // 5. Save and close
    presentation.saveAndClose();
    SpreadsheetApp.flush(); // Ensure changes are saved
    Utilities.sleep(2000); // Wait for Google to process
    
    // 6. Export as PDF
    const pdfBlob = newSlide.getAs('application/pdf');
    pdfBlob.setName(slideName + '.pdf');
    const pdfFile = folder.createFile(pdfBlob);
    
    // 7. Delete temporary Slides file
    newSlide.setTrashed(true);
    
    return pdfFile.getUrl();
    
  } catch (error) {
    Logger.log('❌ Error creating PDF: ' + error.toString());
    throw error;
  }
}

// ===============================
// Replace Placeholders in Slide
// ===============================

function replacePlaceholdersInSlide(slide, data) {
  // Replace in shapes (text boxes)
  const shapes = slide.getShapes();
  shapes.forEach(shape => {
    try {
      const textRange = shape.getText();
      let text = textRange.asString();
      
      if (text.includes('{{') && text.includes('}}')) {
        text = replacePlaceholders(text, data);
        textRange.setText(text);
      }
    } catch (error) {
      // Some shapes may not have text
    }
  });
  
  // Replace in tables
  const tables = slide.getTables();
  tables.forEach(table => {
    for (let row = 0; row < table.getNumRows(); row++) {
      for (let col = 0; col < table.getNumColumns(); col++) {
        try {
          const cell = table.getCell(row, col);
          const textRange = cell.getText();
          let text = textRange.asString();
          
          if (text.includes('{{') && text.includes('}}')) {
            text = replacePlaceholders(text, data);
            textRange.setText(text);
          }
        } catch (error) {
          // Cell may not have text
        }
      }
    }
  });
}

// ===============================
// Replace All Placeholders
// ===============================

function replacePlaceholders(text, data) {
  let result = text;
  
  // Helper function
  const replace = (placeholder, value) => {
    const regex = new RegExp('\\{\\{' + placeholder + '\\}\\}', 'g');
    result = result.replace(regex, value || '-');
  };
  
  // Replace all fields
  replace('position', data.position);
  replace('department', data.department);
  
  replace('title', data.title);
  replace('firstNameTH', data.firstNameTH);
  replace('lastNameTH', data.lastNameTH);
  replace('fullnameTH', `${data.title}${data.firstNameTH} ${data.lastNameTH}`);
  replace('firstNameEN', data.firstNameEN);
  replace('lastNameEN', data.lastNameEN);
  replace('fullNameEN', `${data.firstNameEN} ${data.lastNameEN}`);
  
  replace('idCard', formatIDCard(data.idCard));
  replace('birthDate', formatDateThai(data.birthDate));
  replace('age', calculateAge(data.birthDate).toString());
  replace('gender', data.gender);
  replace('nationality', data.nationality);
  replace('religion', data.religion);
  replace('height', data.height);
  replace('weight', data.weight);
  replace('maritalStatus', data.maritalStatus);
  
  replace('addressID', data.addressID);
  replace('subdistrictID', data.subdistrictID);
  replace('districtID', data.districtID);
  replace('provinceID', data.provinceID);
  replace('postalCodeID', data.postalCodeID);
  replace('fullAddressID', formatFullAddress(
    data.addressID, 
    data.subdistrictID, 
    data.districtID, 
    data.provinceID, 
    data.postalCodeID
  ));
  
  replace('addressCurrent', data.addressCurrent);
  replace('subdistrictCurrent', data.subdistrictCurrent);
  replace('districtCurrent', data.districtCurrent);
  replace('provinceCurrent', data.provinceCurrent);
  replace('postalCodeCurrent', data.postalCodeCurrent);
  replace('fullAddressCurrent', formatFullAddress(
    data.addressCurrent, 
    data.subdistrictCurrent, 
    data.districtCurrent, 
    data.provinceCurrent, 
    data.postalCodeCurrent
  ));
  
  replace('phone', formatPhone(data.phone));
  replace('email', data.email);
  
  replace('emergencyName', data.emergencyName);
  replace('emergencyRelation', data.emergencyRelation);
  replace('emergencyPhone', formatPhone(data.emergencyPhone));
  replace('emergencyEmail', data.emergencyEmail);
  
  replace('educationLevel', data.educationLevel);
  replace('major', data.major);
  replace('university', data.university);
  replace('graduationYear', data.graduationYear);
  replace('gpa', data.gpa);
  
  replace('hasExperience', data.hasExperience);
  replace('lastCompany', data.lastCompany);
  replace('lastPosition', data.lastPosition);
  replace('yearsExperience', data.yearsExperience);
  replace('responsibilities', data.responsibilities);
  
  replace('date', formatDateThai(new Date()));
  replace('timestamp', new Date().toLocaleString('th-TH'));
  
  return result;
}

// ===============================
// Insert Photo in Slide
// ===============================

function insertPhotoInSlide(slides, photoBase64) {
  try {
    // Find the placeholder {{photo}} in slides
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const shapes = slide.getShapes();
      
      for (let j = 0; j < shapes.length; j++) {
        const shape = shapes[j];
        
        try {
          const text = shape.getText().asString();
          
          // Check if this shape contains {{photo}}
          if (text.includes('{{photo}}')) {
            // Get shape position and size
            const left = shape.getLeft();
            const top = shape.getTop();
            const width = shape.getWidth();
            const height = shape.getHeight();
            
            // Remove the placeholder text
            shape.getText().setText('');
            
            // Convert base64 to blob
            const imageData = photoBase64.split(',')[1]; // Remove data:image/...;base64,
            const imageBlob = Utilities.newBlob(
              Utilities.base64Decode(imageData), 
              'image/jpeg', 
              'photo.jpg'
            );
            
            // Insert image at the same position
            const image = slide.insertImage(imageBlob, left, top, width, height);
            
            Logger.log('✓ Inserted photo in slide ' + (i + 1));
            return; // Exit after inserting photo
          }
        } catch (error) {
          // Continue if shape has no text
        }
      }
    }
    
    Logger.log('⚠ {{photo}} placeholder not found in slides');
    
  } catch (error) {
    Logger.log('❌ Error inserting photo: ' + error.toString());
  }
}

// ===============================
// Save to Google Sheets
// ===============================

function saveToSheet(data, folderUrl, pdfUrl) {
  try {
    // Get or create spreadsheet
    const ss = getOrCreateSpreadsheet();
    const sheet = ss.getSheetByName('ผู้สมัคร') || ss.insertSheet('ผู้สมัคร');
    
    // Check if header exists
    if (sheet.getLastRow() === 0) {
      // Add header
      const headers = [
        'วันที่สมัคร', 'เวลา', 'ตำแหน่ง', 'หน่วยงาน',
        'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'ชื่อ (EN)', 'นามสกุล (EN)',
        'เลขบัตรประชาชน', 'วันเกิด', 'อายุ', 'เพศ', 'สัญชาติ', 'ศาสนา',
        'สถานภาพ', 'โทรศัพท์', 'อีเมล', 'ที่อยู่ปัจจุบัน',
        'การศึกษา', 'สาขา', 'สถาบัน', 'ปีที่จบ', 'GPA',
        'ประสบการณ์', 'บริษัทล่าสุด', 'ตำแหน่งล่าสุด', 'ปีประสบการณ์',
        'ลิงก์โฟลเดอร์', 'ลิงก์ PDF'
      ];
      sheet.appendRow(headers);
      
      // Format header
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1e3a8a');
      headerRange.setFontColor('#ffffff');
    }
    
    // Add data row
    const row = [
      formatDateThai(new Date()),
      new Date().toLocaleTimeString('th-TH'),
      data.position,
      data.department,
      data.title,
      data.firstNameTH,
      data.lastNameTH,
      data.firstNameEN,
      data.lastNameEN,
      data.idCard,
      formatDateThai(data.birthDate),
      calculateAge(data.birthDate),
      data.gender,
      data.nationality,
      data.religion,
      data.maritalStatus,
      data.phone,
      data.email,
      formatFullAddress(
        data.addressCurrent,
        data.subdistrictCurrent,
        data.districtCurrent,
        data.provinceCurrent,
        data.postalCodeCurrent
      ),
      data.educationLevel,
      data.major,
      data.university,
      data.graduationYear,
      data.gpa,
      data.hasExperience,
      data.lastCompany,
      data.lastPosition,
      data.yearsExperience,
      folderUrl,
      pdfUrl
    ];
    
    sheet.appendRow(row);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, row.length);
    
  } catch (error) {
    Logger.log('❌ Error saving to sheet: ' + error.toString());
    throw error;
  }
}

function getOrCreateSpreadsheet() {
  const folder = DriveApp.getFolderById(CONFIG.MAIN_FOLDER_ID);
  const files = folder.getFilesByName('ข้อมูลผู้สมัครงาน');
  
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  } else {
    const ss = SpreadsheetApp.create('ข้อมูลผู้สมัครงาน');
    const file = DriveApp.getFileById(ss.getId());
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
    return ss;
  }
}

// ===============================
// Send Email to Applicant
// ===============================

function sendApplicantEmail(data, pdfUrl) {
  try {
    const subject = `ยืนยันการสมัครงาน - ${data.position}`;
    
    const body = `
เรียน คุณ${data.firstNameTH} ${data.lastNameTH}

ขอบคุณที่สมัครงานตำแหน่ง ${data.position} ${CONFIG.ORG_NAME}

เราได้รับใบสมัครของคุณเรียบร้อยแล้ว ทางเราจะพิจารณาคุณสมบัติและติดต่อกลับภายใน 7-14 วันทำการ

ท่านสามารถดาวน์โหลดสำเนาใบสมัครได้ที่ลิงก์นี้:
${pdfUrl}

หากมีข้อสงสัยประการใด กรุณาติดต่อ:
อีเมล: ${CONFIG.ADMIN_EMAIL}

ขอแสดงความนับถือ
${CONFIG.ORG_NAME}
    `.trim();
    
    GmailApp.sendEmail(data.email, subject, body);
    Logger.log('✓ Sent email to applicant: ' + data.email);
    
  } catch (error) {
    Logger.log('❌ Error sending applicant email: ' + error.toString());
  }
}

// ===============================
// Send Email to Admin
// ===============================

function sendAdminEmail(data, folderUrl) {
  try {
    const subject = `[ใบสมัครใหม่] ${data.firstNameTH} ${data.lastNameTH} - ${data.position}`;
    
    const body = `
มีผู้สมัครงานใหม่

ข้อมูลผู้สมัคร:
- ชื่อ: ${data.title}${data.firstNameTH} ${data.lastNameTH}
- ตำแหน่ง: ${data.position}
- หน่วยงาน: ${data.department}
- อีเมล: ${data.email}
- โทรศัพท์: ${data.phone}
- การศึกษา: ${data.educationLevel} ${data.major}
- มหาวิทยาลัย: ${data.university}

โฟลเดอร์เอกสาร:
${folderUrl}

กรุณาตรวจสอบและดำเนินการต่อไป
    `.trim();
    
    GmailApp.sendEmail(CONFIG.ADMIN_EMAIL, subject, body);
    Logger.log('✓ Sent email to admin');
    
  } catch (error) {
    Logger.log('❌ Error sending admin email: ' + error.toString());
  }
}

// ===============================
// Utility Functions
// ===============================

function formatDateThai(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear() + 543;
  
  return `${day}/${month}/${year}`;
}

function calculateAge(birthDate) {
  if (!birthDate) return 0;
  
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

function formatIDCard(idCard) {
  if (!idCard || idCard.length !== 13) return idCard;
  
  return idCard.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5');
}

function formatPhone(phone) {
  if (!phone || phone.length !== 10) return phone;
  
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
}

function formatFullAddress(address, subdistrict, district, province, postalCode) {
  const parts = [];
  
  if (address) parts.push(address);
  if (subdistrict) parts.push(`ต.${subdistrict}`);
  if (district) parts.push(`อ.${district}`);
  if (province) parts.push(`จ.${province}`);
  if (postalCode) parts.push(postalCode);
  
  return parts.join(' ') || '-';
}

// ===============================
// Test Function
// ===============================

function testApplication() {
  const testData = {
    position: 'นักวิชาการ',
    department: 'ฝ่ายบริหาร',
    title: 'นาย',
    firstNameTH: 'ทดสอบ',
    lastNameTH: 'ระบบ',
    firstNameEN: 'Test',
    lastNameEN: 'System',
    idCard: '1234567890123',
    birthDate: '1990-01-01',
    gender: 'ชาย',
    nationality: 'ไทย',
    religion: 'พุทธ',
    height: '170',
    weight: '65',
    maritalStatus: 'โสด',
    addressID: '123/45',
    subdistrictID: 'ทดสอบ',
    districtID: 'ทดสอบ',
    provinceID: 'กรุงเทพมหานคร',
    postalCodeID: '10100',
    addressCurrent: '123/45',
    subdistrictCurrent: 'ทดสอบ',
    districtCurrent: 'ทดสอบ',
    provinceCurrent: 'กรุงเทพมหานคร',
    postalCodeCurrent: '10100',
    phone: '0812345678',
    email: 'test@example.com',
    emergencyName: 'ทดสอบ ฉุกเฉิน',
    emergencyRelation: 'บิดา',
    emergencyPhone: '0898765432',
    emergencyEmail: 'emergency@example.com',
    educationLevel: 'ปริญญาตรี',
    major: 'วิทยาศาสตร์คอมพิวเตอร์',
    university: 'มหาวิทยาลัยทดสอบ',
    graduationYear: '2560',
    gpa: '3.50',
    hasExperience: 'มี',
    lastCompany: 'บริษัททดสอบ',
    lastPosition: 'โปรแกรมเมอร์',
    yearsExperience: '2',
    responsibilities: 'พัฒนาระบบ'
  };
  
  const result = processApplication(testData);
  Logger.log('Test result: ' + JSON.stringify(result));
}
