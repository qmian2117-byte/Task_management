// API Helper Functions
const API_BASE_URL = '/api';

/**
 * Make API request with error handling
 */
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include' // Include cookies for session
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Show error message
 */
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        setTimeout(() => {
            errorElement.classList.add('hidden');
        }, 5000);
    }
}

/**
 * Show success message
 */
function showSuccess(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 success-message z-50 fade-in';
    toast.innerHTML = `
    <div class="flex items-center space-x-2">
      <i class="fas fa-check-circle"></i>
      <span>${message}</span>
    </div>
  `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * Show loading state
 */
function showLoading(show = true) {
    let loader = document.getElementById('globalLoader');

    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'globalLoader';
            loader.className = 'fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50';
            loader.innerHTML = '<div class="spinner"></div>';
            document.body.appendChild(loader);
        }
    } else {
        if (loader) {
            loader.remove();
        }
    }
}

/**
 * Format date
 */
function formatDate(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format status for display
 */
function formatStatus(status) {
    const statusMap = {
        'todo': 'To Do',
        'in_progress': 'In Progress',
        'review': 'Review',
        'completed': 'Completed'
    };
    return statusMap[status] || status;
}

/**
 * Format priority for display
 */
function formatPriority(priority) {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
}

/**
 * Create modal
 */
function createModal(title, content, onClose) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
    <div class="glass-card w-full max-w-2xl p-6 rounded-2xl shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-2xl font-bold text-white">${title}</h3>
        <button class="close-modal text-gray-400 hover:text-white text-2xl">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-content">
        ${content}
      </div>
    </div>
  `;

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            if (onClose) onClose();
        }
    });

    // Close on button click
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
        if (onClose) onClose();
    });

    document.getElementById('modalContainer').appendChild(modal);
    return modal;
}

/**
 * Close all modals
 */
function closeAllModals() {
    const modalContainer = document.getElementById('modalContainer');
    modalContainer.innerHTML = '';
}
