// API Base URL
const API_URL = 'http://localhost:5000/api';

// Application State
let currentUser = null;
let teams = [];
let tasks = [];
let allTeamMembers = {};
let selectedTeamId = null;

// Initialize app on page load
document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
});

// API Helper Function
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Authentication Functions
async function checkAuth() {
    try {
        const data = await apiCall('/auth/me');
        currentUser = data.user;
        showDashboard();
    } catch (error) {
        showAuthSection();
    }
}

function toggleAuthForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    loginForm.classList.toggle('hidden');
    registerForm.classList.toggle('hidden');

    // Clear error message
    hideError();
}

async function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showAuthError('Please enter both username and password');
        return;
    }

    try {
        const data = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        currentUser = data.user;
        showSuccess('Login successful!');
        showDashboard();
    } catch (error) {
        showAuthError(error.message || 'Login failed');
    }
}

async function handleRegister() {
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

    // Client-side validation
    if (!username || !email || !password) {
        showAuthError('All fields are required');
        return;
    }

    if (username.length < 3) {
        showAuthError('Username must be at least 3 characters');
        return;
    }

    if (password.length < 6) {
        showAuthError('Password must be at least 6 characters');
        return;
    }

    if (password !== passwordConfirm) {
        showAuthError('Passwords do not match');
        return;
    }

    try {
        const data = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });

        currentUser = data.user;
        showSuccess('Registration successful!');
        showDashboard();
    } catch (error) {
        showAuthError(error.message || 'Registration failed');
    }
}

async function handleLogout() {
    try {
        await apiCall('/auth/logout', { method: 'POST' });
        currentUser = null;
        teams = [];
        tasks = [];
        showSuccess('Logged out successfully');
        showAuthSection();
    } catch (error) {
        showError('Logout failed');
    }
}

// UI Functions
function showAuthSection() {
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');

    // Clear form fields
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('registerUsername').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerPasswordConfirm').value = '';
}

function showDashboard() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
    document.getElementById('currentUsername').textContent = currentUser.username;

    // Load data
    loadTeams();
    loadTasks();
}

// Team Functions
async function loadTeams() {
    try {
        const data = await apiCall('/teams');
        teams = data.teams;
        renderTeams();
        updateTeamFilters();
    } catch (error) {
        showError('Failed to load teams');
    }
}

function renderTeams() {
    const teamsList = document.getElementById('teamsList');

    if (teams.length === 0) {
        teamsList.innerHTML = '<p class="text-gray-500 text-sm">No teams yet. Create one to get started!</p>';
        return;
    }

    teamsList.innerHTML = teams.map(team => `
        <div class="team-card p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer ${selectedTeamId === team.id ? 'bg-indigo-50 border-indigo-500' : ''}"
             onclick="selectTeam(${team.id})">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h3 class="font-semibold text-gray-900">${escapeHtml(team.name)}</h3>
                    ${team.description ? `<p class="text-sm text-gray-600 mt-1">${escapeHtml(team.description)}</p>` : ''}
                    <p class="text-xs text-gray-500 mt-1">${team.member_count} member${team.member_count !== 1 ? 's' : ''}</p>
                </div>
                ${team.role === 'creator' ? '<span class="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">Creator</span>' : ''}
            </div>
            ${team.role === 'creator' ? `
                <button onclick="event.stopPropagation(); showAddMemberModal(${team.id})" 
                        class="mt-2 text-xs text-indigo-600 hover:text-indigo-800">
                    + Add Member
                </button>
            ` : ''}
        </div>
    `).join('');
}

function selectTeam(teamId) {
    selectedTeamId = selectedTeamId === teamId ? null : teamId;
    renderTeams();
    applyFilters();
}

function showCreateTeamModal() {
    document.getElementById('createTeamModal').classList.remove('hidden');
    document.getElementById('teamName').value = '';
    document.getElementById('teamDescription').value = '';
}

async function createTeam() {
    const name = document.getElementById('teamName').value.trim();
    const description = document.getElementById('teamDescription').value.trim();

    if (!name) {
        showError('Team name is required');
        return;
    }

    try {
        await apiCall('/teams', {
            method: 'POST',
            body: JSON.stringify({ name, description })
        });

        showSuccess('Team created successfully!');
        closeModal('createTeamModal');
        loadTeams();
    } catch (error) {
        showError(error.message || 'Failed to create team');
    }
}

function showAddMemberModal(teamId) {
    document.getElementById('addMemberTeamId').value = teamId;
    document.getElementById('memberIdentifier').value = '';
    document.getElementById('addMemberModal').classList.remove('hidden');
}

async function addTeamMember() {
    const teamId = document.getElementById('addMemberTeamId').value;
    const identifier = document.getElementById('memberIdentifier').value.trim();

    if (!identifier) {
        showError('Please enter a username or email');
        return;
    }

    try {
        await apiCall(`/teams/${teamId}/members`, {
            method: 'POST',
            body: JSON.stringify({ identifier })
        });

        showSuccess('Member added successfully!');
        closeModal('addMemberModal');
        loadTeams();
    } catch (error) {
        showError(error.message || 'Failed to add member');
    }
}

// Task Functions
async function loadTasks() {
    try {
        const data = await apiCall('/tasks');
        tasks = data.tasks;
        renderTasks();
        updateAssigneeFilter();
        checkDueDateReminders();
    } catch (error) {
        showError('Failed to load tasks');
    }
}

function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    let filteredTasks = getFilteredTasks();

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<p class="text-gray-500 text-sm">No tasks found. Create one to get started!</p>';
        return;
    }

    tasksList.innerHTML = filteredTasks.map(task => `
        <div class="task-card p-4 border border-gray-200 rounded-md hover:shadow-md">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h3 class="font-semibold text-gray-900">${escapeHtml(task.title)}</h3>
                    ${task.description ? `<p class="text-sm text-gray-600 mt-1">${escapeHtml(task.description)}</p>` : ''}
                    
                    <div class="flex flex-wrap gap-2 mt-2">
                        <span class="status-badge status-${task.status}">${formatStatus(task.status)}</span>
                        <span class="text-xs priority-${task.priority}">● ${capitalize(task.priority)} Priority</span>
                        ${task.assignee_name ? `<span class="text-xs text-gray-600">👤 ${escapeHtml(task.assignee_name)}</span>` : '<span class="text-xs text-gray-400">Unassigned</span>'}
                        ${task.due_date ? `<span class="text-xs text-gray-600">📅 ${formatDate(task.due_date)}</span>` : ''}
                    </div>
                </div>
                
                <div class="flex gap-2 ml-4">
                    <button onclick="editTask(${task.id})" 
                            class="text-indigo-600 hover:text-indigo-800 text-sm">
                        Edit
                    </button>
                    <button onclick="deleteTask(${task.id})" 
                            class="text-red-600 hover:text-red-800 text-sm">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function getFilteredTasks() {
    let filtered = tasks;

    // Filter by selected team
    if (selectedTeamId) {
        filtered = filtered.filter(task => task.team_id === selectedTeamId);
    }

    // Filter by team dropdown
    const teamFilter = document.getElementById('teamFilter').value;
    if (teamFilter) {
        filtered = filtered.filter(task => task.team_id == teamFilter);
    }

    // Filter by status
    const statusFilter = document.getElementById('statusFilter').value;
    if (statusFilter) {
        filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Filter by assignee
    const assigneeFilter = document.getElementById('assigneeFilter').value;
    if (assigneeFilter) {
        filtered = filtered.filter(task => task.assigned_to == assigneeFilter);
    }

    // Search by title
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(task =>
            task.title.toLowerCase().includes(searchTerm) ||
            (task.description && task.description.toLowerCase().includes(searchTerm))
        );
    }

    return filtered;
}

function applyFilters() {
    renderTasks();
}

function showCreateTaskModal() {
    document.getElementById('taskModalTitle').textContent = 'Create New Task';
    document.getElementById('editTaskId').value = '';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskTeam').value = '';
    document.getElementById('taskAssignee').value = '';
    document.getElementById('taskStatus').value = 'pending';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskDueDate').value = '';

    updateTaskTeamDropdown();
    document.getElementById('taskModal').classList.remove('hidden');
}

async function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('taskModalTitle').textContent = 'Edit Task';
    document.getElementById('editTaskId').value = taskId;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskTeam').value = task.team_id;
    document.getElementById('taskStatus').value = task.status;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskDueDate').value = task.due_date || '';

    updateTaskTeamDropdown();
    await loadTeamMembersForTask(task.team_id);
    document.getElementById('taskAssignee').value = task.assigned_to || '';

    document.getElementById('taskModal').classList.remove('hidden');
}

async function saveTask() {
    const taskId = document.getElementById('editTaskId').value;
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const team_id = document.getElementById('taskTeam').value;
    const assigned_to = document.getElementById('taskAssignee').value;
    const status = document.getElementById('taskStatus').value;
    const priority = document.getElementById('taskPriority').value;
    const due_date = document.getElementById('taskDueDate').value;

    if (!title) {
        showError('Task title is required');
        return;
    }

    if (!team_id) {
        showError('Please select a team');
        return;
    }

    const taskData = {
        title,
        description,
        team_id: parseInt(team_id),
        assigned_to: assigned_to ? parseInt(assigned_to) : null,
        status,
        priority,
        due_date: due_date || null
    };

    try {
        if (taskId) {
            // Update existing task
            await apiCall(`/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify(taskData)
            });
            showSuccess('Task updated successfully!');
        } else {
            // Create new task
            await apiCall('/tasks', {
                method: 'POST',
                body: JSON.stringify(taskData)
            });
            showSuccess('Task created successfully!');
        }

        closeModal('taskModal');
        loadTasks();
    } catch (error) {
        showError(error.message || 'Failed to save task');
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    try {
        await apiCall(`/tasks/${taskId}`, { method: 'DELETE' });
        showSuccess('Task deleted successfully!');
        loadTasks();
    } catch (error) {
        showError(error.message || 'Failed to delete task');
    }
}

// Helper Functions
function updateTaskTeamDropdown() {
    const teamSelect = document.getElementById('taskTeam');
    teamSelect.innerHTML = '<option value="">Select Team</option>' +
        teams.map(team => `<option value="${team.id}">${escapeHtml(team.name)}</option>`).join('');

    // Add event listener to load team members when team is selected
    teamSelect.onchange = function () {
        const teamId = this.value;
        if (teamId) {
            loadTeamMembersForTask(teamId);
        } else {
            document.getElementById('taskAssignee').innerHTML = '<option value="">Unassigned</option>';
        }
    };
}

async function loadTeamMembersForTask(teamId) {
    try {
        const data = await apiCall(`/teams/${teamId}`);
        const assigneeSelect = document.getElementById('taskAssignee');
        assigneeSelect.innerHTML = '<option value="">Unassigned</option>' +
            data.members.map(member =>
                `<option value="${member.id}">${escapeHtml(member.username)}</option>`
            ).join('');
    } catch (error) {
        console.error('Failed to load team members:', error);
    }
}

function updateTeamFilters() {
    const teamFilter = document.getElementById('teamFilter');
    teamFilter.innerHTML = '<option value="">All Teams</option>' +
        teams.map(team => `<option value="${team.id}">${escapeHtml(team.name)}</option>`).join('');
}

function updateAssigneeFilter() {
    const assignees = new Map();
    tasks.forEach(task => {
        if (task.assigned_to && task.assignee_name) {
            assignees.set(task.assigned_to, task.assignee_name);
        }
    });

    const assigneeFilter = document.getElementById('assigneeFilter');
    assigneeFilter.innerHTML = '<option value="">All Assignees</option>' +
        Array.from(assignees.entries())
            .map(([id, name]) => `<option value="${id}">${escapeHtml(name)}</option>`)
            .join('');
}

function checkDueDateReminders() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const upcomingTasks = tasks.filter(task => {
        if (!task.due_date || task.status === 'completed') return false;
        const dueDate = new Date(task.due_date);
        return dueDate <= tomorrow && dueDate >= today;
    });

    if (upcomingTasks.length > 0) {
        const reminderDiv = document.getElementById('dueDateReminder');
        const reminderText = document.getElementById('reminderText');
        reminderText.textContent = `You have ${upcomingTasks.length} task${upcomingTasks.length > 1 ? 's' : ''} due within 24 hours!`;
        reminderDiv.classList.remove('hidden');
    }
}

// Modal Functions
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Notification Functions
function showAuthError(message) {
    const errorDiv = document.getElementById('authError');
    const errorText = document.getElementById('authErrorText');
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('authError').classList.add('hidden');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');

    notificationText.textContent = message;
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-md shadow-lg z-50 ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
    notification.classList.remove('hidden');

    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatStatus(status) {
    return status.split('_').map(capitalize).join(' ');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Close modals when clicking outside
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.add('hidden');
    }
}

// Handle Enter key in forms
document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement.id === 'loginUsername' || activeElement.id === 'loginPassword') {
            handleLogin();
        }
    }
});
