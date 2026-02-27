export const BudgetModule = {
    init: (context) => {
        // Initialization logic if needed in the future
    },

    render: async (jobNo, container) => {
        if (!jobNo || !container) return;
        container.innerHTML = `<p>Calculating budget...</p>`;

        const project = await window.DB.getProject(jobNo);
        const siteData = await window.DB.getSiteData(jobNo);

        const tenderValue = parseFloat(project.tenderValue) || 0;

        // --- MODIFICATION START: Fixed TypeError by converting item.id to a string ---
        // Calculate Variations from BOQ
        const variations = ((siteData && siteData.boq) ? siteData.boq : [])
            .filter(item => item.id && String(item.id).toUpperCase().startsWith('V.O'))
            .reduce((sum, item) => sum + ((item.qty || 0) * (item.rate || 0)), 0);
        // --- MODIFICATION END ---

        const revisedContractValue = tenderValue + variations;

        // --- MODIFICATION START: Corrected payment calculation logic ---
        // Calculate Payments Made against the construction budget
        const manualPayments = (siteData && siteData.paymentLog) ? siteData.paymentLog : [];
        const certificates = project.paymentCertificates || [];

        // Aggregate all forms of payments/commitments against the construction budget
        const allPayments = [
            // Work certified for the contractor via Payment Certificates
            ...certificates
                .map(cert => ({ to: 'Contractor (Certified)', amount: parseFloat(cert.netPayable) || 0 })),
            // Other manual payments logged on site (e.g., to suppliers, subcontractors)
            ...manualPayments
                .map(p => ({ to: p.toWhom, amount: parseFloat(p.amount) || 0 }))
        ];
        // --- MODIFICATION END ---

        const paymentsByCategory = allPayments.reduce((acc, payment) => {
            const category = payment.to || 'General';
            acc[category] = (acc[category] || 0) + payment.amount;
            return acc;
        }, {});

        const totalPaid = Object.values(paymentsByCategory).reduce((sum, amount) => sum + amount, 0);
        const balance = revisedContractValue - totalPaid;

        // Simple burnout chart
        const burnoutPercentage = revisedContractValue > 0 ? (totalPaid / revisedContractValue) * 100 : 0;

        // Upcoming Costs (Simplified)
        // Ensure siteData exists before calling getProjectSchedule
        const validSiteData = siteData || { jobNo: jobNo, boq: [], paymentLog: [], customTasks: [], scheduleOverrides: [] };

        const schedule = await window.getProjectSchedule(project, validSiteData);
        const boqMap = new Map(((validSiteData && validSiteData.boq) ? validSiteData.boq : []).map(item => [String(item.id), item]));
        const today = new Date();
        const upcomingCosts = { '1w': 0, '1m': 0, '2m': 0, '3m': 0 };

        schedule.forEach(task => {
            const startDate = new Date(task.start);
            const boqItem = boqMap.get(String(task.id));
            if (boqItem && startDate > today) {
                const amount = (boqItem.qty || 0) * (boqItem.rate || 0);
                if (startDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) upcomingCosts['1w'] += amount;
                if (startDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) upcomingCosts['1m'] += amount;
                if (startDate <= new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)) upcomingCosts['2m'] += amount;
                if (startDate <= new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)) upcomingCosts['3m'] += amount;
            }
        });


        let html = `
            <div class="stat-card" style="text-align:left; margin-bottom: 20px;">
                <h3>Financial Summary</h3>
                <p>Original Tender Value: <strong>${tenderValue.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}</strong></p>
                <p>Approved Variations: <strong>${variations.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}</strong></p>
                <p>Revised Contract Value: <strong>${revisedContractValue.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}</strong></p>
                <hr>
                <p>Total Paid / Certified: <strong>${totalPaid.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}</strong></p>
                <p>Balance to Pay: <strong>${balance.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}</strong></p>
                <h4>Budget Burnout</h4>
                <div class="progress-bar-container"><div class="progress-bar" style="width:${burnoutPercentage.toFixed(1)}%;">${burnoutPercentage.toFixed(1)}%</div></div>
            </div>

            <div class="input-group-grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h4>Payments by Category</h4>
                    <table class="output-table">
                        <thead><tr><th>Category</th><th>Amount Paid / Certified</th></tr></thead>
                        <tbody>
                            ${Object.entries(paymentsByCategory).map(([cat, amt]) => `<tr><td>${cat}</td><td>${amt.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
                <div>
                    <h4>Estimated Upcoming Costs (from Schedule)</h4>
                     <table class="output-table">
                        <thead><tr><th>Period</th><th>Estimated Cost</th></tr></thead>
                        <tbody>
                            <tr><td>Next 1 Week</td><td>${upcomingCosts['1w'].toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}</td></tr>
                            <tr><td>Next 1 Month</td><td>${upcomingCosts['1m'].toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}</td></tr>
                            <tr><td>Next 2 Months</td><td>${upcomingCosts['2m'].toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}</td></tr>
                            <tr><td>Next 3 Months</td><td>${upcomingCosts['3m'].toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        container.innerHTML = html;
    },
};