// QR Scanner Diagnostic Script - Debug QR detection issues
console.log('🔍 QR Diagnostic Script Loading...');

// Global diagnostic state
window.qrDiagnostic = {
    enabled: true,
    logs: [],
    qrCodesDetected: [],
    apiCalls: []
};

// Log function
function qrLog(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, data };
    window.qrDiagnostic.logs.push(logEntry);
    console.log(`[QR DIAG ${timestamp}] ${message}`, data || '');
}

// Override fetch to monitor API calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const [url, options] = args;
    if (url.includes('/checkin')) {
        qrLog('API Call Made', { url, method: options?.method, body: options?.body });
        window.qrDiagnostic.apiCalls.push({ timestamp: Date.now(), url, options });
    }
    return originalFetch.apply(this, args).then(response => {
        if (url.includes('/checkin')) {
            qrLog('API Response', { status: response.status, url });
        }
        return response;
    }).catch(error => {
        if (url.includes('/checkin')) {
            qrLog('API Error', { error: error.message, url });
        }
        throw error;
    });
};

// Add diagnostic overlay
function createDiagnosticOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'qr-diagnostic-overlay';
    overlay.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10001;
        max-width: 300px;
        max-height: 200px;
        overflow-y: auto;
    `;
    overlay.innerHTML = `
        <div><strong>QR Scanner Diagnostics</strong></div>
        <div id="diagnostic-content">Initializing...</div>
        <button onclick="window.qrDiagnostic.clear()" style="margin-top: 5px; padding: 2px 5px;">Clear</button>
        <button onclick="window.qrDiagnostic.testQR()" style="margin-top: 5px; padding: 2px 5px; margin-left: 5px;">Test QR</button>
    `;
    document.body.appendChild(overlay);
    
    // Update content
    setInterval(() => {
        const content = document.getElementById('diagnostic-content');
        if (content) {
            content.innerHTML = `
                <div>QR Codes: ${window.qrDiagnostic.qrCodesDetected.length}</div>
                <div>API Calls: ${window.qrDiagnostic.apiCalls.length}</div>
                <div>Last Log: ${window.qrDiagnostic.logs.slice(-1)[0]?.message || 'None'}</div>
                <div>Scanner: ${typeof qrScannerInstance !== 'undefined' ? 'Found' : 'Not Found'}</div>
                <div>User: ${typeof currentUser !== 'undefined' && currentUser ? 'Logged In' : 'Not Logged'}</div>
            `;
        }
    }, 1000);
}

// Clear diagnostic data
window.qrDiagnostic.clear = function() {
    this.logs = [];
    this.qrCodesDetected = [];
    this.apiCalls = [];
    qrLog('Diagnostics cleared');
};

// Test QR function
window.qrDiagnostic.testQR = function() {
    const testData = 'IKOOT_EVENT:1';
    qrLog('Testing QR Format', testData);
    
    // Directly test the handleQRCodeDetected function
    if (typeof qrScannerInstance !== 'undefined' && qrScannerInstance) {
        qrLog('Simulating QR detection with test data');
        qrScannerInstance.handleQRCodeDetected(testData);
    } else {
        alert('QR Scanner not found. Please open the QR scanner first.');
    }
};

// Enhanced QR override with diagnostics
function enhancedQROverride() {
    qrLog('Attempting to install QR override');
    
    if (typeof qrScannerInstance !== 'undefined' && qrScannerInstance) {
        qrLog('QR Scanner instance found, installing override');
        
        // Store original functions
        const originalHandleQRCodeDetected = qrScannerInstance.handleQRCodeDetected;
        const originalHandleEventCheckin = qrScannerInstance.handleEventCheckinQRCode;
        
        // Override QR detection to log all codes with detailed analysis
        qrScannerInstance.handleQRCodeDetected = async function(qrCodeData) {
            qrLog('QR Code Raw Data', qrCodeData);
            qrLog('QR Code Analysis', {
                data: qrCodeData,
                length: qrCodeData?.length,
                startsWithIKOOT_EVENT: qrCodeData?.startsWith('IKOOT_EVENT:'),
                startsWithIKOOT_PROMO: qrCodeData?.startsWith('IKOOT_PROMO:'),
                trimmed: qrCodeData?.trim(),
                type: typeof qrCodeData
            });
            
            window.qrDiagnostic.qrCodesDetected.push({
                timestamp: Date.now(),
                data: qrCodeData,
                analysis: {
                    startsWithIKOOT_EVENT: qrCodeData?.startsWith('IKOOT_EVENT:'),
                    startsWithIKOOT_PROMO: qrCodeData?.startsWith('IKOOT_PROMO:')
                }
            });
            
            // Show detailed alert for debugging
            alert(`QR Detected: "${qrCodeData}"\nLength: ${qrCodeData?.length}\nStarts with IKOOT_EVENT: ${qrCodeData?.startsWith('IKOOT_EVENT:')}`);
            
            // Try to fix common QR format issues
            let correctedData = qrCodeData;
            if (qrCodeData) {
                // Trim whitespace
                correctedData = qrCodeData.trim();
                
                // Handle common case issues
                if (correctedData.toUpperCase().startsWith('IKOOT_EVENT:')) {
                    correctedData = correctedData.toUpperCase();
                    qrLog('QR Format corrected', { original: qrCodeData, corrected: correctedData });
                }
            }
            
            // Call original function with corrected data
            return originalHandleQRCodeDetected.call(this, correctedData);
        };
        
        // Override check-in function with test data
        qrScannerInstance.handleEventCheckinQRCode = async function(eventId) {
            qrLog('Event Check-in Called', eventId);
            
            this.stopScanning();
            
            if (!currentUser) {
                qrLog('No user logged in, showing login prompt');
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
            
            qrLog('User logged in, processing check-in', currentUser.email);
            
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
                qrLog('Invalid event ID', eventId);
                this.showCheckinErrorResult({
                    success: false,
                    message: `Event ${eventId} not found. Valid IDs: 1, 2, 3, 4, 5`
                }, eventId);
                return;
            }
            
            qrLog('Event found, creating success result', event);
            
            // Create success result
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
                }
            };
            
            qrLog('Showing success result', mockResult);
            
            // Show success result
            this.showCheckinSuccessResult(mockResult);
            
            // Update user's points in memory
            if (currentUser) {
                currentUser.points = mockResult.total_points;
                qrLog('Updated user points', currentUser.points);
            }
        };
        
        qrLog('QR Scanner override installed successfully');
        return true;
    } else {
        qrLog('QR Scanner instance not found');
        return false;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    qrLog('DOM Content Loaded');
    createDiagnosticOverlay();
    
    // Try to install override
    enhancedQROverride();
    
    // Watch for QR scanner creation
    let watchAttempts = 0;
    const watchInterval = setInterval(() => {
        if (enhancedQROverride()) {
            clearInterval(watchInterval);
        } else {
            watchAttempts++;
            if (watchAttempts > 30) { // 15 seconds
                clearInterval(watchInterval);
                qrLog('Stopped watching for QR scanner (timeout)');
            }
        }
    }, 500);
    
    // Override modal opening to catch QR scanner initialization
    const originalOpenModal = window.openModal;
    if (originalOpenModal) {
        window.openModal = function(modalId) {
            qrLog('Modal opened', modalId);
            const result = originalOpenModal.apply(this, arguments);
            if (modalId === 'qrModal') {
                setTimeout(() => {
                    enhancedQROverride();
                }, 1000);
            }
            return result;
        };
    }
});

qrLog('QR Diagnostic script loaded');