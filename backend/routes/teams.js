const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { isAuthenticated, isTeamMember, isTeamCreator } = require('../middleware/auth');

// Validation rules for creating a team
const createTeamValidation = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Team name is required and must be less than 100 characters'),
    body('description')
        .optional()
        .trim()
];

// Create a new team
router.post('/', isAuthenticated, createTeamValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;
    const userId = req.user.id;

    try {
        // Start a transaction
        await db.transaction(async (trx) => {
            // Insert the team
            const [teamId] = await trx('teams').insert({
                name,
                description: description || null,
                created_by: userId
            });

            // Add creator as a team member with 'creator' role
            await trx('team_members').insert({
                team_id: teamId,
                user_id: userId,
                role: 'creator'
            });

            // Get the created team
            const team = await trx('teams')
                .where({ id: teamId })
                .first();

            res.status(201).json({
                message: 'Team created successfully',
                team
            });
        });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ error: 'Failed to create team' });
    }
});

// Get all teams for the current user
router.get('/', isAuthenticated, async (req, res) => {
    const userId = req.user.id;

    try {
        const teams = await db('teams')
            .join('team_members', 'teams.id', 'team_members.team_id')
            .where('team_members.user_id', userId)
            .select(
                'teams.id',
                'teams.name',
                'teams.description',
                'teams.created_by',
                'teams.created_at',
                'team_members.role'
            )
            .orderBy('teams.created_at', 'desc');

        // Get member count for each team
        for (let team of teams) {
            const memberCount = await db('team_members')
                .where({ team_id: team.id })
                .count('* as count')
                .first();
            team.member_count = memberCount.count;
        }

        res.json({ teams });
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// Get team details with members
router.get('/:id', isAuthenticated, isTeamMember, async (req, res) => {
    const teamId = req.params.id;

    try {
        // Get team details
        const team = await db('teams')
            .where({ id: teamId })
            .first();

        // Get team members
        const members = await db('team_members')
            .join('users', 'team_members.user_id', 'users.id')
            .where('team_members.team_id', teamId)
            .select(
                'users.id',
                'users.username',
                'users.email',
                'team_members.role',
                'team_members.joined_at'
            );

        res.json({
            team,
            members
        });
    } catch (error) {
        console.error('Get team details error:', error);
        res.status(500).json({ error: 'Failed to fetch team details' });
    }
});

// Add member to team
router.post('/:id/members', isAuthenticated, isTeamMember, async (req, res) => {
    const teamId = req.params.id;
    const { identifier } = req.body; // Can be username or email

    if (!identifier) {
        return res.status(400).json({ error: 'Username or email is required' });
    }

    try {
        // Find user by username or email
        const user = await db('users')
            .where({ username: identifier })
            .orWhere({ email: identifier })
            .select('id', 'username', 'email')
            .first();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user is already a member
        const existingMember = await db('team_members')
            .where({ team_id: teamId, user_id: user.id })
            .first();

        if (existingMember) {
            return res.status(400).json({ error: 'User is already a team member' });
        }

        // Add user to team
        await db('team_members').insert({
            team_id: teamId,
            user_id: user.id,
            role: 'member'
        });

        res.status(201).json({
            message: 'Member added successfully',
            member: user
        });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
});

// Remove member from team (only creator can do this)
router.delete('/:id/members/:userId', isAuthenticated, isTeamCreator, async (req, res) => {
    const teamId = req.params.id;
    const userIdToRemove = req.params.userId;

    try {
        // Check if trying to remove the creator
        const memberToRemove = await db('team_members')
            .where({ team_id: teamId, user_id: userIdToRemove })
            .first();

        if (!memberToRemove) {
            return res.status(404).json({ error: 'Member not found in this team' });
        }

        if (memberToRemove.role === 'creator') {
            return res.status(400).json({ error: 'Cannot remove the team creator' });
        }

        // Remove the member
        await db('team_members')
            .where({ team_id: teamId, user_id: userIdToRemove })
            .delete();

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

module.exports = router;
