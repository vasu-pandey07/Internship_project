import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiPlayCircle, FiCheckCircle, FiAward, FiArrowLeft, FiHelpCircle, FiDownload, FiSend } from 'react-icons/fi';

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
  const [tutorQuestion, setTutorQuestion] = useState('');
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorChats, setTutorChats] = useState({});
  const tutorScrollRef = useRef(null);

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

  const getLessonChat = (lessonId) => tutorChats[lessonId] || [];

  const appendTutorMessage = (lessonId, message) => {
    let updatedChats = {};
    setTutorChats((prev) => {
      const current = prev[lessonId] || [];
      updatedChats = { ...prev, [lessonId]: [...current, message] };
      return updatedChats;
    });
    setTimeout(() => {
      if (Object.keys(updatedChats).length > 0) {
        localStorage.setItem(`aiTutorChats:${id}`, JSON.stringify(updatedChats));
      }
    }, 0);
  };

  const loadData = async () => {
    try {
      const [courseRes, enrollRes, quizRes] = await Promise.all([
        API.get(`/courses/${id}`),
        API.get('/enrollments/my'),
        API.get(`/courses/${id}/quizzes`)
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

      // Determine active item
      if (e.completionPercentage === 100) {
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

  useEffect(() => { loadData(); }, [id]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`aiTutorChats:${id}`);
      if (saved) setTutorChats(JSON.parse(saved));
    } catch (err) {
      console.error('Failed to load saved tutor chats', err);
    }
  }, [id]);

  useEffect(() => {
    const el = tutorScrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [tutorChats, activeItem?._id, activeItem?.data?._id]);

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

  const handleAskTutor = async () => {
    const currentLessonId = activeItem?.data?._id;
    const trimmed = tutorQuestion.trim();
    if (!currentLessonId || !trimmed || tutorLoading) return;

    const existing = getLessonChat(currentLessonId);
    appendTutorMessage(currentLessonId, { role: 'user', text: trimmed });
    setTutorQuestion('');
    setTutorLoading(true);

    try {
      const res = await API.post(`/courses/${id}/lessons/${currentLessonId}/ai-tutor`, {
        question: trimmed,
        history: existing.slice(-8),
      });

      const answer = res.data?.data?.answer || 'No response received.';
      appendTutorMessage(currentLessonId, { role: 'assistant', text: answer });
    } catch (err) {
      appendTutorMessage(currentLessonId, {
        role: 'assistant',
        text: err.response?.data?.message || 'Tutor is unavailable right now. Please try again.',
      });
    }

    setTutorLoading(false);
  };

  const handleClearTutorChat = () => {
    const currentLessonId = activeItem?.data?._id;
    if (!currentLessonId) return;

    setTutorChats((prev) => {
      const next = { ...prev, [currentLessonId]: [] };
      localStorage.setItem(`aiTutorChats:${id}`, JSON.stringify(next));
      return next;
    });
  };

  if (loading || !course || !enrollment) return <LoadingSpinner />;

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
            return (
              <button key={q._id} onClick={() => { setActiveItem({ type: 'quiz', data: q }); setQuizResult(null); setQuizAnswers({}); setCorrectAnswers([]); }}
                className={`sidebar-item ${isActive ? 'active' : ''}`}>
                <FiHelpCircle size={16} style={{ color: enrollment.completionPercentage === 100 ? 'var(--accent-emerald)' : 'var(--accent-amber)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Assessment {qIdx + 1}</div>
                  <div className="truncate-1" style={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--primary)' : 'var(--text-primary)' }}>
                    {q.title}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Certificate Item */}
          <button
            disabled={enrollment.completionPercentage < 100}
            onClick={() => setActiveItem({ type: 'certificate' })}
            className={`sidebar-item ${activeItem?.type === 'certificate' ? 'active' : ''} ${enrollment.completionPercentage < 100 ? 'disabled' : ''}`}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>AI Tutor</h3>
                <button
                  type="button"
                  onClick={handleClearTutorChat}
                  className="btn btn-ghost btn-sm"
                  disabled={getLessonChat(activeItem.data._id).length === 0}
                >
                  Clear Chat
                </button>
              </div>
              <p style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }}>
                Ask doubts about this lesson and get quick explanations.
              </p>

              <div
                ref={tutorScrollRef}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                  marginBottom: 'var(--space-4)',
                  height: '320px',
                  overflowY: 'scroll',
                  scrollbarWidth: 'thin',
                  scrollbarGutter: 'stable',
                  overscrollBehavior: 'contain',
                  paddingRight: '4px',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)',
                  background: 'var(--bg-base)',
                }}
              >
                {getLessonChat(activeItem.data._id).length === 0 && (
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-tertiary)' }}>
                    No messages yet. Try: "Explain this lesson in simple words".
                  </div>
                )}
                {getLessonChat(activeItem.data._id).map((m, idx) => (
                  <div
                    key={`${m.role}-${idx}`}
                    className="card"
                    style={{
                      padding: 'var(--space-3)',
                      background: m.role === 'user' ? 'var(--primary-soft)' : 'var(--bg-base)',
                      borderColor: m.role === 'user' ? 'var(--primary)' : 'var(--border-default)',
                      maxWidth: '92%',
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                      {m.role === 'user' ? 'You' : 'AI Tutor'}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{m.text}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <input
                  value={tutorQuestion}
                  onChange={(e) => setTutorQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAskTutor();
                    }
                  }}
                  placeholder="Ask about this lesson..."
                  className="input"
                  style={{ flex: 1 }}
                />
                <button onClick={handleAskTutor} disabled={tutorLoading || !tutorQuestion.trim()} className="btn btn-primary btn-md">
                  <FiSend size={14} /> {tutorLoading ? 'Thinking...' : 'Ask'}
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
                <span>Date: {new Date(enrollment.completedAt).toLocaleDateString()}</span>
                <span>EduPlatform</span>
              </div>
            </div>

            <button className="btn btn-secondary btn-lg" style={{ marginTop: 'var(--space-8)' }}>
              <FiDownload size={16} /> Download PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePlayer;
