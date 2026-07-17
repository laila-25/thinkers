import { useEffect, useRef } from 'react';

const commands = [['bold', 'Bold'], ['italic', 'Italic'], ['insertUnorderedList', 'List']];

export default function RichTextEditor({ value, onChange }) {
  const editor = useRef(null);
  useEffect(() => {
    if (editor.current && editor.current.innerHTML !== (value || '')) editor.current.innerHTML = value || '';
  }, [value]);

  const run = command => {
    document.execCommand(command);
    editor.current?.focus();
    onChange(editor.current?.innerHTML || '');
  };

  return (
    <div className="rounded-xl border border-slate-300 overflow-hidden bg-white">
      <div className="flex gap-2 p-2 border-b bg-slate-50">
        {commands.map(([command, label]) => <button type="button" key={command} onClick={() => run(command)} className="px-3 py-1 rounded bg-white border text-sm">{label}</button>)}
      </div>
      <div ref={editor} contentEditable onInput={event => onChange(event.currentTarget.innerHTML)} className="min-h-48 p-4 outline-none prose max-w-none" />
    </div>
  );
}
