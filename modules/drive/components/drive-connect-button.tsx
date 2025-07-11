'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDrive } from '../context/drive-context';

export function DriveConnectButton() {
  const { connectAccount } = useDrive();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const authUrl = await connectAccount();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to connect Drive:', error);
      alert('Failed to connect Google Drive. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center space-x-2"
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M7.71 3.5L1.15 15l6.56 6.5L14.27 10l-6.56-6.5z" />
        <path d="M9.54 8.5l6.56 6.5L22.66 3.5H9.54z" />
        <path d="M14.27 10l-6.56 11.5h12.85L14.27 10z" />
      </svg>
      <span>{isConnecting ? 'Connecting...' : 'Connect Google Drive'}</span>
    </Button>
  );
}