import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import QRCodeModal from '../components/QRCodeModal';

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrAccount, setQrAccount] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('http://localhost:5000/api/accounts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAccounts(data);
      } catch (error) {
        console.error('Failed to fetch accounts', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  if (loading) return <div className="text-center text-white mt-10">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {qrAccount && (
        <QRCodeModal
          accountNumber={qrAccount.account_number}
          onClose={() => setQrAccount(null)}
        />
      )}

      <h1 className="text-3xl font-bold text-white mb-8">My Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map(account => (
          <div key={account.id} className="card relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent"></div>

            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm font-medium">Account Number</p>
                <p className="text-xl text-white font-mono">{account.account_number.match(/.{1,4}/g).join(' ')}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  account.status === 'active' ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-red-900/50 text-red-400 border border-red-800'
                }`}>
                  {account.status.toUpperCase()}
                </span>
                <button
                  onClick={() => setQrAccount(account)}
                  className="w-8 h-8 rounded border border-gray-700 bg-gray-800 hover:bg-brand-accent/20 hover:border-brand-accent/50 transition flex items-center justify-center"
                  title="Show QR Code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-brand-accent" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zm-2 7a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zm8-12a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1zm-1 7a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3a1 1 0 011-1h3zm-1 2v1h1v-1h-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-gray-400 text-sm font-medium mb-1">Available Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  ${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-gray-500 font-medium">{account.currency}</span>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Link to="/transfer" className="btn-primary flex-1 text-center text-sm py-2">Transfer Money</Link>
              <Link to="/history" className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition text-sm flex-1 text-center border border-gray-700">View History</Link>
            </div>
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="col-span-full card text-center py-12">
            <p className="text-gray-400 mb-4">You don't have any active accounts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;