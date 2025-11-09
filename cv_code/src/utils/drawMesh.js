import { TRIANGULATION } from "./triangulation";

let SHOW_MESH = true;
let SHOW_TAG_NUMBERS = true;
let DRAW_DIRECTION = true;

export const drawMesh = (prediction, ctx) => {
  // Read UI toggles (checkboxes in App)
  const meshBox = document.getElementById("show-mesh");
  const tagsBox = document.getElementById("show-tags");
  const dirBox = document.getElementById("show-dir");
  if (meshBox) SHOW_MESH = meshBox.checked;
  if (tagsBox) SHOW_TAG_NUMBERS = tagsBox.checked;
  if (dirBox) DRAW_DIRECTION = dirBox.checked;

  if (!prediction) {
    // Clear when no face (optional)
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    return;
  }

  const keyPoints = prediction.keypoints;
  if (!keyPoints || keyPoints.length === 0) return;

  // Clear the frame
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  drawFaceMesh(ctx, keyPoints, SHOW_TAG_NUMBERS, SHOW_MESH);
  if (DRAW_DIRECTION) {
    drawNoseHelper(ctx, keyPoints);
  }
};

// Small visual showing the nose tip & eye midpoint
function drawNoseHelper(ctx, keyPoints) {
  const noseTip = keyPoints[1];
  const leftEyeInner = keyPoints[133];
  const rightEyeInner = keyPoints[362];
  if (!noseTip || !leftEyeInner || !rightEyeInner) return;

  const eyeMid = {
    x: (leftEyeInner.x + rightEyeInner.x) / 2,
    y: (leftEyeInner.y + rightEyeInner.y) / 2,
  };

  ctx.beginPath();
  ctx.moveTo(eyeMid.x, eyeMid.y);
  ctx.lineTo(noseTip.x, noseTip.y);
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(noseTip.x, noseTip.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
}

function drawFaceMesh(ctx, keyPoints, writeTagNumbers, drawLines) {
  if (drawLines) drawMeshPaths(keyPoints, ctx);
  if (writeTagNumbers) {
    let index = 0;
    ctx.fillStyle = "black";
    ctx.font = "10px monospace";
    for (let keyPoint of keyPoints) {
      ctx.beginPath();
      ctx.arc(keyPoint.x, keyPoint.y, 1.5, 0, 3 * Math.PI);
      ctx.fill();
      ctx.fillText(index, keyPoint.x + 2, keyPoint.y - 2);
      index++;
    }
  }
}

function drawMeshPaths(keyPoints, ctx, off) {
  if (off) return;
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1;

  for (let i = 0; i < TRIANGULATION.length / 3; i++) {
    const points = [
      TRIANGULATION[i * 3],
      TRIANGULATION[i * 3 + 1],
      TRIANGULATION[i * 3 + 2],
    ].map((index) => keyPoints[index]);
    drawPath(ctx, points, true);
  }
}

function drawPath(ctx, points, closePath) {
  const region = new Path2D();
  region.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    region.lineTo(point.x, point.y);
  }
  if (closePath) region.closePath();
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.stroke(region);
}
