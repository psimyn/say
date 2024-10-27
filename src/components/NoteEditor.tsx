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

  const cleanText = (text: string) => {
    return text
      .replace(/\s+/g, ' ')
      .replace(/([.,!?])([^\s])/g, '$1 $2')
      .replace(/\s+([.,!?])/g, '$1')
      .trim();
  };

  const handleTranscriptionUpdate = useCallback((newTranscript: string) => {
    if (newTranscript !== lastTranscriptRef.current) {
      console.log('New transcript received:', newTranscript);
      setContent(prevContent => {
        const newContent = newTranscript.slice(lastTranscriptRef.current.length);
        const cleanedContent = cleanText(newContent);
        const updatedContent = prevContent + (prevContent ? ' ' : '') + cleanedContent;
        console.log('Updated content:', updatedContent);
        onUpdateNote({ ...note, content: updatedContent });
        lastTranscriptRef.current = newTranscript;
        return updatedContent;
      });
    }
  }, [note, onUpdateNote]);

  useEffect(() => {
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

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = (text: string) => {
    return text.length;
  };

  return (
    <div className="note-editor">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="text-2xl font-bold w-2/3 p-2 border rounded"
          placeholder="Note Title"
        />
        <div className="text-sm text-gray-500 space-y-1">
          <div>Words: {getWordCount(content)}</div>
          <div>Characters: {getCharacterCount(content)}</div>
        </div>
      </div>
      <textarea
        value={content}
        onChange={handleContentChange}
        className="w-full h-64 p-2 border rounded mb-4"
        placeholder="Note Content"
      />
      <button
        id="copyButton"
        onClick={handleCopyToClipboard}
        className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 mb-4 transition-colors"
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
