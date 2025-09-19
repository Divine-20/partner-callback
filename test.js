const crypto = require('crypto');

const hmacSecret = 'JLwe345A2Wjd45';
const timestamp = Math.floor(Date.now() / 1000);

const payload = {
  jobId: 5,
  eventType: 'JobAssigned',
  jobName: 'Open House at 123 Main St',
  jobStatus: 'Assigned',
  guardianPhone: '1234567890',
};

const payloadString = JSON.stringify(payload);
const toSign = `${timestamp}.${payloadString}`;

const signature = crypto
  .createHmac('sha256', hmacSecret)
  .update(toSign)
  .digest('hex');

console.log('X-Signature header value:');
console.log(`t=${timestamp},s=${signature}`);
console.log('\nCopy this to Postman:');
console.log(`X-Signature: t=${timestamp},s=${signature}`);
