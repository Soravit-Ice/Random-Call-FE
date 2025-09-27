import { useEffect, useRef, useState } from "react";

export function useCall() {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  async function preparePeer(iceServers) {
    const pc = new RTCPeerConnection({ iceServers });

    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    localStreamRef.current = stream;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    pcRef.current = pc;
    return pc;
  }

  function setRemoteVolume(value) {
    if (remoteAudioRef.current) remoteAudioRef.current.volume = value;
    setVolume(value);
  }

  function toggleMute() {
    if (!localStreamRef.current) return;
    const [audioTrack] = localStreamRef.current.getAudioTracks();
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setMuted(!audioTrack.enabled);
  }

  function hangup() {
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    pcRef.current = null;
    localStreamRef.current = null;
    setMuted(false);
  }

  useEffect(() => () => hangup(), []);

  return {
    pcRef,
    localStreamRef,
    remoteAudioRef,
    preparePeer,
    setRemoteVolume,
    toggleMute,
    muted,
    volume,
    hangup
  };
}
