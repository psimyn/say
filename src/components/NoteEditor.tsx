import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AudioManager } from "./AudioManager";
import Transcript from "./Transcript";
import { Transcriber } from "../hooks/useTranscriber";

interface Note {
  id: string;
  title: string;
  content: string;
}

interface NoteEditorProps {
  note: Note;
  onUpdateNote: (updatedNote: Note) => void;
  transcriber: Transcriber;
  hasMicrophonePermission: boolean;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onUpdateNote, transcriber, hasMicrophonePermission }) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const lastTranscriptRef = useRef('');

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note]);

  const handleTranscriptionUpdate = useCallback((newTranscript: string) => {
    if (newTranscript !== lastTranscriptRef.current) {
      console.log('New transcript received:', newTranscript); // Debug log
      setContent(prevContent => {
        const updatedContent = prevContent + ' ' + newTranscript.slice(lastTranscriptRef.current.length);
        console.log('Updated content:', updatedContent); // Debug log
        onUpdateNote({ ...note, content: updatedContent });
        lastTranscriptRef.current = newTranscript;
        return updatedContent;
      });
    }
  }, [note, onUpdateNote]);

  useEffect(() => {
    console.log('Transcriber output changed:', transcriber.output); // Debug log
    if (transcriber.output && transcriber.output.text) {
      handleTranscriptionUpdate(transcriber.output.text);
    }
  }, [transcriber.output, handleTranscriptionUpdate]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    onUpdateNote({ ...note, title: e.target.value });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onUpdateNote({ ...note, content: e.target.value });
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(content).then(() => {
      // Optional: Add a visual feedback that the text was copied
      const button = document.getElementById('copyButton');
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    });
  };

  return (
    <div className="note-editor">
      <input
        type="text"
        value={title}
        onChange={handleTitleChange}
        className="text-2xl font-bold mb-4 w-full p-2 border rounded"
        placeholder="Note Title"
      />
      <textarea
        value={content}
        onChange={handleContentChange}
        className="w-full h-64 p-2 border rounded mb-4"
        placeholder="Note Content"
      />
      <button
        id="copyButton"
        onClick={handleCopyToClipboard}
        className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 mb-4"
      >
        Copy Note
      </button>
      <div className="w-full flex flex-col my-2 p-4 max-h-[20rem] overflow-y-auto">
        <AudioManager transcriber={transcriber} />
        <Transcript transcript={transcriber.output?.text || ''} />
      </div>
    </div>
  );
};

export default NoteEditor;
