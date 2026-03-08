export interface IPriceFeed {
    getPrice(pair: string): Promise<number>;
    getPriceWithTimestamp(pair: string): Promise<{ price: number; timestamp: number }>;
}

export interface ISettlementEngine {
    settle(tradeId: string, settlePrice: number): Promise<void>;
}

export interface IOracleProvider {
    fetchPrice(pair: string): Promise<number>;
}
