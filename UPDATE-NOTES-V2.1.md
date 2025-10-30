# 🔄 สรุปการอัปเดต Version 2.1

## ✅ ปัญหาที่แก้ไขแล้ว

### 1. รูปภาพผู้สมัครยังไม่แนบเข้าไปในใบสมัคร
**สาเหตุ:** 
- การ decode base64 ไม่ถูกต้อง
- ไม่ได้ลบ shape เดิมก่อนแทรกรูป
- ไม่มีการตรวจสอบ MIME type

**การแก้ไข:**
```javascript
// ปรับปรุงฟังก์ชัน insertPhotoInSlide ใน Apps Script
- แยก base64 data อย่างถูกต้อง
- ตรวจสอบ MIME type จาก base64
- ลบ shape เดิมก่อนแทรกรูป
- ใช้ตำแหน่งและขนาดเดิมของ shape
```

**ผลลัพธ์:** รูปถ่ายจะถูกแทรกลงใน PDF ถูกต้อง

---

### 2. Multiple Choice มีกรอบสี่เหลี่ยม (☐) ที่ไม่ได้เลือก
**ปัญหา:** ช่องที่ไม่เลือกแสดง ☐ ทำให้ดูรกและไม่สวย

**การแก้ไข:**
```javascript
// เปลี่ยนจาก
replace('option', condition ? '☑' : '☐');

// เป็น
replace('option', condition ? '☑' : '');
```

**Placeholders ที่แก้ไข:**
- ✅ addressType (me/parent/rent)
- ✅ militaryStatus (Exempted/Not yet/Studied/Already)
- ✅ maritalStatus (Single/Married/Living apart/widow/divorce)
- ✅ studying sections (normalSection/eveningSection/otherSection)
- ✅ health (Excellent/Good/Poor/Bad)

**ผลลัพธ์:** แสดงเฉพาะ ☑ ตรงตัวเลือกที่เลือก ส่วนที่เหลือเป็นค่าว่าง

---

### 3. เพิ่มช่องกรอกภรรยา/สามี
**การเพิ่ม:**

#### HTML (application-v2.html)
```html
<h6 class="mt-4">ภรรยา/สามี</h6>
<div class="row mb-3">
    <div class="col-md-6">
        <label class="form-label">ชื่อ-นามสกุล</label>
        <input type="text" class="form-control" id="husbandwifeFullname">
    </div>
    ...
</div>
```

#### JavaScript (script-v2.js)
```javascript
// เพิ่มในฟังก์ชัน collectFormData()
husbandwifeFullname: getValue('husbandwifeFullname'),
husbandwifeAge: getValue('husbandwifeAge'),
husbandwifeJob: getValue('husbandwifeJob'),
husbandwifeAddress: getValue('husbandwifeAddress'),
husbandwifeofficeTel: getValue('husbandwifeofficeTel'),
```

#### Apps Script (apps-script-v2.js)
```javascript
// เพิ่มใน replacePlaceholders()
replace('husbandwifeFullname', data.husbandwifeFullname);
replace('husbandwifeAge', data.husbandwifeAge);
replace('husbandwifeJob', data.husbandwifeJob);
replace('husbandwifeAddress', data.husbandwifeAddress);
replace('husbandwifeofficeTel', formatPhone(data.husbandwifeofficeTel));
```

#### Placeholders ใหม่
```
{{husbandwifeFullname}}
{{husbandwifeAge}}
{{husbandwifeJob}}
{{husbandwifeAddress}}
{{husbandwifeofficeTel}}
```

**ผลลัพธ์:** มีช่องกรอกข้อมูลคู่สมรสครบถ้วน

---

### 4. แยกช่องแนบไฟล์เอกสาร 7 ช่อง
**ก่อนหน้า:** 
- มีช่องเดียวสำหรับแนบหลายไฟล์
- ไม่รู้ว่าไฟล์ไหนคืออะไร

**หลังแก้ไข:**
```html
<!-- 7 ช่องแยกกัน -->
<input type="file" id="diplomaCopy" accept=".pdf">
<input type="file" id="nationalIDCopy" accept=".pdf">
<input type="file" id="certificateofQualificationCopy" accept=".pdf">
<input type="file" id="workpassCopy" accept=".pdf">
<input type="file" id="transcriptCopy" accept=".pdf">
<input type="file" id="militaryCertificateCopy" accept=".pdf">
<input type="file" id="houseRegistrationCopy" accept=".pdf">
```

#### JavaScript - จัดการไฟล์แต่ละช่อง
```javascript
// เก็บข้อมูลไฟล์แยก
let documentsData = {
    diplomaCopy: null,
    nationalIDCopy: null,
    // ... ฯลฯ
};

// ฟังก์ชันจัดการอัปโหลด
function handleDocumentUpload(event, docType) {
    const file = event.target.files[0];
    
    // ตรวจสอบ PDF
    if (file.type !== 'application/pdf') {
        alert('กรุณาอัปโหลดไฟล์ PDF เท่านั้น');
        return;
    }
    
    // ตรวจสอบขนาด (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('ไฟล์มีขนาดใหญ่เกิน 5MB');
        return;
    }
    
    // อ่านไฟล์เป็น base64
    const reader = new FileReader();
    reader.onload = function(e) {
        documentsData[docType] = {
            name: file.name,
            data: e.target.result
        };
    };
    reader.readAsDataURL(file);
}
```

#### Apps Script - ติ๊กถูกอัตโนมัติ
```javascript
// ติ๊ก ☑ เฉพาะไฟล์ที่มี
replace('diplomaCopy', 
    data.documents && data.documents.diplomaCopy ? '☑' : '');
replace('nationalIDCopy', 
    data.documents && data.documents.nationalIDCopy ? '☑' : '');
// ... ฯลฯ สำหรับทั้ง 7 ไฟล์
```

**ผลลัพธ์:** 
- แยกช่องชัดเจน 7 ช่อง
- ติ๊ก ☑ อัตโนมัติสำหรับไฟล์ที่มี
- ช่องที่ไม่มีไฟล์แสดงค่าว่าง

---

### 5. ไฟล์เอกสารแนบไม่ถูกจัดเก็บเข้า Google Drive
**ปัญหา:** ไฟล์ถูกส่งมา แต่ไม่มีการบันทึกลง Drive

**การแก้ไข:**

#### เพิ่มฟังก์ชัน saveDocuments() ใน Apps Script
```javascript
function saveDocuments(documents, folder) {
    const docNames = {
        diplomaCopy: 'สำเนาปริญญาบัตร',
        nationalIDCopy: 'สำเนาบัตรประชาชน',
        // ... ฯลฯ
    };
    
    for (const [key, value] of Object.entries(documents)) {
        if (value && value.data) {
            // แยก base64 data
            const base64Parts = value.data.split(',');
            const fileData = base64Parts[1];
            
            // Decode และสร้าง blob
            const fileBlob = Utilities.newBlob(
                Utilities.base64Decode(fileData),
                'application/pdf',
                `${docNames[key]}.pdf`
            );
            
            // บันทึกลง folder
            folder.createFile(fileBlob);
        }
    }
}
```

#### เรียกใช้ใน processApplication()
```javascript
function processApplication(data) {
    // ... สร้าง folder
    
    // บันทึกเอกสาร (ใหม่!)
    if (data.documents) {
        saveDocuments(data.documents, applicantFolder);
    }
    
    // ... สร้าง PDF, ส่งอีเมล
}
```

**ผลลัพธ์:**
```
Applicants/
└── นายทดสอบ_ระบบ_20251027_143022/
    ├── สำเนาปริญญาบัตร.pdf
    ├── สำเนาบัตรประชาชน.pdf
    ├── สำเนาใบรับรองคุณวุฒิ.pdf
    ├── หลักฐานการผ่านงาน.pdf
    ├── สำเนาใบรายงานผลการศึกษา.pdf
    ├── หลักฐานการผ่านเกณฑ์ทหาร.pdf
    └── สำเนาทะเบียนบ้าน.pdf
```

---

## 📊 สรุปการเปลี่ยนแปลง

### ไฟล์ที่แก้ไข
1. ✅ **application-v2.html** - เพิ่มฟิลด์ภรรยา/สามี, แยกช่องแนบเอกสาร
2. ✅ **script-v2.js** - จัดการไฟล์แนบ 7 ช่อง, เก็บข้อมูลภรรยา/สามี
3. ✅ **apps-script-v2.js** - แก้ไขการแทรกรูป, บันทึกไฟล์, ติ๊กอัตโนมัติ
4. ✅ **README-V2.md** - อัปเดตคำอธิบาย
5. ✅ **PLACEHOLDERS-CHECKLIST.md** - เพิ่ม placeholders ใหม่

### Placeholders เพิ่มเติม (5 ตัว)
```
{{husbandwifeFullname}}
{{husbandwifeAge}}
{{husbandwifeJob}}
{{husbandwifeAddress}}
{{husbandwifeofficeTel}}
```

### คุณสมบัติใหม่
1. ✨ รูปภาพแทรกใน PDF ถูกต้อง
2. ✨ Multiple choice สะอาดตา (ไม่มีกรอบว่าง)
3. ✨ ช่องข้อมูลภรรยา/สามี
4. ✨ แนบเอกสาร 7 ช่องแยก พร้อมติ๊กอัตโนมัติ
5. ✨ บันทึกไฟล์ลง Drive อัตโนมัติ

---

## 🚀 การติดตั้งและทดสอบ

### 1. อัปโหลดไฟล์ใหม่
```bash
# Frontend
- application-v2.html
- script-v2.js
- style.css (ไม่เปลี่ยน)
- index.html (ไม่เปลี่ยน)

# Backend
- apps-script-v2.js (ใหม่ - อัปโหลดไปแทนที่เดิม)
```

### 2. อัปเดต Google Slides Template
เพิ่ม placeholders ใหม่:
```
{{husbandwifeFullname}}
{{husbandwifeAge}}
{{husbandwifeJob}}
{{husbandwifeAddress}}
{{husbandwifeofficeTel}}
```

### 3. ทดสอบ
```javascript
// ใน Apps Script Editor
testApplication()

// ตรวจสอบ:
✅ มีรูปภาพใน PDF
✅ Multiple choice ไม่มีกรอบว่าง
✅ ข้อมูลภรรยา/สามีแสดงถูกต้อง
✅ เอกสารแนบมี ☑ ตรงที่ส่งมา
✅ ไฟล์เอกสารบันทึกใน Google Drive
```

---

## 🐛 การแก้ปัญหาเพิ่มเติม

### ถ้ารูปภาพยังไม่แสดง
1. ตรวจสอบว่ามี `{{photo}}` ใน Slides
2. ตรวจสอบ Apps Script Logs
3. ตรวจสอบขนาดไฟล์รูป (< 5MB)

### ถ้าไฟล์ไม่ถูกบันทึก
1. ตรวจสอบ console.log ในเบราว์เซอร์
2. ตรวจสอบว่าไฟล์เป็น PDF
3. ตรวจสอบขนาดไฟล์ (< 5MB แต่ละไฟล์)

### ถ้าติ๊กไม่แสดง
1. ตรวจสอบว่า placeholder ถูกต้อง (ไม่มีช่องว่าง)
2. ตรวจสอบการ upload ไฟล์สำเร็จ
3. ตรวจสอบ Apps Script Logs

---

## 📝 หมายเหตุสำคัญ

### การจัดการไฟล์
- แต่ละไฟล์ไม่เกิน 5MB
- รองรับเฉพาะ PDF
- ไฟล์จะถูกบันทึกด้วยชื่อภาษาไทยตามประเภท
- อยู่ในโฟลเดอร์ของผู้สมัครแต่ละคน

### Multiple Choice
- เฉพาะตัวเลือกที่เลือกจะแสดง ☑
- ตัวเลือกอื่นเป็นค่าว่าง (ไม่มี ☐)
- ทำให้ PDF ดูสะอาดและอ่านง่าย

### รูปภาพ
- จะถูกแทรกตรงตำแหน่ง `{{photo}}`
- ขนาดตามที่กำหนดใน shape
- รองรับ JPG และ PNG

---

## ✅ Checklist ก่อน Deploy

- [ ] อัปโหลด HTML และ JS ใหม่
- [ ] อัปเดต Apps Script
- [ ] เพิ่ม placeholders ภรรยา/สามีใน Slides
- [ ] ทดสอบด้วย testApplication()
- [ ] ทดสอบส่งฟอร์มจริง
- [ ] ตรวจสอบรูปภาพใน PDF
- [ ] ตรวจสอบไฟล์เอกสารใน Drive
- [ ] ตรวจสอบอีเมลที่ส่ง

---

**🎉 ระบบพร้อมใช้งาน Version 2.1!**

หากมีปัญหาหรือต้องการปรับแต่งเพิ่มเติม สามารถติดต่อได้เสมอ
