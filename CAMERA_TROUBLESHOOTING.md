# 📱 Mobile Camera Access Troubleshooting Guide

This guide helps resolve camera access issues with the Ikoot QR scanner on mobile devices.

## 🚀 Quick Test

Visit the camera test page to diagnose issues: `http://localhost:3001/camera-test.html`

## 🔧 Common Issues & Solutions

### 1. **HTTPS Required Error**
**Problem:** Camera access requires HTTPS on mobile devices
**Solutions:**
- Use `https://` instead of `http://` when accessing the site
- For development: use `localhost` or `127.0.0.1` which are exempt from HTTPS requirement
- Deploy to a server with SSL certificate

### 2. **Permission Denied**
**Problem:** User denied camera access or browser blocked it
**Solutions:**
- **Chrome Mobile:** Tap the camera icon in address bar → Allow
- **Safari iOS:** Settings → Safari → Camera → Allow
- **Firefox Mobile:** Tap shield icon → Permissions → Camera → Allow
- Clear browser data and retry
- Reload the page after changing permissions

### 3. **Camera Not Found**
**Problem:** Device has no camera or camera is not detected
**Solutions:**
- Ensure device has a working camera
- Try switching between front/back camera
- Close other apps that might be using the camera
- Restart the browser

### 4. **Camera Already in Use**
**Problem:** Another app is using the camera
**Solutions:**
- Close other camera apps (Camera, video calling apps, etc.)
- Force-close all browser tabs using camera
- Restart the browser or device

## 🏃‍♂️ Enhanced QR Scanner Features

### Progressive Camera Constraints
The scanner tries multiple camera configurations:
1. **Preferred:** Back camera with high resolution (1280x720)
2. **Fallback:** Back camera with flexible resolution (640x480 min)
3. **Final:** Any available camera

### Smart Error Handling
- **Detailed error messages** for each camera issue
- **Automatic retries** with different camera settings
- **Manual code entry** fallback when camera fails
- **Helpful instructions** for each platform

### Mobile Optimizations
- **Touch-friendly buttons** (44px minimum height)
- **Responsive design** for different screen sizes
- **Loading animations** and status indicators
- **Page visibility handling** (stops camera when page hidden)

## 🛠️ Browser-Specific Issues

### iOS Safari
- Requires user gesture to start camera
- `playsinline` attribute required for video
- Permission prompts appear in address bar

### Android Chrome
- May require multiple permission grants
- Works better with exact `facingMode` constraints
- Good support for different resolutions

### Firefox Mobile
- Generally good camera support
- May have different permission UI
- Supports most WebRTC features

## 🔍 Debugging Steps

1. **Check browser support:**
   ```javascript
   navigator.mediaDevices && navigator.mediaDevices.getUserMedia
   ```

2. **Test permissions:**
   ```javascript
   navigator.permissions.query({ name: 'camera' })
   ```

3. **Try different constraints:**
   ```javascript
   // Start with basic constraints
   { video: true }
   // Then try specific facing mode
   { video: { facingMode: 'environment' } }
   ```

4. **Check console errors:**
   - Open browser dev tools
   - Look for camera-related errors
   - Note specific error codes (NotAllowedError, etc.)

## 📱 Testing on Real Devices

### iOS Testing
- Test on Safari (primary browser)
- Test in Chrome iOS (uses Safari engine)
- Test in private/incognito mode
- Test with different iOS versions

### Android Testing
- Test on Chrome (primary browser)
- Test on Firefox
- Test on Samsung Internet
- Test with different Android versions

## 🔧 Development Tips

### Local Development
- Use `localhost:PORT` instead of IP addresses
- Consider using tools like `ngrok` for HTTPS testing
- Test on same network devices

### Production Deployment
- Always use HTTPS in production
- Configure proper SSL certificates
- Test on multiple devices before launch

## 📞 User Instructions

When users report camera issues, ask them to:

1. **Check browser permissions**
2. **Reload the page**
3. **Try the manual code entry** option
4. **Use the camera test page** to isolate issues
5. **Try a different browser** if available

## 🚨 Emergency Fallbacks

If camera completely fails:
1. **Manual Code Entry:** Users can type in promo codes directly
2. **QR Code Upload:** Future enhancement to upload QR images
3. **Contact Support:** Provide alternative ways to claim promos

## 📊 Analytics & Monitoring

Track these metrics to identify common issues:
- Camera permission denial rates
- Error types by device/browser
- Manual entry usage rates
- User agent strings for problematic devices

---

**Need Help?** Check the camera test page at `/camera-test.html` for detailed diagnostics.