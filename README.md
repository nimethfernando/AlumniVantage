# 🎓 AlumniVantage

AlumniVantage is a secure, client-agnostic Web API and Analytics Platform designed to revolutionize how universities interact with their graduates. It provides real-time, actionable intelligence on graduate outcomes, tracks curriculum skills gaps, and features a blind bidding system for alumni profile promotion.

## 🌟 Core Features

- **University Intelligence Dashboard:** Interactive data visualizations (powered by Recharts) tracking employment sectors, geographic distribution, and curriculum skills gaps.
- **Advanced Alumni Directory:** Dynamic filtering system to locate alumni by degree programme, graduation year, and industry sector.
- **Automated Blind Bidding System:** A gamified feature allowing alumni to bid for front-page visibility, powered by automated Node.js CRON jobs for midnight selection.
- **Enterprise-Grade Security:** Implements Defense-in-Depth strategies including Helmet.js (CSP), CSRF tokens, strict Rate Limiting, Bcrypt password hashing, and granular API Key scoping (`read:alumni`, `read:analytics`).
- **Comprehensive Reporting:** Export filtered dashboard analytics directly to PDF or CSV formats.

## 🛠️ Technology Stack

- **Frontend:** React.js, Vite, Axios, Recharts (Data Visualization)
- **Backend:** Node.js, Express.js
- **Database:** MySQL (Structured in 3NF)
- **Authentication:** JWT (JSON Web Tokens) stored in HttpOnly cookies
- **Documentation:** Swagger UI

---

## 🚀 Getting Started: Setup Instructions

Follow these instructions to run the AlumniVantage platform on your local machine.

### Prerequisites
Before you begin, ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v16 or higher)
* [MySQL Server](https://dev.mysql.com/downloads/)

### 1. Database Setup
1. Open your MySQL client (e.g., MySQL Workbench or terminal).
2. Create the database and build the tables by running the provided SQL script:
   ```bash
   # If using terminal:
   mysql -u root -p < server/schema.sql