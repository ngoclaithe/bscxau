import { IsString, IsNotEmpty, IsNumber, IsEnum, Min } from 'class-validator';

export class CreateTradeDto {
    @IsString()
    @IsNotEmpty()
    pairId: string;

    @IsEnum(['UP', 'DOWN'])
    direction: 'UP' | 'DOWN';

    @IsNumber()
    @Min(1)
    amount: number;

    @IsNumber()
    @Min(30)
    timeframe: number;
}
