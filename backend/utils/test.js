// test.js
const {generateQRCode} = require('./generateQRCode');

async function callfun() {
  try {
    const qr_url = await generateQRCode('123456');
    console.log(qr_url); // should print base64 PNG string
  } catch (err) {
    console.error('QR Code generation failed:', err.message);
  }
}

callfun();
