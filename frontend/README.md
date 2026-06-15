# University Admission Portal

A modern, responsive web application for managing university student admissions with a beautiful user interface.

## Features

- **Modern React Interface**: Built with React 18 hooks and modern JavaScript practices
- **Student Enrollment Form**: Collect student details including name, father's name, mother's name, and course selection
- **Unique Enrollment Numbers**: Automatically generated unique enrollment IDs for each student
- **Statistics Dashboard**: Real-time statistics showing total students, active courses, and popular courses
- **Advanced Search & Filter**: Search by name or enrollment number, filter by course
- **Student Management**: View all enrolled students with their complete information
- **Data Export**: Export all student data as JSON file
- **Data Persistence**: All data is stored locally in the browser using localStorage
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Beautiful gradient design with smooth animations, hover effects, and glassmorphism
- **Form Validation**: Ensures all required fields are filled before submission
- **Loading States**: Smooth loading animations and disabled states during operations
- **Modern Notifications**: Dismissible success/error messages with auto-hide
- **Component Architecture**: Modular React components for better maintainability

## Technology Stack

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and development server
- **Lucide React**: Beautiful icons
- **CSS3**: Modern styling with gradients and animations
- **LocalStorage**: Client-side data persistence

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone or download this project
2. Navigate to the project directory:
   ```bash
   cd university-admission-portal
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and visit `http://localhost:3000`

### Building for Production

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Usage

### Adding a New Student

1. Fill in the "New Student Admission" form with:
   - Student Name (required)
   - Father's Name (required)
   - Mother's Name (required)
   - Course selection (required)

2. Click "Enroll Student" to submit the form
3. A unique enrollment number will be automatically generated
4. The student will appear in the "Enrolled Students" section

### Managing Students

- **View Students**: All enrolled students are displayed in cards showing their complete information
- **Remove Students**: Click the "Remove Student" button on any student card to delete them
- **Data Persistence**: All data is automatically saved to your browser's localStorage

## Available Courses

The portal includes the following course options:
- Computer Science
- Engineering
- Business Administration
- Medicine
- Law
- Arts & Humanities
- Science
- Education
- Economics
- Psychology

## Enrollment Number Format

Enrollment numbers are automatically generated in the format: `EN[YEAR][4-digit-random-number]`

Example: `EN20241234`

## File Structure

```
university-admission-portal/
├── src/
│   ├── App.jsx                    # Main application component
│   ├── main.jsx                   # React entry point
│   ├── index.css                  # Global styles
│   └── components/
│       ├── LoadingSpinner.jsx     # Reusable loading component
│       └── Notification.jsx       # Modern notification component
├── index.html                     # HTML template
├── package.json                   # Dependencies and scripts
├── vite.config.js                 # Vite configuration
└── README.md                     # This file
```

## Browser Compatibility

This application works on all modern browsers that support:
- ES6+ JavaScript features
- CSS Grid and Flexbox
- LocalStorage API

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the [MIT License](LICENSE). 