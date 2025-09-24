const express = require('express');
const { getAllQuery, getQuery, runQuery } = require('../config/database');

const router = express.Router();

// Get all redemption items (active only for users)
router.get('/items', async (req, res) => {
    try {
        const { category, admin } = req.query;
        
        let sql = 'SELECT * FROM redemption_items WHERE 1=1';
        const params = [];

        // Only show active items for regular users
        if (!admin || admin !== 'true') {
            sql += ' AND is_active = 1';
        }

        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }

        sql += ' ORDER BY points_required ASC';

        const items = await getAllQuery(sql, params);

        res.json({
            success: true,
            items
        });

    } catch (error) {
        console.error('Get redemption items error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get single redemption item
router.get('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const item = await getQuery('SELECT * FROM redemption_items WHERE id = ?', [id]);
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Redemption item not found'
            });
        }

        res.json({
            success: true,
            item
        });

    } catch (error) {
        console.error('Get redemption item error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// User redeem item
router.post('/redeem', async (req, res) => {
    try {
        const {
            user_id,
            redemption_item_id,
            delivery_method,
            pickup_event_id,
            delivery_address,
            delivery_phone,
            delivery_notes
        } = req.body;

        // Validate required fields
        if (!user_id || !redemption_item_id || !delivery_method) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Get user's current points
        const user = await getQuery('SELECT points FROM users WHERE id = ?', [user_id]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get redemption item
        const item = await getQuery('SELECT * FROM redemption_items WHERE id = ? AND is_active = 1', [redemption_item_id]);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Redemption item not found or inactive'
            });
        }

        // Check if user has enough points
        if (user.points < item.points_required) {
            return res.status(400).json({
                success: false,
                message: `Insufficient points. You need ${item.points_required} points but only have ${user.points} points.`
            });
        }

        // Check stock if limited
        if (item.stock_quantity !== -1 && item.stock_quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'This item is out of stock'
            });
        }

        // Validate delivery method options
        if (delivery_method === 'pickup') {
            if (!pickup_event_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Please select a pickup event'
                });
            }
            
            // Check if pickup is available for this item
            if (!item.pickup_available) {
                return res.status(400).json({
                    success: false,
                    message: 'Pickup is not available for this item'
                });
            }

            // Verify event exists and is live
            const event = await getQuery('SELECT * FROM events WHERE id = ? AND status = "live"', [pickup_event_id]);
            if (!event) {
                return res.status(400).json({
                    success: false,
                    message: 'Selected pickup event is not available'
                });
            }
        } else if (delivery_method === 'delivery') {
            if (!delivery_address || !delivery_phone) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide delivery address and phone number'
                });
            }
            
            // Check if delivery is available for this item
            if (!item.delivery_available) {
                return res.status(400).json({
                    success: false,
                    message: 'Delivery is not available for this item'
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid delivery method'
            });
        }

        // Begin transaction
        // Create redemption record
        const redemptionResult = await runQuery(`
            INSERT INTO user_redemptions (
                user_id, redemption_item_id, points_used, delivery_method,
                pickup_event_id, delivery_address, delivery_phone, delivery_notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            user_id, redemption_item_id, item.points_required, delivery_method,
            delivery_method === 'pickup' ? pickup_event_id : null,
            delivery_method === 'delivery' ? delivery_address : null,
            delivery_method === 'delivery' ? delivery_phone : null,
            delivery_notes || null
        ]);

        // Deduct points from user
        await runQuery('UPDATE users SET points = points - ? WHERE id = ?', [item.points_required, user_id]);

        // Update stock if limited
        if (item.stock_quantity !== -1) {
            await runQuery('UPDATE redemption_items SET stock_quantity = stock_quantity - 1 WHERE id = ?', [redemption_item_id]);
        }

        // Get the created redemption with item details
        const redemption = await getQuery(`
            SELECT r.*, ri.name as item_name, ri.description, ri.image_url,
                   e.title as event_title, e.location as event_location
            FROM user_redemptions r
            JOIN redemption_items ri ON r.redemption_item_id = ri.id
            LEFT JOIN events e ON r.pickup_event_id = e.id
            WHERE r.id = ?
        `, [redemptionResult.id]);

        res.json({
            success: true,
            message: 'Redemption successful!',
            redemption
        });

    } catch (error) {
        console.error('Redeem item error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process redemption'
        });
    }
});

// Get user's redemption history
router.get('/user/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        
        const redemptions = await getAllQuery(`
            SELECT r.*, ri.name as item_name, ri.description, ri.image_url,
                   e.title as event_title, e.location as event_location
            FROM user_redemptions r
            JOIN redemption_items ri ON r.redemption_item_id = ri.id
            LEFT JOIN events e ON r.pickup_event_id = e.id
            WHERE r.user_id = ?
            ORDER BY r.redeemed_at DESC
        `, [user_id]);

        res.json({
            success: true,
            redemptions
        });

    } catch (error) {
        console.error('Get user redemptions error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get live events for pickup option
router.get('/pickup-events', async (req, res) => {
    try {
        const events = await getAllQuery(`
            SELECT id, title, location, start_date, end_date
            FROM events 
            WHERE status = 'live'
            ORDER BY start_date ASC
        `);

        res.json({
            success: true,
            events
        });

    } catch (error) {
        console.error('Get pickup events error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// ADMIN ROUTES

// Create redemption item (admin only)
router.post('/admin/items', async (req, res) => {
    try {
        const {
            name,
            description,
            points_required,
            category,
            image_url,
            stock_quantity,
            delivery_available,
            pickup_available
        } = req.body;

        if (!name || !points_required) {
            return res.status(400).json({
                success: false,
                message: 'Name and points required are mandatory'
            });
        }

        const result = await runQuery(`
            INSERT INTO redemption_items (
                name, description, points_required, category, image_url, 
                stock_quantity, delivery_available, pickup_available
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name, description, parseInt(points_required), category || 'General',
            image_url || 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            stock_quantity === '' || stock_quantity == null ? -1 : parseInt(stock_quantity),
            delivery_available !== false, pickup_available !== false
        ]);

        const newItem = await getQuery('SELECT * FROM redemption_items WHERE id = ?', [result.id]);

        res.json({
            success: true,
            message: 'Redemption item created successfully',
            item: newItem
        });

    } catch (error) {
        console.error('Create redemption item error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create redemption item'
        });
    }
});

// Update redemption item (admin only)
router.put('/admin/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            points_required,
            category,
            image_url,
            stock_quantity,
            is_active,
            delivery_available,
            pickup_available
        } = req.body;

        const result = await runQuery(`
            UPDATE redemption_items SET
                name = ?, description = ?, points_required = ?, category = ?,
                image_url = ?, stock_quantity = ?, is_active = ?,
                delivery_available = ?, pickup_available = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            name, description, parseInt(points_required), category,
            image_url, stock_quantity === '' || stock_quantity == null ? -1 : parseInt(stock_quantity),
            is_active !== false, delivery_available !== false, pickup_available !== false, id
        ]);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Redemption item not found'
            });
        }

        const updatedItem = await getQuery('SELECT * FROM redemption_items WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Redemption item updated successfully',
            item: updatedItem
        });

    } catch (error) {
        console.error('Update redemption item error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update redemption item'
        });
    }
});

// Delete redemption item (admin only)
router.delete('/admin/items/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await runQuery('DELETE FROM redemption_items WHERE id = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Redemption item not found'
            });
        }

        res.json({
            success: true,
            message: 'Redemption item deleted successfully'
        });

    } catch (error) {
        console.error('Delete redemption item error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete redemption item'
        });
    }
});

// Cancel redemption (user)
router.put('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;
        
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        // Get redemption details
        const redemption = await getQuery(`
            SELECT r.*, ri.name as item_name, ri.points_required
            FROM user_redemptions r
            JOIN redemption_items ri ON r.redemption_item_id = ri.id
            WHERE r.id = ? AND r.user_id = ?
        `, [id, user_id]);
        
        if (!redemption) {
            return res.status(404).json({
                success: false,
                message: 'Redemption not found or not authorized'
            });
        }
        
        // Only allow cancellation for pending or processing orders
        if (!['pending', 'processing'].includes(redemption.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel ${redemption.status} orders. Only pending and processing orders can be cancelled.`
            });
        }
        
        // Update redemption status to cancelled
        await runQuery(`
            UPDATE user_redemptions SET
                status = 'cancelled', 
                admin_notes = 'Cancelled by user',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [id]);
        
        // Refund points to user
        await runQuery('UPDATE users SET points = points + ? WHERE id = ?', [redemption.points_used, user_id]);
        
        // Restore stock if limited
        if (redemption.stock_quantity !== -1) {
            await runQuery('UPDATE redemption_items SET stock_quantity = stock_quantity + 1 WHERE id = ?', [redemption.redemption_item_id]);
        }
        
        res.json({
            success: true,
            message: `Order cancelled successfully! ${redemption.points_used} points have been refunded to your account.`,
            refunded_points: redemption.points_used
        });
        
    } catch (error) {
        console.error('Cancel redemption error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel redemption'
        });
    }
});

// Get all redemption requests (admin only)
router.get('/admin/redemptions', async (req, res) => {
    try {
        const { status } = req.query;
        
        let sql = `
            SELECT r.*, ri.name as item_name, ri.description, ri.image_url,
                   u.name as user_name, u.email as user_email,
                   e.title as event_title, e.location as event_location
            FROM user_redemptions r
            JOIN redemption_items ri ON r.redemption_item_id = ri.id
            JOIN users u ON r.user_id = u.id
            LEFT JOIN events e ON r.pickup_event_id = e.id
        `;
        
        const params = [];
        
        if (status) {
            sql += ' WHERE r.status = ?';
            params.push(status);
        }
        
        sql += ' ORDER BY r.redeemed_at DESC';

        const redemptions = await getAllQuery(sql, params);

        res.json({
            success: true,
            redemptions
        });

    } catch (error) {
        console.error('Get admin redemptions error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update redemption status (admin only)
router.put('/admin/redemptions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_notes } = req.body;

        const result = await runQuery(`
            UPDATE user_redemptions SET
                status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [status, admin_notes || null, id]);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Redemption not found'
            });
        }

        res.json({
            success: true,
            message: 'Redemption status updated successfully'
        });

    } catch (error) {
        console.error('Update redemption status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update redemption status'
        });
    }
});

module.exports = router;