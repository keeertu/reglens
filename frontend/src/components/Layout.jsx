import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShieldCheck, LayoutDashboard, FileText, CheckSquare, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

const Layout = () => {
    const location = useLocation();

    const navItems = [
        { href: '/', label: 'Overview', icon: LayoutDashboard }, // Redirects to docs for now
        { href: '/documents', label: 'Documents', icon: FileText },
        { href: '/tasks', label: 'Compliance Tasks', icon: CheckSquare },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Top Navigation */}
            <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-black text-white rounded-lg flex items-center justify-center font-bold">R</div>
                        <span className="text-xl font-bold tracking-tight">RegLens</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-6">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                                    location.pathname === item.href ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded font-medium border border-emerald-200">
                            Live Demo
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
