// Configuration
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzn9U8atjm7reFAaxbuMJ86TVohmYXqk-0hxmFHTdYuKeQFVJJHcVFxe3kQz_7qJlwxiw/exec';

// Global Variables
let currentStep = 1;
const totalSteps = 5;
let photoData = null;

// ⭐ ใช้ Set เก็บ active IDs แทน counter (เริ่มจากว่าง)
let activeEducationIds = new Set(); // ✅ เริ่มจากว่าง
let activeExperienceIds = new Set();
let activeTrainingIds = new Set();
let activeLanguageIds = new Set();
let activeSiblingIds = new Set();
let activeReferenceIds = new Set();

// Document files
let documentsData = {
    diplomaCopy: null,
    nationalIDCopy: null,
    certificateofQualificationCopy: null,
    workpassCopy: null,
    transcriptCopy: null,
    militaryCertificateCopy: null,
    houseRegistrationCopy: null
};

// ==================== Validation Helper ====================
function isValidNumber(value) {
    if (!value || value.trim() === '') return true; // ค่าว่างอนุญาต (ถ้าไม่ required)
    
    // ตัดช่องว่างหน้าหลัง
    value = value.trim();
    
    // ห้ามพิมพ์อย่างเดียว: จุด, ขีด, e, E, หรือตัวอักษร
    if (value === '.' || value === '-' || value === 'e' || value === 'E') {
        return false;
    }
    
    // ห้าม: จุดหลายตัว, ขีดหลายตัว
    if (value.includes('..') || value.includes('--')) {
        return false;
    }
    
    // ห้าม: ตัวอักษรปนในตัวเลข (ยกเว้น . และ - ที่ตำแหน่งถูกต้อง)
    if (/[a-zA-Zก-๙]/.test(value)) {
        return false;
    }
    
    // ต้องเป็นตัวเลขที่ valid
    const num = parseFloat(value);
    if (isNaN(num)) {
        return false;
    }
    
    return true;
}

// ==================== Toast Notification ====================
function showToast(type, message) {
    // ถ้ามี SweetAlert2
    if (typeof Swal !== 'undefined') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
        });
        
        Toast.fire({
            icon: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info',
            title: message
        });
    }
}

// Page Load
window.addEventListener('load', function() {
    if (sessionStorage.getItem('consentAccepted') !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    loadOrgLogo();
    initializeForm();
    
    // Initialize with 1 entry for each dynamic section
    addEducation();
    addExperience();
    addTraining();
    addLanguage();
    addReference();
});

function loadOrgLogo() {
    const logoUrl = localStorage.getItem('orgLogoUrl');
    if (logoUrl) {
        document.getElementById('orgLogo').src = logoUrl;
        document.querySelector('.logo-container').style.display = 'block';
    }
}

function initializeForm() {
    // Photo upload
    document.getElementById('photo').addEventListener('change', handlePhotoUpload);
    
    // Document uploads
    const docTypes = ['diplomaCopy', 'nationalIDCopy', 'certificateofQualificationCopy', 
                      'workpassCopy', 'transcriptCopy', 'militaryCertificateCopy', 'houseRegistrationCopy'];
    docTypes.forEach(docType => {
        const element = document.getElementById(docType);
        if (element) {
            element.addEventListener('change', (e) => handleDocumentUpload(e, docType));
        }
    });
    
    // Calculate age from birthdate
    document.getElementById('dateOfbirth').addEventListener('change', calculateAge);
    
    // Same address checkboxes
    document.getElementById('sameAddressHometown').addEventListener('change', toggleHometownAddress);
    document.getElementById('sameAddressContact').addEventListener('change', toggleContactAddress);
    
    // Studying checkbox
    document.getElementById('studying').addEventListener('change', toggleStudyingFields);
    
    // Children checkbox
    document.getElementById('noChildren').addEventListener('change', toggleChildrenField);
    
    // Health checkboxes
    document.getElementById('physicalimpairmentNo').addEventListener('change', function() {
        toggleField('physicalimpairmentField', !this.checked);
    });
    
    document.getElementById('illnessoraccidentTypeNo').addEventListener('change', function() {
        toggleField('illnessField', !this.checked);
    });
    
    document.getElementById('bankruptorcommittedaCriminalNo').addEventListener('change', function() {
        toggleField('bankruptField', !this.checked);
    });
    
    document.getElementById('firedfromaJobNo').addEventListener('change', function() {
        toggleField('firedField', !this.checked);
    });
    
    document.getElementById('acquaintanceattheKPINo').addEventListener('change', function() {
        toggleField('acquaintanceField', !this.checked);
    });
    
    // Form submission
    document.getElementById('applicationForm').addEventListener('submit', handleSubmit);
    
    setupNumberInputPrevention();
    showStep(currentStep);
}

// 🔥 ระบบป้องกันการกรอก number input ผิดประเภท
function setupNumberInputPrevention() {
    const numberInputs = document.querySelectorAll('input[type="number"]');
    
    numberInputs.forEach(input => {
        // เช็คว่าได้ติด listener แล้วหรือยัง
        if (input.dataset.preventionAdded) return;
        input.dataset.preventionAdded = 'true';
        
        // 1. ป้องกันการพิมพ์ตัวอักษร
        input.addEventListener('keypress', function(e) {
            const char = String.fromCharCode(e.which || e.keyCode);
            const currentValue = this.value || '';
            
            // อนุญาตเฉพาะ: ตัวเลข 0-9, จุด (.), ขีด (-) ที่ตำแหน่งแรก
            if (!/[0-9]/.test(char)) {
                // จุด - อนุญาตถ้ายังไม่มี และไม่ใช่ตัวแรก
                if (char === '.' && !currentValue.includes('.') && currentValue.length > 0) {
                    return; // อนุญาต
                }
                // ขีด - อนุญาตเฉพาะที่ตำแหน่งแรก
                if (char === '-' && currentValue.length === 0) {
                    return; // อนุญาต
                }
                // ทุกอย่างอื่น - ห้าม
                e.preventDefault();
                showToast('warning', 'กรุณากรอกตัวเลขเท่านั้น');
            }
        });
        
        // 2. ตรวจสอบหลังพิมพ์หรือ paste
        input.addEventListener('input', function(e) {
            let value = this.value;
            
            if (!value) return;
            
            // ลบตัวอักษรที่ไม่ใช่ตัวเลข, จุด, หรือขีด
            let cleaned = value.replace(/[^0-9.-]/g, '');
            
            // จัดการจุด - เก็บได้แค่ตัวแรก
            const parts = cleaned.split('.');
            if (parts.length > 2) {
                cleaned = parts[0] + '.' + parts.slice(1).join('');
            }
            
            // จัดการขีด - เก็บได้แค่ตัวแรกที่หน้าสุด
            if (cleaned.indexOf('-') > 0) {
                cleaned = cleaned.replace(/-/g, '');
            }
            if (cleaned.split('-').length > 2) {
                cleaned = '-' + cleaned.replace(/-/g, '');
            }
            
            // ตรวจสอบค่าที่ไม่ valid
            if (cleaned !== value) {
                this.value = cleaned;
                showToast('warning', 'มีการแก้ไขค่าที่ไม่ถูกต้องอัตโนมัติ');
            }
            
            // ถ้าเป็นค่าที่ยัง invalid (เช่น "-" หรือ "." เพียงอย่างเดียว)
            if (cleaned && !isValidNumber(cleaned) && cleaned !== '-' && cleaned !== '.') {
                this.value = '';
                showToast('error', 'ค่าที่กรอกไม่ถูกต้อง กรุณากรอกใหม่');
            }
        });
        
        // 3. ตรวจสอบเมื่อ blur (เสร็จสิ้นการกรอก)
        input.addEventListener('blur', function() {
            const value = this.value.trim();
            
            if (!value) return;
            
            // ถ้าจบด้วยจุด - ตัดออก
            if (value.endsWith('.')) {
                this.value = value.slice(0, -1);
            }
            
            // ถ้าเป็นแค่ "-" - ลบ
            if (value === '-') {
                this.value = '';
                if (this.required) {
                    showToast('warning', 'กรุณากรอกตัวเลข');
                }
            }
            
            // ถ้าไม่ valid - เคลียร์
            if (value && !isValidNumber(value)) {
                this.value = '';
                const label = this.previousElementSibling?.textContent || 'ช่องนี้';
                showToast('error', `${label} ต้องเป็นตัวเลขเท่านั้น`);
            }
        });
        
        // เพิ่ม placeholder ถ้ายังไม่มี
        if (!input.placeholder && !input.required) {
            input.placeholder = 'กรอกตัวเลข หรือเว้นว่างได้';
        }
    });
}

// ==================== Photo Upload ====================
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
        Swal.fire({
            title: 'ไฟล์ไม่ถูกต้อง',
            text: 'กรุณาอัปโหลดไฟล์รูปภาพ (JPG หรือ PNG เท่านั้น)',
            icon: 'warning',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง'
        });
        event.target.value = '';
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
            title: 'ไฟล์ใหญ่เกินไป',
            text: 'ไฟล์รูปภาพมีขนาดใหญ่เกิน 5MB กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่า',
            icon: 'warning',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง'
        });
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        photoData = e.target.result;
        document.getElementById('previewImage').src = photoData;
        document.getElementById('photoPreview').classList.remove('hidden');
        
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
        });
        
        Toast.fire({
            icon: 'success',
            title: 'อัปโหลดรูปถ่ายสำเร็จ'
        });
    };
    reader.readAsDataURL(file);
}

// ==================== Document Upload ====================
function handleDocumentUpload(event, docType) {
    const file = event.target.files[0];
    if (!file) {
        documentsData[docType] = null;
        return;
    }

    if (file.type !== 'application/pdf') {
        Swal.fire({
            title: 'ไฟล์ไม่ถูกต้อง',
            text: 'กรุณาอัปโหลดไฟล์ PDF เท่านั้น',
            icon: 'warning',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง'
        });
        event.target.value = '';
        documentsData[docType] = null;
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
            title: 'ไฟล์ใหญ่เกินไป',
            text: 'ไฟล์มีขนาดใหญ่เกิน 5MB กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่า',
            icon: 'warning',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง'
        });
        event.target.value = '';
        documentsData[docType] = null;
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        documentsData[docType] = {
            name: file.name,
            data: e.target.result
        };
        console.log(`✓ Loaded ${docType}: ${file.name}`);
        
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
        });
        
        Toast.fire({
            icon: 'success',
            title: `อัปโหลด ${file.name} สำเร็จ`
        });
    };
    reader.readAsDataURL(file);
}

// ==================== Age Calculator ====================
function calculateAge() {
    const birthDate = new Date(document.getElementById('dateOfbirth').value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    document.getElementById('age').value = age;
}

// ==================== Address Toggles ====================
function toggleHometownAddress() {
    const isChecked = document.getElementById('sameAddressHometown').checked;
    const field = document.getElementById('addressHometownField');
    const textarea = document.getElementById('addressHometown');
    
    if (isChecked) {
        textarea.value = document.getElementById('addressNow').value;
        field.classList.add('hidden');
        textarea.removeAttribute('required');
    } else {
        field.classList.remove('hidden');
        textarea.setAttribute('required', 'required');
    }
}

function toggleContactAddress() {
    const isChecked = document.getElementById('sameAddressContact').checked;
    const field = document.getElementById('contactAddressField');
    const textarea = document.getElementById('contactpersonAddress');
    
    if (isChecked) {
        textarea.value = document.getElementById('addressNow').value;
        field.classList.add('hidden');
        textarea.removeAttribute('required');
    } else {
        field.classList.remove('hidden');
        textarea.setAttribute('required', 'required');
    }
}

// ==================== Field Toggles ====================
function toggleStudyingFields() {
    const isChecked = document.getElementById('studying').checked;
    toggleField('studyingFields', isChecked);
}

function toggleChildrenField() {
    const isChecked = document.getElementById('noChildren').checked;
    toggleField('childrenField', !isChecked);
}

function toggleField(fieldId, show) {
    const field = document.getElementById(fieldId);
    if (show) {
        field.classList.remove('hidden');
    } else {
        field.classList.add('hidden');
    }
}

// ==================== Dynamic Form Sections ====================

// ⭐ หาเลข ID ว่างที่เล็กที่สุด
function getNextAvailableId(activeSet) {
    let id = 1;
    while (activeSet.has(id)) {
        id++;
    }
    return id;
}

// Education
function addEducation() {
    if (activeEducationIds.size >= 4) {
        Swal.fire({
            title: 'ถึงจำนวนสูงสุดแล้ว',
            text: 'สามารถเพิ่มประวัติการศึกษาได้สูงสุด 4 รายการ',
            icon: 'info',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง'
        });
        return;
    }
    
    const newId = getNextAvailableId(activeEducationIds);
    activeEducationIds.add(newId);
    
    const isFirstEntry = newId === 1;
    const requiredAttr = isFirstEntry ? 'required' : '';
    const requiredClass = isFirstEntry ? 'required' : '';
    
    const container = document.getElementById('educationContainer');
    const html = `
        <div class="education-entry border rounded p-3 mb-3" id="education${newId}">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6>ประวัติการศึกษา ${newId} ${isFirstEntry ? '<span style="color: #dc2626;">*</span>' : ''}</h6>
                ${!isFirstEntry ? `<button type="button" class="btn btn-sm btn-outline-danger" onclick="removeEducation(${newId})">ลบ</button>` : ''}
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label class="form-label ${requiredClass}">ระดับการศึกษา</label>
                    <select class="form-select" id="educationLevel${newId}" name="educationLevel${newId}" ${requiredAttr}>
                        <option value="">เลือก</option>
                        <option value="ปริญญาตรี">ปริญญาตรี</option>
                        <option value="ปริญญาโท">ปริญญาโท</option>
                        <option value="ปริญญาเอก">ปริญญาเอก</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label ${requiredClass}">ตั้งแต่ปี (พ.ศ.)</label>
                    <input type="number" class="form-control no-spin" id="eduSincetheyear${newId}" name="eduSincetheyear${newId}" ${requiredAttr} placeholder="เช่น 2560">
                </div>
                <div class="col-md-3">
                    <label class="form-label ${requiredClass}">จนถึงปี (พ.ศ.)</label>
                    <input type="number" class="form-control no-spin" id="eduUntiltheyear${newId}" name="eduUntiltheyear${newId}" ${requiredAttr} placeholder="เช่น 2564">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-12">
                    <label class="form-label ${requiredClass}">ชื่อสถานศึกษา</label>
                    <input type="text" class="form-control" id="nameofEducation${newId}" name="nameofEducation${newId}" ${requiredAttr}>
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-4">
                    <label class="form-label ${requiredClass}">วุฒิการศึกษา</label>
                    <input type="text" class="form-control" id="qualifications${newId}" name="qualifications${newId}" ${requiredAttr}>
                </div>
                <div class="col-md-5">
                    <label class="form-label ${requiredClass}">สาขาวิชา</label>
                    <input type="text" class="form-control" id="fieldofStudy${newId}" name="fieldofStudy${newId}" ${requiredAttr}>
                </div>
                <div class="col-md-3">
                    <label class="form-label">GPA</label>
                    <input type="text" class="form-control no-spin" id="gpa${newId}" name="gpa${newId}" placeholder="เช่น 3.50">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
    
    // 🔥 เรียก setup ใหม่หลังเพิ่ม elements
    setupNumberInputPrevention();
}

function removeEducation(id) {
    if (id === 1) {
        Swal.fire({
            title: 'ไม่สามารถลบได้',
            text: 'กรุณากรอกประวัติการศึกษาอย่างน้อย 1 รายการ',
            icon: 'warning',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง'
        });
        return;
    }
    
    Swal.fire({
        title: 'ยืนยันการลบ?',
        text: 'คุณต้องการลบประวัติการศึกษารายการนี้หรือไม่?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0f5132',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            const element = document.getElementById(`education${id}`);
            if (element) {
                element.remove();
                activeEducationIds.delete(id);
            }
        }
    });
}

// Experience
function addExperience() {
    if (activeExperienceIds.size >= 3) {
        Swal.fire({
            title: 'ถึงจำนวนสูงสุดแล้ว',
            text: 'สามารถเพิ่มประสบการณ์ทำงานได้สูงสุด 3 รายการ',
            icon: 'info',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง'
        });
        return;
    }
    
    const newId = getNextAvailableId(activeExperienceIds);
    activeExperienceIds.add(newId);
    
    const container = document.getElementById('experienceContainer');
    const html = `
        <div class="experience-entry border rounded p-3 mb-3" id="experience${newId}">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6>ประสบการณ์ทำงาน ${newId}</h6>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeExperience(${newId})">ลบ</button>
            </div>
            <div class="row mb-2">
                <div class="col-md-8">
                    <label class="form-label">ชื่อบริษัท</label>
                    <input type="text" class="form-control" id="companyName${newId}" name="companyName${newId}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">ประเภทธุรกิจ</label>
                    <input type="text" class="form-control" id="businessType${newId}" name="businessType${newId}">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-8">
                    <label class="form-label">ที่อยู่บริษัท</label>
                    <input type="text" class="form-control" id="companyAddress${newId}" name="companyAddress${newId}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">โทรศัพท์</label>
                    <input type="tel" class="form-control" id="companyTel${newId}" name="companyTel${newId}">
                </div>
            </div>
            <div class="mb-2">
                <label class="form-label">ลักษณะงานที่รับผิดชอบ</label>
                <textarea class="form-control" id="jobDescription${newId}" name="jobDescription${newId}" rows="2"></textarea>
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label class="form-label">วันที่เริ่มงาน</label>
                    <input type="date" class="form-control" id="comp${newId}Start" name="comp${newId}Start">
                </div>
                <div class="col-md-6">
                    <label class="form-label">วันที่สิ้นสุด</label>
                    <input type="date" class="form-control" id="comp${newId}End" name="comp${newId}End">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label class="form-label">ตำแหน่งแรกเข้า</label>
                    <input type="text" class="form-control" id="comp${newId}positionStart" name="comp${newId}positionStart">
                </div>
                <div class="col-md-6">
                    <label class="form-label">ตำแหน่งสุดท้าย</label>
                    <input type="text" class="form-control" id="comp${newId}positionEnd" name="comp${newId}positionEnd">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-4">
                    <label class="form-label">เงินเดือนแรกเข้า</label>
                    <input type="number" class="form-control no-spin" id="comp${newId}salaryStart" name="comp${newId}salaryStart">
                </div>
                <div class="col-md-4">
                    <label class="form-label">เงินเดือนสุดท้าย</label>
                    <input type="number" class="form-control no-spin" id="comp${newId}salaryEnd" name="comp${newId}salaryEnd">
                </div>
                <div class="col-md-4">
                    <label class="form-label">รายได้อื่นๆ</label>
                    <input type="number" class="form-control no-spin" id="comp${newId}salaryEtc" name="comp${newId}salaryEtc">
                </div>
            </div>
            <div class="mb-2">
                <label class="form-label">เหตุผลที่ออกจากงาน</label>
                <textarea class="form-control" id="comp${newId}Reasonsforleaving" name="comp${newId}Reasonsforleaving" rows="2"></textarea>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
    setupNumberInputPrevention();
}

function removeExperience(id) {
    Swal.fire({
        title: 'ยืนยันการลบ?',
        text: 'คุณต้องการลบประสบการณ์ทำงานรายการนี้หรือไม่?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0f5132',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            const element = document.getElementById(`experience${id}`);
            if (element) {
                element.remove();
                activeExperienceIds.delete(id);
            }
        }
    });
}

// Training
function addTraining() {
    if (activeTrainingIds.size >= 5) {
        Swal.fire({
            title: 'ถึงจำนวนสูงสุดแล้ว',
            text: 'สามารถเพิ่มการฝึกอบรมได้สูงสุด 5 รายการ',
            icon: 'info',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง'
        });
        return;
    }
    
    const newId = getNextAvailableId(activeTrainingIds);
    activeTrainingIds.add(newId);
    
    const container = document.getElementById('trainingContainer');
    const html = `
        <div class="training-entry border rounded p-3 mb-3" id="training${newId}">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6>การฝึกอบรม ${newId}</h6>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeTraining(${newId})">ลบ</button>
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label class="form-label">หลักสูตร</label>
                    <input type="text" class="form-control" id="course${newId}" name="course${newId}">
                </div>
                <div class="col-md-6">
                    <label class="form-label">สถานที่ฝึกอบรม</label>
                    <input type="text" class="form-control" id="coursePlace${newId}" name="coursePlace${newId}">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label class="form-label">ประกาศนียบัตร</label>
                    <input type="text" class="form-control" id="diploma${newId}" name="diploma${newId}">
                </div>
                <div class="col-md-6">
                    <label class="form-label">ระยะเวลา</label>
                    <input type="text" class="form-control" id="coursesTime${newId}" name="coursesTime${newId}">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
    setupNumberInputPrevention();
}

function removeTraining(id) {
    Swal.fire({
        title: 'ยืนยันการลบ?',
        text: 'คุณต้องการลบการฝึกอบรมรายการนี้หรือไม่?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0f5132',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            const element = document.getElementById(`training${id}`);
            if (element) {
                element.remove();
                activeTrainingIds.delete(id);
            }
        }
    });
}

// Language
function addLanguage() {
    if (activeLanguageIds.size >= 3) {
        Swal.fire({
            title: 'ถึงจำนวนสูงสุดแล้ว',
            text: 'สามารถเพิ่มทักษะภาษาได้สูงสุด 3 ภาษา',
            icon: 'info',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง'
        });
        return;
    }
    
    const newId = getNextAvailableId(activeLanguageIds);
    activeLanguageIds.add(newId);
    
    const container = document.getElementById('languageContainer');
    const html = `
        <div class="language-entry border rounded p-3 mb-3" id="language${newId}">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6>ภาษา ${newId}</h6>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeLanguage(${newId})">ลบ</button>
            </div>
            <div class="row mb-2">
                <div class="col-md-12">
                    <label class="form-label">ภาษา</label>
                    <input type="text" class="form-control" id="languegeSkill${newId}" name="languegeSkill${newId}">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-3">
                    <label class="form-label">พูด</label>
                    <select class="form-select" id="speak${newId}" name="speak${newId}">
                        <option value="">เลือก</option>
                        <option value="พอใช้">พอใช้</option>
                        <option value="ดี">ดี</option>
                        <option value="ดีมาก">ดีมาก</option>
                        <option value="ดีเลิศ">ดีเลิศ</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">อ่าน</label>
                    <select class="form-select" id="read${newId}" name="read${newId}">
                        <option value="">เลือก</option>
                        <option value="พอใช้">พอใช้</option>
                        <option value="ดี">ดี</option>
                        <option value="ดีมาก">ดีมาก</option>
                        <option value="ดีเลิศ">ดีเลิศ</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">เขียน</label>
                    <select class="form-select" id="write${newId}" name="write${newId}">
                        <option value="">เลือก</option>
                        <option value="พอใช้">พอใช้</option>
                        <option value="ดี">ดี</option>
                        <option value="ดีมาก">ดีมาก</option>
                        <option value="ดีเลิศ">ดีเลิศ</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">ฟัง</label>
                    <select class="form-select" id="listen${newId}" name="listen${newId}">
                        <option value="">เลือก</option>
                        <option value="พอใช้">พอใช้</option>
                        <option value="ดี">ดี</option>
                        <option value="ดีมาก">ดีมาก</option>
                        <option value="ดีเลิศ">ดีเลิศ</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function removeLanguage(id) {
    Swal.fire({
        title: 'ยืนยันการลบ?',
        text: 'คุณต้องการลบทักษะภาษารายการนี้หรือไม่?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0f5132',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            const element = document.getElementById(`language${id}`);
            if (element) {
                element.remove();
                activeLanguageIds.delete(id);
            }
        }
    });
}

// Sibling
function addSibling() {
    if (activeSiblingIds.size >= 5) {
        Swal.fire({
            title: 'ถึงจำนวนสูงสุดแล้ว',
            text: 'สามารถเพิ่มข้อมูลพี่น้องได้สูงสุด 5 คน',
            icon: 'info',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง'
        });
        return;
    }
    
    const newId = getNextAvailableId(activeSiblingIds);
    activeSiblingIds.add(newId);
    
    const container = document.getElementById('siblingsContainer');
    const html = `
        <div class="sibling-entry border rounded p-3 mb-3" id="sibling${newId}">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6>พี่/น้อง ${newId}</h6>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeSibling(${newId})">ลบ</button>
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label class="form-label">ชื่อ-นามสกุล</label>
                    <input type="text" class="form-control" id="siblingFullname${newId}" name="siblingFullname${newId}">
                </div>
                <div class="col-md-2">
                    <label class="form-label">อายุ</label>
                    <input type="number" class="form-control no-spin" id="siblingAge${newId}" name="siblingAge${newId}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">อาชีพ</label>
                    <input type="text" class="form-control" id="siblingJob${newId}" name="siblingJob${newId}">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-8">
                    <label class="form-label">ที่อยู่</label>
                    <input type="text" class="form-control" id="siblingofficeAddress${newId}" name="siblingofficeAddress${newId}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">เบอร์โทร</label>
                    <input type="tel" class="form-control" id="siblingofficeTel${newId}" name="siblingofficeTel${newId}">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
    setupNumberInputPrevention();
}

function removeSibling(id) {
    Swal.fire({
        title: 'ยืนยันการลบ?',
        text: 'คุณต้องการลบข้อมูลพี่น้องรายการนี้หรือไม่?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0f5132',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            const element = document.getElementById(`sibling${id}`);
            if (element) {
                element.remove();
                activeSiblingIds.delete(id);
            }
        }
    });
}

// Reference
function addReference() {
    if (activeReferenceIds.size >= 3) {
        Swal.fire({
            title: 'ถึงจำนวนสูงสุดแล้ว',
            text: 'สามารถเพิ่มบุคคลอ้างอิงได้สูงสุด 3 คน',
            icon: 'info',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง'
        });
        return;
    }
    
    const newId = getNextAvailableId(activeReferenceIds);
    activeReferenceIds.add(newId);
    
    const container = document.getElementById('referenceContainer');
    const html = `
        <div class="reference-entry border rounded p-3 mb-3" id="reference${newId}">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6>บุคคลอ้างอิง ${newId}</h6>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeReference(${newId})">ลบ</button>
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label class="form-label">ชื่อ-นามสกุล</label>
                    <input type="text" class="form-control" id="referencepersonName${newId}" name="referencepersonName${newId}">
                </div>
                <div class="col-md-6">
                    <label class="form-label">ตำแหน่ง</label>
                    <input type="text" class="form-control" id="referencepersonJob${newId}" name="referencepersonJob${newId}">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-8">
                    <label class="form-label">สถานที่ทำงาน ที่อยู่</label>
                    <input type="text" class="form-control" id="referencepersonofficeAddress${newId}" name="referencepersonofficeAddress${newId}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">โทรศัพท์</label>
                    <input type="tel" class="form-control" id="referencepersonTel${newId}" name="referencepersonTel${newId}">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
    setupNumberInputPrevention();
}

function removeReference(id) {
    Swal.fire({
        title: 'ยืนยันการลบ?',
        text: 'คุณต้องการลบบุคคลอ้างอิงรายการนี้หรือไม่?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0f5132',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            const element = document.getElementById(`reference${id}`);
            if (element) {
                element.remove();
                activeReferenceIds.delete(id);
            }
        }
    });
}

// ==================== Step Navigation ====================
function changeStep(direction) {
    // เช็ค checkbox1 ใน step 1 ก่อน
    if (direction === 1 && currentStep === 1) {
        const cb = document.getElementById('checkbox1');
        if (cb && cb.required && !cb.checked) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณายืนยัน',
                text: 'กรุณาเลือกยินดีรับตำแหน่งตามที่สถาบันพระปกเกล้าพิจารณาความเหมาะสมก่อนดำเนินการต่อ',
                confirmButtonColor: '#0f5132',
                confirmButtonText: 'ตกลง'
            });
            return;
        }
    }

    // Validate step ก่อนไปต่อ
    if (direction === 1 && !validateStep(currentStep)) {
        return;
    }

    // เปลี่ยน step
    const newStep = currentStep + direction;
    if (newStep < 1 || newStep > totalSteps) return;

    currentStep = newStep;
    showStep(currentStep);
}

function showStep(step) {
    document.querySelectorAll('.form-step').forEach(stepElement => {
        stepElement.classList.add('hidden');
    });

    document.getElementById(`step${step}`).classList.remove('hidden');

    const progress = (step / totalSteps) * 100;
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${progress}%`;
    progressBar.textContent = `ขั้นตอน ${step}/${totalSteps}`;

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    prevBtn.style.display = step === 1 ? 'none' : 'block';
    nextBtn.style.display = step === totalSteps ? 'none' : 'block';
    submitBtn.style.display = step === totalSteps ? 'block' : 'none';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== Validation ====================
function validateStep(step) {
    const stepElement = document.getElementById(`step${step}`);
    const requiredFields = stepElement.querySelectorAll('[required]');
    
    // ⭐ เช็ค number fields ทั้งหมดในหน้านี้ก่อน (ทั้ง required และไม่ required)
    const allNumberFields = stepElement.querySelectorAll('input[type="number"]');
    for (let field of allNumberFields) {
        if (field.offsetParent === null) continue; // ข้ามที่ซ่อนอยู่
        
        const value = field.value.trim();
        if (value && !isValidNumber(value)) {
            const label = field.previousElementSibling?.textContent || field.placeholder || 'ข้อมูล';
            Swal.fire({
                title: 'ข้อมูลไม่ถูกต้อง',
                html: `<strong>${label}</strong><br>กรุณากรอกตัวเลขที่ถูกต้อง<br><small>ห้ามใส่เฉพาะจุด (.) หรือขีด (-) หรือตัวอักษร</small>`,
                icon: 'error',
                confirmButtonColor: '#0f5132',
                confirmButtonText: 'แก้ไข'
            });
            field.focus();
            field.select();
            return false;
        }
    }
    
    // ตรวจสอบ required fields
    for (let field of requiredFields) {
        if (field.offsetParent === null) continue;
        
        const label = field.previousElementSibling?.textContent || field.placeholder || 'ข้อมูล';
        const value = field.value.trim();
        
        // ช่อง number
        if (field.type === 'number') {
            if (!value) {
                Swal.fire({
                    title: 'ข้อมูลไม่ครบถ้วน',
                    text: `กรุณากรอก "${label}" ให้ครบถ้วนก่อนดำเนินการต่อ`,
                    icon: 'warning',
                    confirmButtonColor: '#0f5132',
                    confirmButtonText: 'ตกลง'
                });
                field.focus();
                return false;
            }
            
            if (!isValidNumber(value)) {
                Swal.fire({
                    title: 'ข้อมูลไม่ถูกต้อง',
                    html: `<strong>${label}</strong><br>กรุณากรอกตัวเลขที่ถูกต้อง`,
                    icon: 'error',
                    confirmButtonColor: '#0f5132',
                    confirmButtonText: 'แก้ไข'
                });
                field.value = '';
                field.focus();
                return false;
            }
        } 
        // ช่อง email
        else if (field.type === 'email') {
            if (!value) {
                Swal.fire({
                    title: 'ข้อมูลไม่ครบถ้วน',
                    text: `กรุณากรอก "${label}" ให้ครบถ้วนก่อนดำเนินการต่อ`,
                    icon: 'warning',
                    confirmButtonColor: '#0f5132',
                    confirmButtonText: 'ตกลง'
                });
                field.focus();
                return false;
            }
            
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(value)) {
                Swal.fire({
                    title: 'อีเมลไม่ถูกต้อง',
                    text: 'กรุณากรอกอีเมลในรูปแบบที่ถูกต้อง เช่น example@email.com',
                    icon: 'warning',
                    confirmButtonColor: '#0f5132',
                    confirmButtonText: 'ตกลง'
                });
                field.focus();
                return false;
            }
        } 
        // ฟิลด์ปกติ
        else {
            if (!value) {
                Swal.fire({
                    title: 'ข้อมูลไม่ครบถ้วน',
                    text: `กรุณากรอก "${label}" ให้ครบถ้วนก่อนดำเนินการต่อ`,
                    icon: 'warning',
                    confirmButtonColor: '#0f5132',
                    confirmButtonText: 'ตกลง'
                });
                field.focus();
                return false;
            }
        }
    }

    // ตรวจสอบรูปถ่าย
    if (step === 1 && !photoData) {
        Swal.fire({
            title: 'ยังไม่มีรูปถ่าย',
            text: 'กรุณาอัปโหลดรูปถ่ายก่อนดำเนินการต่อ',
            icon: 'warning',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง'
        });
        document.getElementById('photo').focus();
        return false;
    }

    // ตรวจสอบประวัติการศึกษา
    if (step === 3) {
        if (activeEducationIds.size < 1) {
            Swal.fire({
                title: 'กรุณากรอกประวัติการศึกษา',
                text: 'กรุณาเพิ่มประวัติการศึกษาอย่างน้อย 1 รายการ',
                icon: 'warning',
                confirmButtonColor: '#0f5132',
                confirmButtonText: 'ตกลง'
            });
            return false;
        }
        
        const edu1Level = document.getElementById('educationLevel1');
        const edu1Name = document.getElementById('nameofEducation1');
        const edu1Qual = document.getElementById('qualifications1');
        const edu1Field = document.getElementById('fieldofStudy1');
        
        if (!edu1Level || !edu1Level.value || 
            !edu1Name || !edu1Name.value || 
            !edu1Qual || !edu1Qual.value || 
            !edu1Field || !edu1Field.value) {
            Swal.fire({
                title: 'ข้อมูลการศึกษาไม่ครบถ้วน',
                text: 'กรุณากรอกข้อมูลประวัติการศึกษารายการที่ 1 ให้ครบถ้วน',
                icon: 'warning',
                confirmButtonColor: '#0f5132',
                confirmButtonText: 'ตกลง'
            });
            return false;
        }
    }

    return true;
}

// ==================== Form Submission ====================
async function handleSubmit(event) {
    event.preventDefault();

    // ⭐ Final validation - เช็คทุกฟิลด์อีกครั้ง
    console.log('🔍 Running final validation...');
    
    const allNumberFields = document.querySelectorAll('input[type="number"]');
    let hasInvalidField = false;
    let firstInvalidField = null;
    
    for (let field of allNumberFields) {
        if (field.offsetParent === null) continue;
        
        const value = field.value.trim();
        if (value && !isValidNumber(value)) {
            hasInvalidField = true;
            if (!firstInvalidField) {
                firstInvalidField = field;
            }
            console.error(`Invalid field: ${field.id} = "${value}"`);
        }
    }
    
    if (hasInvalidField && firstInvalidField) {
        const label = firstInvalidField.previousElementSibling?.textContent || 'ช่องนี้';
        
        Swal.fire({
            title: 'พบข้อมูลไม่ถูกต้อง',
            html: `มีช่องที่กรอกข้อมูลไม่ถูกต้อง<br><br><strong>${label}</strong><br><small>กรุณากรอกตัวเลขที่ถูกต้อง</small>`,
            icon: 'error',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'แก้ไข'
        });
        
        // Scroll ไปที่ field ที่ผิด
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalidField.focus();
        firstInvalidField.select();
        
        return;
    }

    if (!document.getElementById('confirmData').checked) {
        Swal.fire({
            title: 'กรุณายืนยันข้อมูล',
            text: 'กรุณายืนยันความถูกต้องของข้อมูลก่อนส่งใบสมัคร',
            icon: 'warning',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง'
        });
        return;
    }

    const result = await Swal.fire({
        title: 'ยืนยันการส่งใบสมัคร?',
        html: 'กรุณาตรวจสอบข้อมูลให้ครบถ้วนก่อนส่ง<br><br><strong>คุณต้องการส่งใบสมัครหรือไม่?</strong>',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0f5132',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'ยืนยัน, ส่งเลย!',
        cancelButtonText: 'ยกเลิก',
        reverseButtons: true
    });

    if (!result.isConfirmed) {
        return;
    }

    Swal.fire({
        title: 'กำลังส่งใบสมัคร...',
        html: 'กรุณารอสักครู่<br>ระบบกำลังประมวลผลข้อมูลของท่าน',
        icon: 'info',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    console.log('📤 Starting form submission...');

    try {
        const formData = collectFormData();
        console.log('📦 Sending data to server...');
        console.log('Data size:', JSON.stringify(formData).length, 'characters');
        
        const response = await sendToAppsScript(formData);
        console.log('✅ Server response:', response);

        Swal.fire({
            title: 'ส่งใบสมัครสำเร็จ!',
            html: 'ส่งใบสมัครเรียบร้อยแล้ว<br><br>กรุณาตรวจสอบอีเมลเพื่อรับเอกสารยืนยันการสมัคร',
            icon: 'success',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง',
            allowOutsideClick: false
        }).then(() => {
            sessionStorage.clear();
            window.location.href = 'index.html';
        });

    } catch (error) {
        console.error('❌ Submission error:', error);
        
        Swal.fire({
            title: 'เกิดข้อผิดพลาด',
            html: `ไม่สามารถส่งใบสมัครได้<br><br><small>${error.message}</small>`,
            icon: 'error',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ลองอีกครั้ง'
        });
    }
}

function collectFormData() {
    console.log('🔍 Collecting form data...');
    
    const data = {
        consentDate: sessionStorage.getItem('consentDate') || new Date().toISOString(),
        photo: photoData,
        
        position: getValue('position'),
        department: getValue('department'),
        checkbox1: getChecked('checkbox1'),
        salary: getValue('salary'),
        startDate: getValue('startDate'),
        experienceDetail: getValue('experienceDetail'),
        
        fullnameTH: getValue('fullnameTH'),
        fullnameEN: getValue('fullnameEN'),
        dateOfbirth: getValue('dateOfbirth'),
        age: getValue('age'),
        weight: getValue('weight'),
        height: getValue('height'),
        placeofresidence: getValue('placeofresidence'),
        nationality: getValue('nationality'),
        religion: getValue('religion'),
        bloodtype: getValue('bloodtype'),
        national_id: getValue('national_id'),
        expired: getValue('expired'),
        place_idcard: getValue('place_idcard'),
        militaryStatus: getValue('militaryStatus'),
        maritalStatus: getValue('maritalStatus'),
        
        addressNow: getValue('addressNow'),
        tel: getValue('tel'),
        email: getValue('email'),
        addressType: getValue('addressType'),
        addressHometown: getValue('addressHometown') || getValue('addressNow'),
        
        contactpersonName: getValue('contactpersonName'),
        contactpersonRelationship: getValue('contactpersonRelationship'),
        contactpersonAddress: getValue('contactpersonAddress') || getValue('addressNow'),
        contactpersonTel: getValue('contactpersonTel'),
        contactpersonEmail: getValue('contactpersonEmail'),
        
        // ⭐ เก็บข้อมูลจาก active IDs จริง
        ...collectDynamicDataFromSet('education', activeEducationIds, [
            'educationLevel', 'eduSincetheyear', 'eduUntiltheyear',
            'nameofEducation', 'qualifications', 'fieldofStudy', 'gpa'
        ]),
        
        studying: getChecked('studying'),
        studyfieldofStudy: getValue('studyfieldofStudy'),
        studyfieldType: getValue('studyfieldType'),
        nameofeducationNow: getValue('nameofeducationNow'),
        studyingSection: getValue('studyingSection'),
        expectedgraduationYear: getValue('expectedgraduationYear'),
        
        ...collectDynamicDataFromSet('experience', activeExperienceIds, [
            'companyName', 'businessType', 'companyAddress', 'companyTel',
            'jobDescription', 'comp{i}Start', 'comp{i}End',
            'comp{i}positionStart', 'comp{i}positionEnd',
            'comp{i}salaryStart', 'comp{i}salaryEnd', 'comp{i}salaryEtc',
            'comp{i}Reasonsforleaving'
        ]),
        
        ...collectDynamicDataFromSet('training', activeTrainingIds, [
            'course', 'coursePlace', 'diploma', 'coursesTime'
        ]),
        
        academicWorks: getValue('academicWorks'),
        computerSkill: getValue('computerSkill'),
        
        ...collectDynamicDataFromSet('language', activeLanguageIds, [
            'languegeSkill', 'speak', 'read', 'write', 'listen'
        ]),
        
        otherAbilities: getValue('otherAbilities'),
        hobbiesandotherInterests: getValue('hobbiesandotherInterests'),
        sport1: getValue('sport1'),
        sport2: getValue('sport2'),
        sport3: getValue('sport3'),
        
        fatherFullname: getValue('fatherFullname'),
        fatherAge: getValue('fatherAge'),
        fatherJob: getValue('fatherJob'),
        fatherofficeAddress: getValue('fatherofficeAddress'),
        fatherofficeTel: getValue('fatherofficeTel'),
        motherFullname: getValue('motherFullname'),
        motherAge: getValue('motherAge'),
        motherJob: getValue('motherJob'),
        motherofficeAddress: getValue('motherofficeAddress'),
        motherofficeTel: getValue('motherofficeTel'),
        
        husbandwifeFullname: getValue('husbandwifeFullname'),
        husbandwifeAge: getValue('husbandwifeAge'),
        husbandwifeJob: getValue('husbandwifeJob'),
        husbandwifeAddress: getValue('husbandwifeAddress'),
        husbandwifeofficeTel: getValue('husbandwifeofficeTel'),
        
        numberofSiblings: getValue('numberofSiblings'),
        
        ...collectDynamicDataFromSet('sibling', activeSiblingIds, [
            'siblingFullname', 'siblingAge', 'siblingJob',
            'siblingofficeAddress', 'siblingofficeTel'
        ]),
        
        noChildren: getChecked('noChildren'),
        numberofChildren: getValue('numberofChildren'),
        
        physicalimpairmentNo: getChecked('physicalimpairmentNo'),
        physicalimpairmentType: getValue('physicalimpairmentType'),
        illnessoraccidentTypeNo: getChecked('illnessoraccidentTypeNo'),
        illnessoraccidentType: getValue('illnessoraccidentType'),
        health: getValue('health'),
        
        bankruptorcommittedaCriminalNo: getChecked('bankruptorcommittedaCriminalNo'),
        bankruptorcommittedaCriminaldetail: getValue('bankruptorcommittedaCriminaldetail'),
        firedfromaJobNo: getChecked('firedfromaJobNo'),
        firedfromaJobreason: getValue('firedfromaJobreason'),
        acquaintanceattheKPINo: getChecked('acquaintanceattheKPINo'),
        acquaintanceattheKPIname: getValue('acquaintanceattheKPIname'),
        additionalInformation: getValue('additionalInformation'),
        
        ...collectDynamicDataFromSet('reference', activeReferenceIds, [
            'referencepersonName', 'referencepersonJob',
            'referencepersonofficeAddress', 'referencepersonTel'
        ]),
        
        documents: documentsData,
        
        timestamp: new Date().toISOString()
    };
    
    console.log('✅ Form data collected');
    
    return data;
}

// แก้ไขฟังก์ชัน getValue() 
function getValue(id) {
    const element = document.getElementById(id);
    if (!element) return '';
    
    let value = element.value;
    
    // ลบช่องว่างหน้าหลัง
    value = value.trim();
    
    // 🔥 แก้ปัญหา: ถ้าเป็น "-" หรือค่าว่าง ให้คืนค่าว่าง
    if (value === '-' || value === '—' || value === 'ไม่มี' || value === 'ไม่ระบุ') {
        return '';
    }
    
    // 🔥 สำหรับ input type="number" - validate และแปลงค่า
    if (element.type === 'number') {
        if (!isValidNumber(value)) {
            console.warn(`Invalid number in field ${id}: "${value}"`);
            return '';
        }
        // แปลงเป็น string ของตัวเลข (ตัด leading zeros)
        const num = parseFloat(value);
        return isNaN(num) ? '' : num.toString();
    }
    
    return value;
}

function getChecked(id) {
    const element = document.getElementById(id);
    return element ? element.checked : false;
}

// ✅ ฟังก์ชันเก็บข้อมูลจาก active IDs
function collectDynamicDataFromSet(prefix, activeSet, fields) {
    const data = {};
    
    activeSet.forEach(id => {
        fields.forEach(field => {
            // ถ้ามี {i} ให้แทนที่ด้วย id
            let fullFieldName;
            if (field.includes('{i}')) {
                fullFieldName = field.replace('{i}', id);
            } else {
                // ไม่มี {i} ให้เพิ่ม id ต่อท้าย
                fullFieldName = `${field}${id}`;
            }
            data[fullFieldName] = getValue(fullFieldName);
        });
    });
    
    return data;
}

async function sendToAppsScript(formData) {
    const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    });

    return { success: true };
}
