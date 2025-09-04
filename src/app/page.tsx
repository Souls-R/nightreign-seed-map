"use client";
import { SeedRecognizer } from "@/components/SeedRecognizer";
import { useLocale } from "@/lib/useLocale";
import { t, locales } from "@/lib/i18n";
import { useEffect } from "react";

export default function Page() {
  const { locale, setLocale } = useLocale('zh');
  // 自动检测浏览器语言
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lang = window.navigator.language;
      if (lang.startsWith('zh')) setLocale('zh');
      else if (lang.startsWith('en')) setLocale('en');
    }
  }, [setLocale]);
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
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight flex flex-wrap xl:flex-nowrap xl:whitespace-nowrap items-center gap-2 pb-1">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-200 drop-shadow-[0_0_8px_rgba(234,179,8,0.25)] max-sm:text-3xl pb-1">
                  {t(locale, 'title')}
                </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-200 via-white to-slate-300 xl:pl-8 max-sm:text-3xl drop-shadow-[0_0_8px_rgba(220,220,220,0.18)] pb-1">
                  {t(locale, 'subtitle')}
                </span>
              </h1>
              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                <p className="md:whitespace-nowrap">{t(locale, 'desc1')}</p>
                <p className="md:whitespace-nowrap">{t(locale, 'desc2')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/Souls-R/nightreign-seed-map"
                target="_blank"
                rel="noreferrer"
                className="h-8 flex items-center rounded-md bg-gradient-to-b from-amber-300 to-yellow-500 text-black px-3 py-1.5 text-xs font-semibold shadow-[0_0_20px_rgba(234,179,8,0.25)] hover:from-amber-200 hover:to-yellow-400 transition-colors"
              >
                {t(locale, 'github')}
              </a>
              <div className="relative group">
                <button
                  type="button"
                  className="h-8 flex items-center gap-2 rounded-md bg-gradient-to-b from-amber-300 to-yellow-500 text-black px-3 py-1.5 text-xs font-semibold shadow-[0_0_20px_rgba(234,179,8,0.18)] hover:from-amber-200 hover:to-yellow-400 focus:outline-none focus:ring-2 focus:ring-amber-300/40 transition-all duration-200"
                  onClick={e => {
                    const menu = document.getElementById('lang-menu');
                    if (menu) {
                      if (menu.classList.contains('opacity-0')) {
                        menu.classList.remove('opacity-0', 'invisible');
                        menu.classList.add('opacity-100', 'visible');
                      } else {
                        menu.classList.remove('opacity-100', 'visible');
                        menu.classList.add('opacity-0', 'invisible');
                      }
                    }
                  }}
                  aria-label="Language"
                >
                  <svg className="icon align-middle" viewBox="0 0 1024 1024" width="1em" height="1em" style={{fontSize: '1em', verticalAlign: 'middle'}} version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4696"><path d="M540.245333 645.888L426.410667 522.069333l1.365333-1.536a889.770667 889.770667 0 0 0 166.314667-322.048h131.413333V99.669333H411.562667V1.109333h-89.6v98.645334H7.850667v98.730666h500.906666a797.696 797.696 0 0 1-142.165333 263.936 778.581333 778.581333 0 0 1-103.594667-165.290666h-89.6c33.621333 82.176 78.677333 158.037333 133.546667 224.938666L78.848 769.706667l63.658667 69.973333 224.170666-246.613333 139.52 153.429333 34.133334-100.608z m252.501334-250.026667H703.061333l-201.813333 591.872h89.685333l50.261334-147.968h212.992l50.688 147.968h89.685333L792.746667 395.776zM675.242667 741.034667l72.618666-213.674667 72.704 213.674667H675.242667z" fill="#000000" p-id="4697"></path></svg>
                </button>
                <div id="lang-menu" className="opacity-0 invisible absolute z-10 right-0 mt-2 w-24 rounded-md shadow-lg bg-white ring-1 ring-yellow-300/30 focus:outline-none transition-opacity duration-200">
                  {locales.map(l => (
                    <button
                      key={l}
                      onClick={() => {
                        setLocale(l);
                        const menu = document.getElementById('lang-menu');
                        if (menu) {
                          menu.classList.remove('opacity-100', 'visible');
                          menu.classList.add('opacity-0', 'invisible');
                        }
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm font-semibold rounded-md transition-all duration-150 ${locale === l ? 'bg-yellow-300 text-black' : 'text-black hover:bg-yellow-100 hover:text-yellow-700'}`}
                    >
                      {l === 'zh' ? '中文' : 'English'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="relative py-1 md:py-2">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl border border-yellow-900/30 bg-[#0d0c0a]/50 shadow-[0_0_40px_rgba(234,179,8,0.07)]">
            {/* 强制重新渲染SeedRecognizer以响应locale变化 */}
            <SeedRecognizer key={locale} locale={locale} />
          </div>
        </div>
      </section>
    </main>
  );
}
