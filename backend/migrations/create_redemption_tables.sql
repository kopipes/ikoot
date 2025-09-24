-- Create redemption_items table
CREATE TABLE IF NOT EXISTS redemption_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    category TEXT DEFAULT 'General',
    image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    stock_quantity INTEGER DEFAULT -1, -- -1 means unlimited stock
    is_active BOOLEAN DEFAULT 1,
    delivery_available BOOLEAN DEFAULT 1,
    pickup_available BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create user_redemptions table
CREATE TABLE IF NOT EXISTS user_redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    redemption_item_id INTEGER NOT NULL,
    points_used INTEGER NOT NULL,
    delivery_method TEXT NOT NULL CHECK(delivery_method IN ('pickup', 'delivery')),
    pickup_event_id INTEGER,
    delivery_address TEXT,
    delivery_phone TEXT,
    delivery_notes TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processed', 'shipped', 'delivered', 'cancelled')),
    admin_notes TEXT,
    redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (redemption_item_id) REFERENCES redemption_items(id),
    FOREIGN KEY (pickup_event_id) REFERENCES events(id)
);

-- Insert sample redemption items
INSERT OR IGNORE INTO redemption_items (id, name, description, points_required, category, image_url, stock_quantity, delivery_available, pickup_available) VALUES
(1, 'IKOOT T-Shirt', 'Official IKOOT branded t-shirt in various sizes', 500, 'Merchandise', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 50, 1, 1),
(2, 'Coffee Voucher', 'Free coffee at selected partner cafes', 200, 'Food & Beverage', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', -1, 0, 1),
(3, 'Event Ticket Discount', '20% discount on next event ticket purchase', 300, 'Discount', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', -1, 0, 0),
(4, 'IKOOT Tote Bag', 'Eco-friendly canvas tote bag with IKOOT logo', 350, 'Merchandise', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 30, 1, 1),
(5, 'Premium Event Access', 'VIP access to exclusive IKOOT events', 1000, 'Experience', 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 10, 0, 1),
(6, 'Food Voucher', 'IDR 50,000 food voucher at partner restaurants', 400, 'Food & Beverage', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', -1, 1, 1),
(7, 'IKOOT Water Bottle', 'Stainless steel water bottle with IKOOT branding', 250, 'Merchandise', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 25, 1, 1),
(8, 'Event Photography', 'Professional photo session at IKOOT events', 800, 'Experience', 'https://images.unsplash.com/photo-1554048612-b6ebae92138b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 5, 0, 1);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_redemptions_user_id ON user_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_redemptions_status ON user_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_redemption_items_category ON redemption_items(category);
CREATE INDEX IF NOT EXISTS idx_redemption_items_active ON redemption_items(is_active);