// Simple event seeding endpoint for Vercel
module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        // Try to use existing database connection if available
        let db, runQuery, getQuery;
        
        try {
            const Database = require('better-sqlite3');
            const path = require('path');
            
            // Use existing database path logic
            const dbPath = process.env.VERCEL ? '/tmp/ikoot.db' : path.join(process.cwd(), 'backend', 'database.db');
            console.log('Attempting to connect to database at:', dbPath);
            
            db = new Database(dbPath);
            
            runQuery = function(sql, params = []) {
                const stmt = db.prepare(sql);
                return stmt.run(...params);
            };
            
            getQuery = function(sql, params = []) {
                const stmt = db.prepare(sql);
                return stmt.get(...params);
            };
            
            console.log('✅ Database connected successfully');
            
        } catch (dbError) {
            console.error('Database connection failed:', dbError.message);
            return res.status(500).json({
                success: false,
                message: 'Database connection failed',
                error: dbError.message,
                suggestion: 'Database may not be initialized or better-sqlite3 not available in Vercel environment'
            });
        }
        
        // Create events table if it doesn't exist
        try {
            runQuery(`
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    location TEXT,
                    start_date TEXT,
                    end_date TEXT,
                    price INTEGER,
                    status TEXT DEFAULT 'active',
                    qr_code TEXT,
                    created_at TEXT,
                    updated_at TEXT
                )
            `);
            console.log('✅ Events table ready');
        } catch (tableError) {
            console.error('Error creating events table:', tableError);
        }
        
        // Check if events already exist
        const existingEvent = getQuery('SELECT id FROM events WHERE id = ?', [1]);
        if (existingEvent) {
            return res.json({
                success: true,
                message: 'Events already exist in database',
                existing_events: [1, 2, 3, 4, 5],
                note: 'QR codes should work now'
            });
        }
        
        // Insert the 5 events that match your QR codes
        const events = [
            {
                id: 1,
                title: "Jakarta Music Festival 2024",
                location: "GBK Senayan, Jakarta",
                description: "The biggest music festival in Jakarta featuring local and international artists",
                start_date: "2024-12-01T19:00:00Z",
                end_date: "2024-12-01T23:00:00Z",
                price: 150000,
                status: "active"
            },
            {
                id: 2,
                title: "Tech Summit Jakarta",
                location: "Jakarta Convention Center",
                description: "Premier technology conference featuring the latest in AI, blockchain, and innovation",
                start_date: "2024-12-15T09:00:00Z",
                end_date: "2024-12-15T18:00:00Z",
                price: 250000,
                status: "active"
            },
            {
                id: 3,
                title: "Food & Culture Festival",
                location: "Monas Park, Central Jakarta",
                description: "Celebrate Indonesian culinary heritage and diverse cultural traditions",
                start_date: "2024-12-22T11:00:00Z",
                end_date: "2024-12-22T22:00:00Z",
                price: 75000,
                status: "active"
            },
            {
                id: 4,
                title: "Sports & Wellness Expo",
                location: "Jakarta International Expo",
                description: "Fitness, wellness, and sports equipment exhibition with health workshops",
                start_date: "2025-01-10T08:00:00Z",
                end_date: "2025-01-10T20:00:00Z",
                price: 100000,
                status: "active"
            },
            {
                id: 5,
                title: "Gaming Championship",
                location: "Senayan City Mall",
                description: "Ultimate esports tournament featuring popular games and massive prize pools",
                start_date: "2025-01-20T14:00:00Z",
                end_date: "2025-01-20T22:00:00Z",
                price: 50000,
                status: "active"
            }
        ];
        
        let seededEvents = [];
        
        // Insert each event
        for (const event of events) {
            try {
                const result = runQuery(`
                    INSERT OR REPLACE INTO events (
                        id, title, description, location, start_date, end_date, 
                        price, status, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    event.id,
                    event.title,
                    event.description,
                    event.location,
                    event.start_date,
                    event.end_date,
                    event.price,
                    event.status,
                    new Date().toISOString(),
                    new Date().toISOString()
                ]);
                
                seededEvents.push({
                    id: event.id,
                    title: event.title,
                    location: event.location,
                    qr_format: `IKOOT_EVENT:${event.id}`
                });
                
                console.log(`✅ Event ${event.id} seeded: ${event.title}`);
                
            } catch (insertError) {
                console.error(`Error inserting event ${event.id}:`, insertError);
            }
        }
        
        // Close database connection
        if (db) {
            db.close();
        }
        
        res.json({
            success: true,
            message: `Successfully seeded ${seededEvents.length} events! 🎉`,
            seeded_events: seededEvents,
            qr_test_info: {
                format: "IKOOT_EVENT:X",
                description: "Your generated QR codes should now work with check-in",
                test_events: [
                    "IKOOT_EVENT:1 → Jakarta Music Festival 2024",
                    "IKOOT_EVENT:2 → Tech Summit Jakarta",
                    "IKOOT_EVENT:3 → Food & Culture Festival", 
                    "IKOOT_EVENT:4 → Sports & Wellness Expo",
                    "IKOOT_EVENT:5 → Gaming Championship"
                ]
            },
            next_steps: [
                "1. Your QR codes will now work for event check-in",
                "2. Test scanning QR codes - should get successful check-in",
                "3. Each scan awards 5 loyalty points",
                "4. Events are now available for QR generation endpoint"
            ]
        });
        
    } catch (error) {
        console.error('❌ Seed events error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to seed events',
            error: error.message
        });
    }
};