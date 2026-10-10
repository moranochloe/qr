const API_URL = "https://api.qrserver.com/v1/read-qr-code/?outputformat=json";
const MAX_FILE_SIZE = 1024 * 1024;

const cameraTab = document.querySelector("#camera-tab");
const uploadTab = document.querySelector("#upload-tab");
const cameraPanel = document.querySelector("#camera-panel");
const uploadPanel = document.querySelector("#upload-panel");
const video = document.querySelector("#camera-video");
const cameraEmpty = document.querySelector("#camera-empty");
const cameraToggle = document.querySelector("#camera-toggle");
const captureButton = document.querySelector("#capture-button");
const cameraHint = document.querySelector("#camera-hint");
const imageInput = document.querySelector("#image-input");
const fileName = document.querySelector("#file-name");
const resultContent = document.querySelector("#result-content");
const resultActions = document.querySelector("#result-actions");
const formMessage = document.querySelector("#form-message");
const copyButton = document.querySelector("#copy-button");
const copyStatus = document.querySelector("#copy-status");

let cameraStream = null;
let requestInProgress = false;
let latestResult = "";

function setMessage(message, kind = "error") {
  formMessage.textContent = message;
  formMessage.dataset.kind = kind;
  formMessage.hidden = !message;
}

function setBusy(isBusy) {
  requestInProgress = isBusy;
  captureButton.disabled = isBusy || !cameraStream;
  imageInput.disabled = isBusy;
  cameraToggle.disabled = isBusy;
  captureButton.innerHTML = isBusy ? "<span aria-hidden=\"true\">…</span> Reading code" : "<span aria-hidden=\"true\">⌖</span> Capture &amp; scan";
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  video.srcObject = null;
  video.hidden = true;
  cameraEmpty.hidden = false;
  cameraToggle.textContent = "◉ Start camera";
  cameraToggle.disabled = false;
  captureButton.disabled = true;
}

async function startCamera() {
  setMessage("");
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraHint.textContent = "This browser cannot access a camera here. Use localhost or HTTPS, or upload an image instead.";
    setMessage("Camera access is unavailable. Choose an image to scan instead.");
    return;
  }

  cameraToggle.disabled = true;
  cameraHint.textContent = "Waiting for camera permission…";
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
    });
    video.srcObject = cameraStream;
    await video.play();
    video.hidden = false;
    cameraEmpty.hidden = true;
    cameraToggle.textContent = "◉ Stop camera";
    cameraToggle.disabled = false;
    captureButton.disabled = false;
    cameraHint.textContent = "Center the QR code in the frame, then capture.";
  } catch (error) {
    stopCamera();
    const detail = error.name === "NotAllowedError"
      ? "Camera permission was blocked. Allow access in your browser settings, or upload an image."
      : "Could not start the camera. Check that it is connected and not in use by another app.";
    cameraHint.textContent = detail;
    setMessage(detail);
  }
}

function showResult(data) {
  latestResult = data;
  resultContent.replaceChildren();
  const trimmed = data.trim();
  let parsedUrl;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    parsedUrl = null;
  }

  if (parsedUrl && ["http:", "https:"].includes(parsedUrl.protocol)) {
    const link = document.createElement("a");
    link.href = parsedUrl.href;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = data;
    resultContent.append(link);
  } else {
    resultContent.textContent = data;
  }
  resultActions.hidden = false;
}

async function decodeImage(imageFile) {
  if (requestInProgress) return;
  if (!imageFile || !["image/png", "image/jpeg", "image/gif"].includes(imageFile.type)) {
    setMessage("Choose a PNG, JPG, or GIF image containing a QR code.");
    return;
  }
  if (imageFile.size > MAX_FILE_SIZE) {
    setMessage("This image is over 1 MB. Choose a smaller image and try again.");
    return;
  }

  setMessage("");
  copyStatus.textContent = "";
  setBusy(true);
  const body = new FormData();
  body.append("file", imageFile, imageFile.name || "camera-capture.jpg");

  try {
    const response = await fetch(API_URL, { method: "POST", body });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const payload = await response.json();
    const symbol = payload?.[0]?.symbol?.[0];
    if (!symbol) throw new Error("Unexpected API response");
    if (symbol.data) {
      showResult(symbol.data);
      setMessage("QR code decoded successfully.", "success");
    } else {
      resultContent.innerHTML = '<span class="result-placeholder">No QR code could be read from this image.</span>';
      resultActions.hidden = true;
      setMessage(symbol.error || "No QR code found. Try a clearer image with the code in focus.");
    }
  } catch (error) {
    console.error("QR decode failed:", error);
    setMessage("Could not fetch data. Please try again. Check your internet connection and try another image.");
  } finally {
    setBusy(false);
  }
}

function encodeFrame(canvas, width, height, quality = 0.76) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not capture a camera frame"));
      } else if (blob.size <= MAX_FILE_SIZE) {
        resolve(blob);
      } else if (width > 360) {
        const nextWidth = Math.round(width * 0.75);
        const nextHeight = Math.round(height * 0.75);
        canvas.width = nextWidth;
        canvas.height = nextHeight;
        drawMirroredFrame(canvas, nextWidth, nextHeight);
        encodeFrame(canvas, nextWidth, nextHeight, Math.max(quality - 0.12, 0.42)).then(resolve, reject);
      } else {
        reject(new Error("The camera image could not be compressed below 1 MB"));
      }
    }, "image/jpeg", quality);
  });
}

function drawMirroredFrame(canvas, width, height) {
  const context = canvas.getContext("2d");
  context.translate(width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, width, height);
}

async function captureAndDecode() {
  if (!cameraStream || requestInProgress) return;
  if (!video.videoWidth || !video.videoHeight) {
    setMessage("The camera is still starting. Wait a moment and try again.");
    return;
  }
  const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  drawMirroredFrame(canvas, canvas.width, canvas.height);
  try {
    const blob = await encodeFrame(canvas, canvas.width, canvas.height);
    await decodeImage(new File([blob], "camera-capture.jpg", { type: "image/jpeg" }));
  } catch (error) {
    console.error("Camera capture failed:", error);
    setMessage("Could not prepare the camera image. Please try again.");
  }
}

function setMode(mode) {
  const cameraMode = mode === "camera";
  cameraTab.classList.toggle("is-active", cameraMode);
  uploadTab.classList.toggle("is-active", !cameraMode);
  cameraTab.setAttribute("aria-selected", String(cameraMode));
  uploadTab.setAttribute("aria-selected", String(!cameraMode));
  cameraPanel.hidden = !cameraMode;
  uploadPanel.hidden = cameraMode;
  setMessage("");
  if (!cameraMode) stopCamera();
}

cameraTab.addEventListener("click", () => setMode("camera"));
uploadTab.addEventListener("click", () => setMode("upload"));
cameraToggle.addEventListener("click", () => cameraStream ? stopCamera() : startCamera());
captureButton.addEventListener("click", captureAndDecode);
imageInput.addEventListener("change", () => {
  const imageFile = imageInput.files?.[0];
  if (!imageFile) return;
  fileName.textContent = imageFile.name;
  decodeImage(imageFile);
});
document.querySelector("#clear-button").addEventListener("click", () => {
  latestResult = "";
  resultContent.innerHTML = '<span class="result-placeholder">Your QR code contents will show up here.</span>';
  resultActions.hidden = true;
  copyStatus.textContent = "";
  setMessage("");
});
copyButton.addEventListener("click", async () => {
  if (!latestResult) return;
  try {
    await navigator.clipboard.writeText(latestResult);
    copyStatus.textContent = "Copied";
  } catch {
    copyStatus.textContent = "Copy is unavailable in this browser";
  }
});
window.addEventListener("pagehide", stopCamera);