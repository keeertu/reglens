import React, { useState } from 'react';
import { Upload, FileUp, AlertCircle, CheckCircle } from 'lucide-react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const UploadPage = () => {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [version, setVersion] = useState('');
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(null); // 'success', 'error'

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !title || !version) return;

        setUploading(true);
        setStatus(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('version', version);

        try {
            await api.post('/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setStatus('success');
            setFile(null);
            setTitle('');
            setVersion('');
        } catch (error) {
            console.error(error);
            setStatus('error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-2xl animate-in fade-in duration-500">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Ingest Regulation</h1>
                <p className="text-muted-foreground">Upload new RBI circulars for automated analysis.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Document Upload</CardTitle>
                    <CardDescription>Supported formats: PDF. Max size: 10MB.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpload} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Document Title</label>
                            <Input
                                placeholder="e.g. Master Direction KYC"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Version / Series</label>
                            <Input
                                placeholder="e.g. 2025.1.0"
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">File</label>
                            <Input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                required
                                className="cursor-pointer"
                            />
                        </div>

                        {status === 'success' && (
                            <div className="bg-green-50 text-green-700 p-4 rounded-md flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                Upload successful! Document is ready for analysis.
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                Upload failed. Please check the file and try again.
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={uploading}>
                            {uploading ? "Uploading..." : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" /> Upload Document
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
