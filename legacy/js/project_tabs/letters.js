//--- START OF FILE letters.js ---

App.ProjectTabs.Letters = (() => {
    let D = {};
    let currentDraftId = null;

    function init() {
        // Cache DOMElements
        D = {
            tab: document.getElementById('project-letters-tab'),
            subTabs: document.getElementById('project-letter-sub-tabs'),
            composeSubTab: document.getElementById('project-compose-letter-sub-tab'),
            draftsSubTab: document.getElementById('project-draft-letters-sub-tab'),
            sentSubTab: document.getElementById('project-sent-letters-sub-tab'),
            templatesSubTab: document.getElementById('project-letter-templates-sub-tab'),

            // Compose fields
            typeSelect: document.getElementById('project-letter-type-select'),
            templateSelect: document.getElementById('project-letter-template-select'),
            recipientName: document.getElementById('project-letter-recipient-name'),
            recipientDesignation: document.getElementById('project-letter-recipient-designation'),
            recipientCompany: document.getElementById('project-letter-recipient-company'),
            recipientAddress: document.getElementById('project-letter-recipient-address'),
            subjectInput: document.getElementById('project-letter-subject-input'),
            contentBody: document.getElementById('project-letter-content-body'),

            // Counts & Info
            draftCount: document.getElementById('project-draft-count'),
            sentCount: document.getElementById('project-sent-count'),
            wordCount: document.getElementById('project-info-word-count'),
            statusLabel: document.getElementById('project-info-letter-status'),

            // Buttons
            saveDraftBtn: document.getElementById('project-save-letter-draft-btn'),
            previewBtn: document.getElementById('project-preview-letter-btn'),
            downloadPdfBtn: document.getElementById('project-download-letter-pdf-btn'),
            markSentBtn: document.getElementById('project-mark-as-sent-btn'),
            sendWaBtn: document.getElementById('project-send-whatsapp-btn'),
            sendEmailBtn: document.getElementById('project-send-email-btn'),

            // Tables
            draftsListBody: document.getElementById('project-drafts-list-body'),
            sentListBody: document.getElementById('project-sent-list-body'),
            templatesCatalog: document.getElementById('project-templates-catalog')
        };

        if (!D.tab) return;
        setupEventListeners();
    }

    function setupEventListeners() {
        // Sub-tab switching
        D.subTabs?.addEventListener('click', (e) => {
            const btn = e.target.closest('.tab-button');
            if (!btn) return;
            switchSubTab(btn.dataset.subTab);
        });

        // Actions
        D.saveDraftBtn?.addEventListener('click', handleSaveDraft);
        D.previewBtn?.addEventListener('click', () => handlePreview(false));
        D.downloadPdfBtn?.addEventListener('click', () => handlePreview(true));
        D.markSentBtn?.addEventListener('click', () => handleMarkSent('Manual'));
        D.sendWaBtn?.addEventListener('click', () => handleMarkSent('WhatsApp'));
        D.sendEmailBtn?.addEventListener('click', () => handleMarkSent('Email'));

        // Editor events
        D.contentBody?.addEventListener('input', updateWordCount);

        // Recipient history
        D.recipientName?.addEventListener('input', handleRecipientInput);
    }

    async function render() {
        currentDraftId = null;
        clearForm();
        await updateCounts();
        await refreshRecipientHistory();
        renderTemplatesCatalog();
        updateWordCount();
    }

    function switchSubTab(subTabId) {
        // Update buttons
        D.subTabs.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.subTab === subTabId);
        });
        // Update panels
        D.tab.querySelectorAll('.sub-tab-content').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${subTabId}-sub-tab`);
        });

        if (subTabId === 'project-draft-letters') renderDraftsTable();
        if (subTabId === 'project-sent-letters') renderSentLettersTable();
        if (subTabId === 'project-letter-templates') renderTemplatesCatalog();
    }

    async function updateCounts() {
        const drafts = await DB.getAllLetterDrafts();
        const sent = await DB.getAllSentLetters();
        // Filter by jobNo and source
        const pDrafts = drafts.filter(d => d.jobNo === App.currentProjectJobNo);
        const pSent = sent.filter(s => s.jobNo === App.currentProjectJobNo);

        if (D.draftCount) D.draftCount.textContent = pDrafts.length;
        if (D.sentCount) D.sentCount.textContent = pSent.length;
    }

    function updateWordCount() {
        const text = D.contentBody.textContent.trim();
        const count = text ? text.split(/\s+/).length : 0;
        if (D.wordCount) D.wordCount.textContent = count;
    }

    async function handleSaveDraft() {
        const draftData = {
            id: currentDraftId,
            jobNo: App.currentProjectJobNo,
            type: D.typeSelect.value,
            template: D.templateSelect.value,
            recipientName: D.recipientName.value,
            recipientDesignation: D.recipientDesignation.value,
            recipientCompany: D.recipientCompany.value,
            recipientAddress: D.recipientAddress.value,
            subject: D.subjectInput.value,
            contentBody: D.contentBody.innerHTML,
            timestamp: new Date().toISOString(),
            source: 'project'
        };

        if (!draftData.recipientName && !draftData.subject) {
            alert("Please provide at least a recipient name or subject.");
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

        alert("Draft saved.");
        updateCounts();
        updateStatusDisplay('Draft');
    }

    async function handlePreview(download = false) {
        const html = getFullLetterHtml();
        const recipientName = D.recipientName.value || 'Recipient';

        // We can reuse the project-letter-preview div
        const previewEl = document.getElementById('project-letter-preview');
        if (previewEl) {
            previewEl.innerHTML = html;
            // Switch to the letter preview tab
            App.DOMElements.previewTabs?.querySelector('[data-tab="project-letter"]')?.click();
        }

        if (download) {
            await PDFGenerator.generate({
                previewId: 'project-letter-preview',
                fileName: `Letter_${recipientName.replace(/\s+/g, '_')}`,
                pageSize: 'a4_portrait'
            });
        }
    }

    function getFullLetterHtml() {
        const content = D.contentBody.innerHTML;
        if (!content || content.trim() === '' || content === '<br>') {
            return '<p style="text-align:center; padding-top: 50px; color: #888;">No letter content drafted.</p>';
        }

        const recipient = {
            name: D.recipientName.value || '[Recipient Name]',
            designation: D.recipientDesignation.value || '[Designation]',
            company: D.recipientCompany.value || '[Company]',
            address: D.recipientAddress.value || '[Address]'
        };
        const subject = D.subjectInput.value || '[Subject]';
        const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

        // Consistent header with HR module if available
        const logo = typeof LOGO_BASE64 !== 'undefined' ? LOGO_BASE64 : '';
        const header = logo ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${logo}" alt="Logo" style="width: 100%; max-height: 100px; object-fit: contain;"></div>` : '';

        return `
            <div style="padding: 10mm; font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #000; background: white; min-height: 280mm;">
                ${header}
                <div style="margin-top: 20px;">
                    <p style="text-align: right;">Date: ${date}</p>
                    <div style="margin-bottom: 20px;">
                        <p><b>To,</b></p>
                        <p><b>${recipient.name}</b></p>
                        <p>${recipient.designation}</p>
                        <p>${recipient.company}</p>
                        <p>${recipient.address.replace(/\n/g, '<br>')}</p>
                    </div>
                    <p><b>Subject: ${subject}</b></p>
                    <br>
                    <div style="text-align: justify; min-height: 400px;">${content}</div>
                    <br>
                    <p>Sincerely,</p>
                    <br>
                    <p><b>Management</b></p>
                    <p>IMMERSIVE ENGINEERING CONSULTANTS L.L.C</p>
                </div>
            </div>
        `;
    }

    async function handleMarkSent(method) {
        const letterData = {
            jobNo: App.currentProjectJobNo,
            recipientName: D.recipientName.value,
            subject: D.subjectInput.value,
            method: method,
            timestamp: new Date().toISOString(),
            source: 'project'
        };

        if (!letterData.recipientName || !letterData.subject) {
            alert("Please provide recipient and subject."); return;
        }

        await DB.addSentLetter(letterData);

        // Save to recipient history
        await DB.addRecentRecipient({
            name: letterData.recipientName,
            designation: D.recipientDesignation.value,
            company: D.recipientCompany.value,
            address: D.recipientAddress.value
        });
        await refreshRecipientHistory();

        if (method === 'WhatsApp') {
            const phone = prompt("Enter WhatsApp phone number:");
            if (phone) {
                const message = `*COMMUNICATION: Urban Axis*\n\nDear ${letterData.recipientName},\n\nRe: ${letterData.subject}\n\nRegards,\nUrban Axis`;
                window.open(`https://wa.me/${phone.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
            }
        }

        alert(`Marked as sent via ${method}.`);
        updateCounts();
        updateStatusDisplay('Sent');
    }

    function updateStatusDisplay(status) {
        if (!D.statusLabel) return;
        D.statusLabel.textContent = status;
        D.statusLabel.className = `badge ${status === 'Sent' ? 'success' : 'info'}`;
    }

    async function renderDraftsTable() {
        const drafts = await DB.getAllLetterDrafts();
        const pDrafts = drafts.filter(d => d.jobNo === App.currentProjectJobNo).reverse();
        D.draftsListBody.innerHTML = pDrafts.map(d => `
            <tr>
                <td>${new Date(d.timestamp).toLocaleDateString()}</td>
                <td>${d.recipientName || 'N/A'}</td>
                <td>${d.subject || 'N/A'}</td>
                <td>
                    <button class="small-button load-draft-btn" data-id="${d.id}">Load</button>
                    <button class="small-button danger del-draft-btn" data-id="${d.id}">Del</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="4" style="text-align:center;">No drafts found for this project.</td></tr>';

        D.draftsListBody.querySelectorAll('.load-draft-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const draft = pDrafts.find(x => x.id === parseInt(e.target.dataset.id));
                if (draft) {
                    currentDraftId = draft.id;
                    D.recipientName.value = draft.recipientName || '';
                    D.recipientDesignation.value = draft.recipientDesignation || '';
                    D.recipientCompany.value = draft.recipientCompany || '';
                    D.recipientAddress.value = draft.recipientAddress || '';
                    D.subjectInput.value = draft.subject || '';
                    D.contentBody.innerHTML = draft.contentBody || '';
                    D.typeSelect.value = draft.type || '';
                    D.templateSelect.value = draft.template || '';
                    switchSubTab('project-compose-letter');
                    updateStatusDisplay('Draft');
                    updateWordCount();
                }
            });
        });

        D.draftsListBody.querySelectorAll('.del-draft-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm("Delete?")) {
                    await DB.deleteLetterDraft(parseInt(e.target.dataset.id));
                    renderDraftsTable();
                    updateCounts();
                }
            });
        });
    }

    async function renderSentLettersTable() {
        const sent = await DB.getAllSentLetters();
        const pSent = sent.filter(s => s.jobNo === App.currentProjectJobNo).reverse();
        D.sentListBody.innerHTML = pSent.map(s => `
            <tr>
                <td>${new Date(s.timestamp).toLocaleString()}</td>
                <td>${s.recipientName}</td>
                <td>${s.subject}</td>
                <td><span class="badge info">${s.method}</span></td>
                <td><button class="small-button danger del-sent-btn" data-id="${s.id}">Del</button></td>
            </tr>
        `).join('') || '<tr><td colspan="5" style="text-align:center;">No sent logs found.</td></tr>';
    }

    function renderTemplatesCatalog() {
        if (!D.templatesCatalog) {
            console.warn('Project Letters: templatesCatalog element not found');
            return;
        }

        // Use ProjectLetterTemplates if available, fallback to LetterTemplates
        const templates = window.ProjectLetterTemplates?.LIST || window.LetterTemplates?.LIST || {};

        console.log('Project Letters: Loading templates', {
            hasProjectTemplates: !!window.ProjectLetterTemplates,
            hasGenericTemplates: !!window.LetterTemplates,
            templateCount: Object.keys(templates).length
        });

        if (Object.keys(templates).length === 0) {
            D.templatesCatalog.innerHTML = `
                <p style="color: #888; text-align: center; padding: 20px;">
                    No templates available.<br>
                    <small>Please ensure project_letter_templates.js is loaded.</small><br>
                    <small>Check browser console for details.</small>
                </p>
            `;
            console.error('Project Letters: No templates found. Check if project_letter_templates.js is loaded.');
            return;
        }

        D.templatesCatalog.innerHTML = '';
        Object.values(templates).forEach(tpl => {
            const item = document.createElement('div');
            item.className = 'template-item tool-card';
            item.style.padding = '10px';
            item.innerHTML = `
                <h5 style="margin: 0;">${tpl.name}</h5>
                <p style="font-size: 0.8em; color: #666; margin: 5px 0;">${tpl.category}</p>
                <button class="small-button use-template-btn" data-id="${tpl.id}" style="width: 100%;">Use</button>
            `;
            D.templatesCatalog.appendChild(item);
        });

        D.templatesCatalog.querySelectorAll('.use-template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tplId = e.target.dataset.id;
                const tpl = templates[tplId];
                if (tpl) {
                    D.subjectInput.value = tpl.subject;
                    D.contentBody.innerHTML = tpl.body.replace(/\n/g, '<br>');
                    switchSubTab('project-compose-letter');
                    updateWordCount();
                }
            });
        });

        console.log(`Project Letters: Rendered ${Object.keys(templates).length} templates`);
    }

    async function refreshRecipientHistory() {
        const list = document.getElementById('recipient-history-list'); // Shared datalist
        const history = await DB.getRecentRecipients(20);
        this._recipientHistory = history;
        // Datalist is global, so we don't necessarily need to refill it every time if it's already there, 
        // but it doesn't hurt.
        if (list) {
            list.innerHTML = history.map(r => `<option value="${r.name}">${r.company || ''}</option>`).join('');
        }
    }

    function handleRecipientInput(e) {
        const name = e.target.value;
        const match = (this._recipientHistory || []).find(r => r.name === name);
        if (match) {
            D.recipientDesignation.value = match.designation || '';
            D.recipientCompany.value = match.company || '';
            D.recipientAddress.value = match.address || '';
        }
    }

    function clearForm() {
        [D.recipientName, D.recipientDesignation, D.recipientCompany, D.recipientAddress, D.subjectInput].forEach(el => el.value = '');
        D.contentBody.innerHTML = '';
        updateStatusDisplay('New');
    }

    function renderPreview() {
        return getFullLetterHtml();
    }

    function populateTabData(project) {
        render();
    }

    return { init, render, renderPreview, populateTabData };
})();