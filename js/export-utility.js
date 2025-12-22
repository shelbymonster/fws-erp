// Export utility for CSV and JSON downloads

const ExportUtility = {
    // Export data to CSV
    exportToCSV(data, filename, columns = null) {
        if (!data || data.length === 0) {
            alert('No data to export');
            return;
        }
        
        // If columns not specified, use all keys from first object
        const headers = columns || Object.keys(data[0]);
        
        // Create CSV header
        let csv = headers.join(',') + '\n';
        
        // Add data rows
        data.forEach(row => {
            const values = headers.map(header => {
                let value = row[header];
                
                // Handle special cases
                if (value === null || value === undefined) {
                    value = '';
                }
                
                // Convert arrays/objects to string
                if (typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                
                // Escape quotes and wrap in quotes if contains comma or quote
                value = String(value).replace(/"/g, '""');
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    value = `"${value}"`;
                }
                
                return value;
            });
            
            csv += values.join(',') + '\n';
        });
        
        // Create download
        this.downloadFile(csv, filename, 'text/csv');
    },
    
    // Export data to JSON
    exportToJSON(data, filename) {
        if (!data) {
            alert('No data to export');
            return;
        }
        
        const json = JSON.stringify(data, null, 2);
        this.downloadFile(json, filename, 'application/json');
    },
    
    // Export table to CSV
    exportTableToCSV(tableId, filename) {
        const table = document.getElementById(tableId);
        if (!table) {
            alert('Table not found');
            return;
        }
        
        let csv = [];
        
        // Get headers
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
        csv.push(headers.join(','));
        
        // Get rows
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(td => {
                let value = td.textContent.trim();
                
                // Escape quotes and wrap in quotes if contains comma or quote
                value = value.replace(/"/g, '""');
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    value = `"${value}"`;
                }
                
                return value;
            });
            csv.push(cells.join(','));
        });
        
        this.downloadFile(csv.join('\n'), filename, 'text/csv');
    },
    
    // Helper to download file
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },
    
    // Format invoice data for export
    formatInvoicesForExport(invoices, customers) {
        return invoices.map(invoice => {
            const customer = customers?.find(c => c.id === invoice.customerId);
            return {
                'Invoice Number': invoice.number || invoice.id,
                'Customer': invoice.customerName || customer?.name || 'Unknown',
                'Invoice Date': invoice.dateCreated,
                'Due Date': invoice.dueDate,
                'Subtotal': invoice.subtotal?.toFixed(2) || '0.00',
                'Tax Rate': invoice.taxRate || '0',
                'Tax Amount': invoice.taxAmount?.toFixed(2) || '0.00',
                'Total': invoice.total?.toFixed(2) || '0.00',
                'Status': invoice.status || 'Pending',
                'Payment Date': invoice.paymentDate || '',
                'Payment Type': invoice.paymentType || ''
            };
        });
    },
    
    // Format bills data for export
    formatBillsForExport(bills, vendors) {
        return bills.map(bill => {
            const vendor = vendors?.find(v => v.id === bill.vendorId);
            return {
                'Vendor': vendor?.name || bill.vendorName || 'Unknown',
                'Invoice Number': bill.invoiceNumber || '',
                'Description': bill.description || '',
                'Bill Date': bill.billDate || bill.dateCreated,
                'Due Date': bill.dueDate || '',
                'Amount': bill.amount ? parseFloat(bill.amount).toFixed(2) : '0.00',
                'Status': bill.status || 'Unpaid',
                'Payment Date': bill.paymentDate || '',
                'Payment Type': bill.paymentType || ''
            };
        });
    },
    
    // Format customers for export
    formatCustomersForExport(customers) {
        return customers.map(customer => ({
            'ID': customer.id,
            'Name': customer.name || '',
            'Email': customer.email || '',
            'Phone': customer.phone || '',
            'Company': customer.company || '',
            'Address': customer.address || '',
            'City': customer.city || '',
            'State': customer.state || '',
            'Zip': customer.zip || '',
            'Notes': customer.notes || ''
        }));
    },
    
    // Format vendors for export
    formatVendorsForExport(vendors) {
        return vendors.map(vendor => ({
            'ID': vendor.id,
            'Name': vendor.name || '',
            'Email': vendor.email || '',
            'Phone': vendor.phone || '',
            'Company': vendor.company || '',
            'Address': vendor.address || '',
            'City': vendor.city || '',
            'State': vendor.state || '',
            'Zip': vendor.zip || '',
            'Notes': vendor.notes || ''
        }));
    },
    
    // Format products for export
    formatProductsForExport(products) {
        return products.map(product => ({
            'ID': product.id,
            'Name': product.name || '',
            'Type': product.type === 'service' ? 'Service/Fee' : 'Physical Product',
            'Price': product.price?.toFixed(2) || '0.00',
            'Stock': product.type === 'service' ? 'N/A' : (product.stock || 0)
        }));
    },
    
    // Get current date for filename
    getDateForFilename() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};

// Make globally available
window.ExportUtility = ExportUtility;

console.log('Export utility loaded');
