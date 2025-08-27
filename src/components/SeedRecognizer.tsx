'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MAPS, POIS_BY_MAP, MAP_IMAGES } from "@/lib/seedData";

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

interface CVClassificationData {
  [seedKey: string]: {
    seedNumber: number;
    nightlord: string;
    mapType: string;
    pois: {
      [poiId: string]: {
        id: number;
        coordinates: { x: number; y: number };
        type: string;
      };
    };
  };
}

interface SeedRecognizerProps {
  onSeedRecognized?: (seedId: number) => void;
}

export function SeedRecognizer({ onSeedRecognized }: SeedRecognizerProps) {
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
  const [finalSeed, setFinalSeed] = useState<SeedInfo | null>(null);
  const [cvClassificationData, setCvClassificationData] = useState<CVClassificationData | null>(null);

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

  // Load CV classification data
  const loadClassificationData = useCallback(async () => {
    try {
      const response = await fetch('/dataset.json');
      const data = await response.json();
      if (data.poiDatabase && data.poiDatabase.seeds) {
        setCvClassificationData(data.poiDatabase.seeds);
        console.log('✅ Loaded classification data:', Object.keys(data.poiDatabase.seeds).length, 'seeds');
      } else if (data.seeds) {
        setCvClassificationData(data.seeds);
        console.log('✅ Loaded classification data (fallback):', Object.keys(data.seeds).length, 'seeds');
      }
    } catch (error) {
      console.warn('⚠️ Dataset not found:', error);
    }
  }, []);

  // Load classification data on mount
  useEffect(() => {
    loadClassificationData();
  }, [loadClassificationData]);

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

  // Handle map selection
  const handleMapSelect = (map: string) => {
    setSelectedMap(map);
    const pois = POIS_BY_MAP[map as keyof typeof POIS_BY_MAP] || [];
    setCurrentPois(pois);
    setPoiStates(initializePoiStates(pois));
    setFinalSeed(null);
    setError('');
    // Don't call updateSeedFiltering here - let user start recognition manually
  };

  // Handle nightlord selection
  const handleNightlordSelect = (nightlord: string) => {
    setSelectedNightlord(nightlord);
    // Don't call updateSeedFiltering here - let user start recognition manually
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

  // Handle canvas click (left click for church) - auto filter after each click
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
      const currentState = poiStates[poi.id];
      
      // If POI is already marked as church, reset it to dot
      if (currentState === 'church') {
        setPoiStates(prev => ({
          ...prev,
          [poi.id]: 'dot'
        }));
      } else {
        // Mark as church
        setPoiStates(prev => ({
          ...prev,
          [poi.id]: 'church'
        }));
      }
      
      // Auto filter after each POI marking/unmarking
      updateSeedFiltering();
    }
  };

  // Handle canvas right click - auto filter after each selection
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

  // Handle POI type selection from context menu - auto filter after each selection
  const handlePoiTypeSelect = (type: POIState) => {
    if (rightClickedPoi) {
      setPoiStates(prev => ({
        ...prev,
        [rightClickedPoi.id]: type
      }));
      // Auto filter after each POI type selection
      updateSeedFiltering();
    }
    setShowContextMenu(false);
    setRightClickedPoi(null);
  };

  // Reset map
  const resetMap = () => {
    setPoiStates(initializePoiStates(currentPois));
    setFinalSeed(null);
    setError('');
    // Don't call updateSeedFiltering here - let user restart recognition manually
  };

  // Update seed filtering
  const updateSeedFiltering = useCallback(() => {
    if (!selectedNightlord || !selectedMap || !cvClassificationData) {
      setPossibleSeeds([]);
      return;
    }

    setLoading(true);

    // Get all seeds for the selected nightlord and map
    const allSeeds = Object.values(cvClassificationData).filter(seed =>
      seed.nightlord === selectedNightlord && seed.mapType === selectedMap
    );

    console.log(`Found ${allSeeds.length} seeds for ${selectedNightlord} + ${selectedMap}`);

    // Filter by POI states using coordinate-based matching
    const filteredSeeds = allSeeds.filter(seed => {
      console.log(`\n🔍 Checking Seed ${seed.seedNumber}:`);

      for (const poi of currentPois) {
        const userState = poiStates[poi.id];

        // If user hasn't marked this POI yet, skip it
        if (userState === 'dot') {
          console.log(`  POI ${poi.id} at (${poi.x}, ${poi.y}): User hasn't marked - SKIPPING`);
          continue;
        }

        console.log(`  POI ${poi.id} at (${poi.x}, ${poi.y}): User marked as ${userState.toUpperCase()}`);

        // Find what POI type exists at this coordinate in the real seed data
        const realPOIType = seed.pois[poi.id.toString()]?.type || null;
        console.log(`    Real data shows: ${realPOIType || 'NOTHING'} at this location`);

        // If user marked as unknown (?), reject if seed has Church/Mage/Village here
        if (userState === 'unknown') {
          if (realPOIType === 'church' || realPOIType === 'mage' || realPOIType === 'village') {
            console.log(`    ❌ REJECTED: User said unknown but real data has ${realPOIType}`);
            return false;
          }
          console.log(`    ✅ OK: User said unknown and real data has ${realPOIType || 'nothing'}`);
          continue;
        }

        // User has marked as church, mage, or other - seed MUST match exactly
        if (userState === 'church') {
          if (realPOIType !== 'church') {
            console.log(`    ❌ REJECTED: User said church but real data has ${realPOIType || 'nothing'}`);
            return false;
          }
          console.log(`    ✅ MATCH: User said church and real data has church`);
        } else if (userState === 'mage') {
          if (realPOIType !== 'mage') {
            console.log(`    ❌ REJECTED: User said mage but real data has ${realPOIType || 'nothing'}`);
            return false;
          }
          console.log(`    ✅ MATCH: User said mage and real data has mage`);
        } else if (userState === 'village') {
          if (realPOIType !== 'village') {
            console.log(`    ❌ REJECTED: User said village but real data has ${realPOIType || 'nothing'}`);
            return false;
          }
          console.log(`    ✅ MATCH: User said village and real data has village`);
        } else if (userState === 'other') {
          if (realPOIType && realPOIType !== 'nothing') {
            console.log(`    ❌ REJECTED: User said other POI but real data has ${realPOIType}`);
            return false;
          }
          console.log(`    ✅ MATCH: User said other POI and real data has ${realPOIType || 'nothing'}`);
        }
      }
      console.log(`  ✅ Seed ${seed.seedNumber} PASSED all POI checks`);
      return true;
    });

    console.log(`After POI filtering: ${filteredSeeds.length} seeds remaining`);

    // Convert to SeedInfo format
    const seedInfos: SeedInfo[] = filteredSeeds.map(seed => ({
      seedId: seed.seedNumber,
      nightlord: seed.nightlord,
      map: seed.mapType,
      pois: Object.values(seed.pois).map(poi => poi.type),
      events: []
    }));

    setPossibleSeeds(seedInfos);
    setLoading(false);

    // If only one seed remains, show it and call the callback after a short delay
    if (seedInfos.length === 1) {
      const finalSeedData = filteredSeeds[0];
      setFinalSeed(seedInfos[0]);

      // Call the callback after a short delay to show success message
      setTimeout(() => {
        if (onSeedRecognized) {
          onSeedRecognized(finalSeedData.seedNumber);
        }
      }, 2000); // 2 second delay to show success message
    } else {
      setFinalSeed(null);
    }
  }, [selectedNightlord, selectedMap, currentPois, poiStates, cvClassificationData]);

  // Draw map when dependencies change - draw dots initially, final drawing handled by drawMapWithSeedData
  useEffect(() => {
    if (selectedMap && currentPois.length > 0 && !finalSeed) {
      // Draw initial dots when no final seed is identified
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
        loadImage(MAP_IMAGES[selectedMap as keyof typeof MAP_IMAGES])
          .then(backgroundImg => {
            ctx.drawImage(backgroundImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
            // Draw dots for all POIs initially
            currentPois.forEach(poi => {
              drawPoi(ctx, poi, 'dot');
            });
          })
          .catch(error => {
            console.warn('Background image not found, using default background');
            // Draw dots for all POIs initially
            currentPois.forEach(poi => {
              drawPoi(ctx, poi, 'dot');
            });
          });
      }
    }
  }, [selectedMap, currentPois, finalSeed, loadImage, drawPoi, CANVAS_SIZE]);

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
                  <span><strong>左键点击</strong>橙色圆点标记为Church，再次点击取消</span>
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
              <p className="text-xs text-blue-600 mt-2">
                提示：点击POI后会自动筛选种子，当只剩一个匹配结果时会自动显示识别结果
              </p>
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
                  <button
                    onClick={() => handlePoiTypeSelect('dot')}
                    className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-600"
                  >
                    ↶ 取消标记
                  </button>
                </div>
              )}


            </div>
          </div>

          {/* Status */}
          <div className="text-center space-y-2">
            {loading && (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-blue-600">正在筛选种子...</p>
              </div>
            )}
            {error && <p className="text-red-600">{error}</p>}
            {!loading && !error && selectedMap && selectedNightlord && (
              <>
                {possibleSeeds.length > 1 ? (
                  <p className="text-blue-600">
                    可能的种子数量: {possibleSeeds.length} - 继续标记POI以缩小范围
                  </p>
                ) : possibleSeeds.length === 1 ? (
                  <div className="space-y-4 p-6 bg-green-50 border-2 border-green-200 rounded-lg animate-pulse">
                    <div className="text-center space-y-3">
                      <div className="text-6xl animate-bounce">🎉</div>
                      <p className="text-green-700 font-bold text-xl">
                        识别成功！
                      </p>
                      <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <p className="text-green-600 text-lg">
                          种子ID: <span className="font-bold text-2xl text-green-800">{possibleSeeds[0].seedId}</span>
                        </p>
                        <p className="text-green-600 mt-2">
                          Nightlord: <span className="font-semibold">{possibleSeeds[0].nightlord}</span> |
                          地图: <span className="font-semibold">{possibleSeeds[0].map}</span>
                        </p>
                      </div>
                      <div className="flex items-center justify-center space-x-2 text-green-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        <p>正在生成地图...</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">
                    已标记POI数量: {Object.values(poiStates).filter(state => state !== 'dot').length}
                    {Object.values(poiStates).filter(state => state !== 'dot').length === 0 && ' - 请开始标记POI'}
                  </p>
                )}
              </>
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
