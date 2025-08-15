import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 根据钱包地址查找用户
   * @param walletAddress 钱包地址
   * @returns 用户实体
   */
  async findByWalletAddress(walletAddress: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { walletAddress: walletAddress.toLowerCase() },
    });
    if (!user) {
      // 如果用户不存在，自动创建
      return this.create({ walletAddress: walletAddress.toLowerCase() });
    }
    return user;
  }

  /**
   * 创建新用户
   * @param createUserDto 创建用户DTO
   * @returns 创建的用户实体
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create({
      walletAddress: createUserDto.walletAddress.toLowerCase(),
    });
    return this.userRepository.save(user);
  }

  /**
   * 更新用户的nonce
   * @param walletAddress 钱包地址
   * @param nonce 新的nonce值
   * @returns 更新后的用户实体
   */
  async updateNonce(walletAddress: string, nonce: string): Promise<User> {
    const user = await this.findByWalletAddress(walletAddress);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.nonce = nonce;
    return this.userRepository.save(user);
  }
}
