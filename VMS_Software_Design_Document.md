# Software Design Document (SDD): Visitor Management System

## 1. Introduction and Overview

### Purpose of the Software
The Visitor Management System (VMS) is a comprehensive digital solution designed to streamline and automate the visitor check-in/check-out process for organizations. It replaces traditional paper-based visitor logs with a modern, efficient system that enhances security, improves visitor experience, and provides better oversight for administrative staff.

### Scope and Objectives
- Digitize and automate the entire visitor management workflow
- Enable pre-registration and pre-approval of visitors
- Provide real-time notifications for hosts when visitors arrive
- Generate QR codes for streamlined check-in/check-out
- Collect and securely store visitor information
- Provide analytics and reporting capabilities
- Support multiple user roles with appropriate access controls

### Target Audience
- Organizations of all sizes requiring visitor management
- Receptionists and gate staff managing visitor entry/exit
- Hosts who receive visitors
- Administrative staff overseeing visitor policies
- Visitors themselves interacting with the check-in process

### Background or Problem Context
Traditional visitor management systems often involve paper logbooks, manual badge creation, and phone calls to notify hosts. This approach is inefficient, error-prone, and offers limited security. The VMS addresses these issues by providing a digital solution that enhances security, improves efficiency, and creates a professional impression for visitors.

## 2. System Architecture

### High-level Description
The VMS follows a modern client-server architecture with a React frontend and Node.js backend. It employs a RESTful API pattern for communication between client and server, with socket-based real-time notifications. The system is database-driven and uses Cloudinary for media storage.

### Architecture Diagram
```
┌─────────────┐     ┌───────────────────────────────────┐     ┌────────────────┐
│             │     │           Application Server       │     │                │
│  Frontend   │◄───►│                                   │◄───►│   MongoDB      │
│  (React.js) │     │  Node.js + Express + Socket.IO    │     │   Database     │
│             │     │                                   │     │                │
└─────────────┘     └───────────────────────────────────┘     └────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │                 │
                          │   Cloudinary    │
                          │  (Media Store)  │
                          │                 │
                          └─────────────────┘
```

### Technology Stack
- **Frontend**: React.js with Hooks, Tailwind CSS, Socket.IO client, React Router, Axios
- **Backend**: Node.js with Express.js, JWT authentication, Socket.IO
- **Database**: MongoDB with Mongoose ORM
- **Media Storage**: Cloudinary for photos and QR codes
- **Real-time Communication**: Socket.IO
- **Authentication**: JWT-based authentication and role-based access control

## 3. Data Design

### Database Schema
The system uses MongoDB with the following core collections:

1. **Users**
   - _id: ObjectId
   - name: String
   - email: String
   - role: String (admin, host, gate)
   - password: String (hashed)
   - department: String
   - createdAt: Date

2. **Visitors**
   - _id: ObjectId
   - fullname: String
   - email: String
   - contact: String
   - purpose: String
   - organisation: String
   - photo: String (URL)
   - hostEmployee: ObjectId (ref: Users)
   - status: String (Waiting, Approved, Declined, Checked-in, Checked-out)
   - preApproved: Boolean
   - badgeIssued: Boolean
   - qrCode: String (URL)
   - checkIn: Date
   - checkOut: Date
   - expectedCheckInFrom: Date
   - expectedCheckInTo: Date
   - createdAt: Date

### Key Data Entities and Relationships

#### User Schema
```javascript
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'host', 'gate'],
    default: 'host'
  },
  department: {
    type: String,
    required: function() { return this.role === 'host'; }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
```

#### Visitor Schema
```javascript
const visitorSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false
  },
  contact: {
    type: String,
    required: false
  },
  purpose: {
    type: String,
    required: true
  },
  organisation: {
    type: String,
    required: false
  },
  photo: {
    type: String,
    required: false
  },
  hostEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Waiting', 'Approved', 'Declined', 'Checked-in', 'Checked-out'],
    default: 'Waiting'
  },
  preApproved: {
    type: Boolean,
    default: false
  },
  badgeIssued: {
    type: Boolean,
    default: false
  },
  qrCode: {
    type: String,
    required: false
  },
  checkIn: {
    type: Date,
    default: null
  },
  checkOut: {
    type: Date,
    default: null
  },
  expectedCheckInFrom: {
    type: Date,
    required: function() { return this.preApproved === true; }
  },
  expectedCheckInTo: {
    type: Date,
    required: function() { return this.preApproved === true; }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
```

#### Entity Relationships
1. **Users to Visitors**:
   - One-to-many relationship
   - A host (User) can have multiple visitors
   - Each visitor is assigned to exactly one host
   - Implemented via `hostEmployee` reference in Visitor schema

2. **Visitors to Badge/QR**:
   - One-to-one relationship
   - Each approved visitor gets a unique QR code
   - QR code is stored as URL in the `qrCode` field
   - Badge status is tracked via `badgeIssued` boolean field

3. **Visitor Status Workflow**:
   - Workflow managed via `status` field
   - Pre-approved visitors start as "Approved"
   - Walk-in visitors start as "Waiting"
   - Host approves/declines changing status to "Approved" or "Declined"
   - Check-in updates status to "Checked-in"
   - Check-out updates status to "Checked-out"

### Data Flow and Storage Strategies
1. **Visitor Registration Flow**:
   - Visitor data is captured via form or pre-approved by host
   - Data is stored in MongoDB
   - Photos and QR codes are stored in Cloudinary

2. **Access Control Strategy**:
   - Role-based permissions (admin, host, gate)
   - Hosts can only access their own visitors
   - Gate staff can access all visitors for the current day
   - Admins have unrestricted access to all data

## 4. Interface Design

### API Design
The system exposes RESTful APIs organized by user roles:

1. **Authentication Endpoints**:
   - `POST /api/auth/login`: User login
   - `POST /api/auth/refresh`: Refresh authentication token

2. **Admin Endpoints**:
   - `GET /api/admin/users`: Get all users
   - `POST /api/admin/users`: Create new user
   - `PUT /api/admin/users/:id`: Update user
   - `DELETE /api/admin/users/:id`: Delete user

3. **Host Endpoints**:
   - `GET /api/host/visitors`: Get all visitors for the host
   - `GET /api/host/pending-requests`: Get pending approval requests
   - `GET /api/host/pre-approved`: Get pre-approved visitors
   - `POST /api/host/visitors`: Add new pre-approved visitor
   - `PUT /api/host/approve/:id`: Approve visitor
   - `PUT /api/host/decline/:id`: Decline visitor
   - `POST /api/host/generate-qr/:id`: Generate QR code for visitor

4. **Gate Endpoints**:
   - `GET /api/gate/visitors`: Get today's visitors
   - `PUT /api/gate/checkin`: Check in visitor using QR code
   - `PUT /api/gate/checkout`: Check out visitor using QR code
   - `POST /api/gate/visitor`: Register walk-in visitor
   - `PUT /api/gate/req-approval`: Request approval for walk-in visitor
   - `POST /api/gate/generate-qr/:id`: Generate QR code for approved visitor

### External System Integrations
- **Cloudinary**: For storing visitor photos and QR code images
- **Socket.IO**: For real-time notifications and updates

### Communication Protocols
- **HTTP/HTTPS**: RESTful API communication
- **WebSockets**: Real-time updates and notifications via Socket.IO
- **JWT**: For secure authentication and authorization

## 5. Component Design

### Major Components

1. **Authentication Module**
   - Handles user login and authentication
   - Manages JWT generation and validation
   - Implements role-based access control

2. **Admin Dashboard**
   - User management (create, read, update, delete)
   - System settings and configuration
   - Analytics and reporting

3. **Host Portal**
   - Visitor pre-approval workflow
   - Approval/decline of visitor requests
   - QR code and badge generation
   - Real-time notifications

4. **Gate Interface**
   - QR code scanning for check-in/check-out
   - Walk-in visitor registration
   - Badge printing
   - Visitor status management

5. **Visitor Processing System**
   - Registration and data collection
   - Status tracking throughout the visit lifecycle
   - QR code generation and validation

6. **Notification System**
   - Real-time socket-based communication
   - Alerts hosts of visitor arrivals
   - Updates gate staff of approval/decline actions

### Component Interactions
- The **Authentication Module** validates requests to all other components
- The **Host Portal** sends approval notifications to the **Notification System**
- The **Gate Interface** uses the **Visitor Processing System** for check-ins/outs
- The **Notification System** pushes updates to relevant users based on events

## 6. User Interface Design

### Key UI Screens

1. **Login Pages**
   - Separate login interfaces for admin, host, and gate staff
   - Username/password authentication with error handling

2. **Admin Dashboard**
   - User management interface with CRUD operations
   - Analytics displays with visitor statistics
   - System settings configuration

3. **Host Dashboard**
   - Pending approval requests section
   - Pre-approved visitors section
   - All visitors section with filtering options
   - Visitor detail modal with approval/decline actions
   - Add visitor form for pre-approvals
   - Badge generation interface

4. **Gate Dashboard**
   - Today's visitors display with status indicators
   - QR code scanner interface for check-in/check-out
   - Walk-in visitor registration form
   - Badge printing interface

5. **Visitor Badge**
   - Digital badge with visitor photo
   - QR code for check-out
   - Visit details (name, host, purpose, time)
   - Print-friendly format

### UX Considerations
- Real-time updates without page refresh using Socket.IO
- Mobile-responsive design for all interfaces
- Accessible color scheme and contrast
- Clear status indicators and feedback for actions
- Optimized printing for visitor badges
- Graceful error handling and user feedback

## 7. Assumptions and Dependencies

### Technical Assumptions
- Users have access to modern web browsers supporting ES6+ JavaScript
- Reliable internet connectivity for cloud-based operations
- Sufficient server resources to handle concurrent users
- HTTPS protocol for secure data transmission
- MongoDB as the primary database

### Dependencies
- **Node.js**: Server-side runtime environment
- **MongoDB**: Database system
- **Cloudinary**: Cloud-based media storage
- **Socket.IO**: Real-time communication
- **JWT**: Authentication mechanism
- **Axios**: HTTP client for API requests
- **React.js**: Frontend framework
- **Tailwind CSS**: Styling framework
- **QR code libraries**: For generating and scanning QR codes
- **PDF generation libraries**: For saving visitor badges

### Environmental Requirements
- Development, staging, and production environments
- Environment variables for configuration
- MongoDB instance (local or Atlas)
- Cloudinary account with proper configuration 