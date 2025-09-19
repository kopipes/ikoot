#!/usr/bin/env node
// Test QR generation code locally
const QRCode = require('qrcode');

async function testQRGeneration() {
    console.log('🔍 Testing QR Code Generation...');
    
    const eventIds = [1, 2, 3, 4, 5];
    
    for (const eventId of eventIds) {
        try {
            const qrData = `IKOOT_EVENT:${eventId}`;
            console.log(`\n📝 Generating QR for: ${qrData}`);
            
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
            
            console.log(`✅ QR Code generated successfully!`);
            console.log(`📊 Data URL length: ${qrCodeDataUrl.length} characters`);
            console.log(`🔗 Format: ${qrData}`);
            
            // Extract actual data URL for testing
            if (qrCodeDataUrl.startsWith('data:image/png;base64,')) {
                console.log(`💾 Base64 data available (ready for web display)`);
            }
            
        } catch (error) {
            console.error(`❌ Error generating QR for event ${eventId}:`, error.message);
        }
    }
    
    console.log('\n🎯 QR Generation Test Complete!');
    console.log('\n📱 Next Steps:');
    console.log('1. Use any QR code generator to create codes with format: IKOOT_EVENT:1, IKOOT_EVENT:2, etc.');
    console.log('2. Open the IKOOT app with diagnostic system (current deployment)');
    console.log('3. Use QR scanner and scan the generated codes');
    console.log('4. Watch diagnostic panel for detection logs');
    console.log('\n🔍 Expected QR Data Format:');
    eventIds.forEach(id => console.log(`   - IKOOT_EVENT:${id}`));
}

// Run the test
testQRGeneration().catch(console.error);