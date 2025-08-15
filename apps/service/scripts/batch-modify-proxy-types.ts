import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// 加载环境变量
config();

interface BatchModifyProxyTypesOptions {
  accountGroupId: number;
}

async function batchModifyProxyTypes(
  options: BatchModifyProxyTypesOptions,
): Promise<void> {
  const { accountGroupId } = options;

  // 统计数据
  let totalProxies = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const skippedItems: Array<{ proxyId: number; reason: string }> = [];

  // 创建数据库连接
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: false,
    logging: false,
  });

  try {
    // 初始化数据库连接
    await dataSource.initialize();
    console.log('数据库连接成功');

    // 首先列出所有可用的账号组
    const allAccountGroups = await dataSource.query(
      'SELECT id, name FROM account_groups LIMIT 10'
    );

    if (allAccountGroups.length === 0) {
      throw new Error('数据库中没有任何账号组');
    }

    console.log('可用的账号组:');
    allAccountGroups.forEach((group) => {
      console.log(`ID: ${group.id}, 名称: ${group.name}`);
    });

    // 验证指定的账号组是否存在
    const accountGroup = allAccountGroups.find(g => g.id === accountGroupId);
    if (!accountGroup) {
      throw new Error(`账号组 ID ${accountGroupId} 不存在，请从上面列表中选择一个有效的ID`);
    }

    console.log(`\n开始处理账号组: ${accountGroup.name} (ID: ${accountGroupId})`);

    // 查找账号组下所有的账号组项
    const accountGroupItems = await dataSource.query(
      'SELECT * FROM account_group_items WHERE account_group_id = ?',
      [accountGroupId]
    );

    if (accountGroupItems.length === 0) {
      console.log(`账号组 ID ${accountGroupId} 下没有账号项`);
      return;
    }

    console.log(`找到 ${accountGroupItems.length} 个账号项`);

    // 收集所有代理IP ID
    const proxyIpIds = accountGroupItems
      .filter(item => item.proxy_ip_id !== null)
      .map(item => item.proxy_ip_id);

    if (proxyIpIds.length === 0) {
      console.log(`账号组 ID ${accountGroupId} 下没有关联的代理IP`);
      return;
    }

    console.log(`找到 ${proxyIpIds.length} 个关联的代理IP`);
    totalProxies = proxyIpIds.length;

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 查询所有相关的代理IP
      for (const proxyIpId of proxyIpIds) {
        // 查询代理IP信息
        const proxyIpResult = await queryRunner.query(
          'SELECT * FROM proxy_ips WHERE proxy_id = ?',
          [proxyIpId]
        );

        if (!proxyIpResult || proxyIpResult.length === 0) {
          skippedCount++;
          skippedItems.push({
            proxyId: proxyIpId,
            reason: '代理IP不存在',
          });
          continue;
        }

        const proxyIp = proxyIpResult[0];

        // 检查当前代理类型
        if (proxyIp.proxy_type === 'socks5') {
          skippedCount++;
          skippedItems.push({
            proxyId: proxyIpId,
            reason: '代理类型已经是socks5',
          });
          continue;
        }

        // 更新代理类型为socks5
        await queryRunner.query(
          'UPDATE proxy_ips SET proxy_type = ? WHERE proxy_id = ?',
          ['socks5', proxyIpId]
        );
        
        updatedCount++;
        console.log(`✅ 成功更新代理IP ID=${proxyIp.proxy_id}: 类型从 ${proxyIp.proxy_type} 更改为 socks5`);
      }

      await queryRunner.commitTransaction();
      console.log(`事务提交成功，共更新了 ${updatedCount} 个代理IP`);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('事务执行失败，已回滚:', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  } catch (err) {
    console.error('脚本执行失败:', err);
    throw err;
  } finally {
    // 输出统计信息
    console.log('\n======= 处理结果统计 =======');
    console.log(`总代理IP数量: ${totalProxies}`);
    console.log(`更新成功数量: ${updatedCount}`);
    console.log(`跳过数量: ${skippedCount}`);

    // 输出跳过详情
    if (skippedItems.length > 0) {
      console.log('\n跳过项详情:');
      skippedItems.forEach((item, index) => {
        console.log(`${index + 1}. 代理IP ID=${item.proxyId} - 原因: ${item.reason}`);
      });
    }

    // 关闭数据库连接
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('数据库连接已关闭');
    }
  }
}

// 脚本入口
if (require.main === module) {
  const options: BatchModifyProxyTypesOptions = {
    accountGroupId: parseInt(process.argv[2] || '0'),
  };

  if (!options.accountGroupId) {
    console.error('请提供必要的参数: accountGroupId');
    process.exit(1);
  }

  batchModifyProxyTypes(options)
    .then(() => {
      console.log('脚本执行完成');
      process.exit(0);
    })
    .catch((err) => {
      console.error('脚本执行失败:', err);
      process.exit(1);
    });
}
