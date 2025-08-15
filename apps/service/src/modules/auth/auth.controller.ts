import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { WalletLoginDto } from './dto/wallet-login.dto';
import { User } from '../users/entities/user.entity';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('wallet/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '钱包登录' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '登录成功',
    type: Object,
  })
  async loginWithWallet(
    @Body() walletLoginDto: WalletLoginDto,
  ): Promise<{ token: string; user: User }> {
    return await this.authService.loginWithWallet(walletLoginDto);
  }

  @Post('nonce')
  @ApiOperation({ summary: '获取登录nonce' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
    type: Object,
  })
  async getNonce(
    @Body('walletAddress') walletAddress: string,
  ): Promise<{ nonce: string }> {
    const nonce = await this.authService.generateNonce(walletAddress);
    return { nonce };
  }

  @Post('verify')
  @ApiOperation({ summary: '验证签名' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '验证成功',
    type: Object,
  })
  async verifySignature(
    @Body('walletAddress') walletAddress: string,
    @Body('signature') signature: string,
  ): Promise<{ token: string }> {
    const token = await this.authService.verifySignature(
      walletAddress,
      signature,
    );
    return { token };
  }
}
