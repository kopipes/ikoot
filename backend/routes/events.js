const express = require('express');
const { getAllQuery, getQuery, runQuery } = require('../config/database');
const QRCode = require('qrcode');

const router = express.Router();

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

// Get all events with optional filters
router.get('/', async (req, res) => {
    try {
        const { status, category, featured, limit } = req.query;
        
        let sql = 'SELECT * FROM events WHERE 1=1';
        const params = [];

        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }

        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }

        if (featured) {
            sql += ' AND featured = ?';
            params.push(featured === 'true' ? 1 : 0);
        }

        sql += ' ORDER BY created_at DESC';

        if (limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        const events = await getAllQuery(sql, params);

        res.json({
            success: true,
            events
        });

    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get featured event
router.get('/featured', async (req, res) => {
    try {
        const event = await getQuery(`
            SELECT * FROM events 
            WHERE featured = 1 
            ORDER BY start_date ASC 
            LIMIT 1
        `);
        
        if (!event) {
            // Fallback to first live or upcoming event
            const fallbackEvent = await getQuery(`
                SELECT * FROM events 
                WHERE status IN ('live', 'upcoming') 
                ORDER BY start_date ASC 
                LIMIT 1
            `);
            
            res.json({
                success: !!fallbackEvent,
                event: fallbackEvent
            });
        } else {
            res.json({
                success: true,
                event
            });
        }

    } catch (error) {
        console.error('Get featured event error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get current/live events
router.get('/current', async (req, res) => {
    try {
        const events = await getAllQuery(`
            SELECT * FROM events 
            WHERE status IN ('live', 'ongoing') 
            ORDER BY start_date ASC 
            LIMIT 10
        `);

        res.json({
            success: true,
            events
        });

    } catch (error) {
        console.error('Get current events error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get upcoming events
router.get('/upcoming', async (req, res) => {
    try {
        const events = await getAllQuery(`
            SELECT * FROM events 
            WHERE status = 'upcoming' 
            ORDER BY start_date ASC 
            LIMIT 10
        `);

        res.json({
            success: true,
            events
        });

    } catch (error) {
        console.error('Get upcoming events error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get events by status (keep for backwards compatibility)
router.get('/status/:status', async (req, res) => {
    try {
        const { status } = req.params;
        const { limit = 10 } = req.query;
        
        const events = await getAllQuery(
            'SELECT * FROM events WHERE status = ? ORDER BY start_date ASC LIMIT ?',
            [status, parseInt(limit)]
        );

        res.json({
            success: true,
            events
        });

    } catch (error) {
        console.error('Get events by status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get single event by ID (must be last to avoid conflicts with named routes)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const event = await getQuery('SELECT * FROM events WHERE id = ?', [id]);
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.json({
            success: true,
            event
        });

    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Admin CRUD Operations

// Create new event
router.post('/admin', async (req, res) => {
    try {
        const {
            title, description, short_description, start_date, end_date,
            location, venue_details, price, max_capacity, category,
            status, featured, image_url
        } = req.body;

        // Insert event into database
        const result = await runQuery(`
            INSERT INTO events (
                title, description, short_description, start_date, end_date,
                location, venue_details, price, max_capacity, category,
                status, featured, image_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title, description, short_description, start_date, end_date,
            location, venue_details || '', parseFloat(price) || 0, 
            parseInt(max_capacity) || null, category || 'Other',
            status || 'upcoming', featured === true || featured === 'true' ? 1 : 0,
            image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ]);

        // Generate QR code for the new event
        const eventId = result.lastID;
        const checkInQR = await generateEventQRCode(eventId);
        
        // Update event with QR code
        await runQuery('UPDATE events SET qr_code = ? WHERE id = ?', [checkInQR, eventId]);

        // Get the created event
        const newEvent = await getQuery('SELECT * FROM events WHERE id = ?', [eventId]);

        res.json({
            success: true,
            message: 'Event created successfully',
            event: newEvent
        });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create event',
            error: error.message
        });
    }
});

// Update event
router.put('/admin/:id', async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        
        const {
            title, description, short_description, start_date, end_date,
            location, venue_details, price, max_capacity, category,
            status, featured, image_url
        } = req.body;

        // Check if event exists
        const eventExists = await getQuery('SELECT id FROM events WHERE id = ?', [eventId]);
        
        if (!eventExists) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Update the event
        await runQuery(`
            UPDATE events 
            SET title = COALESCE(?, title),
                description = COALESCE(?, description),
                short_description = COALESCE(?, short_description),
                start_date = COALESCE(?, start_date),
                end_date = COALESCE(?, end_date),
                location = COALESCE(?, location),
                venue_details = COALESCE(?, venue_details),
                price = COALESCE(?, price),
                max_capacity = COALESCE(?, max_capacity),
                category = COALESCE(?, category),
                status = COALESCE(?, status),
                featured = COALESCE(?, featured),
                image_url = COALESCE(?, image_url),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            title, description, short_description, start_date, end_date,
            location, venue_details, parseFloat(price) || null,
            parseInt(max_capacity) || null, category,
            status, featured === true || featured === 'true' ? 1 : 0,
            image_url, eventId
        ]);

        // Get updated event
        const updatedEvent = await getQuery('SELECT * FROM events WHERE id = ?', [eventId]);

        res.json({
            success: true,
            message: 'Event updated successfully',
            event: updatedEvent
        });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update event',
            error: error.message
        });
    }
});

// Delete event
router.delete('/admin/:id', async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);

        // Check if event exists
        const event = await getQuery('SELECT id, title FROM events WHERE id = ?', [eventId]);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Delete event's check-ins first (foreign key constraint)
        await runQuery('DELETE FROM user_check_ins WHERE event_id = ?', [eventId]);

        // Delete event
        await runQuery('DELETE FROM events WHERE id = ?', [eventId]);

        res.json({
            success: true,
            message: 'Event deleted successfully',
            event: event
        });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete event',
            error: error.message
        });
    }
});

// Loyalty System - Event Check-in with proper database integration
router.post('/:id/checkin', async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const { user_id, user_email } = req.body;

        console.log(`🎯 Check-in attempt: Event ${eventId}, User: ${user_email || user_id}`);

        if (!eventId || !user_email) {
            return res.status(400).json({
                success: false,
                message: 'Event ID and user_email are required'
            });
        }

        // Check if event exists in database first
        const event = await getQuery('SELECT * FROM events WHERE id = ?', [eventId]);
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: `Event ${eventId} not found`,
                availableEvents: []
            });
        }

        // Find or create user
        let user = await getQuery('SELECT * FROM users WHERE email = ?', [user_email]);
        
        if (!user) {
            // Create new user if they don't exist
            const bcrypt = require('bcryptjs');
            const defaultPassword = await bcrypt.hash('password123', 10);
            const userName = user_email.split('@')[0];
            
            const result = await runQuery(
                'INSERT INTO users (name, email, password, points) VALUES (?, ?, ?, ?)',
                [userName, user_email, defaultPassword, 0]
            );
            
            user = await getQuery('SELECT * FROM users WHERE id = ?', [result.lastID]);
            console.log(`✅ New user created: ${user_email}`);
        }

        // Check if user has already checked in to this event
        const existingCheckin = await getQuery(
            'SELECT * FROM user_check_ins WHERE user_id = ? AND event_id = ?',
            [user.id, eventId]
        );

        if (existingCheckin) {
            return res.status(409).json({
                success: false,
                message: `You have already checked in to ${event.title}!`,
                user_points: user.points,
                event: {
                    id: eventId,
                    title: event.title,
                    location: event.location
                }
            });
        }

        // Award points for check-in
        const pointsEarned = 5;
        const newTotalPoints = user.points + pointsEarned;

        // Record the check-in
        await runQuery(
            'INSERT INTO user_check_ins (user_id, event_id, event_title, points_earned) VALUES (?, ?, ?, ?)',
            [user.id, eventId, event.title, pointsEarned]
        );

        // Update user's total points
        await runQuery(
            'UPDATE users SET points = ? WHERE id = ?',
            [newTotalPoints, user.id]
        );

        // Get updated user data
        const updatedUser = await getQuery('SELECT * FROM users WHERE id = ?', [user.id]);
        
        const result = {
            success: true,
            message: `Check-in successful! You earned ${pointsEarned} points at ${event.title}!`,
            points_earned: pointsEarned,
            total_points: newTotalPoints,
            event: {
                id: eventId,
                title: event.title,
                location: event.location
            },
            user: {
                id: user.id,
                name: updatedUser.name,
                email: updatedUser.email,
                points: newTotalPoints
            },
            timestamp: new Date().toISOString(),
            check_in_id: `checkin_${eventId}_${user.id}_${Date.now()}`,
            note: 'Successfully checked in to event - points awarded and saved to database'
        };
        
        console.log(`✅ Check-in successful: ${user_email} → Event ${eventId} (${event.title}) → ${pointsEarned} points awarded (Total: ${newTotalPoints})`);
        
        return res.status(200).json(result);
        
    } catch (error) {
        console.error('❌ Check-in error:', error);
        res.status(500).json({
            success: false,
            message: 'Check-in failed due to server error',
            error: error.message
        });
    }
});

// Get event QR code
router.get('/:id/qr', async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        console.log(`EVENT QR REQUEST: Event ID ${eventId}`);
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
});

module.exports = router;
