export const ReportingModule = {
    init: (context) => {
       //alert(context);
        // The main event listener will be in site_index.js
        const reportModalCloseBtn = document.getElementById('report-modal-close-btn');
        
        if (reportModalCloseBtn) {
            reportModalCloseBtn.addEventListener('click', () => {
                document.getElementById('report-modal').style.display = 'none';
            });
        }

        const printReportBtn = document.getElementById('print-report-btn');
        if (printReportBtn) {
            printReportBtn.addEventListener('click', ReportingModule.handlePrint);
        }
    },

    showReportModal: (title, htmlContent) => {
         //alert('ok1');
        const modal = document.getElementById('report-modal');
        const titleEl = document.getElementById('report-modal-title');
        const bodyEl = document.getElementById('report-modal-body');
const printBtn = document.getElementById('print-report-btn');
        titleEl.textContent = title;
        //bodyEl.innerHTML = htmlContent;
        // MODIFICATION: Wrap content in a standard A4 preview container for consistent printing.
        bodyEl.innerHTML = `
            <div class="document-preview a4" id="report-print-area">
                ${htmlContent}
            </div>
        `;
         printBtn.style.display = 'block'; // Show print button when showing a report
        modal.style.display = 'flex';
    },

    handlePrint: () => {
        const modalTitle = document.getElementById('report-modal-title').textContent;
        if (window.PDFGenerator) {
           window.PDFGenerator.generate({
               // previewId: 'report-modal-body',
               // fileName: modalTitle.replace(/ /g, '_'),
              //  pageSize: 'a4_portrait'
              
              
               previewId: 'report-print-area', // Target the new wrapper
                fileName: modalTitle.replace(/[\s/]/g, '_'), // Sanitize filename
                pageSize: 'A4_portrait'
            });
        }
    },

    // --- HTML Generation Functions ---
// --- MODIFICATION: New function for Project Status Report Configuration ---
    showProjectStatusReportConfig: async (jobNo) => {
        const modal = document.getElementById('report-modal');
        const titleEl = document.getElementById('report-modal-title');
        const bodyEl = document.getElementById('report-modal-body');
         const printBtn = document.getElementById('print-report-btn');
        
        titleEl.textContent = `Generate Site Status Report for Project ${jobNo}`;
        printBtn.style.display = 'none'; // Hide print button during configuration
        
        bodyEl.innerHTML = `
            <div id="report-config-container">
                <h4>Select Sections to Include in the Report</h4>
                <div class="checkbox-group" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <label><input type="checkbox" name="reportSection" value="header" checked> Project Details & Logos</label>
                    <label><input type="checkbox" name="reportSection" value="summary" checked> Progress Summary</label>
                    <label><input type="checkbox" name="reportSection" value="schedule" checked> Schedule Overview (Table)</label>
                    <label><input type="checkbox" name="reportSection" value="lookAhead" checked> Look Ahead Program</label>
                    <label><input type="checkbox" name="reportSection" value="longLead" checked> Long Lead Items</label>
                    <label><input type="checkbox" name="reportSection" value="rfi" checked> RFI Log Summary</label>
                    <label><input type="checkbox" name="reportSection" value="materials" checked> Material Submittal Summary</label>
                    <label><input type="checkbox" name="reportSection" value="photos" checked> Recent Site Photos</label>
                </div>
                <button id="generate-status-report-preview" class="primary-button" style="width: 100%; margin-top: 20px;">Generate Preview</button>
            </div>
        `;

        modal.style.display = 'flex';

        document.getElementById('generate-status-report-preview').addEventListener('click', async () => {
            bodyEl.innerHTML = '<p>Generating report, please wait...</p>';
            const reportHtml = await ReportingModule.generateProjectStatusReportHtml(jobNo);
              
            // **THE FIX**: Update the current modal instead of calling showReportModal again.
            titleEl.textContent = `Site Status Report - ${jobNo}`;
            bodyEl.innerHTML = `
                <div class="document-preview a4" id="report-print-area">
                    ${reportHtml}
                </div>
            `;
            alert('full report');
            printBtn.style.display = 'block'; // Now show the print button
        });
    },

    // --- MODIFICATION: New function to generate the full status report ---
    generateProjectStatusReportHtml: async (jobNo) => {
        const options = {};
        document.querySelectorAll('#report-config-container input[name="reportSection"]:checked').forEach(cb => {
            options[cb.value] = true;
        });

        const project = await window.DB.getProject(jobNo);
        const siteData = await window.DB.getSiteData(jobNo);
        if (!project || !siteData) return '<p>Could not load project data.</p>';

        const schedule = await getProjectSchedule(project, siteData);
        let reportHtml = '';

        // Section 1: Header
        if (options.header) {
            const consultantLogo = window.LOGO_svgBASE64 ? `<img src="${window.LOGO_svgBASE64}" style="max-height:60px; max-width:200px;">` : `<h5>Urban Axis</h5>`;
            const clientLogo = project.clientInfo?.logo1 ? `<img src="${project.clientInfo.logo1}" style="max-height:60px; max-width:200px;">` : `<h5>${project.clientName}</h5>`;
            const contractorLogo = project.contractorInfo?.logo1 ? `<img src="${project.contractorInfo.logo1}" style="max-height:60px; max-width:200px;">` : `<h5>${project.contractorInfo?.name || 'Main Contractor'}</h5>`;
            reportHtml += `
                <div style="page-break-inside: avoid;">
                    <h1 style="text-align: center;">Site Status Report</h1>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
                        <div style="flex: 1; text-align: left;">${clientLogo}</div>
                        <div style="flex: 1; text-align: center;">${consultantLogo}</div>
                        <div style="flex: 1; text-align: right;">${contractorLogo}</div>
                    </div>
                    <table class="output-table">
                        <tr><th>Project</th><td>${project.projectDescription}</td><th>Job No.</th><td>${project.jobNo}</td></tr>
                        <tr><th>Client</th><td>${project.clientName}</td><th>Plot No.</th><td>${project.plotNo}</td></tr>
                        <tr><th>Contractor</th><td>${project.contractorInfo?.name || 'N/A'}</td><th>Report Date</th><td>${new Date().toLocaleDateString('en-CA')}</td></tr>
                    </table>
                </div>`;
        }
alert(reportHtml);
        // Section 2: Summary
        if (options.summary) {
            const startDate = new Date(project.agreementDate || siteData.startDate || Date.now());
            const totalDuration = (project.constructionDuration || 12) * 30; // in days
            const elapsedDays = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
            const timeElapsedPercent = Math.min(100, (elapsedDays / totalDuration) * 100).toFixed(1);

            reportHtml += `<div style="page-break-inside: avoid; margin-top: 20px;">
                <h2>Project Summary</h2>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div><strong>Start Date:</strong> ${startDate.toLocaleDateString('en-CA')}</div>
                    <div><strong>Total Duration:</strong> ${project.constructionDuration || 'N/A'} months</div>
                    <div><strong>Time Elapsed:</strong> ${elapsedDays} days (${timeElapsedPercent}%)</div>
                    <div><strong>Work Done (from BOQ):</strong> ${siteData.progress || 0}%</div>
                </div>
            </div>`;
        }
        alert(reportHtml);
        // Section 3: Schedule
        if (options.schedule) {
            reportHtml += `<div style="margin-top: 20px;"><h2>Schedule Overview</h2>`;
            if (schedule && schedule.length > 0) {
                reportHtml += ReportingModule.generateSimpleListReport('', schedule,
                    ['Task', 'Start', 'End', 'Duration (Days)'],
                    (task) => `<tr>
                        <td>${task.name}</td>
                        <td>${task.start}</td>
                        <td>${task.end}</td>
                        <td style="text-align:center;">${task.duration}</td>
                    </tr>`
                );
            } else {
                reportHtml += `<p>No schedule data available.</p>`;
            }
            reportHtml += `</div>`;
        }
alert(reportHtml);
        // Section 4: Look Ahead
        if (options.lookAhead && siteData.mom && siteData.mom.length > 0) {
            const latestMom = siteData.mom.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            if (latestMom.lookAhead) {
                reportHtml += `<div style="page-break-inside: avoid; margin-top: 20px;">
                    <h2>Look Ahead Program (from MoM of ${latestMom.date})</h2>
                    <p style="white-space: pre-wrap;">${latestMom.lookAhead}</p>
                </div>`;
            }
        }
        alert(reportHtml);
        // Section 5: Long Lead Items
        if (options.longLead) {
            const longLeadItems = LongLeadModule.getReportData(schedule, siteData.boq, siteData.longLeadLog);
            reportHtml += `<div style="margin-top: 20px;"><h2>Long Lead Items</h2>`;
            if (longLeadItems && longLeadItems.length > 0) {
                 reportHtml += ReportingModule.generateLongLeadReportHtml(longLeadItems).replace('<h1>Long Lead Items Report</h1>', '');
            } else {
                reportHtml += `<p>No long lead items tracked.</p>`;
            }
            reportHtml += `</div>`;
        }
        alert(reportHtml);
        // Section 6 & 7: RFI & Materials Summary
        if (options.rfi) {
             reportHtml += `<div style="margin-top: 20px;">${ReportingModule.generateRfiReportHtml(siteData.rfiLog || [])}</div>`;
        }
        alert(reportHtml);
        if (options.materials) {
             reportHtml += `<div style="margin-top: 20px;">${ReportingModule.generateMaterialsReportHtml(siteData.materialLog || [])}</div>`;
        }
alert(reportHtml);
        // Section 8: Photos
        if (options.photos) {
            const sitePhotos = await window.DB.getFiles(jobNo, 'site', 'photo');
            const recentPhotos = sitePhotos.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 6); // Get latest 6
            reportHtml += `<div style="margin-top: 20px; page-break-before: auto;"><h2>Recent Site Photos</h2>`;
            if (recentPhotos.length > 0) {
                reportHtml += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">`;
                recentPhotos.forEach(photo => {
                    reportHtml += `<div style="page-break-inside: avoid; border: 1px solid #eee; padding: 5px; text-align: center;">
                        <img src="${photo.dataUrl}" style="width: 100%; height: 200px; object-fit: cover;">
                        <p style="font-size: 0.8em; margin: 5px 0 0 0;">${photo.name}</p>
                    </div>`;
                });
                reportHtml += `</div>`;
            } else {
                reportHtml += `<p>No recent photos found.</p>`;
            }
            reportHtml += `</div>`;
        }
alert(reportHtml);
        return reportHtml;
    },
    generateSimpleListReport: (title, items, headers, rowGenerator) => {
        let tableBody = `<tr><td colspan="${headers.length}">No data available.</td></tr>`;
        if (items && items.length > 0) {
            tableBody = items.map(rowGenerator).join('');
        }
        return `
            <h1>${title}</h1>
           <table class="output-table" style="width: 100%;">
                <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                <tbody>${tableBody}</tbody>
            </table>`;
    },

    generateRfiReportHtml: (items) => {
        return ReportingModule.generateSimpleListReport('RFI Log Report', items,
            ['Ref No', 'Subject', 'Date', 'Status', 'Response'],
            (item) => `<tr>
                <td>${item.refNo || 'N/A'}</td>
                <td>${item.subject || 'N/A'}</td>
                <td>${item.date || 'N/A'}</td>
                <td>${item.status || 'N/A'}</td>
                <td>${item.response || 'N/A'}</td>
            </tr>`
        );
    },

    generateMaterialsReportHtml: (items) => {
        return ReportingModule.generateSimpleListReport('Material Submittal Report', items,
            ['Ref No', 'Item', 'Supplier', 'Date', 'Status'],
            (item) => `<tr>
                 <td>${item.ref || 'N/A'}</td>
                <td>${item.item || 'N/A'}</td>
                <td>${item.supplier || 'N/A'}</td>
                <td>${item.date || 'N/A'}</td>
                <td>${item.status || 'N/A'}</td>
            </tr>`
        );
    },
    
    generateMomReportHtml: (items) => {
        let content = '<h1>Minutes of Meeting Report</h1>';
        if (!items || items.length === 0) {
            content += '<p>No Meetings on Record.</p>';
            return content;
        }
        items.forEach(mom => {
            content += `
                <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 15px; page-break-inside: avoid;">
                    <h3>Ref: ${mom.ref || 'N/A'} (${mom.date || 'N/A'})</h3>
                    <p><strong>Summary:</strong> ${mom.summary || 'N/A'}</p>
                    <h4>Action Items</h4>
                     <table class="output-table" style="width: 100%;">
                         <thead><tr><th>Description</th><th>By</th><th>Due</th><th>Status</th></tr></thead>
                         <tbody>
                            ${(mom.actions && mom.actions.length > 0) ? mom.actions.map(a => `<tr><td>${a.desc}</td><td>${a.by}</td><td>${a.date}</td><td>${a.status}</td></tr>`).join('') : '<tr><td colspan="4">No action items.</td></tr>'}
                         </tbody>
                    </table>
                </div>
            `;
        });
        return content;
    },

    generateVendorManagementReportHtml: (items) => {
        return ReportingModule.generateSimpleListReport('Assigned Vendors Report', items,
            ['Category', 'Item', 'Manufacturer/Supplier'],
            (item) => `<tr>
               <td>${item.category || 'N/A'}</td>
                <td>${item.item || 'N/A'}</td>
                <td>${item.manufacturer || 'N/A'}</td>
            </tr>`
        );
    },
     generateBoqReportHtml: (items) => {
        return ReportingModule.generateSimpleListReport('BOQ Report', items,
            ['ID', 'Description', 'Unit', 'Qty', 'Rate', 'Amount', 'Total %', 'Work Done'],
            (item) => {
                const amount = (item.qty || 0) * (item.rate || 0);
                const totalPerc = (item.prev_perc || 0) + (item.curr_perc || 0);
                const workDone = amount * (totalPerc / 100);
                return `<tr>
                    <td>${item.id || 'N/A'}</td>
                    <td>${item.description || 'N/A'}</td>
                    <td>${item.unit || 'N/A'}</td>
                    <td style="text-align:right;">${item.qty || 0}</td>
                    <td style="text-align:right;">${(item.rate || 0).toFixed(2)}</td>
                    <td style="text-align:right;">${amount.toFixed(2)}</td>
                    <td style="text-align:center;">${totalPerc.toFixed(0)}%</td>
                    <td style="text-align:right;">${workDone.toFixed(2)}</td>
                </tr>`
            }
        );
    },

    generateLongLeadReportHtml: (items) => {
         return ReportingModule.generateSimpleListReport('Long Lead Items Report', items,
            ['Item', 'Procurement (Days)', 'Submittal', 'Approval', 'Delivery', 'Required On-Site'],
            (item) => {
                // This logic needs to be self-contained for the report
                const log = item.log || {};
                const procurementDays = log.procurementDays || 90;
                let procurementStart = 'N/A';
                if(item.requiredOnSite !== 'N/A') {
                    const requiredDate = new Date(item.requiredOnSite);
                    requiredDate.setDate(requiredDate.getDate() - procurementDays);
                    procurementStart = requiredDate.toISOString().split('T')[0];
                }
                return `<tr>
                    <td>${item.name || 'N/A'}</td>
                    <td style="text-align:center;">${procurementDays}</td>
                    <td>${log.submittalDate || ''}</td>
                    <td>${log.approvalDate || ''}</td>
                    <td>${log.deliveryDate || ''}</td>
                    <td>${item.requiredOnSite || 'N/A'}</td>
                </tr>`
            }
        );
    },

    generateNocReportHtml: (items) => {
         return ReportingModule.generateSimpleListReport('NOC & Permit Report', items,
            ['NOC/Permit', 'Authority', 'Submission Date', 'Status'],
            (item) => `<tr>
                 <td>${item.name || 'N/A'}</td>
                <td>${item.authority || 'N/A'}</td>
                <td>${item.submissionDate || 'N/A'}</td>
                <td>${item.status || 'N/A'}</td>
            </tr>`
        );
    },

    generateBulletinReportHtml: (items) => {
         return ReportingModule.generateSimpleListReport('Site Bulletin Report', items,
            ['Date', 'Author', 'Subject', 'Details', 'Assigned To'],
            (item) => `<tr>
                <td>${item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'N/A'}</td>
                <td>${item.author || 'N/A'}</td>
                <td>${item.subject || 'N/A'}</td>
                <td>${item.details || 'N/A'}</td>
                <td>${item.assignedTo || 'N/A'}</td>
            </tr>`
        );
        },

    // --- NEW: Report Generators for Added Modules ---

    generateSnagListReportHtml: (items) => {
        return ReportingModule.generateSimpleListReport('Snag List Report', items,
            ['Item', 'Date Spotted', 'Description', 'Status', 'Resolved By'],
            (item) => `<tr>
                <td>${item.item || 'N/A'}</td>
                <td>${item.dateSpotted || 'N/A'}</td>
                <td>${item.description || 'N/A'}</td>
                <td>${item.status || 'Open'}</td>
                <td>${item.byEng || 'N/A'}</td>
            </tr>`
        );
    },

    generatePaymentReportHtml: (masterInvoices, sitePayments) => {
        let content = '<h1>Payment Report</h1>';
        content += '<h2>Master Invoice Summary</h2>';
        content += ReportingModule.generateSimpleListReport('', masterInvoices,
            ['Invoice #', 'Date', 'Amount', 'Status'],
            (item) => `<tr>
                <td>${item.no}</td>
                <td>${item.date}</td>
                <td style="text-align:right;">${(item.total || 0).toFixed(2)} AED</td>
                <td>${item.status}</td>
            </tr>`
        );
        content += '<h2 style="margin-top: 20px;">Site Payments Log</h2>';
        content += ReportingModule.generateSimpleListReport('', sitePayments,
            ['Description', 'To', 'Amount', 'Date', 'Ref #'],
            (item) => `<tr>
               <td>${item.description}</td>
                <td>${item.toWhom}</td>
                <td style="text-align:right;">${(item.amount || 0).toFixed(2)} AED</td>
                <td>${item.date}</td>
                <td>${item.refNo}</td>
            </tr>`
        );
        return content;
    },

    generateInventoryReportHtml: (items) => {
        return ReportingModule.generateSimpleListReport('Inventory & Warranty Report', items,
            ['Item', 'Type', 'Supplier', 'Warranty Start', 'Warranty End'],
            (item) => `<tr>
                 <td>${item.item || 'N/A'}</td>
                <td>${item.type || 'N/A'}</td>
                <td>${item.supplier || 'N/A'}</td>
                <td>${item.dateStart || 'N/A'}</td>
                <td>${item.dateEnd || 'N/A'}</td>
            </tr>`
        );
    },

    generateBudgetReportHtml: (html) => {
        let content = '<h1>Budget Summary</h1>';
        if (!html || html.trim() === '') {
            content += '<p>No budget data available to report.</p>';
        } else {
             content += html.replace(/id="[^"]*"/g, ''); // Remove IDs to avoid conflicts
        }
        return content;
    }
    
    
};
  