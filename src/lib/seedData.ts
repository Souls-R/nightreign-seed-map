const CDN_BASE_URL = 'https://pic.nightreign-seed.help';

// Point of Interest data for each map
const POIS_BY_MAP = {
  Default: [
    { id: 1, x: 155, y: 551 },
    { id: 2, x: 350, y: 545 },
    { id: 3, x: 155, y: 436 },
    { id: 4, x: 280, y: 308 },
    { id: 5, x: 165, y: 284 },
    { id: 6, x: 436, y: 620 },
    { id: 7, x: 420, y: 495 },
    { id: 8, x: 620, y: 455 },
    { id: 9, x: 530, y: 285 },
    { id: 10, x: 595, y: 278 },
    { id: 11, x: 410, y: 180 }
  ],

  Crater: [
    { id: 1, x: 155, y: 551 },
    { id: 2, x: 348, y: 545 },
    { id: 3, x: 155, y: 440 },
    { id: 5, x: 165, y: 284 },
    { id: 6, x: 436, y: 630 },
    { id: 7, x: 420, y: 495 },
    { id: 8, x: 620, y: 455 },
    { id: 9, x: 530, y: 295 },
    { id: 10, x: 595, y: 278 }
  ],

  "Rotted Woods": [
    { id: 1, x: 153, y: 557 },
    { id: 2, x: 350, y: 545 },
    { id: 3, x: 155, y: 442 },
    { id: 4, x: 275, y: 315 },
    { id: 5, x: 165, y: 284 },
    { id: 9, x: 530, y: 285 },
    { id: 10, x: 597, y: 285 },
    { id: 11, x: 410, y: 180 }
  ],

  Mountaintop: [
    { id: 1, x: 155, y: 551 },
    { id: 2, x: 345, y: 547 },
    { id: 3, x: 155, y: 440 },
    { id: 6, x: 436, y: 620 },
    { id: 7, x: 420, y: 495 },
    { id: 8, x: 620, y: 460 },
    { id: 9, x: 530, y: 285 },
    { id: 10, x: 595, y: 278 },
    { id: 11, x: 410, y: 180 }
  ],

  Noklateo: [
    { id: 4, x: 278, y: 308 },
    { id: 5, x: 165, y: 284 },
    { id: 6, x: 436, y: 620 },
    { id: 7, x: 420, y: 495 },
    { id: 8, x: 620, y: 455 },
    { id: 9, x: 530, y: 287 },
    { id: 10, x: 595, y: 278 },
    { id: 11, x: 410, y: 182 }
  ]
};


// Map background images (CDN paths)
const MAP_IMAGES = {
  Default: `${CDN_BASE_URL}/poi-assets/Default-POI.png`,
  Mountaintop: `${CDN_BASE_URL}/poi-assets/Mountaintop-POI.png`,
  Crater: `${CDN_BASE_URL}/poi-assets/Crater-POI.png`,
  Noklateo: `${CDN_BASE_URL}/poi-assets/Noklateo-POI.png`,
  "Rotted Woods": `${CDN_BASE_URL}/poi-assets/RottedWoods-POI.png`
};

// Constants
const ICON_SIZE = 38;
const CANVAS_SIZE = 768;

// Available Nightlords
const NIGHTLORDS = [
  'Gladius', 'Adel', 'Gnoster', 'Maris', 
  'Libra', 'Fulghor', 'Caligo', 'Heolstor'
];

// Available Maps
const MAPS = [
  'Default', 'Mountaintop', 'Crater', 'Rotted Woods', 'Noklateo'
];

export { POIS_BY_MAP, MAP_IMAGES, ICON_SIZE, CANVAS_SIZE, NIGHTLORDS, MAPS };

// Create seed data matrix from dataset.json structure
// This will be populated when dataset.json is loaded
export let seedDataMatrix: any[] = [];
