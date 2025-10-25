"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X, Minus, Music, Play, Volume2, StopCircle, PauseCircle, Save, Trash2, Headphones, Bookmark, BookmarkCheck, Layers, Sparkles, Search, Folder } from "lucide-react"
import { motion } from "framer-motion"

interface AmbientSoundsProps {
    isOpen: boolean
    onClose: () => void
    className?: string
    onClick?: () => void
}

const soundStructure = {
    animals: [
        "beehive", "birds", "cat-purring", "chickens", "cows", "crickets",
        "crows", "dog-barking", "frog", "horse-galopp", "owl", "seagulls",
        "sheep", "whale", "wolf", "woodpecker"
    ],
    binaural: [
        "binaural-alpha", "binaural-beta", "binaural-delta",
        "binaural-gamma", "binaural-theta"
    ],
    nature: [
        "campfire", "droplets", "howling-wind", "jungle", "river",
        "walk-in-snow", "walk-on-gravel", "walk-on-leaves", "waterfall",
        "waves", "wind-in-trees", "wind"
    ],
    noise: ["brown-noise", "pink-noise", "white-noise"],
    places: [
        "airport", "cafe", "carousel", "church", "construction-site",
        "crowded-bar", "laboratory", "laundry-room", "library",
        "night-village", "office", "restaurant", "subway-station",
        "supermarket", "temple", "underwater"
    ],
    rain: [
        "heavy-rain", "light-rain", "rain-on-car-roof", "rain-on-leaves",
        "rain-on-tent", "rain-on-umbrella", "rain-on-window", "thunder"
    ],
    things: [
        "boiling-water", "bubbles", "ceiling-fan", "clock", "dryer",
        "keyboard", "morse-code", "paper", "singing-bowl", "slide-projector",
        "tuning-radio", "typewriter", "vinyl-effect", "washing-machine",
        "wind-chimes", "windshield-wipers"
    ],
    transport: [
        "airplane", "inside-a-train", "rowing-boat", "sailboat",
        "submarine", "train"
    ],
    urban: [
        "ambulance-siren", "busy-street", "crowd", "fireworks",
        "highway", "road", "traffic"
    ],
}

const DEFAULT_VOLUME = 50
const MAX_VOLUME = 100
const MIN_VOLUME = 0
const globalAudioCache: Record<string, HTMLAudioElement> = {}

const cleanupAudio = (soundId: string) => {
    const audio = globalAudioCache[soundId]
    if (audio) {
        try {
            audio.pause()
            audio.currentTime = 0
        } catch (err) {
            console.error(`Error cleaning up audio ${soundId}:`, err)
        }
    }
}

const normalizeVolume = (volume: number): number => Math.max(0, Math.min(1, volume / MAX_VOLUME))

interface Sound {
    id: string
    name: string
    category: string
    audioUrl: string
    volume: number
    playing: boolean
}

interface SoundMix {
    id: string
    name: string
    sounds: { id: string; volume: number; playing: boolean }[]
    createdAt: string
}

const ANIMATION_CONFIG = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2 },
} as const

function AmbientSoundsWindow({ isOpen, onClose, className, onClick }: AmbientSoundsProps) {
    const [sounds, setSounds] = React.useState<Sound[]>(() => {
        if (typeof window === 'undefined') return []
        const allSounds: Sound[] = []
        Object.entries(soundStructure).forEach(([category, names]) =>
            names.forEach((soundName) => {
                const extension = category === 'binaural' || category === 'noise' ? 'wav' : 'mp3'
                allSounds.push({
                    id: `${category}-${soundName}`,
                    name: soundName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    category,
                    audioUrl: `/sounds/${category}/${soundName}.${extension}`,
                    volume: DEFAULT_VOLUME,
                    playing: false,
                })
            })
        )
        const saved = localStorage.getItem("ambient-sound-volumes")
        if (saved) {
            const volMap = JSON.parse(saved)
            allSounds.forEach(s => { if (volMap[s.id]) s.volume = volMap[s.id] })
        }
        return allSounds
    })

    const [masterVolume, setMasterVolume] = React.useState(DEFAULT_VOLUME)
    const [savedMixes, setSavedMixes] = React.useState<SoundMix[]>([])
    const [newMixName, setNewMixName] = React.useState("")
    const [activeCategory, setActiveCategory] = React.useState<string | null>(null)
    const [activeMixId, setActiveMixId] = React.useState<string | null>(null)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isMinimized, setIsMinimized] = React.useState(false)
    const [position, setPosition] = React.useState({ x: 150, y: 50 })
    const [isDragging, setIsDragging] = React.useState(false)
    const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 })

    const windowRef = React.useRef<HTMLDivElement>(null)
    const volumeUpdateTimeouts = React.useRef<Record<string, NodeJS.Timeout>>({})

    React.useEffect(() => {
        if (typeof window === 'undefined') return
        const savedMixesData = localStorage.getItem("sound-mixes")
        if (savedMixesData) setSavedMixes(JSON.parse(savedMixesData))
        const savedMasterVol = localStorage.getItem("ambient-master-volume")
        if (savedMasterVol) setMasterVolume(parseInt(savedMasterVol))
    }, [])

    React.useEffect(() => {
        if (typeof window === 'undefined') return
        localStorage.setItem("sound-mixes", JSON.stringify(savedMixes))
        localStorage.setItem("ambient-master-volume", masterVolume.toString())
        const map: Record<string, number> = {}
        sounds.forEach(s => (map[s.id] = s.volume))
        localStorage.setItem("ambient-sound-volumes", JSON.stringify(map))
    }, [sounds, savedMixes, masterVolume])

    const activeSoundsCount = sounds.filter(s => s.playing).length

    const filteredSounds = sounds.filter(s => {
        const catMatch = !activeCategory || s.category === activeCategory
        const nameMatch = s.name.toLowerCase().includes(searchQuery.toLowerCase())
        return catMatch && nameMatch
    })

    const sortedMixes = [...savedMixes].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const toggleSound = (id: string) => {
        setSounds(prev => prev.map(s => {
            if (s.id === id) {
                const playing = !s.playing
                if (playing) {
                    let audio = globalAudioCache[id]
                    if (!audio) {
                        audio = new Audio(s.audioUrl)
                        audio.loop = true
                        globalAudioCache[id] = audio
                    }
                    audio.volume = normalizeVolume(s.volume) * normalizeVolume(masterVolume)
                    audio.play().catch(console.error)
                } else cleanupAudio(id)
                return { ...s, playing }
            }
            return s
        }))
        setActiveMixId(null)
    }

    const handleVolumeChange = (id: string, val: number) => {
        const audio = globalAudioCache[id]
        if (audio) audio.volume = normalizeVolume(val) * normalizeVolume(masterVolume)
        clearTimeout(volumeUpdateTimeouts.current[id])
        volumeUpdateTimeouts.current[id] = setTimeout(() => {
            setSounds(prev => prev.map(s => s.id === id ? { ...s, volume: val } : s))
        }, 100)
        setActiveMixId(null)
    }

    const handleMasterVolumeChange = (val: number) => {
        setMasterVolume(val)
        sounds.forEach(s => {
            if (s.playing) {
                const a = globalAudioCache[s.id]
                if (a) a.volume = normalizeVolume(s.volume) * normalizeVolume(val)
            }
        })
    }

    const stopAllSounds = () => {
        setSounds(prev => prev.map(s => ({ ...s, playing: false })))
        Object.keys(globalAudioCache).forEach(cleanupAudio)
        setActiveMixId(null)
    }

    const handleSaveMix = () => {
        if (!newMixName.trim()) return
        const mix: SoundMix = {
            id: crypto.randomUUID(),
            name: newMixName.trim(),
            sounds: sounds.map(({ id, volume, playing }) => ({ id, volume, playing })),
            createdAt: new Date().toISOString(),
        }
        setSavedMixes(prev => [mix, ...prev])
        setNewMixName("")
        setActiveMixId(mix.id)
    }

    const handleLoadMix = (mix: SoundMix) => {
        const active = mix.id === activeMixId
        if (active) return stopAllSounds()
        sounds.forEach(s => s.playing && cleanupAudio(s.id))
        setSounds(prev => prev.map(s => {
            const m = mix.sounds.find(ms => ms.id === s.id)
            if (!m) return { ...s, playing: false }
            if (m.playing) {
                let a = globalAudioCache[s.id]
                if (!a) {
                    a = new Audio(s.audioUrl)
                    a.loop = true
                    globalAudioCache[s.id] = a
                }
                a.volume = normalizeVolume(m.volume) * normalizeVolume(masterVolume)
                a.play().catch(console.error)
            }
            return { ...s, playing: m.playing, volume: m.volume }
        }))
        setActiveMixId(mix.id)
    }

    const handleDeleteMix = (id: string) => {
        if (id === activeMixId) setActiveMixId(null)
        setSavedMixes(prev => prev.filter(m => m.id !== id))
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = windowRef.current?.getBoundingClientRect()
        if (!rect) return
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        setIsDragging(true)
    }

    React.useEffect(() => {
        const move = (e: MouseEvent) => {
            if (isDragging) setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y })
        }
        const up = () => setIsDragging(false)
        if (isDragging) {
            document.addEventListener("mousemove", move)
            document.addEventListener("mouseup", up)
            return () => {
                document.removeEventListener("mousemove", move)
                document.removeEventListener("mouseup", up)
            }
        }
    }, [isDragging, dragOffset])

    if (!isOpen) return null

    return (
        <div
            ref={windowRef}
            className={cn(
                "fixed bg-background border border-border shadow-2xl rounded-lg overflow-hidden transition-all w-[900px] h-[650px]",
                isMinimized && "h-12",
                isDragging && "cursor-move",
                className
            )}
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
            onClick={onClick}
        >
            <div
                className="flex items-center justify-between px-4 py-2 bg-accent border-b border-border cursor-move select-none"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2">
                    <Music size={16} />
                    <h2 className="text-sm font-semibold">Ambient Sounds</h2>
                    {activeSoundsCount > 0 && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            {activeSoundsCount} playing
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-background rounded transition-colors">
                        <Minus size={14} />
                    </button>
                    <button onClick={onClose} className="p-1.5 hover:bg-destructive hover:text-destructive-foreground rounded transition-colors">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <div className="h-[calc(100%-40px)] overflow-y-auto p-4 space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="p-4 rounded-xl border border-border/50 bg-background/80 flex-1 w-full">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <Headphones className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">Master Volume</span>
                                <span className="text-xs text-muted-foreground ml-auto">{masterVolume}%</span>
                            </div>
                            <input
                                type="range"
                                min={MIN_VOLUME}
                                max={MAX_VOLUME}
                                value={masterVolume}
                                onChange={(e) => handleMasterVolumeChange(parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        <button
                            onClick={stopAllSounds}
                            disabled={activeSoundsCount === 0}
                            className="px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                            <StopCircle className="w-4 h-4" />
                            Stop All
                        </button>
                    </div>

                    <div className="p-4 rounded-xl border border-border/50 bg-background/80">
                        <div className="flex items-center gap-3 mb-3">
                            <Bookmark className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Save Current Mix</span>
                        </div>
                        <div className="flex gap-2">
                            <input
                                value={newMixName}
                                onChange={(e) => setNewMixName(e.target.value)}
                                placeholder="My custom mix"
                                className="flex-1 h-9 px-3 rounded-lg border border-border bg-background"
                            />
                            <button
                                onClick={handleSaveMix}
                                disabled={!newMixName.trim() || activeSoundsCount === 0}
                                className="px-4 h-9 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Layers className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-semibold">Saved Mixes</h3>
                        </div>

                        {sortedMixes.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No mixes saved yet.</p>
                        ) : (
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {sortedMixes.map((mix) => (
                                    <motion.div
                                        key={mix.id}
                                        {...ANIMATION_CONFIG}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-lg border transition-colors",
                                            activeMixId === mix.id
                                                ? "border-primary/50 bg-primary/5"
                                                : "border-border/50 hover:border-border"
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium truncate">{mix.name}</span>
                                                {activeMixId === mix.id && (
                                                    <BookmarkCheck className="w-4 h-4 text-primary" />
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(mix.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleLoadMix(mix)}
                                                className={cn(
                                                    "px-3 py-1.5 text-xs rounded-md transition-colors",
                                                    activeMixId === mix.id
                                                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                                                        : "bg-primary/10 text-primary hover:bg-primary/20"
                                                )}
                                            >
                                                {activeMixId === mix.id ? "Stop" : "Load"}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMix(mix.id)}
                                                className="p-1.5 text-muted-foreground hover:text-destructive rounded-md transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search sounds..."
                                className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-background"
                            />
                        </div>

                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            <button
                                onClick={() => setActiveCategory(null)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors",
                                    !activeCategory ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/80"
                                )}
                            >
                                All
                            </button>
                            {Object.keys(soundStructure).map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs capitalize whitespace-nowrap transition-colors flex items-center gap-1.5",
                                        activeCategory === category ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/80"
                                    )}
                                >
                                    <Folder className="w-3 h-3" />
                                    {category}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2">
                            {filteredSounds.map((sound) => (
                                <motion.div key={sound.id} {...ANIMATION_CONFIG}>
                                    <div className={cn(
                                        "p-3 rounded-xl border transition-all",
                                        sound.playing ? "border-primary/50 bg-primary/5" : "border-border/50 hover:border-border"
                                    )}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex-1 font-medium text-sm truncate">{sound.name}</div>
                                            <button
                                                onClick={() => toggleSound(sound.id)}
                                                className={cn(
                                                    "p-1.5 rounded-lg transition-colors",
                                                    sound.playing
                                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                                        : "bg-accent hover:bg-accent/80"
                                                )}
                                            >
                                                {sound.playing ? (
                                                    <PauseCircle className="w-4 h-4" />
                                                ) : (
                                                    <Play className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Volume2 className="w-4 h-4 text-muted-foreground" />
                                            <input
                                                type="range"
                                                min={MIN_VOLUME}
                                                max={MAX_VOLUME}
                                                value={sound.volume}
                                                onChange={(e) => handleVolumeChange(sound.id, parseInt(e.target.value))}
                                                className="flex-1 h-2"
                                            />
                                            <span className="text-xs text-muted-foreground w-10 text-right">
                                                {sound.volume}%
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                </div>
            )}
        </div>
    )
}

export default AmbientSoundsWindow
