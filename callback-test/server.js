const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'JLwe345A2Wjd45'; // Same key used by G2Sentry

app.use(bodyParser.json());

// Middleware to verify HMAC signature
const verifySignature = (req, res, next) => {
    const signature = req.headers['x-signature'];
    const payload = JSON.stringify(req.body);
    
    if (!signature) {
        return res.status(401).json({ error: 'Missing X-Signature header' });
    }

    const expectedSignature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(payload)
        .digest('hex');

    if (signature !== expectedSignature) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    next();
};

// Webhook endpoint
app.post('https://1cab376f1c96.ngrok-free.app/api/v1/job-callback', verifySignature, (req, res) => {
    console.log('📨 Received webhook:', {
        timestamp: new Date().toISOString(),
        headers: req.headers,
        body: req.body
    });

    // Process the job status update
    const { jobId, eventType, jobName, jobStatus, guardianPhone } = req.body;
    
    console.log('🔧 Processing job update:');
    console.log(`   Job ID: ${jobId}`);
    console.log(`   Event: ${eventType}`);
    console.log(`   Job Name: ${jobName}`);
    console.log(`   Status: ${jobStatus}`);
    console.log(`   Guardian Phone: ${guardianPhone}`);

    // Here you would typically update your database or trigger other actions
    res.status(200).json({ 
        success: true, 
        message: 'Webhook received successfully',
        receivedAt: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Webhook server running on http://localhost:${PORT}`);
    console.log(`📋 Endpoint: http://localhost:${PORT}/api/v1/job-caliback`);
});