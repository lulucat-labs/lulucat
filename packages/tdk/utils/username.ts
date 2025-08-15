/**
 * 用户名随机生成器选项
 */
interface UsernameGeneratorOptions {
  /** 
   * 用户名风格 
   * - 'random': 完全随机组合
   * - 'adjective-noun': 形容词+名词
   * - 'name': 人名风格
   * - 'animal': 动物名风格
   * - 'fantasy': 奇幻风格
   */
  style?: 'random' | 'adjective-noun' | 'name' | 'animal' | 'fantasy';
  /** 用户名长度范围 */
  length?: { min: number; max: number };
  /** 是否包含数字 */
  includeNumbers?: boolean;
  /** 数字位数 */
  numberDigits?: number;
  /** 分隔符 */
  separator?: string;
}

/**
 * 随机用户名生成器
 * @param options 生成选项
 * @returns 随机生成的用户名
 */
export function generateRandomUsername(options: UsernameGeneratorOptions = {}): string {
  // 默认选项
  const {
    style = 'adjective-noun',
    length = { min: 6, max: 12 },
    includeNumbers = true,
    numberDigits = 2,
    separator = '',
  } = options;

  // 词库
  const adjectives = [
    'happy', 'brave', 'clever', 'swift', 'gentle', 'wild', 'silent', 'lucky',
    'bold', 'calm', 'daring', 'eager', 'fierce', 'graceful', 'honest', 'jolly'
  ];

  const nouns = [
    'wolf', 'eagle', 'lion', 'bear', 'fox', 'hawk', 'tiger', 'panther',
    'storm', 'shadow', 'river', 'mountain', 'star', 'sun', 'moon', 'sky'
  ];

  const firstNames = [
    'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Jamie', 'Quinn', 'Riley',
    'Avery', 'Cameron', 'Drew', 'Emerson', 'Hayden', 'Peyton', 'Reese'
  ];

  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson',
    'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson'
  ];

  const fantasyNames = [
    'Aelar', 'Briath', 'Caelum', 'Dravin', 'Eryndor', 'Faelar', 'Galandor',
    'Haldir', 'Ithil', 'Jorath', 'Kaelis', 'Lorand', 'Mythar', 'Nyrath'
  ];

  const animals = [
    'Dragon', 'Phoenix', 'Griffin', 'Unicorn', 'Pegasus', 'Basilisk', 'Chimera',
    'Kraken', 'Manticore', 'Sphinx', 'Werewolf', 'Vampire', 'Zombie', 'Golem'
  ];

  // 生成随机数字
  const generateRandomNumbers = (): string => {
    if (!includeNumbers) return '';
    const min = Math.pow(10, numberDigits - 1);
    const max = Math.pow(10, numberDigits) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  };

  // 根据风格生成用户名
  let username: string;

  switch (style) {
    case 'adjective-noun':
      const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      username = adjective + separator + noun;
      break;

    case 'name':
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      username = firstName + separator + lastName;
      break;

    case 'animal':
      username = animals[Math.floor(Math.random() * animals.length)];
      break;

    case 'fantasy':
      username = fantasyNames[Math.floor(Math.random() * fantasyNames.length)];
      break;

    case 'random':
    default:
      // 生成随机字母组合
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const randomLength = Math.floor(Math.random() * (length.max - length.min + 1)) + length.min;
      let randomName = '';
      for (let i = 0; i < randomLength; i++) {
        randomName += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      username = randomName;
      break;
  }

  // 添加数字
  if (includeNumbers && style !== 'random') {
    username += generateRandomNumbers();
  }

  // 确保用户名长度在范围内
  if (username.length < length.min) {
    username += generateRandomString(length.min - username.length);
  } else if (username.length > length.max) {
    username = username.substring(0, length.max);
  }

  return username;
}

// 辅助函数：生成随机字符串
export function generateRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

//   // 使用示例
//   console.log(generateRandomUsername()); // 默认形容词+名词风格
//   console.log(generateRandomUsername({ style: 'name' })); // 人名风格
//   console.log(generateRandomUsername({ style: 'fantasy' })); // 奇幻风格
//   console.log(generateRandomUsername({ style: 'random', length: { min: 8, max: 16 } })); // 完全随机
//   console.log(generateRandomUsername({ style: 'animal', includeNumbers: false })); // 动物名不带数字