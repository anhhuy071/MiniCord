import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';

export function useVoiceRoom(channelId: string | null, socket: Socket | null) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [error, setError] = useState<string | null>(null);

  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    Object.values(peersRef.current).forEach(peer => peer.close());
    peersRef.current = {};
    setRemoteStreams({});
    
    if (socket && channelId) {
      socket.emit('voice:leave', { channelId });
    }
  }, [socket, channelId]);

  useEffect(() => {
    if (!channelId || !socket) return;

    let isMounted = true;

    const initVoice = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        
        setLocalStream(stream);
        localStreamRef.current = stream;

        // Join the room after we have the mic
        socket.emit('voice:join', { channelId });

      } catch (err: any) {
        console.error("Failed to get local stream", err);
        setError("Microphone access denied or not found");
      }
    };

    initVoice();

    const createPeer = (targetSocketId: string, initiator: boolean) => {
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      peersRef.current[targetSocketId] = peer;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peer.addTrack(track, localStreamRef.current!);
        });
      }

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('voice:signal', {
            targetSocketId,
            signal: { type: 'candidate', candidate: event.candidate }
          });
        }
      };

      peer.ontrack = (event) => {
        setRemoteStreams(prev => ({
          ...prev,
          [targetSocketId]: event.streams[0]
        }));
      };

      if (initiator) {
        peer.createOffer().then(offer => {
          peer.setLocalDescription(offer);
          socket.emit('voice:signal', {
            targetSocketId,
            signal: { type: 'offer', offer }
          });
        });
      }

      return peer;
    };

    const handleRoomUsers = (existingUsers: string[]) => {
      existingUsers.forEach(userId => {
        createPeer(userId, true);
      });
    };

    const handleUserJoined = ({ socketId }: { socketId: string }) => {
      createPeer(socketId, false);
    };

    const handleUserLeft = ({ socketId }: { socketId: string }) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        delete newStreams[socketId];
        return newStreams;
      });
    };

    const handleSignal = async ({ fromSocketId, signal }: { fromSocketId: string, signal: any }) => {
      let peer = peersRef.current[fromSocketId];
      if (!peer) {
        peer = createPeer(fromSocketId, false);
      }

      if (signal.type === 'offer') {
        await peer.setRemoteDescription(new RTCSessionDescription(signal.offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('voice:signal', {
          targetSocketId: fromSocketId,
          signal: { type: 'answer', answer }
        });
      } else if (signal.type === 'answer') {
        await peer.setRemoteDescription(new RTCSessionDescription(signal.answer));
      } else if (signal.type === 'candidate') {
        await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    };

    socket.on('voice:room-users', handleRoomUsers);
    socket.on('voice:user-joined', handleUserJoined);
    socket.on('voice:user-left', handleUserLeft);
    socket.on('voice:signal', handleSignal);

    return () => {
      isMounted = false;
      socket.off('voice:room-users', handleRoomUsers);
      socket.off('voice:user-joined', handleUserJoined);
      socket.off('voice:user-left', handleUserLeft);
      socket.off('voice:signal', handleSignal);
      cleanup();
    };
  }, [channelId, socket, cleanup]);

  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return { localStream, remoteStreams, error, disconnect };
}
