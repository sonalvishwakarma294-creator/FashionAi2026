import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ColorMatch from './ColorMatch';
import { accessoryService } from '../services/api';

// Mock the API service
vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  },
  accessoryService: {
    getColorCombinations: vi.fn()
  }
}));

const mockColorResult = {
  data: {
    complementary: ['Gold', 'White'],
    analogous: ['Royal Blue', 'Emerald'],
    triadic: ['Coral', 'Teal'],
    neutral: ['Ivory', 'Silver']
  }
};

describe('ColorMatch Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    accessoryService.getColorCombinations.mockResolvedValue(mockColorResult);
  });

  it('renders base UI elements', () => {
    render(<ColorMatch />);

    expect(screen.getByText('Pick Your Base Color')).toBeInTheDocument();
    expect(screen.getByText('Generate Palettes')).toBeInTheDocument();
  });

  it('selects color from presets', async () => {
    render(<ColorMatch />);

    // Presets are buttons with titles
    const goldButton = screen.getByTitle('Gold');
    fireEvent.click(goldButton);

    // After clicking gold, the hex code should update in the UI
    expect(screen.getByText('#FFD700')).toBeInTheDocument();
  });

  it('calls API on generate click', async () => {
    render(<ColorMatch />);

    const generateButton = screen.getByText('Generate Palettes');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(accessoryService.getColorCombinations).toHaveBeenCalled();
    });
  });

  it('displays loading state', async () => {
    render(<ColorMatch />);

    const generateButton = screen.getByText('Generate Palettes');
    fireEvent.click(generateButton);

    expect(screen.getByText('Analyzing...')).toBeInTheDocument();
  });

  it('shows results after API success', async () => {
    render(<ColorMatch />);

    const generateButton = screen.getByText('Generate Palettes');
    fireEvent.click(generateButton);

    await waitFor(() => {
      // Results are shown in lowercase/uppercase based on CSS, but text is there
      // Use getAllByText because 'Gold' might appear in palette AND recommendation card
      const goldElements = screen.getAllByText('Gold', { exact: false });
      expect(goldElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('complementary', { exact: false })).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    accessoryService.getColorCombinations.mockRejectedValue(new Error('API Error'));

    render(<ColorMatch />);

    const generateButton = screen.getByText('Generate Palettes');
    fireEvent.click(generateButton);

    await waitFor(() => {
      // It should still show some fallback results or at least not crash
      expect(screen.getByText('Stylist\'s Recommendation')).toBeInTheDocument();
    });
  });
});
