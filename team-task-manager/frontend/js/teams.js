// Team Management Functions

/**
 * Show create team modal
 */
function showCreateTeamModal() {
    const modalContent = `
    <form id="createTeamForm" class="space-y-4">
      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">
          <i class="fas fa-users mr-2"></i>Team Name
        </label>
        <input 
          type="text" 
          name="name" 
          required
          class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter team name"
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
          placeholder="Enter team description"
        ></textarea>
      </div>
      <div class="flex justify-end space-x-3">
        <button type="button" onclick="closeAllModals()" class="px-6 py-2 rounded-lg bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 transition">
          Cancel
        </button>
        <button type="submit" class="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition">
          <i class="fas fa-plus mr-2"></i>Create Team
        </button>
      </div>
    </form>
  `;

    createModal('Create New Team', modalContent);

    // Handle form submission
    document.getElementById('createTeamForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const teamData = {
            name: formData.get('name'),
            description: formData.get('description')
        };

        try {
            showLoading(true);
            const response = await apiRequest('/teams', {
                method: 'POST',
                body: JSON.stringify(teamData)
            });

            if (response.success) {
                showSuccess('Team created successfully!');
                closeAllModals();
                await refreshDashboard();
            }
        } catch (error) {
            alert(error.message || 'Failed to create team');
        } finally {
            showLoading(false);
        }
    });
}

/**
 * View team details
 */
async function viewTeam(teamId) {
    try {
        showLoading(true);
        const response = await apiRequest(`/teams/${teamId}`);
        const team = response.team;

        const modalContent = `
      <div class="space-y-4">
        <div class="glass-card p-4 rounded-lg">
          <h4 class="text-white font-semibold mb-2">Team Information</h4>
          <p class="text-gray-300"><strong>Name:</strong> ${team.name}</p>
          ${team.description ? `<p class="text-gray-300 mt-2"><strong>Description:</strong> ${team.description}</p>` : ''}
          <p class="text-gray-300 mt-2"><strong>Created:</strong> ${formatDate(team.created_at)}</p>
          <p class="text-gray-300 mt-2"><strong>Created by:</strong> ${team.creator_name}</p>
        </div>
        <div class="flex space-x-3">
          <button onclick="viewTeamMembers(${teamId})" class="flex-1 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition">
            <i class="fas fa-user-friends mr-2"></i>View Members
          </button>
          <button onclick="showAddMemberModal(${teamId})" class="flex-1 px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition">
            <i class="fas fa-user-plus mr-2"></i>Add Member
          </button>
        </div>
      </div>
    `;

        createModal(`Team: ${team.name}`, modalContent);
    } catch (error) {
        alert(error.message || 'Failed to load team details');
    } finally {
        showLoading(false);
    }
}

/**
 * View team members
 */
async function viewTeamMembers(teamId) {
    try {
        showLoading(true);
        const response = await apiRequest(`/teams/${teamId}/members`);
        const members = response.members || [];

        const modalContent = `
      <div class="space-y-3">
        ${members.length === 0 ?
                '<p class="text-gray-400 text-center py-4">No members found</p>' :
                members.map(member => `
            <div class="glass-card p-4 rounded-lg flex items-center justify-between">
              <div>
                <p class="text-white font-semibold">${member.username}</p>
                <p class="text-gray-400 text-sm">${member.email}</p>
              </div>
              <div class="flex items-center space-x-3">
                <span class="status-badge status-${member.role}">${member.role}</span>
                ${member.role !== 'owner' ? `
                  <button onclick="removeMember(${teamId}, ${member.user_id})" class="text-red-400 hover:text-red-300">
                    <i class="fas fa-trash"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')
            }
        <button onclick="showAddMemberModal(${teamId})" class="w-full px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition">
          <i class="fas fa-user-plus mr-2"></i>Add Member
        </button>
      </div>
    `;

        createModal('Team Members', modalContent);
    } catch (error) {
        alert(error.message || 'Failed to load team members');
    } finally {
        showLoading(false);
    }
}

/**
 * Show add member modal
 */
function showAddMemberModal(teamId) {
    const modalContent = `
    <form id="addMemberForm" class="space-y-4">
      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">
          <i class="fas fa-user mr-2"></i>Username
        </label>
        <input 
          type="text" 
          name="username" 
          required
          class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter username to add"
        >
      </div>
      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">
          <i class="fas fa-user-tag mr-2"></i>Role
        </label>
        <select 
          name="role"
          class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div class="flex justify-end space-x-3">
        <button type="button" onclick="closeAllModals()" class="px-6 py-2 rounded-lg bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 transition">
          Cancel
        </button>
        <button type="submit" class="px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-600 hover:to-emerald-600 transition">
          <i class="fas fa-user-plus mr-2"></i>Add Member
        </button>
      </div>
    </form>
  `;

    createModal('Add Team Member', modalContent);

    document.getElementById('addMemberForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const memberData = {
            username: formData.get('username'),
            role: formData.get('role')
        };

        try {
            showLoading(true);
            const response = await apiRequest(`/teams/${teamId}/members`, {
                method: 'POST',
                body: JSON.stringify(memberData)
            });

            if (response.success) {
                showSuccess('Member added successfully!');
                closeAllModals();
                await refreshDashboard();
            }
        } catch (error) {
            alert(error.message || 'Failed to add member');
        } finally {
            showLoading(false);
        }
    });
}

/**
 * Remove team member
 */
async function removeMember(teamId, userId) {
    if (!confirm('Are you sure you want to remove this member?')) {
        return;
    }

    try {
        showLoading(true);
        const response = await apiRequest(`/teams/${teamId}/members/${userId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            showSuccess('Member removed successfully!');
            closeAllModals();
            await refreshDashboard();
        }
    } catch (error) {
        alert(error.message || 'Failed to remove member');
    } finally {
        showLoading(false);
    }
}
