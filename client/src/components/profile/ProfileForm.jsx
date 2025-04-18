// src/components/profile/ProfileForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  Divider,
  Avatar,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  FormHelperText,
  InputAdornment
} from '@mui/material';
import {
  AddAPhoto as AddAPhotoIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Language as LanguageIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, getProfile } from '../../store/actions/profileActions';
import useAuth from '../auth/useAuth';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, parseISO } from 'date-fns';

// Field restrictions
const MAX_SKILLS = 15;
const MAX_LANGUAGES = 5;

// Validation schema
const validationSchema = Yup.object({
  firstName: Yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: Yup.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  phone: Yup.string()
    .matches(/^\+?[0-9]{10,15}$/, 'Enter a valid phone number')
    .required('Phone number is required'),
  dateOfBirth: Yup.date()
    .nullable()
    .max(new Date(), 'Date of birth cannot be in the future')
    .test('age', 'You must be at least 18 years old', function(value) {
      if (!value) return true;
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 18);
      return value <= cutoff;
    }),
  nationality: Yup.string()
    .required('Nationality is required'),
  address: Yup.string()
    .required('Address is required'),
  city: Yup.string()
    .required('City is required'),
  country: Yup.string()
    .required('Country is required'),
  education: Yup.array().of(
    Yup.object().shape({
      institution: Yup.string().required('Institution name is required'),
      degree: Yup.string().required('Degree is required'),
      fieldOfStudy: Yup.string().required('Field of study is required'),
      startDate: Yup.date().nullable().required('Start date is required'),
      endDate: Yup.date().nullable(),
    })
  ),
  experience: Yup.array().of(
    Yup.object().shape({
      company: Yup.string().required('Company name is required'),
      position: Yup.string().required('Position is required'),
      startDate: Yup.date().nullable().required('Start date is required'),
      endDate: Yup.date().nullable(),
      description: Yup.string()
    })
  ),
  skills: Yup.array()
    .of(Yup.string())
    .max(MAX_SKILLS, `You can add up to ${MAX_SKILLS} skills`),
  languages: Yup.array()
    .of(
      Yup.object().shape({
        language: Yup.string().required('Language name is required'),
        proficiency: Yup.string().required('Proficiency level is required')
      })
    )
    .max(MAX_LANGUAGES, `You can add up to ${MAX_LANGUAGES} languages`)
});

const ProfileForm = () => {
  const dispatch = useDispatch();
  const { user, updateProfile: updateAuthProfile } = useAuth();
  const { profile, loading, error } = useSelector(state => state.profile);
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  
  // Populate form with existing profile data
  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  // Create profile data object for formik
  const profileData = {
    firstName: profile?.firstName || user?.firstName || '',
    lastName: profile?.lastName || user?.lastName || '',
    phone: profile?.phone || user?.phone || '',
    dateOfBirth: profile?.dateOfBirth ? parseISO(profile.dateOfBirth) : null,
    nationality: profile?.nationality || '',
    address: profile?.address || '',
    city: profile?.city || '',
    country: profile?.country || '',
    bio: profile?.bio || '',
    education: profile?.education?.length ? profile.education : [{
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: null,
      endDate: null
    }],
    experience: profile?.experience?.length ? profile.experience : [{
      company: '',
      position: '',
      startDate: null,
      endDate: null,
      description: ''
    }],
    skills: profile?.skills || [],
    languages: profile?.languages?.length ? profile.languages : [{
      language: '',
      proficiency: ''
    }]
  };

  // Set up formik
  const formik = useFormik({
    initialValues: profileData,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      const formData = new FormData();
      
      // Convert dates to ISO strings
      const processedValues = {
        ...values,
        dateOfBirth: values.dateOfBirth ? format(values.dateOfBirth, 'yyyy-MM-dd') : null,
        education: values.education.map(edu => ({
          ...edu,
          startDate: edu.startDate ? format(edu.startDate, 'yyyy-MM-dd') : null,
          endDate: edu.endDate ? format(edu.endDate, 'yyyy-MM-dd') : null
        })),
        experience: values.experience.map(exp => ({
          ...exp,
          startDate: exp.startDate ? format(exp.startDate, 'yyyy-MM-dd') : null,
          endDate: exp.endDate ? format(exp.endDate, 'yyyy-MM-dd') : null
        }))
      };
      
      // Append profile data
      formData.append('profile', JSON.stringify(processedValues));
      
      // Append profile image if selected
      if (selectedImage) {
        formData.append('profileImage', selectedImage);
      }
      
      try {
        await dispatch(updateProfile(formData));
        
        // Update auth context with new user data
        updateAuthProfile({
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone
        });
        
        setShowSuccessAlert(true);
        setTimeout(() => {
          setShowSuccessAlert(false);
        }, 3000);
      } catch (err) {
        console.error('Error updating profile:', err);
      }
    }
  });

  // Handle profile image change
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPG or PNG)');
        return;
      }
      
      if (file.size > maxSize) {
        alert('Image size should not exceed 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle adding a new education entry
  const handleAddEducation = () => {
    formik.setFieldValue('education', [
      ...formik.values.education,
      {
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startDate: null,
        endDate: null
      }
    ]);
  };

  // Handle removing an education entry
  const handleRemoveEducation = (index) => {
    const updatedEducation = [...formik.values.education];
    updatedEducation.splice(index, 1);
    formik.setFieldValue('education', updatedEducation);
  };

  // Handle adding a new experience entry
  const handleAddExperience = () => {
    formik.setFieldValue('experience', [
      ...formik.values.experience,
      {
        company: '',
        position: '',
        startDate: null,
        endDate: null,
        description: ''
      }
    ]);
  };

  // Handle removing an experience entry
  const handleRemoveExperience = (index) => {
    const updatedExperience = [...formik.values.experience];
    updatedExperience.splice(index, 1);
    formik.setFieldValue('experience', updatedExperience);
  };

  // Handle adding a new skill
  const handleAddSkill = () => {
    if (newSkill.trim() && !formik.values.skills.includes(newSkill.trim())) {
      formik.setFieldValue('skills', [...formik.values.skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  // Handle removing a skill
  const handleRemoveSkill = (skill) => {
    formik.setFieldValue(
      'skills',
      formik.values.skills.filter(s => s !== skill)
    );
  };

  // Handle adding a new language
  const handleAddLanguage = () => {
    formik.setFieldValue('languages', [
      ...formik.values.languages,
      {
        language: '',
        proficiency: ''
      }
    ]);
  };

  // Handle removing a language
  const handleRemoveLanguage = (index) => {
    const updatedLanguages = [...formik.values.languages];
    updatedLanguages.splice(index, 1);
    formik.setFieldValue('languages', updatedLanguages);
  };

  // Proficiency levels for languages
  const proficiencyLevels = [
    { value: 'basic', label: 'Basic' },
    { value: 'conversational', label: 'Conversational' },
    { value: 'fluent', label: 'Fluent' },
    { value: 'native', label: 'Native' }
  ];

  // List of countries
  const countries = [
    'Kenya', 'Uganda', 'Tanzania', 'Ethiopia', 'Saudi Arabia', 
    'United Arab Emirates', 'Qatar', 'Bahrain', 'Kuwait', 'Oman',
    // Add more countries as needed
  ];

  // List of nationalities
  const nationalities = [
    'Kenyan', 'Ugandan', 'Tanzanian', 'Ethiopian', 'Saudi Arabian', 
    'Emirati', 'Qatari', 'Bahraini', 'Kuwaiti', 'Omani',
    // Add more nationalities as needed
  ];

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      {showSuccessAlert && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Profile updated successfully!
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        {/* Profile Image */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            src={imagePreview || user?.profileImage}
            alt={`${formik.values.firstName} ${formik.values.lastName}`}
            sx={{ width: 100, height: 100, mr: 3 }}
          />
          <Box>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="profile-image-upload"
              type="file"
              onChange={handleImageChange}
            />
            <label htmlFor="profile-image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<AddAPhotoIcon />}
              >
                Change Photo
              </Button>
            </label>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Recommended: Square JPG or PNG, max 5MB
            </Typography>
          </Box>
        </Box>
        
        <Grid container spacing={3}>
          {/* Personal Info */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="firstName"
              name="firstName"
              label="First Name"
              value={formik.values.firstName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.firstName && Boolean(formik.errors.firstName)}
              helperText={formik.touched.firstName && formik.errors.firstName}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="lastName"
              name="lastName"
              label="Last Name"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.lastName && Boolean(formik.errors.lastName)}
              helperText={formik.touched.lastName && formik.errors.lastName}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="phone"
              name="phone"
              label="Phone Number"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.phone && Boolean(formik.errors.phone)}
              helperText={
                (formik.touched.phone && formik.errors.phone) ||
                "Include country code (e.g., +254 for Kenya)"
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon color="action" />
                  </InputAdornment>
                )
              }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date of Birth"
                value={formik.values.dateOfBirth}
                onChange={value => formik.setFieldValue('dateOfBirth', value)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.dateOfBirth && Boolean(formik.errors.dateOfBirth),
                    helperText: formik.touched.dateOfBirth && formik.errors.dateOfBirth,
                    required: true
                  }
                }}
                disableFuture
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth
              error={formik.touched.nationality && Boolean(formik.errors.nationality)}
              required
            >
              <InputLabel id="nationality-label">Nationality</InputLabel>
              <Select
                labelId="nationality-label"
                id="nationality"
                name="nationality"
                value={formik.values.nationality}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                label="Nationality"
              >
                {nationalities.map(nationality => (
                  <MenuItem key={nationality} value={nationality}>
                    {nationality}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.nationality && formik.errors.nationality && (
                <FormHelperText>{formik.errors.nationality}</FormHelperText>
              )}
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Address */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Contact Information
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="address"
              name="address"
              label="Address"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.address && Boolean(formik.errors.address)}
              helperText={formik.touched.address && formik.errors.address}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationIcon color="action" />
                  </InputAdornment>
                )
              }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="city"
              name="city"
              label="City"
              value={formik.values.city}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.city && Boolean(formik.errors.city)}
              helperText={formik.touched.city && formik.errors.city}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth
              error={formik.touched.country && Boolean(formik.errors.country)}
              required
            >
              <InputLabel id="country-label">Country</InputLabel>
              <Select
                labelId="country-label"
                id="country"
                name="country"
                value={formik.values.country}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                label="Country"
              >
                {countries.map(country => (
                  <MenuItem key={country} value={country}>
                    {country}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.country && formik.errors.country && (
                <FormHelperText>{formik.errors.country}</FormHelperText>
              )}
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Bio */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Professional Summary
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <TextField
          fullWidth
          id="bio"
          name="bio"
          label="Bio"
          multiline
          rows={4}
          value={formik.values.bio}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.bio && Boolean(formik.errors.bio)}
          helperText={
            (formik.touched.bio && formik.errors.bio) ||
            "Write a brief summary about yourself, your skills, and career goals"
          }
        />
      </Paper>
      
      {/* Education */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Education
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddEducation}
            disabled={formik.values.education.length >= 5}
          >
            Add Education
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />
        
        {formik.values.education.map((edu, index) => (
          <Box key={index} sx={{ mb: 4, pb: 3, borderBottom: index < formik.values.education.length - 1 ? '1px dashed #e0e0e0' : 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={500}>
                <SchoolIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Education #{index + 1}
              </Typography>
              {formik.values.education.length > 1 && (
                <IconButton 
                  color="error" 
                  onClick={() => handleRemoveEducation(index)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
            
            <Grid container spacing={3}>
              <Grid