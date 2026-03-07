/* START OF FILE js/site_modules/long_lead_module.js */

export const LongLeadModule = {
    
    init: (context) => {
        // No specific init needed for this version
         const container = document.getElementById('long-lead-table-body');
        if(container) {
            container.addEventListener('blur', (e) => {
                if(e.target.hasAttribute('contenteditable')) {
                    LongLeadModule.handleEdit(e, context);
                }
            }, true);
        }
        // Listener for the new "Add Item" button
        document.getElementById('ll-add-btn')?.addEventListener('click', () => LongLeadModule.handleAddLongLeadItem(context));
    },
getReportData: (schedule, boq, longLeadLog = {}) => {
        const keywords = ['marble', 'tile', 'joinery', 'sanitary', 'kitchen', 'facade', 'cladding', 'glazing', 'paint', 'doors', 'windows', 'ac', 'hvac', 'pergola', 'lift', 'elevator'];
        const longLeadItems = new Map();
// Add manually logged items first
        Object.entries(longLeadLog).forEach(([id, logEntry]) => {
             if (logEntry.source === 'Manual') {
                 longLeadItems.set(id, {
                     id,
                     name: logEntry.name,
                     requiredOnSite: logEntry.requiredOnSite || 'N/A',
                     source: 'Manual',
                     log: logEntry
                 });
             }
        });
        if (schedule) {
            schedule.forEach(task => {
                if (keywords.some(kw => task.name.toLowerCase().includes(kw))) {
                    const id = `task-${task.id}`;
                    if (!longLeadItems.has(id)) {
                        longLeadItems.set(id, { id, name: task.name, requiredOnSite: task.start, source: 'Schedule', log: longLeadLog[id] || {} });
                    }
                }
            });
        }

        if (boq) {
            boq.forEach(item => {
                if (keywords.some(kw => item.description.toLowerCase().includes(kw))) {
                    const id = `boq-${item.id || item.description.slice(0, 10)}`;
                    if (!longLeadItems.has(id)) {
                         longLeadItems.set(id, { id, name: item.description, requiredOnSite: 'N/A', source: 'BOQ', log: longLeadLog[id] || {} });
                    }
                }
            });
        }
        return Array.from(longLeadItems.values());
    },
    render: async (schedule, boq, context) => {
        const container = document.getElementById('long-lead-table-body');
        if (!container) return;

        const { currentJobNo } = context.getState();
        const siteData = await window.DB.getSiteData(currentJobNo);
        
        const itemsArray = LongLeadModule.getReportData(schedule, boq, siteData.longLeadLog);

        if (itemsArray.length === 0) {
            container.innerHTML = '<tr><td colspan="8">No specific long-lead finishing items found in the , BOQ, or manual entries.</td></tr>'//;
           // return;
       // }

        /*container.innerHTML = itemsArray.map(item => {
            const log = item.log || {};
            const procurementDays = log.procurementDays || 90;
            let procurementStart = 'N/A';
            if(item.requiredOnSite !== 'N/A') {
                const requiredDate = new Date(item.requiredOnSite);
                requiredDate.setDate(requiredDate.getDate() - procurementDays);
                procurementStart = requiredDate.toISOString().split('T')[0];
            }

            return `
                <tr data-id="${item.id}">
                    <td>${item.name}</td>
                    <td data-field="procurementDays" contenteditable="true">${procurementDays}</td>
                    <td>${procurementStart}</td>
                    <td data-field="submittalDate" contenteditable="true">${log.submittalDate || ''}</td>
                    <td data-field="approvalDate" contenteditable="true">${log.approvalDate || ''}</td>
                    <td data-field="deliveryDate" contenteditable="true">${log.deliveryDate || ''}</td>
                    <td>${item.requiredOnSite}</td>
                    <td><small>${item.source}</small></td>
                </tr>
            `;
        }).join('');
    },
    renderx: async (schedule, boq, context) => {
        const container = document.getElementById('long-lead-table-body');
        if (!container) return;

        if ((!schedule || schedule.length === 0) && (!boq || boq.length === 0)) {
            container.innerHTML = '<tr><td colspan="8">Load a project with a schedule or BOQ to populate this list.</td></tr>';
            return;
        }
        
        const { currentJobNo } = context.getState();
        const siteData = await window.DB.getSiteData(currentJobNo);
        const longLeadLog = siteData.longLeadLog || {};

        const keywords = ['marble', 'tile', 'joinery', 'sanitary', 'kitchen', 'facade', 'cladding', 'glazing', 'paint', 'doors', 'windows', 'ac', 'hvac', 'pergola', 'lift', 'elevator'];
        const longLeadItems = new Map();

        // 1. Process schedule
        if (schedule) {
            schedule.forEach(task => {
                if (keywords.some(kw => task.name.toLowerCase().includes(kw))) {
                    const id = `task-${task.id}`;
                    if (!longLeadItems.has(id)) {
                        longLeadItems.set(id, {
                            id: id,
                            name: task.name,
                            requiredOnSite: task.start,
                            source: 'Schedule'
                        });
                    }
                }
            });
        }

        // 2. Process BOQ
        if (boq) {
            boq.forEach(item => {
                if (keywords.some(kw => item.description.toLowerCase().includes(kw))) {
                    const id = `boq-${item.id || item.description.slice(0, 10)}`;
                    if (!longLeadItems.has(id)) {
                         longLeadItems.set(id, {
                            id: id,
                            name: item.description,
                            requiredOnSite: 'N/A', // Cannot determine from BOQ alone
                            source: 'BOQ'
                        });
                    }
                }
            });
        }

        const itemsArray = Array.from(longLeadItems.values());

        if (itemsArray.length === 0) {
            */
            container.innerHTML = '<tr><td colspan="8">No specific long-lead finishing items found in the current schedule or BOQ.</td></tr>';
            return;
        }

        container.innerHTML = itemsArray.map(item => {
            //const log = longLeadLog[item.id] || {};
            const log = item.log || {};
            const procurementDays = log.procurementDays || 90;
            let procurementStart = 'N/A';
            if(item.requiredOnSite !== 'N/A') {
                const requiredDate = new Date(item.requiredOnSite);
                requiredDate.setDate(requiredDate.getDate() - procurementDays);
                procurementStart = requiredDate.toISOString().split('T')[0];
            }

            return `
                <tr data-id="${item.id}">
                    <td>${item.name}</td>
                    <td data-field="procurementDays" contenteditable="true">${procurementDays}</td>
                    <td>${procurementStart}</td>
                    <td data-field="submittalDate" contenteditable="true">${log.submittalDate || ''}</td>
                    <td data-field="approvalDate" contenteditable="true">${log.approvalDate || ''}</td>
                    <td data-field="deliveryDate" contenteditable="true">${log.deliveryDate || ''}</td>
                    <td>${item.requiredOnSite}</td>
                    <td><small>${item.source}</small></td>
                </tr>
            `;
        }).join('');
    },

    

    handleEdit: async (e, context) => {
        const { currentJobNo } = context.getState();
        if (!currentJobNo) return;
        
        const cell = e.target;
        const row = cell.closest('tr');
        const id = row.dataset.id;
        const field = cell.dataset.field;
        const value = cell.textContent.trim();

        const siteData = await window.DB.getSiteData(currentJobNo);
        if (!siteData.longLeadLog) siteData.longLeadLog = {};
        if (!siteData.longLeadLog[id]) siteData.longLeadLog[id] = {};

        siteData.longLeadLog[id][field] = value;
        
        await window.DB.putSiteData(siteData);
        
        // Re-render to update calculated fields if necessary
        if (field === 'procurementDays') {
            if (context.onUpdate) context.onUpdate('long-lead');
        }
    },
    handleAddLongLeadItem: async (context) => {
        const { currentJobNo } = context.getState();
        if (!currentJobNo) return;

        const nameInput = document.getElementById('ll-new-name');
        const daysInput = document.getElementById('ll-new-days');
        const requiredInput = document.getElementById('ll-new-required');

        const name = nameInput.value.trim();
        const days = parseInt(daysInput.value) || 90;
        const requiredDate = requiredInput.value;

        if (!name) {
            alert("Please enter an item name.");
            return;
        }

        const siteData = await window.DB.getSiteData(currentJobNo);
        if (!siteData.longLeadLog) siteData.longLeadLog = {};
        
        const newId = `manual-${Date.now()}`;
        siteData.longLeadLog[newId] = {
            name: name,
            procurementDays: days,
            requiredOnSite: requiredDate,
            source: 'Manual'
        };

        await window.DB.putSiteData(siteData);
        
        // Clear inputs and re-render
        nameInput.value = '';
        daysInput.value = '90';
        requiredInput.value = '';
        await context.onUpdate('long-lead');
    }
    /*
    handleEditxx: async (e, context) => {
        const { currentJobNo } = context.getState();
        if (!currentJobNo) return;
        
        const cell = e.target;
        const row = cell.closest('tr');
        const id = row.dataset.id;
        const field = cell.dataset.field;
        const value = cell.textContent.trim();

        const siteData = await window.DB.getSiteData(currentJobNo);
        if (!siteData.longLeadLog) siteData.longLeadLog = {};
        if (!siteData.longLeadLog[id]) siteData.longLeadLog[id] = {};

        siteData.longLeadLog[id][field] = value;
        
        await window.DB.putSiteData(siteData);
        
            const procurementDays = log.procurementDays || 90;
            let procurementStart = 'N/A';
            if(item.requiredOnSite !== 'N/A') {
                const requiredDate = new Date(item.requiredOnSite);
                requiredDate.setDate(requiredDate.getDate() - procurementDays);
                procurementStart = requiredDate.toISOString().split('T')[0];
            }

            return `
                <tr data-id="${item.id}">
                    <td>${item.name}</td>
                    <td data-field="procurementDays" contenteditable="true">${procurementDays}</td>
                    <td>${procurementStart}</td>
                    <td data-field="submittalDate" contenteditable="true">${log.submittalDate || ''}</td>
                    <td data-field="approvalDate" contenteditable="true">${log.approvalDate || ''}</td>
                    <td data-field="deliveryDate" contenteditable="true">${log.deliveryDate || ''}</td>
                    <td>${item.requiredOnSite}</td>
                    <td><small>${item.source}</small></td>
                </tr>
            `;
        
    }
    */

};