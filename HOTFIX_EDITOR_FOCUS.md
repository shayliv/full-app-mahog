# Hotfix: Rich Text Editor Focus Issue

## Issue
**Problem**: Rich text editor loses focus immediately when typing.

**Root Cause**: The component was updating `innerHTML` on every value change (including user typing), which caused the contentEditable div to lose focus and cursor position.

## Fix Applied

**File**: `frontend/src/components/RichTextEditor.tsx`

**Changes**:
1. Added `isUserTyping` ref to track whether change came from user input
2. Only update innerHTML when change is from external source (not user typing)
3. Set flag when user types, clear it after effect runs

**Code Change**:
```typescript
const isUserTyping = useRef(false);

useEffect(() => {
  // Only update innerHTML if the change came from outside (not from user typing)
  if (editorRef.current && !isUserTyping.current && editorRef.current.innerHTML !== value) {
    editorRef.current.innerHTML = value;
  }
  isUserTyping.current = false;
}, [value]);

const handleInput = () => {
  if (editorRef.current) {
    isUserTyping.current = true;
    onChange(editorRef.current.innerHTML);
  }
};
```

## Status
✅ **FIXED** - Editor now maintains focus while typing.

## How to Test
1. Open any form with rich text (discipline, medical, summaries)
2. Click in the text editor
3. Start typing
4. ✅ Focus should remain, text should appear normally
5. ✅ Formatting buttons should work
6. ✅ Cursor position should be maintained

## Related
This is a common React pattern for contentEditable elements - preventing re-renders from interfering with user input.
