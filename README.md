# 📊 Offline Attribution Reporting Service

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="100" alt="NestJS logo" />
</p>

> Attribution API is a **backend-first, API-driven platform** for bridging the gap between **offline marketing campaigns** (TV, radio, print, billboards, flyers, events) and **digital attribution**.  
It enables businesses to track, measure, and prove ROI on offline campaigns with the same granularity as online advertising — built with **NestJS**, **Prisma**, **Bull**, and **Puppeteer**.

--

## 📑 Table of Contents
- [📊 Offline Attribution Reporting Service](#-offline-attribution-reporting-service)
  - [📑 Table of Contents](#-table-of-contents)
  - [🚀 Features](#-features)
  - [🧱 Architecture Overview](#-architecture-overview)
  - [🧱 Tech Stack](#-tech-stack)
  - [🛠 Getting Started](#-getting-started)
    - [Prerequisites](#prerequisites)
  - [⚙️ Installation](#️-installation)
    - [Environment Variables](#environment-variables)
    - [Database Setup](#database-setup)
  - [🛠️ Running the App](#️-running-the-app)
  - [📦 Docker](#-docker)
  - [📘 API Documentation](#-api-documentation)
  - [🔌 API Endpoints](#-api-endpoints)
    - [📄 Reports](#-reports)
    - [🧾 Report Logs](#-report-logs)
  - [💻 Usage Examples](#-usage-examples)
    - [Create a Campaign](#create-a-campaign)
    - [Generate QR Code](#generate-qr-code)
    - [Download Report](#download-report)
  - [🧠 Behavior](#-behavior)
  - [� Deployment](#-deployment)
    - [Docker](#docker)
    - [Render](#render)
  - [📌 Future Features](#-future-features)
  - [📝 License](#-license)
---

## 🚀 Features

- Automated PDF campaign reports (daily, with KPIs and funnel analytics)
- 🖨️ Generate clean PDF reports from campaign data
- Role-based authentication (Firebase)
- ⏱️ Daily scheduled reports (7 AM) for yesterday’s campaigns
- 📊 Tracks key KPIs, promo code performance, and funnel steps
- 🔁 Retry failed report generations (up to 3 times)
- 📁 Logs every report run (success or failure)
- Resilient job queue with BullMQ (Redis)
- 🧾 HTML preview + file-based PDF download
- Fully containerized for cloud deployments

--

## 🧱 Architecture Overview
```
Client Apps (QR Scan / Promo Code)
        ↓
   Attribution API (NestJS)
   - Campaign Service
   - Codes Service
   - Interaction Service
   - Conversion Service
   - Reports Service
        ↓
Database (PostgreSQL + Prisma)
Queue (Redis + BullMQ)
PDF Engine (Puppeteer + Handlebars)
Auth (Firebase)
```

---

## 🧱 Tech Stack

| Layer           | Stack                           |
|_________________|_________________________________|
| Framework       | NestJS                          |
| Database        | PostgreSQL                      |
| ORM             | Prisma ORM                      |
| Queue System    | BullMQ (Redis)                  |
| Scheduler       | `@nestjs/schedule`              |
| PDF Engine      | Puppeteer                       |
| Templating      | Handlebars                      |
| Authentication  | Firebase Admin SDK              |
| Email           | Mailtrap via nodemailer         |
| Container       | Docker-ready                    |
|_________________|_________________________________|

---

## 🛠 Getting Started

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6
- Docker (optional, for containerized setup)

## ⚙️ Installation

```bash
git clone https://github.com/George-Acquah/attribution-api.git
cd attribution-api
pnpm install
```

### Environment Variables
Create a `.env` file in the project root:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/attribution"
REDIS_URL="redis://localhost:6379"
FIREBASE_PROJECT_ID="your-firebase-project"
FIREBASE_CLIENT_EMAIL="your-firebase-client-email"
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
REPORTS_BUCKET="reports-storage"
```

### Database Setup
```bash
npx prisma migrate dev --name init
npx prisma generate
```
---

## 🛠️ Running the App

```bash
# dev mode
pnpm run start:dev

# prod build
pnpm run start:prod
```

---

## 📦 Docker

```bash
docker build -t attribution-reporter .
docker run -p 3000:3000 --env-file .env attribution-reporter
```

---

## 📘 API Documentation
Swagger UI is available at:

```
http://localhost:3000/api/v1/docs
```

Endpoints include:
- `POST /api/campaigns` → Create a campaign
- `POST /api/codes` → Generate QR/Promo codes
- `POST /api/interactions` → Log QR scans or events
- `POST /api/conversions` → Capture signups or purchases
- `GET /api/reports/:campaignId` → Download PDF report

---

## 🔌 API Endpoints

### 📄 Reports

| Method | Endpoint                               | Description                      |
|--------|----------------------------------------|----------------------------------|
| POST   | `/reports/:campaignId/generate`        | Queue a report for background PDF generation |
| POST   | `/reports/:campaignId/manual`          | Generate a report synchronously |
| GET    | `/reports/:campaignId/view`            | Render an HTML preview |
| GET    | `/reports/:campaignId/download`        | Download generated PDF |

---

### 🧾 Report Logs

| Method | Endpoint                              | Description                      |
|--------|----------------------------------------|----------------------------------|
| GET    | `/report-logs`                        | List all report logs             |
| POST   | `/report-logs/:logId/retry`           | Retry a failed report (max 3x)   |
| POST   | `/report-logs/retry-all`              | Retry all failed reports         |

---

## 💻 Usage Examples

### Create a Campaign
```bash
curl -X POST http://localhost:3000/api/campaigns   -H "Authorization: Bearer <token>"   -H "Content-Type: application/json"   -d '{"name":"Summer Promo","budget":10000,"channel":"Billboard"}'
```

### Generate QR Code
```bash
curl -X POST http://localhost:3000/api/codes   -H "Authorization: Bearer <token>"   -d '{"campaignId":"12345"}'
```

### Download Report
```bash
curl -X GET http://localhost:3000/api/reports/12345   -H "Authorization: Bearer <token>" -o report.pdf
```
---

## 🧠 Behavior

- **Daily scheduled reports** run at **7 AM**, targeting campaigns that started *yesterday*.
- Each generation attempt is logged in the `report_logs` table with:
  - `status`: `success` or `failed`
  - `filePath`: path to saved PDF
  - `retryCount`: number of retries
  - `userId`: optional user ID for accountability
- Reports are saved to `/reports/` locally

---

## 🚢 Deployment

### Docker
```bash
docker build -t attribution-api .
docker run -p 3000:3000 --env-file .env attribution-api
```

### Render
- Configure PostgreSQL & Redis add-ons
- Set environment variables
- Deploy container

---

## 📌 Future Features

- [ ] Auth with JWT or API Key
- [ ] Upload to S3/Supabase
- [ ] Email report notifications
- [ ] Dashboard with logs and filters
- [ ] Webhook support

---

## 📝 License

MIT