// Authentication UI Logic
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    const loginFormElement = document.getElementById('loginFormElement');
    const registerFormElement = document.getElementById('registerFormElement');

    // Toggle between login and register forms
    showRegisterLink?.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });

    showLoginLink?.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    // Handle login
    loginFormElement?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            showLoading(true);
            const response = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });

            if (response.success) {
                showSuccess('Login successful!');
                // Store user info
                localStorage.setItem('user', JSON.stringify(response.user));
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        } catch (error) {
            showError('loginError', error.message || 'Login failed. Please try again.');
        } finally {
            showLoading(false);
        }
    });

    // Handle registration
    registerFormElement?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password')
        };

        // Basic validation
        if (userData.password.length < 6) {
            showError('registerError', 'Password must be at least 6 characters long');
            return;
        }

        try {
            showLoading(true);
            const response = await apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            if (response.success) {
                showSuccess('Registration successful! Please log in.');
                // Switch to login form
                registerForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
                registerFormElement.reset();
            }
        } catch (error) {
            const errorMessage = error.message || 'Registration failed. Please try again.';
            showError('registerError', errorMessage);
        } finally {
            showLoading(false);
        }
    });
});

/**
 * Check if user is authenticated
 */
async function checkAuth() {
    try {
        const response = await apiRequest('/auth/me');
        return response.success ? response.user : null;
    } catch (error) {
        return null;
    }
}

/**
 * Logout user
 */
async function logout() {
    try {
        showLoading(true);
        await apiRequest('/auth/logout', {
            method: 'POST'
        });
        localStorage.removeItem('user');
        window.location.reload();
    } catch (error) {
        console.error('Logout error:', error);
        // Force logout even if API fails
        localStorage.removeItem('user');
        window.location.reload();
    } finally {
        showLoading(false);
    }
}
