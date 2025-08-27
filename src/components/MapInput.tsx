import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MapInputProps {
  mapId: string;
  onMapIdChange: (value: string) => void;
  onGenerate: () => void;
  loading: boolean;
}

export function MapInput({ mapId, onMapIdChange, onGenerate, loading }: MapInputProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mapId" className="text-sm font-medium">
          地图ID
        </Label>
        <div className="flex gap-2">
          <Input
            id="mapId"
            type="text"
            placeholder="输入地图ID"
            value={mapId}
            onChange={(e) => onMapIdChange(e.target.value)}
            className="w-48"
          />
          <Button
            onClick={onGenerate}
            disabled={loading}
            className="min-w-24"
          >
            {loading ? "生成中..." : "生成地图"}
          </Button>
        </div>
      </div>
    </div>
  );
}
