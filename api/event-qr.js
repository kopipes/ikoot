// Get QR code for specific event
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        const eventId = parseInt(req.query.eventId || req.query.id || '1');
        
        console.log(`🎯 Event QR requested for Event ${eventId}`);
        
        // For now, we'll generate QR codes on demand since events are in memory
        // In a real system, this would fetch the stored QR code from database
        
        // Validate event exists (using same logic as qr-checkin)
        const events = {
            1: { id: 1, title: 'Jakarta Music Festival 2024', location: 'GBK Senayan, Jakarta' },
            2: { id: 2, title: 'Tech Summit Jakarta', location: 'Jakarta Convention Center' },
            3: { id: 3, title: 'Food & Culture Festival', location: 'Monas Park, Central Jakarta' },
            4: { id: 4, title: 'Sports & Wellness Expo', location: 'Jakarta International Expo' },
            5: { id: 5, title: 'Gaming Championship', location: 'Senayan City Mall' }
        };
        
        const event = events[eventId];
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: `Event ${eventId} not found`,
                availableEvents: Object.keys(events)
            });
        }
        
        // Generate QR code (this would normally be retrieved from storage)
        const QRCode = require('qrcode');
        const qrData = `IKOOT_EVENT:${eventId}`;
        
        console.log(`Generating QR code: ${qrData}`);
        
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
            type: 'image/png',
            width: 300,
            margin: 2,
            color: {
                dark: '#2E7D32',  // Green for events
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
        });
        
        // Return as image
        const base64Data = qrCodeDataUrl.replace('data:image/png;base64,', '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', imageBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.send(imageBuffer);
        
    } catch (error) {
        console.error('❌ Event QR error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get event QR code',
            error: error.message
        });
    }
};