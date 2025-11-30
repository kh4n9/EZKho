'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dialog = ({ open, onOpenChange, children }) => {
    const [isOpen, setIsOpen] = useState(open);

    useEffect(() => {
        setIsOpen(open);
    }, [open]);

    const handleOpenChange = (value) => {
        setIsOpen(value);
        if (onOpenChange) {
            onOpenChange(value);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={() => handleOpenChange(false)}
            />
            <div className="relative z-50 w-full max-w-lg p-6 bg-white rounded-lg shadow-lg animate-in fade-in zoom-in duration-200">
                {React.Children.map(children, child => {
                    if (React.isValidElement(child)) {
                        return React.cloneElement(child, { onClose: () => handleOpenChange(false) });
                    }
                    return child;
                })}
            </div>
        </div>
    );
};

const DialogContent = ({ children, className, onClose }) => {
    return (
        <div className={cn("relative", className)}>
            <button
                onClick={onClose}
                className="absolute right-0 top-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </button>
            {children}
        </div>
    );
};

const DialogHeader = ({ className, ...props }) => (
    <div
        className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}
        {...props}
    />
);

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
    <h2
        ref={ref}
        className={cn("text-lg font-semibold leading-none tracking-tight", className)}
        {...props}
    />
));
DialogTitle.displayName = "DialogTitle";

export { Dialog, DialogContent, DialogHeader, DialogTitle };
