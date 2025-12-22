// Customer management functionality with LocalStorage
let customers = [];
let currentCustomerId = null;
let editingCustomerId = null;

// Load customers from storage
function loadCustomers() {
    console.log('Loading customers from storage...');
    if (typeof erpStorage === 'undefined') {
        console.error('erpStorage is not defined!');
        return;
    }
    customers = erpStorage.getCustomers();
    console.log('Loaded customers:', customers);
    // Ensure each customer has attachments and notes
    customers.forEach(customer => {
        if (!customer.attachments) {
            customer.attachments = [];
        }
        if (!customer.notes) {
            customer.notes = '';
        }
    });
}

// Display customers in the sidebar list
function displayCustomers() {
    const customersList = document.getElementById('customers-list');
    customersList.innerHTML = '';
    
    if (customers.length === 0) {
        customersList.innerHTML = '<p class="empty-list-message">No customers yet. Click "Add New Customer" to get started.</p>';
        return;
    }
    
    customers.forEach(customer => {
        const customerItem = document.createElement('div');
        customerItem.className = 'vendor-list-item';
        if (currentCustomerId === customer.id) {
            customerItem.classList.add('active');
        }
        customerItem.innerHTML = `
            <span>${customer.name}</span>
        `;
        customerItem.onclick = () => showCustomerProfile(customer.id);
        customersList.appendChild(customerItem);
    });
}

// Show customer profile
function showCustomerProfile(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    currentCustomerId = customerId;
    
    // Update active state in list
    displayCustomers();
    
    // Hide empty state and show profile
    document.getElementById('customer-profile-empty').style.display = 'none';
    document.getElementById('customer-profile').style.display = 'block';
    
    // Display customer profile
    const profileContainer = document.getElementById('customer-profile');
    profileContainer.innerHTML = `
        <div class="vendor-profile-header">
            <h2>${customer.name}</h2>
            <div class="vendor-actions">
                <button class="button button-warning" onclick="showEditCustomerForm(${customer.id})">Edit Customer</button>
                <button class="button button-danger" onclick="deleteCustomer(${customer.id})">Delete Customer</button>
            </div>
        </div>
        
        <div class="vendor-profile-content">
            <div class="vendor-info-section">
                <h3>Contact Information</h3>
                <div class="vendor-info-grid">
                    <div class="vendor-info-item">
                        <label>Customer ID:</label>
                        <p><strong>${customer.customerId || 'Not set'}</strong></p>
                    </div>
                    <div class="vendor-info-item">
                        <label>Email Address:</label>
                        <p>${customer.email || 'Not provided'}</p>
                    </div>
                    <div class="vendor-info-item">
                        <label>Phone Number:</label>
                        <p>${customer.phone || 'Not provided'}</p>
                    </div>
                    <div class="vendor-info-item">
                        <label>Contact Name:</label>
                        <p>${customer.contactName || 'Not provided'}</p>
                    </div>
                    <div class="vendor-info-item">
                        <label>Street Address:</label>
                        <p>${customer.address || 'Not provided'}</p>
                    </div>
                </div>
            </div>
            
            <div class="vendor-attachments-section">
                <h3>Attachments</h3>
                <div class="attachments-area">
                    <div class="attachment-upload">
                        <input type="file" id="customer-attachment-${customer.id}" onchange="handleAttachmentUpload(${customer.id}, this)" class="hidden" multiple>
                        <button class="button" onclick="document.getElementById('customer-attachment-${customer.id}').click()">
                            <span class="file-icon-large">📎</span> Add Attachment
                        </button>
                    </div>
                    <div class="attachments-list" id="attachments-list-${customer.id}">
                        ${displayAttachments(customer)}
                    </div>
                </div>
            </div>
            
            <div class="vendor-attachments-section">
                <h3>Notes</h3>
                <div class="notes-area">
                    <textarea id="customer-notes-${customer.id}" class="notes-textarea" placeholder="Add notes about this customer..." onblur="saveCustomerNotes(${customer.id})">${customer.notes || ''}</textarea>
                    <p class="notes-hint">Notes are automatically saved when you click outside the text box</p>
                </div>
            </div>
        </div>
    `;
}

// Display attachments
function displayAttachments(customer) {
    if (!customer.attachments || customer.attachments.length === 0) {
        return '<p class="no-attachments">No attachments yet</p>';
    }
    
    return customer.attachments.map((attachment, index) => `
        <div class="attachment-item">
            <span class="attachment-icon"></span>
            <span class="attachment-name">${attachment.name}</span>
            <span class="attachment-size">(${formatFileSize(attachment.size)})</span>
            <button class="button-small delete-attachment" onclick="deleteAttachment(${customer.id}, ${index})" title="Delete">
                ✕
            </button>
        </div>
    `).join('');
}

// Format file size
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

// Handle attachment upload
function handleAttachmentUpload(customerId, input) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const files = Array.from(input.files);
    if (files.length === 0) return;
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const attachment = {
                name: file.name,
                size: file.size,
                type: file.type,
                data: e.target.result,
                dateAdded: new Date().toISOString()
            };
            
            if (!customer.attachments) {
                customer.attachments = [];
            }
            customer.attachments.push(attachment);
            
            // Save to storage
            erpStorage.updateCustomer(customerId, customer);
            
            // Refresh display
            showCustomerProfile(customerId);
        };
        reader.readAsDataURL(file);
    });
    
    // Clear input
    input.value = '';
}

// Delete attachment
function deleteAttachment(customerId, attachmentIndex) {
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    customer.attachments.splice(attachmentIndex, 1);
    erpStorage.updateCustomer(customerId, customer);
    
    loadCustomers();
    showCustomerProfile(customerId);
}

// Save customer notes
function saveCustomerNotes(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const notesTextarea = document.getElementById(`customer-notes-${customerId}`);
    if (!notesTextarea) return;
    
    customer.notes = notesTextarea.value;
    erpStorage.updateCustomer(customerId, customer);
    
    console.log('Notes saved for customer', customerId);
}

// Show add customer form
function showAddCustomerForm() {
    editingCustomerId = null;
    document.getElementById('customer-form-title').textContent = 'Add New Customer';
    document.getElementById('customer-form-submit').textContent = 'Add Customer';
    document.getElementById('customer-form').reset();    
    // Clear and enable customerId field
    const customerIdInput = document.getElementById('customerId');
    if (customerIdInput) {
        customerIdInput.value = '';
        customerIdInput.removeAttribute('readonly');
    }
        document.getElementById('customer-form-modal').style.display = 'flex';
}

// Show edit customer form
function showEditCustomerForm(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    editingCustomerId = customerId;
    document.getElementById('customer-form-title').textContent = 'Edit Customer';
    document.getElementById('customer-form-submit').textContent = 'Update Customer';
    
    document.getElementById('customerName').value = customer.name;
    
    // Set and make customerId readonly when editing
    const customerIdInput = document.getElementById('customerId');
    if (customerIdInput) {
        customerIdInput.value = customer.customerId || '';
        customerIdInput.setAttribute('readonly', 'readonly');
    }
    
    document.getElementById('customerEmail').value = customer.email;
    document.getElementById('customerPhone').value = customer.phone || '';
    document.getElementById('customerContact').value = customer.contactName || '';
    document.getElementById('customerAddress').value = customer.address || '';
    
    document.getElementById('customer-form-modal').style.display = 'flex';
}

// Hide customer form
function hideCustomerForm() {
    document.getElementById('customer-form-modal').style.display = 'none';
    document.getElementById('customer-form').reset();
    editingCustomerId = null;
}

// Save customer (add or update)
// Auto-generate Customer ID from customer name
function autoGenerateCustomerId() {
    const nameInput = document.getElementById('customerName');
    const idInput = document.getElementById('customerId');
    
    // Only auto-generate if the ID field is empty or was previously auto-generated
    if (!nameInput || !idInput) return;
    if (editingCustomerId) return; // Don't auto-generate when editing
    
    const name = nameInput.value.trim();
    if (!name) {
        idInput.value = '';
        return;
    }
    
    // Generate base ID from first 4-5 letters of name (uppercase, no spaces)
    let baseId = name.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 5);
    if (baseId.length < 4) {
        baseId = name.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 4);
    }
    
    // Check if this ID already exists
    let finalId = baseId;
    let counter = 1;
    
    while (customers.some(c => c.customerId === finalId && (!editingCustomerId || c.id !== editingCustomerId))) {
        // If ID exists, shorten to 3-4 chars and add number
        const shortBase = baseId.substring(0, Math.min(4, baseId.length));
        finalId = shortBase + counter;
        counter++;
    }
    
    idInput.value = finalId;
}

function saveCustomer(event) {
    event.preventDefault();
    
    const customerId = document.getElementById('customerId').value.trim().toUpperCase();
    
    // Validate customerId format (4-5 alphanumeric characters)
    if (!/^[A-Z0-9]{4,5}$/.test(customerId)) {
        alert('Customer ID must be 4-5 letters/numbers (e.g., ACME or ACME1)');
        return;
    }
    
    // Check for duplicate customerId (when creating new or changing existing)
    const duplicateCustomer = customers.find(c => 
        c.customerId === customerId && 
        (!editingCustomerId || c.id !== editingCustomerId)
    );
    
    if (duplicateCustomer) {
        alert(`Customer ID "${customerId}" is already in use by ${duplicateCustomer.name}. Please choose a different ID.`);
        return;
    }
    
    const customerData = {
        customerId: customerId,
        name: document.getElementById('customerName').value,
        email: document.getElementById('customerEmail').value,
        phone: document.getElementById('customerPhone').value,
        contactName: document.getElementById('customerContact').value,
        address: document.getElementById('customerAddress').value
    };
    
    if (editingCustomerId) {
        // Update existing customer
        if (erpStorage.updateCustomer(editingCustomerId, customerData)) {
            loadCustomers();
            displayCustomers();
            showCustomerProfile(editingCustomerId);
            hideCustomerForm();
            alert('Customer updated successfully!');
        } else {
            alert('Error updating customer. Please try again.');
        }
    } else {
        // Add new customer
        customerData.attachments = [];
        customerData.notes = '';
        if (erpStorage.addCustomer(customerData)) {
            loadCustomers();
            displayCustomers();
            hideCustomerForm();
            alert('Customer added successfully!');
        } else {
            alert('Error saving customer. Please try again.');
        }
    }
}

// Delete customer
function deleteCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) {
        alert('Customer not found!');
        return;
    }
    
    if (confirm(`Are you sure you want to delete "${customer.name}"?\n\nThis will permanently remove this customer and cannot be undone.`)) {
        if (erpStorage.deleteCustomer(id)) {
            loadCustomers();
            displayCustomers();
            
            // Hide profile and show empty state
            currentCustomerId = null;
            document.getElementById('customer-profile').style.display = 'none';
            document.getElementById('customer-profile-empty').style.display = 'flex';
            
            alert('Customer deleted successfully!');
        } else {
            alert('Error deleting customer. Please try again.');
        }
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Show loading skeleton
    LoadingState.showListLoading('customers-list', 5);
    
    // Simulate async load
    await LoadingState.simulateAsync(() => {
        loadCustomers();
    }, 400);
    
    displayCustomers();
    
    // Close modal when clicking outside of it
    window.onclick = function(event) {
        const modal = document.getElementById('customer-form-modal');
        if (event.target === modal) {
            hideCustomerForm();
        }
    };
});

// Search and Filter Functions
let currentCustomerSearchTerm = '';

function searchCustomers() {
    const searchInput = document.getElementById('customerSearchInput');
    const clearButton = document.getElementById('customerSearchClear');
    currentCustomerSearchTerm = searchInput.value.toLowerCase().trim();
    
    // Show/hide clear button
    if (currentCustomerSearchTerm.length > 0) {
        clearButton.classList.add('visible');
    } else {
        clearButton.classList.remove('visible');
    }
    
    applyCustomerFilters();
}

function clearCustomerSearch() {
    const searchInput = document.getElementById('customerSearchInput');
    const clearButton = document.getElementById('customerSearchClear');
    searchInput.value = '';
    currentCustomerSearchTerm = '';
    clearButton.classList.remove('visible');
    applyCustomerFilters();
}

function applyCustomerFilters() {
    const listContainer = document.getElementById('customers-list');
    listContainer.innerHTML = '';
    
    let filteredCustomers = customers;
    
    // Apply search filter
    if (currentCustomerSearchTerm) {
        filteredCustomers = customers.filter(customer => {
            const name = customer.name ? customer.name.toLowerCase() : '';
            const email = customer.email ? customer.email.toLowerCase() : '';
            const phone = customer.phone ? customer.phone.toLowerCase() : '';
            const company = customer.company ? customer.company.toLowerCase() : '';
            
            return name.includes(currentCustomerSearchTerm) ||
                   email.includes(currentCustomerSearchTerm) ||
                   phone.includes(currentCustomerSearchTerm) ||
                   company.includes(currentCustomerSearchTerm);
        });
    }
    
    if (filteredCustomers.length === 0) {
        listContainer.innerHTML = '<p style="padding: 20px; color: #666;">No customers found.</p>';
        return;
    }
    
    filteredCustomers.forEach((customer, index) => {
        const customerItem = document.createElement('div');
        customerItem.className = 'vendor-item';
        if (index === 0) {
            customerItem.classList.add('active');
        }
        customerItem.onclick = () => selectCustomer(customer.id);
        customerItem.innerHTML = `
            <div class="vendor-name">${customer.name}</div>
            <div class="vendor-company">${customer.company || ''}</div>
        `;
        listContainer.appendChild(customerItem);
    });
    
    // Auto-select first customer if any exist
    if (filteredCustomers.length > 0) {
        selectCustomer(filteredCustomers[0].id);
    } else {
        // Show empty state
        document.getElementById('customer-profile').classList.add('hidden');
        document.getElementById('customer-profile-empty').classList.remove('hidden');
    }
}

window.searchCustomers = searchCustomers;
window.clearCustomerSearch = clearCustomerSearch;

// Export functions
function exportCustomersToCSV() {
    const formattedData = ExportUtility.formatCustomersForExport(customers);
    const filename = `customers_${ExportUtility.getDateForFilename()}.csv`;
    ExportUtility.exportToCSV(formattedData, filename);
}

function exportCustomersToJSON() {
    const filename = `customers_${ExportUtility.getDateForFilename()}.json`;
    ExportUtility.exportToJSON(customers, filename);
}

window.exportCustomersToCSV = exportCustomersToCSV;
window.exportCustomersToJSON = exportCustomersToJSON;

console.log('Customer search functionality enabled');