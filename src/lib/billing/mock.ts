import type { BillingProvider } from "./provider";
import type { Tier } from "./plans";
import type { Invoice, PaymentMethod, Subscription } from "./types";

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export class MockBillingProvider implements BillingProvider {
  readonly name = "stripe" as const;

  private subscription: Subscription = {
    id: "sub_mock_001",
    tier: "tier_1",
    status: "active",
    currentPeriodEnd: "2026-07-06T00:00:00.000Z",
    cancelAtPeriodEnd: false,
  };

  private paymentMethod: PaymentMethod = {
    brand: "visa",
    last4: "4242",
    expMonth: 8,
    expYear: 2028,
  };

  private invoices: Invoice[] = [
    {
      id: "in_mock_003",
      number: "JNY-2026-003",
      amountIls: 499,
      status: "paid",
      createdAt: "2026-06-06T00:00:00.000Z",
      pdfUrl: "#",
    },
    {
      id: "in_mock_002",
      number: "JNY-2026-002",
      amountIls: 499,
      status: "paid",
      createdAt: "2026-05-06T00:00:00.000Z",
      pdfUrl: "#",
    },
    {
      id: "in_mock_001",
      number: "JNY-2026-001",
      amountIls: 499,
      status: "paid",
      createdAt: "2026-04-06T00:00:00.000Z",
      pdfUrl: "#",
    },
  ];

  async getSubscription(): Promise<Subscription | null> {
    await delay();
    return { ...this.subscription };
  }

  async changePlan(tier: Tier): Promise<Subscription> {
    await delay();
    this.subscription = {
      ...this.subscription,
      tier,
      status: "active",
      cancelAtPeriodEnd: false,
    };
    return { ...this.subscription };
  }

  async cancelSubscription(): Promise<Subscription> {
    await delay();
    this.subscription = { ...this.subscription, cancelAtPeriodEnd: true };
    return { ...this.subscription };
  }

  async resumeSubscription(): Promise<Subscription> {
    await delay();
    this.subscription = { ...this.subscription, cancelAtPeriodEnd: false };
    return { ...this.subscription };
  }

  async listInvoices(): Promise<Invoice[]> {
    await delay();
    return this.invoices.map((i) => ({ ...i }));
  }

  async getPaymentMethod(): Promise<PaymentMethod | null> {
    await delay();
    return { ...this.paymentMethod };
  }

  async createSetupIntent(): Promise<{ clientSecret: string }> {
    await delay();
    return { clientSecret: "seti_mock_secret_ABC123" };
  }
}
