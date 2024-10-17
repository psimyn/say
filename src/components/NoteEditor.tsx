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
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onUpdateNote, transcriber }) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isRecording, setIsRecording] = useState(false);
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

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      console.log('Starting recording'); // Debug log
      lastTranscriptRef.current = ''; // Reset the last transcript
      transcriber.start(undefined); // You might need to pass the correct AudioBuffer here
    } else {
      console.log('Stopping recording'); // Debug log
      // There's no stop method in the Transcriber interface, so you might need to handle this differently
    }
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
      <div className="flex items-center mb-4">
        <button
          onClick={toggleRecording}
          className={`px-4 py-2 rounded ${
            isRecording ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
          }`}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        {isRecording && <span className="ml-2 text-red-500">Recording...</span>}
      </div>
      <AudioManager transcriber={transcriber} />
      <Transcript transcript={transcriber.output?.text || ''} />
    </div>
  );
};

export default NoteEditor;
