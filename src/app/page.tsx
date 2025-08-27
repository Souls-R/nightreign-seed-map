'use client';

import { useState } from 'react';
import { SeedRecognizer } from "@/components/SeedRecognizer";
import { MapGenerator } from "@/components/MapGenerator";

export default function Home() {
  const [recognizedSeedId, setRecognizedSeedId] = useState<number | null>(null);
  const [showMapGenerator, setShowMapGenerator] = useState(false);

  const handleSeedRecognized = (seedId: number) => {
    setRecognizedSeedId(seedId);
    // 不再自动跳转到MapGenerator，让SeedRecognizer内部处理
    // setShowMapGenerator(true);
  };

  const handleBackToRecognizer = () => {
    setShowMapGenerator(false);
    setRecognizedSeedId(null);
  };

  return (
    <main className="min-h-screen bg-background">
      {!showMapGenerator ? (
        <SeedRecognizer onSeedRecognized={handleSeedRecognized} />
      ) : (
        <div>
          <div className="container mx-auto py-4">
            <button
              onClick={handleBackToRecognizer}
              className="mb-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              ← 返回种子识别器
            </button>
          </div>
          <MapGenerator initialSeedId={recognizedSeedId?.toString()} />
        </div>
      )}
    </main>
  );
}
