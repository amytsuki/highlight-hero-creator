
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/components/ui/use-toast";
import { Share2, Download, Youtube, Instagram, Send } from "lucide-react";
import { 
  createHighlightClip, 
  generateSubtitles, 
  applySubtitlesToVideo, 
  downloadVideo 
} from "@/utils/videoProcessing";

const VideoEditor = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [highlightStart, setHighlightStart] = useState<number>(0);
  const [highlightDuration, setHighlightDuration] = useState<number>(15); // 15 seconds default
  const [verticalCrop, setVerticalCrop] = useState<boolean>(true);
  const [subtitleLanguage, setSubtitleLanguage] = useState<'ru' | 'en'>('en');
  const [publishDate, setPublishDate] = useState<Date | undefined>(new Date());
  const [processedClip, setProcessedClip] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Handle video upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const videoURL = URL.createObjectURL(file);
      setVideoFile(file);
      setVideoUrl(videoURL);
      
      // Reset states
      setHighlightStart(0);
      setProcessedClip(null);
    }
  };

  // Update current time as video plays
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // When video metadata is loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Create highlight clip from video
  const handleCreateHighlight = async () => {
    if (!videoFile || !videoRef.current) {
      toast({
        title: "Error",
        description: "Please upload a video first",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const clip = await createHighlightClip(
        videoFile,
        highlightStart,
        highlightDuration,
        verticalCrop
      );
      
      if (clip) {
        // Generate subtitles
        const subtitles = await generateSubtitles(clip, subtitleLanguage);
        
        // Apply subtitles to the clip
        const finalClip = await applySubtitlesToVideo(clip, subtitles);
        
        setProcessedClip(finalClip);
        
        toast({
          title: "Success",
          description: "Highlight clip created successfully",
        });
      }
    } catch (error) {
      console.error("Error creating highlight:", error);
      toast({
        title: "Error",
        description: "Failed to create highlight clip",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Download the processed clip
  const handleDownload = () => {
    if (processedClip) {
      downloadVideo(processedClip, `highlight-${new Date().getTime()}.webm`);
    }
  };

  // Share to social media (simulated)
  const handleShare = (platform: 'youtube' | 'instagram' | 'tiktok') => {
    if (!processedClip) {
      toast({
        title: "Error",
        description: "Please create a highlight clip first",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: `Share to ${platform}`,
      description: `In a real app, this would upload to ${platform}. Currently simulated.`,
    });
  };

  // Format time as MM:SS
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Highlight Hero Creator</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column - Video upload and preview */}
        <Card className="p-4">
          <CardHeader>
            <CardTitle>Upload & Preview</CardTitle>
            <CardDescription>Upload your video and select highlight segments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-4">
              <Input 
                type="file" 
                accept="video/*" 
                onChange={handleVideoUpload}
                className="mb-4"
              />
            </div>
            
            {videoUrl && (
              <div className="space-y-4">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full"
                    controls
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current: {formatTime(currentTime)}</span>
                    <span>Duration: {formatTime(duration)}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="highlight-start">Highlight Start: {formatTime(highlightStart)}</Label>
                    </div>
                    <Slider 
                      id="highlight-start"
                      min={0} 
                      max={Math.max(0, duration - highlightDuration)} 
                      step={1}
                      value={[highlightStart]}
                      onValueChange={(values) => setHighlightStart(values[0])}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="highlight-duration">Highlight Duration: {highlightDuration}s</Label>
                    </div>
                    <Slider 
                      id="highlight-duration"
                      min={5} 
                      max={30} 
                      step={1}
                      value={[highlightDuration]}
                      onValueChange={(values) => setHighlightDuration(values[0])}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="vertical"
                        checked={verticalCrop}
                        onCheckedChange={setVerticalCrop}
                      />
                      <Label htmlFor="vertical">Vertical Crop (9:16 Ratio)</Label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="subtitle-lang"
                        checked={subtitleLanguage === 'ru'}
                        onCheckedChange={(checked) => setSubtitleLanguage(checked ? 'ru' : 'en')}
                      />
                      <Label htmlFor="subtitle-lang">Subtitles: {subtitleLanguage === 'ru' ? 'Russian' : 'English'}</Label>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleCreateHighlight}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Create Highlight Clip"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Right column - Output and Publishing */}
        <Card className="p-4">
          <Tabs defaultValue="preview">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="publish">Publish</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="space-y-4 mt-4">
              <CardHeader className="p-0">
                <CardTitle>Preview & Export</CardTitle>
                <CardDescription>Preview your highlight and export it</CardDescription>
              </CardHeader>
              
              <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
                {processedClip ? (
                  <video 
                    src={URL.createObjectURL(processedClip)}
                    className="w-full h-full"
                    controls 
                  />
                ) : (
                  <p className="text-white">Create a highlight to see preview</p>
                )}
              </div>
              
              {processedClip && (
                <div className="flex flex-col space-y-2">
                  <Button onClick={handleDownload} className="w-full" variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Download Clip
                  </Button>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <Button onClick={() => handleShare('youtube')} variant="outline" className="flex items-center justify-center">
                      <Youtube className="mr-2 h-4 w-4" /> YouTube
                    </Button>
                    <Button onClick={() => handleShare('instagram')} variant="outline" className="flex items-center justify-center">
                      <Instagram className="mr-2 h-4 w-4" /> Instagram
                    </Button>
                    <Button onClick={() => handleShare('tiktok')} variant="outline" className="flex items-center justify-center">
                      <Send className="mr-2 h-4 w-4" /> TikTok
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="publish" className="mt-4">
              <CardHeader className="p-0">
                <CardTitle>Content Plan</CardTitle>
                <CardDescription>Schedule your content for publishing</CardDescription>
              </CardHeader>
              
              <div className="flex flex-col space-y-4 mt-4">
                <div className="flex justify-center">
                  <Calendar 
                    mode="single" 
                    selected={publishDate} 
                    onSelect={setPublishDate} 
                    className="rounded-md border"
                  />
                </div>
                
                {processedClip && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Scheduled for: {publishDate?.toLocaleDateString()}</span>
                      <Button size="sm" className="flex items-center">
                        <Share2 className="mr-2 h-4 w-4" /> Schedule
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default VideoEditor;
