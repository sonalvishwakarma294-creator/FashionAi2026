import { test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from './Footer';

test('renders footer with company links', () => {
  render(<BrowserRouter><Footer /></BrowserRouter>);
  expect(screen.getByText('Company')).toBeDefined();
  expect(screen.getByText('About Us')).toBeDefined();
  expect(screen.getByText('Services')).toBeDefined();
});

test('renders brand and social links', () => {
  render(<BrowserRouter><Footer /></BrowserRouter>);
  expect(screen.getByText('Fashion')).toBeDefined();
  expect(screen.getByText('AI Studio')).toBeDefined();
  expect(screen.getByLabelText('Instagram')).toBeDefined();
});

