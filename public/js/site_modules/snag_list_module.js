export const SnagListModule = {
    init: (domElements, context) => {
        domElements.newBtn.addEventListener('click', () => SnagListModule.showModal(null, domElements.modalElements, context));
        domElements.container.addEventListener('click', (e) => {
            if (e.target.closest('.edit-snag-btn')) {
                const id = e.target.closest('.edit-snag-btn').dataset.id;
                SnagListModule.showModal(id, domElements.modalElements, context);
            }
        });

        domElements.modalElements.saveBtn.addEventListener('click', () => SnagListModule.handleSave(domElements.modalElements, context));
        domElements.modalElements.closeBtn.addEventListener('click', () => domElements.modalElements.modal.style.display = 'none');
    },

    render: async (jobNo, container) => {
        if (!jobNo || !container) return;
        const siteData = await window.DB.getSiteData(jobNo);
        const snags = (siteData && siteData.snagList) ? siteData.snagList : [];

        if (snags.length === 0) {
            container.innerHTML = '<p>No snags recorded for this project.</p>';
            return;
        }

        container.innerHTML = ''; // Clear
        for (const snag of snags) {
            const div = document.createElement('div');
            div.className = 'detailed-log-item';

            let status = 'Open';
            let headerColor = '#dc3545'; // Red for open
            if (snag.dateResolved) {
                status = 'Closed';
                headerColor = '#28a745'; // Green for closed
            }

            let photoIssueHtml = '';
            if (snag.photoIssueId) {
                const file = await window.DB.getFileById(snag.photoIssueId);
                if (file) photoIssueHtml = `<img src="${file.dataUrl}" style="max-width: 100px; margin-right: 10px;">`;
            }
            let photoResolvedHtml = '';
            if (snag.photoResolvedId) {
                const file = await window.DB.getFileById(snag.photoResolvedId);
                if (file) photoResolvedHtml = `<img src="${file.dataUrl}" style="max-width: 100px;">`;
            }

            div.innerHTML = `
                <div class="log-header" style="border-left: 5px solid ${headerColor};">
                    <span>${snag.item}</span>
                    <span>Status: ${status} | Criticality: ${snag.criticality}</span>
                </div>
                <div class="log-body">
                    <p><strong>Description:</strong> ${snag.description}</p>
                    <div style="display:flex; align-items:flex-start;">
                        ${photoIssueHtml}
                        ${photoResolvedHtml}
                    </div>
                    <p><small>Spotted by ${snag.byWhom} on ${snag.dateSpotted}. To be rectified via ${snag.method}.</small></p>
                    <hr>
                    <button class="secondary-button small-button edit-snag-btn" data-id="${snag.id}">Edit / Resolve</button>
                </div>
            `;
            container.appendChild(div);
        }
    },

    showModal: async (snagId, modalElements, context) => {
        const M = modalElements;
        const { currentJobNo } = context.getState();

        Object.keys(M).forEach(key => { if (M[key].tagName === 'INPUT' || M[key].tagName === 'TEXTAREA') M[key].value = ''; });

        M.title.textContent = 'New Snag Item';
        M.editId.value = '';
        M.dateSpotted.value = new Date().toISOString().split('T')[0];

        if (snagId) {
            M.title.textContent = 'Edit Snag Item';
            const siteData = await window.DB.getSiteData(currentJobNo);
            const snag = (siteData.snagList || []).find(s => s.id === snagId);
            if (snag) {
                M.editId.value = snag.id;
                Object.keys(snag).forEach(key => {
                    if (M[key]) M[key].value = snag[key];
                });
            }
        }
        M.modal.style.display = 'flex';
    },

    handleSave: async (modalElements, context) => {
        const M = modalElements;
        const { currentJobNo } = context.getState();
        const item = M.item.value.trim();
        if (!item) return alert("Item/Location is required.");

        const siteData = await window.DB.getSiteData(currentJobNo);
        if (!siteData.snagList) siteData.snagList = [];

        const id = M.editId.value;
        let snagItem = id ? siteData.snagList.find(s => s.id === id) : null;
        if (!snagItem) {
            snagItem = { id: `SNAG-${Date.now()}` };
            siteData.snagList.push(snagItem);
        }

        // Update all fields
        snagItem.item = item;
        snagItem.dateSpotted = M.dateSpotted.value;
        snagItem.description = M.description.value.trim();
        snagItem.criticality = M.criticality.value;
        snagItem.byWhom = M.byWhom.value.trim();
        snagItem.method = M.method.value.trim();
        snagItem.dateResolved = M.dateResolved.value;
        snagItem.byEng = M.byEng.value.trim();

        // Handle file uploads
        const issueFile = M.photoIssue.files[0];
        if (issueFile) {
            const dataUrl = await new Promise(r => { const reader = new FileReader(); reader.onload = e => r(e.target.result); reader.readAsDataURL(issueFile); });
            const fileRecord = { jobNo: currentJobNo, source: 'site', type: 'snag_photo', name: issueFile.name, fileType: issueFile.type, dataUrl };
            snagItem.photoIssueId = await window.DB.addFile(fileRecord);
        }
        const resolvedFile = M.photoResolved.files[0];
        if (resolvedFile) {
            const dataUrl = await new Promise(r => { const reader = new FileReader(); reader.onload = e => r(e.target.result); reader.readAsDataURL(resolvedFile); });
            const fileRecord = { jobNo: currentJobNo, source: 'site', type: 'snag_photo', name: resolvedFile.name, fileType: resolvedFile.type, dataUrl };
            snagItem.photoResolvedId = await window.DB.addFile(fileRecord);
        }

        await window.DB.putSiteData(siteData);
        M.modal.style.display = 'none';
        context.onUpdate('snags');
    },
};