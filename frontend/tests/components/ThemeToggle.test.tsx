import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../src/context/ThemeContext';

function TestComponent() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to dark theme', () => {
    render(<ThemeProvider><TestComponent /></ThemeProvider>);
    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggles to light theme', () => {
    render(<ThemeProvider><TestComponent /></ThemeProvider>);
    fireEvent.click(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('persists theme in localStorage', () => {
    render(<ThemeProvider><TestComponent /></ThemeProvider>);
    fireEvent.click(screen.getByTestId('toggle-btn'));
    expect(localStorage.getItem('ai-voice-studio-theme')).toBe('light');
  });

  it('restores theme from localStorage', () => {
    localStorage.setItem('ai-voice-studio-theme', 'light');
    render(<ThemeProvider><TestComponent /></ThemeProvider>);
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
  });
});
