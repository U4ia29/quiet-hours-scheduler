Quiet Hours Scheduler
A full-stack web application for scheduling focused study blocks with automated email reminders. This project demonstrates a complete development lifecycle, from user authentication to backend API logic and CRON job automation.

Core Features
User Authentication: Secure sign-up and login via Supabase.

Schedule Management: Authenticated users can create and view their own time blocks.

Overlap Prevention: Backend logic prevents the creation of conflicting schedules.

Automated Reminders: A CRON job sends an email reminder 10 minutes before a scheduled block begins.

Tech Stack
Framework: Next.js (App Router)

Styling: Tailwind CSS

Database: MongoDB Atlas

Services: Supabase (Auth), SendGrid (Email)

Deployment: Vercel

Local Setup Guide
1. Prerequisites
You will need accounts for Supabase, MongoDB Atlas, and SendGrid.

2. Installation
Clone the repository and install dependencies.

git clone https://github.com/your-username/quiet-hours-scheduler.git
cd quiet-hours-scheduler
npm install

3. Environment Variables
Create a .env file in the root directory and add the following keys from your service accounts:

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# MongoDB
MONGODB_URI=...

# SendGrid
SENDGRID_API_KEY=...
FROM_EMAIL=...

# CRON Protection
CRON_SECRET=...

4. Run the Project
Start the development server.

npm run dev
Open http://localhost:3000. You can create a test user via the sign-up page to test the application.