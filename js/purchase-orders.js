// Purchase Orders management functionality
let purchaseOrders = [];
let vendors = [];
let products = [];
let currentStatusFilter = 'all';
let currentSearchTerm = '';

// Load data from storage
function loadData() {
    purchaseOrders = erpStorage.getPurchaseOrders() || [];
    vendors = erpStorage.getVendors() || [];
    products = erpStorage.getProducts() || [];
    
    console.log('Loaded data:');
    console.log('  - Purchase Orders:', purchaseOrders.length);
    console.log('  - Vendors:', vendors.length);
    console.log('  - Products:', products.length);
}

// Populate vendors dropdown
function populateVendors() {
    const vendorSelect = document.getElementById('poVendor');
    vendorSelect.innerHTML = '<option value="">Select vendor...</option>';
    
    vendors.forEach(vendor => {
        const option = document.createElement('option');
        option.value = vendor.id;
        option.textContent = vendor.name;
        vendorSelect.appendChild(option);
    });
}

// Populate products dropdown
function populateProducts() {
    const productSelects = document.querySelectorAll('.item-product');
    
    console.log('Populating products, found', productSelects.length, 'dropdowns');
    console.log('Available products:', products.length);
    console.log('First product:', products[0]);
    
    productSelects.forEach(select => {
        select.innerHTML = '<option value="">Select product...</option>';
        
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} - $${product.price}`;
            option.dataset.price = product.price;
            select.appendChild(option);
            console.log('Added product option:', product.name);
        });
        
        console.log('Dropdown now has', select.options.length, 'options');
        
        // Add event listener to auto-fill price
        select.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption.dataset.price) {
                const priceInput = this.parentElement.querySelector('.item-price');
                if (priceInput) {
                    priceInput.value = selectedOption.dataset.price;
                }
            }
        });
    });
}

// Show create PO form
function showCreatePOForm() {
    const modal = document.getElementById('create-po-form');
    modal.style.display = 'flex';
    populateVendors();
    populateProducts();
    
    // Set order date to today
    const orderDateField = document.getElementById('poOrderDate');
    const today = new Date().toISOString().split('T')[0];
    orderDateField.value = today;
    
    // Add click outside to close
    modal.onclick = function(event) {
        if (event.target === modal) {
            hideCreatePOForm();
        }
    };
}

// Hide create PO form
function hideCreatePOForm() {
    const modal = document.getElementById('create-po-form');
    modal.style.display = 'none';
    modal.onclick = null;
    document.querySelector('#create-po-form form').reset();
    
    // Reset to single item
    const itemsContainer = document.getElementById('po-items');
    const items = itemsContainer.querySelectorAll('.invoice-item');
    items.forEach((item, index) => {
        if (index > 0) item.remove();
    });
}

// Add PO item
function addPOItem() {
    const itemsContainer = document.getElementById('po-items');
    const newItem = document.createElement('div');
    newItem.className = 'invoice-item';
    newItem.innerHTML = `
        <select class="item-product">
            <option value="">Select product...</option>
        </select>
        <input type="number" class="item-quantity" placeholder="Ordered" min="1">
        <input type="number" class="item-quantity-received" placeholder="Received" min="0" value="0">
        <input type="number" class="item-price" placeholder="Price" step="0.01">
        <button type="button" onclick="removePOItem(this)" class="remove-button">Remove</button>
    `;
    itemsContainer.appendChild(newItem);
    
    // Only populate the new item's dropdown
    const newSelect = newItem.querySelector('.item-product');
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} - $${product.price}`;
        option.dataset.price = product.price;
        newSelect.appendChild(option);
    });
    
    // Add event listener to auto-fill price
    newSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.dataset.price) {
            const priceInput = this.parentElement.querySelector('.item-price');
            if (priceInput) {
                priceInput.value = selectedOption.dataset.price;
            }
        }
    });
}

// Remove PO item
function removePOItem(button) {
    const item = button.parentElement;
    const itemsContainer = document.getElementById('po-items');
    const items = itemsContainer.querySelectorAll('.invoice-item');
    
    if (items.length > 1) {
        item.remove();
    } else {
        alert('You must have at least one item in the purchase order.');
    }
}

// Create purchase order
function createPurchaseOrder(event) {
    event.preventDefault();
    
    const vendorId = parseInt(document.getElementById('poVendor').value);
    const vendor = vendors.find(v => v.id === vendorId);
    const orderDate = document.getElementById('poOrderDate').value;
    const expectedDate = document.getElementById('poExpectedDate').value;
    const actualDate = document.getElementById('poActualDate').value;
    const status = document.getElementById('poStatus').value;
    const notes = document.getElementById('poNotes').value.trim();
    
    if (!vendor) {
        alert('Please select a vendor.');
        return;
    }
    
    if (!orderDate) {
        alert('Please select an order date.');
        return;
    }
    
    // Get all items
    const itemElements = document.querySelectorAll('#po-items .invoice-item');
    const items = [];
    let subtotal = 0;
    let totalOrdered = 0;
    let totalReceived = 0;
    
    itemElements.forEach(itemEl => {
        const productSelect = itemEl.querySelector('.item-product');
        const quantityInput = itemEl.querySelector('.item-quantity');
        const quantityReceivedInput = itemEl.querySelector('.item-quantity-received');
        const priceInput = itemEl.querySelector('.item-price');
        
        if (!productSelect || !quantityInput || !quantityReceivedInput || !priceInput) {
            return; // Skip if any element is missing
        }
        
        const productId = parseInt(productSelect.value);
        const quantityOrdered = parseInt(quantityInput.value) || 0;
        const quantityReceived = parseInt(quantityReceivedInput.value) || 0;
        const price = parseFloat(priceInput.value);
        
        if (productId && quantityOrdered > 0 && price) {
            const product = products.find(p => p.id === productId);
            items.push({
                productId: productId,
                productName: product.name,
                quantityOrdered: quantityOrdered,
                quantityReceived: quantityReceived,
                price: price,
                total: quantityOrdered * price
            });
            subtotal += quantityOrdered * price;
            totalOrdered += quantityOrdered;
            totalReceived += quantityReceived;
        }
    });
    
    if (items.length === 0) {
        alert('Please add at least one item with product, quantity, and price.');
        return;
    }
    
    // Auto-determine status based on received quantities
    let autoStatus = status;
    if (totalReceived === 0) {
        autoStatus = status === 'Draft' ? 'Draft' : 'Sent';
    } else if (totalReceived >= totalOrdered) {
        autoStatus = 'Received';
    } else if (totalReceived > 0) {
        autoStatus = 'Partially Received';
    }
    
    // Check if manual PO number is provided
    let poNumber = document.getElementById('poNumber').value.trim();
    
    if (!poNumber) {
        // Auto-generate PO number
        let maxNumber = 0;
        purchaseOrders.forEach(po => {
            if (po.number && po.number.startsWith('PO-')) {
                const num = parseInt(po.number.replace('PO-', ''));
                if (!isNaN(num) && num > maxNumber) {
                    maxNumber = num;
                }
            }
        });
        poNumber = `PO-${String(maxNumber + 1).padStart(5, '0')}`;
    }
    
    // Calculate tax and total (assuming 8% tax rate)
    const taxRate = erpStorage.getTaxRate() || 8;
    const taxAmount = (subtotal * taxRate) / 100;
    const finalTotal = subtotal + taxAmount;
    
    const newPO = {
        number: poNumber,
        vendorId: vendorId,
        vendorName: vendor.name,
        orderDate: orderDate,
        expectedDate: expectedDate,
        actualDate: actualDate,
        status: autoStatus,
        items: items,
        subtotal: subtotal,
        taxRate: taxRate,
        taxAmount: taxAmount,
        total: finalTotal,
        notes: notes,
        receivingHistory: [],
        dateCreated: new Date().toISOString().split('T')[0]
    };
    
    const savedPO = erpStorage.addPurchaseOrder(newPO);
    
    if (savedPO) {
        purchaseOrders.push(savedPO);
        alert(`Purchase Order ${poNumber} created successfully!`);
        hideCreatePOForm();
        displayPurchaseOrders();
        updatePOSummary();
    } else {
        alert('Error creating purchase order.');
    }
}

// Display purchase orders
function displayPurchaseOrders() {
    applyPOFilters();
}

// Apply filters
function applyPOFilters() {
    const tbody = document.getElementById('po-tbody');
    tbody.innerHTML = '';
    
    let filteredPOs = purchaseOrders;
    
    // Apply status filter
    if (currentStatusFilter !== 'all') {
        filteredPOs = filteredPOs.filter(po => po.status === currentStatusFilter);
    }
    
    // Apply search filter
    if (currentSearchTerm) {
        filteredPOs = filteredPOs.filter(po => {
            const vendorName = po.vendorName ? po.vendorName.toLowerCase() : '';
            const poNumber = po.number ? po.number.toLowerCase() : '';
            const total = po.total ? po.total.toString() : '';
            const status = po.status ? po.status.toLowerCase() : '';
            
            return vendorName.includes(currentSearchTerm) ||
                   poNumber.includes(currentSearchTerm) ||
                   total.includes(currentSearchTerm) ||
                   status.includes(currentSearchTerm);
        });
    }
    
    filteredPOs.forEach(po => {
        let statusColor = '#666';
        
        if (po.status === 'Received') {
            statusColor = '#5cb85c';
        } else if (po.status === 'Sent') {
            statusColor = '#f0ad4e';
        } else if (po.status === 'Draft') {
            statusColor = '#999';
        } else if (po.status === 'Cancelled') {
            statusColor = '#d9534f';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${po.number || 'N/A'}</td>
            <td>${po.vendorName || 'Unknown'}</td>
            <td>${formatDate(po.orderDate)}</td>
            <td>${po.expectedDate ? formatDate(po.expectedDate) : '<em>Not set</em>'}</td>
            <td>$${po.total.toFixed(2)}</td>
            <td style="color: ${statusColor}; font-weight: bold;">${po.status}</td>
            <td>
                <button class="button button-small" onclick="viewPO(${po.id})">View</button>
                ${po.status !== 'Received' && po.status !== 'Cancelled' ? `<button class="button button-small" onclick="showReceiveItemsModal(${po.id})">Receive Items</button>` : ''}
                <button class="button button-small" onclick="editPO(${po.id})">Edit</button>
                <button class="button button-danger button-small" onclick="deletePO(${po.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    updatePOSummary();
}

// Filter purchase orders
function filterPurchaseOrders(filter) {
    currentStatusFilter = filter;
    displayPurchaseOrders();
}

// Search purchase orders
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('poSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            currentSearchTerm = this.value.toLowerCase();
            displayPurchaseOrders();
        });
    }
});

// Update PO summary
function updatePOSummary() {
    let totalPending = 0;
    let countSent = 0;
    let countReceived = 0;
    
    purchaseOrders.forEach(po => {
        if (po.status === 'Sent' || po.status === 'Partially Received') {
            totalPending += po.total;
        }
        
        if (po.status === 'Sent') {
            countSent++;
        }
        
        if (po.status === 'Received') {
            countReceived++;
        }
    });
    
    document.getElementById('total-pending-po').textContent = totalPending.toFixed(2);
    document.getElementById('count-sent').textContent = countSent;
    document.getElementById('count-received').textContent = countReceived;
}

// View PO
function viewPO(id) {
    const po = purchaseOrders.find(p => p.id === id);
    if (!po) {
        alert('Purchase Order not found!');
        return;
    }
    
    let itemsHtml = '<table border="1" cellpadding="5" style="margin: 10px 0; border-collapse: collapse;">';
    itemsHtml += '<tr><th>Product</th><th>Ordered</th><th>Received</th><th>Remaining</th><th>Price</th><th>Total</th></tr>';
    
    po.items.forEach(item => {
        const remaining = item.quantityOrdered - item.quantityReceived;
        itemsHtml += `<tr>
            <td>${item.productName}</td>
            <td>${item.quantityOrdered}</td>
            <td>${item.quantityReceived}</td>
            <td>${remaining}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>$${item.total.toFixed(2)}</td>
        </tr>`;
    });
    itemsHtml += '</table>';
    
    let historyHtml = '';
    if (po.receivingHistory && po.receivingHistory.length > 0) {
        historyHtml = '<h3>Receiving History:</h3>';
        po.receivingHistory.forEach((record, index) => {
            historyHtml += `<div style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-left: 3px solid #5cb85c;">`;
            historyHtml += `<strong>Received on ${formatDate(record.date)}</strong><br>`;
            record.items.forEach(item => {
                historyHtml += `• ${item.productName}: ${item.quantity} units<br>`;
            });
            if (record.notes) {
                historyHtml += `<em>Notes: ${record.notes}</em>`;
            }
            historyHtml += '</div>';
        });
    } else {
        historyHtml = '<p><em>No items have been received yet.</em></p>';
    }
    
    const message = `
        <div style="text-align: left;">
            <h2>Purchase Order ${po.number}</h2>
            <p><strong>Vendor:</strong> ${po.vendorName}</p>
            <p><strong>Order Date:</strong> ${formatDate(po.orderDate)}</p>
            <p><strong>Expected Delivery:</strong> ${formatDate(po.expectedDate)}</p>
            <p><strong>Status:</strong> ${po.status}</p>
            <p><strong>Total:</strong> $${po.total.toFixed(2)}</p>
            ${po.notes ? `<p><strong>Notes:</strong> ${po.notes}</p>` : ''}
            
            <h3>Line Items:</h3>
            ${itemsHtml}
            
            ${historyHtml}
        </div>
    `;
    
    // Create custom modal
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;';
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 8px; max-width: 800px; max-height: 90vh; overflow-y: auto;">
            ${message}
            <button onclick="this.closest('div').parentElement.remove()" style="margin-top: 20px; padding: 10px 20px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.remove();
        }
    };
}

// Edit PO (placeholder)
function editPO(id) {
    alert('Edit PO functionality coming soon!');
}

// Delete PO
function deletePO(id) {
    const po = purchaseOrders.find(p => p.id === id);
    if (!po) {
        alert('Purchase Order not found!');
        return;
    }
    
    if (confirm(`Are you sure you want to delete Purchase Order ${po.number}?\n\nAmount: $${po.total.toFixed(2)}\nThis action cannot be undone.`)) {
        if (erpStorage.deletePurchaseOrder(id)) {
            purchaseOrders = purchaseOrders.filter(p => p.id !== id);
            displayPurchaseOrders();
            alert('Purchase Order deleted successfully!');
        } else {
            alert('Error deleting purchase order.');
        }
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Show receive items modal
let currentReceivingPO = null;

function showReceiveItemsModal(id) {
    const po = purchaseOrders.find(p => p.id === id);
    if (!po) {
        alert('Purchase Order not found!');
        return;
    }
    
    currentReceivingPO = po;
    
    // Populate PO info
    document.getElementById('receivePONumber').value = po.number;
    document.getElementById('receiveVendor').value = po.vendorName;
    
    // Set receiving date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('receiveDate').value = today;
    
    // Populate items
    const itemsList = document.getElementById('receive-items-list');
    itemsList.innerHTML = '';
    
    po.items.forEach((item, index) => {
        const remaining = item.quantityOrdered - item.quantityReceived;
        
        const itemRow = document.createElement('div');
        itemRow.className = 'invoice-item';
        itemRow.style.marginBottom = '10px';
        itemRow.innerHTML = `
            <input type="text" value="${item.productName}" readonly style="width: 150px;">
            <input type="number" value="${item.quantityOrdered}" readonly style="width: 70px;">
            <input type="number" value="${item.quantityReceived}" readonly style="width: 70px;">
            <input type="number" class="receive-qty" data-index="${index}" min="0" max="${remaining}" value="${remaining}" style="width: 70px;" placeholder="Receive">
            <input type="number" class="remaining-qty" value="${remaining}" readonly style="width: 70px;">
        `;
        itemsList.appendChild(itemRow);
        
        // Add event listener to update remaining
        const receiveInput = itemRow.querySelector('.receive-qty');
        const remainingInput = itemRow.querySelector('.remaining-qty');
        
        receiveInput.addEventListener('input', function() {
            const receiveQty = parseInt(this.value) || 0;
            const newRemaining = item.quantityOrdered - item.quantityReceived - receiveQty;
            remainingInput.value = newRemaining >= 0 ? newRemaining : 0;
        });
    });
    
    // Show modal
    const modal = document.getElementById('receive-items-modal');
    modal.style.display = 'flex';
    
    // Add click outside to close
    modal.onclick = function(event) {
        if (event.target === modal) {
            hideReceiveItemsModal();
        }
    };
}

// Hide receive items modal
function hideReceiveItemsModal() {
    const modal = document.getElementById('receive-items-modal');
    modal.style.display = 'none';
    modal.onclick = null;
    document.getElementById('receive-items-form').reset();
    currentReceivingPO = null;
}

// Receive items
function receiveItems(event) {
    event.preventDefault();
    
    if (!currentReceivingPO) {
        alert('No purchase order selected!');
        return;
    }
    
    const receiveDate = document.getElementById('receiveDate').value;
    const receiveNotes = document.getElementById('receiveNotes').value.trim();
    
    // Get all receive quantities
    const receiveInputs = document.querySelectorAll('.receive-qty');
    const receivingData = [];
    let hasAnyReceiving = false;
    
    receiveInputs.forEach((input, index) => {
        const qty = parseInt(input.value) || 0;
        if (qty > 0) {
            hasAnyReceiving = true;
            receivingData.push({
                itemIndex: index,
                quantity: qty,
                productName: currentReceivingPO.items[index].productName
            });
        }
    });
    
    if (!hasAnyReceiving) {
        alert('Please enter quantities to receive.');
        return;
    }
    
    // Initialize receiving history if it doesn't exist
    if (!currentReceivingPO.receivingHistory) {
        currentReceivingPO.receivingHistory = [];
    }
    
    // Create receiving record
    const receivingRecord = {
        date: receiveDate,
        notes: receiveNotes,
        items: []
    };
    
    // Update item quantities and add to history
    receivingData.forEach(data => {
        const item = currentReceivingPO.items[data.itemIndex];
        item.quantityReceived += data.quantity;
        
        receivingRecord.items.push({
            productName: data.productName,
            quantity: data.quantity
        });
    });
    
    // Add to history
    currentReceivingPO.receivingHistory.push(receivingRecord);
    
    // Update PO status
    let totalOrdered = 0;
    let totalReceived = 0;
    
    currentReceivingPO.items.forEach(item => {
        totalOrdered += item.quantityOrdered;
        totalReceived += item.quantityReceived;
    });
    
    if (totalReceived >= totalOrdered) {
        currentReceivingPO.status = 'Received';
        currentReceivingPO.actualDate = receiveDate;
    } else if (totalReceived > 0) {
        currentReceivingPO.status = 'Partially Received';
    }
    
    // Save to storage
    if (erpStorage.updatePurchaseOrder(currentReceivingPO.id, currentReceivingPO)) {
        // Update local array
        const index = purchaseOrders.findIndex(po => po.id === currentReceivingPO.id);
        if (index !== -1) {
            purchaseOrders[index] = currentReceivingPO;
        }
        
        alert('Items received successfully!');
        hideReceiveItemsModal();
        displayPurchaseOrders();
    } else {
        alert('Error updating purchase order.');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    displayPurchaseOrders();
    
    console.log('Purchase Orders management loaded');
});
