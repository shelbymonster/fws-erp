// Main dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard loaded');
    
    // Dashboard is just for navigation, no API calls needed
    // All data management happens in individual pages
    
    // Optional: Add some dashboard stats if we want
    if (window.erpStorage) {
        console.log('ERP System ready with current data:');
        console.log('   - Customers:', erpStorage.getCustomers().length);
        console.log('   - Vendors:', erpStorage.getVendors().length);
        console.log('   - Products:', erpStorage.getProducts().length);
        console.log('   - Invoices:', erpStorage.getInvoices().length);
        console.log('   - Bills:', erpStorage.getBills().length);
    } else {
        console.warn('⚠️ ERP Storage not available on dashboard');
    }
});