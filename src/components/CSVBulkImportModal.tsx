import React from 'react';
import { BulkExcelCsvImporterModal } from './BulkExcelCsvImporterModal';

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
  return (
    <BulkExcelCsvImporterModal
      isOpen={isOpen}
      onClose={onClose}
      onImportComplete={() => onImportComplete()}
      currentUserName={teamMembers?.[0]?.name || 'Aravind Reddy'}
    />
  );
};

export default CSVBulkImportModal;
