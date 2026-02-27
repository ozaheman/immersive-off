
document.addEventListener('DOMContentLoaded', async () => {
    // This is the new entry point logic.
    // It checks if the login system is part of the page.
    if (document.getElementById('login-modal-overlay')) {
        // If the login modal exists, wait for the 'appAuthenticated' event after a successful login.
        console.log("Login system detected. Waiting for authentication...");
        document.addEventListener('appAuthenticated', main);
    } else {
        // If no login modal, it's the direct-access page (or handled by server), so start the app immediately.
        console.log("Direct access mode: Starting HR Management.");
        main();
    }
});

// --- Globals ---
const DOMElements = {};
let staffList = [];
let officeExpenses = [];
// MODIFICATION: Add new data arrays
let referralAccounts = [];
let otherAccounts = [];
let assetList = []; // MODIFICATION: New global for assets
let projectList = []; // MODIFICATION: New global for projects
let expenseChart = null;
let currentEditingStaffId = null;

// --- Formatters ---
const formatCurrency = (num) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(num || 0);
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
const toCamelCase = (str) => str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

// --- Helpers ---
const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });

};

// --- Initialization ---
async function main() {
    try {
        // DB.init() may have already been called, but calling it again is safe.
        await DB.init();
        cacheDOMElements();
        setupEventListeners();
        await loadDataFromDB();
        populateSelects();
        renderAllComponents();
        await renderEfficiencyReport();
        // MODIFICATION: Render the default active tab on load
        renderInvoicesTab();
    } catch (error) {
        console.error("Error initializing HR module:", error);
        if (error instanceof TypeError && error.message.includes("addEventListener")) {
            alert("A required HTML element could not be found. Please check element IDs in hr_management.html and the cacheDOMElements function. Details in console.");
        } else {
            alert("Could not load HR & Office Management module. Check console for details.");
        }
    }
}

async function loadDataFromDB() {
    staffList = await DB.getAllHRData() || [];
    officeExpenses = await DB.getOfficeExpenses() || [];
    // MODIFICATION: Load new account data
    referralAccounts = await DB.getAllReferralAccounts?.() || []; // Use optional chaining in case DB is not updated
    otherAccounts = await DB.getAllOtherAccounts?.() || [];

    // MODIFICATION: Load new data
    assetList = await DB.getAllAssets?.() || [];
    projectList = await DB.getAllProjects?.() || [];

    if (staffList.length === 0) {
        console.log("HR_DATA store is empty. Seeding initial staff data...");
        const initialStaff = [
            { name: 'Faisal M.', role: 'Architect', joinDate: '2022-01-15', grossSalary: 13000, leaveBalance: 30, increments: [], leaves: [], photoUrl: null, email: 'faisal@urbanaxis.ae', dob: '1985-05-20', emiratesId: '784-1234-567890-1', address: 'Dubai, UAE', phoneNo: '050-1234567', passportCopyUrl: null, licenseExpiry: null, healthCardExpiry: null, soeExpiry: '2026-01-01', visaExpiry: '2026-02-15', loans: [] },
            { name: 'Adnan K.', role: 'Architect', joinDate: '2022-02-01', grossSalary: 13000, leaveBalance: 30, increments: [], leaves: [], photoUrl: null, email: 'adnan@urbanaxis.ae', dob: '1988-11-10', emiratesId: '784-2345-678901-2', address: 'Sharjah, UAE', phoneNo: '050-2345678', passportCopyUrl: null, licenseExpiry: '2025-10-15', healthCardExpiry: '2025-10-20', soeExpiry: null, visaExpiry: '2025-09-01', loans: [] }
        ];
        for (const staff of initialStaff) {
            await DB.addHRData(staff);
        }
        staffList = await DB.getAllHRData();
    }
}

function cacheDOMElements() {
    const ids = [
        'tabs', 'staff-list-body', 'offer-letter-preview', 'candidate-name', 'candidate-role', 'offered-salary', 'join-date',
        'generate-offer-btn', 'leave-staff-select', 'leave-start-date', 'leave-end-date', 'leave-type', 'add-leave-btn', 'leave-log-body',
        'expense-filter-container', 'expense-log-body', 'add-expense-btn', 'expense-date', 'expense-category', 'expense-description', 'expense-amount',
        'increment-staff-select', 'increment-amount', 'increment-date', 'add-increment-btn', 'increment-log-body',
        'expense-chart', 'reminder-list', 'staff-details-modal', 'staff-details-modal-close-btn', 'staff-modal-title', 'staff-modal-body',
        'staff-photo-preview', 'staff-photo-upload', 'staff-passport-upload', 'staff-passport-link',
        'modal-staff-name', 'modal-staff-role', 'modal-staff-phone', 'modal-staff-eid', 'modal-staff-address', 'modal-staff-join-date', 'modal-staff-salary',
        'modal-license-expiry', 'modal-health-expiry', 'modal-loan-amount', 'modal-loan-date', 'modal-loan-description',
        'add-loan-btn', 'modal-loan-history', 'save-staff-details-btn', 'add-staff-btn', 'delete-staff-btn',
        'modal-staff-email', 'modal-staff-dob', 'modal-visa-expiry', 'modal-soe-expiry', 'modal-basic-salary',
        'annual-expense-item', 'annual-expense-amount', 'annual-expense-due-date', 'add-annual-expense-btn', 'annual-expense-body',
        'efficiency-report-body',
        // MODIFICATION: New element IDs
        'vat-report-body', 'ref-name', 'ref-contact', 'ref-phone', 'ref-email', 'ref-notes', 'add-referral-btn', 'referral-accounts-body',
        'other-name', 'other-contact', 'other-phone', 'other-email', 'other-notes', 'add-other-account-btn', 'other-accounts-body',
        // MODIFICATION: Add app-container to the main list
        'app-container',
        // MODIFICATION: Cache new Payroll elements
        'payroll-staff-select', 'payroll-month-select', 'payroll-year-select', 'generate-payslip-btn',
        'payslip-preview', 'download-payslip-pdf-btn', 'payroll-summary-body', 'summary-month-display',
        'download-offer-pdf-btn',
        // MODIFICATION: New element IDs
        'asset-project-no', 'asset-price', 'asset-date', 'asset-warranty-expiry', 'asset-note1', 'asset-note2',
        'add-asset-btn', 'asset-list-body', 'export-xml-btn', 'export-zip-btn', 'download-wps-sif-btn',
        'letter-sub-tabs', 'compose-letter-sub-tab', 'draft-letters-sub-tab', 'sent-letters-sub-tab', 'letter-templates-sub-tab',
        'draft-count', 'sent-count', 'letter-recipient-name', 'letter-recipient-designation', 'letter-recipient-company',
        'letter-recipient-address', 'letter-subject-input', 'letter-content-body', 'save-letter-draft-btn', 'preview-letter-btn',
        'download-letter-pdf-v2-btn', 'mark-as-sent-btn', 'send-whatsapp-btn', 'send-email-btn', 'send-outlook-btn',
        'info-letter-type', 'info-letter-template', 'info-letter-status', 'info-word-count', 'drafts-list-body',
        'sent-list-body', 'templates-catalog', 'letter-type-select', 'letter-template-select', 'load-template-btn', 'letter-preview-modal',
        'close-letter-preview-btn', 'letter-management-preview-area', 'download-preview-pdf-btn'
    ];

    DOMElements.letterRecipientName = document.getElementById('letter-recipient-name');
    DOMElements.recipientHistoryList = document.getElementById('recipient-history-list');

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            DOMElements[toCamelCase(id)] = el;
        } else {
            // console.warn(`Element with ID '${id}' not found.`);
        }
    });

    const tabsEl = document.getElementById('tabs');
    if (tabsEl) DOMElements.tabsContainer = tabsEl;
    //if (el) DOMElements[toCamelCase(id)] = el;
    //   else console.warn(`Element with ID '${id}' not found.`);


}

function setupEventListeners() {

    // MODIFICATION: Add Payroll event listeners
    DOMElements.generatePayslipBtn?.addEventListener('click', handleGeneratePayslip);
    DOMElements.downloadPayslipPdfBtn?.addEventListener('click', handleDownloadPayslip);
    DOMElements.payrollMonthSelect?.addEventListener('change', renderPayrollSummary);
    DOMElements.payrollYearSelect?.addEventListener('change', renderPayrollSummary);
    DOMElements.downloadWpsSifBtn?.addEventListener('click', handleDownloadWPS);
    DOMElements.tabsContainer?.addEventListener('click', handleTabSwitch);
    DOMElements.generateOfferBtn?.addEventListener('click', renderOfferLetterPreview);
    DOMElements.addLeaveBtn?.addEventListener('click', handleAddLeave);
    DOMElements.addExpenseBtn?.addEventListener('click', handleAddExpense);
    DOMElements.downloadOfferPdfBtn = document.getElementById('download-offer-pdf-btn');
    DOMElements.downloadOfferPdfBtn?.addEventListener('click', downloadOfferLetterPdf);
    DOMElements.addAnnualExpenseBtn?.addEventListener('click', handleAddAnnualExpense);
    DOMElements.addIncrementBtn?.addEventListener('click', handleAddIncrement);
    DOMElements.expenseFilterContainer?.addEventListener('click', handleExpenseFilter);

    DOMElements.addStaffBtn?.addEventListener('click', () => showStaffDetailsModal(null));
    DOMElements.staffDetailsModalCloseBtn?.addEventListener('click', () => DOMElements.staffDetailsModal.style.display = 'none');
    DOMElements.staffListBody?.addEventListener('click', (e) => {
        if (e.target.matches('.details-btn')) {
            const staffId = parseInt(e.target.dataset.id);
            showStaffDetailsModal(staffId);
        }
    });

    DOMElements.letterRecipientName?.addEventListener('input', handleRecipientInput);
    DOMElements.saveStaffDetailsBtn?.addEventListener('click', handleStaffDetailsSave);
    DOMElements.deleteStaffBtn?.addEventListener('click', handleDeleteStaff);
    DOMElements.addLoanBtn?.addEventListener('click', handleAddLoan);
    DOMElements.modalLoanHistory?.addEventListener('click', handleLoanActions);
    DOMElements.modalStaffSalary?.addEventListener('input', (e) => {
        const gross = parseFloat(e.target.value) || 0;
        if (DOMElements.modalBasicSalary) DOMElements.modalBasicSalary.textContent = `Basic: ${formatCurrency(gross * 0.60)}`;
    });
    // MODIFICATION: Event listeners for new features
    DOMElements.addReferralBtn?.addEventListener('click', handleAddReferralAccount);
    DOMElements.addOtherAccountBtn?.addEventListener('click', handleAddOtherAccount);
    // MODIFICATION: New event listeners
    DOMElements.addAssetBtn?.addEventListener('click', handleAddAsset);
    DOMElements.exportXmlBtn?.addEventListener('click', handleExportXML);
    DOMElements.exportZipBtn?.addEventListener('click', handleExportZIP);
    if (DOMElements.appContainer) {
        DOMElements.appContainer.addEventListener('click', handleTableActions);
        DOMElements.appContainer.addEventListener('change', handleFileImport);
        DOMElements.appContainer.addEventListener('input', handleSearch);
    }

    DOMElements.letterSubTabs?.addEventListener('click', handleLetterSubTabSwitch);
    DOMElements.saveLetterDraftBtn?.addEventListener('click', handleSaveLetterDraft);
    DOMElements.previewLetterBtn?.addEventListener('click', handlePreviewLetterV2);
    DOMElements.downloadLetterPdfV2Btn?.addEventListener('click', () => handlePreviewLetterV2(true));
    DOMElements.markAsSentBtn?.addEventListener('click', () => handleMarkAsSent('Manual'));
    DOMElements.sendWhatsappBtn?.addEventListener('click', () => handleMarkAsSent('WhatsApp'));
    DOMElements.sendEmailBtn?.addEventListener('click', () => handleMarkAsSent('Email'));
    DOMElements.sendOutlookBtn?.addEventListener('click', () => handleMarkAsSent('Outlook'));
    DOMElements.loadTemplateBtn?.addEventListener('click', handleLoadTemplate);
    DOMElements.closeLetterPreviewBtn?.addEventListener('click', () => DOMElements.letterPreviewModal.style.display = 'none');
    DOMElements.downloadPreviewPdfBtn?.addEventListener('click', () => handlePreviewLetterV2(true));
    DOMElements.letterContentBody?.addEventListener('input', updateWordCount);

    const today = new Date().toISOString().split('T')[0];
    ['joinDate', 'leaveStartDate', 'leaveEndDate', 'expenseDate', 'incrementDate', 'modalLoanDate', 'modalStaffJoinDate', 'annualExpenseDueDate', 'assetDate'].forEach(id => {
        if (DOMElements[id]) DOMElements[id].value = today;
    });

    // Invoice Filter Listeners
    if (document.getElementById('invoices-tab')) {
        ['inv-search', 'inv-sort-by', 'inv-filter-type', 'inv-date-start', 'inv-date-end', 'inv-min-amount', 'inv-max-amount', 'inv-fee-percent', 'inv-filter-referral'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', renderInvoicesTab);
        });
        document.getElementById('inv-reset-btn')?.addEventListener('click', () => {
            ['inv-search', 'inv-filter-type', 'inv-date-start', 'inv-date-end', 'inv-min-amount', 'inv-max-amount', 'inv-fee-percent'].forEach(id => document.getElementById(id).value = '');
            document.getElementById('inv-filter-referral').checked = false;
            document.getElementById('inv-sort-by').value = 'date-desc';
            renderInvoicesTab();
        });
    }
}
// MODIFICATION START: Universal Search Handler
function handleSearch(e) {
    if (!e.target.matches('.table-search-input')) return;

    const query = e.target.value.toLowerCase().trim();
    const tableSelector = e.target.dataset.tableSelector;
    const table = document.querySelector(tableSelector);

    if (!table) {
        console.error(`Search failed: Table with selector "${tableSelector}" not found.`);
        return;
    }

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        // Ignore special rows like totals from being hidden
        if (row.classList.contains('total-row') || row.classList.contains('no-search')) {
            return;
        }

        const rowText = row.textContent.toLowerCase();
        const isVisible = rowText.includes(query);
        row.style.display = isVisible ? '' : 'none';
    });
}

//const today = new Date().toISOString().split('T')[0];
//['joinDate', 'leaveStartDate', 'leaveEndDate', 'expenseDate', 'incrementDate', 'modalLoanDate', 'modalStaffJoinDate', 'annualExpenseDueDate'].forEach(id => {
//  if (DOMElements[id]) DOMElements[id].value = today;
// });


async function refreshDataAndRender() {
    await loadDataFromDB();
    populateSelects();
    renderAllComponents();
}

function renderAllComponents() {
    renderStaffList();
    renderReminders();
    renderLeaveLog();
    renderExpenseLog(1); // Default to last 1 month on load
    renderAnnualExpenseList();
    renderIncrementLog();
    // MODIFICATION: Render new components
    renderVatReport();
    renderReferralAccounts();
    renderOtherAccounts();
    // MODIFICATION: Render Payroll Tab on initial load
    renderPayrollTab();
    renderAssetList(); // MODIFICATION: Call new render function
}

function handleTabSwitch(e) {
    if (!e.target.matches('.tab-button')) return;
    DOMElements.tabsContainer.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const tabContent = document.getElementById(`${e.target.dataset.tab}-tab`);
    if (tabContent) tabContent.classList.add('active');

    // MODIFICATION: Refresh payroll summary when switching to the tab
    const tabId = e.target.dataset.tab;
    if (tabId === 'payroll') {
        renderPayrollSummary();
    } else if (tabId === 'letter-management') {
        renderLetterManagementTab();
    } else if (tabId === 'vat-report') {
        // ...Existing VAT report logic...
    } else if (tabId === 'vat-report') {
        // ...Existing VAT report logic...
        renderVatReport();
    } else if (tabId === 'invoices') {
        renderInvoicesTab();
    }
}
function populateSelects() {
    ['leaveStaffSelect', 'incrementStaffSelect', 'letterStaffSelect', 'payrollStaffSelect'].forEach(id => {
        if (DOMElements[id]) {
            const select = DOMElements[id];
            select.innerHTML = '<option value="">-- Select Staff --</option>';
            staffList.sort((a, b) => a.name.localeCompare(b.name)).forEach(staff => select.add(new Option(`${staff.name} (${staff.role})`, staff.id)));
        }
    });
    // MODIFICATION: Populate project selects
    ['refProjectNo', 'otherProjectNo', 'assetProjectNo'].forEach(id => {
        if (DOMElements[id]) {
            const select = DOMElements[id];
            select.innerHTML = '<option value="">-- No Associated Project --</option>';
            projectList.sort((a, b) => a.jobNo.localeCompare(b.jobNo)).forEach(proj => select.add(new Option(`${proj.jobNo} - ${proj.projectDescription}`, proj.jobNo)));
        }
    });
}

function renderStaffList() {
    const tbody = DOMElements.staffListBody;
    tbody.innerHTML = '';
    staffList.sort((a, b) => a.name.localeCompare(b.name)).forEach(staff => {
        const basicSalary = (staff.grossSalary || 0) * 0.60;
        const yearsOfService = staff.joinDate ? (new Date() - new Date(staff.joinDate)) / (1000 * 60 * 60 * 24 * 365.25) : 0;
        const gratuity = calculateGratuity(basicSalary, yearsOfService);
        const row = tbody.insertRow();
        row.innerHTML = `
                <td>${staff.name}</td>
                <td>${staff.role}</td>
                <td>${formatDate(staff.joinDate)}</td>
                <td style="text-align:right;">${formatCurrency(staff.grossSalary)}</td>
                <td style="text-align:right;">${formatCurrency(gratuity)}</td>
                <td><button class="secondary-button details-btn" data-id="${staff.id}">Details</button></td>
            `;
    });
}

function showStaffDetailsModal(staffId) {
    currentEditingStaffId = staffId;
    const staff = staffId ? staffList.find(s => s.id === staffId) : {};

    DOMElements.staffModalTitle.textContent = staffId ? `Edit Details for ${staff.name}` : "Add New Staff Member";
    DOMElements.modalStaffName.value = staff.name || '';
    DOMElements.modalStaffRole.value = staff.role || '';
    DOMElements.modalStaffEmail.value = staff.email || '';
    DOMElements.modalStaffDob.value = staff.dob || '';
    DOMElements.modalStaffPhone.value = staff.phoneNo || '';
    DOMElements.modalStaffEid.value = staff.emiratesId || '';
    DOMElements.modalStaffAddress.value = staff.address || '';
    DOMElements.modalStaffJoinDate.value = staff.joinDate || new Date().toISOString().split('T')[0];
    const grossSalary = staff.grossSalary || 0;
    DOMElements.modalStaffSalary.value = grossSalary;
    DOMElements.modalBasicSalary.textContent = `Basic: ${formatCurrency(grossSalary * 0.60)}`;

    DOMElements.modalVisaExpiry.value = staff.visaExpiry || '';
    DOMElements.modalSoeExpiry.value = staff.soeExpiry || '';
    DOMElements.modalLicenseExpiry.value = staff.licenseExpiry || '';
    DOMElements.modalHealthExpiry.value = staff.healthCardExpiry || '';

    DOMElements.staffPhotoPreview.src = staff.photoUrl || 'placeholder.jpg';
    DOMElements.staffPassportLink.style.display = staff.passportCopyUrl ? 'inline-block' : 'none';
    if (staff.passportCopyUrl) DOMElements.staffPassportLink.href = staff.passportCopyUrl;

    DOMElements.deleteStaffBtn.style.display = staffId ? 'inline-block' : 'none';

    renderLoanHistory(staff);
    DOMElements.staffDetailsModal.style.display = 'flex';
}

async function handleStaffDetailsSave() {
    const isNew = currentEditingStaffId === null;
    let staff = isNew ? {} : staffList.find(s => s.id === currentEditingStaffId);

    staff.name = DOMElements.modalStaffName.value;
    staff.role = DOMElements.modalStaffRole.value;
    staff.email = DOMElements.modalStaffEmail.value;
    staff.dob = DOMElements.modalStaffDob.value;
    staff.phoneNo = DOMElements.modalStaffPhone.value;
    staff.emiratesId = DOMElements.modalStaffEid.value;
    staff.address = DOMElements.modalStaffAddress.value;
    staff.joinDate = DOMElements.modalStaffJoinDate.value;
    staff.grossSalary = parseFloat(DOMElements.modalStaffSalary.value) || 0;
    staff.visaExpiry = DOMElements.modalVisaExpiry.value;
    staff.soeExpiry = DOMElements.modalSoeExpiry.value;
    staff.licenseExpiry = DOMElements.modalLicenseExpiry.value;
    staff.healthCardExpiry = DOMElements.modalHealthExpiry.value;

    if (isNew) {
        staff.leaveBalance = 30;
        staff.increments = [];
        staff.leaves = [];
        staff.loans = [];
    }

    const photoFile = DOMElements.staffPhotoUpload.files[0];
    if (photoFile) staff.photoUrl = await readFileAsDataURL(photoFile);

    const passportFile = DOMElements.staffPassportUpload.files[0];
    if (passportFile) staff.passportCopyUrl = await readFileAsDataURL(passportFile);

    if (isNew) {
        await DB.addHRData(staff);
        alert('Staff member added successfully.');
    } else {
        await DB.putHRData(staff);
        alert('Staff details updated successfully.');
    }

    currentEditingStaffId = null;
    DOMElements.staffDetailsModal.style.display = 'none';
    await refreshDataAndRender();
}

async function handleDeleteStaff() {
    if (!confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) return;

    await DB.deleteHRData(currentEditingStaffId);
    alert('Staff member deleted.');

    DOMElements.staffDetailsModal.style.display = 'none';
    await refreshDataAndRender();
}

// --- Loan Management ---
// ... (All loan functions remain unchanged) ...
async function handleAddLoan() {
    const staff = staffList.find(s => s.id === currentEditingStaffId);
    if (!staff) return;

    const amount = parseFloat(DOMElements.modalLoanAmount.value);
    const date = DOMElements.modalLoanDate.value;
    const description = DOMElements.modalLoanDescription.value;

    if (isNaN(amount) || !date || !description) {
        alert('Please fill all loan fields.'); return;
    }

    if (!staff.loans) staff.loans = [];
    staff.loans.push({ date, description, amount, status: 'Outstanding' });

    await DB.putHRData(staff);
    renderLoanHistory(staff);
    DOMElements.modalLoanAmount.value = '';
    DOMElements.modalLoanDescription.value = '';
}

async function handleLoanActions(e) {
    if (!e.target.matches('.loan-status-btn')) return;

    const staff = staffList.find(s => s.id === currentEditingStaffId);
    if (!staff) return;

    const loanIndex = parseInt(e.target.dataset.index);
    staff.loans[loanIndex].status = 'Paid';

    await DB.putHRData(staff);
    renderLoanHistory(staff);
}

function renderLoanHistory(staff) {
    const tbody = DOMElements.modalLoanHistory;
    tbody.innerHTML = '';
    if (!staff.loans || staff.loans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No loan history.</td></tr>';
        return;
    }
    staff.loans.forEach((loan, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
                <td>${formatDate(loan.date)}</td>
                <td>${loan.description}</td>
                <td>${formatCurrency(loan.amount)}</td>
                <td>${loan.status}</td>
                <td>${loan.status === 'Outstanding' ? `<button class="secondary-button loan-status-btn" data-index="${index}">Mark as Paid</button>` : 'Paid'}</td>
            `;
    });
}
// --- Reminders ---
function renderReminders() {
    const container = DOMElements.reminderList;
    container.innerHTML = '<ul>';
    const now = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(now.getDate() + 60);
    let remindersFound = false;
    const addReminder = (text, daysLeft, dateStr) => {
        container.innerHTML += `<li class="${daysLeft <= 30 ? 'danger' : 'warning'}">${text} in ${daysLeft} days (on ${formatDate(dateStr)}).</li>`;
        remindersFound = true;
    };
    staffList.forEach(staff => {
        const checks = {
            'Visa': staff.visaExpiry,
            'S.O.E. Card': staff.soeExpiry,
            'License': staff.licenseExpiry,
            'Health Card': staff.healthCardExpiry
        };
        for (const itemType in checks) {
            const expiryDateStr = checks[itemType];
            if (expiryDateStr) {
                const expiryDate = new Date(expiryDateStr);
                if (expiryDate >= now && expiryDate <= sixtyDaysFromNow) {
                    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                    //container.innerHTML += `<li class="${daysLeft <= 15 ? 'danger' : 'warning'}">${staff.name}'s ${itemType} will expire in ${daysLeft} days (on ${formatDate(expiryDateStr)}).</li>`;
                    // remindersFound = true;
                    addReminder(`${staff.name}'s ${itemType} will expire`, daysLeft, expiryDateStr);
                }
            }
        }
    });
    // MODIFICATION: Add reminders for assets and annual expenses
    (officeExpenses || []).filter(e => e.frequency === 'annual').forEach(exp => {
        if (exp.date) {
            const dueDate = new Date(exp.date);
            if (dueDate >= now && dueDate <= sixtyDaysFromNow) {
                const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                addReminder(`Annual expense "${exp.description}" is due`, daysLeft, exp.date);
            }
        }
    });

    (assetList || []).forEach(asset => {
        if (asset.warrantyExpiry) {
            const expiryDate = new Date(asset.warrantyExpiry);
            if (expiryDate >= now && expiryDate <= sixtyDaysFromNow) {
                const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                addReminder(`Asset "${asset.itemCode} - ${asset.type}" warranty expires`, daysLeft, asset.warrantyExpiry);
            }
        }
    });

    if (!remindersFound) {
        container.innerHTML = '<p>No upcoming reminders in the next 60 days.</p>';
    } else {
        container.innerHTML += '</ul>';
    }
}
function renderOfferLetterPreview() {
    const name = DOMElements.candidateName.value;
    const role = DOMElements.candidateRole.value;
    const salary = parseFloat(DOMElements.offeredSalary.value);
    const joinDate = formatDate(DOMElements.joinDate.value);
    const basic = salary * 0.60;
    const allowance = salary * 0.40;

    DOMElements.offerLetterPreview.innerHTML = `
            Date: ${formatDate(new Date())}
            <p><b>Mr. ${name}</b></p>
            
            <p>
            <h3 style="text-align:center; text-decoration: underline;">OFFER OF EMPLOYMENT</h3></p>
            <p>Dear Mr. ${name},</p>
            <p>Further to your recent interview, we are pleased to offer you the position of <b>${role}</b> with IMMERSIVE ENGINEERING CONSULTANTS L.L.C.</p>
            <p>Your employment will be governed by the following terms and conditions:</p>
            <ol>
                <li><b>Position:</b> ${role}</li>
                <li><b>Prospective Date of Joining:</b> ${joinDate}</li>
                <li><b>Remuneration:</b> Your consolidated monthly salary will be as follows:
                    <ul>
                        <li>Basic Salary: ${formatCurrency(basic)}</li>
                        <li>Allowances (Housing, Transport, etc.): ${formatCurrency(allowance)}</li>
                        <li><b>Total Gross Salary: ${formatCurrency(salary)}</b></li>
                    </ul>
                </li>
                <li><b>Annual Leave:</b> You will be entitled to 30 calendar days of paid leave upon completion of one year of service.</li>
                <li><b>Medical Insurance:</b> You will be covered under the company's group medical insurance policy.</li>
                <li><b>Probation Period:</b> You will be on a probation period of six (6) months from your date of joining.</li>
            </ol>
            <p>This offer is subject to the successful attestation of your documents and obtaining a UAE employment visa.</p>
            <p>We look forward to you joining our team.</p>
            <br><br>
            <p>Sincerely,</p>
            <p><b>For: IMMERSIVE ENGINEERING CONSULTANTS L.L.C</b></p>
            <br><br><br>
            <p>Accepted and Agreed:</p>
            <p>_________________________</p>
            <p>${name}</p>
        `;
    DOMElements.downloadOfferPdfBtn.style.display = 'inline-block';
}
// New Function
async function downloadOfferLetterPdf() {
    const candidateName = document.getElementById('candidate-name').value || 'Candidate';
    await PDFGenerator.generate({
        previewId: 'offer-letter-preview',
        projectJobNo: 'HR_Offer',
        fileName: `Offer_Letter_${candidateName.replace(/\s/g, '_')}`,
        pageSize: 'A4_portrait'
    });
}
// ... (All remaining functions from handleAddLeave to calculateGratuity remain unchanged) ...
async function handleAddLeave() {
    const staffId = parseInt(DOMElements.leaveStaffSelect.value);
    const startDate = new Date(DOMElements.leaveStartDate.value);
    const endDate = new Date(DOMElements.leaveEndDate.value);
    if (endDate < startDate) {
        alert('End date cannot be before start date.');
        return;
    }
    const days = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return;

    if (!staff.leaves) staff.leaves = [];
    staff.leaves.push({
        type: DOMElements.leaveType.value,
        startDate: DOMElements.leaveStartDate.value,
        endDate: DOMElements.leaveEndDate.value,
        days
    });

    if (DOMElements.leaveType.value === 'Annual') {
        staff.leaveBalance = (staff.leaveBalance || 30) - days;
    }

    await DB.putHRData(staff);
    alert(`Leave for ${staff.name} logged successfully.`);
    await refreshDataAndRender();
}

function renderLeaveLog() {
    const tbody = DOMElements.leaveLogBody;
    tbody.innerHTML = '';
    staffList.forEach(staff => {
        if (staff.leaves && staff.leaves.length > 0) {
            staff.leaves.slice().sort((a, b) => new Date(b.startDate) - new Date(a.startDate)).forEach(leave => {
                const row = tbody.insertRow();
                row.innerHTML = `
                        <td>${staff.name}</td>
                        <td>${leave.type}</td>
                        <td>${formatDate(leave.startDate)}</td>
                        <td>${formatDate(leave.endDate)}</td>
                        <td>${leave.days}</td>
                        <td>${staff.leaveBalance} days</td>
                    `;
            });
        }
    });
    if (tbody.innerHTML === '') {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No leave records found.</td></tr>';
    }
}

function handleExpenseFilter(e) {
    if (!e.target.matches('.secondary-button')) return;
    DOMElements.expenseFilterContainer.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    const period = parseInt(e.target.dataset.period);
    renderExpenseLog(period);
}

async function handleAddExpense() {
    const newExpense = {
        date: DOMElements.expenseDate.value,
        category: DOMElements.expenseCategory.value,
        description: DOMElements.expenseDescription.value,
        amount: parseFloat(DOMElements.expenseAmount.value),
        frequency: 'one-time' // Mark as a regular, one-time expense
    };
    if (!newExpense.date || !newExpense.description || isNaN(newExpense.amount)) {
        alert('Please fill all fields for the expense.');
        return;
    }
    await DB.addOfficeExpense(newExpense);

    alert('Expense logged successfully.');
    DOMElements.expenseDescription.value = '';
    DOMElements.expenseAmount.value = '';

    await refreshDataAndRender();
    const activeFilter = DOMElements.expenseFilterContainer.querySelector('.active');
    const period = activeFilter ? parseInt(activeFilter.dataset.period) : 1;
    renderExpenseLog(period);
}

async function handleAddAnnualExpense() {
    const newExpense = {
        date: DOMElements.annualExpenseDueDate.value, // The next due date
        category: 'Annual', // A specific category for these
        description: DOMElements.annualExpenseItem.value,
        amount: parseFloat(DOMElements.annualExpenseAmount.value),
        frequency: 'annual'
    };
    if (!newExpense.date || !newExpense.description || isNaN(newExpense.amount)) {
        alert('Please fill all fields for the annual expense.');
        return;
    }
    await DB.addOfficeExpense(newExpense);
    alert('Annual expense added successfully.');
    DOMElements.annualExpenseItem.value = '';
    DOMElements.annualExpenseAmount.value = '';
    await refreshDataAndRender();
}

function renderExpenseLog(periodInMonths) {
    const tbody = DOMElements.expenseLogBody;
    tbody.innerHTML = '';
    const filterDate = new Date();
    filterDate.setMonth(filterDate.getMonth() - periodInMonths);

    const filteredExpenses = officeExpenses.filter(exp => exp.frequency !== 'annual' && new Date(exp.date) >= filterDate);
    let total = 0;

    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(exp => {
        total += exp.amount;
        const row = tbody.insertRow();
        row.innerHTML = `
                <td>${formatDate(exp.date)}</td>
                <td>${exp.category}</td>
                <td>${exp.description}</td>
                <td style="text-align:right;">${formatCurrency(exp.amount)}</td>
            `;
    });

    const totalRow = tbody.insertRow();
    totalRow.className = 'total-row';
    totalRow.innerHTML = `<td colspan="3"><b>Total for Period</b></td><td style="text-align:right;"><b>${formatCurrency(total)}</b></td>`;

    renderExpenseDonutChart(filteredExpenses);
}

function renderAnnualExpenseList() {
    const tbody = DOMElements.annualExpenseBody;
    tbody.innerHTML = '';
    const annualExpenses = officeExpenses.filter(e => e.frequency === 'annual');

    annualExpenses.sort((a, b) => a.description.localeCompare(b.description)).forEach(exp => {
        const row = tbody.insertRow();
        row.innerHTML = `
                <td>${exp.description}</td>
                <td style="text-align:right;">${formatCurrency(exp.amount)}</td>
                <td>${formatDate(exp.date)}</td>
                <td><button class="danger-button small-btn" data-id="${exp.id}" data-type="annual-expense">Delete</button></td>
            `;
    });
}

function renderExpenseDonutChart(data) {
    const ctx = DOMElements.expenseChart.getContext('2d');
    const groupedData = data.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.amount;
        return acc;
    }, {});

    const labels = Object.keys(groupedData);
    const values = Object.values(groupedData);

    if (expenseChart) expenseChart.destroy();

    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Expense by Category',
                data: values,
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796', '#5a5c69'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' }, title: { display: true, text: 'Expense Breakdown' } }
        }
    });
}

async function handleAddIncrement() {
    const staffId = parseInt(DOMElements.incrementStaffSelect.value);
    const amount = parseFloat(DOMElements.incrementAmount.value);
    const date = DOMElements.incrementDate.value;
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid increment amount.');
        return;
    }
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return;

    const oldSalary = staff.grossSalary;
    const newSalary = oldSalary + amount;

    if (!staff.increments) staff.increments = [];
    staff.increments.push({ date, oldSalary, amount, newSalary });
    staff.grossSalary = newSalary;

    await DB.putHRData(staff);
    alert(`Increment for ${staff.name} recorded. New salary is ${formatCurrency(newSalary)}.`);
    await refreshDataAndRender();
}

function renderIncrementLog() {
    const tbody = DOMElements.incrementLogBody;
    tbody.innerHTML = '';
    staffList.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach(staff => {
        if (staff.increments && staff.increments.length > 0) {
            staff.increments.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(inc => {
                const row = tbody.insertRow();
                row.innerHTML = `
                        <td>${staff.name}</td>
                        <td>${formatDate(inc.date)}</td>
                        <td style="text-align:right;">${formatCurrency(inc.oldSalary)}</td>
                        <td style="text-align:right;">${formatCurrency(inc.amount)}</td>
                        <td style="text-align:right;">${formatCurrency(inc.newSalary)}</td>
                    `;
            });
        }
    });
    if (tbody.innerHTML === '') {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No increment records found.</td></tr>';
    }
}

function calculateGratuity(basicSalary, yearsOfService) {
    if (yearsOfService < 1) return 0;
    let gratuityDays = 0;
    if (yearsOfService <= 5) {
        gratuityDays = 21 * yearsOfService;
    } else {
        gratuityDays = (21 * 5) + (30 * (yearsOfService - 5));
    }
    return (basicSalary / 30) * gratuityDays;
}
// --- MODIFICATION: New function to render the efficiency report ---
async function renderEfficiencyReport() {
    const container = DOMElements.efficiencyReportBody;
    if (!container) return;

    try {
        // Fetch all data required for the analysis
        const allStaff = await DB.getAllHRData();
        const allScrumData = await DB.getAllScrumData();

        // The template is needed to get the default planned durations
        const designScrumTemplate = window.DESIGN_SCRUM_TEMPLATE || [];

        const efficiencyData = EfficiencyAnalyzer.analyzeStaffEfficiency(allStaff, allScrumData, designScrumTemplate);

        if (efficiencyData.length === 0) {
            container.innerHTML = '<tr><td colspan="5" style="text-align:center;">No staff data to analyze.</td></tr>';
            return;
        }

        container.innerHTML = ''; // Clear loading message
        efficiencyData.forEach(staff => {
            if (staff.completedTasks === 0) return; // Optionally hide staff with no completed tasks

            let efficiencyClass = '';
            if (staff.efficiency >= 95) {
                efficiencyClass = 'status-completed'; // Green
            } else if (staff.efficiency >= 75) {
                efficiencyClass = 'status-inprogress'; // Yellow/Blue
            } else {
                efficiencyClass = 'status-onhold'; // Red
            }

            const row = container.insertRow();
            row.innerHTML = `
                    <td>${staff.staffName}</td>
                    <td style="text-align:center;">${staff.completedTasks}</td>
                    <td style="text-align:center;">${staff.plannedDays.toFixed(1)}</td>
                    <td style="text-align:center;">${staff.actualDays.toFixed(1)}</td>
                    <td><span class="${efficiencyClass}" style="padding: 4px 8px; border-radius: 4px; font-weight: bold;">${staff.efficiency}%</span></td>
                `;
        });

        if (container.innerHTML === '') {
            container.innerHTML = '<tr><td colspan="5" style="text-align:center;">No completed tasks found to analyze.</td></tr>';
        }

    } catch (err) {
        console.error("Error generating efficiency report:", err);
        container.innerHTML = '<tr><td colspan="5" style="text-align:center; color: red;">Error loading report.</td></tr>';
    }
}


// --- MODIFICATION START: NEW PAYROLL FUNCTIONS ---

function renderPayrollTab() {
    const monthSelect = DOMElements.payrollMonthSelect;
    const yearSelect = DOMElements.payrollYearSelect;
    if (!monthSelect || !yearSelect) return;

    if (monthSelect.options.length === 0) {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        months.forEach((month, index) => {
            monthSelect.add(new Option(month, index));
        });
        const currentYear = new Date().getFullYear();
        for (let i = 0; i < 5; i++) {
            yearSelect.add(new Option(currentYear - i, currentYear - i));
        }
        const now = new Date();
        monthSelect.value = now.getMonth();
        yearSelect.value = now.getFullYear();
    }
    renderPayrollSummary();
}

function renderPayrollSummary() {
    const month = parseInt(DOMElements.payrollMonthSelect.value);
    const year = parseInt(DOMElements.payrollYearSelect.value);
    const monthName = DOMElements.payrollMonthSelect.options[month].text;
    DOMElements.summaryMonthDisplay.textContent = `${monthName} ${year}`;

    let totalGross = 0;
    let totalDeductions = 0;

    staffList.forEach(staff => {
        totalGross += staff.grossSalary || 0;
        const targetMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
        const loansDeducted = (staff.loans || [])
            .filter(loan => loan.status === 'Outstanding' && loan.date.startsWith(targetMonth))
            .reduce((sum, loan) => sum + loan.amount, 0);
        totalDeductions += loansDeducted;
    });

    const totalNet = totalGross - totalDeductions;
    const tbody = DOMElements.payrollSummaryBody;
    tbody.innerHTML = `
            <tr>
                <td>Total Gross Salaries</td>
                <td style="text-align:right;">${formatCurrency(totalGross)}</td>
            </tr>
            <tr>
                <td>Total Deductions (Loans)</td>
                <td style="text-align:right;">${formatCurrency(totalDeductions)}</td>
            </tr>
            <tr class="total-row">
                <td><b>Total Net Payable</b></td>
                <td style="text-align:right;"><b>${formatCurrency(totalNet)}</b></td>
            </tr>
        `;
}

function handleGeneratePayslip() {
    const staffId = parseInt(DOMElements.payrollStaffSelect.value);
    const month = parseInt(DOMElements.payrollMonthSelect.value);
    const year = parseInt(DOMElements.payrollYearSelect.value);
    if (!staffId) { alert("Please select a staff member."); return; }

    const staff = staffList.find(s => s.id === staffId);
    if (!staff) { alert("Staff member not found."); return; }

    const monthName = DOMElements.payrollMonthSelect.options[month].text;
    const monthYear = `${monthName} ${year}`;
    const targetMonth = `${year}-${String(month + 1).padStart(2, '0')}`;

    const grossSalary = staff.grossSalary || 0;
    const basicSalary = grossSalary * 0.60;
    const allowances = grossSalary * 0.40;
    const totalEarnings = grossSalary;

    const loansDeducted = (staff.loans || [])
        .filter(loan => loan.status === 'Outstanding' && loan.date.startsWith(targetMonth))
        .reduce((sum, loan) => sum + loan.amount, 0);

    const otherDeductions = 0;
    const totalDeductions = loansDeducted + otherDeductions;
    const netPay = totalEarnings - totalDeductions;

    const payslipData = {
        staff, monthYear, grossSalary, basicSalary, allowances,
        totalEarnings, loansDeducted, otherDeductions, totalDeductions, netPay,
        formatCurrency
    };

    const templateFunction = HR_LETTER_TEMPLATES.payslip;
    if (templateFunction) {
        DOMElements.payslipPreview.innerHTML = templateFunction(payslipData);
        DOMElements.downloadPayslipPdfBtn.style.display = 'inline-block';
    } else {
        DOMElements.payslipPreview.innerHTML = '<p>Payslip template not found.</p>';
    }
}

async function handleDownloadPayslip() {
    const staffId = parseInt(DOMElements.payrollStaffSelect.value);
    const staff = staffList.find(s => s.id === staffId);
    const month = DOMElements.payrollMonthSelect.options[DOMElements.payrollMonthSelect.value].text;
    const year = DOMElements.payrollYearSelect.value;
    if (!staff) return;
    await PDFGenerator.generate({
        previewId: 'payslip-preview',
        fileName: `Payslip_${staff.name.replace(/\s/g, '_')}_${month}_${year}`,
        pageSize: 'a4_portrait'
    });
}
// --- MODIFICATION START: New feature functions ---

// --- Letter Management Implementation ---
let currentDraftId = null;

async function renderLetterManagementTab() {
    await updateLetterCounts();
    await refreshRecipientHistory();
    renderTemplatesCatalog();
    if (DOMElements.composeLetterSubTab.classList.contains('active')) {
        // Already there
    }
}

function handleLetterSubTabSwitch(e) {
    if (!e.target.matches('.tab-button')) return;
    const subTab = e.target.dataset.subTab;

    DOMElements.letterSubTabs.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    document.querySelectorAll('#letter-management-tab .sub-tab-content').forEach(panel => panel.classList.remove('active'));
    document.getElementById(`${subTab}-sub-tab`)?.classList.add('active');

    if (subTab === 'draft-letters') renderDraftsTable();
    if (subTab === 'sent-letters') renderSentLettersTable();
    if (subTab === 'letter-templates') renderTemplatesCatalog();
}

async function updateLetterCounts() {
    const drafts = await DB.getAllLetterDrafts();
    const sent = await DB.getAllSentLetters();
    DOMElements.draftCount.textContent = drafts.length;
    DOMElements.sentCount.textContent = sent.length;
}

async function handleSaveLetterDraft() {
    const draftData = {
        type: DOMElements.letterTypeSelect.value,
        template: DOMElements.letterTemplateSelect.value,
        recipientName: DOMElements.letterRecipientName.value,
        recipientDesignation: DOMElements.letterRecipientDesignation.value,
        recipientCompany: DOMElements.letterRecipientCompany.value,
        recipientAddress: DOMElements.letterRecipientAddress.value,
        subject: DOMElements.letterSubjectInput.value,
        contentBody: DOMElements.letterContentBody.innerHTML,
        timestamp: new Date().toISOString()
    };

    if (currentDraftId !== null) {
        draftData.id = currentDraftId;
    }

    if (!draftData.recipientName && !draftData.subject) {
        alert("Please provide at least a recipient name or subject to save as draft.");
        return;
    }

    const id = await DB.putLetterDraft(draftData);
    currentDraftId = id;

    // Save to recipient history
    await DB.addRecentRecipient({
        name: draftData.recipientName,
        designation: draftData.recipientDesignation,
        company: draftData.recipientCompany,
        address: draftData.recipientAddress
    });
    await refreshRecipientHistory();

    alert("Draft saved successfully.");
    updateLetterCounts();
    updateLetterInfoDisplay('Draft');
}

async function handlePreviewLetterV2(download = false) {
    const content = DOMElements.letterContentBody.innerHTML;
    const recipient = {
        name: DOMElements.letterRecipientName.value,
        designation: DOMElements.letterRecipientDesignation.value,
        company: DOMElements.letterRecipientCompany.value,
        address: DOMElements.letterRecipientAddress.value
    };
    const subject = DOMElements.letterSubjectInput.value;

    if (!content) {
        alert("Letter content is empty.");
        return;
    }

    // Use standard letterhead if defined
    const header = typeof getLetterheadHeaderHtml === 'function' ? getLetterheadHeaderHtml() : '';
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const html = `
            ${header}
            <div style="padding: 10mm; font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5;">
                <p style="text-align: right;">Date: ${date}</p>
                <br>
                <div style="margin-bottom: 20px;">
                    <p><b>${recipient.name}</b></p>
                    <p>${recipient.designation}</p>
                    <p>${recipient.company}</p>
                    <p>${recipient.address.replace(/\n/g, '<br>')}</p>
                </div>
                <p><b>Subject: ${subject}</b></p>
                <br>
                <div style="text-align: justify;">
                    ${content}
                </div>
                <br><br>
                <p>Sincerely,</p>
                <br>
                <p><b>Management</b></p>
                <p>IMMERSIVE ENGINEERING CONSULTANTS L.L.C</p>
            </div>
        `;

    if (download) {
        DOMElements.letterManagementPreviewArea.innerHTML = html;

        // Ensure the preview area is "visible" for html2canvas
        const modal = DOMElements.letterPreviewModal;
        const originalDisplay = modal.style.display;
        const originalVisibility = modal.style.visibility;

        modal.style.display = 'flex';
        modal.style.visibility = 'hidden'; // Keep it hidden from user but renderable

        await PDFGenerator.generate({
            previewId: 'letter-management-preview-area',
            projectJobNo: 'HR_Letter',
            fileName: `Letter_${recipient.name.replace(/\s+/g, '_')}_${new Date().getTime()}`
        });

        modal.style.display = originalDisplay;
        modal.style.visibility = originalVisibility;
    } else {
        DOMElements.letterManagementPreviewArea.innerHTML = html;
        DOMElements.letterPreviewModal.style.display = 'flex';
    }
}

async function handleMarkAsSent(method) {
    const letterData = {
        type: DOMElements.letterTypeSelect.value,
        recipientName: DOMElements.letterRecipientName.value,
        subject: DOMElements.letterSubjectInput.value,
        method: method,
        timestamp: new Date().toISOString()
    };

    if (!letterData.recipientName || !letterData.subject) {
        alert("Cannot mark as sent without recipient and subject.");
        return;
    }

    await DB.addSentLetter(letterData);

    // Save to recipient history
    await DB.addRecentRecipient({
        name: letterData.recipientName,
        designation: DOMElements.letterRecipientDesignation?.value,
        company: DOMElements.letterRecipientCompany?.value,
        address: DOMElements.letterRecipientAddress?.value
    });
    await refreshRecipientHistory();

    // Trigger specific action
    if (method === 'WhatsApp') {
        const phone = prompt("Enter WhatsApp phone number (with country code, e.g., 971501234567):");
        if (phone) {
            const text = encodeURIComponent(`Dear ${letterData.recipientName},\n\nPlease find the document regarding: ${letterData.subject}\n\nRegards,\nUrban Axis`);
            window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
        }
    } else if (method === 'Email' || method === 'Outlook') {
        const email = prompt("Enter recipient email:");
        if (email) {
            const mailto = `mailto:${email}?subject=${encodeURIComponent(letterData.subject)}&body=${encodeURIComponent(DOMElements.letterContentBody.textContent)}`;
            window.location.href = mailto;
        }
    }

    alert(`Letter marked as sent via ${method}.`);
    updateLetterCounts();
    updateLetterInfoDisplay('Sent');
}

function handleLoadTemplate() {
    const templateId = DOMElements.letterTypeSelect.value;
    const tpl = window.LetterTemplates.LIST[templateId];

    if (tpl) {
        DOMElements.letterSubjectInput.value = tpl.subject;
        DOMElements.letterContentBody.innerHTML = tpl.body.replace(/\n/g, '<br>');
    } else {
        DOMElements.letterSubjectInput.value = "Official Communication";
        DOMElements.letterContentBody.innerHTML = "Type your content here...";
    }
    updateWordCount();
    updateLetterInfoDisplay('Draft');
}

function updateWordCount() {
    const text = DOMElements.letterContentBody.textContent.trim();
    const count = text ? text.split(/\s+/).length : 0;
    DOMElements.infoWordCount.textContent = count;
}

function updateLetterInfoDisplay(status) {
    DOMElements.infoLetterType.textContent = DOMElements.letterTypeSelect.options[DOMElements.letterTypeSelect.selectedIndex].text;
    DOMElements.infoLetterTemplate.textContent = DOMElements.letterTemplateSelect.options[DOMElements.letterTemplateSelect.selectedIndex].text;
    DOMElements.infoLetterStatus.textContent = status.toLowerCase();
    DOMElements.infoLetterStatus.className = `badge ${status === 'Sent' ? 'success' : 'danger'}`;
}

async function renderDraftsTable() {
    const drafts = await DB.getAllLetterDrafts();
    const tbody = DOMElements.draftsListBody;
    tbody.innerHTML = '';
    drafts.forEach(d => {
        const row = tbody.insertRow();
        row.innerHTML = `
                <td>${new Date(d.timestamp).toLocaleDateString()}</td>
                <td>${d.recipientName}</td>
                <td>${d.subject}</td>
                <td>
                    <button class="small-button edit-draft-btn" data-id="${d.id}">Load</button>
                    <button class="small-button danger delete-draft-btn" data-id="${d.id}">Del</button>
                </td>
            `;
    });

    tbody.querySelectorAll('.edit-draft-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.target.dataset.id);
            const draft = (await DB.getAllLetterDrafts()).find(d => d.id === id);
            if (draft) {
                currentDraftId = draft.id;
                DOMElements.letterTypeSelect.value = draft.type;
                DOMElements.letterTemplateSelect.value = draft.template;
                DOMElements.letterRecipientName.value = draft.recipientName;
                DOMElements.letterRecipientDesignation.value = draft.recipientDesignation;
                DOMElements.letterRecipientCompany.value = draft.recipientCompany;
                DOMElements.letterRecipientAddress.value = draft.recipientAddress;
                DOMElements.letterSubjectInput.value = draft.subject;
                DOMElements.letterContentBody.innerHTML = draft.contentBody;
                document.querySelector('[data-sub-tab="compose-letter"]').click();
                updateLetterInfoDisplay('Draft');
                updateWordCount();
            }
        });
    });

    tbody.querySelectorAll('.delete-draft-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (confirm("Delete this draft?")) {
                await DB.deleteLetterDraft(parseInt(e.target.dataset.id));
                renderDraftsTable();
                updateLetterCounts();
            }
        });
    });
}

async function renderSentLettersTable() {
    const sent = await DB.getAllSentLetters();
    const tbody = DOMElements.sentListBody;
    tbody.innerHTML = '';
    sent.reverse().forEach(s => {
        const row = tbody.insertRow();
        row.innerHTML = `
                <td>${new Date(s.timestamp).toLocaleString()}</td>
                <td>${s.recipientName}</td>
                <td>${s.subject}</td>
                <td><span class="badge info">${s.method}</span></td>
                <td><button class="small-button danger delete-sent-btn" data-id="${s.id}">Del</button></td>
            `;
    });

    tbody.querySelectorAll('.delete-sent-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (confirm("Delete this record?")) {
                await DB.deleteSentLetter(parseInt(e.target.dataset.id));
                renderSentLettersTable();
                updateLetterCounts();
            }
        });
    });
}

function renderTemplatesCatalog() {
    const catalog = DOMElements.templatesCatalog;
    if (!catalog || !window.LetterTemplates) return;

    catalog.innerHTML = '';
    const templates = window.LetterTemplates.LIST;

    Object.values(templates).forEach(tpl => {
        const item = document.createElement('div');
        item.className = 'template-item tool-card';
        item.style.padding = '15px';
        item.innerHTML = `
                <span class="badge info" style="font-size: 0.7em; margin-bottom: 5px; display: inline-block;">${tpl.category}</span>
                <h5 style="margin: 5px 0;">${tpl.name}</h5>
                <p style="font-size: 0.85em; color: #666;">${tpl.description}</p>
                <button class="small-button use-template-btn" data-id="${tpl.id}" style="width: 100%; margin-top: 10px;">Use Template</button>
            `;
        catalog.appendChild(item);
    });

    catalog.querySelectorAll('.use-template-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            handleLoadTemplateFromId(e.target.dataset.id);
            document.querySelector('[data-sub-tab="compose-letter"]').click();
        });
    });
}

function handleLoadTemplateFromId(templateId) {
    const tpl = window.LetterTemplates.LIST[templateId];
    if (!tpl) return;

    DOMElements.letterSubjectInput.value = tpl.subject;
    DOMElements.letterContentBody.innerHTML = tpl.body.replace(/\n/g, '<br>');
    updateWordCount();
    updateLetterInfoDisplay('Draft');
}

async function refreshRecipientHistory() {
    const list = DOMElements.recipientHistoryList;
    if (!list) return;
    const history = await DB.getRecentRecipients(20);
    list.innerHTML = history.map(r => `<option value="${r.name}">${r.company || ''} - ${r.designation || ''}</option>`).join('');

    // Store history globally for lookup
    window._recipientHistory = history;
}

function handleRecipientInput(e) {
    const name = e.target.value;
    const match = (window._recipientHistory || []).find(r => r.name === name);
    if (match) {
        if (DOMElements.letterRecipientDesignation) DOMElements.letterRecipientDesignation.value = match.designation || '';
        if (DOMElements.letterRecipientCompany) DOMElements.letterRecipientCompany.value = match.company || '';
        if (DOMElements.letterRecipientAddress) DOMElements.letterRecipientAddress.value = match.address || '';
    }
}

// --- VAT Report ---
function renderVatReport() {
    const tbody = DOMElements.vatReportBody;

    // Input VAT (Expenses)
    const monthlyInput = officeExpenses.reduce((acc, expense) => {
        const month = expense.date.substring(0, 7); // "YYYY-MM"
        acc[month] = (acc[month] || 0) + expense.amount;
        return acc;
    }, {});

    // Output VAT (Revenue)
    const monthlyOutput = {};
    projectList.forEach(proj => {
        (proj.invoices || []).forEach(inv => {
            if (inv.status === 'Paid' || inv.status === 'Raised') {
                const month = inv.date.substring(0, 7);
                monthlyOutput[month] = (monthlyOutput[month] || 0) + parseFloat(inv.amount || 0);
            }
        });
    });

    const allMonths = [...new Set([...Object.keys(monthlyInput), ...Object.keys(monthlyOutput)])].sort().reverse();

    tbody.innerHTML = '';
    if (allMonths.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No data logged to calculate VAT.</td></tr>';
        return;
    }

    allMonths.forEach(month => {
        const expenseTotal = monthlyInput[month] || 0;
        const revenueTotal = monthlyOutput[month] || 0;
        const inputVat = expenseTotal * 0.05;
        const outputVat = revenueTotal * 0.05;
        const netVat = outputVat - inputVat;

        const monthName = new Date(month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' });
        const row = tbody.insertRow();
        row.innerHTML = `
                <td>${monthName}</td>
                <td style="text-align:right;">${formatCurrency(outputVat)}</td>
                <td style="text-align:right;">${formatCurrency(inputVat)}</td>
                <td style="text-align:right; font-weight:bold; color: ${netVat >= 0 ? 'red' : 'green'};">
                    ${formatCurrency(Math.abs(netVat))} ${netVat >= 0 ? '(Payable)' : '(Claimable)'}
                </td>
            `;
    });
}

async function handleDownloadWPS() {
    const month = parseInt(DOMElements.payrollMonthSelect.value);
    const year = parseInt(DOMElements.payrollYearSelect.value);
    const monthName = DOMElements.payrollMonthSelect.options[month].text;

    // Simple SIF generation logic (This is a simplified version of the UAE SIFT format)
    // Header: EDR, EmployerID, FileCreationDate, FileCreationTime, MonthYear
    const employerId = "1234567890123"; // Dummy Employer ID (TRN or MOL ID)
    const creationDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const creationTime = new Date().toTimeString().split(' ')[0].replace(/:/g, '').substring(0, 4);
    const monthYear = `${String(month + 1).padStart(2, '0')}${year}`;

    let sifContent = `EDR,${employerId},${creationDate},${creationTime},${monthYear}\n`;

    // Records: SCR, EmployeeID, BankID, AccountNo, Salary, Deductions, DaysPaid
    staffList.forEach(staff => {
        const basic = (staff.grossSalary || 0) * 0.6;
        const allowances = (staff.grossSalary || 0) * 0.4;
        const net = staff.grossSalary || 0;
        const bankId = "ADCB"; // Default
        const accNo = "IBANXXXXXXXXXXXXXXXX"; // Placeholder

        sifContent += `SCR,${staff.emiratesId || '784-0000-0000000-0'},${bankId},${accNo},${basic.toFixed(2)},${allowances.toFixed(2)},0,30\n`;
    });

    const blob = new Blob([sifContent], { type: 'text/plain' });
    triggerDownload(blob, `WPS_SIF_${monthName}_${year}.txt`);
    alert("WPS SIF file generated successfully. Note: This is an illustrative format and may need your specific bank's header details.");
}

// --- Account Management ---
async function handleAddReferralAccount() {
    const account = {
        name: DOMElements.refName.value.trim(),
        contact: DOMElements.refContact.value.trim(),
        phone: DOMElements.refPhone.value.trim(),
        email: DOMElements.refEmail.value.trim(),
        notes: DOMElements.refNotes.value.trim(),
        projectNo: DOMElements.refProjectNo.value // MODIFICATION: Save project
    };
    if (!account.name) {
        alert('Please enter a name for the referral account.'); return;
    }
    await DB.addReferralAccount(account);
    alert('Referral account added.');
    [DOMElements.refName, DOMElements.refContact, DOMElements.refPhone, DOMElements.refEmail, DOMElements.refNotes, DOMElements.refProjectNo].forEach(el => el.value = '');
    await refreshDataAndRender();
}

async function handleAddOtherAccount() {
    const account = {
        name: DOMElements.otherName.value.trim(),
        contact: DOMElements.otherContact.value.trim(),
        phone: DOMElements.otherPhone.value.trim(),
        email: DOMElements.otherEmail.value.trim(),
        notes: DOMElements.otherNotes.value.trim(),
        projectNo: DOMElements.otherProjectNo.value // MODIFICATION: Save project
    };
    if (!account.name) {
        alert('Please enter a name for the account.'); return;
    }
    await DB.addOtherAccount(account);
    alert('Account added.');
    [DOMElements.otherName, DOMElements.otherContact, DOMElements.otherPhone, DOMElements.otherEmail, DOMElements.otherNotes, DOMElements.otherProjectNo].forEach(el => el.value = '');
    await refreshDataAndRender();
}

function renderReferralAccounts() {
    const tbody = DOMElements.referralAccountsBody;
    tbody.innerHTML = '';
    if (referralAccounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No referral accounts found.</td></tr>'; return;
    }
    referralAccounts.forEach(acc => {
        // Find projects linked to this account
        const linkedProjects = projectList.filter(p => p.referralSource === `account:${acc.id}`);
        const projectsHtml = linkedProjects.map(p => `<div>${p.jobNo}</div>`).join('') || 'N/A';
        const feesHtml = linkedProjects.map(p => {
            const feeValue = p.referralValue || 0;
            const feeType = p.referralType === 'percentage' ? '%' : ' AED';
            return `<div>${feeValue}${feeType}</div>`;
        }).join('') || 'N/A';

        const row = tbody.insertRow();
        row.innerHTML = `<td>${acc.name}</td><td>${acc.contact}</td><td>${acc.phone}</td><td>${acc.email}</td><td>${projectsHtml}</td><td>${feesHtml}</td><td><button class="danger-button small-btn" data-id="${acc.id}" data-type="referral">Delete</button></td>`;
    });
}

function renderOtherAccounts() {
    const tbody = DOMElements.otherAccountsBody;
    tbody.innerHTML = '';
    if (otherAccounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No other accounts found.</td></tr>'; return;
    }
    otherAccounts.forEach(acc => {
        // Find projects linked to this "other" source if applicable, 
        // though usually other is just for categorization.
        const row = tbody.insertRow();
        row.innerHTML = `<td>${acc.name}</td><td>${acc.contact}</td><td>${acc.phone}</td><td>${acc.email}</td><td>${acc.projectNo || 'N/A'}</td><td><button class="danger-button small-btn" data-id="${acc.id}" data-type="other">Delete</button></td>`;
    });
}

// --- Import/Export/Print Handlers ---
// --- MODIFICATION START: New Asset Tracker Functions ---
async function handleAddAsset() {
    const asset = {
        itemCode: DOMElements.assetItemCode.value.trim(),
        type: DOMElements.assetType.value.trim(),
        location: DOMElements.assetLocation.value.trim(),
        department: DOMElements.assetDepartment.value.trim(),
        projectNo: DOMElements.assetProjectNo.value,
        price: parseFloat(DOMElements.assetPrice.value) || 0,
        purchaseDate: DOMElements.assetDate.value,
        warrantyExpiry: DOMElements.assetWarrantyExpiry.value,
        note1: DOMElements.assetNote1.value.trim(),
        note2: DOMElements.assetNote2.value.trim(),
    };
    if (!asset.itemCode || !asset.type) {
        alert('Please provide at least an Item Code and Type.');
        return;
    }
    await DB.addAsset(asset);
    alert('Asset added successfully.');
    [DOMElements.assetItemCode, DOMElements.assetType, DOMElements.assetLocation, DOMElements.assetDepartment, DOMElements.assetProjectNo, DOMElements.assetPrice, DOMElements.assetDate, DOMElements.assetWarrantyExpiry, DOMElements.assetNote1, DOMElements.assetNote2].forEach(el => el.value = '');
    await refreshDataAndRender();
}

function renderAssetList() {
    const tbody = DOMElements.assetListBody;
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!assetList || assetList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">No assets found.</td></tr>';
        return;
    }
    assetList.forEach(asset => {
        const qrData = `Code: ${asset.itemCode}, Type: ${asset.type}, Location: ${asset.location}`;
        const row = tbody.insertRow();
        row.innerHTML = `
                <td>${asset.itemCode}</td>
                <td>${asset.type}</td>
                <td>${asset.location}</td>
                <td>${asset.department}</td>
                <td>${asset.projectNo || 'N/A'}</td>
                <td>${formatCurrency(asset.price)}</td>
                <td>${formatDate(asset.purchaseDate)}</td>
                <td>${formatDate(asset.warrantyExpiry)}</td>
                <td>${qrData}</td>
                <td><button class="danger-button small-btn" data-id="${asset.id}" data-type="asset">Delete</button></td>
            `;
    });
}
// --- MODIFICATION END ---

// --- MODIFICATION START: New Data Export Functions ---
async function handleExportXML() {
    alert("Preparing XML export...");
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urbanAxisData>\n';

    const toXML = (data, tagName) => {
        let xml = '';
        for (const item of data) {
            xml += `  <${tagName}>\n`;
            for (const key in item) {
                const value = item[key] ? String(item[key]).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;') : '';
                if (typeof item[key] === 'object' && item[key] !== null) {
                    xml += `    <${key}>${JSON.stringify(item[key])}</${key}>\n`;
                } else {
                    xml += `    <${key}>${value}</${key}>\n`;
                }
            }
            xml += `  </${tagName}>\n`;
        }
        return xml;
    };

    xml += '<staffList>\n' + toXML(staffList, 'staff') + '</staffList>\n';
    xml += '<officeExpenses>\n' + toXML(officeExpenses, 'expense') + '</officeExpenses>\n';
    xml += '<referralAccounts>\n' + toXML(referralAccounts, 'account') + '</referralAccounts>\n';
    xml += '<otherAccounts>\n' + toXML(otherAccounts, 'account') + '</otherAccounts>\n';
    xml += '<assets>\n' + toXML(assetList, 'asset') + '</assets>\n';
    xml += '<projects>\n' + toXML(projectList, 'project') + '</projects>\n';

    xml += '</urbanAxisData>';

    const blob = new Blob([xml], { type: 'application/xml' });
    triggerDownload(blob, 'UrbanAxis_AllData.xml');
}

async function handleExportZIP() {
    if (typeof JSZip === 'undefined') {
        alert('ZIP library is not loaded. Cannot create ZIP file.');
        return;
    }
    alert("Preparing ZIP export...");
    const zip = new JSZip();

    zip.file("staff.json", JSON.stringify(staffList, null, 2));
    zip.file("expenses.json", JSON.stringify(officeExpenses, null, 2));
    zip.file("referral_accounts.json", JSON.stringify(referralAccounts, null, 2));
    zip.file("other_accounts.json", JSON.stringify(otherAccounts, null, 2));
    zip.file("assets.json", JSON.stringify(assetList, null, 2));
    zip.file("projects.json", JSON.stringify(projectList, null, 2));

    const blob = await zip.generateAsync({ type: "blob" });
    triggerDownload(blob, 'UrbanAxis_AllData.zip');
}

function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
// --- MODIFICATION END ---
function handleTableActions(e) {
    if (e.target.matches('.export-csv-btn')) {
        const tableId = e.target.dataset.tableId;
        const filename = e.target.dataset.filename || 'export';
        exportTableToCSV(tableId, `${filename}.csv`);
    }
    if (e.target.matches('.print-pdf-btn')) {
        const elementId = e.target.dataset.elementId;
        const filename = e.target.dataset.filename || 'document';
        printElementToPDF(elementId, filename);
    }
    if (e.target.matches('.danger-button[data-type="referral"]')) {
        if (confirm('Delete this referral account?')) DB.deleteReferralAccount(parseInt(e.target.dataset.id)).then(refreshDataAndRender);
    }
    if (e.target.matches('.danger-button[data-type="other"]')) {
        if (confirm('Delete this account?')) DB.deleteOtherAccount(parseInt(e.target.dataset.id)).then(refreshDataAndRender);
    }
    // MODIFICATION: Handle asset deletion
    if (e.target.matches('.danger-button[data-type="asset"]')) {
        if (confirm('Delete this asset?')) DB.deleteAsset(parseInt(e.target.dataset.id)).then(refreshDataAndRender);
    }
    if (e.target.matches('.danger-button[data-type="annual-expense"]')) {
        if (confirm('Delete this annual expense?')) DB.delete(DB.STORES.OFFICE_EXPENSES, parseInt(e.target.dataset.id)).then(refreshDataAndRender);
    }
}

function exportTableToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) { console.error(`Table with ID ${tableId} not found.`); return; }

    let csv = [];
    const rows = table.querySelectorAll("tr");

    for (const row of rows) {
        const cols = row.querySelectorAll("td, th");
        const rowData = [];
        for (const col of cols) {
            // Exclude action columns
            if (col.querySelector('button')) continue;
            // Clean text
            let data = col.innerText.replace(/(\r\n|\n|\r)/gm, " ").replace(/(\s\s)/gm, " ");
            data = data.replace(/"/g, '""');
            rowData.push(`"${data}"`);
        }
        csv.push(rowData.join(","));
    }

    const csvFile = new Blob([csv.join("\n")], { type: "text/csv" });

    triggerDownload(csvFile, filename);
    //const downloadLink = document.createElement("a");
    //downloadLink.download = filename;
    //downloadLink.href = window.URL.createObjectURL(csvFile);
    //downloadLink.style.display = "none";
    //document.body.appendChild(downloadLink);
    //downloadLink.click();
    //document.body.removeChild(downloadLink);
}

async function printElementToPDF(elementId, filename) {
    if (!window.PDFGenerator) {
        alert('PDF Generator is not available.'); return;
    }
    await PDFGenerator.generate({
        previewId: elementId,
        fileName: filename,
        pageSize: 'a4_landscape' // Landscape is often better for tables
    });
}

function handleFileImport(e) {
    if (!e.target.matches('.import-csv-input')) return;
    const file = e.target.files[0];
    const type = e.target.dataset.type;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const csv = event.target.result;
        const lines = csv.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            alert('CSV file is empty or has only a header.'); return;
        }
        // Simple parser assuming Name, Contact, Phone, Email, Notes
        const headers = lines.shift().split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['name', 'contact', 'phone', 'email'];
        if (!requiredHeaders.every(h => headers.includes(h))) {
            alert(`Import failed. CSV must contain headers: ${requiredHeaders.join(', ')}`);
            return;
        }

        const records = lines.map(line => {
            const values = line.split(',');
            const record = {};
            headers.forEach((header, i) => {
                record[header] = values[i]?.replace(/"/g, '').trim() || '';
            });
            return record;
        });

        try {
            if (type === 'referral') {
                for (const rec of records) await DB.addReferralAccount(rec);
            } else if (type === 'other') {
                for (const rec of records) await DB.addOtherAccount(rec);
            }
            alert(`${records.length} records imported successfully.`);
            await refreshDataAndRender();
        } catch (err) {
            console.error('Import error:', err);
            alert('An error occurred during import. Check console for details.');
        }
    };
    e.target.value = ''; // Reset file input
}

// --- Invoices Tab Rendering ---
function renderInvoicesTab() {
    const tbody = document.getElementById('invoices-list-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Gather all invoices from projects
    let allInvoices = [];
    (projectList || []).forEach(proj => {
        if (proj.invoices && Array.isArray(proj.invoices)) {
            proj.invoices.forEach(inv => {
                allInvoices.push({
                    ...inv,
                    projectDescription: proj.projectDescription,
                    projectType: proj.projectType,
                    clientName: proj.clientName,
                    location: proj.location,
                    // Ensure numeric amounts
                    amount: parseFloat(inv.amount || 0),
                    received: parseFloat(inv.received || 0),
                    feePercentage: parseFloat(inv.feePercentage || 0)
                });
            });
        }
    });

    // Apply Filters
    const query = (document.getElementById('inv-search')?.value || '').toLowerCase();
    const typeFilter = document.getElementById('inv-filter-type')?.value;
    const dateStart = document.getElementById('inv-date-start')?.value;
    const dateEnd = document.getElementById('inv-date-end')?.value;
    const minAmount = parseFloat(document.getElementById('inv-min-amount')?.value) || 0;
    const maxAmount = parseFloat(document.getElementById('inv-max-amount')?.value) || Infinity;
    const minFee = parseFloat(document.getElementById('inv-fee-percent')?.value) || 0;
    const onlyReferral = document.getElementById('inv-filter-referral')?.checked;

    let filtered = allInvoices.filter(inv => {
        // Search text
        const textMatch = (
            (inv.invoiceNo || '').toLowerCase().includes(query) ||
            (inv.clientName || '').toLowerCase().includes(query) ||
            (inv.projectDescription || '').toLowerCase().includes(query)
        );
        if (!textMatch) return false;

        // Date Range
        if (dateStart && inv.date < dateStart) return false;
        if (dateEnd && inv.date > dateEnd) return false;

        // Project Type
        if (typeFilter && inv.projectType !== typeFilter) return false;

        // Amounts
        if (inv.amount < minAmount) return false;
        if (inv.amount > maxAmount) return false;
        if (minFee > 0 && inv.feePercentage < minFee) return false;

        // Referral
        if (onlyReferral && (!inv.referral || inv.referral.trim() === '')) return false;

        return true;
    });

    // Apply Sort
    const sortBy = document.getElementById('inv-sort-by')?.value || 'date-desc';
    filtered.sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        if (sortBy === 'client') return (a.clientName || '').localeCompare(b.clientName || '');
        if (sortBy === 'project') return (a.projectDescription || '').localeCompare(b.projectDescription || '');
        if (sortBy === 'location') return (a.location || '').localeCompare(b.location || '');
        return 0;
    });

    // Render Rows and Calculate Totals
    let totalInvoiced = 0;
    let totalReceived = 0;
    let totalReferralFee = 0;

    filtered.forEach(inv => {
        totalInvoiced += inv.amount;
        totalReceived += inv.received || 0;

        // Calculate referral fee if applicable
        if (inv.referral && inv.feePercentage > 0) {
            totalReferralFee += inv.amount * (inv.feePercentage / 100);
        }

        const row = tbody.insertRow();

        // Status Badge Logic
        let statusBadge = '';
        if (inv.status === 'Paid') statusBadge = '<span class="badge success">Paid</span>';
        else if (inv.status === 'Cancelled') statusBadge = '<span class="badge danger">Cancelled</span>';
        else statusBadge = '<span class="badge warning">Raised</span>';

        row.innerHTML = `
            <td>${formatDate(inv.date)}</td>
            <td>${inv.invoiceNo || '-'}</td>
            <td>${inv.projectDescription || '-'}</td>
            <td>${inv.clientName || '-'}</td>
            <td>${inv.projectType || '-'}</td>
            <td>${inv.location || '-'}</td>
            <td style="text-align:right;">${formatCurrency(inv.amount)}</td>
            <td style="text-align:right;">${formatCurrency(inv.received)}</td>
            <td style="text-align:center;">${inv.feePercentage}%</td>
            <td>${inv.referral || '-'}</td>
            <td>${statusBadge}</td>
        `;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;">No invoices found matching filters.</td></tr>';
    }

    // Calculate final totals
    const totalVat = totalInvoiced * 0.05;
    const totalOutstanding = totalInvoiced - totalReceived;

    // Update Totals Display
    document.getElementById('inv-total-amount').textContent = formatCurrency(totalInvoiced);
    document.getElementById('inv-total-received').textContent = formatCurrency(totalReceived);
    document.getElementById('inv-total-referral').textContent = formatCurrency(totalReferralFee);
    document.getElementById('inv-total-vat').textContent = formatCurrency(totalVat);
    document.getElementById('inv-total-outstanding').textContent = formatCurrency(totalOutstanding);
}
