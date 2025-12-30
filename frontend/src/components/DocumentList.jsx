import React, { useEffect, useState } from 'react';
import { FileText, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
            const docs = Array.isArray(data) ? data : (data.documents || data.files || []);
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

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            className="space-y-4"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <h3 className="text-xl font-semibold text-foreground mb-4">Uploaded Documents</h3>
            <div className="grid gap-3">
                {documents.map((doc, idx) => (
                    <motion.button
                        key={idx}
                        variants={item}
                        onClick={() => onSelectDocument(doc)}
                        className="flex items-center justify-between p-4 bg-card hover:bg-accent border border-border rounded-xl transition-all group text-left shadow-sm hover:shadow-md"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium text-foreground">
                                    {typeof doc === 'string' ? doc : doc.filename}
                                </p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}
