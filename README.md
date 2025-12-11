# Bitbucket to Google Sheets Sync

Fetches all commits from a Bitbucket repository and exports them to Google Sheets.

## Project Structure

```
├── src/
│   ├── types/
│   │   └── index.ts          # Type definitions
│   ├── config/
│   │   └── index.ts          # Configuration loader
│   ├── services/
│   │   ├── bitbucket.service.ts    # Bitbucket API client
│   │   └── google-sheets.service.ts # Google Sheets client
│   └── index.ts              # Entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Bitbucket Access Token
1. Go to Bitbucket Settings → Personal settings → App passwords
2. Create a new app password with **Repository: Read** permission, OR
3. Use a Bitbucket access token (OAuth 2.0)
4. Save the generated access token

### 3. Google Sheets Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project and enable the **Google Sheets API**
3. Create a Service Account and download the JSON credentials
4. Save as `credentials.json` in project root
5. Share your Google Sheet with the service account email

### 4. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

## Usage

### CLI Mode (Direct Execution)

```bash
# Development
pnpm run dev

# Production
pnpm run build
pnpm start
```

### API Mode (REST API Server)

```bash
# Development
pnpm run dev:server
# or
pnpm run server

# Production
pnpm run build
pnpm run start:server
```

The API server will start on `http://localhost:3000` (or the port specified in `PORT` environment variable).

#### API Endpoints

- **Health Check**: `GET http://localhost:3000/health`
  - Returns server status

- **Generate Report**: `GET` or `POST http://localhost:3000/api/generate-report`
  - Triggers the sync process
  - Returns JSON response with success status and commit count

#### Example API Usage

```bash
# Using curl
curl http://localhost:3000/api/generate-report

# Or with POST
curl -X POST http://localhost:3000/api/generate-report
```

**Response:**
```json
{
  "success": true,
  "message": "Report generated successfully",
  "commitsCount": 49,
  "repository": "thegrowthteam/menu-monitor",
  "spreadsheetId": "1hgqd5G4EK45-HXM4iwp5Osy_Xsm8Pwk9qT3WMfkMnTo"
}
```

## Output

The script creates a sheet with columns:
- Hash, Short Hash, Message, Author, Email, Date, Parents, Repository