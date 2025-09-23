// Type definitions for experimental APIs
export interface VideoFrameCallbackMetadata {
	presentationTime: number;
	expectedDisplayTime: number;
	width: number;
	height: number;
	mediaTime: number;
	presentedFrames: number;
	processingDuration?: number;
}

export type VideoFrameRequestCallback = (
	now: number,
	metadata: VideoFrameCallbackMetadata
) => void;
