const fs = require('fs');
const path = require('path');

// 读取文件
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`读取文件 ${filePath} 失败:`, error.message);
    process.exit(1);
  }
}

// 将匹配结果写入文件
function writeFile(filePath, content) {
  try {
    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content);
    console.log(`结果已写入: ${filePath}`);
  } catch (error) {
    console.error(`写入文件 ${filePath} 失败:`, error.message);
    process.exit(1);
  }
}

// 主函数
function matchEmails() {
  // 文件路径
  const storkFilePath = path.resolve(__dirname, '../task-result/stork.txt');
  const emailFilePath = path.resolve(__dirname, '../assets/email-0329.txt');
  const outputFilePath = path.resolve(__dirname, '../assets/email-reset.txt');
  const unmatchedFilePath = path.resolve(
    __dirname,
    '../assets/unmatched-emails.txt',
  );

  // 读取文件内容
  const storkContent = readFile(storkFilePath);
  const emailContent = readFile(emailFilePath);

  // 解析 stork.txt 获取邮箱列表
  const storkEmails = storkContent
    .split('\n')
    .map((line) => {
      // 提取每行的邮箱部分 (在 | 之前的部分)
      const match = line.match(/^([^|]+)/);
      return match ? match[1].trim() : null;
    })
    .filter(Boolean); // 过滤掉空值

  console.log(`从 stork.txt 中提取了 ${storkEmails.length} 个邮箱`);

  // 解析 email.txt 并匹配邮箱
  const matches = [];
  const matchedEmails = new Set(); // 记录已匹配的邮箱

  // 判断 email.txt 中是否包含 stork.txt 中的邮箱
  const emailLines = emailContent.split('\n');

  for (const line of emailLines) {
    // 检查当前行是否包含 stork.txt 中的任何邮箱
    for (const storkEmail of storkEmails) {
      if (line.includes(storkEmail)) {
        matches.push(line);
        matchedEmails.add(storkEmail); // 记录已匹配的邮箱
        break; // 找到匹配就跳出内层循环
      }
    }
  }

  console.log(`找到 ${matches.length} 个匹配项`);

  // 找出未匹配的邮箱
  const unmatchedEmails = storkEmails.filter(
    (email) => !matchedEmails.has(email),
  );
  console.log(`有 ${unmatchedEmails.length} 个邮箱未找到匹配`);

  // 将匹配结果写入文件
  if (matches.length > 0) {
    writeFile(outputFilePath, matches.join('\n'));
  } else {
    console.log('没有找到匹配的邮箱');
  }

  // 将未匹配的邮箱写入文件
  if (unmatchedEmails.length > 0) {
    writeFile(unmatchedFilePath, unmatchedEmails.join('\n'));
    console.log(`未匹配的邮箱已写入: ${unmatchedFilePath}`);
  }
}

// 执行主函数
matchEmails();
