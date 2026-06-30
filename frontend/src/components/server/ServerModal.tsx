import { useState } from "react";
import Modal from "../common/Modal";
import { fetchApi } from "../../services/api";
import type { Server } from "../../types/types";

type ServerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (server: Server) => void;
};

export default function ServerModal({ isOpen, onClose, onSuccess }: ServerModalProps) {
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  
  // Create state
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  
  // Join state
  const [serverId, setServerId] = useState("");
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetState = () => {
    setName("");
    setImageUrl("");
    setServerId("");
    setError("");
    setIsLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Server name is required");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const newServer = await fetchApi<Server>("/servers", {
        method: "POST",
        body: JSON.stringify({ name, imageUrl }),
      });
      onSuccess(newServer);
      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to create server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverId.trim()) {
      setError("Server ID is required");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      // API returns a ServerMember for join, but we might want the server data.
      // Usually, after join, we just refresh the server list in AppLayout.
      // We will pass a minimal mock server with the ID so AppLayout knows to refresh.
      await fetchApi(`/servers/${serverId}/join`, {
        method: "POST",
      });
      // We don't have the full server object from the join endpoint (it returns a member),
      // but we can signal success to the parent layout to refresh the server list.
      onSuccess({ id: serverId, name: "Joined Server", channels: [], members: [] } as any);
      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to join server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Customize your server">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button 
          type="button"
          onClick={() => setActiveTab("create")}
          style={{
            flex: 1,
            padding: '8px',
            background: activeTab === "create" ? 'var(--text-primary)' : 'transparent',
            color: activeTab === "create" ? 'var(--bg-deep)' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === "create" ? 'var(--text-primary)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
          }}
        >
          Create
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab("join")}
          style={{
            flex: 1,
            padding: '8px',
            background: activeTab === "join" ? 'var(--text-primary)' : 'transparent',
            color: activeTab === "join" ? 'var(--bg-deep)' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === "join" ? 'var(--text-primary)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
          }}
        >
          Join
        </button>
      </div>

      {activeTab === "create" ? (
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="glass-label">
              Server Name {error && <span className="error"> - {error}</span>}
            </label>
            <input
              type="text"
              className="glass-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My awesome server"
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label className="glass-label">Image URL (Optional)</label>
            <input
              type="text"
              className="glass-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              disabled={isLoading}
            />
          </div>
          <button type="submit" className="glass-btn" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleJoin}>
          <div className="form-group">
            <label className="glass-label">
              Server ID {error && <span className="error"> - {error}</span>}
            </label>
            <input
              type="text"
              className="glass-input"
              value={serverId}
              onChange={(e) => setServerId(e.target.value)}
              placeholder="Paste the server ID here"
              disabled={isLoading}
            />
          </div>
          <button type="submit" className="glass-btn" disabled={isLoading}>
            {isLoading ? "Joining..." : "Join Server"}
          </button>
        </form>
      )}
    </Modal>
  );
}
