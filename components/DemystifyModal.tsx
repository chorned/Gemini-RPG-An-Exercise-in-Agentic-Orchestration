
import React, { useState, useEffect } from 'react';
import { ApiMetadata } from '../types';
import { getDemystificationReport } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface DemystifyModalProps {
  metadata: ApiMetadata;
  onClose: () => void;
}

const DemystifyModal: React.FC<DemystifyModalProps> = ({ metadata, onClose }) => {
    const [report, setReport] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await getDemystificationReport(metadata);
                setReport(result);
            } catch (err) {
                console.error(err);
                setError("Failed to generate the demystification report. The mystic energies are weak.");
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [metadata]);

    const renderReport = () => {
        if (!report) return null;

        const processLineHTML = (line: string) => {
            return line
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-amber-300">$1</strong>')
                .replace(/`([^`]+)`/g, '<code class="bg-gray-700 text-amber-400 px-1 rounded">$1</code>');
        };

        // FIX: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
        const elements: React.ReactElement[] = [];
        let currentList: React.ReactElement[] = [];

        const flushList = (key: string | number) => {
            if (currentList.length > 0) {
                elements.push(<ul key={`ul-${key}`} className="list-disc pl-5 space-y-2 my-3">{currentList}</ul>);
                currentList = [];
            }
        };

        report.split('\n').forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('* ')) {
                const content = trimmedLine.substring(2);
                currentList.push(<li key={index} dangerouslySetInnerHTML={{ __html: processLineHTML(content) }} />);
            } else {
                flushList(index); 

                if (line.startsWith('### ')) {
                    elements.push(<h3 key={index} className="text-2xl font-medieval text-amber-300 mt-6 mb-2" dangerouslySetInnerHTML={{ __html: processLineHTML(line.substring(4)) }} />);
                } else if (line.startsWith('#### ')) {
                    elements.push(<h4 key={index} className="text-xl font-medieval text-amber-400 mt-4 mb-1" dangerouslySetInnerHTML={{ __html: processLineHTML(line.substring(5)) }} />);
                } else if (line.trim() !== '') {
                    elements.push(<p key={index} dangerouslySetInnerHTML={{ __html: processLineHTML(line) }} />);
                }
            }
        });

        flushList('last');

        return elements;
    };


    return (
        <div 
          className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4 animate-fade-in-fast"
          onClick={onClose}
        >
            <div 
              className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-600">
                    <h2 className="text-2xl font-medieval text-amber-300">API Demystification</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {loading && <LoadingSpinner text="Demystifying the arcane API call..." />}
                    {error && <div className="text-red-400 text-center">{error}</div>}
                    {report && <div className="prose prose-invert max-w-none text-gray-300">{renderReport()}</div>}
                </div>
            </div>
            <style>{`
            .animate-fade-in-fast {
                animation: fadeInFast 0.2s ease-in-out;
            }
            @keyframes fadeInFast {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            `}</style>
        </div>
    );
};

export default DemystifyModal;