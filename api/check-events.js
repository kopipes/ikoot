// Import the database module from backend
const { getAllQuery, getQuery } = require('../backend/config/database');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed. Use GET to check events.'
        });
    }
    
    try {
        console.log('🔍 Checking current events in Vercel database...');
        
        // Get all events with their QR codes
        const events = await getAllQuery(`
            SELECT id, title, status, featured, qr_code,
                   CASE WHEN qr_code IS NOT NULL THEN 'Yes' ELSE 'No' END as has_qr_code,
                   created_at, updated_at
            FROM events 
            ORDER BY id ASC
        `);
        
        // Get count of user check-ins
        const checkInStats = await getAllQuery(`
            SELECT event_id, COUNT(*) as checkin_count, SUM(points_earned) as total_points
            FROM user_check_ins 
            GROUP BY event_id
        `);
        
        const checkInMap = {};
        checkInStats.forEach(stat => {
            checkInMap[stat.event_id] = {
                checkins: stat.checkin_count,
                points_awarded: stat.total_points
            };
        });
        
        // Format events with QR code information
        const eventSummary = events.map(event => ({
            id: event.id,
            title: event.title,
            status: event.status,
            featured: event.featured === 1 ? 'Yes' : 'No',
            has_qr_code: event.has_qr_code,
            qr_format: `IKOOT_EVENT:${event.id}`,
            qr_test_url: `Generate QR code with data: IKOOT_EVENT:${event.id}`,
            check_in_url: `/api/events/${event.id}/checkin`,
            qr_download_url: `/api/events/${event.id}/qr`,
            checkins: checkInMap[event.id]?.checkins || 0,
            points_awarded: checkInMap[event.id]?.points_awarded || 0,
            created_at: event.created_at,
            updated_at: event.updated_at
        }));
        
        res.status(200).json({
            success: true,
            message: 'Events retrieved successfully',
            total_events: events.length,
            events_with_qr: events.filter(e => e.qr_code).length,
            events: eventSummary,
            summary: {
                total_events: events.length,
                live_events: events.filter(e => e.status === 'live').length,
                upcoming_events: events.filter(e => e.status === 'upcoming').length,
                featured_events: events.filter(e => e.featured === 1).length,
                events_with_qr_codes: events.filter(e => e.qr_code).length,
                total_checkins: Object.values(checkInMap).reduce((sum, stat) => sum + stat.checkins, 0),
                total_points_awarded: Object.values(checkInMap).reduce((sum, stat) => sum + stat.points_awarded, 0)
            },
            testInstructions: {
                steps: [
                    "1. Choose any event ID from the list above",
                    "2. Generate a QR code with format: IKOOT_EVENT:{eventId}",
                    "3. Open the QR scanner in the IKOOT app",
                    "4. Scan the QR code to test check-in flow",
                    "5. Verify loyalty points are awarded"
                ],
                qr_generator_urls: [
                    "https://qr-code-generator.com",
                    "https://www.qr-code-generator.org",
                    "https://qrcode.tec-it.com"
                ]
            }
        });
        
    } catch (error) {
        console.error('Error checking events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check events',
            error: error.message
        });
    }
};