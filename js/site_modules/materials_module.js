
// --- START OF FILE materials_module.js ---

export const MaterialsModule = {
    init: (domElements, context) => {
        if (domElements.newBtn) {
            domElements.newBtn.addEventListener('click', () => MaterialsModule.handleCreate(context, domElements));
        }

        const container = document.getElementById('material-approval-list');
        if (container) {
            container.addEventListener('click', (e) => {
                const approvalBtn = e.target.closest('.approval-action-btn');
                if (approvalBtn) {
                    MaterialsModule.handleApprovalClick(approvalBtn, context);
                }
            });
        }
    },

    render: async (jobNo, searchTerm = '') => {
        const targetContainer = document.getElementById('material-approval-list');
        if (!jobNo || !targetContainer) return;

        targetContainer.innerHTML = '';

        const siteData = await window.DB.getSiteData(jobNo);
        let mats = (siteData && siteData.materialLog) ? siteData.materialLog : [];
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            mats = mats.filter(mat =>
                (mat.ref && mat.ref.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (mat.item && mat.item.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (mat.supplier && mat.supplier.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (mat.date && mat.date.includes(lowerCaseSearchTerm))
            );
        }
        if (mats.length === 0) {
            targetContainer.innerHTML = '<p>No matching material submittals found.</p>';
            return;
        }

        mats.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(mat => {
            let headerColor = '#ffc107'; // Yellow
            if (mat.status === 'Approved') headerColor = '#28a745'; // Green
            else if (mat.status === 'Rejected' || mat.status === 'Not Approved') headerColor = '#dc3545'; // Red
            else if (mat.status === 'Revise & Resubmit') headerColor = '#007bff'; // Blue
            else if (mat.status === 'Closed') headerColor = '#6c757d'; // Grey

            const div = document.createElement('div');
            div.className = 'detailed-log-item';

            const genApprovalControls = (role, existingData, allRequired) => {
                if (!allRequired.includes(role)) return '';
                if (existingData) {
                    let btnClass = 'btn-pending';
                    if (existingData.status === 'Approved') btnClass = 'btn-approved';
                    else if (existingData.status === 'Approved as Noted') btnClass = 'btn-approved-noted';
                    else if (existingData.status === 'Revise & Resubmit') btnClass = 'btn-revise';
                    else if (existingData.status === 'Rejected' || existingData.status === 'Not Approved') btnClass = 'btn-rejected';
                    return `<button class="secondary-button small-button ${btnClass}" disabled>${existingData.status} by ${existingData.user}</button>`;
                } else {
                    return `
                        <div class="dropdown">
                            <button class="secondary-button small-button btn-pending">Review (${role})</button>
                            <div class="dropdown-content">
                                <a href="#" class="approval-action-btn" data-id="${mat.id}" data-role="${role}" data-type="material" data-status="Approved">Approve</a>
                                <a href="#" class="approval-action-btn" data-id="${mat.id}" data-role="${role}" data-type="material" data-status="Approved as Noted">Approve as Noted</a>
                                <a href="#" class="approval-action-btn" data-id="${mat.id}" data-role="${role}" data-type="material" data-status="Revise & Resubmit">Revise & Resubmit</a>
                                <a href="#" class="approval-action-btn" data-id="${mat.id}" data-role="${role}" data-type="material" data-status="Rejected">Reject</a>
                            </div>
                        </div>`;
                }
            };

            const apps = mat.approvals || {};
            const requiredApps = mat.requiredApprovals || ['Arch', 'Site Eng'];

            div.innerHTML = `
                <div class="log-header" style="border-left: 5px solid ${headerColor}">
                    <span>${mat.ref} : ${mat.item}</span>
                    <span>Status: ${mat.status} | Submitted: ${mat.date || ''}</span>
                </div>
                <div class="log-body">
                    <div style="margin-bottom:10px;"><strong>Supplier/Manufacturer:</strong> ${mat.supplier}</div><hr>
                    <strong>Approvals:</strong>
                    <div class="approval-grid">
                        ${genApprovalControls('Arch', apps.Arch, requiredApps)}
                        ${genApprovalControls('STR', apps.STR, requiredApps)}
                        ${genApprovalControls('MEP', apps.MEP, requiredApps)}
                        ${genApprovalControls('Site Eng', apps['Site Eng'], requiredApps)}
                    </div>
                </div>
            `;
            targetContainer.appendChild(div);
        });
    },

    handleApprovalClick: async (btn, context) => {
        const id = btn.dataset.id;
        const role = btn.dataset.role;
        const selectedStatus = btn.dataset.status;
        const { currentJobNo, currentUserRole } = context.getState();

        const password = prompt(`Enter Password for ${role} to confirm status '${selectedStatus}':`);
        if (!password) return;

        const isAuthenticated = await window.verifyAccess(currentJobNo, role, password);
        if (!isAuthenticated) {
            return alert("Invalid Password. Action canceled.");
        }

        const comment = prompt("Add a comment (optional):");
        const siteData = await window.DB.getSiteData(currentJobNo);
        const item = siteData.materialLog.find(m => m.id === id);

        if (item) {
            if (!item.approvals) item.approvals = {};
            item.approvals[role] = { user: currentUserRole, date: new Date().toISOString(), status: selectedStatus, comment: comment || '' };

            const required = item.requiredApprovals || [];
            const approvedCount = required.filter(r => item.approvals[r]?.status.startsWith('Approved')).length;
            const rejected = required.some(r => item.approvals[r]?.status === 'Rejected');

            if (rejected) { item.status = 'Rejected'; }
            else if (approvedCount === required.length) { item.status = 'Approved'; }
            else { item.status = 'Response Pending'; }

            await window.DB.putSiteData(siteData);
            MaterialsModule.render(currentJobNo); // Use its own render method
        }
    },

    // FIX [9]: Updated handleCreate to use a modal form
    handleCreate: async (context, domElements) => {
        const { currentJobNo } = context.getState();
        if (!currentJobNo) return alert("Please select a project first.");

        const { formModal, formModalTitle, formModalBody, formSaveBtn } = domElements;

        formModalTitle.textContent = "New Material Submittal";
        // Simple form for this example. Can be loaded from forms/material_submittal.html if it exists.
        formModalBody.innerHTML = `
            <div class="input-group"><label>Material / Item Name</label><input type="text" id="mat-form-item"></div>
            <div class="input-group"><label>Supplier / Manufacturer</label><input type="text" id="mat-form-supplier"></div>
            <div class="input-group"><label>Specification Reference</label><input type="text" id="mat-form-spec"></div>
        `;
        formSaveBtn.style.display = 'block';
        formModal.style.display = 'flex';

        formSaveBtn.onclick = async () => {
            const item = document.getElementById('mat-form-item').value;
            const supplier = document.getElementById('mat-form-supplier').value;
            if (!item || !supplier) {
                alert("Material Name and Supplier are required.");
                return;
            }

            const siteData = await window.DB.getSiteData(currentJobNo);
            if (!siteData.materialLog) siteData.materialLog = [];

            // FIX [1]: Prepend Job No to reference
            const newRef = `${currentJobNo}/MS-${String(siteData.materialLog.length + 1).padStart(3, '0')}`;

            siteData.materialLog.push({
                id: `MAT-${Date.now()}`, ref: newRef, item: item, supplier: supplier,
                date: new Date().toISOString().split('T')[0], status: 'Submitted',
                requiredApprovals: ['Arch', 'Site Eng'], approvals: {}
            });

            await window.DB.putSiteData(siteData);

            await window.DB.createScrumTaskFromSiteEvent(currentJobNo, {
                name: `Review Material: ${newRef} - ${item}`, department: 'Architectural',
                plannedDuration: 7, status: 'To Do'
            });

            alert(`Material Submittal ${newRef} has been logged.`);
            formModal.style.display = 'none';
            MaterialsModule.render(currentJobNo);
        };
    }
};