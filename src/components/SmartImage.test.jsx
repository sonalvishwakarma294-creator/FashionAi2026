import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import SmartImage from './SmartImage';
import { closetService } from '../services/api';

vi.mock('../services/api', () => ({
  closetService: { getItemImage: vi.fn() },
  getImageUrl: (src) => src || '',
  BACKEND_BASE_URL: 'http://localhost:5001',
}));

describe('SmartImage closet photos', () => {
  let objectUrlNumber;
  let originalCreateObjectURL;
  let originalRevokeObjectURL;

  beforeEach(() => {
    objectUrlNumber = 0;
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => `blob:closet-image-${++objectUrlNumber}`);
    URL.revokeObjectURL = vi.fn();
    closetService.getItemImage.mockImplementation(async (id) => ({
      data: new Blob([`image-${id}`], { type: 'image/png' }),
    }));
  });

  afterEach(() => {
    cleanup();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('renders a distinct protected image for each closet item', async () => {
    render(
      <div>
        {[17, 29].map((id) => (
          <SmartImage
            key={id}
            src={`/api/closet/items/${id}/image`}
            alt={`Garment ${id}`}
          />
        ))}
      </div>
    );

    await waitFor(() => {
      expect(screen.getByAltText('Garment 17')).toHaveAttribute('src', 'blob:closet-image-1');
      expect(screen.getByAltText('Garment 29')).toHaveAttribute('src', 'blob:closet-image-2');
    });

    expect(closetService.getItemImage).toHaveBeenNthCalledWith(1, '17');
    expect(closetService.getItemImage).toHaveBeenNthCalledWith(2, '29');
  });
});