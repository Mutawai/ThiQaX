// src/pages/dashboard/JobSeekerDashboard.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardLayout, StatCard, VerificationStatus } from '../../components/dashboard';
import { fetchUserProfile, fetchApplications, fetchDocuments } from '../../store/actions';

const JobSeekerDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { profile, loading: profileLoading } = useSelector(state => state.profile);
  const { applications, loading: applicationsLoading } = useSelector(state => state.applications);
  const { documents, loading: documentsLoading } = useSelector(state => state.documents);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserProfile(user.id));
      dispatch(fetchApplications({ userId: user.id }));
      dispatch(fetchDocuments({ userId: user.id }));
    }
  }, [dispatch, user?.id]);

  // Calculate verification status
  const kycStatus = profile?.kycVerified ? 'VERIFIED' : 'PENDING';
  const pendingApplications = applications?.filter(app => app.status === 'PENDING')?.length || 0;
  const totalApplications = applications?.length || 0;
  const pendingDocuments = documents?.filter(doc => doc.status === 'PENDING')?.length || 0;

  if (profileLoading || applicationsLoading || documentsLoading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <h1>Welcome, {user?.firstName}</h1>
        <div className="verification-status-container">
          <span>KYC Status:</span>
          <VerificationStatus status={kycStatus} />
        </div>
      </div>

      <div className="stats-container">
        <StatCard 
          title="Applications" 
          value={totalApplications} 
          icon="file-text" 
        />
        <StatCard 
          title="Pending Applications" 
          value={pendingApplications} 
          icon="clock" 
          color="warning" 
        />
        <StatCard 
          title="Documents" 
          value={documents?.length || 0} 
          icon="file" 
        />
        <StatCard 
          title="Documents Pending" 
          value={pendingDocuments} 
          icon="alert-triangle" 
          color={pendingDocuments > 0 ? "warning" : "success"} 
        />
      </div>

      <div className="dashboard-section">
        <h2>Profile Completion</h2>
        <div className="profile-completion-status">
          {/* Profile completion indicator component would go here */}
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${profile?.completionPercentage || 0}%` }}
            ></div>
          </div>
          <span>{profile?.completionPercentage || 0}% Complete</span>
        </div>
        
        {profile?.completionPercentage < 100 && (
          <div className="action-card">
            <h3>Complete Your Profile</h3>
            <p>Finish setting up your profile to increase your chances of being hired.</p>
            <button className="btn btn-primary">Complete Profile</button>
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Recent Applications</h2>
        {applications?.length > 0 ? (
          <div className="applications-list">
            {applications.slice(0, 5).map(application => (
              <div key={application.id} className="application-item">
                <div className="application-title">{application.job.title}</div>
                <div className="application-company">{application.job.company}</div>
                <VerificationStatus status={application.status} />
                <div className="application-date">
                  Applied on {new Date(application.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {applications.length > 5 && (
              <button className="btn btn-text">View All Applications</button>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <p>You haven't applied to any jobs yet.</p>
            <button className="btn btn-primary">Browse Jobs</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JobSeekerDashboard;

// src/pages/dashboard/AgentDashboard.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardLayout, StatCard } from '../../components/dashboard';
import { fetchAgentStats, fetchJobPostings, fetchCandidates } from '../../store/actions';

const AgentDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { stats, loading: statsLoading } = useSelector(state => state.agentStats);
  const { jobPostings, loading: jobsLoading } = useSelector(state => state.jobPostings);
  const { candidates, loading: candidatesLoading } = useSelector(state => state.candidates);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchAgentStats(user.id));
      dispatch(fetchJobPostings({ agentId: user.id }));
      dispatch(fetchCandidates({ agentId: user.id }));
    }
  }, [dispatch, user?.id]);

  if (statsLoading || jobsLoading || candidatesLoading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <h1>Agent Dashboard</h1>
        <div className="actions">
          <button className="btn btn-primary">Post New Job</button>
          <button className="btn btn-outline">Verify Candidate</button>
        </div>
      </div>

      <div className="stats-container">
        <StatCard 
          title="Active Jobs" 
          value={stats?.activeJobs || 0} 
          icon="briefcase" 
        />
        <StatCard 
          title="Candidates" 
          value={stats?.totalCandidates || 0} 
          icon="users" 
        />
        <StatCard 
          title="Verification Rate" 
          value={`${stats?.verificationRate || 0}%`} 
          icon="shield" 
          color="success" 
        />
        <StatCard 
          title="Pending Verifications" 
          value={stats?.pendingVerifications || 0} 
          icon="alert-circle" 
          color={stats?.pendingVerifications > 0 ? "warning" : "success"} 
        />
      </div>

      <div className="dashboard-section">
        <h2>Verification Queue</h2>
        {stats?.pendingVerifications > 0 ? (
          <div className="verification-queue">
            {candidates
              .filter(candidate => candidate.verificationStatus === 'PENDING')
              .slice(0, 5)
              .map(candidate => (
                <div key={candidate.id} className="verification-item">
                  <div className="candidate-info">
                    <div className="candidate-name">{candidate.fullName}</div>
                    <div className="candidate-job">{candidate.jobTitle}</div>
                  </div>
                  <div className="verification-actions">
                    <button className="btn btn-sm btn-success">Verify</button>
                    <button className="btn btn-sm btn-danger">Reject</button>
                  </div>
                </div>
              ))}
            {stats.pendingVerifications > 5 && (
              <button className="btn btn-text">View All Pending Verifications</button>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <p>No pending verifications at this time.</p>
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Recent Job Postings</h2>
        {jobPostings?.length > 0 ? (
          <div className="job-postings-list">
            {jobPostings.slice(0, 5).map(job => (
              <div key={job.id} className="job-posting-item">
                <div className="job-title">{job.title}</div>
                <div className="job-company">{job.company}</div>
                <div className="job-stats">
                  <span>{job.applications} Applications</span>
                  <span>{job.views} Views</span>
                </div>
                <div className="job-status">
                  <span className={`status status-${job.status.toLowerCase()}`}>
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
            {jobPostings.length > 5 && (
              <button className="btn btn-text">View All Job Postings</button>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <p>You haven't posted any jobs yet.</p>
            <button className="btn btn-primary">Create Job Posting</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AgentDashboard;

// src/pages/dashboard/AdminDashboard.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardLayout, StatCard } from '../../components/dashboard';
import { fetchSystemStats, fetchPendingVerifications, fetchRecentUsers } from '../../store/actions';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { systemStats, loading: statsLoading } = useSelector(state => state.systemStats);
  const { pendingVerifications, loading: verificationsLoading } = useSelector(state => state.pendingVerifications);
  const { recentUsers, loading: usersLoading } = useSelector(state => state.users);

  useEffect(() => {
    dispatch(fetchSystemStats());
    dispatch(fetchPendingVerifications());
    dispatch(fetchRecentUsers());
  }, [dispatch]);

  if (statsLoading || verificationsLoading || usersLoading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="actions">
          <button className="btn btn-primary">System Settings</button>
          <button className="btn btn-outline">Generate Reports</button>
        </div>
      </div>

      <div className="stats-container">
        <StatCard 
          title="Active Users" 
          value={systemStats?.activeUsers || 0} 
          icon="users" 
          trend={systemStats?.usersTrend?.direction}
          trendValue={systemStats?.usersTrend?.value}
        />
        <StatCard 
          title="Jobs Posted" 
          value={systemStats?.jobsPosted || 0} 
          icon="briefcase" 
          trend={systemStats?.jobsTrend?.direction}
          trendValue={systemStats?.jobsTrend?.value}
        />
        <StatCard 
          title="Verification Rate" 
          value={`${systemStats?.verificationRate || 0}%`} 
          icon="shield" 
          color="success" 
        />
        <StatCard 
          title="System Health" 
          value={systemStats?.systemHealth || 'Good'} 
          icon="activity" 
          color="info" 
        />
      </div>

      <div className="dashboard-section">
        <h2>Verification Queue</h2>
        {pendingVerifications?.length > 0 ? (
          <div className="admin-verification-queue">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Document Type</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingVerifications.slice(0, 5).map(verification => (
                  <tr key={verification.id}>
                    <td>{verification.user.fullName}</td>
                    <td>{verification.documentType}</td>
                    <td>{new Date(verification.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className="status status-pending">Pending</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-sm btn-primary">Review</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pendingVerifications.length > 5 && (
              <button className="btn btn-text">View All Pending Verifications</button>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <p>No pending verifications at this time.</p>
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Recent Users</h2>
        {recentUsers?.length > 0 ? (
          <div className="recent-users">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.slice(0, 5).map(user => (
                  <tr key={user.id}>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`status status-${user.active ? 'active' : 'inactive'}`}>
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn btn-text">View All Users</button>
          </div>
        ) : (
          <div className="empty-state">
            <p>No users registered yet.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

// src/pages/dashboard/index.js
export { default as JobSeekerDashboard } from './JobSeekerDashboard';
export { default as AgentDashboard } from './AgentDashboard';
export { default as AdminDashboard } from './AdminDashboard';
