import { describe, it, expect } from 'vitest';
import { cn } from '../../lib/utils';

describe('Utils Functions', () => {
  describe('cn function', () => {
    it('combines class names correctly', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('handles conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class');
      expect(result).toBe('base-class conditional-class');
    });

    it('handles undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'valid-class');
      expect(result).toBe('base-class valid-class');
    });

    it('handles empty strings', () => {
      const result = cn('base-class', '', 'valid-class');
      expect(result).toBe('base-class valid-class');
    });

    it('handles arrays of classes', () => {
      const result = cn('base-class', ['array-class1', 'array-class2'], 'final-class');
      expect(result).toBe('base-class array-class1 array-class2 final-class');
    });

    it('handles objects with boolean values', () => {
      const result = cn('base-class', {
        'active': true,
        'disabled': false,
        'selected': true
      });
      expect(result).toBe('base-class active selected');
    });

    it('handles mixed input types', () => {
      const result = cn(
        'base-class',
        'string-class',
        ['array-class1', 'array-class2'],
        { 'object-class': true, 'hidden': false },
        undefined,
        null,
        ''
      );
      expect(result).toBe('base-class string-class array-class1 array-class2 object-class');
    });

    it('returns empty string for no inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('handles single class input', () => {
      const result = cn('single-class');
      expect(result).toBe('single-class');
    });
  });
});