# ShareFare - AI Agent Instructions

## Project Overview
ShareFare is a ride-sharing application built with a MERN stack (MongoDB, Express.js, React, Node.js). The project follows a clear client-server architecture with separate frontend and backend directories.

## Architecture

### Backend (`/backend`)
- Express.js server with MongoDB integration
- RESTful API endpoints under `/api/rides`
- MongoDB connection at `mongodb://127.0.0.1:27017/sharefare`
- Models define data structure in `/backend/models`
- Routes handle API logic in `/backend/routes`

### Frontend (`/frontend`)
- React application built with Vite
- Client-side routing with `react-router-dom`
- Page components in `/frontend/src/pages`
- Reusable UI components in `/frontend/src/components`

## Key Data Models

### RideRequest Schema
```javascript
{
  name: String,           // Required: Person offering ride
  contact: String,        // Required: Contact information
  destination: String,    // Required: Destination location
  datetime: Date,        // Required: Ride time
  seatsAvailable: Number, // Default: 1
  notes: String,         // Optional additional information
  pickupCoords: {        // Location coordinates
    lat: Number,
    lng: Number
  },
  pendingJoinRequests: [ // Ride join requests
    {
      name: String,
      contact: String,
      message: String,
      status: String     // "pending" | "accepted" | "rejected"
    }
  ]
}
```

## Development Workflow

### Starting the Application
1. Backend: Run MongoDB locally at port 27017
2. Backend: Start server with `npm start` in `/backend` (runs on port 5000)
3. Frontend: Start dev server with `npm run dev` in `/frontend`

### Common Development Tasks
- Frontend route changes: Update `App.jsx`
- API endpoint changes: Modify `/backend/routes/rides.js`
- Data model changes: Update `/backend/models/RideRequest.js`

## Integration Points
- Frontend-Backend communication via REST API
- Frontend makes HTTP requests to `http://localhost:5000/api/rides/*`
- Location data stored as coordinate pairs for map integration

## Project Conventions
- Backend uses CommonJS modules (`require`/`module.exports`)
- Frontend uses ES modules (`import`/`export`)
- React components use functional style with hooks
- API routes follow RESTful naming conventions

## Common Tasks Examples
- Creating a new ride: See `CreateRide.jsx` for form handling and API integration
- Joining a ride: Reference `JoinRide.jsx` for request flow
- Managing rides: Check `MyRides.jsx` for ride status management