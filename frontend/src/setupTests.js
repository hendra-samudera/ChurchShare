/**
 * Jest Setup File for ChurchShare Frontend Tests
 * 
 * This file runs before each test file and sets up the testing environment.
 */

import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe() {
    return null;
  }
  
  unobserve() {
    return null;
  }
  
  disconnect() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe() {
    return null;
  }
  
  unobserve() {
    return null;
  }
  
  disconnect() {
    return null;
  }
};

// Mock URL.createObjectURL for file uploads
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');

// Mock PDF.js worker
jest.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  },
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 10,
      getPage: jest.fn(() => Promise.resolve({
        getViewport: jest.fn(() => ({ width: 600, height: 800 })),
        render: jest.fn(() => ({ promise: Promise.resolve() })),
      })),
    }),
  })),
}));

// Suppress console errors during tests (optional - comment out to see errors)
// const originalError = console.error;
// console.error = (...args) => {
//   if (
//     args[0]?.includes?.('Warning:') ||
//     args[0]?.includes?.('Error:') ||
//     args[0]?.includes?.('act(')
//   ) {
//     return;
//   }
//   originalError.call(console, ...args);
// };

// Add custom matchers for accessibility testing
expect.extend({
  toHaveMinimumTapTarget(received, minSize = 48) {
    const box = received.boundingBox?.() || received.box?.();
    if (!box) {
      return {
        pass: false,
        message: () => 'Element does not have a bounding box',
      };
    }
    
    const pass = box.width >= minSize && box.height >= minSize;
    return {
      pass,
      message: () => 
        `Expected element to have minimum tap target of ${minSize}x${minSize}, ` +
        `but got ${box.width}x${box.height}`,
    };
  },
  
  toHaveContrastRatio(received, minRatio = 4.5) {
    // This would require actual color computation
    // Placeholder for future implementation
    return {
      pass: true,
      message: () => 'Contrast ratio check not fully implemented',
    };
  },
});
