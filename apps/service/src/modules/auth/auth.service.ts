import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ethers } from 'ethers';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { WalletLoginDto } from './dto/wallet-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async generateNonce(walletAddress: string): Promise<string> {
    const nonce = Math.floor(Math.random() * 1000000).toString();
    await this.usersService.updateNonce(walletAddress, nonce);
    return nonce;
  }

  async verifySignature(
    walletAddress: string,
    signature: string,
  ): Promise<string> {
    const user = await this.usersService.findByWalletAddress(walletAddress);
    if (!user || !user.nonce) {
      throw new UnauthorizedException('Invalid authentication');
    }
    const message = `Sign this message to verify your identity. Nonce: ${user.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Generate new nonce for next login
    await this.generateNonce(walletAddress);

    return this.generateToken(user);
  }

  async loginWithWallet(
    walletLoginDto: WalletLoginDto,
  ): Promise<{ token: string; user: User }> {
    const { walletAddress, signature, message } = walletLoginDto;

    // 验证签名
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new UnauthorizedException('Invalid signature');
    }

    // 查找或创建用户
    const user = await this.usersService.findByWalletAddress(walletAddress);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 生成 JWT token
    const token = this.generateToken(user);

    return {
      token,
      user,
    };
  }

  private generateToken(user: User): string {
    const payload = { userId: user.userId, walletAddress: user.walletAddress };
    return this.jwtService.sign(payload);
  }
}
