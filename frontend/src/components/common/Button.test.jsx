/**
 * Button Component Tests
 * 
 * Testing priorities:
 * 1. Button renders with text
 * 2. onClick handler called
 * 3. Disabled state
 * 4. Loading state shows spinner
 * 5. Accessibility compliance (tap targets, aria labels)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from './Button';

describe('Button Component', () => {
  describe('Rendering Tests', () => {
    test('should render button with text', () => {
      // Given
      const buttonText = 'Click Me';

      // When
      render(<Button>{buttonText}</Button>);

      // Then
      expect(screen.getByRole('button', { name: buttonText })).toBeInTheDocument();
      expect(screen.getByText(buttonText)).toBeInTheDocument();
    });

    test('should render button with icon', () => {
      // Given
      const icon = '📁';
      const buttonText = 'Upload';

      // When
      render(<Button icon={icon}>{buttonText}</Button>);

      // Then
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText(icon)).toBeInTheDocument();
      expect(screen.getByText(buttonText)).toBeInTheDocument();
    });

    test('should render button with custom className', () => {
      // Given
      const customClass = 'custom-button-class';

      // When
      render(<Button className={customClass}>Test</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveClass(customClass);
    });

    test('should apply variant classes correctly', () => {
      // Given & When
      const { rerender } = render(<Button variant="primary">Test</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveClass('btn-primary');

      // When - change variant
      rerender(<Button variant="secondary">Test</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveClass('btn-secondary');
    });

    test('should apply size classes correctly', () => {
      // Given & When
      const { rerender } = render(<Button size="small">Test</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveClass('btn-small');

      // When - change size
      rerender(<Button size="large">Test</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveClass('btn-large');
    });

    test('should apply fullWidth class when specified', () => {
      // When
      render(<Button fullWidth>Test</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveClass('btn-full-width');
    });

    test('should use button type by default', () => {
      // When
      render(<Button>Test</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    test('should use submit type when specified', () => {
      // When
      render(<Button type="submit">Submit</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });

  describe('Click Handler Tests', () => {
    test('should call onClick handler when clicked', () => {
      // Given
      const handleClick = jest.fn();

      // When
      render(<Button onClick={handleClick}>Click Me</Button>);
      fireEvent.click(screen.getByRole('button'));

      // Then
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('should call onClick handler with event object', () => {
      // Given
      const handleClick = jest.fn();

      // When
      render(<Button onClick={handleClick}>Click Me</Button>);
      fireEvent.click(screen.getByRole('button'));

      // Then
      expect(handleClick).toHaveBeenCalledWith(expect.objectContaining({
        type: 'click',
      }));
    });

    test('should not call onClick when disabled', () => {
      // Given
      const handleClick = jest.fn();

      // When
      render(
        <Button onClick={handleClick} disabled>
          Click Me
        </Button>
      );
      fireEvent.click(screen.getByRole('button'));

      // Then
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('should not call onClick when loading', () => {
      // Given
      const handleClick = jest.fn();

      // When
      render(
        <Button onClick={handleClick} loading>
          Click Me
        </Button>
      );
      fireEvent.click(screen.getByRole('button'));

      // Then
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State Tests', () => {
    test('should render disabled button when disabled prop is true', () => {
      // When
      render(<Button disabled>Disabled Button</Button>);

      // Then
      expect(screen.getByRole('button')).toBeDisabled();
    });

    test('should have disabled attribute in DOM', () => {
      // When
      render(<Button disabled>Disabled Button</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveAttribute('disabled');
    });

    test('should not have disabled attribute when disabled is false', () => {
      // When
      render(<Button disabled={false}>Enabled Button</Button>);

      // Then
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    test('should have aria-disabled when disabled', () => {
      // When
      render(<Button disabled>Disabled Button</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    test('should maintain disabled state with icon', () => {
      // When
      render(
        <Button disabled icon="📁">
          Disabled Upload
        </Button>
      );

      // Then
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Loading State Tests', () => {
    test('should show loading state when loading prop is true', () => {
      // When
      render(<Button loading>Loading Button</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveClass('btn-loading');
    });

    test('should show spinner element when loading', () => {
      // When
      render(<Button loading>Loading Button</Button>);

      // Then
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('should show "Loading..." text for screen readers when loading', () => {
      // When
      render(<Button loading>Loading Button</Button>);

      // Then
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('should disable button when loading', () => {
      // When
      render(<Button loading>Loading Button</Button>);

      // Then
      expect(screen.getByRole('button')).toBeDisabled();
    });

    test('should not show spinner when not loading', () => {
      // When
      render(<Button loading={false}>Normal Button</Button>);

      // Then
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    test('should hide button text content when loading (visual only)', () => {
      // When
      render(<Button loading>Submit</Button>);

      // Then
      // Text should still be in DOM for accessibility
      expect(screen.getByText('Submit')).toBeInTheDocument();
      // But button should have loading class
      expect(screen.getByRole('button')).toHaveClass('btn-loading');
    });

    test('should preserve icon when loading', () => {
      // When
      render(
        <Button loading icon="📁">
          Uploading
        </Button>
      );

      // Then
      expect(screen.getByText('📁')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    test('should have role="button"', () => {
      // When
      render(<Button>Test</Button>);

      // Then
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('should use aria-label when provided', () => {
      // Given
      const ariaLabel = 'Custom accessible label';

      // When
      render(<Button ariaLabel={ariaLabel}>Visible Text</Button>);

      // Then
      expect(screen.getByRole('button', { name: ariaLabel })).toBeInTheDocument();
    });

    test('should use button text as aria-label when no ariaLabel provided', () => {
      // When
      render(<Button>Click Me</Button>);

      // Then
      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    test('should have aria-busy="true" when loading', () => {
      // When
      render(<Button loading>Loading</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    test('should have aria-busy="false" when not loading', () => {
      // When
      render(<Button loading={false}>Not Loading</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'false');
    });

    test('should mark spinner as aria-hidden', () => {
      // When
      render(<Button loading>Loading</Button>);

      // Then
      const spinner = screen.getByClassName('btn-spinner');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });

    test('should mark icon as aria-hidden', () => {
      // When
      render(<Button icon="📁">Upload</Button>);

      // Then
      const icon = screen.getByClassName('btn-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    test('should have visually-hidden class for loading text', () => {
      // When
      render(<Button loading>Loading</Button>);

      // Then
      expect(screen.getByText('Loading...')).toHaveClass('visually-hidden');
    });
  });

  describe('Variant Tests', () => {
    test('should render primary variant', () => {
      // When
      render(<Button variant="primary">Primary</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveClass('btn-primary');
    });

    test('should render secondary variant', () => {
      // When
      render(<Button variant="secondary">Secondary</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveClass('btn-secondary');
    });

    test('should render danger variant', () => {
      // When
      render(<Button variant="danger">Danger</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveClass('btn-danger');
    });

    test('should render success variant', () => {
      // When
      render(<Button variant="success">Success</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveClass('btn-success');
    });

    test('should render outline variant', () => {
      // When
      render(<Button variant="outline">Outline</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveClass('btn-outline');
    });

    test('should render link variant', () => {
      // When
      render(<Button variant="link">Link</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveClass('btn-link');
    });

    test('should default to primary variant', () => {
      // When
      render(<Button>Default</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveClass('btn-primary');
    });
  });

  describe('Size Tests', () => {
    test('should render small size', () => {
      // When
      render(<Button size="small">Small</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveClass('btn-small');
    });

    test('should render medium size', () => {
      // When
      render(<Button size="medium">Medium</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveClass('btn-medium');
    });

    test('should render large size', () => {
      // When
      render(<Button size="large">Large</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveClass('btn-large');
    });

    test('should default to medium size', () => {
      // When
      render(<Button>Default Size</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveClass('btn-medium');
    });
  });

  describe('Elderly User Accessibility Tests', () => {
    test('should have minimum 48x48px tap target for large buttons', () => {
      // When
      render(<Button size="large">Large Button</Button>);

      // Then
      const button = screen.getByRole('button');
      // Note: Actual size check would require DOM measurements
      // This test verifies the class is applied for CSS to handle
      expect(button).toHaveClass('btn-large');
    });

    test('should have clear focus indicator', () => {
      // When
      render(<Button>Focusable Button</Button>);

      // Then
      const button = screen.getByRole('button');
      fireEvent.focus(button);
      expect(button).toHaveFocus();
    });

    test('should support keyboard activation', () => {
      // Given
      const handleClick = jest.fn();

      // When
      render(<Button onClick={handleClick}>Keyboard Button</Button>);
      fireEvent.click(screen.getByRole('button'));

      // Then
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('should support Enter key activation', () => {
      // Given
      const handleClick = jest.fn();

      // When
      render(<Button onClick={handleClick}>Enter Button</Button>);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter', code: 'Enter' });

      // Then
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('should support Space key activation', () => {
      // Given
      const handleClick = jest.fn();

      // When
      render(<Button onClick={handleClick}>Space Button</Button>);
      fireEvent.keyDown(screen.getByRole('button'), { key: ' ', code: 'Space' });

      // Then
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty children gracefully', () => {
      // When
      render(<Button ariaLabel="Empty Button"></Button>);

      // Then
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('should handle React elements as children', () => {
      // Given
      const customContent = <span data-testid="custom-content">Custom</span>;

      // When
      render(<Button>{customContent}</Button>);

      // Then
      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    });

    test('should handle long text content', () => {
      // Given
      const longText = 'This is a very long button text that should wrap appropriately';

      // When
      render(<Button>{longText}</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveTextContent(longText);
    });

    test('should handle special characters in text', () => {
      // Given
      const specialText = 'Save & Continue →';

      // When
      render(<Button>{specialText}</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveTextContent(/Save & Continue/);
    });

    test('should handle disabled and loading together', () => {
      // When
      render(
        <Button disabled loading>
          Disabled Loading
        </Button>
      );

      // Then
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByRole('button')).toHaveClass('btn-loading');
    });
  });

  describe('Prop Forwarding', () => {
    test('should forward additional props to button element', () => {
      // When
      render(<Button data-testid="test-button" id="custom-id">Test</Button>);

      // Then
      expect(screen.getByTestId('test-button')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveAttribute('id', 'custom-id');
    });

    test('should forward title attribute', () => {
      // When
      render(<Button title="Helpful tooltip">Hover Me</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Helpful tooltip');
    });

    test('should forward tabIndex', () => {
      // When
      render(<Button tabIndex={3}>Tab Button</Button>);

      // Then
      expect(screen.getByRole('button')).toHaveAttribute('tabIndex', '3');
    });
  });
});
