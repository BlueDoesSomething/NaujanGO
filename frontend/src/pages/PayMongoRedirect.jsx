import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PayMongoRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const sourceId = searchParams.get('id');
    const provider = searchParams.get('provider') || 
                     localStorage.getItem('last_payment_provider') || 'gcash';

    if (sourceId) {
      checkPaymentStatus(sourceId, provider);
    } else {
      // No source_id in URL, try to get the last one from localStorage
      const lastSourceId = localStorage.getItem('last_payment_source_id');
      if (lastSourceId) {
        checkPaymentStatus(lastSourceId, provider);
      } else {
        setIsChecking(false);
        setError('Unable to find payment information. Please contact support.');
      }
    }
  }, [searchParams, navigate]);

  const checkPaymentStatus = async (sourceId, provider) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/payments/check-status?source_id=${sourceId}&provider=${provider}`,
        {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (data.success || data.status === 'succeeded') {
        // Clear localStorage
        localStorage.removeItem('last_payment_source_id');
        localStorage.removeItem('last_payment_provider');
        
        // Redirect to success page
        navigate(`/payment-success?booking_id=${data.booking_id}&provider=${provider}&source_id=${sourceId}`);
      } else if (data.status === 'failed' || response.status === 404) {
        navigate(`/payment-failed?provider=${provider}&reason=payment_not_found`);
      } else {
        // Payment still pending
        setIsChecking(false);
        setError(`Payment status: ${data.status}. Please try again in a moment.`);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setIsChecking(false);
      setError('Failed to verify payment. Please try again.');
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        {isChecking ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Processing Payment</h2>
            <p className="text-gray-600 mb-6">Confirming your payment...</p>
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
            <p className="text-sm text-gray-500">This may take a few seconds</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Payment Processing</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
              >
                Try Again
              </button>
              <button
                onClick={handleReturnHome}
                className="flex-1 bg-gray-300 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-400 transition"
              >
                Home
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
