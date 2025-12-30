import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const DocumentsPage = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const res = await api.get('/documents/list');
                setDocuments(res.data.files || []);
            } catch (error) {
                console.error("Failed to load documents", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDocs();
    }, []);

    return (
        <div className="container mx-auto py-10 max-w-4xl animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Repository</h1>
                    <p className="text-muted-foreground">Manage and analyze regulatory documents.</p>
                </div>
                <Button onClick={() => navigate('/upload')}>
                    Upload New
                </Button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : documents.length === 0 ? (
                    <div className="text-center py-10 border rounded-lg bg-muted/20">
                        <p className="text-muted-foreground">No documents found.</p>
                    </div>
                ) : (
                    documents.map((doc, idx) => (
                        <Card key={idx} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{doc}</h3>
                                        <div className="flex gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs">PDF</Badge>
                                            <Badge variant="outline" className="text-xs">RBI</Badge>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => navigate(`/analyze/${encodeURIComponent(doc)}`)}
                                    variant="secondary"
                                    className="gap-2"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Analyze
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default DocumentsPage;
