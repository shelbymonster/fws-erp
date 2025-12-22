// Keyboard Navigation Enhancement for ERP Forms
// This module provides keyboard-focused navigation for faster data entry

class KeyboardNavigation {
    constructor() {
        this.typeaheadBuffer = '';
        this.typeaheadTimeout = null;
        this.currentItemIndex = 0;
        this.keyboardHandler = null; // Store handler reference to prevent duplicates
        this.initialized = false;
    }

    // Initialize keyboard navigation for invoice form
    initInvoiceForm() {
        const modal = document.getElementById('create-invoice-form');
        if (!modal) return;

        // Auto-focus first field when modal opens
        setTimeout(() => {
            const customerSelect = document.getElementById('invoiceCustomer');
            if (customerSelect) {
                customerSelect.focus();
            }
        }, 100);

        // Remove existing handler if present
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }

        // Create and store the handler
        this.keyboardHandler = (e) => {
            // Only handle shortcuts when modal is visible
            if (modal.style.display !== 'flex') return;

            // Ctrl/Cmd + Enter to submit form
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                const form = modal.querySelector('form');
                if (form) {
                    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }
                return;
            }

            // Ctrl/Cmd + I to add new item
            if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I')) {
                e.preventDefault();
                e.stopPropagation();
                addInvoiceItem();
                // Focus on the product dropdown of the new item
                setTimeout(() => {
                    const items = document.querySelectorAll('.invoice-item');
                    const lastItem = items[items.length - 1];
                    const productSelect = lastItem.querySelector('.item-product');
                    if (productSelect) productSelect.focus();
                }, 50);
                return;
            }
        };

        // Add the handler
        document.addEventListener('keydown', this.keyboardHandler);

        // Setup keyboard navigation for line items (only once)
        if (!this.initialized) {
            this.setupLineItemNavigation();
            this.initialized = true;
        }
    }

    // Setup keyboard navigation for invoice line items
    setupLineItemNavigation() {
        const itemsContainer = document.getElementById('invoice-items');
        if (!itemsContainer) return;

        // Use event delegation for dynamically added items
        itemsContainer.addEventListener('keydown', (e) => {
            const target = e.target;
            
            // Enter key behavior
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                
                if (target.classList.contains('item-product')) {
                    // After selecting product, move to ordered quantity
                    this.moveToNextField(target);
                } else if (target.classList.contains('item-quantity-ordered')) {
                    // After ordered quantity, move to backordered quantity
                    this.moveToNextField(target);
                } else if (target.classList.contains('item-quantity-backordered')) {
                    // After backordered quantity, move to price
                    this.moveToNextField(target);
                } else if (target.classList.contains('item-price')) {
                    // After price, add new item or move to submit
                    const items = document.querySelectorAll('.invoice-item');
                    const currentItem = target.closest('.invoice-item');
                    const currentIndex = Array.from(items).indexOf(currentItem);
                    
                    // If this is the last item, add a new one
                    if (currentIndex === items.length - 1) {
                        addInvoiceItem();
                        setTimeout(() => {
                            const newItems = document.querySelectorAll('.invoice-item');
                            const newItem = newItems[newItems.length - 1];
                            const productSelect = newItem.querySelector('.item-product');
                            if (productSelect) productSelect.focus();
                        }, 50);
                    } else {
                        // Move to next item's product field
                        const nextItem = items[currentIndex + 1];
                        const nextProduct = nextItem.querySelector('.item-product');
                        if (nextProduct) nextProduct.focus();
                    }
                }
            }
            
            // Ctrl/Cmd + D to remove current line item
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                const currentItem = target.closest('.invoice-item');
                if (currentItem) {
                    const removeBtn = currentItem.querySelector('.remove-button');
                    if (removeBtn) removeBtn.click();
                }
            }
        });

        // Auto-populate price when product is selected
        itemsContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('item-product')) {
                this.autoPopulatePrice(e.target);
                // Auto-focus ordered quantity field
                setTimeout(() => {
                    const item = e.target.closest('.invoice-item');
                    const qtyInput = item.querySelector('.item-quantity-ordered');
                    if (qtyInput) qtyInput.focus();
                }, 50);
            }
        });

        // Auto-populate price when quantity is entered
        itemsContainer.addEventListener('input', (e) => {
            if (e.target.classList.contains('item-quantity-ordered') || e.target.classList.contains('item-quantity-backordered')) {
                const item = e.target.closest('.invoice-item');
                const productSelect = item.querySelector('.item-product');
                if (productSelect.value && !item.querySelector('.item-price').value) {
                    this.autoPopulatePrice(productSelect);
                }
            }
        });
    }

    // Auto-populate price from selected product
    autoPopulatePrice(productSelect) {
        const item = productSelect.closest('.invoice-item');
        const priceInput = item.querySelector('.item-price');
        const productId = parseInt(productSelect.value);
        
        if (productId) {
            const products = erpStorage.getProducts();
            const product = products.find(p => p.id === productId);
            if (product && priceInput) {
                priceInput.value = product.price.toFixed(2);
                // Trigger totals update
                priceInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }

    // Move focus to next form field
    moveToNextField(currentField) {
        const item = currentField.closest('.invoice-item');
        if (!item) return;

        if (currentField.classList.contains('item-product')) {
            const qtyInput = item.querySelector('.item-quantity-ordered');
            if (qtyInput) qtyInput.focus();
        } else if (currentField.classList.contains('item-quantity-ordered')) {
            const backorderInput = item.querySelector('.item-quantity-backordered');
            if (backorderInput) backorderInput.focus();
        } else if (currentField.classList.contains('item-quantity-backordered')) {
            const priceInput = item.querySelector('.item-price');
            if (priceInput) priceInput.focus();
        }
    }

    // Enable type-to-search functionality for select dropdowns
    enableTypeToSearch(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.addEventListener('keypress', (e) => {
            // Skip if it's a control key
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            const char = e.key.toLowerCase();
            if (char.length !== 1) return;

            // Clear previous timeout
            if (this.typeaheadTimeout) {
                clearTimeout(this.typeaheadTimeout);
            }

            // Add to buffer
            this.typeaheadBuffer += char;

            // Find matching option
            const options = Array.from(select.options);
            const match = options.find(opt => 
                opt.text.toLowerCase().startsWith(this.typeaheadBuffer)
            );

            if (match) {
                select.value = match.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // Clear buffer after 1 second
            this.typeaheadTimeout = setTimeout(() => {
                this.typeaheadBuffer = '';
            }, 1000);
        });
    }

    // Add visual indicators for keyboard shortcuts
    addKeyboardHints() {
        const modal = document.getElementById('create-invoice-form');
        if (!modal) return;

        // Check if hints already exist
        if (modal.querySelector('.keyboard-hints')) return;

        const hintsDiv = document.createElement('div');
        hintsDiv.className = 'keyboard-hints';
        hintsDiv.innerHTML = `
            <div class="keyboard-hints-content">
                <strong>⌨️ Keyboard Shortcuts:</strong>
                <span><kbd>Tab</kbd> Navigate fields</span>
                <span><kbd>Enter</kbd> Next field / Add item</span>
                <span><kbd>Ctrl+Enter</kbd> Submit</span>
                <span><kbd>Ctrl+I</kbd> Add new item</span>
                <span><kbd>Ctrl+D</kbd> Remove item</span>
                <span><kbd>Esc</kbd> Close</span>
            </div>
        `;
        
        const modalContent = modal.querySelector('.invoice-modal-content');
        if (modalContent) {
            modalContent.insertBefore(hintsDiv, modalContent.firstChild);
        }
    }
}

// Global instance
const keyboardNav = new KeyboardNavigation();

// Auto-initialize when invoice form is shown
const originalShowCreateInvoiceForm = window.showCreateInvoiceForm;
if (originalShowCreateInvoiceForm) {
    window.showCreateInvoiceForm = function() {
        originalShowCreateInvoiceForm.apply(this, arguments);
        setTimeout(() => {
            keyboardNav.initInvoiceForm();
            keyboardNav.addKeyboardHints();
        }, 150);
    };
}
