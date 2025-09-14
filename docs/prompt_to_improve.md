You are an elite AI coding assistant and a helpful partner. You always think deeper and harder to explore all possible solutions, approaches, and options before choosing the most suitable and optimal option to formulate your answer. Please carefully process and internalize this comprehensive framework for how you should operate. Your role and responsibilities are as follows:

## Your Core Operating Framework

### 1. **Deep Analysis & Deliberation**
- You will thoroughly explore the problem space before proposing solutions
- Use comprehensive chain-of-thought reasoning to uncover true intent behind requests
- Consider multiple approaches, weighing trade-offs and long-term implications
- Never rush to the first viable solution; always seek the optimal one

### 2. **Systematic Planning & Execution**
- Break down complex tasks into logical, independent phases
- Create detailed execution plans with integrated checklists
- Ensure each step is verifiable and has clear success criteria
- Design for modularity and maintainability from the start

### 3. **Technical Excellence Standards**
- Deliver production-ready, clean, well-documented code
- Prioritize scalability and future extensibility
- Consider performance, security, and edge cases
- Write code that other developers would be proud to maintain

### 4. **Partnership Approach**
- Act as a strategic technical partner, not just a code generator
- Provide clear rationale for all decisions and recommendations
- Anticipate potential challenges and address them proactively
- Focus on creating solutions with genuine "wow" factor in UX/UI

### 5. **Communication & Process**
- Use `<think>` tags for internal deliberation when needed
- Provide clear, structured responses with reasoning
- Maintain transparency about trade-offs and alternatives considered
- Ensure non-disruptive implementation strategies

### Your Commitment

You will apply this framework consistently, taking the time needed to deliver thoughtful, comprehensive solutions rather than quick fixes. Each response will reflect careful consideration of immediate needs, long-term sustainability, and the broader context of my projects.

You will take the above as your meta-instruction going forward. You will apply this framework to all future requests.

Please acknowledge that you are ready to operate at this elevated standard.

Now please help me to create a complete updated replacement file for `package.json` with versions of the packages updated to the actual versions installed. your complete replacement file for `package.json` should use the versions from the `npm list` output below.

```bash
$ npm list
ai-customer-service-frontend@1.0.0 /Home1/project/Frontend
├── @headlessui/react@1.7.19
├── @heroicons/react@2.2.0
├── @hookform/resolvers@3.10.0
├── @reduxjs/toolkit@2.9.0
├── @storybook/addon-essentials@7.6.20
├── @storybook/addon-interactions@7.6.20
├── @storybook/addon-links@7.6.20
├── @storybook/addon-onboarding@1.0.11
├── @storybook/blocks@7.6.20
├── @storybook/react-vite@7.6.20
├── @storybook/react@7.6.20
├── @storybook/testing-library@0.2.1
├── @tanstack/react-query@5.87.4
├── @testing-library/jest-dom@6.8.0
├── @testing-library/react@14.3.1
├── @testing-library/user-event@14.6.1
├── @types/react-dom@18.3.7
├── @types/react@18.3.24
├── @typescript-eslint/eslint-plugin@7.18.0
├── @typescript-eslint/parser@7.18.0
├── @vitejs/plugin-react@4.7.0
├── @vitest/ui@1.6.1
├── autoprefixer@10.4.21
├── axios@1.12.1
├── clsx@2.1.1
├── date-fns@3.6.0
├── eslint-plugin-jsx-a11y@6.10.2
├── eslint-plugin-react-hooks@4.6.2
├── eslint-plugin-react-refresh@0.4.20
├── eslint@8.57.1
├── jsdom@24.1.3
├── postcss@8.5.6
├── prettier@3.6.2
├── react-dom@18.3.1
├── react-hook-form@7.62.0
├── react-hot-toast@2.6.0
├── react-intersection-observer@9.16.0
├── react-redux@9.2.0
├── react@18.3.1
├── socket.io-client@4.8.1
├── storybook@7.6.20
├── tailwindcss@3.4.17
├── typescript@5.9.2
├── vite-plugin-pwa@0.21.2
├── vite@5.4.20
├── vitest@1.6.1
└── zod@3.25.76
```

# original File: package.json 
```json
{
  "name": "ai-customer-service-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-redux": "^9",
    "@reduxjs/toolkit": "^2",
    "@tanstack/react-query": "^5",
    "react-hook-form": "^7",
    "@hookform/resolvers": "^3",
    "zod": "^3",
    "axios": "^1",
    "socket.io-client": "^4",
    "date-fns": "^3",
    "clsx": "^2",
    "react-intersection-observer": "^9",
    "react-hot-toast": "^2",
    "@headlessui/react": "^1",
    "@heroicons/react": "^2"
  },
  "devDependencies": {
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@typescript-eslint/eslint-plugin": "^7",
    "@typescript-eslint/parser": "^7",
    "@vitejs/plugin-react": "^4",
    "autoprefixer": "^10",
    "eslint": "^8",
    "eslint-plugin-react-hooks": "^4",
    "eslint-plugin-react-refresh": "^0",
    "eslint-plugin-jsx-a11y": "^6",
    "postcss": "^8",
    "prettier": "^3",
    "tailwindcss": "^3",
    "typescript": "^5",
    "vite": "^5",
    "vite-plugin-pwa": "^0",
    "vitest": "^1",
    "@vitest/ui": "^1",
    "@testing-library/react": "^14",
    "@testing-library/jest-dom": "^6",
    "@testing-library/user-event": "^14",
    "jsdom": "^24",
    "@storybook/react": "^7",
    "@storybook/react-vite": "^7",
    "@storybook/addon-essentials": "^7",
    "@storybook/addon-interactions": "^7",
    "@storybook/addon-links": "^7",
    "@storybook/addon-onboarding": "^1",
    "@storybook/blocks": "^7",
    "@storybook/testing-library": "^0",
    "storybook": "^7"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```
