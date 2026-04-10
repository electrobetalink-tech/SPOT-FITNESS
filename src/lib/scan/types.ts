export interface ScanResult {
  user: {
    name: string;
    email: string;
    photo?: string;
  };
  subscription: {
    status: "active" | "expired" | "blocked" | "pending_payment";
    end_date: string;
    days_remaining: number;
    can_access_today: boolean;
  };
  last_check_in?: string;
}
