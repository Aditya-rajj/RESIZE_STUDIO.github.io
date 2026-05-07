// DOM Elements
const imageInput = document.getElementById('imageInput');
const dropZone = document.getElementById('dropZone');
const mediaPanel = document.getElementById('mediaPanel');
const sliderArea = document.getElementById('sliderArea');
const imgBefore = document.getElementById('imgBefore');
const imgAfter = document.getElementById('imgAfter');
const sliderInput = document.getElementById('sliderInput');
const sliderLine = document.querySelector('.slider-line');
const sizeBefore = document.getElementById('sizeBefore');
const sizeAfter = document.getElementById('sizeAfter');
const badgeAfter = document.querySelector('.badge-after');
const resetBtn = document.getElementById('resetBtn');

const resizeBtn = document.getElementById('resizeBtn');
const downloadBtn = document.getElementById('downloadBtn');

const presetBtns = document.querySelectorAll('.preset-btn');
const customTabBtn = document.getElementById('customTabBtn');
const customControls = document.getElementById('custom-controls');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const targetKbInput = document.getElementById('targetKbInput');
const lockAspectRatio = document.getElementById('lockAspectRatio');

// State Variables
let originalImageObj = null;
let currentFile = null;
let finalBlobUrl = null;
let currentTargetKB = 20; // Default preset
let originalRatio = 1;

// =========================================
// UI INTERACTIONS
// =========================================

// Slider Interaction Physics
sliderInput.addEventListener('input', (e) => {
    const value = e.target.value;
    imgAfter.style.clipPath = `polygon(0 0, ${value}% 0, ${value}% 100%, 0 100%)`;
    sliderLine.style.left = `${value}%`;
});

// Preset Controls
presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (btn.id === 'customTabBtn') {
            customControls.classList.add('active');
            currentTargetKB = targetKbInput.value ? parseInt(targetKbInput.value) : null;
        } else {
            customControls.classList.remove('active');
            currentTargetKB = parseInt(btn.dataset.size);
        }
    });
});

// Aspect Ratio Locking Logic
widthInput.addEventListener('input', () => {
    if (lockAspectRatio.checked && originalImageObj) {
        heightInput.value = Math.round(widthInput.value / originalRatio);
    }
    if (customControls.classList.contains('active')) currentTargetKB = parseInt(targetKbInput.value) || null;
});

heightInput.addEventListener('input', () => {
    if (lockAspectRatio.checked && originalImageObj) {
        widthInput.value = Math.round(heightInput.value * originalRatio);
    }
    if (customControls.classList.contains('active')) currentTargetKB = parseInt(targetKbInput.value) || null;
});

targetKbInput.addEventListener('input', () => {
    if (customControls.classList.contains('active')) currentTargetKB = parseInt(targetKbInput.value) || null;
});

// =========================================
// FILE HANDLING & DYNAMIC RESPONSIVE SIZING
// =========================================

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        imageInput.files = e.dataTransfer.files;
        handleFileSelect();
    }
});
imageInput.addEventListener('change', handleFileSelect);

// Function to perfectly calculate box size based on screen
function updateMediaPanelHeight() {
    if (!originalImageObj) return;
    const currentBoxWidth = mediaPanel.clientWidth;
    let targetHeight = currentBoxWidth / originalRatio;
    
    // Responsive constraints
    if (window.innerWidth > 850) {
        if (targetHeight > 600) targetHeight = 600; // Desktop Max
    } else {
        if (targetHeight > 450) targetHeight = 450; // Mobile Max
    }
    
    if (targetHeight < 200) targetHeight = 200; // Universal Min
    mediaPanel.style.height = `${targetHeight}px`;
}

// Ensure layout doesn't break if desktop user resizes window
window.addEventListener('resize', updateMediaPanelHeight);

function handleFileSelect() {
    const file = imageInput.files[0];
    if (!file) return;

    currentFile = file;
    sizeBefore.textContent = `${(file.size / 1024).toFixed(1)} KB`;

    const reader = new FileReader();
    reader.onload = (e) => {
        originalImageObj = new Image();
        originalImageObj.onload = () => {
            // Setup Input Fields
            widthInput.value = originalImageObj.width;
            heightInput.value = originalImageObj.height;
            originalRatio = originalImageObj.width / originalImageObj.height;
            
            // Execute Dynamic Sizing
            updateMediaPanelHeight();

            // Setup Preview States
            imgBefore.src = e.target.result;
            imgAfter.style.opacity = '0';
            sliderLine.style.display = 'none';
            badgeAfter.style.display = 'none';
            sliderInput.value = 100;
            
            sliderArea.classList.remove('hidden-anim');
            resizeBtn.disabled = false; 
            downloadBtn.disabled = true;
        };
        originalImageObj.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Reset UI
resetBtn.addEventListener('click', () => {
    sliderArea.classList.add('hidden-anim');
    mediaPanel.style.height = ''; 
    imageInput.value = '';
    originalImageObj = null;
    resizeBtn.disabled = true;
    downloadBtn.disabled = true;
    if (finalBlobUrl) URL.revokeObjectURL(finalBlobUrl);
});

// =========================================
// CORE PROCESSING ENGINE
// =========================================

// Async Blob Helper
const getCanvasBlob = (canvas, mimeType, quality) => {
    return new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));
};

// Dynamic Button Messages
const processingMsgs = ["Crunching pixels...", "Optimizing size...", "Applying magic...", "Almost there..."];

resizeBtn.addEventListener('click', async () => {
    if (!originalImageObj) return;

    const btnTextSpan = resizeBtn.querySelector('span:nth-child(2)');
    const originalBtnText = btnTextSpan.textContent;
    let msgIndex = 0;

    // Trigger Visual Animation & Lock Buttons
    mediaPanel.classList.add('is-processing');
    resizeBtn.disabled = true;
    downloadBtn.disabled = true;

    btnTextSpan.textContent = processingMsgs[msgIndex];
    const msgInterval = setInterval(() => {
        msgIndex = (msgIndex + 1) % processingMsgs.length;
        btnTextSpan.textContent = processingMsgs[msgIndex];
    }, 600);

    // Yield to let UI update
    await new Promise(r => setTimeout(r, 400));

    // Calculate Target Dimensions
    let targetW = originalImageObj.width;
    let targetH = originalImageObj.height;

    if (customControls.classList.contains('active')) {
        targetW = parseInt(widthInput.value) || targetW;
        targetH = parseInt(heightInput.value) || targetH;
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(originalImageObj, 0, 0, targetW, targetH);

    let mimeType = (currentFile.type === 'image/png' && !currentTargetKB) ? 'image/png' : 'image/jpeg';
    let quality = 0.95;
    let finalBlob = null;

    // Compression Loop
    if (currentTargetKB) {
        let currentBlob = await getCanvasBlob(canvas, mimeType, quality);
        
        while (currentBlob.size / 1024 > currentTargetKB && quality > 0.1) {
            quality -= 0.1;
            currentBlob = await getCanvasBlob(canvas, mimeType, quality);
        }

        let scale = 1.0;
        while (currentBlob.size / 1024 > currentTargetKB && scale > 0.2) {
            scale -= 0.1;
            canvas.width = targetW * scale;
            canvas.height = targetH * scale;
            ctx.drawImage(originalImageObj, 0, 0, canvas.width, canvas.height);
            currentBlob = await getCanvasBlob(canvas, mimeType, quality);
        }
        finalBlob = currentBlob;
    } else {
        finalBlob = await getCanvasBlob(canvas, mimeType, quality);
    }

    // Process Complete: Update UI
    clearInterval(msgInterval); 
    btnTextSpan.textContent = "Done!"; 
    
    const currentKbSize = finalBlob.size / 1024;
    
    if (finalBlobUrl) URL.revokeObjectURL(finalBlobUrl);
    finalBlobUrl = URL.createObjectURL(finalBlob);
    
    imgAfter.src = finalBlobUrl;
    sizeAfter.textContent = `${currentKbSize.toFixed(1)} KB`;
    
    imgAfter.style.opacity = '1';
    sliderLine.style.display = 'flex';
    badgeAfter.style.display = 'flex';
    
    sliderInput.value = 50;
    imgAfter.style.clipPath = `polygon(0 0, 50% 0, 50% 100%, 0 100%)`;
    sliderLine.style.left = `50%`;

    // Remove Animation & Unlock Export
    mediaPanel.classList.remove('is-processing');
    downloadBtn.disabled = false;
    
    setTimeout(() => {
        resizeBtn.disabled = false;
        btnTextSpan.textContent = originalBtnText;
    }, 1500);
});

// Export 
downloadBtn.addEventListener('click', () => {
    if (!finalBlobUrl) return;
    const a = document.createElement('a');
    a.href = finalBlobUrl;
    a.download = `ResizeStudio_${currentFile.name}`;
    a.click();
});

// =========================================
// ONE-TIME WELCOME MODAL LOGIC
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    const welcomeModal = document.getElementById('welcomeModal');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const hasVisited = localStorage.getItem('resizeStudio_welcomed');

    if (!hasVisited) {
        setTimeout(() => welcomeModal.classList.add('open'), 600);
    }

    getStartedBtn.addEventListener('click', () => {
        welcomeModal.classList.remove('open');
        localStorage.setItem('resizeStudio_welcomed', 'true');
    });
});
