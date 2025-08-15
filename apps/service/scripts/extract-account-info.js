const fs = require('fs');
const path = require('path');

/**
 * 从文本文件中提取账号信息
 * @param {string} inputFilePath - 输入文件路径
 * @param {string} outputFilePath - 输出文件路径
 */
function extractAccountInfo(inputFilePath, outputFilePath) {
  try {
    // 读取文件内容
    const content = fs.readFileSync(inputFilePath, 'utf8');

    // 按行分割
    const lines = content.split('\n');

    // 存储提取的信息
    const accounts = [];
    let currentAccount = {};

    // 遍历每一行
    for (const line of lines) {
      const trimmedLine = line.trim();

      // 提取所需字段
      if (trimmedLine.startsWith('login:')) {
        currentAccount.login = trimmedLine.split('login:')[1].trim();
      } else if (trimmedLine.startsWith('password:')) {
        currentAccount.password = trimmedLine.split('password:')[1].trim();
      } else if (trimmedLine.startsWith('authtoken:')) {
        currentAccount.authtoken = trimmedLine.split('authtoken:')[1].trim();

        // 当收集完一个账号的信息后，添加到数组中
        if (
          currentAccount.login &&
          currentAccount.password &&
          currentAccount.authtoken
        ) {
          accounts.push({ ...currentAccount });
          currentAccount = {};
        }
      }
    }

    // 生成输出内容
    const outputContent = accounts
      .map((acc) => `${acc.login}——${acc.password}——${acc.authtoken}`)
      .join('\n');

    // 写入文件
    fs.writeFileSync(outputFilePath, outputContent, 'utf8');

    console.log('账号信息提取完成！');
    console.log(`共处理 ${accounts.length} 个账号`);
  } catch (error) {
    console.error('处理文件时发生错误：', error);
  }
}

// 获取命令行参数
const args = process.argv.slice(2);
const inputFile = args[0] || './assets/100个x账号2.txt';
const outputFile = args[1] || './assets/x-accounts-2.txt';

if (!inputFile || !outputFile) {
  console.log(
    '使用方法: node extract-account-info.js <输入文件路径> <输出文件路径>',
  );
  process.exit(1);
}

// 执行提取
extractAccountInfo(inputFile, outputFile);
