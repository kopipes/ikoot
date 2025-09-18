const express = require('express');
const { getAllQuery, getQuery } = require('../config/database');

const router = express.Router();

// Get dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const totalEvents = await getQuery('SELECT COUNT(*) as count FROM events');
        const totalUsers = await getQuery('SELECT COUNT(*) as count FROM users WHERE role = "user"');
        const totalBookings = await getQuery('SELECT COUNT(*) as count FROM bookings');
        const totalRevenue = await getQuery('SELECT SUM(total_price) as total FROM bookings WHERE payment_status = "completed"');

        const recentEvents = await getAllQuery('SELECT * FROM events ORDER BY created_at DESC LIMIT 5');
        const recentBookings = await getAllQuery(`
            SELECT b.*, u.name as user_name, e.title as event_title 
            FROM bookings b 
            LEFT JOIN users u ON b.user_id = u.id 
            LEFT JOIN events e ON b.event_id = e.id 
            ORDER BY b.created_at DESC LIMIT 5
        `);

        res.json({
            success: true,
            stats: {
                totalEvents: totalEvents.count,
                totalUsers: totalUsers.count,
                totalBookings: totalBookings.count,
                totalRevenue: totalRevenue.total || 0
            },
            recentEvents,
            recentBookings
        });
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;