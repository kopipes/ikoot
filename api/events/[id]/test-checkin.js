// Test check-in endpoint with immediate fallback data for QR scanner testing
module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed. Use POST for check-in.'
        });
    }
    
    try {
        // Get event ID from URL parameter
        const eventId = parseInt(req.query.id);
        const { user_email } = req.body;

        console.log(`🎯 TEST Check-in attempt: Event ${eventId}, User: ${user_email}`);
        
        // Test event data
        const testEvents = {
            1: { id: 1, title: 'Jakarta Music Festival 2024', location: 'GBK Senayan, Jakarta' },
            2: { id: 2, title: 'Tech Summit Jakarta', location: 'Jakarta Convention Center' },
            3: { id: 3, title: 'Food & Culture Festival', location: 'Monas Park, Central Jakarta' },
            4: { id: 4, title: 'Sports & Wellness Expo', location: 'Jakarta International Expo' },
            5: { id: 5, title: 'Gaming Championship', location: 'Senayan City Mall' }
        };
        
        const event = testEvents[eventId];
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found. Valid test event IDs: 1, 2, 3, 4, 5',
                available_events: Object.values(testEvents).map(e => ({
                    id: e.id,
                    title: e.title,
                    qr_code: `IKOOT_EVENT:${e.id}`
                }))
            });
        }
        
        if (!user_email) {
            return res.status(400).json({
                success: false,
                message: 'User email is required'
            });
        }
        
        // Create test user
        const testUser = {
            id: Math.floor(Math.random() * 10000),
            name: user_email.split('@')[0],
            email: user_email,
            points: Math.floor(Math.random() * 50) // Random starting points for testing
        };
        
        // Award points for check-in
        const pointsEarned = 5;
        const updatedUser = {
            ...testUser,
            points: testUser.points + pointsEarned
        };
        
        console.log(`🎉 TEST Check-in successful: ${user_email} got ${pointsEarned} points for ${event.title}`);
        
        res.json({
            success: true,
            message: `Check-in successful! You earned ${pointsEarned} points!`,
            points_earned: pointsEarned,
            total_points: updatedUser.points,
            event: {
                id: event.id,
                title: event.title,
                location: event.location
            },
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                points: updatedUser.points
            },
            system_info: {
                mode: 'TEST_MODE',
                database_status: 'test_data_only',
                note: 'This is test data for QR scanner verification. Points are not persisted.',
                timestamp: new Date().toISOString(),
                qr_format_confirmed: `IKOOT_EVENT:${eventId}`
            }
        });
        
    } catch (error) {
        console.error('❌ TEST Check-in error:', error);
        res.status(500).json({
            success: false,
            message: 'Test check-in failed',
            error: error.message,
            mode: 'TEST_MODE'
        });
    }
};