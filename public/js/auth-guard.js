// Auth Guard - Protect pages from unauthorized access
(function() {
    // Check if user is authenticated
    function checkAuth() {
        const currentUser = localStorage.getItem('erp_current_user');
        const currentPath = window.location.pathname;
        
        // If on login page and user is logged in, redirect to dashboard
        if (currentPath.includes('login.html') && currentUser) {
            window.location.href = 'index.html';
            return;
        }
        
        // If not on login page and user is not logged in, redirect to login
        if (!currentPath.includes('login.html') && !currentUser) {
            window.location.href = 'login.html';
            return;
        }
    }
    
    // Get current user info
    function getCurrentUser() {
        const currentUser = localStorage.getItem('erp_current_user');
        return currentUser ? JSON.parse(currentUser) : null;
    }
    
    // Logout function
    function logout() {
        localStorage.removeItem('erp_current_user');
        window.location.href = 'login.html';
    }
    
    // Display user info in header if element exists
    function displayUserInfo() {
        const user = getCurrentUser();
        if (user) {
            const userInfoElement = document.getElementById('user-info');
            if (userInfoElement) {
                userInfoElement.innerHTML = `
                    <span style="margin-right: 15px;">Welcome, ${user.fullName}</span>
                    <button onclick="logout()" class="button button-small" style="padding: 5px 15px;">Logout</button>
                `;
            }
        }
    }
    
    // Make logout function globally available
    window.logout = logout;
    window.getCurrentUser = getCurrentUser;
    
    // Run auth check on page load
    checkAuth();
    
    // Display user info after DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', displayUserInfo);
    } else {
        displayUserInfo();
    }
})();
