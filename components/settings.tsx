'use client';

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    X, Minus, Settings as SettingsIcon,
    Sun, Moon, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    background: string;
    setBackground: (v: string) => void;
    setCustomBg: (v: string | null) => void;
    className?: string;
    onClick?: () => void;
}

const googleFonts = [
    "Inter", "Roboto", "Poppins", "Lato", "Montserrat",
    "Raleway", "Open Sans", "Playfair Display",
    "Abril Fatface", "Merriweather", "Nunito"
];

export function Settings({
    isOpen,
    onClose,
    background,
    setBackground,
    onClick,
    className,
    setCustomBg,
}: SettingsProps) {
    const [isDark, setIsDark] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFont, setSelectedFont] = useState("Inter");
    const [position, setPosition] = useState({ x: 160, y: 160 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const windowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedFont = localStorage.getItem("selectedFont");
        if (storedFont) setSelectedFont(storedFont);

        const storedBg = localStorage.getItem("selectedBackground");
        if (storedBg) setBackground(storedBg);

        const storedCustom = localStorage.getItem("customBackground");
        if (storedCustom) setCustomBg(storedCustom);
    }, [setBackground, setCustomBg]);

    useEffect(() => {
        localStorage.setItem("selectedFont", selectedFont);
        const linkId = "dynamic-google-font";
        let link = document.getElementById(linkId) as HTMLLinkElement | null;
        if (!link) {
            link = document.createElement("link");
            link.id = linkId;
            link.rel = "stylesheet";
            document.head.appendChild(link);
        }
        link.href = `https://fonts.googleapis.com/css2?family=${selectedFont.replace(/ /g, "+")}:wght@400;600&display=swap`;
        document.body.style.fontFamily = `'${selectedFont}', sans-serif`;
    }, [selectedFont]);

    const selectBg = (bg: string) => {
        setBackground(bg);
        localStorage.setItem("selectedBackground", bg);
        setCustomBg(null);
        localStorage.removeItem("customBackground");
    };

    const handleCustomBgImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const imageUrl = reader.result as string;
            localStorage.setItem("customBackground", imageUrl);
            setCustomBg(imageUrl);
            setBackground(""); 
            localStorage.removeItem("selectedBackground");
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDark);
    }, [isDark]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = windowRef.current?.getBoundingClientRect();
        if (rect) {
            setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            setIsDragging(true);
        }
    };
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging) {
            setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
        }
    }, [isDragging, dragOffset]);
    const handleMouseUp = useCallback(() => setIsDragging(false), []);
    useEffect(() => {
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
                "fixed bg-background border border-border shadow-2xl rounded-lg overflow-hidden transition-all z-10",
                isMinimized && "h-12",
                isDragging && "cursor-move",
                className
            )}
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
        >
            <div className="flex items-center justify-between px-4 py-2 bg-accent border-b border-border cursor-move select-none w-[450px]" onMouseDown={handleMouseDown}>
                <div className="flex items-center gap-2">
                    <SettingsIcon size={16} />
                    <h2 className="text-sm font-semibold">Settings</h2>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setIsDark(!isDark)} className="p-1.5 hover:bg-background rounded">
                        {isDark ? <Moon size={14} /> : <Sun size={14} />}
                    </button>
                    <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-background rounded">
                        <Minus size={14} />
                    </button>
                    <button onClick={onClose} className="p-1.5 hover:bg-destructive hover:text-destructive-foreground rounded">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <div className="p-5 space-y-6 h-[calc(100%-40px)] overflow-y-auto bg-accent/40">
                    <div>
                        <label className="block text-sm font-medium mb-2">🎨 Background Theme</label>
                        <div className="flex gap-2 flex-wrap">
                            {["bg", "bg1", "bg2", "bg3", "bg4", "bg5"].map((bg) => (
                                <button
                                    key={bg}
                                    onClick={() => selectBg(`${bg}.webp`)}
                                    className={cn(
                                        "px-4 py-2 rounded-md text-sm border transition-colors",
                                        background === `${bg}.webp`
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "hover:bg-accent border-border"
                                    )}
                                >
                                    {bg.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">🖋️ Font</label>
                        <Select value={selectedFont} onValueChange={setSelectedFont}>
                            <SelectTrigger className="w-full bg-background border">
                                <SelectValue placeholder="Select a font" />
                            </SelectTrigger>
                            <SelectContent>
                                {googleFonts.map((font) => (
                                    <SelectItem key={font} value={font}>{font}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">🖼️ Import Custom Background</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleCustomBgImport}
                                className="block w-full text-sm border p-2 rounded-md bg-background"
                            />
                            <Upload size={18} className="opacity-70" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
