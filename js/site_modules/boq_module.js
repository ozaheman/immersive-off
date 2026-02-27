import { BulletinModule } from './bulletin_module.js';
export const BoqModule = {
    init: (domElements, context) => {
        const boqTab = document.getElementById('boq-tab');
        if (domElements.addBtn) {
            domElements.addBtn.addEventListener('click', () => BoqModule.handleAddItem(context));
        }
        /*  if(domElements.certBtn) {
             domElements.certBtn.addEventListener('click', () => BoqModule.handleGenerateCertificate(context));
         } */
        if (domElements.tableBody) {
            domElements.tableBody.addEventListener('blur', (e) => BoqModule.handleEdit(e, context), true);
            domElements.tableBody.addEventListener('click', (e) => BoqModule.handleClick(e, context));
        }
        // FIX [6]: Add listener for import
        const importInput = document.getElementById('boq-import-input');
        if (importInput) {
            importInput.addEventListener('change', (e) => BoqModule.handleImport(e, context));
        }
        const exportBtn = document.getElementById('boq-export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => BoqModule.handleExport(context));
        }
        // NEW: Event delegation for dynamic action buttons
        const actionsContainer = boqTab.querySelector('#boq-actions-container');
        if (actionsContainer) {
            actionsContainer.addEventListener('click', (e) => {
                if (e.target.id === 'generate-payment-cert-btn') {
                    BoqModule.handleGenerateCertificate(context);
                } else if (e.target.id === 'request-payment-cert-btn') {
                    BoqModule.handleRequestCertificate(context);
                }
            });
        }
    },

    render: async (jobNo, domElements, searchTerm = '') => {
        if (!jobNo || !domElements.tableBody) return;
        domElements.tableBody.innerHTML = '';

        const siteData = await window.DB.getSiteData(jobNo);
        let boq = (siteData && siteData.boq) ? siteData.boq : [];
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            boq = boq.filter(item =>
                (item.description && item.description.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (item.id && item.id.toLowerCase().includes(lowerCaseSearchTerm))
            );
        }
        // MODIFICATION: Role-based rendering logic
        const role = window.AppState.currentUserRole;
        const isClient = role === 'client';
        const canEdit = !isClient;

        boq.forEach((item, index) => {
            const originalIndex = siteData.boq.findIndex(originalItem => originalItem.id === item.id && originalItem.description === item.description);
            const amount = (item.qty || 0) * (item.rate || 0);
            const totalDonePerc = (item.prev_perc || 0) + (item.curr_perc || 0);
            const workDoneValue = amount * (totalDonePerc / 100);

            const row = domElements.tableBody.insertRow();
            row.dataset.index = originalIndex;
            // Client cannot edit anything.
            const editable = canEdit ?
                'contenteditable="true"' : '';
            row.innerHTML = `
                <td ${editable} data-field="id">${item.id || ''}</td>
                <td ${editable} data-field="description">${item.description}</td>
                <td ${editable} data-field="unit">${item.unit}</td>
                <td ${editable} data-field="qty">${item.qty || 0}</td>
                <td ${editable} data-field="rate">${(item.rate || 0).toFixed(2)}</td>
                <td>${amount.toFixed(2)}</td>
                <td>${item.prev_perc || 0}%</td>
                <td ${editable} data-field="curr_perc">${item.curr_perc || 0}</td>
                <td>${totalDonePerc.toFixed(0)}%</td>
                <td>${workDoneValue.toFixed(2)}</td>
                <td>${canEdit ? '<button class="delete-boq-item-btn small-button danger-button">✕</button>' : 'N/A'}</td>
            `;
        });
        BoqModule.renderBoqActions(role);
        await BoqModule.updateTotals(jobNo, domElements);
    },
    renderBoqActions: (role) => {
        const container = document.getElementById('boq-actions-container');
        if (!container) return;

        container.innerHTML = ''; // Clear previous buttons

        switch (role) {
            case 'site':
            case 'pm':
            case 'contractor': // Also allow contractor to finalize
                container.innerHTML = `<button id="generate-payment-cert-btn" class="primary-button">Finalize & Prepare for Payment Certificate</button>
                <p class="small-text" style="margin-top: 5px;">This action will lock the "Current %" as the new "Previous %" and reset "Current %" to zero, preparing the data for the accounts department to generate the official certificate from the main dashboard.</p>`;
                break;

            case 'client':
                // Client sees nothing here, just the read-only table
                break;
        }
    },
    updateTotals: async (jobNo, domElements) => {
        const siteData = await window.DB.getSiteData(jobNo);
        if (!siteData || !siteData.boq) {
            if (domElements.totalValueDisplay) domElements.totalValueDisplay.textContent = '0.00 AED';
            if (domElements.workDoneDisplay) domElements.workDoneDisplay.textContent = '0.00 AED';
            if (domElements.progressDisplay) domElements.progressDisplay.textContent = '0%';
            return;
        }

        const boq = siteData.boq;
        const totalValue = boq.reduce((sum, item) => sum + ((item.qty || 0) * (item.rate || 0)), 0);
        const totalWorkDoneValue = boq.reduce((sum, item) => {
            const amount = (item.qty || 0) * (item.rate || 0);
            const totalPerc = (item.prev_perc || 0) + (item.curr_perc || 0);
            return sum + (amount * (totalPerc / 100));
        }, 0);

        const overallProgress = totalValue > 0 ? Math.round((totalWorkDoneValue / totalValue) * 100) : 0;
        // NEW: Display previous and current certified values if they exist
        const prevValueEl = document.getElementById('boq-previous-value');
        const currentValueEl = document.getElementById('boq-current-value');
        /* const currentPeriodValue = boq.reduce((sum, item) => {
           const amount = (item.qty || 0) * (item.rate || 0);
           return sum + (amount * ((item.curr_perc || 0) / 100));
       }, 0);
       const previousPeriodValue = totalWorkDoneValue - currentPeriodValue;*/
        if (prevValueEl && currentValueEl) {
            prevValueEl.textContent = `${(siteData.totalPreviousCertified || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} AED`;
            currentValueEl.textContent = `${(siteData.totalCurrentCertified || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} AED`;
        }

        /*if(prevValueEl) prevValueEl.textContent = `${previousPeriodValue.toLocaleString('en-US', {minimumFractionDigits: 2})} AED`;
        if(currentValueEl) currentValueEl.textContent = `${currentPeriodValue.toLocaleString('en-US', {minimumFractionDigits: 2})} AED`;*/

        if (domElements.totalValueDisplay) domElements.totalValueDisplay.textContent = `${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} AED`;
        if (domElements.workDoneDisplay) domElements.workDoneDisplay.textContent = `${totalWorkDoneValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} AED`;
        if (domElements.progressDisplay) domElements.progressDisplay.textContent = `${overallProgress}%`;
        if (domElements.progressBar) {
            domElements.progressBar.style.width = `${overallProgress}%`;
            domElements.progressBar.textContent = `${overallProgress}%`;
        }

        if (siteData.progress !== overallProgress) {
            siteData.progress = overallProgress;
            await window.DB.putSiteData(siteData);
        }
    },

    handleAddItem: async (context) => {
        const { currentJobNo } = context.getState();
        if (!currentJobNo) return;

        const siteData = await window.DB.getSiteData(currentJobNo);
        siteData.boq.push({ id: "V.O.", description: "New Item", unit: "", qty: 0, rate: 0, prev_perc: 0, curr_perc: 0 });
        await window.DB.putSiteData(siteData);
        if (context.onUpdate) context.onUpdate('boq');
    },

    handleClick: async (e, context) => {
        if (e.target.matches('.delete-boq-item-btn')) {
            const { currentJobNo } = context.getState();
            const index = parseInt(e.target.closest('tr').dataset.index);
            const siteData = await window.DB.getSiteData(currentJobNo);

            if (confirm(`Delete item: ${siteData.boq[index].description}?`)) {
                siteData.boq.splice(index, 1);
                await window.DB.putSiteData(siteData);
                if (context.onUpdate) context.onUpdate('boq');
            }
        }
    },

    handleEdit: async (e, context) => {
        const target = e.target;
        if (!target.hasAttribute('contenteditable')) return;

        const { currentJobNo } = context.getState();
        const role = window.AppState.currentUserRole;
        if (role === 'client') return; // Double-check to prevent edits
        const row = target.closest('tr');
        const index = parseInt(row.dataset.index);
        const field = target.dataset.field;
        let value = target.textContent;

        const siteData = await window.DB.getSiteData(currentJobNo);
        const item = siteData.boq[index];

        if (['qty', 'rate', 'curr_perc'].includes(field)) {
            let numValue = parseFloat(value) || 0;
            if (field === 'curr_perc') {
                const prevPerc = item.prev_perc || 0;
                if (numValue < 0) numValue = 0;
                if (numValue > (100 - prevPerc)) numValue = 100 - prevPerc;
                target.textContent = numValue;
            }
            item[field] = numValue;
        } else {
            item[field] = value;
        }

        await window.DB.putSiteData(siteData);
        if (context.onUpdate) context.onUpdate('boq');
    },

    handleGenerateCertificate: async (context) => {
        const { currentJobNo } = context.getState();
        if (!currentJobNo) return;
        if (!confirm("Are you sure you want to finalize the current progress?\nThis will lock the 'Current %' and prepare the data for the accounts team to generate a Payment Certificate.")) {
            return;
        }

        const siteData = await window.DB.getSiteData(currentJobNo);
        /*const project = await window.DB.getProject(currentJobNo);

        const totalContractValue = siteData.boq.reduce((sum, item) => sum + ((item.qty || 0) * (item.rate || 0)), 0);

        const existingCerts = siteData.paymentCertificates || [];
        let previouslyCertifiedValue = 0;
        if (existingCerts.length > 0) {
            existingCerts.sort((a, b) => b.certNo.localeCompare(a.certNo));
            const latestCert = existingCerts[0];
            previouslyCertifiedValue = latestCert.workDoneValue - latestCert.retention - latestCert.advanceDeduction;
        }

        const totalWorkDoneToDate = siteData.boq.reduce((sum, item) => {
            const amount = (item.qty || 0) * (item.rate || 0);
            const totalPerc = (item.prev_perc || 0) + (item.curr_perc || 0);
            return sum + (amount * (totalPerc / 100));
        }, 0);

        const retentionRate = 0.10;
        const advancePaymentRate = 0.10;

        const retention = totalWorkDoneToDate * retentionRate;
        const advanceDeduction = totalWorkDoneToDate * advancePaymentRate;
        
        const totalForInvoice = (totalWorkDoneToDate - retention - advanceDeduction) - previouslyCertifiedValue;

        const vatRate = project.vatRate || 5;
        const vat = totalForInvoice * (vatRate / 100);
        let netPayable = totalForInvoice + vat;
        const roundOff = Math.round(netPayable) - netPayable;
        netPayable = Math.round(netPayable);

        if (!siteData.paymentCertificates) siteData.paymentCertificates = [];
        const newCertNo = `IPC-${String(siteData.paymentCertificates.length + 1).padStart(2, '0')}`;
        const newCertificate = {
            certNo: newCertNo,
            date: new Date().toISOString().split('T')[0],
            status: 'Pending Generation',
            totalContractValue,
            workDonePercentage: totalContractValue > 0 ? ((totalWorkDoneToDate / totalContractValue) * 100).toFixed(2) : 0,
            workDoneValue: totalWorkDoneToDate,
            retention,
            advanceDeduction,
            previouslyCertified: previouslyCertifiedValue,
            totalForInvoice,
            vat,
            roundOff,
            netPayable
        };
         siteData.paymentCertificates.push(newCertificate);
         // Finalize percentages
         // --- NEW: Calculate previous and current amounts before finalizing ---*/
        let totalPreviousAmount = 0;
        let totalCurrentAmount = 0;
        siteData.boq.forEach(item => {
            const itemAmount = (item.qty || 0) * (item.rate || 0);
            totalPreviousAmount += itemAmount * ((item.prev_perc || 0) / 100);
            totalCurrentAmount += itemAmount * ((item.curr_perc || 0) / 100);
        });

        // Store these calculated values on the siteData object
        siteData.totalPreviousCertified = totalPreviousAmount;
        siteData.totalCurrentCertified = totalCurrentAmount;

        // Now, finalize percentages for the next cycle
        siteData.boq.forEach(item => {
            const currentPercentage = item.curr_perc || 0;
            if (currentPercentage > 0) {
                item.prev_perc = (item.prev_perc || 0) + currentPercentage;
                item.curr_perc = 0;
            }
        });

        await window.DB.putSiteData(siteData);

        await BulletinModule.post({
            subject: 'Payment Certificate Ready',
            details: `Site Engineer has finalized BOQ progress for project <strong>${currentJobNo}</strong>. Data is ready for payment certificate generation.`,
            jobNo: currentJobNo,
            assignedTo: 'Accounts/PM'
        });

        alert("BOQ progress has been finalized and saved. The accounts team has been notified to generate the certificate from the main dashboard.");

        if (context.onUpdate) context.onUpdate('boq');
    },

    // NEW: Handler for contractor's request button
    handleRequestCertificate: async (context) => {
        const { currentJobNo } = context.getState();
        if (!currentJobNo) return;

        // First, finalize the data just like the site engineer would
        await BoqModule.handleGenerateCertificate(context);

        /*await BulletinModule.post({
            subject: 'Payment Certificate Request',
            details: `The contractor for project <strong>${currentJobNo}</strong> has requested a new payment certificate. Site engineer to update BOQ progress.`,
            jobNo: currentJobNo,
            assignedTo: 'Site Engineer/PM'
        });
        
        alert("Your request for a payment certificate has been logged and sent to the Project Manager and Site Engineer.");*/
    },
    handleImport: async (event, context) => {
        const { currentJobNo } = context.getState();
        if (!currentJobNo) return;
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            const rows = text.split('\n').filter(row => row.trim() !== '');
            const newBoq = [];

            // Skip header row if it exists
            const startRow = (rows[0] && rows[0].toLowerCase().includes('description')) ? 1 : 0;

            for (let i = startRow; i < rows.length; i++) {
                const columns = rows[i].split(',');
                if (columns.length >= 5) { // Expecting at least ID, Desc, Unit, Qty, Rate
                    newBoq.push({
                        id: columns[0]?.trim() || '',
                        description: columns[1]?.trim() || 'N/A',
                        unit: columns[2]?.trim() || '',
                        qty: parseFloat(columns[3]) || 0,
                        rate: parseFloat(columns[4]) || 0,
                        prev_perc: 0,
                        curr_perc: 0
                    });
                }
            }

            if (confirm(`Found ${newBoq.length} items. This will REPLACE the existing BOQ. Continue?`)) {
                const siteData = await window.DB.getSiteData(currentJobNo);
                siteData.boq = newBoq;
                await window.DB.putSiteData(siteData);
                if (context.onUpdate) context.onUpdate('boq');
                alert("BOQ imported successfully.");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input to allow re-uploading the same file
    },

    // New: Export to CSV Handler
    handleExport: async (context) => {
        const { currentJobNo } = context.getState();
        if (!currentJobNo) return;

        const siteData = await window.DB.getSiteData(currentJobNo);
        const boq = siteData.boq || [];

        if (boq.length === 0) {
            alert("BOQ is empty. Nothing to export.");
            return;
        }

        const headers = ["ID", "Description", "Unit", "Qty", "Rate", "Amount", "Prev %", "Current %", "Total %", "Work Done Value"];

        const escapeCsvCell = (cell) => {
            const strCell = String(cell || '');
            if (strCell.includes(',')) {
                return `"${strCell.replace(/"/g, '""')}"`;
            }
            return strCell;
        };

        const csvRows = [headers.join(',')];
        boq.forEach(item => {
            const amount = (item.qty || 0) * (item.rate || 0);
            const totalDonePerc = (item.prev_perc || 0) + (item.curr_perc || 0);
            const workDoneValue = amount * (totalDonePerc / 100);

            const row = [
                item.id || '',
                item.description,
                item.unit,
                item.qty || 0,
                item.rate || 0,
                amount,
                item.prev_perc || 0,
                item.curr_perc || 0,
                totalDonePerc,
                workDoneValue
            ].map(escapeCsvCell);
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${currentJobNo}_BOQ_Export.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};