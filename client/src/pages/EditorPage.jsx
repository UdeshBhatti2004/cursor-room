import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import CodeEditor from '../components/CodeEditor.jsx';
import RoomSidebar from '../components/RoomSidebar.jsx';
import { joinRoom } from '../store/slices/roomSlice.js';

export default function EditorPage() {
  const { roomId } = useParams();
  const dispatch = useDispatch();
  const [room, setRoom] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { connectionStatus, peers } = useSelector((s) => s.presence);
  const user = useSelector((s) => s.auth.user);

  useEffect(() => {
    dispatch(joinRoom(roomId)).then((res) => {
      if (joinRoom.fulfilled.match(res)) setRoom(res.payload);
    });
  }, [dispatch, roomId]);

  return (
    <div className="relative flex h-screen overflow-hidden bg-base">
      <RoomSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        room={room}
        roomId={roomId}
        connectionStatus={connectionStatus}
        peers={peers}
        self={user}
      />

      <main className="flex-1 p-4">
        {room && <CodeEditor roomId={roomId} language={room.language} />}
      </main>
    </div>
  );
}
