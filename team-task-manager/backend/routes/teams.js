// Team management routes
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { isAuthenticated, isTeamMember, isTeamAdmin } = require('../middleware/auth');

/**
 * GET /teams
 * Get all teams for the current user
 */
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const [teams] = await pool.query(`
      SELECT t.*, tm.role, u.username as creator_name
      FROM teams t
      INNER JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE tm.user_id = ?
      ORDER BY t.created_at DESC
    `, [req.user.id]);

        res.json({
            success: true,
            teams
        });
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching teams'
        });
    }
});

/**
 * POST /teams
 * Create a new team
 */
router.post('/', isAuthenticated, [
    body('name')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Team name must be between 3 and 100 characters'),
    body('description')
        .optional()
        .trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { name, description } = req.body;

    try {
        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Create team
            const [teamResult] = await connection.query(
                'INSERT INTO teams (name, description, created_by) VALUES (?, ?, ?)',
                [name, description || null, req.user.id]
            );

            const teamId = teamResult.insertId;

            // Add creator as owner
            await connection.query(
                'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
                [teamId, req.user.id, 'owner']
            );

            await connection.commit();
            connection.release();

            res.status(201).json({
                success: true,
                message: 'Team created successfully',
                teamId
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating team'
        });
    }
});

/**
 * GET /teams/:id
 * Get team details
 */
router.get('/:id', isAuthenticated, isTeamMember, async (req, res) => {
    try {
        const [teams] = await pool.query(`
      SELECT t.*, u.username as creator_name
      FROM teams t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ?
    `, [req.params.id]);

        if (teams.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        res.json({
            success: true,
            team: teams[0]
        });
    } catch (error) {
        console.error('Get team error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching team'
        });
    }
});

/**
 * PUT /teams/:id
 * Update team
 */
router.put('/:id', isAuthenticated, isTeamAdmin, [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Team name must be between 3 and 100 characters'),
    body('description')
        .optional()
        .trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { name, description } = req.body;

    try {
        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        values.push(req.params.id);

        await pool.query(
            `UPDATE teams SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.json({
            success: true,
            message: 'Team updated successfully'
        });
    } catch (error) {
        console.error('Update team error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating team'
        });
    }
});

/**
 * DELETE /teams/:id
 * Delete team
 */
router.delete('/:id', isAuthenticated, isTeamAdmin, async (req, res) => {
    try {
        // Check if user is owner
        if (req.teamMember.role !== 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Only team owner can delete the team'
            });
        }

        await pool.query('DELETE FROM teams WHERE id = ?', [req.params.id]);

        res.json({
            success: true,
            message: 'Team deleted successfully'
        });
    } catch (error) {
        console.error('Delete team error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting team'
        });
    }
});

/**
 * GET /teams/:id/members
 * Get team members
 */
router.get('/:id/members', isAuthenticated, isTeamMember, async (req, res) => {
    try {
        const [members] = await pool.query(`
      SELECT tm.*, u.username, u.email
      FROM team_members tm
      INNER JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
      ORDER BY tm.role, tm.joined_at
    `, [req.params.id]);

        res.json({
            success: true,
            members
        });
    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching team members'
        });
    }
});

/**
 * POST /teams/:id/members
 * Add member to team
 */
router.post('/:id/members', isAuthenticated, isTeamAdmin, [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required'),
    body('role')
        .optional()
        .isIn(['admin', 'member'])
        .withMessage('Role must be admin or member')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { username, role = 'member' } = req.body;

    try {
        // Find user by username
        const [users] = await pool.query(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const userId = users[0].id;

        // Check if already a member
        const [existing] = await pool.query(
            'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?',
            [req.params.id, userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User is already a team member'
            });
        }

        // Add member
        await pool.query(
            'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
            [req.params.id, userId, role]
        );

        res.status(201).json({
            success: true,
            message: 'Member added successfully'
        });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding team member'
        });
    }
});

/**
 * DELETE /teams/:id/members/:userId
 * Remove member from team
 */
router.delete('/:id/members/:userId', isAuthenticated, isTeamAdmin, async (req, res) => {
    try {
        const { id: teamId, userId } = req.params;

        // Check if trying to remove owner
        const [member] = await pool.query(
            'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
            [teamId, userId]
        );

        if (member.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        if (member[0].role === 'owner') {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove team owner'
            });
        }

        await pool.query(
            'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
            [teamId, userId]
        );

        res.json({
            success: true,
            message: 'Member removed successfully'
        });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing team member'
        });
    }
});

module.exports = router;
