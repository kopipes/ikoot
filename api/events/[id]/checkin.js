// Event Check-in API - No database required
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed - use POST'
        });
    }
    
    try {
        console.log('🎯 Event Check-in API called');
        console.log('Params:', req.query);
        console.log('Body:', req.body);
        
        const eventId = req.query.id;
        const { user_email } = req.body;
        
        if (!eventId || !user_email) {
            return res.status(400).json({
                success: false,
                message: 'Event ID and user_email are required'
            });
        }
        
        // Event data map matching the real events (IDs 19-26)
        const eventMap = {
            19: { title: 'Jakarta Music Festival 2024', location: 'GBK Senayan, Jakarta' },
            20: { title: 'Tech Summit Jakarta', location: 'Jakarta Convention Center' },
            21: { title: 'Food & Culture Festival', location: 'Monas Park, Central Jakarta' },
            22: { title: 'Startup Pitch Competition', location: 'Cyber 2 Tower, Jakarta' },
            23: { title: 'Art & Design Exhibition', location: 'National Gallery, Jakarta' },
            24: { title: 'Sports & Wellness Expo', location: 'Jakarta International Expo' },
            25: { title: 'Photography Workshop', location: 'Creative Hub Jakarta' },
            26: { title: 'Gaming Championship', location: 'Senayan City Mall' }
        };
        
        const event = eventMap[eventId];
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: `Event ${eventId} not found. Available events: ${Object.keys(eventMap).join(', ')}`,
                availableEvents: Object.keys(eventMap)
            });
        }
        
        // Generate user data based on email
        const userName = user_email.split('@')[0];
        const userId = Math.abs(user_email.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0));
        
        // Simulate successful check-in
        const result = {
            success: true,
            message: `Successfully checked in to ${event.title}! You earned 5 points!`,
            points_earned: 5,
            total_points: Math.floor(Math.random() * 50) + 5, // Random total between 5-55
            event: {
                id: parseInt(eventId),
                title: event.title,
                location: event.location
            },
            user: {
                id: userId,
                name: userName,
                email: user_email,
                points: Math.floor(Math.random() * 50) + 5
            },
            timestamp: new Date().toISOString(),
            check_in_id: `checkin_${eventId}_${userId}_${Date.now()}`,
            note: 'Successfully checked in to event'
        };
        
        console.log(`✅ Check-in successful: ${user_email} → Event ${eventId} (${event.title})`);
        
        return res.status(200).json(result);
        
    } catch (error) {
        console.error('❌ Check-in error:', error);
        return res.status(500).json({
            success: false,
            message: 'Check-in failed due to server error',
            error: error.message
        });
    }
};