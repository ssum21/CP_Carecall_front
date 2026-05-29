import { useState, useCallback } from 'react';

/**
 * @param {(item: any) => string} getItemId - 아이템에서 ID를 추출하는 함수
 * @param {(item: any) => void} [onConfirm] - 발신 확인 시 추가 콜백
 */
export function useManualCall(getItemId, onConfirm) {
  const [confirmId, setConfirmId] = useState(null);
  const [callingId, setCallingId] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  const handleClick = useCallback((item, e) => {
    e.stopPropagation();
    const id = getItemId(item);
    if (confirmId === id) {
      setConfirmId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setPopoverPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
      setConfirmId(id);
    }
  }, [confirmId, getItemId]);

  const handleConfirm = useCallback((item) => {
    setConfirmId(null);
    setCallingId(getItemId(item));
    onConfirm?.(item);
    setTimeout(() => setCallingId(null), 2500);
  }, [getItemId, onConfirm]);

  const handleClose = useCallback(() => setConfirmId(null), []);

  return { confirmId, callingId, popoverPos, handleClick, handleConfirm, handleClose };
}
