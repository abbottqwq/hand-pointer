import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import type { Point, SmoothingState } from "../utils/handTrackingUtils";
import { ema, normalize, SMOOTHING } from "../utils/handTrackingUtils";

const HAND_CONNECTIONS: [number, number][] = [
	// Thumb
	[0, 1],
	[1, 2],
	[2, 3],
	[3, 4],
	// Index
	[0, 5],
	[5, 6],
	[6, 7],
	[7, 8],
	// Middle
	[5, 9],
	[9, 10],
	[10, 11],
	[11, 12],
	// Ring
	[9, 13],
	[13, 14],
	[14, 15],
	[15, 16],
	// Pinky
	[13, 17],
	[17, 18],
	[18, 19],
	[19, 20],
	// Palm edge
	[0, 17],
];

interface DrawingContext {
	ctx: CanvasRenderingContext2D;
	dimensions: { W: number; H: number };
	videoFit: { dx: number; dy: number; dw: number; dh: number };
	mirror: boolean;
}

interface SmoothingStates {
	knuckle: SmoothingState;
	tip: SmoothingState;
	direction: SmoothingState;
}

export function drawHandTracking(
	context: DrawingContext,
	result: HandLandmarkerResult,
	smoothingStates: SmoothingStates
) {
	const { ctx, dimensions, videoFit, mirror } = context;
	const { dx, dy, dw, dh } = videoFit;

	const lms = result.landmarks?.[0];
	if (!lms) return;

	ctx.save();
	if (mirror) {
		ctx.translate(dimensions.W, 0);
		ctx.scale(-1, 1);
	}

	// Helper to map normalized hand-landmark coords into canvas pixels
	const toPx = (x: number, y: number): Point => ({
		x: dx + x * dw,
		y: dy + y * dh,
	});

	ctx.strokeStyle = "rgba(0, 200, 255, 0.95)";
	ctx.lineWidth = 3;
	ctx.lineCap = "round";
	for (const [a, b] of HAND_CONNECTIONS) {
		const pa = toPx(lms[a].x, lms[a].y);
		const pb = toPx(lms[b].x, lms[b].y);
		ctx.beginPath();
		ctx.moveTo(pa.x, pa.y);
		ctx.lineTo(pb.x, pb.y);
		ctx.stroke();
	}

	const landmarks = result.landmarks?.[0];
	if (!landmarks) {
		ctx.restore();
		return;
	}

	// Draw landmarks (optional)
	ctx.fillStyle = "rgba(255,0,0,0.9)";
	for (const p of landmarks) {
		const q = toPx(p.x, p.y);
		ctx.beginPath();
		ctx.arc(q.x, q.y, 3, 0, Math.PI * 2);
		ctx.fill();
	}

	// Index MCP (5) → Tip (8)
	const knuckleRaw = toPx(landmarks[5].x, landmarks[5].y);
	const tipRaw = toPx(landmarks[8].x, landmarks[8].y);

	const knuckleSmooth = ema(
		knuckleRaw,
		smoothingStates.knuckle,
		SMOOTHING.ENDPOINT
	);
	const tipSmooth = ema(tipRaw, smoothingStates.tip, SMOOTHING.ENDPOINT);

	// Draw short segment
	ctx.strokeStyle = "rgba(0,255,255,0.95)";
	ctx.lineWidth = 4;
	ctx.lineCap = "round";
	ctx.beginPath();
	ctx.moveTo(knuckleSmooth.x, knuckleSmooth.y);
	ctx.lineTo(tipSmooth.x, tipSmooth.y);
	ctx.stroke();

	// Draw endpoints
	ctx.fillStyle = "cyan";
	ctx.beginPath();
	ctx.arc(tipSmooth.x, tipSmooth.y, 6, 0, Math.PI * 2);
	ctx.fill();

	ctx.fillStyle = "rgba(0,255,255,0.7)";
	ctx.beginPath();
	ctx.arc(knuckleSmooth.x, knuckleSmooth.y, 5, 0, Math.PI * 2);
	ctx.fill();

	// Draw long laser
	const rawDirection = normalize(
		tipSmooth.x - knuckleSmooth.x,
		tipSmooth.y - knuckleSmooth.y
	);
	const directionSmooth = ema(
		rawDirection,
		smoothingStates.direction,
		SMOOTHING.DIRECTION
	);
	const directionNormalized = normalize(directionSmooth.x, directionSmooth.y);

	const laserLength = Math.hypot(dimensions.W, dimensions.H) * 1.5;
	const laserEnd = {
		x: knuckleSmooth.x + directionNormalized.x * laserLength,
		y: knuckleSmooth.y + directionNormalized.y * laserLength,
	};

	ctx.strokeStyle = "rgba(0,255,255,0.9)";
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.moveTo(knuckleSmooth.x, knuckleSmooth.y);
	ctx.lineTo(laserEnd.x, laserEnd.y);
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(laserEnd.x, laserEnd.y, 8, 0, Math.PI * 2);
	ctx.lineWidth = 2;
	ctx.strokeStyle = "rgba(0,255,255,0.9)";
	ctx.stroke();

	ctx.restore();
}
