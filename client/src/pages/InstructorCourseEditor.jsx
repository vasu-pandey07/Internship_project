import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiArrowLeft, FiPlus, FiTrash2, FiVideo, FiHelpCircle, FiMessageSquare, FiFileText, FiDownload } from 'react-icons/fi';

const InstructorCourseEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState(0);
  const [savingPrice, setSavingPrice] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({ title: '', description: '', dueDate: '' });
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState({});

  // Lesson Form
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: '', videoUrl: '', content: '', duration: 10, isFreePreview: false });

  // Quiz Form
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiNumQuestions, setAiNumQuestions] = useState(10);
  const [quizForm, setQuizForm] = useState({
    title: '', passingScore: 60, questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]
  });

  const loadData = async () => {
    try {
      const [cRes, qRes, questionRes, assignmentRes] = await Promise.all([
        API.get(`/courses/${id}`),
        API.get(`/courses/${id}/quizzes`),
        API.get(`/courses/${id}/questions/instructor`),
        API.get(`/courses/${id}/assignments`),
      ]);
      setCourse(cRes.data.data.course);
      setPrice(Number(cRes.data.data.course.price || 0));
      setQuizzes(qRes.data.data.quizzes);
      setQuestions(questionRes.data.data.questions || []);
      setAssignments(assignmentRes.data.data.assignments || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [id]);

  const handleAddLesson = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/courses/${id}/lessons`, { ...lessonForm, order: course.lessons.length + 1 });
      setShowLessonForm(false);
      setLessonForm({ title: '', videoUrl: '', content: '', duration: 10, isFreePreview: false });
      loadData();
    } catch (err) { alert(err.response?.data?.message || 'Error adding lesson'); }
  };

  const handleDeleteLesson = async (lessonId) => {
    if(!window.confirm('Delete this lesson?')) return;
    try {
      await API.delete(`/courses/${id}/lessons/${lessonId}`);
      loadData();
    } catch { alert('Error deleting lesson'); }
  };

  const addQuestion = () => {
    setQuizForm(p => ({ ...p, questions: [...p.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }] }));
  };

  const handleAddQuiz = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/courses/${id}/quizzes`, quizForm);
      setShowQuizForm(false);
      setQuizForm({ title: '', passingScore: 60, questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }] });
      loadData();
    } catch (err) { alert(err.response?.data?.message || 'Error adding quiz'); }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Delete this quiz? All student attempts for this quiz will be removed.')) return;
    try {
      await API.delete(`/courses/${id}/quizzes/${quizId}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting quiz');
    }
  };

  const handleGenerateAIQuiz = async () => {
    setAiLoading(true);
    setShowQuizForm(true);
    try {
      const extractedCount = Number((aiTopic.match(/(\d+)\s*questions?/i) || [])[1]);
      const requestedQuestions =
        Number.isInteger(extractedCount) && extractedCount > 0
          ? extractedCount
          : aiNumQuestions;

      const res = await API.post(`/courses/${id}/quizzes/generate`, {
        topic: aiTopic || course.title,
        difficulty: course.level,
        numQuestions: requestedQuestions
      });
      setQuizForm(prev => ({
        ...prev,
        title: `${aiTopic || course.title} Quiz`,
        questions: res.data.data.questions
      }));
      setAiTopic('');
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating AI quiz');
    }
    setAiLoading(false);
  };

  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    const normalizedPrice = Number(price);
    if (Number.isNaN(normalizedPrice) || normalizedPrice < 0) {
      alert('Price must be 0 or a positive number');
      return;
    }

    setSavingPrice(true);
    try {
      await API.put(`/courses/${id}`, { price: normalizedPrice });
      setCourse((prev) => ({ ...prev, price: normalizedPrice }));
      alert('Course price updated');
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating course price');
    }
    setSavingPrice(false);
  };

  const statusMap = {
    draft: 'badge-neutral',
    pending: 'badge-warning',
    approved: 'badge-success',
    rejected: 'badge-danger',
  };

  if (loading) return <LoadingSpinner />;

  const handleAnswerQuestion = async (questionId) => {
    const answer = String(answerDrafts[questionId] || '').trim();
    if (!answer) return;
    try {
      await API.put(`/courses/${id}/questions/${questionId}/answer`, { answer });
      setAnswerDrafts((prev) => ({ ...prev, [questionId]: '' }));
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to answer question');
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentForm.title.trim()) {
      alert('Assignment title is required');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', assignmentForm.title);
      formData.append('description', assignmentForm.description);
      if (assignmentForm.dueDate) formData.append('dueDate', assignmentForm.dueDate);
      if (assignmentFile) formData.append('file', assignmentFile);

      await API.post(`/courses/${id}/assignments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowAssignmentForm(false);
      setAssignmentForm({ title: '', description: '', dueDate: '' });
      setAssignmentFile(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create assignment');
    }
  };

  const handleLoadSubmissions = async (assignmentId) => {
    try {
      const res = await API.get(`/courses/${id}/assignments/${assignmentId}/submissions`);
      setAssignmentSubmissions((prev) => ({ ...prev, [assignmentId]: res.data.data.submissions || [] }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load submissions');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Delete this assignment? All submissions for it will be removed.')) return;
    try {
      await API.delete(`/courses/${id}/assignments/${assignmentId}`);
      setAssignmentSubmissions((prev) => {
        const next = { ...prev };
        delete next[assignmentId];
        return next;
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete assignment');
    }
  };

  return (
    <div className="container-narrow" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
      <button onClick={() => navigate('/instructor')} className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-5)', padding: '4px 0' }}>
        <FiArrowLeft size={14} /> Back to Dashboard
      </button>

      <div className="card card-body-lg" style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '6px' }}>{course.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Status:</span>
          <span className={`badge ${statusMap[course.status] || 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>{course.status}</span>
        </div>
        {course.status === 'rejected' && course.rejectedReason && (
          <div
            style={{
              marginTop: 'var(--space-3)',
              border: '1px solid #fecdd3',
              background: '#fff1f2',
              color: '#9f1239',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              fontSize: '0.84rem',
            }}
          >
            <strong>Admin rejection reason:</strong> {course.rejectedReason}
          </div>
        )}
      </div>

      <form onSubmit={handleUpdatePrice} className="card card-body-lg" style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>Course Price</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>Set `0` to make this course free.</p>
            <div style={{ marginTop: '8px' }}>
              <span className={`badge ${Number(price) === 0 ? 'badge-success' : 'badge-primary'}`}>
                {Number(price) === 0 ? 'Free Course' : 'Paid Course'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input"
              style={{ width: '140px' }}
            />
            <button type="submit" disabled={savingPrice} className="btn btn-primary btn-sm">
              {savingPrice ? 'Saving...' : 'Update Price'}
            </button>
          </div>
        </div>
      </form>

      {/* ── Curriculum (Lessons) ── */}
      <div style={{ marginBottom: 'var(--space-10)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiVideo size={18} /> Curriculum
          </h2>
          <button onClick={() => setShowLessonForm(!showLessonForm)} className="btn btn-secondary btn-sm">
            {showLessonForm ? 'Cancel' : <><FiPlus size={13} /> Add Lesson</>}
          </button>
        </div>

        {showLessonForm && (
          <form onSubmit={handleAddLesson} className="card animate-slideDown" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
            <div className="form-grid">
              <div className="full-width">
                <label className="label">Lesson Title</label>
                <input value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} required className="input" placeholder="Introduction to React" />
              </div>
              <div className="full-width">
                <label className="label">YouTube Link</label>
                <input value={lessonForm.videoUrl} onChange={e => setLessonForm({...lessonForm, videoUrl: e.target.value})} className="input" placeholder="https://youtube.com/watch?v=..." />
              </div>
              <div>
                <label className="label">Duration (mins)</label>
                <input type="number" min="1" value={lessonForm.duration} onChange={e => setLessonForm({...lessonForm, duration: Number(e.target.value)})} className="input" />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.88rem' }}>
                  <input type="checkbox" checked={lessonForm.isFreePreview} onChange={e => setLessonForm({...lessonForm, isFreePreview: e.target.checked})}
                    style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                  Free Preview
                </label>
              </div>
              <div className="full-width">
                <label className="label">Notes / Details / Code</label>
                <textarea value={lessonForm.content} onChange={e => setLessonForm({...lessonForm, content: e.target.value})} rows="3" className="input" />
              </div>
              <div className="full-width form-actions">
                <button type="submit" className="btn btn-primary btn-md">Save Lesson</button>
              </div>
            </div>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {course.lessons.map((l, idx) => (
            <div key={l._id} className="list-item" style={{ padding: 'var(--space-3) var(--space-4)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{idx + 1}. {l.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px', display: 'flex', gap: 'var(--space-3)' }}>
                  <span>{l.duration} mins</span>
                  <span>{l.videoUrl ? '🎬 Video' : '📝 Text only'}</span>
                  {l.isFreePreview && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Free</span>}
                </div>
              </div>
              <button onClick={() => handleDeleteLesson(l._id)} className="btn btn-icon btn-danger btn-sm" title="Delete">
                <FiTrash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {course.lessons.length === 0 && !showLessonForm && (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', padding: 'var(--space-4)' }}>No lessons added yet.</p>
        )}
      </div>

      {/* ── Quizzes ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiHelpCircle size={18} /> Quiz Assessment
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <input
              type="text" placeholder="AI Topic (optional)"
              value={aiTopic} onChange={e => setAiTopic(e.target.value)}
              className="input" style={{ width: '180px', padding: '8px 12px', fontSize: '0.82rem' }}
            />
            <input
              type="number"
              min="1"
              max="50"
              placeholder="Questions"
              value={aiNumQuestions}
              onChange={e => setAiNumQuestions(Math.max(1, Number(e.target.value) || 1))}
              className="input"
              style={{ width: '110px', padding: '8px 12px', fontSize: '0.82rem' }}
            />
            <button disabled={aiLoading} onClick={handleGenerateAIQuiz} className="btn btn-sm"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}>
              {aiLoading ? '✨ Analyzing...' : '✨ AI Generate'}
            </button>
            <button onClick={() => setShowQuizForm(!showQuizForm)} className="btn btn-secondary btn-sm">
              {showQuizForm ? 'Cancel' : <><FiPlus size={13} /> Manual</>}
            </button>
          </div>
        </div>

        {showQuizForm && (
          <form onSubmit={handleAddQuiz} className="card animate-slideDown" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
            <div className="form-grid" style={{ marginBottom: 'var(--space-6)' }}>
              <div>
                <label className="label">Quiz Title</label>
                <input value={quizForm.title} onChange={e => setQuizForm({...quizForm, title: e.target.value})} required className="input" placeholder="e.g. Final Exam" />
              </div>
              <div>
                <label className="label">Passing Score (%)</label>
                <input type="number" min="0" max="100" value={quizForm.passingScore} onChange={e => setQuizForm({...quizForm, passingScore: Number(e.target.value)})} className="input" />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-5)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Questions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {quizForm.questions.map((q, qIdx) => (
                  <div key={qIdx} style={{ background: 'var(--bg-base)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                    <label className="label">Question {qIdx + 1}</label>
                    <input value={q.question} onChange={e => { const n = [...quizForm.questions]; n[qIdx].question = e.target.value; setQuizForm({...quizForm, questions: n}) }}
                      required className="input" style={{ marginBottom: 'var(--space-3)' }} placeholder="Enter question text..." />

                    <div className="form-grid">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="radio" required name={`correct-${qIdx}`} checked={q.correctAnswer === optIdx}
                            onChange={() => { const n = [...quizForm.questions]; n[qIdx].correctAnswer = optIdx; setQuizForm({...quizForm, questions: n}) }}
                            style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} />
                          <input value={opt} onChange={e => { const n = [...quizForm.questions]; n[qIdx].options[optIdx] = e.target.value; setQuizForm({...quizForm, questions: n}) }}
                            required className="input" placeholder={`Option ${optIdx + 1}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addQuestion} className="btn btn-ghost btn-sm" style={{ marginTop: 'var(--space-3)', color: 'var(--primary)' }}>
                <FiPlus size={13} /> Add Another Question
              </button>
            </div>

            <div className="form-actions" style={{ marginTop: 'var(--space-5)' }}>
              <button type="submit" disabled={aiLoading} className="btn btn-primary btn-md">
                {aiLoading ? 'Generating...' : 'Save Quiz'}
              </button>
            </div>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {quizzes.map((q) => (
            <div key={q._id} className="list-item" style={{ padding: 'var(--space-3) var(--space-4)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{q.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  {q.questions.length} questions • Passing: {q.passingScore}%
                </div>
              </div>
              <button onClick={() => handleDeleteQuiz(q._id)} className="btn btn-icon btn-danger btn-sm" title="Delete quiz">
                <FiTrash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'var(--space-10)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiMessageSquare size={18} /> Student Questions
            </h2>
          </div>
          {questions.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem' }}>No student questions yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {questions.map((item) => (
                <div key={item._id} className="card card-body-lg">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', marginBottom: '8px' }}>
                    <strong>{item.student?.name}: {item.question}</strong>
                    <span className={`badge ${item.status === 'answered' ? 'badge-success' : 'badge-warning'}`}>{item.status}</span>
                  </div>
                  {item.answer ? (
                    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', background: 'var(--bg-base)' }}>
                      <strong>Your answer</strong>
                      <p style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{item.answer}</p>
                    </div>
                  ) : (
                    <div>
                      <textarea
                        value={answerDrafts[item._id] || ''}
                        onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [item._id]: e.target.value }))}
                        className="input"
                        rows={3}
                        placeholder="Write answer for the student"
                        style={{ marginBottom: 'var(--space-2)' }}
                      />
                      <button className="btn btn-primary btn-sm" onClick={() => handleAnswerQuestion(item._id)}>Send Answer</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 'var(--space-10)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiFileText size={18} /> Assignments
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAssignmentForm((prev) => !prev)}>
              {showAssignmentForm ? 'Cancel' : <><FiPlus size={13} /> Add Assignment</>}
            </button>
          </div>

          {showAssignmentForm && (
            <form onSubmit={handleCreateAssignment} className="card card-body-lg" style={{ marginBottom: 'var(--space-4)' }}>
              <input className="input" placeholder="Assignment title" value={assignmentForm.title} onChange={(e) => setAssignmentForm((prev) => ({ ...prev, title: e.target.value }))} style={{ marginBottom: 'var(--space-2)' }} />
              <textarea className="input" rows={3} placeholder="Description" value={assignmentForm.description} onChange={(e) => setAssignmentForm((prev) => ({ ...prev, description: e.target.value }))} style={{ marginBottom: 'var(--space-2)' }} />
              <input type="date" className="input" value={assignmentForm.dueDate} onChange={(e) => setAssignmentForm((prev) => ({ ...prev, dueDate: e.target.value }))} style={{ marginBottom: 'var(--space-2)' }} />
              <input type="file" className="input" onChange={(e) => setAssignmentFile(e.target.files?.[0] || null)} style={{ marginBottom: 'var(--space-3)' }} />
              <button type="submit" className="btn btn-primary btn-sm">Create Assignment</button>
            </form>
          )}

          {assignments.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem' }}>No assignments yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {assignments.map((item) => (
                <div key={item._id} className="card card-body-lg">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong>{item.title}</strong>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      {item.fileUrl && (
                        <a href={item.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                          <FiDownload size={13} /> File
                        </a>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => handleLoadSubmissions(item._id)}>View Submissions</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAssignment(item._id)}>Delete</button>
                    </div>
                  </div>
                  {item.description && <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{item.description}</p>}

                  {assignmentSubmissions[item._id] && (
                    <div style={{ marginTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                      <strong>Submissions ({assignmentSubmissions[item._id].length})</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                        {assignmentSubmissions[item._id].map((sub) => (
                          <div key={sub._id} className="list-item" style={{ padding: 'var(--space-2) var(--space-3)' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500 }}>{sub.student?.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{new Date(sub.updatedAt).toLocaleString()}</div>
                            </div>
                            {sub.fileUrl && <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">Download</a>}
                          </div>
                        ))}
                        {assignmentSubmissions[item._id].length === 0 && (
                          <p style={{ color: 'var(--text-tertiary)', margin: 0 }}>No submissions yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorCourseEditor;
