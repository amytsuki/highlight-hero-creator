
/**
 * Video processing utilities using browser APIs instead of ffmpeg.wasm
 */
import { toast } from "@/components/ui/use-toast";

// Function to extract a frame from a video at a specific time
export const extractFrame = (videoElement: HTMLVideoElement, time: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      reject(new Error("Could not get canvas context"));
      return;
    }
    
    // Set video to the time we want to extract
    videoElement.currentTime = time;
    
    videoElement.onseeked = () => {
      // Set canvas dimensions to video dimensions
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      // Draw the video frame on the canvas
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Could not convert canvas to blob"));
        }
      }, 'image/jpeg', 0.95);
    };
    
    videoElement.onerror = () => {
      reject(new Error("Error seeking video"));
    };
  });
};

// Function to create a highlight clip
export const createHighlightClip = async (
  videoFile: File,
  startTime: number,
  duration: number,
  vertical: boolean = true
): Promise<Blob | null> => {
  try {
    // Create object URL for video file
    const videoUrl = URL.createObjectURL(videoFile);
    
    // Create video element to work with
    const videoElement = document.createElement('video');
    videoElement.src = videoUrl;
    videoElement.crossOrigin = "anonymous";
    
    // Wait for video metadata to load
    await new Promise((resolve, reject) => {
      videoElement.onloadedmetadata = resolve;
      videoElement.onerror = reject;
    });
    
    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      toast({
        title: "Error",
        description: "Could not create canvas context for video processing",
        variant: "destructive"
      });
      return null;
    }
    
    // Set canvas dimensions
    if (vertical) {
      // For vertical videos (shorts/reels), use 9:16 ratio
      canvas.width = 540;
      canvas.height = 960;
    } else {
      // Use original video dimensions
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
    }
    
    // Create a MediaRecorder to record the canvas
    const stream = canvas.captureStream(30); // 30fps
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000 // 5 Mbps
    });
    
    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };
    
    // Promise to resolve when recording is complete
    const recordingPromise = new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        const clipBlob = new Blob(chunks, { type: 'video/webm' });
        resolve(clipBlob);
      };
    });
    
    // Start recording
    mediaRecorder.start();
    
    // Set video to start time and begin playback
    videoElement.currentTime = startTime;
    videoElement.play();
    
    // Draw video frames to canvas
    const endTime = startTime + duration;
    const drawFrame = () => {
      if (videoElement.currentTime <= endTime) {
        // Calculate positioning for vertical video (center crop)
        if (vertical) {
          const scale = Math.max(canvas.width / videoElement.videoWidth, canvas.height / videoElement.videoHeight);
          const x = (canvas.width - videoElement.videoWidth * scale) / 2;
          const y = (canvas.height - videoElement.videoHeight * scale) / 2;
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            videoElement, 
            0, 0, videoElement.videoWidth, videoElement.videoHeight,
            x, y, videoElement.videoWidth * scale, videoElement.videoHeight * scale
          );
        } else {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        }
        requestAnimationFrame(drawFrame);
      } else {
        videoElement.pause();
        mediaRecorder.stop();
      }
    };
    
    // Start drawing frames
    drawFrame();
    
    // Return the resulting clip
    return await recordingPromise;
  } catch (error) {
    console.error("Error creating highlight clip:", error);
    toast({
      title: "Error",
      description: "Failed to create highlight clip",
      variant: "destructive"
    });
    return null;
  }
};

// Function to generate subtitles (placeholder - would need a speech recognition API)
export const generateSubtitles = async (videoBlob: Blob, language: 'ru' | 'en'): Promise<Array<{start: number, end: number, text: string}>> => {
  // This is a placeholder. In a real implementation, you'd use a speech recognition API
  // like Web Speech API or a third-party service
  
  toast({
    title: "Subtitle Generation",
    description: `Generating ${language === 'ru' ? 'Russian' : 'English'} subtitles. This would require a speech recognition API in a real implementation.`,
  });
  
  // Return mock subtitles
  return [
    { start: 0, end: 3, text: language === 'ru' ? 'Привет, это пример субтитров.' : 'Hello, this is a subtitle example.' },
    { start: 3, end: 6, text: language === 'ru' ? 'Они созданы для демонстрации.' : 'They are created for demonstration.' },
    { start: 6, end: 9, text: language === 'ru' ? 'В реальном приложении используйте API распознавания речи.' : 'In a real app, use speech recognition API.' }
  ];
};

// Function to apply subtitles to a video
export const applySubtitlesToVideo = async (
  videoBlob: Blob, 
  subtitles: Array<{start: number, end: number, text: string}>
): Promise<Blob> => {
  // In a real application, you would render subtitles on top of the video
  // This is a simplified version that just returns the original video
  // A complete implementation would use canvas to draw subtitles on each frame
  
  toast({
    title: "Subtitles",
    description: "In a real implementation, subtitles would be burned into the video using canvas",
  });
  
  return videoBlob;
};

// Function to download the processed video
export const downloadVideo = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
