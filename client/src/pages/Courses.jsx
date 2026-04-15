import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourses } from '../features/courseSlice';
import CourseCard from '../components/CourseCard';
import LoadingSpinner, { SkeletonCard } from '../components/LoadingSpinner';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiSliders, FiX } from 'react-icons/fi';

const CATEGORIES = ['All','Web Development','Mobile Development','Data Science','Machine Learning','Cloud Computing','DevOps','Cybersecurity','UI/UX Design','Business','Other'];
const LEVELS = ['All','Beginner','Intermediate','Advanced'];

const Courses = () => {
  const dispatch = useDispatch();
  const { list: courses, pagination, loading } = useSelector((s) => s.courses);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [level, setLevel] = useState('All');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const p = { page, limit: 12, sort };
    if (search) p.search = search;
    if (category !== 'All') p.category = category;
    if (level !== 'All') p.level = level;
    dispatch(fetchCourses(p));
  }, [dispatch, page, search, category, level, sort]);

  const activeFilterCount = (category !== 'All' ? 1 : 0) + (level !== 'All' ? 1 : 0);

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
      <div className="page-header">
        <h1>Explore Courses</h1>
        <p>{pagination?.total || 0} courses available</p>
      </div>

      {/* Search & Controls */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="input-wrapper" style={{ flex: '1 1 300px' }}>
          <FiSearch size={15} className="input-icon" />
          <input type="text" placeholder="Search courses..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input input-with-icon" id="course-search" />
        </div>

        <button onClick={() => setShowFilters(!showFilters)}
          className={`btn btn-md ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: '8px' }}>
          <FiSliders size={15} /> Filters
          {activeFilterCount > 0 && (
            <span className="badge badge-solid-primary" style={{ marginLeft: '2px', fontSize: '0.7rem', padding: '2px 7px' }}>
              {activeFilterCount}
            </span>
          )}
        </button>

        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="input select" style={{ width: 'auto', minWidth: '160px' }} id="course-sort">
          <option value="-createdAt">Newest</option>
          <option value="-avgRating">Highest Rated</option>
          <option value="-totalStudents">Most Popular</option>
          <option value="price">Price: Low → High</option>
        </select>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card animate-slideDown" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <span className="label" style={{ margin: 0 }}>Category</span>
            {activeFilterCount > 0 && (
              <button onClick={() => { setCategory('All'); setLevel('All'); setPage(1); }}
                className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-rose)', gap: '4px' }}>
                <FiX size={13} /> Clear All
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => { setCategory(c); setPage(1); }}
                className={`chip ${category === c ? 'active' : ''}`}>{c}</button>
            ))}
          </div>
          <span className="label">Level</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {LEVELS.map((l) => (
              <button key={l} onClick={() => { setLevel(l); setPage(1); }}
                className={`chip ${level === l ? 'active' : ''}`}>{l}</button>
            ))}
          </div>
        </div>
      )}

      {/* Course Grid */}
      {loading ? (
        <div className="grid-courses">
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid-courses stagger">
            {courses.map((c) => <CourseCard key={c._id} course={c} showBookmark />)}
          </div>

          {courses.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <h3>No courses found</h3>
              <p>Try adjusting your filters or search query</p>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-10)' }}>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: 38, height: 38, padding: 0 }}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Courses;
