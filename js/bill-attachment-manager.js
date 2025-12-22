// Enhanced Bills Attachment System
// Allows adding attachments to existing bills

class BillAttachmentManager {
    constructor() {
        this.attachments = this.loadAttachments();
        this.setupAttachmentHandlers();
    }

    // Load attachments from storage (separate from bills for flexibility)
    loadAttachments() {
        return erpStorage.getItem('bill_attachments', {});
    }

    // Save attachments to storage
    saveAttachments() {
        return erpStorage.setItem('bill_attachments', this.attachments);
    }

    // Setup event handlers for attachment functionality
    setupAttachmentHandlers() {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                this.addAttachmentButtons();
                this.monitorBillsTable();
            }, 1000);
        });
    }

    // Add attachment buttons to existing bills
    addAttachmentButtons() {
        const billRows = document.querySelectorAll('#bills-tbody tr');
        
        billRows.forEach(row => {
            this.addAttachmentButtonToRow(row);
        });
    }

    // Add attachment button to a specific bill row
    addAttachmentButtonToRow(row) {
        const actionsCell = row.cells[row.cells.length - 1]; // Last cell (Actions)
        if (!actionsCell) return;

        // Check if attachment button already exists
        if (actionsCell.querySelector('.attachment-btn')) return;

        // Extract bill ID from existing buttons
        const existingButton = actionsCell.querySelector('button');
        if (!existingButton) return;

        const onclickText = existingButton.getAttribute('onclick');
        const idMatch = onclickText.match(/\((\d+)\)/);
        if (!idMatch) return;

        const billId = parseInt(idMatch[1]);

        // Create attachment button
        const attachButton = document.createElement('button');
        attachButton.className = 'button attachment-btn';
        attachButton.style.cssText = 'background: #17a2b8; margin: 2px; font-size: 12px;';
        attachButton.textContent = '📎 Attach';
        attachButton.onclick = () => this.showAttachmentDialog(billId);

        // Add button to actions cell
        actionsCell.appendChild(attachButton);

        console.log('📎 Added attachment button for bill ID:', billId);
    }

    // Monitor bills table for changes
    monitorBillsTable() {
        const billsTable = document.getElementById('bills-tbody');
        if (!billsTable) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    setTimeout(() => this.addAttachmentButtons(), 100);
                }
            });
        });

        observer.observe(billsTable, { childList: true, subtree: true });
    }

    // Show attachment dialog for a bill
    showAttachmentDialog(billId) {
        const bill = this.getBillById(billId);
        if (!bill) {
            alert('Bill not found!');
            return;
        }

        // Create dialog HTML
        const dialogHTML = `
            <div id="attachment-dialog" class="attachment-dialog">
                <div class="attachment-dialog-content">
                    <h3>Manage Attachments - ${bill.description}</h3>
                    <p><strong>Vendor:</strong> ${bill.vendorName}</p>
                    <p><strong>Amount:</strong> $${bill.amount.toFixed(2)}</p>
                    
                    <div class="attachment-current-section">
                        <h4>Current Attachment:</h4>
                        <div id="current-attachments">
                            ${this.renderCurrentAttachments(billId)}
                        </div>
                    </div>
                    
                    <div class="attachment-upload-section">
                        <h4>Upload New Attachment:</h4>
                        <input type="file" id="attachment-file-input" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xlsx,.xls" class="attachment-file-input">
                        <button onclick="billAttachmentManager.addAttachment(${billId})" class="button button-success">Upload Attachment</button>
                    </div>
                    
                    <div class="attachment-actions">
                        <button onclick="billAttachmentManager.closeAttachmentDialog()" class="button button-secondary">Close</button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing dialog if any
        this.closeAttachmentDialog();

        // Add dialog to page
        document.body.insertAdjacentHTML('beforeend', dialogHTML);
    }

    // Render current attachments for a bill
    renderCurrentAttachments(billId) {
        const bill = this.getBillById(billId);
        const billAttachments = this.attachments[billId] || [];
        
        let html = '';

        // Show original attachment if it exists
        if (bill.attachment) {
            html += `
                <div class="attachment-item-box">
                    <span>${bill.attachment.name}</span>
                    <span class="attachment-size-text">(${bill.attachment.size})</span>
                    <button onclick="billAttachmentManager.removeOriginalAttachment(${billId})" class="attachment-remove-button">Remove</button>
                </div>
            `;
        }

        // Show additional attachments
        billAttachments.forEach((attachment, index) => {
            html += `
                <div class="attachment-item-box">
                    <span>${attachment.name}</span>
                    <span class="attachment-size-text">(${attachment.size})</span>
                    <button onclick="billAttachmentManager.removeAttachment(${billId}, ${index})" class="attachment-remove-button">Remove</button>
                </div>
            `;
        });

        if (html === '') {
            html = '<p class="text-muted font-italic">No attachments</p>';
        }

        return html;
    }

    // Add new attachment to a bill
    addAttachment(billId) {
        const fileInput = document.getElementById('attachment-file-input');
        const file = fileInput.files[0];

        if (!file) {
            alert('Please select a file to attach.');
            return;
        }

        // Create attachment object
        const attachment = {
            name: file.name,
            size: this.formatFileSize(file.size),
            dateAdded: new Date().toISOString(),
            type: file.type || 'unknown'
        };

        // Add to attachments storage
        if (!this.attachments[billId]) {
            this.attachments[billId] = [];
        }
        this.attachments[billId].push(attachment);

        // Save to storage
        this.saveAttachments();

        // Refresh the dialog
        this.showAttachmentDialog(billId);

        // Refresh bills table to show attachment indicator
        this.refreshBillsDisplay();

        console.log('📎 Attachment added to bill:', billId, attachment);
        alert(`Attachment "${attachment.name}" added successfully!`);
    }

    // Remove attachment from a bill
    removeAttachment(billId, attachmentIndex) {
        if (!confirm('Are you sure you want to remove this attachment?')) {
            return;
        }

        if (this.attachments[billId]) {
            this.attachments[billId].splice(attachmentIndex, 1);
            
            // Clean up empty arrays
            if (this.attachments[billId].length === 0) {
                delete this.attachments[billId];
            }
            
            this.saveAttachments();
            this.showAttachmentDialog(billId);
            this.refreshBillsDisplay();
            
            console.log('📎 Attachment removed from bill:', billId);
        }
    }

    // Remove original attachment from bill
    removeOriginalAttachment(billId) {
        if (!confirm('Are you sure you want to remove this attachment?')) {
            return;
        }

        const bills = erpStorage.getBills();
        const bill = bills.find(b => b.id === billId);
        
        if (bill) {
            bill.attachment = null;
            erpStorage.setBills(bills);
            this.showAttachmentDialog(billId);
            this.refreshBillsDisplay();
            
            console.log('📎 Original attachment removed from bill:', billId);
        }
    }

    // Close attachment dialog
    closeAttachmentDialog() {
        const dialog = document.getElementById('attachment-dialog');
        if (dialog) {
            dialog.remove();
        }
    }

    // Get bill by ID
    getBillById(billId) {
        const bills = erpStorage.getBills();
        return bills.find(b => b.id === billId);
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Check if bill has attachments (including additional ones)
    hasAttachments(billId) {
        const bill = this.getBillById(billId);
        const additionalAttachments = this.attachments[billId] || [];
        return (bill && bill.attachment) || additionalAttachments.length > 0;
    }

    // Get total attachment count for a bill
    getAttachmentCount(billId) {
        const bill = this.getBillById(billId);
        const additionalAttachments = this.attachments[billId] || [];
        let count = additionalAttachments.length;
        if (bill && bill.attachment) count++;
        return count;
    }

    // Refresh bills display (call existing function if available)
    refreshBillsDisplay() {
        if (typeof loadBills === 'function') {
            setTimeout(loadBills, 100);
        }
    }
}

// Create global instance
window.billAttachmentManager = new BillAttachmentManager();

console.log('📎 Bill Attachment Manager loaded');
console.log('📎 Features: Add attachments to existing bills, manage multiple attachments');