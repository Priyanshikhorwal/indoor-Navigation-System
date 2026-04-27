import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = () => {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    );
};

export default Loader;
