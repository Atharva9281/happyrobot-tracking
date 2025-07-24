# 🚛 HappyRobot Tracking

> **Real-time shipment tracking platform built for the future of logistics**
## ✨ **Live Demo**

**🌐 [happyrobot-tracking.vercel.app](https://happyrobot-tracking-hyp1.vercel.app/)**

---

## 🎥 **Features Showcase**

### **🗺️ Real-time Map Tracking**
- Interactive Google Maps with live shipment locations
- Custom truck markers with status-based colors
- Route visualization with smooth polylines
- Auto-fitting bounds to show all shipments

### **🚀 Journey Simulator**
- Watch trucks move along real roads in real-time
- Smooth animations with 1-minute journey duration
- Speed controls (0.5x to 10x) for perfect demos
- Professional celebration on delivery completion

### **📱 Responsive Design**
- Mobile-first approach with Tailwind CSS
- Clean, modern UI inspired by enterprise logistics platforms
- Professional color scheme and typography
- Optimized for both desktop and mobile devices

### **⚡ Real-time Updates**
- Live data synchronization with Supabase
- Instant shipment status updates
- Real-time progress tracking
- WebSocket-powered live updates

---

## 🛠️ **Tech Stack**

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | Next.js 15 + TypeScript | React framework with server-side rendering |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Database** | Supabase | Real-time database and authentication |
| **Maps** | Google Maps API | Interactive mapping and routing |
| **Deployment** | Vercel | Serverless deployment platform |
| **State Management** | React Hooks | Local and global state management |
| **Real-time** | Supabase Realtime | Live data synchronization |

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ installed
- Google Maps API key
- Supabase project setup

### **1. Clone & Install**
```bash
git clone https://github.com/Atharva9281/happyrobot-tracking.git
cd happyrobot-tracking
npm install
```

### **2. Environment Setup**
```bash
# Copy environment template
cp .env.example .env.local

# Add your API keys to .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### **3. Database Setup**
```sql
-- Run this in your Supabase SQL editor
CREATE TABLE shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  shipment_number TEXT NOT NULL,
  status TEXT DEFAULT 'in_transit',
  origin_address TEXT NOT NULL,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  dest_address TEXT NOT NULL,
  dest_lat DOUBLE PRECISION NOT NULL,
  dest_lng DOUBLE PRECISION NOT NULL,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  progress_percentage DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Add policies for user access
CREATE POLICY "Users can view their own shipments" ON shipments
  FOR SELECT USING (auth.uid() = user_id);
```

### **4. Run Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app! 🎉

---

## 📁 **Project Structure**

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API routes
│   │   │   ├── analytics/           # Analytics endpoints
│   │   │   ├── external-data/       # External data sources
│   │   │   └── shipments/           # Shipment CRUD operations
│   │   ├── dashboard/               # Main dashboard page
│   │   ├── globals.css              # Global styles
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Landing page
│   ├── components/                  # React components
│   │   ├── ai/                     # AI-powered features
│   │   │   ├── AIChat.tsx          # AI assistant chat
│   │   │   └── RealtimeEvents.tsx  # Real-time AI events
│   │   ├── auth/                   # Authentication components
│   │   │   ├── LoginModal.tsx      # Login interface
│   │   │   └── UserProfile.tsx     # User profile management
│   │   ├── communication/          # Communication features
│   │   │   ├── CommunicationHub.tsx
│   │   │   └── MessageComposer.tsx
│   │   ├── dashboard/              # Dashboard components
│   │   │   ├── AIActivityFeed.tsx
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   ├── MetricsCard.tsx
│   │   │   ├── RevenueImpactCalculator.tsx
│   │   │   ├── ShipmentTable.tsx
│   │   │   └── SimulationControls.tsx
│   │   ├── layout/                 # Layout components
│   │   │   └── Header.tsx
│   │   ├── map/                    # Map-related components
│   │   │   ├── MapView.tsx         # Main map component
│   │   │   ├── RoutePolyline.tsx   # Route visualization
│   │   │   └── ShipmentMarker.tsx  # Truck markers
│   │   ├── modals/                 # Modal components
│   │   │   ├── AIAnalysisModal.tsx
│   │   │   ├── CreateShipmentModal.tsx
│   │   │   ├── DeleteShipmentModal.tsx
│   │   │   ├── EditShipmentModal.tsx
│   │   │   ├── ExportModal.tsx
│   │   │   └── SimulationModal.tsx # Journey simulator
│   │   └── workflows/              # Workflow components
│   │       └── AIActions.tsx
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.ts              # Authentication logic
│   │   ├── useGoogleMaps.ts        # Google Maps integration
│   │   └── useShipments.ts         # Shipment data management
│   ├── lib/                        # Core libraries
│   │   └── supabase.ts             # Supabase client setup
│   ├── services/                   # API services
│   │   ├── directions.ts           # Google Directions API
│   │   ├── enrichmentService.ts    # Data enrichment via JSONPlaceholder
│   │   ├── geocoding.ts            # Google Geocoding API
│   │   ├── googleMaps.ts           # Google Maps service
│   │   ├── openai-logistics.ts     # OpenAI integration for logistics
│   │   └── SimulationService.ts    # Real-time truck simulation
│   ├── types/                      # TypeScript definitions
│   │   ├── approval.ts             # Approval workflow types
│   │   ├── database.ts             # Supabase database types
│   │   ├── google-maps.ts          # Google Maps API types
│   │   └── shipment.ts             # Shipment data types
│   └── utils/                      # Utility functions
│       ├── constants.ts            # App constants
│       ├── formatters.ts           # Data formatting utilities
│       └── interpolation.ts        # Route interpolation math
├── .env.example                    # Environment variables template
├── .env.local                      # Local environment variables
├── .eslintrc.json                  # ESLint configuration
├── .gitignore                      # Git ignore rules
├── next.config.ts                  # Next.js configuration
├── package.json                    # Dependencies and scripts
├── README.md                       # Project documentation
├── tailwind.config.css             # Tailwind CSS configuration
├── tailwind.config.js              # Tailwind JavaScript config
└── tsconfig.json                   # TypeScript configuration
```

---

## 🎮 **Key Features Deep Dive**

### **Journey Simulator**
The crown jewel of the application - a real-time journey simulator that demonstrates:

- **Route Calculation**: Uses Google Directions API for real road routes
- **Smooth Animation**: Interpolated movement along route points
- **Speed Controls**: Adjustable simulation speed for demos
- **Progress Tracking**: Real-time percentage completion
- **Status Updates**: Automatic status changes (pending → in_transit → delivered)

```typescript
// Example: Starting a journey simulation
const startJourney = async (shipment: Shipment) => {
  await simulationService.initializeJourney([shipment], handleUpdate);
  simulationService.start();
};
```

### **Real-time Updates**
Powered by Supabase's real-time capabilities:

```typescript
// Real-time subscription example
const subscription = supabase
  .channel('shipments')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'shipments' },
    (payload) => {
      // Handle real-time updates
      updateShipmentInUI(payload.new);
    }
  )
  .subscribe();
```

---

## 🌐 **API Integration**

### **Google Maps APIs Used**
1. **Maps JavaScript API** - Interactive map display and user interaction
2. **Directions API** - Route calculation between shipment points
3. **Places API** - Address autocomplete and validation
4. **Geocoding API** - Address to coordinates conversion

### **External Data Sources**

#### **JSONPlaceholder API**
- **Purpose**: Mock data enrichment and testing
- **Usage**: Provides sample user data, posts, and comments for development
- **Implementation**: `enrichmentService.ts` handles data fetching and caching
- **Benefits**: Reliable mock API for development and demo purposes

```typescript
// Example: Data enrichment via JSONPlaceholder
const enrichShipmentData = async (shipment: Shipment) => {
  const userData = await enrichmentService.fetchUserData(shipment.customer_id);
  return { ...shipment, customerDetails: userData };
};
```

#### **ShipEngine API**
- **Purpose**: Real shipping rate calculation and label generation
- **Usage**: Provides accurate shipping costs, transit times, and carrier options
- **Implementation**: Integrated for production-ready shipping calculations
- **Features**: Rate shopping, address validation, tracking integration

```typescript
// Example: Get shipping rates via ShipEngine
const getShippingRates = async (shipment: ShipmentRequest) => {
  const rates = await shipEngineAPI.getRates({
    shipFrom: shipment.origin,
    shipTo: shipment.destination,
    packages: shipment.packages
  });
  return rates;
};
```

### **Supabase Integration**
- **Authentication** - Google OAuth integration with secure sessions
- **Database** - PostgreSQL with real-time subscriptions
- **Row Level Security** - User-specific data access and permissions
- **Real-time** - Live data synchronization across all clients

### **AI & Analytics Integration**
- **OpenAI API** - Logistics optimization and route analysis
- **Real-time Events** - AI-powered shipment insights and predictions
- **Communication Hub** - Automated customer communication

---

## 🚀 **Deployment**

### **Vercel Deployment** (Recommended)
1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### **Environment Variables for Production**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_key

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# ShipEngine API (Optional - for production shipping)
SHIPENGINE_API_KEY=your_shipengine_api_key

# Application Configuration
NEXT_PUBLIC_APP_NAME=HappyRobot Tracking
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_URL=https://your-domain.com

# OpenAI API (Optional - for AI features)
OPENAI_API_KEY=your_openai_api_key
```

---

## 🧪 **Testing the Journey Simulator**

1. **Access the Dashboard**: Navigate to the main dashboard
2. **Click "🚛 Live Simulation"**: Opens the journey simulator modal
3. **Select a Shipment**: Choose from available shipments
4. **Start Journey**: Click "🚀 Start Journey" 
5. **Watch the Magic**: See the truck move smoothly along real roads
6. **Control Playback**: Use speed controls (0.5x - 10x)
7. **Journey Complete**: Celebration modal on delivery

---

## 🔧 **Development Scripts**

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

---

## 📊 **Performance Optimizations**

- **Next.js Image Optimization** - Automatic image optimization
- **Code Splitting** - Automatic bundle splitting
- **Server-Side Rendering** - SEO and performance benefits
- **Static Generation** - Pre-rendered pages where possible
- **Real-time Subscriptions** - Efficient WebSocket usage
- **Memoized Components** - React.memo and useMemo optimizations

---

## 🤝 **Contributing**

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Development Guidelines**
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Test thoroughly before submitting PRs

---

## 📄 **License**

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🙏 **Acknowledgments**

- **HappyRobot** - Inspiration for this logistics tracking platform
- **Supabase** - Amazing real-time database platform
- **Google Maps** - Powerful mapping and routing APIs
- **Vercel** - Seamless deployment experience
- **Next.js Team** - Incredible React framework

---

## 📞 **Contact & Demo**

**Built for HappyRobot Logistics Demo**

- **Live Demo**: [happyrobot-tracking.vercel.app](https://happyrobot-tracking.vercel.app)
- **GitHub**: [github.com/Atharva9281/happyrobot-tracking](https://github.com/Atharva9281/happyrobot-tracking)
- **Developer**: [Your LinkedIn/Portfolio]

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

Made with ❤️ for the future of logistics

</div>