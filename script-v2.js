// Configuration
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzn9U8atjm7reFAaxbuMJ86TVohmYXqk-0hxmFHTdYuKeQFVJJHcVFxe3kQz_7qJlwxiw/exec';

// Global Variables
let currentStep = 1;
const totalSteps = 5;
let photoData = null;
let educationCount = 0;
let experienceCount = 0;
let trainingCount = 0;
let languageCount = 0;
let siblingCount = 0;
let referenceCount = 0;

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
    
    showStep(currentStep);
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
        
        // แสดง Toast notification
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
        
        // แสดง Toast notification
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

// Education
function addEducation() {
    if (educationCount >= 4) {
        Swal.fire({
            title: 'ถึงจำนวนสูงสุดแล้ว',
            text: 'สามารถเพิ่มประวัติการศึกษาได้สูงสุด 4 รายการ',
            icon: 'info',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง'
        });
        return;
    }
    educationCount++;
    
    // ⭐ entry แรกต้อง required
    const isFirstEntry = educationCount === 1;
    const requiredAttr = isFirstEntry ? 'required' : '';
    const requiredClass = isFirstEntry ? 'required' : '';
    
    const container = document.getElementById('educationContainer');
    const html = `
        <div class="education-entry border rounded p-3 mb-3" id="education${educationCount}">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6>ประวัติการศึกษา ${educationCount} ${isFirstEntry ? '<span style="color: #dc2626;">*</span>' : ''}</h6>
                ${!isFirstEntry ? `<button type="button" class="btn btn-sm btn-outline-danger" onclick="removeEducation(${educationCount})">ลบ</button>` : ''}
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label class="form-label ${requiredClass}">ระดับการศึกษา</label>
                    <select class="form-select" id="educationLevel${educationCount}" name="educationLevel${educationCount}" ${requiredAttr}>
                        <option value="">เลือก</option>
                        <option value="ปริญญาตรี">ปริญญาตรี</option>
                        <option value="ปริญญาโท">ปริญญาโท</option>
                        <option value="ปริญญาเอก">ปริญญาเอก</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label ${requiredClass}">ตั้งแต่ปี (พ.ศ.)</label>
                    <input type="number" class="form-control no-spin" id="eduSincetheyear${educationCount}" name="eduSincetheyear${educationCount}" ${requiredAttr}>
                </div>
                <div class="col-md-3">
                    <label class="form-label ${requiredClass}">จนถึงปี (พ.ศ.)</label>
                    <input type="number" class="form-control no-spin" id="eduUntiltheyear${educationCount}" name="eduUntiltheyear${educationCount}" ${requiredAttr}>
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-12">
                    <label class="form-label ${requiredClass}">ชื่อสถานศึกษา</label>
                    <input type="text" class="form-control" id="nameofEducation${educationCount}" name="nameofEducation${educationCount}" ${requiredAttr}>
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-4">
                    <label class="form-label ${requiredClass}">วุฒิการศึกษา</label>
                    <input type="text" class="form-control" id="qualifications${educationCount}" name="qualifications${educationCount}" ${requiredAttr}>
                </div>
                <div class="col-md-5">
                    <label class="form-label ${requiredClass}">สาขาวิชา</label>
                    <input type="text" class="form-control" id="fieldofStudy${educationCount}" name="fieldofStudy${educationCount}" ${requiredAttr}>
                </div>
                <div class="col-md-3">
                    <label class="form-label">GPA</label>
                    <input type="number" step="0.01" class="form-control no-spin" id="gpa${educationCount}" name="gpa${educationCount}">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function removeEducation(index) {
    // ไม่ให้ลบ entry แรก
    if (index === 1) {
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
            const element = document.getElementById(`education${index}`);
            if (element) {
                element.remove();
            }
        }
    });
}

// Experience
function addExperience() {
    if (experienceCount >= 3) {
        Swal.fire({
            title: 'ถึงจำนวนสูงสุดแล้ว',
            text: 'สามารถเพิ่มประสบการณ์ทำงานได้สูงสุด 3 รายการ',
            icon: 'info',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง'
        });
        return;
    }
    experienceCount++;
    
    const container = document.getElementById('experienceContainer');
    const html = `
        <div class="experience-entry border rounded p-3 mb-3" id="experience${experienceCount}">
            <h6>ประสบการณ์ทำงาน ${experienceCount}</h6>
            <div class="row mb-2">
                <div class="col-md-8">
                    <label class="form-label">ชื่อบริษัท</label>
                    <input type="text" class="form-control" id="companyName${experienceCount}" name="companyName${experienceCount}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">ประเภทธุรกิจ</label>
                    <input type="text" class="form-control" id="businessType${experienceCount}" name="businessType${experienceCount}">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-8">
                    <label class="form-label">ที่อยู่บริษัท</label>
                    <input type="text" class="form-control" id="companyAddress${experienceCount}" name="companyAddress${experienceCount}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">โทรศัพท์</label>
                    <input type="tel" class="form-control" id="companyTel${experienceCount}" name="companyTel${experienceCount}">
                </div>
            </div>
            <div class="mb-2">
                <label class="form-label">ลักษณะงานที่รับผิดชอบ</label>
                <textarea class="form-control" id="jobDescription${experienceCount}" name="jobDescription${experienceCount}" rows="2"></textarea>
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label class="form-label">วันที่เริ่มงาน</label>
                    <input type="date" class="form-control" id="comp${experienceCount}Start" name="comp${experienceCount}Start">
                </div>
                <div class="col-md-6">
                    <label class="form-label">วันที่สิ้นสุด</label>
                    <input type="date" class="form-control" id="comp${experienceCount}End" name="comp${experienceCount}End">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label class="form-label">ตำแหน่งแรกเข้า</label>
                    <input type="text" class="form-control" id="comp${experienceCount}positionStart" name="comp${experienceCount}positionStart">
                </div>
                <div class="col-md-6">
                    <label class="form-label">ตำแหน่งสุดท้าย</label>
                    <input type="text" class="form-control" id="comp${experienceCount}positionEnd" name="comp${experienceCount}positionEnd">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-4">
                    <label class="form-label">เงินเดือนแรกเข้า</label>
                    <input type="number" class="form-control no-spin" id="comp${experienceCount}salaryStart" name="comp${experienceCount}salaryStart">
                </div>
                <div class="col-md-4">
                    <label class="form-label">เงินเดือนสุดท้าย</label>
                    <input type="number" class="form-control no-spin" id="comp${experienceCount}salaryEnd" name="comp${experienceCount}salaryEnd">
                </div>
                <div class="col-md-4">
                    <label class="form-label">รายได้อื่นๆ</label>
                    <input type="number" class="form-control no-spin" id="comp${experienceCount}salaryEtc" name="comp${experienceCount}salaryEtc">
                </div>
            </div>
            <div class="mb-2">
                <label class="form-label">เหตุผลที่ออกจากงาน</label>
                <textarea class="form-control" id="comp${experienceCount}Reasonsforleaving" name="comp${experienceCount}Reasonsforleaving" rows="2"></textarea>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

// Training
function addTraining() {
    if (trainingCount >= 5) {
        Swal.fire({
            title: 'ถึงจำนวนสูงสุดแล้ว',
            text: 'สามารถเพิ่มการฝึกอบรมได้สูงสุด 5 รายการ',
            icon: 'info',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง'
        });
        return;
    }
    trainingCount++;
    
    const container = document.getElementById('trainingContainer');
    const html = `
        <div class="training-entry border rounded p-3 mb-3" id="training${trainingCount}">
            <h6>การฝึกอบรม ${trainingCount}</h6>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label class="form-label">หลักสูตร</label>
                    <input type="text" class="form-control" id="course${trainingCount}" name="course${trainingCount}">
                </div>
                <div class="col-md-6">
                    <label class="form-label">สถานที่ฝึกอบรม</label>
                    <input type="text" class="form-control" id="coursePlace${trainingCount}" name="coursePlace${trainingCount}">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label class="form-label">ประกาศนียบัตร</label>
                    <input type="text" class="form-control" id="diploma${trainingCount}" name="diploma${trainingCount}">
                </div>
                <div class="col-md-6">
                    <label class="form-label">ระยะเวลา</label>
                    <input type="text" class="form-control" id="coursesTime${trainingCount}" name="coursesTime${trainingCount}">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

// Language
function addLanguage() {
    if (languageCount >= 3) {
        Swal.fire({
            title: 'ถึงจำนวนสูงสุดแล้ว',
            text: 'สามารถเพิ่มทักษะภาษาได้สูงสุด 3 ภาษา',
            icon: 'info',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง'
        });
        return;
    }
    languageCount++;
    
    const container = document.getElementById('languageContainer');
    const html = `
        <div class="language-entry border rounded p-3 mb-3" id="language${languageCount}">
            <h6>ภาษา ${languageCount}</h6>
            <div class="row mb-2">
                <div class="col-md-12">
                    <label class="form-label">ภาษา</label>
                    <input type="text" class="form-control" id="languegeSkill${languageCount}" name="languegeSkill${languageCount}">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-3">
                    <label class="form-label">พูด</label>
                    <select class="form-select" id="speak${languageCount}" name="speak${languageCount}">
                        <option value="">เลือก</option>
                        <option value="พอใช้">พอใช้</option>
                        <option value="ดี">ดี</option>
                        <option value="ดีมาก">ดีมาก</option>
                        <option value="ดีเลิศ">ดีเลิศ</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">อ่าน</label>
                    <select class="form-select" id="read${languageCount}" name="read${languageCount}">
                        <option value="">เลือก</option>
                        <option value="พอใช้">พอใช้</option>
                        <option value="ดี">ดี</option>
                        <option value="ดีมาก">ดีมาก</option>
                        <option value="ดีเลิศ">ดีเลิศ</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">เขียน</label>
                    <select class="form-select" id="write${languageCount}" name="write${languageCount}">
                        <option value="">เลือก</option>
                        <option value="พอใช้">พอใช้</option>
                        <option value="ดี">ดี</option>
                        <option value="ดีมาก">ดีมาก</option>
                        <option value="ดีเลิศ">ดีเลิศ</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">ฟัง</label>
                    <select class="form-select" id="listen${languageCount}" name="listen${languageCount}">
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

// Sibling
function addSibling() {
    if (siblingCount >= 5) {
        Swal.fire({
            title: 'ถึงจำนวนสูงสุดแล้ว',
            text: 'สามารถเพิ่มข้อมูลพี่น้องได้สูงสุด 5 คน',
            icon: 'info',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง'
        });
        return;
    }
    siblingCount++;
    
    const container = document.getElementById('siblingsContainer');
    const html = `
        <div class="sibling-entry border rounded p-3 mb-3" id="sibling${siblingCount}">
            <h6>พี่/น้อง ${siblingCount}</h6>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label class="form-label">ชื่อ-นามสกุล</label>
                    <input type="text" class="form-control" id="siblingFullname${siblingCount}" name="siblingFullname${siblingCount}">
                </div>
                <div class="col-md-2">
                    <label class="form-label">อายุ</label>
                    <input type="number" class="form-control" id="siblingAge${siblingCount}" name="siblingAge${siblingCount}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">อาชีพ</label>
                    <input type="text" class="form-control" id="siblingJob${siblingCount}" name="siblingJob${siblingCount}">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-8">
                    <label class="form-label">ที่อยู่</label>
                    <input type="text" class="form-control" id="siblingofficeAddress${siblingCount}" name="siblingofficeAddress${siblingCount}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">เบอร์โทร</label>
                    <input type="tel" class="form-control" id="siblingofficeTel${siblingCount}" name="siblingofficeTel${siblingCount}">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

// Reference
function addReference() {
    if (referenceCount >= 3) {
        Swal.fire({
            title: 'ถึงจำนวนสูงสุดแล้ว',
            text: 'สามารถเพิ่มบุคคลอ้างอิงได้สูงสุด 3 คน',
            icon: 'info',
            confirmButtonColor: '#0f5132',
            confirmButtonText: 'ตกลง'
        });
        return;
    }
    referenceCount++;
    
    const container = document.getElementById('referenceContainer');
    const html = `
        <div class="reference-entry border rounded p-3 mb-3" id="reference${referenceCount}">
            <h6>บุคคลอ้างอิง ${referenceCount}</h6>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label class="form-label">ชื่อ-นามสกุล</label>
                    <input type="text" class="form-control" id="referencepersonName${referenceCount}" name="referencepersonName${referenceCount}">
                </div>
                <div class="col-md-6">
                    <label class="form-label">ตำแหน่ง</label>
                    <input type="text" class="form-control" id="referencepersonJob${referenceCount}" name="referencepersonJob${referenceCount}">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-8">
                    <label class="form-label">สถานที่ทำงาน ที่อยู่</label>
                    <input type="text" class="form-control" id="referencepersonofficeAddress${referenceCount}" name="referencepersonofficeAddress${referenceCount}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">โทรศัพท์</label>
                    <input type="tel" class="form-control" id="referencepersonTel${referenceCount}" name="referencepersonTel${referenceCount}">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

// ==================== Step Navigation ====================
function changeStep(direction) {
    if (direction === 1 && !validateStep(currentStep)) {
        return;
    }

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

function validateStep(step) {
    const stepElement = document.getElementById(`step${step}`);
    const requiredFields = stepElement.querySelectorAll('[required]');
    
    for (let field of requiredFields) {
        if (field.offsetParent === null) continue; // Skip hidden fields
        
        if (!field.value.trim()) {
            Swal.fire({
                title: 'ข้อมูลไม่ครบถ้วน',
                text: `กรุณากรอก "${field.previousElementSibling?.textContent || 'ข้อมูล'}" ให้ครบถ้วนก่อนดำเนินการต่อ`,
                icon: 'warning',
                confirmButtonColor: '#0f5132',
                confirmButtonText: 'ตกลง'
            });
            field.focus();
            return false;
        }
    }

    // ตรวจสอบรูปถ่ายในขั้นตอนที่ 1
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
    // ⭐ เพิ่มส่วนนี้: เช็คประวัติการศึกษา (step 3)
    if (step === 3) {
        // เช็คว่ามี education entry อย่างน้อย 1 อัน
        if (educationCount < 1) {
            Swal.fire({
                title: 'กรุณากรอกประวัติการศึกษา',
                text: 'กรุณาเพิ่มประวัติการศึกษาอย่างน้อย 1 รายการ',
                icon: 'warning',
                confirmButtonColor: '#0f5132',
                confirmButtonText: 'ตกลง'
            });
            return false;
        }
        
        // เช็คว่า entry แรกมีข้อมูลครบ
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

    // แสดง confirmation dialog ก่อนส่ง
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

    // แสดง Loading
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

        // ปิด loading และแสดง success
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
        
        // Basic info
        position: getValue('position'),
        department: getValue('department'),
        checkbox1: getChecked('checkbox1'),
        salary: getValue('salary'),
        startDate: getValue('startDate'),
        experienceDetail: getValue('experienceDetail'),
        
        // Personal info
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
        
        // Address
        addressNow: getValue('addressNow'),
        tel: getValue('tel'),
        email: getValue('email'),
        addressType: getValue('addressType'),
        addressHometown: getValue('addressHometown') || getValue('addressNow'),
        
        // Contact person
        contactpersonName: getValue('contactpersonName'),
        contactpersonRelationship: getValue('contactpersonRelationship'),
        contactpersonAddress: getValue('contactpersonAddress') || getValue('addressNow'),
        contactpersonTel: getValue('contactpersonTel'),
        contactpersonEmail: getValue('contactpersonEmail'),
        
        // Education (dynamic)
        ...collectDynamicData('education', educationCount, [
            'educationLevel', 'eduSincetheyear', 'eduUntiltheyear',
            'nameofEducation', 'qualifications', 'fieldofStudy', 'gpa'
        ]),
        
        // Studying
        studying: getChecked('studying'),
        studyfieldofStudy: getValue('studyfieldofStudy'),
        studyfieldType: getValue('studyfieldType'),
        nameofeducationNow: getValue('nameofeducationNow'),
        studyingSection: getValue('studyingSection'),
        expectedgraduationYear: getValue('expectedgraduationYear'),
        
        // Experience (dynamic)
        ...collectDynamicData('experience', experienceCount, [
            'companyName', 'businessType', 'companyAddress', 'companyTel',
            'jobDescription', 'comp{i}Start', 'comp{i}End',
            'comp{i}positionStart', 'comp{i}positionEnd',
            'comp{i}salaryStart', 'comp{i}salaryEnd', 'comp{i}salaryEtc',
            'comp{i}Reasonsforleaving'
        ]),
        
        // Training (dynamic)
        ...collectDynamicData('training', trainingCount, [
            'course', 'coursePlace', 'diploma', 'coursesTime'
        ]),
        
        // Skills
        academicWorks: getValue('academicWorks'),
        computerSkill: getValue('computerSkill'),
        
        // Language (dynamic)
        ...collectDynamicData('language', languageCount, [
            'languegeSkill', 'speak', 'read', 'write', 'listen'
        ]),
        
        otherAbilities: getValue('otherAbilities'),
        hobbiesandotherInterests: getValue('hobbiesandotherInterests'),
        sport1: getValue('sport1'),
        sport2: getValue('sport2'),
        sport3: getValue('sport3'),
        
        // Family
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
        
        // Husband/Wife
        husbandwifeFullname: getValue('husbandwifeFullname'),
        husbandwifeAge: getValue('husbandwifeAge'),
        husbandwifeJob: getValue('husbandwifeJob'),
        husbandwifeAddress: getValue('husbandwifeAddress'),
        husbandwifeofficeTel: getValue('husbandwifeofficeTel'),
        
        numberofSiblings: getValue('numberofSiblings'),
        
        // Siblings (dynamic)
        ...collectDynamicData('sibling', siblingCount, [
            'siblingFullname', 'siblingAge', 'siblingJob',
            'siblingofficeAddress', 'siblingofficeTel'
        ]),
        
        noChildren: getChecked('noChildren'),
        numberofChildren: getValue('numberofChildren'),
        
        // Health
        physicalimpairmentNo: getChecked('physicalimpairmentNo'),
        physicalimpairmentType: getValue('physicalimpairmentType'),
        illnessoraccidentTypeNo: getChecked('illnessoraccidentTypeNo'),
        illnessoraccidentType: getValue('illnessoraccidentType'),
        health: getValue('health'),
        
        // Other info
        bankruptorcommittedaCriminalNo: getChecked('bankruptorcommittedaCriminalNo'),
        bankruptorcommittedaCriminaldetail: getValue('bankruptorcommittedaCriminaldetail'),
        firedfromaJobNo: getChecked('firedfromaJobNo'),
        firedfromaJobreason: getValue('firedfromaJobreason'),
        acquaintanceattheKPINo: getChecked('acquaintanceattheKPINo'),
        acquaintanceattheKPIname: getValue('acquaintanceattheKPIname'),
        additionalInformation: getValue('additionalInformation'),
        
        // References (dynamic)
        ...collectDynamicData('reference', referenceCount, [
            'referencepersonName', 'referencepersonJob',
            'referencepersonofficeAddress', 'referencepersonTel'
        ]),
        
        // Documents
        documents: documentsData,
        
        timestamp: new Date().toISOString()
    };
    
    // Log summary
    console.log('✅ Form data collected:');
    console.log('  - Photo:', data.photo ? `Yes (${data.photo.length} chars)` : 'No');
    console.log('  - Documents:', data.documents);
    
    if (data.documents) {
        console.log('  - Document details:');
        for (const [key, value] of Object.entries(data.documents)) {
            if (value && value.data) {
                console.log(`    * ${key}: ${value.name} (${value.data.length} chars)`);
            }
        }
    }
    
    return data;
}

function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : '';
}

function getChecked(id) {
    const element = document.getElementById(id);
    return element ? element.checked : false;
}

function collectDynamicData(prefix, count, fields) {
    const data = {};
    
    for (let i = 1; i <= count; i++) {
        fields.forEach(field => {
            let fieldName = field.replace('{i}', i);
            const fullFieldName = fieldName.includes(prefix) ? fieldName : `${fieldName}${i}`;
            data[fullFieldName] = getValue(fullFieldName);
        });
    }
    
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

function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

function changeStep(delta) {
    // ถ้ากดไปข้างหน้าจาก step1 ให้ตรวจสอบ checkbox1
    const currentStep = document.querySelector('.form-step:not(.hidden)');
    const currentId = currentStep && currentStep.id;

    if (delta > 0 && currentId === 'step1') {
        const cb = document.getElementById('checkbox1');
        if (cb && cb.required && !cb.checked) {
            // ใช้ SweetAlert2 ที่มีอยู่แล้ว
            Swal.fire({
                icon: 'warning',
                title: 'กรุณายืนยัน',
                text: 'กรุณาเลือกยินดีรับตำแหน่งตามที่สถาบันพระปกเกล้าพิจารณาความเหมาะสมก่อนดำเนินการต่อ'
            });
            return; // หยุดไม่ให้ไปขั้นถัดไป
        }
    }}