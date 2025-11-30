import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const PageHeader = ({
    title,
    description,
    actionLabel,
    onAction,
    actionIcon: ActionIcon = Plus,
    children
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
                {description && (
                    <p className="mt-1 text-sm text-gray-500">{description}</p>
                )}
            </div>

            <div className="flex items-center gap-3">
                {children}
                {actionLabel && onAction && (
                    <Button onClick={onAction} className="flex items-center gap-2">
                        <ActionIcon className="w-4 h-4" />
                        {actionLabel}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
