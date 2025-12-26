// Inventory management functionality with LocalStorage
let products = [];

// Load products from storage
function loadProducts() {
    products = erpStorage.getProducts();
}

// Display products in the table
function displayProducts() {
    const tbody = document.getElementById('products-tbody');
    tbody.innerHTML = '';
    
    products.forEach(product => {
        const productType = product.type || 'product'; // Default to 'product' for existing items
        const typeDisplay = productType === 'service' ? 'Service' : 'Product';
        const stockValue = product.stock !== null && product.stock !== undefined ? product.stock : 0;
        const stockDisplay = productType === 'service' ? '—' : stockValue;
        const stockClass = productType === 'product' && stockValue < 10 ? 'low-stock' : '';
        const partNumber = product.partNumber || '—';
        const upc = product.upc || '—';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${partNumber}</td>
            <td>${upc}${product.upc ? ' <button class="button button-small" onclick="viewBarcode(' + product.id + ')">View Barcode</button>' : ''}</td>
            <td>${typeDisplay}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td class="${stockClass}">${stockDisplay}</td>
            <td>
                <button class="button button-info button-small" onclick="viewStockHistory(${product.id})">History</button>
                <button class="button button-warning button-small" onclick="editProduct(${product.id})">Edit</button>
                <button class="button button-danger button-small" onclick="deleteProduct(${product.id})">Delete</button>
                ${productType === 'product' ? '<button class="button button-info button-small" onclick="adjustStock(' + product.id + ')">Adjust Stock</button>' : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Show add product form
function showAddProductForm() {
    const modal = document.getElementById('add-product-form');
    modal.style.display = 'flex';
    // Reset form
    document.getElementById('productType').value = 'product';
    toggleStockField();
    
    // Add click outside to close
    modal.onclick = function(event) {
        if (event.target === modal) {
            hideAddProductForm();
        }
    };
}

// Hide add product form
function hideAddProductForm() {
    const modal = document.getElementById('add-product-form');
    modal.style.display = 'none';
    modal.onclick = null;
    document.getElementById('productName').value = '';
    document.getElementById('productPartNumber').value = '';
    document.getElementById('productUPC').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productType').value = 'product';
}

// Toggle stock field based on product type
function toggleStockField() {
    const productType = document.getElementById('productType').value;
    const stockField = document.getElementById('productStock');
    
    if (productType === 'service') {
        stockField.value = '0';
        stockField.disabled = true;
        stockField.required = false;
        stockField.style.opacity = '0.5';
        stockField.placeholder = 'N/A (Service)';
    } else {
        stockField.disabled = false;
        stockField.required = true;
        stockField.style.opacity = '1';
        stockField.placeholder = 'Stock Quantity';
    }
}

// Add new product
function addProduct(event) {
    event.preventDefault();
    
    const name = document.getElementById('productName').value;
    const partNumber = document.getElementById('productPartNumber').value.trim();
    const upc = document.getElementById('productUPC').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const type = document.getElementById('productType').value;
    const stockInput = document.getElementById('productStock').value;
    const stock = type === 'service' ? 0 : (stockInput ? parseInt(stockInput) : 0);
    const description = document.getElementById('productDescription').value.trim();
    
    // Validate UPC if provided
    if (upc && upc.length !== 12) {
        alert('UPC code must be exactly 12 digits');
        return;
    }
    
    const newProduct = {
        name: name,
        partNumber: partNumber || '',
        upc: upc || '',
        type: type,
        price: price,
        stock: stock,
        description: description || ''
    };
    
    if (erpStorage.addProduct(newProduct)) {
        loadProducts();
        displayProducts();
        hideAddProductForm();
        alert('Product added successfully!');
    } else {
        alert('Error saving product. Please try again.');
    }
}

// Delete product
function deleteProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) {
        alert('Product not found!');
        return;
    }
    
    if (confirm(`Are you sure you want to delete "${product.name}"?\n\nThis action cannot be undone.`)) {
        if (erpStorage.deleteProduct(id)) {
            loadProducts();
            displayProducts();
            alert('Product deleted successfully!');
        } else {
            alert('Error deleting product. Please try again.');
        }
    }
}

// Edit product
function editProduct(id) {
    const product = products.find(p => p.id === id);
    const productType = product.type || 'product';
    
    const newName = prompt('Enter new name:', product.name);
    if (!newName) return;
    
    const newPartNumber = prompt('Enter part number (leave blank if none):', product.partNumber || '');
    if (newPartNumber === null) return;
    
    const newUPC = prompt('Enter UPC code (12 digits, leave blank if none):', product.upc || '');
    if (newUPC === null) return;
    
    // Validate UPC if provided
    if (newUPC.trim() && newUPC.trim().length !== 12) {
        alert('UPC code must be exactly 12 digits');
        return;
    }
    
    const newPrice = prompt('Enter new price:', product.price);
    if (!newPrice) return;
    
    let newStock = product.stock;
    if (productType === 'product') {
        const stockInput = prompt('Enter new stock:', product.stock);
        if (stockInput === null) return;
        newStock = parseInt(stockInput);
    }
    
    const newDescription = prompt('Enter description (leave blank if none):', product.description || '');
    if (newDescription === null) return;
    
    const updatedData = {
        name: newName,
        partNumber: newPartNumber.trim(),
        upc: newUPC.trim(),
        type: productType,
        price: parseFloat(newPrice),
        stock: newStock,
        description: newDescription.trim()
    };
    
    if (erpStorage.updateProduct(id, updatedData)) {
        loadProducts();
        displayProducts();
        alert('Product updated successfully!');
    } else {
        alert('Error updating product. Please try again.');
    }
}

// Adjust stock
function adjustStock(id) {
    const product = products.find(p => p.id === id);
    const adjustment = prompt(`Current stock: ${product.stock}\nEnter adjustment (+/- number):`, '0');
    
    if (adjustment !== null) {
        const newStock = product.stock + parseInt(adjustment);
        if (newStock >= 0) {
            const updatedData = { stock: newStock };
            
            if (erpStorage.updateProduct(id, updatedData)) {
                loadProducts();
                displayProducts();
                alert('Stock adjusted successfully!');
            } else {
                alert('Error adjusting stock. Please try again.');
            }
        } else {
            alert('Stock cannot be negative!');
        }
    }
}

// View stock history
function viewStockHistory(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        alert('Product not found!');
        return;
    }

    // Update modal header
    document.getElementById('history-product-name').textContent = product.name;
    document.getElementById('history-current-stock').textContent = product.stock;

    // Get all invoices and bills
    const invoices = erpStorage.getInvoices() || [];
    const bills = erpStorage.getBills() || [];

    // Build history entries
    const history = [];

    // Add invoice entries (sales - decreases stock)
    invoices.forEach(invoice => {
        if (invoice.items && Array.isArray(invoice.items)) {
            invoice.items.forEach(item => {
                if (item.productId === productId) {
                    history.push({
                        date: invoice.dateCreated,
                        type: 'Sale',
                        reference: `Invoice #${invoice.id}`,
                        customer: invoice.customerName || 'Unknown',
                        change: -item.quantity,
                        timestamp: new Date(invoice.dateCreated).getTime()
                    });
                }
            });
        }
    });

    // Add bill entries (purchases - increases stock)
    bills.forEach(bill => {
        if (bill.items && Array.isArray(bill.items)) {
            bill.items.forEach(item => {
                if (item.category === 'Inventory' && item.productId === productId) {
                    history.push({
                        date: bill.billDate,
                        type: 'Purchase',
                        reference: `Bill #${bill.id}`,
                        vendor: bill.vendorName || 'Unknown',
                        change: item.quantity,
                        timestamp: new Date(bill.billDate).getTime()
                    });
                }
            });
        }
    });

    // Sort by date (newest first)
    history.sort((a, b) => b.timestamp - a.timestamp);

    // Calculate running balance (working backwards from current stock)
    let runningBalance = product.stock;
    const historyWithBalance = history.map(entry => {
        const entryWithBalance = { ...entry, balance: runningBalance };
        runningBalance -= entry.change;
        return entryWithBalance;
    });

    // Reverse to show oldest first with correct balances
    historyWithBalance.reverse();

    // Display history in table
    const tbody = document.getElementById('stock-history-tbody');
    tbody.innerHTML = '';

    if (historyWithBalance.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">No stock history found</td></tr>';
    } else {
        historyWithBalance.forEach(entry => {
            const row = document.createElement('tr');
            const changeClass = entry.change > 0 ? 'text-success' : 'text-danger';
            const changeSymbol = entry.change > 0 ? '+' : '';
            
            row.innerHTML = `
                <td>${formatDate(entry.date)}</td>
                <td>${entry.type === 'Sale' ? 'Sale' : 'Purchase'}</td>
                <td>${entry.reference}<br><small style="color: #666;">${entry.customer || entry.vendor}</small></td>
                <td class="${changeClass}">${changeSymbol}${entry.change}</td>
                <td><strong>${entry.balance}</strong></td>
            `;
            tbody.appendChild(row);
        });
    }

    // Show modal
    document.getElementById('stock-history-modal').style.display = 'flex';
}

// Close stock history modal
function closeStockHistoryModal() {
    document.getElementById('stock-history-modal').style.display = 'none';
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Show loading state
    LoadingState.showTableLoading('products-tbody', 5);
    
    // Simulate async load
    await LoadingState.simulateAsync(() => {
        loadProducts();
    }, 400);
    
    displayProducts();
});

// Search and Filter Functions
let currentProductSearchTerm = '';

function searchProducts() {
    const searchInput = document.getElementById('productSearchInput');
    const clearButton = document.getElementById('productSearchClear');
    currentProductSearchTerm = searchInput.value.toLowerCase().trim();
    
    // Show/hide clear button
    if (currentProductSearchTerm.length > 0) {
        clearButton.classList.add('visible');
    } else {
        clearButton.classList.remove('visible');
    }
    
    applyProductFilters();
}

function clearProductSearch() {
    const searchInput = document.getElementById('productSearchInput');
    const clearButton = document.getElementById('productSearchClear');
    searchInput.value = '';
    currentProductSearchTerm = '';
    clearButton.classList.remove('visible');
    applyProductFilters();
}

function applyProductFilters() {
    const tbody = document.getElementById('products-tbody');
    tbody.innerHTML = '';
    
    let filteredProducts = products;
    
    // Apply search filter
    if (currentProductSearchTerm) {
        filteredProducts = products.filter(product => {
            const name = product.name ? product.name.toLowerCase() : '';
            const type = product.type ? (product.type === 'product' ? 'physical product' : 'service fee') : '';
            const price = product.price ? product.price.toString() : '';
            const stock = product.stock ? product.stock.toString() : '';
            
            return name.includes(currentProductSearchTerm) ||
                   type.includes(currentProductSearchTerm) ||
                   price.includes(currentProductSearchTerm) ||
                   stock.includes(currentProductSearchTerm);
        });
    }
    
    if (filteredProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #666;">No products found.</td></tr>';
        return;
    }
    
    filteredProducts.forEach(product => {
        const row = document.createElement('tr');
        
        // Determine type icon and label
        const typeIcon = product.type === 'service' ? '' : '';
        const typeLabel = product.type === 'service' ? 'Service/Fee' : 'Product';
        
        // Display stock or "—" for services
        const stockDisplay = product.type === 'service' ? '—' : product.stock;
        
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${typeIcon} ${typeLabel}</td>
            <td>$${parseFloat(product.price).toFixed(2)}</td>
            <td>${stockDisplay}</td>
            <td>
                ${product.type !== 'service' ? `<button class="button button-small" onclick="adjustStock('${product.id}')">Adjust Stock</button>` : ''}
                ${product.type !== 'service' ? `<button class="button button-small" onclick="viewStockHistory('${product.id}')">Stock History</button>` : ''}
                <button class="button button-small button-danger" onclick="deleteProduct('${product.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.searchProducts = searchProducts;
window.clearProductSearch = clearProductSearch;

// Export functions
function exportProductsToCSV() {
    const formattedData = ExportUtility.formatProductsForExport(products);
    const filename = `products_${ExportUtility.getDateForFilename()}.csv`;
    ExportUtility.exportToCSV(formattedData, filename);
}

function exportProductsToJSON() {
    const filename = `products_${ExportUtility.getDateForFilename()}.json`;
    ExportUtility.exportToJSON(products, filename);
}

// View and print barcode
function viewBarcode(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || !product.upc) {
        alert('No UPC code available for this product');
        return;
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="text-align: center; max-width: 500px;">
            <h2>${product.name}</h2>
            <p>Part Number: ${product.partNumber || 'N/A'}</p>
            <p>UPC: ${product.upc}</p>
            <svg id="barcode-svg"></svg>
            <div style="margin-top: 20px;">
                <button class="button button-primary" onclick="printBarcode()">Print Barcode</button>
                <button class="button button-secondary" onclick="this.closest('.modal').remove()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Generate barcode - use CODE128 which works with any alphanumeric string
    // UPC/EAN formats require valid check digits, so CODE128 is more reliable for general use
    try {
        JsBarcode("#barcode-svg", product.upc, {
            format: "CODE128",
            width: 2,
            height: 100,
            displayValue: true
        });
    } catch (error) {
        alert('Error generating barcode: ' + (error.message || 'Unable to generate barcode'));
        modal.remove();
        return;
    }
    
    // Close on background click
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

function printBarcode() {
    const printWindow = window.open('', '', 'height=400,width=600');
    const barcodeContent = document.querySelector('#barcode-svg').outerHTML;
    
    printWindow.document.write('<html><head><title>Print Barcode</title>');
    printWindow.document.write('<style>body { text-align: center; padding: 20px; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(barcodeContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

window.exportProductsToCSV = exportProductsToCSV;
window.exportProductsToJSON = exportProductsToJSON;
window.viewBarcode = viewBarcode;
window.printBarcode = printBarcode;

console.log('Product search functionality enabled');