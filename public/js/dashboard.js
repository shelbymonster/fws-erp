// Dashboard functionality for Simple ERP

class Dashboard {
    constructor() {
        this.invoices = [];
        this.bills = [];
    }

    // Load data from storage
    loadData() {
        this.invoices = erpStorage.getInvoices() || [];
        this.bills = erpStorage.getBills() || [];
        
        console.log('Dashboard data loaded:');
        console.log('  - Invoices:', this.invoices.length);
        console.log('  - Bills:', this.bills.length);
    }

    // Calculate Money In (from paid invoices)
    calculateMoneyIn() {
        return this.invoices
            .filter(invoice => invoice.status === 'Paid')
            .reduce((total, invoice) => total + (invoice.total || 0), 0);
    }

    // Calculate Money Out (from paid bills)
    calculateMoneyOut() {
        return this.bills
            .filter(bill => bill.status === 'Paid')
            .reduce((total, bill) => total + (bill.amount || 0), 0);
    }

    // Calculate Unpaid Invoices (pending or overdue)
    calculateUnpaidInvoices() {
        const unpaidInvoices = this.invoices.filter(
            invoice => invoice.status === 'Pending' || invoice.status === 'Overdue'
        );
        
        return {
            count: unpaidInvoices.length,
            amount: unpaidInvoices.reduce((total, invoice) => total + (invoice.total || 0), 0)
        };
    }

    // Calculate Unpaid Bills (pending or overdue)
    calculateUnpaidBills() {
        const unpaidBills = this.bills.filter(
            bill => bill.status === 'Unpaid' || bill.status === 'Overdue' || bill.status.startsWith('Partial')
        );
        
        return {
            count: unpaidBills.length,
            amount: unpaidBills.reduce((total, bill) => {
                if (bill.status.startsWith('Partial') && bill.payments) {
                    // For partial payments, calculate remaining balance
                    const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
                    return total + (bill.amount - totalPaid);
                }
                return total + (bill.amount || 0);
            }, 0)
        };
    }

    // Calculate Past Due (Overdue) Invoices
    calculateOverdueInvoices() {
        const overdueInvoices = this.invoices.filter(
            invoice => invoice.status === 'Overdue'
        );
        
        return {
            count: overdueInvoices.length,
            amount: overdueInvoices.reduce((total, invoice) => total + (invoice.total || 0), 0)
        };
    }

    // Calculate Past Due (Overdue) Bills
    calculateOverdueBills() {
        const overdueBills = this.bills.filter(
            bill => bill.status === 'Overdue'
        );
        
        return {
            count: overdueBills.length,
            amount: overdueBills.reduce((total, bill) => {
                if (bill.payments && bill.payments.length > 0) {
                    // For partial payments, calculate remaining balance
                    const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
                    return total + (bill.amount - totalPaid);
                }
                return total + (bill.amount || 0);
            }, 0)
        };
    }

    // Check for low stock products
    checkLowStock() {
        const products = erpStorage.getProducts() || [];
        const settings = erpStorage.getSettings();
        const threshold = settings.lowStockThreshold || 10;
        
        // Only check physical products for low stock, not services
        const lowStockProducts = products.filter(product => {
            const productType = product.type || 'product';
            return productType === 'product' && product.stock < threshold;
        });
        
        const alertDiv = document.getElementById('low-stock-alert');
        const listDiv = document.getElementById('low-stock-list');
        
        if (lowStockProducts.length > 0 && alertDiv && listDiv) {
            alertDiv.classList.remove('hidden');
            alertDiv.classList.add('alert-danger');
            listDiv.classList.add('alert-danger');
            listDiv.innerHTML = lowStockProducts.map(product => `
                <div class="low-stock-item alert-danger-item">
                    <strong>${product.name}</strong> - 
                    <span class="low-stock-stock">Stock: ${product.stock}</span>
                    <a href="views/inventory.html" class="low-stock-link">→ Manage Inventory</a>
                </div>
            `).join('');
        } else if (alertDiv) {
            alertDiv.classList.add('hidden');
            alertDiv.classList.remove('alert-danger');
            if (listDiv) {
                listDiv.classList.remove('alert-danger');
            }
        }
    }

    // Update dashboard cards
    updateDashboard() {
        this.loadData();

        const moneyIn = this.calculateMoneyIn();
        const moneyOut = this.calculateMoneyOut();
        const unpaidInvoices = this.calculateUnpaidInvoices();
        const unpaidBills = this.calculateUnpaidBills();
        const overdueInvoices = this.calculateOverdueInvoices();
        const overdueBills = this.calculateOverdueBills();
        
        // Check for low stock
        this.checkLowStock();

        // Update Money In card
        const moneyInEl = document.getElementById('money-in-amount');
        if (moneyInEl) {
            moneyInEl.textContent = `$${moneyIn.toFixed(2)}`;
        }

        // Update Money Out card
        const moneyOutEl = document.getElementById('money-out-amount');
        if (moneyOutEl) {
            moneyOutEl.textContent = `$${moneyOut.toFixed(2)}`;
        }

        // Update Unpaid Invoices card
        const unpaidInvoicesCountEl = document.getElementById('unpaid-invoices-count');
        const unpaidInvoicesAmountEl = document.getElementById('unpaid-invoices-amount');
        if (unpaidInvoicesCountEl) {
            unpaidInvoicesCountEl.textContent = unpaidInvoices.count;
        }
        if (unpaidInvoicesAmountEl) {
            unpaidInvoicesAmountEl.textContent = `$${unpaidInvoices.amount.toFixed(2)}`;
        }

        // Update Unpaid Bills card
        const unpaidBillsCountEl = document.getElementById('unpaid-bills-count');
        const unpaidBillsAmountEl = document.getElementById('unpaid-bills-amount');
        if (unpaidBillsCountEl) {
            unpaidBillsCountEl.textContent = unpaidBills.count;
        }
        if (unpaidBillsAmountEl) {
            unpaidBillsAmountEl.textContent = `$${unpaidBills.amount.toFixed(2)}`;
        }

        // Update Overdue Invoices card
        const overdueInvoicesCountEl = document.getElementById('overdue-invoices-count');
        const overdueInvoicesAmountEl = document.getElementById('overdue-invoices-amount');
        const overdueInvoicesCard = document.querySelector('.card-overdue-invoices');
        if (overdueInvoicesCountEl) {
            overdueInvoicesCountEl.textContent = overdueInvoices.count;
        }
        if (overdueInvoicesAmountEl) {
            overdueInvoicesAmountEl.textContent = `$${overdueInvoices.amount.toFixed(2)}`;
        }
        // Turn card red if there are overdue invoices
        if (overdueInvoicesCard) {
            if (overdueInvoices.count > 0) {
                overdueInvoicesCard.classList.add('card-danger');
            } else {
                overdueInvoicesCard.classList.remove('card-danger');
            }
        }

        // Update Overdue Bills card
        const overdueBillsCountEl = document.getElementById('overdue-bills-count');
        const overdueBillsAmountEl = document.getElementById('overdue-bills-amount');
        const overdueBillsCard = document.querySelector('.card-overdue-bills');
        if (overdueBillsCountEl) {
            overdueBillsCountEl.textContent = overdueBills.count;
        }
        if (overdueBillsAmountEl) {
            overdueBillsAmountEl.textContent = `$${overdueBills.amount.toFixed(2)}`;
        }
        // Turn card red if there are overdue bills
        if (overdueBillsCard) {
            if (overdueBills.count > 0) {
                overdueBillsCard.classList.add('card-danger');
            } else {
                overdueBillsCard.classList.remove('card-danger');
            }
        }

        // Calculate net cash flow
        const netCashFlow = moneyIn - moneyOut;
        const netCashFlowEl = document.getElementById('net-cash-flow');
        if (netCashFlowEl) {
            netCashFlowEl.textContent = `$${netCashFlow.toFixed(2)}`;
            
            // Color code the cash flow
            if (netCashFlow > 0) {
                netCashFlowEl.style.color = '#28a745';
            } else if (netCashFlow < 0) {
                netCashFlowEl.style.color = '#dc3545';
            } else {
                netCashFlowEl.style.color = 'white';
            }
        }

        console.log('Dashboard updated successfully');
        console.log('💰 Money In:', moneyIn.toFixed(2));
        console.log('💸 Money Out:', moneyOut.toFixed(2));
        console.log('📄 Unpaid Invoices:', unpaidInvoices.count, '-', unpaidInvoices.amount.toFixed(2));
        console.log('📋 Unpaid Bills:', unpaidBills.count, '-', unpaidBills.amount.toFixed(2));
        console.log('⚠️ Overdue Invoices:', overdueInvoices.count, '-', overdueInvoices.amount.toFixed(2));
        console.log('⚠️ Overdue Bills:', overdueBills.count, '-', overdueBills.amount.toFixed(2));
        console.log('💵 Net Cash Flow:', netCashFlow.toFixed(2));
    }
}

// Initialize dashboard when page loads
let dashboard;

document.addEventListener('DOMContentLoaded', function() {
    if (typeof erpStorage !== 'undefined') {
        dashboard = new Dashboard();
        dashboard.updateDashboard();
        
        // Refresh dashboard every 30 seconds
        setInterval(() => {
            dashboard.updateDashboard();
        }, 30000);
        
        console.log('Dashboard initialized');
    } else {
        console.error('erpStorage not available');
    }
});

// Make dashboard globally available for manual refresh
window.dashboardManager = dashboard;
window.refreshDashboard = function() {
    if (dashboard) {
        dashboard.updateDashboard();
        console.log('Dashboard manually refreshed');
    }
};
