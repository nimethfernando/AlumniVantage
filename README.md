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
2. Backend (Server) Setup
Open a terminal and navigate to the server directory:

Bash
cd server
Install the required Node dependencies:

Bash
npm install
Copy the example environment file and configure it:

Bash
cp .env.example .env
Open the new server/.env file and update the DB_PASSWORD, JWT_SECRET, and EMAIL_PASS variables with your local credentials.

3. Frontend (Client) Setup
Open a new terminal window and navigate to the client directory:

Bash
cd client
Install the required Node dependencies:

Bash
npm install
Copy the example environment file for the client:

Bash
cp .env.example .env
Open the client/.env file and add your scoped developer API keys if necessary:

Code snippet
VITE_ALUMNI_API_KEY=your_directory_key_here
VITE_ANALYTICS_API_KEY=your_analytics_key_here
💻 Running the Application
To run the full stack, you will need two terminal windows open.

1. Start the Backend Server:

Bash
cd server
npm run dev
The backend will launch on http://localhost:3000 and confirm the database connection.

2. Start the Frontend Client:

Bash
cd client
npm run dev
The frontend will launch on http://localhost:5173.

📚 API Documentation
AlumniVantage features comprehensive, interactive API documentation. Once the backend server is running, you can explore all endpoints, schemas, and security requirements by visiting:

👉 http://localhost:3000/api-docs

🛡️ Architecture & Data Governance
This API uses a dual-authentication model to ensure strict data security:

User Identity (JWT): Verifies who is making the request (Admin vs. Alumnus). Handled securely via HttpOnly cookies to prevent Cross-Site Scripting (XSS).

Client Identification (API Keys): Verifies which application is making the request. Keys are strictly scoped (e.g., a key scoped for the Alumni Directory cannot access Dashboard Analytics).   