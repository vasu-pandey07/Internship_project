import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiArrowLeft, FiPlus, FiTrash2, FiVideo, FiHelpCircle } from 'react-icons/fi';

const InstructorCourseEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState(0);
  const [savingPrice, setSavingPrice] = useState(false);

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
      const [cRes, qRes] = await Promise.all([
        API.get(`/courses/${id}`),
        API.get(`/courses/${id}/quizzes`)
      ]);
      setCourse(cRes.data.data.course);
      setPrice(Number(cRes.data.data.course.price || 0));
      setQuizzes(qRes.data.data.quizzes);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

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
    } catch (err) { alert('Error deleting lesson'); }
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
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{q.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  {q.questions.length} questions • Passing: {q.passingScore}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstructorCourseEditor;
