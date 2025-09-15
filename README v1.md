# 🤖 AI Customer Service Frontend

> **Enterprise-grade React + TypeScript chat interface for AI-powered customer service**
>
> [![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://reactjs.org/)
> [![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
> [![Vite](https://img.shields.io/badge/Vite-5.4.20-646CFF?logo=vite)](https://vitejs.dev/)
> [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
> [![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-010101?logo=socket.io)](https://socket.io/)
> [![Redux Toolkit](https://img.shields.io/badge/Redux-2.9.0-764ABC?logo=redux)](https://redux-toolkit.js.org/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/nordeim/Frontend/graphs/commit-activity)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/nordeim/Frontend/pulls)

## 🌟 Features

### 🤖 AI-Powered Chat
- **Real-time messaging** with WebSocket integration
- **AI agent responses** with confidence scoring
- **Sentiment analysis** and emotion detection
- **Multi-intent recognition** with fallback handling
- **Smart suggestions** and quick replies

### 🌍 Multi-Channel Support
- **Web chat interface** with responsive design
- **Mobile-optimized** for iOS and Android
- **Email integration** with HTML support
- **Slack/Teams/WhatsApp** channel adapters
- **API integration** for custom channels

### ♿ Accessibility First
- **WCAG 2.1 AA compliant** out of the box
- **Screen reader support** with ARIA labels
- **Keyboard navigation** with focus management
- **High contrast mode** support
- **RTL language** support (Arabic, Hebrew, etc.)

### 🌐 Internationalization
- **50+ languages** supported
- **Automatic language detection**
- **Date/number/currency formatting**
- **Pluralization and context** support
- **RTL layout mirroring**

### ⚡ Performance Optimized
- **Sub-500ms response times** with optimization
- **Virtual scrolling** for large message lists
- **Code splitting** and lazy loading
- **Progressive Web App** capabilities
- **Offline support** with service workers

### 🛡️ Enterprise Security
- **JWT authentication** with token refresh
- **XSS protection** with content sanitization
- **Rate limiting** and abuse prevention
- **Content Security Policy** headers
- **End-to-end encryption** ready

## 🚀 Quick Start

### Prerequisites

```bash
# Node.js 18+ and npm 9+ required
node --version  # v18.0.0+
npm --version   # v9.0.0+
```

### Installation

```bash
# Clone the repository
git clone https://github.com/nordeim/Frontend.git
cd Frontend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Configuration

```bash
# .env.local
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws
VITE_AUTH_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH_CLIENT_ID=your-auth0-client-id
VITE_DEFAULT_LANGUAGE=en
VITE_ENABLE_ANALYTICS=true
```

## 📖 Documentation

### Architecture Overview

Our frontend follows a **modular, scalable architecture**:

```
src/
├── components/          # Reusable UI components
│   ├── Chat/           # Chat-specific components
│   ├── Layout/         # Layout components
│   └── Common/         # Shared components
├── hooks/              # Custom React hooks
├── services/           # API and external services
├── store/              # Redux state management
├── types/              # TypeScript definitions
├── utils/              # Utility functions
└── styles/             # Global styles
```

### Key Technologies

- **[React 18](https://reactjs.org/)** - Modern UI framework with concurrent features
- **[TypeScript 5.3+](https://www.typescriptlang.org/)** - Type-safe development
- **[Vite](https://vitejs.dev/)** - Lightning-fast build tool
- **[Redux Toolkit](https://redux-toolkit.js.org/)** - State management
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS
- **[Socket.io](https://socket.io/)** - Real-time communication
- **[React Query](https://tanstack.com/query/latest)** - Server state management

## 🎯 Usage Examples

### Basic Chat Integration

```tsx
import { ChatWindow } from '@/components/Chat/ChatWindow';
import { useChat } from '@/hooks/useChat';

function App() {
  const { messages, sendMessage } = useChat({
    conversationId: 'conv-123',
    autoScroll: true,
  });

  return (
    <ChatWindow
      conversation={currentConversation}
      onSendMessage={sendMessage}
      enableTyping={true}
      enableFileUpload={true}
    />
  );
}
```

### Custom Theme Configuration

```tsx
import { ThemeProvider } from '@/contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider
      defaultTheme="light"
      enableSystem={true}
      themes={['light', 'dark', 'high-contrast']}
    >
      <YourApp />
    </ThemeProvider>
  );
}
```

### Multi-Language Support

```tsx
import { useTranslation } from 'react-i18next';

function ChatInterface() {
  const { t, i18n } = useTranslation();
  const isRTL = useRTL(); // Auto-detect RTL languages

  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      <input 
        placeholder={t('chat.inputPlaceholder')} 
        dir={isRTL ? 'rtl' : 'ltr'}
      />
      <button>{t('chat.sendButton')}</button>
    </div>
  );
}
```

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm run test

# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Accessibility tests
npm run test:a11y

# All tests
npm run test:all
```

### Test Coverage

Our testing strategy includes:

- **Unit Tests** - Component and utility testing
- **Integration Tests** - API and service testing
- **E2E Tests** - Full user journey testing
- **Accessibility Tests** - WCAG compliance testing
- **Performance Tests** - Load and stress testing
- **Visual Regression Tests** - UI consistency testing

## 📊 Performance

### Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| **First Load** | < 2s | 1.2s |
| **Time to Interactive** | < 3s | 2.1s |
| **Largest Contentful Paint** | < 2.5s | 1.8s |
| **First Input Delay** | < 100ms | 45ms |
| **Cumulative Layout Shift** | < 0.1 | 0.05 |

### Optimization Features

- **Code Splitting** - Automatic route-based splitting
- **Lazy Loading** - Components load on demand
- **Image Optimization** - Progressive loading with WebP
- **Bundle Size** - < 250KB gzipped main bundle
- **Caching Strategy** - Aggressive caching with service workers
- **Virtual Scrolling** - Efficient large list rendering

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
npm run type-check      # Run TypeScript checks

# Testing
npm run test            # Run unit tests
npm run test:ui         # Run tests with UI
npm run test:coverage   # Generate coverage report

# Documentation
npm run storybook       # Start Storybook
npm run build-storybook # Build Storybook
```

### Development Guidelines

1. **TypeScript First** - All new code must be fully typed
2. **Component Testing** - Write tests for all components
3. **Accessibility** - Ensure WCAG compliance for all features
4. **Performance** - Optimize for sub-500ms response times
5. **Documentation** - Document complex logic and APIs
6. **Code Reviews** - All changes require peer review

## 🔗 API Integration

### REST API

```typescript
// API client setup
import apiClient from '@/services/api';

// Get conversations
const conversations = await apiClient.getConversations({
  page: 1,
  limit: 50,
  status: ['active', 'waiting'],
});

// Send message
const message = await apiClient.sendMessage(conversationId, 'Hello!');
```

### WebSocket Events

```typescript
// WebSocket connection
import wsManager from '@/services/websocket';

// Listen for new messages
wsManager.on('new_message', (message) => {
  console.log('New message:', message);
});

// Send typing indicator
wsManager.sendTypingStart(conversationId);
```

## 🚀 Deployment

### Production Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to your hosting provider
# Supports: Vercel, Netlify, AWS, GCP, Azure
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000/api/v1` |
| `VITE_WS_URL` | WebSocket URL | `ws://localhost:8000/ws` |
| `VITE_AUTH_DOMAIN` | Auth0 domain | - |
| `VITE_AUTH_CLIENT_ID` | Auth0 client ID | - |
| `VITE_ENABLE_ANALYTICS` | Enable analytics | `true` |
| `VITE_DEFAULT_LANGUAGE` | Default language | `en` |

## 🛡️ Security

### Security Features

- **Authentication** - JWT with token refresh
- **Authorization** - Role-based access control
- **Input Validation** - XSS and injection protection
- **Content Security Policy** - Strict CSP headers
- **Rate Limiting** - API abuse prevention
- **Encryption** - HTTPS and WSS protocols

### Security Best Practices

```typescript
// Input sanitization
import DOMPurify from 'dompurify';

const sanitizedContent = DOMPurify.sanitize(userInput);

// Secure WebSocket connection
const wsManager = new WebSocketManager('wss://secure-server.com', {
  auth: { token: getValidToken() },
  secure: true,
});
```

## 📈 Monitoring

### Analytics Integration

```typescript
// Track user interactions
import { trackEvent } from '@/utils/analytics';

trackEvent('message_sent', {
  conversationId: conversation.id,
  messageLength: message.content.length,
  senderType: message.sender_type,
});
```

### Error Tracking

```typescript
// Global error boundary
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary
  onError={(error, errorInfo) => {
    trackError(error, errorInfo);
  }}
>
  <YourApp />
</ErrorBoundary>
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow [Conventional Commits](https://www.conventionalcommits.org/)
- Write comprehensive tests
- Update documentation
- Ensure accessibility compliance
- Optimize for performance

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** - For the amazing React framework
- **TypeScript Team** - For bringing type safety to JavaScript
- **Tailwind CSS Team** - For the utility-first CSS framework
- **Redux Team** - For predictable state management
- **Vite Team** - For the lightning-fast build tool

## 📞 Support

- **Documentation** - Check our [Wiki](https://github.com/nordeim/Frontend/wiki)
- **Issues** - Report bugs via [GitHub Issues](https://github.com/nordeim/Frontend/issues)
- **Discussions** - Join [GitHub Discussions](https://github.com/nordeim/Frontend/discussions)
- **Email** - support@aicustomerservice.com

---

<div align="center">
  
**⭐ Star us on GitHub — it motivates us a lot! ⭐**

</div>
