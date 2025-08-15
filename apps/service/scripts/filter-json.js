const fs = require('fs');
const path = require('path');

/**
 * 从指定目录读取所有 JSON 文件并过滤重复 ID
 * @param {string} directoryPath - JSON 文件所在目录路径
 * @returns {Promise<void>}
 */
async function filterJsonFiles(directoryPath) {
  try {
    // 读取目录中的所有文件
    const files = await fs.promises.readdir(directoryPath);

    // 过滤出 JSON 文件
    const jsonFiles = files.filter(
      (file) => path.extname(file).toLowerCase() === '.json',
    );

    // 用于存储所有数据的 Map，以 ID 为键
    const dataMap = new Map();
    // 用于记录ID出现的位置信息，键为ID，值为{file, index}数组
    const idLocations = new Map();

    // 读取并处理每个 JSON 文件
    for (const file of jsonFiles) {
      const filePath = path.join(directoryPath, file);
      const fileContent = await fs.promises.readFile(filePath, 'utf8');
      const jsonData = JSON.parse(fileContent);

      // 确保数据是数组
      const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];

      // 将数据添加到 Map 中，同时记录位置信息
      dataArray.forEach((item, index) => {
        if (item.id) {
          const locations = idLocations.get(item.id) || [];
          locations.push({ file, index });
          idLocations.set(item.id, locations);
          dataMap.set(item.id, item);
        }
      });
    }

    // 将 Map 转换回数组
    const uniqueData = Array.from(dataMap.values());

    // 创建输出文件
    const outputPath = path.join(directoryPath, 'output.json');
    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(uniqueData, null, 2),
      'utf8',
    );

    // 输出处理结果
    console.log(
      `处理完成！共处理 ${jsonFiles.length} 个文件，输出 ${uniqueData.length} 条唯一记录`,
    );
    console.log(`输出文件路径：${outputPath}`);

    // 分析并输出重复ID的信息
    const duplicates = new Map();
    for (const [id, locations] of idLocations.entries()) {
      if (locations.length > 1) {
        duplicates.set(id, locations);
      }
    }

    // 输出重复ID的信息
    if (duplicates.size > 0) {
      console.log('\n发现重复的ID：');
      for (const [id, locations] of duplicates.entries()) {
        console.log(`ID: ${id}`);
        console.log('出现在以下位置：');
        locations.forEach(({ file, index }) => {
          console.log(`  - ${file} 中的第 ${index + 1} 条数据`);
        });
        console.log('------------------------');
      }
      console.log(`共发现 ${duplicates.size} 个重复ID`);
    } else {
      console.log('\n没有发现重复的ID');
    }

  } catch (error) {
    console.error('处理文件时发生错误：', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  // 获取命令行参数中的目录路径，如果没有提供则使用当前目录
  const directoryPath = process.argv[2] || './assets/json';

  // 运行主函数
  filterJsonFiles(directoryPath).catch((error) => {
    console.error('程序执行失败：', error);
    process.exit(1);
  });
}

module.exports = filterJsonFiles;
