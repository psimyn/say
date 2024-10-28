import React, { useState, useEffect, useCallback } from 'react';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import { useTranscriber } from "./hooks/useTranscriber";

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

    useEffect(() => {
        const loadNotes = () => {
            const storedNotes = localStorage.getItem('notes');
            if (storedNotes) {
                try {
                    const parsedNotes = JSON.parse(storedNotes);
                    // Migrate old notes to new format if needed
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
    }, [notes, updateNotes]);

    const startDictating = useCallback(async () => {
        try {
            // Request microphone permission
            await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Create a new note
            const newNote: Note = {
                id: Date.now().toString(),
                title: 'New Dictation',
                content: '',
                tags: [],
                versions: []
            };
            updateNotes([...notes, newNote]);
            setSelectedNoteId(newNote.id);

            // Wait a bit for the note editor to mount
            setTimeout(() => {
                // Find and click the Record tile button
                const recordTile = document.querySelector('button:has(.h-7 svg path[d*="M12 18.75"])') as HTMLButtonElement;
                if (recordTile) {
                    recordTile.click();
                    // Wait for the modal to appear and click Start Recording
                    setTimeout(() => {
                        const startRecordingButton = document.querySelector('button.bg-blue-500.hover\\:bg-blue-600') as HTMLButtonElement;
                        if (startRecordingButton) {
                            startRecordingButton.click();
                        }
                    }, 100);
                }
            }, 100);
        } catch (error) {
            console.error('Microphone permission denied:', error);
            alert('Microphone access is required for dictation. Please grant permission and try again.');
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
        <div className='flex flex-col min-h-screen'>
            <header className='bg-slate-800 text-white p-4'>
                <div className="flex justify-between items-center">
                    <h1 className='text-3xl font-bold'>SpeakEZ</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const notesBlob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(notesBlob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'speakez-notes-export.json';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                            }}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                            Export Notes
                        </button>
                        <label className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer transition-colors">
                            Import Notes
                            <input
                                type="file"
                                accept=".json"
                                onChange={(event) => {
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
                                                    // Migrate imported notes if needed
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
                                }}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>
            </header>
            <main className='flex-grow flex'>
                <aside className='w-1/4 bg-slate-100 p-4'>
                    <NoteList
                        notes={filteredNotes}
                        selectedNoteId={selectedNoteId}
                        onSelectNote={setSelectedNoteId}
                        onDeleteNote={handleDeleteNote}
                        onCreateNote={handleCreateNote}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />
                </aside>
                <section className='w-3/4 p-4'>
                    {selectedNoteId ? (
                        <NoteEditor
                            note={notes.find(note => note.id === selectedNoteId)!}
                            onUpdateNote={handleUpdateNote}
                            onSaveVersion={handleSaveVersion}
                            onRestoreVersion={handleRestoreVersion}
                            onUpdateTags={handleUpdateTags}
                            transcriber={transcriber}
                            hasMicrophonePermission={true}
                        />
                    ) : (
                        <div className="text-center space-y-8">
                            <div className="text-gray-500 mb-8">
                                Select a note or create a new one to get started.
                            </div>
                            <div className="flex flex-col items-center gap-4">
                                <button
                                    onClick={handleCreateNote}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors w-64"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create New Note
                                </button>
                                <button
                                    onClick={startDictating}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors w-64"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                    Start Dictating
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default App;
