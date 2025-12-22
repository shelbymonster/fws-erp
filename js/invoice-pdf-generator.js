// PDF Invoice Generator for Simple ERP
// Creates professional PDF invoices that can be downloaded, printed, or emailed

class InvoicePDFGenerator {
    constructor() {
        this.companyInfo = this.getCompanyInfo();
    }

    // Get company information from settings
    getCompanyInfo() {
        const settings = erpStorage.getSettings();
        return {
            name: settings.companyName || 'Your Company Name',
            address: settings.companyAddress || '123 Business St, City, State 12345',
            phone: settings.companyPhone || '(555) 123-4567',
            email: settings.companyEmail || 'contact@yourcompany.com',
            website: settings.companyWebsite || 'www.yourcompany.com',
            taxRate: settings.taxRate || 0
        };
    }

    // Generate and download PDF invoice
    generateInvoicePDF(invoiceData) {
        try {
            console.log('Generating PDF for invoice:', invoiceData);

            // Create new jsPDF instance
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Set up document properties
            doc.setProperties({
                title: `Invoice ${invoiceData.number}`,
                subject: `Invoice for ${invoiceData.customerName}`,
                author: this.companyInfo.name,
                creator: 'Simple ERP System'
            });

            // Generate the PDF content
            this.addHeader(doc, invoiceData);
            this.addCompanyInfo(doc, invoiceData);
            this.addInvoiceInfo(doc, invoiceData);
            this.addCustomerInfo(doc, invoiceData);
            this.addItemsTable(doc, invoiceData);
            this.addTotals(doc, invoiceData);
            this.addFooter(doc, invoiceData);

            // Generate filename
            const filename = `Invoice_${invoiceData.number}_${invoiceData.customerName.replace(/\s+/g, '_')}.pdf`;

            // Save the PDF
            doc.save(filename);

            console.log('PDF generated successfully:', filename);
            return true;

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
            return false;
        }
    }

    // Add header with invoice title
    addHeader(doc, invoiceData) {
        // Company name
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(this.companyInfo.name, 20, 20);

        // Invoice title
        doc.setFontSize(24);
        doc.setTextColor(41, 90, 160); // Blue color
        doc.text('INVOICE', 150, 20);

        // Invoice number
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(`Invoice #: ${invoiceData.number}`, 150, 30);
        
        // Add backorder note if applicable
        let separatorY = 35;
        if (invoiceData.backorderOf) {
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'italic');
            doc.text(`Backorder of ${invoiceData.backorderOf}`, 150, 36);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            separatorY = 41;
        }

        // Add a line separator
        doc.setDrawColor(200, 200, 200);
        doc.line(20, separatorY, 190, separatorY);
    }

    // Add company information
    addCompanyInfo(doc, invoiceData) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        let yPos = invoiceData.backorderOf ? 51 : 45;
        doc.text(this.companyInfo.address, 20, yPos);
        yPos += 5;
        
        if (this.companyInfo.phone) {
            doc.text(`Phone: ${this.companyInfo.phone}`, 20, yPos);
            yPos += 5;
        }
        
        if (this.companyInfo.email) {
            doc.text(`Email: ${this.companyInfo.email}`, 20, yPos);
            yPos += 5;
        }
        
        if (this.companyInfo.website) {
            doc.text(`Website: ${this.companyInfo.website}`, 20, yPos);
        }
    }

    // Add invoice information
    addInvoiceInfo(doc, invoiceData) {
        doc.setFontSize(10);
        
        let yPos = invoiceData.backorderOf ? 51 : 45;
        doc.text(`Date Created: ${this.formatDate(invoiceData.dateCreated)}`, 150, yPos);
        yPos += 5;
        
        // Only show due date if invoice is not already paid
        if (invoiceData.status !== 'Paid') {
            doc.text(`Due Date: ${this.formatDate(invoiceData.dueDate)}`, 150, yPos);
            yPos += 5;
        }
        
        doc.text(`Status: ${invoiceData.status}`, 150, yPos);
    }

    // Add customer information
    addCustomerInfo(doc, invoiceData) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Bill To:', 20, 80);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        let yPos = 90;
        doc.text(invoiceData.customerName, 20, yPos);
        
        // Try to get customer details from storage
        const customers = erpStorage.getCustomers();
        const customer = customers.find(c => c.id === invoiceData.customerId);
        
        if (customer) {
            yPos += 6;
            if (customer.email) doc.text(`Email: ${customer.email}`, 20, yPos);
            yPos += 6;
            if (customer.phone) doc.text(`Phone: ${customer.phone}`, 20, yPos);
            yPos += 6;
            if (customer.address) {
                const addressLines = customer.address.split(',');
                addressLines.forEach(line => {
                    doc.text(line.trim(), 20, yPos);
                    yPos += 6;
                });
            }
        }
    }

    // Add items table
    addItemsTable(doc, invoiceData) {
        const startY = 130;
        
        // Table headers
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(240, 240, 240);
        doc.rect(20, startY, 170, 8, 'F');
        
        doc.text('Description', 22, startY + 6);
        doc.text('Qty', 120, startY + 6);
        doc.text('Price', 140, startY + 6);
        doc.text('Total', 170, startY + 6);

        // Table rows
        doc.setFont('helvetica', 'normal');
        let yPos = startY + 15;
        
        invoiceData.items.forEach((item, index) => {
            const quantity = item.quantityOrdered || item.quantity || 0;
            const lineTotal = quantity * item.price;
            
            doc.text(item.productName, 22, yPos);
            doc.text(quantity.toString(), 120, yPos);
            doc.text(`$${item.price.toFixed(2)}`, 140, yPos);
            doc.text(`$${lineTotal.toFixed(2)}`, 170, yPos);
            
            yPos += 8;
            
            // Add line separator
            if (index < invoiceData.items.length - 1) {
                doc.setDrawColor(230, 230, 230);
                doc.line(20, yPos - 2, 190, yPos - 2);
            }
        });

        // Bottom border of table
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPos, 190, yPos);
        
        return yPos + 10;
    }

    // Add totals section
    addTotals(doc, invoiceData) {
        const startY = 130 + (invoiceData.items.length * 8) + 25;
        
        // Calculate totals
        const subtotal = invoiceData.items.reduce((sum, item) => {
            const quantity = item.quantityOrdered || item.quantity || 0;
            return sum + (quantity * item.price);
        }, 0);
        const taxAmount = (subtotal * this.companyInfo.taxRate) / 100;
        const total = subtotal + taxAmount;
        
        // Subtotal
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text('Subtotal:', 140, startY);
        doc.text(`$${subtotal.toFixed(2)}`, 175, startY);
        
        // Tax
        doc.text(`Tax (${this.companyInfo.taxRate.toFixed(2)}%):`, 140, startY + 8);
        doc.text(`$${taxAmount.toFixed(2)}`, 175, startY + 8);
        
        // Total
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('TOTAL:', 140, startY + 20);
        doc.text(`$${total.toFixed(2)}`, 175, startY + 20);
        
        // Add border around totals
        doc.setDrawColor(200, 200, 200);
        doc.rect(135, startY - 5, 55, 30);
    }

    // Add footer
    addFooter(doc, invoiceData) {
        const pageHeight = doc.internal.pageSize.height;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        
        // Footer text
        const footerY = pageHeight - 20;
        doc.text('Thank you for your business!', 20, footerY);
        doc.text(`Generated on ${new Date().toLocaleDateString()} by Simple ERP System`, 20, footerY + 7);
        
        // Only show payment terms if invoice is not already paid
        if (invoiceData.status !== 'Paid') {
            doc.text('Payment is due within 30 days of invoice date.', 20, footerY + 14);
        }
    }

    // Utility function to format dates
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Create global PDF generator instance
window.invoicePDFGenerator = new InvoicePDFGenerator();

// Function to generate PDF for an existing invoice
function generateInvoicePDF(invoiceId) {
    const invoices = erpStorage.getInvoices();
    const invoice = invoices.find(inv => inv.id === invoiceId);
    
    if (invoice) {
        return window.invoicePDFGenerator.generateInvoicePDF(invoice);
    } else {
        alert('Invoice not found!');
        return false;
    }
}

console.log('PDF Invoice Generator loaded successfully');