// src/components/dashboard/AgentDashboard.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  AttachMoney as AttachMoneyIcon,
  EventNote as EventNoteIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getAgentStats, 
  getActiveJobs,
  getRecentActivities,
  getPendingTasks
} from '../../store/actions/agentActions';
import { formatDistanceToNow, format } from 'date-fns';
import { HelpPanel } from '../documentation/HelpPanel';
import { useResponsive } from '../../utils/responsive';
import ResponsiveGrid from '../layout/ResponsiveGrid';

// Statistic Card Component
const StatCard = ({ title, value, icon, color, trend, trendValue, onClick }) => {
  return (
    <Paper
      elevation={2}
      sx={{ 
        p: 3, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 3
        } : {}
      }}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Avatar
          sx={{
            bgcolor: `${color}.lighter`,
            color: `${color}.main`,
            width: 48,
            height: 48
          }}
        >
          {icon}
        </Avatar>
        
        {trend && (
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              color: trend === 'up' ? 'success.main' : 'error.main'
            }}
          >
            {trend === 'up' ? (
              <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} />
            ) : (
              <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.5 }} />
            )}
            <Typography variant="body2" fontWeight="medium">
              {trendValue}%
            </Typography>
          </Box>
        )}
      </Box>
      
      <Typography variant="h4" component="div" sx={{ mb: 1, fontWeight: 'medium' }}>
        {value}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto' }}>
        {title}
      </Typography>
    </Paper>
  );
};

// Active Job Card Component
const JobCard = ({ job }) => {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="subtitle1" component="div">
          {job.title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {job.company.name}
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          <Chip
            label={job.location}
            size="small"
            icon={<BusinessIcon fontSize="small" />}
            variant="outlined"
          />
          <Chip
            label={`${job.applicationsCount} Applicants`}
            size="small"
            icon={<PersonIcon fontSize="small" />}
            variant="outlined"
          />
          {job.featured && (
            <Chip
              label="Featured"
              size="small"
              color="primary"
            />
          )}
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          {job.status === 'ACTIVE' ? (
            <>
              Active • Posted {formatDistanceToNow(new Date(job.postedDate), { addSuffix: true })}
            </>
          ) : (
            <>
              Closed • Ended {formatDistanceToNow(new Date(job.closedDate), { addSuffix: true })}
            </>
          )}
        </Typography>
      </CardContent>
      
      <CardActions>
        <Button 
          size="small" 
          startIcon={<VisibilityIcon />}
          component={RouterLink}
          to={`/jobs/${job._id}`}
        >
          View
        </Button>
        <Button 
          size="small" 
          startIcon={<PersonIcon />}
          component={RouterLink}
          to={`/jobs/${job._id}/applications`}
        >
          Applicants
        </Button>
        <Button 
          size="small" 
          startIcon={<EditIcon />}
          component={RouterLink}
          to={`/jobs/${job._id}/edit`}
        >
          Edit
        </Button>
      </CardActions>
    </Card>
  );
};

// Main Dashboard Component
const AgentDashboard = () => {
  const dispatch = useDispatch();
  const { isMobile, isTablet } = useResponsive();
  
  // Redux selectors
  const { user } = useSelector(state => state.auth);
  const { 
    stats, 
    activeJobs, 
    recentActivities,
    pendingTasks,
    loading, 
    error 
  } = useSelector(state => state.agent);
  
  const [activeTab, setActiveTab] = useState(0);
  
  // Fetch dashboard data
  useEffect(() => {
    dispatch(getAgentStats());
    dispatch(getActiveJobs());
    dispatch(getRecentActivities());
    dispatch(getPendingTasks());
  }, [dispatch]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  if (loading && !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <HelpPanel workflow="agent-dashboard" />
      
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.firstName || 'Agent'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your recruitment activities
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Key Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Jobs"
            value={stats?.activeJobs || 0}
            icon={<WorkIcon />}
            color="primary"
            trend="up"
            trendValue={stats?.jobsTrend || 0}
            onClick={() => navigate('/jobs/manage')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Candidates"
            value={stats?.activeCandidates || 0}
            icon={<PersonIcon />}
            color="success"
            trend="up"
            trendValue={stats?.candidatesTrend || 0}
            onClick={() => navigate('/candidates')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sponsor Companies"
            value={stats?.sponsorCount || 0}
            icon={<BusinessIcon />}
            color="info"
            onClick={() => navigate('/sponsors')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Earnings"
            value={`$${(stats?.monthlyEarnings || 0).toLocaleString()}`}
            icon={<AttachMoneyIcon />}
            color="warning"
            trend={stats?.earningsTrend > 0 ? "up" : "down"}
            trendValue={Math.abs(stats?.earningsTrend || 0)}
            onClick={() => navigate('/earnings')}
          />
        </Grid>
      </Grid>
      
      {/* Main Dashboard Content */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Your Active Jobs
              </Typography>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                component={RouterLink}
                to="/jobs/create"
                size="small"
              >
                Post New Job
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {activeJobs && activeJobs.length > 0 ? (
              <>
                {activeJobs.slice(0, 3).map(job => (
                  <JobCard key={job._id} job={job} />
                ))}
                
                {activeJobs.length > 3 && (
                  <Box textAlign="center" mt={2}>
                    <Button
                      component={RouterLink}
                      to="/jobs/manage"
                      endIcon={<BarChartIcon />}
                    >
                      View All {activeJobs.length} Jobs
                    </Button>
                  </Box>
                )}
              </>
            ) : (
              <Box textAlign="center" py={4}>
                <WorkIcon sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Active Jobs
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Start by posting a new job for your sponsor companies.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  component={RouterLink}
                  to="/jobs/create"
                >
                  Post New Job
                </Button>
              </Box>
            )}
          </Paper>
          
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            {recentActivities && recentActivities.length > 0 ? (
              <List>
                {recentActivities.map((activity, index) => (
                  <ListItem
                    key={activity._id}
                    alignItems="flex-start"
                    divider={index < recentActivities.length - 1}
                  >
                    <ListItemIcon>
                      {activity.type === 'APPLICATION' ? (
                        <PersonIcon color="primary" />
                      ) : activity.type === 'JOB_UPDATE' ? (
                        <WorkIcon color="info" />
                      ) : activity.type === 'PAYMENT' ? (
                        <AttachMoneyIcon color="success" />
                      ) : (
                        <EventNoteIcon color="action" />
                      )}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={activity.message}
                      secondary={
                        <>
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          {activity.job && (
                            <> • {activity.job.title}</>
                          )}
                        </>
                      }
                    />
                    
                    {activity.actionLink && (
                      <ListItemSecondaryAction>
                        <Button
                          component={RouterLink}
                          to={activity.actionLink}
                          size="small"
                          variant="outlined"
                        >
                          View
                        </Button>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box textAlign="center" py={3}>
                <Typography variant="body2" color="text.secondary">
                  No recent activities to display
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Right Column */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Pending Tasks
              </Typography>
              
              <Chip
                label={pendingTasks?.length || 0}
                color="primary"
              />
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {pendingTasks && pendingTasks.length > 0 ? (
              <List dense>
                {pendingTasks.map((task, index) => (
                  <ListItem
                    key={task._id}
                    button
                    component={RouterLink}
                    to={task.actionLink}
                    divider={index < pendingTasks.length - 1}
                  >
                    <ListItemIcon>
                      {task.type === 'REVIEW_APPLICATION' ? (
                        <PersonIcon color="primary" />
                      ) : task.type === 'UPDATE_JOB' ? (
                        <WorkIcon color="info" />
                      ) : task.type === 'SCHEDULE_INTERVIEW' ? (
                        <EventNoteIcon color="success" />
                      ) : (
                        <EventNoteIcon color="action" />
                      )}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={task.title}
                      secondary={
                        <>
                          <Typography variant="caption" component="span" color="textSecondary">
                            Due {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                          </Typography>
                          {task.priority === 'HIGH' && (
                            <Chip
                              label="High Priority"
                              color="error"
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box textAlign="center" py={3}>
                <Typography variant="body2" color="text.secondary">
                  No pending tasks. You're all caught up!
                </Typography>
              </Box>
            )}
            
            <Box textAlign="center" mt={2}>
              <Button
                component={RouterLink}
                to="/tasks"
                size="small"
              >
                View All Tasks
              </Button>
            </Box>
          </Paper>
          
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            <List dense disablePadding>
              <ListItem sx={{ py: 1 }}>
                <ListItemText
                  primary="Placement Rate"
                  secondary={`${stats?.placementRate || 0}%`}
                />
                <LinearProgressWithLabel 
                  value={stats?.placementRate || 0} 
                  color={
                    (stats?.placementRate || 0) >= 70 ? 'success' :
                    (stats?.placementRate || 0) >= 40 ? 'warning' : 'error'
                  } 
                />
              </ListItem>
              
              <ListItem sx={{ py: 1 }}>
                <ListItemText
                  primary="Response Time"
                  secondary={`${stats?.avgResponseTime || 0} hours`}
                />
                <LinearProgressWithLabel 
                  value={Math.min(100, 100 - (stats?.avgResponseTime || 0) * 5)}
                  color={
                    (stats?.avgResponseTime || 0) <= 8 ? 'success' :
                    (stats?.avgResponseTime || 0) <= 24 ? 'warning' : 'error'
                  }
                />
              </ListItem>
              
              <ListItem sx={{ py: 1 }}>
                <ListItemText
                  primary="Client Satisfaction"
                  secondary={`${stats?.satisfactionScore || 0}/5`}
                />
                <LinearProgressWithLabel 
                  value={(stats?.satisfactionScore || 0) * 20}
                  color={
                    (stats?.satisfactionScore || 0) >= 4 ? 'success' :
                    (stats?.satisfactionScore || 0) >= 3 ? 'warning' : 'error'
                  }
                />
              </ListItem>
            </List>
            
            <Box textAlign="center" mt={2}>
              <Button
                component={RouterLink}
                to="/performance"
                size="small"
                endIcon={<BarChartIcon />}
              >
                View Detailed Analytics
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Linear progress with label component
const LinearProgressWithLabel = ({ value, color }) => {
  return (
    <Box sx={{ width: '40%', mr: 1, display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" value={value} color={color} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(value)}%`}</Typography>
      </Box>
    </Box>
  );
};

export default AgentDashboard;