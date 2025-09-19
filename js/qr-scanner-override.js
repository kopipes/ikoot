// Temporary QR scanner override to test complete flow with simulated success
// This bypasses the API caching issue by simulating successful responses

// Override the handleEventCheckinQRCode function
if (typeof qrScannerInstance !== 'undefined' && qrScannerInstance) {
    
    // Store the original function
    qrScannerInstance.originalHandleEventCheckinQRCode = qrScannerInstance.handleEventCheckinQRCode;
    
    // Override with test version
    qrScannerInstance.handleEventCheckinQRCode = async function(eventId) {
        console.log('🎯 QR SCANNER OVERRIDE ACTIVE - Testing event ID:', eventId);
        
        this.stopScanning();
        
        if (!currentUser) {
            // Show login prompt for event check-in
            const scannerResult = document.getElementById('scannerResult');
            if (scannerResult) {
                scannerResult.innerHTML = `
                    <div class="checkin-result">
                        <div class="checkin-header">
                            <i class="fas fa-calendar-check" style="font-size: 3rem; color: #1976D2; margin-bottom: 15px;"></i>
                            <h3>Event Check-in</h3>
                        </div>
                        <div class="checkin-details">
                            <p>Please log in to check in to this event and earn loyalty points!</p>
                            <div class="checkin-actions">
                                <button class="btn btn-primary" onclick="closeModal('qrModal'); openModal('loginModal')">
                                    <i class="fas fa-sign-in-alt"></i> Login to Check In
                                </button>
                                <button class="btn btn-secondary" onclick="closeModal('qrModal')">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                scannerResult.style.display = 'block';
            }
            return;
        }
        
        // Test event data
        const testEvents = {
            1: { id: 1, title: 'Jakarta Music Festival 2024', location: 'GBK Senayan, Jakarta' },
            2: { id: 2, title: 'Tech Summit Jakarta', location: 'Jakarta Convention Center' },
            3: { id: 3, title: 'Food & Culture Festival', location: 'Monas Park, Central Jakarta' },
            4: { id: 4, title: 'Sports & Wellness Expo', location: 'Jakarta International Expo' },
            5: { id: 5, title: 'Gaming Championship', location: 'Senayan City Mall' }
        };
        
        const event = testEvents[eventId];
        
        if (!event) {
            this.showCheckinErrorResult({
                success: false,
                message: `Test event ${eventId} not found. Valid IDs: 1, 2, 3, 4, 5`
            }, eventId);
            return;
        }
        
        // Simulate successful check-in
        const mockResult = {
            success: true,
            message: `Check-in successful! You earned 5 points!`,
            points_earned: 5,
            total_points: (currentUser.points || 0) + 5,
            event: {
                id: event.id,
                title: event.title,
                location: event.location
            },
            user: {
                id: currentUser.id || 1234,
                name: currentUser.name || currentUser.email.split('@')[0],
                email: currentUser.email,
                points: (currentUser.points || 0) + 5
            },
            system_info: {
                mode: 'QR_SCANNER_OVERRIDE',
                note: 'This is a test response to verify QR scanner functionality'
            }
        };
        
        console.log('✅ QR SCANNER OVERRIDE SUCCESS:', mockResult);
        
        // Show success result
        this.showCheckinSuccessResult(mockResult);
        
        // Update user's points in memory
        if (currentUser) {
            currentUser.points = mockResult.total_points;
        }
    };
    
    console.log('🔄 QR Scanner override installed - will simulate successful check-ins');
    
} else {
    console.log('⚠️ QR Scanner instance not found - override not installed');
}

// Also add a notice to the page
document.addEventListener('DOMContentLoaded', function() {
    // Add a small indicator that override is active
    const indicator = document.createElement('div');
    indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #4CAF50;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        font-family: Arial, sans-serif;
    `;
    indicator.textContent = 'QR Test Mode Active';
    document.body.appendChild(indicator);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }, 5000);
});