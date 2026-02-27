export const MomModule = {
    init: (domElements, context) => {
        if (domElements.newBtn) {
            domElements.newBtn.addEventListener('click', () => {
                const { currentJobNo } = context.getState();
                if (!currentJobNo) return alert("Select a project first.");
                MomModule.openModal(null, currentJobNo, domElements.modalElements);
            });
        }

        if (domElements.listContainer) {
            domElements.listContainer.addEventListener('click', e => {
                const editBtn = e.target.closest('.edit-mom-btn');
                const previewBtn = e.target.closest('.preview-mom-btn');

                if (editBtn) {
                    const { jobNo, index } = editBtn.dataset;
                    MomModule.openModal(parseInt(index), jobNo, domElements.modalElements);
                } else if (previewBtn) {
                    const { jobNo, index } = previewBtn.dataset;
                    MomModule.renderPreview(jobNo, parseInt(index), domElements.previewElements, domElements.modalElements);
                }
            });
        }

        const modalElements = domElements.modalElements;
        if (modalElements && modalElements.modal) {
            modalElements.closeBtn?.addEventListener('click', () => MomModule.closeModal(modalElements));
            modalElements.saveMomDataBtn?.addEventListener('click', () => MomModule.saveData(context, modalElements));
            modalElements.addAttendeeBtn?.addEventListener('click', () => MomModule.addAttendeeRow(modalElements.attendeesBody));
            modalElements.addActionBtn?.addEventListener('click', () => MomModule.addActionRow(modalElements.actionsBody));
        }

        const previewElements = domElements.previewElements;
        if (previewElements && previewElements.modal) {
            previewElements.closeBtn?.addEventListener('click', () => previewElements.modal.style.display = 'none');

            // Event delegation for preview modal footer buttons
            previewElements.footer?.addEventListener('click', async (e) => { // Make async
                const button = e.target.closest('button');
                if (!button) return;

                const { jobNo, index } = button.dataset;
                if (!jobNo || index === undefined) return;
                const momIndex = parseInt(index);

                if (button.id === 'edit-this-mom-btn') {
                    previewElements.modal.style.display = 'none';
                    MomModule.openModal(momIndex, jobNo, domElements.modalElements);
                } else if (button.id === 'copy-mom-btn') {
                    previewElements.modal.style.display = 'none';
                    await MomModule.copyToNew(jobNo, momIndex, domElements.modalElements);
                } else if (button.id === 'print-mom-btn') {
                    // FIX: Use PDF Generator instead of window.print()
                    const project = await window.DB.getProject(jobNo);
                    const siteData = await window.DB.getSiteData(jobNo);
                    const momData = siteData.mom[momIndex];

                    if (window.PDFGenerator) {
                        window.PDFGenerator.generate({
                            previewId: 'mom-preview-modal-body',
                            projectJobNo: jobNo,
                            pageSize: 'a4_portrait',
                            fileName: `MoM_${(momData.ref || 'Untitled').replace(/[\\/]/g, '-')}_${momData.date}`,
                            watermarkData: ['CONFIDENTIAL', project.projectDescription]
                        });
                    } else {
                        alert("PDF Generator is not available.");
                    }
                }
            });
        }
    },
    renderList: async (jobNo, containerElement, searchTerm = '') => {
        containerElement.innerHTML = '';
        if (!jobNo) return;

        const siteData = await window.DB.getSiteData(jobNo);
        let moms = (siteData && siteData.mom) ? siteData.mom : [];

        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            moms = moms.filter(mom =>
                (mom.ref && mom.ref.toLowerCase().includes(lowerSearchTerm)) ||
                (mom.date && mom.date.includes(lowerSearchTerm)) ||
                (mom.summary && mom.summary.toLowerCase().includes(lowerSearchTerm))
            );
        }

        if (moms.length === 0) {
            containerElement.innerHTML = '<p>No MoM recorded.</p>';
            return;
        }

        const sortedMom = [...moms].sort((a, b) => new Date(b.date) - new Date(a.date));

        const listHtml = sortedMom.map(mom => {
            const originalIndex = siteData.mom.indexOf(mom);
            return `
                <li class="mom-list-item">
                    <span class="mom-list-info">
                        <strong>${new Date(mom.date).toLocaleDateString()} (Ref: ${mom.ref || 'N/A'}) - ${mom.progress || 0}%</strong>
                        <br><small>${(mom.summary || '').substring(0, 80)}...</small>
                    </span>
                    <div>
                        <button class="secondary-button small-button edit-mom-btn" data-index="${originalIndex}" data-job-no="${jobNo}">Edit</button>
                        <button class="secondary-button small-button preview-mom-btn" data-index="${originalIndex}" data-job-no="${jobNo}">View</button>
                    </div>
                </li>`;
        }).join('');

        containerElement.innerHTML = `<ul class="mom-history-list">${listHtml}</ul>`;
    },

    renderTaskFollowUp: async (jobNo, containerElement) => {
        if (!jobNo || !containerElement) return;
        const siteData = await window.DB.getSiteData(jobNo);
        let tasksHtml = '';
        let tasksFound = false;
        const siteMoms = (siteData && siteData.mom) ? siteData.mom : [];
        siteMoms.forEach((mom, momIdx) => {
            (mom.actions || []).forEach((action) => {
                if (action.by && action.status && action.desc && action.status.toLowerCase() !== 'closed') {
                    tasksFound = true;
                    tasksHtml += `
                        <div class="mom-list-item" style="background: #fff;">
                            <span class="mom-list-info">
                                <strong style="white-space: pre-wrap;">Action: ${action.desc}</strong>
                                <br><small>Due: ${action.date || 'N/A'} | By: ${action.by} | Status: ${action.status}</small>
                            </span>
                            <button class="secondary-button small-button preview-mom-btn" data-index="${momIdx}" data-job-no="${jobNo}">View MoM</button>
                        </div>`;
                }
            });
        });
        containerElement.innerHTML = tasksFound ? `<h5 style="margin-top:10px;">Action Item Follow-up</h5>${tasksHtml}` : '<p>No open action items found.</p>';
    },

    openModal: async (index, jobNo, domElements) => {
        const isNew = index === null;
        domElements.title.textContent = isNew ? "Create New MoM" : "Edit MoM";
        domElements.editIndex.value = isNew ? '' : index;
        domElements.deleteBtn.style.display = isNew ? 'none' : 'inline-block';

        ['ref', 'summary', 'nextDate', 'lookAhead', 'materials'].forEach(key => { if (domElements[key]) domElements[key].value = ''; });
        domElements.date.value = new Date().toISOString().split('T')[0];
        domElements.location.value = 'Site Office';
        domElements.attendeesBody.innerHTML = '';
        domElements.actionsBody.innerHTML = '';
        domElements.nextNotes.value = '(To be confirmed a day before)';

        const siteData = await window.DB.getSiteData(jobNo);

        if (isNew) {
            const newRef = `${jobNo}/MOM-${String((siteData.mom || []).length + 1).padStart(3, '0')}`;
            domElements.ref.value = newRef;
        }

        let momDataToLoad = null;
        if (domElements._prefillData) {
            momDataToLoad = domElements._prefillData;
            delete domElements._prefillData;
        } else if (!isNew) {
            momDataToLoad = siteData.mom[index];
        }

        if (momDataToLoad) {
            Object.keys(momDataToLoad).forEach(key => {
                if (domElements[key] && momDataToLoad[key]) domElements[key].value = momDataToLoad[key];
            });
            domElements.nextDate.value = momDataToLoad.nextMeeting || '';
            domElements.nextNotes.value = momDataToLoad.nextMeetingNotes || '';
            (momDataToLoad.attendees || []).forEach(p => MomModule.addAttendeeRow(domElements.attendeesBody, p.name, p.position, p.company));
            (momDataToLoad.actions || []).forEach(a => MomModule.addActionRow(domElements.actionsBody, a.desc, a.by, a.date, a.status));
        }

        if (isNew || domElements._prefillData) {
            domElements.lookAhead.value = await MomModule.generateLookAhead(jobNo);
            domElements.progress.value = siteData.progress || 0;
        }

        domElements.modal.style.display = 'flex';
    },

    generateLookAhead: async (jobNo) => {
        if (!window.getProjectSchedule) return "Schedule logic not available.";
        try {
            const project = await window.DB.getProject(jobNo);
            const siteData = await window.DB.getSiteData(jobNo);
            const tasks = await window.getProjectSchedule(project, siteData);

            const today = new Date();
            const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

            const upcoming = tasks.filter(t => {
                if (!t.start || !t.end) return false;
                const start = new Date(t.start);
                const end = new Date(t.end);
                return (start <= twoWeeksLater && end >= today);
            });

            if (upcoming.length === 0) return "No scheduled tasks found for the next 2 weeks.";
            return upcoming.map((t, i) => `${i + 1}. ${t.name} (Ends: ${t.end})`).join('\n');
        } catch (e) {
            return "Could not load schedule data.";
        }
    },

    saveData: async (context, domElements) => {
        const { currentJobNo } = context.getState();
        if (!currentJobNo) return;

        let momData;
        try {
            momData = {
                ref: domElements.ref.value, date: domElements.date.value, location: domElements.location.value,
                progress: domElements.progress.value, lookAhead: domElements.lookAhead.value, materials: domElements.materials.value,
                summary: domElements.summary.value, nextMeeting: domElements.nextDate.value, nextMeetingNotes: domElements.nextNotes.value,
                attendees: Array.from(domElements.attendeesBody.rows).map(r => ({ name: r.cells[0].querySelector('input').value, position: r.cells[1].querySelector('input').value, company: r.cells[2].querySelector('input').value })),
                actions: Array.from(domElements.actionsBody.rows).map(r => ({ desc: r.cells[0].querySelector('textarea').value, by: r.cells[1].querySelector('input').value, date: r.cells[2].querySelector('input').value, status: r.cells[3].querySelector('input').value }))
            };
        } catch (e) {
            console.error("Error collecting MoM data from form:", e);
            alert("Could not save MoM. An error occurred while reading the form data. Please check the console for details.");
            return;
        }

        try {
            const siteData = await window.DB.getSiteData(currentJobNo);
            siteData.mom = siteData.mom || [];
            const index = domElements.editIndex.value;

            if (index === '') {
                siteData.mom.push(momData);
            } else {
                siteData.mom[parseInt(index)] = momData;
            }

            siteData.progress = domElements.progress.value;

            await window.DB.putSiteData(siteData);
            domElements.modal.style.display = 'none';
            alert("Minutes of Meeting saved successfully.");
            if (context.onUpdate) context.onUpdate('mom');
        } catch (e) {
            console.error("Error saving MoM to database:", e);
            alert("Failed to save MoM to the database. Please check the console for details.");
        }
    },

    addAttendeeRow: (tbody, name = '', pos = '', comp = '') => {
        const row = tbody.insertRow();
        row.innerHTML = `<td><input type="text" value="${name}"></td><td><input type="text" value="${pos}"></td><td><input type="text" value="${comp}"></td><td><button class="small-button danger-button" onclick="this.closest('tr').remove()">✕</button></td>`;
    },

    addActionRow: (tbody, desc = '', by = '', date = '', status = '') => {
        const row = tbody.insertRow();
        row.innerHTML = `<td><textarea>${desc}</textarea></td><td><input type="text" value="${by}"></td><td><input type="date" value="${date}"></td><td><input type="text" value="${status}"></td><td><button class="small-button danger-button" onclick="this.closest('tr').remove()">✕</button></td>`;
    },

    renderPreview: async (jobNo, momIndex, previewElements, modalElements) => {
        if (!jobNo || momIndex === null) return;
        const project = await DB.getProject(jobNo);
        const siteData = await DB.getSiteData(jobNo);
        const momData = siteData.mom[momIndex];

        if (!project || !momData || !previewElements.body) return;

        let htmlContent = `
            <div class="printable-area">
                <h3>${project.projectDescription}</h3>
                <p><strong>Ref:</strong> ${momData.ref} | <strong>Date:</strong> ${momData.date} | <strong>Progress:</strong> ${momData.progress || 0}%</p>
                <hr>
                <h4>Attendees</h4>
                <ul>${(momData.attendees || []).map(a => `<li>${a.name} (${a.company || 'N/A'})</li>`).join('')}</ul>
                
                <div style="display:flex; gap:20px; margin-top:15px;">
                    <div style="flex:1;">
                        <h4>Summary / Status</h4>
                        <p style="white-space: pre-wrap;">${momData.summary || 'No summary.'}</p>
                    </div>
                    <div style="flex:1;">
                        <h4>Look Ahead</h4>
                        <p style="white-space: pre-wrap;">${momData.lookAhead || 'No look ahead provided.'}</p>
                        <h4>Required Materials</h4>
                        <p style="white-space: pre-wrap;">${momData.materials || 'None listed.'}</p>
                    </div>
                </div>

                <h4>Action Items</h4>
                <table class="mom-table" style="width:100%">
                    <thead><tr><th>Description</th><th>Action By</th><th>Due Date</th><th>Status</th></tr></thead>
                    <tbody>${(momData.actions || []).map(a => `<tr><td style="white-space: pre-wrap;">${a.desc}</td><td>${a.by}</td><td>${a.date}</td><td>${a.status}</td></tr>`).join('')}</tbody>
                </table>
            </div>
        `;

        previewElements.body.innerHTML = htmlContent;
        previewElements.title.textContent = `Preview: MoM Ref ${momData.ref || 'N/A'}`;

        previewElements.footer.innerHTML = `
            <button id="edit-this-mom-btn" class="secondary-button" data-job-no="${jobNo}" data-index="${momIndex}">Edit</button>
            <button id="copy-mom-btn" class="secondary-button" data-job-no="${jobNo}" data-index="${momIndex}">Copy to New</button>
            <button id="print-mom-btn" class="primary-button" data-job-no="${jobNo}" data-index="${momIndex}">Print as PDF</button>
        `;

        previewElements.modal.style.display = 'flex';
    },

    copyToNew: async (jobNo, index, formDomElements) => {
        const siteData = await DB.getSiteData(jobNo);
        const oldMom = siteData.mom[index];
        if (!oldMom) return;

        // Carry over only open action items
        const openActions = (oldMom.actions || []).filter(a => a.status && a.status.toLowerCase() !== 'closed');

        const prefillData = {
            ...oldMom, // Copy all fields like attendees, location, etc.
            ref: '', // Will be generated in openModal
            date: new Date().toISOString().split('T')[0], // Set to today
            actions: openActions, // Only carry over open actions
            summary: '' // Clear the summary for the new meeting
        };

        // Use a temporary property to pass data to the modal opener
        formDomElements._prefillData = prefillData;
        MomModule.openModal(null, jobNo, formDomElements);
    },

    closeModal: (domElements) => {
        if (domElements && domElements.modal) {
            domElements.modal.style.display = 'none';
        }
    }
};