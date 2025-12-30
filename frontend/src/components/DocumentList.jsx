import React, { useEffect, useState } from 'react';
import { FileText, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export function DocumentList({ onSelectDocument, onError }) {
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDocuments = async () => {
        setIsLoading(true);
        const { data, error } = await api.listDocuments();
        setIsLoading(false);

        if (error) {
            onError(error);
        } else if (data) {
            // Assume backend returns { documents: [...] } or just array based on contract. 
            // Contract says GET /documents/list, usually returns a list or object with list.
            // Let's assume array or { documents: [] } property. 
            // Safe check:
            const docs = Array.isArray(data) ? data : (data.documents || []);
            setDocuments(docs);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className="text-center p-12 text-slate-400 bg-slate-800/30 rounded-xl border border-slate-700">
                <p>No documents found. Upload one to get started.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Uploaded Documents</h3>
            <div className="grid gap-3">
                {documents.map((doc, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelectDocument(doc)} // doc might be object or string filename
                        className="flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all group text-left"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-200">
                                    {typeof doc === 'string' ? doc : doc.filename}
                                </p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                    </button>
                ))}
            </div>
        </div>
    );
}
