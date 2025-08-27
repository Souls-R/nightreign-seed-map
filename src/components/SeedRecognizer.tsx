'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MAPS, seedDataMatrix, POIS_BY_MAP, MAP_IMAGES } from "@/lib/seedData";

interface POI {
  id: number;
  x: number;
  y: number;
}

interface SeedInfo {
  seedId: number;
  nightlord: string;
  map: string;
  pois: string[];
  events: string[];
}

type POIState = 'dot' | 'church' | 'mage' | 'village' | 'other' | 'unknown';

export function SeedRecognizer() {
  const [selectedMap, setSelectedMap] = useState<string>('');
  const [selectedNightlord, setSelectedNightlord] = useState<string>('');
  const [currentPois, setCurrentPois] = useState<POI[]>([]);
  const [poiStates, setPoiStates] = useState<Record<number, POIState>>({});
  const [possibleSeeds, setPossibleSeeds] = useState<SeedInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [rightClickedPoi, setRightClickedPoi] = useState<POI | null>(null);
  const [showSeedImage, setShowSeedImage] = useState(false);
  const [finalSeed, setFinalSeed] = useState<SeedInfo | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const CANVAS_SIZE = 768;
  const ICON_SIZE = 38;

  // Nightlords list
  const NIGHTLORDS = [
    'Gladius', 'Adel', 'Gnoster', 'Maris',
    'Libra', 'Fulghor', 'Caligo', 'Heolstor'
  ];

  // Load background image
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  // Initialize POI states
  const initializePoiStates = useCallback((pois: POI[]) => {
    const states: Record<number, POIState> = {};
    pois.forEach(poi => {
      states[poi.id] = 'dot';
    });
    return states;
  }, []);

  // Draw POI on canvas
  const drawPoi = useCallback((ctx: CanvasRenderingContext2D, poi: POI, state: POIState) => {
    const { x, y } = poi;

    switch (state) {
      case 'dot':
        // Draw orange dot
        ctx.beginPath();
        ctx.arc(x, y, ICON_SIZE / 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff8c00';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;

      case 'church':
        // Draw church icon (simple cross for now)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 8, y - 15, 16, 25);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x - 2, y - 10, 4, 15);
        ctx.fillRect(x - 8, y - 5, 16, 4);
        break;

      case 'mage':
        // Draw mage tower icon (simple tower)
        ctx.fillStyle = '#4B0082';
        ctx.fillRect(x - 6, y - 15, 12, 20);
        ctx.fillStyle = '#9370DB';
        ctx.fillRect(x - 4, y - 12, 8, 2);
        ctx.fillRect(x - 4, y - 8, 8, 2);
        ctx.fillRect(x - 4, y - 4, 8, 2);
        break;

      case 'village':
        // Draw village icon (simple house)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 8, y - 8, 16, 12);
        ctx.fillStyle = '#DC143C';
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 8);
        ctx.lineTo(x, y - 15);
        ctx.lineTo(x + 8, y - 8);
        ctx.closePath();
        ctx.fill();
        break;

      case 'other':
        // Draw gray dot
        ctx.beginPath();
        ctx.arc(x, y, ICON_SIZE / 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#808080';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;

      case 'unknown':
        // Draw gray dot with question mark
        ctx.beginPath();
        ctx.arc(x, y, ICON_SIZE / 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#808080';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x, y);
        break;
    }
  }, [ICON_SIZE]);

  // Draw map
  const drawMap = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw background
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Try to load background image based on selected map
    if (selectedMap) {
      try {
        const backgroundImg = await loadImage(MAP_IMAGES[selectedMap as keyof typeof MAP_IMAGES]);
        ctx.drawImage(backgroundImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      } catch (error) {
        console.warn('Background image not found, using default background');
      }
    }

    // Draw POIs
    currentPois.forEach(poi => {
      const state = poiStates[poi.id] || 'dot';
      drawPoi(ctx, poi, state);
    });
  }, [selectedMap, currentPois, poiStates, loadImage, drawPoi, CANVAS_SIZE]);

  // Handle map selection
  const handleMapSelect = (map: string) => {
    setSelectedMap(map);
    const pois = POIS_BY_MAP[map as keyof typeof POIS_BY_MAP] || [];
    setCurrentPois(pois);
    setPoiStates(initializePoiStates(pois));
    setShowSeedImage(false);
    setFinalSeed(null);
    updateSeedFiltering();
  };

  // Handle nightlord selection
  const handleNightlordSelect = (nightlord: string) => {
    setSelectedNightlord(nightlord);
    updateSeedFiltering();
  };

  // Get mouse position on canvas
  const getMousePos = (canvas: HTMLCanvasElement, event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  };

  // Find clicked POI
  const findClickedPoi = (x: number, y: number): POI | null => {
    return currentPois.find(poi => {
      const dx = x - poi.x;
      const dy = y - poi.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= ICON_SIZE / 2;
    }) || null;
  };

  // Handle canvas click (left click for church)
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedMap || !selectedNightlord) {
      setError('请先选择地图和Nightlord');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getMousePos(canvas, event.nativeEvent);
    const poi = findClickedPoi(pos.x, pos.y);

    if (poi) {
      setPoiStates(prev => ({
        ...prev,
        [poi.id]: 'church'
      }));
      updateSeedFiltering();
    }
  };

  // Handle canvas right click
  const handleCanvasContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    if (!selectedMap || !selectedNightlord) {
      setError('请先选择地图和Nightlord');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getMousePos(canvas, event.nativeEvent);
    const poi = findClickedPoi(pos.x, pos.y);

    if (poi) {
      setRightClickedPoi(poi);
      setContextMenuPos({ x: event.clientX, y: event.clientY });
      setShowContextMenu(true);
    }
  };

  // Handle POI type selection from context menu
  const handlePoiTypeSelect = (type: POIState) => {
    if (rightClickedPoi) {
      setPoiStates(prev => ({
        ...prev,
        [rightClickedPoi.id]: type
      }));
      updateSeedFiltering();
    }
    setShowContextMenu(false);
    setRightClickedPoi(null);
  };

  // Reset map
  const resetMap = () => {
    setPoiStates(initializePoiStates(currentPois));
    setShowSeedImage(false);
    setFinalSeed(null);
    updateSeedFiltering();
  };

  // Update seed filtering
  const updateSeedFiltering = useCallback(() => {
    if (!selectedNightlord || !selectedMap) {
      setPossibleSeeds([]);
      return;
    }

    setLoading(true);

    // Filter seeds by nightlord and map
    const filteredSeeds = seedDataMatrix.filter(row => {
      return row[1] === selectedNightlord && row[2] === selectedMap;
    });

    // Filter by POI states
    const finalFilteredSeeds = filteredSeeds.filter(row => {
      const seedId = row[0] as number;

      for (const poi of currentPois) {
        const userState = poiStates[poi.id];

        // Skip unmarked POIs
        if (userState === 'dot') continue;

        // Get real POI type from seed data (simplified logic)
        const realPoiType = getRealPoiTypeFromSeed(seedId, poi.id);

        // Check if user marking matches seed data
        if (userState === 'unknown') {
          if (realPoiType && ['church', 'mage', 'village'].includes(realPoiType)) {
            return false; // Reject if user said unknown but seed has POI
          }
        } else if (userState !== realPoiType) {
          return false; // Reject if types don't match
        }
      }

      return true;
    });

    // Convert to SeedInfo format
    const seedInfos: SeedInfo[] = finalFilteredSeeds.map(row => ({
      seedId: row[0] as number,
      nightlord: row[1] as string,
      map: row[2] as string,
      pois: [],
      events: []
    }));

    setPossibleSeeds(seedInfos);
    setLoading(false);

    // If only one seed remains, show it
    if (seedInfos.length === 1) {
      setFinalSeed(seedInfos[0]);
      setShowSeedImage(true);
    } else {
      setFinalSeed(null);
      setShowSeedImage(false);
    }
  }, [selectedNightlord, selectedMap, currentPois, poiStates]);

  // Simplified POI type detection from seed data
  const getRealPoiTypeFromSeed = (seedId: number, poiId: number): POIState | null => {
    // This is a simplified version - in reality you'd need more complex logic
    // For now, we'll use a basic mapping
    const seedData = seedDataMatrix.find(row => row[0] === seedId);
    if (!seedData) return null;

    // Check POI columns (indices 3-47)
    for (let i = 3; i <= 47; i++) {
      const poiValue = seedData[i] as string;
      if (poiValue && poiValue.trim()) {
        if (poiValue.includes('Church')) return 'church';
        if (poiValue.includes('Sorcerer') || poiValue.includes('Mage')) return 'mage';
        if (poiValue.includes('Village')) return 'village';
      }
    }

    return null;
  };

  // Draw map when dependencies change
  useEffect(() => {
    if (selectedMap && currentPois.length > 0) {
      drawMap();
    }
  }, [selectedMap, currentPois, poiStates, drawMap]);

  // Hide context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            地图种子识别器
          </CardTitle>
          <p className="text-center text-muted-foreground">
            通过在地图上点击POI来识别Nightreign地图种子
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selection Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nightlord Selection */}
            <div className="space-y-2">
              <Label>选择Nightlord</Label>
              <div className="grid grid-cols-2 gap-2">
                {NIGHTLORDS.map((nightlord) => (
                  <Button
                    key={nightlord}
                    onClick={() => handleNightlordSelect(nightlord)}
                    variant={selectedNightlord === nightlord ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {nightlord}
                  </Button>
                ))}
              </div>
            </div>

            {/* Map Selection */}
            <div className="space-y-2">
              <Label>选择地图类型</Label>
              <div className="grid grid-cols-2 gap-2">
                {MAPS.map((map) => (
                  <Button
                    key={map}
                    onClick={() => handleMapSelect(map)}
                    variant={selectedMap === map ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {map}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Instructions */}
          {selectedMap && selectedNightlord && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">使用说明</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 bg-orange-500 rounded-full"></span>
                  <span><strong>左键点击</strong>橙色圆点标记为Church</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 bg-purple-500 rounded-full"></span>
                  <span><strong>右键点击</strong>选择其他POI类型</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button onClick={resetMap} variant="outline" size="sm">
                    重置地图
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Canvas Section */}
          <div className="flex justify-center">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                onClick={handleCanvasClick}
                onContextMenu={handleCanvasContextMenu}
                className="border border-gray-300 cursor-crosshair"
                style={{ maxWidth: '100%', height: 'auto' }}
              />

              {/* Context Menu */}
              {showContextMenu && (
                <div
                  ref={contextMenuRef}
                  className="absolute bg-white border border-gray-300 rounded shadow-lg py-2 z-10"
                  style={{
                    left: contextMenuPos.x,
                    top: contextMenuPos.y,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  <button
                    onClick={() => handlePoiTypeSelect('mage')}
                    className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    🧙 Sorcerer's Rise
                  </button>
                  <button
                    onClick={() => handlePoiTypeSelect('village')}
                    className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    🏘️ Village
                  </button>
                  <button
                    onClick={() => handlePoiTypeSelect('other')}
                    className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    ❓ Other POI
                  </button>
                </div>
              )}

              {/* Seed Image Overlay */}
              {showSeedImage && finalSeed && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-4">识别成功！</h3>
                    <p className="mb-2">种子ID: {finalSeed.seedId}</p>
                    <p className="mb-2">Nightlord: {finalSeed.nightlord}</p>
                    <p className="mb-4">地图: {finalSeed.map}</p>
                    <div className="text-sm text-gray-600">
                      完整的种子地图图像应该在这里显示
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="text-center">
            {loading && <p className="text-blue-600">正在识别中...</p>}
            {error && <p className="text-red-600">{error}</p>}
            {!loading && (
              <p className={possibleSeeds.length > 0 ? "text-green-600" : "text-gray-600"}>
                可能的种子数量: {possibleSeeds.length}
                {possibleSeeds.length === 1 && ' - 找到唯一匹配的种子！'}
                {possibleSeeds.length === 0 && ' - 未找到匹配的种子'}
              </p>
            )}
          </div>

          {/* POI Reference */}
          {selectedMap && (
            <div className="space-y-2">
              <Label>POI参考信息 ({selectedMap})</Label>
              <div className="flex flex-wrap gap-2">
                {POIS_BY_MAP[selectedMap as keyof typeof POIS_BY_MAP]?.map((poi) => (
                  <span key={poi.id} className="inline-block px-2 py-1 bg-gray-100 border rounded text-sm">
                    POI {poi.id} ({poi.x}, {poi.y})
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
