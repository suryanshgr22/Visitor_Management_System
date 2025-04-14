# Visitor Management System

![License](https://img.shields.io/badge/license-MIT-blue.svg)

A modern, full-stack visitor management solution designed to streamline the check-in/check-out process for organizations of all sizes. This system offers an intuitive interface for hosts to manage visitors and for gate staff to process arrivals and departures efficiently.
# Watch the video (Click on the image)
[![Watch the video](https://img.youtube.com/vi/U085pv0QHtw/maxresdefault.jpg)](https://www.youtube.com/watch?v=U085pv0QHtw)

## 📋 Features

### Admin Features
- User management (hosts, gate staff, and admins)
- Dashboard with analytics and visitor statistics
- Pre-approval limit configuration for hosts
- System-wide settings management

### Host Features
- Approve or decline visitor requests
- Pre-approve visitors for streamlined check-in
- Generate QR badges for approved visitors
- Real-time notifications for visitor arrivals
- View visitor history and status

### Gate Features
- Scan QR codes for quick check-in/check-out
- Process walk-in visitors
- View today's expected visitors
- Real-time updates on visitor status changes
- Visitor badge generation

### Visitor Experience
- Pre-registration through hosts
- Quick check-in/check-out with QR codes
- Digital badges for building access
- Automated notifications to hosts upon arrival

## 🛠️ Technology Stack

### Frontend
- React.js with hooks for state management
- Tailwind CSS for modern responsive UI
- Socket.IO client for real-time updates
- React Router for navigation
- Axios for API requests

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ORM
- JWT for authentication
- Socket.IO for real-time communication
- RESTful API architecture

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or newer)
- MongoDB (local or Atlas connection)
- npm or yarn package manager

### Installation

#### Clone the repository
```bash
git clone https://github.com/yourusername/Visitor_Management_System.git
cd Visitor_Management_System
```

#### Set up the backend
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/visitor-management
JWT_SECRET=your_jwt_secret_key
```

#### Set up the frontend
```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend directory with:
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Running the application

#### Start the backend server
```bash
cd backend
npm run dev
```

#### Start the frontend development server
```bash
cd frontend
npm run dev
```

The application will now be running at `http://localhost:5173` and the API at `http://localhost:5000/api`.

## 📱 Usage

### Default Credentials

The system is initialized with the following default accounts:

**Admin:**
- Username: admin
- Password: admin123

**Gate:**
- Login ID: gate1
- Password: gate123

### Basic Workflow

1. **Admin** creates host accounts and gate staff accounts
2. **Hosts** pre-approve visitors or approve incoming visitor requests
3. **Gate Staff** scans visitor QR codes or processes walk-ins by sending approval request to respective host.
4. **Visitors** receive digital badges with QR codes for access.
5. **Hosts** receive notifications when gate staff send request for approval for a visitor

## 📄 API Documentation

The API follows RESTful principles with the following main endpoints:


- `/api/admin`: Admin management endpoints
- `/api/host`: Host operations endpoints
- `/api/gate`: Gate operations endpoints




## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt

## 📊 Future Enhancements

- Email and SMS notifications
- Custom badge design options
- Visitor analytics and reporting
- Multi-location support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



## 👥 Authors

- Suryansh - [GitHub Profile](https://github.com/suryanshgr22)

## 🙏 Acknowledgements

- [React.js](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Socket.IO](https://socket.io/) 
