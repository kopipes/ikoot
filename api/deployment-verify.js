// Deployment verification endpoint with timestamp
module.exports = (req, res) => {
    const deploymentInfo = {
        success: true,
        message: 'Deployment verification endpoint active',
        timestamp: '2025-01-19T05:26:16Z',
        deployment_id: 'cache-bust-v3',
        status: 'FRESH_DEPLOYMENT_CONFIRMED',
        checkin_endpoints: [
            '/api/events/1/checkin',
            '/api/events/1/checkin-v3',
            '/api/events/1/test-checkin'
        ],
        test_instructions: [
            '1. Test /api/events/1/checkin-v3 with POST and user_email',
            '2. Should return success with hardcoded event data',
            '3. If this endpoint works, cache is cleared'
        ]
    };
    
    console.log('📡 Deployment verification called:', deploymentInfo.timestamp);
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.status(200).json(deploymentInfo);
};