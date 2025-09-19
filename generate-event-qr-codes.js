#!/usr/bin/env node
// Generate QR codes for all IKOOT events
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');

const events = [
    { id: 1, title: 'Jakarta Music Festival 2024', location: 'GBK Senayan, Jakarta' },
    { id: 2, title: 'Tech Summit Jakarta', location: 'Jakarta Convention Center' },
    { id: 3, title: 'Food & Culture Festival', location: 'Monas Park, Central Jakarta' },
    { id: 4, title: 'Sports & Wellness Expo', location: 'Jakarta International Expo' },
    { id: 5, title: 'Gaming Championship', location: 'Senayan City Mall' }
];

async function generateAllQRCodes() {
    console.log('🎯 Generating QR Codes for All IKOOT Events...\n');
    
    // Create qr-codes directory if it doesn't exist
    const qrDir = path.join(__dirname, 'qr-codes');
    try {
        await fs.mkdir(qrDir, { recursive: true });
    } catch (error) {
        // Directory might already exist
    }
    
    const results = [];
    
    for (const event of events) {
        try {
            const qrData = `IKOOT_EVENT:${event.id}`;
            console.log(`📝 Generating QR for Event ${event.id}: ${event.title}`);
            console.log(`🔗 QR Data: ${qrData}`);
            
            // Generate PNG file
            const pngPath = path.join(qrDir, `event-${event.id}-qr.png`);
            await QRCode.toFile(pngPath, qrData, {
                type: 'png',
                width: 300,
                margin: 2,
                color: {
                    dark: '#2E7D32',  // Green for events
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            });
            
            // Generate SVG file
            const svgPath = path.join(qrDir, `event-${event.id}-qr.svg`);
            const svgString = await QRCode.toString(qrData, {
                type: 'svg',
                width: 300,
                margin: 2,
                color: {
                    dark: '#2E7D32',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            });
            await fs.writeFile(svgPath, svgString);
            
            // Generate data URL for web use
            const dataURL = await QRCode.toDataURL(qrData, {
                type: 'image/png',
                width: 300,
                margin: 2,
                color: {
                    dark: '#2E7D32',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            });
            
            const result = {
                event_id: event.id,
                event_title: event.title,
                event_location: event.location,
                qr_data: qrData,
                files: {
                    png: pngPath,
                    svg: svgPath,
                    data_url: dataURL
                },
                size: '300x300px'
            };
            
            results.push(result);
            
            console.log(`✅ Generated: ${pngPath}`);
            console.log(`✅ Generated: ${svgPath}`);
            console.log(`💾 Data URL length: ${dataURL.length} characters\n`);
            
        } catch (error) {
            console.error(`❌ Error generating QR for event ${event.id}:`, error.message);
        }
    }
    
    // Save results to JSON file
    const resultsPath = path.join(qrDir, 'qr-codes-info.json');
    await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
    
    console.log('📊 QR CODE GENERATION COMPLETE!\n');
    console.log('📁 Files generated in:', qrDir);
    console.log('📋 Summary saved to:', resultsPath);
    
    console.log('\n🎯 Generated QR Codes:');
    results.forEach(result => {
        console.log(`   Event ${result.event_id}: ${result.qr_data} → ${result.event_title}`);
    });
    
    console.log('\n📱 Testing Instructions:');
    console.log('1. Open the PNG files in qr-codes/ directory');
    console.log('2. Display them on your screen or print them');
    console.log('3. Open IKOOT QR scanner on your mobile device');
    console.log('4. Scan the QR codes to test event check-in');
    console.log('5. Each scan should show: "Check-in successful! You earned 5 points!"');
    
    console.log('\n🔍 Expected Scanner Behavior:');
    console.log('- Scanner detects format: IKOOT_EVENT:X');
    console.log('- Triggers event check-in flow');
    console.log('- Awards 5 loyalty points per check-in');
    console.log('- Shows success message with event details');
    
    return results;
}

// Run the generator
generateAllQRCodes().catch(console.error);