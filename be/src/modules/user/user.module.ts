import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserStatsService } from './user-stats.service';
import { UserController } from './user.controller';
import { LeaderboardController } from './leaderboard.controller';

@Module({
    controllers: [UserController, LeaderboardController],
    providers: [UserService, UserStatsService],
    exports: [UserService, UserStatsService],
})
export class UserModule { }
