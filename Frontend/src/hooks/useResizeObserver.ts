import { useEffect, useRef, useState } from 'react';

export interface ResizeObserverEntry {
  readonly borderBoxSize: ReadonlyArray<ResizeObserverSize>;
  readonly contentBoxSize: ReadonlyArray<ResizeObserverSize>;
  readonly contentRect: DOMRectReadOnly;
  readonly devicePixelContentBoxSize: ReadonlyArray<ResizeObserverSize>;
  readonly target: Element;
}

export interface ResizeObserverSize {
  readonly blockSize: number;
  readonly inlineSize: number;
}

type ResizeObserverCallback = (entries: ResizeObserverEntry[]) => void;

/**
 * Custom hook for observing element resize events
 * @param elementRef - Ref to the element to observe
 * @param callback - Callback function called when element resizes
 * @param options - ResizeObserver options
 */
export const useResizeObserver = (
  elementRef: React.RefObject<Element>,
  callback: (entry: ResizeObserverEntry) => void,
  options?: ResizeObserverOptions
) => {
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check if ResizeObserver is supported
    if (typeof ResizeObserver === 'undefined') {
      console.warn('ResizeObserver is not supported in this browser');
      return;
    }

    const observer = new ResizeObserver((entries) => {
      // Call the callback with the first entry (assuming single element observation)
      if (entries.length > 0) {
        callbackRef.current(entries[0] as ResizeObserverEntry);
      }
    });

    observer.observe(element, options);

    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [elementRef, options]);
};

/**
 * Hook for observing multiple elements
 * @param elementsRef - Array of refs to observe
 * @param callback - Callback function called when any element resizes
 * @param options - ResizeObserver options
 */
export const useMultipleResizeObserver = (
  elementsRef: React.RefObject<Element>[],
  callback: ResizeObserverCallback,
  options?: ResizeObserverOptions
) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const elements = elementsRef.map(ref => ref.current).filter(Boolean) as Element[];
    if (elements.length === 0) return;

    if (typeof ResizeObserver === 'undefined') {
      console.warn('ResizeObserver is not supported in this browser');
      return;
    }

    const observer = new ResizeObserver((entries) => {
      callbackRef.current(entries as ResizeObserverEntry[]);
    });

    elements.forEach(element => {
      observer.observe(element, options);
    });

    return () => {
      elements.forEach(element => {
        observer.unobserve(element);
      });
      observer.disconnect();
    };
  }, [elementsRef, options]);
};

/**
 * Hook that returns the current size of an element
 * @param elementRef - Ref to the element to measure
 * @returns Object containing width and height
 */
export const useElementSize = (elementRef: React.RefObject<Element>) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useResizeObserver(
    elementRef,
    (entry) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    }
  );

  return size;
};

export default useResizeObserver;