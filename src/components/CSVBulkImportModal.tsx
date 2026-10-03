import React from 'react';
import { BulkExcelCsvImporterModal } from './BulkExcelCsvImporterModal';
import { clientFallbackStore } from '../services/clientFallbackStore';

interface CSVBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  teamMembers?: Array<{ name: string; role: string; avatarBg: string }>;
}

export const CSVBulkImportModal: React.FC<CSVBulkImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  teamMembers,
}) => {
  const activeUserName = clientFallbackStore.getCurrentUser()?.name || teamMembers?.[0]?.name || 'Team Member';

  return (
    <BulkExcelCsvImporterModal
      isOpen={isOpen}
      onClose={onClose}
      onImportComplete={() => onImportComplete()}
      currentUserName={activeUserName}
    />
  );
};

export default CSVBulkImportModal;
