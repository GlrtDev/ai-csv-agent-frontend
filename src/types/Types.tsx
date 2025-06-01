export interface AppState {
    csvFile: File | null;
    prompt: string;
    loading: boolean;
    result: ChartData | null;
    resultText: string;
    error: string | null;
    accessToken: string | null;
    fileUploaded: boolean;
}

export const initialAppState: AppState = {
    csvFile: null,
    fileUploaded: false,
    prompt: '',
    loading: false,
    result: null,
    resultText: '',
    error: null,
    accessToken: null,
};

export interface ChartData {
    chartType: 'bar' | 'line' | 'pie' | 'doughnut';
    data: Record<string, number>[];
    labelsKey?: string; // Key in the data array to use as labels (optional)
    valuesKey?: string; // Key in the data array to use as values (optional)
    options?: ChartOptions; // Optional Chart.js options
  }
  
export interface ChartOptions {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    scales?: any;
    plugins?: any;
}

export interface PromptResponse {
    data: ChartData;
    text: string;
  }