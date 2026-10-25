import { vi } from 'vitest';
import { beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock IntersectionObserver for framer-motion
class IntersectionObserverMock {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
  }
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);
}

window.IntersectionObserver = IntersectionObserverMock;
global.IntersectionObserver = IntersectionObserverMock;

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock axios in global scope
vi.mock('axios', () => {
  const mockInstance = {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    create: vi.fn(),
  };
  
  mockInstance.create.mockReturnValue(mockInstance);
  
  return {
    default: mockInstance,
    ...mockInstance
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

