import { forwardRef } from "react";

interface MapCanvasProps {
  className?: string;
}

export const MapCanvas = forwardRef<HTMLCanvasElement, MapCanvasProps>(
  ({ className }, ref) => {
    return (
      <canvas
        ref={ref}
        className={`border border-border rounded-lg shadow-sm ${className || ""}`}
      />
    );
  }
);

MapCanvas.displayName = "MapCanvas";
