"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  X,
  Minus,
  Timer as TimerIcon,
  Volume2,
} from "lucide-react";
import { motion } from "motion/react";

interface TimerProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  onClick?: () => void;
}

type TimerMode = "pomodoro" | "shortBreak" | "longBreak";

interface TimerSettings {
  pomodoro: number;
  shortBreak: number;
  longBreak: number;
  volume: number;
}

const DEFAULT_SETTINGS: TimerSettings = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
  volume: 50,
};

function Timer({ isOpen, onClose, className, onClick }: TimerProps) {
  const [settings, setSettings] = React.useState<TimerSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("timer-settings");
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    }
    return DEFAULT_SETTINGS;
  });

  const [mode, setMode] = React.useState<TimerMode>("pomodoro");
  const [timeLeft, setTimeLeft] = React.useState(settings.pomodoro);
  const [isRunning, setIsRunning] = React.useState(false);
  const [completedPomodoros, setCompletedPomodoros] = React.useState(0);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });

  const windowRef = React.useRef<HTMLDivElement>(null);
  const alarmRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("timer-settings", JSON.stringify(settings));
    }
  }, [settings]);

  React.useEffect(() => {
    if (!isRunning) return;

    let animationFrameId: number;
    let lastUpdateTime = Date.now();

    const updateTimer = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateTime;

      if (deltaTime >= 1000) {
        const secondsToSubtract = Math.floor(deltaTime / 1000);

        setTimeLeft((prevTimeLeft) => {
          const newTimeLeft = Math.max(0, prevTimeLeft - secondsToSubtract);

          if (newTimeLeft <= 0 && prevTimeLeft > 0) {
            if (alarmRef.current) {
              alarmRef.current.play().catch(console.error);
            }

            if (mode === "pomodoro") {
              setCompletedPomodoros((count) => count + 1);
              const nextMode =
                completedPomodoros % 4 === 3 ? "longBreak" : "shortBreak";
              setMode(nextMode);
              setTimeLeft(settings[nextMode]);
            } else {
              setMode("pomodoro");
              setTimeLeft(settings.pomodoro);
            }

            setIsRunning(false);
            return 0;
          }

          return newTimeLeft;
        });

        lastUpdateTime = now - (deltaTime % 1000);
      }

      if (isRunning) {
        animationFrameId = requestAnimationFrame(updateTimer);
      }
    };

    animationFrameId = requestAnimationFrame(updateTimer);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRunning, mode, settings, completedPomodoros]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio("/sounds/alarm.mp3");
      audio.volume = settings.volume / 100;
      alarmRef.current = audio;
    }
  }, [settings.volume]);

  const formatTime = (seconds: number) => {
    const mm = Math.floor(seconds / 60);
    const ss = seconds % 60;
    return `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
  };

  const progress = React.useMemo(() => {
    const total = settings[mode];
    return ((total - timeLeft) / total) * 100;
  }, [timeLeft, settings, mode]);

  const handleStartTimer = () => setIsRunning(true);
  const handlePauseTimer = () => setIsRunning(false);
  const handleStopTimer = () => {
    setIsRunning(false);
    setTimeLeft(settings[mode]);
  };
  const handleResetTimer = () => {
    setIsRunning(false);
    setTimeLeft(settings[mode]);
  };

  const handleSwitchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(settings[newMode]);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    },
    [isDragging, dragOffset],
  );

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClick}
      ref={windowRef}
      className={cn(
        "fixed bg-background border border-border shadow-2xl rounded-lg overflow-hidden transition-all z-5 w-[400px] h-[500px]",
        isMinimized && "h-12",
        isDragging && "cursor-move",
        className,
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2 bg-accent border-b border-border cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <TimerIcon size={16} />
          <h2 className="text-sm font-semibold">Pomodoro Timer</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-background rounded transition-colors"
            title="Minimize"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-destructive hover:text-destructive-foreground rounded transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-col items-center gap-6 p-6 h-[calc(100%-40px)] overflow-y-auto">
          <div className="flex gap-2 flex-wrap justify-center">
            {(["pomodoro", "shortBreak", "longBreak"] as const).map(
              (timerMode) => (
                <button
                  key={timerMode}
                  onClick={() => handleSwitchMode(timerMode)}
                  className={cn(
                    "px-4 py-2 rounded-lg capitalize transition-colors text-sm",
                    mode === timerMode
                      ? "bg-primary text-primary-foreground font-medium"
                      : "bg-accent hover:bg-accent/80",
                  )}
                >
                  {timerMode.replace(/([A-Z])/g, " $1").trim()}
                </button>
              ),
            )}
          </div>

          <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-4 border-border">
            <motion.div
              className="absolute inset-1 rounded-full bg-primary/20"
              style={{
                scaleX: progress / 100,
                scaleY: progress / 100,
                transformOrigin: "center",
              }}
              animate={{ scale: progress / 100 }}
              transition={{
                type: "spring",
                stiffness: 700,
                damping: 30,
              }}
            />
            <div className="text-4xl font-semibold">{formatTime(timeLeft)}</div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={isRunning ? handlePauseTimer : handleStartTimer}
              className={cn(
                "px-4 py-2 rounded-lg min-w-[80px] flex items-center justify-center gap-2 transition-colors",
                isRunning
                  ? "bg-accent hover:bg-accent/80"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {isRunning ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isRunning ? "Pause" : "Start"}
            </button>
            <button
              onClick={handleStopTimer}
              className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/80 min-w-[80px] flex items-center justify-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop
            </button>
            <button
              onClick={handleResetTimer}
              className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/80 min-w-[80px] flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          <div className="flex items-center gap-4 w-full max-w-[200px]">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <input
              type="range"
              min="0"
              max="100"
              value={settings.volume}
              onChange={(e) => {
                const newVolume = parseInt(e.target.value);
                setSettings((prev) => ({ ...prev, volume: newVolume }));
                if (alarmRef.current) {
                  alarmRef.current.volume = newVolume / 100;
                }
              }}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8">
              {settings.volume}%
            </span>
          </div>

          <div className="text-sm text-muted-foreground">
            Completed Pomodoros: {completedPomodoros}
          </div>
        </div>
      )}
    </div>
  );
}

export { Timer };
