// Authentication state
let isSignUpMode = false;

// Toggle between Sign In and Sign Up
function toggleAuthMode(event) {
    event.preventDefault();
    isSignUpMode = !isSignUpMode;
    
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const submitButton = document.getElementById('auth-submit');
    const toggleText = document.getElementById('toggle-text');
    const toggleLink = document.getElementById('toggle-link');
    const nameGroup = document.getElementById('name-group');
    const confirmPasswordGroup = document.getElementById('confirm-password-group');
    const fullNameInput = document.getElementById('fullName');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    // Clear messages
    hideMessages();
    
    if (isSignUpMode) {
        // Switch to Sign Up mode
        title.textContent = 'Create Account';
        subtitle.textContent = 'Sign up to access Simple ERP';
        submitButton.textContent = 'Sign Up';
        toggleText.textContent = 'Already have an account?';
        toggleLink.textContent = 'Sign In';
        nameGroup.style.display = 'flex';
        confirmPasswordGroup.style.display = 'flex';
        fullNameInput.required = true;
        confirmPasswordInput.required = true;
    } else {
        // Switch to Sign In mode
        title.textContent = 'Sign In';
        subtitle.textContent = 'Access your Simple ERP account';
        submitButton.textContent = 'Sign In';
        toggleText.textContent = "Don't have an account?";
        toggleLink.textContent = 'Sign Up';
        nameGroup.style.display = 'none';
        confirmPasswordGroup.style.display = 'none';
        fullNameInput.required = false;
        confirmPasswordInput.required = false;
    }
    
    // Clear form
    document.getElementById('auth-form').reset();
}

// Handle authentication (Sign In / Sign Up)
function handleAuth(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (isSignUpMode) {
        // Sign Up
        const fullName = document.getElementById('fullName').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate
        if (!fullName) {
            showError('Please enter your full name.');
            return;
        }
        
        if (password.length < 6) {
            showError('Password must be at least 6 characters long.');
            return;
        }
        
        if (password !== confirmPassword) {
            showError('Passwords do not match.');
            return;
        }
        
        // Check if user already exists
        const users = getUsers();
        if (users.find(u => u.email === email)) {
            showError('An account with this email already exists.');
            return;
        }
        
        // Create new user
        const newUser = {
            id: Date.now(),
            fullName: fullName,
            email: email,
            password: password, // In production, this should be hashed
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('erp_users', JSON.stringify(users));
        
        showSuccess('Account created successfully! Please sign in.');
        
        // Switch to sign in mode after 1.5 seconds
        setTimeout(() => {
            toggleAuthMode(event);
        }, 1500);
        
    } else {
        // Sign In
        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            showError('Invalid email or password.');
            return;
        }
        
        // Store current user session
        localStorage.setItem('erp_current_user', JSON.stringify({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            loggedInAt: new Date().toISOString()
        }));
        
        showSuccess('Sign in successful! Redirecting...');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Get all users from localStorage
function getUsers() {
    const users = localStorage.getItem('erp_users');
    return users ? JSON.parse(users) : [];
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Hide success message
    document.getElementById('success-message').style.display = 'none';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Show success message
function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    // Hide error message
    document.getElementById('error-message').style.display = 'none';
}

// Hide all messages
function hideMessages() {
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('success-message').style.display = 'none';
}

// Check if user is already logged in
function checkAuthStatus() {
    const currentUser = localStorage.getItem('erp_current_user');
    if (currentUser) {
        // User is already logged in, redirect to dashboard
        window.location.href = 'index.html';
    }
}

// Run on page load
checkAuthStatus();
