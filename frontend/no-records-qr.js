// QR Code generation for no-records-found page
(async () => {
  try {
    // Get the QR container element
    const qrContainer = document.querySelector('.qr');
    if (!qrContainer) return;

    // Get current URL for QR code
    const currentUrl = window.location.href;
    
    // Generate QR code using the QRCode library
    if (typeof QRCode !== 'undefined') {
      await QRCode.toCanvas(qrContainer, currentUrl, {
        width: 120,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } else {
      // Fallback if QRCode library is not loaded
      qrContainer.innerHTML = '<div style="font-size: 10px; text-align: center; padding: 5px;">QR Code<br>Not Available</div>';
    }
  } catch (e) {
    console.warn('QR generation failed:', e);
  }
})(); 