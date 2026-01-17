// Authentication middleware
const { pool } = require('../config/database');

/**
 * Check if user is authenticated
 */
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
    });
}

/**
 * Check if user is a member of a specific team
 */
async function isTeamMember(req, res, next) {
    try {
        const teamId = req.params.id || req.params.teamId;
        const userId = req.user.id;

        const [members] = await pool.query(
            'SELECT * FROM team_members WHERE team_id = ? AND user_id = ?',
            [teamId, userId]
        );

        if (members.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this team'
            });
        }

        // Attach member info to request
        req.teamMember = members[0];
        next();
    } catch (error) {
        console.error('Team membership check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking team membership'
        });
    }
}

/**
 * Check if user is team owner or admin
 */
async function isTeamAdmin(req, res, next) {
    try {
        const teamId = req.params.id || req.params.teamId;
        const userId = req.user.id;

        const [members] = await pool.query(
            'SELECT * FROM team_members WHERE team_id = ? AND user_id = ? AND role IN (?, ?)',
            [teamId, userId, 'owner', 'admin']
        );

        if (members.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You must be a team owner or admin to perform this action'
            });
        }

        req.teamMember = members[0];
        next();
    } catch (error) {
        console.error('Team admin check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking team permissions'
        });
    }
}

module.exports = {
    isAuthenticated,
    isTeamMember,
    isTeamAdmin
};
