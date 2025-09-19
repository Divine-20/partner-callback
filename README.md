# G2Sentry Partner Callback API

A NestJS-based webhook service for receiving job status callbacks from the G2Sentry Partner API. This service handles job lifecycle events with HMAC signature verification for security.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run start:dev

# Or start production server
pnpm run start:prod
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Swagger UI
Interactive API documentation is available at: `http://localhost:3000/api/docs`

## 🔗 Endpoints

### 1. Webhook Callback (POST)
**URL:** `/api/v1/job-callback`  
**Method:** `POST`  
**Description:** Main webhook endpoint for receiving job status updates from G2Sentry

#### Headers
- `Content-Type: application/json`
- `X-Signature: t={timestamp},s={signature}` (HMAC-SHA256 signature)

#### Request Body
```json
{
  "jobId": 123,
  "eventType": "JobAssigned",
  "jobName": "Open House at 123 Main St",
  "jobStatus": "Assigned",
  "guardianPhone": "+12345678901"
}
```

#### Event Types
- `JobAssigned` - Guardian assigned to job
- `JobStarted` - Job monitoring started
- `JobCompleted` - Job completed successfully
- `JobWithdrawed` - Job cancelled/withdrawn

#### Response
```json
{
  "success": true,
  "message": "Job callback processed successfully: JobAssigned",
  "jobId": 123,
  "processedAt": "2025-01-27T10:30:00Z"
}
```

### 2. Get Job History (GET)
**URL:** `/api/v1/job-callback/history/{jobId}`  
**Method:** `GET`  
**Description:** Retrieve callback history for a specific job

#### Path Parameters
- `jobId` (number): The job ID to retrieve history for

#### Response
```json
{
  "jobId": 123,
  "callbackCount": 3,
  "callbacks": [
    {
      "jobId": 123,
      "eventType": "JobAssigned",
      "jobName": "Open House at 123 Main St",
      "jobStatus": "Assigned",
      "guardianPhone": "+12345678901",
      "receivedAt": "2025-01-27T10:30:00Z"
    }
  ]
}
```

### 3. Get All History (GET)
**URL:** `/api/v1/job-callback/history`  
**Method:** `GET`  
**Description:** Retrieve callback history for all jobs

#### Response
```json
{
  "totalJobs": 5,
  "totalCallbacks": 12,
  "jobs": [
    {
      "jobId": 123,
      "callbackCount": 3,
      "latestStatus": "JobCompleted",
      "lastUpdated": "2025-01-27T10:30:00Z"
    }
  ]
}
```

### 4. Test Endpoint (POST)
**URL:** `/api/v1/job-callback/test`  
**Method:** `POST`  
**Description:** Test endpoint with sample data (no authentication required)

#### Response
```json
{
  "success": true,
  "message": "Job callback processed successfully: JobAssigned",
  "jobId": 999,
  "processedAt": "2025-01-27T10:30:00Z"
}
```

## 🔐 Security

### HMAC Signature Verification
All webhook requests must include a valid HMAC-SHA256 signature in the `X-Signature` header.

#### Signature Format
```
X-Signature: t={timestamp},s={signature}
```

#### Signature Generation
```javascript
const crypto = require('crypto');
const timestamp = Math.floor(Date.now() / 1000);
const payload = JSON.stringify(requestBody);
const toSign = `${timestamp}.${payload}`;
const signature = crypto
  .createHmac('sha256', 'YOUR_SHARED_SECRET')
  .update(toSign)
  .digest('hex');
const signatureHeader = `t=${timestamp},s=${signature}`;
```

#### Security Features
- HMAC-SHA256 signature verification
- Timestamp validation (5-minute window)
- Raw body preservation for signature verification
- Timing-safe comparison to prevent timing attacks

## 🛠️ Configuration

### Environment Variables
- `PORT` - Server port (default: 3000)


### CORS
CORS is enabled for all origins with support for:
- All HTTP methods
- Credentials
- All headers

## 📊 Monitoring & Logging

The service provides comprehensive logging for:
- ✅ Successful callback processing
- ❌ Authentication failures
- 📚 Callback history storage
- 🔄 Job status updates
- ⚡ Workflow triggers
- 📧 Notification sending

## 🧪 Testing

### Run Tests
```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

### Manual Testing
1. Start the server: `pnpm run start:dev`
2. Visit the test endpoint: `POST http://localhost:3000/api/v1/job-callback/test`
3. Check Swagger UI: `http://localhost:3000/api/docs`

## 🚀 Deployment

### Production Build
```bash
pnpm run build
pnpm run start:prod
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

## 📝 Development

### Available Scripts
- `pnpm run start` - Start the application
- `pnpm run start:dev` - Start in development mode with hot reload
- `pnpm run start:debug` - Start in debug mode
- `pnpm run build` - Build the application
- `pnpm run format` - Format code with Prettier
- `pnpm run lint` - Run ESLint

### Project Structure
```
src/
├── controllers/          # API controllers
│   └── job-callback.controller.ts
├── dto/                  # Data Transfer Objects
│   ├── job-callback.dto.ts
│   └── callback-response.dto.ts
├── services/             # Business logic
│   └── job-callback.service.ts
├── app.module.ts         # Main application module
└── main.ts              # Application entry point
```

## 🤝 Integration

### Partner API Integration
Configure your G2Sentry Partner API to send callbacks to:
```
http://your-domain.com/api/v1/job-callback
```

### Required Headers
- `Content-Type: application/json`
- `X-Signature: t={timestamp},s={signature}`

### Expected Response
The service will respond with HTTP 200 and a JSON response indicating success or failure.

