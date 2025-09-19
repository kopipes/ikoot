// Simple test endpoint to verify deployment is working
module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    res.status(200).json({
        success: true,
        message: 'Deployment test successful!',
        timestamp: new Date().toISOString(),
        method: req.method,
        environment: 'Vercel Serverless',
        node_version: process.version,
        available_modules: {
            fs: typeof require('fs') !== 'undefined',
            path: typeof require('path') !== 'undefined',
            crypto: typeof require('crypto') !== 'undefined'
        }
    });
};