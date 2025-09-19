// Simple test version of seed-database without database dependencies
module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed. Use POST to seed database.'
        });
    }
    
    try {
        // Simulate successful database seeding
        const mockEvents = [
            {
                id: 1,
                title: "Jakarta Music Festival 2024",
                status: "live",
                qr_format: "IKOOT_EVENT:1"
            },
            {
                id: 2,
                title: "Tech Summit Jakarta",
                status: "live", 
                qr_format: "IKOOT_EVENT:2"
            },
            {
                id: 3,
                title: "Food & Culture Festival",
                status: "upcoming",
                qr_format: "IKOOT_EVENT:3"
            },
            {
                id: 4,
                title: "Sports & Wellness Expo",
                status: "live",
                qr_format: "IKOOT_EVENT:4"
            },
            {
                id: 5,
                title: "Gaming Championship",
                status: "upcoming",
                qr_format: "IKOOT_EVENT:5"
            }
        ];

        res.status(200).json({
            success: true,
            message: 'Mock database seeded successfully (no actual database used)',
            events: mockEvents,
            testInstructions: {
                qrCodes: mockEvents.map(event => ({
                    eventId: event.id,
                    title: event.title,
                    qrData: event.qr_format,
                    testUrl: `Generate QR code with data: ${event.qr_format}`,
                    checkInUrl: `/api/events/${event.id}/checkin`
                }))
            },
            nextSteps: [
                "1. Generate QR codes using the provided formats above",
                "2. Test QR scanner in the app with these formats: IKOOT_EVENT:1, IKOOT_EVENT:2, etc.",
                "3. Test the check-in endpoint directly: POST /api/events/1/checkin",
                "4. Note: This is a mock response - actual database seeding needs working SQLite"
            ]
        });
        
    } catch (error) {
        console.error('Mock seeding error:', error);
        res.status(500).json({
            success: false,
            message: 'Mock seeding failed',
            error: error.message
        });
    }
};