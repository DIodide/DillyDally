import React, { useRef, useState, useEffect } from "react";
import "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/face_mesh";
import Webcam from "react-webcam";

import { runDetector } from "./utils/detector";

const inputResolution = { width: 730, height: 640 };
const videoConstraints = {
  width: inputResolution.width,
  height: inputResolution.height,
  facingMode: "user",
};

function App() {
  const canvasRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [mesh, setMesh] = useState(false);
  const [tags, setTags] = useState(false);
  const [dir, setDir] = useState(true); // draw direction overlays
  const [status, setStatus] = useState("—");
  const [confidence, setConfidence] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    // Keep checkboxes in sync with drawMesh.js (it reads DOM ids)
    const m = document.getElementById("show-mesh");
    const t = document.getElementById("show-tags");
    const d = document.getElementById("show-dir");
    if (m) m.checked = mesh;
    if (t) t.checked = tags;
    if (d) d.checked = dir;
  }, [mesh, tags, dir]);

  const handleVideoLoad = async () => {
    const video = videoRef.current?.video;
    if (!video) return;
    if (video.readyState !== 4 || loaded) return;

    await runDetector(video, canvasRef.current, (result) => {
      // result = { state, confidence, yaw, pitch, roll } from classify.js
      if (result) {
        setStatus(result.state);
        setConfidence(result.confidence ?? 0);
        setYaw(result.yaw ?? 0);
        setPitch(result.pitch ?? 0);
        setRoll(result.roll ?? 0);
      }
    });
    setLoaded(true);
  };

  const handleRecalibrate = () => {
    // Broadcast a simple DOM event that classify.js listens for
    window.dispatchEvent(new Event("recalibrate-attention"));
  };

  return (
    <div className="container">
      <h1>Face Attention Demo</h1>

      <div className="controls">
        <label>
          <input
            type="checkbox"
            id="show-mesh"
            checked={mesh}
            onChange={() => setMesh((v) => !v)}
          />{" "}
          Show Mesh
        </label>
        <label>
          <input
            type="checkbox"
            id="show-tags"
            checked={tags}
            onChange={() => setTags((v) => !v)}
          />{" "}
          Show Index Tags
        </label>
        <label>
          <input
            type="checkbox"
            id="show-dir"
            checked={dir}
            onChange={() => setDir((v) => !v)}
          />{" "}
          Show Direction
        </label>

        <button className="recal" onClick={handleRecalibrate}>
          Recalibrate (center gaze)
        </button>
      </div>

      <div className="stage">
        {!loaded ? <header>Loading model…</header> : null}

        <Webcam
          ref={videoRef}
          width={inputResolution.width}
          height={inputResolution.height}
          videoConstraints={videoConstraints}
          onLoadedData={handleVideoLoad}
          style={{ visibility: "hidden", position: "absolute" }}
          mirrored // so left/right feel natural
        />

        <canvas
          ref={canvasRef}
          width={inputResolution.width}
          height={inputResolution.height}
          style={{ position: "absolute", border: "1px solid #ddd" }}
        />
      </div>

      <div className="readout">
        <div>
          <strong>Status:</strong> {status}{" "}
          <span className="muted">(confidence {Math.round(confidence * 100)}%)</span>
        </div>
        <div className="angles">
          <span>yaw: {yaw.toFixed(2)}</span>
          <span>pitch: {pitch.toFixed(2)}</span>
          <span>roll: {roll.toFixed(2)}</span>
        </div>
        <p className="hint">
          Tip: sit centered, look at the screen for a couple seconds after pressing
          “Recalibrate” so the baseline can settle.
        </p>
      </div>
    </div>
  );
}

export default App;
