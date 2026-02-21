import { Hono } from 'npm:hono';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// 🔥 自动备份（系统自动触发）
app.post('/make-server-880fd43b/backup/auto', async (c) => {
  try {
    const { data, timestamp, type, version } = await c.req.json();
    
    const backupId = `backup_auto_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const size = JSON.stringify(data).length;
    
    // 存储备份数据到KV
    await kv.set(`backup:${backupId}`, JSON.stringify({
      id: backupId,
      data,
      timestamp,
      type,
      version,
      size,
      status: 'success'
    }));
    
    // 存储备份元数据到历史列表
    const historyKey = 'backup:history';
    const historyData = await kv.get(historyKey);
    let history: any[] = [];
    
    if (historyData) {
      try {
        history = JSON.parse(historyData);
      } catch (e) {
        history = [];
      }
    }
    
    // 添加新备份记录
    history.unshift({
      id: backupId,
      timestamp,
      type,
      size,
      status: 'success',
      version
    });
    
    // 只保留最近20条记录
    if (history.length > 20) {
      const removed = history.slice(20);
      history = history.slice(0, 20);
      
      // 删除旧备份数据
      for (const old of removed) {
        await kv.del(`backup:${old.id}`);
      }
    }
    
    await kv.set(historyKey, JSON.stringify(history));
    
    console.log(`✅ 自动备份成功: ${backupId}, 大小: ${size} bytes`);
    
    return c.json({
      success: true,
      backupId,
      timestamp,
      size
    });
  } catch (error) {
    console.error('❌ 自动备份失败:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// 🔥 手动备份
app.post('/make-server-880fd43b/backup/manual', async (c) => {
  try {
    const { data, timestamp, type, version } = await c.req.json();
    
    const backupId = `backup_manual_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const size = JSON.stringify(data).length;
    
    // 存储备份数据
    await kv.set(`backup:${backupId}`, JSON.stringify({
      id: backupId,
      data,
      timestamp,
      type,
      version,
      size,
      status: 'success'
    }));
    
    // 更新历史记录
    const historyKey = 'backup:history';
    const historyData = await kv.get(historyKey);
    let history: any[] = [];
    
    if (historyData) {
      try {
        history = JSON.parse(historyData);
      } catch (e) {
        history = [];
      }
    }
    
    history.unshift({
      id: backupId,
      timestamp,
      type,
      size,
      status: 'success',
      version
    });
    
    // 保留最近30条手动备份
    if (history.length > 30) {
      const removed = history.slice(30);
      history = history.slice(0, 30);
      
      for (const old of removed) {
        await kv.del(`backup:${old.id}`);
      }
    }
    
    await kv.set(historyKey, JSON.stringify(history));
    
    console.log(`✅ 手动备份成功: ${backupId}, 大小: ${size} bytes`);
    
    return c.json({
      success: true,
      backupId,
      timestamp,
      size
    });
  } catch (error) {
    console.error('❌ 手动备份失败:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// 🔥 获取备份历史
app.get('/make-server-880fd43b/backup/history', async (c) => {
  try {
    const historyData = await kv.get('backup:history');
    
    if (!historyData) {
      return c.json({ backups: [] });
    }
    
    const history = JSON.parse(historyData);
    
    return c.json({
      backups: history,
      total: history.length
    });
  } catch (error) {
    console.error('❌ 获取备份历史失败:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// 🔥 恢复备份
app.get('/make-server-880fd43b/backup/restore/:backupId', async (c) => {
  try {
    const backupId = c.req.param('backupId');
    
    const backupData = await kv.get(`backup:${backupId}`);
    
    if (!backupData) {
      return c.json({ error: '备份不存在' }, 404);
    }
    
    const backup = JSON.parse(backupData);
    
    console.log(`✅ 恢复备份: ${backupId}`);
    
    return c.json({
      success: true,
      data: backup.data,
      timestamp: backup.timestamp,
      version: backup.version
    });
  } catch (error) {
    console.error('❌ 恢复备份失败:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// 🔥 删除备份
app.delete('/make-server-880fd43b/backup/:backupId', async (c) => {
  try {
    const backupId = c.req.param('backupId');
    
    await kv.del(`backup:${backupId}`);
    
    // 从历史记录中移除
    const historyData = await kv.get('backup:history');
    if (historyData) {
      let history = JSON.parse(historyData);
      history = history.filter((b: any) => b.id !== backupId);
      await kv.set('backup:history', JSON.stringify(history));
    }
    
    console.log(`✅ 删除备份: ${backupId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ 删除备份失败:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// 🔥 获取最新备份
app.get('/make-server-880fd43b/backup/latest', async (c) => {
  try {
    const historyData = await kv.get('backup:history');
    
    if (!historyData) {
      return c.json({ error: '无备份记录' }, 404);
    }
    
    const history = JSON.parse(historyData);
    
    if (history.length === 0) {
      return c.json({ error: '无备份记录' }, 404);
    }
    
    const latest = history[0];
    const backupData = await kv.get(`backup:${latest.id}`);
    
    if (!backupData) {
      return c.json({ error: '备份数据不存在' }, 404);
    }
    
    const backup = JSON.parse(backupData);
    
    return c.json({
      success: true,
      data: backup.data,
      timestamp: backup.timestamp,
      backupId: latest.id
    });
  } catch (error) {
    console.error('❌ 获取最新备份失败:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// 🔥 获取备份统计
app.get('/make-server-880fd43b/backup/stats', async (c) => {
  try {
    const historyData = await kv.get('backup:history');
    
    if (!historyData) {
      return c.json({
        totalBackups: 0,
        totalSize: 0,
        autoBackups: 0,
        manualBackups: 0,
        oldestBackup: null,
        newestBackup: null
      });
    }
    
    const history = JSON.parse(historyData);
    
    const stats = {
      totalBackups: history.length,
      totalSize: history.reduce((sum: number, b: any) => sum + (b.size || 0), 0),
      autoBackups: history.filter((b: any) => b.type === 'auto').length,
      manualBackups: history.filter((b: any) => b.type === 'manual').length,
      oldestBackup: history[history.length - 1]?.timestamp || null,
      newestBackup: history[0]?.timestamp || null
    };
    
    return c.json(stats);
  } catch (error) {
    console.error('❌ 获取备份统计失败:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// 🔥 企业级全量备份
app.post('/make-server-880fd43b/backup/enterprise', async (c) => {
  try {
    const { manifest, fullPackage, timestamp, type } = await c.req.json();
    
    const backupId = manifest.id;
    
    // 🔥 计算完整备份包的大小
    const fullPackageStr = JSON.stringify(fullPackage);
    const size = fullPackageStr.length;
    
    // 存储完整备份包（包含所有文件内容）
    await kv.set(`enterprise_backup:${backupId}`, fullPackageStr);
    
    // 更新企业级备份历史
    const historyKey = 'enterprise_backup:history';
    const historyData = await kv.get(historyKey);
    let history: any[] = [];
    
    if (historyData) {
      try {
        history = JSON.parse(historyData);
      } catch (e) {
        history = [];
      }
    }
    
    history.unshift({
      id: backupId,
      timestamp,
      type,
      size,
      status: 'success',
      totalFiles: manifest.metadata.totalFiles,
      totalLayers: Object.keys(manifest.layers).length,
      totalSize: manifest.metadata.totalSize
    });
    
    // 保留最近50条企业级备份
    if (history.length > 50) {
      const removed = history.slice(50);
      history = history.slice(0, 50);
      
      for (const old of removed) {
        await kv.del(`enterprise_backup:${old.id}`);
      }
    }
    
    await kv.set(historyKey, JSON.stringify(history));
    
    console.log(`✅ 企业级备份成功: ${backupId}`);
    console.log(`   - 文件数: ${manifest.metadata.totalFiles}`);
    console.log(`   - 总大小: ${manifest.metadata.totalSize} bytes`);
    console.log(`   - 备份包大小: ${size} bytes`);
    console.log(`   - 层数: ${Object.keys(manifest.layers).length}`);
    
    return c.json({
      success: true,
      backupId,
      timestamp,
      size,
      totalFiles: manifest.metadata.totalFiles,
      totalSize: manifest.metadata.totalSize
    });
  } catch (error) {
    console.error('❌ 企业级备份失败:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// 🔥 获取企业级备份历史
app.get('/make-server-880fd43b/backup/enterprise/history', async (c) => {
  try {
    const historyData = await kv.get('enterprise_backup:history');
    
    if (!historyData) {
      return c.json({ backups: [] });
    }
    
    const history = JSON.parse(historyData);
    
    return c.json({
      backups: history,
      total: history.length
    });
  } catch (error) {
    console.error('❌ 获取企业级备份历史失败:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// 🔥 恢复企业级备份
app.get('/make-server-880fd43b/backup/enterprise/restore/:backupId', async (c) => {
  try {
    const backupId = c.req.param('backupId');
    
    const backupData = await kv.get(`enterprise_backup:${backupId}`);
    
    if (!backupData) {
      return c.json({ error: '企业级备份不存在' }, 404);
    }
    
    const backup = JSON.parse(backupData);
    
    console.log(`✅ 恢复企业级备份: ${backupId}`);
    
    return c.json({
      success: true,
      manifest: backup.manifest,
      timestamp: backup.timestamp
    });
  } catch (error) {
    console.error('❌ 恢复企业级备份失败:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// 🔥 完整企业级备份（v2.0）
app.post('/make-server-880fd43b/backup/enterprise-full', async (c) => {
  try {
    const fullPackage = await c.req.json();
    
    const backupId = fullPackage.metadata.backupId;
    const packageStr = JSON.stringify(fullPackage);
    const size = packageStr.length;
    
    // 存储完整备份包
    await kv.set(`enterprise_full_backup:${backupId}`, packageStr);
    
    // 更新历史记录
    const historyKey = 'enterprise_full_backup:history';
    const historyData = await kv.get(historyKey);
    let history: any[] = [];
    
    if (historyData) {
      try {
        history = JSON.parse(historyData);
      } catch (e) {
        history = [];
      }
    }
    
    history.unshift({
      id: backupId,
      timestamp: fullPackage.metadata.timestamp,
      type: 'manual',
      size,
      totalDataKeys: fullPackage.metadata.systemInfo.totalDataKeys,
      totalComponents: fullPackage.metadata.systemInfo.totalComponents,
      status: 'success'
    });
    
    // 保留最近50条
    if (history.length > 50) {
      const removed = history.slice(50);
      history = history.slice(0, 50);
      
      for (const old of removed) {
        await kv.del(`enterprise_full_backup:${old.id}`);
      }
    }
    
    await kv.set(historyKey, JSON.stringify(history));
    
    console.log(`✅ 企业级完整备份成功: ${backupId}`);
    console.log(`   - 数据集: ${fullPackage.metadata.systemInfo.totalDataKeys}`);
    console.log(`   - 组件数: ${fullPackage.metadata.systemInfo.totalComponents}`);
    console.log(`   - 总大小: ${size} bytes`);
    
    return c.json({
      success: true,
      backupId,
      size,
      timestamp: fullPackage.metadata.timestamp
    });
  } catch (error) {
    console.error('❌ 企业级完整备份失败:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// 🔥 获取完整备份历史
app.get('/make-server-880fd43b/backup/enterprise-full/history', async (c) => {
  try {
    const historyData = await kv.get('enterprise_full_backup:history');
    
    if (!historyData) {
      return c.json({ backups: [] });
    }
    
    const history = JSON.parse(historyData);
    
    return c.json({
      backups: history,
      total: history.length
    });
  } catch (error) {
    console.error('❌ 获取完整备份历史失败:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// 🔥 恢复完整备份
app.get('/make-server-880fd43b/backup/enterprise-full/restore/:backupId', async (c) => {
  try {
    const backupId = c.req.param('backupId');
    
    const backupData = await kv.get(`enterprise_full_backup:${backupId}`);
    
    if (!backupData) {
      return c.json({ error: '备份不存在' }, 404);
    }
    
    const fullPackage = JSON.parse(backupData);
    
    console.log(`✅ 恢复完整备份: ${backupId}`);
    
    return c.json({
      success: true,
      package: fullPackage
    });
  } catch (error) {
    console.error('❌ 恢复完整备份失败:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// 🔥 检查Supabase连接状态和KV Store可用性
app.get('/make-server-880fd43b/backup/enterprise-full/check', async (c) => {
  try {
    // 测试KV Store读写
    const testKey = 'system_check_test';
    const testValue = `test_${Date.now()}`;
    
    await kv.set(testKey, testValue);
    const retrieved = await kv.get(testKey);
    await kv.del(testKey);
    
    const kvStoreWorking = retrieved === testValue;
    
    console.log('✅ Supabase连接检查成功');
    console.log(`   - 服务器运行: 是`);
    console.log(`   - KV存储可用: ${kvStoreWorking ? '是' : '否'}`);
    
    return c.json({
      serverRunning: true,
      kvStoreAvailable: kvStoreWorking,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Supabase连接检查失败:', error);
    return c.json({ 
      serverRunning: true, 
      kvStoreAvailable: false,
      error: String(error)
    }, 500);
  }
});

export default app;