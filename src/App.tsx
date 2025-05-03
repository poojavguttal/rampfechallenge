import { Fragment, useCallback, useEffect, useState } from "react";
import { InputSelect } from "./components/InputSelect";
import { Instructions } from "./components/Instructions";
import { Transactions } from "./components/Transactions";
import { useEmployees } from "./hooks/useEmployees";
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions";
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee";
import { EMPTY_EMPLOYEE } from "./utils/constants";
import { Employee } from "./utils/types";
import { Transaction } from "./utils/types"; // Import the Transaction type

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees();
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } =
    usePaginatedTransactions();
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } =
    useTransactionsByEmployee();
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(false);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);
  const [isFilteredByEmployee, setIsFilteredByEmployee] = useState(false);

  // State to store all transactions
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  const loadAllTransactions = useCallback(async () => {
    setIsFilteredByEmployee(false); // Set filtered state to false
    setIsTransactionsLoading(true);
    transactionsByEmployeeUtils.invalidateData();

    await employeeUtils.fetchAll();
    setIsEmployeesLoading(false);

    await paginatedTransactionsUtils.fetchAll();
    setIsTransactionsLoading(false);

    // Append new transactions to existing transactions
    const newTransactions = paginatedTransactions?.data ?? [];
    setTransactions((prevTransactions) => [
      ...(prevTransactions ?? []),
      ...newTransactions,
    ]);
  }, [
    employeeUtils,
    paginatedTransactionsUtils,
    transactionsByEmployeeUtils,
    paginatedTransactions,
  ]);

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      setIsFilteredByEmployee(true); // Set filtered state to true
      setIsTransactionsLoading(true);
      paginatedTransactionsUtils.invalidateData();
      await transactionsByEmployeeUtils.fetchById(employeeId);
      setIsTransactionsLoading(false);
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  );

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      setIsEmployeesLoading(true); // Start loading employees
      loadAllTransactions();
    }
  }, [employeeUtils.loading, employees, loadAllTransactions]);

  // Update transactions when paginatedTransactions changes
  useEffect(() => {
    if (paginatedTransactions?.data) {
      setTransactions((prevTransactions) => [
        ...(prevTransactions ?? []),
        ...paginatedTransactions.data,
      ]);
    }
  }, [paginatedTransactions]);

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isEmployeesLoading} // Use isEmployeesLoading instead of isLoading
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return;
            }

            await loadTransactionsByEmployee(newValue.id);
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions !== null &&
            !isFilteredByEmployee &&
            paginatedTransactions?.nextPage !== null && (
              <button
                className="RampButton"
                disabled={isTransactionsLoading}
                onClick={async () => {
                  await loadAllTransactions();
                }}
              >
                View More
              </button>
            )}
        </div>
      </main>
    </Fragment>
  );
}
