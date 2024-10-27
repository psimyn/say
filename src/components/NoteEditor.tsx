import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
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
  const editorRef = useRef<any>(null);

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
      const newContent = newTranscript.slice(lastTranscriptRef.current.length);
      const cleanedContent = cleanText(newContent);
      
      // Insert the new content at the cursor position or at the end
      if (editorRef.current) {
        const editor = editorRef.current;
        editor.execCommand('mceInsertContent', false, ' ' + cleanedContent);
        const updatedContent = editor.getContent();
        setContent(updatedContent);
        onUpdateNote({ ...note, content: updatedContent });
      }
      
      lastTranscriptRef.current = newTranscript;
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

  const handleEditorChange = (content: string) => {
    setContent(content);
    onUpdateNote({ ...note, content });
  };

  const handleCopyToClipboard = () => {
    if (editorRef.current) {
      // Get the HTML content
      const htmlContent = editorRef.current.getContent();
      // Get the text content
      const textContent = editorRef.current.getContent({format: 'text'});
      
      // Try to copy rich text first, fall back to plain text
      try {
        const clipboardData = new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([textContent], { type: 'text/plain' })
        });
        navigator.clipboard.write([clipboardData]).then(() => {
          const button = document.getElementById('copyButton');
          if (button) {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(() => {
              button.textContent = originalText;
            }, 2000);
          }
        });
      } catch (err) {
        // Fallback to plain text
        navigator.clipboard.writeText(textContent).then(() => {
          const button = document.getElementById('copyButton');
          if (button) {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(() => {
              button.textContent = originalText;
            }, 2000);
          }
        });
      }
    }
  };

  const getWordCount = (text: string) => {
    const strippedText = text.replace(/<[^>]*>/g, ' '); // Remove HTML tags
    return strippedText.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = (text: string) => {
    const strippedText = text.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return strippedText.length;
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
      
      <Editor
        apiKey='hs3cwcc85xer8s856zt0id82ropre2dgte3zc2p9gn82978o'
        onInit={(evt, editor) => editorRef.current = editor}
        value={content}
        onEditorChange={handleEditorChange}
        init={{
          height: 400,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px }',
          skin: 'oxide',
          statusbar: false
        }}
      />

      <button
        id="copyButton"
        onClick={handleCopyToClipboard}
        className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors mt-4 mb-4"
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
