import React from 'react';
import { Toaster } from 'sonner';
import AIAgentApp from './components/AiAgentApp';

const App: React.FC = () => {
    return (
        <>
            <Toaster richColors />
            <AIAgentApp />
        </>
    );
};

export default App;