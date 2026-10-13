 SCAN TA BAI! - QR Code Reader

LIVE DEMO:
Portfolio page: https://qr-rho-red.vercel.app/portfolio.html
Scanner app:    https://qr-rho-red.vercel.app/index.html


GROUP NAME:
Scan Ta Bai!

MEMBERS:
1. Chloe Morano          - JavaScript & Project Manager
2. Mariela Anne Sanchez  - CSS & Layout
3. Emilia Angela Simon   - HTML & Design


PROJECT DESCRIPTION:
Scan Ta Bai! is a single-page web app that reads QR codes. The user
can scan with the device camera or upload an image. The decoded
result is shown on the page, with a "Copy result" button, and links
are clickable.


API USED:
Name:           QRServer (goqr.me) - Read QR Code API
Documentation:  https://goqr.me/api/doc/read-qr-code/
Endpoint:       https://api.qrserver.com/v1/read-qr-code/
API key:        Not required (free to use)

Browser feature also used: Camera API (getUserMedia)
  https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia


FILES:
portfolio.html   Group portfolio page (start here)
index.html       The main QR scanner app
app.js           JavaScript: camera, fetch() call to the API, results
css/style.css    Styles and responsive layout
assets/          Team photos
README.txt       This file


HOW TO USE THE APP
Easiest: open the live demo link above. No setup needed.

1. Open the portfolio page and click "Open the scanner".
2. Camera tab: click "Start camera", allow camera permission, center
   the QR code in the frame, then click "Capture & scan".
3. Upload image tab: choose a PNG, JPG or GIF (up to 1 MB) that
   contains a QR code. It is decoded automatically.
4. The decoded text appears under "Decoded result". Use "Copy result"
   to copy it. If it is a web link, click it to open it.


RUNNING LOCALLY (optional) :
The camera only works on https:// or http://localhost, so do not
open index.html by double-clicking it. Instead:

  Option A - VS Code: install the "Live Server" extension, then
             right-click portfolio.html and choose "Open with Live Server".
  Option B - Python:  run  python -m http.server 8000  in the project
             folder and open http://localhost:8000/portfolio.html


REQUIREMENTS:
- Internet connection (the API is online)
- A modern browser (Chrome, Edge, Firefox, Safari)
- Camera permission, or use the image upload instead
- Images must be under 1 MB


ERROR HANDLING:
The app shows friendly messages for: camera permission blocked, no
camera available, no internet or API failure ("Could not fetch data.
Please try again."), wrong file type, image over 1 MB, and images with
no readable QR code.
