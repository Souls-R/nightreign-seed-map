'use client';

import { useState } from 'react';
import { MapGenerator } from "@/components/MapGenerator";
import { SeedRecognizer } from "@/components/SeedRecognizer";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'generator' | 'recognizer'>('generator');

  return (
    <main className="min-h-screen bg-background">
      {/* 标签页切换 */}
      <div className="container mx-auto py-4 px-4">
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              onClick={() => setActiveTab('generator')}
              variant={activeTab === 'generator' ? 'default' : 'ghost'}
              className="px-6"
            >
              地图生成器
            </Button>
            <Button
              onClick={() => setActiveTab('recognizer')}
              variant={activeTab === 'recognizer' ? 'default' : 'ghost'}
              className="px-6"
            >
              种子识别器
            </Button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      {activeTab === 'generator' && <MapGenerator />}
      {activeTab === 'recognizer' && <SeedRecognizer />}
    </main>
  );
}
