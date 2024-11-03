import React, { useState, useEffect, useCallback, useRef } from 'react';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import { useTranscriber } from "./hooks/useTranscriber";
import { AudioManager } from './components/AudioManager';

interface NoteVersion {
  content: string;
  timestamp: number;
  description: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  versions: NoteVersion[];
}

function App() {
    const transcriber = useTranscriber();
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNoteList, setShowNoteList] = useState(false);
    const [showInfo, setShowInfo] = useState(true);
    const lastTranscriptionRef = useRef<string | null>(null);

    useEffect(() => {
        const loadNotes = () => {
            const storedNotes = localStorage.getItem('notes');
            if (storedNotes) {
                try {
                    const parsedNotes = JSON.parse(storedNotes);
                    const migratedNotes = parsedNotes.map((note: any) => ({
                        ...note,
                        tags: note.tags || [],
                        versions: note.versions || []
                    }));
                    setNotes(migratedNotes);
                } catch (error) {
                    console.error('Error parsing stored notes:', error);
                }
            }
            setIsLoaded(true);
        };

        loadNotes();
    }, []);

    const saveNotes = useCallback((notesToSave: Note[]) => {
        localStorage.setItem('notes', JSON.stringify(notesToSave));
    }, []);

    const updateNotes = useCallback((newNotes: Note[]) => {
        setNotes(newNotes);
        saveNotes(newNotes);
    }, [saveNotes]);

    const handleCreateNote = useCallback(() => {
        const newNote: Note = {
            id: Date.now().toString(),
            title: 'New Note',
            content: '',
            tags: [],
            versions: []
        };
        updateNotes([...notes, newNote]);
        setSelectedNoteId(newNote.id);
        return newNote.id;
    }, [notes, updateNotes]);

    const handleTranscriptionComplete = useCallback((text: string) => {
        setShowInfo(false);
        // Only create a new note if this is a new transcription
        if (text !== lastTranscriptionRef.current) {
            lastTranscriptionRef.current = text;
            const newNote: Note = {
                id: Date.now().toString(),
                title: 'Transcribed Note',
                content: text,
                tags: [],
                versions: []
            };
            updateNotes([...notes, newNote]);
            setSelectedNoteId(newNote.id);
            setShowNoteList(true);
        }
    }, [notes, updateNotes]);

    const handleDeleteNote = useCallback((id: string) => {
        const updatedNotes = notes.filter(note => note.id !== id);
        updateNotes(updatedNotes);
        if (selectedNoteId === id) {
            setSelectedNoteId(null);
        }
    }, [notes, selectedNoteId, updateNotes]);

    const handleUpdateNote = useCallback((updatedNote: Note) => {
        const updatedNotes = notes.map(note => 
            note.id === updatedNote.id ? updatedNote : note
        );
        updateNotes(updatedNotes);
    }, [notes, updateNotes]);

    const handleSaveVersion = useCallback((noteId: string, description: string) => {
        const note = notes.find(n => n.id === noteId);
        if (note) {
            const newVersion: NoteVersion = {
                content: note.content,
                timestamp: Date.now(),
                description
            };
            const updatedNote = {
                ...note,
                versions: [...note.versions, newVersion]
            };
            handleUpdateNote(updatedNote);
        }
    }, [notes, handleUpdateNote]);

    const handleRestoreVersion = useCallback((noteId: string, version: NoteVersion) => {
        const note = notes.find(n => n.id === noteId);
        if (note) {
            const updatedNote = {
                ...note,
                content: version.content
            };
            handleUpdateNote(updatedNote);
        }
    }, [notes, handleUpdateNote]);

    const handleUpdateTags = useCallback((noteId: string, tags: string[]) => {
        const note = notes.find(n => n.id === noteId);
        if (note) {
            const updatedNote = {
                ...note,
                tags
            };
            handleUpdateNote(updatedNote);
        }
    }, [notes, handleUpdateNote]);

    const handleExportNotes = useCallback(() => {
        const notesBlob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(notesBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scribe-notes-export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [notes]);

    const handleImportNotes = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedNotes = JSON.parse(e.target?.result as string);
                    if (Array.isArray(importedNotes) && importedNotes.every(note => 
                        typeof note === 'object' && 
                        'id' in note && 
                        'title' in note && 
                        'content' in note
                    )) {
                        const migratedNotes = importedNotes.map(note => ({
                            ...note,
                            tags: note.tags || [],
                            versions: note.versions || []
                        }));
                        updateNotes(migratedNotes);
                    } else {
                        alert('Invalid notes format');
                    }
                } catch (error) {
                    console.error('Error importing notes:', error);
                    alert('Error importing notes');
                }
            };
            reader.readAsText(file);
        }
    }, [updateNotes]);

    const filteredNotes = notes.filter(note => {
        const searchLower = searchQuery.toLowerCase();
        return (
            note.title.toLowerCase().includes(searchLower) ||
            note.content.toLowerCase().includes(searchLower) ||
            note.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
    });

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    return (
        <div className='flex flex-col min-h-screen bg-slate-50'>
            <header className='bg-slate-800 text-white p-4 shadow-lg'>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h1 className='text-3xl font-bold'>Scribe</h1>
                        <button
                            onClick={() => setShowNoteList(!showNoteList)}
                            className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
                        >
                            {showNoteList ? 'Hide Notes' : 'Show Notes'}
                        </button>
                    </div>
                </div>
            </header>
            <main className='flex-grow flex'>
                {showNoteList && (
                    <aside className='w-72 bg-white border-r border-slate-200 p-4 overflow-y-auto'>
                        <NoteList
                            notes={filteredNotes}
                            selectedNoteId={selectedNoteId}
                            onSelectNote={setSelectedNoteId}
                            onDeleteNote={handleDeleteNote}
                            onCreateNote={handleCreateNote}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onExportNotes={handleExportNotes}
                            onImportNotes={handleImportNotes}
                        />
                    </aside>
                )}
                <section className={`flex-grow p-4 ${showNoteList ? 'w-[calc(100%-18rem)]' : 'w-full'}`}>
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                            <h2 className="text-2xl font-semibold mb-4">Quick Record</h2>
                            <AudioManager 
                                transcriber={transcriber}
                                onTranscriptionComplete={handleTranscriptionComplete}
                            />
                        </div>

                        {showInfo && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                                <h3 className="text-lg font-semibold text-blue-900 mb-2">Welcome to Scribe!</h3>
                                <p className="text-blue-800">
                                    Easily record and transcribe your audio files into text using AI. When you start recording, 
                                    it will download a small language model to your device. All processing happens privately and locally 
                                    - your audio never leaves your computer.
                                </p>
                            </div>
                        )}

                        {selectedNoteId && (
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <NoteEditor
                                    note={notes.find(note => note.id === selectedNoteId)!}
                                    onUpdateNote={handleUpdateNote}
                                    onSaveVersion={handleSaveVersion}
                                    onRestoreVersion={handleRestoreVersion}
                                    onUpdateTags={handleUpdateTags}
                                    transcriber={transcriber}
                                    hasMicrophonePermission={true}
                                />
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default App;
