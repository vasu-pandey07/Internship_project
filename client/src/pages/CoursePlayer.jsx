import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FiPlayCircle,
  FiCheckCircle,
  FiAward,
  FiArrowLeft,
  FiHelpCircle,
  FiDownload,
  FiSend,
  FiMessageSquare,
  FiFileText,
  FiUpload,
  FiClock,
} from 'react-icons/fi';

const CoursePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [activeItem, setActiveItem] = useState(null); // { type: 'lesson'|'quiz'|'certificate', data: obj }
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [correctAnswers, setCorrectAnswers] = useState([]);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [assignmentFiles, setAssignmentFiles] = useState({});
  const [assignmentNotes, setAssignmentNotes] = useState({});
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [downloadingCertificate, setDownloadingCertificate] = useState(false);
  const [restartingCourse, setRestartingCourse] = useState(false);

  const getCertificateEligibility = () => {
    const fallbackLessons = enrollment?.progress?.length || 0;
    const fallbackCompletedLessons = enrollment?.progress?.filter((p) => p.completed).length || 0;
    const fallbackEligible = fallbackLessons === 0 ? true : fallbackCompletedLessons === fallbackLessons;

    return enrollment?.certificateEligibility || {
      eligible: fallbackEligible,
      completedLessons: fallbackCompletedLessons,
      totalLessons: fallbackLessons,
      passedQuizzesCount: 0,
      quizzesRequired: quizzes.length,
    };
  };

  // Helper to parse YouTube URLs
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11)
      ? `https://www.youtube.com/embed/${match[2]}`
      : null;
  };

  const isDirectVideoFile = (url) => {
    if (!url) return false;
    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
  };

  const loadData = async () => {
    try {
      const [courseRes, enrollRes, quizRes, questionRes, assignmentRes, reviewRes] = await Promise.all([
        API.get(`/courses/${id}`),
        API.get('/enrollments/my'),
        API.get(`/courses/${id}/quizzes`),
        API.get(`/courses/${id}/questions/my`),
        API.get(`/courses/${id}/assignments`),
        API.get(`/courses/${id}/reviews`),
      ]);

      const c = courseRes.data.data.course;
      const e = enrollRes.data.data.enrollments.find((en) => en.course._id === id);

      if (!e) {
        navigate(`/courses/${id}`);
        return;
      }

      setCourse(c);
      setEnrollment(e);
      setQuizzes(quizRes.data.data.quizzes || []);
      setQuestions(questionRes.data.data.questions || []);
      setAssignments(assignmentRes.data.data.assignments || []);
      const fetchedReviews = reviewRes.data.data.reviews || [];
      setReviews(fetchedReviews);

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      setHasReviewed(fetchedReviews.some((item) => item.student?._id === currentUser?._id));

      const eligibility = e.certificateEligibility;

      // Determine active item
      if (eligibility?.eligible) {
        setActiveItem({ type: 'certificate' });
      } else {
        const nextLessonInfo = e.progress.find((p) => !p.completed);
        if (nextLessonInfo) {
          const l = c.lessons.find((les) => String(les._id) === String(nextLessonInfo.lesson));
          setActiveItem({ type: 'lesson', data: l });
        } else if (quizRes.data.data.quizzes && quizRes.data.data.quizzes.length > 0) {
          setActiveItem({ type: 'quiz', data: quizRes.data.data.quizzes[0] });
        } else {
          setActiveItem({ type: 'certificate' });
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [id]);

  const markLessonComplete = async (lessonId) => {
    try {
      await API.put(`/enrollments/${enrollment._id}/progress`, { lessonId, completed: true });
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleQuizSubmit = async () => {
    setSubmittingQuiz(true);
    try {
      const activeQuiz = activeItem.data;
      const answers = activeQuiz.questions.map((_, idx) => quizAnswers[idx]);
      const res = await API.post(`/courses/${id}/quizzes/${activeQuiz._id}/attempt`, { answers });
      setQuizResult(res.data.data.attempt);
      setCorrectAnswers(res.data.data.correctAnswers || []);
      if (res.data.data.attempt.passed) loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting quiz');
    }
    setSubmittingQuiz(false);
  };

  const handleAskQuestion = async () => {
    const trimmed = questionText.trim();
    if (!trimmed || askingQuestion) return;
    setAskingQuestion(true);
    try {
      const lessonId = activeItem?.type === 'lesson' ? activeItem?.data?._id : undefined;
      const res = await API.post(`/courses/${id}/questions`, {
        question: trimmed,
        lessonId,
      });
      setQuestions((prev) => [res.data.data.question, ...prev]);
      setQuestionText('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send question');
    }
    setAskingQuestion(false);
  };

  const handleSubmitAssignment = async (assignmentId) => {
    const file = assignmentFiles[assignmentId];
    if (!file) {
      alert('Please choose your solution file first');
      return;
    }

    setSubmittingAssignmentId(assignmentId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('notes', assignmentNotes[assignmentId] || '');

      await API.post(`/courses/${id}/assignments/${assignmentId}/submissions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit assignment');
    }
    setSubmittingAssignmentId('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await API.post(`/courses/${id}/reviews`, {
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });
      const refreshed = await API.get(`/courses/${id}/reviews`);
      setReviews(refreshed.data.data.reviews || []);
      setHasReviewed(true);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    }
    setSubmittingReview(false);
  };

  const handleDownloadCertificate = async () => {
    setDownloadingCertificate(true);
    try {
      const res = await API.get(`/enrollments/${enrollment._id}/certificate/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${course.title.replace(/\s+/g, '-').toLowerCase()}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download certificate');
    }
    setDownloadingCertificate(false);
  };

  const handleRestartCourse = async () => {
    if (!window.confirm('Restart this course? This will reset lesson progress and quiz attempts.')) return;
    setRestartingCourse(true);
    try {
      await API.post(`/enrollments/${enrollment._id}/restart`);
      setQuizAnswers({});
      setQuizResult(null);
      setCorrectAnswers([]);
      await loadData();
      alert('Course restarted');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restart course');
    }
    setRestartingCourse(false);
  };

  if (loading || !course || !enrollment) return <LoadingSpinner />;

  const certificateEligibility = getCertificateEligibility();
  const isCertificateUnlocked = Boolean(certificateEligibility.eligible);

  return (
    <div className="player-layout" style={{ background: 'var(--bg-base)' }}>
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <div className="player-sidebar">
        <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--border-default)' }}>
          <button onClick={() => navigate('/student')} className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-3)', padding: '4px 0' }}>
            <FiArrowLeft size={14} /> Back to Dashboard
          </button>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3, marginBottom: 'var(--space-3)' }}>
            {course.title}
          </h2>
          <div className="progress-bar" style={{ marginBottom: '4px' }}>
            <div className="progress-fill success" style={{ width: `${Math.round(enrollment.completionPercentage)}%` }} />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'right' }}>
            {Math.round(enrollment.completionPercentage)}% Complete
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {course.lessons.map((lesson, idx) => {
            const isCompleted = enrollment.progress.find((p) => String(p.lesson) === String(lesson._id))?.completed;
            const isActive = activeItem?.type === 'lesson' && activeItem?.data?._id === lesson._id;
            return (
              <button key={lesson._id} onClick={() => setActiveItem({ type: 'lesson', data: lesson })}
                className={`sidebar-item ${isActive ? 'active' : ''}`}>
                {isCompleted
                  ? <FiCheckCircle size={16} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                  : <FiPlayCircle size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Lesson {idx + 1}</div>
                  <div className="truncate-1" style={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--primary)' : 'var(--text-primary)' }}>
                    {lesson.title}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Quiz Items */}
          {quizzes.map((q, qIdx) => {
            const isActive = activeItem?.data?._id === q._id;
            const attemptedQuizIds = enrollment?.quizProgress?.attemptedQuizIds || [];
            const passedQuizIds = enrollment?.quizProgress?.passedQuizIds || [];
            const isQuizAttempted = attemptedQuizIds.includes(String(q._id));
            const isQuizPassed = passedQuizIds.includes(String(q._id));
            return (
              <button key={q._id} onClick={() => { setActiveItem({ type: 'quiz', data: q }); setQuizResult(null); setQuizAnswers({}); setCorrectAnswers([]); }}
                className={`sidebar-item ${isActive ? 'active' : ''}`}>
                {isQuizAttempted
                  ? <FiCheckCircle size={16} style={{ color: isQuizPassed ? 'var(--accent-emerald)' : 'var(--primary)', flexShrink: 0 }} />
                  : <FiHelpCircle size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>
                    Assessment {qIdx + 1} {isQuizPassed ? '• Passed' : isQuizAttempted ? '• Completed' : ''}
                  </div>
                  <div className="truncate-1" style={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--primary)' : 'var(--text-primary)' }}>
                    {q.title}
                  </div>
                </div>
              </button>
            );
          })}

          <button
            onClick={() => setActiveItem({ type: 'assignments' })}
            className={`sidebar-item ${activeItem?.type === 'assignments' ? 'active' : ''}`}
          >
            <FiFileText size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Practice</div>
              <div style={{ fontSize: '0.85rem', fontWeight: activeItem?.type === 'assignments' ? 600 : 500 }}>Assignments</div>
            </div>
          </button>

          <button
            onClick={() => setActiveItem({ type: 'questions' })}
            className={`sidebar-item ${activeItem?.type === 'questions' ? 'active' : ''}`}
          >
            <FiMessageSquare size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Support</div>
              <div style={{ fontSize: '0.85rem', fontWeight: activeItem?.type === 'questions' ? 600 : 500 }}>Ask Instructor</div>
            </div>
          </button>

          <button
            onClick={() => setActiveItem({ type: 'reviews' })}
            className={`sidebar-item ${activeItem?.type === 'reviews' ? 'active' : ''}`}
          >
            <FiHelpCircle size={16} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Feedback</div>
              <div style={{ fontSize: '0.85rem', fontWeight: activeItem?.type === 'reviews' ? 600 : 500 }}>Review Course</div>
            </div>
          </button>

          {/* Certificate Item */}
          <button
            disabled={!isCertificateUnlocked}
            onClick={() => setActiveItem({ type: 'certificate' })}
            className={`sidebar-item ${activeItem?.type === 'certificate' ? 'active' : ''} ${!isCertificateUnlocked ? 'disabled' : ''}`}>
            <FiAward size={16} style={{ color: 'var(--accent-violet)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Achievement</div>
              <div style={{ fontSize: '0.85rem', fontWeight: activeItem?.type === 'certificate' ? 600 : 500, color: activeItem?.type === 'certificate' ? 'var(--primary)' : 'var(--text-primary)' }}>
                Certificate
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="player-content">

        {/* VIEW: Lesson */}
        {activeItem?.type === 'lesson' && activeItem.data && (
          <div className="animate-fadeIn" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-5)', letterSpacing: '-0.02em' }}>
              {activeItem.data.title}
            </h1>

            <div className="video-container" style={{ marginBottom: 'var(--space-6)' }}>
              {getYoutubeEmbedUrl(activeItem.data.videoUrl) ? (
                <iframe
                  src={getYoutubeEmbedUrl(activeItem.data.videoUrl)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={activeItem.data.title}
                />
              ) : isDirectVideoFile(activeItem.data.videoUrl) ? (
                <video controls style={{ objectFit: 'cover' }}>
                  <source src={activeItem.data.videoUrl} type="video/mp4" />
                </video>
              ) : (
                <div
                  className="card card-body-lg"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}
                >
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                    This lesson uses an external link.
                  </p>
                  {activeItem.data.videoUrl ? (
                    <a
                      href={activeItem.data.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-md"
                    >
                      Open Lesson Link
                    </a>
                  ) : (
                    <p style={{ color: 'var(--text-tertiary)', margin: 0 }}>
                      No lesson link provided.
                    </p>
                  )}
                </div>
              )}
            </div>

            {activeItem.data.videoUrl && (
              <div style={{ marginTop: '-8px', marginBottom: 'var(--space-6)' }}>
                <a
                  href={activeItem.data.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                >
                  Open Original Link
                </a>
              </div>
            )}

            <div className="card card-body-lg" style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Lesson Notes</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                {activeItem.data.content || 'No text content provided for this lesson.'}
              </p>
            </div>

            <div className="card card-body-lg" style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Ask Instructor</h3>
              <p style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }}>
                AI tutor was removed. Ask your instructor directly and get a human answer.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <input
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Ask a question about this lesson"
                  className="input"
                  style={{ flex: 1 }}
                />
                <button onClick={handleAskQuestion} disabled={askingQuestion || !questionText.trim()} className="btn btn-primary btn-md">
                  <FiSend size={14} /> {askingQuestion ? 'Sending...' : 'Ask'}
                </button>
              </div>
            </div>

            {!enrollment.progress.find((p) => String(p.lesson) === String(activeItem.data._id))?.completed && (
              <button onClick={() => markLessonComplete(activeItem.data._id)} className="btn btn-primary btn-md">
                <FiCheckCircle size={16} /> Mark as Completed
              </button>
            )}
          </div>
        )}

        {activeItem?.type === 'questions' && (
          <div className="animate-fadeIn" style={{ maxWidth: '850px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Ask Instructor</h1>
            <div className="card card-body-lg" style={{ marginBottom: 'var(--space-5)' }}>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="input"
                rows={3}
                placeholder="Type your course question here"
                style={{ marginBottom: 'var(--space-3)' }}
              />
              <button onClick={handleAskQuestion} className="btn btn-primary btn-sm" disabled={askingQuestion || !questionText.trim()}>
                {askingQuestion ? 'Sending...' : 'Send Question'}
              </button>
            </div>

            {questions.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)' }}>No questions yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {questions.map((q) => (
                  <div key={q._id} className="card card-body-lg">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong>Q: {q.question}</strong>
                      <span className={`badge ${q.status === 'answered' ? 'badge-success' : 'badge-warning'}`}>
                        {q.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                      Asked: {new Date(q.createdAt).toLocaleString()}
                    </p>
                    {q.answer ? (
                      <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                        <p style={{ margin: 0, fontWeight: 600 }}>Instructor Reply</p>
                        <p style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{q.answer}</p>
                      </div>
                    ) : (
                      <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>Waiting for instructor response.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeItem?.type === 'assignments' && (
          <div className="animate-fadeIn" style={{ maxWidth: '850px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Assignments</h1>
            {assignments.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)' }}>No assignments uploaded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {assignments.map((item) => (
                  <div key={item._id} className="card card-body-lg">
                    <h3 style={{ marginTop: 0, marginBottom: '8px' }}>{item.title}</h3>
                    {item.description && <p style={{ whiteSpace: 'pre-wrap', marginBottom: 'var(--space-3)' }}>{item.description}</p>}
                    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                      {item.fileUrl && (
                        <a href={item.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                          <FiDownload size={13} /> Download Assignment
                        </a>
                      )}
                      {item.dueDate && (
                        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <FiClock size={12} /> Due: {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {item.mySubmission ? (
                      <div className="alert alert-success" style={{ margin: 0 }}>
                        Submitted on {new Date(item.mySubmission.updatedAt).toLocaleString()}
                      </div>
                    ) : (
                      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                        <label className="label">Upload your solution</label>
                        <input
                          type="file"
                          onChange={(e) => setAssignmentFiles((prev) => ({ ...prev, [item._id]: e.target.files?.[0] }))}
                          className="input"
                          style={{ marginBottom: 'var(--space-2)' }}
                        />
                        <textarea
                          value={assignmentNotes[item._id] || ''}
                          onChange={(e) => setAssignmentNotes((prev) => ({ ...prev, [item._id]: e.target.value }))}
                          className="input"
                          rows={2}
                          placeholder="Optional notes"
                          style={{ marginBottom: 'var(--space-2)' }}
                        />
                        <button
                          onClick={() => handleSubmitAssignment(item._id)}
                          className="btn btn-primary btn-sm"
                          disabled={submittingAssignmentId === item._id}
                        >
                          <FiUpload size={13} /> {submittingAssignmentId === item._id ? 'Submitting...' : 'Submit Solution'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeItem?.type === 'reviews' && (
          <div className="animate-fadeIn" style={{ maxWidth: '850px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Course Reviews</h1>
            {!hasReviewed && (
              <form onSubmit={handleSubmitReview} className="card card-body-lg" style={{ marginBottom: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <label className="label" style={{ marginBottom: 0 }}>Rating</label>
                  <select value={reviewForm.rating} onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: Number(e.target.value) }))} className="input select" style={{ maxWidth: 120 }}>
                    {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} ★</option>)}
                  </select>
                </div>
                <textarea
                  required
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                  className="input"
                  rows={4}
                  placeholder="Write your review"
                  style={{ marginBottom: 'var(--space-3)' }}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {reviews.map((r) => (
                <div key={r._id} className="card card-body-lg">
                  <div style={{ fontWeight: 600 }}>{r.student?.name} • {r.rating}★</div>
                  <p style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{r.comment}</p>
                </div>
              ))}
              {reviews.length === 0 && <p style={{ color: 'var(--text-tertiary)' }}>No reviews yet.</p>}
            </div>
          </div>
        )}

        {/* VIEW: Quiz */}
        {activeItem?.type === 'quiz' && activeItem.data && (
          <div className="animate-fadeIn" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
              <div className="stat-icon" style={{
                width: 56, height: 56, borderRadius: 'var(--radius-lg)',
                background: 'var(--accent-amber-soft)', color: 'var(--accent-amber)',
                margin: '0 auto var(--space-4)',
              }}>
                <FiHelpCircle size={28} />
              </div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.02em' }}>{activeItem.data.title}</h1>
              <p style={{ color: 'var(--text-tertiary)' }}>Passing Score: {activeItem.data.passingScore}%</p>
            </div>

            {quizResult && (
              <div className={`alert ${quizResult.passed ? 'alert-success' : 'alert-error'}`}
                style={{ textAlign: 'center', flexDirection: 'column', padding: 'var(--space-6)', marginBottom: 'var(--space-6)', borderRadius: 'var(--radius-lg)' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
                  {quizResult.passed ? '🎉 Congratulations! You Passed!' : '❌ Not Quite. Try Again!'}
                </h2>
                <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Your Score: {quizResult.score}%</p>
                {!quizResult.passed && (
                  <button onClick={() => { setQuizResult(null); setQuizAnswers({}); setCorrectAnswers([]); }}
                    className="btn btn-secondary btn-md" style={{ marginTop: 'var(--space-4)' }}>
                    Retake Quiz
                  </button>
                )}
              </div>
            )}

            {quizResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Answer Review</h3>
                {activeItem.data.questions.map((q, qIdx) => {
                  const selectedIdx = quizAnswers[qIdx];
                  const correctIdx = correctAnswers[qIdx];
                  const isCorrect = selectedIdx === correctIdx;
                  return (
                    <div key={qIdx} className="card card-body-lg">
                      <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                        {qIdx + 1}. {q.question}
                      </div>
                      <div style={{ fontSize: '0.88rem', color: isCorrect ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                        Your answer: {selectedIdx !== undefined ? q.options[selectedIdx] : 'Not answered'}
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                        Correct answer: {correctIdx !== undefined ? q.options[correctIdx] : 'N/A'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!quizResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {activeItem.data.questions.map((q, qIdx) => (
                  <div key={qIdx} className="card card-body-lg">
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-5)', lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--primary)', marginRight: '8px' }}>{qIdx + 1}.</span> {q.question}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {q.options.map((opt, optIdx) => (
                        <label key={optIdx} className="card" style={{
                          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                          padding: 'var(--space-3) var(--space-4)', cursor: 'pointer',
                          borderColor: quizAnswers[qIdx] === optIdx ? 'var(--primary)' : 'var(--border-default)',
                          background: quizAnswers[qIdx] === optIdx ? 'var(--primary-soft)' : 'var(--bg-base)',
                          transition: 'all var(--duration-fast)',
                        }}>
                          <input
                            type="radio" name={`q-${qIdx}`}
                            checked={quizAnswers[qIdx] === optIdx}
                            onChange={() => setQuizAnswers({...quizAnswers, [qIdx]: optIdx})}
                            style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
                          />
                          <span style={{ fontSize: '0.9rem' }}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleQuizSubmit}
                  disabled={submittingQuiz || Object.keys(quizAnswers).length < activeItem.data.questions.length}
                  className="btn btn-primary btn-lg btn-block"
                  style={{ marginTop: 'var(--space-2)' }}>
                  {submittingQuiz ? 'Evaluating...' : 'Submit Quiz'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW: Certificate */}
        {activeItem?.type === 'certificate' && (
          <div className="animate-fadeIn" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 700, marginBottom: 'var(--space-6)', letterSpacing: '-0.02em' }}>Your Certificate</h1>

            {!isCertificateUnlocked && (
              <div className="alert alert-warning" style={{ marginBottom: 'var(--space-5)', textAlign: 'left' }}>
                <strong>Certificate Locked</strong>
                <p style={{ margin: '6px 0 0' }}>
                  Complete all lessons and pass all quizzes to unlock your certificate.
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '0.85rem' }}>
                  Lessons: {certificateEligibility.completedLessons}/{certificateEligibility.totalLessons} | Quizzes passed: {certificateEligibility.passedQuizzesCount}/{certificateEligibility.quizzesRequired}
                </p>
              </div>
            )}

            <div className="certificate">
              <div className="certificate-corner tl" />
              <div className="certificate-corner tr" />
              <div className="certificate-corner bl" />
              <div className="certificate-corner br" />

              <FiAward size={56} style={{ color: 'var(--primary)', marginBottom: 'var(--space-5)' }} />

              <h2 style={{ fontSize: '2rem', fontFamily: 'serif', marginBottom: 'var(--space-6)' }}>Certificate of Completion</h2>

              <p style={{ color: 'var(--text-tertiary)', fontSize: '1rem', marginBottom: 'var(--space-3)' }}>This is to certify that</p>

              <h3 style={{
                fontSize: '2rem', fontWeight: 800, color: 'var(--primary)',
                marginBottom: 'var(--space-5)', borderBottom: '2px solid var(--border-default)',
                paddingBottom: 'var(--space-2)', minWidth: '280px',
              }}>
                {enrollment.student?.name || 'Student Name'}
              </h3>

              <p style={{ color: 'var(--text-tertiary)', fontSize: '1rem', marginBottom: 'var(--space-3)' }}>has successfully completed the course</p>

              <h4 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-8)' }}>{course.title}</h4>

              <div style={{ display: 'flex', justifyContent: 'space-between', width: '75%', borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-3)', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                <span>Date: {enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString() : 'Not completed yet'}</span>
                <span>EduPlatform</span>
              </div>
            </div>

            <button
              className="btn btn-secondary btn-lg"
              style={{ marginTop: 'var(--space-8)' }}
              disabled={!isCertificateUnlocked || downloadingCertificate}
              onClick={handleDownloadCertificate}
            >
              <FiDownload size={16} /> {downloadingCertificate ? 'Downloading...' : 'Download Certificate'}
            </button>

            <button
              className="btn btn-danger btn-sm"
              style={{ marginTop: 'var(--space-3)' }}
              onClick={handleRestartCourse}
              disabled={restartingCourse}
            >
              {restartingCourse ? 'Restarting...' : 'Restart Course'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePlayer;
