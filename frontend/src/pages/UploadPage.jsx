import React, { useState } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

const UploadPage = () => {
    const navigate = useNavigate();
    const [oldFile, setOldFile] = useState(null);
    const [newFile, setNewFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAnalyze = async (e) => {
        e.preventDefault();
        if (!oldFile || !newFile) return;

        setLoading(true);
        setError(null);

        try {
            const result = await api.analyzeFiles(oldFile, newFile);

            console.log("ANALYSIS RESULT:", result);

            if (!result || result.error || !result.data || !result.data.changes) {
                throw new Error(result?.error || "Invalid analysis returned");
            }

// Store only valid analysis
            sessionStorage.setItem("analysis_result", JSON.stringify(result.data));

            navigate("/analysis");


        } catch (err) {
            console.error("ANALYSIS FAILED:", err);
            setError("Analysis failed. Try smaller or valid files.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-12 max-w-2xl animate-in fade-in duration-500">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2">Compare Regulations</h1>
                <p className="text-muted-foreground">Upload two regulatory PDFs to detect changes.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upload Old & New Versions</CardTitle>
                    <CardDescription>Supported: PDF or TXT</CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleAnalyze} className="space-y-6">

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Old Regulation File</label>
                            <Input type="file" accept=".pdf,.txt" onChange={(e) => setOldFile(e.target.files[0])} required />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Regulation File</label>
                            <Input type="file" accept=".pdf,.txt" onChange={(e) => setNewFile(e.target.files[0])} required />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-700 p-3 rounded flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Run Analysis
                                </>
                            )}
                        </Button>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default UploadPage;
