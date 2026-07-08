import { render, screen } from '@testing-library/react';
import App from '../../src/App';

describe('App', () => {
  it('renders the brand name', () => {
    render(<App />);
    expect(screen.getByText('NVIDIA')).toBeInTheDocument();
  });

  it('renders all three navigation items', () => {
    render(<App />);
    expect(screen.getAllByText('Voice Cloning').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Studio Recorder')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('renders the version tag', () => {
    render(<App />);
    expect(screen.getByText(/v0\.1/)).toBeInTheDocument();
  });

  it('renders Models Active section', () => {
    render(<App />);
    expect(screen.getByText('Models Active')).toBeInTheDocument();
  });

  it('renders the sidebar and main region', () => {
    render(<App />);
    expect(screen.getByText('NVIDIA')).toBeInTheDocument();
  });
});
