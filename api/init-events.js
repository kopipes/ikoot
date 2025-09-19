// Vercel-compatible event initialization without database dependencies  
// This creates a simple JSON-based storage approach for events

const fs = require('fs').promises;
const path = require('path');

// Event data to seed
const eventData = [
    {
        id: 1,
        title: "Jakarta Music Festival 2024",
        description: "The biggest music festival in Jakarta featuring international and local artists. Experience unforgettable performances from world-renowned musicians across multiple stages.",
        short_description: "Jakarta's biggest music festival with world-class artists",
        start_date: "2024-04-15T18:00:00.000Z",
        end_date: "2024-04-17T23:00:00.000Z",
        location: "GBK Senayan, Jakarta",
        venue_details: "Main Stadium and Multiple Side Stages",
        price: 750000,
        max_capacity: 15000,
        category: "Music",
        status: "live",
        featured: 1,
        image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        qr_code: "IKOOT_EVENT:1"
    },
    {
        id: 2,
        title: "Tech Summit Jakarta",
        description: "Indonesia's premier technology conference bringing together industry leaders, startups, and innovators. Learn about the latest trends in AI, blockchain, and digital transformation.",
        short_description: "Premier technology conference with industry leaders",
        start_date: "2024-04-20T09:00:00.000Z",
        end_date: "2024-04-20T17:00:00.000Z",
        location: "Jakarta Convention Center",
        venue_details: "Main Hall A - Auditorium Style",
        price: 500000,
        max_capacity: 1000,
        category: "Technology",
        status: "live",
        featured: 1,
        image_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        qr_code: "IKOOT_EVENT:2"
    },
    {
        id: 3,
        title: "Food & Culture Festival",
        description: "Celebrate Indonesia's rich culinary heritage with dishes from all 34 provinces. Experience traditional cooking demonstrations, cultural performances, and authentic local flavors.",
        short_description: "Culinary journey through Indonesia's 34 provinces",
        start_date: "2024-04-25T11:00:00.000Z",
        end_date: "2024-04-27T22:00:00.000Z",
        location: "Monas Park, Central Jakarta",
        venue_details: "Outdoor Festival Area with Food Courts",
        price: 150000,
        max_capacity: 5000,
        category: "Food",
        status: "upcoming",
        featured: 1,
        image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        qr_code: "IKOOT_EVENT:3"
    },
    {
        id: 4,
        title: "Sports & Wellness Expo",
        description: "Health and fitness expo featuring the latest sports equipment, wellness products, and fitness demonstrations. Join workout sessions and health consultations with experts.",
        short_description: "Health and fitness expo with expert consultations",
        start_date: "2024-05-10T08:00:00.000Z",
        end_date: "2024-05-11T20:00:00.000Z",
        location: "Jakarta International Expo",
        venue_details: "Hall 5-6 - Exhibition Style",
        price: 50000,
        max_capacity: 2000,
        category: "Sports",
        status: "live",
        featured: 1,
        image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        qr_code: "IKOOT_EVENT:4"
    },
    {
        id: 5,
        title: "Gaming Championship",
        description: "Esports tournament featuring the most popular games. Watch professional gamers compete for the championship title and substantial prize money.",
        short_description: "Esports tournament with professional gamers",
        start_date: "2024-05-20T10:00:00.000Z",
        end_date: "2024-05-22T22:00:00.000Z",
        location: "Senayan City Mall",
        venue_details: "Gaming Arena - Level 3",
        price: 200000,
        max_capacity: 500,
        category: "Gaming",
        status: "upcoming",
        featured: 1,
        image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        qr_code: "IKOOT_EVENT:5"
    }
];

// Store events and users data in /tmp for serverless
const EVENTS_FILE = '/tmp/events.json';
const USERS_FILE = '/tmp/users.json';
const CHECKINS_FILE = '/tmp/checkins.json';

async function initializeData() {
    try {
        // Write events data
        await fs.writeFile(EVENTS_FILE, JSON.stringify(eventData, null, 2));
        
        // Initialize empty users array
        await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
        
        // Initialize empty checkins array  
        await fs.writeFile(CHECKINS_FILE, JSON.stringify([], null, 2));
        
        console.log('✅ Data files initialized in /tmp');
        return true;
    } catch (error) {
        console.error('❌ Error initializing data files:', error);
        throw error;
    }
}

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
            message: 'Method not allowed. Use POST to initialize events.'
        });
    }
    
    try {
        console.log('🚀 Initializing event data for Vercel...');
        
        await initializeData();
        
        res.status(200).json({
            success: true,
            message: 'Event data initialized successfully! 🎉',
            storage: 'File-based storage in /tmp (Vercel compatible)',
            events: eventData.map(event => ({
                id: event.id,
                title: event.title,
                status: event.status,
                qr_format: `IKOOT_EVENT:${event.id}`,
                qr_test_data: event.qr_code
            })),
            testInstructions: {
                qrCodes: eventData.map(event => ({
                    eventId: event.id,
                    title: event.title,
                    qrData: `IKOOT_EVENT:${event.id}`,
                    testUrl: `Generate QR code with data: IKOOT_EVENT:${event.id}`,
                    checkInUrl: `/api/events/${event.id}/checkin-v2`
                }))
            },
            nextSteps: [
                "1. Generate QR codes using the formats above",
                "2. Test QR scanner in the IKOOT app", 
                "3. Scan QR codes to test event check-in",
                "4. Verify loyalty points are awarded"
            ]
        });
        
    } catch (error) {
        console.error('❌ Init events error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initialize event data',
            error: error.message
        });
    }
};