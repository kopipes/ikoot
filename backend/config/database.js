const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

// Use persistent volume path on Fly.io, fallback to local path
const dbPath = process.env.DATABASE_URL ? 
    process.env.DATABASE_URL.replace('file://', '') : 
    path.join(__dirname, '../database.sqlite');

let db;

// Initialize database connection
function initDB() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
            } else {
                console.log('Connected to SQLite database');
                resolve(db);
            }
        });
    });
}

// Create database tables
async function createTables() {
    const tables = [
        // Users table
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'user',
            avatar_url TEXT,
            phone VARCHAR(20),
            date_of_birth DATE,
            points INTEGER DEFAULT 0,
            status VARCHAR(50) DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // Events table
        `CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            short_description TEXT,
            start_date DATETIME NOT NULL,
            end_date DATETIME NOT NULL,
            location VARCHAR(255) NOT NULL,
            venue_details TEXT,
            price DECIMAL(10,2) NOT NULL DEFAULT 0,
            max_capacity INTEGER,
            current_bookings INTEGER DEFAULT 0,
            image_url TEXT,
            gallery JSON,
            category VARCHAR(100),
            tags JSON,
            status VARCHAR(50) DEFAULT 'upcoming',
            featured BOOLEAN DEFAULT FALSE,
            organizer_id INTEGER,
            qr_code TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (organizer_id) REFERENCES users (id)
        )`,

        // Bookings table
        `CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            event_id INTEGER NOT NULL,
            ticket_quantity INTEGER DEFAULT 1,
            total_price DECIMAL(10,2) NOT NULL,
            booking_status VARCHAR(50) DEFAULT 'confirmed',
            payment_status VARCHAR(50) DEFAULT 'pending',
            booking_reference VARCHAR(100) UNIQUE,
            qr_code TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (event_id) REFERENCES events (id)
        )`,

        // Favorites table
        `CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            event_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (event_id) REFERENCES events (id),
            UNIQUE(user_id, event_id)
        )`,

        // Promos table
        `CREATE TABLE IF NOT EXISTS promos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code VARCHAR(50) UNIQUE NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            promo_type VARCHAR(20) DEFAULT 'discount',
            discount_type VARCHAR(20) DEFAULT 'percentage',
            discount_value DECIMAL(10,2),
            custom_value TEXT,
            min_purchase DECIMAL(10,2) DEFAULT 0,
            max_usage INTEGER,
            current_usage INTEGER DEFAULT 0,
            valid_from DATETIME,
            valid_until DATETIME,
            applicable_events JSON,
            status VARCHAR(20) DEFAULT 'active',
            qr_code TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // User promos (claimed promos)
        `CREATE TABLE IF NOT EXISTS user_promos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            promo_id INTEGER NOT NULL,
            claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            used_at DATETIME,
            booking_id INTEGER,
            status VARCHAR(20) DEFAULT 'claimed',
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (promo_id) REFERENCES promos (id),
            FOREIGN KEY (booking_id) REFERENCES bookings (id),
            UNIQUE(user_id, promo_id)
        )`,

        // Reviews table
        `CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            event_id INTEGER NOT NULL,
            rating INTEGER CHECK(rating >= 1 AND rating <= 5),
            review_text TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (event_id) REFERENCES events (id),
            UNIQUE(user_id, event_id)
        )`,

        // User check-ins table (for QR code scans and loyalty points)
        `CREATE TABLE IF NOT EXISTS user_check_ins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            event_id INTEGER NOT NULL,
            event_title VARCHAR(255),
            points_earned INTEGER DEFAULT 5,
            checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (event_id) REFERENCES events (id),
            UNIQUE(user_id, event_id)
        )`,
        
        // Admin logs table
        `CREATE TABLE IF NOT EXISTS admin_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_id INTEGER NOT NULL,
            action VARCHAR(100) NOT NULL,
            entity_type VARCHAR(50),
            entity_id INTEGER,
            details JSON,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (admin_id) REFERENCES users (id)
        )`,
        
        // Redemption items table (barang yang bisa di-redeem)
        `CREATE TABLE IF NOT EXISTS redemption_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            points_required INTEGER NOT NULL,
            category VARCHAR(100) DEFAULT 'General',
            image_url TEXT,
            stock_quantity INTEGER DEFAULT -1,
            is_active BOOLEAN DEFAULT TRUE,
            delivery_available BOOLEAN DEFAULT TRUE,
            pickup_available BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // User redemptions table (history redemption user)
        `CREATE TABLE IF NOT EXISTS user_redemptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            redemption_item_id INTEGER NOT NULL,
            points_used INTEGER NOT NULL,
            delivery_method VARCHAR(20) NOT NULL CHECK(delivery_method IN ('pickup', 'delivery')),
            pickup_event_id INTEGER,
            delivery_address TEXT,
            delivery_phone VARCHAR(20),
            delivery_notes TEXT,
            status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'shipped', 'delivered', 'picked_up', 'cancelled')),
            admin_notes TEXT,
            redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (redemption_item_id) REFERENCES redemption_items (id),
            FOREIGN KEY (pickup_event_id) REFERENCES events (id)
        )`,
        
        // User point adjustments table (admin audit trail untuk adjustment points)
        `CREATE TABLE IF NOT EXISTS user_point_adjustments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            admin_email TEXT NOT NULL,
            points_before INTEGER NOT NULL DEFAULT 0,
            points_after INTEGER NOT NULL DEFAULT 0,
            adjustment_amount INTEGER NOT NULL,
            reason TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`
    ];

    for (const table of tables) {
        await runQuery(table);
    }
}

// Helper function to run queries
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
}

// Helper function to get all results
function getAllQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Helper function to get single result
function getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Insert sample data
async function insertSampleData() {
    try {
        // Check if admin user exists
        const adminExists = await getQuery('SELECT id FROM users WHERE email = ?', ['admin@ikoot.com']);
        
        if (!adminExists) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            // Insert admin user
            await runQuery(`
                INSERT INTO users (name, email, password, role) 
                VALUES (?, ?, ?, ?)
            `, ['Admin', 'admin@ikoot.com', hashedPassword, 'admin']);
            
            console.log('✅ Admin user created (email: admin@ikoot.com, password: admin123)');
        }

        // Insert sample events if none exist
        const eventsCount = await getQuery('SELECT COUNT(*) as count FROM events');
        if (eventsCount.count === 0) {
            const sampleEvents = [
                {
                    title: 'Jakarta Jazz Festival',
                    description: 'The biggest jazz festival in Southeast Asia featuring international and local artists. Experience the best of jazz music with performances from world-renowned musicians.',
                    short_description: 'The biggest jazz festival in Southeast Asia',
                    start_date: '2024-03-15 19:00:00',
                    end_date: '2024-03-17 23:00:00',
                    location: 'JIExpo Kemayoran',
                    venue_details: 'Hall A, B, and C - Main Stage and Side Stages',
                    price: 750000,
                    max_capacity: 5000,
                    image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3',
                    category: 'Music',
                    status: 'live',
                    featured: true
                },
                {
                    title: 'Food Truck Festival',
                    description: 'A culinary adventure with the best food trucks from around the city. Taste amazing dishes from various cuisines.',
                    short_description: 'A culinary adventure with the best food trucks',
                    start_date: '2024-03-20 11:00:00',
                    end_date: '2024-03-22 22:00:00',
                    location: 'Senayan Park',
                    venue_details: 'Open Area - Food Court Style',
                    price: 150000,
                    max_capacity: 2000,
                    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3',
                    category: 'Food',
                    status: 'live',
                    featured: false
                },
                {
                    title: 'Summer Music Festival',
                    description: 'Experience the ultimate summer music festival with world-class artists and unforgettable performances.',
                    short_description: 'The ultimate summer music festival',
                    start_date: '2024-06-15 16:00:00',
                    end_date: '2024-06-17 23:00:00',
                    location: 'Central Park, Jakarta',
                    venue_details: 'Outdoor Main Stage and Multiple Stages',
                    price: 500000,
                    max_capacity: 10000,
                    image_url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3',
                    category: 'Music',
                    status: 'upcoming',
                    featured: true
                }
            ];

            for (const event of sampleEvents) {
                await runQuery(`
                    INSERT INTO events (
                        title, description, short_description, start_date, end_date, 
                        location, venue_details, price, max_capacity, image_url, 
                        category, status, featured
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    event.title, event.description, event.short_description,
                    event.start_date, event.end_date, event.location,
                    event.venue_details, event.price, event.max_capacity,
                    event.image_url, event.category, event.status, event.featured
                ]);
            }

            console.log('✅ Sample events created');
        }

        // Insert sample promos if none exist
        const promosCount = await getQuery('SELECT COUNT(*) as count FROM promos');
        if (promosCount.count === 0) {
            const samplePromos = [
                {
                    code: 'IKOOT2024',
                    title: 'Welcome Discount',
                    description: 'Get 20% off your first event ticket!',
                    discount_type: 'percentage',
                    discount_value: 20,
                    max_usage: 100,
                    valid_from: '2024-01-01 00:00:00',
                    valid_until: '2024-12-31 23:59:59'
                },
                {
                    code: 'JAZZ50',
                    title: 'Jazz Festival Special',
                    description: '50% off for Jazz Festival tickets!',
                    discount_type: 'percentage',
                    discount_value: 50,
                    max_usage: 50,
                    valid_from: '2024-03-01 00:00:00',
                    valid_until: '2024-03-31 23:59:59'
                },
                {
                    code: 'FREEGIFT',
                    title: 'Free Event T-Shirt',
                    description: 'Get a free Ikoot event t-shirt with your next purchase!',
                    discount_type: 'fixed',
                    discount_value: 0,
                    max_usage: 200,
                    valid_from: '2024-01-01 00:00:00',
                    valid_until: '2024-12-31 23:59:59'
                }
            ];

            for (const promo of samplePromos) {
                await runQuery(`
                    INSERT INTO promos (
                        code, title, description, discount_type, discount_value,
                        max_usage, valid_from, valid_until
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    promo.code, promo.title, promo.description,
                    promo.discount_type, promo.discount_value,
                    promo.max_usage, promo.valid_from, promo.valid_until
                ]);
            }

            console.log('✅ Sample promos created');
        }
        
        // Insert sample users if none exist (other than admin)
        const usersCount = await getQuery('SELECT COUNT(*) as count FROM users WHERE role = "user"');
        if (usersCount.count === 0) {
            const bcrypt = require('bcryptjs');
            const sampleUsers = [
                {
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: await bcrypt.hash('password123', 10),
                    points: 25
                },
                {
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                    password: await bcrypt.hash('password123', 10),
                    points: 15
                },
                {
                    name: 'Bob Wilson',
                    email: 'bob@example.com',
                    password: await bcrypt.hash('password123', 10),
                    points: 10
                }
            ];
            
            for (const user of sampleUsers) {
                await runQuery(`
                    INSERT INTO users (name, email, password, points) 
                    VALUES (?, ?, ?, ?)
                `, [user.name, user.email, user.password, user.points]);
            }
            
            console.log('✅ Sample users created');
            
            // Insert sample check-ins
            const sampleCheckIns = [
                { user_email: 'john@example.com', event_title: 'Jakarta Jazz Festival', points_earned: 5, days_ago: 2 },
                { user_email: 'john@example.com', event_title: 'Food Truck Festival', points_earned: 5, days_ago: 5 },
                { user_email: 'john@example.com', event_title: 'Summer Music Festival', points_earned: 15, days_ago: 1 }, // VIP check-in
                { user_email: 'jane@example.com', event_title: 'Jakarta Jazz Festival', points_earned: 5, days_ago: 2 },
                { user_email: 'jane@example.com', event_title: 'Food Truck Festival', points_earned: 5, days_ago: 4 },
                { user_email: 'jane@example.com', event_title: 'Summer Music Festival', points_earned: 5, days_ago: 3 },
                { user_email: 'bob@example.com', event_title: 'Jakarta Jazz Festival', points_earned: 5, days_ago: 1 },
                { user_email: 'bob@example.com', event_title: 'Food Truck Festival', points_earned: 5, days_ago: 6 }
            ];
            
            for (const checkin of sampleCheckIns) {
                // Get user and event IDs
                const user = await getQuery('SELECT id FROM users WHERE email = ?', [checkin.user_email]);
                const event = await getQuery('SELECT id FROM events WHERE title = ?', [checkin.event_title]);
                
                if (user && event) {
                    const checkinDate = new Date();
                    checkinDate.setDate(checkinDate.getDate() - checkin.days_ago);
                    
                    await runQuery(`
                        INSERT INTO user_check_ins (user_id, event_id, event_title, points_earned, checked_in_at)
                        VALUES (?, ?, ?, ?, ?)
                    `, [user.id, event.id, checkin.event_title, checkin.points_earned, checkinDate.toISOString()]);
                }
            }
            
            console.log('✅ Sample check-ins created');
        }
        
        // Insert sample redemption items if none exist
        const redemptionItemsCount = await getQuery('SELECT COUNT(*) as count FROM redemption_items');
        if (redemptionItemsCount.count === 0) {
            const sampleRedemptionItems = [
                {
                    name: 'IKOOT T-Shirt',
                    description: 'Official IKOOT branded t-shirt in various sizes (S, M, L, XL). Made from high-quality cotton with comfortable fit.',
                    points_required: 500,
                    category: 'Merchandise',
                    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    stock_quantity: 50,
                    delivery_available: true,
                    pickup_available: true
                },
                {
                    name: 'Coffee Voucher',
                    description: 'Free premium coffee at selected partner cafes across Jakarta. Valid for espresso, americano, or latte.',
                    points_required: 200,
                    category: 'Food & Beverage',
                    image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    stock_quantity: -1, // unlimited
                    delivery_available: false,
                    pickup_available: true
                },
                {
                    name: 'Event Ticket Discount',
                    description: '20% discount voucher for your next event ticket purchase. Can be applied to any upcoming IKOOT event.',
                    points_required: 300,
                    category: 'Discount',
                    image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    stock_quantity: -1, // unlimited
                    delivery_available: false,
                    pickup_available: false
                },
                {
                    name: 'IKOOT Tote Bag',
                    description: 'Eco-friendly canvas tote bag with IKOOT logo. Perfect for carrying your essentials to events.',
                    points_required: 350,
                    category: 'Merchandise',
                    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    stock_quantity: 30,
                    delivery_available: true,
                    pickup_available: true
                },
                {
                    name: 'Premium Event Access',
                    description: 'VIP access to exclusive IKOOT events including backstage passes and meet & greet opportunities.',
                    points_required: 1000,
                    category: 'Experience',
                    image_url: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    stock_quantity: 10,
                    delivery_available: false,
                    pickup_available: true
                },
                {
                    name: 'Food Voucher',
                    description: 'IDR 50,000 food voucher valid at partner restaurants. Enjoy delicious meals from our curated food partners.',
                    points_required: 400,
                    category: 'Food & Beverage',
                    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    stock_quantity: -1, // unlimited
                    delivery_available: true,
                    pickup_available: true
                },
                {
                    name: 'IKOOT Water Bottle',
                    description: 'Stainless steel water bottle with IKOOT branding. BPA-free and perfect for staying hydrated at events.',
                    points_required: 250,
                    category: 'Merchandise',
                    image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    stock_quantity: 25,
                    delivery_available: true,
                    pickup_available: true
                },
                {
                    name: 'Event Photography Session',
                    description: 'Professional photo session at IKOOT events with digital copies of all photos. Perfect for your social media!',
                    points_required: 800,
                    category: 'Experience',
                    image_url: 'https://images.unsplash.com/photo-1554048612-b6ebae92138b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    stock_quantity: 5,
                    delivery_available: false,
                    pickup_available: true
                }
            ];
            
            for (const item of sampleRedemptionItems) {
                await runQuery(`
                    INSERT INTO redemption_items (
                        name, description, points_required, category, image_url,
                        stock_quantity, delivery_available, pickup_available
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    item.name, item.description, item.points_required, item.category,
                    item.image_url, item.stock_quantity, item.delivery_available, item.pickup_available
                ]);
            }
            
            console.log('✅ Sample redemption items created');
        }

    } catch (error) {
        console.error('Error inserting sample data:', error);
    }
}

// Migrate database to add missing columns
async function migrateDatabase() {
    try {
        console.log('🔄 Running database migration...');
        
        // Check if promos table exists and has the required columns
        const tableInfo = await getAllQuery("PRAGMA table_info(promos)").catch(() => []);
        const columnNames = tableInfo.map(col => col.name);
        
        // Check if discount_value has NOT NULL constraint
        const discountValueColumn = tableInfo.find(col => col.name === 'discount_value');
        const needsTableRecreation = discountValueColumn && discountValueColumn.notnull === 1;
        
        if (needsTableRecreation) {
            console.log('🔄 Recreating promos table to fix constraints...');
            
            // Create backup table
            await runQuery('DROP TABLE IF EXISTS promos_backup');
            await runQuery('CREATE TABLE promos_backup AS SELECT * FROM promos');
            
            // Drop original table
            await runQuery('DROP TABLE promos');
            
            // Recreate with correct schema
            await runQuery(`CREATE TABLE IF NOT EXISTS promos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code VARCHAR(50) UNIQUE NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                promo_type VARCHAR(20) DEFAULT 'discount',
                discount_type VARCHAR(20) DEFAULT 'percentage',
                discount_value DECIMAL(10,2),
                custom_value TEXT,
                min_purchase DECIMAL(10,2) DEFAULT 0,
                max_usage INTEGER,
                current_usage INTEGER DEFAULT 0,
                valid_from DATETIME,
                valid_until DATETIME,
                applicable_events JSON,
                status VARCHAR(20) DEFAULT 'active',
                qr_code TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
            
            // Restore existing data
            const backupData = await getAllQuery('SELECT * FROM promos_backup');
            for (const row of backupData) {
                // Build insert statement dynamically based on available columns
                const columns = Object.keys(row).filter(key => key !== 'id');
                const placeholders = columns.map(() => '?').join(', ');
                const values = columns.map(col => row[col]);
                
                await runQuery(`
                    INSERT INTO promos (${columns.join(', ')}) 
                    VALUES (${placeholders})
                `, values);
            }
            
            // Clean up backup
            await runQuery('DROP TABLE promos_backup');
            console.log('✅ Table recreation completed');
        } else {
            // Just add missing columns if table structure is OK
            const requiredColumns = [
                { name: 'promo_type', type: 'VARCHAR(20)', default: "'discount'" },
                { name: 'custom_value', type: 'TEXT', default: null },
                { name: 'qr_code', type: 'TEXT', default: null }
            ];
            
            for (const column of requiredColumns) {
                if (!columnNames.includes(column.name)) {
                    console.log(`Adding missing column: ${column.name}`);
                    let sql = `ALTER TABLE promos ADD COLUMN ${column.name} ${column.type}`;
                    if (column.default !== null) {
                        sql += ` DEFAULT ${column.default}`;
                    }
                    await runQuery(sql);
                    console.log(`✅ Added column: ${column.name}`);
                }
            }
        }
        
        console.log('✅ Database migration completed');
    } catch (error) {
        console.error('❌ Database migration error:', error);
        // Don't throw error, migration failures shouldn't stop the app
    }
}

// Main initialization function
async function initDatabase() {
    try {
        await initDB();
        await createTables();
        await migrateDatabase(); // Run migration after table creation
        await insertSampleData();
        console.log('✅ Database initialization complete');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

// Close database connection
function closeDatabase() {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Database connection closed');
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
}

module.exports = {
    initDatabase,
    closeDatabase,
    runQuery,
    getAllQuery,
    getQuery,
    db: () => db
};