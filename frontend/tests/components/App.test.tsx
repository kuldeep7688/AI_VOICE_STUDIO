import { render, screen } from '@testing-library/react';
import App from '../../src/App';

describe('App', () => {
  it('renders the brand name', () => {
    render(<App />);
    expect(screen.getByText('AI Voice Studio')).toBeInTheDocument();
  });

  it('renders the Pro Audio Engine subtext', () => {
    render(<App />);
    expect(screen.getByText('Pro Audio Engine')).toBeInTheDocument();
  });

  it('renders all three navigation items', () => {
    render(<App />);
    expect(screen.getByText('Studio')).toBeInTheDocument();
    expect(screen.getByText('Cloning')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('renders New Project button', () => {
    render(<App />);
    expect(screen.getByText('New Project')).toBeInTheDocument();
  });

  it('renders sidebar footer items', () => {
    render(<App />);
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
    expect(screen.getByText('Light Mode')).toBeInTheDocument();
  });

  it('renders the TopAppBar with screen title', () => {
    render(<App />);
    expect(screen.getByText('Voice Cloning Workshop')).toBeInTheDocument();
  });
});
