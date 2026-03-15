import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Printer, Search, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { uiPreferenceService } from '../../lib/supabaseService';
import { toast } from 'sonner@2.0.3';

interface TemplatePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  onPrint?: () => void;
  defaultZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  topOffsetPx?: number;
  showCalibrationPanel?: boolean;
  calibrationPreferenceKey?: string;
}

interface PreviewCalibrationSettings {
  shellWidthPx: number;
  shellHeightVh: number;
  topOffsetPx: number;
  stagePaddingPx: number;
  defaultZoom: number;
  textInsetTopPx: number;
  textInsetRightPx: number;
  textInsetBottomPx: number;
  textInsetLeftPx: number;
  shellBackground: 'white' | 'gray' | 'dark' | 'brown';
  stageBackground: 'white' | 'gray' | 'dark' | 'brown';
  textBackground: 'white' | 'gray' | 'dark' | 'brown';
}

const DEFAULT_CALIBRATION: PreviewCalibrationSettings = {
  shellWidthPx: 1480,
  shellHeightVh: 99,
  topOffsetPx: 4,
  stagePaddingPx: 40,
  defaultZoom: 100,
  textInsetTopPx: 0,
  textInsetRightPx: 0,
  textInsetBottomPx: 0,
  textInsetLeftPx: 0,
  shellBackground: 'brown',
  stageBackground: 'gray',
  textBackground: 'white',
};

const CALIBRATION_STORAGE_KEY = 'ing_preview_shell_calibration_v1';

function clampOffsets(
  x: number,
  y: number,
  shellWidth: number,
  shellHeight: number,
  topOffsetPx: number,
  safe: number,
) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const baseLeft = (viewportWidth - shellWidth) / 2;

  return {
    x: Math.max(safe - baseLeft, Math.min(x, viewportWidth - shellWidth - safe - baseLeft)),
    y: Math.max(safe - topOffsetPx, Math.min(y, viewportHeight - shellHeight - safe - topOffsetPx)),
  };
}

export function TemplatePreviewDialog({
  open,
  onClose,
  title = 'A4 模板预览',
  subtitle,
  children,
  onPrint,
  defaultZoom = 100,
  minZoom = 60,
  maxZoom = 150,
  zoomStep = 10,
  topOffsetPx = 4,
  showCalibrationPanel = false,
  calibrationPreferenceKey = 'document_preview.ing',
}: TemplatePreviewDialogProps) {
  const [calibration, setCalibration] = useState<PreviewCalibrationSettings>(DEFAULT_CALIBRATION);
  const [zoom, setZoom] = useState(defaultZoom);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const shellRef = useRef<HTMLDivElement | null>(null);
  const stageViewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 });
  const safe = 8;
  const [isSavingCalibration, setIsSavingCalibration] = useState(false);
  const [isLoadingCalibration, setIsLoadingCalibration] = useState(false);

  const clampZoom = useCallback(
    (value: number) => Math.max(minZoom, Math.min(value, maxZoom)),
    [maxZoom, minZoom],
  );

  useEffect(() => {
    if (!showCalibrationPanel) return;
    try {
      const saved = window.localStorage.getItem(CALIBRATION_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<PreviewCalibrationSettings>;
      setCalibration((current) => ({
        shellWidthPx: parsed.shellWidthPx ?? current.shellWidthPx,
        shellHeightVh: parsed.shellHeightVh ?? current.shellHeightVh,
        topOffsetPx: parsed.topOffsetPx ?? current.topOffsetPx,
        stagePaddingPx: parsed.stagePaddingPx ?? current.stagePaddingPx,
        defaultZoom: parsed.defaultZoom ?? current.defaultZoom,
        textInsetTopPx: parsed.textInsetTopPx ?? current.textInsetTopPx,
        textInsetRightPx: parsed.textInsetRightPx ?? current.textInsetRightPx,
        textInsetBottomPx: parsed.textInsetBottomPx ?? current.textInsetBottomPx,
        textInsetLeftPx: parsed.textInsetLeftPx ?? current.textInsetLeftPx,
        shellBackground: parsed.shellBackground ?? current.shellBackground,
        stageBackground: parsed.stageBackground ?? current.stageBackground,
        textBackground: parsed.textBackground ?? current.textBackground,
      }));
    } catch {
      // Ignore invalid local calibration cache.
    }
  }, [showCalibrationPanel]);

  useEffect(() => {
    if (!open) return;
    if (showCalibrationPanel) {
      setCalibration((current) => ({
        ...current,
        shellBackground: 'brown',
        stageBackground: 'gray',
        textBackground: 'white',
      }));
    }
    setZoom(showCalibrationPanel ? calibration.defaultZoom : defaultZoom);
    setDragOffset({ x: 0, y: 0 });
  }, [calibration.defaultZoom, defaultZoom, open, showCalibrationPanel]);

  useEffect(() => {
    if (!showCalibrationPanel) return;
    window.localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(calibration));
  }, [calibration, showCalibrationPanel]);

  const handleLoadCalibrationFromSupabase = useCallback(async () => {
    try {
      setIsLoadingCalibration(true);
      const saved = await uiPreferenceService.get(calibrationPreferenceKey);
      if (!saved) {
        toast.info('Supabase 中还没有已保存的预览壳参数');
        return;
      }

      const next = {
        shellWidthPx: Number(saved.shellWidthPx) || DEFAULT_CALIBRATION.shellWidthPx,
        shellHeightVh: Number(saved.shellHeightVh) || DEFAULT_CALIBRATION.shellHeightVh,
        topOffsetPx: Number(saved.topOffsetPx) || DEFAULT_CALIBRATION.topOffsetPx,
        stagePaddingPx: Number(saved.stagePaddingPx) || DEFAULT_CALIBRATION.stagePaddingPx,
        defaultZoom: Number(saved.defaultZoom) || DEFAULT_CALIBRATION.defaultZoom,
        textInsetTopPx: Number(saved.textInsetTopPx) || DEFAULT_CALIBRATION.textInsetTopPx,
        textInsetRightPx: Number(saved.textInsetRightPx) || DEFAULT_CALIBRATION.textInsetRightPx,
        textInsetBottomPx: Number(saved.textInsetBottomPx) || DEFAULT_CALIBRATION.textInsetBottomPx,
        textInsetLeftPx: Number(saved.textInsetLeftPx) || DEFAULT_CALIBRATION.textInsetLeftPx,
        shellBackground: saved.shellBackground || DEFAULT_CALIBRATION.shellBackground,
        stageBackground: saved.stageBackground || DEFAULT_CALIBRATION.stageBackground,
        textBackground: saved.textBackground || DEFAULT_CALIBRATION.textBackground,
      };

      setCalibration(next);
      setZoom(next.defaultZoom);
      setDragOffset({ x: 0, y: 0 });
      toast.success('已从 Supabase 载入预览壳参数');
    } catch (error: any) {
      toast.error(error?.message || '读取 Supabase 参数失败');
    } finally {
      setIsLoadingCalibration(false);
    }
  }, [calibrationPreferenceKey]);

  const handleSaveCalibrationToSupabase = useCallback(async () => {
    try {
      setIsSavingCalibration(true);
      await uiPreferenceService.save(calibrationPreferenceKey, calibration);
      toast.success('已保存到 Supabase，重新进入仍会保留');
    } catch (error: any) {
      toast.error(error?.message || '保存到 Supabase 失败');
    } finally {
      setIsSavingCalibration(false);
    }
  }, [calibration, calibrationPreferenceKey]);

  const clampCurrentOffsets = useCallback(
    (x: number, y: number) => {
      const shell = shellRef.current;
      if (!shell) return { x, y };
      const anchorTop = showCalibrationPanel ? calibration.topOffsetPx : topOffsetPx;
      return clampOffsets(x, y, shell.offsetWidth, shell.offsetHeight, anchorTop, safe);
    },
    [calibration.topOffsetPx, showCalibrationPanel, topOffsetPx],
  );

  useEffect(() => {
    if (!open) return;
    setDragOffset((current) => clampCurrentOffsets(current.x, current.y));
  }, [clampCurrentOffsets, open, zoom]);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (!dragRef.current.active) return;

      const dx = event.clientX - dragRef.current.startX;
      const dy = event.clientY - dragRef.current.startY;
      setDragOffset(
        clampCurrentOffsets(
          dragRef.current.startOffsetX + dx,
          dragRef.current.startOffsetY + dy,
        ),
      );
    };

    const handleUp = () => {
      dragRef.current.active = false;
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [clampCurrentOffsets]);

  const handleDragStart = useCallback((event: React.MouseEvent) => {
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: dragOffset.x,
      startOffsetY: dragOffset.y,
    };
    document.body.style.userSelect = 'none';
  }, [dragOffset.x, dragOffset.y]);

  const shellTransform = useMemo(
    () => `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
    [dragOffset.x, dragOffset.y],
  );

  const handleStageScroll = useCallback((mode: 'top' | 'up' | 'down' | 'bottom') => {
    const viewport = stageViewportRef.current;
    if (!viewport) return;

    if (mode === 'top') {
      viewport.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (mode === 'bottom') {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      return;
    }

    viewport.scrollBy({
      top: mode === 'up' ? -240 : 240,
      behavior: 'smooth',
    });
  }, []);

  const handleApplyTextLayerA4 = useCallback(() => {
    setCalibration((current) => ({
      ...current,
      textInsetTopPx: 0,
      textInsetRightPx: 0,
      textInsetBottomPx: 0,
      textInsetLeftPx: 0,
      stagePaddingPx: 40,
      defaultZoom: 100,
      shellBackground: 'brown',
      stageBackground: 'gray',
      textBackground: 'white',
    }));
    setZoom(100);
    stageViewportRef.current?.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    toast.success('已恢复为 A4 标准布局：外壳橙色、画布灰色、文本白色');
  }, []);

  const resolveLayerBackgroundClassName = useCallback(
    (value: PreviewCalibrationSettings['shellBackground']) => {
      switch (value) {
        case 'dark':
          return 'bg-[#525659]';
        case 'gray':
          return 'bg-[#e5e7eb]';
        case 'brown':
          return 'bg-[#f97316]';
        case 'white':
        default:
          return 'bg-white';
      }
    },
    [],
  );

  const shellBackgroundClassName = useMemo(
    () => resolveLayerBackgroundClassName(showCalibrationPanel ? calibration.shellBackground : 'dark'),
    [calibration.shellBackground, resolveLayerBackgroundClassName, showCalibrationPanel],
  );

  const stageBackgroundClassName = useMemo(
    () => resolveLayerBackgroundClassName(showCalibrationPanel ? calibration.stageBackground : 'dark'),
    [calibration.stageBackground, resolveLayerBackgroundClassName, showCalibrationPanel],
  );

  const textBackgroundClassName = useMemo(
    () => resolveLayerBackgroundClassName(showCalibrationPanel ? calibration.textBackground : 'white'),
    [calibration.textBackground, resolveLayerBackgroundClassName, showCalibrationPanel],
  );

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="inset-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 overflow-visible border-none bg-transparent p-0 shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">模板中心统一预览弹窗</DialogDescription>
        <div className="flex h-full w-full items-start gap-4 px-3" style={{ paddingTop: `${showCalibrationPanel ? calibration.topOffsetPx : topOffsetPx}px` }}>
          {showCalibrationPanel && (
            <div
              className="z-50 mt-2 flex h-[calc(100dvh-24px)] w-[280px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
              style={{ maxHeight: `calc(100dvh - ${showCalibrationPanel ? calibration.topOffsetPx : topOffsetPx}px - 16px)` }}
            >
              <div className="border-b border-slate-100 px-4 pb-3 pt-4">
                <p className="text-sm font-semibold text-slate-900">预览壳校准</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">只调外壳、舞台和文本缩放，不改正文模板。</p>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">外壳层背景</span>
                  <select
                    value={calibration.shellBackground}
                    onChange={(event) => setCalibration((current) => ({
                      ...current,
                      shellBackground: event.target.value as PreviewCalibrationSettings['shellBackground'],
                    }))}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="white">白色</option>
                    <option value="gray">浅灰</option>
                    <option value="dark">深灰</option>
                    <option value="brown">棕色</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600">画布层背景</span>
                  <select
                    value={calibration.stageBackground}
                    onChange={(event) => setCalibration((current) => ({
                      ...current,
                      stageBackground: event.target.value as PreviewCalibrationSettings['stageBackground'],
                    }))}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="white">白色</option>
                    <option value="gray">浅灰</option>
                    <option value="dark">深灰</option>
                    <option value="brown">棕色</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600">文本层背景</span>
                  <select
                    value={calibration.textBackground}
                    onChange={(event) => setCalibration((current) => ({
                      ...current,
                      textBackground: event.target.value as PreviewCalibrationSettings['textBackground'],
                    }))}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="white">白色</option>
                    <option value="gray">浅灰</option>
                    <option value="dark">深灰</option>
                    <option value="brown">棕色</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600">外壳宽度(px)</span>
                  <input
                    type="number"
                    value={calibration.shellWidthPx}
                    onChange={(event) => setCalibration((current) => ({ ...current, shellWidthPx: Math.max(960, Number(event.target.value) || 1480) }))}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600">外壳高度(vh)</span>
                  <input
                    type="number"
                    value={calibration.shellHeightVh}
                    onChange={(event) => setCalibration((current) => ({ ...current, shellHeightVh: Math.max(70, Math.min(100, Number(event.target.value) || 99)) }))}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600">顶部偏移(px)</span>
                  <input
                    type="number"
                    value={calibration.topOffsetPx}
                    onChange={(event) => setCalibration((current) => ({ ...current, topOffsetPx: Math.max(0, Number(event.target.value) || 4) }))}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600">舞台留白(px)</span>
                  <input
                    type="number"
                    value={calibration.stagePaddingPx}
                    onChange={(event) => setCalibration((current) => ({ ...current, stagePaddingPx: Math.max(0, Number(event.target.value) || 40) }))}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600">文本层缩放(%)</span>
                  <input
                    type="number"
                    value={zoom}
                    onChange={(event) => {
                      const next = Math.max(minZoom, Math.min(maxZoom, Number(event.target.value) || 100));
                      setZoom(next);
                      setCalibration((current) => ({ ...current, defaultZoom: next }));
                    }}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600">默认缩放(%)</span>
                  <input
                    type="number"
                    value={calibration.defaultZoom}
                    onChange={(event) => {
                      const next = Math.max(minZoom, Math.min(maxZoom, Number(event.target.value) || 100));
                      setCalibration((current) => ({ ...current, defaultZoom: next }));
                      setZoom(next);
                    }}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  />
                </label>

                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">文本层 A4 尺寸</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px]"
                      onClick={handleApplyTextLayerA4}
                    >
                      一键 A4 布局
                    </Button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-[11px] text-slate-500">上(px)</span>
                      <input
                        type="number"
                        value={calibration.textInsetTopPx}
                        onChange={(event) => setCalibration((current) => ({ ...current, textInsetTopPx: Math.max(-400, Number(event.target.value) || 0) }))}
                        className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[11px] text-slate-500">右(px)</span>
                      <input
                        type="number"
                        value={calibration.textInsetRightPx}
                        onChange={(event) => setCalibration((current) => ({ ...current, textInsetRightPx: Math.max(-400, Number(event.target.value) || 0) }))}
                        className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[11px] text-slate-500">下(px)</span>
                      <input
                        type="number"
                        value={calibration.textInsetBottomPx}
                        onChange={(event) => setCalibration((current) => ({ ...current, textInsetBottomPx: Math.max(-400, Number(event.target.value) || 0) }))}
                        className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[11px] text-slate-500">左(px)</span>
                      <input
                        type="number"
                        value={calibration.textInsetLeftPx}
                        onChange={(event) => setCalibration((current) => ({ ...current, textInsetLeftPx: Math.max(-400, Number(event.target.value) || 0) }))}
                        className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <span className="text-xs font-medium text-slate-600">文本滚动</span>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => handleStageScroll('top')}>
                      到顶部
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => handleStageScroll('bottom')}>
                      到底部
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => handleStageScroll('up')}>
                      上移
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => handleStageScroll('down')}>
                      下移
                    </Button>
                  </div>
                </div>

                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => { void handleLoadCalibrationFromSupabase(); }}
                  disabled={isLoadingCalibration}
                >
                  {isLoadingCalibration ? '读取中...' : '读取 Supabase'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => { void handleSaveCalibrationToSupabase(); }}
                  disabled={isSavingCalibration}
                >
                  {isSavingCalibration ? '保存中...' : '保存到 Supabase'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    setCalibration(DEFAULT_CALIBRATION);
                    setZoom(DEFAULT_CALIBRATION.defaultZoom);
                    setDragOffset({ x: 0, y: 0 });
                    window.localStorage.removeItem(CALIBRATION_STORAGE_KEY);
                  }}
                >
                  重置
                </Button>
              </div>
            </div>
          )}

          <div className="flex min-w-0 flex-1 items-start justify-center">
            <div
              ref={shellRef}
              className={`relative z-50 overflow-hidden rounded-lg shadow-2xl ${shellBackgroundClassName}`}
              style={{
                height: `calc(${showCalibrationPanel ? calibration.shellHeightVh : 99}dvh - 8px)`,
                width: `min(${showCalibrationPanel ? calibration.shellWidthPx : 1480}px, calc(100vw - ${showCalibrationPanel ? 336 : 24}px))`,
                maxWidth: `calc(100vw - ${showCalibrationPanel ? 336 : 24}px)`,
                transform: shellTransform,
              }}
            >
              <div onMouseDown={handleDragStart} style={{ cursor: 'grab' }} className="relative h-full">
                <div className="absolute left-4 top-4 z-10">
                  <p className={`text-xs font-semibold ${showCalibrationPanel ? 'text-slate-900' : 'text-gray-100'}`}>{title}</p>
                  {subtitle && (
                    <div className={`mt-0.5 text-[10px] ${showCalibrationPanel ? 'text-slate-500' : 'text-gray-300'}`}>
                      {subtitle}
                    </div>
                  )}
                </div>

                <div className={`absolute right-4 top-4 z-10 flex flex-col items-center gap-1 rounded-lg p-1.5 shadow-lg ${showCalibrationPanel ? 'bg-white' : 'bg-white/90 backdrop-blur'}`}>
                  <button type="button" className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-100" title="搜索">
                    <Search className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                    title="放大"
                    onClick={() => setZoom((current) => clampZoom(current + zoomStep))}
                    disabled={zoom >= maxZoom}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                    title="缩小"
                    onClick={() => setZoom((current) => clampZoom(current - zoomStep))}
                    disabled={zoom <= minZoom}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="py-1 text-[11px] font-medium text-gray-500">{zoom}%</span>
                  <div className="my-0.5 h-px w-6 bg-gray-200" />
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-100"
                    title="打印"
                    onClick={onPrint}
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-100"
                    onClick={onClose}
                    title="关闭"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div
                  className={`h-full ${stageBackgroundClassName}`}
                  style={{ padding: `${showCalibrationPanel ? calibration.stagePaddingPx : 40}px` }}
                >
                  <div
                    ref={stageViewportRef}
                    className="h-full min-h-0 overflow-y-auto overflow-x-auto overscroll-contain"
                    style={{ maxHeight: '100%' }}
                  >
                    <div
                      className="flex min-h-full justify-center pt-10"
                    style={
                      showCalibrationPanel
                        ? {
                            paddingTop: `${Math.max(0, calibration.textInsetTopPx)}px`,
                            paddingRight: `${Math.max(0, calibration.textInsetRightPx)}px`,
                            paddingBottom: `${Math.max(0, calibration.textInsetBottomPx)}px`,
                            paddingLeft: `${Math.max(0, calibration.textInsetLeftPx)}px`,
                            marginTop: calibration.textInsetTopPx < 0 ? `${calibration.textInsetTopPx}px` : undefined,
                            marginRight: calibration.textInsetRightPx < 0 ? `${calibration.textInsetRightPx}px` : undefined,
                            marginBottom: calibration.textInsetBottomPx < 0 ? `${calibration.textInsetBottomPx}px` : undefined,
                            marginLeft: calibration.textInsetLeftPx < 0 ? `${calibration.textInsetLeftPx}px` : undefined,
                          }
                        : undefined
                    }
                    >
                      <div
                        data-rfq-content
                        className={textBackgroundClassName}
                        style={{
                          zoom: `${zoom}%`,
                          width: 'fit-content',
                          minWidth: '210mm',
                          minHeight: '297mm',
                        }}
                      >
                        {children}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TemplatePreviewDialog;
