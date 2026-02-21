import { Facebook, Instagram, PlayCircle, ExternalLink, Heart, MessageCircle, Share2, TrendingUp, Clock, Play } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useLanguage } from '../contexts/LanguageContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState } from 'react';

export function SocialMedia() {
  const { t } = useLanguage();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  // Mock recent posts for each platform
  const facebookPosts = [
    {
      type: 'video' as const,
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      thumbnail: 'construction project',
      time: t.socialMedia?.time?.hours2 || '2 hours ago',
      content: t.socialMedia?.facebook?.post1 || 'Just completed a major commercial project! Our steel materials helped build this 15-story office complex. 🏢',
      likes: 1243,
      comments: 87,
      shares: 156,
      views: '12.5K',
    },
    {
      type: 'text' as const,
      time: t.socialMedia?.time?.yesterday || 'Yesterday',
      content: t.socialMedia?.facebook?.post2 || 'Behind the scenes: Quality control in action. Every product passes through 5 inspection stages. ✓',
      likes: 892,
      comments: 45,
      shares: 89,
    },
    {
      type: 'text' as const,
      time: t.socialMedia?.time?.days2 || '2 days ago',
      content: t.socialMedia?.facebook?.post3 || 'Customer appreciation week! Thank you for trusting us with your projects. Special discount codes in comments! 🎉',
      likes: 2156,
      comments: 234,
      shares: 312,
    },
  ];

  const instagramPosts = [
    {
      type: 'video' as const,
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      thumbnail: 'product showcase',
      time: t.socialMedia?.time?.hours5 || '5 hours ago',
      content: t.socialMedia?.instagram?.post1 || 'New product alert! Premium steel sheets now available in custom sizes. DM for samples! 📦✨',
      likes: 3421,
      comments: 167,
      views: '28.3K',
    },
    {
      type: 'text' as const,
      time: t.socialMedia?.time?.yesterday || 'Yesterday',
      content: t.socialMedia?.instagram?.post2 || 'From our facility to your site. Quality you can trust, delivered on time. 🚛💪',
      likes: 2876,
      comments: 98,
    },
    {
      type: 'video' as const,
      videoUrl: 'https://www.w3schools.com/html/movie.mp4',
      thumbnail: 'factory tour',
      time: t.socialMedia?.time?.days3 || '3 days ago',
      content: t.socialMedia?.instagram?.post3 || 'Factory Friday! A glimpse into our state-of-the-art production line. #Manufacturing #Quality',
      likes: 1954,
      comments: 76,
      views: '15.7K',
    },
  ];

  const tiktokVideos = [
    {
      type: 'video' as const,
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      thumbnail: 'quick tip video',
      time: t.socialMedia?.time?.hours3 || '3 hours ago',
      title: t.socialMedia?.tiktok?.video1 || 'How to identify quality steel sheets in 30 seconds! 🔍',
      views: '45.2K',
      likes: 8921,
      comments: 432,
    },
    {
      type: 'video' as const,
      videoUrl: 'https://www.w3schools.com/html/movie.mp4',
      thumbnail: 'factory tour video',
      time: t.socialMedia?.time?.yesterday || 'Yesterday',
      title: t.socialMedia?.tiktok?.video2 || 'Day in the life of a quality inspector 👷‍♂️',
      views: '123.5K',
      likes: 15632,
      comments: 876,
    },
    {
      type: 'video' as const,
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      thumbnail: 'product demo',
      time: t.socialMedia?.time?.days2 || '2 days ago',
      title: t.socialMedia?.tiktok?.video3 || 'Strength test: Our materials vs competitors 💪',
      views: '287.3K',
      likes: 34521,
      comments: 1543,
    },
  ];

  const VideoPlayer = ({ videoUrl, postId, platform }: { videoUrl: string; postId: string; platform: string }) => {
    const isActive = activeVideo === postId;
    
    return (
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden group">
        {!isActive ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2">
                  <Play className="h-8 w-8 text-white ml-1" />
                </div>
                <p className="text-white text-sm">{t.socialMedia?.clickToPlay || 'Click to play'}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveVideo(postId)}
              className="absolute inset-0 w-full h-full cursor-pointer"
            >
              <span className="sr-only">Play video</span>
            </button>
          </>
        ) : (
          <video
            className="w-full h-full object-cover"
            controls
            autoPlay
            onEnded={() => setActiveVideo(null)}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-gray-900 mb-3">
            {t.socialMedia?.title || 'Our Social Media'}
          </h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            {t.socialMedia?.subtitle || 'Stay connected with our latest updates, tips, and exclusive content'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Facebook Section */}
        <Card className="overflow-hidden border-2 border-blue-200 hover:shadow-xl transition-shadow">
          <CardContent className="p-0">
            <div className="grid lg:grid-cols-3 gap-0">
              {/* Left: Platform Info */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-8 flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                    <Facebook className="h-8 w-8" />
                  </div>
                  <h2 className="text-white mb-2">Facebook</h2>
                  <p className="text-blue-100 mb-4">@CosunTuffBuildingMaterials</p>
                  
                  <div className="flex items-center gap-6 mb-6">
                    <div>
                      <div className="text-2xl">15.2K</div>
                      <div className="text-sm text-blue-200">{t.socialMedia?.followers || 'Followers'}</div>
                    </div>
                    <div>
                      <div className="text-2xl">1.2K</div>
                      <div className="text-sm text-blue-200">{t.socialMedia?.posts || 'Posts'}</div>
                    </div>
                  </div>

                  <p className="text-blue-100 text-sm mb-6">
                    {t.socialMedia?.facebook?.description || 'Company updates, industry insights, and customer stories'}
                  </p>
                </div>

                <a
                  href="https://facebook.com/cosuntuff"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full bg-white text-blue-600 hover:bg-blue-50">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t.socialMedia?.visitPage || 'Visit Page'}
                  </Button>
                </a>
              </div>

              {/* Right: Recent Posts with Videos */}
              <div className="lg:col-span-2 p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900">{t.socialMedia?.recentPosts || 'Recent Posts'}</h3>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {t.socialMedia?.active || 'Active'}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {facebookPosts.map((post, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Facebook className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-900">COSUN TUFF</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.time}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {post.type === 'video' && (
                        <div className="mb-3">
                          <VideoPlayer videoUrl={post.videoUrl} postId={`fb-${idx}`} platform="facebook" />
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-700 mb-3">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {post.type === 'video' && (
                          <span className="flex items-center gap-1 text-blue-600 font-medium">
                            <PlayCircle className="h-4 w-4" /> {post.views} {t.socialMedia?.views || 'views'}
                          </span>
                        )}
                        <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
                          <Heart className="h-4 w-4" /> {post.likes.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
                          <MessageCircle className="h-4 w-4" /> {post.comments}
                        </span>
                        <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
                          <Share2 className="h-4 w-4" /> {post.shares}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instagram Section */}
        <Card className="overflow-hidden border-2 border-pink-200 hover:shadow-xl transition-shadow">
          <CardContent className="p-0">
            <div className="grid lg:grid-cols-3 gap-0">
              {/* Left: Platform Info */}
              <div className="bg-gradient-to-br from-pink-600 via-purple-600 to-orange-600 text-white p-8 flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                    <Instagram className="h-8 w-8" />
                  </div>
                  <h2 className="text-white mb-2">Instagram</h2>
                  <p className="text-pink-100 mb-4">@cosuntuff_official</p>
                  
                  <div className="flex items-center gap-6 mb-6">
                    <div>
                      <div className="text-2xl">23.8K</div>
                      <div className="text-sm text-pink-200">{t.socialMedia?.followers || 'Followers'}</div>
                    </div>
                    <div>
                      <div className="text-2xl">856</div>
                      <div className="text-sm text-pink-200">{t.socialMedia?.posts || 'Posts'}</div>
                    </div>
                  </div>

                  <p className="text-pink-100 text-sm mb-6">
                    {t.socialMedia?.instagram?.description || 'Stunning project photos and behind-the-scenes content'}
                  </p>
                </div>

                <a
                  href="https://instagram.com/cosuntuff_official"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full bg-white text-pink-600 hover:bg-pink-50">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t.socialMedia?.visitPage || 'Visit Page'}
                  </Button>
                </a>
              </div>

              {/* Right: Recent Posts with Videos */}
              <div className="lg:col-span-2 p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900">{t.socialMedia?.recentPosts || 'Recent Posts'}</h3>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {t.socialMedia?.active || 'Active'}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {instagramPosts.map((post, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-pink-300 transition-colors">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Instagram className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-900">cosuntuff_official</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.time}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {post.type === 'video' && (
                        <div className="mb-3">
                          <VideoPlayer videoUrl={post.videoUrl} postId={`ig-${idx}`} platform="instagram" />
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-700 mb-3">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {post.type === 'video' && (
                          <span className="flex items-center gap-1 text-pink-600 font-medium">
                            <PlayCircle className="h-4 w-4" /> {post.views} {t.socialMedia?.views || 'views'}
                          </span>
                        )}
                        <span className="flex items-center gap-1 hover:text-pink-600 cursor-pointer">
                          <Heart className="h-4 w-4" /> {post.likes.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 hover:text-pink-600 cursor-pointer">
                          <MessageCircle className="h-4 w-4" /> {post.comments}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TikTok Section */}
        <Card className="overflow-hidden border-2 border-gray-300 hover:shadow-xl transition-shadow">
          <CardContent className="p-0">
            <div className="grid lg:grid-cols-3 gap-0">
              {/* Left: Platform Info */}
              <div className="bg-gradient-to-br from-gray-900 to-black text-white p-8 flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                    <PlayCircle className="h-8 w-8" />
                  </div>
                  <h2 className="text-white mb-2">TikTok</h2>
                  <p className="text-gray-300 mb-4">@cosuntuff</p>
                  
                  <div className="flex items-center gap-6 mb-6">
                    <div>
                      <div className="text-2xl">45.6K</div>
                      <div className="text-sm text-gray-400">{t.socialMedia?.followers || 'Followers'}</div>
                    </div>
                    <div>
                      <div className="text-2xl">523</div>
                      <div className="text-sm text-gray-400">{t.socialMedia?.videos || 'Videos'}</div>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-6">
                    {t.socialMedia?.tiktok?.description || 'Short engaging videos about products and tips'}
                  </p>
                </div>

                <a
                  href="https://tiktok.com/@cosuntuff"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full bg-white text-black hover:bg-gray-100">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t.socialMedia?.visitPage || 'Visit Page'}
                  </Button>
                </a>
              </div>

              {/* Right: Recent Videos */}
              <div className="lg:col-span-2 p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900">{t.socialMedia?.recentVideos || 'Recent Videos'}</h3>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {t.socialMedia?.active || 'Active'}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {tiktokVideos.map((video, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-gray-400 transition-colors">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-black rounded-full flex items-center justify-center flex-shrink-0">
                          <PlayCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-900">@cosuntuff</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {video.time}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <VideoPlayer videoUrl={video.videoUrl} postId={`tt-${idx}`} platform="tiktok" />
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">{video.title}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-purple-600 font-medium flex items-center gap-1">
                          <PlayCircle className="h-4 w-4" /> {video.views} {t.socialMedia?.views || 'views'}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500 hover:text-red-600 cursor-pointer">
                          <Heart className="h-4 w-4" /> {video.likes.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500 hover:text-gray-700 cursor-pointer">
                          <MessageCircle className="h-4 w-4" /> {video.comments}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-8 md:p-12 text-center text-white mt-12">
          <h2 className="text-gray-900 mb-3">
            {t.socialMedia?.ctaTitle || 'Join Our Community'}
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            {t.socialMedia?.ctaDesc || 'Follow us on all platforms for the latest updates and exclusive offers'}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="https://facebook.com/cosuntuff" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="bg-white text-orange-600 hover:bg-gray-100 border-2">
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
            </a>
            <a href="https://instagram.com/cosuntuff_official" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="bg-white text-orange-600 hover:bg-gray-100 border-2">
                <Instagram className="h-4 w-4 mr-2" />
                Instagram
              </Button>
            </a>
            <a href="https://tiktok.com/@cosuntuff" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="bg-white text-orange-600 hover:bg-gray-100 border-2">
                <PlayCircle className="h-4 w-4 mr-2" />
                TikTok
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
