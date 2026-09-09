import { ISettlementProvider } from "./settlement-provider.interface";
import { RazorpayVirtualAccountProvider } from "./razorpay-virtual-account.provider";

class SettlementProviderFactory {
  private static instance: ISettlementProvider | null = null;

  public static getProvider(): ISettlementProvider {
    if (!this.instance) {
      this.instance = new RazorpayVirtualAccountProvider();
    }
    return this.instance;
  }

  public static setProvider(provider: ISettlementProvider): void {
    this.instance = provider;
  }
}

export default SettlementProviderFactory;
