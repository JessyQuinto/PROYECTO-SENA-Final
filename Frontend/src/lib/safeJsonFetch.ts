/**
 * Safe fetch helper that validates JSON responses to prevent crashes
 */

interface SafeFetchResponse<T = any> {
  data: T | null;
  error: string | null;
  ok: boolean;
  status: number;
  headers: Headers;
}

/**
 * Safe fetch that handles non-JSON responses gracefully
 */
export async function safeFetch<T = any>(
  url: string, 
  options?: RequestInit
): Promise<SafeFetchResponse<T>> {
  try {
    const response = await fetch(url, options);
    
    // Get content type
    const contentType = response.headers.get('content-type') || '';
    
    // Check if response is JSON
    const isJson = contentType.includes('application/json');
    
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP ${response.status}`;
      
      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = await response.text();
        }
      } else {
        errorMessage = await response.text();
      }
      
      return {
        data: null,
        error: errorMessage,
        ok: false,
        status: response.status,
        headers: response.headers
      };
    }
    
    // If response is OK, try to parse JSON
    if (isJson) {
      try {
        const data = await response.json();
        return {
          data,
          error: null,
          ok: true,
          status: response.status,
          headers: response.headers
        };
      } catch (parseError) {
        return {
          data: null,
          error: `Failed to parse JSON: ${parseError}`,
          ok: false,
          status: response.status,
          headers: response.headers
        };
      }
    } else {
      // Response is not JSON (probably HTML error page)
      const text = await response.text();
      return {
        data: null,
        error: `Expected JSON but received: ${contentType}. Content: ${text.slice(0, 100)}...`,
        ok: false,
        status: response.status,
        headers: response.headers
      };
    }
    
  } catch (networkError: any) {
    return {
      data: null,
      error: `Network error: ${networkError.message}`,
      ok: false,
      status: 0,
      headers: new Headers()
    };
  }
}

/**
 * Debug helper to log fetch details
 */
export function debugFetch(url: string, response: SafeFetchResponse) {
  console.group(`🌐 Fetch: ${url}`);
  console.log('Status:', response.status);
  console.log('OK:', response.ok);
  console.log('Content-Type:', response.headers.get('content-type'));
  
  if (response.error) {
    console.error('❌ Error:', response.error);
  } else {
    console.log('✅ Data:', response.data);
  }
  
  console.groupEnd();
}

export default safeFetch;