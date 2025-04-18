// src/components/auth/UserTypeSelection.jsx
import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Groups as GroupsIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';

const UserTypeCard = ({ 
  value,
  selected,
  icon: Icon,
  title,
  description,
  onClick
}) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={selected ? 3 : 1}
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        borderColor: selected ? theme.palette.primary.main : 'transparent',
        borderWidth: 2,
        borderStyle: 'solid',
        backgroundColor: selected ? `${theme.palette.primary.main}10` : theme.palette.background.paper,
        '&:hover': {
          backgroundColor: selected 
            ? `${theme.palette.primary.main}15` 
            : theme.palette.action.hover
        }
      }}
      onClick={() => onClick(value)}
    >
      <Box
        sx={{
          width: 70,
          height: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          backgroundColor: selected 
            ? `${theme.palette.primary.main}20` 
            : theme.palette.action.hover,
          mb: 2
        }}
      >
        <Icon 
          sx={{ 
            fontSize: 40, 
            color: selected ? theme.palette.primary.main : theme.palette.text.secondary 
          }} 
        />
      </Box>
      
      <Typography variant="h6" component="h3" gutterBottom fontWeight={500}>
        {title}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
        {description}
      </Typography>
      
      <Radio
        checked={selected}
        sx={{ mt: 2, alignSelf: 'center' }}
        value={value}
      />
    </Paper>
  );
};

const UserTypeSelection = ({ value, onChange, error, helperText }) => {
  const handleChange = (newValue) => {
    onChange(newValue);
  };
  
  const userTypes = [
    {
      value: 'jobSeeker',
      title: 'Job Seeker',
      description: 'Find verified job opportunities in the Middle East with transparent terms and secure payments.',
      icon: PersonIcon
    },
    {
      value: 'agent',
      title: 'Recruitment Agent',
      description: 'Connect job seekers with verified employers through our transparent blockchain platform.',
      icon: GroupsIcon
    },
    {
      value: 'sponsor',
      title: 'Employer/Sponsor',
      description: 'Find verified candidates and manage the hiring process with full transparency and security.',
      icon: BusinessIcon
    }
  ];
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Select your account type
      </Typography>
      
      <RadioGroup
        aria-label="user-type"
        name="userType"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
      >
        <Grid container spacing={3}>
          {userTypes.map((type) => (
            <Grid item xs={12} md={4} key={type.value}>
              <UserTypeCard
                value={type.value}
                selected={value === type.value}
                icon={type.icon}
                title={type.title}
                description={type.description}
                onClick={handleChange}
              />
            </Grid>
          ))}
        </Grid>
      </RadioGroup>
      
      {error && (
        <FormHelperText error sx={{ mt: 1, textAlign: 'center' }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};

UserTypeSelection.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.bool,
  helperText: PropTypes.string
};

export default UserTypeSelection;