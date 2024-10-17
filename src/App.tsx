import { useState, useEffect } from 'react';
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

    useEffect(() => {
        // Load notes from local storage
        const storedNotes = localStorage.getItem('notes');
        if (storedNotes) {
            setNotes(JSON.parse(storedNotes));
        }
    }, []);

    useEffect(() => {
        // Save notes to local storage whenever they change
        localStorage.setItem('notes', JSON.stringify(notes));
    }, [notes]);

    // ... existing code ...

    const handleCreateNote = () => {
        const newNote: Note = {
            id: Date.now().toString(),
            title: 'New Note',
            content: '',
        };
        setNotes([...notes, newNote]);
        setSelectedNoteId(newNote.id);
    };

    const handleDeleteNote = (id: string) => {
        setNotes(notes.filter(note => note.id !== id));
        if (selectedNoteId === id) {
            setSelectedNoteId(null);
        }
    };

    const handleUpdateNote = (updatedNote: Note) => {
        setNotes(notes.map(note => note.id === updatedNote.id ? updatedNote : note));
    };

    const handleExportNotes = () => {
        const dataStr = JSON.stringify(notes);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
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
                } catch (error) {
                    console.error('Error importing notes:', error);
                }
            };
            reader.readAsText(file);
        }
    };

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
