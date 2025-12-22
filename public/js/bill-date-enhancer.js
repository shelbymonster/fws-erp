// Bill Date Field Enhancement
// Adds bill date field to the add bill form

class BillDateEnhancer {
    constructor() {
        this.setupBillDateField();
    }

    setupBillDateField() {
        document.addEventListener('DOMContentLoaded', () => {
            // Try multiple times to ensure the form is fully loaded
            setTimeout(() => this.addBillDateField(), 500);
            setTimeout(() => this.addBillDateField(), 1000);
            setTimeout(() => this.addBillDateField(), 2000);
            
            // Also monitor for when the form becomes visible
            this.monitorFormVisibility();
        });
    }

    // Monitor when the add bill form becomes visible and add the field
    monitorFormVisibility() {
        const formContainer = document.getElementById('add-bill-form');
        if (!formContainer) {
            console.log('Add bill form container not found');
            return;
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const isVisible = !formContainer.style.display || formContainer.style.display !== 'none';
                    if (isVisible && !document.getElementById('billDate')) {
                        setTimeout(() => this.addBillDateField(), 100);
                    }
                }
            });
        });

        observer.observe(formContainer, { attributes: true });
        console.log('Monitoring add bill form visibility');
    }

    addBillDateField() {
        // Check if bill date field already exists in HTML
        const billDateField = document.getElementById('billDate');
        if (billDateField) {
            console.log('Bill Date field already exists in HTML - no enhancement needed');
            // Just set up the default date functionality
            this.setupDefaultBillDate();
            return;
        }

        console.log('Bill Date field not found in HTML - enhancement disabled since field should be in HTML now');
    }

    // Fallback method to add bill date after amount field within the form
    addBillDateAfterAmountInForm(form) {
        const amountField = form.querySelector('#billAmount');
        if (!amountField) {
            console.log('Amount field not found in form');
            return;
        }

        const amountParent = amountField.parentElement;
        if (!amountParent) {
            console.log('Amount parent element not found');
            return;
        }

        // Create Bill Date div element
        const billDateDiv = document.createElement('div');
        billDateDiv.className = 'form-row';
        billDateDiv.innerHTML = `
            <label>Bill Date:</label>
            <input type="date" id="billDate" required class="description-input">
            <small class="file-help-text">Date on vendor's bill/invoice</small>
        `;

        // Insert after amount field's parent div, but inside the form
        amountParent.parentNode.insertBefore(billDateDiv, amountParent.nextSibling);

        console.log('Added Bill Date field after Amount field within form (fallback)');
    }

    setupDefaultBillDate() {
        // Override the showAddBillForm function to set default bill date
        const originalShowAddBillForm = window.showAddBillForm;
        if (originalShowAddBillForm) {
            window.showAddBillForm = function() {
                originalShowAddBillForm();
                
                // Set default bill date to today
                const billDateField = document.getElementById('billDate');
                if (billDateField && !billDateField.value) {
                    const today = new Date().toISOString().split('T')[0];
                    billDateField.value = today;
                }
            };
        }
    }
}

// Initialize the bill date enhancer
window.billDateEnhancer = new BillDateEnhancer();

console.log('Bill Date Field Enhancement loaded');
console.log('Features: Bill date input field, default to today, helper text');