export interface CanvasDimensions {
	W: number;
	H: number;
	cssW: number;
	cssH: number;
}

export function resizeCanvasToScreen(c: HTMLCanvasElement): CanvasDimensions {
	// CSS: fill viewport
	const cssW = window.innerWidth;
	const cssH = window.innerHeight;
	c.style.width = cssW + "px";
	c.style.height = cssH + "px";

	// Internal pixels: follow screen aspect, cap for perf (~720p budget)
	const MAXW = 1280,
		MAXH = 720;
	const scale = Math.min(MAXW / cssW, MAXH / cssH, 1);
	const W = Math.max(1, Math.round(cssW * scale));
	const H = Math.max(1, Math.round(cssH * scale));
	c.width = W;
	c.height = H;

	const ctx = c.getContext("2d")!;
	ctx.setTransform(1, 0, 0, 1, 0, 0); // no global scaling
	ctx.imageSmoothingEnabled = false; // crisper + a tad faster
	return { W, H, cssW, cssH };
}

export type FitMode = "cover" | "contain";

export function computeFitRect(
	srcW: number,
	srcH: number,
	dstW: number,
	dstH: number,
	mode: FitMode
) {
	const sx = dstW / srcW,
		sy = dstH / srcH;
	const s = mode === "cover" ? Math.max(sx, sy) : Math.min(sx, sy);
	const dw = Math.round(srcW * s),
		dh = Math.round(srcH * s);
	const dx = Math.round((dstW - dw) / 2),
		dy = Math.round((dstH - dh) / 2);
	return { dx, dy, dw, dh };
}

export function calculateVideoCoverFit(
	vw: number,
	vh: number,
	cw: number,
	ch: number
) {
	return computeFitRect(vw, vh, cw, ch, "cover"); // switch to "contain" if you prefer letterbox
}
