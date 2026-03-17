App.ProjectTabs.PaymentCert = (() => {

 let currentCertObject = null; // Holds the data of the currently selected certificate
function init() {
    const container = document.getElementById('payment-cert-tab');
    if (!container) return;
    container.innerHTML = `
        <h3>Payment Certificates</h3>
        <p>Generate certificates based on the latest BOQ data from the site engineer.</p>
        <!-- NEW: Summary container for changes -->
        <div id="payment-cert-summary" class="summary-box" style="margin-bottom: 15px; padding: 10px; background-color: #e9f7ff; border: 1px solid #b3e0ff; border-radius: 4px;">
            <p style="margin: 0;">Loading summary of work done...</p>
        </div>
        <div class="input-group"><label for="payment-cert-no">Next Certificate No.</label><input type="text" id="payment-cert-no"></div>
        <button id="generate-new-cert-btn" class="primary-button" style="width: 100%; margin-bottom: 15px;">Generate New Certificate</button><hr>
        <h4>Certificate History</h4>
        <table class="output-table"><thead><tr><th>Cert. No.</th><th>Date</th><th>Net Payable</th><th>Action</th></tr></thead><tbody id="cert-history-body"></tbody></table>
    `;
    Object.assign(App.DOMElements, {
         paymentCertSummary: document.getElementById('payment-cert-summary'), // Cache new element
        paymentCertNo: document.getElementById('payment-cert-no'),
        certHistoryBody: document.getElementById('cert-history-body')
    });
    setupEventListeners();
}

function setupEventListeners() {
    document.getElementById('payment-cert-tab')?.addEventListener('click', handleActions);
}

async function handleActions(e) {
    if (!App.currentProjectJobNo) return;
    if (e.target.matches('#generate-new-cert-btn')) {
        const certNo = App.DOMElements.paymentCertNo.value;
        if (!certNo) { alert('Please provide a Certificate Number.'); return; }
        await generateAndSavePaymentCertificate(certNo);
    } else if (e.target.matches('.view-cert-btn')) {
        const index = e.target.dataset.index;
        const siteData = await DB.getSiteData(App.currentProjectJobNo);
        const certData = siteData?.paymentCertificates?.[index];
        if (certData) {
            await renderPreview(certData);
            App.DOMElements.previewTabs.querySelector(`[data-tab="payment-certificate"]`).click();
        }
    }
}

async function renderTab(project) {
    if (!project) return;
       const siteData = await DB.getSiteData(project.jobNo) || { paymentCertificates: [], boq: [] };
    const certs = siteData.paymentCertificates || [];
    const boq = siteData.boq || [];

    // --- NEW: Calculate and Render Summary ---
    const summaryContainer = App.DOMElements.paymentCertSummary;
    if (summaryContainer) {
        const totalContractValue = boq.reduce((sum, item) => sum + ((item.qty || 0) * (item.rate || 0)), 0);
        
        // This is the total work done certified in all previous certificates.
        const previouslyCertifiedValue = certs.reduce((sum, cert) => sum + cert.workDoneValue, 0);

        // This is the total work done now, based on the site engineer's finalized data.
        const currentTotalWorkDone = boq.reduce((sum, item) => {
            const amount = (item.qty || 0) * (item.rate || 0);
            return sum + (amount * ((item.prev_perc || 0) / 100));
        }, 0);

        const newWorkDoneValue = currentTotalWorkDone - previouslyCertifiedValue;
        const previousPercentage = totalContractValue > 0 ? (previouslyCertifiedValue / totalContractValue) * 100 : 0;
        const currentPercentage = totalContractValue > 0 ? (currentTotalWorkDone / totalContractValue) * 100 : 0;
        const percentageChange = currentPercentage - previousPercentage;

        if (newWorkDoneValue > 0) {
            summaryContainer.innerHTML = `
                <p style="margin: 0 0 5px 0;"><strong>Work Done Since Last Certificate:</strong></p>
                <p style="margin: 0; font-size: 1.2em; font-weight: bold; color: #0d6efd;">${App.formatCurrency(newWorkDoneValue)}</p>
                <p style="margin: 5px 0 0 0; font-size: 0.9em; color: #555;">
                    Progress increased by <strong>${percentageChange.toFixed(2)}%</strong> 
                    (from ${previousPercentage.toFixed(2)}% to ${currentPercentage.toFixed(2)}%).
                </p>
            `;
        } else {
            summaryContainer.innerHTML = `<p style="margin: 0;">No new work progress has been finalized by the site engineer since the last certificate.</p>`;
        }
    }
    App.DOMElements.paymentCertNo.value = `PC-${String(certs.length + 1).padStart(2, '0')}`;
    const tbody = App.DOMElements.certHistoryBody;
    tbody.innerHTML = '';
    if (certs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No certificates issued yet.</td></tr>';
    } else {
        certs.forEach((cert, index) => {
            const row = tbody.insertRow();
            row.innerHTML = `<td>${cert.certNo}</td><td>${new Date(cert.date).toLocaleDateString('en-CA')}</td><td>${App.formatCurrency(cert.netPayable)}</td><td><button class="view-cert-btn secondary-button" data-index="${index}">View</button></td>`;
        });
    }
}

async function generateAndSavePaymentCertificate(certNo) {
    const project = await DB.getProject(App.currentProjectJobNo);
    const siteData = await DB.getSiteData(App.currentProjectJobNo);
    if (!siteData || !siteData.boq || siteData.boq.length === 0) {
        alert("Cannot generate certificate. No BOQ data found from site engineer."); return;
    }
    /* const totalValue = siteData.boq.reduce((sum, item) => sum + (item.amount || 0), 0);
    const workDoneValue = siteData.boq.reduce((sum, item) => sum + ((item.amount || 0) * (((item.prev_perc || 0) + (item.curr_perc || 0)) / 100)), 0); */
      // CORRECTED LOGIC: Calculate values based on finalized site data
       const previouslyCertifiedValue = siteData.totalPreviousCertified || 0;
    const currentWorkValue = siteData.totalCurrentCertified || 0;
    // Check if new work has been done. This check is crucial.
    if (currentWorkValue <= 0) {
        alert("No new work progress found (Current Certified Value is zero). The site engineer must finalize new progress first.");
        return;
    }

    const workDoneValue = previouslyCertifiedValue + currentWorkValue; // This is the new grand total
    const totalContractValue = siteData.boq.reduce((sum, item) => sum + ((item.qty || 0) * (item.rate || 0)), 0);
    const totalProgress = totalContractValue > 0 ? (workDoneValue / totalContractValue) * 100 : 0;
    ////const totalValue = siteData.boq.reduce((sum, item) => sum + ((item.qty || 0) * (item.rate || 0)), 0);
    
    // Work done is based on PREV_PERC, as CURR_PERC has been moved to PREV_PERC by the site engineer.
    //const workDoneValue = siteData.boq.reduce((sum, item) => {
       // const amount = (item.qty || 0) * (item.rate || 0);
      //  const totalPerc = (item.prev_perc || 0); // Use only previous percentage
    //if (workDoneValue <= previouslyCertifiedValue) {
      //  alert("No new work progress found since the //last certificate was issued. Cannot generate //a new certificate.");
     //   return;
   // }
    //const totalProgress = totalValue > 0 ? (//workDoneValue / totalValue) * 100 : 0;
    const retention = workDoneValue * 0.10;
    const advanceDeduction = workDoneValue * 0.10;
    /* const previouslyCertified = (siteData.paymentCertificates || []).reduce((sum, cert) => sum + cert.totalForInvoice, 0);
    const totalForInvoice = workDoneValue - retention - advanceDeduction - previouslyCertified;
    const vat = totalForInvoice > 0 ? totalForInvoice * 0.05 : 0; */
    
    // Previously certified is the SUM of the *net payable* of previous certificates. Let's adjust this.
    // A better way is to sum the `workDoneValue` of previous certificates.
   

    // This should be based on the difference in work done, not total invoice amounts.
    //const currentWorkValue = workDoneValue - previouslyCertifiedValue;
    ////const totalForInvoice = workDoneValue - previouslyCertifiedValue;
    
    // Now calculate deductions on the CURRENT portion of work done
   // const currentRetention = currentWorkValue * 0.10;
    //const currentAdvanceDeduction = currentWorkValue * 0.10;
    
    //const totalForInvoice = currentWorkValue - currentRetention - currentAdvanceDeduction;
    const totalForInvoice = currentWorkValue;

    const vat = totalForInvoice > 0 ? totalForInvoice * ( (project.vatRate || 5) / 100) : 0;
    const roundOff = Math.ceil(totalForInvoice + vat) - (totalForInvoice + vat);
    const netPayable = totalForInvoice + vat + roundOff;
    const newCertData = {
        /* certNo, date: new Date().toISOString(), totalContractValue: totalValue,
        workDoneValue, workDonePercentage: totalProgress.toFixed(0), retention,
        advanceDeduction, previouslyCertified, totalForInvoice, vat, roundOff, netPayable */
        certNo, 
        date: new Date().toISOString(), 
        totalContractValue: totalValue,
        workDoneValue, 
        workDonePercentage: totalProgress.toFixed(0), 
        retention, // Total retention
        advanceDeduction, // Total advance deduction
        previouslyCertified: previouslyCertifiedValue,
        totalForInvoice, 
        vat, 
        roundOff, 
        netPayable
    };
    siteData.paymentCertificates = siteData.paymentCertificates || [];
    siteData.paymentCertificates.push(newCertData);
    // After generating, clear the temporary certified values
    siteData.totalPreviousCertified = 0;
    siteData.totalCurrentCertified = 0;
    await DB.putSiteData(siteData);
    await renderTab(project);
    await renderPreview(newCertData);
    App.DOMElements.previewTabs.querySelector(`[data-tab="payment-certificate"]`).click();
    alert(`Payment Certificate ${certNo} has been generated and saved.`);
}

async function renderPreview(certData) {
    const container = App.DOMElements['payment-certificate-preview'];
    if (!certData) {
         container.innerHTML = `<div style="padding: 20px; text-align: center;">Generate or select a certificate to view its preview.</div>`;
         return;
    }
    const project = await DB.getProject(App.currentProjectJobNo);
    container.innerHTML = PROJECT_DOCUMENT_TEMPLATES.paymentCertificate(certData, project);
}
function getCurrentCert() {
    // This function simply returns the current state of the certificate being built.
    //return currentCert;
    return null; // Not needed for this logic
}


return {
    init,
    renderTab,
    renderPreview,
    getCurrentCert // <-- Add this new export
};

// return { init, renderTab, renderPreview };

})();