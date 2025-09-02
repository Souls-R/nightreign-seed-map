import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MAPS, POIS_BY_MAP, MAP_IMAGES } from "@/lib/seedData";
import { fileMap } from "@/lib/fileRemap";

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
  const [selectedMap, setSelectedMap] = useState<string>(MAPS[0]);
  const [selectedNightlord, setSelectedNightlord] = useState<string>('Gladius');
  const [currentPois, setCurrentPois] = useState<POI[]>([]);
  const [poiStates, setPoiStates] = useState<Record<number, POIState>>({});
  const [possibleSeeds, setPossibleSeeds] = useState<SeedInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [finalSeed, setFinalSeed] = useState<SeedInfo | null>(null);
  const [cvClassificationData, setCvClassificationData] = useState<CVClassificationData | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [showCompleteMap, setShowCompleteMap] = useState(false);
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  const [poiImages, setPoiImages] = useState<Record<string, HTMLImageElement>>({});
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenScale, setFullscreenScale] = useState(1);
  const [db, setDb] = useState<IDBDatabase | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const CANVAS_SIZE = 768;
  const ICON_SIZE = 38;

  // Nightlords list
  const NIGHTLORDS = [
    'Gladius', 'Adel', 'Gnoster', 'Maris',
    'Libra', 'Fulghor', 'Caligo', 'Heolstor'
  ];

  // Minimal i18n: display labels only (values unchanged)
  const NIGHTLORD_LABELS: Record<string, string> = {
    Gladius: '三头野兽',
    Adel: '碎身巨颚',
    Gnoster: '慧心虫',
    Maris: '征兆',
    Libra: '平衡法律的魔物',
    Fulghor: '暗中飞驰的猎人',
    Caligo: '雾中裂缝',
    Heolstor: '黑夜化形者'
  };

  // Only translate the four terrains; others remain as original
  const MAP_LABELS: Record<string, string> = {
    'Default': '无特异地形',
    Mountaintop: '山顶',
    Crater: '火山口',
    'Rotted Woods': '腐败森林',
    Noklateo: '“隐城”诺克拉缇欧'
  };

  // Initialize IndexedDB for image caching
  useEffect(() => {
    const request = indexedDB.open('ImageCache', 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images');
      }
    };
    request.onsuccess = (event) => {
      setDb((event.target as IDBOpenDBRequest).result);
      // Preload background images after DB is ready
      preloadBackgroundImages((event.target as IDBOpenDBRequest).result);
    };
    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
    };
  }, []);

  // Preload background images
  const preloadBackgroundImages = useCallback(async (db: IDBDatabase) => {
    const backgroundUrls = [
      'https://pic.nightreign-seed.help/static/background_0.png',
      'https://pic.nightreign-seed.help/static/background_1.png',
      'https://pic.nightreign-seed.help/static/background_2.png',
      'https://pic.nightreign-seed.help/static/background_3.png',
      'https://pic.nightreign-seed.help/static/background_5.png'
    ];

    const poiUrls = [
      'https://pic.nightreign-seed.help/poi-assets/church.png',
      'https://pic.nightreign-seed.help/poi-assets/mage-tower.png',
      'https://pic.nightreign-seed.help/poi-assets/village.png',
      'https://pic.nightreign-seed.help/poi-assets/Default-POI.png',
      'https://pic.nightreign-seed.help/poi-assets/Mountaintop-POI.png',
      'https://pic.nightreign-seed.help/poi-assets/Crater-POI.png',
      'https://pic.nightreign-seed.help/poi-assets/RottedWoods-POI.png',
      'https://pic.nightreign-seed.help/poi-assets/Noklateo-POI.png'
    ];

    const allUrls = [...backgroundUrls, ...poiUrls];

    console.log('🔄 Checking and preloading images...');

    for (const url of allUrls) {
      try {
        const transaction = db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.get(url);

        request.onsuccess = () => {
          if (!request.result) {
            // Image not cached, preload it
            console.log(`📥 Preloading: ${url}`);
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              // Convert to blob and store in IndexedDB
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (ctx) {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                  if (blob) {
                    const storeTransaction = db.transaction(['images'], 'readwrite');
                    const store = storeTransaction.objectStore('images');
                    store.put(blob, url);
                    console.log(`✅ Cached: ${url}`);
                  }
                });
              }
            };
            img.onerror = () => {
              console.warn(`❌ Failed to preload: ${url}`);
            };
            img.src = url;
          } else {
            console.log(`✅ Already cached: ${url}`);
          }
        };
      } catch (error) {
        console.warn(`❌ Error checking cache for: ${url}`, error);
      }
    }
  }, []);

  // Load image with IndexedDB caching
  const loadImage = useCallback(async (src: string): Promise<HTMLImageElement> => {
    if (!db) {
      // Fallback to direct load if DB not ready
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    }

    const transaction = db.transaction(['images'], 'readonly');
    const store = transaction.objectStore('images');
    const request = store.get(src);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          // Cached image found
          const blob = request.result;
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
          };
          img.onerror = reject;
          img.src = url;
        } else {
          // Not cached, load from CDN and cache it
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            // Convert to blob and store in IndexedDB
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx) {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              canvas.toBlob((blob) => {
                if (blob) {
                  const storeTransaction = db.transaction(['images'], 'readwrite');
                  const store = storeTransaction.objectStore('images');
                  store.put(blob, src);
                }
                resolve(img);
              });
            } else {
              resolve(img); // Fallback if canvas not available
            }
          };
          img.onerror = reject;
          img.src = src;
        }
      };
      request.onerror = reject;
    });
  }, [db]);

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

  // Load background image for current map
  useEffect(() => {
    if (selectedMap) {
      setBackgroundImage(null); // Clear previous background
      loadImage(MAP_IMAGES[selectedMap as keyof typeof MAP_IMAGES])
        .then(backgroundImg => {
          setBackgroundImage(backgroundImg);
        })
        .catch(error => {
          console.warn('Background image not found, using default background');
          setBackgroundImage(null);
        });
    }
  }, [selectedMap, loadImage]);

  // Load classification data on mount
  useEffect(() => {
    loadClassificationData();
    loadMapData();
    loadPoiImages();
  }, [loadClassificationData, loadMapData]);

  // Load POI images
  const loadPoiImages = useCallback(() => {
    const imageUrls = {
      church: 'https://pic.nightreign-seed.help/poi-assets/church.png',
      mage: 'https://pic.nightreign-seed.help/poi-assets/mage-tower.png',
      village: 'https://pic.nightreign-seed.help/poi-assets/village.png'
    };

    Object.entries(imageUrls).forEach(([key, url]) => {
      loadImage(url).then(img => {
        setPoiImages(prev => ({ ...prev, [key]: img }));
      }).catch(() => {
        console.warn(`Failed to load POI image: ${key}`);
      });
    });
  }, [loadImage]);

  // Initialize POI states
  const initializePoiStates = useCallback((pois: POI[]) => {
    const states: Record<number, POIState> = {};
    pois.forEach(poi => {
      states[poi.id] = 'dot';
    });
    return states;
  }, []);

  // Initialize default map and nightlord
  useEffect(() => {
    if (MAPS.length > 0) {
      const defaultMap = MAPS[0];
      const pois = POIS_BY_MAP[defaultMap as keyof typeof POIS_BY_MAP] || [];
      setCurrentPois(pois);
      setPoiStates(initializePoiStates(pois));
    }
  }, [initializePoiStates]);

  // Draw POI on canvas with proper icons
  const drawPoi = useCallback((ctx: CanvasRenderingContext2D, poi: POI, state: POIState) => {
    const { x, y } = poi;

    switch (state) {
      case 'dot':
        // Draw orange dot
        ctx.beginPath();
        ctx.arc(x, y, ICON_SIZE / 2.1, 0, 2 * Math.PI);
        ctx.fillStyle = '#ecef41';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
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

  // Optimized canvas drawing function
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw background
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    } else {
      // Fallback background
      ctx.fillStyle = '#2b2b2b';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }

    // Draw POIs
    currentPois.forEach(poi => {
      const state = poiStates[poi.id] || 'dot';
      drawPoi(ctx, poi, state);
    });
  }, [backgroundImage, currentPois, poiStates, drawPoi, CANVAS_SIZE]);

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

  // Handle canvas click (left click for church toggle or fullscreen)
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // If showCompleteMap is true, clicking anywhere toggles fullscreen
    if (showCompleteMap) {
      toggleFullscreen();
      return;
    }

    // Otherwise, handle POI marking logic (only when not in complete map mode)
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
      
      // Left click logic: non-church -> church, church -> dot
      if (currentState === 'church') {
        // If already church, reset to dot (empty)
        setPoiStates(prev => {
          const newStates = { ...prev, [poi.id]: 'dot' as POIState };
          // Use requestAnimationFrame to ensure smooth rendering
          requestAnimationFrame(() => {
            updateSeedFilteringWithStates(newStates);
          });
          return newStates;
        });
      } else {
        // If not church (dot, mage, village, other, unknown), set to church
        setPoiStates(prev => {
          const newStates = { ...prev, [poi.id]: 'church' as POIState };
          // Use requestAnimationFrame to ensure smooth rendering
          requestAnimationFrame(() => {
            updateSeedFilteringWithStates(newStates);
          });
          return newStates;
        });
      }
    }
    // Note: Removed the else clause that toggled fullscreen on empty area click
  };

  // Handle canvas right click (cycle through mage -> village -> dot)
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
      const currentState = poiStates[poi.id];
      let newState: POIState;

      // Right click cycle logic: dot/church -> mage, mage -> village, village -> dot
      if (currentState === 'mage') {
        newState = 'village';
      } else if (currentState === 'village') {
        newState = 'dot';
      } else {
        // dot, church, other, unknown -> mage
        newState = 'mage';
      }

      setPoiStates(prev => {
        const newStates = { ...prev, [poi.id]: newState };
        // Use requestAnimationFrame to ensure smooth rendering
        requestAnimationFrame(() => {
          updateSeedFilteringWithStates(newStates);
        });
        return newStates;
      });
    }
  };

  // Reset map
  const resetMap = () => {
    setPoiStates(initializePoiStates(currentPois));
    setFinalSeed(null);
    setShowCompleteMap(false);
    setIsGeneratingMap(false);
    setError('');
    setPossibleSeeds([]);
    
    // Reset canvas size and redraw
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
      canvas.style.width = '';
      canvas.style.height = '';
      
      // Use requestAnimationFrame for smooth rendering
      requestAnimationFrame(() => {
        drawCanvas();
      });
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setFullscreenScale(1); // Reset scale when toggling
  };

  // Handle wheel zoom in fullscreen
  const handleFullscreenWheel = useCallback((event: WheelEvent) => {
    if (!isFullscreen) return;
    
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    setFullscreenScale(prev => Math.max(0.1, Math.min(5, prev * delta)));
  }, [isFullscreen]);

  // Handle background click to close fullscreen
  const handleBackgroundClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // Don't close if clicking on canvas, button, or their children
    if (target.tagName === 'CANVAS' || target.closest('button') || target.closest('svg')) {
      return;
    }
    
    // Close fullscreen if clicking on the background
    toggleFullscreen();
  }, []);

  // Generate complete map
  const generateCompleteMap = useCallback(async (seedId: number) => {
    if (!mapData || !mapData.maps[seedId.toString()]) {
      setError('无法找到种子的地图数据');
      setIsGeneratingMap(false);
      return;
    }

    try {
      // Create a temporary canvas for background rendering
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        setError('无法创建临时画布');
        setIsGeneratingMap(false);
        return;
      }

      const mapInfo = mapData.maps[seedId.toString()];
      const backgroundName = `background_${mapInfo.Special}.png`;

      // Load background image
      const backgroundImg = await loadImage(`https://pic.nightreign-seed.help/static/${backgroundName}`);

      // Set canvas size to match original image
      tempCanvas.width = backgroundImg.width;
      tempCanvas.height = backgroundImg.height;

      // Draw background
      tempCtx.drawImage(backgroundImg, 0, 0);

      // Draw NightLord
      if (mapInfo.NightLord !== undefined && mapInfo.NightLord !== null) {
        try {
          const nightlordImg = await loadImage(`https://pic.nightreign-seed.help/static/nightlord_${mapInfo.NightLord}.png`);
          const previousCompositeOperation = tempCtx.globalCompositeOperation;
          tempCtx.globalCompositeOperation = 'source-over';
          tempCtx.drawImage(nightlordImg, 0, 0);
          tempCtx.globalCompositeOperation = previousCompositeOperation;
        } catch (error) {
          console.warn(`无法加载NightLord图片`);
        }
      }

      // Draw Treasure
      const treasureValue = mapInfo.Treasure_800;
      const combinedValue = treasureValue * 10 + mapInfo.Special;
      try {
        const treasureImg = await loadImage(`https://pic.nightreign-seed.help/static/treasure_${combinedValue}.png`);
        const previousCompositeOperation = tempCtx.globalCompositeOperation;
        tempCtx.globalCompositeOperation = 'source-over';
        tempCtx.drawImage(treasureImg, 0, 0);
        tempCtx.globalCompositeOperation = previousCompositeOperation;
      } catch (error) {
        console.warn(`无法加载Treasure图片`);
      }

      // Draw RotRew
      if (mapInfo.RotRew_500 !== 0) {
        try {
          const rotrewImg = await loadImage(`https://pic.nightreign-seed.help/static/RotRew_${mapInfo.RotRew_500}.png`);
          const previousCompositeOperation = tempCtx.globalCompositeOperation;
          tempCtx.globalCompositeOperation = 'source-over';
          tempCtx.drawImage(rotrewImg, 0, 0);
          tempCtx.globalCompositeOperation = previousCompositeOperation;
        } catch (error) {
          console.warn(`无法加载RotRew图片`);
        }
      }

      // Draw Start
      try {
        const startImg = await loadImage(`https://pic.nightreign-seed.help/static/Start_${mapInfo.Start_190}.png`);
        const previousCompositeOperation = tempCtx.globalCompositeOperation;
        tempCtx.globalCompositeOperation = 'source-over';
        tempCtx.drawImage(startImg, 0, 0);
        tempCtx.globalCompositeOperation = previousCompositeOperation;
      } catch (error) {
        console.warn(`无法加载Start图片`);
      }

      // Draw constructs
      if (mapData.constructs && mapData.constructs[seedId.toString()]) {
        for (const construct of mapData.constructs[seedId.toString()]) {
          try {
            let filename = `Construct_${construct.type}.png`;
            // Map to representative file if it's a duplicate
            const representativeFile = fileMap.get(filename);
            if (representativeFile) {
              filename = representativeFile;
            }

            const constructImg = await loadImage(`https://pic.nightreign-seed.help/static/${filename}`);
            const coord = mapData.coordinates[construct.coord_index.toString()];
            if (coord) {
              const [x, y] = coord;
              const drawX = x - constructImg.width / 2;
              const drawY = y - constructImg.height / 2;
              tempCtx.drawImage(constructImg, drawX, drawY);
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
          const nightCircleImg = await loadImage('https://pic.nightreign-seed.help/static/night_circle.png');
          const [x, y] = mapData.coordinates[day1Loc];
          const drawX = x - nightCircleImg.width / 2;
          const drawY = y - nightCircleImg.height / 2;
          tempCtx.drawImage(nightCircleImg, drawX, drawY);
        } catch (error) {
          console.warn('无法加载night_circle图片');
        }
      }

      if (mapData.coordinates && mapData.coordinates[day2Loc]) {
        try {
          const nightCircleImg = await loadImage('https://pic.nightreign-seed.help/static/night_circle.png');
          const [x, y] = mapData.coordinates[day2Loc];
          const drawX = x - nightCircleImg.width / 2;
          const drawY = y - nightCircleImg.height / 2;
          tempCtx.drawImage(nightCircleImg, drawX, drawY);
        } catch (error) {
          console.warn('无法加载night_circle图片');
        }
      }

      // Draw Night Circle text labels
      if (mapData.coordinates && mapData.coordinates[day1Loc]) {
        const [x, y] = mapData.coordinates[day1Loc];
        if (mapData.names && mapData.names[mapInfo.Day1Boss.toString()]) {
          const text = "DAY1 " + mapData.names[mapInfo.Day1Boss.toString()];
          tempCtx.fillStyle = '#781EF0';
          tempCtx.font = '95px Arial';
          tempCtx.textAlign = 'center';
          tempCtx.textBaseline = 'middle';

          // Add text shadow
          tempCtx.fillStyle = 'white';
          tempCtx.fillText(text, x-3, y-3);
          tempCtx.fillText(text, x-1, y-1);
          // tempCtx.fillStyle = 'black';
          // tempCtx.fillText(text, x+1, y+1);
          // tempCtx.fillText(text, x+3, y+3);
          // tempCtx.fillText(text, x+5, y+5);
          // tempCtx.fillText(text, x+7, y+7);

          tempCtx.fillStyle = '#781EF0';
          tempCtx.fillText(text, x, y);
        }

        if (mapInfo.extra1 !== -1 && mapData.names && mapData.names[mapInfo.extra1.toString()]) {
          const extraText = mapData.names[mapInfo.extra1.toString()];
          tempCtx.fillStyle = '#781EF0';
          tempCtx.font = '95px Arial';
          tempCtx.textAlign = 'center';
          tempCtx.textBaseline = 'middle';

          tempCtx.fillStyle = 'white';
          tempCtx.fillText(extraText, x-3, y+100);
          tempCtx.fillText(extraText, x-1, y+100);
          // tempCtx.fillStyle = 'black';
          // tempCtx.fillText(extraText, x+1, y+100);
          // tempCtx.fillText(extraText, x+3, y+100);
          // tempCtx.fillText(extraText, x+5, y+100);
          // tempCtx.fillText(extraText, x+7, y+100);

          tempCtx.fillStyle = '#781EF0';
          tempCtx.fillText(extraText, x, y+100);
        }
      }

      if (mapData.coordinates && mapData.coordinates[day2Loc]) {
        const [x, y] = mapData.coordinates[day2Loc];
        if (mapData.names && mapData.names[mapInfo.Day2Boss.toString()]) {
          const text = "DAY2 " + mapData.names[mapInfo.Day2Boss.toString()];
          tempCtx.fillStyle = '#781EF0';
          tempCtx.font = '95px Arial';
          tempCtx.textAlign = 'center';
          tempCtx.textBaseline = 'middle';

          tempCtx.fillStyle = 'white';
          tempCtx.fillText(text, x-3, y-3);
          tempCtx.fillText(text, x-1, y-1);
          // tempCtx.fillStyle = 'black';
          // tempCtx.fillText(text, x+1, y+1);
          // tempCtx.fillText(text, x+3, y+3);
          // tempCtx.fillText(text, x+5, y+5);
          // tempCtx.fillText(text, x+7, y+7);

          tempCtx.fillStyle = '#781EF0';
          tempCtx.fillText(text, x, y);
        }

        if (mapInfo.extra2 !== -1 && mapData.names && mapData.names[mapInfo.extra2.toString()]) {
          const extraText = mapData.names[mapInfo.extra2.toString()];
          tempCtx.fillStyle = '#781EF0';
          tempCtx.font = '95px Arial';
          tempCtx.textAlign = 'center';
          tempCtx.textBaseline = 'middle';

          tempCtx.fillStyle = 'white';
          tempCtx.fillText(extraText, x-3, y+100);
          tempCtx.fillText(extraText, x-1, y+100);
          // tempCtx.fillStyle = 'black';
          // tempCtx.fillText(extraText, x+1, y+100);
          // tempCtx.fillText(extraText, x+3, y+100);
          // tempCtx.fillText(extraText, x+5, y+100);
          // tempCtx.fillText(extraText, x+7, y+100);

          tempCtx.fillStyle = '#781EF0';
          tempCtx.fillText(extraText, x, y+100);
        }
      }

      // Draw construct text labels
      if (mapData.constructs && mapData.constructs[seedId.toString()]) {
        for (const construct of mapData.constructs[seedId.toString()]) {
          if (
        mapData.coordinates &&
        mapData.coordinates[construct.coord_index.toString()] &&
        mapData.names &&
        mapData.names[construct.type.toString()]
          ) {
        let [x, y] = mapData.coordinates[construct.coord_index.toString()];
        const text = mapData.names[construct.type.toString()];
        // Move label down by 60px to avoid overlapping the icon
        const labelYOffset = 60;

        // If label is around (2270, 2560), shift right by 100px
        if (
          Math.abs(x - 2270) < 30 &&
          Math.abs(y - 2560) < 30
        ) {
          x += 100;
        }

        tempCtx.fillStyle = '#f9f9f9';
        tempCtx.font = '70px Arial';
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        // Draw a larger, centered shadow for the construct text
        tempCtx.save();
        tempCtx.font = '90px Arial'; // Larger font for shadow
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillStyle = '#4d4a2b';
        // Draw shadow at center (no offset)
        tempCtx.fillText(text, x, y + labelYOffset);
        tempCtx.restore();

        tempCtx.fillStyle = '#f9f9f9';
        tempCtx.fillText(text, x, y + labelYOffset);
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

        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.font = '160px Arial';
        tempCtx.textAlign = 'left';
        tempCtx.textBaseline = 'top';

        tempCtx.fillStyle = '#730FE6';
        tempCtx.fillText(eventText, eventX+15, eventY+15);

        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillText(eventText, eventX, eventY);
      }

      // After all drawing is complete, transfer to the main canvas
      const canvas = canvasRef.current;
      if (!canvas) {
        setIsGeneratingMap(false);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsGeneratingMap(false);
        return;
      }

      // Set main canvas size and copy the complete map
      canvas.width = tempCanvas.width;
      canvas.height = tempCanvas.height;
      ctx.drawImage(tempCanvas, 0, 0);

      // Scale canvas to 1/5 size for display
      const scale = 0.162;
      const scaledWidth = canvas.width * scale;
      const scaledHeight = canvas.height * scale;
      canvas.style.width = scaledWidth + 'px';
      canvas.style.height = scaledHeight + 'px';

      setShowCompleteMap(true);
      setIsGeneratingMap(false);
    } catch (error) {
      console.error('生成完整地图失败:', error);
      setError('生成完整地图失败: ' + (error as Error).message);
      setIsGeneratingMap(false);
    }
  }, [mapData, loadImage]);

  // Update seed filtering with specific states (used for immediate filtering after state changes)
  const updateSeedFilteringWithStates = useCallback((states: Record<number, POIState>) => {
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
        const userState = states[poi.id];

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
      setIsGeneratingMap(true);

      // Generate complete map immediately in background
      generateCompleteMap(finalSeedData.seedNumber);
      
      // Call the callback if provided
      if (onSeedRecognized) {
        onSeedRecognized(finalSeedData.seedNumber);
      }
    } else {
      setFinalSeed(null);
      setShowCompleteMap(false);
      setIsGeneratingMap(false);
    }
  }, [selectedNightlord, selectedMap, currentPois, cvClassificationData, generateCompleteMap, onSeedRecognized]);

  // Update seed filtering
  const updateSeedFiltering = useCallback(() => {
    updateSeedFilteringWithStates(poiStates);
  }, [updateSeedFilteringWithStates, poiStates]);

  // Draw canvas when background image loads or when component mounts
  useEffect(() => {
    if (selectedMap && currentPois.length > 0 && !finalSeed && !showCompleteMap) {
      drawCanvas();
    }
  }, [selectedMap, currentPois, finalSeed, showCompleteMap, backgroundImage, drawCanvas]);

  // Redraw canvas when POI states change (but avoid flicker by using optimized rendering)
  useEffect(() => {
    if (!finalSeed && !showCompleteMap && backgroundImage) {
      // Use requestAnimationFrame for smooth rendering
      requestAnimationFrame(() => {
        drawCanvas();
      });
    }
  }, [poiStates, finalSeed, showCompleteMap, backgroundImage, drawCanvas]);

  // Handle fullscreen events
  useEffect(() => {
    if (isFullscreen) {
      document.addEventListener('wheel', handleFullscreenWheel, { passive: false });
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('wheel', handleFullscreenWheel);
      
      // Restore body scroll
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('wheel', handleFullscreenWheel);
      document.body.style.overflow = '';
    };
  }, [isFullscreen, handleFullscreenWheel]);

  return (
    <div className="p-2 md:p-3 lg:p-4">
      {/* Two-column layout: controls (left) and canvas (right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left: Control Panel */}
        <div className="xl:col-span-4 space-y-6">
          <Card className="border-yellow-900/40 bg-[#0f0e0c]/70 shadow-[0_0_24px_rgba(234,179,8,0.05)]">
            <CardHeader>
              <CardTitle className="text-amber-200 tracking-wide font-semibold">
                选择夜王
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
        {NIGHTLORDS.map((nightlord) => (
                  <Button
                    key={nightlord}
                    onClick={() => handleNightlordSelect(nightlord)}
                    variant="ghost"
                    className={selectedNightlord === nightlord ? "rounded-md bg-gradient-to-b from-amber-300 to-yellow-500 text-black px-4 py-2 text-sm font-semibold shadow-[0_0_20px_rgba(234,179,8,0.25)] hover:from-amber-200 hover:to-yellow-400 transition-colors" : "rounded-md border border-yellow-800/50 bg-[#0f0e0c]/70 text-amber-200 px-4 py-2 text-sm font-medium hover:bg-yellow-900/20 hover:border-yellow-700/70 hover:text-amber-300 transition-colors"}
                  >
          {NIGHTLORD_LABELS[nightlord] ?? nightlord}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-900/40 bg-[#0f0e0c]/70 shadow-[0_0_24px_rgba(234,179,8,0.05)]">
            <CardHeader>
              <CardTitle className="text-amber-200 tracking-wide font-semibold">
                选择地图类型
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
        {MAPS.map((map) => (
                  <Button
                    key={map}
                    onClick={() => handleMapSelect(map)}
                    variant="ghost"
                    className={selectedMap === map ? "rounded-md bg-gradient-to-b from-amber-300 to-yellow-500 text-black px-4 py-2 text-sm font-semibold shadow-[0_0_20px_rgba(234,179,8,0.25)] hover:from-amber-200 hover:to-yellow-400 transition-colors" : "rounded-md border border-yellow-800/50 bg-[#0f0e0c]/70 text-amber-200 px-4 py-2 text-sm font-medium hover:bg-yellow-900/20 hover:border-yellow-700/70 hover:text-amber-300 transition-colors"}
                  >
          {MAP_LABELS[map] ?? map}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedMap && selectedNightlord && (
            <Card className="border-yellow-900/40 bg-[#0f0e0c]/70 shadow-[0_0_24px_rgba(234,179,8,0.05)]">
              <CardHeader>
                <CardTitle className="text-amber-200 tracking-wide font-semibold">使用说明</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-amber-100/80 space-y-4">
                <div className="flex items-center gap-3">
                  <span>对比游戏地图，在右侧的相应位置标注一些建筑以识别种子</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-block w-3 h-3 rounded-full bg-[#ecef41]"></span>
                  <span>左键：标记教堂，再次点击取消</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-block w-3 h-3 rounded-full bg-purple-500"></span>
                  <span>右键：在法师塔 / 村庄 / 未知之间循环</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button onClick={resetMap} variant="outline" size="sm" className="rounded-md border border-yellow-800/50 bg-[#0f0e0c]/70 text-amber-200 px-4 py-2 text-sm font-medium hover:bg-yellow-900/20 hover:border-yellow-700/70 hover:text-amber-300 transition-colors">重置地图</Button>
                  <div className="text-xs text-amber-200/80 text-right space-y-1">
                    {loading && (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-300"></div>
                        <span>生成中...</span>
                      </div>
                    )}
                    {error && <p className="text-red-400">{error}</p>}
                    {!loading && !error && (
                      <>
                      {showCompleteMap ? (
                        <div className="text-lg">✅ 种子ID: <span className="font-bold text-amber-300 text-xl">{finalSeed?.seedId}</span></div>
                      ) : possibleSeeds.length > 1 ? (
                        <div className="text-lg">🔍 匹配种子: <span className="font-bold text-amber-300 text-xl">{possibleSeeds.length}</span></div>
                      ) : possibleSeeds.length === 1 ? (
                        <div className="space-y-1 text-lg">
                        <div>识别成功！种子ID: <span className="font-bold text-amber-300 text-xl">{possibleSeeds[0].seedId}</span></div>
                        {isGeneratingMap && (
                          <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-300"></div>
                          <span className="text-base">首次生成地图下载素材较慢请耐心等待..</span>
                          </div>
                        )}
                        </div>
                      ) : (
                        <div className="text-lg">未发现任何种子，已标记: <span className="font-bold text-amber-300 text-xl">{Object.values(poiStates).filter(state => state !== 'dot').length}</span> 个建筑地点</div>
                      )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Map Canvas */}
        <div className="xl:col-span-8">
          <Card className="border-yellow-900/40 bg-[#0f0e0c]/70 shadow-[0_0_24px_rgba(234,179,8,0.05)] py-2">
            <CardContent className="pt-0">
              <div className="flex justify-center relative">
                <div className="relative rounded-lg border border-yellow-900/30 bg-black/40 overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_SIZE}
                    height={CANVAS_SIZE}
                    onClick={handleCanvasClick}
                    onContextMenu={showCompleteMap ? undefined : handleCanvasContextMenu}
                    className={`${showCompleteMap ? 'cursor-pointer' : 'cursor-crosshair'} block`}
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                  {/* Fullscreen button */}
                  <Button
                    onClick={toggleFullscreen}
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 rounded-md bg-black/50 text-amber-200 hover:bg-black/70 hover:text-amber-300 transition-colors p-2"
                    title="全屏查看"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                    </svg>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8 cursor-pointer"
          onClick={handleBackgroundClick}
        >
          <div className="relative w-full h-full max-w-[calc(100vw-4rem)] max-h-[calc(100vh-4rem)]">
            <div className="relative w-full h-full rounded-lg border border-yellow-900/30 bg-black/40 overflow-hidden flex items-center justify-center">
              <canvas
                ref={(el) => {
                  if (el && canvasRef.current) {
                    const ctx = el.getContext('2d');
                    const sourceCtx = canvasRef.current.getContext('2d');
                    if (ctx && sourceCtx) {
                      el.width = canvasRef.current.width;
                      el.height = canvasRef.current.height;
                      ctx.drawImage(canvasRef.current, 0, 0);
                    }
                  }
                }}
                className="max-w-full max-h-full block transition-transform duration-100"
                style={{
                  width: 'auto',
                  height: '100%',
                  objectFit: 'contain',
                  transform: `scale(${fullscreenScale})`,
                  transformOrigin: 'center center',
                  cursor: 'zoom-in'
                }}
                onClick={(e) => e.stopPropagation()}
              />
              {/* Close button */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 rounded-md bg-black/50 text-amber-200 hover:bg-black/70 hover:text-amber-300 transition-colors p-3"
                title="关闭全屏"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
