'use client';
import { SeedRecognizer } from "@/components/SeedRecognizer";

export default function Page() {
  return (
    <main className="min-h-screen text-foreground relative overflow-hidden bg-[#0b0a08]">
      {/* Background: subtle vignette + noise */}
      <div className="pointer-events-none absolute inset-0 opacity-70" style={{
        background:
          "radial-gradient(1200px 600px at 20% -10%, rgba(234,179,8,0.08), transparent 60%)," +
          "radial-gradient(1000px 600px at 120% 10%, rgba(234,179,8,0.06), transparent 55%)," +
          "radial-gradient(900px 500px at 50% 120%, rgba(234,179,8,0.05), transparent 60%)"
      }} />

      {/* Top bar / hero */}
      <section className="relative py-1 md:py-2">
        <div className="container mx-auto px-4 py-1 md:py-2">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="max-w-3xl">
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight flex flex-wrap items-center gap-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-200 drop-shadow-[0_0_8px_rgba(234,179,8,0.25)] max-sm:text-3xl">
                  艾尔登法环：黑夜君临
                </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-200 via-white to-slate-300 xl:pl-8 max-sm:text-3xl drop-shadow-[0_0_8px_rgba(220,220,220,0.18)]">
                  地图种子识别
                </span>
              </h1>
              <div className="text-xs text-muted-foreground mt-2 space-y-1">
            <p>
              艾尔登法环：黑夜君临实际上只有预制的320张地图，8个夜王每个夜王40张，按地形分配为20+5+5+5+5。
            </p>
            <p>
              所以你可以在游戏一开始即可通过特定位置的教堂等地标识别种子，并获得地图的以下信息：缩圈位置， 每晚boss的信息， 野外boss的信息，封印监牢的信息， 主城类型（失乡，熔炉，山妖）等。
            </p>

          </div>
            </div>
            <div className="flex items-center gap-3">

              <a
                href="https://github.com/Souls-R/nightreign-seed-map"
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-gradient-to-b from-amber-300 to-yellow-500 text-black px-3 py-1.5 text-xs font-semibold shadow-[0_0_20px_rgba(234,179,8,0.25)] hover:from-amber-200 hover:to-yellow-400 transition-colors"
              >
                Github仓库
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="relative py-1 md:py-2">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl border border-yellow-900/30 bg-[#0d0c0a]/50 shadow-[0_0_40px_rgba(234,179,8,0.07)]">
            <SeedRecognizer />
          </div>
        </div>
      </section>
    </main>
  );
}
