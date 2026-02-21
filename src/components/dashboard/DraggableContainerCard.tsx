import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle2, GripVertical } from 'lucide-react';

interface ContainerSpec {
  name: string;
  length: number;
  width: number;
  height: number;
  volume: number;
  maxWeight: number;
  tareWeight: number;
  maxPayload: number;
}

interface DraggableContainerCardProps {
  containerKey: string;
  spec: ContainerSpec;
  index: number;
  isSelected: boolean;
  isSuggested: boolean;
  onClick: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
}

export function DraggableContainerCard({
  containerKey,
  spec,
  index,
  isSelected,
  isSuggested,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
}: DraggableContainerCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    onDragStart(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(e, index);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop(index);
  };

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={(e) => e.preventDefault()}
      className="transition-all select-none"
    >
      <Card
        className={`p-3 border-2 transition-all ${
          isSelected
            ? 'border-[#F96302] bg-orange-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 flex-1">
            <GripVertical className="w-4 h-4 text-gray-400 pointer-events-auto cursor-grab active:cursor-grabbing" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="font-semibold text-sm">{containerKey}</div>
                {isSuggested && (
                  <Badge className="bg-green-600 text-xs">Suggested</Badge>
                )}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {spec.volume} CBM · {(spec.maxPayload / 1000).toFixed(1)} tons
              </div>
            </div>
          </div>
          {isSelected && (
            <CheckCircle2 className="w-5 h-5 text-[#F96302]" />
          )}
        </div>
      </Card>
    </div>
  );
}
