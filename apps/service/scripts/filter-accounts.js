const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

/**
 * 从文本行获取邮箱
 * @param {string} line 文本行
 * @returns {string|null} 邮箱
 */
function getEmailFromLine(line) {
  const parts = line.trim().split('——');
  return parts[0] || null;
}

/**
 * 过滤重复账号
 * @param {string} inputPath 输入文件路径
 * @param {string} outputPath 输出文件路径
 */
function filterDuplicateAccounts(inputPath, outputPath) {
  try {
    const content = readFileSync(inputPath, 'utf-8');
    const lines = content.split('\n');
    const uniqueEmails = new Set();
    const uniqueLines = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      const email = getEmailFromLine(line);
      if (!email) {
        console.warn(`警告: 跳过无效行: ${line}`);
        continue;
      }
      if (!uniqueEmails.has(email)) {
        uniqueEmails.add(email);
        uniqueLines.push(line);
      }
    }

    writeFileSync(outputPath, uniqueLines.join('\n'));
    console.log(`处理完成！`);
    console.log(`总行数: ${lines.length}`);
    console.log(`去重后行数: ${uniqueLines.length}`);
    console.log(`重复账号数: ${lines.length - uniqueLines.length}`);
  } catch (err) {
    console.error('处理文件时发生错误:', err);
    process.exit(1);
  }
}

const inputPath = path.join(process.cwd(), '/docs/email.txt');
const outputPath = path.join(process.cwd(), '/docs/output.txt');

filterDuplicateAccounts(inputPath, outputPath);
