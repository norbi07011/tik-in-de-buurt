
import React from 'react';
import { InboxIcon } from './icons/Icons';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    message: string;
    actionButton?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, actionButton }) => {
    return (
        <div className="col-span-full flex flex-col items-center justify-center text-center py-20 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg">
            <div className="text-[var(--text-muted)] mb-4">
                {icon || <InboxIcon className="w-16 h-16" />}
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h2>
            <p className="text-[var(--text-secondary)] mt-2 max-w-sm">{message}</p>
            {actionButton && <div className="mt-6">{actionButton}</div>}
        </div>
    );
};

export default EmptyState;
