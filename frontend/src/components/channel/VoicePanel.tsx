import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { useVoiceRoom } from "../../hooks/useVoiceRoom";

type VoicePanelProps = {
  channelId: string;
  channelName: string;
  socket: Socket | null;
  onDisconnect: () => void;
};

// Component to render a single remote audio stream
function RemoteAudio({ stream, socketId }: { stream: MediaStream; socketId: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(err => {
        console.error("Audio playback failed:", err);
      });
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline />;
}

export default function VoicePanel({ channelId, channelName, socket, onDisconnect }: VoicePanelProps) {
  const { localStream, remoteStreams, error, disconnect } = useVoiceRoom(channelId, socket);

  const handleDisconnect = () => {
    disconnect();
    onDisconnect();
  };

  return (
    <div className="voice-panel" style={{ display: 'block', marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
      {error && <div style={{ color: 'var(--danger)', fontSize: '12px', marginBottom: '8px' }}>{error}</div>}
      
      <div className="voice-status">
        <div className="voice-indicator" style={{ background: localStream ? 'var(--success)' : 'var(--warning)' }} />
        <div>
          <p className="voice-title">Voice Connected</p>
          <p className="voice-subtitle">{channelName} / MiniCord</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
        <span>Peers: {Object.keys(remoteStreams).length}</span>
      </div>

      {Object.entries(remoteStreams).map(([socketId, stream]) => (
        <RemoteAudio key={socketId} socketId={socketId} stream={stream} />
      ))}

      <button className="voice-action" onClick={handleDisconnect}>
        <i className="fa-solid fa-phone-slash" style={{ marginRight: '6px' }} /> Disconnect
      </button>
    </div>
  );
}
