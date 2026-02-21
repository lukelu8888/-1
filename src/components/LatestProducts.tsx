import { Play, CheckCircle2, Video } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useState } from 'react';

// ========================================
// 视频配置说明 / VIDEO CONFIGURATION GUIDE
// ========================================
// 
// 如何更换视频 / How to Replace Videos:
// 
// 方案1 - YouTube (推荐):
//   1. 上传视频到 YouTube
//   2. 获取视频ID (例如: https://www.youtube.com/watch?v=VIDEO_ID)
//   3. 使用格式: videoUrl: 'https://www.youtube.com/embed/VIDEO_ID'
//   4. videoType: 'youtube'
// 
// 方案2 - Vimeo (专业):
//   1. 上传视频到 Vimeo
//   2. 获取视频ID
//   3. 使用格式: videoUrl: 'https://player.vimeo.com/video/VIDEO_ID'
//   4. videoType: 'vimeo'
// 
// 方案3 - 直接视频文件 (如果有自己的服务器):
//   1. 上传视频到您的服务器
//   2. 获取直接链接 (例如: https://yourserver.com/video.mp4)
//   3. videoUrl: '直接链接'
//   4. videoType: 'direct'
// 
// ========================================

export function LatestProducts() {
  const [activeVideo, setActiveVideo] = useState<number | null>(null);

  const products = [
    {
      id: 1,
      title: 'Premium Steel Roofing Sheets',
      description: 'High-quality galvanized steel sheets with superior weather resistance',
      // 👇 已更新为您的YouTube视频
      videoUrl: 'https://www.youtube.com/embed/7c1WFceoLAM',
      videoType: 'youtube' as const, // 或 'vimeo' 或 'direct'
      thumbnail: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGVlbCUyMHJvb2ZpbmclMjBtYXRlcmlhbHxlbnwxfHx8fDE3NjA3ODU4Mzl8MA&ixlib=rb-4.1.0&q=80&w=1080',
      features: [
        'Anti-corrosion coating',
        '50-year warranty',
        'Easy installation',
      ],
    },
    {
      id: 2,
      title: 'Eco-Friendly Insulation Panels',
      description: 'Energy-efficient panels with excellent thermal performance',
      // 👇 已更新为您的YouTube视频
      videoUrl: 'https://www.youtube.com/embed/M6W-yuxF7Vc',
      videoType: 'youtube' as const,
      thumbnail: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnN1bGF0aW9uJTIwcGFuZWxzJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYwNzg1ODM5fDA&ixlib=rb-4.1.0&q=80&w=1080',
      features: [
        'R-value 30+',
        'Fire resistant',
        'Moisture proof',
      ],
    },
    {
      id: 3,
      title: 'Modular Wall Systems',
      description: 'Flexible wall solutions for rapid construction projects',
      // 👇 在这里替换您的YouTube视频ID
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      videoType: 'youtube' as const,
      thumbnail: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjb25zdHJ1Y3Rpb24lMjB3YWxsfGVufDF8fHx8MTc2MDc4NTgzOXww&ixlib=rb-4.1.0&q=80&w=1080',
      features: [
        'Quick assembly',
        'Customizable design',
        'Lightweight yet durable',
      ],
    },
  ];

  const handlePlayVideo = (index: number) => {
    setActiveVideo(index);
  };

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full mb-4">
            <span className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Latest Products
            </span>
          </div>
          <h2 className="text-gray-900 mb-4">
            Discover Our Latest Innovations
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Watch our product demonstrations and discover how our building materials can transform your projects
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-2xl transition-shadow duration-300 border-2">
              <div className="relative aspect-video bg-gray-900 group">
                {activeVideo === index ? (
                  product.videoType === 'direct' ? (
                    // Direct video file (MP4, WebM, etc.)
                    <video
                      className="w-full h-full"
                      controls
                      autoPlay
                      src={product.videoUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    // YouTube or Vimeo embed
                    <iframe
                      className="w-full h-full"
                      src={`${product.videoUrl}?autoplay=1`}
                      title={product.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )
                ) : (
                  <>
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                      <button
                        onClick={() => handlePlayVideo(index)}
                        className="w-20 h-20 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transform group-hover:scale-110 transition-all shadow-lg"
                        aria-label={`Play video for ${product.title}`}
                      >
                        <Play className="h-8 w-8 ml-1" fill="currentColor" />
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              <CardContent className="p-6">
                <h3 className="text-gray-900 mb-3">{product.title}</h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {product.description}
                </p>
                
                <ul className="space-y-2 mb-6">
                  {product.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h3 className="text-gray-900 mb-4">
            Want to See More Product Demonstrations?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Contact our team to schedule a personalized product presentation or visit our showroom
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Contact Sales Team
            </Button>
            <Button size="lg" variant="outline">
              Download Complete Catalog
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
