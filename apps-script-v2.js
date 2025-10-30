// ===============================
// Configuration
// ===============================

const CONFIG = {
  MAIN_FOLDER_ID: 'YOUR_MAIN_FOLDER_ID',           // โฟลเดอร์หลัก
  TEMPLATE_SLIDE_ID: 'YOUR_TEMPLATE_SLIDE_ID',     // Google Slides Template
  ADMIN_EMAIL: 'hr@example.com',                    // อีเมล HR
  ORG_NAME: 'สถาบันพระปกเกล้า',
  ORG_ADDRESS: 'ที่อยู่สถาบัน'
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
// Process Application
// ===============================

function processApplication(data) {
  try {
    // 1. Get/Create folder structure
    const folders = getOrCreateFolderStructure();
    
    // 2. Create applicant folder
    const timestamp = Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd_HHmmss');
    const folderName = `${data.fullnameTH}_${timestamp}`;
    const applicantFolder = folders.applicants.createFolder(folderName);
    
    Logger.log('✓ Created folder: ' + folderName);
    
    // 3. Save documents to applicant folder
    if (data.documents) {
      saveDocuments(data.documents, applicantFolder);
    }
    
    // 4. Create PDF application
    const pdfUrl = createApplicationPDF(data, folders.applications, folderName);
    Logger.log('✓ Created PDF');
    
    // 5. Save to Google Sheets
    saveToSheet(data, applicantFolder.getUrl(), pdfUrl);
    Logger.log('✓ Saved to Sheets');
    
    // 6. Send emails
    sendApplicantEmail(data, pdfUrl);
    sendAdminEmail(data, applicantFolder.getUrl(), pdfUrl);
    Logger.log('✓ Sent emails');
    
    return {
      folderId: applicantFolder.getId(),
      folderUrl: applicantFolder.getUrl(),
      pdfUrl: pdfUrl
    };
    
  } catch (error) {
    Logger.log('❌ Error processing: ' + error.toString());
    throw error;
  }
}

// ===============================
// Save Documents
// ===============================

function saveDocuments(documents, folder) {
  try {
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
      if (value && value.data) {
        try {
          // แยก base64 data
          const base64Parts = value.data.split(',');
          if (base64Parts.length < 2) continue;
          
          const fileData = base64Parts[1];
          const mimeType = 'application/pdf';
          
          // Decode and create blob
          const fileBlob = Utilities.newBlob(
            Utilities.base64Decode(fileData),
            mimeType,
            `${docNames[key]}.pdf`
          );
          
          // Save to folder
          folder.createFile(fileBlob);
          savedCount++;
          
          Logger.log(`✓ Saved: ${docNames[key]}`);
        } catch (error) {
          Logger.log(`❌ Error saving ${key}: ${error.toString()}`);
        }
      }
    }
    
    Logger.log(`✓ Saved ${savedCount} document(s) to folder`);
    
  } catch (error) {
    Logger.log('❌ Error in saveDocuments: ' + error.toString());
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
    
    slides.forEach(slide => {
      replacePlaceholdersInSlide(slide, data);
    });
    
    if (data.photo) {
      insertPhotoInSlide(slides, data.photo);
    }
    
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
  replace('photo', '[รูปถ่าย]');
  replace('position', data.position);
  replace('department', data.department);
  replace('checkbox1', data.checkbox1 ? '☑' : '☐');
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
  replace('studying', data.studying ? '☑' : '☐');
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
  
  replace('noChildren', data.noChildren ? '☑' : '☐');
  replace('numberofChildren', data.numberofChildren);
  
  // Page 5: Health
  replace('physicalimpairmentNo', data.physicalimpairmentNo ? '☑' : '☐');
  replace('physicalimpairmentType', data.physicalimpairmentType);
  replace('illnessoraccidentTypeNo', data.illnessoraccidentTypeNo ? '☑' : '☐');
  replace('illnessoraccidentType', data.illnessoraccidentType);
  
  const healthStatuses = ['Excellent', 'Good', 'Poor', 'Bad'];
  healthStatuses.forEach(status => {
    replace('health\\[' + status + '\\]', data.health === status ? '☑' : '');
  });
  
  replace('bankruptorcommittedaCriminalNo', data.bankruptorcommittedaCriminalNo ? '☑' : '☐');
  replace('bankruptorcommittedaCriminaldetail', data.bankruptorcommittedaCriminaldetail);
  replace('firedfromaJobNo', data.firedfromaJobNo ? '☑' : '☐');
  replace('firedfromaJobreason', data.firedfromaJobreason);
  replace('acquaintanceattheKPINo', data.acquaintanceattheKPINo ? '☑' : '☐');
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
    
    // แยก base64 data
    const base64Parts = photoBase64.split(',');
    if (base64Parts.length < 2) {
      Logger.log('❌ Invalid photo format');
      return;
    }
    
    const imageData = base64Parts[1];
    const mimeType = base64Parts[0].match(/:(.*?);/)[1];
    
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const shapes = slide.getShapes();
      
      for (let j = 0; j < shapes.length; j++) {
        const shape = shapes[j];
        
        try {
          const text = shape.getText().asString();
          
          if (text.includes('{{photo}}')) {
            // Get shape position and size
            const left = shape.getLeft();
            const top = shape.getTop();
            const width = shape.getWidth();
            const height = shape.getHeight();
            
            // Remove the shape
            shape.remove();
            
            // Decode base64 and create blob
            const imageBlob = Utilities.newBlob(
              Utilities.base64Decode(imageData), 
              mimeType,
              'photo.jpg'
            );
            
            // Insert image at the same position
            const insertedImage = slide.insertImage(imageBlob, left, top, width, height);
            
            Logger.log('✓ Successfully inserted photo in slide ' + (i + 1));
            return;
          }
        } catch (error) {
          // Continue to next shape
        }
      }
    }
    
    Logger.log('⚠ {{photo}} placeholder not found in any slide');
    
  } catch (error) {
    Logger.log('❌ Error inserting photo: ' + error.toString());
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
        'วันที่สมัคร', 'เวลา', 'ตำแหน่ง', 'หน่วยงาน', 'เงินเดือนที่ต้องการ',
        'ชื่อ-นามสกุล (TH)', 'ชื่อ-นามสกุล (EN)', 
        'เลขบัตรประชาชน', 'วันเกิด', 'อายุ', 'เพศ', 'สัญชาติ', 'ศาสนา',
        'โทรศัพท์', 'อีเมล', 'ที่อยู่',
        'การศึกษาสูงสุด', 'สาขา', 'สถาบัน',
        'สถานภาพทหาร', 'สถานภาพการสมรส',
        'ลิงก์โฟลเดอร์', 'ลิงก์ PDF'
      ];
      sheet.appendRow(headers);
      
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1e3a8a');
      headerRange.setFontColor('#ffffff');
    }
    
    const row = [
      formatDateThai(new Date()),
      Utilities.formatDate(new Date(), 'GMT+7', 'HH:mm:ss'),
      data.position,
      data.department,
      data.salary,
      data.fullnameTH,
      data.fullnameEN,
      data.national_id,
      formatDateThai(data.dateOfbirth),
      data.age,
      data.gender || '-',
      data.nationality,
      data.religion,
      data.tel,
      data.email,
      data.addressNow,
      data.educationLevel1 || '-',
      data.fieldofStudy1 || '-',
      data.nameofEducation1 || '-',
      data.militaryStatus,
      data.maritalStatus,
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
// Send Emails
// ===============================

function sendApplicantEmail(data, pdfUrl) {
  try {
    const subject = `ยืนยันการสมัครงาน - ${data.position} - ${CONFIG.ORG_NAME}`;
    
    const body = `
เรียน ${data.fullnameTH}

ขอบคุณที่สมัครงานตำแหน่ง ${data.position} ${CONFIG.ORG_NAME}

เราได้รับใบสมัครของคุณเรียบร้อยแล้ว ทางเราจะพิจารณาคุณสมบัติและติดต่อกลับภายใน 7-14 วันทำการ

ท่านสามารถดาวน์โหลดสำเนาใบสมัครได้ที่:
${pdfUrl}

หากมีข้อสงสัยประการใด กรุณาติดต่อ:
อีเมล: ${CONFIG.ADMIN_EMAIL}

ขอแสดงความนับถือ
${CONFIG.ORG_NAME}
    `.trim();
    
    GmailApp.sendEmail(data.email, subject, body);
    Logger.log('✓ Sent email to: ' + data.email);
    
  } catch (error) {
    Logger.log('❌ Error sending applicant email: ' + error.toString());
  }
}

function sendAdminEmail(data, folderUrl, pdfUrl) {
  try {
    const subject = `[ใบสมัครใหม่] ${data.fullnameTH} - ${data.position}`;
    
    const body = `
มีผู้สมัครงานใหม่

ข้อมูลผู้สมัคร:
- ชื่อ: ${data.fullnameTH}
- ตำแหน่ง: ${data.position}
- หน่วยงาน: ${data.department || '-'}
- อีเมล: ${data.email}
- โทรศัพท์: ${data.tel}
- การศึกษา: ${data.educationLevel1 || '-'} ${data.fieldofStudy1 || ''}
- สถาบัน: ${data.nameofEducation1 || '-'}
- อัตราเงินเดือนที่ต้องการ: ${data.salary} บาท

โฟลเดอร์เอกสาร:
${folderUrl}

ใบสมัคร PDF:
${pdfUrl}

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
  const testData = {
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
      diplomaCopy: { name: 'diploma.pdf', data: 'data:application/pdf;base64,JVBERi0xLjQK...' },
      nationalIDCopy: { name: 'id.pdf', data: 'data:application/pdf;base64,JVBERi0xLjQK...' }
    }
  };
  
  const result = processApplication(testData);
  Logger.log('✓ Test completed: ' + JSON.stringify(result));
}
