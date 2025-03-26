import { cn } from "@/lib/utils/styles";

function Skeleton({ className, ...props }) {
    return (
        <div
            data-slot="skeleton"
            className={cn("bg-primary/10 animate-pulse rounded-md", className)}
            {...props}
        />
    );
}

export { Skeleton };
