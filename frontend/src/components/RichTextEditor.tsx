import React, { useRef, useEffect, useState } from 'react';
import './RichTextEditor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter text...',
  className = '',
  disabled = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const lastValueRef = useRef(value);

  // Only update innerHTML when value changes externally (not from our own input)
  useEffect(() => {
    if (editorRef.current && value !== lastValueRef.current) {
      const isCurrentlyFocused = document.activeElement === editorRef.current;

      // Save cursor position if focused
      let savedSelection: { start: number; end: number } | null = null;
      if (isCurrentlyFocused) {
        try {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            savedSelection = {
              start: range.startOffset,
              end: range.endOffset,
            };
          }
        } catch (e) {
          // Ignore selection errors
        }
      }

      // Update content
      editorRef.current.innerHTML = value || '';
      lastValueRef.current = value;

      // Restore cursor position if it was focused
      if (isCurrentlyFocused && savedSelection && editorRef.current.firstChild) {
        try {
          const selection = window.getSelection();
          const range = document.createRange();
          const textNode = editorRef.current.firstChild;
          range.setStart(textNode, Math.min(savedSelection.start, textNode.textContent?.length || 0));
          range.setEnd(textNode, Math.min(savedSelection.end, textNode.textContent?.length || 0));
          selection?.removeAllRanges();
          selection?.addRange(range);
        } catch (e) {
          // Ignore cursor restoration errors
        }
      }
    }
  }, [value]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newValue = e.currentTarget.innerHTML;
    lastValueRef.current = newValue;
    onChange(newValue);
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();

    // Trigger input event to update state
    if (editorRef.current) {
      const newValue = editorRef.current.innerHTML;
      lastValueRef.current = newValue;
      onChange(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      execCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
  };

  return (
    <div className={`rich-text-editor-container ${className}`}>
      {!disabled && (
        <div className="rich-text-toolbar">
          <button
            type="button"
            className="toolbar-btn"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand('bold');
            }}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand('italic');
            }}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand('underline');
            }}
            title="Underline (Ctrl+U)"
          >
            <u>U</u>
          </button>
          <div className="toolbar-separator" />
          <button
            type="button"
            className="toolbar-btn"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand('insertUnorderedList');
            }}
            title="Bullet List"
          >
            ☰
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand('insertOrderedList');
            }}
            title="Numbered List"
          >
            ≡
          </button>
          <div className="toolbar-separator" />
          <button
            type="button"
            className="toolbar-btn"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand('removeFormat');
            }}
            title="Clear Formatting"
          >
            ✕
          </button>
        </div>
      )}
      <div
        ref={editorRef}
        className={`rich-text-editor ${isFocused ? 'focused' : ''} ${disabled ? 'disabled' : ''}`}
        contentEditable={!disabled}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        dir="auto"
        suppressContentEditableWarning
      />
    </div>
  );
};

export default RichTextEditor;
