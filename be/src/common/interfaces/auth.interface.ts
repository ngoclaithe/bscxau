export interface IAuthService {
    loginWithWallet(walletAddress: string, signature: string): Promise<{ accessToken: string }>;
}

export interface IAdminAuthService {
    login(email: string, password: string, otp: string): Promise<{ accessToken: string }>;
}
