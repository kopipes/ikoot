# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Starting the Application
```bash
# Start the backend server
cd backend && npm start
# OR from root directory
npm start

# Start development server (with hot reloading)
cd backend && npm run dev
# OR from root directory
npm run dev
```

### Database Operations
```bash
# Run database seeding
cd backend && npm run seed

# Database is located at backend/database.sqlite
```

### Testing
```bash
# Run backend tests
cd backend && npm test
# OR from root directory
npm test

# Manual QR testing tools available at:
# http://localhost:3001/camera-test
# http://localhost:3001/qr-debug
# http://localhost:3001/qr-test-debug
```

### Development Ports
- **Main Application**: http://localhost:3001
- **Admin Panel**: http://localhost:3001/admin
- **API Base**: http://localhost:3001/api

### Default Admin Credentials
- Email: admin@ikoot.com
- Password: admin123

## Architecture Overview

### Tech Stack
- **Frontend**: Vanilla HTML5/CSS3/JavaScript (no framework dependencies)
- **Backend**: Node.js + Express.js with middleware stack
- **Database**: SQLite (development) / PostgreSQL (production)
- **Deployment**: Vercel-optimized serverless functions

### Core Architecture

#### Backend Structure (`backend/`)
- **server.js**: Main Express application with middleware setup
- **routes/**: API route handlers organized by feature
  - `auth.js`: Authentication (JWT-based)
  - `events.js`: Event CRUD operations
  - `users.js`: User management
  - `promos.js`: Promo code system
  - `redemptions.js`: Loyalty point redemption system
  - `admin.js`: Admin-specific endpoints
- **config/database.js**: SQLite/PostgreSQL database layer with comprehensive schema
- **public/admin/**: Complete admin panel interface

#### Frontend Structure
- **index.html**: Main SPA entry point
- **js/**: JavaScript modules
  - `main.js`: Core application logic (~100KB)
  - `qr-scanner.js`: QR code scanning functionality
  - `qr-diagnostic.js`: QR debugging utilities
- **css/style.css**: Main application styles

### Key Systems

#### QR Code System
Two distinct QR code types with different formats and purposes:
- **Event Check-ins** (Green): `IKOOT_EVENT:{event_id}`
  - Awards 5 loyalty points per check-in
  - API: `POST /api/events/{id}/checkin`
  - Prevents duplicate check-ins per user/event
- **Promo Codes** (Orange): `IKOOT_PROMO:{promo_code}`
  - Discount codes and special offers
  - API: `GET /api/promos/{code}`

#### Loyalty Points System
- Users earn points through event check-ins
- Points can be redeemed for items/rewards
- Complete redemption history tracking
- Admin panel for managing redemption items

#### Database Schema
Complex relational structure with tables for:
- **users**: JWT auth, roles, loyalty points
- **events**: Full event management with QR codes
- **bookings**: Event registrations
- **promos**: Discount system
- **user_check_ins**: QR scan tracking
- **redemption_items**: Loyalty rewards
- **user_redemptions**: Redemption history
- **admin_logs**: Audit trail

#### API Architecture
RESTful design with consistent patterns:
- Authentication via JWT tokens
- Role-based access control (admin/user)
- Comprehensive error handling
- Rate limiting and security middleware
- Admin endpoints prefixed with `/api/admin/`

### Frontend Patterns

#### No-Framework Approach
- Pure JavaScript ES6+ modules
- Event delegation for dynamic content
- CSS Grid/Flexbox for responsive layouts
- Web APIs for camera/QR functionality

#### Mobile-First Design
- Touch gesture support for carousels
- Responsive breakpoints
- Camera integration for QR scanning
- Progressive enhancement

## Important Development Notes

### QR Scanner Implementation
The QR scanner uses camera access and requires HTTPS in production. For local development, it includes fallback simulation modes.

### Database Migrations
Database schema is managed through the `createTables()` function in `config/database.js`. New tables/columns should be added there with IF NOT EXISTS clauses.

### Security Considerations
- JWT tokens for stateless authentication
- Helmet.js for security headers
- CORS configuration for cross-origin requests
- Rate limiting to prevent abuse
- SQL injection prevention through parameterized queries

### Deployment
The application is optimized for Vercel deployment with:
- Serverless function configuration in `vercel.json`
- Environment variable support
- Static file serving
- API route handling

### Admin Panel
Complete admin interface at `/admin` with:
- Event management (CRUD)
- User management
- Promo code management  
- Redemption item management
- Real-time statistics dashboard

### Testing Strategy
- Backend API tests with Jest + Supertest
- Manual QR testing tools at various debug endpoints
- Camera permission testing utilities

The codebase follows a clean, monolithic architecture suitable for rapid development while maintaining clear separation between frontend, backend, and data layers.