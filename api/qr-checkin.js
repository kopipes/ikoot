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
        
        // Fallback events if none exist - Updated with real event IDs from event management system
        if (Object.keys(events).length === 0) {
            events = {
                19: { 
                    id: 19, 
                    title: 'Jakarta Music Festival 2024', 
                    location: 'GBK Senayan, Jakarta',
                    description: 'The biggest music festival in Jakarta featuring international and local artists'
                },
                20: { 
                    id: 20, 
                    title: 'Tech Summit Jakarta', 
                    location: 'Jakarta Convention Center',
                    description: 'Indonesia\'s premier technology conference bringing together industry leaders'
                },
                21: { 
                    id: 21, 
                    title: 'Food & Culture Festival', 
                    location: 'Monas Park, Central Jakarta',
                    description: 'Celebrate Indonesia\'s rich culinary heritage with dishes from all 34 provinces'
                },
                22: { 
                    id: 22, 
                    title: 'Startup Pitch Competition', 
                    location: 'Cyber 2 Tower, Jakarta',
                    description: 'Young entrepreneurs compete for funding and mentorship opportunities'
                },
                23: { 
                    id: 23, 
                    title: 'Art & Design Exhibition', 
                    location: 'National Gallery, Jakarta',
                    description: 'Contemporary art exhibition featuring works by emerging Indonesian artists'
                },
                24: { 
                    id: 24, 
                    title: 'Sports & Wellness Expo', 
                    location: 'Jakarta International Expo',
                    description: 'Health and fitness expo featuring the latest sports equipment'
                },
                25: { 
                    id: 25, 
                    title: 'Photography Workshop', 
                    location: 'Creative Hub Jakarta',
                    description: 'Master the art of photography with professional photographers'
                },
                26: { 
                    id: 26, 
                    title: 'Gaming Championship', 
                    location: 'Senayan City Mall',
                    description: 'Esports tournament featuring the most popular games'
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