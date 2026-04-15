/**
 * Database Seeder
 * Populates the database with demo data for testing.
 *
 * Usage:
 *   node seed.js          — Seed data
 *   node seed.js --reset  — Delete all data then seed
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Course = require('./models/Course');
const Lesson = require('./models/Lesson');
const Quiz = require('./models/Quiz');
const Enrollment = require('./models/Enrollment');
const Review = require('./models/Review');
const Notification = require('./models/Notification');

const connectDB = require('./config/db');

// ── Demo Data ────────────────────────────────────────────────────

const users = [
  { name: 'Admin User', email: 'admin@eduplatform.com', password: 'password123', role: 'admin' },
  { name: 'Sarah Johnson', email: 'sarah@eduplatform.com', password: 'password123', role: 'instructor' },
  { name: 'Mike Chen', email: 'mike@eduplatform.com', password: 'password123', role: 'instructor' },
  { name: 'Alex Student', email: 'alex@eduplatform.com', password: 'password123', role: 'student' },
  { name: 'Priya Sharma', email: 'priya@eduplatform.com', password: 'password123', role: 'student' },
  { name: 'James Wilson', email: 'james@eduplatform.com', password: 'password123', role: 'student' },
];

const coursesData = [
  {
    title: 'Complete React.js Masterclass 2026',
    description: 'Master React.js from scratch — hooks, state management, routing, testing, and building real-world apps. This comprehensive course covers everything from JSX basics to advanced patterns like compound components, render props, and custom hooks. You\'ll build 5 real projects including a full-stack e-commerce application.',
    category: 'Web Development',
    level: 'Beginner',
    price: 0,
    tags: ['react', 'javascript', 'frontend', 'hooks', 'redux'],
    status: 'approved',
    avgRating: 4.7,
    totalReviews: 3,
    totalStudents: 156,
    instructorIndex: 1,
  },
  {
    title: 'Node.js & Express — Backend Development',
    description: 'Build scalable REST APIs with Node.js and Express.js. Learn authentication, database integration, file uploads, real-time features with Socket.io, and deployment. Includes projects: Blog API, Chat App, and E-commerce API.',
    category: 'Web Development',
    level: 'Intermediate',
    price: 29.99,
    tags: ['node', 'express', 'backend', 'api', 'mongodb'],
    status: 'approved',
    avgRating: 4.5,
    totalReviews: 2,
    totalStudents: 89,
    instructorIndex: 1,
  },
  {
    title: 'Python for Data Science & Machine Learning',
    description: 'Learn Python, Pandas, NumPy, Matplotlib, Scikit-Learn, and TensorFlow. Go from zero to building ML models that solve real business problems. Includes 10+ hands-on projects with real datasets.',
    category: 'Data Science',
    level: 'Beginner',
    price: 49.99,
    tags: ['python', 'data-science', 'machine-learning', 'pandas', 'tensorflow'],
    status: 'approved',
    avgRating: 4.8,
    totalReviews: 5,
    totalStudents: 234,
    instructorIndex: 2,
  },
  {
    title: 'Flutter & Dart — Build iOS & Android Apps',
    description: 'Create beautiful cross-platform mobile apps with Flutter. Master Dart, widgets, state management, Firebase integration, and publishing to app stores. Build 3 complete apps from scratch.',
    category: 'Mobile Development',
    level: 'Intermediate',
    price: 34.99,
    tags: ['flutter', 'dart', 'mobile', 'ios', 'android'],
    status: 'approved',
    avgRating: 4.6,
    totalReviews: 2,
    totalStudents: 112,
    instructorIndex: 2,
  },
  {
    title: 'AWS Cloud Practitioner — Complete Guide',
    description: 'Prepare for the AWS Cloud Practitioner certification. Covers EC2, S3, Lambda, DynamoDB, IAM, VPC, and more with hands-on labs and practice exams.',
    category: 'Cloud Computing',
    level: 'Beginner',
    price: 19.99,
    tags: ['aws', 'cloud', 'devops', 'certification'],
    status: 'approved',
    avgRating: 4.4,
    totalReviews: 1,
    totalStudents: 78,
    instructorIndex: 1,
  },
  {
    title: 'Advanced Cybersecurity & Ethical Hacking',
    description: 'Learn penetration testing, network security, web application security, and ethical hacking techniques. Includes CTF challenges and real-world case studies.',
    category: 'Cybersecurity',
    level: 'Advanced',
    price: 59.99,
    tags: ['security', 'hacking', 'pentesting', 'networking'],
    status: 'pending',
    avgRating: 0,
    totalReviews: 0,
    totalStudents: 0,
    instructorIndex: 2,
  },
];

const lessonsPerCourse = [
  { title: 'Introduction & Course Overview', duration: 600, order: 1, content: 'Welcome to the course! In this lesson we cover what you will learn.', isFreePreview: true },
  { title: 'Setting Up Your Development Environment', duration: 900, order: 2, content: 'Install all the tools and configure your workspace.' },
  { title: 'Core Concepts Deep Dive', duration: 1800, order: 3, content: 'Understanding the fundamental building blocks.' },
  { title: 'Building Your First Project', duration: 2400, order: 4, content: 'Hands-on project to apply what you learned.' },
  { title: 'Advanced Patterns & Best Practices', duration: 1500, order: 5, content: 'Level up with advanced techniques used in production.' },
  { title: 'Testing & Deployment', duration: 1200, order: 6, content: 'Write tests and deploy your application.' },
];

const quizData = {
  title: 'Module Assessment',
  passingScore: 60,
  questions: [
    { question: 'What is the virtual DOM?', options: ['A copy of the real DOM in memory', 'A database', 'A CSS framework', 'A testing tool'], correctAnswer: 0 },
    { question: 'What hook is used for side effects?', options: ['useState', 'useReducer', 'useEffect', 'useMemo'], correctAnswer: 2 },
    { question: 'What does JSX stand for?', options: ['JavaScript XML', 'Java Syntax Extension', 'JSON eXtension', 'JavaScript eXecution'], correctAnswer: 0 },
    { question: 'Which is NOT a React hook?', options: ['useState', 'useEffect', 'useClass', 'useCallback'], correctAnswer: 2 },
    { question: 'What is the purpose of keys in React lists?', options: ['Styling', 'Unique identification for efficient re-rendering', 'Authentication', 'Routing'], correctAnswer: 1 },
  ],
};

const reviewsData = [
  { rating: 5, comment: 'Absolutely fantastic course! The instructor explains complex concepts in a very approachable way. Highly recommended for anyone starting out.' },
  { rating: 4, comment: 'Great content and well-structured. Could use more practice exercises, but overall very solid.' },
  { rating: 5, comment: 'Best course I\'ve taken online. The projects are practical and the code quality is top-notch.' },
  { rating: 4, comment: 'Good course with real-world examples. The pace is right for intermediates.' },
  { rating: 3, comment: 'Decent course but some sections feel rushed. Good for beginners though.' },
];

// ── Seed Function ────────────────────────────────────────────────

const seed = async () => {
  try {
    await connectDB();

    // Reset if --reset flag
    if (process.argv.includes('--reset')) {
      console.log('🗑️  Resetting database...');
      await Promise.all([
        User.deleteMany(),
        Course.deleteMany(),
        Lesson.deleteMany(),
        Quiz.deleteMany(),
        Enrollment.deleteMany(),
        Review.deleteMany(),
        Notification.deleteMany(),
      ]);
      console.log('✅ Database cleared');
    }

    // Check if already seeded
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0 && !process.argv.includes('--reset')) {
      console.log('⚠️  Database already has data. Use --reset to clear and re-seed.');
      process.exit(0);
    }

    // 1. Create users
    console.log('👤 Creating users...');
    const createdUsers = await User.create(users);
    console.log(`   ✅ ${createdUsers.length} users created`);

    const instructors = createdUsers.filter((u) => u.role === 'instructor');
    const students = createdUsers.filter((u) => u.role === 'student');

    // 2. Create courses with lessons
    console.log('📚 Creating courses...');
    for (const courseData of coursesData) {
      const { instructorIndex, ...data } = courseData;
      data.instructor = instructors[instructorIndex - 1]._id;

      const course = await Course.create(data);

      // Create lessons for each course
      const lessonIds = [];
      let totalDuration = 0;
      for (const lessonData of lessonsPerCourse) {
        const lesson = await Lesson.create({
          ...lessonData,
          course: course._id,
          videoUrl: '', // No actual video in seed
        });
        lessonIds.push(lesson._id);
        totalDuration += lessonData.duration;
      }

      course.lessons = lessonIds;
      course.duration = totalDuration;
      await course.save();

      // Create quiz for approved courses
      if (course.status === 'approved') {
        await Quiz.create({
          ...quizData,
          course: course._id,
          title: `${course.title} — Assessment`,
        });
      }

      console.log(`   ✅ "${course.title}" — ${lessonIds.length} lessons`);
    }

    // 3. Enroll students in some courses
    console.log('🎓 Creating enrollments...');
    const approvedCourses = await Course.find({ status: 'approved' }).populate('lessons');

    for (let i = 0; i < students.length; i++) {
      // Each student enrolls in 2-3 courses
      const numCourses = Math.min(2 + i, approvedCourses.length);
      for (let j = 0; j < numCourses; j++) {
        const course = approvedCourses[j];
        const progress = course.lessons.map((l, idx) => ({
          lesson: l._id,
          completed: idx < Math.floor(course.lessons.length * (0.3 + i * 0.2)),
          watchedAt: idx < Math.floor(course.lessons.length * (0.3 + i * 0.2)) ? new Date() : undefined,
        }));

        const completedCount = progress.filter((p) => p.completed).length;
        const pct = Math.round((completedCount / progress.length) * 100);

        await Enrollment.create({
          student: students[i]._id,
          course: course._id,
          progress,
          completionPercentage: pct,
          completedAt: pct === 100 ? new Date() : null,
        });
      }
    }
    console.log(`   ✅ Enrollments created`);

    // 4. Create reviews
    console.log('⭐ Creating reviews...');
    let reviewIdx = 0;
    for (let i = 0; i < Math.min(2, approvedCourses.length); i++) {
      for (let j = 0; j < Math.min(students.length, 3); j++) {
        if (reviewIdx < reviewsData.length) {
          await Review.create({
            student: students[j]._id,
            course: approvedCourses[i]._id,
            ...reviewsData[reviewIdx],
          });
          reviewIdx++;
        }
      }
    }
    console.log(`   ✅ ${reviewIdx} reviews created`);

    // 5. Notifications
    console.log('🔔 Creating notifications...');
    for (const student of students) {
      await Notification.create({
        user: student._id,
        message: 'Welcome to EduPlatform! Start browsing courses to begin your learning journey.',
        type: 'general',
        link: '/courses',
      });
    }
    for (const instructor of instructors) {
      await Notification.create({
        user: instructor._id,
        message: 'You have new student enrollments! Check your dashboard for details.',
        type: 'enrollment',
        link: '/instructor',
      });
    }
    console.log(`   ✅ Notifications created`);

    console.log('\n🎉 Seeding complete!\n');
    console.log('Demo Accounts:');
    console.log('─────────────────────────────────────');
    console.log('Admin:      admin@eduplatform.com / password123');
    console.log('Instructor: sarah@eduplatform.com / password123');
    console.log('Instructor: mike@eduplatform.com  / password123');
    console.log('Student:    alex@eduplatform.com  / password123');
    console.log('Student:    priya@eduplatform.com / password123');
    console.log('Student:    james@eduplatform.com / password123');
    console.log('─────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seed();
