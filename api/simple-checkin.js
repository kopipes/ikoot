// Simple check-in API that works without database dependencies
module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        // Parse request data
        const eventId = parseInt(req.body?.eventId || req.query?.eventId || '1');
        const userEmail = req.body?.user_email || req.body?.userEmail || req.query?.userEmail;
        
        console.log(`🎯 Simple Check-in: Event ${eventId}, User: ${userEmail}`);
        
        if (!userEmail) {
            return res.status(400).json({
                success: false,
                message: 'User email is required for check-in'
            });
        }
        
        // Hardcoded events that match your QR codes exactly
        const events = {
            1: { id: 1, title: 'Jakarta Music Festival 2024', location: 'GBK Senayan, Jakarta' },
            2: { id: 2, title: 'Tech Summit Jakarta', location: 'Jakarta Convention Center' },
            3: { id: 3, title: 'Food & Culture Festival', location: 'Monas Park, Central Jakarta' },
            4: { id: 4, title: 'Sports & Wellness Expo', location: 'Jakarta International Expo' },
            5: { id: 5, title: 'Gaming Championship', location: 'Senayan City Mall' }
        };
        
        const event = events[eventId];
        
        if (!event) {
            console.log(`❌ Event ${eventId} not found. Available: 1,2,3,4,5`);
            return res.status(404).json({
                success: false,
                message: `Event ${eventId} not found. Valid events: 1, 2, 3, 4, 5`,
                availableEvents: Object.keys(events)
            });
        }
        
        console.log(`✅ Found event: ${event.title}`);
        
        // Create simple user data (no persistent storage needed for demo)
        const user = {
            id: Math.floor(Math.random() * 10000),
            name: userEmail.split('@')[0],
            email: userEmail,
            points: 5 // They get 5 points for this check-in
        };
        
        // Award 5 points for check-in
        const pointsEarned = 5;
        const totalPoints = user.points; // In a real system, this would be fetched from storage
        
        console.log(`🎉 Check-in successful: ${user.email} got ${pointsEarned} points for ${event.title}`);
        
        // Return successful check-in response that matches expected format
        res.json({
            success: true,
            message: `Check-in successful! You earned ${pointsEarned} points!`,
            points_earned: pointsEarned,
            total_points: totalPoints,
            event: {
                id: event.id,
                title: event.title,
                location: event.location
            },
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                points: user.points
            },
            timestamp: new Date().toISOString(),
            note: "Simplified check-in system - works with your QR codes!"
        });
        
    } catch (error) {
        console.error('❌ Simple check-in error:', error);
        res.status(500).json({
            success: false,
            message: 'Check-in failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};