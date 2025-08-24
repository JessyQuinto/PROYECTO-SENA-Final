import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';
import { describe, it, expect, vi } from 'vitest';

describe('Button Component', () => {
  it('renders with default variant and size', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('h-9');
  });

  it('renders different variants correctly', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'success', 'warning'] as const;
    
    variants.forEach(variant => {
      const { unmount } = render(<Button variant={variant}>{variant} button</Button>);
      const button = screen.getByRole('button', { name: new RegExp(`${variant} button`, 'i') });
      expect(button).toBeInTheDocument();
      unmount();
    });
  });

  it('renders different sizes correctly', () => {
    const sizes = ['xs', 'sm', 'default', 'lg', 'xl', 'icon'] as const;
    
    sizes.forEach(size => {
      const { unmount } = render(<Button size={size}>{size} button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      if (size === 'xs') expect(button).toHaveClass('h-7');
      if (size === 'sm') expect(button).toHaveClass('h-8');
      if (size === 'default') expect(button).toHaveClass('h-9');
      if (size === 'lg') expect(button).toHaveClass('h-10');
      if (size === 'xl') expect(button).toHaveClass('h-12');
      if (size === 'icon') expect(button).toHaveClass('h-9', 'w-9');
      
      unmount();
    });
  });

  it('handles loading state correctly', () => {
    render(<Button loading>Loading button</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Loading button')).toHaveClass('sr-only');
    
    // Check for loading spinner
    const spinner = button.querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('displays loading text when provided', () => {
    render(
      <Button loading loadingText="Processing...">
        Submit
      </Button>
    );
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  });

  it('renders with left and right icons', () => {
    const LeftIcon = () => <span data-testid="left-icon">←</span>;
    const RightIcon = () => <span data-testid="right-icon">→</span>;
    
    render(
      <Button leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
        Button with icons
      </Button>
    );
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByText('Button with icons')).toBeInTheDocument();
  });

  it('hides icons when loading', () => {
    const LeftIcon = () => <span data-testid="left-icon">←</span>;
    const RightIcon = () => <span data-testid="right-icon">→</span>;
    
    render(
      <Button loading leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
        Loading button
      </Button>
    );
    
    expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
  });

  it('handles click events correctly', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('prevents click when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(
      <Button disabled onClick={handleClick}>
        Disabled button
      </Button>
    );
    const button = screen.getByRole('button', { name: /disabled button/i });
    
    expect(button).toBeDisabled();
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('prevents click when loading', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(
      <Button loading onClick={handleClick}>
        Loading button
      </Button>
    );
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies custom className correctly', () => {
    render(<Button className="custom-class">Custom button</Button>);
    const button = screen.getByRole('button', { name: /custom button/i });
    expect(button).toHaveClass('custom-class');
  });

  it('supports asChild prop with Slot', () => {
    render(
      <Button asChild>
        <a href="#test">Link button</a>
      </Button>
    );
    
    const link = screen.getByRole('link', { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#test');
  });

  it('has proper focus management', async () => {
    const user = userEvent.setup();
    render(<Button>Focusable button</Button>);
    
    const button = screen.getByRole('button', { name: /focusable button/i });
    
    await user.tab();
    expect(button).toHaveFocus();
  });

  it('provides proper ARIA attributes', () => {
    render(<Button disabled>Disabled button</Button>);
    const button = screen.getByRole('button', { name: /disabled button/i });
    
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders with proper semantic structure for screen readers', () => {
    render(
      <Button loading loadingText="Processing your request">
        Submit Form
      </Button>
    );
    
    // The original text should be visually hidden but available to screen readers
    const hiddenText = screen.getByText('Submit Form');
    expect(hiddenText).toHaveClass('sr-only');
    
    // Loading text should be visible
    expect(screen.getByText('Processing your request')).toBeInTheDocument();
  });
});
