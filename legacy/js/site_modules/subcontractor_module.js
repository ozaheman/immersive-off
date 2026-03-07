
//--- START OF FILE subcontractor_module.js ---

export const SubcontractorModule = {
    init: (domElements, context) => {
        const addBtn = document.getElementById('add-subcontractor-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => SubcontractorModule.showModal(null, domElements, context));
        }

        const container = document.getElementById('subcontractor-list');
        if (container) {
            container.addEventListener('click', (e) => {
                if (e.target.classList.contains('edit-sub-btn')) {
                    const id = e.target.dataset.id;
                    SubcontractorModule.showModal(id, domElements, context);
                }
            });
        }

        domElements.saveBtn.addEventListener('click', () => SubcontractorModule.handleSave(domElements, context));
        domElements.deleteBtn.addEventListener('click', () => SubcontractorModule.handleDelete(domElements, context));
        domElements.closeBtn.addEventListener('click', () => domElements.modal.style.display = 'none');
    },

    render: async (jobNo, container, context, searchTerm = '') => {
        if (!jobNo || !container) return;

        const siteData = await window.DB.getSiteData(jobNo);
        let subs = (siteData && siteData.subcontractors) ? siteData.subcontractors : [];
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            subs = subs.filter(sub =>
                (sub.company && sub.company.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (sub.trade && sub.trade.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (sub.contact && sub.contact.toLowerCase().includes(lowerCaseSearchTerm))
            );
        }

        if (subs.length === 0) {
            container.innerHTML = '<p>No subcontractors added yet.</p>';
            return;
        }

        let html = '';
        for (const sub of subs) {
            let quotationHtml = 'No quotation uploaded.';
            if (sub.quotationFileId) {
                const file = await window.DB.getFileById(sub.quotationFileId);
                if (file) {
                    quotationHtml = `<a href="${file.dataUrl}" download="${file.name}" class="secondary-button small-button">Download Quotation</a>`;
                }
            }
            html += `
                <div class="detailed-log-item">
                    <div class="log-header" style="border-left: 5px solid #007bff">
                        <span>${sub.company}</span>
                        <span>Trade: <strong>${sub.trade}</strong></span>
                    </div>
                    <div class="log-body">
                        <p><strong>Contact:</strong> ${sub.contact || 'N/A'} <br>
                           <strong>Phone:</strong> ${sub.phone || 'N/A'} | <strong>Email:</strong> ${sub.email || 'N/A'}</p>
                        <p><strong>Address:</strong> ${sub.address || 'N/A'}</p>
                        <hr>
                        <div style="display:flex; justify-content: space-between; align-items: center;">
                             ${quotationHtml}
                            <button class="secondary-button small-button edit-sub-btn" data-id="${sub.id}">Edit</button>
                        </div>
                    </div>
                </div>`;
        }
        container.innerHTML = html;
    },

    showModal: async (subId, domElements, context) => {
        const { currentJobNo } = context.getState();
        if (!currentJobNo) return;

        // Reset form
        domElements.editId.value = '';
        domElements.company.value = '';
        domElements.trade.value = '';
        domElements.contact.value = '';
        domElements.phone.value = '';
        domElements.email.value = '';
        domElements.address.value = '';
        domElements.fileInput.value = '';
        domElements.existingFile.innerHTML = '';
        domElements.deleteBtn.style.display = 'none';

        if (subId) { // Editing existing
            const siteData = await window.DB.getSiteData(currentJobNo);
            const sub = siteData.subcontractors.find(s => s.id === subId);
            if (sub) {
                domElements.title.textContent = "Edit Subcontractor";
                domElements.editId.value = sub.id;
                domElements.company.value = sub.company;
                domElements.trade.value = sub.trade;
                domElements.contact.value = sub.contact;
                domElements.phone.value = sub.phone;
                domElements.email.value = sub.email;
                domElements.address.value = sub.address;
                domElements.deleteBtn.style.display = 'inline-block';

                if (sub.quotationFileId) {
                    const file = await window.DB.getFileById(sub.quotationFileId);
                    if (file) {
                        domElements.existingFile.innerHTML = `Current file: <strong>${file.name}</strong>`;
                    }
                }
            }
        } else { // Adding new
            domElements.title.textContent = "Add New Subcontractor";
        }

        domElements.modal.style.display = 'flex';
    },

    handleSave: async (domElements, context) => {
        const { currentJobNo } = context.getState();
        if (!currentJobNo) return;

        const id = domElements.editId.value;
        const company = domElements.company.value.trim();
        const trade = domElements.trade.value.trim();

        if (!company || !trade) {
            return alert("Company Name and Trade are required.");
        }

        const siteData = await window.DB.getSiteData(currentJobNo);
        if (!siteData.subcontractors) siteData.subcontractors = [];

        let sub = id ? siteData.subcontractors.find(s => s.id === id) : null;
        if (!sub) {
            sub = { id: `SUB-${Date.now()}` };
            siteData.subcontractors.push(sub);
        }

        sub.company = company;
        sub.trade = trade;
        sub.contact = domElements.contact.value.trim();
        sub.phone = domElements.phone.value.trim();
        sub.email = domElements.email.value.trim();
        sub.address = domElements.address.value.trim();

        // Handle file upload
        const file = domElements.fileInput.files[0];
        if (file) {
            const dataUrl = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
            const fileRecord = { jobNo: currentJobNo, source: 'site', type: 'subcontractor_quote', name: file.name, fileType: file.type, dataUrl, timestamp: new Date().toISOString() };

            // If replacing an old file, you might want to delete it. For simplicity, we just overwrite the ID.
            sub.quotationFileId = await window.DB.addFile(fileRecord);
        }

        await window.DB.putSiteData(siteData);
        domElements.modal.style.display = 'none';
        if (context.onUpdate) context.onUpdate('subcontractors');
    },

    handleDelete: async (domElements, context) => {
        const { currentJobNo } = context.getState();
        const id = domElements.editId.value;
        if (!currentJobNo || !id) return;

        if (confirm("Are you sure you want to delete this subcontractor?")) {
            const siteData = await window.DB.getSiteData(currentJobNo);
            const index = siteData.subcontractors.findIndex(s => s.id === id);
            if (index > -1) {
                // Optionally delete associated file here
                siteData.subcontractors.splice(index, 1);
                await window.DB.putSiteData(siteData);
                domElements.modal.style.display = 'none';
                if (context.onUpdate) context.onUpdate('subcontractors');
            }
        }
    }
};