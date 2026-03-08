import { Injectable } from '@nestjs/common';
import { IOracleProvider } from '../../common/interfaces';
import { PriceManipulationService } from './price-manipulation.service';

@Injectable()
export class InternalOracleProvider implements IOracleProvider {
    constructor(private priceManipulation: PriceManipulationService) { }

    async fetchPrice(pair: string): Promise<number> {
        return this.priceManipulation.getManipulatedPrice(pair);
    }
}
