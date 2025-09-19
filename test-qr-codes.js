const QRCode = require('qrcode');
const fs = require('fs');

async function testQRGeneration() {
    console.log('🔍 Testing QR Code Generation...\n');
    
    const testEvents = [
        { id: 1, title: 'Jakarta Music Festival 2024' },
        { id: 2, title: 'Tech Summit Jakarta' },
        { id: 3, title: 'Food & Culture Festival' }
    ];
    
    for (const event of testEvents) {
        const qrData = `IKOOT_EVENT:${event.id}`;
        console.log(`📅 Testing Event ${event.id}: ${event.title}`);
        console.log(`   QR Data: ${qrData}`);
        
        try {
            const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
                type: 'image/png',
                width: 300,
                margin: 2,
                color: {
                    dark: '#2E7D32',  // Green for events
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            });
            
            console.log(`   ✅ QR Generated: ${qrCodeDataUrl.length} characters`);
            console.log(`   🔗 Format: ${qrCodeDataUrl.substring(0, 30)}...`);
            
            // Save QR code to file
            const filename = `test-qr-event-${event.id}.png`;
            const base64Data = qrCodeDataUrl.replace('data:image/png;base64,', '');
            fs.writeFileSync(filename, base64Data, 'base64');
            console.log(`   💾 Saved: ${filename}`);
            
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
        }
        
        console.log('');
    }
    
    // Test with actual online QR reader simulation
    console.log('🧪 QR Code Data Testing:');
    console.log('To test these QR codes:');
    console.log('1. Open any QR code reader app on your phone');
    console.log('2. Scan the generated PNG files');
    console.log('3. Verify the data matches exactly:');
    testEvents.forEach(event => {
        console.log(`   - Event ${event.id}: Should show "IKOOT_EVENT:${event.id}"`);
    });
    
    console.log('\n📱 Online QR Generators for Testing:');
    testEvents.forEach(event => {
        const qrData = `IKOOT_EVENT:${event.id}`;
        const encodedData = encodeURIComponent(qrData);
        console.log(`   Event ${event.id}: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}`);
    });
    
    console.log('\n🔍 Debug Information:');
    console.log('- QR Format: IKOOT_EVENT:{eventId}');
    console.log('- Expected Scanner Behavior: Immediate detection');
    console.log('- Expected Check-in: POST /api/events/{eventId}/checkin');
    console.log('- Expected Response: Success with +5 points');
}

// Also test the exact format expected by the scanner
async function testScannerFormats() {
    console.log('\n🎯 Testing Scanner Expected Formats:');
    
    const formats = [
        'IKOOT_EVENT:1',
        'IKOOT_PROMO:TEST2024',
        'promo:LEGACY123'  // Legacy format
    ];
    
    for (const format of formats) {
        console.log(`\n📊 Format: ${format}`);
        try {
            const qrCode = await QRCode.toDataURL(format, {
                type: 'image/png',
                width: 200,
                margin: 1
            });
            console.log(`   ✅ Generated successfully`);
            
            // Save for testing
            const filename = `scanner-test-${format.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
            const base64Data = qrCode.replace('data:image/png;base64,', '');
            fs.writeFileSync(filename, base64Data, 'base64');
            console.log(`   💾 Saved: ${filename}`);
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
        }
    }
}

// Run tests
async function runAllTests() {
    await testQRGeneration();
    await testScannerFormats();
    
    console.log('\n🎊 QR Code Testing Complete!');
    console.log('Use the generated PNG files to test with:');
    console.log('1. Your phone\'s QR scanner app');
    console.log('2. The IKOOT app QR scanner');
    console.log('3. Online QR readers');
}

runAllTests().catch(console.error);