// src/components/verification/BlockchainVerificationDetails/BlockchainVerificationDetails.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Verified as VerifiedIcon,
  LinkOff as LinkOffIcon,
  Link as LinkIcon,
  ContentCopy as ContentCopyIcon,
  OpenInNew as OpenInNewIcon,
  Fingerprint as FingerprintIcon,
  History as HistoryIcon,
  Computer as ComputerIcon,
  InfoOutlined as InfoOutlinedIcon,
  CheckCircle as CheckCircleIcon,
  QrCode as QrCodeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import styles from './BlockchainVerificationDetails.module.css';
import { formatDate, formatDateTime } from '../../../utils/dateUtils';
import LoadingSpinner from '../../common/LoadingSpinner';

/**
 * Component for displaying blockchain verification details
 * 
 * @param {Object} props - Component props
 * @param {Object} props.blockchainData - Blockchain verification data
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onVerify - Function to trigger reverification
 * @param {string} props.documentId - ID of the document being verified
 */
const BlockchainVerificationDetails = ({ 
  blockchainData,
  loading = false,
  onVerify,
  documentId
}) => {
  const [expanded, setExpanded] = useState('panel1');
  const [modalOpen, setModalOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleCopyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleVerify = async () => {
    if (onVerify) {
      setVerifying(true);
      try {
        await onVerify(documentId);
      } finally {
        setVerifying(false);
      }
    }
  };

  // If data is loading, show loading indicator
  if (loading && !blockchainData) {
    return <LoadingSpinner />;
  }

  // If no blockchain data, show not verified message
  if (!blockchainData) {
    return (
      <Paper elevation={2} className={styles.container}>
        <Box className={styles.header}>
          <Box className={styles.titleRow}>
            <Box className={styles.iconContainer}>
              <LinkOffIcon fontSize="large" />
            </Box>
            <Typography variant="h5" component="h2">
              Not Verified On Blockchain
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary" className={styles.subtitle}>
            This document has not been verified on the blockchain yet.
          </Typography>
        </Box>
        <Divider />
        <Box className={styles.notVerifiedContent}>
          <Alert severity="info" className={styles.alert}>
            Blockchain verification provides an immutable record of document authenticity, timestamps, and verification status. This document has not been added to the blockchain ledger.
          </Alert>
          
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleVerify}
            startIcon={verifying ? <CircularProgress size={20} color="inherit" /> : <LinkIcon />}
            disabled={verifying}
            className={styles.verifyButton}
          >
            {verifying ? 'Verifying...' : 'Verify Document'}
          </Button>
        </Box>
      </Paper>
    );
  }

  // Determine verification status
  const isVerified = blockchainData.status === 'VERIFIED';
  const statusColor = isVerified ? 'success' : blockchainData.status === 'PENDING' ? 'warning' : 'error';
  const statusText = isVerified ? 'Verified' : blockchainData.status === 'PENDING' ? 'Pending' : 'Failed';

  // Format timestamps
  const verifiedAt = blockchainData.timestamp ? formatDateTime(blockchainData.timestamp) : 'N/A';
  const blockTime = blockchainData.blockData?.timestamp ? formatDateTime(blockchainData.blockData.timestamp) : 'N/A';

  return (
    <Paper elevation={2} className={styles.container}>
      {/* Header Section */}
      <Box className={styles.header}>
        <Box className={styles.titleRow}>
          <Box className={styles.iconContainer}>
            <FingerprintIcon fontSize="large" />
          </Box>
          <Typography variant="h5" component="h2">
            Blockchain Verification
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary" className={styles.subtitle}>
          Verified on {blockchainData.network || 'Blockchain'} Network
        </Typography>
      </Box>

      <Divider />

      {/* Status Summary Section */}
      <Box className={styles.statusSection}>
        <Box className={styles.statusRow}>
          <Chip
            icon={isVerified ? <VerifiedIcon /> : <InfoOutlinedIcon />}
            label={statusText}
            color={statusColor}
            className={styles.statusChip}
          />
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<QrCodeIcon />}
            onClick={handleOpenModal}
            className={styles.verificationCodeButton}
          >
            Verification Code
          </Button>
        </Box>
        
        <Typography variant="body2" className={styles.statusMessage}>
          {isVerified 
            ? 'This document has been successfully verified on the blockchain. The verification is immutable and tamper-proof.'
            : blockchainData.status === 'PENDING'
              ? 'This document verification is being processed on the blockchain. Please check back later.'
              : 'This document verification failed. Please check the details below for more information.'}
        </Typography>
      </Box>

      <Divider />

      {/* Accordion details */}
      <Box className={styles.detailsSection}>
        <Accordion 
          expanded={expanded === 'panel1'} 
          onChange={handleAccordionChange('panel1')}
          className={styles.accordion}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            className={styles.accordionSummary}
          >
            <Box className={styles.accordionTitleBox}>
              <ComputerIcon color="primary" />
              <Typography variant="subtitle1">Blockchain Transaction Details</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails className={styles.accordionDetails}>
            <TableContainer component={Paper} variant="outlined" className={styles.tableContainer}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" className={styles.tableLabel}>
                      Transaction Hash
                    </TableCell>
                    <TableCell className={styles.tableValue}>
                      <Box className={styles.copyableField}>
                        <Typography variant="body2" className={styles.hashValue}>
                          {blockchainData.transactionHash}
                        </Typography>
                        <Tooltip title={copiedField === 'txHash' ? 'Copied!' : 'Copy to clipboard'}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleCopyToClipboard(blockchainData.transactionHash, 'txHash')}
                            className={styles.copyButton}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {blockchainData.explorerUrl && (
                          <Tooltip title="View on Blockchain Explorer">
                            <IconButton 
                              size="small" 
                              component="a" 
                              href={blockchainData.explorerUrl} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.explorerButton}
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" className={styles.tableLabel}>
                      Block Number
                    </TableCell>
                    <TableCell>
                      {blockchainData.blockData?.number || 'Pending'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" className={styles.tableLabel}>
                      Block Time
                    </TableCell>
                    <TableCell>{blockTime}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" className={styles.tableLabel}>
                      Network
                    </TableCell>
                    <TableCell>{blockchainData.network || 'Unknown'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" className={styles.tableLabel}>
                      Verification Time
                    </TableCell>
                    <TableCell>{verifiedAt}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>

        <Accordion 
          expanded={expanded === 'panel2'} 
          onChange={handleAccordionChange('panel2')}
          className={styles.accordion}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            className={styles.accordionSummary}
          >
            <Box className={styles.accordionTitleBox}>
              <HistoryIcon color="primary" />
              <Typography variant="subtitle1">Document Record Details</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails className={styles.accordionDetails}>
            <TableContainer component={Paper} variant="outlined" className={styles.tableContainer}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" className={styles.tableLabel}>
                      Document Hash
                    </TableCell>
                    <TableCell className={styles.tableValue}>
                      <Box className={styles.copyableField}>
                        <Typography variant="body2" className={styles.hashValue}>
                          {blockchainData.documentHash}
                        </Typography>
                        <Tooltip title={copiedField === 'docHash' ? 'Copied!' : 'Copy to clipboard'}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleCopyToClipboard(blockchainData.documentHash, 'docHash')}
                            className={styles.copyButton}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" className={styles.tableLabel}>
                      Document ID
                    </TableCell>
                    <TableCell>{documentId || blockchainData.documentId || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" className={styles.tableLabel}>
                      Issuer ID
                    </TableCell>
                    <TableCell>{blockchainData.issuerId || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" className={styles.tableLabel}>
                      Document Type
                    </TableCell>
                    <TableCell>{blockchainData.documentType || 'N/A'}</TableCell>
                  </TableRow>
                  {blockchainData.expiryDate && (
                    <TableRow>
                      <TableCell component="th" className={styles.tableLabel}>
                        Expiry Date
                      </TableCell>
                      <TableCell>{formatDate(blockchainData.expiryDate)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {blockchainData.verificationData && (
              <Box className={styles.metadataBox}>
                <Typography variant="subtitle2" gutterBottom>
                  Verification Metadata
                </Typography>
                <TableContainer component={Paper} variant="outlined" className={styles.tableContainer}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Field</TableCell>
                        <TableCell>Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(blockchainData.verificationData).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell component="th">{key}</TableCell>
                          <TableCell>{typeof value === 'object' ? JSON.stringify(value) : value.toString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Action Section */}
      <Box className={styles.actionSection}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleVerify}
          disabled={verifying}
          className={styles.verifyButton}
        >
          {verifying ? 'Refreshing...' : 'Refresh Verification'}
        </Button>
        
        {blockchainData.verificationUrl && (
          <Button
            variant="outlined"
            endIcon={<OpenInNewIcon />}
            component="a"
            href={blockchainData.verificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.exploreButton}
          >
            Verify Externally
          </Button>
        )}
      </Box>

      {/* Verification Code Modal */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="verification-code-dialog"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="verification-code-dialog">Blockchain Verification Code</DialogTitle>
        <DialogContent>
          <Box className={styles.qrCodeContainer}>
            {blockchainData.qrCodeUrl ? (
              <img 
                src={blockchainData.qrCodeUrl} 
                alt="Verification QR Code"
                className={styles.qrCode}
              />
            ) : (
              <Box className={styles.qrCodePlaceholder}>
                <QrCodeIcon fontSize="large" />
                <Typography variant="body2">QR Code Not Available</Typography>
              </Box>
            )}
          </Box>
          
          <Box className={styles.verificationCodeBox}>
            <Typography variant="subtitle2" gutterBottom>
              Verification Code
            </Typography>
            <Box className={styles.codeContainer}>
              <Typography variant="body1" className={styles.verificationCode}>
                {blockchainData.verificationCode || blockchainData.transactionHash?.substring(0, 14)}
              </Typography>
              <Tooltip title={copiedField === 'verCode' ? 'Copied!' : 'Copy to clipboard'}>
                <IconButton 
                  size="small" 
                  onClick={() => handleCopyToClipboard(
                    blockchainData.verificationCode || blockchainData.transactionHash,
                    'verCode'
                  )}
                  className={styles.copyButton}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="body2" color="textSecondary">
              Use this code to verify the document's authenticity on our public verification portal.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          {blockchainData.publicVerificationUrl && (
            <Button 
              color="primary" 
              component="a"
              href={blockchainData.publicVerificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<CheckCircleIcon />}
            >
              Public Verification Portal
            </Button>
          )}
          <Button onClick={handleCloseModal} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

BlockchainVerificationDetails.propTypes = {
  blockchainData: PropTypes.shape({
    status: PropTypes.string,
    documentHash: PropTypes.string,
    transactionHash: PropTypes.string,
    timestamp: PropTypes.string,
    network: PropTypes.string,
    documentId: PropTypes.string,
    documentType: PropTypes.string,
    issuerId: PropTypes.string,
    expiryDate: PropTypes.string,
    explorerUrl: PropTypes.string,
    verificationUrl: PropTypes.string,
    publicVerificationUrl: PropTypes.string,
    verificationCode: PropTypes.string,
    qrCodeUrl: PropTypes.string,
    blockData: PropTypes.shape({
      number: PropTypes.number,
      timestamp: PropTypes.string
    }),
    verificationData: PropTypes.object
  }),
  loading: PropTypes.bool,
  onVerify: PropTypes.func,
  documentId: PropTypes.string
};

export default BlockchainVerificationDetails;