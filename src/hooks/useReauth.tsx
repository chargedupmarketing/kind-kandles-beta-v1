'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '@/contexts/AdminContext';

const REAUTH_DURATION = 30 * 60 * 1000; // 30 minutes

export function useReauth() {
  const [isReauthenticated, setIsReauthenticated] = useState(false);
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthExpiresAt, setReauthExpiresAt] = useState<number | null>(null);
  const { user } = useAdmin();

  // Check if reauth is still valid on mount
  useEffect(() => {
    const stored = localStorage.getItem('admin-reauth-expires');
    if (stored) {
      const expiresAt = parseInt(stored);
      if (Date.now() < expiresAt) {
        setIsReauthenticated(true);
        setReauthExpiresAt(expiresAt);
      } else {
        localStorage.removeItem('admin-reauth-expires');
      }
    }
  }, []);

  // Check expiration periodically
  useEffect(() => {
    if (!reauthExpiresAt) return;

    const interval = setInterval(() => {
      if (Date.now() >= reauthExpiresAt) {
        setIsReauthenticated(false);
        setReauthExpiresAt(null);
        localStorage.removeItem('admin-reauth-expires');
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [reauthExpiresAt]);

  const requireReauth = useCallback(() => {
    if (!isReauthenticated) {
      setShowReauthModal(true);
      return false;
    }
    return true;
  }, [isReauthenticated]);

  const handleReauthSuccess = useCallback(() => {
    const expiresAt = Date.now() + REAUTH_DURATION;
    setIsReauthenticated(true);
    setReauthExpiresAt(expiresAt);
    setShowReauthModal(false);
    localStorage.setItem('admin-reauth-expires', expiresAt.toString());
  }, []);

  const handleReauthCancel = useCallback(() => {
    setShowReauthModal(false);
  }, []);

  const clearReauth = useCallback(() => {
    setIsReauthenticated(false);
    setReauthExpiresAt(null);
    localStorage.removeItem('admin-reauth-expires');
  }, []);

  return {
    isReauthenticated,
    showReauthModal,
    requireReauth,
    handleReauthSuccess,
    handleReauthCancel,
    clearReauth,
    userEmail: user?.email || ''
  };
}
