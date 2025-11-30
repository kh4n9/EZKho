'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const DropdownMenu = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative inline-block text-left" ref={containerRef}>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, {
                        isOpen,
                        setIsOpen,
                        onSelect: () => setIsOpen(false)
                    });
                }
                return child;
            })}
        </div>
    );
};

const DropdownMenuTrigger = ({ children, asChild, setIsOpen, isOpen, ...props }) => {
    const Comp = asChild ? React.Fragment : 'button';
    const child = asChild ? React.Children.only(children) : children;

    if (asChild) {
        return React.cloneElement(child, {
            onClick: (e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
                if (child.props.onClick) child.props.onClick(e);
            },
            ...props
        });
    }

    return (
        <button onClick={() => setIsOpen(!isOpen)} {...props}>
            {children}
        </button>
    );
};

const DropdownMenuContent = ({ children, isOpen, setIsOpen, onSelect, align = 'end', className, ...props }) => {
    if (!isOpen) return null;

    return (
        <div
            className={cn(
                "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                align === 'end' ? 'right-0' : 'left-0',
                "mt-2",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

const DropdownMenuItem = ({ children, className, onSelect, onClick, ...props }) => {
    return (
        <div
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer hover:bg-gray-100",
                className
            )}
            onClick={(e) => {
                if (onClick) onClick(e);
                if (onSelect) onSelect();
            }}
            {...props}
        >
            {children}
        </div>
    );
};

const DropdownMenuLabel = ({ children, className, ...props }) => (
    <div
        className={cn("px-2 py-1.5 text-sm font-semibold", className)}
        {...props}
    >
        {children}
    </div>
);

const DropdownMenuSeparator = ({ className, ...props }) => (
    <div
        className={cn("-mx-1 my-1 h-px bg-muted", className)}
        {...props}
    />
);

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
};
