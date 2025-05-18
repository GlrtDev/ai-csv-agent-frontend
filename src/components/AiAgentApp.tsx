import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { File, FilePlus, BrainCircuit, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { type AppState, initialAppState } from '../types/Types'; // Import the types
import { handleFileUpload, handleSendPromptRequest } from '../lib/Api'; // Import the API functions
import DataChart from './DataChart';
import { CustomFileInput } from './CustomFileInput';

const AIAgentApp: React.FC = () => {
    const [state, setState] = useState<AppState>(initialAppState);

    const handleFileChange = (newFile: File | null) => {
        if (newFile) {
            setState({ ...state, csvFile: newFile });
        }
        else {
            setState({ ...state, fileUploaded: false, csvFile: null });
        }
    };

    const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setState({ ...state, prompt: event.target.value });
    };

    const handleUploadCSV = async () => {
        if (!state.csvFile) {
          toast.error('Please select a CSV file.');
          return;
        }
      
        setState({ ...state, loading: true, error: null, result: null, accessToken: null }); // Reset token on new upload
      
        try {
          const result = await handleFileUpload(state.csvFile, 'upload-csv');
          setState({ ...state, loading: false, accessToken: result.access_token, fileUploaded: true }); // Store the access token
          toast.success('CSV uploaded successfully! You can now send a prompt.');
        } catch (error: any) {
          setState({ ...state, loading: false, error: error.message });
          toast.error(`Error uploading CSV: ${error.message}`);
        }
      };

      const handleSendPrompt = async () => {
        if (!state.prompt) {
          toast.error('Please enter a prompt.');
          return;
        }
      
        if (!state.accessToken) {
          toast.error('Please upload a CSV file first to obtain an access token.');
          return;
        }
      
        setState({ ...state, loading: true, error: null, result: null });
      
        try {
          const result = await handleSendPromptRequest(state.prompt, state.accessToken); // Pass the token
          setState({ ...state, loading: false, result: result.data }); // Assuming the processed data is under the 'data' key
          toast.success('Prompt processed successfully!');
        } catch (error: any) {
          setState({ ...state, loading: false, error: error.message });
          toast.error(`Error sending prompt: ${error.message}`);
        }
      };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text" style={{ lineHeight: '1.2' }}>
                    Cheapest Data Analyst
                </h1>
                <h1 className="text-1xl sm:text-2xl md:text-2xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                (that you can find under 1 minute)
                </h1>

                <div className="bg-gray-900/90 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-gray-700 shadow-lg space-y-4">
                    <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                        <File className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                        Upload CSV File
                    </h2>
                    <CustomFileInput
                        accept=".csv"
                        onChange={handleFileChange}
                        disabled={state.loading}
                    />
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            onClick={handleUploadCSV}
                            disabled={state.loading || !state.csvFile || state.fileUploaded}
                            className="bg-blue-500/90 hover:bg-blue-500 text-white font-semibold flex items-center gap-2
                                       transition-colors duration-300 w-full sm:w-auto"
                        >
                            {state.loading ? (
                                <>
                                    <BrainCircuit className="animate-spin w-4 h-4" />
                                    Processing...
                                </>
                            ) : state.fileUploaded ? (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    File Uploaded
                                </>
                            ) : (
                                <>
                                    <FilePlus className="w-4 h-4" />
                                    Upload CSV
                                </>
                            )
                            }
                        </Button>
                    </div>
                </div>

                <div className="bg-gray-900/90 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-gray-700 shadow-lg space-y-4">
                    <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                        Send Prompt
                    </h2>
                    <Textarea
                        placeholder="Enter your prompt here..."
                        value={state.prompt}
                        onChange={handlePromptChange}
                        className="mb-4 bg-black/50 text-white border-gray-700 placeholder:text-gray-400"
                        rows={4}
                        disabled={state.loading}
                    />
                    <Button
                        onClick={handleSendPrompt}
                        disabled={state.loading || !state.prompt}
                        className="bg-green-500/90 hover:bg-green-500 text-white font-semibold w-full
                                   transition-colors duration-300 flex items-center gap-2"
                    >
                        {state.loading ? (
                            <>
                                <BrainCircuit className="animate-spin w-4 h-4" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <BrainCircuit className="w-4 h-4" />
                                Send Prompt
                            </>
                        )}
                    </Button>
                </div>

                {state.result && (
                    <div className="bg-gray-900/90 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-gray-700 shadow-lg space-y-4">
                        <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                            Result
                        </h2>
                        {state.result.chartType && state.result.data && state.result.data.length > 0 ? (
                            <div className="h-64 w-full relative">
                                <DataChart chartData={state.result} />
                            </div>
                        ) : (
                            <pre className="bg-black/50 text-green-400 p-4 rounded-md overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(state.result, null, 2)}
                            </pre>
                        )}
                    </div>
                )}

                {state.error && (
                    <div className="bg-gray-900/90 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-gray-700 shadow-lg space-y-4">
                        <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2 text-red-400">
                            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                            Error
                        </h2>
                        <p className="text-red-400">
                            {state.error}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAgentApp