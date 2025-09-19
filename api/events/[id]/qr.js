// Vercel serverless function for event QR code generation
const QRCode = require('qrcode');
let db;
let runQuery, getAllQuery, getQuery;

// Initialize database connection for Vercel
function initVercelDatabase() {
    const Database = require('better-sqlite3');
    const path = require('path');
    
    try {
        // In Vercel, the database file should be in /tmp for persistence across requests
        const dbPath = process.env.VERCEL ? '/tmp/ikoot.db' : path.join(process.cwd(), 'backend', 'database.db');
        db = new Database(dbPath);
        
        console.log('Connected to SQLite database at:', dbPath);
        
        // Helper functions
        runQuery = function(sql, params = []) {
            return new Promise((resolve, reject) => {
                try {
                    const stmt = db.prepare(sql);
                    const result = stmt.run(...params);
                    resolve({ id: result.lastInsertRowid, changes: result.changes });
                } catch (err) {
                    reject(err);
                }
            });
        };
        
        getQuery = function(sql, params = []) {
            return new Promise((resolve, reject) => {
                try {
                    const stmt = db.prepare(sql);
                    const row = stmt.get(...params);
                    resolve(row);
                } catch (err) {
                    reject(err);
                }
            });
        };
        
        return true;
    } catch (error) {
        console.error('Database initialization error:', error);
        return false;
    }
}

// Function to generate event check-in QR code
async function generateEventQRCode(eventId) {
    try {
        const qrData = `IKOOT_EVENT:${eventId}`;
        console.log(`Generating EVENT QR with data: ${qrData}`);
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
        return qrCodeDataUrl;
    } catch (error) {
        console.error('Error generating event QR code:', error);
        const fallbackSvg = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="300" fill="white" stroke="#ddd" stroke-width="2"/>
            <text x="150" y="120" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">Event QR Error</text>
            <text x="150" y="150" text-anchor="middle" font-family="Arial" font-size="14" fill="#666">Event ID: ${eventId}</text>
            <text x="150" y="180" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">Please regenerate</text>
        </svg>`;
        return 'data:image/svg+xml;base64,' + Buffer.from(fallbackSvg).toString('base64');
    }
}

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
            message: 'Method not allowed. Use GET to retrieve QR code.'
        });
    }
    
    try {
        const eventId = parseInt(req.query.id);
        console.log(`EVENT QR REQUEST: Event ID ${eventId}`);
        
        // Initialize database
        const dbInitialized = initVercelDatabase();
        if (!dbInitialized) {
            return res.status(500).json({
                success: false,
                message: 'Database connection failed'
            });
        }
        
        const event = await getQuery('SELECT qr_code FROM events WHERE id = ?', [eventId]);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (!event.qr_code) {
            // Generate QR code if it doesn't exist
            const qrCode = await generateEventQRCode(eventId);
            await runQuery('UPDATE events SET qr_code = ? WHERE id = ?', [qrCode, eventId]);
            event.qr_code = qrCode;
        }

        // Handle both PNG and SVG data URLs
        let contentType = 'image/png';
        let base64Data = '';

        if (event.qr_code.startsWith('data:image/png;base64,')) {
            base64Data = event.qr_code.replace('data:image/png;base64,', '');
            contentType = 'image/png';
        } else if (event.qr_code.startsWith('data:image/svg+xml;base64,')) {
            base64Data = event.qr_code.replace('data:image/svg+xml;base64,', '');
            contentType = 'image/svg+xml';
        } else {
            throw new Error('Event QR code not available');
        }

        const imageBuffer = Buffer.from(base64Data, 'base64');

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', imageBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(imageBuffer);

    } catch (error) {
        console.error('Event QR endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve event QR code',
            error: error.message
        });
    }
};