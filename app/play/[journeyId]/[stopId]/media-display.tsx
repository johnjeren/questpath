"use client";

// Convert YouTube/Vimeo URLs to embeddable format
function getEmbedUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // YouTube
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId = '';
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.searchParams.get('v') || '';
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    // Vimeo
    if (urlObj.hostname.includes('vimeo.com')) {
      const videoId = urlObj.pathname.split('/').pop();
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

interface MediaDisplayProps {
  imageUrl: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  title: string;
}

export function MediaDisplay({ imageUrl, videoUrl, audioUrl, title }: MediaDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Image */}
      {imageUrl && (
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-secondary/30">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-auto"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Video */}
      {videoUrl && (() => {
        const embedUrl = getEmbedUrl(videoUrl);
        return embedUrl ? (
          <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-secondary/30" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 bg-gray-100 dark:bg-primary/80 border border-gray-200 dark:border-secondary/30 rounded-lg text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-secondary/10 transition-colors"
          >
            🎥 View Video
          </a>
        );
      })()}

      {/* Audio */}
      {audioUrl && (
        <audio
          controls
          className="w-full rounded-lg"
          src={audioUrl}
        >
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
}
