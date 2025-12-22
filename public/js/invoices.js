// Invoice management functionality with LocalStorage
let invoices = [];
let customers = [];
let products = [];
let employees = [];
let currentSortOrder = {
    dueDate: 'desc'
};

// Payment types
const paymentTypes = [
    'Cash', 'Check', 'Credit Card', 'Debit Card', 'Bank Transfer',
    'ACH/Wire', 'PayPal', 'Venmo', 'Zelle', 'Other'
];

// Load data on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Show loading state
    LoadingState.showTableLoading('invoices-tbody', 7);
    
    // Simulate async load with minimum delay for smooth UX
    await LoadingState.simulateAsync(() => {
        loadData();
        updateOverdueInvoices();
    }, 400);
    
    displayInvoices();
    setupFormMonitoring();
    addInvoiceTotalsSection();
});

// Load data from storage
function loadData() {
    invoices = erpStorage.getInvoices();
    customers = erpStorage.getCustomers();
    products = erpStorage.getProducts();
    employees = erpStorage.getEmployees() || [];
    
    console.log('Loaded data:');
    console.log('  - Invoices:', invoices.length);
    console.log('  - Customers:', customers.length);
    console.log('  - Products:', products.length);
    console.log('  - Employees:', employees.length);
}

// Show create invoice form
function showCreateInvoiceForm() {
    const modal = document.getElementById('create-invoice-form');
    modal.style.display = 'flex';
    populateCustomers();
    populateDrivers();
    populateProducts();
    
    // Clear and enable invoice number field (for new invoices)
    const invoiceNumberInput = document.getElementById('invoiceNumber');
    if (invoiceNumberInput) {
        invoiceNumberInput.value = '';
        invoiceNumberInput.removeAttribute('readonly');
    }
    
    // Set Invoice Date to today
    const invoiceDateField = document.getElementById('invoiceDate');
    const today = new Date().toISOString().split('T')[0];
    invoiceDateField.value = today;
    
    // Clear due date field
    document.getElementById('invoiceDueDate').value = '';
    
    // Add event listener to Invoice Date to auto-populate Due Date
    if (invoiceDateField) {
        // Remove existing listener if any
        invoiceDateField.removeEventListener('change', updateDueDateFromInvoiceDate);
        // Add new listener
        invoiceDateField.addEventListener('change', updateDueDateFromInvoiceDate);
    }
    
    // Add click outside to close
    modal.onclick = function(event) {
        if (event.target === modal) {
            hideCreateInvoiceForm();
        }
    };
    
    // Add ESC key to close
    document.addEventListener('keydown', invoiceModalEscapeHandler);
    
    // Ensure totals section exists and is reset
    setTimeout(() => {
        addInvoiceTotalsSection();
        updateCreateInvoiceTotals();
    }, 100);
}

// ESC key handler for invoice modal
function invoiceModalEscapeHandler(event) {
    if (event.key === 'Escape') {
        hideCreateInvoiceForm();
    }
}

// Update Due Date to 30 days after Invoice Date
function updateDueDateFromInvoiceDate() {
    const invoiceDateField = document.getElementById('invoiceDate');
    const dueDateField = document.getElementById('invoiceDueDate');
    
    if (invoiceDateField && dueDateField && invoiceDateField.value) {
        const invoiceDate = new Date(invoiceDateField.value + 'T00:00:00');
        // Add 30 days
        invoiceDate.setDate(invoiceDate.getDate() + 30);
        
        // Format as YYYY-MM-DD for the date input
        const year = invoiceDate.getFullYear();
        const month = String(invoiceDate.getMonth() + 1).padStart(2, '0');
        const day = String(invoiceDate.getDate()).padStart(2, '0');
        
        dueDateField.value = `${year}-${month}-${day}`;
    }
}

// Hide create invoice form
function hideCreateInvoiceForm() {
    const form = document.getElementById('create-invoice-form').querySelector('form');
    
    // Reset edit mode
    if (form) {
        delete form.dataset.editingInvoiceId;
        
        const formTitle = document.querySelector('#create-invoice-form h3');
        if (formTitle) {
            formTitle.textContent = 'Create Invoice';
        }
        
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Create Invoice';
        }
        
        form.reset();
    }
    
    document.getElementById('create-invoice-form').style.display = 'none';
    
    // Remove ESC key listener
    document.removeEventListener('keydown', invoiceModalEscapeHandler);
    
    // Reset to single item
    const itemsContainer = document.getElementById('invoice-items');
    const items = itemsContainer.querySelectorAll('.invoice-item');
    for (let i = 1; i < items.length; i++) {
        items[i].remove();
    }
}

// Populate customers dropdown - now with autocomplete
function populateCustomers() {
    const input = document.getElementById('invoiceCustomer');
    const hiddenInput = document.getElementById('invoiceCustomerId');
    
    // Clear the input
    input.value = '';
    hiddenInput.value = '';
    
    // Remove old listeners by cloning
    const oldInput = input.cloneNode(true);
    input.parentNode.replaceChild(oldInput, input);
    
    // Setup autocomplete functionality
    setupCustomerAutocomplete();
}

// Setup customer autocomplete
function setupCustomerAutocomplete() {
    const input = document.getElementById('invoiceCustomer');
    const hiddenInput = document.getElementById('invoiceCustomerId');
    const listContainer = document.getElementById('customerAutocompleteList');
    
    if (!input || !listContainer) return;
    
    let currentFocus = -1;
    
    // Handle input event
    input.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        closeAllLists();
        
        if (!value) {
            hiddenInput.value = '';
            return;
        }
        
        currentFocus = -1;
        
        // Filter customers
        const matches = customers.filter(customer => 
            customer.name.toLowerCase().includes(value) ||
            (customer.email && customer.email.toLowerCase().includes(value)) ||
            (customer.phone && customer.phone.includes(value))
        );
        
        if (matches.length === 0) {
            const noResultDiv = document.createElement('div');
            noResultDiv.className = 'autocomplete-item no-results';
            noResultDiv.innerHTML = '<em>No customers found</em>';
            listContainer.appendChild(noResultDiv);
            listContainer.style.display = 'block';
            return;
        }
        
        // Display matches
        matches.forEach(customer => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            
            // Highlight matching text
            const name = customer.name;
            const matchIndex = name.toLowerCase().indexOf(value);
            let displayName = name;
            
            if (matchIndex !== -1) {
                displayName = name.substring(0, matchIndex) +
                    '<strong>' + name.substring(matchIndex, matchIndex + value.length) + '</strong>' +
                    name.substring(matchIndex + value.length);
            }
            
            div.innerHTML = displayName;
            if (customer.email) {
                div.innerHTML += '<span class="autocomplete-secondary"> • ' + customer.email + '</span>';
            }
            
            div.dataset.customerId = customer.id;
            div.dataset.customerName = customer.name;
            
            // Click event
            div.addEventListener('click', function() {
                input.value = this.dataset.customerName;
                hiddenInput.value = this.dataset.customerId;
                closeAllLists();
            });
            
            listContainer.appendChild(div);
        });
        
        listContainer.style.display = 'block';
    });
    
    // Handle keyboard navigation
    input.addEventListener('keydown', function(e) {
        const items = listContainer.getElementsByClassName('autocomplete-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentFocus++;
            addActive(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentFocus--;
            addActive(items);
        } else if (e.key === 'Enter') {
            if (currentFocus > -1 && items[currentFocus]) {
                e.preventDefault();
                items[currentFocus].click();
            }
        } else if (e.key === 'Escape') {
            closeAllLists();
        }
    });
    
    function addActive(items) {
        if (!items || items.length === 0) return;
        removeActive(items);
        
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = items.length - 1;
        
        items[currentFocus].classList.add('autocomplete-active');
        items[currentFocus].scrollIntoView({ block: 'nearest' });
    }
    
    function removeActive(items) {
        for (let i = 0; i < items.length; i++) {
            items[i].classList.remove('autocomplete-active');
        }
    }
    
    function closeAllLists() {
        listContainer.innerHTML = '';
        listContainer.style.display = 'none';
        currentFocus = -1;
    }
    
    // Close list when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target !== input) {
            closeAllLists();
        }
    });
}

// Populate drivers autocomplete
function populateDrivers() {
    const input = document.getElementById('invoiceDriver');
    const hiddenInput = document.getElementById('invoiceDriverId');
    
    // Clear the input
    input.value = '';
    hiddenInput.value = '';
    
    // Remove old listeners if they exist
    const oldInput = input.cloneNode(true);
    input.parentNode.replaceChild(oldInput, input);
    
    // Setup autocomplete functionality with fresh input
    setupDriverAutocomplete();
}

// Setup driver autocomplete
function setupDriverAutocomplete() {
    const input = document.getElementById('invoiceDriver');
    const hiddenInput = document.getElementById('invoiceDriverId');
    const listContainer = document.getElementById('driverAutocompleteList');
    
    if (!input || !listContainer) return;
    
    let currentFocus = -1;
    
    // Handle input event
    input.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        closeAllLists();
        
        console.log('Driver search triggered. Value:', value);
        console.log('Available employees:', employees);
        
        if (!value) {
            hiddenInput.value = '';
            return;
        }
        
        currentFocus = -1;
        
        // Check if employees exist
        if (!employees || employees.length === 0) {
            const noResultDiv = document.createElement('div');
            noResultDiv.className = 'autocomplete-item no-results';
            noResultDiv.innerHTML = '<em>No employees found. Please add employees first.</em>';
            listContainer.appendChild(noResultDiv);
            listContainer.style.display = 'block';
            return;
        }
        
        // Filter employees
        const matches = employees.filter(employee => {
            const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.toLowerCase();
            return fullName.includes(value) ||
                   (employee.email && employee.email.toLowerCase().includes(value)) ||
                   (employee.position && employee.position.toLowerCase().includes(value));
        });
        
        console.log('Matches found:', matches.length);
        
        if (matches.length === 0) {
            const noResultDiv = document.createElement('div');
            noResultDiv.className = 'autocomplete-item no-results';
            noResultDiv.innerHTML = '<em>No drivers found</em>';
            listContainer.appendChild(noResultDiv);
            listContainer.style.display = 'block';
            return;
        }
        
        // Display matches
        matches.forEach(employee => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            
            // Build full name
            const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
            const matchIndex = fullName.toLowerCase().indexOf(value);
            let displayName = fullName;
            
            if (matchIndex !== -1) {
                displayName = fullName.substring(0, matchIndex) +
                    '<strong>' + fullName.substring(matchIndex, matchIndex + value.length) + '</strong>' +
                    fullName.substring(matchIndex + value.length);
            }
            
            div.innerHTML = displayName;
            if (employee.position) {
                div.innerHTML += '<span class="autocomplete-secondary"> • ' + employee.position + '</span>';
            }
            
            div.dataset.employeeId = employee.id;
            div.dataset.employeeName = fullName;
            
            // Click event
            div.addEventListener('click', function() {
                input.value = this.dataset.employeeName;
                hiddenInput.value = this.dataset.employeeId;
                closeAllLists();
            });
            
            listContainer.appendChild(div);
        });
        
        listContainer.style.display = 'block';
    });
    
    // Handle keyboard navigation
    input.addEventListener('keydown', function(e) {
        const items = listContainer.getElementsByClassName('autocomplete-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentFocus++;
            addActive(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentFocus--;
            addActive(items);
        } else if (e.key === 'Enter') {
            if (currentFocus > -1 && items[currentFocus]) {
                e.preventDefault();
                items[currentFocus].click();
            }
        } else if (e.key === 'Escape') {
            closeAllLists();
        }
    });
    
    function addActive(items) {
        if (!items || items.length === 0) return;
        removeActive(items);
        
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = items.length - 1;
        
        items[currentFocus].classList.add('autocomplete-active');
        items[currentFocus].scrollIntoView({ block: 'nearest' });
    }
    
    function removeActive(items) {
        for (let i = 0; i < items.length; i++) {
            items[i].classList.remove('autocomplete-active');
        }
    }
    
    function closeAllLists() {
        listContainer.innerHTML = '';
        listContainer.style.display = 'none';
        currentFocus = -1;
    }
    
    // Close list when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target !== input) {
            closeAllLists();
        }
    });
}

// Populate products dropdown
function populateProducts() {
    const selects = document.querySelectorAll('.item-product');
    selects.forEach(select => {
        select.innerHTML = '<option value="">Select product...</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} - $${product.price}`;
            select.appendChild(option);
        });
    });
}

// Add invoice item
function addInvoiceItem() {
    const itemsContainer = document.getElementById('invoice-items');
    const newItem = document.createElement('div');
    newItem.className = 'invoice-item';
    newItem.innerHTML = `
        <select class="item-product">
            <option value="">Select product...</option>
        </select>
        <input type="number" class="item-quantity-ordered" placeholder="Ordered" min="0" value="0">
        <input type="number" class="item-quantity-backordered" placeholder="Backordered" min="0" value="0">
        <input type="number" class="item-price" placeholder="Price" step="0.01">
        <button type="button" onclick="removeInvoiceItem(this)" class="remove-button">Remove</button>
    `;
    itemsContainer.appendChild(newItem);
    
    // Only populate the new item's dropdown
    const newSelect = newItem.querySelector('.item-product');
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} - $${product.price}`;
        newSelect.appendChild(option);
    });
    
    // Add event listeners to new inputs
    const inputs = newItem.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('change', updateCreateInvoiceTotals);
        input.addEventListener('input', updateCreateInvoiceTotals);
    });
    
    updateCreateInvoiceTotals();
}

// Remove invoice item
function removeInvoiceItem(button) {
    const itemsContainer = document.getElementById('invoice-items');
    const items = itemsContainer.querySelectorAll('.invoice-item');
    if (items.length > 1) {
        button.parentElement.remove();
        updateCreateInvoiceTotals();
    } else {
        alert('At least one item is required.');
    }
}

// Create new invoice (handles both regular and enhanced creation)
function createInvoice(event) {
    event.preventDefault();
    
    const form = event.target;
    const isEditing = form.dataset.editingInvoiceId;
    
    const customerId = parseInt(document.getElementById('invoiceCustomerId').value);
    const customer = customers.find(c => c.id === customerId);
    const invoiceType = document.getElementById('invoiceType').value;
    const poNumber = document.getElementById('invoicePONumber').value.trim();
    const driverId = document.getElementById('invoiceDriverId').value;
    const driverName = document.getElementById('invoiceDriver').value.trim();
    const invoiceDate = document.getElementById('invoiceDate').value;
    const orderedDate = document.getElementById('invoiceOrderedDate').value;
    const wantedDate = document.getElementById('invoiceWantedDate').value;
    const shipDate = document.getElementById('invoiceShipDate').value;
    const dueDate = document.getElementById('invoiceDueDate').value;
    
    if (!customer) {
        alert('Please select a customer.');
        return;
    }
    
    if (!invoiceDate) {
        alert('Please select an invoice date.');
        return;
    }
    
    if (!dueDate) {
        alert('Please select a due date.');
        return;
    }
    
    // Get all items
    const itemElements = document.querySelectorAll('.invoice-item');
    const items = [];
    let subtotal = 0;
    
    itemElements.forEach(itemEl => {
        const productId = parseInt(itemEl.querySelector('.item-product').value);
        const quantityOrdered = parseInt(itemEl.querySelector('.item-quantity-ordered').value) || 0;
        const quantityBackordered = parseInt(itemEl.querySelector('.item-quantity-backordered').value) || 0;
        const price = parseFloat(itemEl.querySelector('.item-price').value);
        
        if (productId && (quantityOrdered > 0 || quantityBackordered > 0) && price) {
            const product = products.find(p => p.id === productId);
            items.push({
                productId: productId,
                productName: product.name,
                quantityOrdered: quantityOrdered,
                quantityBackordered: quantityBackordered,
                price: price,
                total: quantityOrdered * price  // Only ordered quantity affects price
            });
            subtotal += quantityOrdered * price;  // Only ordered quantity in subtotal
        }
    });
    
    if (items.length === 0) {
        alert('Please add at least one item with product, quantity, and price.');
        return;
    }
    
    // Calculate tax and total
    const taxRate = erpStorage.getTaxRate() || 8;
    const taxAmount = (subtotal * taxRate) / 100;
    const finalTotal = subtotal + taxAmount;
    
    if (isEditing) {
        // Update existing invoice
        const invoiceId = parseInt(isEditing);
        const existingInvoice = invoices.find(inv => inv.id === invoiceId);
        
        if (!existingInvoice) {
            alert('Invoice not found!');
            return;
        }
        
        const updatedInvoice = {
            ...existingInvoice,
            customerId: customerId,
            customerName: customer.name,
            invoiceType: invoiceType,
            poNumber: poNumber,
            driverId: driverId ? parseInt(driverId) : null,
            driverName: driverName || null,
            dateCreated: invoiceDate,
            orderedDate: orderedDate,
            wantedDate: wantedDate,
            shipDate: shipDate,
            dueDate: dueDate,
            items: items,
            subtotal: subtotal,
            taxRate: taxRate,
            taxAmount: taxAmount,
            total: finalTotal
        };
        
        if (erpStorage.updateInvoice(invoiceId, updatedInvoice)) {
            const index = invoices.findIndex(inv => inv.id === invoiceId);
            if (index !== -1) {
                invoices[index] = { ...invoices[index], ...updatedInvoice };
            }
            
            alert('Invoice updated successfully!');
            delete form.dataset.editingInvoiceId;
            hideCreateInvoiceForm();
            displayInvoices();
        } else {
            alert('Error updating invoice.');
        }
    } else {
        // Create new invoice
        // Check if manual invoice number is provided
        let invoiceNumber = document.getElementById('invoiceNumber').value.trim();
        
        if (!invoiceNumber) {
            // Auto-generate invoice number
            // Find the highest existing invoice number to determine the next one
            let maxNumber = 0;
            invoices.forEach(inv => {
                if (inv.number && inv.number.startsWith('INV-')) {
                    const num = parseInt(inv.number.replace('INV-', ''));
                    if (!isNaN(num) && num > maxNumber) {
                        maxNumber = num;
                    }
                }
            });
            invoiceNumber = `INV-${String(maxNumber + 1).padStart(5, '0')}`;
        }
        
        const newInvoice = {
            number: invoiceNumber,
            customerId: customerId,
            invoiceType: invoiceType,
            poNumber: poNumber,
            driverId: driverId ? parseInt(driverId) : null,
            driverName: driverName || null,
            customerName: customer.name,
            dateCreated: invoiceDate,
            orderedDate: orderedDate,
            wantedDate: wantedDate,
            shipDate: shipDate,
            dueDate: dueDate,
            items: items,
            subtotal: subtotal,
            taxRate: taxRate,
            taxAmount: taxAmount,
            total: finalTotal,
            status: 'Pending',
            paidDate: null,
            paymentMethod: null
        };
        
        const savedInvoice = erpStorage.addInvoice(newInvoice);
        
        if (savedInvoice) {
            invoices.push(savedInvoice);
            
            // Update product stock (only for physical products and only for ordered quantity)
            items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product && product.stock !== undefined) {
                    const productType = product.type || 'product';
                    if (productType === 'product') {
                        // Deduct only the ordered quantity from stock, not backordered
                        const quantityToDeduct = item.quantityOrdered || item.quantity || 0;
                        product.stock -= quantityToDeduct;
                    }
                }
            });
            erpStorage.setProducts(products);
            
            // Check for backordered items and create backorder invoice
            const backorderedItems = items.filter(item => item.quantityBackordered > 0);
            let backorderInvoiceNumber = null;
            
            if (backorderedItems.length > 0) {
                // Create backorder invoice items (backordered quantities become ordered quantities)
                const backorderItems = backorderedItems.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantityOrdered: item.quantityBackordered,
                    quantityBackordered: 0,
                    price: item.price,
                    total: item.quantityBackordered * item.price
                }));
                
                // Calculate backorder invoice totals
                const backorderSubtotal = backorderItems.reduce((sum, item) => sum + item.total, 0);
                const backorderTaxAmount = (backorderSubtotal * taxRate) / 100;
                const backorderTotal = backorderSubtotal + backorderTaxAmount;
                
                // Generate backorder invoice number (auto-generate from max existing number)
                let maxNumber = 0;
                invoices.forEach(inv => {
                    if (inv.number && inv.number.startsWith('INV-')) {
                        const num = parseInt(inv.number.replace('INV-', ''));
                        if (!isNaN(num) && num > maxNumber) {
                            maxNumber = num;
                        }
                    }
                });
                // Account for the parent invoice we just added
                const parentInvoiceNum = parseInt(invoiceNumber.replace('INV-', ''));
                if (!isNaN(parentInvoiceNum) && parentInvoiceNum > maxNumber) {
                    maxNumber = parentInvoiceNum;
                }
                backorderInvoiceNumber = `INV-${String(maxNumber + 1).padStart(5, '0')}`;
                
                const backorderInvoice = {
                    number: backorderInvoiceNumber,
                    customerId: customerId,
                    invoiceType: invoiceType,
                    poNumber: poNumber,
                    driverId: driverId ? parseInt(driverId) : null,
                    driverName: driverName || null,
                    customerName: customer.name,
                    dateCreated: '',
                    orderedDate: '',
                    wantedDate: '',
                    shipDate: '',
                    dueDate: '',
                    items: backorderItems,
                    subtotal: backorderSubtotal,
                    taxRate: taxRate,
                    taxAmount: backorderTaxAmount,
                    total: backorderTotal,
                    status: 'Pending',
                    paidDate: null,
                    paymentMethod: null,
                    backorderOf: invoiceNumber
                };
                
                const savedBackorderInvoice = erpStorage.addInvoice(backorderInvoice);
                if (savedBackorderInvoice) {
                    invoices.push(savedBackorderInvoice);
                }
            }
            
            // Check if user wants to generate PDF
            const generatePDFCheckbox = document.getElementById('generatePDFOnCreate');
            const generatePDF = generatePDFCheckbox && generatePDFCheckbox.checked;
            
            if (generatePDF && typeof invoicePDFGenerator !== 'undefined') {
                setTimeout(() => {
                    invoicePDFGenerator.generateInvoicePDF(savedInvoice);
                }, 300);
            }
            
            const backorderMessage = backorderInvoiceNumber 
                ? ` A backorder invoice (${backorderInvoiceNumber}) has been created for backordered items.` 
                : '';
            
            alert(`Invoice ${invoiceNumber} created successfully!${generatePDF ? ' PDF will download shortly.' : ''}${backorderMessage}`);
            hideCreateInvoiceForm();
            displayInvoices();
        } else {
            alert('Error creating invoice.');
        }
    }
}

// Alias for compatibility
window.createInvoiceEnhanced = createInvoice;

// Check for overdue invoices and update status
function updateOverdueInvoices() {
    const today = new Date();
    invoices.forEach(invoice => {
        const dueDate = new Date(invoice.dueDate);
        if (invoice.status === 'Pending' && dueDate < today) {
            invoice.status = 'Overdue';
            const updatedData = { status: 'Overdue' };
            erpStorage.updateInvoice(invoice.id, updatedData);
        }
    });
}

// Display invoices in the table
function displayInvoices(filter = 'all') {
    currentStatusFilter = filter;
    applyInvoiceFilters();
}

// Filter invoices
function filterInvoices(filter) {
    displayInvoices(filter);
}

// Sort invoices by due date
function sortInvoicesByDueDate() {
    currentSortOrder.dueDate = currentSortOrder.dueDate === 'asc' ? 'desc' : 'asc';
    
    invoices.sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        
        if (currentSortOrder.dueDate === 'asc') {
            return dateA - dateB;
        } else {
            return dateB - dateA;
        }
    });
    
    displayInvoices();
}

// Utility function to format dates as mm/dd/yyyy
function formatDate(dateString) {
    if (!dateString) return '';
    // Parse date string directly to avoid timezone issues
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
}

// Mark invoice as paid
function markAsPaid(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
        const updatedData = { status: 'Paid' };
        if (erpStorage.updateInvoice(invoiceId, updatedData)) {
            invoice.status = 'Paid';
            displayInvoices();
            alert('Invoice marked as paid!');
        }
    }
}

// Mark invoice as unpaid
function markAsUnpaid(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
        const today = new Date();
        const dueDate = new Date(invoice.dueDate);
        const newStatus = dueDate < today ? 'Overdue' : 'Pending';
        
        const updatedData = { status: newStatus };
        if (erpStorage.updateInvoice(invoiceId, updatedData)) {
            invoice.status = newStatus;
            displayInvoices();
            alert(`Invoice marked as ${newStatus}!`);
        }
    }
}

// View invoice details
function viewInvoice(invoiceId) {
    generateInvoicePDF(invoiceId);
}

// Delete invoice
async function deleteInvoice(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
        alert('Invoice not found!');
        return;
    }
    
    if (confirm(`Are you sure you want to delete Invoice #${invoice.id} for ${invoice.customerName}?\n\nAmount: $${invoice.total.toFixed(2)}\nThis action cannot be undone.`)) {
        LoadingState.showOverlay('Deleting invoice...');
        
        await LoadingState.simulateAsync(() => {
            if (erpStorage.deleteInvoice(invoiceId)) {
                invoices = invoices.filter(inv => inv.id !== invoiceId);
            }
        }, 400);
        
        LoadingState.hideOverlay();
        displayInvoices();
        alert('Invoice deleted successfully!');
    }
}

// Edit invoice
function editInvoice(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
        alert('Invoice not found!');
        return;
    }
    
    // Show the create invoice form
    showCreateInvoiceForm();
    
    // Update form title
    const formTitle = document.querySelector('#create-invoice-form h3');
    if (formTitle) {
        formTitle.textContent = 'Edit Invoice';
    }
    
    // Populate form fields
    setTimeout(() => {
        // Set invoice number (readonly when editing)
        const invoiceNumberInput = document.getElementById('invoiceNumber');
        if (invoiceNumberInput) {
            invoiceNumberInput.value = invoice.number || '';
            invoiceNumberInput.setAttribute('readonly', 'readonly');
        }
        
        // Set customer autocomplete fields
        document.getElementById('invoiceCustomer').value = invoice.customerName || '';
        document.getElementById('invoiceCustomerId').value = invoice.customerId || '';
        
        // Set invoice type
        const invoiceTypeSelect = document.getElementById('invoiceType');
        if (invoiceTypeSelect && invoice.invoiceType) {
            invoiceTypeSelect.value = invoice.invoiceType;
        }
        
        // Set PO Number
        const poNumberInput = document.getElementById('invoicePONumber');
        if (poNumberInput) {
            poNumberInput.value = invoice.poNumber || '';
        }
        
        // Set driver autocomplete fields
        const driverInput = document.getElementById('invoiceDriver');
        const driverIdInput = document.getElementById('invoiceDriverId');
        if (driverInput && invoice.driverName) {
            driverInput.value = invoice.driverName;
        }
        if (driverIdInput && invoice.driverId) {
            driverIdInput.value = invoice.driverId;
        }
        
        // Set dates
        document.getElementById('invoiceDate').value = invoice.dateCreated || '';
        
        const orderedDateInput = document.getElementById('invoiceOrderedDate');
        if (orderedDateInput) {
            orderedDateInput.value = invoice.orderedDate || '';
        }
        
        const wantedDateInput = document.getElementById('invoiceWantedDate');
        if (wantedDateInput) {
            wantedDateInput.value = invoice.wantedDate || '';
        }
        
        const shipDateInput = document.getElementById('invoiceShipDate');
        if (shipDateInput) {
            shipDateInput.value = invoice.shipDate || '';
        }
        
        document.getElementById('invoiceDueDate').value = invoice.dueDate || '';
        
        // Clear existing items but keep the container structure
        const itemsContainer = document.getElementById('invoice-items');
        const existingItems = itemsContainer.querySelectorAll('.invoice-item');
        existingItems.forEach(item => item.remove());
        
        // Add invoice items
        invoice.items.forEach((item, index) => {
            // Create new item element
            const newItemDiv = document.createElement('div');
            newItemDiv.className = 'invoice-item';
            newItemDiv.innerHTML = `
                <select class="item-product">
                    <option value="">Select product...</option>
                </select>
                <input type="number" class="item-quantity-ordered" placeholder="Ordered" min="0" value="0">
                <input type="number" class="item-quantity-backordered" placeholder="Backordered" min="0" value="0">
                <input type="number" class="item-price" placeholder="Price" step="0.01">
                <button type="button" onclick="removeInvoiceItem(this)" class="remove-button">Remove</button>
            `;
            itemsContainer.appendChild(newItemDiv);
            
            // Populate product dropdown
            const productSelect = newItemDiv.querySelector('.item-product');
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} - $${product.price}`;
                productSelect.appendChild(option);
            });
            
            // Set values
            productSelect.value = item.productId;
            newItemDiv.querySelector('.item-quantity-ordered').value = item.quantityOrdered || item.quantity || 0;
            newItemDiv.querySelector('.item-quantity-backordered').value = item.quantityBackordered || 0;
            newItemDiv.querySelector('.item-price').value = item.price;
            
            // Add event listeners
            const inputs = newItemDiv.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('change', updateCreateInvoiceTotals);
                input.addEventListener('input', updateCreateInvoiceTotals);
            });
        });
        
        // Update totals
        updateCreateInvoiceTotals();
        
        // Change submit button
        const form = document.querySelector('#create-invoice-form form');
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Update Invoice';
        }
        
        // Store invoice ID for update
        form.dataset.editingInvoiceId = invoiceId;
    }, 100);
}

// Update invoices summary
function updateInvoicesSummary() {
    const today = new Date();
    
    let totalPending = 0;
    let overdueAmount = 0;
    let overdueCount = 0;
    let paidThisMonth = 0;
    
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    invoices.forEach(invoice => {
        if (invoice.status === 'Pending' || invoice.status === 'Overdue') {
            totalPending += invoice.total;
        }
        
        if (invoice.status === 'Overdue') {
            overdueAmount += invoice.total;
            overdueCount++;
        }
        
        if (invoice.status === 'Paid') {
            const invoiceMonth = new Date(invoice.dateCreated).getMonth();
            const invoiceYear = new Date(invoice.dateCreated).getFullYear();
            if (invoiceMonth === currentMonth && invoiceYear === currentYear) {
                paidThisMonth += invoice.total;
            }
        }
    });
    
    document.getElementById('total-pending').textContent = totalPending.toFixed(2);
    document.getElementById('overdue-amount').textContent = overdueAmount.toFixed(2);
    document.getElementById('overdue-invoices').textContent = overdueCount;
    document.getElementById('paid-this-month').textContent = paidThisMonth.toFixed(2);
}

// === INVOICE TOTALS FUNCTIONALITY ===

// Add invoice totals section to create form
function addInvoiceTotalsSection() {
    const invoiceItems = document.getElementById('invoice-items');
    
    if (invoiceItems && !document.getElementById('create-subtotal')) {
        const totalsHTML = `
            <div id="invoice-totals-preview" class="invoice-totals-preview">
                <div class="invoice-subtotal">
                    <strong>Subtotal: $<span id="create-subtotal">0.00</span></strong>
                </div>
                <div class="invoice-tax">
                    Tax (<span id="create-tax-rate">0.00</span>%): $<span id="create-tax-amount">0.00</span>
                </div>
                <div class="invoice-total">
                    <strong>Total: $<span id="create-total">0.00</span></strong>
                </div>
            </div>
        `;
        
        invoiceItems.insertAdjacentHTML('afterend', totalsHTML);
        
        // Initialize tax rate
        const taxRate = erpStorage.getTaxRate() || 8;
        const taxRateEl = document.getElementById('create-tax-rate');
        if (taxRateEl) {
            taxRateEl.textContent = taxRate.toFixed(2);
        }
    }
}

// Update create invoice totals
function updateCreateInvoiceTotals() {
    let subtotal = 0;
    
    const createForm = document.getElementById('create-invoice-form');
    if (createForm) {
        const invoiceItems = createForm.querySelectorAll('.invoice-item');
        
        invoiceItems.forEach(itemRow => {
            const productSelect = itemRow.querySelector('.item-product');
            const quantityOrderedInput = itemRow.querySelector('.item-quantity-ordered');
            const priceInput = itemRow.querySelector('.item-price');
            
            if (productSelect && quantityOrderedInput && priceInput) {
                const quantityOrdered = parseFloat(quantityOrderedInput.value) || 0;
                let price = parseFloat(priceInput.value) || 0;
                
                // Auto-fill price from product if not set
                if (price === 0 && productSelect.value) {
                    const selectedOption = productSelect.options[productSelect.selectedIndex];
                    if (selectedOption && selectedOption.text.includes('$')) {
                        const priceMatch = selectedOption.text.match(/\$(\d+\.?\d*)/);
                        if (priceMatch) {
                            price = parseFloat(priceMatch[1]);
                            priceInput.value = price.toFixed(2);
                        }
                    }
                }
                
                // Only ordered quantity affects the price
                subtotal += quantityOrdered * price;
            }
        });
    }
    
    const taxRate = erpStorage.getTaxRate() || 8;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;
    
    const subtotalEl = document.getElementById('create-subtotal');
    const taxRateEl = document.getElementById('create-tax-rate');
    const taxAmountEl = document.getElementById('create-tax-amount');
    const totalEl = document.getElementById('create-total');
    
    if (subtotalEl) subtotalEl.textContent = subtotal.toFixed(2);
    if (taxRateEl) taxRateEl.textContent = taxRate.toFixed(2);
    if (taxAmountEl) taxAmountEl.textContent = taxAmount.toFixed(2);
    if (totalEl) totalEl.textContent = total.toFixed(2);
}

// Setup form monitoring for real-time updates
function setupFormMonitoring() {
    setTimeout(() => {
        const createForm = document.getElementById('create-invoice-form');
        if (createForm) {
            const formInputs = createForm.querySelectorAll('input, select');
            formInputs.forEach(input => {
                input.addEventListener('change', updateCreateInvoiceTotals);
                input.addEventListener('input', updateCreateInvoiceTotals);
            });
        }
    }, 1000);
}

// === INVOICE PAYMENT DIALOG SYSTEM ===

function showInvoicePaymentDialog(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
        alert('Invoice not found!');
        return;
    }

    if (invoice.status === 'Paid') {
        showInvoicePaymentHistory(invoiceId);
        return;
    }

    const totalPaid = invoice.payments ? invoice.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
    const remainingAmount = invoice.total - totalPaid;
    const isPartialPayment = totalPaid > 0;
    const today = new Date().toISOString().split('T')[0];

    const dialogHTML = `
        <div id="invoice-payment-dialog" class="payment-dialog">
            <div class="payment-dialog-content">
                <h3 class="payment-dialog-header">
                    ${isPartialPayment ? 'Additional Payment' : 'Record Payment'}
                </h3>
                
                <div class="payment-info-box">
                    <div><strong>Customer:</strong> ${invoice.customerName}</div>
                    <div><strong>Invoice #:</strong> ${invoice.number}</div>
                    <div class="payment-total">
                        <strong>Original Amount:</strong> $${invoice.total.toFixed(2)}
                    </div>
                    ${isPartialPayment ? `
                        <div class="payment-amount-paid">
                            <strong>Already Paid:</strong> $${totalPaid.toFixed(2)}
                        </div>
                        <div class="payment-amount-due">
                            <strong>Remaining Balance:</strong> $${remainingAmount.toFixed(2)}
                        </div>
                    ` : ''}
                </div>
                
                <form id="invoice-payment-form">
                    <div class="payment-form-group">
                        <label class="payment-form-label">Payment Type:</label>
                        <select id="invoicePaymentType" required class="payment-form-input">
                            <option value="">Select payment method...</option>
                            ${paymentTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="payment-form-group">
                        <label class="payment-form-label">Payment Date:</label>
                        <input type="date" id="invoicePaymentDate" value="${today}" required class="payment-form-input">
                    </div>
                    
                    <div class="payment-form-group">
                        <label class="payment-form-label">Reference/Check Number:</label>
                        <input type="text" id="invoicePaymentReference" placeholder="Check #, Transaction ID, etc." class="payment-form-input">
                    </div>
                    
                    <div class="payment-form-group">
                        <label class="payment-form-label">Payment Amount:</label>
                        <input type="number" id="invoicePaymentAmount" value="${remainingAmount.toFixed(2)}" step="0.01" min="0.01" required class="payment-form-input">
                        <small class="payment-form-hint">Maximum remaining amount: $${remainingAmount.toFixed(2)}</small>
                    </div>
                    
                    <div class="payment-form-group">
                        <label class="payment-form-label">Payment Notes:</label>
                        <textarea id="invoicePaymentNotes" placeholder="Additional notes..." class="payment-form-input invoice-payment-notes-textarea"></textarea>
                    </div>
                    
                    <div class="payment-actions">
                        <button type="button" onclick="closeInvoicePaymentDialog()" class="payment-cancel-button">Cancel</button>
                        <button type="submit" class="payment-submit-button">Record Payment</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    closeInvoicePaymentDialog();
    document.body.insertAdjacentHTML('beforeend', dialogHTML);

    document.getElementById('invoice-payment-form').addEventListener('submit', (e) => {
        e.preventDefault();
        processInvoicePayment(invoiceId);
    });
}

function processInvoicePayment(invoiceId) {
    const paymentType = document.getElementById('invoicePaymentType').value;
    const paymentDate = document.getElementById('invoicePaymentDate').value;
    const paymentReference = document.getElementById('invoicePaymentReference').value;
    const paymentAmount = parseFloat(document.getElementById('invoicePaymentAmount').value);
    const paymentNotes = document.getElementById('invoicePaymentNotes').value;

    if (!paymentType || !paymentDate || paymentAmount <= 0) {
        alert('Please fill in all required fields.');
        return;
    }

    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;

    const totalPaid = invoice.payments ? invoice.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
    const remainingAmount = invoice.total - totalPaid;
    
    // Check if payment exceeds remaining amount (with small tolerance for rounding)
    if (paymentAmount > remainingAmount + 0.01) {
        alert(`Payment amount ($${paymentAmount.toFixed(2)}) exceeds remaining balance ($${remainingAmount.toFixed(2)}). Please enter a valid amount.`);
        return;
    }

    const payment = {
        id: Date.now(),
        type: paymentType,
        date: paymentDate,
        amount: paymentAmount,
        reference: paymentReference,
        notes: paymentNotes,
        recordedDate: new Date().toISOString()
    };

    if (!invoice.payments) invoice.payments = [];
    invoice.payments.push(payment);

    const newTotalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    
    // Use a small tolerance (1 cent) to handle rounding issues
    const tolerance = 0.01;
    const remaining = invoice.total - newTotalPaid;
    
    if (Math.abs(remaining) <= tolerance || newTotalPaid >= invoice.total) {
        // Invoice is fully paid (or overpaid by less than 1 cent)
        invoice.status = 'Paid';
        invoice.paymentDate = paymentDate;
        invoice.paymentType = paymentType;
        invoice.paymentReference = paymentReference;
    } else {
        // Invoice is partially paid
        invoice.status = `Partial ($${newTotalPaid.toFixed(2)})`;
    }

    // Update in storage
    erpStorage.updateInvoice(invoiceId, {
        status: invoice.status,
        payments: invoice.payments,
        paymentDate: invoice.paymentDate,
        paymentType: invoice.paymentType,
        paymentReference: invoice.paymentReference
    });

    closeInvoicePaymentDialog();
    loadData();
    displayInvoices();

    const message = invoice.status === 'Paid' ? 
        'Payment recorded successfully! Invoice is now fully paid.' :
        `Partial payment recorded! Paid $${newTotalPaid.toFixed(2)} of $${invoice.total.toFixed(2)} (remaining: $${remaining.toFixed(2)})`;
    
    alert(message);
}

function showInvoicePaymentHistory(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice || !invoice.payments) {
        alert('No payment history found.');
        return;
    }

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);

    const historyHTML = `
        <div id="invoice-payment-dialog" class="payment-dialog">
            <div class="payment-dialog-content payment-dialog-wide payment-dialog-scrollable">
                <h3 class="payment-dialog-header">Payment History</h3>
                
                <div class="payment-info-box">
                    <div><strong>Customer:</strong> ${invoice.customerName}</div>
                    <div><strong>Invoice #:</strong> ${invoice.number}</div>
                    <div><strong>Invoice Amount:</strong> $${invoice.total.toFixed(2)}</div>
                    <div class="text-success font-bold"><strong>Total Paid:</strong> $${totalPaid.toFixed(2)}</div>
                </div>
                
                <h4>Payment Records:</h4>
                ${invoice.payments.map((payment, index) => `
                    <div class="payment-history-item">
                        <div class="payment-history-grid">
                            <div><strong>Payment #${index + 1}</strong></div>
                            <div class="payment-history-amount">$${payment.amount.toFixed(2)}</div>
                            <div><strong>Type:</strong> ${payment.type}</div>
                            <div><strong>Date:</strong> ${formatDate(payment.date)}</div>
                            ${payment.reference ? `<div><strong>Reference:</strong> ${payment.reference}</div>` : '<div></div>'}
                            ${payment.notes ? `<div class="payment-history-notes"><strong>Notes:</strong> ${payment.notes}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
                
                <div class="payment-actions">
                    <button onclick="closeInvoicePaymentDialog()" class="payment-close-button">Close</button>
                </div>
            </div>
        </div>
    `;

    closeInvoicePaymentDialog();
    document.body.insertAdjacentHTML('beforeend', historyHTML);
}

function closeInvoicePaymentDialog() {
    const dialog = document.getElementById('invoice-payment-dialog');
    if (dialog) dialog.remove();
}

// Make functions globally available
window.showInvoicePaymentDialog = showInvoicePaymentDialog;
window.showInvoicePaymentHistory = showInvoicePaymentHistory;
window.closeInvoicePaymentDialog = closeInvoicePaymentDialog;

// Search and Filter Functions
let allInvoices = [];
let currentSearchTerm = '';
let currentStatusFilter = 'all';
let currentInvoicePage = 1;
let invoicePageSize = 50;

function searchInvoices() {
    const searchInput = document.getElementById('invoiceSearchInput');
    const clearButton = document.getElementById('invoiceSearchClear');
    currentSearchTerm = searchInput.value.toLowerCase().trim();
    
    // Show/hide clear button
    if (currentSearchTerm.length > 0) {
        clearButton.classList.add('visible');
    } else {
        clearButton.classList.remove('visible');
    }
    
    currentInvoicePage = 1; // Reset to first page on new search
    applyInvoiceFilters();
}

function clearInvoiceSearch() {
    const searchInput = document.getElementById('invoiceSearchInput');
    const clearButton = document.getElementById('invoiceSearchClear');
    searchInput.value = '';
    currentSearchTerm = '';
    clearButton.classList.remove('visible');
    currentInvoicePage = 1;
    applyInvoiceFilters();
}

function applyInvoiceFilters() {
    const tbody = document.getElementById('invoices-tbody');
    tbody.innerHTML = '';
    
    // Update any pending invoices that are now overdue
    const today = new Date();
    let hasUpdates = false;
    invoices.forEach(invoice => {
        const dueDate = new Date(invoice.dueDate);
        if (invoice.status === 'Pending' && dueDate < today) {
            const updatedData = { status: 'Overdue' };
            if (erpStorage.updateInvoice(invoice.id, updatedData)) {
                invoice.status = 'Overdue';
                hasUpdates = true;
            }
        }
    });
    
    if (hasUpdates) {
        loadData();
    }
    
    let filteredInvoices = invoices;
    
    // Apply status filter
    if (currentStatusFilter !== 'all') {
        filteredInvoices = filteredInvoices.filter(invoice => {
            if (currentStatusFilter === 'overdue') {
                return invoice.status === 'Overdue';
            }
            return invoice.status && invoice.status.toLowerCase() === currentStatusFilter;
        });
    }
    
    // Apply search filter
    if (currentSearchTerm) {
        filteredInvoices = filteredInvoices.filter(invoice => {
            const customerName = invoice.customerName ? invoice.customerName.toLowerCase() : '';
            const invoiceNumber = invoice.number ? invoice.number.toLowerCase() : '';
            const total = invoice.total ? invoice.total.toString() : '';
            const status = invoice.status ? invoice.status.toLowerCase() : '';
            
            return customerName.includes(currentSearchTerm) ||
                   invoiceNumber.includes(currentSearchTerm) ||
                   total.includes(currentSearchTerm) ||
                   status.includes(currentSearchTerm);
        });
    }
    
    // Calculate pagination
    const totalInvoices = filteredInvoices.length;
    const totalPages = invoicePageSize === 'all' ? 1 : Math.ceil(totalInvoices / invoicePageSize);
    
    // Ensure current page is valid
    if (currentInvoicePage > totalPages && totalPages > 0) {
        currentInvoicePage = totalPages;
    }
    if (currentInvoicePage < 1) {
        currentInvoicePage = 1;
    }
    
    // Get invoices for current page
    let paginatedInvoices = filteredInvoices;
    let startIndex = 0;
    let endIndex = totalInvoices;
    
    if (invoicePageSize !== 'all') {
        startIndex = (currentInvoicePage - 1) * invoicePageSize;
        endIndex = Math.min(startIndex + invoicePageSize, totalInvoices);
        paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);
    }
    
    paginatedInvoices.forEach(invoice => {
        // Skip invoices with missing critical data
        if (invoice.total === undefined || invoice.total === null || !invoice.status) {
            console.warn('Skipping invoice with missing data:', invoice);
            return;
        }
        
        const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
        let status = invoice.status;
        let statusColor = '#666';
        
        if (status === 'Paid') {
            statusColor = '#5cb85c';
        } else if (status === 'Overdue') {
            statusColor = '#d9534f';
        } else if (status === 'Pending') {
            statusColor = '#f0ad4e';
        } else if (status && status.startsWith('Partial')) {
            statusColor = '#f0ad4e';
        }
        
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        const isDueSoon = dueDate && dueDate <= oneWeekFromNow && dueDate >= today;
        
        const row = document.createElement('tr');
        if (isDueSoon && status !== 'Paid') {
            row.style.backgroundColor = '#fff3cd';
        } else if (status === 'Overdue') {
            row.style.backgroundColor = '#ffebee';
        } else if (status === 'Paid') {
            row.style.backgroundColor = '#e8f5e8';
        }
        
        const statusClass = status === 'Paid' ? 'invoice-status-paid' : status === 'Overdue' ? 'invoice-status-overdue' : 'invoice-status-unpaid';
        const invoiceNumberDisplay = invoice.backorderOf 
            ? `${invoice.number || 'N/A'}<br><small style="color: #666; font-style: italic;">Backorder of ${invoice.backorderOf}</small>` 
            : (invoice.number || 'N/A');
        row.innerHTML = `
            <td>${invoiceNumberDisplay}</td>
            <td>${invoice.customerName || 'Unknown'}</td>
            <td>${invoice.dateCreated ? formatDate(invoice.dateCreated) : '<em>Not set</em>'}</td>
            <td>${invoice.dueDate ? formatDate(invoice.dueDate) : '<em>Not set</em>'}${isDueSoon && status !== 'Paid' ? ' <span class="invoice-due-warning">⚠️</span>' : ''}</td>
            <td>$${invoice.total.toFixed(2)}</td>
            <td class="${statusClass}">${status}</td>
            <td>
                <button class="button button-warning button-small" onclick="generateInvoicePDF(${invoice.id})">PDF</button>
                ${getInvoiceActionButtons(invoice)}
                <button class="button button-small" onclick="editInvoice(${invoice.id})">Edit</button>
                <button class="button button-danger button-small" onclick="deleteInvoice(${invoice.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Update pagination info
    updateInvoicePaginationInfo(startIndex + 1, endIndex, totalInvoices, currentInvoicePage, totalPages);
    
    updateInvoicesSummary();
}

function updateInvoicePaginationInfo(start, end, total, currentPage, totalPages) {
    document.getElementById('invoice-start').textContent = total === 0 ? 0 : start;
    document.getElementById('invoice-end').textContent = end;
    document.getElementById('invoice-total').textContent = total;
    document.getElementById('invoice-page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    
    // Enable/disable pagination buttons
    const prevBtn = document.getElementById('invoice-prev-btn');
    const nextBtn = document.getElementById('invoice-next-btn');
    
    if (prevBtn && nextBtn) {
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;
    }
}

function changeInvoicePageSize() {
    const select = document.getElementById('invoicePageSize');
    invoicePageSize = select.value === 'all' ? 'all' : parseInt(select.value);
    currentInvoicePage = 1;
    applyInvoiceFilters();
}

function previousInvoicePage() {
    if (currentInvoicePage > 1) {
        currentInvoicePage--;
        applyInvoiceFilters();
    }
}

function nextInvoicePage() {
    const totalInvoices = invoices.length; // This should be filtered invoices count
    const totalPages = invoicePageSize === 'all' ? 1 : Math.ceil(totalInvoices / invoicePageSize);
    if (currentInvoicePage < totalPages) {
        currentInvoicePage++;
        applyInvoiceFilters();
    }
}

// Get invoice action buttons based on status
function getInvoiceActionButtons(invoice) {
    if (invoice.status === 'Paid') {
        return `<button class="button button-success button-small" onclick="showInvoicePaymentHistory(${invoice.id})">History</button>`;
    } else if (invoice.status && invoice.status.startsWith('Partial')) {
        return `
            <button class="button button-success button-small" onclick="showInvoicePaymentDialog(${invoice.id})">Payment</button>
            <button class="button button-primary button-small" onclick="showInvoicePaymentHistory(${invoice.id})">History</button>
        `;
    } else {
        return `<button class="button button-success button-small" onclick="showInvoicePaymentDialog(${invoice.id})">Payment</button>`;
    }
}

// Update the original filterInvoices function to work with search
const originalFilterInvoices = window.filterInvoices;
window.filterInvoices = function(filter) {
    currentStatusFilter = filter;
    currentInvoicePage = 1; // Reset to first page when changing filter
    applyInvoiceFilters();
};

window.searchInvoices = searchInvoices;
window.clearInvoiceSearch = clearInvoiceSearch;
window.changeInvoicePageSize = changeInvoicePageSize;
window.previousInvoicePage = previousInvoicePage;
window.nextInvoicePage = nextInvoicePage;

// Export functions
function exportInvoicesToCSV() {
    const formattedData = ExportUtility.formatInvoicesForExport(invoices, customers);
    const filename = `invoices_${ExportUtility.getDateForFilename()}.csv`;
    ExportUtility.exportToCSV(formattedData, filename);
}

function exportInvoicesToJSON() {
    const filename = `invoices_${ExportUtility.getDateForFilename()}.json`;
    ExportUtility.exportToJSON(invoices, filename);
}

window.exportInvoicesToCSV = exportInvoicesToCSV;
window.exportInvoicesToJSON = exportInvoicesToJSON;

// Invoice Report Functions
function showInvoiceReportDialog() {
    document.getElementById('invoice-report-dialog').style.display = 'block';
    
    // Populate customer filter dropdown
    const customerFilter = document.getElementById('reportCustomerFilter');
    customerFilter.innerHTML = '<option value="all">All Customers</option>';
    
    const uniqueCustomers = [...new Set(invoices.map(inv => inv.customerName))].sort();
    uniqueCustomers.forEach(customerName => {
        const option = document.createElement('option');
        option.value = customerName;
        option.textContent = customerName;
        customerFilter.appendChild(option);
    });
}

function hideInvoiceReportDialog() {
    document.getElementById('invoice-report-dialog').style.display = 'none';
    document.getElementById('reportSortBy').value = 'invoiceDate';
    document.getElementById('reportSortOrder').value = 'asc';
    document.getElementById('reportStatusFilter').value = 'all';
    document.getElementById('reportCustomerFilter').value = 'all';
    document.getElementById('reportDateRange').value = 'all';
    document.getElementById('customDateRange').style.display = 'none';
    document.getElementById('reportFormat').value = 'csv';
}

function toggleCustomDateRange() {
    const dateRange = document.getElementById('reportDateRange').value;
    const customRange = document.getElementById('customDateRange');
    
    if (dateRange === 'custom') {
        customRange.style.display = 'block';
        document.getElementById('reportStartDate').required = true;
        document.getElementById('reportEndDate').required = true;
    } else {
        customRange.style.display = 'none';
        document.getElementById('reportStartDate').required = false;
        document.getElementById('reportEndDate').required = false;
    }
}

function generateInvoiceReport(event) {
    event.preventDefault();
    
    const sortBy = document.getElementById('reportSortBy').value;
    const sortOrder = document.getElementById('reportSortOrder').value;
    const statusFilter = document.getElementById('reportStatusFilter').value;
    const customerFilter = document.getElementById('reportCustomerFilter').value;
    const dateRange = document.getElementById('reportDateRange').value;
    const reportFormat = document.getElementById('reportFormat').value;
    
    // Filter invoices based on criteria
    let filteredInvoices = [...invoices];
    
    // Apply status filter
    if (statusFilter !== 'all') {
        if (statusFilter === 'Unpaid') {
            // Include both Pending and Overdue
            filteredInvoices = filteredInvoices.filter(inv => inv.status === 'Pending' || inv.status === 'Overdue');
        } else {
            filteredInvoices = filteredInvoices.filter(inv => inv.status === statusFilter);
        }
    }
    
    // Apply customer filter
    if (customerFilter !== 'all') {
        filteredInvoices = filteredInvoices.filter(inv => inv.customerName === customerFilter);
    }
    
    // Apply date range filter
    if (dateRange !== 'all') {
        const now = new Date();
        let startDate, endDate;
        
        if (dateRange === 'today') {
            startDate = new Date(now.setHours(0, 0, 0, 0));
            endDate = new Date(now.setHours(23, 59, 59, 999));
        } else if (dateRange === 'week') {
            const day = now.getDay();
            startDate = new Date(now.setDate(now.getDate() - day));
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.setDate(now.getDate() - day + 6));
            endDate.setHours(23, 59, 59, 999);
        } else if (dateRange === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (dateRange === 'quarter') {
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
        } else if (dateRange === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        } else if (dateRange === 'custom') {
            startDate = new Date(document.getElementById('reportStartDate').value);
            endDate = new Date(document.getElementById('reportEndDate').value);
            endDate.setHours(23, 59, 59, 999);
        }
        
        if (startDate && endDate) {
            filteredInvoices = filteredInvoices.filter(inv => {
                const invDate = new Date(inv.dateCreated);
                return invDate >= startDate && invDate <= endDate;
            });
        }
    }
    
    // Sort invoices
    filteredInvoices.sort((a, b) => {
        let compareA, compareB;
        
        switch(sortBy) {
            case 'invoiceDate':
                compareA = new Date(a.dateCreated);
                compareB = new Date(b.dateCreated);
                break;
            case 'dueDate':
                compareA = new Date(a.dueDate);
                compareB = new Date(b.dueDate);
                break;
            case 'paidDate':
                compareA = a.paidDate ? new Date(a.paidDate) : new Date('9999-12-31');
                compareB = b.paidDate ? new Date(b.paidDate) : new Date('9999-12-31');
                break;
            case 'customer':
                compareA = a.customerName.toLowerCase();
                compareB = b.customerName.toLowerCase();
                break;
            case 'total':
                compareA = a.total;
                compareB = b.total;
                break;
            case 'status':
                compareA = a.status.toLowerCase();
                compareB = b.status.toLowerCase();
                break;
        }
        
        if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
        if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Generate report based on format
    if (reportFormat === 'csv') {
        generateInvoiceCSVReport(filteredInvoices, sortBy, sortOrder, statusFilter, dateRange);
    } else if (reportFormat === 'pdf') {
        generateInvoicePDFReport(filteredInvoices, sortBy, sortOrder, statusFilter, dateRange);
    }
    
    hideInvoiceReportDialog();
}

function generateInvoiceCSVReport(invoices, sortBy, sortOrder, statusFilter, dateRange) {
    const formattedData = ExportUtility.formatInvoicesForExport(invoices, customers);
    const filename = `invoice_report_${ExportUtility.getDateForFilename()}.csv`;
    ExportUtility.exportToCSV(formattedData, filename);
    
    alert(`Report generated successfully!\n\n${invoices.length} invoices exported\nSorted by: ${sortBy}\nOrder: ${sortOrder}\nFilter: ${statusFilter}`);
}

function generateInvoicePDFReport(invoices, sortBy, sortOrder, statusFilter, dateRange) {
    alert('PDF report generation coming soon!\n\nFor now, please use CSV format which can be opened in Excel.');
}

window.showInvoiceReportDialog = showInvoiceReportDialog;
window.hideInvoiceReportDialog = hideInvoiceReportDialog;
window.toggleCustomDateRange = toggleCustomDateRange;
window.generateInvoiceReport = generateInvoiceReport;

console.log('Consolidated invoice management system loaded');
console.log('Invoice payment recording system enabled');
console.log('Invoice search functionality enabled');
console.log('Invoice pagination enabled');
console.log('Invoice reporting system enabled');