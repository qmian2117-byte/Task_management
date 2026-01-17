// Task management routes
const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { isAuthenticated, isTeamMember } = require('../middleware/auth');

/**
 * GET /tasks
 * Get tasks with optional filters
 */
router.get('/', isAuthenticated, [
    query('teamId').optional().isInt().withMessage('Team ID must be an integer'),
    query('assignedTo').optional().isInt().withMessage('Assigned to must be an integer'),
    query('status').optional().isIn(['todo', 'in_progress', 'review', 'completed']),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { teamId, assignedTo, status, priority, search } = req.query;

    try {
        let query = `
      SELECT t.*, 
             team.name as team_name,
             creator.username as created_by_name,
             assignee.username as assigned_to_name
      FROM tasks t
      INNER JOIN teams team ON t.team_id = team.id
      INNER JOIN team_members tm ON team.id = tm.team_id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE tm.user_id = ?
    `;

        const params = [req.user.id];

        if (teamId) {
            query += ' AND t.team_id = ?';
            params.push(teamId);
        }

        if (assignedTo) {
            query += ' AND t.assigned_to = ?';
            params.push(assignedTo);
        }

        if (status) {
            query += ' AND t.status = ?';
            params.push(status);
        }

        if (priority) {
            query += ' AND t.priority = ?';
            params.push(priority);
        }

        if (search) {
            query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        query += ' GROUP BY t.id ORDER BY t.created_at DESC';

        const [tasks] = await pool.query(query, params);

        res.json({
            success: true,
            tasks
        });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tasks'
        });
    }
});

/**
 * POST /tasks
 * Create a new task
 */
router.post('/', isAuthenticated, [
    body('title')
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    body('description')
        .optional()
        .trim(),
    body('teamId')
        .isInt()
        .withMessage('Team ID is required'),
    body('assignedTo')
        .optional()
        .isInt()
        .withMessage('Assigned to must be a valid user ID'),
    body('status')
        .optional()
        .isIn(['todo', 'in_progress', 'review', 'completed'])
        .withMessage('Invalid status'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Invalid priority'),
    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { title, description, teamId, assignedTo, status, priority, dueDate } = req.body;

    try {
        // Verify user is team member
        const [membership] = await pool.query(
            'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?',
            [teamId, req.user.id]
        );

        if (membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this team'
            });
        }

        // If assignedTo is provided, verify they are team member
        if (assignedTo) {
            const [assigneeMembership] = await pool.query(
                'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?',
                [teamId, assignedTo]
            );

            if (assigneeMembership.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Assigned user is not a member of this team'
                });
            }
        }

        // Create task
        const [result] = await pool.query(
            `INSERT INTO tasks (title, description, team_id, assigned_to, created_by, status, priority, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title,
                description || null,
                teamId,
                assignedTo || null,
                req.user.id,
                status || 'todo',
                priority || 'medium',
                dueDate || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            taskId: result.insertId
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating task'
        });
    }
});

/**
 * GET /tasks/:id
 * Get task details
 */
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const [tasks] = await pool.query(`
      SELECT t.*, 
             team.name as team_name,
             creator.username as created_by_name,
             assignee.username as assigned_to_name
      FROM tasks t
      INNER JOIN teams team ON t.team_id = team.id
      INNER JOIN team_members tm ON team.id = tm.team_id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.id = ? AND tm.user_id = ?
    `, [req.params.id, req.user.id]);

        if (tasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.json({
            success: true,
            task: tasks[0]
        });
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching task'
        });
    }
});

/**
 * PUT /tasks/:id
 * Update task
 */
router.put('/:id', isAuthenticated, [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    body('description')
        .optional()
        .trim(),
    body('assignedTo')
        .optional()
        .isInt()
        .withMessage('Assigned to must be a valid user ID'),
    body('status')
        .optional()
        .isIn(['todo', 'in_progress', 'review', 'completed'])
        .withMessage('Invalid status'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Invalid priority'),
    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        // Verify task exists and user has access
        const [tasks] = await pool.query(`
      SELECT t.team_id
      FROM tasks t
      INNER JOIN team_members tm ON t.team_id = tm.team_id
      WHERE t.id = ? AND tm.user_id = ?
    `, [req.params.id, req.user.id]);

        if (tasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const { title, description, assignedTo, status, priority, dueDate } = req.body;

        // If assignedTo is provided, verify they are team member
        if (assignedTo !== undefined) {
            const [assigneeMembership] = await pool.query(
                'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?',
                [tasks[0].team_id, assignedTo]
            );

            if (assignedTo !== null && assigneeMembership.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Assigned user is not a member of this team'
                });
            }
        }

        const updates = [];
        const values = [];

        if (title !== undefined) {
            updates.push('title = ?');
            values.push(title);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (assignedTo !== undefined) {
            updates.push('assigned_to = ?');
            values.push(assignedTo);
        }
        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }
        if (priority !== undefined) {
            updates.push('priority = ?');
            values.push(priority);
        }
        if (dueDate !== undefined) {
            updates.push('due_date = ?');
            values.push(dueDate);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        values.push(req.params.id);

        await pool.query(
            `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.json({
            success: true,
            message: 'Task updated successfully'
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating task'
        });
    }
});

/**
 * DELETE /tasks/:id
 * Delete task
 */
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        // Verify task exists and user has access
        const [tasks] = await pool.query(`
      SELECT t.id
      FROM tasks t
      INNER JOIN team_members tm ON t.team_id = tm.team_id
      WHERE t.id = ? AND tm.user_id = ?
    `, [req.params.id, req.user.id]);

        if (tasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);

        res.json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting task'
        });
    }
});

/**
 * PATCH /tasks/:id/status
 * Update task status
 */
router.patch('/:id/status', isAuthenticated, [
    body('status')
        .isIn(['todo', 'in_progress', 'review', 'completed'])
        .withMessage('Invalid status')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        // Verify task exists and user has access
        const [tasks] = await pool.query(`
      SELECT t.id
      FROM tasks t
      INNER JOIN team_members tm ON t.team_id = tm.team_id
      WHERE t.id = ? AND tm.user_id = ?
    `, [req.params.id, req.user.id]);

        if (tasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        await pool.query(
            'UPDATE tasks SET status = ? WHERE id = ?',
            [req.body.status, req.params.id]
        );

        res.json({
            success: true,
            message: 'Task status updated successfully'
        });
    } catch (error) {
        console.error('Update task status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating task status'
        });
    }
});

module.exports = router;
