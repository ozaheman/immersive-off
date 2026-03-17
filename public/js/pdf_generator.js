/* START OF FILE js/pdf_generator.js */

// Configure PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';
}

/**
 * @module PDFGenerator
 * Accessible globally via window.PDFGenerator
 */
window.PDFGenerator = (() => {

    /**
     * The primary PDF generation function.
     */
    const generate = async ({ previewId, projectJobNo, pageSize = 'a4_portrait', fileName: customFileName, watermarkData }) => {
        if (!previewId) {
            console.error("PDF Generation Error: 'previewId' is missing.");
            alert("Could not generate PDF: No content source was specified.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const sourceElement = document.getElementById(previewId);

        let logoElementToHide = null;
        let footerElementToHide = null;

        if (!sourceElement) {
            console.error(`PDF generation error: Source element with ID '${previewId}' could not be found.`);
            alert(`Could not find content to generate PDF. Check console for details.`);
            return;
        }

        alert('Generating PDF... This may take a moment.');

        try {
            // Hide existing visual headers/footers in the HTML to replace with clean PDF ones
            logoElementToHide = sourceElement.querySelector('.preview-header-image');
            footerElementToHide = sourceElement.querySelector('.preview-footer');
            if (logoElementToHide) logoElementToHide.style.display = 'none';
            if (footerElementToHide) footerElementToHide.style.display = 'none';

            // Parse page size
            const [format, orientation] = pageSize.toLowerCase().split('_');

            // Detect schedule early so we can force A3 landscape
            const isSchedule = previewId === 'villa-schedule-preview';
            const targetFormat = isSchedule ? 'a3' : format;
            const targetOrientation = isSchedule ? 'l' : (orientation === 'landscape' ? 'l' : 'p');

            // Create jsPDF instance (A3 landscape for schedule)
            const doc = new jsPDF({
                orientation: targetOrientation,
                unit: 'mm',
                format: targetFormat
            });

            const PAGE_WIDTH = doc.internal.pageSize.getWidth();
            const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
            let TOP_MARGIN = 22;
            const BOTTOM_MARGIN = 20;

            // Smaller side margins for landscape schedules to maximize content area
            const SIDE_MARGIN = isSchedule ? 5 : 10;
            TOP_MARGIN = isSchedule ? 60 :22;

            // Determine content width for scaling
            const CONTENT_WIDTH = PAGE_WIDTH - (SIDE_MARGIN * 2);

            // Watermark setup
            const watermarkGState = new doc.GState({ opacity: 0.08 });
            const textWatermarkGState = new doc.GState({ opacity: 0.05 });
            const normalGState = new doc.GState({ opacity: 1.0 });

            // Ensure constants exist (loaded from constants.js/logo_base64.js)
            const wmImg = (typeof WM_BASE64 !== 'undefined') ? WM_BASE64 : '';
            const logoImg = (typeof LOGO_BASE64 !== 'undefined') ? LOGO_BASE64 : '';

            const addHeaderFooterWatermark = () => {
                const pageCount = doc.internal.getNumberOfPages();

                let watermarkTexts = [];
                if (typeof watermarkData === 'string' && watermarkData) {
                    watermarkTexts = [watermarkData];
                } else if (Array.isArray(watermarkData) && watermarkData.length > 0) {
                    watermarkTexts = watermarkData;
                }

                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);

                    // 1. Image Watermark (Center Logo)
                    if (wmImg) {
                        doc.setGState(watermarkGState);
                        const wmScale = targetFormat === 'a3' ? 0.5 : 1;
                        const watermarkImgWidth = (PAGE_WIDTH - 40) * wmScale;
                        const watermarkImgHeight = watermarkImgWidth * 1; // Square aspect
                        doc.addImage(wmImg, 'PNG', (PAGE_WIDTH - watermarkImgWidth) / 2, (PAGE_HEIGHT - watermarkImgHeight) / 2, watermarkImgWidth, watermarkImgHeight);
                        doc.setGState(normalGState);
                    }

                    // 2. Text Grid Watermark (Optional)
                    if (watermarkTexts.length > 0) {
                        doc.saveGraphicsState();
                        doc.setGState(textWatermarkGState);
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(targetFormat === 'a3' ? 42 : 32);
                        doc.setTextColor(150, 150, 150);
                        let textIndex = 0;
                        for (let y = 20; y < PAGE_HEIGHT; y += 80) {
                            for (let x = 20; x < PAGE_WIDTH; x += 120) {
                                const currentWatermark = watermarkTexts[textIndex % watermarkTexts.length];
                                doc.text(currentWatermark, x, y, { angle: -45, align: 'center' });
                                textIndex++;
                            }
                        }
                        doc.restoreGraphicsState();
                    }

                    // 3. Header Logo
                    if (logoImg) {
                        const headerImgWidth = PAGE_WIDTH - (SIDE_MARGIN * 2);
                        // Maintain aspect ratio of logo bar (approx 15.72 height for 183 width)
                        const headerImgHeight = headerImgWidth * (20.00 / 150.0);
                        doc.addImage(logoImg, 'PNG', SIDE_MARGIN, 8, headerImgWidth, headerImgHeight);
                    }

                    // 4. Page Number
                    doc.setFontSize(9);
                    doc.setTextColor(150, 150, 150);
                    doc.text(`Page ${i} of ${pageCount}`, PAGE_WIDTH - SIDE_MARGIN - 10, PAGE_HEIGHT - 10);
                    doc.setTextColor(0, 0, 0);

                    // 5. Footer Line & Text
                    doc.setLineWidth(0.2);
                    doc.line(SIDE_MARGIN, PAGE_HEIGHT - BOTTOM_MARGIN, PAGE_WIDTH - SIDE_MARGIN, PAGE_HEIGHT - BOTTOM_MARGIN);
                    doc.setFontSize(8);
                    doc.setTextColor(100, 100, 100);
                    const footerText1 = "P.O. BOX 341763, DUBAI, U.A.E. Tel. 04262336, E-mail: projects@immersive.ae";
                    const footerText2 = "Website: www.immersiveec.ae";
                    doc.text(footerText1, PAGE_WIDTH / 2, PAGE_HEIGHT - 13, { align: 'center' });
                    doc.text(footerText2, PAGE_WIDTH / 2, PAGE_HEIGHT - 9, { align: 'center' });
                }
            };

            if (isSchedule) {
                // ── SCHEDULE: Build a fresh flat grid from live DOM data ──────────────
                // The original layout uses position:absolute SVG + sticky task-info which
                // html2canvas cannot capture together. We build a clean flat structure instead.

                const TASK_COL_W = 280;
                const ROW_H = 32;
                const HEADER_H = 55;
                const BG_EVEN = '#ffffff';
                const BG_ODD = '#fafafa';

                // ── A. Read task names from live .task-info cells ─────────────────────
                const liveTaskInfos = Array.from(sourceElement.querySelectorAll('.task-info'));
                const taskLabels = liveTaskInfos.map((el, i) => ({
                    text: el.textContent.trim(),
                    bg: i % 2 === 0 ? BG_EVEN : BG_ODD
                }));

                // ── B. Convert HEADER SVG to data URL ────────────────────────────────
                const headerSvgEl = sourceElement.querySelector('.gantt-timeline svg');
                const bodySvgEl = sourceElement.querySelector('.gantt-body > svg');

                if (!headerSvgEl || !bodySvgEl) {
                    alert('Gantt SVG elements not found. Please load the Schedule tab first.');
                    return;
                }

                const svgToDataUrl = (svg) => {
                    const clone = svg.cloneNode(true);
                    clone.querySelectorAll('*').forEach(el => {
                        const s = el.getAttribute('style');
                        if (s) el.setAttribute('style', s.replace(/var\(--[^)]+\)/g, '#000').replace(/!important/g, ''));
                    });
                    const xml = new XMLSerializer().serializeToString(clone);
                    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(xml)))}`;
                };

                const headerW = headerSvgEl.clientWidth || parseInt(headerSvgEl.getAttribute('width') || '2266');
                const headerH = HEADER_H;
                //const headerH = 300;
                const bodyW = bodySvgEl.clientWidth || parseInt(bodySvgEl.getAttribute('width') || '2266');
                const bodyH = bodySvgEl.clientHeight || parseInt(bodySvgEl.getAttribute('height') || String(taskLabels.length * ROW_H));

                const headerDataUrl = svgToDataUrl(headerSvgEl);
                const bodyDataUrl = svgToDataUrl(bodySvgEl);

                // ── C. Build fresh flat container ─────────────────────────────────────
                // Read the controls bar height from live DOM
                const schedulePreview1 = document.getElementById('villa-schedule-preview1');
                const controlsBarEl = schedulePreview1 ? schedulePreview1.querySelector(':scope > div:first-child') : null;
                const controlsH = controlsBarEl ? controlsBarEl.offsetHeight : 0;

                const totalW = TASK_COL_W + Math.max(headerW, bodyW);
                const totalH = controlsH + HEADER_H + bodyH;

                const container = document.createElement('div');
                container.style.cssText = `
                    position: absolute;
                    top: -99999px;
                    left: 0;
                    width: ${totalW}px;
                    background: #ffffff;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                `;

                // ── C0. Title row ─────────────────────────────────────────────────────
                const h1El = sourceElement.querySelector('h1');
                if (h1El) {
                    const titleDiv = document.createElement('div');
                    titleDiv.style.cssText = `
                        width: 100%;
                        padding: 12px 16px 8px 16px;
                        font-size: 22px;
                        font-weight: bold;
                        color: #1a1a2e;
                        border-bottom: 2px solid #ccc;
                        margin-bottom: 4px;
                        box-sizing: border-box;
                        letter-spacing: 0.5px;
                    `;
                    titleDiv.textContent = h1El.textContent.trim();
                    container.appendChild(titleDiv);
                }

                // ── C0b. Zoom controls bar ────────────────────────────────────────────
                if (controlsBarEl) {
                    const controlsClone = document.createElement('div');
                    controlsClone.style.cssText = `
                        width: 100%;
                        padding: 8px 10px;
                        border-bottom: 1px solid #ccc;
                        background: #f5f5f5;
                        box-sizing: border-box;
                        display: flex;
                        flex-wrap: wrap;
                        gap: 4px;
                        min-height: ${controlsH}px;
                    `;
                    // Clone each button
                    Array.from(controlsBarEl.querySelectorAll('button')).forEach(btn => {
                        const b = document.createElement('button');
                        b.textContent = btn.textContent.trim();
                        const isActive = btn.classList.contains('active');
                        b.style.cssText = `
                            padding: 4px 10px;
                            border: 1px solid #ccc;
                            border-radius: 4px;
                            cursor: default;
                            font-size: 12px;
                            background: ${isActive ? '#4363d8' : '#eee'};
                            color: ${isActive ? '#fff' : '#333'};
                            font-weight: ${isActive ? 'bold' : 'normal'};
                        `;
                        controlsClone.appendChild(b);
                    });
                    container.appendChild(controlsClone);
                }

                const headerRow = document.createElement('div');
                headerRow.style.cssText = `
                    display: flex;
                    height: ${HEADER_H}px;
                    border-bottom: 2px solid #999;
                    background: #f8f9fa;
                    width: ${totalW}px;
                `;

                const headerLabel = document.createElement('div');
                headerLabel.style.cssText = `
                    width: ${TASK_COL_W}px;
                    flex-shrink: 0;
                    padding: 0 10px;
                    display: flex;
                    align-items: center;
                    font-weight: bold;
                    font-size: 12px;
                    border-right: 2px solid #ccc;
                    background: #f8f9fa;
                    box-sizing: border-box;
                `;
                headerLabel.textContent = 'Task (duration)';

                const headerImgWrap = document.createElement('div');
                headerImgWrap.style.cssText = `width:${headerW}px; height:${HEADER_H}px; flex-shrink:0; overflow:hidden;`;
                const headerImg = new Image(headerW, HEADER_H);
                headerImg.style.cssText = `display:block; width:${headerW}px; height:${HEADER_H}px;`;
                headerImg.src = headerDataUrl;
                headerImgWrap.appendChild(headerImg);

                headerRow.appendChild(headerLabel);
                headerRow.appendChild(headerImgWrap);
                container.appendChild(headerRow);

                // ── C2. Body area (task rows on left + SVG on right) ─────────────────
                const bodyArea = document.createElement('div');
                bodyArea.style.cssText = `
                    position: relative;
                    width: ${totalW}px;
                    height: ${bodyH}px;
                `;

                // Body SVG image (right side, position absolute so it lines up with rows)
                const bodyImgWrap = document.createElement('div');
                bodyImgWrap.style.cssText = `
                    position: absolute;
                    left: ${TASK_COL_W}px;
                    top: 0;
                    width: ${bodyW}px;
                    height: ${bodyH}px;
                    overflow: visible;
                `;
                const bodyImg = new Image(bodyW, bodyH);
                bodyImg.style.cssText = `display:block; width:${bodyW}px; height:${bodyH}px;`;
                bodyImg.src = bodyDataUrl;
                bodyImgWrap.appendChild(bodyImg);
                bodyArea.appendChild(bodyImgWrap);

                // Task name column (left side on top of body SVG)
                const taskCol = document.createElement('div');
                taskCol.style.cssText = `
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: ${TASK_COL_W}px;
                    height: ${bodyH}px;
                    border-right: 2px solid #ccc;
                    background: #fff;
                    box-sizing: border-box;
                `;

                taskLabels.forEach(({ text, bg }) => {
                    const cell = document.createElement('div');
                    cell.style.cssText = `
                        width: ${TASK_COL_W}px;
                        height: ${ROW_H}px;
                        padding: 0 10px;
                        display: flex;
                        align-items: center;
                        font-size: 11px;
                        background: ${bg};
                        border-bottom: 1px solid #f0f0f0;
                        box-sizing: border-box;
                        overflow: hidden;
                        white-space: nowrap;
                    `;
                    cell.textContent = text;
                    taskCol.appendChild(cell);
                });

                bodyArea.appendChild(taskCol);
                container.appendChild(bodyArea);

                document.body.appendChild(container);

                // ── D. Wait for images to load ────────────────────────────────────────
                await Promise.all([headerImg, bodyImg].map(img =>
                    new Promise(res => { if (img.complete) res(); else { img.onload = res; img.onerror = res; } })
                ));
                await new Promise(r => setTimeout(r, 300));

                // ── E. Capture with html2canvas ───────────────────────────────────────
                const canvas = await html2canvas(container, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    width: totalW,
                    height: totalH,
                    imageTimeout: 35000,
                });

                document.body.removeChild(container);

                // ── F. Embed in A3 landscape PDF ──────────────────────────────────────
                const imgData = canvas.toDataURL('image/jpeg', 0.92);
                const pdfContentW = PAGE_WIDTH - SIDE_MARGIN * 2;
                const pdfContentH = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;
                const scale = Math.min(pdfContentW / totalW, pdfContentH / totalH);
                const pdfImgW = totalW * scale;
                const pdfImgH = totalH * scale;
alert(TOP_MARGIN);
                doc.addImage(imgData, 'JPEG', SIDE_MARGIN, TOP_MARGIN, pdfImgW, pdfImgH);
                addHeaderFooterWatermark();

                const fileName = (customFileName
                    ? `${customFileName}.pdf`
                    : `${(projectJobNo || 'document').replace(/[\\/]/g, '-')}_${previewId || 'schedule'}.pdf`
                ).replace(/\.pdf\.pdf$/i, '.pdf');
                doc.save(fileName);



            } else {
                // Existing doc.html approach for non-schedule elements
                // 1. Save Original State for Restoration
                const originalStyles = {
                    width: sourceElement.style.width,
                    maxWidth: sourceElement.style.maxWidth,
                    height: sourceElement.style.height,
                    maxHeight: sourceElement.style.maxHeight,
                    overflow: sourceElement.style.overflow,
                    position: sourceElement.style.position
                };

                // 2. Expand Live Element for Capture
                sourceElement.style.setProperty('overflow', 'visible', 'important');
                sourceElement.style.setProperty('height', 'auto', 'important');

                // Expand all nested containers & Normalize Formatting
                const elementsToRestore = []; // This array will be used for restoration
                const allDescendants = sourceElement.querySelectorAll('*');

                // 2a. Force expansion and neutralize sticky/z-index
                allDescendants.forEach(el => {
                    const style = window.getComputedStyle(el);

                    // Save original formatting for restoration
                    const restoreItem = { el: el, styles: {} };

                    // Handle Sticky and Overflow (Expansion)
                    if (style.overflow === 'hidden' || style.overflow === 'auto' || style.overflow === 'scroll' || el.scrollWidth > el.clientWidth || style.position === 'sticky') {
                        restoreItem.styles.overflow = el.style.overflow;
                        restoreItem.styles.width = el.style.width;
                        restoreItem.styles.maxWidth = el.style.maxWidth;
                        restoreItem.styles.flex = el.style.flex;
                        restoreItem.styles.minWidth = el.style.minWidth;
                        restoreItem.styles.position = el.style.position;
                        restoreItem.styles.left = el.style.left;
                        restoreItem.styles.top = el.style.top;
                        restoreItem.styles.zIndex = el.style.zIndex;

                        el.style.setProperty('overflow', 'visible', 'important');
                        el.style.setProperty('width', 'auto', 'important');
                        el.style.setProperty('max-width', 'none', 'important');
                        el.style.setProperty('min-width', '0px', 'important');
                        el.style.setProperty('flex', '0 0 auto', 'important');
                        el.style.setProperty('position', 'relative', 'important'); // Neutralize sticky for full expansion
                        el.style.setProperty('z-index', 'auto', 'important');      // Flatten z-index
                    }

                    // Normalize alignment for lists and bold text
                    if (el.tagName === 'LI' || el.tagName === 'UL' || el.tagName === 'OL') {
                        restoreItem.styles.listStylePosition = el.style.listStylePosition;
                        restoreItem.styles.lineHeight = el.style.lineHeight;
                        el.style.setProperty('list-style-position', 'inside', 'important');
                        el.style.setProperty('line-height', '1.4', 'important');
                    }
                    if (el.tagName === 'STRONG' || el.tagName === 'B' || style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 600) {
                        restoreItem.styles.fontWeight = el.style.fontWeight;
                        el.style.setProperty('font-weight', '700', 'important');
                    }

                    if (Object.keys(restoreItem.styles).length > 0) {
                        elementsToRestore.push(restoreItem);
                    }
                });

                // Calculate actual capturedWidth based on the expanded content
                const capturedWidth = Math.min(6000, Math.max(CONTENT_WIDTH * 3.78, sourceElement.scrollWidth));
                sourceElement.style.setProperty('width', capturedWidth + 'px', 'important');

                // Force browser to paint off-screen content (Scroll & Wait)
                const scrollableParents = [];
                let p = sourceElement;
                while (p && p !== document.body) {
                    if (p.scrollHeight > p.clientHeight || p.scrollWidth > p.clientWidth) {
                        scrollableParents.push(p);
                    }
                    p = p.parentElement;
                }
                scrollableParents.forEach(el => { el.scrollLeft = el.scrollWidth; el.scrollTop = el.scrollHeight; });
                await new Promise(r => setTimeout(r, 100));
                scrollableParents.forEach(el => { el.scrollLeft = 0; el.scrollTop = 0; });

                // 3. Purified SVG-to-Image Temporary Swap
                const svgs = Array.from(sourceElement.querySelectorAll('svg'));
                const imageSwaps = [];
                const imgPromises = [];

                for (const svg of svgs) {
                    try {
                        // Clone SVG for purification
                        const svgClone = svg.cloneNode(true);

                        const allSvgElements = svgClone.querySelectorAll('*');
                        allSvgElements.forEach(item => {
                            const style = item.getAttribute('style');
                            if (style) {
                                const cleanStyle = style.replace(/var\(--[^)]+\)/g, '#000').replace(/!important/g, '');
                                item.setAttribute('style', cleanStyle);
                            }
                        });

                        // Convert to Data URL (Base64) to avoid Security Errors with blob: urls
                        const svgData = new XMLSerializer().serializeToString(svgClone);
                        const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
                        const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

                        const img = new Image();
                        const svgStyle = window.getComputedStyle(svg);

                        // CRITICAL: Inherit positioning to prevent Gantt bar displacement
                        img.style.position = svgStyle.position;
                        img.style.left = svgStyle.left;
                        img.style.top = svgStyle.top;
                        img.style.zIndex = svgStyle.zIndex;
                        img.style.width = svg.clientWidth + 'px';
                        img.style.height = svg.clientHeight + 'px';
                        img.style.display = 'block';

                        const promise = new Promise((resolve) => {
                            img.onload = resolve;
                            img.onerror = resolve;
                        });
                        imgPromises.push(promise);
                        img.src = dataUrl;

                        svg.parentNode.insertBefore(img, svg);
                        svg.style.display = 'none';
                        imageSwaps.push({ svg, img });
                    } catch (e) {
                        console.error("Error processing SVG for PDF:", e);
                    }
                }

                // Wait for all assets to be ready
                await Promise.all(imgPromises);

                // Force a reflow and buffer
                sourceElement.offsetHeight;
                await new Promise(r => setTimeout(r, 200));

                // Generate PDF using high-resolution fitting
                await doc.html(sourceElement, {
                    callback: function (doc) {
                        // RESTORATION Logic
                        imageSwaps.forEach(swap => {
                            swap.svg.style.display = 'block';
                            if (swap.img.parentNode) swap.img.parentNode.removeChild(swap.img);
                        });

                        // Restore element styles
                        elementsToRestore.forEach(item => {
                            if (item.el && item.styles) {
                                for (const [prop, value] of Object.entries(item.styles)) {
                                    item.el.style[prop] = value;
                                }
                            }
                        });

                        Object.assign(sourceElement.style, originalStyles);

                        addHeaderFooterWatermark();
                        const fileName = (customFileName ? `${customFileName}.pdf` : `${(projectJobNo || 'document').replace(/[\\/]/g, '-')}_${previewId || 'preview'}.pdf`).replace(/\.pdf\.pdf$/i, '.pdf');
                        doc.save(fileName);
                    },
                    x: SIDE_MARGIN,
                    y: 10,
                    margin: [TOP_MARGIN + 15, SIDE_MARGIN, BOTTOM_MARGIN, SIDE_MARGIN],
                    width: CONTENT_WIDTH,
                    windowWidth: capturedWidth,
                    autoPaging: 'text',
                    // html2canvas: {
                    // useCORS: false,
                    // logging: false,
                    // scale: 0.2,                       // Revert to High Resolution (2.0)
                    // letterRendering: true,
                    // backgroundColor: '#ffffff',
                    // imageTimeout: 35000,
                    // removeContainer: false
                    // }
                });
            }

        } catch (e) {
            console.error("PDF Generation Failed:", e);
            alert("Error generating PDF. Please try again.");
        } finally {
            if (logoElementToHide) logoElementToHide.style.display = 'block';
            if (footerElementToHide) footerElementToHide.style.display = 'block';
        }
    };

    /**
     * Renders the first page of a PDF from a dataUrl onto a canvas element.
     */
    const renderPdfThumbnail = (canvas, dataUrl) => {
        try {
            const base64Data = atob(dataUrl.substring(dataUrl.indexOf(',') + 1));
            pdfjsLib.getDocument({ data: base64Data }).promise.then(pdf => pdf.getPage(1))
                .then(page => {
                    const desiredWidth = canvas.clientWidth;
                    const viewport = page.getViewport({ scale: 1 });
                    const scale = desiredWidth / viewport.width;
                    const scaledViewport = page.getViewport({ scale: scale });

                    const context = canvas.getContext('2d');
                    canvas.height = scaledViewport.height;
                    canvas.width = scaledViewport.width;

                    page.render({ canvasContext: context, viewport: scaledViewport });
                }).catch(err => {
                    console.error('Error rendering PDF thumbnail:', err);
                    const fallbackIcon = document.createElement('div');
                    fallbackIcon.className = 'file-icon';
                    fallbackIcon.textContent = 'PDF';
                    canvas.parentNode.replaceChild(fallbackIcon, canvas);
                });
        } catch (e) {
            console.error('Error decoding base64 data for PDF thumbnail:', e);
        }
    };

    /**
     * Generates a PDF and returns it as a Data URL string.
     */
    const generateDataUrl = async (previewId, pageSize = 'a4_portrait') => {
        return new Promise(async (resolve, reject) => {
            const { jsPDF } = window.jspdf;
            const sourceElement = document.getElementById(previewId);
            if (!sourceElement) return reject("Source element not found");

            try {
                const [format, orientation] = pageSize.toLowerCase().split('_');
                const doc = new jsPDF({
                    orientation: orientation === 'landscape' ? 'l' : 'p',
                    unit: 'mm',
                    format: format
                });

                const CONTENT_WIDTH = doc.internal.pageSize.getWidth() - 20;

                await doc.html(sourceElement, {
                    callback: function (doc) {
                        resolve(doc.output('dataurlstring'));
                    },
                    margin: [20, 10, 20, 10],
                    autoPaging: 'text',
                    x: 10,
                    y: 20,
                    width: CONTENT_WIDTH,
                    windowWidth: 'fit-content',
                });
            } catch (e) {
                reject(e);
            }
        });
    };

    return {
        generate,
        renderPdfThumbnail,
        generateDataUrl
    };

})();