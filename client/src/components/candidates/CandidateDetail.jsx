// src/components/candidates/CandidateDetail.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Tab,
  Tabs,
  Menu,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Language as LanguageIcon,
  CalendarToday as CalendarIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  VerifiedUser as VerifiedUserIcon,
  Archive as ArchiveIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Add as AddIcon,
  Event as EventIcon,
  MoreVert as MoreVertIcon,
  Message as MessageIcon,
  Assignment as AssignmentIcon,
  Note as NoteIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getCandidateDetails, 
  toggleFavorite,
  archiveCandidate,
  updateCandidateStatus,
  addCandidateNote
} from '../../store/actions/candidateActions';
import { format } from 'date-fns';
import { HelpPanel } from '../documentation/HelpPanel';
import { Tooltip as DocTooltip } from '../documentation/Tooltip';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`candidate-tabpanel-${index}`}
      aria-labelledby={`candidate-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [statusAnchorEl, setStatusAnchorEl] = useState(null);
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('GENERAL');
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  // Redux state
  const { 
    candidate, 
    loading, 
    error 
  } = useSelector(state => state.candidates);
  
  // Fetch candidate details
  useEffect(() => {
    if (id) {
      dispatch(getCandidateDetails(id));
    }
  }, [dispatch, id]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle favorite toggle
  const handleToggleFavorite = () => {
    dispatch(toggleFavorite(id));
  };
  
  // Handle status menu
  const handleStatusMenuOpen = (event) => {
    setStatusAnchorEl(event.currentTarget);
  };
  
  const handleStatusMenuClose = () => {
    setStatusAnchorEl(null);
  };
  
  // Handle more menu
  const handleMoreMenuOpen = (event) => {
    setMoreMenuAnchorEl(event.currentTarget);
  };
  
  const handleMoreMenuClose = () => {
    setMoreMenuAnchorEl(null);
  };
  
  // Handle status change
  const handleStatusChange = (status) => {
    dispatch(updateCandidateStatus(id, status));
    handleStatusMenuClose();
  };
  
  // Handle archive
  const handleArchive = () => {
    dispatch(archiveCandidate(id));
    handleMoreMenuClose();
  };
  
  // Handle note dialog
  const handleNoteDialogOpen = () => {
    setNoteDialogOpen(true);
    handleMoreMenuClose();
  };
  
  const handleNoteDialogClose = () => {
    setNoteDialogOpen(false);
    setNoteContent('');
    setNoteType('GENERAL');
  };
  
  // Handle add note
  const handleAddNote = () => {
    if (noteContent.trim()) {
      dispatch(addCandidateNote(id, { content: noteContent, type: noteType }));
      handleNoteDialogClose();
    }
  };
  
  // Handle document preview
  const handleDocumentPreview = (document) => {
    setSelectedDocument(document);
    setDocumentDialogOpen(true);
  };
  
  // Handle document dialog close
  const handleDocumentDialogClose = () => {
    setDocumentDialogOpen(false);
    setSelectedDocument(null);
  };
  
  // Handle share candidate
  const handleShareCandidate = () => {
    // Implementation for sharing candidate
    alert('Share functionality to be implemented');
    handleMoreMenuClose();
  };
  
  // Status options
  const statusOptions = [
    { value: 'ACTIVE', label: 'Active', color: 'primary' },
    { value: 'CONSIDERING', label: 'Considering', color: 'info' },
    { value: 'SHORTLISTED', label: 'Shortlisted', color: 'success' },
    { value: 'HIRED', label: 'Hired', color: 'success' },
    { value: 'REJECTED', label: 'Rejected', color: 'error' },
    { value: 'ARCHIVED', label: 'Archived', color: 'default' }
  ];
  
  // Note type options
  const noteTypes = [
    { value: 'GENERAL', label: 'General Note' },
    { value: 'INTERVIEW', label: 'Interview Feedback' },
    { value: 'REFERENCE', label: 'Reference Check' },
    { value: 'BACKGROUND', label: 'Background Check' }
  ];
  
  if (loading && !candidate) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
        <Button
          component={RouterLink}
          to="/candidates"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Candidates
        </Button>
      </Alert>
    );
  }
  
  if (!candidate) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        Candidate not found.
        <Button
          component={RouterLink}
          to="/candidates"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Candidates
        </Button>
      </Alert>
    );
  }
  
  // Get status color
  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.color : 'default';
  };
  
  // Get status label
  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.label : status;
  };
  
  return (
    <Box>
      <HelpPanel workflow="candidate-management" />
      
      {/* Navigation and actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          component={RouterLink}
          to="/candidates"
          startIcon={<ArrowBackIcon />}
        >
          Back to Candidates
        </Button>
        
        <Box>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            component={RouterLink}
            to={`/candidates/${id}/edit`}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          
          <Button
            variant="contained"
            startIcon={<WorkIcon />}
            component={RouterLink}
            to={`/candidates/${id}/jobs`}
            sx={{ mr: 1 }}
          >
            Match Jobs
          </Button>
          
          <IconButton
            onClick={handleMoreMenuOpen}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* Candidate profile header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                src={candidate.profileImage}
                alt={`${candidate.firstName} ${candidate.lastName}`}
                sx={{ width: 100, height: 100, mr: 3 }}
              />
              
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h4" component="h1">
                    {candidate.firstName} {candidate.lastName}
                  </Typography>
                  
                  <IconButton
                    onClick={handleToggleFavorite}
                    sx={{ ml: 1 }}
                  >
                    {candidate.favorite ? (
                      <StarIcon color="warning" />
                    ) : (
                      <StarBorderIcon />
                    )}
                  </IconButton>
                  
                  {candidate.kycVerified && (
                    <DocTooltip componentId="kyc-verified-candidate">
                      <VerifiedUserIcon color="success" sx={{ ml: 1 }} />
                    </DocTooltip>
                  )}
                </Box>
                
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {candidate.currentPosition || 'Not specified'}
                  {candidate.currentCompany && ` at ${candidate.currentCompany}`}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={getStatusLabel(candidate.status)}
                    color={getStatusColor(candidate.status)}
                    onClick={handleStatusMenuOpen}
                  />
                  
                  {candidate.priority === 'HIGH' && (
                    <Chip
                      label="High Priority"
                      color="error"
                      variant="outlined"
                    />
                  )}
                  
                  {candidate.availability === 'IMMEDIATE' && (
                    <Chip
                      label="Immediately Available"
                      color="success"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Email"
                  secondary={candidate.email || 'Not provided'}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Phone"
                  secondary={candidate.phone || 'Not provided'}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Location"
                  secondary={candidate.location || 'Not provided'}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Added on"
                  secondary={format(new Date(candidate.createdAt), 'MMMM d, yyyy')}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Paper elevation={2}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Profile" id="candidate-tab-0" />
            <Tab label="Documents" id="candidate-tab-1" />
            <Tab label="Job Applications" id="candidate-tab-2" />
            <Tab label="Notes & Activity" id="candidate-tab-3" />
            <Tab label="Timeline" id="candidate-tab-4" />
          </Tabs>
          
          {/* Profile Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ px: 3 }}>
              <Grid container spacing={3}>
                {/* About section */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    About
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {candidate.bio || 'No bio provided.'}
                  </Typography>
                </Grid>
                
                {/* Skills section */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Skills
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {candidate.skills?.map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        variant="outlined"
                      />
                    ))}
                    {!candidate.skills?.length && (
                      <Typography variant="body2" color="text.secondary">
                        No skills listed.
                      </Typography>
                    )}
                  </Box>
                </Grid>
                
                {/* Languages section */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Languages
                  </Typography>
                  <List dense>
                    {candidate.languages?.map((lang, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <LanguageIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${lang.language} (${lang.proficiency})`}
                        />
                      </ListItem>
                    ))}
                    {!candidate.languages?.length && (
                      <Typography variant="body2" color="text.secondary">
                        No languages listed.
                      </Typography>
                    )}
                  </List>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                
                {/* Education section */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Education
                  </Typography>
                  
                  {candidate.education?.map((edu, index) => (
                    <Box key={index} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <SchoolIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {edu.degree}
                            {edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
                          </Typography>
                          <Typography variant="body2">
                            {edu.institution}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {edu.startDate && format(new Date(edu.startDate), 'MMM yyyy')}
                            {edu.endDate && ` - ${format(new Date(edu.endDate), 'MMM yyyy')}`}
                            {!edu.endDate && edu.current && ' - Present'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                  
                  {!candidate.education?.length && (
                    <Typography variant="body2" color="text.secondary">
                      No education history listed.
                    </Typography>
                  )}
                </Grid>
                
                {/* Experience section */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Work Experience
                  </Typography>
                  
                  {candidate.experience?.map((exp, index) => (
                    <Box key={index} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                          <WorkIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {exp.position}
                          </Typography>
                          <Typography variant="body2">
                            {exp.company}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {exp.startDate && format(new Date(exp.startDate), 'MMM yyyy')}
                            {exp.endDate && ` - ${format(new Date(exp.endDate), 'MMM yyyy')}`}
                            {!exp.endDate && exp.current && ' - Present'}
                          </Typography>
                          {exp.description && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {exp.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  ))}
                  
                  {!candidate.experience?.length && (
                    <Typography variant="body2" color="text.secondary">
                      No work experience listed.
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
          
          {/* Documents Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ px: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Candidate Documents
                </Typography>
                
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  component={RouterLink}
                  to={`/candidates/${id}/documents/upload`}
                >
                  Upload Document
                </Button>
              </Box>
              
              {candidate.documents?.length > 0 ? (
                <Grid container spacing={2}>
                  {candidate.documents.map((doc, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', mr: 2 }}>
                              <DescriptionIcon />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" component="div">
      