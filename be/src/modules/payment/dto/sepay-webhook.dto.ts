import { IsNumber, IsString, IsOptional } from 'class-validator';

export class SePayWebhookDto {
    @IsNumber()
    id: number; // SePay transaction ID

    @IsString()
    gateway: string; // e.g. "MBBank"

    @IsString()
    transactionDate: string;

    @IsString()
    accountNumber: string;

    @IsString()
    @IsOptional()
    code: string | null;

    @IsString()
    content: string; // Provide: "SEPAY <CODE>"

    @IsString()
    transferType: string; // "in" or "out"

    @IsNumber()
    transferAmount: number;

    @IsNumber()
    accumulated: number;

    @IsString()
    @IsOptional()
    referenceCode: string | null;

    @IsString()
    @IsOptional()
    description: string | null;
}
