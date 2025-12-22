// Loading state management utilities

const LoadingState = {
    // Show full-screen loading overlay
    showOverlay(message = 'Loading...') {
        // Remove existing overlay if any
        this.hideOverlay();
        
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        document.body.appendChild(overlay);
    },
    
    // Hide full-screen loading overlay
    hideOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    },
    
    // Show loading in a table
    showTableLoading(tableBodyId, colspan = 7) {
        const tbody = document.getElementById(tableBodyId);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${colspan}" class="table-loading">
                        <div class="table-loading-spinner"></div>
                        Loading data...
                    </td>
                </tr>
            `;
        }
    },
    
    // Show loading skeleton in a list
    showListLoading(containerId, itemCount = 5) {
        const container = document.getElementById(containerId);
        if (container) {
            let skeletonHTML = '';
            for (let i = 0; i < itemCount; i++) {
                skeletonHTML += `
                    <div class="skeleton-item" style="padding: 15px; margin-bottom: 10px;">
                        <div class="skeleton-text long"></div>
                        <div class="skeleton-text short"></div>
                    </div>
                `;
            }
            container.innerHTML = skeletonHTML;
        }
    },
    
    // Add loading state to a button
    setButtonLoading(buttonElement, isLoading) {
        if (isLoading) {
            buttonElement.classList.add('loading');
            buttonElement.disabled = true;
        } else {
            buttonElement.classList.remove('loading');
            buttonElement.disabled = false;
        }
    },
    
    // Simulate async operation (for localStorage operations)
    async simulateAsync(callback, minDelay = 300) {
        const startTime = Date.now();
        const result = callback();
        const elapsed = Date.now() - startTime;
        
        if (elapsed < minDelay) {
            await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
        }
        
        return result;
    }
};

// Make globally available
window.LoadingState = LoadingState;

console.log('Loading state utilities loaded');
