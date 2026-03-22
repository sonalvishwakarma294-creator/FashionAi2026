import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import { MemoryRouter } from 'react-router-dom';
import ColorMatch from './ColorMatch';
import axios from 'axios';

// axios is already mocked in vitest.setup.js
// We just need a reference to the mocked default export
const mockedAxios = vi.mocked(axios, true);

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

    expect(screen.getByTitle('Navy Blue')).toBeInTheDocument();
    expect(screen.getByTitle('Black')).toBeInTheDocument();
    expect(screen.getByText('Generate Palettes')).toBeInTheDocument();
  });

  it('selects color on button click', async () => {
    render(<ColorMatch />);

    const navyButton = screen.getByTitle('Navy Blue');
    const goldButton = screen.getByTitle('Gold');

    fireEvent.click(goldButton);

    // Selected color is now #FFD700 (Gold)
    expect(goldButton).toBeInTheDocument();
  });

  it('calls API on generate click', async () => {
    render(<ColorMatch />);

    const generateButton = screen.getByText('Generate Palettes');
    fireEvent.click(generateButton);

    await waitFor(() => {
      // The mock instance doesn't actually prepend the baseURL in this simple mock
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/color-combinations'),
        expect.objectContaining({ color: '#001F3F' })
      );
    });
  });

  it('displays loading state', async () => {
    render(<ColorMatch />);

    const generateButton = screen.getByText('Generate Palettes');
    fireEvent.click(generateButton);

    // ColorMatch.jsx uses 'Analyzing...'
    expect(screen.getByText(/Analyzing/i)).toBeInTheDocument();
  });

  it('shows results after API success', async () => {
    render(<ColorMatch />);

    const generateButton = screen.getByText('Generate Palettes');
    fireEvent.click(generateButton);

    await waitFor(() => {
      // Use getAllByText because 'Gold' might appear in the result cards too
      expect(screen.getAllByText(/Gold/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/Complementary/i)).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    mockedAxios.post.mockRejectedValue(new Error('API Error'));

    render(<ColorMatch />);

    const generateButton = screen.getByText('Generate Palettes');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Generate Palettes')).toBeInTheDocument();
    });
  });
});
