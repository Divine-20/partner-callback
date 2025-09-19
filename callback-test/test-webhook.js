const axios = require('axios');
const crypto = require('crypto');

const WEBHOOK_URL = 'https://partner-callback.onrender.com/api/v1/job-callback';
const SECRET_KEY = 'JLwe345A2Wjd45'; // Must match your SHARED_SECRET

// Sample payloads for different events
const testPayloads = [
    {
        jobId: 8,
        eventType: "JobAssigned",
        jobName: "Open House at 123 Main St",
        jobStatus: "Assigned",
        guardianPhone: "+12345678901"
    },
    {
        jobId: 8,
        eventType: "JobStarted",
        jobName: "Open House at 123 Main St",
        jobStatus: "InProgress",
        guardianPhone: "+12345678901"
    },
    {
        jobId: 8,
        eventType: "JobCanceled",
        jobName: "Open House at 123 Main St",
        jobStatus: "Canceled",
        guardianPhone: "+12345678901"
    }
];

// Generate HMAC signature in the format your controller expects
function generateSignature(payload, secret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const payloadString = JSON.stringify(payload);
    const toSign = `${timestamp}.${payloadString}`;
    
    const signature = crypto
        .createHmac('sha256', secret)
        .update(toSign)
        .digest('hex');
    
    return {
        signatureHeader: `t=${timestamp},s=${signature}`,
        timestamp,
        signature
    };
}

// Test webhook function
async function testWebhook(payload) {
    try {
        const { signatureHeader } = generateSignature(payload, SECRET_KEY);
        
        console.log('🔐 Generated signature header:', signatureHeader);
        
        const response = await axios.post(WEBHOOK_URL, payload, {
            headers: {
                'X-Signature': signatureHeader,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Success:');
        console.log('   Status:', response.status);
        console.log('   Response:', response.data);
        console.log('---');
        
    } catch (error) {
        console.log('❌ Error:');
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Response:', error.response.data);
        } else {
            console.log('   Message:', error.message);
        }
        console.log('---');
    }
}

// Run tests
async function runTests() {
    console.log('🧪 Testing webhook integration with NestJS format...\n');
    console.log('📝 Using secret key:', SECRET_KEY);
    console.log('---');
    
    for (let i = 0; i < testPayloads.length; i++) {
        console.log(`📤 Sending payload ${i + 1}: ${testPayloads[i].eventType}`);
        await testWebhook(testPayloads[i]);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
    }
}

runTests();