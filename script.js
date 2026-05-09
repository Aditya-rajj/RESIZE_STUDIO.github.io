// =========================================
// RESIZE STUDIO — PREMIUM ENGINE v2
// Optimized + Modernized + Production Ready
// =========================================

// =========================================
// DOM CACHE
// =========================================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const elements = {

    imageInput: $("#imageInput"),
    dropZone: $("#dropZone"),
    mediaPanel: $("#mediaPanel"),
    sliderArea: $("#sliderArea"),

    imgBefore: $("#imgBefore"),
    imgAfter: $("#imgAfter"),

    sliderInput: $("#sliderInput"),
    sliderLine: $(".slider-line"),

    sizeBefore: $("#sizeBefore"),
    sizeAfter: $("#sizeAfter"),

    badgeAfter: $(".badge-after"),

    resetBtn: $("#resetBtn"),

    resizeBtn: $("#resizeBtn"),
    downloadBtn: $("#downloadBtn"),

    presetBtns: $$(".preset-btn"),

    customTabBtn: $("#customTabBtn"),
    customControls: $("#custom-controls"),

    widthInput: $("#widthInput"),
    heightInput: $("#heightInput"),

    targetKbInput: $("#targetKbInput"),

    lockAspectRatio: $("#lockAspectRatio"),

    welcomeModal: $("#welcomeModal"),
    getStartedBtn: $("#getStartedBtn")
};

// =========================================
// STATE
// =========================================

const state = {

    originalImage: null,

    currentFile: null,

    finalBlob: null,

    finalBlobUrl: null,

    currentTargetKB: 20,

    originalRatio: 1,

    isProcessing: false
};

// =========================================
// CONSTANTS
// =========================================

const PROCESSING_MESSAGES = [

    "Crunching pixels...",
    "Optimizing quality...",
    "Applying magic...",
    "Compressing image...",
    "Almost done..."
];

const MIN_QUALITY = 0.08;
const QUALITY_STEP = 0.05;

const MIN_SCALE = 0.2;
const SCALE_STEP = 0.08;

// =========================================
// UTILITIES
// =========================================

const wait = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));

const formatKB = (bytes) =>
    `${(bytes / 1024).toFixed(1)} KB`;

const vibrate = (duration = 12) =>
    navigator.vibrate?.(duration);

const revokeBlobURL = () => {

    if (state.finalBlobUrl) {

        URL.revokeObjectURL(state.finalBlobUrl);

        state.finalBlobUrl = null;
    }
};

const setButtonLoading = (button, loading, text = "") => {

    const textSpan =
        button.querySelector("span:nth-child(2)");

    if (!textSpan) return;

    if (loading) {

        button.disabled = true;

        textSpan.dataset.original =
            textSpan.textContent;

        textSpan.textContent = text;

    } else {

        button.disabled = false;

        textSpan.textContent =
            textSpan.dataset.original ||
            textSpan.textContent;
    }
};

const getCanvasBlob = (
    canvas,
    mimeType,
    quality
) => {

    return new Promise(resolve => {

        canvas.toBlob(
            resolve,
            mimeType,
            quality
        );
    });
};

// =========================================
// IMAGE PANEL RESPONSIVE SIZING
// =========================================

function updateMediaPanelHeight() {

    if (!state.originalImage) return;

    const {

        mediaPanel

    } = elements;

    const currentWidth =
        mediaPanel.clientWidth;

    let calculatedHeight =
        currentWidth / state.originalRatio;

    const maxHeight =
        window.innerWidth > 850
            ? 620
            : 450;

    calculatedHeight =
        Math.min(calculatedHeight, maxHeight);

    calculatedHeight =
        Math.max(calculatedHeight, 220);

    mediaPanel.style.height =
        `${calculatedHeight}px`;
}

window.addEventListener(
    "resize",
    updateMediaPanelHeight
);

// =========================================
// SLIDER INTERACTION
// =========================================

elements.sliderInput.addEventListener(
    "input",
    ({ target }) => {

        const value = target.value;

        elements.imgAfter.style.clipPath =
            `polygon(
                0 0,
                ${value}% 0,
                ${value}% 100%,
                0 100%
            )`;

        elements.sliderLine.style.left =
            `${value}%`;
    }
);

// =========================================
// PRESET CONTROLS
// =========================================

elements.presetBtns.forEach(button => {

    button.addEventListener("click", () => {

        elements.presetBtns.forEach(btn =>
            btn.classList.remove("active")
        );

        button.classList.add("active");

        const isCustom =
            button.id === "customTabBtn";

        elements.customControls.classList.toggle(
            "active",
            isCustom
        );

        state.currentTargetKB = isCustom
            ? parseInt(
                  elements.targetKbInput.value
              ) || null
            : parseInt(button.dataset.size);
    });
});

// =========================================
// ASPECT RATIO LOCK
// =========================================

function syncAspectRatio(type) {

    if (
        !elements.lockAspectRatio.checked ||
        !state.originalImage
    ) return;

    if (type === "width") {

        elements.heightInput.value =
            Math.round(
                elements.widthInput.value /
                state.originalRatio
            );

    } else {

        elements.widthInput.value =
            Math.round(
                elements.heightInput.value *
                state.originalRatio
            );
    }
}

elements.widthInput.addEventListener(
    "input",
    () => syncAspectRatio("width")
);

elements.heightInput.addEventListener(
    "input",
    () => syncAspectRatio("height")
);

elements.targetKbInput.addEventListener(
    "input",
    () => {

        if (
            elements.customControls.classList.contains(
                "active"
            )
        ) {

            state.currentTargetKB =
                parseInt(
                    elements.targetKbInput.value
                ) || null;
        }
    }
);

// =========================================
// DRAG & DROP
// =========================================

[
    "dragenter",
    "dragover"
].forEach(event => {

    elements.dropZone.addEventListener(
        event,
        e => {

            e.preventDefault();

            elements.dropZone.classList.add(
                "dragover"
            );
        }
    );
});

[
    "dragleave",
    "drop"
].forEach(event => {

    elements.dropZone.addEventListener(
        event,
        e => {

            e.preventDefault();

            elements.dropZone.classList.remove(
                "dragover"
            );
        }
    );
});

elements.dropZone.addEventListener(
    "drop",
    e => {

        if (!e.dataTransfer.files.length)
            return;

        elements.imageInput.files =
            e.dataTransfer.files;

        handleFileSelect();
    }
);

elements.imageInput.addEventListener(
    "change",
    handleFileSelect
);

// =========================================
// FILE SELECT
// =========================================

function handleFileSelect() {

    const file =
        elements.imageInput.files[0];

    if (!file) return;

    state.currentFile = file;

    elements.sizeBefore.textContent =
        formatKB(file.size);

    const reader = new FileReader();

    reader.onload = ({ target }) => {

        const image = new Image();

        image.onload = () => {

            state.originalImage = image;

            state.originalRatio =
                image.width / image.height;

            elements.widthInput.value =
                image.width;

            elements.heightInput.value =
                image.height;

            updateMediaPanelHeight();

            elements.imgBefore.src =
                target.result;

            elements.imgAfter.style.opacity =
                "0";

            elements.sliderLine.style.display =
                "none";

            elements.badgeAfter.style.display =
                "none";

            elements.sliderInput.value = 100;

            elements.sliderArea.classList.remove(
                "hidden-anim"
            );

            elements.resizeBtn.disabled =
                false;

            elements.downloadBtn.disabled =
                true;
        };

        image.src = target.result;
    };

    reader.readAsDataURL(file);
}

// =========================================
// RESET ENGINE
// =========================================

elements.resetBtn.addEventListener(
    "click",
    () => {

        revokeBlobURL();

        state.originalImage = null;

        state.currentFile = null;

        state.finalBlob = null;

        elements.imageInput.value = "";

        elements.mediaPanel.style.height =
            "";

        elements.sliderArea.classList.add(
            "hidden-anim"
        );

        elements.resizeBtn.disabled = true;

        elements.downloadBtn.disabled =
            true;
    }
);

// =========================================
// COMPRESSION ENGINE
// =========================================

async function compressImage({

    canvas,
    mimeType,
    targetKB,
    width,
    height
}) {

    let quality = 0.95;

    let scale = 1;

    let blob = await getCanvasBlob(
        canvas,
        mimeType,
        quality
    );

    // QUALITY REDUCTION

    while (

        blob.size / 1024 > targetKB &&
        quality > MIN_QUALITY

    ) {

        quality -= QUALITY_STEP;

        blob = await getCanvasBlob(
            canvas,
            mimeType,
            quality
        );
    }

    // SCALE REDUCTION

    while (

        blob.size / 1024 > targetKB &&
        scale > MIN_SCALE

    ) {

        scale -= SCALE_STEP;

        canvas.width =
            width * scale;

        canvas.height =
            height * scale;

        const ctx =
            canvas.getContext("2d");

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.drawImage(
            state.originalImage,
            0,
            0,
            canvas.width,
            canvas.height
        );

        blob = await getCanvasBlob(
            canvas,
            mimeType,
            quality
        );
    }

    return blob;
}

// =========================================
// MAIN PROCESSOR
// =========================================

elements.resizeBtn.addEventListener(
    "click",
    async () => {

        if (
            !state.originalImage ||
            state.isProcessing
        ) return;

        state.isProcessing = true;

        const startTime =
            performance.now();

        const {

            resizeBtn,
            downloadBtn,
            mediaPanel

        } = elements;

        let msgIndex = 0;

        setButtonLoading(
            resizeBtn,
            true,
            PROCESSING_MESSAGES[msgIndex]
        );

        const interval =
            setInterval(() => {

                msgIndex =
                    (msgIndex + 1) %
                    PROCESSING_MESSAGES.length;

                resizeBtn.querySelector(
                    "span:nth-child(2)"
                ).textContent =
                    PROCESSING_MESSAGES[msgIndex];

            }, 700);

        mediaPanel.classList.add(
            "is-processing"
        );

        downloadBtn.disabled = true;

        await wait(200);

        // DIMENSIONS

        let targetWidth =
            state.originalImage.width;

        let targetHeight =
            state.originalImage.height;

        if (
            elements.customControls.classList.contains(
                "active"
            )
        ) {

            targetWidth =
                parseInt(
                    elements.widthInput.value
                ) || targetWidth;

            targetHeight =
                parseInt(
                    elements.heightInput.value
                ) || targetHeight;
        }

        // CANVAS

        const canvas =
            document.createElement("canvas");

        canvas.width = targetWidth;

        canvas.height = targetHeight;

        const ctx =
            canvas.getContext("2d", {
                alpha: false
            });

        ctx.imageSmoothingEnabled = true;

        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(
            state.originalImage,
            0,
            0,
            targetWidth,
            targetHeight
        );

        const mimeType =

            state.currentFile.type ===
            "image/png"

            && !state.currentTargetKB

                ? "image/png"

                : "image/jpeg";

        let finalBlob;

        if (state.currentTargetKB) {

            finalBlob =
                await compressImage({

                    canvas,

                    mimeType,

                    targetKB:
                        state.currentTargetKB,

                    width:
                        targetWidth,

                    height:
                        targetHeight
                });

        } else {

            finalBlob =
                await getCanvasBlob(
                    canvas,
                    mimeType,
                    0.95
                );
        }

        revokeBlobURL();

        state.finalBlob = finalBlob;

        state.finalBlobUrl =
            URL.createObjectURL(finalBlob);

        elements.imgAfter.src =
            state.finalBlobUrl;

        elements.sizeAfter.textContent =
            formatKB(finalBlob.size);

        elements.imgAfter.style.opacity =
            "1";

        elements.sliderLine.style.display =
            "flex";

        elements.badgeAfter.style.display =
            "flex";

        elements.sliderInput.value = 50;

        elements.sliderLine.style.left =
            "50%";

        elements.imgAfter.style.clipPath =
            `polygon(
                0 0,
                50% 0,
                50% 100%,
                0 100%
            )`;

        clearInterval(interval);

        resizeBtn.querySelector(
            "span:nth-child(2)"
        ).textContent = "Completed";

        mediaPanel.classList.remove(
            "is-processing"
        );

        downloadBtn.disabled = false;

        const totalTime =
            (
                performance.now() -
                startTime
            ).toFixed(0);

        console.log(
            `Resize completed in ${totalTime}ms`
        );

        vibrate(15);

        await wait(1200);

        setButtonLoading(
            resizeBtn,
            false
        );

        state.isProcessing = false;
    }
);

// =========================================
// DOWNLOAD
// =========================================

elements.downloadBtn.addEventListener(
    "click",
    () => {

        if (!state.finalBlobUrl)
            return;

        const a =
            document.createElement("a");

        const extension =
            state.finalBlob.type.includes(
                "png"
            )
                ? "png"
                : "jpg";

        a.href =
            state.finalBlobUrl;

        a.download =
            `ResizeStudio_${
                Date.now()
            }.${extension}`;

        a.click();

        vibrate(8);
    }
);

// =========================================
// WELCOME MODAL
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const hasVisited =
            localStorage.getItem(
                "resizeStudio_welcomed"
            );

        if (!hasVisited) {

            setTimeout(() => {

                elements.welcomeModal.classList.add(
                    "open"
                );

            }, 700);
        }

        elements.getStartedBtn
            ?.addEventListener(
                "click",
                () => {

                    elements.welcomeModal.classList.remove(
                        "open"
                    );

                    localStorage.setItem(
                        "resizeStudio_welcomed",
                        "true"
                    );
                }
            );
    }
);

// =========================================
// CLEANUP
// =========================================

window.addEventListener(
    "beforeunload",
    revokeBlobURL
);
