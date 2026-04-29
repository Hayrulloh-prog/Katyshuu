# Көзөмөл - Employee Attendance Tracking System

A comprehensive employee attendance tracking system with QR code functionality, built for modern businesses.

## Features

### 🎯 Core Functionality
- **QR Code-based Attendance**: Employees can check in/out by scanning QR codes
- **Multi-role System**: Super Admin, Manager, and Employee roles
- **Real-time Tracking**: Live attendance monitoring
- **Multi-language Support**: Russian, Kyrgyz, and English
- **Dark/Light Mode**: Toggle between themes
- **Responsive Design**: Works on all devices

### 🔐 Security Features
- JWT Authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting and login attempt protection
- Device fingerprinting
- Geo-location tracking
- SQL injection protection

### 📊 Analytics & Reporting
- Attendance statistics and charts
- Employee presence/absence tracking
- Historical attendance data
- Export functionality

### 🎨 UI/UX Features
- Modern, minimalist design
- Smooth animations with Framer Motion
- Skeleton loaders
- Mobile-optimized interface
- Accessibility compliant

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation
- **React Hook Form** - Forms
- **i18next** - Internationalization
- **Axios** - HTTP client
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Prisma ORM** - Database management
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Express Rate Limit** - Rate limiting
- **QR Code** - QR generation

## Installation

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd козомол
```

2. **Install dependencies**
```bash
npm install
cd client && npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secrets
```

4. **Set up the database**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Start the development servers**
```bash
# Start both frontend and backend
npm run dev

# Or start separately
npm run server  # Backend on port 5000
npm run client  # Frontend on port 3000
```

## Usage

### Super Admin
1. Navigate to `/admin`
2. Login with default credentials (check .env file)
3. Manage managers, generate QR codes, view statistics

### Manager
1. Get QR codes from super admin
2. Distribute to employees
3. Monitor attendance via manager dashboard
4. View employee statistics and reports

### Employee
1. Scan QR code for first-time registration
2. Use the same QR code daily for check-in/check-out
3. View personal attendance history

## API Endpoints

### Authentication
- `POST /api/auth/super-admin` - Super admin login
- `POST /api/auth/manager` - Manager login
- `POST /api/auth/employee` - Employee login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/verify` - Verify token

### Managers (Super Admin only)
- `GET /api/managers` - List managers
- `POST /api/managers` - Create manager
- `PUT /api/managers/:id` - Update manager
- `DELETE /api/managers/:id` - Delete manager
- `PATCH /api/managers/:id/toggle-status` - Toggle manager status

### Employees
- `POST /api/employees/register` - Register employee (via QR)
- `GET /api/employees/` - List employees (Manager only)
- `GET /api/employees/absent` - Get absent employees (Manager only)
- `DELETE /api/employees/:id` - Delete employee (Manager only)

### Attendance
- `POST /api/attendance/check-in` - Check in (Employee only)
- `POST /api/attendance/check-out` - Check out (Employee only)
- `GET /api/attendance/status` - Get today's status (Employee only)
- `GET /api/attendance/stats` - Get statistics (Manager only)

### QR Codes
- `POST /api/qr/generate` - Generate QR codes (Super Admin only)
- `GET /api/qr/token/:token` - Validate QR token

## Database Schema

### Main Tables
- `super_admins` - System administrators
- `managers` - Business managers
- `employees` - Company employees
- `attendance_logs` - Attendance records
- `qr_tokens` - QR code tokens
- `tariffs` - Subscription plans
- `login_attempts` - Security logging

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens have short expiration with refresh mechanism
- Rate limiting prevents brute force attacks
- Device fingerprinting adds additional security layer
- Geo-location tracking for attendance validation
- Input validation and sanitization
- SQL injection prevention via Prisma ORM

## Performance Optimizations

- Database indexing on frequently queried fields
- Pagination for large datasets
- Lazy loading components
- Image optimization
- Code splitting
- Caching strategies
- Compressed responses

## Deployment

### Production Build
```bash
npm run build
```

### Environment Variables for Production
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `NODE_ENV=production`
- `QR_BASE_URL` - Base URL for QR codes

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Email: support@kozomol.com
- Documentation: [Link to docs]
- Issues: [GitHub Issues]

## Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with payroll systems
- [ ] Biometric authentication options
- [ ] Advanced reporting features
- [ ] Multi-location support
- [ ] API for third-party integrations

---

**Көзөмөл** - Modern attendance tracking for modern businesses.
