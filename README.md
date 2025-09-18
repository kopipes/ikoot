# 🎉 IKOOT Event Management System

A complete, production-ready event management platform built with modern web technologies. IKOOT provides event organizers with powerful tools to manage events, users, and customer loyalty programs.

## ✨ Features

### 🎪 Event Management
- **Create, Edit, Delete Events** with comprehensive admin panel
- **Event Categorization** (Music, Food, Technology, Sports, etc.)
- **Featured Events Carousel** with working navigation and touch support
- **Event QR Code Generation** for seamless check-ins
- **Mobile-Responsive Design** for all devices

### 👥 User Management & Loyalty System
- **User Registration/Login** with JWT authentication
- **Points-Based Loyalty System** (5 points per event check-in)
- **Admin User Management** with role-based access control
- **User Check-in History** tracking and analytics

### 🎯 Admin Panel
- **Complete Dashboard** with real-time statistics
- **Event, User, and Promo Management** interfaces
- **Mobile-Responsive Admin Interface**
- **Real-time Data Updates** and notifications

### 📱 QR Code System
- **Event Check-in QR Codes** with unique identifiers
- **Points Redemption System** integrated with loyalty program
- **QR Scanner Integration** for mobile devices
- **Admin QR Code Generation** tools

### 🎨 UI/UX Improvements
- **Working Carousel Navigation** for current/upcoming events
- **Dynamic Card Width Calculation** for responsive layouts
- **Touch/Swipe Support** for mobile carousel interaction
- **Smooth Animations** and transitions throughout

## 🛠 Technical Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite with proper relational schema
- **Authentication**: JWT tokens with secure session management
- **Architecture**: RESTful API design
- **Responsive**: Mobile-first design approach

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kopipes/ikoot.git
   cd ikoot
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Start the backend server**
   ```bash
   npm start
   ```

4. **Access the application**
   - Main Application: http://localhost:3001
   - Admin Panel: http://localhost:3001/admin
   - API Documentation: http://localhost:3001/api

### Default Admin Credentials
- **Email**: admin@ikoot.com
- **Password**: admin123

## 📁 Project Structure

```
ikoot/
├── backend/                 # Express.js backend
│   ├── config/             # Database configuration
│   ├── routes/             # API routes (auth, events, users, etc.)
│   ├── public/admin/       # Admin panel frontend
│   └── database.sqlite     # SQLite database
├── css/                    # Frontend stylesheets
├── js/                     # Frontend JavaScript modules
├── images/                 # Static assets
├── index.html             # Main application entry point
└── README.md              # Project documentation
```

## 🌟 Key Features Breakdown

### Event Management
- Create events with detailed information (title, description, dates, location, pricing)
- Categorize events for better organization
- Set event capacity and track current bookings
- Generate unique QR codes for each event
- Featured event carousel with smooth navigation

### User System
- Secure user registration and authentication
- Role-based access (admin, user)
- User profiles with points tracking
- Event check-in history
- Loyalty points system

### Admin Dashboard
- Real-time statistics and analytics
- User management (view, edit, deactivate, delete)
- Event management (create, edit, delete, QR codes)
- Promo code management
- Mobile-responsive design

### QR Code Check-ins
- Unique QR codes for each event
- Mobile-friendly QR scanner
- Automatic points awarding (5 points per check-in)
- Check-in history tracking
- Duplicate check-in prevention

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Events
- `GET /api/events` - Get all events
- `GET /api/events/current` - Get current events
- `GET /api/events/upcoming` - Get upcoming events
- `POST /api/events/admin` - Create event (admin)
- `PUT /api/events/admin/:id` - Update event (admin)
- `DELETE /api/events/admin/:id` - Delete event (admin)

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/admin/:id` - Update user (admin)
- `DELETE /api/users/admin/:id` - Delete user (admin)

### Check-ins
- `POST /api/events/:id/checkin` - Check-in to event

## 🎨 Screenshots

### Main Application
- Event carousel with smooth navigation
- Mobile-responsive design
- Clean, modern UI

### Admin Panel
- Comprehensive dashboard
- Event management interface
- User management system
- Mobile-responsive admin interface

## 🐛 Recently Fixed Issues

- ✅ **Carousel Navigation**: Fixed scrolling and arrow navigation for event carousels
- ✅ **User Edit Routes**: Resolved "route not found" errors in admin panel
- ✅ **Event Delete Functionality**: Added missing delete event feature
- ✅ **User Delete Functionality**: Implemented user deletion with proper constraints
- ✅ **Mobile Responsiveness**: Enhanced mobile experience across all components
- ✅ **Database Integrity**: Fixed database consistency and constraint issues

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Responsive design principles
- User experience best practices
- Security-first approach

## 📞 Support

For support, email support@ikoot.com or create an issue in this repository.

---

**IKOOT** - Making event management simple and effective! 🎉