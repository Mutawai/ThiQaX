import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminService from '../services/adminService';

// Async thunks
export const fetchDashboardData = createAsyncThunk(
  'admin/fetchDashboardData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getDashboardData();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard data');
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminService.getUsers(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const fetchVerificationRequests = createAsyncThunk(
  'admin/fetchVerificationRequests',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminService.getVerificationRequests(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch verification requests');
    }
  }
);

// Initial state
const initialState = {
  dashboard: {
    data: {
      metrics: {
        totalUsers: 0,
        verificationRequests: 0,
        activeJobs: 0,
        pendingDisputes: 0
      },
      recentVerifications: [],
      recentUsers: [],
      recentJobs: [],
      systemStatus: {
        apiStatus: 'healthy',
        databaseStatus: 'healthy',
        lastBackupTime: null,
        serverLoad: 0.2
      }
    },
    loading: false,
    error: null
  },
  users: {
    data: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0
    },
    loading: false,
    error: null
  },
  verifications: {
    data: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0
    },
    loading: false,
    error: null
  }
};

// Slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    resetAdminState: (state) => {
      return initialState;
    },
    resetUsersState: (state) => {
      state.users = initialState.users;
    },
    resetVerificationsState: (state) => {
      state.verifications = initialState.verifications;
    }
  },
  extraReducers: (builder) => {
    // Dashboard data reducers
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.dashboard.loading = true;
        state.dashboard.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.dashboard.loading = false;
        state.dashboard.data = action.payload;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.dashboard.loading = false;
        state.dashboard.error = action.payload || 'Failed to fetch dashboard data';
      });

    // Users reducers
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.users.loading = true;
        state.users.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users.loading = false;
        state.users.data = action.payload.users;
        state.users.pagination = {
          currentPage: action.payload.pagination.currentPage,
          totalPages: action.payload.pagination.totalPages,
          totalItems: action.payload.pagination.totalItems
        };
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.users.loading = false;
        state.users.error = action.payload || 'Failed to fetch users';
      });

    // Verification requests reducers
    builder
      .addCase(fetchVerificationRequests.pending, (state) => {
        state.verifications.loading = true;
        state.verifications.error = null;
      })
      .addCase(fetchVerificationRequests.fulfilled, (state, action) => {
        state.verifications.loading = false;
        state.verifications.data = action.payload.verifications;
        state.verifications.pagination = {
          currentPage: action.payload.pagination.currentPage,
          totalPages: action.payload.pagination.totalPages,
          totalItems: action.payload.pagination.totalItems
        };
      })
      .addCase(fetchVerificationRequests.rejected, (state, action) => {
        state.verifications.loading = false;
        state.verifications.error = action.payload || 'Failed to fetch verification requests';
      });
  }
});

// Actions
export const { resetAdminState, resetUsersState, resetVerificationsState } = adminSlice.actions;

// Selectors
export const selectDashboardData = (state) => state.admin.dashboard.data;
export const selectDashboardLoading = (state) => state.admin.dashboard.loading;
export const selectDashboardError = (state) => state.admin.dashboard.error;

export const selectUsers = (state) => state.admin.users.data;
export const selectUsersPagination = (state) => state.admin.users.pagination;
export const selectUsersLoading = (state) => state.admin.users.loading;
export const selectUsersError = (state) => state.admin.users.error;

export const selectVerifications = (state) => state.admin.verifications.data;
export const selectVerificationsPagination = (state) => state.admin.verifications.pagination;
export const selectVerificationsLoading = (state) => state.admin.verifications.loading;
export const selectVerificationsError = (state) => state.admin.verifications.error;

export default adminSlice.reducer;