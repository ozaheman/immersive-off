App.ProjectTabs.PaymentCert = (() => {
    let activeCertDataForPreview = null; // State variable to hold the current certificate for preview

    function init() {
        const container = document.getElementById('payment-cert-tab');
        if (!container) return;

        Object.assign(App.DOMElements, {
            paymentCertSummary: document.getElementById('payment-cert-summary'),
            generateNewCertBtn: document.getElementById('generate-new-cert-btn'),
            certHistoryBody: document.getElementById('cert-history-body'),
            paymentCertBoqBody: document.getElementById('payment-cert-boq-body'),
        });
        setupEventListeners();
    }

    function setupEventListeners() {
        const tab = document.getElementById('payment-cert-tab');
        if (!tab) return;
        
        tab.addEventListener('click', async (e) => {
            if (!App.currentProjectJobNo) return;
            
            if (e.target.id === 'generate-new-cert-btn') {
                await generateAndSavePaymentCertificate();
            } else if (e.target.matches('.view-cert-btn')) {
                const index = e.target.dataset.index;
                const project = await DB.getProject(App.currentProjectJobNo);
                const certData = project?.paymentCertificates?.[index];
                if (certData) {
                    activeCertDataForPreview = certData; // Set the active certificate data
                    await renderPreview(); // Render the preview from the new state
                    App.DOMElements.previewTabs.querySelector(`[data-tab="payment-certificate"]`).click();
                }
            }
        });
    }

    async function renderTab(project) {
        if (!project || !App.DOMElements.certHistoryBody || !App.DOMElements.paymentCertBoqBody) return;

        const siteData = await DB.getSiteData(project.jobNo) || {};
        const certs = project.paymentCertificates || [];
        const boq = siteData.boq || [];

        // --- Render Summary based on Site Data ---
        const summaryContainer = App.DOMElements.paymentCertSummary;
        const currentWorkValue = siteData.totalCurrentCertified || 0;
        
        if (currentWorkValue > 0) {
            const previousWorkValue = siteData.totalPreviousCertified || 0;
            const totalContractValue = boq.reduce((sum, item) => sum + ((item.qty || 0) * (item.rate || 0)), 0);
            const prevPercentage = totalContractValue > 0 ? (previousWorkValue / totalContractValue) * 100 : 0;
            const currentTotalPercentage = totalContractValue > 0 ? ((previousWorkValue + currentWorkValue) / totalContractValue) * 100 : 0;
            const percentageChange = currentTotalPercentage - prevPercentage;

            summaryContainer.innerHTML = `
                <p style="margin: 0; font-weight: bold; color: #0d6efd;">
                    Site Engineer has finalized new work valued at ${App.formatCurrency(currentWorkValue)}.
                </p>
                <p style="margin: 5px 0 0 0; font-size: 0.9em; color: #555;">
                    Progress increased by <strong>${percentageChange.toFixed(2)}%</strong> 
                    (from ${prevPercentage.toFixed(2)}% to ${currentTotalPercentage.toFixed(2)}%).
                </p>
            `;
            App.DOMElements.generateNewCertBtn.disabled = false;
        } else {
            summaryContainer.innerHTML = `<p style="margin: 0;">No new work progress has been finalized. Awaiting site engineer to submit new progress.</p>`;
            App.DOMElements.generateNewCertBtn.disabled = true;
        }

        // --- Render BOQ Verification Table ---
        const boqBody = App.DOMElements.paymentCertBoqBody;
        boqBody.innerHTML = '';
        if(boq.length === 0){
             boqBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No BOQ items found.</td></tr>';
        } else {
            boq.forEach(item => {
                const newProgress = siteData.boq_pre_finalization?.find(p => p.id === item.id)?.curr_perc || 0;
                const oldProgress = (item.prev_perc || 0) - newProgress;
                const totalProgress = item.prev_perc || 0;
                const row = boqBody.insertRow();
                if(newProgress > 0) {
                    row.classList.add('boq-highlight');
                }
                
                row.innerHTML = `
                    <td>${item.id}</td>
                    <td>${item.description}</td>
                    <td style="text-align:right;">${oldProgress.toFixed(2)}%</td>
                    <td style="text-align:right;">${newProgress > 0 ? `+${newProgress.toFixed(2)}%` : '0.00%'}</td>
                    <td style="text-align:right;">${totalProgress.toFixed(2)}%</td>
                `;
            });
        }

        // --- Render Certificate History ---
        const tbody = App.DOMElements.certHistoryBody;
        tbody.innerHTML = '';
        if (certs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No certificates issued yet.</td></tr>';
        } else {
            certs.forEach((cert, index) => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${cert.certNo}</td>
                    <td>${App.formatDate(cert.date)}</td>
                    <td style="text-align:right;">${App.formatCurrency(cert.netPayable)}</td>
                    <td><button class="view-cert-btn secondary-button small-button" data-index="${index}">View</button></td>
                `;
            });
        }
    }

    async function generateAndSavePaymentCertificate() {
        const project = await DB.getProject(App.currentProjectJobNo);
        const siteData = await DB.getSiteData(App.currentProjectJobNo);

        if (!siteData || !siteData.boq || siteData.boq.length === 0) {
            alert("Cannot generate certificate. No BOQ data found.");
            return;
        }

        const currentWorkValue = siteData.totalCurrentCertified || 0;
        if (currentWorkValue <= 0) {
            alert("No new work progress found (Current Certified Value is zero). The site engineer must finalize new progress first.");
            return;
        }
        
        const certs = project.paymentCertificates || [];
        const certNo = `PC-${String(certs.length + 1).padStart(2, '0')}`;
        const previouslyCertifiedValue = certs.reduce((sum, cert) => sum + cert.totalForInvoice, 0);
        const workDoneValue = previouslyCertifiedValue + currentWorkValue;
        const totalContractValue = siteData.boq.reduce((sum, item) => sum + ((item.qty || 0) * (item.rate || 0)), 0);
        const totalProgress = totalContractValue > 0 ? (workDoneValue / totalContractValue) * 100 : 0;
        const retention = workDoneValue * 0.10;
        const advanceDeduction = workDoneValue * 0.10;
        const totalForInvoice = currentWorkValue;
        const vat = totalForInvoice > 0 ? totalForInvoice * ((project.vatRate || 5) / 100) : 0;
        const roundOff = Math.ceil(totalForInvoice + vat) - (totalForInvoice + vat);
        const netPayable = totalForInvoice + vat + roundOff;

        const newCertData = {
            certNo, date: new Date().toISOString(), totalContractValue, workDoneValue,
            workDonePercentage: totalProgress.toFixed(2), retention, advanceDeduction,
            previouslyCertified: previouslyCertifiedValue, totalForInvoice, vat, roundOff, netPayable
        };

        if (!project.paymentCertificates) project.paymentCertificates = [];
        project.paymentCertificates.push(newCertData);
        await DB.putProject(project);

        siteData.totalPreviousCertified = (siteData.totalPreviousCertified || 0) + currentWorkValue;
        siteData.totalCurrentCertified = 0;
        delete siteData.boq_pre_finalization;
        await DB.putSiteData(siteData);

        activeCertDataForPreview = newCertData; // Set the active certificate data

        await renderTab(project);
        await renderPreview(); // Render the preview from the new state
        App.DOMElements.previewTabs.querySelector(`[data-tab="payment-certificate"]`).click();
        
        App.Bulletin.log('Payment Certificate Generated', `Cert <strong>${certNo}</strong> for project <strong>${project.jobNo}</strong> was generated.`);
        alert(`Payment Certificate ${certNo} has been generated and saved.`);
    }

    async function renderPreview() {
        const container = App.DOMElements['payment-certificate-preview'];
        if (!container) return;
        
        if (!activeCertDataForPreview) {
            container.innerHTML = `<div class="document-preview a4"><p style="text-align: center; padding: 50px;">Generate or select a certificate from the history to view its preview.</p></div>`;
            return;
        }
        const project = await DB.getProject(App.currentProjectJobNo);
        container.innerHTML = PROJECT_DOCUMENT_TEMPLATES.paymentCertificate(activeCertDataForPreview, project);
    }
    
    function resetPreviewState() {
        activeCertDataForPreview = null;
    }

    return {
        init,
        renderTab,
        renderPreview,
        resetPreviewState,
    };

})();