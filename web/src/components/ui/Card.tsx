
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className || ''}`}
        {...props}
    />
));
Card.displayName = "Card";

export default Card;
