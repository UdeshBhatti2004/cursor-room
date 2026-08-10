import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import { useDispatch, useSelector } from 'react-redux';
import { CollabProvider } from '../yjs/CollabProvider.js';
import { setConnectionStatus, setPeers } from '../store/slices/presenceSlice.js';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';

export default function CodeEditor({ roomId, language }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const token = useSelector((s) => s.auth.token);
  const providerRef = useRef(null);
  const [editorReady, setEditorReady] = useState(false);
  const editorRef = useRef(null);
  const bindingRef = useRef(null);

  // Connect to the room's Yjs document as soon as we know the roomId.
  useEffect(() => {
    const provider = new CollabProvider({
      url: WS_URL,
      roomId,
      token,
      onStatusChange: (status) => dispatch(setConnectionStatus(status))
    });
    providerRef.current = provider;

    provider.awareness.setLocalStateField('user', {
      name: user?.username || 'Anonymous',
      color: user?.color || '#7CFFB2'
    });

    const syncPeers = () => {
      const states = Array.from(provider.awareness.getStates().entries())
        .filter(([clientId]) => clientId !== provider.doc.clientID)
        .map(([clientId, state]) => ({ clientId, ...state.user }))
        .filter((p) => p.name);
      dispatch(setPeers(states));
    };
    provider.awareness.on('change', syncPeers);

    return () => {
      provider.awareness.off('change', syncPeers);
      bindingRef.current?.destroy();
      provider.destroy();
      dispatch(setConnectionStatus('disconnected'));
      dispatch(setPeers([]));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Bind Monaco to the shared Y.Text once both are ready.
  useEffect(() => {
    if (!editorReady || !providerRef.current) return;
    const provider = providerRef.current;
    const yText = provider.doc.getText('monaco');
    const model = editorRef.current.getModel();

    bindingRef.current = new MonacoBinding(
      yText,
      model,
      new Set([editorRef.current]),
      provider.awareness
    );

    return () => bindingRef.current?.destroy();
  }, [editorReady]);

  return (
    <div className="h-full w-full overflow-hidden rounded-2xl border border-border">
      <Editor
        height="100%"
        theme="vs-dark"
        language={language || 'javascript'}
        defaultValue=""
        options={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14,
          minimap: { enabled: false },
          smoothScrolling: true,
          padding: { top: 16 }
        }}
        onMount={(editor) => {
          editorRef.current = editor;
          setEditorReady(true);
        }}
      />
    </div>
  );
}
