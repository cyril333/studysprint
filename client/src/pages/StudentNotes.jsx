// ============================================================
// StudySprint - Subject, Topic & Notes Workspace (FR-002 & FR-003)
// ============================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import {
  FiFolderPlus, FiPlus, FiTrash2, FiEdit2, FiUpload,
  FiCpu, FiBookOpen, FiCheck, FiX, FiFileText
} from 'react-icons/fi';

export default function StudentNotes() {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Subject form
  const [newSubject, setNewSubject] = useState({ name: '', code: '', description: '' });
  const [showSubjectForm, setShowSubjectForm] = useState(false);

  // Topic form
  const [newTopicName, setNewTopicName] = useState('');

  // Note form
  const [noteForm, setNoteForm] = useState({ id: null, title: '', content: '' });
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [extractingPdf, setExtractingPdf] = useState(false);

  // AI Quiz Draft Review (FR-003)
  const [generatingNoteId, setGeneratingNoteId] = useState(null);
  const [quizDraft, setQuizDraft] = useState(null);
  const [savingQuiz, setSavingQuiz] = useState(false);

  const showAlert = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 4500);
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      const list = res.data.subjects || [];
      setSubjects(list);

      if (list.length > 0) {
        const currentSubj = list.find((s) => s.id === selectedSubjectId) || list[0];
        setSelectedSubjectId(currentSubj.id);
        if (currentSubj.topics.length > 0) {
          const currentTopic = currentSubj.topics.find((t) => t.id === selectedTopicId) || currentSubj.topics[0];
          setSelectedTopicId(currentTopic.id);
        } else {
          setSelectedTopicId(null);
        }
      } else {
        setSelectedSubjectId(null);
        setSelectedTopicId(null);
      }
    } catch (err) {
      showAlert('error', 'Failed to load subjects and notes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || null;
  const activeTopic = activeSubject?.topics?.find((t) => t.id === selectedTopicId) || null;

  // ── Subject CRUD ──────────────────────────────────────────
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.name.trim()) return;
    try {
      const res = await api.post('/subjects', newSubject);
      setNewSubject({ name: '', code: '', description: '' });
      setShowSubjectForm(false);
      await fetchSubjects();
      setSelectedSubjectId(res.data.subject.id);
      showAlert('success', 'Subject created.');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Could not create subject.');
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete this subject and all its topics and notes?')) return;
    try {
      await api.delete(`/subjects/${id}`);
      await fetchSubjects();
      showAlert('success', 'Subject deleted.');
    } catch (err) {
      showAlert('error', 'Could not delete subject.');
    }
  };

  // ── Topic CRUD ────────────────────────────────────────────
  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim() || !activeSubject) return;
    try {
      const res = await api.post(`/subjects/${activeSubject.id}/topics`, { name: newTopicName });
      setNewTopicName('');
      await fetchSubjects();
      setSelectedTopicId(res.data.topic.id);
      showAlert('success', 'Topic added.');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Could not create topic.');
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Delete this topic and all its notes?')) return;
    try {
      await api.delete(`/subjects/topics/${topicId}`);
      await fetchSubjects();
      showAlert('success', 'Topic deleted.');
    } catch (err) {
      showAlert('error', 'Could not delete topic.');
    }
  };

  // ── Note CRUD & File Upload (.pdf, .txt, .md, .csv) ───────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setExtractingPdf(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/subjects/extract-pdf', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setNoteForm((prev) => ({
          ...prev,
          title: prev.title || res.data.title,
          content: res.data.content
        }));
        showAlert('success', res.data.message);
      } catch (err) {
        showAlert('error', err.response?.data?.message || 'Failed to extract text from PDF.');
      } finally {
        setExtractingPdf(false);
        e.target.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setNoteForm((prev) => ({
        ...prev,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
        content: String(text)
      }));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!activeTopic) return;
    try {
      if (noteForm.id) {
        await api.put(`/subjects/notes/${noteForm.id}`, {
          title: noteForm.title,
          content: noteForm.content
        });
        showAlert('success', 'Note updated.');
      } else {
        await api.post(`/subjects/topics/${activeTopic.id}/notes`, {
          title: noteForm.title,
          content: noteForm.content
        });
        showAlert('success', 'Note saved.');
      }
      setNoteForm({ id: null, title: '', content: '' });
      setShowNoteForm(false);
      await fetchSubjects();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to save note.');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.delete(`/subjects/notes/${noteId}`);
      await fetchSubjects();
      showAlert('success', 'Note deleted.');
    } catch (err) {
      showAlert('error', 'Failed to delete note.');
    }
  };

  // ── AI Quiz Generation & Review (FR-003) ──────────────────
  const handleGenerateQuiz = async (note) => {
    setGeneratingNoteId(note.id);
    try {
      const res = await api.post('/quizzes/generate', { noteId: note.id, questionCount: 10 });
      setQuizDraft({
        ...res.data.draft,
        provider: res.data.provider,
        generationTimeMs: res.data.generationTimeMs
      });
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to generate quiz.');
    } finally {
      setGeneratingNoteId(null);
    }
  };

  const handleDraftQuestionChange = (idx, field, value) => {
    setQuizDraft((prev) => {
      const updated = [...prev.questions];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, questions: updated };
    });
  };

  const handleDraftOptionChange = (qIdx, optIdx, value) => {
    setQuizDraft((prev) => {
      const updated = [...prev.questions];
      const opts = [...updated[qIdx].options];
      opts[optIdx] = value;
      updated[qIdx] = { ...updated[qIdx], options: opts };
      return { ...prev, questions: updated };
    });
  };

  const handleSaveQuizDraft = async () => {
    if (!quizDraft) return;
    setSavingQuiz(true);
    try {
      const res = await api.post('/quizzes', {
        noteId: quizDraft.noteId,
        title: quizDraft.title,
        summary: quizDraft.summary,
        questions: quizDraft.questions
      });
      setQuizDraft(null);
      navigate(`/student/quizzes/${res.data.quiz.id}`);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to save quiz.');
    } finally {
      setSavingQuiz(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="loading-state">Loading study workspace...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="section-header">
          <div>
            <h1 className="page-title"><FiBookOpen size={24} /> Study Notes &amp; AI Quiz Generator</h1>
            <p className="subtitle-muted">Organize subjects and topics, upload notes, and synthesize 10-question practice quizzes.</p>
          </div>
          <button className="btn-primary btn-inline" onClick={() => setShowSubjectForm(!showSubjectForm)}>
            <FiFolderPlus size={16} /> New Subject
          </button>
        </div>

        {statusMsg.text && (
          <div className={`alert ${statusMsg.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {statusMsg.text}
          </div>
        )}

        {/* New Subject Form */}
        {showSubjectForm && (
          <form className="panel-card mb-4" onSubmit={handleCreateSubject}>
            <h3 className="mb-3">Create New Subject</h3>
            <div className="form-row-2">
              <div className="form-group">
                <label>Subject Name *</label>
                <input
                  type="text"
                  className="plain-input"
                  placeholder="e.g., Systems Integration & Architecture"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Course Code (Optional)</label>
                <input
                  type="text"
                  className="plain-input"
                  placeholder="e.g., IT342-G01"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary btn-inline"><FiCheck size={16} /> Save Subject</button>
              <button type="button" className="btn-secondary" onClick={() => setShowSubjectForm(false)}>Cancel</button>
            </div>
          </form>
        )}

        {/* AI Quiz Review & Edit Mode (FR-003) */}
        {quizDraft ? (
          <div className="panel-card">
            <div className="section-header">
              <div>
                <span className="role-badge role-student">AI DRAFT REVIEW // {quizDraft.provider} ({quizDraft.generationTimeMs}ms)</span>
                <h2 className="mt-2">Review &amp; Customize Generated Quiz</h2>
              </div>
              <button className="btn-secondary" onClick={() => setQuizDraft(null)}><FiX size={16} /> Discard</button>
            </div>

            <div className="form-group mt-3">
              <label>Quiz Title</label>
              <input
                type="text"
                className="plain-input"
                value={quizDraft.title}
                onChange={(e) => setQuizDraft({ ...quizDraft, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Generated Study Summary</label>
              <textarea
                className="plain-textarea"
                rows={3}
                value={quizDraft.summary}
                onChange={(e) => setQuizDraft({ ...quizDraft, summary: e.target.value })}
              />
            </div>

            <div className="draft-questions-list">
              {quizDraft.questions.map((q, idx) => (
                <div key={idx} className="draft-question-card">
                  <div className="draft-q-header">Question {idx + 1}</div>
                  <div className="form-group">
                    <input
                      type="text"
                      className="plain-input"
                      value={q.prompt}
                      onChange={(e) => handleDraftQuestionChange(idx, 'prompt', e.target.value)}
                    />
                  </div>
                  <div className="draft-options-grid">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="draft-option-row">
                        <input
                          type="radio"
                          name={`correct-${idx}`}
                          checked={q.correctIndex === optIdx}
                          onChange={() => handleDraftQuestionChange(idx, 'correctIndex', optIdx)}
                          title="Mark as correct answer"
                        />
                        <input
                          type="text"
                          className="plain-input"
                          value={opt}
                          onChange={(e) => handleDraftOptionChange(idx, optIdx, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="form-actions mt-4">
              <button className="btn-primary btn-inline" onClick={handleSaveQuizDraft} disabled={savingQuiz}>
                <FiCheck size={16} /> {savingQuiz ? 'Saving Quiz...' : 'Save Quiz & Start Practicing'}
              </button>
              <button className="btn-secondary" onClick={() => setQuizDraft(null)}>Cancel</button>
            </div>
          </div>
        ) : (
          /* Main Two-Column Notes Workspace */
          <div className="workspace-grid">
            {/* Left Sidebar: Subjects & Topics */}
            <aside className="workspace-sidebar">
              <h3 className="sidebar-heading">Subjects ({subjects.length})</h3>
              {subjects.length === 0 ? (
                <p className="subtitle-muted">No subjects yet. Create your first subject above.</p>
              ) : (
                <div className="subject-list">
                  {subjects.map((subj) => (
                    <div key={subj.id} className={`subject-block ${subj.id === selectedSubjectId ? 'active' : ''}`}>
                      <div
                        className="subject-header"
                        onClick={() => {
                          setSelectedSubjectId(subj.id);
                          setSelectedTopicId(subj.topics[0]?.id || null);
                          setShowNoteForm(false);
                        }}
                      >
                        <div>
                          {subj.code && <span className="code-tag">{subj.code}</span>}
                          <strong>{subj.name}</strong>
                        </div>
                        <button
                          className="icon-btn-danger"
                          onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subj.id); }}
                          title="Delete Subject"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>

                      {subj.id === selectedSubjectId && (
                        <div className="topic-list">
                          {subj.topics.map((topic) => (
                            <div
                              key={topic.id}
                              className={`topic-item ${topic.id === selectedTopicId ? 'active' : ''}`}
                              onClick={() => {
                                setSelectedTopicId(topic.id);
                                setShowNoteForm(false);
                              }}
                            >
                              <span>{topic.name} ({topic.notes.length})</span>
                              <button
                                className="icon-btn-danger"
                                onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.id); }}
                                title="Delete Topic"
                              >
                                <FiTrash2 size={12} />
                              </button>
                            </div>
                          ))}

                          <form className="inline-add-form" onSubmit={handleCreateTopic}>
                            <input
                              type="text"
                              placeholder="+ Add topic..."
                              value={newTopicName}
                              onChange={(e) => setNewTopicName(e.target.value)}
                            />
                            <button type="submit" title="Add Topic"><FiPlus size={14} /></button>
                          </form>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </aside>

            {/* Right Main Panel: Notes for Active Topic */}
            <main className="workspace-main">
              {!activeTopic ? (
                <div className="empty-state">
                  <FiFileText size={40} />
                  <p>Select or create a Subject and Topic on the left to add study notes.</p>
                </div>
              ) : (
                <>
                  <div className="section-header">
                    <div>
                      <span className="code-tag">{activeSubject.name}</span>
                      <h2>{activeTopic.name}</h2>
                    </div>
                    <button
                      className="btn-primary btn-inline"
                      onClick={() => {
                        setNoteForm({ id: null, title: '', content: '' });
                        setShowNoteForm(!showNoteForm);
                      }}
                    >
                      <FiPlus size={16} /> Add Study Note
                    </button>
                  </div>

                  {showNoteForm && (
                    <form className="panel-card mb-4" onSubmit={handleSaveNote}>
                      <div className="section-header mb-3">
                        <h3>{noteForm.id ? 'Edit Note' : 'Paste or Upload Digital Note'}</h3>
                        <label className="btn-secondary btn-file-upload">
                          <FiUpload size={14} /> {extractingPdf ? 'Extracting PDF...' : 'Upload .pdf / .txt / .md'}
                          <input type="file" accept=".pdf,.txt,.md,.csv" onChange={handleFileUpload} disabled={extractingPdf} hidden />
                        </label>
                      </div>
                      <div className="form-group">
                        <label>Note Title *</label>
                        <input
                          type="text"
                          className="plain-input"
                          placeholder="e.g., Chapter 3: RESTful APIs & JWT Security"
                          value={noteForm.title}
                          onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Study Content * (min 40 chars recommended for AI Quiz)</label>
                        <textarea
                          className="plain-textarea"
                          rows={7}
                          placeholder="Paste your lecture notes, definitions, or key concepts here..."
                          value={noteForm.content}
                          onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="btn-primary btn-inline">
                          <FiCheck size={16} /> {noteForm.id ? 'Update Note' : 'Save Note'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => setShowNoteForm(false)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {activeTopic.notes.length === 0 ? (
                    <div className="empty-state">
                      <FiBookOpen size={40} />
                      <p>No notes under "{activeTopic.name}" yet. Click "Add Study Note" to paste or upload notes.</p>
                    </div>
                  ) : (
                    <div className="notes-list">
                      {activeTopic.notes.map((note) => (
                        <div key={note.id} className="note-card">
                          <div className="note-card-header">
                            <h3>{note.title}</h3>
                            <div className="note-actions">
                              <button
                                className="btn-primary btn-sm-solid"
                                onClick={() => handleGenerateQuiz(note)}
                                disabled={generatingNoteId === note.id}
                              >
                                <FiCpu size={14} />
                                {generatingNoteId === note.id ? 'Generating 10 Questions...' : 'Generate AI Quiz'}
                              </button>
                              <button
                                className="btn-sm"
                                onClick={() => {
                                  setNoteForm({ id: note.id, title: note.title, content: note.content });
                                  setShowNoteForm(true);
                                }}
                                title="Edit Note"
                              >
                                <FiEdit2 size={14} />
                              </button>
                              <button
                                className="btn-sm btn-danger"
                                onClick={() => handleDeleteNote(note.id)}
                                title="Delete Note"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="note-preview">{note.content}</p>
                          <div className="note-meta">
                            Updated {new Date(note.updatedAt).toLocaleString()} • {note.content.length} characters
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        )}
      </div>
    </>
  );
}
