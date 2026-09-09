import { AdminMarketplaceGovernanceDesk, GovernanceTab } from "./AdminMarketplaceGovernanceDesk";

export const AdminFinanceDomain = ({
  subView,
}: {
  subView: "payments" | "commissions" | "settlements" | "payouts";
}) => {
  const initialTab: GovernanceTab =
    subView === "settlements" || subView === "payouts"
      ? "settlements"
      : subView === "commissions"
      ? "ledger"
      : "orders";

  return (
    <div className="space-y-6">
      <AdminMarketplaceGovernanceDesk initialTab={initialTab} />
    </div>
  );
};

