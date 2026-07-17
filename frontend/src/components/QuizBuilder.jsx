import { useEffect, useState } from 'react';
import api from '../api/client';

const emptyQuestion = () => ({ question_text: '', question_type: 'multiple_choice', points: 1, options: [{ option_text: '', is_correct: true, position: 1 }, { option_text: '', is_correct: false, position: 2 }] });

export default function QuizBuilder({ lesson, editable }) {
  const [quiz, setQuiz] = useState(null);
  const [settings, setSettings] = useState({ title: lesson.title, description: '', passing_score_percentage: 70, maximum_attempts: 1, time_limit_minutes: '' });
  const [question, setQuestion] = useState(emptyQuestion());
  const [error, setError] = useState('');
  const load = () => api.get(`/api/manage/lessons/${lesson.id}/quiz`).then(({ data }) => { setQuiz(data.data); setSettings(data.data); }).catch(error => { if (error.response?.status !== 404) setError('Unable to load quiz.'); });
  useEffect(() => { setQuiz(null); setError(''); load(); }, [lesson.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (question.question_type === 'true_false' && question.options.length !== 2) {
      setQuestion(current => ({ ...current, options: [{ option_text: 'True', is_correct: true, position: 1 }, { option_text: 'False', is_correct: false, position: 2 }] }));
    }
  }, [question.question_type, question.options.length]);

  const saveSettings = async event => {
    event.preventDefault(); setError('');
    const payload = { title: settings.title, description: settings.description || null, passing_score_percentage: Number(settings.passing_score_percentage), maximum_attempts: Number(settings.maximum_attempts), time_limit_minutes: settings.time_limit_minutes ? Number(settings.time_limit_minutes) : null };
    try {
      const { data } = quiz ? await api.put(`/api/manage/quizzes/${quiz.id}`, payload) : await api.post(`/api/manage/lessons/${lesson.id}/quiz`, payload);
      setQuiz(data.data);
    } catch (requestError) { setError(requestError.response?.data?.message || 'Quiz settings could not be saved.'); }
  };
  const saveQuestion = async event => {
    event.preventDefault(); setError('');
    const payload = { ...question, position: (quiz.questions?.length || 0) + 1 };
    try { const { data } = await api.post(`/api/manage/quizzes/${quiz.id}/questions`, payload); setQuiz(data.data); setQuestion(emptyQuestion()); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Question could not be saved.'); }
  };
  const removeQuestion = async id => { try { await api.delete(`/api/manage/questions/${id}`); await load(); } catch (e) { setError(e.response?.data?.message || 'Question could not be removed.'); } };
  const publish = async () => { try { const { data } = await api.post(`/api/manage/quizzes/${quiz.id}/publish`); setQuiz(data.data); } catch (e) { setError(e.response?.data?.message || 'Quiz is not ready to publish.'); } };
  const updateOption = (index, field, value) => setQuestion(current => ({ ...current, options: current.options.map((option, i) => ({ ...option, ...(i === index ? { [field]: value } : {}), ...(field === 'is_correct' ? { is_correct: i === index } : {}) })) }));

  return <div className="space-y-7"><form onSubmit={saveSettings} className="space-y-3"><h3 className="font-bold text-lg">Quiz settings</h3><input className="w-full border rounded-lg p-2" value={settings.title} onChange={e => setSettings({ ...settings, title: e.target.value })} placeholder="Quiz title" disabled={!editable || quiz?.is_locked} /><textarea className="w-full border rounded-lg p-2" value={settings.description || ''} onChange={e => setSettings({ ...settings, description: e.target.value })} placeholder="Instructions" disabled={!editable || quiz?.is_locked} /><div className="grid sm:grid-cols-3 gap-3"><label className="text-sm">Passing %<input type="number" min="1" max="100" className="block w-full border rounded p-2" value={settings.passing_score_percentage} onChange={e => setSettings({ ...settings, passing_score_percentage: Number(e.target.value) })} disabled={!editable || quiz?.is_locked} /></label><label className="text-sm">Attempts<input type="number" min="1" className="block w-full border rounded p-2" value={settings.maximum_attempts} onChange={e => setSettings({ ...settings, maximum_attempts: Number(e.target.value) })} disabled={!editable || quiz?.is_locked} /></label><label className="text-sm">Minutes (optional)<input type="number" min="1" className="block w-full border rounded p-2" value={settings.time_limit_minutes || ''} onChange={e => setSettings({ ...settings, time_limit_minutes: e.target.value })} disabled={!editable || quiz?.is_locked} /></label></div>{editable && !quiz?.is_locked && <button className="px-4 py-2 bg-primary text-white rounded-lg">{quiz ? 'Save settings' : 'Create quiz'}</button>}</form>{error && <p className="p-3 bg-red-50 text-red-700 rounded-lg">{error}</p>}{quiz && <><div><div className="flex justify-between"><h3 className="font-bold text-lg">Questions</h3><span className="text-sm">{quiz.status}</span></div>{quiz.questions?.map(item => <div key={item.id} className="mt-3 border rounded-xl p-4"><div className="flex justify-between"><p className="font-medium">{item.position}. {item.question_text} ({item.points} pts)</p>{editable && !quiz.is_locked && <button onClick={() => removeQuestion(item.id)} className="text-red-600 text-sm">Remove</button>}</div><ul className="mt-2 text-sm text-slate-600">{item.options.map(option => <li key={option.id}>{option.is_correct ? '✓ ' : ''}{option.option_text}</li>)}</ul></div>)}</div>{editable && !quiz.is_locked && <form onSubmit={saveQuestion} className="border-t pt-6 space-y-3"><h3 className="font-bold">Add question</h3><textarea required className="w-full border rounded-lg p-2" value={question.question_text} onChange={e => setQuestion({ ...question, question_text: e.target.value })} /><div className="flex gap-3"><select className="border rounded p-2" value={question.question_type} onChange={e => setQuestion({ ...question, question_type: e.target.value })}><option value="multiple_choice">Multiple choice</option><option value="true_false">True / false</option></select><input type="number" min="0.01" step="0.01" className="border rounded p-2 w-28" value={question.points} onChange={e => setQuestion({ ...question, points: Number(e.target.value) })} /></div>{question.options.map((option, index) => <div key={index} className="flex gap-2"><input type="radio" checked={option.is_correct} onChange={() => updateOption(index, 'is_correct', true)} /><input required className="flex-1 border rounded p-2" value={option.option_text} onChange={e => updateOption(index, 'option_text', e.target.value)} placeholder={`Option ${index + 1}`} /></div>)}{question.question_type === 'multiple_choice' && <button type="button" onClick={() => setQuestion({ ...question, options: [...question.options, { option_text: '', is_correct: false, position: question.options.length + 1 }] })} className="text-accent">+ Option</button>}<button className="block px-4 py-2 bg-primary text-white rounded-lg">Add question</button></form>}{editable && !quiz.is_locked && quiz.status === 'draft' && <button onClick={publish} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Publish quiz</button>}{quiz.is_locked && <p className="p-3 bg-amber-50 text-amber-800 rounded-lg">This assessment is locked because an attempt has started.</p>}</>}</div>;
}
