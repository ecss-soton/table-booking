import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AzureADCallback() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the NextAuth callback with all the query parameters
    const query = new URLSearchParams(window.location.search);
    const hash = window.location.hash ? '?' + window.location.hash.substring(1) : '';
    
    // Redirect to the correct NextAuth callback endpoint
    router.push(`/api/auth/callback/azure-ad?${query}${hash}`);
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Redirecting...</p>
    </div>
  );
}
