import React from 'react';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { User, Users, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { DEMO_USERS, getUserRoleLabel } from '../../lib/rbac-config'; // 🔥 导入getUserRoleLabel

// 🔥 全局用户角色切换器（右上角显示）
export default function UserRoleSwitcher() {
  const { currentUser, switchUser } = useAuth();

  if (!currentUser) return null;

  const getRoleColor = () => {
    const roleLabel = getUserRoleLabel(currentUser); // 🔥 使用新函数
    const colorMap: Record<string, string> = {
      purple: 'bg-purple-600',
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      orange: 'bg-orange-600',
      cyan: 'bg-cyan-600',
      yellow: 'bg-yellow-600',
      red: 'bg-red-600',
    };
    return colorMap[roleLabel.color] || 'bg-gray-600';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
        <div className={`w-9 h-9 rounded-full ${getRoleColor()} flex items-center justify-center text-base`}>
          {currentUser.avatar}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
              {currentUser.name}
            </p>
            <Badge variant="outline" className="h-4 px-1.5 text-xs">
              {getUserRoleLabel(currentUser).zh} {/* 🔥 显示区分后的角色名称 */}
            </Badge>
          </div>
          {currentUser.region && currentUser.region !== 'all' && (
            <p className="text-xs text-gray-500">
              {currentUser.region === 'NA' ? '负责北美区' : 
               currentUser.region === 'SA' ? '负责南美区' : 
               currentUser.region === 'EMEA' ? '负责欧非区' : 
               `${currentUser.region}区`}
            </p>
          )}
        </div>
      </div>

      <Select 
        value={currentUser.id} 
        onValueChange={(id) => {
          const user = DEMO_USERS.find(u => u.id === id);
          if (user) switchUser(user);
        }}
      >
        <SelectTrigger className="h-8 w-[180px] text-xs border-gray-300 bg-white">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-gray-600" />
            <span>切换角色</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {DEMO_USERS.map(user => {
            const roleLabel = getUserRoleLabel(user).zh; // 🔥 使用新函数获取角色标签
            
            // 🔥 为业务员添加区域标识
            let regionTag = '';
            if (user.role === 'Sales_Rep' && user.region) {
              const regionNames = {
                'NA': '北美',
                'SA': '南美',
                'EMEA': '欧非'
              };
              regionTag = ` [${regionNames[user.region as 'NA' | 'SA' | 'EMEA']}]`;
            }
            
            // 🔥 为区域主管添加区域标识
            if (user.role === 'Sales_Manager' && user.region && user.region !== 'all') {
              const regionNames = {
                'NA': '北美',
                'SA': '南美',
                'EMEA': '欧非'
              };
              regionTag = ` [${regionNames[user.region as 'NA' | 'SA' | 'EMEA']}区]`;
            }
            
            const displayText = `${user.avatar} ${user.name} - ${roleLabel}${regionTag}`;
            return (
              <SelectItem key={user.id} value={user.id} className="text-xs">
                {displayText}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

// 🔥 紧凑版用户信息显示（用于数据分析等页面）
export function CompactUserInfo() {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const getRoleColor = () => {
    const roleLabel = getUserRoleLabel(currentUser); // 🔥 使用新函数
    const colorMap: Record<string, string> = {
      purple: 'bg-purple-100 text-purple-700 border-purple-300',
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      green: 'bg-green-100 text-green-700 border-green-300',
      orange: 'bg-orange-100 text-orange-700 border-orange-300',
      cyan: 'bg-cyan-100 text-cyan-700 border-cyan-300',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      red: 'bg-red-100 text-red-700 border-red-300',
    };
    return colorMap[roleLabel.color] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <div className="flex items-center gap-2">
      <Users className="w-3.5 h-3.5 text-gray-500" />
      <span className="text-xs text-gray-600">当前登录：</span>
      <Badge className={`h-5 px-2 text-xs border ${getRoleColor()}`}>
        {currentUser.avatar} {getUserRoleLabel(currentUser).zh} {/* 🔥 显示区分后的角色名称 */}
      </Badge>
      {currentUser.region && currentUser.region !== 'all' && (
        <Badge variant="outline" className="h-5 px-2 text-xs">
          {currentUser.region}区
        </Badge>
      )}
    </div>
  );
}