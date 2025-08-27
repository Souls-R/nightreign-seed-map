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

interface MapData {
  maps: Record<string, any>;
  constructs: Record<string, any[]>;
  coordinates: Record<string, [number, number]>;
  names: Record<string, string>;
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
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [showCompleteMap, setShowCompleteMap] = useState(false);
  const [poiImages, setPoiImages] = useState<Record<string, HTMLImageElement>>({});

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

  // Load map generation data
  const loadMapData = useCallback(async () => {
    try {
      const response = await fetch('/maps.json');
      const data: MapData = await response.json();
      setMapData(data);
      console.log('✅ Loaded map data');
    } catch (error) {
      console.warn('⚠️ Map data not found:', error);
    }
  }, []);

  // Load classification data on mount
  useEffect(() => {
    loadClassificationData();
    loadMapData();
    loadPoiImages();
  }, [loadClassificationData, loadMapData]);

  // Load POI images
  const loadPoiImages = useCallback(() => {
    const images: Record<string, HTMLImageElement> = {};
    const imageUrls = {
      church: '/poi-assets/church.png',
      mage: '/poi-assets/mage-tower.png',
      village: '/poi-assets/village.png'
    };

    Object.entries(imageUrls).forEach(([key, url]) => {
      const img = new Image();
      img.onload = () => {
        images[key] = img;
        setPoiImages(prev => ({ ...prev, [key]: img }));
      };
      img.onerror = () => {
        console.warn(`Failed to load POI image: ${key}`);
      };
      img.src = url;
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

  // Draw POI on canvas with proper icons
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
        // Draw church icon if loaded
        if (poiImages.church && poiImages.church.complete) {
          ctx.drawImage(poiImages.church, x - ICON_SIZE / 2, y - ICON_SIZE / 2, ICON_SIZE, ICON_SIZE);
        } else {
          // Fallback to orange dot if image not loaded
          ctx.beginPath();
          ctx.arc(x, y, ICON_SIZE / 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#8B4513';
          ctx.fill();
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        break;

      case 'mage':
        // Draw mage tower icon if loaded
        if (poiImages.mage && poiImages.mage.complete) {
          ctx.drawImage(poiImages.mage, x - ICON_SIZE / 2, y - ICON_SIZE / 2, ICON_SIZE, ICON_SIZE);
        } else {
          // Fallback to purple dot if image not loaded
          ctx.beginPath();
          ctx.arc(x, y, ICON_SIZE / 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#4B0082';
          ctx.fill();
          ctx.strokeStyle = '#9370DB';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        break;

      case 'village':
        // Draw village icon if loaded
        if (poiImages.village && poiImages.village.complete) {
          ctx.drawImage(poiImages.village, x - ICON_SIZE / 2, y - ICON_SIZE / 2, ICON_SIZE, ICON_SIZE);
        } else {
          // Fallback to brown dot if image not loaded
          ctx.beginPath();
          ctx.arc(x, y, ICON_SIZE / 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#8B4513';
          ctx.fill();
          ctx.strokeStyle = '#DC143C';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
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
  }, [ICON_SIZE, poiImages]);

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
      
      // Left click toggles church state
      if (currentState === 'church') {
        // If already church, reset to dot
        setPoiStates(prev => {
          const newStates = { ...prev, [poi.id]: 'dot' as POIState };
          return newStates;
        });
      } else {
        // Mark as church
        setPoiStates(prev => {
          const newStates = { ...prev, [poi.id]: 'church' as POIState };
          return newStates;
        });
      }
      
      // Auto filter after each POI marking/unmarking
      setTimeout(() => updateSeedFiltering(), 10);
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
      // Get the canvas position relative to the viewport
      const canvasRect = canvas.getBoundingClientRect();
      setContextMenuPos({ 
        x: event.clientX, 
        y: event.clientY 
      });
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
      setTimeout(() => updateSeedFiltering(), 10);
    }
    setShowContextMenu(false);
    setRightClickedPoi(null);
  };

  // Reset map
  const resetMap = () => {
    setPoiStates(initializePoiStates(currentPois));
    setFinalSeed(null);
    setShowCompleteMap(false);
    setError('');
    // Don't call updateSeedFiltering here - let user restart recognition manually
  };

  // Generate complete map
  const generateCompleteMap = useCallback(async (seedId: number) => {
    if (!mapData || !mapData.maps[seedId.toString()]) {
      setError('无法找到种子的地图数据');
      return;
    }

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const mapInfo = mapData.maps[seedId.toString()];
      const backgroundName = `background_${mapInfo.Special}.png`;

      // Load background image
      const backgroundImg = await loadImage(`/static/${backgroundName}`);

      // Set canvas size to match original image
      canvas.width = backgroundImg.width;
      canvas.height = backgroundImg.height;

      // Draw background
      ctx.drawImage(backgroundImg, 0, 0);

      // Draw NightLord
      if (mapInfo.NightLord !== undefined && mapInfo.NightLord !== null) {
        try {
          const nightlordImg = await loadImage(`/static/nightlord_${mapInfo.NightLord}.png`);
          const previousCompositeOperation = ctx.globalCompositeOperation;
          ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(nightlordImg, 0, 0);
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
        const previousCompositeOperation = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(treasureImg, 0, 0);
        ctx.globalCompositeOperation = previousCompositeOperation;
      } catch (error) {
        console.warn(`无法加载Treasure图片`);
      }

      // Draw RotRew
      if (mapInfo.RotRew_500 !== 0) {
        try {
          const rotrewImg = await loadImage(`/static/RotRew_${mapInfo.RotRew_500}.png`);
          const previousCompositeOperation = ctx.globalCompositeOperation;
          ctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(rotrewImg, 0, 0);
          ctx.globalCompositeOperation = previousCompositeOperation;
        } catch (error) {
          console.warn(`无法加载RotRew图片`);
        }
      }

      // Draw Start
      try {
        const startImg = await loadImage(`/static/Start_${mapInfo.Start_190}.png`);
        const previousCompositeOperation = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(startImg, 0, 0);
        ctx.globalCompositeOperation = previousCompositeOperation;
      } catch (error) {
        console.warn(`无法加载Start图片`);
      }

      // Draw constructs
      if (mapData.constructs && mapData.constructs[seedId.toString()]) {
        for (const construct of mapData.constructs[seedId.toString()]) {
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

      // Draw Night Circle images
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
        if (mapData.names && mapData.names[mapInfo.Day1Boss.toString()]) {
          const text = "DAY1 " + mapData.names[mapInfo.Day1Boss.toString()];
          ctx.fillStyle = '#781EF0';
          ctx.font = '95px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Add text shadow
          ctx.fillStyle = 'white';
          ctx.fillText(text, x-3, y-3);
          ctx.fillText(text, x-1, y-1);
          ctx.fillStyle = 'black';
          ctx.fillText(text, x+1, y+1);
          ctx.fillText(text, x+3, y+3);
          ctx.fillText(text, x+5, y+5);
          ctx.fillText(text, x+7, y+7);

          ctx.fillStyle = '#781EF0';
          ctx.fillText(text, x, y);
        }

        if (mapInfo.extra1 !== -1 && mapData.names && mapData.names[mapInfo.extra1.toString()]) {
          const extraText = mapData.names[mapInfo.extra1.toString()];
          ctx.fillStyle = '#781EF0';
          ctx.font = '95px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          ctx.fillStyle = 'white';
          ctx.fillText(extraText, x-3, y+100);
          ctx.fillText(extraText, x-1, y+100);
          ctx.fillStyle = 'black';
          ctx.fillText(extraText, x+1, y+100);
          ctx.fillText(extraText, x+3, y+100);
          ctx.fillText(extraText, x+5, y+100);
          ctx.fillText(extraText, x+7, y+100);

          ctx.fillStyle = '#781EF0';
          ctx.fillText(extraText, x, y+100);
        }
      }

      if (mapData.coordinates && mapData.coordinates[day2Loc]) {
        const [x, y] = mapData.coordinates[day2Loc];
        if (mapData.names && mapData.names[mapInfo.Day2Boss.toString()]) {
          const text = "DAY2 " + mapData.names[mapInfo.Day2Boss.toString()];
          ctx.fillStyle = '#781EF0';
          ctx.font = '95px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          ctx.fillStyle = 'white';
          ctx.fillText(text, x-3, y-3);
          ctx.fillText(text, x-1, y-1);
          ctx.fillStyle = 'black';
          ctx.fillText(text, x+1, y+1);
          ctx.fillText(text, x+3, y+3);
          ctx.fillText(text, x+5, y+5);
          ctx.fillText(text, x+7, y+7);

          ctx.fillStyle = '#781EF0';
          ctx.fillText(text, x, y);
        }

        if (mapInfo.extra2 !== -1 && mapData.names && mapData.names[mapInfo.extra2.toString()]) {
          const extraText = mapData.names[mapInfo.extra2.toString()];
          ctx.fillStyle = '#781EF0';
          ctx.font = '95px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          ctx.fillStyle = 'white';
          ctx.fillText(extraText, x-3, y+100);
          ctx.fillText(extraText, x-1, y+100);
          ctx.fillStyle = 'black';
          ctx.fillText(extraText, x+1, y+100);
          ctx.fillText(extraText, x+3, y+100);
          ctx.fillText(extraText, x+5, y+100);
          ctx.fillText(extraText, x+7, y+100);

          ctx.fillStyle = '#781EF0';
          ctx.fillText(extraText, x, y+100);
        }
      }

      // Draw construct text labels
      if (mapData.constructs && mapData.constructs[seedId.toString()]) {
        for (const construct of mapData.constructs[seedId.toString()]) {
          if (mapData.coordinates && mapData.coordinates[construct.coord_index.toString()] && mapData.names && mapData.names[construct.type.toString()]) {
            const [x, y] = mapData.coordinates[construct.coord_index.toString()];
            const text = mapData.names[construct.type.toString()];

            ctx.fillStyle = '#FFFF00';
            ctx.font = '65px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.fillStyle = 'black';
            ctx.fillText(text, x+4, y+4);
            ctx.fillText(text, x-4, y-4);

            ctx.fillStyle = '#FFFF00';
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

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '160px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        ctx.fillStyle = '#730FE6';
        ctx.fillText(eventText, eventX+15, eventY+15);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(eventText, eventX, eventY);
      }

      // Scale canvas to 1/5 size for display
      const scale = 0.2;
      const scaledWidth = canvas.width * scale;
      const scaledHeight = canvas.height * scale;
      canvas.style.width = scaledWidth + 'px';
      canvas.style.height = scaledHeight + 'px';

      setShowCompleteMap(true);
    } catch (error) {
      console.error('生成完整地图失败:', error);
      setError('生成完整地图失败: ' + (error as Error).message);
    }
  }, [mapData, loadImage]);

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

    // If only one seed remains, show it and generate complete map
    if (seedInfos.length === 1) {
      const finalSeedData = filteredSeeds[0];
      setFinalSeed(seedInfos[0]);

      // Generate complete map after a short delay
      setTimeout(() => {
        generateCompleteMap(finalSeedData.seedNumber);
        // Call the callback if provided
        if (onSeedRecognized) {
          onSeedRecognized(finalSeedData.seedNumber);
        }
      }, 2000); // 2 second delay to show success message
    } else {
      setFinalSeed(null);
      setShowCompleteMap(false);
    }
  }, [selectedNightlord, selectedMap, currentPois, poiStates, cvClassificationData, generateCompleteMap]);

  // Draw map when dependencies change - draw dots initially, final drawing handled by drawMapWithSeedData
  useEffect(() => {
    if (selectedMap && currentPois.length > 0 && !finalSeed && !showCompleteMap) {
      // Draw initial dots when no final seed is identified and not showing complete map
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
            // Draw POIs on top
            currentPois.forEach(poi => {
              const state = poiStates[poi.id] || 'dot';
              drawPoi(ctx, poi, state);
            });
          })
          .catch(error => {
            console.warn('Background image not found, using default background');
            // Draw POIs initially
            currentPois.forEach(poi => {
              const state = poiStates[poi.id] || 'dot';
              drawPoi(ctx, poi, state);
            });
          });
      }
    }
  }, [selectedMap, currentPois, finalSeed, showCompleteMap, poiStates, loadImage, drawPoi, CANVAS_SIZE]);

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
                  <span><strong>左键点击</strong>橙色圆点标记/取消Church</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 bg-purple-500 rounded-full"></span>
                  <span><strong>右键点击</strong>选择Mage Tower或Village</span>
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
                onClick={showCompleteMap ? undefined : handleCanvasClick}
                onContextMenu={showCompleteMap ? undefined : handleCanvasContextMenu}
                className={`border border-gray-300 ${showCompleteMap ? 'cursor-default' : 'cursor-crosshair'}`}
                style={{ maxWidth: '100%', height: 'auto' }}
              />

              {/* Complete Map Overlay */}
              {showCompleteMap && (
                <div className="absolute top-4 left-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🎯</span>
                    <span className="font-semibold">完整地图已生成</span>
                  </div>
                </div>
              )}

              {/* Context Menu */}
              {showContextMenu && !showCompleteMap && (
                <div
                  ref={contextMenuRef}
                  className="fixed bg-white border border-gray-300 rounded shadow-lg py-2 z-50"
                  style={{
                    left: `${contextMenuPos.x}px`,
                    top: `${contextMenuPos.y}px`,
                  }}
                >
                  <button
                    onClick={() => handlePoiTypeSelect('mage')}
                    className="flex w-full px-4 py-2 text-left hover:bg-gray-100 items-center space-x-2"
                  >
                    <img src="/poi-assets/mage-tower.png" alt="Mage" className="w-4 h-4" />
                    <span>🧙 Sorcerer's Rise</span>
                  </button>
                  <button
                    onClick={() => handlePoiTypeSelect('village')}
                    className="flex w-full px-4 py-2 text-left hover:bg-gray-100 items-center space-x-2"
                  >
                    <img src="/poi-assets/village.png" alt="Village" className="w-4 h-4" />
                    <span>🏘️ Village</span>
                  </button>
                  <button
                    onClick={() => handlePoiTypeSelect('other')}
                    className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    ❓ Other POI
                  </button>
                  <hr className="my-1" />
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
                {showCompleteMap ? (
                  <div className="space-y-4 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <div className="text-center space-y-3">
                      <div className="text-4xl">🗺️</div>
                      <p className="text-blue-700 font-bold text-xl">
                        地图生成完成！
                      </p>
                      <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <p className="text-blue-600 text-lg">
                          种子ID: <span className="font-bold text-2xl text-blue-800">{finalSeed?.seedId}</span>
                        </p>
                        <p className="text-blue-600 mt-2">
                          Nightlord: <span className="font-semibold">{finalSeed?.nightlord}</span> |
                          地图: <span className="font-semibold">{finalSeed?.map}</span>
                        </p>
                      </div>
                      <Button
                        onClick={resetMap}
                        variant="outline"
                        className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        🔄 重新识别种子
                      </Button>
                    </div>
                  </div>
                ) : possibleSeeds.length > 1 ? (
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
                        <p>正在生成完整地图...</p>
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
