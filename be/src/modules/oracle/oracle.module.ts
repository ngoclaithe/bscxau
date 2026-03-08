import { Module } from '@nestjs/common';
import { OracleService } from './oracle.service';
import { InternalOracleProvider } from './internal-oracle.provider';
import { PriceManipulationService } from './price-manipulation.service';

@Module({
    providers: [OracleService, InternalOracleProvider, PriceManipulationService],
    exports: [OracleService, PriceManipulationService],
})
export class OracleModule { }
