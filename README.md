# VyronaMart - Multi-Module E-commerce Platform

Your ultimate destination for shopping, socializing, and discovering amazing products across multiple platforms.

## 🛍️ Platform Modules

- **VyronaHub**: Traditional e-commerce marketplace
- **VyronaSocial**: Group shopping with shared carts and social features
- **VyronaSpace**: Local store discovery with 5-15 minute delivery
- **VyronaMallConnect**: Mall-based shopping with 30-60 minute delivery
- **VyronaRead**: Book purchases, rentals, and library management
- **VyronaInstaStore**: Instagram-based product discovery

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Neon serverless + Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Session-based with role management
- **Payments**: Razorpay integration + UPI + Wallet system
- **Real-time**: WebSocket for live updates
- **Email**: Brevo for transactional emails
- **Maps**: OpenRouteService for delivery tracking

## 🛠️ Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL database (Neon or local)
- Environment variables (see `.env.example`)

### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/vyronamart.git
cd vyronamart

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Environment Variables
Create a `.env` file with:
```env
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret
BREVO_API_KEY=your_brevo_api_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
OPENROUTE_API_KEY=your_openroute_api_key
```

## 📱 Features

### Customer Features
- Multi-module shopping experience
- Individual and group buying
- Real-time order tracking with live maps
- Virtual wallet system
- Social shopping groups
- Comprehensive user dashboard

### Seller Features
- Multi-platform seller registration
- Specialized dashboards per platform
- Product management with bulk import
- Order management with email notifications
- Analytics and business intelligence
- Automated customer communication

## 🚢 Deployment

### Hostinger VPS Deployment
See `hostinger-deployment-guide.md` for complete deployment instructions with:
- Nginx configuration
- PM2 process management
- SSL certificate setup
- Database backup strategies
- Monitoring and maintenance

### Production Build
```bash
npm run build
npm start
```

## 📚 Documentation

- `replit.md` - Complete platform documentation
- `hostinger-deployment-guide.md` - VPS deployment guide
- API documentation available in `/docs` (when implemented)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and inquiries, please contact the development team.

---

Built with ❤️ for the VyronaMart ecosystem