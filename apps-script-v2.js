// ===============================
// Configuration
// ===============================

const CONFIG = {
  MAIN_FOLDER_ID: '1MJ5AS9RDkMPMJFTO9n1NmTU1alzEhcIe',           // โฟลเดอร์หลัก
  TEMPLATE_SLIDE_ID: '10FOJD-7Ru6HHHrWgRXKTfSf8tOMCouy3uqUbepvAtkk',     // Google Slides Template
  ADMIN_EMAIL: 'worasit.ko@kpi.ac.th',                    // อีเมล HR
  ORG_NAME: 'สถาบันพระปกเกล้า',
  ORG_ADDRESS: 'ศูนย์ราชการเฉลิมพระเกียรติ 80 พรรษา อาคารรัฐประศาสนภักดี ชั้น 5 ฝั่งทิศใต้ เลขที่ 120 หมู่ 3 ถนนแจ้งวัฒนะ แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพ 10210',
  LOGO_URL: 'https://kpi.ac.th/wp-content/uploads/2025/03/KPI-LOGO-PNG-01.png'
};

// ===============================
// Main Function
// ===============================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    Logger.log('✓ Received application data');
    
    const result = processApplication(data);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===============================
// Email Templates - Fixed Version
// ===============================

function createEmailTemplate(content) {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Sarabun', 'Segoe UI', Tahoma, sans-serif;
      background-color: #f4f6f8;
      -webkit-font-smoothing: antialiased;
    }
    /* รองรับ Dark Mode */
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #1a1a1a;
      }
      .email-container {
        background-color: #2d2d2d !important;
        border: 1px solid #404040;
      }
      .content {
        color: #e0e0e0 !important;
      }
      .greeting, .section-title {
        color: #4ade80 !important;
      }
      .message {
        color: #d1d5db !important;
      }
      .info-box {
        background: #1f2937 !important;
        border-left-color: #4ade80 !important;
      }
      .info-box h3 {
        color: #4ade80 !important;
      }
      .info-label {
        color: #d1d5db !important;
      }
      .info-value {
        color: #9ca3af !important;
      }
      .highlight {
        background: #374151 !important;
        border-left-color: #fbbf24 !important;
        color: #e0e0e0 !important;
      }
      .footer {
        background-color: #1f2937 !important;
        border-top-color: #404040 !important;
      }
      .footer-text {
        color: #9ca3af !important;
      }
      .signature {
        color: #d1d5db !important;
        border-top-color: #404040 !important;
      }
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #0f5132 0%, #198754 100%);
      padding: 30px 20px;
      text-align: center;
      border-bottom: 4px solid #b8922a;
    }
.logo {
  width: 80px;          /* เพิ่มจาก 80px */
  height: 80px;         /* เพิ่มจาก 80px */
  margin: 0 auto 15px;
  border-radius: 12px;   /* เปลี่ยนจากวงกลม (50%) เป็นมุมโค้งนิดหน่อย */
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .header p {
      color: #e9ecef;
      margin: 8px 0 0;
      font-size: 14px;
    }
    .content {
      padding: 30px 25px;
      color: #343a40;
      line-height: 1.8;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #0f5132;
      margin-bottom: 15px;
    }
    .message {
      font-size: 15px;
      color: #495057;
      margin-bottom: 20px;
    }
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #0f5132;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 6px;
    }
    .info-box h3 {
      color: #0f5132;
      font-size: 16px;
      margin: 0 0 10px;
      font-weight: 600;
    }
    .info-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #495057;
      min-width: 120px;
      font-size: 14px;
    }
    .info-value {
      color: #6c757d;
      flex: 1;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #0f5132 0%, #198754 100%);
      color: #ffffff !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(15, 81, 50, 0.3);
    }
    .divider {
      height: 2px;
      background: linear-gradient(90deg, transparent, #b8922a, transparent);
      margin: 25px 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 25px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    .footer-title {
      color: #0f5132;
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 8px;
    }
    .footer-text {
      color: #6c757d;
      font-size: 13px;
      line-height: 1.6;
      margin: 5px 0;
    }
    .footer-contact {
      color: #495057;
      font-size: 13px;
      margin-top: 12px;
    }
    .footer-contact a {
      color: #0f5132;
      text-decoration: none;
      font-weight: 500;
    }
    .signature {
      margin-top: 25px;
      padding-top: 20px;
      border-top: 2px solid #e9ecef;
      font-size: 14px;
      color: #495057;
    }
    .signature-name {
      font-weight: 600;
      color: #0f5132;
    }
    .highlight {
      background: linear-gradient(120deg, #fff3cd 0%, #ffe69c 100%);
      padding: 12px 16px;
      border-radius: 6px;
      border-left: 4px solid #b8922a;
      margin: 15px 0;
      font-size: 14px;
    }
    .status-badge {
      display: inline-block;
      background: #d4edda;
      color: #155724;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      margin: 10px 0;
    }
    /* Icons แบบ Safe สำหรับ Email */
    .icon {
      display: inline-block;
      width: 20px;
      height: 20px;
      line-height: 20px;
      text-align: center;
      margin-right: 5px;
      font-weight: bold;
    }
    .icon-check { color: #28a745; }
    .icon-info { color: #17a2b8; }
    .icon-doc { color: #6c757d; }
    .icon-folder { color: #ffc107; }
    .icon-time { color: #fd7e14; }
    .icon-mail { color: #007bff; }
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 10px;
        border-radius: 8px;
      }
      .content {
        padding: 20px 15px;
      }
      .header {
        padding: 25px 15px;
      }
      .info-row {
        flex-direction: column;
      }
      .info-label {
        min-width: auto;
        margin-bottom: 4px;
      }
      .button {
        display: block;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    ${content}
  </div>
</body>
</html>
  `;
}

// ===============================
// Process Application
// ===============================

function processApplication(data) {
  try {
    Logger.log('='.repeat(50));
    Logger.log('🚀 Starting processApplication');
    Logger.log('='.repeat(50));
    
    // Log basic info
    Logger.log('📋 Applicant: ' + data.fullnameTH);
    Logger.log('📋 Position: ' + data.position);
    Logger.log('📸 Has photo: ' + (data.photo ? 'Yes' : 'No'));
    Logger.log('📄 Has documents: ' + (data.documents ? 'Yes' : 'No'));
    
    if (data.documents) {
      Logger.log('Documents provided:');
      for (const [key, value] of Object.entries(data.documents)) {
        if (value && value.data) {
          const dataLength = value.data.length;
          Logger.log(`  - ${key}: ${value.name} (${dataLength} chars)`);
        }
      }
    }
    
    // 1. Get/Create folder structure
    const folders = getOrCreateFolderStructure();
    Logger.log('✓ Got folder structure');
    
    // 2. Create applicant folder
    const timestamp = Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd_HHmmss');
    const folderName = `${data.fullnameTH}_${timestamp}`;
    const applicantFolder = folders.applicants.createFolder(folderName);
    
    Logger.log('✓ Created folder: ' + folderName);
    Logger.log('  Folder ID: ' + applicantFolder.getId());
    
    // 3. Save documents to applicant folder
    if (data.documents) {
      Logger.log('📄 Attempting to save documents...');
      const savedCount = saveDocuments(data.documents, applicantFolder);
      Logger.log(`✓ Saved ${savedCount} document(s)`);
    } else {
      Logger.log('⚠ No documents to save');
    }
    
    // 4. Create PDF application
    Logger.log('📑 Creating PDF application...');
    const pdfUrl = createApplicationPDF(data, folders.applications, folderName);
    Logger.log('✓ Created PDF: ' + pdfUrl);
    
    // 5. Save to Google Sheets
    Logger.log('📊 Saving to Google Sheets...');
    saveToSheet(data, applicantFolder.getUrl(), pdfUrl);
    Logger.log('✓ Saved to Sheets');
    
    // 6. Send emails
    Logger.log('📧 Sending emails...');
    sendApplicantEmail(data, pdfUrl);
//  sendAdminEmail(data, applicantFolder.getUrl(), pdfUrl);
    Logger.log('✓ Sent emails');
    
    Logger.log('='.repeat(50));
    Logger.log('✅ Process completed successfully!');
    Logger.log('='.repeat(50));
    
    return {
      folderId: applicantFolder.getId(),
      folderUrl: applicantFolder.getUrl(),
      pdfUrl: pdfUrl
    };
    
  } catch (error) {
    Logger.log('='.repeat(50));
    Logger.log('❌ Error in processApplication');
    Logger.log('Error: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    Logger.log('='.repeat(50));
    throw error;
  }
}

// ===============================
// Save Documents
// ===============================

function saveDocuments(documents, folder) {
  try {
    Logger.log('📄 Starting to save documents...');
    
    if (!documents) {
      Logger.log('⚠ No documents data provided');
      return 0;
    }
    
    const docNames = {
      diplomaCopy: 'สำเนาปริญญาบัตร',
      nationalIDCopy: 'สำเนาบัตรประชาชน',
      certificateofQualificationCopy: 'สำเนาใบรับรองคุณวุฒิ',
      workpassCopy: 'หลักฐานการผ่านงาน',
      transcriptCopy: 'สำเนาใบรายงานผลการศึกษา',
      militaryCertificateCopy: 'หลักฐานการผ่านเกณฑ์ทหาร',
      houseRegistrationCopy: 'สำเนาทะเบียนบ้าน'
    };
    
    let savedCount = 0;
    
    for (const [key, value] of Object.entries(documents)) {
      Logger.log(`Processing ${key}...`);
      
      if (value && value.data) {
        try {
          let fileData = value.data;
          
          // ถ้ามี data URL prefix ให้แยกออก
          if (value.data.includes(',')) {
            const base64Parts = value.data.split(',');
            fileData = base64Parts[1];
            Logger.log(`  Extracted base64 data (length: ${fileData.length})`);
          }
          
          // Decode base64
          const decodedData = Utilities.base64Decode(fileData);
          Logger.log(`  Decoded data (size: ${decodedData.length} bytes)`);
          
          // สร้าง blob
          const fileBlob = Utilities.newBlob(
            decodedData,
            'application/pdf',
            `${docNames[key]}.pdf`
          );
          
          // บันทึกไฟล์
          const savedFile = folder.createFile(fileBlob);
          savedCount++;
          
          Logger.log(`✓ Saved: ${docNames[key]} (${savedFile.getSize()} bytes)`);
          
        } catch (error) {
          Logger.log(`❌ Error saving ${key}: ${error.toString()}`);
          Logger.log(`   Stack: ${error.stack}`);
        }
      } else {
        Logger.log(`  Skipped ${key} (no data)`);
      }
    }
    
    Logger.log(`✓ Saved ${savedCount} document(s) to folder`);
    return savedCount;
    
  } catch (error) {
    Logger.log('❌ Error in saveDocuments: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    return 0;
  }
}

// ===============================
// Folder Structure
// ===============================

function getOrCreateFolderStructure() {
  const mainFolder = DriveApp.getFolderById(CONFIG.MAIN_FOLDER_ID);
  
  // Get or create "Applications (PDF)" folder
  let applicationsFolder;
  const appFolders = mainFolder.getFoldersByName('Applications (PDF)');
  if (appFolders.hasNext()) {
    applicationsFolder = appFolders.next();
  } else {
    applicationsFolder = mainFolder.createFolder('Applications (PDF)');
  }
  
  // Get or create "Applicants" folder
  let applicantsFolder;
  const applFolders = mainFolder.getFoldersByName('Applicants');
  if (applFolders.hasNext()) {
    applicantsFolder = applFolders.next();
  } else {
    applicantsFolder = mainFolder.createFolder('Applicants');
  }
  
  return {
    main: mainFolder,
    applications: applicationsFolder,
    applicants: applicantsFolder
  };
}

// ===============================
// Create PDF
// ===============================

function createApplicationPDF(data, folder, fileName) {
  try {
    const templateSlide = DriveApp.getFileById(CONFIG.TEMPLATE_SLIDE_ID);
    const newSlide = templateSlide.makeCopy(fileName, folder);
    
    const presentation = SlidesApp.openById(newSlide.getId());
    const slides = presentation.getSlides();
    
    // IMPORTANT: Insert photo FIRST before replacing other placeholders
    // This is because we need to find {{photo}} text placeholder
    if (data.photo) {
      Logger.log('📸 Inserting photo first...');
      const photoInserted = insertPhotoInSlide(slides, data.photo);
      if (photoInserted) {
        Logger.log('✓ Photo inserted successfully');
      } else {
        Logger.log('⚠ Photo insertion failed or {{photo}} not found');
      }
    } else {
      Logger.log('⚠ No photo data provided');
    }
    
    // Now replace all other placeholders
    Logger.log('📝 Replacing text placeholders...');
    slides.forEach(slide => {
      replacePlaceholdersInSlide(slide, data);
    });
    Logger.log('✓ Text placeholders replaced');
    
    presentation.saveAndClose();
    Utilities.sleep(2000);
    
    const pdfBlob = newSlide.getAs('application/pdf');
    pdfBlob.setName(fileName + '.pdf');
    const pdfFile = folder.createFile(pdfBlob);
    
    newSlide.setTrashed(true);
    
    return pdfFile.getUrl();
    
  } catch (error) {
    Logger.log('❌ Error creating PDF: ' + error.toString());
    throw error;
  }
}

// ===============================
// Replace Placeholders
// ===============================

function replacePlaceholdersInSlide(slide, data) {
  const shapes = slide.getShapes();
  shapes.forEach(shape => {
    try {
      const textRange = shape.getText();
      let text = textRange.asString();
      
      if (text.includes('{{') && text.includes('}}')) {
        text = replacePlaceholders(text, data);
        textRange.setText(text);
      }
    } catch (error) {}
  });
  
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
        } catch (error) {}
      }
    }
  });
}

function replacePlaceholders(text, data) {
  let result = text;
  
  const replace = (placeholder, value) => {
    const regex = new RegExp('\\{\\{' + placeholder + '\\}\\}', 'g');
    result = result.replace(regex, value || '-');
  };
  
  // Page 1: Consent
  replace('fullnameTH', data.fullnameTH);
  replace('date', formatDateThai(new Date()));
  
  // Page 2: Basic Info
  // Note: {{photo}} will be replaced by insertPhotoInSlide() function
  // Do not replace it here!
  replace('position', data.position);
  replace('department', data.department);
  replace('checkbox1', data.checkbox1 ? '☑' : '');
  replace('salary', data.salary);
  replace('startDate', formatDateThai(data.startDate));
  replace('experienceDetail', data.experienceDetail);
  
  replace('fullnameEN', data.fullnameEN);
  replace('addressNow', data.addressNow);
  replace('tel', formatPhone(data.tel));
  replace('email', data.email);
  
  // Address Type
  replace('addressType\\[me\\]', data.addressType === 'me' ? '☑' : '');
  replace('addressType\\[parent\\]', data.addressType === 'parent' ? '☑' : '');
  replace('addressType\\[rent\\]', data.addressType === 'rent' ? '☑' : '');
  
  replace('addressHometown', data.addressHometown);
  
  replace('dateOfbirth', formatDateThai(data.dateOfbirth));
  replace('age', data.age);
  replace('weight', data.weight);
  replace('height', data.height);
  replace('placeofresidence', data.placeofresidence);
  replace('nationality', data.nationality);
  replace('religion', data.religion);
  replace('bloodtype', data.bloodtype);
  replace('national_id', formatIDCard(data.national_id));
  replace('expired', formatDateThai(data.expired));
  replace('place_idcard', data.place_idcard);
  
  // Military Status
  const militaryStatuses = ['Exempted', 'Not yet', 'Studied', 'Already'];
  militaryStatuses.forEach(status => {
    replace('militaryStatus\\[' + status + '\\]', data.militaryStatus === status ? '☑' : '');
  });
  
  // Marital Status
  const maritalStatuses = ['Single', 'Married', 'Living apart', 'widow', 'divorce'];
  maritalStatuses.forEach(status => {
    replace('maritalStatus\\[' + status + '\\]', data.maritalStatus === status ? '☑' : '');
  });
  
  // Contact Person
  replace('contactpersonName', data.contactpersonName);
  replace('contactpersonRelationship', data.contactpersonRelationship);
  replace('contactpersonAddress', data.contactpersonAddress);
  replace('contactpersonTel', formatPhone(data.contactpersonTel));
  replace('contactpersonEmail', data.contactpersonEmail);
  
  // Page 3: Education (1-4)
  for (let i = 1; i <= 4; i++) {
    replace('educationLevel' + i, data['educationLevel' + i]);
    replace('eduSincetheyear' + i, data['eduSincetheyear' + i]);
    replace('eduUntiltheyear' + i, data['eduUntiltheyear' + i]);
    replace('nameofEducation' + i, data['nameofEducation' + i]);
    replace('qualifications' + i, data['qualifications' + i]);
    replace('fieldofStudy' + i, data['fieldofStudy' + i]);
    replace('gpa' + i, data['gpa' + i]);
  }
  
  // Studying
  replace('studying', data.studying ? '☑' : '');
  replace('studyfieldofStudy', data.studyfieldofStudy);
  replace('studyfieldType', data.studyfieldType);
  replace('nameofeducationNow', data.nameofeducationNow);
  
  const studySections = ['normalSection', 'eveningSection', 'otherSection'];
  studySections.forEach(section => {
    replace('studying\\[' + section + '\\]', data.studyingSection === section ? '☑' : '');
  });
  
  replace('expectedgraduationYear', data.expectedgraduationYear);
  
  // Experience (1-3)
  for (let i = 1; i <= 3; i++) {
    replace('companyName' + i, data['companyName' + i]);
    replace('businessType' + i, data['businessType' + i]);
    replace('companyAddress' + i, data['companyAddress' + i]);
    replace('companyTel' + i, formatPhone(data['companyTel' + i]));
    replace('jobDescription' + i, data['jobDescription' + i]);
    replace('comp' + i + 'Start', formatDateThai(data['comp' + i + 'Start']));
    replace('comp' + i + 'End', formatDateThai(data['comp' + i + 'End']));
    replace('comp' + i + 'positionStart', data['comp' + i + 'positionStart']);
    replace('comp' + i + 'positionEnd', data['comp' + i + 'positionEnd']);
    replace('comp' + i + 'salaryStart', data['comp' + i + 'salaryStart']);
    replace('comp' + i + 'salaryEnd', data['comp' + i + 'salaryEnd']);
    replace('comp' + i + 'salaryEtc', data['comp' + i + 'salaryEtc']);
    replace('comp' + i + 'Reasonsforleaving', data['comp' + i + 'Reasonsforleaving']);
  }
  
  // Page 4: Training (1-5)
  for (let i = 1; i <= 5; i++) {
    replace('course' + i, data['course' + i]);
    replace('coursePlace' + i, data['coursePlace' + i]);
    replace('diploma' + i, data['diploma' + i]);
    replace('coursesTime' + i, data['coursesTime' + i]);
  }
  
  replace('academicWorks', data.academicWorks);
  replace('computerSkill', data.computerSkill);
  
  // Language (1-3)
  for (let i = 1; i <= 3; i++) {
    replace('languegeSkill' + i, data['languegeSkill' + i]);
    replace('speak' + i, data['speak' + i]);
    replace('read' + i, data['read' + i]);
    replace('write' + i, data['write' + i]);
    replace('listen' + i, data['listen' + i]);
  }
  
  replace('otherAbilities', data.otherAbilities);
  replace('hobbiesandotherInterests', data.hobbiesandotherInterests);
  replace('sport1', data.sport1);
  replace('sport2', data.sport2);
  replace('sport3', data.sport3);
  
  // Family
  replace('fatherFullname', data.fatherFullname);
  replace('fatherAge', data.fatherAge);
  replace('fatherJob', data.fatherJob);
  replace('fatherofficeAddress', data.fatherofficeAddress);
  replace('fatherofficeTel', formatPhone(data.fatherofficeTel));
  
  replace('motherFullname', data.motherFullname);
  replace('motherAge', data.motherAge);
  replace('motherJob', data.motherJob);
  replace('motherofficeAddress', data.motherofficeAddress);
  replace('motherofficeTel', formatPhone(data.motherofficeTel));
  
  // Husband/Wife
  replace('husbandwifeFullname', data.husbandwifeFullname);
  replace('husbandwifeAge', data.husbandwifeAge);
  replace('husbandwifeJob', data.husbandwifeJob);
  replace('husbandwifeAddress', data.husbandwifeAddress);
  replace('husbandwifeofficeTel', formatPhone(data.husbandwifeofficeTel));
  
  replace('numberofSiblings', data.numberofSiblings);
  
  // Siblings (1-5)
  for (let i = 1; i <= 5; i++) {
    replace('siblingFullname' + i, data['siblingFullname' + i]);
    replace('siblingAge' + i, data['siblingAge' + i]);
    replace('siblingJob' + i, data['siblingJob' + i]);
    replace('siblingofficeAddress' + i, data['siblingofficeAddress' + i]);
    replace('siblingofficeTel' + i, formatPhone(data['siblingofficeTel' + i]));
  }
  
  replace('noChildren', data.noChildren ? '☑' : '');
  replace('numberofChildren', data.numberofChildren);
  
  // Page 5: Health
  replace('physicalimpairmentNo', data.physicalimpairmentNo ? '☑' : '');
  replace('physicalimpairmentType', data.physicalimpairmentType);
  replace('illnessoraccidentTypeNo', data.illnessoraccidentTypeNo ? '☑' : '');
  replace('illnessoraccidentType', data.illnessoraccidentType);
  
  const healthStatuses = ['Excellent', 'Good', 'Poor', 'Bad'];
  healthStatuses.forEach(status => {
    replace('health\\[' + status + '\\]', data.health === status ? '☑' : '');
  });
  
  replace('bankruptorcommittedaCriminalNo', data.bankruptorcommittedaCriminalNo ? '☑' : '');
  replace('bankruptorcommittedaCriminaldetail', data.bankruptorcommittedaCriminaldetail);
  replace('firedfromaJobNo', data.firedfromaJobNo ? '☑' : '');
  replace('firedfromaJobreason', data.firedfromaJobreason);
  replace('acquaintanceattheKPINo', data.acquaintanceattheKPINo ? '☑' : '');
  replace('acquaintanceattheKPIname', data.acquaintanceattheKPIname);
  replace('additionalInformation', data.additionalInformation);
  
  // References (1-3)
  for (let i = 1; i <= 3; i++) {
    replace('referencepersonName' + i, data['referencepersonName' + i]);
    replace('referencepersonJob' + i, data['referencepersonJob' + i]);
    replace('referencepersonofficeAddress' + i, data['referencepersonofficeAddress' + i]);
    replace('referencepersonTel' + i, formatPhone(data['referencepersonTel' + i]));
  }
  
  // Documents (just labels, actual files uploaded separately)
  replace('diplomaCopy', data.documents && data.documents.diplomaCopy ? '☑' : '');
  replace('houseRegistrationCopy', data.documents && data.documents.houseRegistrationCopy ? '☑' : '');
  replace('nationalIDCopy', data.documents && data.documents.nationalIDCopy ? '☑' : '');
  replace('certificateofQualificationCopy', data.documents && data.documents.certificateofQualificationCopy ? '☑' : '');
  replace('workpassCopy', data.documents && data.documents.workpassCopy ? '☑' : '');
  replace('transcriptCopy', data.documents && data.documents.transcriptCopy ? '☑' : '');
  replace('militaryCertificateCopy', data.documents && data.documents.militaryCertificateCopy ? '☑' : '');
  
  return result;
}

// ===============================
// Insert Photo
// ===============================

function insertPhotoInSlide(slides, photoBase64) {
  try {
    if (!photoBase64) {
      Logger.log('⚠ No photo data provided');
      return;
    }
    
    Logger.log('📸 Attempting to insert photo...');
    
    // แยก base64 data
    let imageData = photoBase64;
    let mimeType = 'image/jpeg';
    
    // ถ้ามี data URL prefix ให้แยกออก
    if (photoBase64.includes(',')) {
      const base64Parts = photoBase64.split(',');
      imageData = base64Parts[1];
      
      // ดึง MIME type
      const mimeMatch = base64Parts[0].match(/:(.*?);/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }
    
    Logger.log('MIME Type: ' + mimeType);
    
    // ค้นหา {{photo}} placeholder
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const shapes = slide.getShapes();
      
      Logger.log(`Checking slide ${i + 1}, shapes: ${shapes.length}`);
      
      for (let j = 0; j < shapes.length; j++) {
        const shape = shapes[j];
        
        try {
          const textRange = shape.getText();
          const text = textRange.asString();
          
          Logger.log(`  Shape ${j}: "${text.substring(0, 50)}"`);
          
          if (text.indexOf('{{photo}}') !== -1) {
            Logger.log('✓ Found {{photo}} placeholder!');
            
            // เก็บตำแหน่งและขนาด
            const left = shape.getLeft();
            const top = shape.getTop();
            const width = shape.getWidth();
            const height = shape.getHeight();
            
            Logger.log(`Position: left=${left}, top=${top}, width=${width}, height=${height}`);
            
            try {
              // Decode base64
              const decodedData = Utilities.base64Decode(imageData);
              
              // สร้าง blob
              const imageBlob = Utilities.newBlob(decodedData, mimeType, 'photo.jpg');
              
              Logger.log('✓ Created image blob');
              
              // ลบ shape เดิม
              shape.remove();
              Logger.log('✓ Removed placeholder shape');
              
              // แทรกรูป
              const insertedImage = slide.insertImage(imageBlob, left, top, width, height);
              Logger.log('✓ Successfully inserted photo in slide ' + (i + 1));
              
              return true;
              
            } catch (imgError) {
              Logger.log('❌ Error creating/inserting image: ' + imgError.toString());
              throw imgError;
            }
          }
        } catch (shapeError) {
          // Shape อาจไม่มี text, ข้ามไป
          Logger.log(`  Shape ${j}: No text or error - ${shapeError.toString()}`);
        }
      }
    }
    
    Logger.log('⚠ {{photo}} placeholder not found in any slide');
    return false;
    
  } catch (error) {
    Logger.log('❌ Error in insertPhotoInSlide: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    return false;
  }
}

// ===============================
// Save to Sheet
// ===============================

function saveToSheet(data, folderUrl, pdfUrl) {
  try {
    const ss = getOrCreateSpreadsheet();
    const sheet = ss.getSheetByName('ผู้สมัคร') || ss.insertSheet('ผู้สมัคร');
    
    if (sheet.getLastRow() === 0) {
      const headers = [
        'วันที่สมัคร', 'เวลา', 'ตำแหน่ง', 'หน่วยงาน',
        'ชื่อ – สกุล', 'วันเกิด', 'อายุ',
        'วุฒิการศึกษา', 'สาขาวิชา', 'ปีที่จบ', 'เกรดเฉลี่ย', 'สถานศึกษา',
        'สถานภาพ',
        'ประสบการณ์ 1 - ตำแหน่ง/ลักษณะงาน', 'ประสบการณ์ 1 - หน่วยงาน', 'ประสบการณ์ 1 - ระยะเวลา',
        'ประสบการณ์ 2 - ตำแหน่ง/ลักษณะงาน', 'ประสบการณ์ 2 - หน่วยงาน', 'ประสบการณ์ 2 - ระยะเวลา',
        'อัตราเงินเดือนที่ต้องการ',
        'ลิงก์โฟลเดอร์', 'ลิงก์ PDF'
      ];
      sheet.appendRow(headers);
      
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1e3a8a');
      headerRange.setFontColor('#ffffff');
    }
    
    // ฟังก์ชันสำหรับสร้างช่วงระยะเวลา
    const formatPeriod = (start, end) => {
      if (!start && !end) return '-';
      const startDate = start ? formatDateThai(start) : '';
      const endDate = end ? formatDateThai(end) : 'ปัจจุบัน';
      return startDate && endDate ? `${startDate} - ${endDate}` : '-';
    };
    
    // ฟังก์ชันรวมตำแหน่งและลักษณะงาน
    const formatJobInfo = (position, description) => {
      const pos = position || '';
      const desc = description || '';
      if (pos && desc) return `${pos} / ${desc}`;
      if (pos) return pos;
      if (desc) return desc;
      return '-';
    };
    
    const row = [
      formatDateThai(new Date()),
      Utilities.formatDate(new Date(), 'GMT+7', 'HH:mm:ss'),
      data.position,
      data.department || '-',
      data.fullnameTH,
      formatDateThai(data.dateOfbirth),
      data.age,
      data.educationLevel1 || '-',
      data.fieldofStudy1 || '-',
      data.eduUntiltheyear1 || '-',
      data.gpa1 || '-',
      data.nameofEducation1 || '-',
      data.maritalStatus || '-',
      // ประสบการณ์ 1
      formatJobInfo(data.comp1positionEnd, data.jobDescription1),
      data.companyName1 || '-',
      formatPeriod(data.comp1Start, data.comp1End),
      // ประสบการณ์ 2
      formatJobInfo(data.comp2positionEnd, data.jobDescription2),
      data.companyName2 || '-',
      formatPeriod(data.comp2Start, data.comp2End),
      data.salary,
      folderUrl,
      pdfUrl
    ];
    
    sheet.appendRow(row);
    sheet.autoResizeColumns(1, row.length);
    
  } catch (error) {
    Logger.log('❌ Error saving to sheet: ' + error.toString());
    throw error;
  }
}

function getOrCreateSpreadsheet() {
  const folders = getOrCreateFolderStructure();
  const files = folders.main.getFilesByName('ข้อมูลผู้สมัครงาน');
  
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  } else {
    const ss = SpreadsheetApp.create('ข้อมูลผู้สมัครงาน');
    const file = DriveApp.getFileById(ss.getId());
    folders.main.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
    return ss;
  }
}

// ===============================
// อีเมลผู้สมัคร - ไม่มีปุ่มดาวน์โหลด
// ===============================

function sendApplicantEmail(data, pdfUrl) {
  try {
    const subject = `[✓] ยืนยันการสมัครงาน - ${data.position} - ${CONFIG.ORG_NAME}`;
    
    const emailContent = `
      <div class="header">
<div class="logo">
  <img src="${CONFIG.LOGO_URL}" 
       alt="${CONFIG.ORG_NAME}" 
       style="width: 100%; height: 100%; object-fit: contain; padding: 8px;">
</div>
        <h1>${CONFIG.ORG_NAME}</h1>
        <p>ระบบรับสมัครงานออนไลน์</p>
      </div>
      
      <div class="content">
        <div class="greeting">
          เรียน คุณ${data.fullnameTH}
        </div>
        
        <div class="status-badge">
          <span class="icon icon-check">✓</span> ได้รับใบสมัครเรียบร้อยแล้ว
        </div>
        
        <div class="message">
          ขอขอบคุณที่ท่านให้ความสนใจสมัครงานกับ${CONFIG.ORG_NAME} 
          เราได้รับใบสมัครของท่านเรียบร้อยแล้ว และขณะนี้อยู่ระหว่างการพิจารณา
        </div>
        
        <div class="info-box">
          <h3><span class="icon icon-info">i</span> ข้อมูลการสมัคร</h3>
          <div class="info-row">
            <span class="info-label">ตำแหน่ง:</span>
            <span class="info-value"><strong>${data.position}</strong></span>
          </div>
          ${data.department ? `
          <div class="info-row">
            <span class="info-label">หน่วยงาน:</span>
            <span class="info-value">${data.department}</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">วันที่สมัคร:</span>
            <span class="info-value">${formatDateThai(new Date())}</span>
          </div>
          <div class="info-row">
            <span class="info-label">อีเมล:</span>
            <span class="info-value">${data.email}</span>
          </div>
          <div class="info-row">
            <span class="info-label">โทรศัพท์:</span>
            <span class="info-value">${data.tel}</span>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="highlight">
          <strong><span class="icon icon-time">⏱</span> ระยะเวลาพิจารณา:</strong> ทางสถาบันฯ จะพิจารณาคุณสมบัติและติดต่อกลับภายใน 
          <strong>7-14 วันทำการ</strong>
        </div>
        
        <div class="message" style="font-size: 14px; color: #6c757d;">
          <strong>หมายเหตุ:</strong> 
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>หากท่านผ่านการพิจารณาเบื้องต้น ทางสถาบันฯ จะติดต่อเพื่อนัดหมายสัมภาษณ์</li>
            <li>หากไม่ได้รับการติดต่อภายใน 14 วันทำการ อาจหมายความว่าท่านไม่ผ่านการพิจารณาในครั้งนี้</li>
            <li>ท่านสามารถติดตามข่าวสารการรับสมัครงานเพิ่มเติมได้ที่เว็บไซต์สถาบันฯ</li>
          </ul>
        </div>
        
        <div class="signature">
          <div style="text-align: center;">
            <div class="signature-name">${CONFIG.ORG_NAME}</div>
            <div style="color: #6c757d; font-size: 13px; margin-top: 5px;">
              ฝ่ายทรัพยากรบุคคล
            </div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <div class="footer-title">${CONFIG.ORG_NAME}</div>
        <p class="footer-text">${CONFIG.ORG_ADDRESS}</p>
        <div class="footer-contact">
          <span class="icon icon-mail">@</span> อีเมล: <a href="mailto:${CONFIG.ADMIN_EMAIL}">${CONFIG.ADMIN_EMAIL}</a>
        </div>
        <p class="footer-text" style="margin-top: 15px; font-size: 12px; color: #868e96;">
          อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับ<br>
          &copy; ${new Date().getFullYear()} ${CONFIG.ORG_NAME}. All rights reserved.
        </p>
      </div>
    `;
    
    const htmlBody = createEmailTemplate(emailContent);
    
    GmailApp.sendEmail(
      data.email,
      subject,
      '', 
      {
        htmlBody: htmlBody,
        name: CONFIG.ORG_NAME
      }
    );
    
    Logger.log('✓ Sent email to: ' + data.email);
    
  } catch (error) {
    Logger.log('❌ Error sending applicant email: ' + error.toString());
  }
}

// ===============================
// อีเมลแอดมิน - มีปุ่มดาวน์โหลด
// ===============================

function sendAdminEmail(data, folderUrl, pdfUrl) {
  try {
    const subject = `[!] ใบสมัครใหม่: ${data.fullnameTH} - ${data.position}`;
    
    const emailContent = `
      <div class="header">
<div class="logo">
  <img src="${CONFIG.LOGO_URL}" 
       alt="${CONFIG.ORG_NAME}" 
       style="width: 100%; height: 100%; object-fit: contain; padding: 8px;">
</div>
        <h1>แจ้งเตือนผู้สมัครงานใหม่</h1>
        <p>${CONFIG.ORG_NAME}</p>
      </div>
      
      <div class="content">
        <div class="greeting">
          เรียน ฝ่ายทรัพยากรบุคคล
        </div>
        
        <div class="status-badge" style="background: #cfe2ff; color: #084298;">
          <span class="icon">!</span> มีผู้สมัครงานใหม่เข้ามาในระบบ
        </div>
        
        <div class="message">
          มีผู้สมัครงานเข้ามาในระบบเมื่อสักครู่ กรุณาตรวจสอบและดำเนินการต่อไป
        </div>
        
        <div class="info-box">
          <h3>ข้อมูลผู้สมัคร</h3>
          <div class="info-row">
            <span class="info-label">ชื่อ-นามสกุล:</span>
            <span class="info-value"><strong>${data.fullnameTH}</strong></span>
          </div>
          <div class="info-row">
            <span class="info-label">ชื่อ-นามสกุล (EN):</span>
            <span class="info-value">${data.fullnameEN || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">อีเมล:</span>
            <span class="info-value">${data.email}</span>
          </div>
          <div class="info-row">
            <span class="info-label">โทรศัพท์:</span>
            <span class="info-value">${data.tel}</span>
          </div>
          <div class="info-row">
            <span class="info-label">อายุ:</span>
            <span class="info-value">${data.age} ปี</span>
          </div>
        </div>
        
        <div class="info-box">
          <h3>ข้อมูลตำแหน่งที่สมัคร</h3>
          <div class="info-row">
            <span class="info-label">ตำแหน่ง:</span>
            <span class="info-value"><strong>${data.position}</strong></span>
          </div>
          ${data.department ? `
          <div class="info-row">
            <span class="info-label">หน่วยงาน:</span>
            <span class="info-value">${data.department}</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">เงินเดือนที่ต้องการ:</span>
            <span class="info-value">${Number(data.salary).toLocaleString('th-TH')} บาท</span>
          </div>
          <div class="info-row">
            <span class="info-label">วันที่พร้อมเริ่มงาน:</span>
            <span class="info-value">${formatDateThai(data.startDate)}</span>
          </div>
        </div>
        
        <div class="info-box">
          <h3>คุณวุฒิการศึกษา</h3>
          <div class="info-row">
            <span class="info-label">การศึกษา:</span>
            <span class="info-value">${data.educationLevel1 || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">สาขาวิชา:</span>
            <span class="info-value">${data.fieldofStudy1 || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">สถาบัน:</span>
            <span class="info-value">${data.nameofEducation1 || '-'}</span>
          </div>
          ${data.gpa1 ? `
          <div class="info-row">
            <span class="info-label">GPA:</span>
            <span class="info-value">${data.gpa1}</span>
          </div>
          ` : ''}
        </div>
        
        ${data.companyName1 ? `
        <div class="info-box">
          <h3>ประสบการณ์ทำงานล่าสุด</h3>
          <div class="info-row">
            <span class="info-label">บริษัท:</span>
            <span class="info-value">${data.companyName1}</span>
          </div>
          <div class="info-row">
            <span class="info-label">ตำแหน่งสุดท้าย:</span>
            <span class="info-value">${data.comp1positionEnd || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">เงินเดือนสุดท้าย:</span>
            <span class="info-value">${data.comp1salaryEnd ? Number(data.comp1salaryEnd).toLocaleString('th-TH') + ' บาท' : '-'}</span>
          </div>
        </div>
        ` : ''}
        
        <div class="divider"></div>
        
        <div class="message">
          <strong><span class="icon icon-folder">□</span> เอกสารและลิงก์สำคัญ:</strong>
        </div>
        
        <center>
          <a href="${folderUrl}" class="button" style="margin: 10px;">
            <span class="icon-folder">□</span> เปิดโฟลเดอร์เอกสาร
          </a>
          <a href="${pdfUrl}" class="button" style="margin: 10px; background: linear-gradient(135deg, #b8922a 0%, #d4af37 100%);">
            <span class="icon-doc">▢</span> ดูใบสมัคร PDF
          </a>
        </center>
        
        <div class="highlight">
          <strong>สิ่งที่ต้องดำเนินการ:</strong>
          <ol style="margin: 10px 0 0; padding-left: 20px; line-height: 1.8;">
            <li>ตรวจสอบคุณสมบัติของผู้สมัคร</li>
            <li>ทบทวนเอกสารแนบและใบสมัครงาน</li>
            <li>ประเมินความเหมาะสมกับตำแหน่ง</li>
            <li>ดำเนินการนัดหมายสัมภาษณ์ (หากผ่านการพิจารณา)</li>
          </ol>
        </div>
        
        <div class="signature">
          <div style="text-align: center;">
            <div style="color: #6c757d; font-size: 13px;">
              ส่งจากระบบรับสมัครงานอัตโนมัติ<br>
              ${CONFIG.ORG_NAME}
            </div>
            <div style="color: #868e96; font-size: 12px; margin-top: 8px;">
              ${formatDateThai(new Date())} เวลา ${Utilities.formatDate(new Date(), 'GMT+7', 'HH:mm:ss')} น.
            </div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <div class="footer-title">${CONFIG.ORG_NAME}</div>
        <p class="footer-text">ระบบรับสมัครงานออนไลน์</p>
        <div class="footer-contact">
          <span class="icon icon-mail">@</span> อีเมล: <a href="mailto:${CONFIG.ADMIN_EMAIL}">${CONFIG.ADMIN_EMAIL}</a>
        </div>
        <p class="footer-text" style="margin-top: 15px; font-size: 12px; color: #868e96;">
          &copy; ${new Date().getFullYear()} ${CONFIG.ORG_NAME}. All rights reserved.
        </p>
      </div>
    `;
    
    const htmlBody = createEmailTemplate(emailContent);
    
    GmailApp.sendEmail(
      CONFIG.ADMIN_EMAIL,
      subject,
      '', 
      {
        htmlBody: htmlBody,
        name: 'ระบบรับสมัครงาน - ' + CONFIG.ORG_NAME
      }
    );
    
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
  if (isNaN(date.getTime())) return '';
  
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear() + 543;
  
  return `${day}/${month}/${year}`;
}

function formatIDCard(idCard) {
  if (!idCard || idCard.length !== 13) return idCard;
  
  return idCard.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5');
}

function formatPhone(phone) {
  if (!phone || phone.length !== 10) return phone;
  
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
}

// ===============================
// Test Function
// ===============================

function testApplication() {
  // รูปทดสอบ: จุดสีแดง 1x1 pixel (PNG)
  const testPhotoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  
  // PDF ทดสอบ (ขนาดเล็ก แต่ valid)
  const testPDFBase64 = 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSA4IFRmCjUwIDcwMCBUZAooVGVzdCBEb2N1bWVudCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago=';
  
  const testData = {
    // ⭐⭐⭐ สำคัญที่สุด: ต้องมี photo! ⭐⭐⭐
    photo: testPhotoBase64,
    
    position: 'นักวิชาการ',
    department: 'ฝ่ายวิจัย',
    checkbox1: true,
    salary: '30000',
    startDate: '2025-12-01',
    experienceDetail: 'มีประสบการณ์ทำงานด้านวิจัย 3 ปี',
    fullnameTH: 'นายทดสอบ ระบบ',
    fullnameEN: 'Mr. Test System',
    dateOfbirth: '1995-01-01',
    age: '30',
    weight: '65',
    height: '170',
    placeofresidence: 'กรุงเทพมหานคร',
    nationality: 'ไทย',
    religion: 'พุทธ',
    bloodtype: 'O',
    national_id: '1234567890123',
    expired: '2030-01-01',
    place_idcard: 'กรุงเทพมหานคร',
    militaryStatus: 'Already',
    maritalStatus: 'Single',
    addressNow: '123 ถนนทดสอบ กรุงเทพฯ 10100',
    tel: '0812345678',
    email: 'test@example.com',
    addressType: 'me',
    addressHometown: '123 ถนนทดสอบ กรุงเทพฯ 10100',
    contactpersonName: 'นางทดสอบ ฉุกเฉิน',
    contactpersonRelationship: 'มารดา',
    contactpersonAddress: '123 ถนนทดสอบ กรุงเทพฯ 10100',
    contactpersonTel: '0898765432',
    contactpersonEmail: 'emergency@example.com',
    educationLevel1: 'ปริญญาตรี',
    eduSincetheyear1: '2556',
    eduUntiltheyear1: '2560',
    nameofEducation1: 'มหาวิทยาลัยทดสอบ',
    qualifications1: 'วท.บ.',
    fieldofStudy1: 'วิทยาศาสตร์คอมพิวเตอร์',
    gpa1: '3.50',
    studying: false,
    companyName1: 'บริษัททดสอบ จำกัด',
    businessType1: 'เทคโนโลยี',
    companyAddress1: 'กรุงเทพฯ',
    companyTel1: '021234567',
    jobDescription1: 'พัฒนาระบบ',
    comp1Start: '2020-01-01',
    comp1End: '2023-12-31',
    comp1positionStart: 'Junior Developer',
    comp1positionEnd: 'Senior Developer',
    comp1salaryStart: '20000',
    comp1salaryEnd: '35000',
    comp1salaryEtc: '5000',
    comp1Reasonsforleaving: 'หางานใหม่',
    health: 'Good',
    physicalimpairmentNo: true,
    illnessoraccidentTypeNo: true,
    bankruptorcommittedaCriminalNo: true,
    firedfromaJobNo: true,
    acquaintanceattheKPINo: true,
    husbandwifeFullname: 'นางทดสอบ คู่ครอง',
    husbandwifeAge: '29',
    husbandwifeJob: 'ครู',
    husbandwifeAddress: '123 ถนนทดสอบ กรุงเทพฯ 10100',
    husbandwifeofficeTel: '0898765433',
    documents: {
      diplomaCopy: { name: 'diploma.pdf', data: testPDFBase64 },
      nationalIDCopy: { name: 'id.pdf', data: testPDFBase64 }
    }
  };
  
  Logger.log('🧪 Starting test...');
  Logger.log('📸 Photo data length: ' + testData.photo.length);
  Logger.log('📄 Documents count: ' + Object.keys(testData.documents).length);
  
  const result = processApplication(testData);
  Logger.log('✓ Test completed: ' + JSON.stringify(result));
}
