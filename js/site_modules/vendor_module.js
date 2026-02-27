
//--- START OF FILE vendor_module.js ---

export const VendorModule = {
    init: (domElements) => {
        if(domElements.searchInput) {
            domElements.searchInput.addEventListener('input', (e) => VendorModule.search(e.target.value, domElements.resultsContainer));
        }
        // Listener for "Add New Vendor" button
        const addBtn = document.getElementById('add-new-vendor-btn');
        if(addBtn) addBtn.addEventListener('click', () => VendorModule.showAddVendorModal());
    },

    // Mock Database for Vendors (In real app, fetch from DB)
    vendorsDB: [
        { id: 1, item: 'Ceramic Tiles', company: 'RAK Ceramics', contact: 'John Doe', phone: '050-1234567', email: 'sales@rak.ae', office: 'Dubai', price: '45 AED/m2', website: 'rakceramics.com', category: 'Finishes' },
        { id: 2, item: 'LED Downlights', company: 'Philips Lighting', contact: 'Jane Smith', phone: '055-9876543', email: 'contact@philips.ae', office: 'Abu Dhabi', price: '25 AED/pc', website: 'lighting.philips.ae', category: 'Electrical' }
    ],

    showAddVendorModal: (domElements) => {
        // Use the generic form modal for adding a new vendor to the master list
        const { formModal, formModalTitle, formModalBody, formSaveBtn } = window.DOMElements;
        if (!formSaveBtn) {
            console.error("Save Form Button not found in DOMElements. Caching might have failed.");
            return;
        }
        formModalTitle.textContent = "Add New Vendor to Master List";
        formModalBody.innerHTML = `
            <p>This adds a vendor to the global search list in the Tools tab.</p>
            <div class="input-group"><label>Category</label><input type="text" id="vendor-form-category" placeholder="e.g., Finishes, Electrical"></div>
            <div class="input-group"><label>Item Name</label><input type="text" id="vendor-form-item"></div>
            <div class="input-group"><label>Company Name</label><input type="text" id="vendor-form-company"></div>
            <div class="input-group-grid" style="grid-template-columns: 1fr 1fr;">
                <div class="input-group"><label>Contact Person</label><input type="text" id="vendor-form-contact"></div>
                <div class="input-group"><label>Phone No</label><input type="text" id="vendor-form-phone"></div>
            </div>
            <div class="input-group-grid" style="grid-template-columns: 1fr 1fr;">
                 <div class="input-group"><label>Email</label><input type="email" id="vendor-form-email"></div>
                 <div class="input-group"><label>Office Location</label><input type="text" id="vendor-form-office"></div>
            </div>
            <div class="input-group-grid" style="grid-template-columns: 1fr 1fr;">
                <div class="input-group"><label>Website</label><input type="text" id="vendor-form-website"></div>
                <div class="input-group"><label>Approx. Price</label><input type="text" id="vendor-form-price"></div>
            </div>
        `;
        formSaveBtn.style.display = 'block';
        formModal.style.display = 'flex';

        formSaveBtn.onclick = () => {
            const item = document.getElementById('vendor-form-item').value;
            const company = document.getElementById('vendor-form-company').value;
            if (!item || !company) {
                alert("Item Name and Company are required.");
                return;
            }
            
            VendorModule.vendorsDB.push({
                id: Date.now(),
                item: item,
                company: company,
                category: document.getElementById('vendor-form-category').value || 'General',
                contact: document.getElementById('vendor-form-contact').value,
                phone: document.getElementById('vendor-form-phone').value,
                email: document.getElementById('vendor-form-email').value,
                office: document.getElementById('vendor-form-office').value,
                website: document.getElementById('vendor-form-website').value,
                price: document.getElementById('vendor-form-price').value
            });

            alert("Vendor added to local master list.");
            formModal.style.display = 'none';
            // Trigger refresh
            const searchInput = document.getElementById('vendor-search-input');
            if(searchInput) VendorModule.search(searchInput.value, document.getElementById('vendor-search-results'));
        };
    },
    
    addNewVendor: () => {
        // Simple prompt based entry for demo
        const item = prompt("Item Name:");
        const company = prompt("Company Name:");
        const contact = prompt("Contact Person:");
        const phone = prompt("Phone No:");
        const price = prompt("Price (Approx):");
        
        if(item && company) {
            VendorModule.vendorsDB.push({
                id: Date.now(),
                item, company, contact, phone, 
                email: '-', office: '-', price: price || '-', website: '-', category: 'General'
            });
            alert("Vendor added locally.");
            // Trigger refresh if search is active
            const searchInput = document.getElementById('vendor-search-input');
            if(searchInput) VendorModule.search(searchInput.value, document.getElementById('vendor-search-results'));
        }
    },

    search: (searchTerm, container) => {
        if (!searchTerm) {
            VendorModule.renderResults([], container); // Clear results if search is empty
            return;
        }
        const term = searchTerm.toLowerCase();
        const results = VendorModule.vendorsDB.filter(v => 
            v.item.toLowerCase().includes(term) || 
            v.company.toLowerCase().includes(term) ||
            v.contact.toLowerCase().includes(term) ||
            v.category.toLowerCase().includes(term)
        );
        VendorModule.renderResults(results, container);
    },

    renderResults: (results, container) => {
        if (results.length === 0) {
            container.innerHTML = '<p>No matching vendors found.</p>';
            return;
        }
    
        let html = '<table class="output-table" style="width:100%; font-size: 0.9em; border-collapse:collapse;">';
        html += '<thead style="background:#f0f0f0;"><tr><th>Item Name</th><th>Product Details/Company</th><th>Contact Info</th><th>Office/Web</th><th>Price</th></tr></thead><tbody>';
        
        results.forEach(r => {
            html += `
                <tr style="border-bottom:1px solid #eee;">
                    <td><strong>${r.item}</strong><br><small>${r.category}</small></td>
                    <td>${r.company}<br><small>${r.website}</small></td>
                    <td>${r.contact}<br>${r.phone}<br><small>${r.email}</small></td>
                    <td>${r.office}</td>
                    <td>${r.price}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    }
};