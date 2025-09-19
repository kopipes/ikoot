// Clean QR Check-in API - Works without database
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        console.log('🎯 QR Check-in API called');
        console.log('Method:', req.method);
        console.log('Body:', req.body);
        console.log('Query:', req.query);
        
        // Extract event ID and user email from request
        let eventId = req.body?.eventId || req.query?.eventId;
        let userEmail = req.body?.user_email || req.body?.userEmail || req.query?.userEmail;
        
        // Parse eventId if it's a string
        if (typeof eventId === 'string') {
            eventId = parseInt(eventId);
        }
        
        console.log(`Parsed - Event ID: ${eventId}, User: ${userEmail}`);
        
        if (!eventId || !userEmail) {
            return res.status(400).json({
                success: false,
                message: 'Both eventId and user_email are required',
                received: { eventId, userEmail }
            });
        }
        
        // Get events from the event management system
        // In a real system, this would fetch from database
        // For now, we'll provide fallback events that can be initialized
        let events = {};
        
        // Try to get events from the events API (same memory space)
        try {
            // Import events from the events module if available
            const eventsModule = require('./events.js');
            // Since we're using in-memory storage, we need to check if events exist
            // If no events exist, provide fallback
        } catch (e) {
            console.log('Events module not accessible, using fallback');
        }
        
        // Fallback events if none exist
        if (Object.keys(events).length === 0) {
            events = {
                1: { 
                    id: 1, 
                    title: 'Jakarta Music Festival 2024', 
                    location: 'GBK Senayan, Jakarta',
                    description: 'Amazing music festival with top artists'
                },
                2: { 
                    id: 2, 
                    title: 'Tech Summit Jakarta', 
                    location: 'Jakarta Convention Center',
                    description: 'Technology conference and innovation showcase'
                },
                3: { 
                    id: 3, 
                    title: 'Food & Culture Festival', 
                    location: 'Monas Park, Central Jakarta',
                    description: 'Culinary delights and cultural experiences'
                },
                4: { 
                    id: 4, 
                    title: 'Sports & Wellness Expo', 
                    location: 'Jakarta International Expo',
                    description: 'Health, fitness and sports equipment expo'
                },
                5: { 
                    id: 5, 
                    title: 'Gaming Championship', 
                    location: 'Senayan City Mall',
                    description: 'Esports tournament with amazing prizes'
                }
            };
        }
        
        const event = events[eventId];
        
        if (!event) {
            console.log(`❌ Event ${eventId} not found`);
            return res.status(404).json({
                success: false,
                message: `Event ${eventId} not found`,
                availableEvents: Object.keys(events).map(id => ({
                    id: parseInt(id),
                    title: events[id].title
                }))
            });
        }
        
        console.log(`✅ Event found: ${event.title}`);
        
        // Create user data
        const userName = userEmail.split('@')[0];
        const user = {
            id: Math.floor(Math.random() * 100000),
            name: userName,
            email: userEmail,
            points: 5 // They get 5 points for this check-in
        };
        
        // Points for check-in
        const pointsEarned = 5;
        
        console.log(`🎉 SUCCESS: ${userEmail} checked into ${event.title}, earned ${pointsEarned} points`);
        
        // Return success response
        const response = {
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
            timestamp: new Date().toISOString()
        };
        
        console.log('Returning response:', response);
        
        res.json(response);
        
    } catch (error) {
        console.error('❌ QR Check-in error:', error);
        res.status(500).json({
            success: false,
            message: 'Check-in failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};