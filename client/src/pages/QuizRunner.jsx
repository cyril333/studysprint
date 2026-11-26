// ============================================================
// StudySprint - Interactive Quiz Runner & Scoring (FR-004 & FR-009)
// ============================================================
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiFlag, FiRotateCcw } from 'react-icons/fi';

export default function QuizRunner() {
  const { id, shareToken } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [flagMsg, setFlagMsg] = useState('');

  const fetchQuiz = async () => {
    try {
      const endpoint = shareToken ? `/quizzes/shared/${shareToken}` : `/quizzes/${id}`;
      const res = await api.get(endpoint);
      setQuiz(res.data.quiz);
      setQuestions(res.data.questions || []);
      setAttempts(res.data.attempts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load quiz.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [id, shareToken]);

  const handleSelectOption = (questionId, optionIdx) => {
    if (result) return; // Lock selections after grading
    setAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(answers).length < questions.length) {
      if (!window.confirm('You have unanswered questions. Submit anyway?')) return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/quizzes/${quiz.id}/attempt`, { answers });
      setResult(res.data);
      await fetchQuiz(); // Refresh attempt history
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setResult(null);
  };

  const handleFlagQuiz = async () => {
    const reason = window.prompt('Reason for flagging this shared quiz for admin review:');
    if (!reason || !reason.trim()) return;
    try {
      const res = await api.post(`/quizzes/shared/${shareToken}/flag`, { reason });
      setFlagMsg(res.data.message);
    } catch (err) {
      setFlagMsg('Could not flag quiz.');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="loading-state">Loading quiz...</div>
        </div>
      </>
    );
  }

  if (error || !quiz) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="alert alert-error">{error || 'Quiz not found.'}</div>
          <Link to="/student/quizzes" className="btn-secondary">Back to Quizzes</Link>
        </div>
      </>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="section-header">
          <div>
            <Link to="/student/quizzes" className="back-link"><FiArrowLeft size={14} /> Back to Quizzes</Link>
            <h1 className="page-title mt-1">{quiz.title}</h1>
            <p className="subtitle-muted">
              {quiz.subjectName} &gt; {quiz.topicName} • {questions.length} Questions
              {quiz.authorName && ` • Shared by ${quiz.authorName}`}
            </p>
          </div>
          {shareToken && (
            <button className="btn-sm btn-danger" onClick={handleFlagQuiz}>
              <FiFlag size={14} /> Report Quiz
            </button>
          )}
        </div>

        {flagMsg && <div className="alert alert-success">{flagMsg}</div>}

        {quiz.summary && (
          <div className="panel-card mb-4">
            <span className="code-tag">STUDY SUMMARY</span>
            <p className="mt-1">{quiz.summary}</p>
          </div>
        )}

        {/* Result Score Banner */}
        {result && (
          <div className="result-banner mb-4">
            <div>
              <span className="code-tag">QUIZ GRADED</span>
              <h2>Score: {result.attempt.score} / {result.attempt.totalQuestions} ({result.attempt.percentage}%)</h2>
            </div>
            <button className="btn-primary btn-inline" onClick={handleRetake}>
              <FiRotateCcw size={16} /> Retake Quiz
            </button>
          </div>
        )}

        {/* Questions Form */}
        <form onSubmit={handleSubmit}>
          <div className="quiz-questions-stack">
            {questions.map((q, idx) => {
              const fb = result?.feedback?.find((f) => f.questionId === q.id);

              return (
                <div key={q.id} className={`question-runner-card ${fb ? (fb.isCorrect ? 'q-correct' : 'q-wrong') : ''}`}>
                  <div className="q-header-row">
                    <span className="code-tag">QUESTION {idx + 1} OF {questions.length}</span>
                    {fb && (
                      <span className={fb.isCorrect ? 'fb-badge-ok' : 'fb-badge-err'}>
                        {fb.isCorrect ? <><FiCheckCircle size={14} /> Correct</> : <><FiXCircle size={14} /> Incorrect</>}
                      </span>
                    )}
                  </div>

                  <h3 className="q-prompt">{q.prompt}</h3>

                  <div className="q-options-list">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = answers[q.id] === optIdx;
                      let optionClass = 'q-option-item';
                      if (fb) {
                        if (optIdx === fb.correctIndex) optionClass += ' opt-right';
                        else if (isSelected && !fb.isCorrect) optionClass += ' opt-wrong';
                      } else if (isSelected) {
                        optionClass += ' opt-selected';
                      }

                      return (
                        <label key={optIdx} className={optionClass}>
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={isSelected}
                            disabled={Boolean(result)}
                            onChange={() => handleSelectOption(q.id, optIdx)}
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>

                  {fb && fb.explanation && (
                    <div className="q-explanation">
                      <strong>Explanation:</strong> {fb.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!result && (
            <div className="quiz-submit-bar">
              <span>Answered: {answeredCount} / {questions.length}</span>
              <button type="submit" className="btn-primary btn-inline" disabled={submitting}>
                {submitting ? 'Grading...' : 'Submit Quiz for Grading'}
              </button>
            </div>
          )}
        </form>

        {/* Attempt History (FR-004) */}
        <div className="section mt-5">
          <h2 className="section-title">Attempt History ({attempts.length})</h2>
          {attempts.length === 0 ? (
            <div className="empty-state">
              <p>No attempts recorded yet for this quiz.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Attempt #</th>
                    <th>Score</th>
                    <th>Accuracy</th>
                    <th>Completed At</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a, i) => (
                    <tr key={a.id}>
                      <td>#{attempts.length - i}</td>
                      <td>{a.score} / {a.totalQuestions}</td>
                      <td><strong>{a.percentage}%</strong></td>
                      <td>{new Date(a.completedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
