import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import courseReducer from '../features/courseSlice';
import enrollmentReducer from '../features/enrollmentSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
    enrollments: enrollmentReducer,
  },
});

export default store;
