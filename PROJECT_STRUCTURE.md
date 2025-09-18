# 📁 IKOOT Project Structure (Clean & Organized)

## 🏗️ Overview
The IKOOT project is an event management platform with QR code functionality, loyalty points system, and admin management panel.

## 📂 Directory Structure

```
ikoot/
├── 📄 index.html                  # Main frontend application
├── 📄 PROJECT_STRUCTURE.md        # This documentation
├── 📄 QR_SCANNER_ISSUES.md       # QR scanner troubleshooting guide
├── 🎨 css/
│   └── style.css                  # Main application styles
├── 🔧 js/
│   ├── main.js                    # Main application logic
│   └── qr-scanner.js              # QR scanner functionality
└── 🗄️ backend/                    # Backend server and API
    ├── 📄 server.js               # Main Express server
    ├── 📄 package.json            # Node.js dependencies
    ├── 📄 package-lock.json       # Locked dependencies
    ├── ⚙️ config/
    │   └── database.js            # SQLite database configuration
    ├── 🛣️ routes/                  # API route handlers
    │   ├── admin.js               # Admin-specific routes
    │   ├── auth.js                # Authentication routes
    │   ├── events.js              # Event CRUD operations
    │   ├── promos.js              # Promo code management
    │   └── users.js               # User management
    └── 🌐 public/                 # Static files served by backend
        ├── 🖥️ admin/               # Admin panel interface
        │   ├── index.html         # Admin dashboard
        │   ├── promos.html        # Promo management page
        │   ├── 🎨 css/
        │   │   └── admin.css      # Admin panel styles
        │   └── 🔧 js/
        │       ├── admin.js       # Admin panel functionality
        │       └── promo-admin.js # Promo management logic
        ├── 📄 camera-test.html    # Camera testing tool
        ├── 📄 qr-debug.html       # QR code debugging tool
        └── 📄 qr-test-debug.html  # Advanced QR testing tool
```

## 🌟 Key Features

### 🎯 Main Application (`/`)
- **Event Management**: Browse current and upcoming events
- **QR Scanner**: Scan event check-in and promo codes
- **Loyalty Points**: Earn and track loyalty points
- **User Authentication**: Login/signup functionality
- **Mobile Responsive**: Optimized for mobile devices

### 🛠️ Admin Panel (`/admin`)
- **Event Management**: Create, edit, delete events
- **User Management**: View and manage users
- **Promo Management**: Create and manage discount codes
- **Statistics Dashboard**: View platform analytics
- **QR Code Generation**: Generate QR codes for events

### 🔧 Testing Tools
- **Camera Test** (`/camera-test.html`): Test camera permissions
- **QR Debug** (`/qr-debug.html`): Debug QR code processing
- **QR Test Debug** (`/qr-test-debug.html`): Comprehensive QR testing

## 🎯 QR Code System

### 🟢 Green QR Codes (Event Check-ins)
- **Format**: `IKOOT_EVENT:4` (where 4 is event ID)
- **Purpose**: User check-ins to events for loyalty points
- **Points**: Awards 5 points per successful check-in
- **API**: `POST /api/events/{id}/checkin`

### 🟠 Orange QR Codes (Promo Codes)
- **Format**: `IKOOT_PROMO:WEEKEND50` (where WEEKEND50 is promo code)
- **Purpose**: Discount codes and special offers
- **Types**: Percentage discounts, fixed amounts, free entry
- **API**: `GET /api/promos/{code}`

## 🗄️ Database Structure
- **Events**: Event information, dates, locations, QR codes
- **Users**: User accounts, roles, loyalty points
- **Promos**: Promo codes, discounts, usage limits
- **User Check-ins**: Event check-in history for loyalty points

## 🚀 API Endpoints

### Public APIs
- `GET /api/events` - List all events
- `GET /api/events/{id}` - Get single event
- `POST /api/events/{id}/checkin` - Event check-in
- `GET /api/promos/{code}` - Get promo details
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Admin APIs
- `POST /api/events/admin` - Create event
- `PUT /api/events/admin/{id}` - Edit event
- `DELETE /api/events/admin/{id}` - Delete event
- `GET /api/users` - List users
- `GET /api/promos` - List promos

## 🧹 Cleaned Up Files
The following unnecessary files have been removed:
- ❌ `backend/decode-qr.js` - Unused QR decoder
- ❌ `backend/server-simple.js` - Unused server file
- ❌ `backend/public/qr_test.html` - Duplicate test file

## 🔧 Configuration

### Server Configuration
- **Port**: 3001 (configurable via environment)
- **Database**: SQLite with file-based storage
- **Static Files**: Serves frontend from parent directory
- **Admin Panel**: Served from `/backend/public/admin/`

### Frontend Configuration
- **Main App**: Served at root `/`
- **API Base URL**: `/api`
- **QR Scanner**: Simulated detection after 3 seconds
- **Mobile Support**: Touch gestures, camera access

## 🏁 Status: All Systems Working

✅ **QR Scanner**: Fixed video element preservation during camera init
✅ **Event Editing**: Fixed admin panel API endpoints
✅ **Green QR (Events)**: Uses correct event IDs (4, 5, 6)
✅ **Orange QR (Promos)**: Uses valid promo codes (IKOOT2024, WEEKEND50, FOODIE10)
✅ **Project Structure**: Clean, organized, unnecessary files removed
✅ **All APIs**: Working correctly with proper error handling

## 🎯 Quick Start
1. Navigate to `/Users/bob/Documents/Apps/ikoot/backend`
2. Run `node server.js`
3. Visit `http://localhost:3001/` for main app
4. Visit `http://localhost:3001/admin` for admin panel
5. Use `admin@ikoot.com` / `admin123` for admin login

The IKOOT platform is now fully functional and well-organized! 🚀