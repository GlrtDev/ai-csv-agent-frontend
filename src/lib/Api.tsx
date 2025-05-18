import { type ChartData } from '../types/Types';

export const handleFileUpload = async (file: File, endpoint: 'upload-csv' | 'upload-csv-background'): Promise<{ access_token: string; token_type: string }> => {
    const formData = new FormData();
    formData.append('file', file);
  
    const response = await fetch(`http://localhost:8000/${endpoint}/`, {
      method: 'POST',
      body: formData,
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Failed to upload CSV to ${endpoint}.`);
    }
    return response.json();
  };

  export const handleSendPromptRequest = async (prompt: string, token: string | null) => {
    if (!token) {
      throw new Error('Authentication token is missing.');
    }

    const mockChartData: ChartData = {
      chartType: 'bar',
      data: [{ Age: 40, Count: 10 }, { Age: 50, Count: 15 }, { Age: 60, Count: 8 }, { Age: 80, Count: 18 },{ Age: 70, Count: 28 }],
      labelsKey: 'Age',
      valuesKey: 'Count',
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Age'
            },
          },
          x: {
            title: {
              display: true,
              text: 'Count'
            },
          }
        },
      },
    };
    return { data: mockChartData };

  
    const response = await fetch('http://localhost:8000/send-prompt/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt }),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to send prompt.');
    }
    return response.json();
  };
