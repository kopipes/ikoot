const express = require('express');
const { getAllQuery, getQuery, runQuery } = require('../config/database');

const router = express.Router();

// Get all users (admin only)
router.get('/', async (req, res) => {
    try {
        const users = await getAllQuery(`
            SELECT id, name, email, role, points, status, created_at,
                   (SELECT COUNT(*) FROM user_check_ins WHERE user_id = users.id) as total_check_ins
            FROM users 
            ORDER BY created_at DESC
        `);
        
        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get user stats
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await getQuery('SELECT COUNT(*) as count FROM users WHERE role = "user"');
        const newUsersToday = await getQuery(`
            SELECT COUNT(*) as count FROM users 
            WHERE role = "user" AND DATE(created_at) = DATE('now')
        `);

        res.json({
            success: true,
            stats: {
                totalUsers: totalUsers.count,
                newUsersToday: newUsersToday.count
            }
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get single user by ID (admin only)
router.get('/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await getQuery(`
            SELECT id, name, email, role, points, status, created_at,
                   (SELECT COUNT(*) FROM user_check_ins WHERE user_id = users.id) as total_check_ins
            FROM users WHERE id = ?
        `, [userId]);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update user (admin only)
router.put('/admin/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { name, email, role, status } = req.body;
        
        // Validate role
        if (role && !['admin', 'user'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be admin or user'
            });
        }
        
        // Validate status
        if (status && !['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be active or inactive'
            });
        }
        
        // Check if email already exists for other users
        if (email) {
            const existingUser = await getQuery('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }
        
        // Check if user exists
        const userExists = await getQuery('SELECT id FROM users WHERE id = ?', [userId]);
        if (!userExists) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Update the user
        await runQuery(`
            UPDATE users 
            SET name = COALESCE(?, name),
                email = COALESCE(?, email),
                role = COALESCE(?, role),
                status = COALESCE(?, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [name, email, role, status, userId]);
        
        // Get updated user
        const updatedUser = await getQuery(`
            SELECT id, name, email, role, points, status, created_at,
                   (SELECT COUNT(*) FROM user_check_ins WHERE user_id = users.id) as total_check_ins
            FROM users WHERE id = ?
        `, [userId]);
        
        res.json({
            success: true,
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
});

// Toggle user status (admin only)
router.patch('/admin/:id/toggle-status', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Check if user exists
        const user = await getQuery('SELECT id, email, status FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Don't allow deactivating the main admin
        if (user.email === 'admin@ikoot.com' && user.status === 'active') {
            return res.status(400).json({
                success: false,
                message: 'Cannot deactivate main admin account'
            });
        }
        
        // Toggle status
        const currentStatus = user.status || 'active';
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        
        await runQuery('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, userId]);
        
        // Get updated user
        const updatedUser = await getQuery(`
            SELECT id, name, email, role, points, status, created_at,
                   (SELECT COUNT(*) FROM user_check_ins WHERE user_id = users.id) as total_check_ins
            FROM users WHERE id = ?
        `, [userId]);
        
        res.json({
            success: true,
            message: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
            user: updatedUser
        });
    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle user status',
            error: error.message
        });
    }
});

// Delete user (admin only)
router.delete('/admin/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Check if user exists
        const user = await getQuery('SELECT id, email FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Don't allow deleting the main admin
        if (user.email === 'admin@ikoot.com') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete main admin account'
            });
        }
        
        // Delete user's check-ins first (foreign key constraint)
        await runQuery('DELETE FROM user_check_ins WHERE user_id = ?', [userId]);
        
        // Delete user
        await runQuery('DELETE FROM users WHERE id = ?', [userId]);
        
        res.json({
            success: true,
            message: 'User deleted successfully',
            user: user
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
});

// Get user points and check-in history
router.get('/:id/points', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Get user with points
        const user = await getQuery(`
            SELECT id, name, email, points,
                   (SELECT COUNT(*) FROM user_check_ins WHERE user_id = users.id) as total_check_ins
            FROM users WHERE id = ?
        `, [userId]);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Get check-in history
        const checkIns = await getAllQuery(`
            SELECT event_id, event_title, points_earned, checked_in_at
            FROM user_check_ins 
            WHERE user_id = ?
            ORDER BY checked_in_at DESC
        `, [userId]);
        
        res.json({
            success: true,
            user: {
                ...user,
                check_ins: checkIns
            }
        });
        
    } catch (error) {
        console.error('Get user points error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user points',
            error: error.message
        });
    }
});

// Adjust user points (admin only)
router.put('/admin/:id/adjust-points', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { adjustment, reason, admin_email } = req.body;
        
        if (!adjustment || adjustment === 0) {
            return res.status(400).json({
                success: false,
                message: 'Point adjustment amount is required and cannot be zero'
            });
        }
        
        if (!reason || reason.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Reason for point adjustment is required'
            });
        }
        
        // Verify user exists
        const user = await getQuery('SELECT id, name, email, points FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Calculate new points (prevent negative points)
        const currentPoints = user.points || 0;
        const newPoints = Math.max(0, currentPoints + adjustment);
        const actualAdjustment = newPoints - currentPoints;
        
        // Update user points
        await runQuery('UPDATE users SET points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newPoints, userId]);
        
        // Log the point adjustment for audit trail
        await runQuery(`
            INSERT INTO user_point_adjustments (
                user_id, admin_email, points_before, points_after, 
                adjustment_amount, reason, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [userId, admin_email || 'admin', currentPoints, newPoints, actualAdjustment, reason.trim()]);
        
        // Get updated user info
        const updatedUser = await getQuery(`
            SELECT id, name, email, points,
                   (SELECT COUNT(*) FROM user_check_ins WHERE user_id = users.id) as total_check_ins
            FROM users WHERE id = ?
        `, [userId]);
        
        res.json({
            success: true,
            message: `Points ${adjustment > 0 ? 'added to' : 'deducted from'} user successfully`,
            user: updatedUser,
            adjustment: {
                previous_points: currentPoints,
                adjustment_amount: actualAdjustment,
                new_points: newPoints,
                reason: reason.trim()
            }
        });
        
    } catch (error) {
        console.error('Adjust user points error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to adjust user points',
            error: error.message
        });
    }
});

// Get user point adjustment history (admin only)
router.get('/admin/:id/point-history', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Verify user exists
        const user = await getQuery('SELECT id, name FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Get point adjustment history
        const adjustments = await getAllQuery(`
            SELECT id, admin_email, points_before, points_after,
                   adjustment_amount, reason, created_at
            FROM user_point_adjustments
            WHERE user_id = ?
            ORDER BY created_at DESC
        `, [userId]);
        
        res.json({
            success: true,
            user_id: userId,
            user_name: user.name,
            adjustments: adjustments || []
        });
        
    } catch (error) {
        console.error('Get user point history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user point history',
            error: error.message
        });
    }
});

// Get user check-ins with detailed event information (admin only)
router.get('/admin/:id/checkins', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Verify user exists
        const user = await getQuery('SELECT id, name FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Get check-ins with detailed event information
        const checkIns = await getAllQuery(`
            SELECT 
                uci.event_id,
                uci.event_title,
                uci.points_earned,
                uci.checked_in_at,
                e.location,
                e.start_date as event_date,
                e.status as event_status
            FROM user_check_ins uci
            LEFT JOIN events e ON uci.event_id = e.id
            WHERE uci.user_id = ?
            ORDER BY uci.checked_in_at DESC
        `, [userId]);
        
        res.json({
            success: true,
            user_id: userId,
            user_name: user.name,
            checkins: checkIns
        });
        
    } catch (error) {
        console.error('Get user checkins error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user check-ins',
            error: error.message
        });
    }
});

module.exports = router;
