// Bills Date Formatting System
// Ensures consistent MM/DD/YYYY date format across all bills operations

class BillsDateFormatter {
    constructor() {
        this.setupDateFormatting();
    }

    // Setup consistent date formatting for bills
    setupDateFormatting() {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                this.overrideBillsFunctions();
                this.formatExistingDates();
                this.addSortingButtons();
            }, 1000);
        });
    }

    // Add sorting buttons to the bills page
    addSortingButtons() {
        // Find the filter buttons container
        const filterContainer = document.querySelector('#bills-list div[style*="margin-bottom"]');
        if (!filterContainer) {
            console.log('Could not find bills filter container');
            return;
        }

        // Check if sorting buttons already exist
        if (filterContainer.querySelector('[onclick*="sortBills"]')) {
            console.log('Sorting buttons already exist');
            return;
        }

        // Create and add sorting buttons
        const sortByDateCreatedBtn = document.createElement('button');
        sortByDateCreatedBtn.className = 'button';
        sortByDateCreatedBtn.style.cssText = 'background: #6f42c1; margin: 2px;';
        sortByDateCreatedBtn.textContent = 'Sort by Date Created';
        sortByDateCreatedBtn.onclick = () => this.sortBillsByDateCreated();

        const sortByDueDateBtn = document.createElement('button');
        sortByDueDateBtn.className = 'button';
        sortByDueDateBtn.style.cssText = 'background: #fd7e14; margin: 2px;';
        sortByDueDateBtn.textContent = 'Sort by Due Date';
        sortByDueDateBtn.onclick = () => this.sortBillsByDueDate();

        // Add buttons to container
        filterContainer.appendChild(sortByDateCreatedBtn);
        filterContainer.appendChild(sortByDueDateBtn);

        console.log('Added sorting buttons to bills page');
    }

    // Override original bills functions to use consistent date formatting
    overrideBillsFunctions() {
        // Override loadBills function if it exists
        if (typeof window.loadBills !== 'undefined') {
            const originalLoadBills = window.loadBills;
            
            window.loadBills = () => {
                // Call original function first
                originalLoadBills();
                
                // Then apply consistent date formatting
                setTimeout(() => this.formatAllBillDates(), 100);
            };
        }

        // Override filterBills function if it exists
        if (typeof window.filterBills !== 'undefined') {
            const originalFilterBills = window.filterBills;
            
            window.filterBills = (filter) => {
                console.log('Filtering bills with consistent date format:', filter);
                
                const bills = erpStorage.getBills();
                let filteredBills = [];
                
                if (filter === 'all') {
                    filteredBills = [...bills];
                } else if (filter === 'overdue') {
                    const today = new Date();
                    filteredBills = bills.filter(bill => {
                        const dueDate = new Date(bill.dueDate);
                        return dueDate < today && bill.status !== 'Paid';
                    });
                } else if (filter === 'paid') {
                    filteredBills = bills.filter(bill => bill.status === 'Paid');
                } else if (filter === 'unpaid') {
                    filteredBills = bills.filter(bill => bill.status === 'Unpaid');
                } else {
                    // Fallback to original function for other filters
                    originalFilterBills(filter);
                    return;
                }
                
                // Display filtered bills with consistent formatting
                this.displayBillsWithFormatting(filteredBills, `Filtered: ${filter.charAt(0).toUpperCase() + filter.slice(1)}`);
            };
        }
    }

    // Display bills with consistent date formatting
    displayBillsWithFormatting(bills, description) {
        const tbody = document.getElementById('bills-tbody');
        if (!tbody) {
            console.error('Bills table body not found');
            return;
        }
        
        // Clear existing rows
        tbody.innerHTML = '';
        
        // Add bills with formatted dates
        bills.forEach(bill => {
            const row = document.createElement('tr');
            
            // Determine row style based on status
            if (bill.status === 'Overdue') {
                row.style.backgroundColor = '#ffebee'; // Light red
            } else if (bill.status === 'Paid') {
                row.style.backgroundColor = '#e8f5e8'; // Light green
            }
            
            // Format attachment display
            let attachmentDisplay = 'No';
            if (bill.attachment) {
                attachmentDisplay = `<a href="#" class="attachment-link">📎 ${bill.attachment.name}</a>`;
            }
            
            row.innerHTML = `
                <td>${bill.vendorName}</td>
                <td>${bill.description}</td>
                <td>$${bill.amount.toFixed(2)}</td>
                <td>${this.formatDate(bill.dueDate)}</td>
                <td>${this.formatDate(bill.dateCreated)}</td>
                <td><span class="status ${bill.status.toLowerCase()}">${bill.status}</span></td>
                <td>${attachmentDisplay}</td>
                <td>
                    <button onclick="viewBill(${bill.id})" class="button action-btn-view">View</button>
                    <button onclick="markBillAsPaid(${bill.id})" class="button action-btn-paid">Mark Paid</button>
                    <button onclick="editBill(${bill.id})" class="button action-btn-edit">Edit</button>
                    <button onclick="deleteBill(${bill.id})" class="button action-btn-delete">Delete</button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Add attachment buttons
        setTimeout(() => {
            if (typeof billAttachmentManager !== 'undefined' && billAttachmentManager.addAttachmentButtons) {
                billAttachmentManager.addAttachmentButtons();
            }
        }, 100);
        
        console.log(`Bills displayed with ${description} - consistent MM/DD/YYYY format`);
    }

    // Format existing dates in the bills table
    formatAllBillDates() {
        const billRows = document.querySelectorAll('#bills-tbody tr');
        
        billRows.forEach(row => {
            // Due Date column (assuming it's column 3)
            const dueDateCell = row.cells[3];
            if (dueDateCell) {
                const dateText = dueDateCell.textContent.trim();
                if (dateText && dateText !== 'N/A') {
                    dueDateCell.textContent = this.formatDate(dateText);
                }
            }
            
            // Date Created column (assuming it's column 4)
            const dateCreatedCell = row.cells[4];
            if (dateCreatedCell) {
                const dateText = dateCreatedCell.textContent.trim();
                if (dateText && dateText !== 'N/A') {
                    dateCreatedCell.textContent = this.formatDate(dateText);
                }
            }
        });
        
        console.log('Formatted existing bill dates to MM/DD/YYYY');
    }

    // Format existing dates on page load
    formatExistingDates() {
        // Wait a bit for the table to load, then format dates
        setTimeout(() => {
            this.formatAllBillDates();
        }, 500);
        
        // Monitor for table changes and reformat
        this.monitorBillsTable();
    }

    // Monitor bills table for changes
    monitorBillsTable() {
        const billsTable = document.getElementById('bills-tbody');
        if (!billsTable) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    setTimeout(() => {
                        this.formatAllBillDates();
                    }, 100);
                }
            });
        });

        observer.observe(billsTable, { childList: true, subtree: true });
        console.log('Monitoring bills table for date format consistency');
    }

    // Utility function to format dates consistently as MM/DD/YYYY
    formatDate(dateString) {
        if (!dateString || dateString === 'N/A') return dateString;
        
        try {
            const date = new Date(dateString);
            
            // Check if date is valid
            if (isNaN(date.getTime())) return dateString;
            
            // Get components
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
            const day = String(date.getDate()).padStart(2, '0');
            const year = date.getFullYear();
            
            return `${month}/${day}/${year}`;
        } catch (error) {
            console.warn('Date formatting error:', error, dateString);
            return dateString; // Return original if formatting fails
        }
    }

    // Sort bills by date created
    sortBillsByDateCreated() {
        console.log('Sorting bills by Date Created...');
        
        const bills = erpStorage.getBills();
        if (bills.length === 0) {
            console.log('No bills to sort');
            return;
        }
        
        // Sort bills by date created (newest first)
        bills.sort((a, b) => {
            const dateA = new Date(a.dateCreated);
            const dateB = new Date(b.dateCreated);
            return dateB - dateA; // Descending (newest first)
        });
        
        this.displayBillsWithFormatting(bills, 'Date Created (Newest First)');
    }

    // Sort bills by due date
    sortBillsByDueDate() {
        console.log('Sorting bills by Due Date...');
        
        const bills = erpStorage.getBills();
        if (bills.length === 0) {
            console.log('No bills to sort');
            return;
        }
        
        // Sort bills by due date (earliest first for prioritization)
        bills.sort((a, b) => {
            const dateA = new Date(a.dueDate);
            const dateB = new Date(b.dueDate);
            return dateA - dateB; // Ascending (earliest first)
        });
        
        this.displayBillsWithFormatting(bills, 'Due Date (Earliest First)');
    }
}

// Create global instance
window.billsDateFormatter = new BillsDateFormatter();

// Make sorting functions globally available (multiple approaches for reliability)
window.sortBillsByDateCreated = () => billsDateFormatter.sortBillsByDateCreated();
window.sortBillsByDueDate = () => billsDateFormatter.sortBillsByDueDate();

// Also attach to the formatter instance for the buttons
billsDateFormatter.sortBillsByDateCreated = function() {
    console.log('Sorting bills by Date Created...');
    
    const bills = erpStorage.getBills();
    if (bills.length === 0) {
        console.log('No bills to sort');
        return;
    }
    
    // Sort bills by date created (newest first)
    bills.sort((a, b) => {
        const dateA = new Date(a.dateCreated);
        const dateB = new Date(b.dateCreated);
        return dateB - dateA; // Descending (newest first)
    });
    
    this.displayBillsWithFormatting(bills, 'Date Created (Newest First)');
};

billsDateFormatter.sortBillsByDueDate = function() {
    console.log('Sorting bills by Due Date...');
    
    const bills = erpStorage.getBills();
    if (bills.length === 0) {
        console.log('No bills to sort');
        return;
    }
    
    // Sort bills by due date (earliest first for prioritization)
    bills.sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return dateA - dateB; // Ascending (earliest first)
    });
    
    this.displayBillsWithFormatting(bills, 'Due Date (Earliest First)');
};

console.log('Bills Date Formatter loaded');
console.log('All dates will use MM/DD/YYYY format consistently');
console.log('Added date sorting options for bills');
console.log('🔘 Sorting buttons will be automatically added to the page');