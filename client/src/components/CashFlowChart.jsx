import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CashFlowChart = ({ transactions, account }) => {
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0 || !account) return [];

    let currentBalance = parseFloat(account.balance);
    
    // Create a copy of transactions to modify and sort
    // Assuming transactions are passed in from newest to oldest
    const dataWithBalances = transactions.map(tx => {
      const isDebit = tx.from_account === account.account_number;
      const amount = parseFloat(tx.amount);
      
      const balanceAfter = currentBalance;
      const balanceBefore = isDebit ? currentBalance + amount : currentBalance - amount;
      
      // Update currentBalance for the next iteration (older transaction)
      currentBalance = balanceBefore;

      return {
        date: new Date(tx.created_at).toLocaleDateString(),
        fullDate: new Date(tx.created_at).toLocaleString(),
        balance: balanceAfter,
        amount: isDebit ? -amount : amount,
        type: tx.type,
      };
    });

    // Reverse to display from oldest to newest on the chart
    return dataWithBalances.reverse();
  }, [transactions, account]);

  if (!chartData || chartData.length === 0) {
    return null;
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 p-3 rounded shadow-lg">
          <p className="text-gray-300 text-sm mb-1">{data.fullDate}</p>
          <p className="text-white font-bold">
            Balance: ${data.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className={`text-sm ${data.amount < 0 ? 'text-white' : 'text-green-400'}`}>
            Flow: {data.amount < 0 ? '-' : '+'}${Math.abs(data.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64 mb-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#9ca3af" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="balance" 
            stroke="#00f2fe" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#1f2937', stroke: '#00f2fe', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#00f2fe' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CashFlowChart;
