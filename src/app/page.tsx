'use client';

import { useState } from 'react';
import { SeedRecognizer } from "@/components/SeedRecognizer";

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <SeedRecognizer />
    </main>
  );
}
