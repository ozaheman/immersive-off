export const PaymentListModule = {
    init: (domElements, context) => {
        domElements.newBtn.addEventListener('click', () => PaymentListModule.showModal(null, domElements, context));
        domElements.modalElements.saveBtn.addEventListener('click', () => PaymentListModule.handleSave(domElements.modalElements, context));
        domElements.modalElements.closeBtn.addEventListener('click', () => domElements.modalElements.modal.style.display = 'none');
    },

    render: async (jobNo, container) => {
        if (!jobNo || !container) return;

        const project = await window.DB.getProject(jobNo);
        const siteData = await window.DB.getSiteData(jobNo);

        // Get the three sources of payments
        const consultantInvoices = (project.invoices || []).map(inv => ({ ...inv, isMaster: true }));
        const manualPayments = siteData.paymentLog || [];
        // --- MODIFICATION START: Add Payment Certificates as a payment source ---
        const certificates = (project.paymentCertificates || []).map(cert => ({ ...cert, isCert: true }));
        
        const allPayments = [...consultantInvoices, ...manualPayments, ...certificates].sort((a, b) => new Date(b.date) - new Date(a.date));
        // --- MODIFICATION END ---

        if (allPayments.length === 0) {
            container.innerHTML = '<p>No payments, invoices, or certificates tracked for this project.</p>';
            return;
        }

        let html = `
            <table class="output-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description / Ref No.</th>
                        <th>From</th>
                        <th>To Whom</th>
                        <th>Amount (AED)</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>`;

        for (const payment of allPayments) {
            let actionsHtml = 'N/A';
            let statusHtml = '';
            let description = '';
            let toWhom = '';
            let fromWhom = ''; // New variable for the "From" column
            let rowStyle = '';
            let amount = parseFloat(payment.amount || payment.total || payment.netPayable || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            if (payment.isMaster) { // This is an invoice from consultant
                actionsHtml = `<button class="view-invoice-btn secondary-button" data-job-no="${jobNo}" data-inv-no="${payment.no}">View</button>`;
                statusHtml = `<span class="status-${(payment.status || 'draft').toLowerCase()}">${payment.status}</span>`;
                description = `<strong>${payment.no}</strong>`;
                fromWhom = 'Consultant'; // Invoices are FROM the consultant
                toWhom = `Client (${project.clientName})`;
                rowStyle = 'background-color: #e9ecef;';
            } else if (payment.isCert) { // --- MODIFICATION: Handle certificate rendering ---
                actionsHtml = `<span>View in Main App</span>`;
                statusHtml = `<span class="status-approved">Certified</span>`;
                description = `<strong>${payment.certNo}</strong>`;
                fromWhom = 'Consultant'; // Certificates are FROM the consultant
                toWhom = 'Contractor';
                rowStyle = 'background-color: #e6fffa;'; // A light green to differentiate
            } else { // This is a manual payment log
                description = payment.description;
                fromWhom = 'Contractor'; // Manual logs are typically payments BY the contractor
                toWhom = payment.toWhom;
                statusHtml = `${payment.mode || ''} ${payment.refNo || ''}`;
                if (payment.receiptFileId) {
                    const file = await window.DB.getFileById(payment.receiptFileId);
                    if (file) actionsHtml = `<a href="${file.dataUrl}" download="${file.name}" class="primary-button">View Receipt</a>`;
                }
            }
            
            html += `
                <tr style="${rowStyle}">
                    <td>${new Date(payment.date).toLocaleDateString('en-CA')}</td>
                    <td>${description}</td>
                    <td><strong>${fromWhom}</strong></td>
                    <td>${toWhom}</td>
                    <td style="text-align:right;">${amount}</td>
                    <td>${statusHtml}</td>
                    <td>${actionsHtml}</td>
                </tr>
            `;
        }
        
        html += `</tbody></table>`;
        container.innerHTML = html;
    },

    showModal: (paymentId, domElements, context) => {
        const M = domElements.modalElements;
        Object.keys(M).forEach(key => {
            if (M[key].tagName === 'INPUT' || M[key].tagName === 'TEXTAREA' || M[key].tagName === 'SELECT') M[key].value = '';
        });
        M.modal.style.display = 'flex';
    },

    handleSave: async (modalElements, context) => {
        const M = modalElements;
        const { currentJobNo } = context.getState();
        const { amount, toWhom, date } = M;
        if (!amount.value || !toWhom.value || !date.value) return alert("Date, To Whom, and Amount are required fields.");

        const siteData = await window.DB.getSiteData(currentJobNo);
        if (!siteData.paymentLog) siteData.paymentLog = [];
        
        const newPayment = {
            id: `PAY-${Date.now()}`,
            description: M.description.value.trim(),
            toWhom: toWhom.value,
            amount: amount.value,
            mode: M.mode.value,
            refNo: M.refNo.value.trim(),
            date: date.value,
            chaseBy: M.chaseBy.value.trim(),
            chaseDate: M.chaseDate.value
        };

        const file = M.receiptFile.files[0];
        if (file) {
            const dataUrl = await new Promise(r => { const reader = new FileReader(); reader.onload = e => r(e.target.result); reader.readAsDataURL(file); });
            const fileRecord = { jobNo: currentJobNo, source: 'site', type: 'payment_receipt', name: file.name, fileType: file.type, dataUrl };
            newPayment.receiptFileId = await window.DB.addFile(fileRecord);
        }
        
        siteData.paymentLog.push(newPayment);
        await window.DB.putSiteData(siteData);
        
        M.modal.style.display = 'none';
        context.onUpdate('payments');
    },
};