// Brand new check-in endpoint v3 - bypasses Vercel caching
module.exports = async (req, res) => {
    console.log('🚀 NEW CHECKIN-V3 ENDPOINT CALLED - CACHE BYPASS SUCCESS!');
    
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

        console.log(`🎯 CHECKIN-V3: Event ${eventId}, User: ${user_email}`);
        
        // Hardcoded event data (no database required)
        const eventData = {
            1: { id: 1, title: 'Jakarta Music Festival 2024', location: 'GBK Senayan, Jakarta' },
            2: { id: 2, title: 'Tech Summit Jakarta', location: 'Jakarta Convention Center' },
            3: { id: 3, title: 'Food & Culture Festival', location: 'Monas Park, Central Jakarta' },
            4: { id: 4, title: 'Sports & Wellness Expo', location: 'Jakarta International Expo' },
            5: { id: 5, title: 'Gaming Championship', location: 'Senayan City Mall' }
        };
        
        const event = eventData[eventId];
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: `Event ID ${eventId} not found. Valid IDs: 1, 2, 3, 4, 5`,
                available_events: Object.values(eventData).map(e => ({
                    id: e.id,
                    title: e.title,
                    qr_code: `IKOOT_EVENT:${e.id}`
                })),
                endpoint: 'checkin-v3',
                timestamp: new Date().toISOString()
            });
        }
        
        if (!user_email) {
            return res.status(400).json({
                success: false,
                message: 'User email is required for check-in'
            });
        }
        
        // Create user data for the session
        const userData = {
            id: Math.floor(Math.random() * 10000),
            name: user_email.split('@')[0],
            email: user_email,
            points: Math.floor(Math.random() * 100) // Starting points
        };
        
        // Award check-in points
        const pointsEarned = 5;
        const finalPoints = userData.points + pointsEarned;
        
        console.log(`✅ V3 SUCCESS: ${user_email} earned ${pointsEarned} points for ${event.title}`);
        
        return res.status(200).json({
            success: true,
            message: `Check-in successful! You earned ${pointsEarned} points!`,
            points_earned: pointsEarned,
            total_points: finalPoints,
            event: {
                id: event.id,
                title: event.title,
                location: event.location
            },
            user: {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                points: finalPoints
            },
            system_info: {
                endpoint_version: 'v3',
                cache_bypass: 'SUCCESS',
                mode: 'HARDCODED_DATA',
                database_status: 'bypassed_for_testing',
                timestamp: new Date().toISOString(),
                deployment_test: 'WORKING'
            }
        });
        
    } catch (error) {
        console.error('❌ V3 Check-in error:', error);
        return res.status(500).json({
            success: false,
            message: 'Check-in failed',
            error: error.message,
            endpoint_version: 'v3',
            timestamp: new Date().toISOString()
        });
    }
};