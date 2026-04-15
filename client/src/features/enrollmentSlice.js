import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../api';

export const fetchMyEnrollments = createAsyncThunk('enrollments/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/enrollments/my');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch enrollments');
  }
});

export const enrollInCourse = createAsyncThunk('enrollments/enroll', async (courseId, { rejectWithValue }) => {
  try {
    const { data } = await API.post('/enrollments', { courseId });
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Enrollment failed');
  }
});

export const updateProgress = createAsyncThunk('enrollments/updateProgress', async ({ enrollmentId, lessonId }, { rejectWithValue }) => {
  try {
    const { data } = await API.put(`/enrollments/${enrollmentId}/progress`, { lessonId });
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update progress');
  }
});

const enrollmentSlice = createSlice({
  name: 'enrollments',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyEnrollments.pending, (state) => { state.loading = true; })
      .addCase(fetchMyEnrollments.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.enrollments;
      })
      .addCase(fetchMyEnrollments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(enrollInCourse.fulfilled, (state, action) => {
        state.list.unshift(action.payload.enrollment);
      })
      .addCase(updateProgress.fulfilled, (state, action) => {
        const idx = state.list.findIndex((e) => e._id === action.payload.enrollment._id);
        if (idx !== -1) state.list[idx] = action.payload.enrollment;
      });
  },
});

export default enrollmentSlice.reducer;
