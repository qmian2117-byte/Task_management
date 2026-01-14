const db = require('../config/database');

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ error: 'Not authenticated. Please log in.' });
}

// Middleware to check if user is a member of a specific team
async function isTeamMember(req, res, next) {
    try {
        const teamId = req.params.id || req.body.team_id;
        const userId = req.user.id;

        const membership = await db('team_members')
            .where({ team_id: teamId, user_id: userId })
            .first();

        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this team' });
        }

        // Attach membership info to request for later use
        req.teamMembership = membership;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Error checking team membership' });
    }
}

// Middleware to check if user is the creator of a team
async function isTeamCreator(req, res, next) {
    try {
        const teamId = req.params.id;
        const userId = req.user.id;

        const membership = await db('team_members')
            .where({ team_id: teamId, user_id: userId, role: 'creator' })
            .first();

        if (!membership) {
            return res.status(403).json({ error: 'Only team creators can perform this action' });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: 'Error checking team creator status' });
    }
}

module.exports = {
    isAuthenticated,
    isTeamMember,
    isTeamCreator
};
