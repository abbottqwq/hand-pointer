import { useHandTracking } from "./hooks/useHandTracking";
import CameraControls from "./components/CameraControls";
import { tw } from "./utils/tw";

export default function App() {
	const {
		videoRef,
		canvasRef,
		facing,
		devices,
		deviceId,
		setDeviceId,
		toggleFacing,
	} = useHandTracking();

	return (
		<div className={tw("m-0 p-0 w-screen h-screen overflow-hidden")}>
			<video
				ref={videoRef}
				playsInline
				autoPlay
				muted
				className={tw(
					"fixed w-px h-px opacity-0 pointer-events-none",
					"-left-[9999px] -top-[9999px]"
				)}
			/>
			<canvas
				ref={canvasRef}
				className={tw("fixed inset-0 w-screen h-screen touch-none")}
			/>

			<CameraControls
				facing={facing}
				devices={devices}
				deviceId={deviceId}
				onToggleFacing={toggleFacing}
				onDeviceChange={setDeviceId}
			/>
		</div>
	);
}
