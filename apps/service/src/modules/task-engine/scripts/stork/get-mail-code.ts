import axios from 'axios';
import * as ImapLib from 'imap';
import { simpleParser } from 'mailparser';
import { Buffer } from 'buffer';

// 配置日志
const log = (level, message) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${level} - ${message}`);
};

// 获取新的访问令牌
async function getNewAccessToken(refreshToken, clientId) {
  const tenantId = 'common';
  const refreshTokenData = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  try {
    const response = await axios.post(tokenUrl, refreshTokenData);
    if (response.status === 200) {
      const newAccessToken = response.data.access_token;
      console.log('成功提取访问令牌');
      return newAccessToken;
    } else {
      console.log(`错误: ${response.status} - ${response.statusText}`);
      return null;
    }
  } catch (error) {
    console.log(`获取访问令牌出错: ${error.message}`);
    return null;
  }
}

// 生成OAuth2授权字符串
function generateAuthString(user, token) {
  return Buffer.from(`user=${user}\x01auth=Bearer ${token}\x01\x01`).toString(
    'base64',
  );
}

// 从HTML中提取链接
function extractLinksFromHtml(htmlContent, folderName) {
  const pattern = /verification code.*?(\d{6})/i;
  const matches = htmlContent.match(pattern);

  if (matches && matches.length > 1) {
    console.log(`在${folderName}收件箱,提取验证码:${matches[1]}`);
    return matches[1];
  } else {
    console.log(`在${folderName}收件箱,没有找到验证码`);
    return null;
  }
}

// 判断邮件是否在指定时间范围内
function isEmailInTimeRange(date, maxTimeDiffSeconds = 12000) {
  if (!date) return false;

  const emailTime = new Date(date).getTime();
  const currentTime = new Date().getTime();

  return (currentTime - emailTime) / 1000 <= maxTimeDiffSeconds;
}

// 处理邮件文件夹
function processFolderEmails(imap, folderName) {
  return new Promise((resolve) => {
    imap.openBox(folderName, true, (err, box) => {
      if (err) {
        log('ERROR', `选择 ${folderName} 文件夹失败: ${err.message}`);
        return resolve(null);
      }

      // 如果邮箱为空，直接返回
      if (box.messages.total === 0) {
        log('INFO', `${folderName} 文件夹中无邮件，跳过后续操作`);
        return resolve(null);
      }

      // 获取最新的一封邮件
      const fetch = imap.seq.fetch(
        box.messages.total + ':' + box.messages.total,
        {
          bodies: '',
          struct: true,
        },
      );

      let links = null;

      fetch.on('message', (msg) => {
        msg.on('body', (stream) => {
          simpleParser(stream, async (err, parsed) => {
            if (err) {
              log('ERROR', `解析邮件失败: ${err.message}`);
              return;
            }

            if (isEmailInTimeRange(parsed.date)) {
              const htmlContent = parsed.html || '';
              links = extractLinksFromHtml(htmlContent, folderName);
            } else {
              log('INFO', `邮件不符合时间范围内筛选条件`);
            }
          });
        });
      });

      fetch.on('error', (err) => {
        log('ERROR', `获取邮件失败: ${err.message}`);
        resolve(null);
      });

      fetch.on('end', () => {
        resolve(links);
      });
    });
  });
}

// 连接并获取邮件
async function getImap(emailAddress, clientId, refreshToken) {
  try {
    const accessToken = await getNewAccessToken(refreshToken, clientId);
    if (!accessToken) {
      throw new Error('获取访问令牌失败');
    }

    return new Promise((resolve) => {
      const imap = new ImapLib({
        user: emailAddress,
        xoauth2: generateAuthString(emailAddress, accessToken),
        host: 'outlook.office365.com',
        port: 993,
        tls: true,
        authTimeout: 30000,
      });

      imap.once('ready', async () => {
        try {
          // 先检查收件箱
          let links = await processFolderEmails(imap, 'INBOX');

          // 如果收件箱没有找到链接，检查垃圾邮件文件夹
          if (!links) {
            links = await processFolderEmails(imap, 'Junk');
          }

          imap.end();
          resolve(links);
        } catch (error) {
          log('ERROR', `处理邮件时出错: ${error.message}`);
          imap.end();
          resolve(null);
        }
      });

      imap.once('error', (err) => {
        log('ERROR', `IMAP连接错误: ${err.message}`);
        resolve(null);
      });

      imap.once('end', () => {
        log('INFO', 'IMAP连接已关闭');
      });

      imap.connect();
    });
  } catch (error) {
    log('ERROR', `IMAP认证失败: ${error.message}`);
    return null;
  }
}

// 主函数
export async function getMailCode(
  emailAddress: string,
  clientId: string,
  refreshToken: string,
): Promise<string | null> {
  const code = await getImap(emailAddress, clientId, refreshToken);
  console.log('提取的验证码:', code);
  return code as string | null;
}
