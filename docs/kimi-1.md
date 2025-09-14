<think>
The user wants me to update the package.json file with the exact versions from npm list. I need to:

1. Compare each dependency in the original package.json with the versions from npm list
2. Update all versions to match what's actually installed
3. Keep the same structure and formatting
4. Ensure no dependencies are missed

Let me go through this systematically:

From npm list, I can see all the exact versions installed. I need to update both dependencies and devDependencies sections.

Looking at the original package.json, I can see it uses caret (^) ranges, but the user wants the exact installed versions. So I need to replace all the ^x.y.z patterns with the exact versions from npm list.

Let me verify I have all packages accounted for:
- All the dependencies in the original are present in npm list
- All the devDependencies in the original are present in npm list
- The versions are all higher than the minimums specified in the original

This is a straightforward version update task, but I need to be careful to maintain the exact structure and not miss any packages.
</think>

I'll create an updated `package.json` file with all the exact versions from your `npm list` output. Here's the complete replacement file:

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
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-redux": "9.2.0",
    "@reduxjs/toolkit": "2.9.0",
    "@tanstack/react-query": "5.87.4",
    "react-hook-form": "7.62.0",
    "@hookform/resolvers": "3.10.0",
    "zod": "3.25.76",
    "axios": "1.12.1",
    "socket.io-client": "4.8.1",
    "date-fns": "3.6.0",
    "clsx": "2.1.1",
    "react-intersection-observer": "9.16.0",
    "react-hot-toast": "2.6.0",
    "@headlessui/react": "1.7.19",
    "@heroicons/react": "2.2.0"
  },
  "devDependencies": {
    "@types/react": "18.3.24",
    "@types/react-dom": "18.3.7",
    "@typescript-eslint/eslint-plugin": "7.18.0",
    "@typescript-eslint/parser": "7.18.0",
    "@vitejs/plugin-react": "4.7.0",
    "autoprefixer": "10.4.21",
    "eslint": "8.57.1",
    "eslint-plugin-react-hooks": "4.6.2",
    "eslint-plugin-react-refresh": "0.4.20",
    "eslint-plugin-jsx-a11y": "6.10.2",
    "postcss": "8.5.6",
    "prettier": "3.6.2",
    "tailwindcss": "3.4.17",
    "typescript": "5.9.2",
    "vite": "5.4.20",
    "vite-plugin-pwa": "0.21.2",
    "vitest": "1.6.1",
    "@vitest/ui": "1.6.1",
    "@testing-library/react": "14.3.1",
    "@testing-library/jest-dom": "6.8.0",
    "@testing-library/user-event": "14.6.1",
    "jsdom": "24.1.3",
    "@storybook/react": "7.6.20",
    "@storybook/react-vite": "7.6.20",
    "@storybook/addon-essentials": "7.6.20",
    "@storybook/addon-interactions": "7.6.20",
    "@storybook/addon-links": "7.6.20",
    "@storybook/addon-onboarding": "1.0.11",
    "@storybook/blocks": "7.6.20",
    "@storybook/testing-library": "0.2.1",
    "storybook": "7.6.20"
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

This updated file now contains all the exact versions that are currently installed in your project, ensuring consistency between your `package.json` and the actual installed packages. This will help prevent version conflicts and ensure reproducible builds across different environments.
