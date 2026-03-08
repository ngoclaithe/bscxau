import { Controller, Get, Param, UseGuards, Request, Patch, Body, Query, Post, UseInterceptors, UploadedFile, Res, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Response } from 'express';
import * as fs from 'fs';

@Controller('users')
export class UserController implements OnModuleInit {
    constructor(private userService: UserService) { }

    onModuleInit() {
        if (!fs.existsSync('./uploads')) {
            fs.mkdirSync('./uploads');
        }
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    async getMe(@Request() req: { user: { userId: string } }) {
        return this.userService.findById(req.user.userId);
    }

    @Get('leaderboard')
    async getLeaderboard(@Query('timeframe') timeframe: string = 'week') {
        return this.userService.getLeaderboard(timeframe);
    }

    @Get(':id/public-profile')
    async getPublicProfile(@Param('id') id: string) {
        return this.userService.getPublicProfile(id);
    }

    @Get('n/:nickname')
    async getProfileByNickname(@Param('nickname') nickname: string) {
        const user = await this.userService.findByNickname(nickname);
        if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        return user;
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('me')
    async updateProfile(
        @Request() req: { user: { userId: string } },
        @Body() body: { nickname?: string; avatarUrl?: string; isPublic?: boolean; bio?: string },
    ) {
        return this.userService.updateProfile(req.user.userId, body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('avatar')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req: any, file: any, cb: any) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    async uploadAvatar(@UploadedFile() file: any, @Request() req: any) {
        if (!file) throw new HttpException('File not found', HttpStatus.BAD_REQUEST);
        const avatarUrl = `/users/uploads/${file.filename}`;
        await this.userService.updateProfile(req.user.userId, { avatarUrl });
        return { avatarUrl };
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('change-password')
    async changePassword(
        @Request() req: { user: { userId: string } },
        @Body() body: { oldPass: string; newPass: string },
    ) {
        return this.userService.changePassword(req.user.userId, body.oldPass, body.newPass);
    }

    @Get('uploads/:filename')
    async getUploadedFile(@Param('filename') filename: string, @Res() res: any) {
        return res.sendFile(join(process.cwd(), 'uploads', filename));
    }
}
