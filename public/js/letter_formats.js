// ===================================================================================
//
//  MODULE: LETTER FORMATS
//
//  DESCRIPTION:
//  This module provides standardized HTML templates for both HR and Project letters.
//
// ===================================================================================

const formatDateForTemplates = (dateValue = new Date()) => {
    return new Date(dateValue).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatCurrencyForTemplates = (num) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(num || 0);

// Helper function for letterhead image, used in multiple templates
const getLetterheadHeaderHtml = () => `<div class="preview-header-image"><img src="${LOGO_BASE64}" alt="Company Letterhead"></div>`;


/**
 * @const {Object} HR_LETTER_TEMPLATES
 * Templates for Human Resources related letters.
 */
const HR_LETTER_TEMPLATES = {
    appreciation: ({ staff, details }) => `
        <p>Date: ${formatDateForTemplates()}</p><br><br>
        <p>To,</p><p><b>${staff.name}</b></p><p>${staff.role}</p><br>
        <h3 style="text-align:center; text-decoration: underline;">Letter of Appreciation</h3><br>
        <p>Dear ${staff.name.split(' ')[0]},</p>
        <p>We are writing to formally express our sincere appreciation for your outstanding contribution regarding ${details.reason || 'your recent work'}. Your dedication and hard work have been invaluable.</p>
        <p>We are proud to have you as a member of our team.</p><br>
        <p>Sincerely,</p><br><br><p><b>Management</b></p>`,

    warning: ({ staff, details }) => `
        <p>Date: ${formatDateForTemplates()}</p><br><br>
        <p>To,</p><p><b>${staff.name}</b></p><p>${staff.role}</p><br>
        <h3 style="text-align:center; text-decoration: underline;">Warning Letter</h3><br>
        <p>Dear ${staff.name.split(' ')[0]},</p>
        <p>This letter serves as a formal warning regarding: ${details.reason || 'a breach of company policy'}.</p>
        <p>We expect immediate improvement in this area. Failure to comply with company standards may result in further disciplinary action.</p><br>
        <p>Sincerely,</p><br><br><p><b>Management</b></p>`,

    termination: ({ staff, details }) => `
        <p>Date: ${formatDateForTemplates()}</p><br><br>
        <p>To,</p><p><b>${staff.name}</b></p><p>${staff.role}</p><br>
        <h3 style="text-align:center; text-decoration: underline;">Letter of Termination</h3><br>
        <p>Dear ${staff.name.split(' ')[0]},</p>
        <p>This letter confirms the termination of your employment with Urban Axis, effective ${details.lastDay ? formatDateForTemplates(details.lastDay) : 'immediately'}.</p>
        <p>This decision is based on ${details.reason || 'company restructuring'}. We wish you the best in your future endeavors.</p><br>
        <p>Sincerely,</p><br><br><p><b>Management</b></p>`,

    salary_certificate: ({ staff }) => {
        const grossSalary = staff.grossSalary || 0;
        const basic = grossSalary * 0.6;
        const allowance = grossSalary * 0.4;

        return `
            ${getLetterheadHeaderHtml()}
            <p style="text-align:right;">Date: ${formatDateForTemplates()}</p><br><br>
            <h3 style="text-align:center; text-decoration: underline;">TO WHOM IT MAY CONCERN</h3><br><br>
            <h4 style="text-align:center; text-decoration: underline;">SALARY CERTIFICATE</h4><br><br>
            <p>This is to certify that <b>Mr. / Ms. ${staff.name}</b>, holder of Passport No. <b>${staff.passportNo || '[Passport No. Missing]'}</b>, has been employed with IMMERSIVE ENGINEERING CONSULTANTS L.L.C since ${formatDateForTemplates(staff.joinDate)}.</p>
            <p>Currently, he/she is designated as <b>${staff.role}</b> and his/her monthly salary is as follows:</p>
            <br>
            <table style="width: 60%; margin-left: 5%; border-collapse: collapse;" border="0">
                <tr><td style="padding: 5px; width: 25%;">Basic Salary</td><td style="padding: 5px;">: ${formatCurrencyForTemplates(basic)}</td></tr>
                <tr><td style="padding: 5px;">Allowances</td><td style="padding: 5px;">: ${formatCurrencyForTemplates(allowance)}</td></tr>
                <tr><td style="padding: 5px; border-top: 1px solid #000;"><b>Total Salary</b></td><td style="padding: 5px; border-top: 1px solid #000;"><b>: ${formatCurrencyForTemplates(grossSalary)}</b></td></tr>
            </table>
            <br>
            <p>This certificate is issued upon the request of the employee for whatever legal purpose it may serve.</p>
            <br><br><p>Sincerely,</p><br><br><p><b>Management</b></p>
        `;
    },
    // MODIFICATION START: Add new Experience Certificate template
    experience_certificate: ({ staff, details }) => {
        const lastDay = details.lastDay ? formatDateForTemplates(details.lastDay) : '[Last Day of Employment]';
        const conductRemark = details.conduct || 'His/her conduct during the tenure was satisfactory.';

        return `
            ${getLetterheadHeaderHtml()}
            <p style="text-align:right;">Date: ${formatDateForTemplates()}</p><br><br>
            <h3 style="text-align:center; text-decoration: underline;">TO WHOM IT MAY CONCERN</h3><br><br>
            <h4 style="text-align:center; text-decoration: underline;">EXPERIENCE CERTIFICATE</h4><br><br>
            <p>This is to certify that <b>Mr. / Ms. ${staff.name}</b> was employed with IMMERSIVE ENGINEERING CONSULTANTS L.L.C from ${formatDateForTemplates(staff.joinDate)} to ${lastDay}.</p>
            <p>During his/her employment with us, he/she was designated as <b>${staff.role}</b>.</p>
            <br>
            <p>${conductRemark}</p>
            <br>
            <p>We wish him/her all the best in his/her future endeavors.</p>
            <br><br><p>Sincerely,</p><br><br><p><b>Management</b></p>
        `;
    },
    // MODIFICATION END
    notice: ({ details }) => `
        <p>Date: ${formatDateForTemplates()}</p><br><br>
        <h3 style="text-align:center; text-decoration: underline;">NOTICE</h3><br>
        <p><b>Subject: ${details.subject || 'Important Announcement'}</b></p><br>
        <p>${(details.body || '').replace(/\n/g, '<br>')}</p><br>
        <p>Thank you for your attention to this matter.</p><br><br>
        <p><b>Management</b></p>`,

    authority: ({ staff, details }) => `
        <p>Date: ${formatDateForTemplates()}</p><br><br>
        <h3 style="text-align:center; text-decoration: underline;">TO WHOM IT MAY CONCERN</h3><br><br>
        <p>This letter is to authorize the bearer, <b>Mr. / Ms. ${staff.name}</b>, holding Emirates ID No. <b>${staff.emiratesId || '[EID Missing]'}</b>, to represent IMMERSIVE ENGINEERING CONSULTANTS L.L.C for the purpose of ${details.reason || 'official business'}.</p>
        <p>Any assistance extended to him/her in this regard would be highly appreciated.</p><br>
        <p>Sincerely,</p><br><br><p><b>Management</b></p>`,
    payslip: ({ staff, monthYear, grossSalary, basicSalary, allowances, totalEarnings, loansDeducted, otherDeductions, totalDeductions, netPay, formatCurrency }) => `
    ${getLetterheadHeaderHtml()}
    <div style="padding: 0 10mm;">
        <p style="text-align:right;">Date: ${formatDateForTemplates()}</p><br>
        <h3 style="text-align:center; text-decoration: underline;">PAYSLIP FOR THE MONTH OF ${monthYear.toUpperCase()}</h3><br>
        <table style="width: 100%; border-collapse: collapse; font-size: 11pt;" border="0">
            <tr>
                <td style="padding: 4px; width: 15%;"><b>Employee Name</b></td>
                <td style="padding: 4px; width: 35%;">: ${staff.name}</td>
                <td style="padding: 4px; width: 15%;"><b>Designation</b></td>
                <td style="padding: 4px; width: 35%;">: ${staff.role}</td>
            </tr>
            <tr>
                <td style="padding: 4px;"><b>Employee ID</b></td>
                <td style="padding: 4px;">: UA-${String(staff.id).padStart(3, '0')}</td>
                <td style="padding: 4px;"><b>Join Date</b></td>
                <td style="padding: 4px;">: ${formatDateForTemplates(staff.joinDate)}</td>
            </tr>
        </table>
        <br>
        <table style="width: 100%; border-collapse: collapse; font-size: 11pt;" border="1">
            <thead>
                <tr style="background-color: #f2f2f2;">
                    <th style="padding: 8px; text-align: left; width: 50%;">Earnings</th>
                    <th style="padding: 8px; text-align: left; width: 50%;">Deductions</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="vertical-align: top; padding: 0;">
                        <table style="width: 100%; border-collapse: collapse;" border="0">
                            <tr>
                                <td style="padding: 6px; width: 60%;">Basic Salary</td>
                                <td style="padding: 6px; text-align: right;">${formatCurrency(basicSalary)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px;">Allowances</td>
                                <td style="padding: 6px; text-align: right;">${formatCurrency(allowances)}</td>
                            </tr>
                        </table>
                    </td>
                    <td style="vertical-align: top; padding: 0;">
                         <table style="width: 100%; border-collapse: collapse;" border="0">
                            <tr>
                                <td style="padding: 6px; width: 60%;">Staff Loan</td>
                                <td style="padding: 6px; text-align: right;">${formatCurrency(loansDeducted)}</td>
                            </tr>
                             <tr>
                                <td style="padding: 6px;">Other Deductions</td>
                                <td style="padding: 6px; text-align: right;">${formatCurrency(otherDeductions)}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </tbody>
            <tfoot>
                <tr style="background-color: #f2f2f2; font-weight: bold;">
                    <td style="padding: 8px;">
                           <div style="display: flex; justify-content: space-between;">
                            <span>Total Earnings</span>
                            <span>${formatCurrency(totalEarnings)}</span>
                        </div>
                    </td>
                    <td style="padding: 8px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Total Deductions</span>
                            <span>${formatCurrency(totalDeductions)}</span>
                        </div>
                    </td>
                </tr>
                 <tr style="background-color: #e0e0e0; font-weight: bold; font-size: 12pt;">
                    <td colspan="2" style="padding: 10px;">
                       <div style="display: flex; justify-content: space-between;">
                             <span>Net Salary Payable</span>
                             <span>${formatCurrency(netPay)}</span>
                        </div>
                    </td>
                </tr>
            </tfoot>
        </table>
        <br>
        <p style="font-size: 10pt;"><i>This is a computer-generated document and does not require a signature.</i></p>
    </div>
`
};

/**
 * @const {Object} PROJECT_LETTER_TEMPLATES
 * Templates for Project related letters to authorities.
 */
const PROJECT_LETTER_TEMPLATES = {
    // --- MODIFICATION START ---
    scopeOfWork: ({ projectData, details }) => {
        const authority = CONTENT.AUTHORITY_DETAILS[details.authority] || { name: 'M/s [Authority Name]', address: 'Planning Department<br>Dubai, U.A.E.' };
        const scopeItemsHtml = (details.scopeItems || []).map((item) => `<li>${item}</li>`).join('');

        return `
            ${getLetterheadHeaderHtml()}
            <div style="padding: 0 10mm; font-family: 'Times New Roman', Times, serif;">
                <p style="text-align:right;">Date: ${formatDateForTemplates()}</p><br>
                <p><b>${authority.name}</b><br>${authority.address}</p><br>
                <p><b>Attention :</b> Head of the Planning Department</p><br>
                <p style="margin-bottom: 2px;"><b>Project:</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${projectData.projectDescription} on plot no. ${projectData.plotNo} @ ${projectData.area}</p>
                <p><b>Subject:</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Scope of works for existing and proposed.</p><br>
                <p>Dear Sir,</p>
                <p>With reference to the above mentioned project we would like to submit our scope of work for existing and proposed.</p><br>
                <p style="text-decoration: underline; color: #a52a2a; font-weight: bold;">Proposed scope of works for extension of villa</p>
                <ul style="padding-left: 40px; list-style-type: none;">
                    ${(details.scopeItems || ['painting', 'tiling removal', 'tiling refixing', 'landscaping']).map(item => `<li style="margin-bottom: 5px;">${item}</li>`).join('')}
                </ul><br>
                <p>This is for your information and records.</p>
                <p>Yoursfaithfully ,</p><br><br><br>
                <p><b>For IMMERSIVE ENGINEERING CONSULTANTS L.L.C</b></p>
            </div>
        `;
    },
    // --- MODIFICATION END ---
    consultantAppointment: ({ projectData, details }) => {
        const authority = CONTENT.AUTHORITY_DETAILS[details.authority] || { name: 'M/s [Authority Name]', address: 'Planning Department<br>Dubai, U.A.E.' };
        return `
            ${getLetterheadHeaderHtml()}
             <div style="padding: 0 10mm; font-family: 'Times New Roman', Times, serif;">
                <p style="text-align:right;">Date: ${formatDateForTemplates()}</p><br>
                <p><b>${authority.name}</b><br>${authority.address}</p><br>
                <p><b>Attention :</b> Head of the Planning Department</p><br>
                <p style="margin-bottom: 2px;"><b>Project:</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${projectData.projectDescription} on plot no. ${projectData.plotNo} @ ${projectData.area}</p>
                <p style="margin-bottom: 2px;"><b>Subject:</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Consultant appointment letter.</p>
                <p><b>Plot number:</b> ${projectData.plotNo}, DUBAI- UAE</p><br>
                <p>Dear Sir,</p>
                <p>With reference to the above mentioned project we would like to bring to your kind attention that we have appointed <b>Urban Axis Architectural and Consulting Engineers</b> as the main consultant to do the designs / drawings submissions to Authorities and obtain all essential NOC to satisfy the concerned regulations.</p>
                <p>Henceforth, Urban Axis will be coordinating with yourself for drawings submissions/approvals etc.</p><br>
                <p>Yoursfaithfully ,</p><br><br><br>
                <p><b>${projectData.clientName || 'Client Name'}</b></p>
            </div>
        `;
    },
    taxInvoice: ({ projectData, invoiceData }) => {
        const subtotal = invoiceData.amount || 0;
        const vatRate = 0.05;
        const vatAmount = subtotal * vatRate;
        const total = subtotal + vatAmount;

        return `
            ${getLetterheadHeaderHtml()}
            <div style="padding: 0 10mm; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <h2 style="text-align:center; color: #333;">TAX INVOICE / فاتورة ضريبية</h2>
                <hr>
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <div>
                        <p><b>Invoice To:</b><br>${projectData.clientName}<br>Project: ${projectData.projectDescription}<br>Plot: ${projectData.plotNo}</p>
                    </div>
                    <div style="text-align: right;">
                        <p><b>Invoice No:</b> ${invoiceData.no}<br><b>Date:</b> ${formatDateForTemplates(invoiceData.date)}<br><b>TRN:</b> 100XXXXXXXXXXXX</p>
                    </div>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;" border="1">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 10px; text-align: left;">Description / الوصف</th>
                            <th style="padding: 10px; text-align: right;">Amount / المبلغ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 15px; height: 100px; vertical-align: top;">${invoiceData.description || 'Professional Design Services'}</td>
                            <td style="padding: 15px; text-align: right; vertical-align: top;">${formatCurrencyForTemplates(subtotal)}</td>
                        </tr>
                    </tbody>
                </table>
                <div style="display: flex; justify-content: flex-end;">
                    <table style="width: 40%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px;">Subtotal / المجموع الفرعي</td>
                            <td style="padding: 5px; text-align: right;">${formatCurrencyForTemplates(subtotal)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px;">VAT (5%) / ضريبة القيمة المضافة</td>
                            <td style="padding: 5px; text-align: right;">${formatCurrencyForTemplates(vatAmount)}</td>
                        </tr>
                        <tr style="background-color: #eee; font-weight: bold;">
                            <td style="padding: 8px;">Total / الإجمالي</td>
                            <td style="padding: 8px; text-align: right;">${formatCurrencyForTemplates(total)}</td>
                        </tr>
                    </table>
                </div>
                <br><br>
                <div style="margin-top: 50px;">
                    <p><b>Payment Terms:</b> Payable within 14 days.<br><b>Bank Details:</b> [Bank Name], [Account Number], [IBAN]</p>
                </div>
                <div style="text-align: center; margin-top: 30px; font-size: 0.8em; color: #666;">
                    <p>This is a computer-generated tax invoice.</p>
                </div>
            </div>
        `;
    }
};