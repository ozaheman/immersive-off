document.addEventListener('DOMContentLoaded', async () => {
    // --- Globals ---
    const DOMElements = {};
    let allProjects = [];
    let staffList = [];
    let officeExpenses = [];

    const formatCurrency = (num) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(Math.round(num || 0));

    // --- Initialization ---
    async function main() {
        try {
            await DB.init();
            cacheDOMElements();
            await loadAllData();
            renderAllComponents();
        } catch (error) {
            console.error("Error initializing BI module:", error);
        }
    }

    function cacheDOMElements() {
        const ids = [
            'revenueForecastChart', 'profitExpensePieChart', 'resourceAllocationPieChart',
            'profitDistributionPieChart', 'staff-salary-body', 'monthly-expense-body', 'staff-loan-body',
            'yearlyPlanChart'
        ];
        ids.forEach(id => DOMElements[id] = document.getElementById(id));
    }

    async function loadAllData() {
        allProjects = await DB.getAllProjects();
        staffList = await DB.getAllHRData();
        officeExpenses = await DB.getOfficeExpenses();
    }

    function renderAllComponents() {
        renderFinancialTables();
        renderRevenueForecastChart();
        renderProfitExpenseChart();
        renderResourceAllocationChart();
        renderProfitDistributionChart();
        renderYearlyPlanChart();
    }

    // --- Financial Tables ---
    function renderFinancialTables() {
        // Staff Salaries
        const salaryBody = DOMElements['staff-salary-body'];
        salaryBody.innerHTML = '';
        let totalMonthlySalary = 0;
        staffList.forEach(staff => {
            const row = salaryBody.insertRow();
            row.innerHTML = `<td>${staff.name} (${staff.role})</td><td style="text-align:right;">${formatCurrency(staff.grossSalary)}</td>`;
            totalMonthlySalary += staff.grossSalary;
        });
        const totalSalaryRow = salaryBody.insertRow();
        totalSalaryRow.className = 'total-row';
        totalSalaryRow.innerHTML = `<td><b>Total Monthly Salaries</b></td><td style="text-align:right;"><b>${formatCurrency(totalMonthlySalary)}</b></td>`;

        // Office Expenses
        const expenseBody = DOMElements['monthly-expense-body'];
        expenseBody.innerHTML = '';
        let totalAnnualExpenses = 0;
        const annualExpenses = officeExpenses.filter(e => e.frequency === 'annual');
        annualExpenses.forEach(exp => {
            const row = expenseBody.insertRow();
            row.innerHTML = `<td>${exp.description}</td><td style="text-align:right;">${formatCurrency(exp.amount)}</td>`;
            totalAnnualExpenses += exp.amount;
        });
        const proratedMonthly = totalAnnualExpenses / 12;
        const totalExpenseRow = expenseBody.insertRow();
        totalExpenseRow.className = 'total-row';
        totalExpenseRow.innerHTML = `<td><b>Total Annual Expenses</b></td><td style="text-align:right;"><b>${formatCurrency(totalAnnualExpenses)}</b></td>`;
        const proratedRow = expenseBody.insertRow();
        proratedRow.className = 'total-row';
        proratedRow.innerHTML = `<td><b>Avg. Monthly Cost (Prorated)</b></td><td style="text-align:right;"><b>${formatCurrency(proratedMonthly)}</b></td>`;

        // Staff Loans
        const loanBody = DOMElements['staff-loan-body'];
        loanBody.innerHTML = '';
        let totalOutstandingLoans = 0;
        staffList.forEach(staff => {
            (staff.loans || []).forEach(loan => {
                if (loan.status === 'Outstanding') {
                    const row = loanBody.insertRow();
                    row.innerHTML = `<td>${staff.name}</td><td>${loan.description}</td><td style="text-align:right;">${formatCurrency(loan.amount)}</td>`;
                    totalOutstandingLoans += loan.amount;
                }
            });
        });
        const totalLoanRow = loanBody.insertRow();
        totalLoanRow.className = 'total-row';
        totalLoanRow.innerHTML = `<td colspan="2"><b>Total Outstanding Loans</b></td><td style="text-align:right;"><b>${formatCurrency(totalOutstandingLoans)}</b></td>`;
    }

    // --- Chart Renderers ---
    function renderRevenueForecastChart() {
        const ctx = DOMElements.revenueForecastChart.getContext('2d');
        const history = {};
        const forecast = {};

        allProjects.forEach(p => {
            (p.invoices || []).forEach(inv => {
                if (inv.status === 'Paid') {
                    const month = inv.date.substring(0, 7);
                    history[month] = (history[month] || 0) + parseFloat(inv.amount);
                } else if (inv.status === 'Raised' || inv.status === 'Pending') {
                    const month = inv.date.substring(0, 7);
                    forecast[month] = (forecast[month] || 0) + parseFloat(inv.amount);
                }
            });
        });

        const labels = [...new Set([...Object.keys(history), ...Object.keys(forecast)])].sort();

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Paid Revenue',
                        data: labels.map(l => history[l] || 0),
                        backgroundColor: '#1cc88a',
                    },
                    {
                        label: 'Forecast (Unpaid Invoices)',
                        data: labels.map(l => forecast[l] || 0),
                        backgroundColor: '#4e73df',
                    }
                ]
            },
            options: {
                scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    function renderProfitExpenseChart() {
        const ctx = DOMElements.profitExpensePieChart.getContext('2d');
        const totalAnnualSalary = staffList.reduce((sum, s) => sum + (s.grossSalary * 12), 0);
        const totalAnnualOfficeExpense = officeExpenses.filter(e => e.frequency === 'annual').reduce((sum, e) => sum + e.amount, 0);

        let totalRevenueLast12Months = 0;
        const aYearAgo = new Date();
        aYearAgo.setFullYear(aYearAgo.getFullYear() - 1);

        allProjects.forEach(p => {
            (p.invoices || []).forEach(inv => {
                if (inv.status === 'Paid' && new Date(inv.date) >= aYearAgo) {
                    totalRevenueLast12Months += parseFloat(inv.amount);
                }
            });
        });

        const totalExpense = totalAnnualSalary + totalAnnualOfficeExpense;
        const netProfit = totalRevenueLast12Months - totalExpense;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Net Profit', 'Staff Salaries', 'Office Expenses'],
                datasets: [{
                    data: [netProfit > 0 ? netProfit : 0, totalAnnualSalary, totalAnnualOfficeExpense],
                    backgroundColor: ['#1cc88a', '#e74a3b', '#f6c23e'],
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    function renderResourceAllocationChart() {
        const ctx = DOMElements.resourceAllocationPieChart.getContext('2d');
        const allocationByRole = staffList.reduce((acc, staff) => {
            const role = staff.role || 'Unassigned';
            acc[role] = (acc[role] || 0) + staff.grossSalary;
            return acc;
        }, {});

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(allocationByRole),
                datasets: [{
                    data: Object.values(allocationByRole),
                    backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'],
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    function renderProfitDistributionChart() {
        const ctx = DOMElements.profitDistributionPieChart.getContext('2d');
        // Placeholder for a more complex model
        const distribution = {
            'Re-investment': 40,
            'Partner A': 25,
            'Partner B': 25,
            'Bonuses': 10
        };
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(distribution),
                datasets: [{
                    data: Object.values(distribution),
                    backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e'],
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }


    function renderYearlyPlanChart() {
        if (!DOMElements.yearlyPlanChart) return;
        const ctx = DOMElements.yearlyPlanChart.getContext('2d');

        // Generate months for the current year
        const currentYear = new Date().getFullYear();
        const months = [];
        for (let i = 0; i < 12; i++) {
            months.push(`${currentYear}-${String(i + 1).padStart(2, '0')}`);
        }

        // 1. Calculate Expenses (Fixed per month)
        const monthlyStaffSalaries = staffList.reduce((sum, s) => sum + (parseFloat(s.grossSalary) || 0), 0);
        const annualOfficeExpenses = officeExpenses.filter(e => e.frequency === 'annual').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        const monthlyOfficeExpenses = (annualOfficeExpenses / 12) + officeExpenses.filter(e => e.frequency === 'monthly').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        const totalMonthlyExpense = monthlyStaffSalaries + monthlyOfficeExpenses;

        const combinedRevenueData = months.map(month => {
            return allProjects.reduce((sum, p) => {
                const projectRevenue = (p.invoices || []).filter(inv =>
                    (inv.status === 'Paid' || inv.status === 'Raised' || inv.status === 'Pending') &&
                    inv.date && inv.date.substring(0, 7) === month
                ).reduce((s, inv) => s + parseFloat(inv.amount || inv.total || 0), 0);
                return sum + projectRevenue;
            }, 0);
        });

        // 3. Prepare individual project revenue lines (Top 5 projects by fee)
        const topProjects = [...allProjects].sort((a, b) => {
            const getFee = (p) => p.remunerationType === 'lumpSum' ? (parseFloat(p.lumpSumFee) || 0) : ((parseFloat(p.builtUpArea) || 0) * (parseFloat(p.constructionCostRate) || 0) * (parseFloat(p.consultancyFeePercentage) || 0) / 100);
            return getFee(b) - getFee(a);
        }).slice(0, 5);

        const projectDatasets = topProjects.map((p, idx) => {
            const colors = ['#4e73df', '#f6c23e', '#36b9cc', '#858796', '#5a5c69'];
            return {
                label: `Proj: ${p.jobNo}`,
                data: months.map(month => {
                    return (p.invoices || []).filter(inv =>
                        inv.date && inv.date.substring(0, 7) === month
                    ).reduce((s, inv) => s + parseFloat(inv.amount || inv.total || 0), 0);
                }),
                borderColor: colors[idx % colors.length],
                borderWidth: 1.5,
                fill: false,
                tension: 0.3,
                borderDash: [5, 5],
                pointRadius: 2,
                order: 3
            };
        });

        const staffSalaryData = months.map(() => monthlyStaffSalaries);
        const officeExpenseData = months.map(() => monthlyOfficeExpenses);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: months.map(m => {
                    const [year, month] = m.split('-');
                    return new Date(year, month - 1).toLocaleString('default', { month: 'short' });
                }),
                datasets: [
                    {
                        label: 'Staff Salaries (Fixed)',
                        data: staffSalaryData,
                        backgroundColor: 'rgba(78, 115, 223, 0.1)',
                        borderColor: '#4e73df',
                        borderWidth: 1,
                        fill: true,
                        pointRadius: 0,
                        order: 10,
                        stack: 'expenses'
                    },
                    {
                        label: 'Office Expenses (Prorated)',
                        data: officeExpenseData,
                        backgroundColor: 'rgba(231, 74, 59, 0.1)',
                        borderColor: '#e74a3b',
                        borderWidth: 1,
                        fill: true,
                        pointRadius: 0,
                        order: 9,
                        stack: 'expenses'
                    },
                    {
                        label: 'Total Revenue Forecast',
                        data: combinedRevenueData,
                        backgroundColor: 'rgba(28, 200, 138, 0.2)',
                        borderColor: '#1cc88a',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        order: 1
                    },
                    ...projectDatasets
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        stacked: false, // Don't stack revenue and expenses together
                        title: { display: true, text: 'Amount (AED)' }
                    },
                    x: {
                        stacked: true // Stack the expense areas
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.dataset.label + ': ' + formatCurrency(context.raw);
                            }
                        }
                    }
                }
            }
        });
    }


    main();
});