export const InventoryModule = {
    init: (domElements, context) => {
        domElements.newBtn.addEventListener('click', () => InventoryModule.showModal(null, domElements, context));
        domElements.container.addEventListener('click', (e) => {
            if (e.target.closest('.edit-inventory-btn')) {
                const id = e.target.closest('.edit-inventory-btn').dataset.id;
                InventoryModule.showModal(id, domElements, context);
            }
        });

        domElements.modalElements.saveBtn.addEventListener('click', () => InventoryModule.handleSave(domElements.modalElements, context));
        domElements.modalElements.closeBtn.addEventListener('click', () => domElements.modalElements.modal.style.display = 'none');
    },

    render: async (jobNo, container) => {
        if (!jobNo || !container) return;
        const siteData = await window.DB.getSiteData(jobNo);
        const inventory = (siteData && siteData.inventoryLog) ? siteData.inventoryLog : [];

        if (inventory.length === 0) {
            container.innerHTML = '<p>No inventory or warranty items logged.</p>';
            return;
        }

        container.innerHTML = ''; // Clear container
        for (const item of inventory) {
            const div = document.createElement('div');
            div.className = 'detailed-log-item';

            const today = new Date();
            const endDate = item.dateEnd ? new Date(item.dateEnd) : null;
            let warrantyStatus = 'N/A';
            let headerColor = '#6c757d';

            if (endDate) {
                if (endDate < today) {
                    warrantyStatus = 'Expired';
                    headerColor = '#dc3545';
                } else {
                    warrantyStatus = `Active until ${item.dateEnd}`;
                    headerColor = '#28a745';
                }
            }

            let photoHtml = '';
            if (item.photoId) {
                const file = await window.DB.getFileById(item.photoId);
                if (file) photoHtml = `<img src="${file.dataUrl}" style="max-height: 80px; border-radius: 4px; margin-top: 10px;">`;
            }

            div.innerHTML = `
                <div class="log-header" style="border-left: 5px solid ${headerColor};">
                    <span>${item.item} (${item.type || 'N/A'})</span>
                    <span>Warranty: ${warrantyStatus}</span>
                </div>
                <div class="log-body">
                    <p>${item.description || 'No description.'}</p>
                    <p><strong>Supplier:</strong> ${item.supplier || 'N/A'} | <strong>Contact:</strong> ${item.contactPerson || 'N/A'} (${item.contactPhone || 'N/A'})</p>
                    ${photoHtml}
                    <hr>
                    <button class="secondary-button small-button edit-inventory-btn" data-id="${item.id}">Edit</button>
                </div>
            `;
            container.appendChild(div);
        }
    },

    showModal: async (itemId, domElements, context) => {
        const M = domElements.modalElements;
        const { currentJobNo } = context.getState();

        // Reset form
        Object.keys(M).forEach(key => {
            if (M[key].tagName === 'INPUT' || M[key].tagName === 'TEXTAREA') M[key].value = '';
        });

        M.title.textContent = 'New Inventory/Warranty Item';
        M.editId.value = '';

        if (itemId) {
            M.title.textContent = 'Edit Inventory/Warranty Item';
            const siteData = await window.DB.getSiteData(currentJobNo);
            const item = (siteData.inventoryLog || []).find(i => i.id === itemId);
            if (item) {
                M.editId.value = item.id;
                Object.keys(item).forEach(key => {
                    if (M[key]) M[key].value = item[key];
                });
            }
        }

        M.modal.style.display = 'flex';
    },

    handleSave: async (modalElements, context) => {
        const M = modalElements;
        const { currentJobNo } = context.getState();

        const item = M.item.value.trim();
        if (!item) return alert("Item Name is required.");

        const siteData = await window.DB.getSiteData(currentJobNo);
        if (!siteData.inventoryLog) siteData.inventoryLog = [];

        const id = M.editId.value;
        let inventoryItem = id ? siteData.inventoryLog.find(i => i.id === id) : null;
        if (!inventoryItem) {
            inventoryItem = { id: `INV-${Date.now()}` };
            siteData.inventoryLog.push(inventoryItem);
        }

        inventoryItem.item = item;
        inventoryItem.type = M.type.value.trim();
        inventoryItem.description = M.description.value.trim();
        inventoryItem.supplier = M.supplier.value.trim();
        inventoryItem.contactPerson = M.contactPerson.value.trim();
        inventoryItem.contactPhone = M.contactPhone.value.trim();
        inventoryItem.contactEmail = M.contactEmail.value.trim();
        inventoryItem.dateStart = M.dateStart.value;
        inventoryItem.dateEnd = M.dateEnd.value;

        const file = M.photo.files[0];
        if (file) {
            const dataUrl = await new Promise(r => { const reader = new FileReader(); reader.onload = e => r(e.target.result); reader.readAsDataURL(file); });
            const fileRecord = { jobNo: currentJobNo, source: 'site', type: 'inventory_photo', name: file.name, fileType: file.type, dataUrl };
            inventoryItem.photoId = await window.DB.addFile(fileRecord);
        }

        await window.DB.putSiteData(siteData);
        M.modal.style.display = 'none';
        context.onUpdate('inventory'); // Custom event or direct call
    }
};