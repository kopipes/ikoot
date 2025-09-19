const express = require('express');
const { getAllQuery, getQuery, runQuery } = require('../config/database');
const QRCode = require('qrcode');

const router = express.Router();

// Function to generate promo QR code
async function generateQRCode(code) {
    try {
        const qrData = `IKOOT_PROMO:${code}`;
        console.log(`Generating PROMO QR with data: ${qrData}`);
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
            type: 'image/png',
            width: 300,
            margin: 2,
            color: {
                dark: '#F57C00',  // Orange for promos
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
        });
        return qrCodeDataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        const fallbackSvg = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="300" fill="white" stroke="#ddd" stroke-width="2"/>
            <text x="150" y="130" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">QR Code Error</text>
            <text x="150" y="160" text-anchor="middle" font-family="Arial" font-size="14" fill="#666">${code}</text>
            <text x="150" y="190" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">Please regenerate</text>
        </svg>`;
        return 'data:image/svg+xml;base64,' + Buffer.from(fallbackSvg).toString('base64');
    }
}

// Get all promos
router.get('/', async (req, res) => {
    try {
        const promos = await getAllQuery('SELECT * FROM promos ORDER BY created_at DESC');
        
        res.json({
            success: true,
            promos
        });
    } catch (error) {
        console.error('Get promos error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get promo by code
router.get('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        
        const promo = await getQuery('SELECT * FROM promos WHERE code = ? AND status = "active"', [code]);
        
        if (!promo) {
            return res.status(404).json({
                success: false,
                message: 'Promo code not found or inactive'
            });
        }

        res.json({
            success: true,
            promo
        });
    } catch (error) {
        console.error('Get promo error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Create new promo (accessible via both /api/promos/admin and /api/admin/promos)
router.post('/admin', async (req, res) => {
    await createPromo(req, res);
});

// Also handle direct admin access
router.post('/', async (req, res) => {
    // Only allow this if the route comes from /api/admin/promos
    if (req.baseUrl.includes('/admin/promos')) {
        await createPromo(req, res);
    } else {
        res.status(404).json({ success: false, message: 'Route not found' });
    }
});

// Create promo function
async function createPromo(req, res) {
    try {
        const {
            code, title, description, promo_type, discount_type, discount_value, 
            custom_value, min_purchase, max_usage, valid_from, valid_until, applicable_events
        } = req.body;
        
        // Check if code already exists
        const existingPromo = await getQuery('SELECT id FROM promos WHERE code = ?', [code.toUpperCase()]);
        if (existingPromo) {
            return res.status(400).json({
                success: false,
                message: 'Promo code already exists'
            });
        }
        
        // Generate QR code
        const qrCodeDataUrl = await generateQRCode(code.toUpperCase());
        
        // Insert promo
        const result = await runQuery(`
            INSERT INTO promos (
                code, title, description, promo_type, discount_type, discount_value,
                custom_value, min_purchase, max_usage, current_usage, valid_from, valid_until,
                applicable_events, status, qr_code
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 'active', ?)
        `, [
            code.toUpperCase(), title, description, promo_type || 'discount', 
            discount_type, discount_value, custom_value,
            min_purchase || 0, max_usage || null, valid_from, valid_until,
            applicable_events ? JSON.stringify(applicable_events) : null, qrCodeDataUrl
        ]);
        
        // Get created promo
        const newPromo = await getQuery('SELECT * FROM promos WHERE id = ?', [result.lastID]);
        
        res.json({
            success: true,
            message: 'Promo created successfully',
            promo: newPromo
        });
        
    } catch (error) {
        console.error('Create promo error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create promo',
            error: error.message
        });
    }
}

// Update promo
router.put('/admin/:id', async (req, res) => {
    await updatePromo(req, res);
});

// Also handle direct admin access for update
router.put('/:id', async (req, res) => {
    if (req.baseUrl.includes('/admin/promos')) {
        await updatePromo(req, res);
    } else {
        res.status(404).json({ success: false, message: 'Route not found' });
    }
});

// Update promo function
async function updatePromo(req, res) {
    try {
        const promoId = parseInt(req.params.id);
        const {
            code, title, description, promo_type, discount_type, discount_value,
            custom_value, min_purchase, max_usage, valid_from, valid_until, status, applicable_events
        } = req.body;
        
        // Check if promo exists
        const existingPromo = await getQuery('SELECT * FROM promos WHERE id = ?', [promoId]);
        if (!existingPromo) {
            return res.status(404).json({
                success: false,
                message: 'Promo not found'
            });
        }
        
        // Check if code is being changed and if new code already exists
        if (code && code.toUpperCase() !== existingPromo.code) {
            const codeExists = await getQuery('SELECT id FROM promos WHERE code = ? AND id != ?', [code.toUpperCase(), promoId]);
            if (codeExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Promo code already exists'
                });
            }
        }
        
        const updatedCode = code ? code.toUpperCase() : existingPromo.code;
        
        // Generate new QR code if code has changed
        let qrCodeDataUrl = existingPromo.qr_code;
        if (updatedCode !== existingPromo.code) {
            qrCodeDataUrl = await generateQRCode(updatedCode);
        }
        
        // Update promo
        await runQuery(`
            UPDATE promos 
            SET code = COALESCE(?, code),
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                promo_type = COALESCE(?, promo_type),
                discount_type = COALESCE(?, discount_type),
                discount_value = COALESCE(?, discount_value),
                custom_value = COALESCE(?, custom_value),
                min_purchase = COALESCE(?, min_purchase),
                max_usage = COALESCE(?, max_usage),
                valid_from = COALESCE(?, valid_from),
                valid_until = COALESCE(?, valid_until),
                status = COALESCE(?, status),
                applicable_events = COALESCE(?, applicable_events),
                qr_code = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            updatedCode, title, description, promo_type, discount_type, discount_value,
            custom_value, min_purchase, max_usage, valid_from, valid_until, status,
            applicable_events ? JSON.stringify(applicable_events) : null,
            qrCodeDataUrl, promoId
        ]);
        
        // Get updated promo
        const updatedPromo = await getQuery('SELECT * FROM promos WHERE id = ?', [promoId]);
        
        res.json({
            success: true,
            message: 'Promo updated successfully',
            promo: updatedPromo
        });
        
    } catch (error) {
        console.error('Update promo error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update promo',
            error: error.message
        });
    }
}

// Delete promo
router.delete('/admin/:id', async (req, res) => {
    await deletePromo(req, res);
});

// Also handle direct admin access for delete
router.delete('/:id', async (req, res) => {
    if (req.baseUrl.includes('/admin/promos')) {
        await deletePromo(req, res);
    } else {
        res.status(404).json({ success: false, message: 'Route not found' });
    }
});

// Delete promo function
async function deletePromo(req, res) {
    try {
        const promoId = parseInt(req.params.id);
        
        // Check if promo exists
        const promo = await getQuery('SELECT id, code FROM promos WHERE id = ?', [promoId]);
        if (!promo) {
            return res.status(404).json({
                success: false,
                message: 'Promo not found'
            });
        }
        
        // Delete related user_promos first (if that table exists)
        await runQuery('DELETE FROM user_promos WHERE promo_id = ?', [promoId]).catch(() => {});
        
        // Delete promo
        await runQuery('DELETE FROM promos WHERE id = ?', [promoId]);
        
        res.json({
            success: true,
            message: 'Promo deleted successfully'
        });
    } catch (error) {
        console.error('Delete promo error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete promo',
            error: error.message
        });
    }
}

// Use promo (QR scan result)
router.post('/:code/use', async (req, res) => {
    try {
        const { code } = req.params;
        const { user_id, user_email } = req.body;
        
        const promo = await getQuery('SELECT * FROM promos WHERE code = ?', [code.toUpperCase()]);
        
        if (!promo) {
            return res.status(404).json({
                success: false,
                message: 'Promo not found'
            });
        }
        
        // Check if promo is still valid
        if (promo.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Promo is not active'
            });
        }
        
        // Check expiry date
        if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Promo has expired'
            });
        }
        
        // Check usage limit
        if (promo.max_usage && promo.current_usage >= promo.max_usage) {
            return res.status(400).json({
                success: false,
                message: 'Promo usage limit reached'
            });
        }
        
        // Check if user already used this promo
        const userPromo = await getQuery(`
            SELECT id FROM user_promos 
            WHERE promo_id = ? AND (user_id = ? OR user_id IN (
                SELECT id FROM users WHERE email = ?
            ))
        `, [promo.id, user_id, user_email]).catch(() => null);
        
        if (userPromo) {
            return res.status(400).json({
                success: false,
                message: 'You have already used this promo'
            });
        }
        
        // Find or create user
        let user = await getQuery('SELECT * FROM users WHERE id = ? OR email = ?', [user_id, user_email]);
        if (!user && user_email) {
            const result = await runQuery(`
                INSERT INTO users (name, email, password, role, points, status)
                VALUES (?, ?, 'temp123', 'user', 0, 'active')
            `, [user_email.split('@')[0], user_email]);
            user = await getQuery('SELECT * FROM users WHERE id = ?', [result.lastID]);
        }
        
        // Record promo usage
        await runQuery('UPDATE promos SET current_usage = current_usage + 1 WHERE id = ?', [promo.id]);
        
        // Record user promo usage if user_promos table exists
        if (user) {
            await runQuery(`
                INSERT INTO user_promos (user_id, promo_id, claimed_at, status)
                VALUES (?, ?, CURRENT_TIMESTAMP, 'claimed')
            `, [user.id, promo.id]).catch(() => {});
        }
        
        res.json({
            success: true,
            message: 'Promo used successfully!',
            promo: {
                title: promo.title,
                description: promo.description,
                discount_type: promo.discount_type,
                discount_value: promo.discount_value
            }
        });
        
    } catch (error) {
        console.error('Use promo error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to use promo',
            error: error.message
        });
    }
});

// Get promo QR code
router.get('/:id/qr', async (req, res) => {
    try {
        const promoId = parseInt(req.params.id);
        console.log(`PROMO QR REQUEST: Promo ID ${promoId}`);
        const promo = await getQuery('SELECT qr_code, code FROM promos WHERE id = ?', [promoId]);
        
        if (!promo) {
            return res.status(404).json({
                success: false,
                message: 'Promo not found'
            });
        }
        
        // Generate QR code if it doesn't exist
        if (!promo.qr_code) {
            const qrCode = await generateQRCode(promo.code);
            await runQuery('UPDATE promos SET qr_code = ? WHERE id = ?', [qrCode, promoId]);
            promo.qr_code = qrCode;
        }
        
        // Handle both PNG and SVG data URLs
        let contentType = 'image/png';
        let base64Data = '';
        
        if (promo.qr_code.startsWith('data:image/png;base64,')) {
            base64Data = promo.qr_code.replace('data:image/png;base64,', '');
            contentType = 'image/png';
        } else if (promo.qr_code.startsWith('data:image/svg+xml;base64,')) {
            base64Data = promo.qr_code.replace('data:image/svg+xml;base64,', '');
            contentType = 'image/svg+xml';
        } else {
            throw new Error('Invalid QR code format');
        }
        
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', imageBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(imageBuffer);
        
    } catch (error) {
        console.error('Promo QR endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve QR code',
            error: error.message
        });
    }
});

module.exports = router;
