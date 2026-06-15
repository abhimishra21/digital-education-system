(function(){
  try {
    if (!window.QRCode) return;

    // Build a clean absolute URL to result.html with current params or cached record fallback
    const current = new URL(window.location.href);
    const params = new URLSearchParams(current.search);
    const canonical = new URL(window.location.origin + '/result.html');

    // Start with URL params
    const out = new URLSearchParams();
    const getParam = (k) => params.get(k);

    // If URL lacks key identifiers, try to derive from cached record
    let cached = null;
    try {
      const raw = localStorage.getItem('pdfRecord');
      if (raw) cached = JSON.parse(raw);
    } catch {}

    const derive = (obj, path, fallback='') => {
      try { return path.split('.').reduce((o,k)=> (o && o[k] != null ? o[k] : null), obj) ?? fallback; } catch { return fallback; }
    };

    const enrollmentNo = getParam('enrollmentNo') || getParam('enrollment') || (cached ? (cached.examRollNumber || cached.rollno || '') : '');
    const cycle = getParam('cycle') || (cached ? (cached.cycle || derive(cached, 'examination.semester', '')) : '');
    const examMonth = getParam('examMonth') || (cached ? String(cached.examMonth || '').trim() : '');
    const examYear = getParam('examYear') || (cached ? String(cached.examYear || '').trim() : '');
    const examType = getParam('examType') || (cached ? (cached.examType || cached.resultType || '') : '');
    const resultHash = getParam('resultHash') || (cached ? (cached.resultHash || cached.hash || '') : '');

    if (enrollmentNo) out.append('enrollmentNo', enrollmentNo);
    if (cycle) out.append('cycle', cycle);
    if (examMonth) out.append('examMonth', examMonth);
    if (examYear) out.append('examYear', examYear);
    if (examType) out.append('examType', examType);
    if (resultHash) out.append('resultHash', resultHash);

    canonical.search = out.toString();
    const canonicalUrl = canonical.toString();

    const qrBox = document.querySelector('.title-block .qr');
    if (!qrBox) return;

    // Size based on container width to respect CSS mm sizing
    const sizePx = Math.max(16, Math.round((qrBox.getBoundingClientRect().width || qrBox.clientWidth || ((22 / 25.4) * 96))));
    qrBox.innerHTML = '';

    // Render to canvas and then to PNG <img> for maximum scanner compatibility
    const canvas = document.createElement('canvas');
    canvas.width = sizePx; canvas.height = sizePx;
    QRCode.toCanvas(canvas, canonicalUrl, { width: sizePx, margin: 6, errorCorrectionLevel: 'L', color: { dark: '#000000', light: '#FFFFFF' } }, function(err){
      if (err) {
        console.warn('QR canvas render failed', err);
        // Fallback to SVG if canvas fails
        QRCode.toString(canonicalUrl, { type: 'svg', width: sizePx, margin: 6, errorCorrectionLevel: 'L' }, function (err2, svgString) {
          if (!err2) {
            const wrapper = document.createElement('div');
            wrapper.style.width = '100%';
            wrapper.style.height = '100%';
            wrapper.style.display = 'block';
            wrapper.style.background = '#fff';
            wrapper.innerHTML = svgString;
            qrBox.appendChild(wrapper);
          }
        });
        return;
      }
      const img = document.createElement('img');
      img.alt = 'Scan to open marksheet URL';
      img.src = canvas.toDataURL('image/png');
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.display = 'block';
      qrBox.appendChild(img);

      // Optional: tiny caption with URL for manual entry (non-print intrusive)
      const cap = document.createElement('div');
      cap.textContent = canonicalUrl;
      cap.style.fontSize = '8px';
      cap.style.color = '#000';
      cap.style.marginTop = '2mm';
      cap.style.wordBreak = 'break-all';
      cap.style.textAlign = 'center';
      cap.style.display = 'none'; // hide by default; enable if needed for debugging
      qrBox.appendChild(cap);
    });
  } catch (e) {
    console.warn('result-qr.js error', e);
  }
})(); 