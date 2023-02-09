import React, { useState, useEffect } from "react";
import fetch from "./api/dataService";
import DataTable from "react-data-table-component";

import "./App.css";
import _ from "lodash";

function calculateResults(incomingData) {
  // Calculate points per transaction

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const pointsPerTransaction = incomingData.map((transaction) => {
    let points = 0;
    let over100 = transaction.amt - 100;

    if (over100 > 0) {
      // A customer receives 2 points for every dollar spent over $100 in each transaction
      points += over100 * 2;
    }
    if (transaction.amt > 50) {
      // plus 1 point for every dollar spent over $50 in each transaction
      points += 50;
    }
    const month = new Date(transaction.transactionDt).getMonth();
    return { ...transaction, points, month };
  });

  let byCustomer = {};
  let totalPointsByCustomer = {};
  pointsPerTransaction.forEach((pointsPerTransaction) => {
    let { custid, name, month, points } = pointsPerTransaction;
    if (!byCustomer[custid]) {
      byCustomer[custid] = [];
    }
    if (!totalPointsByCustomer[custid]) {
      totalPointsByCustomer[name] = 0;
    }
    totalPointsByCustomer[name] += points;
    if (byCustomer[custid][month]) {
      byCustomer[custid][month].points += points;
      byCustomer[custid][month].monthNumber = month;
      byCustomer[custid][month].numTransactions++;
    } else {
      byCustomer[custid][month] = {
        custid,
        name,
        monthNumber: month,
        month: months[month],
        numTransactions: 1,
        points,
      };
    }
  });
  let tot = [];
  for (var custKey in byCustomer) {
    byCustomer[custKey].forEach((cRow) => {
      tot.push(cRow);
    });
  }

  let totByCustomer = [];
  for (custKey in totalPointsByCustomer) {
    totByCustomer.push({
      name: custKey,
      points: totalPointsByCustomer[custKey],
    });
  }
  return {
    summaryByCustomer: tot,
    pointsPerTransaction,
    totalPointsByCustomer: totByCustomer,
  };
}

function App() {
  const [transactionData, setTransactionData] = useState(null);

  const columns = [
    {
      name: "Customer",
      selector: (row) => row.name,
    },
    {
      name: "Month",
      selector: (row) => row.month,
    },
    {
      name: "# of Transactions",
      selector: (row) => row.numTransactions,
    },
    {
      name: "Reward Points",
      selector: (row) => row.points,
    },
  ];

  const totalsByColumns = [
    {
      name: "Customer",
      selector: (row) => row.name,
    },
    {
      name: "Points",
      selector: (row) => row.points,
    },
  ];

  function getIndividualTransactions(row) {
    let byCustMonth = _.filter(transactionData.pointsPerTransaction, (tRow) => {
      return row.custid === tRow.custid && row.monthNumber === tRow.month;
    });
    return byCustMonth;
  }

  useEffect(() => {
    fetch().then((data) => {
      const results = calculateResults(data);
      setTransactionData(results);
    });
  }, []);

  if (transactionData == null) {
    return <div>Loading...</div>;
  }

  return transactionData == null ? (
    <div>Loading...</div>
  ) : (
    <div className="app-content">
      <div className="container">
        <h2>Points Rewards System Totals by Customer Months</h2>
        <DataTable
          columns={columns}
          data={transactionData.summaryByCustomer}
          expandableRows
          expandableRowsComponent={(row) => {
            return (
              <div>
                {getIndividualTransactions(row.data).map((tran) => {
                  return (
                    <div className="container">
                      <div className="row">
                        <div className="col-8">
                          <strong>Transaction Date:</strong>{" "}
                          {tran.transactionDt} - <strong>$</strong>
                          {tran.amt} - <strong>Points: </strong>
                          {tran.points}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }}
        />
      </div>

      <div className="container">
        <h2>Points Rewards System Totals By Customer</h2>
        <DataTable
          columns={totalsByColumns}
          data={transactionData.totalPointsByCustomer}
        />
      </div>
    </div>
  );
}

export default App;
