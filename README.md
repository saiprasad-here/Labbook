# 🧪 Labbook Connect

Welcome to **Labbook Connect**, a modern platform designed to bridge the gap between students and faculty for seamless laboratory record management, submission, and review. Built with performance and AI-driven insights in mind!

![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

## ✨ Features

- **🔐 Secure Authentication**: Role-based access control for Students and Faculty powered by Supabase Auth.
- **📄 Digital Submissions**: Students can effortlessly upload their lab records in PDF format directly to the platform.
- **👩‍🏫 Faculty Dashboard**: A dedicated portal for faculty to track, manage, and evaluate student submissions.
- **🤖 AI-Powered Reviews**: Integration with Google Generative AI to provide smart insights and assist faculty in the evaluation process.
- **🎨 Beautiful UI**: Crafted using Shadcn UI and Tailwind CSS, featuring a responsive, accessible, and stunning user interface with dark mode support.

## 🚀 Getting Started

Follow these steps to get the project up and running locally.

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine. We recommend using `npm` to manage dependencies.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/labbook-connect.git
   cd labbook-connect
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   You will need to connect the project to Supabase and Google Generative AI. 
   Create a `.env` file in the root directory and add the following:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_google_gemini_api_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the App:**  
   Navigate to `http://localhost:5173` in your browser to see the application in action.

## 🏗 Tech Stack

- **Frontend**: React (Vite), TypeScript
- **Styling**: Tailwind CSS, Shadcn UI, Framer Motion
- **Backend/Database**: Supabase (PostgreSQL, Storage, Auth)
- **AI Integration**: Google Generative AI (Gemini)
