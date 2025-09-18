#!/usr/bin/env node

// Simple test to verify carousel functionality
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

async function testCarousel() {
    try {
        // Read the HTML file
        const htmlPath = path.join(__dirname, 'index.html');
        const html = fs.readFileSync(htmlPath, 'utf8');
        
        // Read the CSS file
        const cssPath = path.join(__dirname, 'css/style.css');
        const css = fs.readFileSync(cssPath, 'utf8');
        
        // Read the JS file
        const jsPath = path.join(__dirname, 'js/main.js');
        const js = fs.readFileSync(jsPath, 'utf8');
        
        // Create JSDOM instance
        const dom = new JSDOM(html, {
            url: 'http://localhost:3001',
            resources: 'usable',
            runScripts: 'dangerously'
        });
        
        const { window } = dom;
        const { document } = window;
        
        // Add CSS
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        
        // Use real API for testing
        const originalFetch = require('node-fetch');
        window.fetch = async (url) => {
            try {
                const realUrl = url.startsWith('/') ? `http://localhost:3001${url}` : url;
                const response = await originalFetch(realUrl);
                return {
                    ok: response.ok,
                    json: async () => await response.json()
                };
            } catch (error) {
                console.log('Fetch error:', error.message);
                return { ok: false, error: error.message };
            }
        };
        
        // Execute the main JavaScript
        const script = document.createElement('script');
        script.textContent = js;
        document.body.appendChild(script);
        
        // Wait for the DOM to be ready and scripts to execute
        await new Promise(resolve => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        });
        
        // Wait a bit for async operations
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('🔍 Testing Carousel Functionality...\n');
        
        // Test carousel elements exist
        const currentEventsCarousel = document.getElementById('currentEventsCarousel');
        const upcomingEventsCarousel = document.getElementById('upcomingEventsCarousel');
        const currentEventsPrev = document.getElementById('currentEventsPrev');
        const currentEventsNext = document.getElementById('currentEventsNext');
        const upcomingEventsPrev = document.getElementById('upcomingEventsPrev');
        const upcomingEventsNext = document.getElementById('upcomingEventsNext');
        
        console.log('✅ Carousel Elements Check:');
        console.log(`  - Current Events Carousel: ${currentEventsCarousel ? 'Found' : 'Missing'}`);
        console.log(`  - Upcoming Events Carousel: ${upcomingEventsCarousel ? 'Found' : 'Missing'}`);
        console.log(`  - Current Events Navigation: ${currentEventsPrev && currentEventsNext ? 'Found' : 'Missing'}`);
        console.log(`  - Upcoming Events Navigation: ${upcomingEventsPrev && upcomingEventsNext ? 'Found' : 'Missing'}\n`);
        
        // Check if events are loaded
        const currentEventCards = currentEventsCarousel?.querySelectorAll('.event-card') || [];
        const upcomingEventCards = upcomingEventsCarousel?.querySelectorAll('.event-card') || [];
        
        console.log('📅 Event Cards Check:');
        console.log(`  - Current Event Cards: ${currentEventCards.length}`);
        console.log(`  - Upcoming Event Cards: ${upcomingEventCards.length}\n`);
        
        // Test navigation button clicks
        if (currentEventsNext && currentEventCards.length > 0) {
            console.log('🖱️  Testing Current Events Navigation...');
            
            // Get initial transform
            const initialTransform = currentEventsCarousel.style.transform || 'translateX(0px)';
            console.log(`  - Initial transform: ${initialTransform}`);
            
            // Click next button
            currentEventsNext.click();
            
            // Wait for animation
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const afterClickTransform = currentEventsCarousel.style.transform || 'translateX(0px)';
            console.log(`  - After next click: ${afterClickTransform}`);
            
            if (initialTransform !== afterClickTransform) {
                console.log('  ✅ Current events navigation is working!\n');
            } else {
                console.log('  ❌ Current events navigation might have issues\n');
            }
        }
        
        if (upcomingEventsNext && upcomingEventCards.length > 3) {
            console.log('🖱️  Testing Upcoming Events Navigation...');
            
            // Get initial transform
            const initialTransform = upcomingEventsCarousel.style.transform || 'translateX(0px)';
            console.log(`  - Initial transform: ${initialTransform}`);
            
            // Click next button
            upcomingEventsNext.click();
            
            // Wait for animation
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const afterClickTransform = upcomingEventsCarousel.style.transform || 'translateX(0px)';
            console.log(`  - After next click: ${afterClickTransform}`);
            
            if (initialTransform !== afterClickTransform) {
                console.log('  ✅ Upcoming events navigation is working!\n');
            } else {
                console.log('  ❌ Upcoming events navigation might have issues\n');
            }
        }
        
        // Test card width calculation
        if (currentEventCards.length > 0) {
            const firstCard = currentEventCards[0];
            const cardRect = firstCard.getBoundingClientRect();
            const carouselStyle = window.getComputedStyle(currentEventsCarousel);
            const gap = parseInt(carouselStyle.gap) || 20;
            
            console.log('📏 Card Dimensions:');
            console.log(`  - Card width: ${cardRect.width}px`);
            console.log(`  - Carousel gap: ${gap}px`);
            console.log(`  - Total slide width: ${cardRect.width + gap}px\n`);
        }
        
        console.log('🎯 Test Complete!\n');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Check if jsdom is available
try {
    require('jsdom');
    testCarousel();
} catch (e) {
    console.log('📦 Installing jsdom for testing...');
    const { execSync } = require('child_process');
    try {
        execSync('npm install jsdom', { cwd: __dirname, stdio: 'inherit' });
        console.log('✅ jsdom installed, running test...\n');
        testCarousel();
    } catch (installError) {
        console.log('❌ Could not install jsdom. Testing manually instead...\n');
        console.log('🔍 Manual Test Instructions:');
        console.log('1. Open http://localhost:3001 in your browser');
        console.log('2. Open browser dev tools (F12)');
        console.log('3. Check if event cards are visible in both carousels');
        console.log('4. Try clicking the arrow buttons to navigate');
        console.log('5. Look for console errors or debug messages');
        console.log('6. On mobile, try swiping the carousels left/right\n');
    }
}