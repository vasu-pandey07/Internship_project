import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../api';

export const fetchCourses = createAsyncThunk('courses/fetchCourses', async (params, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/courses', { params });
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch courses');
  }
});

export const fetchCourse = createAsyncThunk('courses/fetchCourse', async (id, { rejectWithValue }) => {
  try {
    const { data } = await API.get(`/courses/${id}`);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch course');
  }
});

export const fetchMyCourses = createAsyncThunk('courses/fetchMyCourses', async (_, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/courses/my-courses');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch courses');
  }
});

export const fetchRecommendations = createAsyncThunk('courses/fetchRecommendations', async (_, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/courses/recommendations');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch recommendations');
  }
});

const courseSlice = createSlice({
  name: 'courses',
  initialState: {
    list: [],
    current: null,
    myCourses: [],
    recommendations: [],
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrent: (state) => { state.current = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => { state.loading = true; })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.courses;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCourse.pending, (state) => { state.loading = true; })
      .addCase(fetchCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload.course;
      })
      .addCase(fetchCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyCourses.fulfilled, (state, action) => {
        state.myCourses = action.payload.courses;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.recommendations = action.payload.recommendations;
      });
  },
});

export const { clearCurrent } = courseSlice.actions;
export default courseSlice.reducer;
