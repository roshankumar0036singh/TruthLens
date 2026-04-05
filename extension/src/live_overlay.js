/**
 * @title Live Stream Truth Overlay (V2)
 * @dev Injects a real-time verification layer for YouTube and Twitch live streams.
 * Captures tab audio, transcribes via Gemini Flash, and renders live fact-checks.
 */

class LiveTruthOverlay {
    constructor() {
        this.overlayRoot = null;
        this.ws = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isTracking = false;
    }

    init() {
        console.log("[TruthLens] Live Overlay v2.0 Operational.");
        this.createUI();
        this.connectWS();
    }

    createUI() {
        const root = document.createElement("div");
        root.id = "truthlens-live-overlay";
        root.style.cssText = `
            position: fixed;
            background: rgba(10, 10, 10, 0.9);
            border: 1px solid rgba(255,255,255,0.1);
            border-top: 2px solid #10b981;
            padding: 20px;
            color: white;
            z-index: 999999;
            bottom: 40px;
            right: 40px;
            width: 380px;
            border-radius: 24px;
            font-family: 'Inter', system-ui, sans-serif;
            backdrop-filter: blur(20px);
            box-shadow: 0 20px 50px rgba(0,0,0,0.8);
            transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        `;
        
        root.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #10b981; letter-spacing: 0.2em;">
                    TruthLens :: Live Signal
                </div>
                <button id="start-live-tracking" style="background: #10b981; border: none; color: black; font-size: 9px; font-weight: 900; padding: 6px 12px; border-radius: 8px; cursor: pointer; text-transform: uppercase;">
                    Start Tracking
                </button>
            </div>
            
            <div id="live-transcription" style="font-size: 14px; font-weight: 600; margin-bottom: 20px; line-height: 1.5; color: #9ca3af; min-height: 40px;">
                Awaiting audio synchronization...
            </div>

            <div id="live-feed-container" style="display: flex; flex-direction: column; gap: 10px;">
                <!-- Live verifications pulse in here -->
            </div>

            <div id="live-status" style="margin-top: 20px; font-size: 9px; font-weight: 800; color: #374151; text-transform: uppercase; border-top: 1px solid rgba(255,255,255,0.05); pt-15px; padding-top: 15px;">
                Node: Offline
            </div>
        `;
        
        document.body.appendChild(root);
        this.overlayRoot = root;

        root.querySelector("#start-live-tracking").onclick = () => this.toggleTracking();
    }

    async toggleTracking() {
        if (this.isTracking) {
            this.stopAudioCapture();
        } else {
            await this.startAudioCapture();
        }
    }

    async startAudioCapture() {
        try {
            // Use getDisplayMedia to capture system/tab audio
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true, // Required for most browsers to show the picker
                audio: true
            });

            const audioTrack = stream.getAudioTracks()[0];
            if (!audioTrack) {
                alert("No audio track selected. Please check 'Share system audio'.");
                stream.getTracks().forEach(t => t.stop());
                return;
            }

            this.mediaRecorder = new MediaRecorder(new MediaStream([audioTrack]));
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.sendAudioChunk(e.data);
            };

            // Slice audio every 5 seconds for Gemini processing
            this.mediaRecorder.start(5000);
            
            this.isTracking = true;
            this.updateTrackingUI(true);
            console.log("[TruthLens] Live Audio Capture Started.");
        } catch (err) {
            console.error("Capture failed:", err);
            alert("Live tracking requires audio capture permissions.");
        }
    }

    stopAudioCapture() {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(t => t.stop());
        }
        this.isTracking = false;
        this.updateTrackingUI(false);
    }

    updateTrackingUI(active) {
        const btn = this.overlayRoot.querySelector("#start-live-tracking");
        const status = this.overlayRoot.querySelector("#live-status");
        if (active) {
            btn.innerHTML = "Stop Tracking";
            btn.style.background = "#ef4444";
            status.innerHTML = "Node: Active [Streaming Audio]";
            status.style.color = "#10b981";
        } else {
            btn.innerHTML = "Start Tracking";
            btn.style.background = "#10b981";
            status.innerHTML = "Node: Idling";
            status.style.color = "#374151";
        }
    }

    async sendAudioChunk(blob) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        // Convert blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64Audio = reader.result.split(',')[1];
            this.ws.send(json.stringify({ audio: base64Audio }));
        };
    }

    connectWS() {
        this.ws = new WebSocket("ws://localhost:8000/api/v1/ws/live-verify");
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleLiveUpdate(data);
        };

        this.ws.onclose = () => {
            setTimeout(() => this.connectWS(), 3000); // Auto-reconnect
        };
    }

    handleLiveUpdate(data) {
        const transcriptionEl = this.overlayRoot.querySelector("#live-transcription");
        const feedContainer = this.overlayRoot.querySelector("#live-feed-container");

        if (data.type === "transcription") {
            transcriptionEl.innerHTML = `"${data.text}"`;
            transcriptionEl.style.color = "white";
        }

        if (data.type === "verification_update") {
            let claimRow = document.getElementById(`claim-${btoa(data.claim).substring(0, 8)}`);
            
            if (!claimRow) {
                claimRow = document.createElement("div");
                claimRow.id = `claim-${btoa(data.claim).substring(0, 8)}`;
                claimRow.style.cssText = `
                    padding: 12px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 12px;
                    font-size: 11px;
                    border: 1px solid rgba(255,255,255,0.05);
                `;
                feedContainer.prepend(claimRow);
            }

            if (data.status === "processing") {
                claimRow.innerHTML = `<span style="color: #60a5fa; font-weight: 800;">[${data.agent}]</span> Investigating...`;
            } else if (data.status === "completed") {
                const verdictColor = data.verdict.verdict === "FALSE" ? "#ef4444" : "#10b981";
                claimRow.innerHTML = `
                    <div style="font-weight: 800; color: ${verdictColor}; margin-bottom: 4px;">VERDICT: ${data.verdict.verdict}</div>
                    <div style="color: #9ca3af; font-size: 10px;">${data.verdict.human_explanation}</div>
                `;
                claimRow.style.borderLeft = `3px solid ${verdictColor}`;
            }
        }
    }
}

// Bootstrap
if (window.location.host.includes("youtube.com") || window.location.host.includes("twitch.tv")) {
    const overlay = new LiveTruthOverlay();
    overlay.init();
}
