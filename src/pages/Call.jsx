import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { useCallState } from "../state/store.js";
import { useCall } from "../hooks/useCall.js";
import CallControls from "../components/CallControls.jsx";
import VolumeSlider from "../components/VolumeSlider.jsx";
import Avatar from "../components/Avatar.jsx";
import StatusIndicator from "../components/StatusIndicator.jsx";

export default function Call({ navigate, socket }) {
  const callState = useCallState();
  const resetCall = useCallState((state) => state.reset);
  const {
    pcRef,
    remoteAudioRef,
    preparePeer,
    toggleMute,
    muted,
    volume,
    setRemoteVolume,
    hangup
  } = useCall();
  const [status, setStatus] = useState("Connecting...");
  const [elapsed, setElapsed] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState("good");

  useEffect(() => {
    if (!callState.inCall) navigate("/");
  }, [callState.inCall, navigate]);

  useEffect(() => {
    if (!callState.startedAt) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - callState.startedAt);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState.startedAt]);

  useEffect(() => {
    if (!socket || !callState.partner) return;

    let cancelled = false;

    const ensurePeer = async () => {
      if (pcRef.current) return pcRef.current;
      const peer = await preparePeer(callState.iceServers);
      
      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc:candidate", {
            to: callState.partner.id,
            candidate: event.candidate
          });
        }
      };
      
      peer.onconnectionstatechange = () => {
        const state = peer.connectionState;
        if (state === "connected") {
          setStatus("Connected");
          setConnectionQuality("good");
        } else if (state === "connecting") {
          setStatus("Connecting...");
          setConnectionQuality("connecting");
        } else if (state === "failed") {
          setStatus("Connection failed");
          setConnectionQuality("poor");
        } else if (state === "disconnected") {
          setStatus("Disconnected");
          setConnectionQuality("poor");
        }
      };

      // Monitor connection quality
      const statsInterval = setInterval(async () => {
        if (peer.connectionState === "connected") {
          try {
            const stats = await peer.getStats();
            // Simple quality assessment based on packet loss
            stats.forEach(report => {
              if (report.type === 'inbound-rtp' && report.packetsLost) {
                const lossRate = report.packetsLost / (report.packetsReceived + report.packetsLost);
                if (lossRate > 0.05) {
                  setConnectionQuality("poor");
                } else if (lossRate > 0.02) {
                  setConnectionQuality("fair");
                } else {
                  setConnectionQuality("good");
                }
              }
            });
          } catch (err) {
            console.error("Failed to get stats", err);
          }
        }
      }, 5000);

      return peer;
    };

    const handleOffer = async ({ from, sdp }) => {
      if (cancelled || from !== callState.partner.id) return;
      const peer = await ensurePeer();
      await peer.setRemoteDescription(sdp);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("webrtc:answer", { to: from, sdp: answer });
      setStatus("Answering call");
    };

    const handleAnswer = async ({ from, sdp }) => {
      if (cancelled || from !== callState.partner.id) return;
      const peer = await ensurePeer();
      await peer.setRemoteDescription(sdp);
      setStatus("Connected");
    };

    const handleCandidate = async ({ from, candidate }) => {
      if (cancelled || from !== callState.partner.id || !candidate) return;
      const peer = await ensurePeer();
      try {
        await peer.addIceCandidate(candidate);
      } catch (err) {
        console.error("Failed to add ICE candidate", err);
      }
    };

    const init = async () => {
      setStatus("Preparing audio...");
      const peer = await ensurePeer();

      if (callState.initiator) {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("webrtc:offer", { to: callState.partner.id, sdp: offer });
        setStatus("Calling...");
      } else {
        setStatus("Waiting for offer...");
      }
    };

    init();

    socket.on("webrtc:offer", handleOffer);
    socket.on("webrtc:answer", handleAnswer);
    socket.on("webrtc:candidate", handleCandidate);

    return () => {
      cancelled = true;
      socket.off("webrtc:offer", handleOffer);
      socket.off("webrtc:answer", handleAnswer);
      socket.off("webrtc:candidate", handleCandidate);
      hangup();
    };
  }, [socket, callState.partner?.id, callState.initiator, callState.roomId, callState.iceServers]);

  async function endCall() {
    try {
      socket?.emit("call:hangup", { to: callState.partner?.id });
      await api.post("/match/end", {
        partnerId: callState.partner?.id,
        callLogId: callState.callLogId
      });
    } catch (err) {
      console.error("Failed to end call", err);
    } finally {
      hangup();
      resetCall();
      navigate("/");
    }
  }

  const getStatusIndicator = () => {
    if (status === "Connected") return "in-call";
    if (status.includes("Connecting") || status.includes("Calling")) return "connecting";
    return "offline";
  };

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case "good":
        return (
          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      case "fair":
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <section className="panel call-card">
      <div className="text-center mb-8">
        <Avatar name={callState.partner?.displayName} size="lg" className="mx-auto mb-4" />
        <div className="call-partner mb-2">
          Talking with {callState.partner?.displayName}
        </div>
        <div className="flex items-center justify-center gap-4 mb-2">
          <StatusIndicator status={getStatusIndicator()} />
          <div className="flex items-center gap-2 text-sm text-slate-400">
            {getConnectionIcon()}
            <span className="capitalize">{connectionQuality} connection</span>
          </div>
        </div>
        <p className="call-status">{status}</p>
      </div>

      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="call-actions">
        <CallControls 
          muted={muted} 
          onToggleMute={toggleMute} 
          onHangup={endCall} 
          duration={elapsed} 
        />
        <VolumeSlider value={volume} onChange={setRemoteVolume} />
      </div>

      <div className="bg-white/5 p-4 rounded-xl text-center">
        <p className="text-sm text-slate-400 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Keep your conversation kind and report issues to our team
        </p>
      </div>
    </section>
  );
}
