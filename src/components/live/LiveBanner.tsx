// 🔴 LIVE直播预告Banner - 全站顶部显示
// 当有直播进行时或即将开始时显示

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Eye, X, Radio, Clock, ExternalLink } from 'lucide-react';
import { useRouter } from '../../contexts/RouterContext';

interface LiveBannerProps {
  onNavigate?: () => void; // 导航到直播页面的回调
}

export function LiveBanner({ onNavigate }: LiveBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [countdown, setCountdown] = useState({ hours: 2, minutes: 14, seconds: 35 });
  const { navigateTo } = useRouter();

  // 模拟倒计时（实际应该从服务器获取）
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 检查是否有直播（实际应该从API获取）
  const isLiveNow = true; // 或 false 显示即将开始
  const liveTitle = "2024新品发布会 - 智能门锁系列";
  const viewers = 156;

  if (!isVisible) return null;

  return (
    <>
      {isLiveNow ? (
        // 正在直播
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white shadow-lg z-50 animate-in slide-in-from-top">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* 左侧：LIVE标识 */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </div>
                <Radio className="size-5" />
                <span className="font-bold text-lg">LIVE NOW</span>
              </div>

              {/* 中间：直播信息 */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{liveTitle}</p>
                <div className="flex items-center gap-3 text-sm opacity-90">
                  <span className="flex items-center gap-1">
                    <Eye className="size-4" />
                    {viewers}人正在观看
                  </span>
                  <span>•</span>
                  <span>10:00 AM EST</span>
                </div>
              </div>

              {/* 右侧：操作按钮 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button 
                  size="sm" 
                  className="bg-white text-red-600 hover:bg-red-50 font-semibold shadow-lg"
                  onClick={onNavigate || (() => navigateTo('live'))}
                >
                  <Eye className="size-4 mr-2" />
                  立即观看
                </Button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  aria-label="关闭"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // 即将开始
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white shadow-lg z-50 animate-in slide-in-from-top">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* 左侧：倒计时图标 */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <Clock className="size-5 animate-pulse" />
                <span className="font-bold text-lg">即将开始</span>
              </div>

              {/* 中间：直播信息 */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{liveTitle}</p>
                <div className="flex items-center gap-3 text-sm opacity-90">
                  <span>距离开始还有</span>
                  <span className="font-mono font-bold">
                    {String(countdown.hours).padStart(2, '0')}:
                    {String(countdown.minutes).padStart(2, '0')}:
                    {String(countdown.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* 右侧：操作按钮 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button 
                  size="sm" 
                  className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg"
                  onClick={onNavigate || (() => navigateTo('live'))}
                >
                  设置提醒
                </Button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  aria-label="关闭"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 简化版 - 用于在页面内嵌入
export function LiveBannerCompact({ isLive = true }: { isLive?: boolean }) {
  return (
    <div className={`rounded-lg p-4 ${isLive ? 'bg-red-50 border-2 border-red-300' : 'bg-blue-50 border-2 border-blue-300'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isLive ? (
            <>
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </div>
              <Badge className="bg-red-600 text-white">LIVE</Badge>
              <span className="font-semibold text-red-900">156人正在观看直播</span>
            </>
          ) : (
            <>
              <Clock className="size-5 text-blue-600" />
              <Badge className="bg-blue-600 text-white">即将开始</Badge>
              <span className="font-semibold text-blue-900">2小时14分后开始</span>
            </>
          )}
        </div>
        <Button size="sm" className={isLive ? 'bg-red-600' : 'bg-blue-600'}>
          <Eye className="size-4 mr-2" />
          {isLive ? '立即观看' : '设置提醒'}
        </Button>
      </div>
    </div>
  );
}