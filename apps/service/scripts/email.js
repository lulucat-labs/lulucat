const fs = require('fs');
const path = require('path');

// 读取文件内容
function readFile(filePath) {
  return fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line);
}

// 解析 a.txt，存入 Map（键：邮箱，值：完整账号信息）
function parseAFile(aFilePath) {
  const accountsMap = new Map();
  const lines = readFile(aFilePath);
  for (const line of lines) {
    const parts = line.split('——'); // 假设用"——"分隔
    if (parts.length === 4) {
      const email = parts[0].trim();
      accountsMap.set(email, line);
    }
  }
  return accountsMap;
}

// 解析 b.txt，提取邮箱（仅限于 `邮箱|undefined` 格式）
function parseBFile(bFilePath) {
  const emails = [];
  const lines = readFile(bFilePath);
  for (const line of lines) {
    const parts = line.split('|');
    if (parts.length === 2 && parts[1].trim() === 'undefined') {
      emails.push(parts[0].trim());
    }
  }
  return emails;
}

// 进行匹配并写入 output.txt
function matchAndWriteOutput(aFilePath, bFilePath, outputFilePath) {
  const accountsMap = parseAFile(aFilePath);
  const emails = parseBFile(bFilePath);
  const uniqueOutputSet = new Set(); // 使用 Set 来存储唯一的记录

  for (const email of emails) {
    if (accountsMap.has(email)) {
      uniqueOutputSet.add(accountsMap.get(email));
    }
  }

  const outputLines = Array.from(uniqueOutputSet);
  fs.writeFileSync(outputFilePath, outputLines.join('\n'), 'utf8');
  console.log(
    `匹配完成，共找到 ${outputLines.length} 条唯一记录，已写入 ${outputFilePath}`,
  );
}

// 运行脚本
const aFilePath = path.join(process.cwd(), '/docs/email.txt');
const bFilePath = path.join(process.cwd(), '/task-result/stork-failed.txt');
const outputFilePath = path.join(process.cwd(), '/docs/output.txt');

matchAndWriteOutput(aFilePath, bFilePath, outputFilePath);
