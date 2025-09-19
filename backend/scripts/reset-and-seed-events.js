const { runQuery, getAllQuery, initDatabase } = require('../config/database');
const QRCode = require('qrcode');

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

// Sample events data
const sampleEvents = [
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
        status: "upcoming",
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
        title: "Startup Pitch Competition",
        description: "Young entrepreneurs compete for funding and mentorship opportunities. Watch innovative startups present their business ideas to a panel of expert judges and investors.",
        short_description: "Entrepreneurs compete for funding and mentorship",
        start_date: "2024-05-01T13:00:00.000Z",
        end_date: "2024-05-01T18:00:00.000Z",
        location: "Cyber 2 Tower, Jakarta",
        venue_details: "Conference Room Level 20",
        price: 100000,
        max_capacity: 200,
        category: "Business",
        status: "upcoming",
        featured: 0,
        image_url: "https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
        title: "Art & Design Exhibition",
        description: "Contemporary art exhibition featuring works by emerging and established Indonesian artists. Explore paintings, sculptures, digital art, and interactive installations.",
        short_description: "Contemporary art by Indonesian artists",
        start_date: "2024-05-05T10:00:00.000Z",
        end_date: "2024-05-12T19:00:00.000Z",
        location: "National Gallery, Jakarta",
        venue_details: "Gallery Halls 1-3",
        price: 75000,
        max_capacity: 300,
        category: "Arts",
        status: "upcoming",
        featured: 0,
        image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
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
        title: "Photography Workshop",
        description: "Master the art of photography with professional photographers. Learn advanced techniques in portrait, landscape, and street photography with hands-on practice sessions.",
        short_description: "Advanced photography techniques with professionals",
        start_date: "2024-05-15T09:00:00.000Z",
        end_date: "2024-05-15T16:00:00.000Z",
        location: "Creative Hub Jakarta",
        venue_details: "Workshop Studio A",
        price: 300000,
        max_capacity: 25,
        category: "Education",
        status: "upcoming",
        featured: 0,
        image_url: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
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

async function resetAndSeedDatabase() {
    try {
        console.log('🔌 Initializing database connection...');
        await initDatabase();
        console.log('✅ Database initialized');
        
        console.log('🗑️  Clearing existing data...');
        
        // Clear existing data (in proper order due to foreign key constraints)
        await runQuery('DELETE FROM user_check_ins');
        await runQuery('DELETE FROM events');
        
        console.log('✅ Existing data cleared');
        
        console.log('🌱 Seeding new events...');
        
        for (let i = 0; i < sampleEvents.length; i++) {
            const event = sampleEvents[i];
            
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
        }
        
        console.log('🎉 Database seeding completed successfully!');
        
        // Display summary
        const events = await getAllQuery('SELECT id, title, status, featured FROM events ORDER BY id');
        console.log('\n📊 Summary of created events:');
        console.log('┌─────┬────────────────────────────────────┬──────────┬──────────┐');
        console.log('│ ID  │ Title                              │ Status   │ Featured │');
        console.log('├─────┼────────────────────────────────────┼──────────┼──────────┤');
        
        events.forEach(event => {
            const id = String(event.id).padEnd(3);
            const title = event.title.length > 34 ? event.title.substring(0, 31) + '...' : event.title.padEnd(34);
            const status = event.status.padEnd(8);
            const featured = event.featured ? 'Yes' : 'No';
            console.log(`│ ${id} │ ${title} │ ${status} │ ${featured.padEnd(8)} │`);
        });
        
        console.log('└─────┴────────────────────────────────────┴──────────┴──────────┘');
        
        console.log('\n🔗 Test QR codes available at:');
        events.forEach(event => {
            console.log(`   Event ${event.id}: http://localhost:3001/api/events/${event.id}/qr`);
        });
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seeding
resetAndSeedDatabase();