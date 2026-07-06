# PeopleOS ATS CV Builder - Backend

Backend API server for the PeopleOS Professional Portfolio & Endorsement Management System.

## 📋 Project Structure

```
backend/
├── config/                      # Configuration files
│   ├── database.js             # MySQL database connection pool
│   └── cors.js                 # Strict CORS configuration
├── models/                     # Database models (Separation of Concerns)
│   ├── GlobalUsers.js          # User management
│   ├── CorePortfolios.js       # Portfolio management
│   ├── PortfolioExperienceBlocks.js  # Experience blocks
│   ├── MicroSuccessStories.js  # Success stories
│   └── ExternalLiveEndorsements.js   # Endorsement management
├── controllers/                # Route controllers (to be implemented)
├── routes/                     # API routes (to be implemented)
├── middleware/                 # Custom middleware (to be implemented)
└── server.js                   # Main server file
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js >= 16.0.0
- MySQL 5.7+
- npm >= 8.0.0

### Installation

1. **Clone and navigate**
```bash
cd "ATS CV Builder"
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# Copy .env file and update with your database credentials
cp .env .env.local
# Edit .env.local with your database details
```

4. **Database Setup**
All tables are automatically created on server startup:
- `global_users` - User authentication and profile
- `core_portfolios` - Portfolio management
- `portfolio_experience_blocks` - Work/education/project history
- `micro_success_stories` - Achievement stories
- `external_live_endorsements` - Third-party endorsements

## 🚀 Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server will run on: `http://127.0.0.1:5000`

## 🔒 Security Features

### CORS Policy
- ✅ Only allows requests from: `https://peopleos.online`
- ✅ Blocks all unauthorized cross-origin requests
- ✅ Credentials are sent with requests (if configured)

### Database Security
- ✅ Prepared statements (prevents SQL injection)
- ✅ Connection pooling for performance
- ✅ Encryption for sensitive data
- ✅ Automatic cascade deletions

### Server Security
- ✅ Runs only on loopback interface (127.0.0.1)
- ✅ Strict security headers
- ✅ HTTPS/TLS ready
- ✅ JWT authentication ready

## 📊 Database Schema

### global_users
Stores user authentication and profile information
- Supports local and Google OAuth
- OTP verification for email confirmation
- Secure password hashing

### core_portfolios
Main portfolio data
- Unique slug for portfolio URLs
- JSON storage for flexible data
- Publishing control
- User-specific portfolios

### portfolio_experience_blocks
Experience entries (work, education, projects, awards, volunteering)
- Multiple types supported
- Date range tracking
- Asset and URL attachments
- Connection to success stories

### micro_success_stories
Individual achievement narratives
- Linked to specific experience blocks
- Rich text support
- Endorsable achievements

### external_live_endorsements
Third-party endorsements
- Unique authentication tokens
- Digital signatures
- Linked to portfolio and experience block
- Verification ready

## 🔌 API Endpoints (Placeholder)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/users/register` | User registration |
| GET | `/api/portfolios/:slug` | Get portfolio by slug |

*More endpoints to be implemented*

## 🛠 Configuration

### Environment Variables (.env)
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=peopleos_db
SERVER_PORT=5000
SERVER_HOST=127.0.0.1
CORS_ORIGIN=https://peopleos.online
NODE_ENV=development
```

## 📝 Development Notes

- Use prepared statements for all database queries
- Each model file is independent (Separation of Concerns)
- All database operations use connection pooling
- Error handling is implemented at each layer

## 🤝 Contributing

When adding new features:
1. Create separate model files for new tables
2. Use prepared statements for queries
3. Add proper error handling
4. Update documentation

## 📄 License

MIT License - PeopleOS Team
