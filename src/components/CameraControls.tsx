import type { FacingMode } from "../utils/cameraUtils";
import { tw } from "../utils/tw";

interface CameraControlsProps {
	facing: FacingMode;
	devices: MediaDeviceInfo[];
	deviceId: string | null;
	onToggleFacing: () => void;
	onDeviceChange: (deviceId: string | null) => void;
}

export default function CameraControls({
	facing,
	devices,
	deviceId,
	onToggleFacing,
	onDeviceChange,
}: CameraControlsProps) {
	const isUsingFrontCamera = facing === "user";
	const hasMultipleDevices = devices.length > 0;

	return (
		<div
			className={tw(
				"fixed left-4 right-4 z-10 flex justify-between gap-2",
				"bottom-[calc(env(safe-area-inset-bottom)+12px)]"
			)}
		>
			<button
				onClick={onToggleFacing}
				className={tw(
					"px-3 py-2 rounded-[10px] border-none",
					"bg-black/50 text-white backdrop-blur-sm",
					"hover:bg-black/70 transition-colors",
					isUsingFrontCamera && "ring-2 ring-blue-500/50"
				)}
			>
				Switch Camera ({isUsingFrontCamera ? "Front" : "Back"})
			</button>

			{hasMultipleDevices && (
				<select
					value={deviceId ?? ""}
					onChange={(e) => onDeviceChange(e.target.value || null)}
					title="Pick a specific camera (optional)"
					className={tw(
						"px-3 py-2 rounded-[10px] border-none",
						"bg-black/50 text-white backdrop-blur-sm",
						"hover:bg-black/70 transition-colors",
						deviceId && "ring-2 ring-green-500/50"
					)}
				>
					<option value="">Auto ({facing})</option>
					{devices.map((d) => (
						<option key={d.deviceId} value={d.deviceId}>
							{d.label || `Camera ${d.deviceId.slice(0, 6)}…`}
						</option>
					))}
				</select>
			)}
		</div>
	);
}
