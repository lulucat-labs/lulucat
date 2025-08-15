import { readFileSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 从文本行获取邮箱
 * @param {string} line 文本行
 * @returns {string|null} 邮箱或null
 */
function getEmailFromLine(line) {
  const parts = line.trim().split('——');
  return parts[0] || null;
}

/**
 * 从多个文件中过滤重复账号
 * @param {string} inputDir 输入文件目录
 * @param {string} outputPath 输出文件路径
 * @param {string} filePattern 文件匹配模式
 * @returns {{totalFiles: number, totalLines: number, uniqueLines: number, duplicateCount: number}} 处理结果统计
 */
function filterDuplicateAccountsFromMultipleFiles(
  inputDir,
  outputPath,
  filePattern = '.txt'
) {
  const uniqueEmails = new Set();
  const uniqueLines = [];
  let totalLines = 0;

  // 读取目录下所有匹配的文件
  const files = readdirSync(inputDir)
    .filter((file) => file.endsWith(filePattern))
    .map((file) => path.join(inputDir, file));

  console.log(`找到 ${files.length} 个文件需要处理`);

  // 处理每个文件
  for (const file of files) {
    console.log(`正在处理文件: ${path.basename(file)}`);
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    totalLines += lines.length;

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
  }

  // 写入结果
  writeFileSync(outputPath, uniqueLines.join('\n'));

  return {
    totalFiles: files.length,
    totalLines,
    uniqueLines: uniqueLines.length,
    duplicateCount: totalLines - uniqueLines.length,
  };
}

// 主函数
function main() {
  try {
    // 设置输入输出路径
    const inputDir = path.join(process.cwd(), 'docs');
    const outputPath = path.join(process.cwd(), 'docs/output.txt');

    // 执行去重操作
    const result = filterDuplicateAccountsFromMultipleFiles(
      inputDir,
      outputPath
    );

    // 输出结果
    console.log('\n处理完成！');
    console.log(`总文件数: ${result.totalFiles}`);
    console.log(`总行数: ${result.totalLines}`);
    console.log(`去重后行数: ${result.uniqueLines}`);
    console.log(`重复账号数: ${result.duplicateCount}`);
  } catch (err) {
    console.error('处理文件时发生错误:', err);
    process.exit(1);
  }
}

// 执行主函数
main();