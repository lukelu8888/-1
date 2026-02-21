import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { GripVertical } from 'lucide-react';

/**
 * 🎯 可拖拽排序的文档导航栏
 * 
 * 功能：
 * 1. 支持拖拽调整标签顺序
 * 2. 拖拽后自动保存到 localStorage
 * 3. 页面刷新后恢复上次的排序
 */

export type DocType = 'inquiry' | 'quotation' | 'sc' | 'po' | 'rfq' | 'supplier-quotation' | 'pr' | 'soa' | 'ci' | 'pl' | 'pi';

interface DocTab {
  id: DocType;
  label: string;
}

const ITEM_TYPE = 'DOC_TAB';
const STORAGE_KEY = 'doc_nav_order';

// 默认标签配置
const defaultTabs: DocTab[] = [
  { id: 'inquiry', label: '客户询价单' },
  { id: 'quotation', label: '业务员报价单' },
  { id: 'sc', label: '销售合同' },
  { id: 'po', label: '采购订单' },
  { id: 'rfq', label: '供应商询价单' },
  { id: 'supplier-quotation', label: '供应商报价单' },
  { id: 'pr', label: '采购需求单' },
  { id: 'soa', label: '账户对账单' },
  { id: 'ci', label: '商业发票' },
  { id: 'pl', label: '包装清单' },
  { id: 'pi', label: '形式发票' },
];

interface DraggableTabProps {
  tab: DocTab;
  index: number;
  activeDoc: DocType | null;
  onTabClick: (docType: DocType) => void;
  moveTab: (dragIndex: number, hoverIndex: number) => void;
}

function DraggableTab({ tab, index, activeDoc, onTabClick, moveTab }: DraggableTabProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveTab(item.index, index);
        item.index = index;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // 组合 drag 和 drop refs
  const refCallback = useCallback(
    (node: HTMLDivElement | null) => {
      preview(node);
      drop(node);
    },
    [preview, drop]
  );

  return (
    <div
      ref={refCallback}
      className={`relative inline-block transition-all ${isDragging ? 'opacity-50' : ''} ${
        isOver ? 'scale-105' : ''
      }`}
    >
      <Button
        size="sm"
        variant={activeDoc === tab.id ? 'default' : 'outline'}
        onClick={() => onTabClick(tab.id)}
        style={{ 
          backgroundColor: activeDoc === tab.id ? '#F96302' : undefined,
          cursor: 'pointer'
        }}
        className="relative group"
      >
        {/* 拖拽手柄 */}
        <div
          ref={drag}
          className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ marginLeft: '-4px' }}
        >
          <GripVertical className="w-3 h-3 text-gray-400" />
        </div>
        
        <span className="ml-2">{tab.label}</span>
      </Button>
    </div>
  );
}

interface DraggableDocNavProps {
  activeDoc: DocType | null;
  onDocChange: (docType: DocType) => void;
}

export function DraggableDocNav({ activeDoc, onDocChange }: DraggableDocNavProps) {
  const [tabs, setTabs] = useState<DocTab[]>(defaultTabs);

  // 从 localStorage 加载排序
  useEffect(() => {
    const savedOrder = localStorage.getItem(STORAGE_KEY);
    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder) as DocType[];
        // 根据保存的顺序重新排列标签
        const reorderedTabs = orderIds
          .map(id => defaultTabs.find(tab => tab.id === id))
          .filter((tab): tab is DocTab => tab !== undefined);
        
        // 添加任何新增的标签（防止版本更新后丢失新标签）
        const existingIds = new Set(reorderedTabs.map(t => t.id));
        const newTabs = defaultTabs.filter(tab => !existingIds.has(tab.id));
        
        setTabs([...reorderedTabs, ...newTabs]);
      } catch (e) {
        console.error('加载标签顺序失败:', e);
      }
    }
  }, []);

  // 保存排序到 localStorage
  const saveOrder = useCallback((newTabs: DocTab[]) => {
    const orderIds = newTabs.map(tab => tab.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orderIds));
  }, []);

  // 移动标签
  const moveTab = useCallback((dragIndex: number, hoverIndex: number) => {
    setTabs((prevTabs) => {
      const newTabs = [...prevTabs];
      const [removed] = newTabs.splice(dragIndex, 1);
      newTabs.splice(hoverIndex, 0, removed);
      
      // 保存新顺序
      saveOrder(newTabs);
      
      return newTabs;
    });
  }, [saveOrder]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab, index) => (
          <DraggableTab
            key={tab.id}
            tab={tab}
            index={index}
            activeDoc={activeDoc}
            onTabClick={onDocChange}
            moveTab={moveTab}
          />
        ))}
      </div>
    </DndProvider>
  );
}
