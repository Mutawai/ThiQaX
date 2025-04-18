// src/components/profile/UserSettings.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Language as LanguageIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  LockReset as LockResetIcon,
  Settings as SettingsIcon,
  ErrorOutline as ErrorOutlineIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserSettings, getUserSettings, updatePassword, deleteAccount } from '../../store/actions/userActions';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import useAuth from '../auth/useAuth';
import { HelpPanel } from '../documentation/HelpPanel';

/**
 * TabPanel component for settings tabs
 */
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

/**
 * User Settings Component
 * Allows users to manage their account settings, notifications, and security
 */
const UserSettings = () => {
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  
  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  
  // Redux state
  const { settings, loading, error, success } = useSelector(state => state.user);
  
  // Fetch user settings
  useEffect(() => {
    dispatch(getUserSettings());
  }, [dispatch]);
  
  // Reset success/error state after timeout
  useEffect(() => {
    if (passwordChanged || settingsSaved) {
      const timer = setTimeout(() => {
        setPasswordChanged(false);
        setSettingsSaved(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [passwordChanged, settingsSaved]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Toggle password visibility
  const handleTogglePasswordVisibility = (field) => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };
  
  // Handle delete account dialog
  const handleDeleteAccountDialog = () => {
    setDeleteDialogOpen(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteConfirmText('');
  };
  
  // Notification settings form
  const notificationFormik = useFormik({
    initialValues: {
      emailNotifications: settings?.notifications?.email || true,
      pushNotifications: settings?.notifications?.push || true,
      jobAlerts: settings?.notifications?.jobAlerts || true,
      applicationUpdates: settings?.notifications?.applicationUpdates || true,
      marketingEmails: settings?.notifications?.marketingEmails || false,
      systemAnnouncements: settings?.notifications?.systemAnnouncements || true
    },
    enableReinitialize: true,
    onSubmit: (values) => {
      const updatedSettings = {
        notifications: {
          email: values.emailNotifications,
          push: values.pushNotifications,
          jobAlerts: values.jobAlerts,
          applicationUpdates: values.applicationUpdates,
          marketingEmails: values.marketingEmails,
          systemAnnouncements: values.systemAnnouncements
        }
      };
      
      dispatch(updateUserSettings(updatedSettings));
      setSettingsSaved(true);
    }
  });
  
  // Preferences form
  const preferencesFormik = useFormik({
    initialValues: {
      language: settings?.preferences?.language || 'en',
      timezone: settings?.preferences?.timezone || 'UTC',
      dateFormat: settings?.preferences?.dateFormat || 'MM/DD/YYYY',
      darkMode: settings?.preferences?.darkMode || false
    },
    enableReinitialize: true,
    onSubmit: (values) => {
      const updatedSettings = {
        preferences: {
          language: values.language,
          timezone: values.timezone,
          dateFormat: values.dateFormat,
          darkMode: values.darkMode
        }
      };
      
      dispatch(updateUserSettings(updatedSettings));
      setSettingsSaved(true);
    }
  });
  
  // Password change form with validation
  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string()
        .required('Current password is required'),
      newPassword: Yup.string()
        .required('New password is required')
        .min(8, 'Password must be at least 8 characters')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        )
        .notOneOf([Yup.ref('currentPassword')], 'New password must be different from current password'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
        .required('Please confirm your password')
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        await dispatch(updatePassword(values.currentPassword, values.newPassword));
        resetForm();
        setPasswordChanged(true);
      } catch (err) {
        // Error will be handled by Redux state
      }
    }
  });
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== user.email) {
      return;
    }
    
    try {
      await dispatch(deleteAccount());
      handleCloseDeleteDialog();
      logout(); // Log out after successful account deletion
    } catch (err) {
      // Error will be handled by Redux state
    }
  };
  
  // Language options
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'sw', name: 'Swahili' },
    { code: 'ar', name: 'Arabic' }
  ];
  
  // Timezone options
  const timezones = [
    { code: 'UTC', name: 'UTC (Coordinated Universal Time)' },
    { code: 'EAT', name: 'East Africa Time (UTC+3)' },
    { code: 'AST', name: 'Arabia Standard Time (UTC+3)' }
  ];
  
  // Date format options
  const dateFormats = [
    { code: 'MM/DD/YYYY', name: 'MM/DD/YYYY' },
    { code: 'DD/MM/YYYY', name: 'DD/MM/YYYY' },
    { code: 'YYYY-MM-DD', name: 'YYYY-MM-DD' }
  ];
  
  return (
    <Box>
      <HelpPanel workflow="user-settings" />
      
      <Paper elevation={2} sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="settings tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<NotificationsIcon />} label="Notifications" id="settings-tab-0" />
            <Tab icon={<LanguageIcon />} label="Preferences" id="settings-tab-1" />
            <Tab icon={<SecurityIcon />} label="Security" id="settings-tab-2" />
            <Tab icon={<SettingsIcon />} label="Account" id="settings-tab-3" />
          </Tabs>
        </Box>
        
        {/* Global success/error alerts */}
        {error && (
          <Alert severity="error" sx={{ mx: 3, mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mx: 3, mt: 2 }}>
            Settings updated successfully.
          </Alert>
        )}
        
        {passwordChanged && (
          <Alert severity="success" sx={{ mx: 3, mt: 2 }}>
            Password changed successfully.
          </Alert>
        )}
        
        {settingsSaved && (
          <Alert severity="success" sx={{ mx: 3, mt: 2 }}>
            Settings saved successfully.
          </Alert>
        )}
        
        {/* Notifications Tab */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Notification Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Control how and when you receive notifications from ThiQaX.
          </Typography>
          
          <Box component="form" onSubmit={notificationFormik.handleSubmit}>
            <List>
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Email Notifications" 
                  secondary="Receive notifications via email"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    name="emailNotifications"
                    checked={notificationFormik.values.emailNotifications}
                    onChange={notificationFormik.handleChange}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Push Notifications" 
                  secondary="Receive notifications on your device"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    name="pushNotifications"
                    checked={notificationFormik.values.pushNotifications}
                    onChange={notificationFormik.handleChange}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Job Alerts" 
                  secondary="Receive alerts for new job opportunities"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    name="jobAlerts"
                    checked={notificationFormik.values.jobAlerts}
                    onChange={notificationFormik.handleChange}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Application Updates" 
                  secondary="Receive updates about your job applications"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    name="applicationUpdates"
                    checked={notificationFormik.values.applicationUpdates}
                    onChange={notificationFormik.handleChange}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Marketing Emails" 
                  secondary="Receive promotional emails and newsletters"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    name="marketingEmails"
                    checked={notificationFormik.values.marketingEmails}
                    onChange={notificationFormik.handleChange}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="System Announcements" 
                  secondary="Receive important system announcements and updates"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    name="systemAnnouncements"
                    checked={notificationFormik.values.systemAnnouncements}
                    onChange={notificationFormik.handleChange}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                Save Notification Settings
              </Button>
            </Box>
          </Box>
        </TabPanel>
        
        {/* Preferences Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Preferences
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Customize your experience on ThiQaX.
          </Typography>
          
          <Box component="form" onSubmit={preferencesFormik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  id="language"
                  name="language"
                  label="Language"
                  value={preferencesFormik.values.language}
                  onChange={preferencesFormik.handleChange}
                  SelectProps={{
                    native: true,
                  }}
                  helperText="Select your preferred language"
                >
                  {languages.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.name}
                    </option>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  id="timezone"
                  name="timezone"
                  label="Timezone"
                  value={preferencesFormik.values.timezone}
                  onChange={preferencesFormik.handleChange}
                  SelectProps={{
                    native: true,
                  }}
                  helperText="Select your timezone"
                >
                  {timezones.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.name}
                    </option>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  id="dateFormat"
                  name="dateFormat"
                  label="Date Format"
                  value={preferencesFormik.values.dateFormat}
                  onChange={preferencesFormik.handleChange}
                  SelectProps={{
                    native: true,
                  }}
                  helperText="Select your preferred date format"
                >
                  {dateFormats.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.name}
                    </option>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="darkMode"
                      checked={preferencesFormik.values.darkMode}
                      onChange={preferencesFormik.handleChange}
                    />
                  }
                  label="Dark Mode"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                Save Preferences
              </Button>
            </Box>
          </Box>
        </TabPanel>
        
        {/* Security Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Security Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Manage your account security and password.
          </Typography>
          
          <Box component="form" onSubmit={passwordFormik.handleSubmit} sx={{ maxWidth: 500, mx: 'auto' }}>
            <TextField
              fullWidth
              margin="normal"
              id="currentPassword"
              name="currentPassword"
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={passwordFormik.values.currentPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              error={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
              helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle current password visibility"
                      onClick={() => handleTogglePasswordVisibility('current')}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              margin="normal"
              id="newPassword"
              name="newPassword"
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordFormik.values.newPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
              helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
 