# Sweety – Blood Glucose Tracker

Sweety is a full-stack blood glucose tracking application built to help users record, monitor, and understand their glucose readings through a simple dashboard.

## Features

- **User authentication:** Register and log in securely using password hashing and JWT authentication.
- **Dashboard:** View glucose statistics, recent readings, and daily summaries.
- **Glucose tracking:** Add, view, edit, and delete glucose readings.
- **Reading validation:** Validate glucose values, dates, and time slots.
- **Daily limits:** Support up to four readings per day, one for each supported time slot.
- **Reports:** View daily, month-to-date, and previous-month summaries.
- **Charts:** Visualize glucose trends with daily averages and min–max ranges.
- **Search:** Find readings using their date, time slot, or glucose value.
- **Notifications:** View recent reading updates and reminders.
- **Settings:** Customize appearance, theme, and layout density.
- **Responsive UI:** Designed to work across desktop and mobile screens.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Database hosting | Supabase |
| Authentication | JWT, bcrypt |
| Charts | Recharts |
| Icons | Lucide React |
| Testing | Node.js test setup |

## Project Structure

```text
sweety/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── ...
│   └── package.json
│
├── server/
│   ├── ...
│   └── package.json
│
├── README.md
└── .gitignore
```

## Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL database
- Supabase project or another PostgreSQL instance

### 1. Clone the repository

```bash
git clone https://github.com/Roopesh431/sweety-glucose-tracker.git
cd sweety-glucose-tracker
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory and configure the environment variables required by the backend.

Do not commit your `.env` file or expose database credentials or JWT secrets.

### 3. Start the backend

Use the development command configured in `server/package.json`.

### 4. Configure and start the frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite in your browser.

## Glucose Reading Rules

- Supported time slots:
  - Morning
  - After breakfast
  - After lunch
  - After dinner
- Accepted glucose range: 40–600 mg/dL.
- A user can record one reading per time slot per day.
- Maximum of four readings per day.
- Future dates are not accepted.
- Users can access only their own readings.

## Testing

Run the backend test suite:

```bash
cd server
npm test
```

Build the frontend:

```bash
cd client
npm run build
```

## Security Notes

- Passwords are hashed before storage.
- Protected routes require valid authentication.
- User-specific data access is enforced by the backend.
- Environment variables are used for sensitive configuration.

## Author

**Roopesh**

GitHub: [@Roopesh431](https://github.com/Roopesh431)

---

*Sweety – A blood glucose tracking application built as a full-stack development assignment.*