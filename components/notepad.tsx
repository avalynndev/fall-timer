"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Save, Trash2, Plus, X, Minus, Maximize2, FileText } from "lucide-react"

interface Note {
    id: string
    title: string
    content: string
    createdAt: Date
    updatedAt: Date
}

interface NotepadProps {
    isOpen: boolean
    onClose: () => void
    className?: string
    onClick?: () => void
}

function Notepad({ isOpen, onClose, onClick, className }: NotepadProps) {
    const [notes, setNotes] = React.useState<Note[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pomodoro-notes')
            return saved ? JSON.parse(saved) : []
        }
        return []
    })

    const [activeNote, setActiveNote] = React.useState<string | null>(null)
    const [title, setTitle] = React.useState("")
    const [content, setContent] = React.useState("")
    const [isMinimized, setIsMinimized] = React.useState(false)
    const [isMaximized, setIsMaximized] = React.useState(false)
    const [position, setPosition] = React.useState({ x: 100, y: 100 })
    const [isDragging, setIsDragging] = React.useState(false)
    const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 })

    const windowRef = React.useRef<HTMLDivElement>(null)

    const saveNotes = (newNotes: Note[]) => {
        setNotes(newNotes)
        if (typeof window !== 'undefined') {
            localStorage.setItem('pomodoro-notes', JSON.stringify(newNotes))
        }
    }

    const createNewNote = () => {
        const newNote: Note = {
            id: Date.now().toString(),
            title: "Untitled Note",
            content: "",
            createdAt: new Date(),
            updatedAt: new Date()
        }
        const newNotes = [newNote, ...notes]
        saveNotes(newNotes)
        setActiveNote(newNote.id)
        setTitle(newNote.title)
        setContent(newNote.content)
    }

    const saveCurrentNote = () => {
        if (!activeNote) return

        const updatedNotes = notes.map(note =>
            note.id === activeNote
                ? { ...note, title, content, updatedAt: new Date() }
                : note
        )
        saveNotes(updatedNotes)
    }

    const deleteNote = (id: string) => {
        const newNotes = notes.filter(note => note.id !== id)
        saveNotes(newNotes)
        if (activeNote === id) {
            setActiveNote(null)
            setTitle("")
            setContent("")
        }
    }

    const selectNote = (note: Note) => {
        setActiveNote(note.id)
        setTitle(note.title)
        setContent(note.content)
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isMaximized) return
        const rect = windowRef.current?.getBoundingClientRect()
        if (rect) {
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            })
            setIsDragging(true)
        }
    }

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
        if (isDragging && !isMaximized) {
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            })
        }
    }, [isDragging, dragOffset, isMaximized])

    const handleMouseUp = React.useCallback(() => {
        setIsDragging(false)
    }, [])

    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            return () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isDragging, handleMouseMove, handleMouseUp])

    React.useEffect(() => {
        if (activeNote) {
            saveCurrentNote()
        }
    }, [title, content])

    if (!isOpen) return null

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
        return null
    }

    return (
        <div
            onClick={onClick}
            ref={windowRef}
            className={cn(
                "fixed bg-background border border-border shadow-2xl rounded-lg overflow-hidden transition-all z-5",
                isMaximized ? "inset-4" : "w-[800px] h-[600px]",
                isMinimized && "h-12",
                isDragging && "cursor-move",
                className
            )} 
            style={!isMaximized ? {
                left: `${position.x}px`,
                top: `${position.y}px`,
            } : {}}
        >
            <div
                className="flex items-center justify-between px-4 py-2 bg-accent border-b border-border cursor-move select-none"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2">
                    <FileText size={16} />
                    <h2 className="text-sm font-semibold">Notepad</h2>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={createNewNote}
                        className="p-1.5 hover:bg-background rounded transition-colors"
                        title="New Note"
                    >
                        <Plus size={14} />
                    </button>
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
                <div className="flex h-[calc(100%-40px)]">
                    <div className="w-56 border-r border-border p-3 overflow-y-auto bg-accent/50">
                        <div className="space-y-2">
                            {notes.map(note => (
                                <div
                                    key={note.id}
                                    onClick={() => selectNote(note)}
                                    className={cn(
                                        "p-2.5 rounded-md cursor-pointer transition-colors group",
                                        activeNote === note.id
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-accent"
                                    )}
                                >
                                    <div className="font-medium text-xs truncate">{note.title}</div>
                                    <div className="text-[10px] opacity-70 mt-1">
                                        {new Date(note.updatedAt).toLocaleDateString()}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            deleteNote(note.id)
                                        }}
                                        className={cn(
                                            "mt-2 p-1 rounded transition-colors opacity-0 group-hover:opacity-100",
                                            activeNote === note.id
                                                ? "hover:bg-primary-foreground/20"
                                                : "hover:bg-destructive/20"
                                        )}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                            {notes.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-xs">
                                    No notes yet
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                        {activeNote ? (
                            <>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="px-4 py-3 border-b border-border bg-transparent text-base font-semibold outline-none"
                                    placeholder="Note title..."
                                />
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="flex-1 p-4 bg-transparent outline-none resize-none text-sm"
                                    placeholder="Start writing your note..."
                                />
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <div className="text-5xl mb-4">📝</div>
                                    <div className="text-sm">Select a note or create a new one</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export { Notepad }