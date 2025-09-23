export type FacingMode = "user" | "environment";

export async function listCameras(): Promise<MediaDeviceInfo[]> {
	try {
		// Permissions needed for device labels to be visible.
		await navigator.mediaDevices
			.getUserMedia({ video: true, audio: false })
			.then((s) => {
				s.getTracks().forEach((t) => t.stop());
			})
			.catch(() => {});
		const all = await navigator.mediaDevices.enumerateDevices();
		const vids = all.filter((d) => d.kind === "videoinput");
		return vids;
	} catch {
		return [];
	}
}

export function isBack(d: MediaDeviceInfo): boolean {
	const L = (d.label || "").toLowerCase();
	return d.kind === "videoinput" && (L.includes("back") || L.includes("rear"));
}

export function scoreBack(d: MediaDeviceInfo): number {
	const L = (d.label || "").toLowerCase();
	// Highest → lowest: wide(main), ultra wide, telephoto
	if (L.includes("wide angle") || (L.includes("wide") && !L.includes("ultra")))
		return 3;
	if (L.includes("ultra")) return 2;
	if (L.includes("tele")) return 1;
	return 0;
}

export async function startCameraStream(
	devices: MediaDeviceInfo[],
	facing: FacingMode,
	deviceId: string | null,
	videoRef: React.RefObject<HTMLVideoElement>
): Promise<MediaStream> {
	const backList = devices
		.filter(isBack)
		.sort((a, b) => scoreBack(b) - scoreBack(a));
	const mainBack = backList[0];

	// Request a stable, modest format to keep FPS up
	const base = {
		width: { ideal: 1280, max: 1280 },
		height: { ideal: 720, max: 720 },
		frameRate: { ideal: 30, max: 30 },
	} as const;

	const attempts: MediaStreamConstraints[] = deviceId
		? [
				{ video: { ...base, deviceId: { exact: deviceId } }, audio: false },
				{ video: { deviceId: { exact: deviceId } }, audio: false },
		  ]
		: [
				...(facing === "environment" && mainBack
					? [
							{
								video: { ...base, deviceId: { exact: mainBack.deviceId } },
								audio: false,
							},
					  ]
					: []),
				{ video: { ...base, facingMode: { exact: facing } }, audio: false },
				{ video: { ...base, facingMode: { ideal: facing } }, audio: false },
				{ video: { facingMode: facing }, audio: false },
				{ video: true, audio: false },
		  ];

	let lastErr: unknown;
	for (const c of attempts) {
		try {
			const s = await navigator.mediaDevices.getUserMedia(c);

			const video = videoRef.current!;
			video.srcObject = s;

			// Make autoplay robust on iOS
			video.muted = true;
			video.playsInline = true;
			video.setAttribute("muted", "");
			video.setAttribute("playsinline", "");
			video.setAttribute("autoplay", "");

			await new Promise<void>((resolve) => {
				const onCanPlay = () => {
					video.removeEventListener("canplay", onCanPlay);
					resolve();
				};
				video.addEventListener("canplay", onCanPlay);
			});
			await video.play();

			// Debug: confirm negotiated format
			const track = s.getVideoTracks()[0];
			console.log(
				"camera settings:",
				track.getSettings?.(),
				"label:",
				track.label
			);

			return s;
		} catch (e) {
			lastErr = e;
		}
	}
	throw lastErr;
}
