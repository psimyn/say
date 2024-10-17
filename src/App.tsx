import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioManager } from "./components/AudioManager";
import Transcript from "./components/Transcript";
import { useTranscriber } from "./hooks/useTranscriber";
// ... existing imports ...

// New components (to be created)
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';

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

    // Load notes from localStorage
    useEffect(() => {
        const loadNotes = () => {
            const storedNotes = localStorage.getItem('notes');
            console.log('Stored notes from localStorage:', storedNotes);
            if (storedNotes) {
                try {
                    const parsedNotes = JSON.parse(storedNotes);
                    setNotes(parsedNotes);
                    console.log('Loaded notes from local storage:', parsedNotes);
                } catch (error) {
                    console.error('Error parsing stored notes:', error);
                }
            } else {
                console.log('No notes found in local storage');
            }
            setIsLoaded(true);
        };

        loadNotes();
    }, []);

    // Save notes to localStorage
    const saveNotes = useCallback((notesToSave: Note[]) => {
        console.log('Saving notes to localStorage:', notesToSave);
        localStorage.setItem('notes', JSON.stringify(notesToSave));
    }, []);

    // Update notes and save to localStorage
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

    const handleExportNotes = () => {
        const notesToExport = localStorage.getItem('notes') || '[]';
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(notesToExport);
        const exportFileDefaultName = 'notes.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleImportNotes = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                try {
                    const importedNotes = JSON.parse(content);
                    setNotes(importedNotes);
                    localStorage.setItem('notes', content);
                } catch (error) {
                    console.error('Error importing notes:', error);
                }
            };
            reader.readAsText(file);
        }
    };

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    return (
        <div className='flex flex-col min-h-screen'>
            <header className='bg-slate-800 text-white p-4'>
                <h1 className='text-3xl font-bold'>Whisper Notes</h1>
            </header>
            <main className='flex-grow flex'>
                <aside className='w-1/4 bg-slate-100 p-4'>
                    <NoteList
                        notes={notes}
                        onSelectNote={setSelectedNoteId}
                        onDeleteNote={handleDeleteNote}
                        onCreateNote={handleCreateNote}
                    />
                    <div className='mt-4'>
                        <button onClick={handleExportNotes} className='bg-blue-500 text-white px-2 py-1 rounded mr-2'>
                            Export Notes
                        </button>
                        <input
                            type="file"
                            onChange={handleImportNotes}
                            accept=".json"
                            className='hidden'
                            id="import-notes"
                        />
                        <label htmlFor="import-notes" className='bg-green-500 text-white px-2 py-1 rounded cursor-pointer'>
                            Import Notes
                        </label>
                    </div>
                </aside>
                <section className='w-3/4 p-4'>
                    {selectedNoteId ? (
                        <NoteEditor
                            note={notes.find(note => note.id === selectedNoteId)!}
                            onUpdateNote={handleUpdateNote}
                            transcriber={transcriber}
                        />
                    ) : (
                        <div className='text-center text-gray-500'>
                            Select a note or create a new one to get started.
                        </div>
                    )}
                </section>
            </main>
            <div className='absolute bottom-4'>
                Made with{" "}
                <a
                    className='underline'
                    href='https://github.com/xenova/transformers.js'
                >
                    🤗 Transformers.js
                </a>
            </div>
        </div>
    );
}

export default App;
