// Simple check-in endpoint that works without database
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
        const eventId = parseInt(req.query.id);
        const { user_email } = req.body;
        
        console.log(`🎯 Simple Check-in: Event ${eventId}, User: ${user_email}`);
        
        if (!user_email) {
            return res.status(400).json({
                success: false,
                message: 'User email is required for check-in'
            });
        }
        
        // Hardcoded events that match your QR codes
        const events = {
            1: { id: 1, title: 'Jakarta Music Festival 2024', location: 'GBK Senayan, Jakarta' },
            2: { id: 2, title: 'Tech Summit Jakarta', location: 'Jakarta Convention Center' },
            3: { id: 3, title: 'Food & Culture Festival', location: 'Monas Park, Central Jakarta' },
            4: { id: 4, title: 'Sports & Wellness Expo', location: 'Jakarta International Expo' },
            5: { id: 5, title: 'Gaming Championship', location: 'Senayan City Mall' }
        };
        
        const event = events[eventId];
        
        if (!event) {
            console.log(`❌ Event ${eventId} not found in simple event list`);
            return res.status(404).json({
                success: false,
                message: `Event ${eventId} not found. Valid events: 1, 2, 3, 4, 5`
            });
        }
        
        console.log(`✅ Found event: ${event.title}`);
        
        // Create a simple user if needed (use email as identifier)
        const user = {
            id: Math.floor(Math.random() * 10000), // Simple random ID
            name: user_email.split('@')[0], // Use email prefix as name
            email: user_email,
            points: 5 // Starting points for this check-in
        };
        
        // Award 5 points for check-in
        const pointsEarned = 5;
        
        console.log(`🎉 Check-in successful: ${user.email} got ${pointsEarned} points for ${event.title}`);
        
        // Return successful check-in response
        res.json({
            success: true,
            message: `Check-in successful! You earned ${pointsEarned} points!`,
            points_earned: pointsEarned,
            total_points: user.points,
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
            note: "This is a simplified check-in that works without database seeding"
        });
        
    } catch (error) {
        console.error('❌ Simple check-in error:', error);
        res.status(500).json({
            success: false,
            message: 'Check-in failed',
            error: error.message
        });
    }
};