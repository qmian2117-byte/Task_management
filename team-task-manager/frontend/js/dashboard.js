// Dashboard Logic
let currentUser = null;
let teams = [];
let tasks = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    currentUser = await checkAuth();

    if (currentUser) {
        // Show dashboard
        document.getElementById('authContainer').classList.add('hidden');
        document.getElementById('appContainer').classList.remove('hidden');

        // Display username
        document.getElementById('usernameDisplay').textContent = currentUser.username;

        // Load data
        await loadTeams();
        await loadTasks();

        // Setup event listeners
        setupDashboardListeners();
    } else {
        // Show auth forms
        document.getElementById('authContainer').classList.remove('hidden');
        document.getElementById('appContainer').classList.add('hidden');
    }
});

/**
 * Setup dashboard event listeners
 */
function setupDashboardListeners() {
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', logout);

    // Create team button
    document.getElementById('createTeamBtn')?.addEventListener('click', showCreateTeamModal);

    // Create task button
    document.getElementById('createTaskBtn')?.addEventListener('click', showCreateTaskModal);

    // Filter listeners
    document.getElementById('searchInput')?.addEventListener('input', filterTasks);
    document.getElementById('teamFilter')?.addEventListener('change', filterTasks);
    document.getElementById('statusFilter')?.addEventListener('change', filterTasks);
    document.getElementById('priorityFilter')?.addEventListener('change', filterTasks);
}

/**
 * Load teams
 */
async function loadTeams() {
    try {
        const response = await apiRequest('/teams');
        teams = response.teams || [];
        renderTeams();
        updateTeamFilter();
    } catch (error) {
        console.error('Error loading teams:', error);
    }
}

/**
 * Render teams
 */
function renderTeams() {
    const teamsList = document.getElementById('teamsList');

    if (teams.length === 0) {
        teamsList.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-users text-6xl text-gray-600 mb-4"></i>
        <p class="text-gray-400 text-lg">No teams yet. Create your first team!</p>
      </div>
    `;
        return;
    }

    teamsList.innerHTML = teams.map(team => `
    <div class="glass-card p-6 rounded-xl card-hover cursor-pointer" onclick="viewTeam(${team.id})">
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <i class="fas fa-users text-white text-xl"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-white">${team.name}</h3>
            <p class="text-sm text-gray-400">Created by ${team.creator_name || 'Unknown'}</p>
          </div>
        </div>
        <span class="status-badge status-${team.role}">${team.role}</span>
      </div>
      ${team.description ? `<p class="text-gray-300 text-sm mb-4">${team.description}</p>` : ''}
      <div class="flex items-center justify-between text-sm text-gray-400">
        <span><i class="fas fa-calendar mr-2"></i>${formatDate(team.created_at)}</span>
        <button onclick="event.stopPropagation(); viewTeamMembers(${team.id})" class="text-purple-400 hover:text-purple-300">
          <i class="fas fa-user-friends mr-1"></i>Members
        </button>
      </div>
    </div>
  `).join('');
}

/**
 * Load tasks
 */
async function loadTasks() {
    try {
        const response = await apiRequest('/tasks');
        tasks = response.tasks || [];
        renderTasks(tasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

/**
 * Render tasks
 */
function renderTasks(tasksToRender = tasks) {
    const tasksList = document.getElementById('tasksList');

    if (tasksToRender.length === 0) {
        tasksList.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-tasks text-6xl text-gray-600 mb-4"></i>
        <p class="text-gray-400 text-lg">No tasks found. Create your first task!</p>
      </div>
    `;
        return;
    }

    tasksList.innerHTML = tasksToRender.map(task => `
    <div class="glass-card p-6 rounded-xl card-hover cursor-pointer" onclick="viewTask(${task.id})">
      <div class="flex items-start justify-between mb-3">
        <h3 class="text-lg font-semibold text-white flex-1">${task.title}</h3>
        <span class="status-badge priority-${task.priority}">${formatPriority(task.priority)}</span>
      </div>
      ${task.description ? `<p class="text-gray-300 text-sm mb-4 line-clamp-2">${task.description}</p>` : ''}
      <div class="flex items-center justify-between mb-4">
        <span class="status-badge status-${task.status}">${formatStatus(task.status)}</span>
        <span class="text-sm text-gray-400">
          <i class="fas fa-users mr-1"></i>${task.team_name}
        </span>
      </div>
      <div class="flex items-center justify-between text-sm text-gray-400">
        <span>
          <i class="fas fa-user mr-1"></i>
          ${task.assigned_to_name || 'Unassigned'}
        </span>
        ${task.due_date ? `<span><i class="fas fa-calendar mr-1"></i>${formatDate(task.due_date)}</span>` : ''}
      </div>
    </div>
  `).join('');
}

/**
 * Filter tasks
 */
function filterTasks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const teamFilter = document.getElementById('teamFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;

    let filtered = tasks;

    // Search filter
    if (searchTerm) {
        filtered = filtered.filter(task =>
            task.title.toLowerCase().includes(searchTerm) ||
            (task.description && task.description.toLowerCase().includes(searchTerm))
        );
    }

    // Team filter
    if (teamFilter) {
        filtered = filtered.filter(task => task.team_id == teamFilter);
    }

    // Status filter
    if (statusFilter) {
        filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter) {
        filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    renderTasks(filtered);
}

/**
 * Update team filter dropdown
 */
function updateTeamFilter() {
    const teamFilter = document.getElementById('teamFilter');
    teamFilter.innerHTML = '<option value="">All Teams</option>' +
        teams.map(team => `<option value="${team.id}">${team.name}</option>`).join('');
}

/**
 * Refresh dashboard data
 */
async function refreshDashboard() {
    await loadTeams();
    await loadTasks();
}
