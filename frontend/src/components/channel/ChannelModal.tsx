import { useState } from "react";
import Modal from "../common/Modal";
import { fetchApi } from "../../services/api";
import type { Channel } from "../../types/types";

type ChannelModalProps = {
  isOpen: boolean;
  onClose: () => void;
  serverId: string;
  onSuccess: (channel: Channel) => void;
};

export default function ChannelModal({ isOpen, onClose, serverId, onSuccess }: ChannelModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"TEXT" | "VOICE">("TEXT");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetState = () => {
    setName("");
    setType("TEXT");
    setError("");
    setIsLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Channel name is required");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const newChannel = await fetchApi<Channel>(`/servers/${serverId}/channels`, {
        method: "POST",
        body: JSON.stringify({ name: name.toLowerCase().replace(/\s+/g, '-'), type }),
      });
      onSuccess(newChannel);
      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to create channel");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Channel">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="glass-label">Channel Type</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button 
              type="button"
              onClick={() => setType("TEXT")}
              style={{
                flex: 1,
                padding: '12px',
                background: type === "TEXT" ? 'var(--bg-raised)' : 'transparent',
                color: 'var(--text-primary)',
                border: `1px solid ${type === "TEXT" ? 'var(--text-primary)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-hashtag"></i> Text
            </button>
            <button 
              type="button"
              onClick={() => setType("VOICE")}
              style={{
                flex: 1,
                padding: '12px',
                background: type === "VOICE" ? 'var(--bg-raised)' : 'transparent',
                color: 'var(--text-primary)',
                border: `1px solid ${type === "VOICE" ? 'var(--text-primary)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-volume-high"></i> Voice
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="glass-label">
            Channel Name {error && <span className="error"> - {error}</span>}
          </label>
          <div style={{ position: 'relative' }}>
            <i 
              className={`fa-solid ${type === 'TEXT' ? 'fa-hashtag' : 'fa-volume-high'}`} 
              style={{ 
                position: 'absolute', 
                left: '16px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)'
              }} 
            />
            <input
              type="text"
              className="glass-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="new-channel"
              style={{ paddingLeft: '40px' }}
              disabled={isLoading}
            />
          </div>
        </div>
        
        <button type="submit" className="glass-btn" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Channel"}
        </button>
      </form>
    </Modal>
  );
}
