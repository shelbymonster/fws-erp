// Customer Notes Table Column System
// Adds editable notes column to customer table

class CustomerNotesManager {
    constructor() {
        this.setupNotesColumn();
    }

    // Setup notes column for customers table
    setupNotesColumn() {
        document.addEventListener('DOMContentLoaded', () => {
            // Try multiple times with different delays
            setTimeout(() => this.addNotesColumn(), 500);
            setTimeout(() => this.addNotesColumn(), 1000);
            setTimeout(() => this.addNotesColumn(), 2000);
            setTimeout(() => this.addNotesColumn(), 3000);
            
            setTimeout(() => {
                this.monitorCustomerTable();
            }, 1000);
        });

        // Also try when page is fully loaded
        window.addEventListener('load', () => {
            setTimeout(() => this.addNotesColumn(), 1000);
        });
    }

    // Add notes column to customer table
    addNotesColumn() {
        console.log('Attempting to add Notes column...');
        
        // Try multiple selectors to find the customer table
        let customerTable = document.getElementById('customers-table') ||
                           document.querySelector('table') ||
                           document.querySelector('#customer-table') ||
                           document.querySelector('.table');

        if (!customerTable) {
            console.log('Customer table not found');
            return;
        }

        console.log('Found customer table:', customerTable.id || 'unnamed table');

        // Find the header row
        const headerRow = customerTable.querySelector('thead tr') || 
                         customerTable.querySelector('tr');

        if (!headerRow) {
            console.log('Header row not found');
            return;
        }

        console.log('Found header row with', headerRow.children.length, 'columns');

        // Check if Notes column already exists
        const headers = Array.from(headerRow.children);
        const hasNotesColumn = headers.some(th => th.textContent.trim() === 'Notes');
        
        if (hasNotesColumn) {
            console.log('Notes column already exists');
            return;
        }

        // Add Notes header before Actions (last column)
        const notesHeader = document.createElement('th');
        notesHeader.textContent = 'Notes';
        notesHeader.style.width = '200px';
        
        // Insert before the last column (Actions)
        const lastHeader = headerRow.lastElementChild;
        headerRow.insertBefore(notesHeader, lastHeader);
        
        console.log('Added Notes header to customer table');

        // Add notes cells to existing customer rows
        this.addNotesToAllRows(customerTable);
    }

    // Add notes cells to all customer rows
    addNotesToAllRows(customerTable) {
        const tbody = customerTable.querySelector('tbody') || customerTable;
        const customerRows = tbody.querySelectorAll('tr');
        
        console.log('Found', customerRows.length, 'customer rows');
        
        customerRows.forEach((row, index) => {
            // Skip header row if no tbody
            if (row.parentElement.tagName === 'THEAD') return;
            
            this.addNotesToRow(row, index);
        });

        console.log('Added notes cells to all customer rows');
    }

    // Add notes cell to a specific customer row
    addNotesToRow(row, index) {
        // Check if notes cell already exists
        if (row.querySelector('.notes-cell')) {
            return;
        }

        // Try to extract customer ID from buttons or use row index as fallback
        let customerId = index + 1; // Default fallback
        
        const existingButton = row.querySelector('button');
        if (existingButton) {
            const onclickText = existingButton.getAttribute('onclick');
            const idMatch = onclickText ? onclickText.match(/\((\d+)\)/) : null;
            if (idMatch) {
                customerId = parseInt(idMatch[1]);
            }
        }

        console.log('Adding notes cell to customer ID:', customerId);

        // Get customer data
        const customers = erpStorage.getCustomers();
        const customer = customers.find(c => c.id === customerId);
        
        // Create editable notes cell
        const notesCell = document.createElement('td');
        notesCell.className = 'notes-cell';
        notesCell.style.cssText = 'padding: 8px; max-width: 200px;';
        
        const currentNotes = (customer && customer.notes) ? customer.notes : '';
        
        // Create editable input field
        const notesInput = document.createElement('input');
        notesInput.type = 'text';
        notesInput.maxLength = 50;
        notesInput.value = currentNotes;
        notesInput.placeholder = 'Add notes...';
        notesInput.style.cssText = 'width: 180px; padding: 4px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;';
        
        // Add save functionality on blur and enter
        notesInput.addEventListener('blur', () => this.saveNotes(customerId, notesInput.value));
        notesInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                notesInput.blur(); // This will trigger the save
            }
        });

        // Add character counter
        const charCounter = document.createElement('div');
        charCounter.style.cssText = 'font-size: 10px; color: #999; margin-top: 2px;';
        charCounter.textContent = `${currentNotes.length}/50`;

        notesInput.addEventListener('input', () => {
            const length = notesInput.value.length;
            charCounter.textContent = `${length}/50`;
            charCounter.style.color = length > 40 ? '#d9534f' : length > 30 ? '#f0ad4e' : '#999';
        });

        notesCell.appendChild(notesInput);
        notesCell.appendChild(charCounter);

        // Insert before Actions column (last column)
        const actionsCell = row.lastElementChild;
        if (actionsCell) {
            row.insertBefore(notesCell, actionsCell);
        } else {
            row.appendChild(notesCell);
        }

        console.log('Added notes cell to row for customer:', customerId);
    }

    // Save notes to storage
    saveNotes(customerId, notes) {
        const customers = erpStorage.getCustomers();
        const customer = customers.find(c => c.id === customerId);
        
        if (customer) {
            customer.notes = notes.trim();
            erpStorage.setCustomers(customers);
            console.log('Saved notes for customer', customerId, ':', notes);
            
            // Show brief save confirmation
            this.showSaveConfirmation();
        }
    }

    // Show brief save confirmation
    showSaveConfirmation() {
        // Remove any existing confirmation
        const existingConfirmation = document.querySelector('.notes-save-confirmation');
        if (existingConfirmation) {
            existingConfirmation.remove();
        }

        // Create new confirmation
        const confirmation = document.createElement('div');
        confirmation.className = 'notes-save-confirmation';
        confirmation.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #5cb85c;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            z-index: 1000;
            font-size: 12px;
        `;
        confirmation.textContent = 'Notes saved';
        document.body.appendChild(confirmation);

        // Remove after 2 seconds
        setTimeout(() => {
            confirmation.remove();
        }, 2000);
    }

    // Monitor customer table for changes
    monitorCustomerTable() {
        const table = document.getElementById('customers-table') || document.querySelector('table');
        if (!table) return;

        const tbody = table.querySelector('tbody') || table;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    console.log('Customer table changed, adding notes to new rows...');
                    setTimeout(() => {
                        this.addNotesToAllRows(table);
                    }, 100);
                }
            });
        });

        observer.observe(tbody, { childList: true, subtree: true });
        console.log('Monitoring customer table for changes');
    }
}

// Initialize the customer notes manager
document.addEventListener('DOMContentLoaded', () => {
    window.customerNotesManager = new CustomerNotesManager();
});

// Also create a manual trigger function for debugging
window.addCustomerNotes = function() {
    console.log('Manual trigger for customer notes...');
    if (window.customerNotesManager) {
        window.customerNotesManager.addNotesColumn();
    } else {
        window.customerNotesManager = new CustomerNotesManager();
    }
};

console.log('Customer Table Notes System loaded');
console.log('Features: Editable notes column in customer table, 50-character limit, auto-save');
console.log('Try running addCustomerNotes() in console if not working automatically');