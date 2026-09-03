import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PaymentRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Get payment parameters from URL (PayMongo provides these)
    const sourceId = searchParams.get('id') || searchParams.get('source_id');
    const status = searchParams.get('status') || 'success';
    const provider = searchParams.get('provider') || localStorage.getItem('lastPaymentProvider') || 'gcash';

    if (sourceId && status === 'success') {
      // Redirect to backend success handler which will process the payment
      // The backend will then redirect back to /payment-success
      window.location.href = `/api/payments/${provider}/success?source_id=${sourceId}`;
    } else {
      // Payment failed or incomplete
      navigate(`/payment-failed?provider=${provider}`);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing Your Payment</h2>
        <p className="text-gray-600">Please wait while we confirm your payment and redirect you back...</p>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">If you're not redirected within 5 seconds, <a href="/" className="text-blue-600 hover:underline">click here</a></p>
        </div>
      </div>
    </div>
  );
}
