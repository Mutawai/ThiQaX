// src/components/landing/HowItWorks.jsx
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  VerifiedUser as VerifiedUserIcon,
  Search as SearchIcon,
  Send as SendIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Handshake as HandshakeIcon,
  Flight as FlightIcon,
  Paid as PaidIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import useAuth from '../auth/useAuth';

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`process-tabpanel-${index}`}
      aria-labelledby={`process-tab-${index}`}
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

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

// Main Component
const HowItWorks = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated } = useAuth();
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Define process steps for each user type
  const processSteps = {
    jobSeeker: [
      {
        label: 'Create Your Account',
        description: 'Sign up with your basic information and select "Job Seeker" as your role.',
        icon: <PersonAddIcon />
      },
      {
        label: 'Complete Your Profile',
        description: 'Add your work experience, education, skills, and preferences to stand out to employers.',
        icon: <VerifiedUserIcon />
      },
      {
        label: 'Verify Your Identity',
        description: 'Upload your identification documents for KYC verification to build trust with employers.',
        icon: <DocumentScannerIcon />
      },
      {
        label: 'Browse & Apply for Jobs',
        description: 'Search for verified Middle Eastern job opportunities that match your skills and preferences.',
        icon: <SearchIcon />
      },
      {
        label: 'Interview Process',
        description: 'Participate in secure video interviews with potential employers through our platform.',
        icon: <MarkEmailReadIcon />
      },
      {
        label: 'Secure Job Offer',
        description: 'Receive and review blockchain-verified employment contracts with clear terms.',
        icon: <HandshakeIcon />
      },
      {
        label: 'Pre-Departure & Travel',
        description: 'Access preparation resources and track your visa/travel documentation process.',
        icon: <FlightIcon />
      },
      {
        label: 'Safe Employment',
        description: 'Receive payments through our secure escrow system and maintain communication with support.',
        icon: <PaidIcon />
      }
    ],
    employer: [
      {
        label: 'Register as an Employer',
        description: 'Create your company profile and verify your business credentials.',
        icon: <PersonAddIcon />
      },
      {
        label: 'Complete Verification',
        description: 'Submit required documents for our thorough verification process.',
        icon: <VerifiedUserIcon />
      },
      {
        label: 'Post Job Opportunities',
        description: 'Create detailed job listings with clear requirements and compensation.',
        icon: <SendIcon />
      },
      {
        label: 'Review Applications',
        description: 'Browse verified candidate profiles and review applications.',
        icon: <SearchIcon />
      },
      {
        label: 'Conduct Interviews',
        description: 'Schedule and conduct secure video interviews with promising candidates.',
        icon: <MarkEmailReadIcon />
      },
      {
        label: 'Extend Secure Offers',
        description: 'Create blockchain-verified employment contracts with transparent terms.',
        icon: <HandshakeIcon />
      }
    ],
    agent: [
      {
        label: 'Register as a Recruitment Agent',
        description: 'Create your agency profile and submit your licensing documentation.',
        icon: <PersonAddIcon />
      },
      {
        label: 'Complete Verification',
        description: 'Undergo our thorough verification process to become a trusted agent.',
        icon: <VerifiedUserIcon />
      },
      {
        label: 'Access Employer Opportunities',
        description: 'Connect with verified Middle Eastern employers seeking talent.',
        icon: <SearchIcon />
      },
      {
        label: 'Manage Candidate Profiles',
        description: 'Help job seekers create verified profiles and prepare for opportunities.',
        icon: <MarkEmailReadIcon />
      },
      {
        label: 'Facilitate Secure Placements',
        description: 'Earn transparent commissions through our secure payment system.',
        icon: <HandshakeIcon />
      }
    ]
  };

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: theme.palette.background.paper
      }}
      id="how-it-works"
    >
      <Container maxWidth="lg">
        <Box textAlign="center" mb={6}>
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              mb: 2
            }}
          >
            How ThiQaX Works
          </Typography>
          <Typography
            variant="h5"
            component="p"
            sx={{
              fontSize: { xs: '1rem', md: '1.25rem' },
              fontWeight: 400,
              color: 'text.secondary',
              maxWidth: 700,
              mx: 'auto'
            }}
          >
            Our blockchain-powered platform creates a transparent and secure
            process for all parties involved in Middle Eastern recruitment.
          </Typography>
        </Box>

        <Box sx={{ width: '100%', mb: 6 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons={isMobile ? "auto" : false}
              allowScrollButtonsMobile
              centered={!isMobile}
              aria-label="user journey tabs"
            >
              <Tab label="For Job Seekers" id="process-tab-0" />
              <Tab label="For Employers" id="process-tab-1" />
              <Tab label="For Recruitment Agents" id="process-tab-2" />
            </Tabs>
          </Box>

          {/* Job Seeker Journey */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
              <Stepper orientation={isMobile ? "vertical" : "horizontal"} alternativeLabel={!isMobile}>
                {processSteps.jobSeeker.slice(0, isMobile ? undefined : 4).map((step, index) => (
                  <Step key={step.label} active={true}>
                    <StepLabel StepIconComponent={() => (
                      <Avatar
                        sx={{
                          bgcolor: theme.palette.primary.main,
                          width: 40,
                          height: 40,
                          mb: 1
                        }}
                      >
                        {step.icon}
                      </Avatar>
                    )}>
                      <Typography variant="subtitle2">{step.label}</Typography>
                      {isMobile && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {step.description}
                        </Typography>
                      )}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              {!isMobile && (
                <Stepper orientation="horizontal" alternativeLabel sx={{ mt: 4 }}>
                  {processSteps.jobSeeker.slice(4).map((step, index) => (
                    <Step key={step.label} active={true}>
                      <StepLabel StepIconComponent={() => (
                        <Avatar
                          sx={{
                            bgcolor: theme.palette.primary.main,
                            width: 40,
                            height: 40,
                            mb: 1
                          }}
                        >
                          {step.icon}
                        </Avatar>
                      )}>
                        <Typography variant="subtitle2">{step.label}</Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              )}
            </Box>
          </TabPanel>

          {/* Employer Journey */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
              <Stepper orientation={isMobile ? "vertical" : "horizontal"} alternativeLabel={!isMobile}>
                {processSteps.employer.map((step, index) => (
                  <Step key={step.label} active={true}>
                    <StepLabel StepIconComponent={() => (
                      <Avatar
                        sx={{
                          bgcolor: theme.palette.primary.main,
                          width: 40,
                          height: 40,
                          mb: 1
                        }}
                      >
                        {step.icon}
                      </Avatar>
                    )}>
                      <Typography variant="subtitle2">{step.label}</Typography>
                      {isMobile && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {step.description}
                        </Typography>
                      )}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          </TabPanel>

          {/* Agent Journey */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
              <Stepper orientation={isMobile ? "vertical" : "horizontal"} alternativeLabel={!isMobile}>
                {processSteps.agent.map((step, index) => (
                  <Step key={step.label} active={true}>
                    <StepLabel StepIconComponent={() => (
                      <Avatar
                        sx={{
                          bgcolor: theme.palette.primary.main,
                          width: 40,
                          height: 40,
                          mb: 1
                        }}
                      >
                        {step.icon}
                      </Avatar>
                    )}>
                      <Typography variant="subtitle2">{step.label}</Typography>
                      {isMobile && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {step.description}
                        </Typography>
                      )}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          </TabPanel>
        </Box>

        <Box textAlign="center" mt={4}>
          {!isAuthenticated ? (
            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <Button
                  variant="contained"
                  size="large"
                  component={RouterLink}
                  to="/register"
                  sx={{ px: 4 }}
                >
                  Create Account
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  size="large"
                  component={RouterLink}
                  to="/about"
                  sx={{ px: 4 }}
                >
                  Learn More
                </Button>
              </Grid>
            </Grid>
          ) : (
            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/dashboard"
              sx={{ px: 4 }}
            >
              Go to Dashboard
            </Button>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default HowItWorks;