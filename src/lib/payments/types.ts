export type ReceiptPayload = {
  gymName: string;
  receiptNumber: string;
  memberName: string;
  amountPaid: number;
  subscriptionType: string;
  validityStartDate: string;
  validityEndDate: string;
  paymentDate: string;
  superAdminSignature: string;
  notes?: string | null;
};
