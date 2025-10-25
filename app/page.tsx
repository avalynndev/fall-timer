'use client';

import { useState, useEffect } from 'react';
import { Maximize, Settings, FileText, Clock, Headphones } from 'lucide-react';
import { Notepad } from '@/components/notepad';
import { Timer } from '@/components/timer';
import AmbientSoundsWindow from '@/components/ambient-sound';
import { Settings as SettingsWindow } from '@/components/settings';
import NextImage from "next/image";

const motivationalQuotes = [
  "The secret of getting ahead is getting started.",
  "Focus on being productive instead of busy.",
  "Your limitation—it's only your imagination.",
  "Great things never come from comfort zones.",
  "Don't stop when you're tired. Stop when you're done.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "The key is to keep company only with people who uplift you.",
  "Start where you are. Use what you have. Do what you can."
];

export default function IdeaPage() {
  const [showNotepad, setShowNotepad] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  const [background, setBackground] = useState("bg.webp");
  const [customBg, setCustomBg] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAmbientSounds, setShowAmbientSounds] = useState(false);
  const [currentQuote, setCurrentQuote] = useState("");
  const [zOrder, setZOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setCurrentQuote(randomQuote);
  }, []);

  useEffect(() => {
    const storedBg = localStorage.getItem("customBackground");
    if (storedBg) setCustomBg(storedBg);

    const img = new Image();
    img.src = storedBg || `/${background}`;
    img.onload = () => setLoading(false);
  }, [background]);

  const bringToFront = (windowName: string) => {
    setZOrder((prev) => {
      const newOrder = prev.filter((w) => w !== windowName);
      newOrder.push(windowName);
      return newOrder;
    });
  };

  const getZIndexClass = (windowName: string) => {
    const index = zOrder.indexOf(windowName);
    const classes = ["z-40", "z-50", "z-60", "z-70", "z-80", "z-90", "z-100"];
    return classes[index] || "z-40";
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <>
      <div className="block lg:hidden relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-red-500 to-yellow-300" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Timer isOpen={true} onClose={() => { }} className="z-10" />
        </div>
      </div>

      <div className="hidden lg:block min-h-screen relative overflow-hidden">
        {customBg ? (
          <NextImage
            src={customBg}
            alt="Custom Background"
            fill
            className="object-cover transition-opacity duration-700"
            priority
          />
        ) : (
          <NextImage
            src={`/${background}`}
            alt="Background"
            fill
            className="object-cover transition-opacity duration-700"
            priority
          />
        )}

        {loading && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-white z-[9999]">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
            <p className="text-sm tracking-widest uppercase">Loading...</p>
          </div>
        )}

        {!loading && (
          <div className="absolute inset-0 flex items-center justify-center text-center px-6 sm:px-12 pointer-events-none">
            <p className="text-white font-semibold leading-tight drop-shadow-lg 
              text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl max-w-4xl">
              “{currentQuote}”
            </p>
          </div>
        )}

        <div className="absolute bottom-6 left-6 z-10">
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowAmbientSounds(true);
                bringToFront("ambient");
              }}
              className="w-12 h-12 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/30 transition-colors"
              title="Ambient Sounds"
            >
              <Headphones size={20} />
            </button>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 z-10">
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowTimer(true);
                bringToFront("timer");
              }}
              className="w-12 h-12 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/30 transition-colors"
              title="Timer"
            >
              <Clock size={20} />
            </button>
            <button
              onClick={() => {
                setShowNotepad(true);
                bringToFront("notepad");
              }}
              className="w-12 h-12 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/30 transition-colors"
              title="Notepad"
            >
              <FileText size={20} />
            </button>
            <button
              onClick={() => {
                setShowSettings(true);
                bringToFront("settings");
              }}
              className="w-12 h-12 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/30 transition-colors"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-12 h-12 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/30 transition-colors"
              title="Fullscreen"
            >
              <Maximize size={20} />
            </button>
          </div>
        </div>

        <AmbientSoundsWindow
          isOpen={showAmbientSounds}
          onClose={() => setShowAmbientSounds(false)}
          className={getZIndexClass("ambient")}
          onClick={() => bringToFront("ambient")}
        />

        <Notepad
          isOpen={showNotepad}
          onClose={() => setShowNotepad(false)}
          className={getZIndexClass("notepad")}
          onClick={() => bringToFront("notepad")}
        />

        <Timer
          isOpen={showTimer}
          onClose={() => setShowTimer(false)}
          className={getZIndexClass("timer")}
          onClick={() => bringToFront("timer")}
        />

        <SettingsWindow
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          background={background}
          setBackground={setBackground}
          setCustomBg={setCustomBg}
          className={getZIndexClass("settings")}
          onClick={() => bringToFront("settings")}
        />
      </div>
    </>
  );
}
