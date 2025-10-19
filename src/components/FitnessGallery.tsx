import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play } from "lucide-react";
import backImage from "@/assets/back.jpg";
import workingOut from "@/assets/working-out.jpg";
import workingOut2 from "@/assets/working-out2.jpg";
import workingOutVideo1 from "@/assets/workingoutvideo1.mp4";
import workingOutVideo2 from "@/assets/workingoutvideo2.mp4";
import workingOutVideo3 from "@/assets/workingoutvideo3.mp4";
import workingOutVideo4 from "@/assets/workingoutvideo4.mp4";
import workingOutVideo5 from "@/assets/workingoutvideo5.mp4";

const VideoPlayer = ({ src }: { src: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  return (
    <div className="relative w-full aspect-[4/5] overflow-hidden rounded-lg shadow-lg bg-black group">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        controls={isPlaying}
        loop
        playsInline
        preload="metadata"
        onPause={handlePause}
        onEnded={handlePause}
      >
        Your browser does not support this video.
      </video>

      {!isPlaying && (
        <div
          onClick={handlePlayClick}
          className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer group-hover:bg-black/75 transition-all duration-300"
        >
          <div className="bg-red-800 rounded-full p-4 group-hover:scale-110 transition-transform duration-300">
            <Play className="h-8 w-8 text-black fill-black" />
          </div>
        </div>
      )}
    </div>
  );
};

const FitnessGallery = () => {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <section id="gallery" className="w-full py-20 px-4 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Fitness Gallery</h2>
          <p className="text-muted-foreground text-lg">Experience the intensity and dedication of our training sessions</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
          </TabsList>

          {/* All Media */}
          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {/* Image 1 - Back Training */}
              <div className="w-full aspect-[4/5] overflow-hidden rounded-lg shadow-lg">
                <img
                  src={backImage}
                  alt="Professional back training with battle ropes in modern gym"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Video 1 */}
              <VideoPlayer src={workingOutVideo1} />

              {/* Image 2 - Functional Training */}
              <div className="w-full aspect-[4/5] overflow-hidden rounded-lg shadow-lg">
                <img
                  src={workingOut}
                  alt="Functional training with weights in professional gym setting"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Video 2 */}
              <VideoPlayer src={workingOutVideo2} />

              {/* Image 3 - Personal Training */}
              <div className="w-full aspect-[4/5] overflow-hidden rounded-lg shadow-lg">
                <img
                  src={workingOut2}
                  alt="One-on-one personal training session with professional guidance"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Video 3 */}
              <VideoPlayer src={workingOutVideo3} />

              {/* Video 4 */}
              <VideoPlayer src={workingOutVideo4} />

              {/* Video 5 */}
              <VideoPlayer src={workingOutVideo5} />
            </div>
          </TabsContent>

          {/* Photos Only */}
          <TabsContent value="photos" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              <div className="w-full aspect-[4/5] overflow-hidden rounded-lg shadow-lg">
                <img
                  src={backImage}
                  alt="Professional back training with battle ropes in modern gym"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="w-full aspect-[4/5] overflow-hidden rounded-lg shadow-lg">
                <img
                  src={workingOut}
                  alt="Functional training with weights in professional gym setting"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="w-full aspect-[4/5] overflow-hidden rounded-lg shadow-lg">
                <img
                  src={workingOut2}
                  alt="One-on-one personal training session with professional guidance"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </TabsContent>

          {/* Videos Only */}
          <TabsContent value="videos" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              <VideoPlayer src={workingOutVideo1} />
              <VideoPlayer src={workingOutVideo2} />
              <VideoPlayer src={workingOutVideo3} />
              <VideoPlayer src={workingOutVideo4} />
              <VideoPlayer src={workingOutVideo5} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default FitnessGallery;