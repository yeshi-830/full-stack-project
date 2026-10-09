# Full Stack Project

A full-stack web application built with React, Node.js, Express, and MySQL.

## Features

- React frontend
- REST API built with Express.js
- MySQL database integration
- Environment variable configuration
- Separate frontend and backend folders

## Technologies Used

- React
- Vite
- Node.js
- Express.js
- MySQL
- Git and GitHub

## Project Structure

```text
full-stack-project/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── index.html
│   └── package.json
└── .gitignore
```

## Getting Started

### Prerequisites

- Node.js and npm
- MySQL Server

### Backend Setup

1. Open a terminal in the `backend` folder.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file with your database configuration.
4. Start the backend:

   ```bash
   node server.js
   ```

### Frontend Setup

1. Open another terminal in the `frontend` folder.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

## Security

Keep database passwords and other secrets in your local `.env` file. Never commit real credentials to GitHub.

## Author

GitHub: [yeshi-830](https://github.com/yeshi-830)
