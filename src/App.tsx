import React, { useState, useEffect, useCallback } from 'react';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import { useTranscriber } from "./hooks/useTranscriber";

interface Note {
  id: string;
  title: string;
  content: string;
}

function App() {
    const transcriber = useTranscriber();
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasMicrophonePermission, setHasMicrophonePermission] = useState(false);

    useEffect(() => {
        const loadNotes = () => {
            const storedNotes = localStorage.getItem('notes');
            if (storedNotes) {
                try {
                    const parsedNotes = JSON.parse(storedNotes);
                    setNotes(parsedNotes);
                } catch (error) {
                    console.error('Error parsing stored notes:', error);
                }
            }
            setIsLoaded(true);
        };

        loadNotes();

        window.addEventListener('message', (event) => {
            if (event.data.type === 'MICROPHONE_PERMISSION_GRANTED') {
                setHasMicrophonePermission(true);
            }
        });

        if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ type: 'REQUEST_MICROPHONE_PERMISSION' });
        }
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
        };
        updateNotes([...notes, newNote]);
        setSelectedNoteId(newNote.id);
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

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    return (
        <div className='flex flex-col min-h-screen'>
            <header className='bg-slate-800 text-white p-4'>
                <div className="flex justify-between items-center">
                    <h1 className='text-3xl font-bold'>Whisper Notes</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const notesBlob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(notesBlob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'whisper-notes-export.json';
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
                                                    updateNotes(importedNotes);
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
                        notes={notes}
                        selectedNoteId={selectedNoteId}
                        onSelectNote={setSelectedNoteId}
                        onDeleteNote={handleDeleteNote}
                        onCreateNote={handleCreateNote}
                    />
                </aside>
                <section className='w-3/4 p-4'>
                    {selectedNoteId ? (
                        <NoteEditor
                            note={notes.find(note => note.id === selectedNoteId)!}
                            onUpdateNote={handleUpdateNote}
                            transcriber={transcriber}
                            hasMicrophonePermission={hasMicrophonePermission}
                        />
                    ) : (
                        <div className='text-center text-gray-500'>
                            Select a note or create a new one to get started.
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default App;
