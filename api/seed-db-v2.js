const QRCode = require('qrcode');

// Import database functions - adjust path for Vercel serverless environment
let db;
let runQuery, getAllQuery, getQuery;

// Initialize database connection for Vercel
function initVercelDatabase() {
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    
    return new Promise((resolve, reject) => {
        try {
            // In Vercel, the database file should be in /tmp for persistence across requests
            const dbPath = process.env.VERCEL ? '/tmp/ikoot.db' : path.join(process.cwd(), 'backend', 'database.db');
            db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('Database connection error:', err);
                    reject(err);
                    return;
                }
                
                console.log('Connected to SQLite database at:', dbPath);
                
                // Helper functions
                runQuery = function(sql, params = []) {
                    return new Promise((resolve, reject) => {
                        db.run(sql, params, function(err) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({ id: this.lastID, changes: this.changes });
                            }
                        });
                    });
                };
                
                getAllQuery = function(sql, params = []) {
                    return new Promise((resolve, reject) => {
                        db.all(sql, params, (err, rows) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(rows);
                            }
                        });
                    });
                };
                
                getQuery = function(sql, params = []) {
                    return new Promise((resolve, reject) => {
                        db.get(sql, params, (err, row) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(row);
                            }
                        });
                    });
                };
                
                resolve();
            });
        } catch (error) {
            console.error('Database initialization error:', error);
            reject(error);
        }
    });
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

// Sample events data for Vercel
const vercelSampleEvents = [
    {
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
        image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
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
        image_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
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
        image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
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
        image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
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
        image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    }
];

async function seedVercelDatabase() {
    try {
        await initVercelDatabase();
        
        console.log('🏗️  Setting up database schema...');
        
        // Create tables if they don't exist
        await runQuery(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                points INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await runQuery(`
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                short_description TEXT,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                location TEXT NOT NULL,
                venue_details TEXT,
                price REAL DEFAULT 0,
                max_capacity INTEGER DEFAULT 0,
                current_bookings INTEGER DEFAULT 0,
                category TEXT DEFAULT 'General',
                status TEXT DEFAULT 'upcoming',
                featured INTEGER DEFAULT 0,
                image_url TEXT,
                qr_code TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await runQuery(`
            CREATE TABLE IF NOT EXISTS user_check_ins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                event_id INTEGER NOT NULL,
                event_title TEXT NOT NULL,
                points_earned INTEGER DEFAULT 5,
                checked_in_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (event_id) REFERENCES events(id),
                UNIQUE(user_id, event_id)
            )
        `);
        
        console.log('✅ Database schema created');
        console.log('🗑️  Clearing existing event data...');
        
        // Clear existing events and check-ins
        await runQuery('DELETE FROM user_check_ins');
        await runQuery('DELETE FROM events WHERE id > 0'); // Clear all events
        
        console.log('✅ Existing event data cleared');
        
        console.log('🌱 Seeding new events for Vercel...');
        
        const createdEvents = [];
        
        for (let i = 0; i < vercelSampleEvents.length; i++) {
            const event = vercelSampleEvents[i];
            
            // Insert event into database
            const result = await runQuery(`
                INSERT INTO events (
                    title, description, short_description, start_date, end_date,
                    location, venue_details, price, max_capacity, category,
                    status, featured, image_url, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            `, [
                event.title, event.description, event.short_description, 
                event.start_date, event.end_date, event.location, event.venue_details,
                event.price, event.max_capacity, event.category,
                event.status, event.featured, event.image_url
            ]);

            const eventId = result.id;
            console.log(`📅 Created event ${eventId}: ${event.title}`);
            
            // Generate QR code for the event
            console.log(`🔄 Generating QR code for event ${eventId}...`);
            const qrCode = await generateEventQRCode(eventId);
            
            // Update event with QR code
            await runQuery('UPDATE events SET qr_code = ? WHERE id = ?', [qrCode, eventId]);
            
            console.log(`✅ Event ${eventId} QR code generated and saved`);
            
            createdEvents.push({
                id: eventId,
                title: event.title,
                status: event.status,
                qr_format: `IKOOT_EVENT:${eventId}`
            });
        }
        
        console.log('🎉 Vercel database seeding completed successfully!');
        
        return {
            success: true,
            message: 'Database seeded successfully',
            events: createdEvents,
            count: createdEvents.length
        };
        
    } catch (error) {
        console.error('❌ Error seeding Vercel database:', error);
        return {
            success: false,
            message: 'Database seeding failed',
            error: error.message
        };
    }
}

// Serverless function handler for Vercel
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
        console.log('🚀 Starting Vercel database seeding...');
        const result = await seedVercelDatabase();
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: result.message,
                events: result.events,
                testInstructions: {
                    qrCodes: result.events.map(event => ({
                        eventId: event.id,
                        title: event.title,
                        qrData: event.qr_format,
                        testUrl: `Generate QR code with data: ${event.qr_format}`,
                        checkInUrl: `/api/events/${event.id}/checkin`
                    }))
                },
                nextSteps: [
                    "1. Generate QR codes using the provided formats",
                    "2. Test QR scanner in the app",
                    "3. Verify event check-in flow",
                    "4. Check loyalty points are awarded"
                ]
            });
        } else {
            res.status(500).json(result);
        }
        
    } catch (error) {
        console.error('Serverless function error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};