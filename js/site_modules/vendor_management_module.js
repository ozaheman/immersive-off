//--- START OF FILE vendor_management_module.js ---


export const VendorManagementModule = {
    init: (context) => {
        const searchInput = document.getElementById('vendor-master-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => VendorManagementModule.renderMasterVendorSearch(e.target.value));
        }

        const tab = document.getElementById('vendor-lists-tab');
        if (tab) {
            tab.addEventListener('click', (e) => VendorManagementModule.handleActions(e, context));
        }
    },

    render: async (jobNo) => {
        if (!jobNo) return;
        const siteData = await window.DB.getSiteData(jobNo);
        VendorManagementModule.renderProjectVendorList((siteData && siteData.selectedVendors) ? siteData.selectedVendors : []);
    },

    renderProjectVendorList: (selectedVendors) => {
        const tbody = document.getElementById('project-vendor-list-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!selectedVendors || selectedVendors.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No vendors assigned to this project yet.</td></tr>';
            return;
        }

        selectedVendors.forEach((vendor, index) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${vendor.category || 'N/A'}</td>
                <td>${vendor.item || 'N/A'}</td>
                <td>${vendor.manufacturer || 'N/A'}</td>
                <td><button class="remove-vendor-btn danger-button small-button" data-index="${index}">Remove</button></td>
            `;
        });
    },

    renderMasterVendorSearch: (searchTerm = '') => {
        const tbody = document.getElementById('vendor-search-results-body');
        if (!tbody || typeof VENDOR_LIST === 'undefined') return;

        const lowerCaseSearchTerm = searchTerm.trim().toLowerCase();

        if (lowerCaseSearchTerm.length < 2) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Type 2 or more characters...</td></tr>';
            return;
        }

        let htmlContent = '';
        let resultsFound = false;

        for (const category in VENDOR_LIST) {
            VENDOR_LIST[category].forEach(item => {
                item.manufacturers.forEach(manufacturer => {
                    const itemMatch = item.item.toLowerCase().includes(lowerCaseSearchTerm);
                    const manufacturerMatch = manufacturer.toLowerCase().includes(lowerCaseSearchTerm);
                    const categoryMatch = category.toLowerCase().includes(lowerCaseSearchTerm);

                    if (itemMatch || manufacturerMatch || categoryMatch) {
                        resultsFound = true;
                        const escCategory = category.replace(/"/g, '&quot;');
                        const escItem = item.item.replace(/"/g, '&quot;');
                        const escManufacturer = manufacturer.replace(/"/g, '&quot;');

                        htmlContent += `
                            <tr>
                                <td>${category}</td>
                                <td>${item.item}</td>
                                <td>${manufacturer}</td>
                                <td><button class="add-vendor-btn secondary-button small-button" data-category="${escCategory}" data-item="${escItem}" data-manufacturer="${escManufacturer}">+ Add</button></td>
                            </tr>`;
                    }
                });
            });
        }

        tbody.innerHTML = resultsFound ? htmlContent : '<tr><td colspan="4" style="text-align: center;">No vendors found.</td></tr>';
    },

    handleActions: async (e, context) => {
        const { currentJobNo } = context.getState();
        if (!currentJobNo) return;

        if (e.target.matches('.add-vendor-btn')) {
            const button = e.target;
            const newVendor = {
                category: button.dataset.category,
                item: button.dataset.item,
                manufacturer: button.dataset.manufacturer
            };

            const siteData = await window.DB.getSiteData(currentJobNo);
            if (!siteData.selectedVendors) siteData.selectedVendors = [];

            siteData.selectedVendors.push(newVendor);

            await window.DB.putSiteData(siteData);
            if (context.onUpdate) context.onUpdate('vendor-management');
        } else if (e.target.matches('.remove-vendor-btn')) {
            const indexToRemove = parseInt(e.target.dataset.index, 10);

            const siteData = await window.DB.getSiteData(currentJobNo);
            if (siteData.selectedVendors?.[indexToRemove]) {
                siteData.selectedVendors.splice(indexToRemove, 1);
                await window.DB.putSiteData(siteData);
                if (context.onUpdate) context.onUpdate('vendor-management');
            }
        }
    }
};