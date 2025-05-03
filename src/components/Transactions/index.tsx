import { useCallback } from "react";
import { useCustomFetch } from "src/hooks/useCustomFetch";
import { SetTransactionApprovalParams, Transaction } from "src/utils/types";
import { TransactionPane } from "./TransactionPane";
import { SetTransactionApprovalFunction, TransactionsComponent } from "./types";

export const Transactions: TransactionsComponent = ({ transactions }) => {
  const { fetchWithoutCache, loading } = useCustomFetch();

  const setTransactionApproval = useCallback<SetTransactionApprovalFunction>(
    async ({ transactionId, newValue }) => {
      if (!transactionId) {
        console.error("Error: Transaction ID is missing or invalid.");
        return;
      }

      try {
        await fetchWithoutCache<void, SetTransactionApprovalParams>(
          "setTransactionApproval",
          {
            transactionId,
            value: newValue,
          }
        );
      } catch (error) {
        console.error("API request failed:", error);
      }
    },
    [fetchWithoutCache]
  );

  if (!Array.isArray(transactions)) {
    return <div className="RampLoading--container">Loading...</div>;
  }

  return (
    <div data-testid="transaction-container">
      {transactions.map((transaction: Transaction) => {
        if (!transaction.id) {
          console.error("Skipping transaction with missing ID:", transaction);
          return null;
        }

        return (
          <TransactionPane
            key={transaction.id}
            transaction={transaction}
            loading={loading}
            setTransactionApproval={setTransactionApproval}
          />
        );
      })}
    </div>
  );
};
