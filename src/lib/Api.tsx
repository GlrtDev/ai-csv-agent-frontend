import { type PromptResponse } from '../types/Types';

export const handleFileUpload = async (file: File, endpoint: 'upload-csv' | 'upload-csv-background'): Promise<{ access_token: string; token_type: string }> => {
    const formData = new FormData();
    formData.append('file', file);
  
    const response = await fetch(`http://localhost:8000/${endpoint}/`, {
      method: 'POST',
      body: formData,
    });
  
    if (!response.ok) {
      let errorDetail;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail;
      } catch (jsonError) {
        // If parsing JSON fails, we don't have a specific detail.
        // The original error will be caught by the generic error message below.
      }
      throw new Error(errorDetail || `Failed to upload CSV to ${endpoint}.`);
    }
    return response.json();
  };

  export const handleSendPromptRequest = async (prompt: string, token: string | null): Promise<PromptResponse> => {
    if (!token) {
      throw new Error('Authentication token is missing.');
    }
  
    const response = await fetch('http://localhost:8000/send-prompt/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt }),
    });
  
    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch (jsonError) {
        throw new Error(`Server responded with status ${response.status}: ${response.statusText}`);
      }

      if (errorData && errorData.detail) {
        throw new Error(`API Error: ${errorData.detail}`);
      } else if (errorData && typeof errorData === 'string') {
        throw new Error(`API Error: ${errorData}`);
      } else {
        throw new Error(`Failed to send prompt. Status: ${response.status}`);
      }
    }

    const responseData: PromptResponse = await response.json();

    if (typeof responseData.data === 'undefined' || typeof responseData.text === 'undefined') {
      console.warn('Received response without expected "data" or "text" fields:', responseData);
      throw new Error('Unexpected response format from the server. Missing "data" and/or "text" fields.');
    }

    return responseData;
  };
