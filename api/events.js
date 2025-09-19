// Event Management API with automatic QR generation
const QRCode = require('qrcode');

let events = {}; // In-memory storage for simplicity
let nextEventId = 1;

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        console.log(`🎯 Events API: ${req.method}`);
        console.log('Query:', req.query);
        console.log('Body:', req.body);
        
        // GET /api/events - List all events
        if (req.method === 'GET' && !req.query.action) {
            return res.json({
                success: true,
                events: Object.values(events),
                total: Object.keys(events).length
            });
        }
        
        // GET /api/events?action=init - Initialize with default events
        if (req.method === 'GET' && req.query.action === 'init') {
            return await initializeDefaultEvents(res);
        }
        
        // POST /api/events - Create new event
        if (req.method === 'POST') {
            const { title, description, location, start_date, end_date, price } = req.body;
            
            if (!title || !location) {
                return res.status(400).json({
                    success: false,
                    message: 'Title and location are required'
                });
            }
            
            const eventId = nextEventId++;
            
            // Generate QR code for this event
            const qrData = `IKOOT_EVENT:${eventId}`;
            console.log(`Generating QR code for Event ${eventId}: ${qrData}`);
            
            let qrCodeDataUrl;
            try {
                qrCodeDataUrl = await QRCode.toDataURL(qrData, {
                    type: 'image/png',
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#2E7D32',  // Green for events
                        light: '#FFFFFF'
                    },
                    errorCorrectionLevel: 'M'
                });
            } catch (qrError) {
                console.error('QR generation failed:', qrError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to generate QR code',
                    error: qrError.message
                });
            }
            
            // Create event with generated QR code
            const event = {
                id: eventId,
                title: title.trim(),
                description: description?.trim() || '',
                location: location.trim(),
                start_date: start_date || new Date().toISOString(),
                end_date: end_date || new Date().toISOString(),
                price: parseInt(price) || 0,
                status: 'active',
                qr_code: qrCodeDataUrl,
                qr_data: qrData,  // Store the raw QR data
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            events[eventId] = event;
            
            console.log(`✅ Event created: ${event.title} (ID: ${eventId})`);
            
            return res.status(201).json({
                success: true,
                message: 'Event created successfully with QR code!',
                event: event,
                qr_info: {
                    data: qrData,
                    format: 'IKOOT_EVENT:X',
                    usage: 'Scan this QR code to check into the event'
                }
            });
        }
        
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
        
    } catch (error) {
        console.error('❌ Events API error:', error);
        res.status(500).json({
            success: false,
            message: 'Events API failed',
            error: error.message
        });
    }
};

// Initialize default events for testing
async function initializeDefaultEvents(res) {
    try {
        console.log('🔄 Initializing default events...');
        
        const defaultEvents = [
            {
                title: 'Jakarta Music Festival 2024',
                description: 'The biggest music festival in Jakarta featuring local and international artists',
                location: 'GBK Senayan, Jakarta',
                start_date: '2024-12-01T19:00:00Z',
                end_date: '2024-12-01T23:00:00Z',
                price: 150000
            },
            {
                title: 'Tech Summit Jakarta',
                description: 'Premier technology conference featuring the latest in AI, blockchain, and innovation',
                location: 'Jakarta Convention Center',
                start_date: '2024-12-15T09:00:00Z',
                end_date: '2024-12-15T18:00:00Z',
                price: 250000
            },
            {
                title: 'Food & Culture Festival',
                description: 'Celebrate Indonesian culinary heritage and diverse cultural traditions',
                location: 'Monas Park, Central Jakarta',
                start_date: '2024-12-22T11:00:00Z',
                end_date: '2024-12-22T22:00:00Z',
                price: 75000
            },
            {
                title: 'Sports & Wellness Expo',
                description: 'Fitness, wellness, and sports equipment exhibition with health workshops',
                location: 'Jakarta International Expo',
                start_date: '2025-01-10T08:00:00Z',
                end_date: '2025-01-10T20:00:00Z',
                price: 100000
            },
            {
                title: 'Gaming Championship',
                description: 'Ultimate esports tournament featuring popular games and massive prize pools',
                location: 'Senayan City Mall',
                start_date: '2025-01-20T14:00:00Z',
                end_date: '2025-01-20T22:00:00Z',
                price: 50000
            }
        ];
        
        const createdEvents = [];
        
        for (const eventData of defaultEvents) {
            const eventId = nextEventId++;
            const qrData = `IKOOT_EVENT:${eventId}`;
            
            // Generate QR code
            const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
                type: 'image/png',
                width: 300,
                margin: 2,
                color: {
                    dark: '#2E7D32',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            });
            
            const event = {
                id: eventId,
                ...eventData,
                status: 'active',
                qr_code: qrCodeDataUrl,
                qr_data: qrData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            events[eventId] = event;
            createdEvents.push({
                id: eventId,
                title: event.title,
                qr_data: qrData
            });
            
            console.log(`✅ Created: ${event.title} (QR: ${qrData})`);
        }
        
        return res.json({
            success: true,
            message: `Initialized ${createdEvents.length} default events with QR codes!`,
            events: createdEvents,
            instructions: {
                qr_format: 'IKOOT_EVENT:X',
                description: 'Each event now has a unique QR code generated automatically',
                usage: 'Users can scan these QR codes to check into events'
            },
            next_steps: [
                '1. Events are ready with QR codes',
                '2. QR codes follow format: IKOOT_EVENT:1, IKOOT_EVENT:2, etc.',
                '3. Test scanning QR codes for check-in',
                '4. Each scan awards 5 loyalty points'
            ]
        });
        
    } catch (error) {
        console.error('❌ Default events initialization failed:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to initialize default events',
            error: error.message
        });
    }
}