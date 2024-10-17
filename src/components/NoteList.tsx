import React from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
}

interface NoteListProps {
  notes: Note[];
  onSelectNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onCreateNote: () => void;
}

const NoteList: React.FC<NoteListProps> = ({ notes, onSelectNote, onDeleteNote, onCreateNote }) => {
  return (
    <div className="note-list">
      <h2 className="text-xl font-bold mb-4">Notes</h2>
      <button
        onClick={onCreateNote}
        className="bg-green-500 text-white px-4 py-2 rounded mb-4 w-full"
      >
        Create New Note
      </button>
      <ul>
        {notes.map((note) => (
          <li key={note.id} className="mb-2 flex items-center justify-between">
            <button
              onClick={() => onSelectNote(note.id)}
              className="text-left flex-grow hover:bg-gray-100 px-2 py-1 rounded"
            >
              {note.title}
            </button>
            <button
              onClick={() => onDeleteNote(note.id)}
              className="text-red-500 hover:text-red-700 ml-2"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NoteList;

