// Vercel-compatible event check-in using file-based storage
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');

// File paths in /tmp for serverless
const EVENTS_FILE = '/tmp/events.json';
const USERS_FILE = '/tmp/users.json';
const CHECKINS_FILE = '/tmp/checkins.json';

async function readJsonFile(filePath, defaultValue = []) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log(`File ${filePath} not found, using default:`, defaultValue);
        return defaultValue;
    }
}

async function writeJsonFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function findEvent(eventId) {
    const events = await readJsonFile(EVENTS_FILE, []);
    return events.find(event => event.id == eventId);
}

async function findOrCreateUser(userEmail) {
    const users = await readJsonFile(USERS_FILE, []);
    let user = users.find(u => u.email === userEmail);
    
    if (!user) {
        // Create new user
        const hashedPassword = await bcrypt.hash('temp123', 10);
        user = {
            id: users.length + 1,
            name: userEmail.split('@')[0],
            email: userEmail,
            password: hashedPassword,
            role: 'user',
            points: 0,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        users.push(user);
        await writeJsonFile(USERS_FILE, users);
        console.log(`✅ Created new user: ${userEmail}`);
    }
    
    return user;
}

async function hasUserCheckedIn(userId, eventId) {
    const checkins = await readJsonFile(CHECKINS_FILE, []);
    return checkins.some(checkin => checkin.user_id === userId && checkin.event_id === eventId);
}

async function createCheckIn(userId, eventId, eventTitle, pointsEarned) {
    const checkins = await readJsonFile(CHECKINS_FILE, []);
    
    const checkIn = {
        id: checkins.length + 1,
        user_id: userId,
        event_id: eventId,
        event_title: eventTitle,
        points_earned: pointsEarned,
        checked_in_at: new Date().toISOString()
    };
    
    checkins.push(checkIn);
    await writeJsonFile(CHECKINS_FILE, checkins);
    
    return checkIn;
}

async function updateUserPoints(userId, pointsToAdd) {
    const users = await readJsonFile(USERS_FILE, []);
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        users[userIndex].points = (users[userIndex].points || 0) + pointsToAdd;
        users[userIndex].updated_at = new Date().toISOString();
        await writeJsonFile(USERS_FILE, users);
        return users[userIndex];
    }
    
    return null;
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed. Use POST for check-in.'
        });
    }
    
    try {
        // Get event ID from URL parameter
        const eventId = parseInt(req.query.id);
        const { user_email } = req.body;

        console.log(`🎯 Check-in attempt: Event ${eventId}, User: ${user_email}`);
        
        if (!user_email) {
            return res.status(400).json({
                success: false,
                message: 'User email is required'
            });
        }
        
        // Find the event
        const event = await findEvent(eventId);
        if (!event) {
            console.log(`❌ Event ${eventId} not found`);
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        
        console.log(`✅ Found event: ${event.title}`);
        
        // Find or create user
        const user = await findOrCreateUser(user_email);
        console.log(`✅ User ready: ${user.email} (Points: ${user.points})`);
        
        // Check if user already checked in to this event
        if (await hasUserCheckedIn(user.id, eventId)) {
            console.log(`⚠️ User ${user.email} already checked in to event ${eventId}`);
            return res.status(400).json({
                success: false,
                message: 'You have already checked in to this event',
                user_points: user.points
            });
        }
        
        // Award points (5 points per event check-in)
        const pointsEarned = 5;
        
        // Create check-in record
        await createCheckIn(user.id, eventId, event.title, pointsEarned);
        console.log(`✅ Check-in record created for user ${user.id} event ${eventId}`);
        
        // Update user points
        const updatedUser = await updateUserPoints(user.id, pointsEarned);
        console.log(`✅ User points updated: ${user.email} now has ${updatedUser.points} points`);
        
        console.log(`🎉 Check-in successful: ${user.email} got ${pointsEarned} points for ${event.title}`);
        
        res.json({
            success: true,
            message: `Check-in successful! You earned ${pointsEarned} points!`,
            points_earned: pointsEarned,
            total_points: updatedUser.points,
            event: {
                id: event.id,
                title: event.title,
                location: event.location
            },
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                points: updatedUser.points
            },
            storage_info: {
                method: 'File-based storage (/tmp)',
                vercel_compatible: true
            }
        });
        
    } catch (error) {
        console.error('❌ Check-in error:', error);
        res.status(500).json({
            success: false,
            message: 'Check-in failed',
            error: error.message,
            stack: error.stack
        });
    }
};