import { useEffect, useRef, useState } from "react";
import {
	FilesetResolver,
	HandLandmarker,
	type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { FacingMode } from "../utils/cameraUtils";
import { listCameras, startCameraStream } from "../utils/cameraUtils";
import {
	resizeCanvasToScreen,
	calculateVideoCoverFit,
} from "../utils/canvasUtils";
import { createSmoothingState } from "../utils/handTrackingUtils";
import { drawHandTracking } from "../utils/drawingUtils";

export function useHandTracking() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const [facing, setFacing] = useState<FacingMode>("environment");
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
	const [deviceId, setDeviceId] = useState<string | null>(null);
	const streamRef = useRef<MediaStream | null>(null);

	useEffect(() => {
		let handLandmarker: HandLandmarker | null = null;
		let animationFrameId = 0;
		let cancelVideoCallback = false;

		// EMA smoothing states
		const smoothingStates = {
			knuckle: createSmoothingState(),
			tip: createSmoothingState(),
			direction: createSmoothingState(),
		};

		let canvasDimensions = { W: 0, H: 0 };

		async function initializeHandTracking() {
			// Initialize MediaPipe Hand Landmarker
			const vision = await FilesetResolver.forVisionTasks(
				"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
			);
			const landmarker = await HandLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath:
						"https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task",
				},
				runningMode: "VIDEO",
				numHands: 1,
			});
			handLandmarker = landmarker;

			// Get available cameras
			const availableDevices = await listCameras();
			setDevices(availableDevices);

			// Stop previous stream if any
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((t) => t.stop());
				streamRef.current = null;
			}

			// Start camera stream
			if (!videoRef.current) throw new Error("Video element not available");

			const stream = await startCameraStream(
				availableDevices,
				facing,
				deviceId,
				videoRef as React.RefObject<HTMLVideoElement>
			);
			streamRef.current = stream;

			// Auto-recover if track stops
			stream.getVideoTracks().forEach((track) => {
				track.onended = () => initializeHandTracking().catch(console.warn);
			});

			// Update device list after getting permissions
			const updatedDevices = await navigator.mediaDevices.enumerateDevices();
			setDevices(updatedDevices.filter((d) => d.kind === "videoinput"));

			// Canvas setup
			const canvas = canvasRef.current!;
			const onResize = () => {
				canvasDimensions = resizeCanvasToScreen(canvas);
			};
			canvasDimensions = resizeCanvasToScreen(canvas);
			window.addEventListener("resize", onResize);

			const draw = () => {
				if (!handLandmarker || !videoRef.current) return;

				const video = videoRef.current;
				// Skip until HAVE_CURRENT_DATA
				if (video.readyState < 2) return;

				const result: HandLandmarkerResult = handLandmarker.detectForVideo(
					video,
					performance.now()
				);

				const ctx = canvas.getContext("2d")!;

				// Determine if we should mirror (front camera)
				const currentFacingMode =
					streamRef.current?.getVideoTracks()[0]?.getSettings()?.facingMode ||
					facing;
				const mirror = currentFacingMode === "user";

				// Calculate video cover fit
				const videoWidth = video.videoWidth || canvasDimensions.W;
				const videoHeight = video.videoHeight || canvasDimensions.H;
				const videoFit = calculateVideoCoverFit(
					videoWidth,
					videoHeight,
					canvasDimensions.W,
					canvasDimensions.H
				);

				// Clear and draw video background
				ctx.clearRect(0, 0, canvasDimensions.W, canvasDimensions.H);
				ctx.save();
				if (mirror) {
					ctx.translate(canvasDimensions.W, 0);
					ctx.scale(-1, 1);
				}
				ctx.drawImage(
					video,
					videoFit.dx,
					videoFit.dy,
					videoFit.dw,
					videoFit.dh
				);
				ctx.restore();

				// Draw hand tracking overlay
				drawHandTracking(
					{
						ctx,
						dimensions: canvasDimensions,
						videoFit,
						mirror,
					},
					result,
					smoothingStates
				);
			};

			// Use requestVideoFrameCallback if available, otherwise requestAnimationFrame
			const video = videoRef.current;
			const hasVideoFrameCallback =
				video && "requestVideoFrameCallback" in video;

			if (hasVideoFrameCallback) {
				const videoCallback = () => {
					if (cancelVideoCallback) return;
					draw();
					(
						video as HTMLVideoElement & {
							requestVideoFrameCallback: (cb: () => void) => void;
						}
					).requestVideoFrameCallback(videoCallback);
				};
				(
					video as HTMLVideoElement & {
						requestVideoFrameCallback: (cb: () => void) => void;
					}
				).requestVideoFrameCallback(videoCallback);
			} else {
				const animationLoop = () => {
					draw();
					animationFrameId = requestAnimationFrame(animationLoop);
				};
				animationFrameId = requestAnimationFrame(animationLoop);
			}

			return () => {
				window.removeEventListener("resize", onResize);
			};
		}

		initializeHandTracking().catch(console.error);

		return () => {
			cancelVideoCallback = true;
			cancelAnimationFrame(animationFrameId);
			streamRef.current?.getTracks().forEach((t) => {
				t.stop();
			});
			handLandmarker?.close();
		};
	}, [facing, deviceId]);

	const toggleFacing = () => {
		setDeviceId(null); // clear specific device, use facingMode
		setFacing((prev) => (prev === "user" ? "environment" : "user"));
	};

	return {
		videoRef,
		canvasRef,
		facing,
		devices,
		deviceId,
		setDeviceId,
		toggleFacing,
	};
}
