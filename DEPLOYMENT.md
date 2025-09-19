# 🚀 Vercel Deployment Guide for IKOOT Event Management Platform

This guide will help you deploy the IKOOT Event Management Platform to Vercel.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Node.js 18+**: Ensure compatibility

## 🔧 Deployment Steps

### 1. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository: `https://github.com/kopipes/ikoot`
4. Vercel will automatically detect the configuration

### 2. Configure Environment Variables

In your Vercel dashboard, go to **Settings > Environment Variables** and add:

```bash
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ADMIN_EMAIL=admin@ikoot.com
ADMIN_PASSWORD=your-secure-admin-password
FRONTEND_URL=https://your-app-name.vercel.app
```

**Optional Environment Variables:**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
RATE_LIMIT_MAX_REQUESTS=1000
```

### 3. Database Configuration

⚠️ **Important**: SQLite is not persistent on Vercel serverless functions.

**For Production, choose one of these options:**

#### Option A: Vercel Postgres (Recommended)
1. In Vercel dashboard, go to **Storage** tab
2. Create a **Postgres** database
3. Copy the connection string to `DATABASE_URL` environment variable
4. Update `backend/config/database.js` to use PostgreSQL

#### Option B: PlanetScale (MySQL)
1. Create account at [planetscale.com](https://planetscale.com)
2. Create a database
3. Get connection string and add to `DATABASE_URL`
4. Update database configuration for MySQL

#### Option C: Neon (PostgreSQL)
1. Create account at [neon.tech](https://neon.tech)
2. Create a database
3. Get connection string and add to `DATABASE_URL`

### 4. Deploy

1. Click **Deploy** in Vercel
2. Vercel will build and deploy your application
3. Your app will be available at `https://your-app-name.vercel.app`

## 🌟 Features Available After Deployment

### 🎪 Event Management
- **Main App**: `https://your-app.vercel.app`
- **Admin Panel**: `https://your-app.vercel.app/admin`
- **Promo Management**: `https://your-app.vercel.app/admin/promos.html`

### 🔐 Default Admin Access
- **Email**: `admin@ikoot.com`
- **Password**: (as set in environment variables)

### 📱 Mobile Features
- Responsive design for all screen sizes
- QR code scanner for event check-ins
- Mobile-optimized admin interface
- Touch-friendly carousel navigation

## 🔧 Post-Deployment Configuration

### 1. Database Migration
The database will auto-initialize on first run with:
- Sample events
- Sample promos
- Admin user
- Database schema

### 2. Custom Domain (Optional)
1. In Vercel dashboard, go to **Settings > Domains**
2. Add your custom domain
3. Update `FRONTEND_URL` environment variable

### 3. Performance Optimization
- Static files are automatically optimized by Vercel
- Database queries are optimized for serverless
- Images are served through Vercel's edge network

## 🚨 Production Considerations

### Security
- ✅ JWT tokens for authentication
- ✅ Rate limiting enabled
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation and sanitization

### Database
- ⚠️ SQLite is not suitable for production on Vercel
- ✅ Use Vercel Postgres or external database
- ✅ Database migrations run automatically

### Monitoring
- Monitor through Vercel dashboard
- Set up error tracking (Sentry recommended)
- Monitor database performance

## 📊 API Endpoints Available

- `GET /` - Main application
- `GET /admin` - Admin panel
- `GET /api/events` - Events API
- `GET /api/promos` - Promos API
- `GET /api/users` - Users API
- `POST /api/auth/login` - Authentication
- `GET /health` - Health check

## 🔄 Updating Your Deployment

1. Push changes to your GitHub repository
2. Vercel will automatically redeploy
3. Check deployment status in Vercel dashboard

## 🆘 Troubleshooting

### Common Issues

**1. Database Connection Issues**
- Ensure `DATABASE_URL` is correctly set
- Check database credentials
- Verify network connectivity

**2. Build Failures**
- Check Node.js version compatibility
- Review build logs in Vercel dashboard
- Ensure all dependencies are listed in package.json

**3. Environment Variables**
- Verify all required environment variables are set
- Restart deployment after adding new variables

### Getting Help
- Check Vercel documentation
- Review build logs
- Test locally with `npm run build`

## ✅ Deployment Checklist

- [ ] Repository pushed to GitHub
- [ ] Vercel project created and connected
- [ ] Environment variables configured
- [ ] Database solution chosen and configured
- [ ] First deployment successful
- [ ] Admin panel accessible
- [ ] API endpoints working
- [ ] Mobile responsive design verified
- [ ] QR code functionality tested

Your IKOOT Event Management Platform is now production-ready! 🎉