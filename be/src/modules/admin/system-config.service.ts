import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class SystemConfigService {
    constructor(private prisma: PrismaService) { }

    async getConfig(key: string) {
        // @ts-ignore
        const config = await this.prisma.systemConfig.findUnique({
            where: { key },
        });
        return config?.value || null;
    }

    async setConfig(key: string, value: any) {
        // @ts-ignore
        return this.prisma.systemConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }

    async getAllConfigs() {
        // @ts-ignore
        const configs = await this.prisma.systemConfig.findMany();
        return configs.reduce((acc: Record<string, any>, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    }
}
