# Steady Stream - IPTV Streaming Application

A modern, robust IPTV streaming application built with React, TypeScript, and Vite. Designed to provide a TiviMate-like experience with advanced features for channel management, EPG, and video playback.

## 🚀 Features

### Core Features
- **Multi-format Video Playback**: Support for HLS, DASH, and RTMP streams
- **Electronic Program Guide (EPG)**: Comprehensive program scheduling and information
- **Channel Management**: Import playlists, organize channels, and manage favorites
- **DVR Functionality**: Record, schedule, and manage recordings
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Real-time Updates**: Live EPG updates and channel information

### Advanced Features
- **Adaptive Bitrate Streaming**: Automatic quality adjustment based on connection
- **Picture-in-Picture**: Multi-window viewing capability
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Parental Controls**: Content filtering and access restrictions
- **Multi-device Sync**: Synchronize preferences across devices
- **Offline Capabilities**: Download content for offline viewing

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library

### State Management
- **Zustand** - Lightweight state management
- **React Query** - Server state management and caching

### Video & Streaming
- **Video.js** - HTML5 video player
- **HLS.js** - HTTP Live Streaming support
- **WebRTC** - Real-time communication

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Relational database
- **Real-time subscriptions** - Live data updates

## 📦 Installation

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0

### Setup
1. Clone the repository:
```bash
git clone https://github.com/your-username/steady-stream.git
cd steady-stream
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Start the development server:
```bash
npm run dev
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types

### Project Structure
```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── video/          # Video player components
│   ├── epg/            # EPG-related components
│   └── channel/        # Channel management components
├── hooks/              # Custom React hooks
├── context/            # React context providers
├── pages/              # Page components
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── assets/             # Static assets
└── styles/             # Global styles
```

## 🎯 Architecture

### Clean Architecture Principles
- **Presentation Layer**: React components and UI logic
- **Business Logic Layer**: Custom hooks and services
- **Data Layer**: API clients and database adapters

### Key Design Patterns
- **Component Composition**: Reusable and composable components
- **Custom Hooks**: Encapsulated business logic
- **Error Boundaries**: Graceful error handling
- **Lazy Loading**: Performance optimization

## 🧪 Testing

### Testing Strategy
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API and service integration testing
- **E2E Tests**: Critical user flow testing
- **Performance Tests**: Video playback and streaming tests

### Running Tests
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_VERSION=1.0.0
```

### Deployment Platforms
- **Vercel**: Optimized for React applications
- **Netlify**: Static site hosting with serverless functions
- **Docker**: Containerized deployment

## 📱 Mobile Support

### Progressive Web App (PWA)
- **Offline Support**: Cache content for offline access
- **Push Notifications**: Program reminders and updates
- **Install Prompts**: Add to home screen functionality

### Touch Gestures
- **Swipe Navigation**: Channel switching and menu navigation
- **Pinch to Zoom**: EPG grid scaling
- **Long Press**: Context menus and actions

## 🔐 Security

### Security Features
- **Content Security Policy**: XSS protection
- **HTTPS Enforcement**: Secure data transmission
- **Input Validation**: Sanitized user inputs
- **Rate Limiting**: API abuse prevention

## 🎨 UI/UX Design

### Design System
- **TiviMate-inspired**: Familiar interface for users
- **Dark Theme**: Optimized for media consumption
- **Accessibility**: WCAG 2.1 AA compliance
- **Responsive**: Mobile-first design approach

### Key UI Components
- **Video Player**: Custom controls and overlays
- **EPG Grid**: Virtualized grid for performance
- **Channel List**: Efficient channel browsing
- **Settings Panel**: Comprehensive configuration

## 🔄 State Management

### Global State
- **User Preferences**: Settings and configurations
- **Channel Data**: Channel information and EPG
- **Playback State**: Current playback position and status
- **Recording State**: DVR schedules and recordings

### Caching Strategy
- **API Responses**: Cached for offline access
- **Video Metadata**: Efficient content loading
- **User Sessions**: Persistent login state

## 🛡️ Error Handling

### Error Boundaries
- **Component Level**: Isolated error handling
- **Page Level**: Graceful page error recovery
- **Global Level**: Application-wide error catching

### Error Types
- **Network Errors**: Connection and API failures
- **Video Errors**: Playback and streaming issues
- **Authentication Errors**: Login and authorization failures

## 📊 Performance

### Optimization Techniques
- **Code Splitting**: Lazy-loaded components
- **Bundle Analysis**: Optimized bundle sizes
- **Image Optimization**: Compressed and responsive images
- **Caching**: Efficient data and asset caching

### Performance Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run linting and tests
6. Submit a pull request

### Code Style
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Conventional Commits**: Standardized commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

### Documentation
- **API Documentation**: Detailed API reference
- **Component Docs**: Component usage examples
- **Deployment Guide**: Step-by-step deployment instructions

### Community
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Community discussions and questions
- **Discord**: Real-time community support

---

Built with ❤️ by the Steady Stream Team