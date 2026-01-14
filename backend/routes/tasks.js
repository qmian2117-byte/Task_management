const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

// Validation rules for creating/updating a task
const taskValidation = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Task title is required and must be less than 200 characters'),
    body('description')
        .optional()
        .trim(),
    body('team_id')
        .isInt()
        .withMessage('Valid team ID is required'),
    body('assigned_to')
        .optional()
        .isInt()
        .withMessage('Assigned user must be a valid user ID'),
    body('status')
        .optional()
        .isIn(['pending', 'in_progress', 'completed'])
        .withMessage('Status must be pending, in_progress, or completed'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Priority must be low, medium, or high'),
    body('due_date')
        .optional()
        .isISO8601()
        .withMessage('Due date must be a valid date')
];

// Create a new task
router.post('/', isAuthenticated, taskValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, team_id, assigned_to, status, priority, due_date } = req.body;
    const userId = req.user.id;

    try {
        // Verify user is a member of the team
        const membership = await db('team_members')
            .where({ team_id, user_id: userId })
            .first();

        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this team' });
        }

        // If assigned_to is provided, verify they are a team member
        if (assigned_to) {
            const assigneeMembership = await db('team_members')
                .where({ team_id, user_id: assigned_to })
                .first();

            if (!assigneeMembership) {
                return res.status(400).json({ error: 'Assigned user is not a member of this team' });
            }
        }

        // Insert the task
        const [taskId] = await db('tasks').insert({
            title,
            description: description || null,
            team_id,
            assigned_to: assigned_to || null,
            created_by: userId,
            status: status || 'pending',
            priority: priority || 'medium',
            due_date: due_date || null
        });

        // Get the created task
        const task = await db('tasks')
            .where({ id: taskId })
            .first();

        res.status(201).json({
            message: 'Task created successfully',
            task
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Get tasks with optional filters
router.get('/', isAuthenticated, async (req, res) => {
    const userId = req.user.id;
    const { team_id, assigned_to, status } = req.query;

    try {
        // Start building the query
        let query = db('tasks')
            .join('team_members', 'tasks.team_id', 'team_members.team_id')
            .where('team_members.user_id', userId)
            .leftJoin('users as assignee', 'tasks.assigned_to', 'assignee.id')
            .leftJoin('users as creator', 'tasks.created_by', 'creator.id')
            .select(
                'tasks.*',
                'assignee.username as assignee_name',
                'creator.username as creator_name'
            )
            .groupBy('tasks.id')
            .orderBy('tasks.created_at', 'desc');

        // Apply filters
        if (team_id) {
            query = query.where('tasks.team_id', team_id);
        }

        if (assigned_to) {
            query = query.where('tasks.assigned_to', assigned_to);
        }

        if (status) {
            query = query.where('tasks.status', status);
        }

        const tasks = await query;

        res.json({ tasks });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Get single task details
router.get('/:id', isAuthenticated, async (req, res) => {
    const taskId = req.params.id;
    const userId = req.user.id;

    try {
        // Get task with team membership check
        const task = await db('tasks')
            .join('team_members', 'tasks.team_id', 'team_members.team_id')
            .where('tasks.id', taskId)
            .where('team_members.user_id', userId)
            .leftJoin('users as assignee', 'tasks.assigned_to', 'assignee.id')
            .leftJoin('users as creator', 'tasks.created_by', 'creator.id')
            .select(
                'tasks.*',
                'assignee.username as assignee_name',
                'creator.username as creator_name'
            )
            .first();

        if (!task) {
            return res.status(404).json({ error: 'Task not found or access denied' });
        }

        res.json({ task });
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});

// Update a task
router.put('/:id', isAuthenticated, taskValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const taskId = req.params.id;
    const userId = req.user.id;
    const { title, description, team_id, assigned_to, status, priority, due_date } = req.body;

    try {
        // Get the task and verify access
        const task = await db('tasks')
            .join('team_members', 'tasks.team_id', 'team_members.team_id')
            .where('tasks.id', taskId)
            .where('team_members.user_id', userId)
            .select('tasks.*')
            .first();

        if (!task) {
            return res.status(404).json({ error: 'Task not found or access denied' });
        }

        // If assigned_to is being changed, verify new assignee is a team member
        if (assigned_to && assigned_to !== task.assigned_to) {
            const assigneeMembership = await db('team_members')
                .where({ team_id: task.team_id, user_id: assigned_to })
                .first();

            if (!assigneeMembership) {
                return res.status(400).json({ error: 'Assigned user is not a member of this team' });
            }
        }

        // Update the task
        await db('tasks')
            .where({ id: taskId })
            .update({
                title,
                description: description || null,
                assigned_to: assigned_to || null,
                status: status || task.status,
                priority: priority || task.priority,
                due_date: due_date || null,
                updated_at: db.fn.now()
            });

        // Get updated task
        const updatedTask = await db('tasks')
            .where({ id: taskId })
            .first();

        res.json({
            message: 'Task updated successfully',
            task: updatedTask
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete a task
router.delete('/:id', isAuthenticated, async (req, res) => {
    const taskId = req.params.id;
    const userId = req.user.id;

    try {
        // Get the task
        const task = await db('tasks')
            .where({ id: taskId })
            .first();

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Check if user is the creator OR a team creator
        const isCreator = task.created_by === userId;
        const isTeamCreator = await db('team_members')
            .where({ team_id: task.team_id, user_id: userId, role: 'creator' })
            .first();

        if (!isCreator && !isTeamCreator) {
            return res.status(403).json({ error: 'Only task creator or team creator can delete this task' });
        }

        // Delete the task
        await db('tasks')
            .where({ id: taskId })
            .delete();

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

module.exports = router;
