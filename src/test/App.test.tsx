import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App.tsx';

describe('App Component', () => {
  it('renders the main logo', () => {
    render(<App />);
    
    // Check if the logo text "Tik in de buurt" is present
    expect(screen.getByText('Tik in de buurt')).toBeInTheDocument();
  });

  it('renders the tagline', () => {
    render(<App />);
    
    // Check if the tagline is present
    expect(screen.getByText('Local ads in your city')).toBeInTheDocument();
  });
});