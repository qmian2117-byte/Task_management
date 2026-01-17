// Task Management Functions

/**
 * Show create task modal
 */
function showCreateTaskModal() {
    if (teams.length === 0) {
        alert('Please create a team first before creating tasks');
        return;
    }

    const modalContent = `
    <form id="createTaskForm" class="space-y-4">
      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">
          <i class="fas fa-heading mr-2"></i>Task Title
        </label>
        <input 
          type="text" 
          name="title" 
          required
          class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter task title"
        >
      </div>
      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">
          <i class="fas fa-align-left mr-2"></i>Description (Optional)
        </label>
        <textarea 
          name="description" 
          rows="3"
          class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter task description"
        ></textarea>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">
            <i class="fas fa-users mr-2"></i>Team
          </label>
          <select 
            name="teamId" 
            id="taskTeamSelect"
            required
            class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            onchange="loadTeamMembersForTask(this.value)"
          >
            <option value="">Select a team</option>
            ${teams.map(team => `<option value="${team.id}">${team.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">
            <i class="fas fa-user mr-2"></i>Assign To (Optional)
          </label>
          <select 
            name="assignedTo"
            id="taskAssigneeSelect"
            class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Unassigned</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">
            <i class="fas fa-flag mr-2"></i>Priority
          </label>
          <select 
            name="priority"
            class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">
            <i class="fas fa-tasks mr-2"></i>Status
          </label>
          <select 
            name="status"
            class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="todo" selected>To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">
          <i class="fas fa-calendar mr-2"></i>Due Date (Optional)
        </label>
        <input 
          type="date" 
          name="dueDate"
          class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
      </div>
      <div class="flex justify-end space-x-3">
        <button type="button" onclick="closeAllModals()" class="px-6 py-2 rounded-lg bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 transition">
          Cancel
        </button>
        <button type="submit" class="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:from-blue-600 hover:to-cyan-600 transition">
          <i class="fas fa-plus mr-2"></i>Create Task
        </button>
      </div>
    </form>
  `;

    createModal('Create New Task', modalContent);

    document.getElementById('createTaskForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description'),
            teamId: parseInt(formData.get('teamId')),
            assignedTo: formData.get('assignedTo') ? parseInt(formData.get('assignedTo')) : null,
            priority: formData.get('priority'),
            status: formData.get('status'),
            dueDate: formData.get('dueDate') || null
        };

        try {
            showLoading(true);
            const response = await apiRequest('/tasks', {
                method: 'POST',
                body: JSON.stringify(taskData)
            });

            if (response.success) {
                showSuccess('Task created successfully!');
                closeAllModals();
                await refreshDashboard();
            }
        } catch (error) {
            alert(error.message || 'Failed to create task');
        } finally {
            showLoading(false);
        }
    });
}

/**
 * Load team members for task assignment
 */
async function loadTeamMembersForTask(teamId) {
    if (!teamId) {
        document.getElementById('taskAssigneeSelect').innerHTML = '<option value="">Unassigned</option>';
        return;
    }

    try {
        const response = await apiRequest(`/teams/${teamId}/members`);
        const members = response.members || [];

        const assigneeSelect = document.getElementById('taskAssigneeSelect');
        assigneeSelect.innerHTML = '<option value="">Unassigned</option>' +
            members.map(member => `<option value="${member.user_id}">${member.username}</option>`).join('');
    } catch (error) {
        console.error('Error loading team members:', error);
    }
}

/**
 * View task details
 */
async function viewTask(taskId) {
    try {
        showLoading(true);
        const response = await apiRequest(`/tasks/${taskId}`);
        const task = response.task;

        const modalContent = `
      <div class="space-y-4">
        <div class="glass-card p-4 rounded-lg">
          <h4 class="text-white font-semibold text-xl mb-3">${task.title}</h4>
          ${task.description ? `<p class="text-gray-300 mb-3">${task.description}</p>` : ''}
          
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-gray-400">Team</p>
              <p class="text-white font-medium">${task.team_name}</p>
            </div>
            <div>
              <p class="text-gray-400">Assigned To</p>
              <p class="text-white font-medium">${task.assigned_to_name || 'Unassigned'}</p>
            </div>
            <div>
              <p class="text-gray-400">Status</p>
              <span class="status-badge status-${task.status}">${formatStatus(task.status)}</span>
            </div>
            <div>
              <p class="text-gray-400">Priority</p>
              <span class="status-badge priority-${task.priority}">${formatPriority(task.priority)}</span>
            </div>
            <div>
              <p class="text-gray-400">Created By</p>
              <p class="text-white font-medium">${task.created_by_name}</p>
            </div>
            <div>
              <p class="text-gray-400">Due Date</p>
              <p class="text-white font-medium">${task.due_date ? formatDate(task.due_date) : 'No due date'}</p>
            </div>
          </div>
        </div>
        
        <div class="flex space-x-3">
          <button onclick="showEditTaskModal(${taskId})" class="flex-1 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition">
            <i class="fas fa-edit mr-2"></i>Edit Task
          </button>
          <button onclick="deleteTask(${taskId})" class="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition">
            <i class="fas fa-trash mr-2"></i>Delete Task
          </button>
        </div>
      </div>
    `;

        createModal('Task Details', modalContent);
    } catch (error) {
        alert(error.message || 'Failed to load task details');
    } finally {
        showLoading(false);
    }
}

/**
 * Show edit task modal
 */
async function showEditTaskModal(taskId) {
    try {
        showLoading(true);
        const response = await apiRequest(`/tasks/${taskId}`);
        const task = response.task;

        // Load team members
        const membersResponse = await apiRequest(`/teams/${task.team_id}/members`);
        const members = membersResponse.members || [];

        const modalContent = `
      <form id="editTaskForm" class="space-y-4">
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">Task Title</label>
          <input 
            type="text" 
            name="title" 
            value="${task.title}"
            required
            class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
        </div>
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">Description</label>
          <textarea 
            name="description" 
            rows="3"
            class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >${task.description || ''}</textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-gray-300 text-sm font-medium mb-2">Assign To</label>
            <select 
              name="assignedTo"
              class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Unassigned</option>
              ${members.map(member => `
                <option value="${member.user_id}" ${task.assigned_to == member.user_id ? 'selected' : ''}>
                  ${member.username}
                </option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="block text-gray-300 text-sm font-medium mb-2">Priority</label>
            <select 
              name="priority"
              class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
              <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
              <option value="urgent" ${task.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-gray-300 text-sm font-medium mb-2">Status</label>
            <select 
              name="status"
              class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
              <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
              <option value="review" ${task.status === 'review' ? 'selected' : ''}>Review</option>
              <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-300 text-sm font-medium mb-2">Due Date</label>
            <input 
              type="date" 
              name="dueDate"
              value="${task.due_date ? task.due_date.split('T')[0] : ''}"
              class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
          </div>
        </div>
        <div class="flex justify-end space-x-3">
          <button type="button" onclick="closeAllModals()" class="px-6 py-2 rounded-lg bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 transition">
            Cancel
          </button>
          <button type="submit" class="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:from-blue-600 hover:to-cyan-600 transition">
            <i class="fas fa-save mr-2"></i>Update Task
          </button>
        </div>
      </form>
    `;

        createModal('Edit Task', modalContent);

        document.getElementById('editTaskForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const taskData = {
                title: formData.get('title'),
                description: formData.get('description'),
                assignedTo: formData.get('assignedTo') ? parseInt(formData.get('assignedTo')) : null,
                priority: formData.get('priority'),
                status: formData.get('status'),
                dueDate: formData.get('dueDate') || null
            };

            try {
                showLoading(true);
                const response = await apiRequest(`/tasks/${taskId}`, {
                    method: 'PUT',
                    body: JSON.stringify(taskData)
                });

                if (response.success) {
                    showSuccess('Task updated successfully!');
                    closeAllModals();
                    await refreshDashboard();
                }
            } catch (error) {
                alert(error.message || 'Failed to update task');
            } finally {
                showLoading(false);
            }
        });
    } catch (error) {
        alert(error.message || 'Failed to load task');
    } finally {
        showLoading(false);
    }
}

/**
 * Delete task
 */
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    try {
        showLoading(true);
        const response = await apiRequest(`/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            showSuccess('Task deleted successfully!');
            closeAllModals();
            await refreshDashboard();
        }
    } catch (error) {
        alert(error.message || 'Failed to delete task');
    } finally {
        showLoading(false);
    }
}
