// Bill Payment Dialog System
// Professional payment recording with payment types and tracking

class BillPaymentManager {
    constructor() {
        this.setupPaymentSystem();
        this.paymentTypes = [
            'Cash',
            'Check',
            'Credit Card',
            'Debit Card',
            'Bank Transfer',
            'ACH/Wire',
            'PayPal',
            'Venmo',
            'Zelle',
            'Other'
        ];
        
        // Convert old percentage-based partial payments to dollar amounts
        this.migrateOldPartialPayments();
    }

    // Migrate old partial payments from percentage to dollar amounts
    migrateOldPartialPayments() {
        const bills = erpStorage.getBills();
        let updated = false;

        bills.forEach(bill => {
            // Check for old format: "Partial (XX.X%)"
            if (bill.status && bill.status.includes('Partial') && bill.status.includes('%')) {
                console.log('Migrating old partial payment for bill:', bill.id);
                
                // Extract percentage from status
                const percentMatch = bill.status.match(/Partial \((\d+\.?\d*)%\)/);
                if (percentMatch) {
                    const percentage = parseFloat(percentMatch[1]);
                    const amountPaid = (bill.amount * percentage) / 100;
                    
                    // Create payment record if it doesn't exist
                    if (!bill.payments) {
                        bill.payments = [];
                    }
                    
                    // Only add migration payment if no payments exist
                    if (bill.payments.length === 0) {
                        const migrationPayment = {
                            id: Date.now(),
                            type: 'Unknown', // We don't know the original payment type
                            date: bill.paidDate || bill.dateCreated,
                            amount: amountPaid,
                            reference: 'Migrated from old system',
                            notes: `Original status: ${bill.status}`,
                            recordedDate: new Date().toISOString()
                        };
                        
                        bill.payments.push(migrationPayment);
                    }
                    
                    // Update status to new format
                    const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
                    bill.status = `Partial ($${totalPaid.toFixed(2)})`;
                    updated = true;
                    
                    console.log('Migrated bill', bill.id, 'from', percentMatch[0], 'to', bill.status);
                }
            }
        });

        if (updated) {
            erpStorage.setBills(bills);
            console.log('Migration complete - updated bill statuses');
        }
    }

    // Setup payment system enhancement
    setupPaymentSystem() {
        document.addEventListener('DOMContentLoaded', () => {
            // Try multiple times to catch the buttons after they're loaded
            setTimeout(() => this.replaceMarkPaidButtons(), 1000);
            setTimeout(() => this.replaceMarkPaidButtons(), 2000);
            setTimeout(() => this.replaceMarkPaidButtons(), 3000);
            
            setTimeout(() => {
                this.monitorBillsTable();
            }, 1500);
        });

        // Also try when the page is fully loaded
        window.addEventListener('load', () => {
            setTimeout(() => this.replaceMarkPaidButtons(), 1000);
        });
    }

    // Replace "Mark Paid" buttons with "Payment" buttons
    replaceMarkPaidButtons() {
        // Look for buttons with "Mark Paid" text or markAsPaid function calls
        const markPaidButtons = document.querySelectorAll('button[onclick*="markAsPaid"]');
        
        console.log('Found', markPaidButtons.length, 'Mark Paid buttons to replace');
        
        markPaidButtons.forEach(button => {
            // Extract bill ID from onclick attribute
            const onclickText = button.getAttribute('onclick');
            const idMatch = onclickText.match(/\((\d+)\)/);
            
            if (idMatch) {
                const billId = parseInt(idMatch[1]);
                const bill = this.getBillById(billId);
                
                if (!bill) return;

                // Check if this is a partial payment bill
                if (bill.status && bill.status.startsWith('Partial')) {
                    // For partial payments, show both Payment and Payment History buttons
                    const paymentButton = document.createElement('button');
                    paymentButton.textContent = 'Payment';
                    paymentButton.className = 'button';
                    paymentButton.style.cssText = 'background: #5cb85c; padding: 5px 10px; font-size: 12px; margin: 1px;';
                    paymentButton.onclick = () => this.showPaymentDialog(billId);
                    
                    const historyButton = document.createElement('button');
                    historyButton.textContent = 'History';
                    historyButton.className = 'button';
                    historyButton.style.cssText = 'background: #17a2b8; padding: 5px 10px; font-size: 12px; margin: 1px;';
                    historyButton.onclick = () => this.showPaymentHistory(billId);
                    
                    // Replace original button with both buttons
                    button.parentNode.replaceChild(paymentButton, button);
                    paymentButton.parentNode.insertBefore(historyButton, paymentButton.nextSibling);
                    
                    console.log('Added both Payment and History buttons for partial bill:', billId);
                } else {
                    // For unpaid bills, show only Payment button
                    const paymentButton = document.createElement('button');
                    paymentButton.textContent = 'Payment';
                    paymentButton.className = 'button';
                    paymentButton.style.cssText = 'background: #5cb85c; padding: 5px 10px; font-size: 12px; margin: 2px;';
                    paymentButton.onclick = () => this.showPaymentDialog(billId);
                    
                    button.parentNode.replaceChild(paymentButton, button);
                    
                    console.log('Replaced Mark Paid button for unpaid bill:', billId);
                }
            }
        });

        // Also look for buttons with "Mark Unpaid" text for fully paid bills
        const markUnpaidButtons = document.querySelectorAll('button[onclick*="markAsUnpaid"]');
        
        console.log('Found', markUnpaidButtons.length, 'Mark Unpaid buttons to replace');
        
        markUnpaidButtons.forEach(button => {
            // Extract bill ID from onclick attribute
            const onclickText = button.getAttribute('onclick');
            const idMatch = onclickText.match(/\((\d+)\)/);
            
            if (idMatch) {
                const billId = parseInt(idMatch[1]);
                
                // Replace with Payment History button for fully paid bills
                const paymentButton = document.createElement('button');
                paymentButton.textContent = 'Payment History';
                paymentButton.className = 'button';
                paymentButton.style.cssText = 'background: #5cb85c; padding: 5px 10px; font-size: 12px; margin: 2px;';
                paymentButton.onclick = () => this.showPaymentHistory(billId);
                
                button.parentNode.replaceChild(paymentButton, button);
                
                console.log('Replaced Mark Unpaid button for fully paid bill:', billId);
            }
        });
    }

    // Show payment recording dialog
    showPaymentDialog(billId) {
        const bill = this.getBillById(billId);
        if (!bill) {
            alert('Bill not found!');
            return;
        }

        // Check if bill is already fully paid
        if (bill.status === 'Paid') {
            this.showPaymentHistory(billId);
            return;
        }

        // Calculate remaining amount for partial payments
        const totalPaid = bill.payments ? bill.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
        const remainingAmount = bill.amount - totalPaid;
        const isPartialPayment = totalPaid > 0;

        const today = new Date().toISOString().split('T')[0];

        const dialogHTML = `
            <div id="payment-dialog" class="bill-payment-dialog">
                <div class="bill-payment-dialog-content">
                    <h3>
                        ${isPartialPayment ? 'Additional Payment' : 'Record Payment'}
                    </h3>
                    
                    <div class="bill-payment-info-box">
                        <div class="bill-payment-info-label">Bill Details:</div>
                        <div><strong>Vendor:</strong> ${bill.vendorName}</div>
                        <div><strong>Description:</strong> ${bill.description}</div>
                        <div class="bill-payment-total">
                            <strong>Original Amount:</strong> $${bill.amount.toFixed(2)}
                        </div>
                        ${isPartialPayment ? `
                            <div class="bill-payment-amount-paid">
                                <strong>Already Paid:</strong> $${totalPaid.toFixed(2)}
                            </div>
                            <div class="bill-payment-amount-due">
                                <strong>Remaining Balance:</strong> $${remainingAmount.toFixed(2)}
                            </div>
                        ` : ''}
                    </div>
                    
                    <form id="payment-form">
                        <div class="bill-payment-form-field">
                            <label class="bill-payment-form-label">Payment Type:</label>
                            <select id="paymentType" required class="bill-payment-form-input">
                                <option value="">Select payment method...</option>
                                ${this.paymentTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="bill-payment-form-field">
                            <label class="bill-payment-form-label">Payment Date:</label>
                            <input type="date" id="paymentDate" value="${today}" required class="bill-payment-form-input">
                        </div>
                        
                        <div class="bill-payment-form-field">
                            <label class="bill-payment-form-label">Reference/Check Number:</label>
                            <input type="text" id="paymentReference" placeholder="Check #, Transaction ID, etc." class="bill-payment-form-input">
                        </div>
                        
                        <div class="bill-payment-form-field">
                            <label class="bill-payment-form-label">Payment Amount:</label>
                            <input type="number" id="paymentAmount" value="${remainingAmount.toFixed(2)}" step="0.01" min="0" max="${remainingAmount}" required class="bill-payment-form-input">
                            <small class="bill-payment-form-hint">Maximum remaining amount: $${remainingAmount.toFixed(2)}</small>
                        </div>
                        
                        <div class="bill-payment-form-field">
                            <label class="bill-payment-form-label">Payment Notes:</label>
                            <textarea id="paymentNotes" placeholder="Additional notes about this payment..." class="bill-payment-form-textarea"></textarea>
                        </div>
                        
                        <div class="bill-payment-actions">
                            <button type="button" onclick="billPaymentManager.closePaymentDialog()" class="bill-payment-cancel-btn">Cancel</button>
                            <button type="submit" class="bill-payment-submit-btn">Record Payment</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Remove existing dialog if any
        this.closePaymentDialog();

        // Add dialog to page
        document.body.insertAdjacentHTML('beforeend', dialogHTML);

        // Setup form submission
        document.getElementById('payment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processPayment(billId);
        });

        // Setup payment type change handler for custom reference field
        document.getElementById('paymentType').addEventListener('change', (e) => {
            this.updateReferenceField(e.target.value);
        });
    }

    // Update reference field placeholder based on payment type
    updateReferenceField(paymentType) {
        const referenceField = document.getElementById('paymentReference');
        const placeholders = {
            'Check': 'Check Number',
            'Credit Card': 'Transaction ID',
            'Debit Card': 'Transaction ID',
            'Bank Transfer': 'Transfer Reference',
            'ACH/Wire': 'Wire Reference',
            'PayPal': 'PayPal Transaction ID',
            'Venmo': 'Venmo Transaction ID',
            'Zelle': 'Zelle Reference',
            'Cash': 'Receipt Number (optional)',
            'Other': 'Reference Number'
        };
        
        referenceField.placeholder = placeholders[paymentType] || 'Reference Number';
    }

    // Process the payment
    processPayment(billId) {
        const paymentType = document.getElementById('paymentType').value;
        const paymentDate = document.getElementById('paymentDate').value;
        const paymentReference = document.getElementById('paymentReference').value;
        const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
        const paymentNotes = document.getElementById('paymentNotes').value;

        if (!paymentType) {
            alert('Please select a payment type.');
            return;
        }

        if (!paymentDate) {
            alert('Please select a payment date.');
            return;
        }

        if (paymentAmount <= 0) {
            alert('Please enter a valid payment amount.');
            return;
        }

        // Get bill and update it
        const bills = erpStorage.getBills();
        const bill = bills.find(b => b.id === billId);
        
        if (!bill) {
            alert('Bill not found!');
            return;
        }

        // Create payment record
        const payment = {
            id: Date.now(),
            type: paymentType,
            date: paymentDate,
            amount: paymentAmount,
            reference: paymentReference,
            notes: paymentNotes,
            recordedDate: new Date().toISOString()
        };

        // Add payment to bill
        if (!bill.payments) {
            bill.payments = [];
        }
        bill.payments.push(payment);

        // Calculate total paid
        const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
        
        // Update bill status
        if (totalPaid >= bill.amount) {
            bill.status = 'Paid';
            bill.paymentDate = paymentDate;
            bill.paymentType = paymentType;
            bill.paymentReference = paymentReference;
        } else {
            // Show actual dollar amount paid instead of percentage
            bill.status = `Partial ($${totalPaid.toFixed(2)})`;
        }

        // Save updated bills
        erpStorage.setBills(bills);

        // Close dialog and refresh display
        this.closePaymentDialog();
        this.refreshBillsDisplay();

        // Show success message
        const message = totalPaid >= bill.amount ? 
            `Payment recorded successfully! Bill is now fully paid.` :
            `Partial payment recorded! Paid $${totalPaid.toFixed(2)} of $${bill.amount.toFixed(2)} (remaining: $${(bill.amount - totalPaid).toFixed(2)})`;
        
        alert(message);

        console.log('Payment recorded:', payment);
    }

    // Show payment history for paid bills
    showPaymentHistory(billId) {
        const bill = this.getBillById(billId);
        if (!bill || !bill.payments) {
            alert('No payment history found for this bill.');
            return;
        }

        const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);

        const historyHTML = `
            <div id="payment-dialog" class="bill-payment-dialog">
                <div class="bill-payment-dialog-content payment-dialog-scrollable" style="max-width: 600px;">
                    <h3>Payment History</h3>
                    
                    <div class="bill-payment-info-box">
                        <div><strong>Vendor:</strong> ${bill.vendorName}</div>
                        <div><strong>Description:</strong> ${bill.description}</div>
                        <div><strong>Bill Amount:</strong> $${bill.amount.toFixed(2)}</div>
                        <div class="text-success font-bold"><strong>Total Paid:</strong> $${totalPaid.toFixed(2)}</div>
                    </div>
                    
                    <h4>Payment Records:</h4>
                    ${bill.payments.map((payment, index) => `
                        <div class="payment-history-item">
                            <div class="payment-history-grid">
                                <div><strong>Payment #${index + 1}</strong></div>
                                <div class="payment-history-amount">$${payment.amount.toFixed(2)}</div>
                                <div><strong>Type:</strong> ${payment.type}</div>
                                <div><strong>Date:</strong> ${new Date(payment.date).toLocaleDateString()}</div>
                                ${payment.reference ? `<div><strong>Reference:</strong> ${payment.reference}</div>` : '<div></div>'}
                                <div class="payment-history-notes">${payment.notes ? `<strong>Notes:</strong> ${payment.notes}` : ''}</div>
                            </div>
                        </div>
                    `).join('')}
                    
                    <div class="bill-payment-actions">
                        <button onclick="billPaymentManager.closePaymentDialog()" class="payment-close-button">Close</button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing dialog if any
        this.closePaymentDialog();

        // Add dialog to page
        document.body.insertAdjacentHTML('beforeend', historyHTML);
    }

    // Close payment dialog
    closePaymentDialog() {
        const dialog = document.getElementById('payment-dialog');
        if (dialog) {
            dialog.remove();
        }
    }

    // Get bill by ID
    getBillById(billId) {
        const bills = erpStorage.getBills();
        return bills.find(b => b.id === billId);
    }

    // Refresh bills display
    refreshBillsDisplay() {
        if (typeof loadBills === 'function') {
            setTimeout(loadBills, 100);
        }
        
        // Also re-replace buttons after refresh
        setTimeout(() => {
            this.replaceMarkPaidButtons();
        }, 500);
    }

    // Monitor bills table for changes
    monitorBillsTable() {
        const billsTable = document.getElementById('bills-tbody');
        if (!billsTable) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    setTimeout(() => {
                        this.replaceMarkPaidButtons();
                    }, 100);
                }
            });
        });

        observer.observe(billsTable, { childList: true, subtree: true });
        console.log('Monitoring bills table for payment button replacement');
    }
}

// Create global instance
window.billPaymentManager = new BillPaymentManager();

// Manual trigger function for testing
window.replacePaymentButtons = function() {
    console.log('Manual trigger for payment button replacement...');
    if (window.billPaymentManager) {
        window.billPaymentManager.replaceMarkPaidButtons();
    }
    
    // Also log what buttons we can find
    const allButtons = document.querySelectorAll('button');
    console.log('Total buttons found:', allButtons.length);
    
    const markPaidButtons = document.querySelectorAll('button[onclick*="markAsPaid"]');
    console.log('Mark Paid buttons found:', markPaidButtons.length);
    
    const markUnpaidButtons = document.querySelectorAll('button[onclick*="markAsUnpaid"]');
    console.log('� Mark Unpaid buttons found:', markUnpaidButtons.length);
};

console.log('�Bill Payment System loaded');
console.log('Features: Payment types, dates, references, notes, payment history');
console.log('Try running replacePaymentButtons() in console if buttons not replaced automatically');