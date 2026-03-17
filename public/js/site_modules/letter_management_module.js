/**
 * @module LetterManagementModule
 * Handles letter composition, drafts, sent history, and templates for site index.
 */

export const LetterManagementModule = {
    dom: {},
    currentDraftId: null,
    appContext: null,

    init(domElements, context) {
        this.dom = domElements;
        this.appContext = context;
        this.setupEventListeners();
    },

    setupEventListeners() {
        const D = this.dom;

        // Sub-tab switching
        D.letterSubTabs?.addEventListener('click', (e) => {
            if (!e.target.matches('.tab-button')) return;
            this.switchSubTab(e.target.dataset.subTab);
        });

        // Actions
        D.saveDraftBtn?.addEventListener('click', () => this.handleSaveDraft());
        D.previewBtn?.addEventListener('click', () => this.handlePreview(false));
        D.downloadPdfBtn?.addEventListener('click', () => this.handlePreview(true));
        D.markSentBtn?.addEventListener('click', () => this.handleMarkSent('Manual'));
        D.shareWaBtn?.addEventListener('click', () => this.handleMarkSent('WhatsApp'));
        D.shareEmailBtn?.addEventListener('click', () => this.handleMarkSent('Email'));
        D.shareOutlookBtn?.addEventListener('click', () => this.handleMarkSent('Outlook'));

        // Preview Modal
        D.closePreviewBtn?.addEventListener('click', () => D.previewModal.style.display = 'none');
        D.downloadPreviewPdfBtn?.addEventListener('click', () => this.handlePreview(true));

        // Editor events
        D.contentBody?.addEventListener('input', () => this.updateWordCount());

        // Recipient history
        D.recipientName?.addEventListener('input', (e) => this.handleRecipientInput(e));
    },

    async render(jobNo) {
        this.currentDraftId = null;
        this.clearForm();
        await this.updateCounts();
        await this.refreshRecipientHistory();
        this.renderTemplatesCatalog();
        this.updateWordCount();
    },

    switchSubTab(subTabId) {
        const D = this.dom;
        // Update buttons
        D.letterSubTabs.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.subTab === subTabId);
        });
        // Update panels
        document.querySelectorAll('#letter-management-tab .sub-tab-content').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${subTabId}-sub-tab`);
        });

        if (subTabId === 'draft-letters') this.renderDraftsTable();
        if (subTabId === 'sent-letters') this.renderSentLettersTable();
        if (subTabId === 'letter-templates') this.renderTemplatesCatalog();
    },

    async updateCounts() {
        const drafts = await window.DB.getAllLetterDrafts();
        const sent = await window.DB.getAllSentLetters();
        if (this.dom.draftCount) this.dom.draftCount.textContent = drafts.length;
        if (this.dom.sentCount) this.dom.sentCount.textContent = sent.length;
    },

    updateWordCount() {
        const text = this.dom.contentBody.textContent.trim();
        const count = text ? text.split(/\s+/).length : 0;
        if (this.dom.infoWordCount) this.dom.infoWordCount.textContent = count;
    },

    renderTemplatesCatalog() {
        const container = document.getElementById('templates-catalog');
        if (!container) {
            console.warn('Letter Management: templates-catalog container not found');
            return;
        }

        // Use SiteLetterTemplates if available, fallback to LetterTemplates
        const templates = window.SiteLetterTemplates?.LIST || window.LetterTemplates?.LIST || {};

        console.log('Letter Management: Loading templates', {
            hasSiteTemplates: !!window.SiteLetterTemplates,
            hasGenericTemplates: !!window.LetterTemplates,
            templateCount: Object.keys(templates).length
        });

        if (Object.keys(templates).length === 0) {
            container.innerHTML = `
                <p style="color: #888; text-align: center; padding: 20px;">
                    No templates available.<br>
                    <small>Please ensure site_letter_templates.js is loaded.</small><br>
                    <small>Check browser console for details.</small>
                </p>
            `;
            console.error('Letter Management: No templates found. Check if site_letter_templates.js is loaded.');
            return;
        }

        container.innerHTML = '';

        Object.values(templates).forEach(tpl => {
            const card = document.createElement('div');
            card.className = 'template-card';
            card.innerHTML = `
                <div>
                    <span class="badge info" style="font-size: 0.7em; margin-bottom: 5px; display: inline-block;">${tpl.category}</span>
                    <h4>${tpl.name}</h4>
                    <p>${tpl.description}</p>
                </div>
                <button class="small-button use-template-btn" data-id="${tpl.id}">Use Template</button>
            `;
            container.appendChild(card);
        });

        container.querySelectorAll('.use-template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tplId = e.target.dataset.id;
                this.loadTemplate(tplId);
                this.switchSubTab('compose-letter');
            });
        });

        console.log(`Letter Management: Rendered ${Object.keys(templates).length} templates`);
    },

    loadTemplate(templateId) {
        // Use SiteLetterTemplates if available, fallback to LetterTemplates
        const templates = window.SiteLetterTemplates?.LIST || window.LetterTemplates?.LIST || {};
        const tpl = templates[templateId];
        if (!tpl) return;

        this.dom.subjectInput.value = tpl.subject;
        this.dom.contentBody.innerHTML = tpl.body.replace(/\n/g, '<br>');
        this.updateWordCount();
        this.updateStatusDisplay('Draft');
    },

    async handleSaveDraft() {
        const D = this.dom;
        const draftData = {
            recipientName: D.recipientName.value,
            recipientDesignation: D.recipientDesignation.value,
            recipientCompany: D.recipientCompany.value,
            recipientAddress: D.recipientAddress.value,
            subject: D.subjectInput.value,
            contentBody: D.contentBody.innerHTML,
            timestamp: new Date().toISOString(),
            source: 'site'
        };

        if (this.currentDraftId !== null) {
            draftData.id = this.currentDraftId;
        }

        if (!draftData.recipientName && !draftData.subject) {
            alert("Please provide at least a recipient name or subject to save as draft.");
            return;
        }

        const id = await window.DB.putLetterDraft(draftData);
        this.currentDraftId = id;

        // Save to recipient history
        await window.DB.addRecentRecipient({
            name: draftData.recipientName,
            designation: draftData.recipientDesignation,
            company: draftData.recipientCompany,
            address: draftData.recipientAddress
        });
        await this.refreshRecipientHistory();

        alert("Draft saved successfully.");
        this.updateCounts();
        this.updateStatusDisplay('Draft');
    },

    async handlePreview(download = false) {
        const D = this.dom;
        const content = D.contentBody.innerHTML;
        const recipient = {
            name: D.recipientName.value,
            designation: D.recipientDesignation.value,
            company: D.recipientCompany.value,
            address: D.recipientAddress.value
        };
        const subject = D.subjectInput.value;

        if (!content) {
            alert("Letter content is empty.");
            return;
        }

        const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        // Use global logo if available
        const logo = typeof LOGO_BASE64 !== 'undefined' ? LOGO_BASE64 : '';
        const header = logo ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${logo}" alt="Logo" style="max-height: 80px;"></div>` : '';

        const html = `
            <div style="padding: 15mm; font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.5; color: #333;">
                ${header}
                <p style="text-align: right;">Date: ${date}</p>
                <br>
                <div style="margin-bottom: 20px;">
                    <p><b>To,</b></p>
                    <p><b>${recipient.name}</b></p>
                    <p>${recipient.designation}</p>
                    <p>${recipient.company}</p>
                    <p>${recipient.address}</p>
                </div>
                <p><b>Subject: ${subject}</b></p>
                <br>
                <div style="text-align: justify; min-height: 300px;">
                    ${content}
                </div>
                <br><br>
                <p>Sincerely,</p>
                <br>
                <p><b>Management</b></p>
                <p>IMMERSIVE ENGINEERING CONSULTANTS L.L.C</p>
            </div>
        `;

        D.previewArea.innerHTML = html;

        if (download) {
            await window.PDFGenerator.generate({
                previewId: 'letter-management-preview-area',
                fileName: `Letter_${recipient.name.replace(/\s+/g, '_')}_${Date.now()}`,
                pageSize: 'a4_portrait'
            });
        } else {
            D.previewModal.style.display = 'flex';
        }
    },

    async handleMarkSent(method) {
        const D = this.dom;
        const letterData = {
            recipientName: D.recipientName.value,
            subject: D.subjectInput.value,
            method: method,
            timestamp: new Date().toISOString(),
            source: 'site'
        };

        if (!letterData.recipientName || !letterData.subject) {
            alert("Please provide recipient name and subject before marking as sent.");
            return;
        }

        await window.DB.addSentLetter(letterData);

        // Save to recipient history
        await window.DB.addRecentRecipient({
            name: letterData.recipientName,
            designation: D.recipientDesignation.value,
            company: D.recipientCompany.value,
            address: D.recipientAddress.value
        });
        await this.refreshRecipientHistory();

        // Feature: WhatsApp Business Integration (Click-to-Chat)
        if (method === 'WhatsApp') {
            const phone = prompt("Enter WhatsApp phone number (with country code, e.g., 971501234567):");
            if (phone) {
                // Professional WhatsApp Message
                const message = `*OFFICIAL COMMUNICATION: Urban Axis*\n\nDear ${letterData.recipientName},\n\nPlease find the details regarding: *${letterData.subject}*\n\nFor more details, please check your email or contact our support.\n\nRegards,\n*IMMERSIVE ENGINEERING CONSULTANTS L.L.C*`;
                const waUrl = `https://wa.me/${phone.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`;
                window.open(waUrl, '_blank');
            }
        }
        else if (method === 'Email' || method === 'Outlook') {
            const email = prompt("Enter recipient email:");
            if (email) {
                const mailto = `mailto:${email}?subject=${encodeURIComponent(letterData.subject)}&body=${encodeURIComponent(D.contentBody.textContent)}`;
                window.location.href = mailto;
            }
        }

        alert(`Letter recorded as sent via ${method}.`);
        await this.updateCounts();
        this.updateStatusDisplay('Sent');
    },

    updateStatusDisplay(status) {
        if (!this.dom.infoStatus) return;
        this.dom.infoStatus.textContent = status.toLowerCase();
        this.dom.infoStatus.className = `badge ${status === 'Sent' ? 'success' : 'danger'}`;
    },

    async renderDraftsTable() {
        const drafts = await window.DB.getAllLetterDrafts();
        const tbody = this.dom.draftsListBody;
        if (!tbody) return;

        tbody.innerHTML = '';
        drafts.filter(d => d.source === 'site').reverse().forEach(d => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${new Date(d.timestamp).toLocaleDateString()}</td>
                <td>${d.recipientName || 'N/A'}</td>
                <td>${d.subject || 'N/A'}</td>
                <td>
                    <button class="small-button load-draft-btn" data-id="${d.id}">Load</button>
                    <button class="small-button danger del-draft-btn" data-id="${d.id}">Del</button>
                </td>
            `;
        });

        tbody.querySelectorAll('.load-draft-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = parseInt(e.target.dataset.id);
                const draftsAll = await window.DB.getAllLetterDrafts();
                const draft = draftsAll.find(x => x.id === id);
                if (draft) {
                    this.currentDraftId = draft.id;
                    this.dom.recipientName.value = draft.recipientName || '';
                    this.dom.recipientDesignation.value = draft.recipientDesignation || '';
                    this.dom.recipientCompany.value = draft.recipientCompany || '';
                    this.dom.recipientAddress.value = draft.recipientAddress || '';
                    this.dom.subjectInput.value = draft.subject || '';
                    this.dom.contentBody.innerHTML = draft.contentBody || '';
                    this.switchSubTab('compose-letter');
                    this.updateStatusDisplay('Draft');
                    this.updateWordCount();
                }
            });
        });

        tbody.querySelectorAll('.del-draft-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm("Delete this draft?")) {
                    await window.DB.deleteLetterDraft(parseInt(e.target.dataset.id));
                    this.renderDraftsTable();
                    this.updateCounts();
                }
            });
        });
    },

    async renderSentLettersTable() {
        const sent = await window.DB.getAllSentLetters();
        const tbody = this.dom.sentListBody;
        if (!tbody) return;

        tbody.innerHTML = '';
        sent.filter(s => s.source === 'site').reverse().forEach(s => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${new Date(s.timestamp).toLocaleString()}</td>
                <td>${s.recipientName}</td>
                <td>${s.subject}</td>
                <td><span class="badge info">${s.method}</span></td>
                <td><button class="small-button danger del-sent-btn" data-id="${s.id}">Del</button></td>
            `;
        });

        tbody.querySelectorAll('.del-sent-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm("Remove this log entry?")) {
                    await window.DB.deleteSentLetter(parseInt(e.target.dataset.id));
                    this.renderSentLettersTable();
                    this.updateCounts();
                }
            });
        });
    },

    clearForm() {
        const D = this.dom;
        D.recipientName.value = '';
        D.recipientDesignation.value = '';
        D.recipientCompany.value = '';
        D.recipientAddress.value = '';
        D.subjectInput.value = '';
        D.contentBody.innerHTML = '';
        this.updateStatusDisplay('New');
    },

    async refreshRecipientHistory() {
        const list = document.getElementById('recipient-history-list');
        if (!list) return;
        const history = await window.DB.getRecentRecipients(20);
        list.innerHTML = history.map(r => `<option value="${r.name}">${r.company || ''} - ${r.designation || ''}</option>`).join('');
        this._recipientHistory = history;
    },

    handleRecipientInput(e) {
        const name = e.target.value;
        const match = (this._recipientHistory || []).find(r => r.name === name);
        if (match) {
            if (this.dom.recipientDesignation) this.dom.recipientDesignation.value = match.designation || '';
            if (this.dom.recipientCompany) this.dom.recipientCompany.value = match.company || '';
            if (this.dom.recipientAddress) this.dom.recipientAddress.value = match.address || '';
        }
    }
};
