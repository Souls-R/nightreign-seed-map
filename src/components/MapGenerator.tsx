'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapInput } from "./MapInput";
import { MapCanvas } from "./MapCanvas";
import { MapStatus } from "./MapStatus";

interface MapData {
  maps: Record<string, any>;
  constructs: Record<string, any[]>;
  coordinates: Record<string, [number, number]>;
  names: Record<string, string>;
}

interface MapGeneratorProps {
  initialSeedId?: string;
}

export function MapGenerator({ initialSeedId }: MapGeneratorProps) {
  const [mapId, setMapId] = useState(initialSeedId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapData, setMapData] = useState<MapData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/maps.json');
        const data: MapData = await response.json();
        setMapData(data);
        console.log('数据加载完成');
      } catch (error) {
        console.error('加载数据失败:', error);
        setError('加载数据失败');
      }
    };
    loadData();
  }, []);

  // Auto-generate map when initialSeedId is provided
  useEffect(() => {
    if (initialSeedId && mapData && !loading) {
      setMapId(initialSeedId);
      // Auto-generate the map
      setTimeout(() => generateMap(), 100);
    }
  }, [initialSeedId, mapData, loading]);

  // Load image
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Generate map
  const generateMap = async () => {
    if (!mapId.trim()) {
      setError('请输入地图ID');
      return;
    }

    if (!mapData || !mapData.maps[mapId]) {
      setError('地图ID不存在');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const mapInfo = mapData.maps[mapId];
      const backgroundName = `background_${mapInfo.Special}.png`;

      // Load background image
      const backgroundImg = await loadImage(`/static/${backgroundName}`);

      // Set canvas size
      canvas.width = backgroundImg.width;
      canvas.height = backgroundImg.height;

      // Draw background
      ctx.drawImage(backgroundImg, 0, 0);

      // Draw NightLord
      if (mapInfo.NightLord !== undefined && mapInfo.NightLord !== null) {
        try {
          const nightlordImg = await loadImage(`/static/nightlord_${mapInfo.NightLord}.png`);

          // Save current composite operation
          const previousCompositeOperation = ctx.globalCompositeOperation;
        // Set to source-over for correct transparency handling
          ctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(nightlordImg, 0, 0);
          // Restore previous composite operation
          ctx.globalCompositeOperation = previousCompositeOperation;
        } catch (error) {
          console.warn(`无法加载NightLord图片`);
        }
      }

      // Draw Treasure
      const treasureValue = mapInfo.Treasure_800;
      const combinedValue = treasureValue * 10 + mapInfo.Special;
      try {
        const treasureImg = await loadImage(`/static/treasure_${combinedValue}.png`);
        // Save current composite operation
        const previousCompositeOperation = ctx.globalCompositeOperation;
        // Set to source-over for correct transparency handling
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(treasureImg, 0, 0);
        // Restore previous composite operation
        ctx.globalCompositeOperation = previousCompositeOperation;
      } catch (error) {
        console.warn(`无法加载Treasure图片`);
      }

      // Draw RotRew
      if (mapInfo.RotRew_500 !== 0) {
        try {
          const rotrewImg = await loadImage(`/static/RotRew_${mapInfo.RotRew_500}.png`);
          // Save current composite operation
          const previousCompositeOperation = ctx.globalCompositeOperation;
          // Set to source-over for correct transparency handling
          ctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(rotrewImg, 0, 0);
          // Restore previous composite operation
          ctx.globalCompositeOperation = previousCompositeOperation;
        } catch (error) {
          console.warn(`无法加载RotRew图片`);
        }
      }

      // Draw Start
      try {
        const startImg = await loadImage(`/static/Start_${mapInfo.Start_190}.png`);
        // Save current composite operation
        const previousCompositeOperation = ctx.globalCompositeOperation;
        // Set to source-over for correct transparency handling
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(startImg, 0, 0);
        // Restore previous composite operation
        ctx.globalCompositeOperation = previousCompositeOperation;
      } catch (error) {
        console.warn(`无法加载Start图片`);
      }

      // Draw constructs
      if (mapData.constructs && mapData.constructs[mapId]) {
        for (const construct of mapData.constructs[mapId]) {
          try {
            const constructImg = await loadImage(`/static/Construct_${construct.type}.png`);
            const coord = mapData.coordinates[construct.coord_index.toString()];
            if (coord) {
              const [x, y] = coord;
              const drawX = x - constructImg.width / 2;
              const drawY = y - constructImg.height / 2;
              ctx.drawImage(constructImg, drawX, drawY);
            }
          } catch (error) {
            console.warn(`无法加载建筑图片 Construct_${construct.type}.png`);
          }
        }
      }

      // Draw Night Circle images and text labels
      const day1Loc = mapInfo.Day1Loc.toString();
      const day2Loc = mapInfo.Day2Loc.toString();

      if (mapData.coordinates && mapData.coordinates[day1Loc]) {
        try {
          const nightCircleImg = await loadImage('/static/night_circle.png');
          const [x, y] = mapData.coordinates[day1Loc];
          const drawX = x - nightCircleImg.width / 2;
          const drawY = y - nightCircleImg.height / 2;
          ctx.drawImage(nightCircleImg, drawX, drawY);
        } catch (error) {
          console.warn('无法加载night_circle图片');
        }
      }

      if (mapData.coordinates && mapData.coordinates[day2Loc]) {
        try {
          const nightCircleImg = await loadImage('/static/night_circle.png');
          const [x, y] = mapData.coordinates[day2Loc];
          const drawX = x - nightCircleImg.width / 2;
          const drawY = y - nightCircleImg.height / 2;
          ctx.drawImage(nightCircleImg, drawX, drawY);
        } catch (error) {
          console.warn('无法加载night_circle图片');
        }
      }

      // Draw Night Circle text labels
      if (mapData.coordinates && mapData.coordinates[day1Loc]) {
        const [x, y] = mapData.coordinates[day1Loc];
        // Day1 Boss text
        if (mapData.names && mapData.names[mapInfo.Day1Boss.toString()]) {
          const text = "DAY1 " + mapData.names[mapInfo.Day1Boss.toString()];
          ctx.fillStyle = '#781EF0'; // Purple text
          ctx.font = '95px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Add text shadow
          ctx.fillStyle = 'white';
          ctx.fillText(text, x-3, y-3);
          ctx.fillText(text, x-1, y-1);


          // Main text
          ctx.fillStyle = '#781EF0';
          ctx.fillText(text, x, y);
        }

        // Day1 extra text
        if (mapInfo.extra1 !== -1 && mapData.names && mapData.names[mapInfo.extra1.toString()]) {
          const extraText = mapData.names[mapInfo.extra1.toString()];
          ctx.fillStyle = '#781EF0';
          ctx.font = '95px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Add text shadow
          ctx.fillStyle = 'white';
          ctx.fillText(extraText, x-3, y+100);
          ctx.fillText(extraText, x-1, y+100);
          // ctx.fillStyle = 'black';
          // ctx.fillText(extraText, x+1, y+100);
          // ctx.fillText(extraText, x+3, y+100);
          // ctx.fillText(extraText, x+5, y+100);
          // ctx.fillText(extraText, x+7, y+100);

          // Main text
          ctx.fillStyle = '#781EF0';
          ctx.fillText(extraText, x, y+100);
        }
      }

      if (mapData.coordinates && mapData.coordinates[day2Loc]) {
        const [x, y] = mapData.coordinates[day2Loc];
        // Day2 Boss text
        if (mapData.names && mapData.names[mapInfo.Day2Boss.toString()]) {
          const text = "DAY2 " + mapData.names[mapInfo.Day2Boss.toString()];
          ctx.fillStyle = '#781EF0';
          ctx.font = '95px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Add text shadow
          ctx.fillStyle = 'white';
          ctx.fillText(text, x-3, y-3);
          ctx.fillText(text, x-1, y-1);
          // ctx.fillStyle = 'black';
          // ctx.fillText(text, x+1, y+1);
          // ctx.fillText(text, x+3, y+3);
          // ctx.fillText(text, x+5, y+5);
          // ctx.fillText(text, x+7, y+7);

          // Main text
          ctx.fillStyle = '#781EF0';
          ctx.fillText(text, x, y);
        }

        // Day2 extra text
        if (mapInfo.extra2 !== -1 && mapData.names && mapData.names[mapInfo.extra2.toString()]) {
          const extraText = mapData.names[mapInfo.extra2.toString()];
          ctx.fillStyle = '#781EF0';
          ctx.font = '95px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Add text shadow
          ctx.fillStyle = 'white';
          ctx.fillText(extraText, x-3, y+100);
          ctx.fillText(extraText, x-1, y+100);
          // ctx.fillStyle = 'black';
          // ctx.fillText(extraText, x+1, y+100);
          // ctx.fillText(extraText, x+3, y+100);
          // ctx.fillText(extraText, x+5, y+100);
          // ctx.fillText(extraText, x+7, y+100);

          // Main text
          ctx.fillStyle = '#781EF0';
          ctx.fillText(extraText, x, y+100);
        }
      }

      // Draw construct text labels
      if (mapData.constructs && mapData.constructs[mapId]) {
        for (const construct of mapData.constructs[mapId]) {
          if (mapData.coordinates && mapData.coordinates[construct.coord_index.toString()] && mapData.names && mapData.names[construct.type.toString()]) {
            const [x, y] = mapData.coordinates[construct.coord_index.toString()];
            const text = mapData.names[construct.type.toString()];

            ctx.fillStyle = '#f9f9f9';
            ctx.font = '65px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Add text shadow
            ctx.fillStyle = '#4d4a2b';
            ctx.fillText(text, x+4, y+4);
            ctx.fillText(text, x-4, y-4);

            // Main text
            ctx.fillStyle = '#f9f9f9';
            ctx.fillText(text, x, y);
          }
        }
      }

      // Draw event description text
      let eventText = '';
      if (mapInfo.EventFlag === 7705 || mapInfo.EventFlag === 7725) {
        const eventFlagName = (mapData.names && mapData.names[mapInfo.EventFlag.toString()]) || mapInfo.EventFlag.toString();
        const eventValueName = (mapData.names && mapData.names[mapInfo['Event_30*0'].toString()]) || mapInfo['Event_30*0'].toString();
        eventText = `特殊事件：${eventFlagName} ${eventValueName}`;
      } else {
        const eventFlagName = (mapData.names && mapData.names[mapInfo.EventFlag.toString()]) || mapInfo.EventFlag.toString();
        eventText = `特殊事件：${eventFlagName}`;
      }

      if (eventText) {
        const eventX = 1200;
        const eventY = 4300;

        ctx.fillStyle = '#FFFFFF'; // White text
        ctx.font = '160px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Add text shadow
        ctx.fillStyle = '#730FE6'; // Purple shadow
        ctx.fillText(eventText, eventX+15, eventY+15);

        // Main text
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(eventText, eventX, eventY);
      }

      // Scale canvas to 1/5 size for display
      const scale = 0.2;
      const scaledWidth = canvas.width * scale;
      const scaledHeight = canvas.height * scale;
      canvas.style.width = scaledWidth + 'px';
      canvas.style.height = scaledHeight + 'px';

    } catch (error) {
      console.error('生成地图失败:', error);
      setError('生成地图失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {initialSeedId ? `识别结果 - 种子 ${initialSeedId}` : '地图生成器'}
          </CardTitle>
          {initialSeedId && (
            <p className="text-center text-green-600 font-medium">
              🎯 根据POI识别自动生成的地图
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <MapInput
            mapId={mapId}
            onMapIdChange={initialSeedId ? undefined : setMapId}
            onGenerate={generateMap}
            loading={loading}
            disabled={!!initialSeedId}
          />

          <MapStatus loading={loading} error={error} />

          <div className="flex justify-center">
            <MapCanvas ref={canvasRef} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
