// Clean QR Generation API - Works without database
const QRCode = require('qrcode');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        const eventId = parseInt(req.query.eventId || '1');
        
        console.log(`🎯 QR Generate API called for Event ${eventId}`);
        
        // Clean event data that matches your QR codes exactly
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
        
        // Generate QR code with exact format your scanner expects
        const qrData = `IKOOT_EVENT:${eventId}`;
        console.log(`Generating QR with data: ${qrData}`);
        
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
        res.send(imageBuffer);
        
    } catch (error) {
        console.error('❌ QR Generation error:', error);
        res.status(500).json({
            success: false,
            message: 'QR generation failed',
            error: error.message
        });
    }
};