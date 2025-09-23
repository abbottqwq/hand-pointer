export interface Point {
	x: number;
	y: number;
}

export interface SmoothingState extends Point {
	init: boolean;
}

export function normalize(x: number, y: number): Point {
	const l = Math.hypot(x, y) || 1;
	return { x: x / l, y: y / l };
}

export function ema(pt: Point, state: SmoothingState, alpha: number): Point {
	if (!state.init) {
		state.x = pt.x;
		state.y = pt.y;
		state.init = true;
	} else {
		state.x = alpha * state.x + (1 - alpha) * pt.x;
		state.y = alpha * state.y + (1 - alpha) * pt.y;
	}
	return { x: state.x, y: state.y };
}

export function createSmoothingState(): SmoothingState {
	return { x: 0, y: 0, init: false };
}

// Smoothing constants
export const SMOOTHING = {
	ENDPOINT: 0.4, // higher = smoother, slower
	DIRECTION: 0.5,
} as const;
