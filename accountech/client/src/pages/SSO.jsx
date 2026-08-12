import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SSO() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const embedded = searchParams.get('embedded');
  const returnTo = searchParams.get('returnTo') || '/';
  const { ssoLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('No SSO token provided in the URL');
      return;
    }

    ssoLogin(token)
      .then(() => {
        if (embedded === 'true') {
          localStorage.setItem('embedded', 'true');
        } else {
          localStorage.removeItem('embedded');
        }
        // Clear token from URL and redirect to requested view
        navigate(returnTo, { replace: true });
      })
      .catch((err) => {
        setError('SSO Login failed: ' + (err.response?.data?.error || err.message));
      });
  }, [token, ssoLogin, navigate]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-red-500 font-medium">{error}</div>
          <button
            onClick={() => navigate('/login')}
            className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Go to normal Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="text-gray-600">Authenticating via OfficeConnect...</p>
      </div>
    </div>
  );
}
