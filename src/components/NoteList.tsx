import React from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
}

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onCreateNote: () => void;
}

const stripHtmlTags = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

const NoteList: React.FC<NoteListProps> = ({ notes, selectedNoteId, onSelectNote, onDeleteNote, onCreateNote }) => {
  return (
    <div className="note-list">
      <h2 className="text-xl font-bold mb-4">Notes</h2>
      <button
        onClick={onCreateNote}
        className="bg-green-500 text-white px-4 py-2 rounded mb-4 w-full hover:bg-green-600 transition-colors"
      >
        Create New Note
      </button>
      <ul className="space-y-1">
        {notes.map((note) => (
          <li key={note.id} className="flex items-center justify-between group">
            <button
              onClick={() => onSelectNote(note.id)}
              className={`text-left flex-grow px-3 py-2 rounded-lg transition-all duration-200 ${
                selectedNoteId === note.id
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'hover:bg-gray-100'
              } w-full`}
            >
              <div className="truncate">{note.title}</div>
              <div className="text-xs text-gray-500 truncate">
                {stripHtmlTags(note.content).slice(0, 50)}{note.content.length > 50 ? '...' : ''}
              </div>
            </button>
            <button
              onClick={() => onDeleteNote(note.id)}
              className="text-gray-400 hover:text-red-500 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete note"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NoteList;
