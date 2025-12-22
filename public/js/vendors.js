// Vendor management functionality with LocalStorage
let vendors = [];
let currentVendorId = null;
let editingVendorId = null;

// Load vendors from storage
function loadVendors() {
    vendors = erpStorage.getVendors();
    // Ensure each vendor has an attachments array
    vendors.forEach(vendor => {
        if (!vendor.attachments) {
            vendor.attachments = [];
        }
    });
}

// Display vendors in the sidebar list
function displayVendors() {
    const vendorsList = document.getElementById('vendors-list');
    vendorsList.innerHTML = '';
    
    if (vendors.length === 0) {
        vendorsList.innerHTML = '<p class="empty-list-message">No vendors yet. Click "Add New Vendor" to get started.</p>';
        return;
    }
    
    vendors.forEach(vendor => {
        const vendorItem = document.createElement('div');
        vendorItem.className = 'vendor-list-item';
        if (currentVendorId === vendor.id) {
            vendorItem.classList.add('active');
        }
        vendorItem.innerHTML = `
            <span>${vendor.name}</span>
        `;
        vendorItem.onclick = () => showVendorProfile(vendor.id);
        vendorsList.appendChild(vendorItem);
    });
}

// Show vendor profile
function showVendorProfile(vendorId) {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;
    
    currentVendorId = vendorId;
    
    // Update active state in list
    displayVendors();
    
    // Hide empty state and show profile
    document.getElementById('vendor-profile-empty').style.display = 'none';
    document.getElementById('vendor-profile').style.display = 'block';
    
    // Display vendor profile
    const profileContainer = document.getElementById('vendor-profile');
    profileContainer.innerHTML = `
        <div class="vendor-profile-header">
            <h2>${vendor.name}</h2>
            <div class="vendor-actions">
                <button class="button button-warning" onclick="showEditVendorForm(${vendor.id})">Edit Vendor</button>
                <button class="button button-danger" onclick="deleteVendor(${vendor.id})">Delete Vendor</button>
            </div>
        </div>
        
        <div class="vendor-profile-content">
            <div class="vendor-info-section">
                <h3>Contact Information</h3>
                <div class="vendor-info-grid">
                    <div class="vendor-info-item">
                        <label>Email Address:</label>
                        <p>${vendor.email || 'Not provided'}</p>
                    </div>
                    <div class="vendor-info-item">
                        <label>Phone Number:</label>
                        <p>${vendor.phone || 'Not provided'}</p>
                    </div>
                    <div class="vendor-info-item">
                        <label>Contact Name:</label>
                        <p>${vendor.contactName || 'Not provided'}</p>
                    </div>
                    <div class="vendor-info-item">
                        <label>Street Address:</label>
                        <p>${vendor.address || 'Not provided'}</p>
                    </div>
                </div>
            </div>
            
            <div class="vendor-attachments-section">
                <h3>Attachments</h3>
                <div class="attachments-area">
                    <div class="attachment-upload">
                        <input type="file" id="vendor-attachment-${vendor.id}" onchange="handleAttachmentUpload(${vendor.id}, this)" class="hidden" multiple>
                        <button class="button" onclick="document.getElementById('vendor-attachment-${vendor.id}').click()">
                            <span class="file-icon-large">📎</span> Add Attachment
                        </button>
                    </div>
                    <div class="attachments-list" id="attachments-list-${vendor.id}">
                        ${displayAttachments(vendor)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Display attachments
function displayAttachments(vendor) {
    if (!vendor.attachments || vendor.attachments.length === 0) {
        return '<p class="no-attachments">No attachments yet</p>';
    }
    
    return vendor.attachments.map((attachment, index) => `
        <div class="attachment-item">
            <span class="attachment-icon"></span>
            <span class="attachment-name">${attachment.name}</span>
            <span class="attachment-size">(${formatFileSize(attachment.size)})</span>
            <button class="button-small delete-attachment" onclick="deleteAttachment(${vendor.id}, ${index})" title="Delete">
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
function handleAttachmentUpload(vendorId, input) {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;
    
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
            
            if (!vendor.attachments) {
                vendor.attachments = [];
            }
            vendor.attachments.push(attachment);
            
            // Save to storage
            erpStorage.updateVendor(vendorId, vendor);
            
            // Refresh display
            showVendorProfile(vendorId);
        };
        reader.readAsDataURL(file);
    });
    
    // Clear input
    input.value = '';
}

// Delete attachment
function deleteAttachment(vendorId, attachmentIndex) {
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;
    
    vendor.attachments.splice(attachmentIndex, 1);
    erpStorage.updateVendor(vendorId, vendor);
    
    loadVendors();
    showVendorProfile(vendorId);
}

// Show add vendor form
function showAddVendorForm() {
    editingVendorId = null;
    document.getElementById('vendor-form-title').textContent = 'Add New Vendor';
    document.getElementById('vendor-form-submit').textContent = 'Add Vendor';
    document.getElementById('vendor-form').reset();
    document.getElementById('vendor-form-modal').style.display = 'flex';
}

// Show edit vendor form
function showEditVendorForm(vendorId) {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;
    
    editingVendorId = vendorId;
    document.getElementById('vendor-form-title').textContent = 'Edit Vendor';
    document.getElementById('vendor-form-submit').textContent = 'Update Vendor';
    
    document.getElementById('vendorName').value = vendor.name;
    document.getElementById('vendorEmail').value = vendor.email;
    document.getElementById('vendorPhone').value = vendor.phone || '';
    document.getElementById('vendorContact').value = vendor.contactName || '';
    document.getElementById('vendorAddress').value = vendor.address || '';
    
    document.getElementById('vendor-form-modal').style.display = 'flex';
}

// Hide vendor form
function hideVendorForm() {
    document.getElementById('vendor-form-modal').style.display = 'none';
    document.getElementById('vendor-form').reset();
    editingVendorId = null;
}

// Save vendor (add or update)
function saveVendor(event) {
    event.preventDefault();
    
    const vendorData = {
        name: document.getElementById('vendorName').value,
        email: document.getElementById('vendorEmail').value,
        phone: document.getElementById('vendorPhone').value,
        contactName: document.getElementById('vendorContact').value,
        address: document.getElementById('vendorAddress').value
    };
    
    if (editingVendorId) {
        // Update existing vendor
        if (erpStorage.updateVendor(editingVendorId, vendorData)) {
            loadVendors();
            displayVendors();
            showVendorProfile(editingVendorId);
            hideVendorForm();
            alert('Vendor updated successfully!');
        } else {
            alert('Error updating vendor. Please try again.');
        }
    } else {
        // Add new vendor
        vendorData.attachments = [];
        if (erpStorage.addVendor(vendorData)) {
            loadVendors();
            displayVendors();
            hideVendorForm();
            alert('Vendor added successfully!');
        } else {
            alert('Error saving vendor. Please try again.');
        }
    }
}

// Delete vendor
function deleteVendor(id) {
    const vendor = vendors.find(v => v.id === id);
    if (!vendor) {
        alert('Vendor not found!');
        return;
    }
    
    if (confirm(`Are you sure you want to delete "${vendor.name}"?\n\nThis will permanently remove this vendor and cannot be undone.`)) {
        if (erpStorage.deleteVendor(id)) {
            loadVendors();
            displayVendors();
            
            // Hide profile and show empty state
            currentVendorId = null;
            document.getElementById('vendor-profile').style.display = 'none';
            document.getElementById('vendor-profile-empty').style.display = 'flex';
            
            alert('Vendor deleted successfully!');
        } else {
            alert('Error deleting vendor. Please try again.');
        }
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadVendors();
    displayVendors();
    
    // Close modal when clicking outside of it
    window.onclick = function(event) {
        const modal = document.getElementById('vendor-form-modal');
        if (event.target === modal) {
            hideVendorForm();
        }
    };
});

// Search and Filter Functions
let currentVendorSearchTerm = '';

function searchVendors() {
    const searchInput = document.getElementById('vendorSearchInput');
    const clearButton = document.getElementById('vendorSearchClear');
    currentVendorSearchTerm = searchInput.value.toLowerCase().trim();
    
    // Show/hide clear button
    if (currentVendorSearchTerm.length > 0) {
        clearButton.classList.add('visible');
    } else {
        clearButton.classList.remove('visible');
    }
    
    applyVendorFilters();
}

function clearVendorSearch() {
    const searchInput = document.getElementById('vendorSearchInput');
    const clearButton = document.getElementById('vendorSearchClear');
    searchInput.value = '';
    currentVendorSearchTerm = '';
    clearButton.classList.remove('visible');
    applyVendorFilters();
}

function applyVendorFilters() {
    const listContainer = document.getElementById('vendors-list');
    listContainer.innerHTML = '';
    
    let filteredVendors = vendors;
    
    // Apply search filter
    if (currentVendorSearchTerm) {
        filteredVendors = vendors.filter(vendor => {
            const name = vendor.name ? vendor.name.toLowerCase() : '';
            const email = vendor.email ? vendor.email.toLowerCase() : '';
            const phone = vendor.phone ? vendor.phone.toLowerCase() : '';
            const company = vendor.company ? vendor.company.toLowerCase() : '';
            
            return name.includes(currentVendorSearchTerm) ||
                   email.includes(currentVendorSearchTerm) ||
                   phone.includes(currentVendorSearchTerm) ||
                   company.includes(currentVendorSearchTerm);
        });
    }
    
    if (filteredVendors.length === 0) {
        listContainer.innerHTML = '<p style="padding: 20px; color: #666;">No vendors found.</p>';
        return;
    }
    
    filteredVendors.forEach((vendor, index) => {
        const vendorItem = document.createElement('div');
        vendorItem.className = 'vendor-item';
        if (index === 0) {
            vendorItem.classList.add('active');
        }
        vendorItem.onclick = () => selectVendor(vendor.id);
        vendorItem.innerHTML = `
            <div class="vendor-name">${vendor.name}</div>
            <div class="vendor-company">${vendor.company || ''}</div>
        `;
        listContainer.appendChild(vendorItem);
    });
    
    // Auto-select first vendor if any exist
    if (filteredVendors.length > 0) {
        selectVendor(filteredVendors[0].id);
    } else {
        // Show empty state
        document.getElementById('vendor-profile').classList.add('hidden');
        document.getElementById('vendor-profile-empty').classList.remove('hidden');
    }
}

window.searchVendors = searchVendors;
window.clearVendorSearch = clearVendorSearch;

// Export functions
function exportVendorsToCSV() {
    const formattedData = ExportUtility.formatVendorsForExport(vendors);
    const filename = `vendors_${ExportUtility.getDateForFilename()}.csv`;
    ExportUtility.exportToCSV(formattedData, filename);
}

function exportVendorsToJSON() {
    const filename = `vendors_${ExportUtility.getDateForFilename()}.json`;
    ExportUtility.exportToJSON(vendors, filename);
}

window.exportVendorsToCSV = exportVendorsToCSV;
window.exportVendorsToJSON = exportVendorsToJSON;

console.log('Vendor search functionality enabled');