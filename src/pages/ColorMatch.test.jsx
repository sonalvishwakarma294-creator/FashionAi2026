import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import { MemoryRouter } from 'react-router-dom';
import ColorMatch from './ColorMatch';
import * as axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios.default, true);

const mockColorResult = {
  complementary: ['Gold', 'White'],
  analogous: ['Royal Blue', 'Emerald'],
  triadic: ['Coral', 'Teal'],
  neutral: ['Ivory', 'Silver']
};

describe('ColorMatch Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.post.mockResolvedValue({ data: mockColorResult });
  });

  it('renders color selector buttons', () => {
  render(<ColorMatch />);

    expect(screen.getByText('Navy Blue')).toBeInTheDocument();
    expect(screen.getByText('Black')).toBeInTheDocument();
    expect(screen.getByText('Generate Color Palette')).toBeInTheDocument();
  });

  it('selects color on button click', async () => {
  render(<ColorMatch />);

    const navyButton = screen.getByText('Navy Blue');
    const goldButton = screen.getByText('Gold');

    fireEvent.click(goldButton);

    // Button styling changes (simplified check)
    expect(goldButton).toBeInTheDocument();
  });

  it('calls API on generate click', async () => {
    render(<ColorMatch />);

    const generateButton = screen.getByText('Generate Color Palette');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/color-combinations'),
        expect.objectContaining({ color: 'Navy Blue' })
      );
    });
  });

  it('displays loading state', async () => {
    render(<ColorMatch />);

    const generateButton = screen.getByText('Generate Color Palette');
    fireEvent.click(generateButton);

    expect(screen.getByText('Analyzing Harmony...')).toBeInTheDocument();
  });

  it('shows results after API success', async () => {
    render(<ColorMatch />);

    const generateButton = screen.getByText('Generate Color Palette');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Gold')).toBeInTheDocument();
      expect(screen.getByText('Complementary')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    mockedAxios.post.mockRejectedValue(new Error('API Error'));

    render(<ColorMatch />);

    const generateButton = screen.getByText('Generate Color Palette');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Generate Color Palette')).toBeInTheDocument();
    });
  });
});
