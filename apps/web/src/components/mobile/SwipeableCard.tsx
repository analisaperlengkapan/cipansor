'use client';

import { useState, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SwipeableCardProps {
    children: ReactNode;
    className?: string;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    leftAction?: ReactNode;
    rightAction?: ReactNode;
    threshold?: number;
}

export function SwipeableCard({
    children,
    className,
    onSwipeLeft,
    onSwipeRight,
    leftAction,
    rightAction,
    threshold = 80,
}: SwipeableCardProps) {
    const [deltaX, setDeltaX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const startX = useRef(0);
    const startY = useRef(0);
    const isHorizontalSwipe = useRef(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        isHorizontalSwipe.current = false;
        setIsSwiping(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = currentX - startX.current;
        const diffY = currentY - startY.current;

        // Determine swipe direction on first significant movement
        if (!isHorizontalSwipe.current && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
            isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
        }

        // Only handle horizontal swipes
        if (isHorizontalSwipe.current) {
            e.preventDefault();
            const maxSwipe = 150;
            const clampedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, diffX));
            setDeltaX(clampedDelta);
        }
    };

    const handleTouchEnd = () => {
        if (!isSwiping) return;

        if (deltaX < -threshold && onSwipeLeft) {
            onSwipeLeft();
        } else if (deltaX > threshold && onSwipeRight) {
            onSwipeRight();
        }

        setDeltaX(0);
        setIsSwiping(false);
    };

    const showLeftAction = deltaX > 30 && leftAction;
    const showRightAction = deltaX < -30 && rightAction;

    return (
        <div className={cn('relative overflow-hidden rounded-lg', className)}>
            {/* Left action background */}
            {leftAction && (
                <div
                    className={cn(
                        'absolute inset-y-0 left-0 flex items-center justify-start px-4 bg-green-500 text-white transition-opacity',
                        showLeftAction ? 'opacity-100' : 'opacity-0'
                    )}
                    style={{ width: Math.abs(deltaX) }}
                >
                    {leftAction}
                </div>
            )}

            {/* Right action background */}
            {rightAction && (
                <div
                    className={cn(
                        'absolute inset-y-0 right-0 flex items-center justify-end px-4 bg-red-500 text-white transition-opacity',
                        showRightAction ? 'opacity-100' : 'opacity-0'
                    )}
                    style={{ width: Math.abs(deltaX) }}
                >
                    {rightAction}
                </div>
            )}

            {/* Main content */}
            <div
                className={cn('bg-background relative z-10 touch-pan-y', !isSwiping && 'transition-transform')}
                style={{ transform: `translateX(${deltaX}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {children}
            </div>
        </div>
    );
}
