// Shared data storage using LocalStorage with fallbacks
// This module handles all data persistence for the ERP system

class ERPStorage {
    constructor() {
        this.storageKeys = {
            customers: 'erp_customers',
            vendors: 'erp_vendors', 
            products: 'erp_products',
            invoices: 'erp_invoices',
            bills: 'erp_bills',
            employees: 'erp_employees',
            settings: 'erp_settings',
            purchaseOrders: 'erp_purchase_orders'
        };
        
        // Test if localStorage is available
        this.isStorageAvailable = this.testLocalStorage();
        
        // Fallback to memory storage if localStorage fails
        this.memoryStorage = {};
        
        console.log('ERP Storage initialized. LocalStorage available:', this.isStorageAvailable);
        
        // Initialize with default data if storage is empty
        this.initializeStorage();
    }
    
    // Check if this is the first time setup
    checkFirstTimeSetup() {
        const isInitialized = this.getItem('erp_system_initialized', false);
        
        if (isInitialized) {
            console.log('📂 System already initialized, skipping sample data');
            return true;
        }
        
        console.log('🆕 First time setup detected');
        return false;
    }
    
    // Test if localStorage is available and working
    testLocalStorage() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, 'test');
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('LocalStorage test failed, using memory storage:', e.message);
            return false;
        }
    }
    
    // Initialize storage with default sample data
    initializeStorage() {
        // Check if system has been initialized before
        if (this.checkFirstTimeSetup()) {
            return; // Already initialized, don't reload sample data
        }
        
        // Only load sample data on very first run
        if (!this.getCustomers().length) {
            this.setCustomers([
                { id: 1, name: "John Doe", email: "john@example.com", phone: "555-1234", address: "123 Main St, Anytown, ST 12345", contactName: "John Doe", notes: "Preferred payment: Net 30" },
                { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "555-5678", address: "456 Oak Ave, Business City, ST 67890", contactName: "Jane Smith", notes: "Bulk discount customer" }
            ]);
        }
        
        if (!this.getVendors().length) {
            this.setVendors([
                { id: 1, name: "Office Supplies Co", email: "sales@officesupplies.com", phone: "555-1111", address: "123 Business St, Supply City, ST 12345", contactName: "Mike Johnson" },
                { id: 2, name: "Tech Equipment Ltd", email: "billing@techequip.com", phone: "555-2222", address: "456 Tech Ave, Innovation Town, ST 67890", contactName: "Sarah Wilson" },
                { id: 3, name: "Utility Company", email: "billing@utility.com", phone: "555-3333", address: "789 Power St, Electric City, ST 11111", contactName: "David Brown" }
            ]);
        }
        
        if (!this.getProducts().length) {
            this.setProducts([
                { id: 1, name: "Widget A", price: 29.99, stock: 50 },
                { id: 2, name: "Gadget B", price: 45.50, stock: 25 },
                { id: 3, name: "Tool C", price: 15.00, stock: 100 }
            ]);
        }
        
        if (!this.getInvoices().length) {
            this.setInvoices([
                {
                    id: 1,
                    number: "INV-001",
                    customerId: 1,
                    customerName: "John Doe",
                    dateCreated: "2024-12-01",
                    dueDate: "2024-12-31",
                    items: [
                        { productId: 1, productName: "Widget A", quantity: 2, price: 29.99 },
                        { productId: 2, productName: "Gadget B", quantity: 1, price: 45.50 }
                    ],
                    total: 105.48,
                    status: "Pending"
                },
                {
                    id: 2,
                    number: "INV-002", 
                    customerId: 2,
                    customerName: "Jane Smith",
                    dateCreated: "2025-01-05",
                    dueDate: "2025-02-05",
                    items: [
                        { productId: 3, productName: "Tool C", quantity: 3, price: 15.00 }
                    ],
                    total: 45.00,
                    status: "Paid"
                }
            ]);
        }
        
        if (!this.getBills().length) {
            this.setBills([
                {
                    id: 1,
                    vendorId: 1,
                    vendorName: "Office Supplies Co",
                    description: "Monthly office supplies",
                    amount: 245.50,
                    dueDate: "2025-01-15",
                    dateCreated: "2024-12-20",
                    status: "Unpaid",
                    attachment: null
                },
                {
                    id: 2,
                    vendorId: 3,
                    vendorName: "Utility Company",
                    description: "Electricity bill - December",
                    amount: 156.75,
                    dueDate: "2025-01-10",
                    dateCreated: "2024-12-25",
                    status: "Paid",
                    attachment: { name: "electricity_bill_dec.pdf", size: "245 KB" }
                }
            ]);
        }
        
        // Mark system as initialized so sample data doesn't reload
        this.setItem('erp_system_initialized', true);
        
        // Initialize default settings
        this.initializeSettings();
        
        console.log('Sample data loaded and system marked as initialized');
    }
    
    // Initialize default settings
    initializeSettings() {
        const settings = this.getSettings();
        if (!settings.taxRate) {
            this.setSettings({
                taxRate: 8.25, // Default 8.25% tax rate
                currency: 'USD',
                companyName: 'Your Company Name',
                companyAddress: '123 Business St, City, State 12345'
            });
            console.log('Default settings initialized');
        }
    }
    
    // Generic storage methods with fallback
    setItem(key, data) {
        try {
            const jsonData = JSON.stringify(data);
            
            if (this.isStorageAvailable) {
                localStorage.setItem(key, jsonData);
                console.log('Saved to localStorage:', key);
            } else {
                // Fallback to memory storage
                this.memoryStorage[key] = jsonData;
                console.log('Saved to memory storage:', key);
            }
            return true;
        } catch (error) {
            console.error('Error saving data:', key, error);
            // Try memory storage as last resort
            try {
                this.memoryStorage[key] = JSON.stringify(data);
                console.log('Fallback: Saved to memory storage:', key);
                return true;
            } catch (e) {
                console.error('All storage methods failed:', e);
                return false;
            }
        }
    }
    
    getItem(key, defaultValue = []) {
        try {
            let data = null;
            
            if (this.isStorageAvailable) {
                data = localStorage.getItem(key);
            }
            
            // Fallback to memory storage if localStorage failed
            if (data === null && this.memoryStorage[key]) {
                data = this.memoryStorage[key];
                console.log('📂 Loading from memory storage:', key);
            }
            
            if (data === null) {
                console.log('🆕 No data found, using default for:', key);
                return defaultValue;
            }
            
            const parsedData = JSON.parse(data);
            console.log('Successfully loaded data for:', key, '(' + parsedData.length + ' items)');
            return parsedData;
        } catch (error) {
            console.error('Error loading data:', key, error);
            return defaultValue;
        }
    }
    
    // Customer methods
    getCustomers() {
        return this.getItem(this.storageKeys.customers, []);
    }
    
    setCustomers(customers) {
        return this.setItem(this.storageKeys.customers, customers);
    }
    
    addCustomer(customer) {
        const customers = this.getCustomers();
        customer.id = Date.now(); // Generate unique ID
        customers.push(customer);
        return this.setCustomers(customers);
    }
    
    updateCustomer(id, updatedCustomer) {
        const customers = this.getCustomers();
        const index = customers.findIndex(c => c.id === id);
        if (index !== -1) {
            customers[index] = { ...customers[index], ...updatedCustomer };
            return this.setCustomers(customers);
        }
        return false;
    }
    
    deleteCustomer(id) {
        const customers = this.getCustomers().filter(c => c.id !== id);
        return this.setCustomers(customers);
    }
    
    // Vendor methods
    getVendors() {
        return this.getItem(this.storageKeys.vendors, []);
    }
    
    setVendors(vendors) {
        return this.setItem(this.storageKeys.vendors, vendors);
    }
    
    addVendor(vendor) {
        const vendors = this.getVendors();
        vendor.id = Date.now();
        vendors.push(vendor);
        return this.setVendors(vendors);
    }
    
    updateVendor(id, updatedVendor) {
        const vendors = this.getVendors();
        const index = vendors.findIndex(v => v.id === id);
        if (index !== -1) {
            vendors[index] = { ...vendors[index], ...updatedVendor };
            return this.setVendors(vendors);
        }
        return false;
    }
    
    deleteVendor(id) {
        const vendors = this.getVendors().filter(v => v.id !== id);
        return this.setVendors(vendors);
    }
    
    // Product methods
    getProducts() {
        return this.getItem(this.storageKeys.products, []);
    }
    
    setProducts(products) {
        return this.setItem(this.storageKeys.products, products);
    }
    
    addProduct(product) {
        const products = this.getProducts();
        product.id = Date.now();
        products.push(product);
        return this.setProducts(products);
    }
    
    updateProduct(id, updatedProduct) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updatedProduct };
            return this.setProducts(products);
        }
        return false;
    }
    
    deleteProduct(id) {
        const products = this.getProducts().filter(p => p.id !== id);
        return this.setProducts(products);
    }
    
    // Employee methods
    getEmployees() {
        return this.getItem(this.storageKeys.employees, []);
    }
    
    setEmployees(employees) {
        return this.setItem(this.storageKeys.employees, employees);
    }
    
    addEmployee(employee) {
        const employees = this.getEmployees();
        employee.id = Date.now();
        employees.push(employee);
        return this.setEmployees(employees);
    }
    
    updateEmployee(id, updatedEmployee) {
        const employees = this.getEmployees();
        const index = employees.findIndex(e => e.id === id);
        if (index !== -1) {
            employees[index] = { ...employees[index], ...updatedEmployee };
            return this.setEmployees(employees);
        }
        return false;
    }
    
    deleteEmployee(id) {
        const employees = this.getEmployees().filter(e => e.id !== id);
        return this.setEmployees(employees);
    }
    
    // Invoice methods
    getInvoices() {
        return this.getItem(this.storageKeys.invoices, []);
    }
    
    setInvoices(invoices) {
        return this.setItem(this.storageKeys.invoices, invoices);
    }
    
    addInvoice(invoice) {
        const invoices = this.getInvoices();
        invoice.id = Date.now();
        invoices.push(invoice);
        const saved = this.setInvoices(invoices);
        return saved ? invoice : false;
    }
    
    updateInvoice(id, updatedInvoice) {
        const invoices = this.getInvoices();
        const index = invoices.findIndex(i => i.id === id);
        if (index !== -1) {
            invoices[index] = { ...invoices[index], ...updatedInvoice };
            return this.setInvoices(invoices);
        }
        return false;
    }
    
    deleteInvoice(id) {
        const invoices = this.getInvoices().filter(i => i.id !== id);
        return this.setInvoices(invoices);
    }
    
    // Bill methods
    getBills() {
        return this.getItem(this.storageKeys.bills, []);
    }
    
    setBills(bills) {
        return this.setItem(this.storageKeys.bills, bills);
    }
    
    addBill(bill) {
        const bills = this.getBills();
        bill.id = Date.now();
        bills.push(bill);
        return this.setBills(bills);
    }
    
    updateBill(id, updatedBill) {
        const bills = this.getBills();
        const index = bills.findIndex(b => b.id === id);
        if (index !== -1) {
            bills[index] = { ...bills[index], ...updatedBill };
            return this.setBills(bills);
        }
        return false;
    }
    
    deleteBill(id) {
        const bills = this.getBills().filter(b => b.id !== id);
        return this.setBills(bills);
    }
    
    // Settings methods
    getSettings() {
        return this.getItem(this.storageKeys.settings, {});
    }
    
    setSettings(settings) {
        return this.setItem(this.storageKeys.settings, settings);
    }
    
    updateSettings(updatedSettings) {
        const currentSettings = this.getSettings();
        const newSettings = { ...currentSettings, ...updatedSettings };
        return this.setSettings(newSettings);
    }
    
    getTaxRate() {
        const settings = this.getSettings();
        return settings.taxRate || 0;
    }
    
    // Utility methods
    generateInvoiceNumber() {
        const invoices = this.getInvoices();
        return `INV-${String(invoices.length + 1).padStart(3, '0')}`;
    }
    
    // Backup and restore
    exportData() {
        const data = {
            customers: this.getCustomers(),
            vendors: this.getVendors(),
            products: this.getProducts(),
            invoices: this.getInvoices(),
            bills: this.getBills(),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }
    
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            this.setCustomers(data.customers || []);
            this.setVendors(data.vendors || []);
            this.setProducts(data.products || []);
            this.setInvoices(data.invoices || []);
            this.setBills(data.bills || []);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
    
    clearAllData() {
        Object.values(this.storageKeys).forEach(key => {
            if (this.isStorageAvailable) {
                localStorage.removeItem(key);
            } else {
                delete this.memoryStorage[key];
            }
        });
        
        // Remove the initialization flag so sample data loads again
        if (this.isStorageAvailable) {
            localStorage.removeItem('erp_system_initialized');
        } else {
            delete this.memoryStorage['erp_system_initialized'];
        }
        
        this.initializeStorage();
    }
    
    // New method to clear all data but keep system initialized (no sample data reload)
    clearAllDataClean() {
        Object.values(this.storageKeys).forEach(key => {
            if (this.isStorageAvailable) {
                localStorage.setItem(key, JSON.stringify([]));
            } else {
                this.memoryStorage[key] = JSON.stringify([]);
            }
        });
        
        // Keep the system marked as initialized so sample data doesn't reload
        this.setItem('erp_system_initialized', true);
        console.log('All data cleared - system will remain empty');
    }
    
    // =========================================
    // PURCHASE ORDERS METHODS
    // =========================================
    
    getPurchaseOrders() {
        return this.getItem(this.storageKeys.purchaseOrders, []);
    }
    
    setPurchaseOrders(purchaseOrders) {
        return this.setItem(this.storageKeys.purchaseOrders, purchaseOrders);
    }
    
    addPurchaseOrder(purchaseOrder) {
        const purchaseOrders = this.getPurchaseOrders();
        
        // Auto-generate ID
        const maxId = purchaseOrders.reduce((max, po) => Math.max(max, po.id || 0), 0);
        purchaseOrder.id = maxId + 1;
        
        purchaseOrders.push(purchaseOrder);
        
        if (this.setPurchaseOrders(purchaseOrders)) {
            console.log('✅ Purchase Order added:', purchaseOrder.number);
            return purchaseOrder;
        }
        
        return null;
    }
    
    updatePurchaseOrder(id, updatedData) {
        const purchaseOrders = this.getPurchaseOrders();
        const index = purchaseOrders.findIndex(po => po.id === id);
        
        if (index !== -1) {
            purchaseOrders[index] = { ...purchaseOrders[index], ...updatedData };
            
            if (this.setPurchaseOrders(purchaseOrders)) {
                console.log('✅ Purchase Order updated:', id);
                return purchaseOrders[index];
            }
        }
        
        return null;
    }
    
    deletePurchaseOrder(id) {
        const purchaseOrders = this.getPurchaseOrders();
        const filtered = purchaseOrders.filter(po => po.id !== id);
        
        if (filtered.length < purchaseOrders.length) {
            if (this.setPurchaseOrders(filtered)) {
                console.log('✅ Purchase Order deleted:', id);
                return true;
            }
        }
        
        return false;
    }
}

// Create global storage instance
window.erpStorage = new ERPStorage();

// Add some debugging info
console.log('🚀 ERP Storage System Loaded');
console.log('Storage available:', window.erpStorage.isStorageAvailable);
console.log('Current data counts:');
console.log('  - Customers:', window.erpStorage.getCustomers().length);
console.log('  - Vendors:', window.erpStorage.getVendors().length);  
console.log('  - Products:', window.erpStorage.getProducts().length);
console.log('  - Invoices:', window.erpStorage.getInvoices().length);
console.log('  - Bills:', window.erpStorage.getBills().length);