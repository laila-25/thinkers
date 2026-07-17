import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import api from '../api/client';
import QuizBuilder from '../components/QuizBuilder';
import RichTextEditor from '../components/RichTextEditor';

const apiError = error => error.response?.data?.message || Object.values(error.response?.data?.errors || {})[0]?.[0] || 'Action failed.';

export default function InstructorCurriculum() {
  const { courseId } = useParams();
  const [course,setCourse]=useState(null),[selected,setSelected]=useState(null),[content,setContent]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
  const load=async()=>{const {data}=await api.get(`/api/manage/courses/${courseId}/curriculum`);setCourse(data.data);if(selected)setSelected(data.data.sections.flatMap(s=>s.lessons).find(l=>l.id===selected.id)||null);};
  useEffect(()=>{load().catch(e=>setNotice(apiError(e)));},[courseId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>setContent(selected?.text_content||''),[selected]);
  const run=async action=>{setBusy(true);setNotice('');try{await action();await load();}catch(e){setNotice(apiError(e));}finally{setBusy(false);}};
  const addSection=()=>{const title=window.prompt('Section title');if(title)run(()=>api.post(`/api/manage/courses/${courseId}/sections`,{title,position:course.sections.length+1}));};
  const addLesson=section=>{const title=window.prompt('Lesson title');const type=title&&window.prompt('Content type: text, video, resource, or quiz','text');if(title&&['text','video','resource','quiz'].includes(type))run(()=>api.post(`/api/manage/sections/${section.id}/lessons`,{title,content_type:type,duration:0,position:section.lessons.length+1,is_published:false,is_preview:false}));};
  const editLesson=()=>{const title=window.prompt('Lesson title',selected.title);if(title)run(()=>api.put(`/api/manage/lessons/${selected.id}`,{title}));};
  const removeLesson=()=>window.confirm('Delete this lesson and its content?')&&run(()=>api.delete(`/api/manage/lessons/${selected.id}`));
  const saveText=()=>run(()=>api.put(`/api/manage/lessons/${selected.id}/content`,{content}));
  const upload=(kind,file)=>{if(!file)return;const form=new FormData();form.append(kind==='video'?'video':'file',file);run(()=>api.post(`/api/manage/lessons/${selected.id}/${kind==='video'?'video':'attachments'}`,form));};
  const removeAttachment=id=>run(()=>api.delete(`/api/manage/attachments/${id}`));
  if(!course)return <div className="py-20 text-center">{notice||'Loading curriculum...'}</div>;
  const editable=['draft','rejected'].includes(course.status);
  return <section className="max-w-7xl mx-auto px-4 py-12"><header className="flex justify-between"><div><p>{course.status}</p><h1 className="text-3xl font-bold">{course.title}</h1></div>{editable&&<button disabled={busy} onClick={addSection} className="action">Add section</button>}</header>{notice&&<p className="notice">{notice}</p>}{!editable&&<p className="notice">This curriculum is read-only while under review or published.</p>}<div className="grid lg:grid-cols-3 gap-6 mt-8"><aside>{course.sections.map(section=><div key={section.id} className="border rounded-xl p-4 mb-4"><div className="flex justify-between"><strong>{section.title}</strong>{editable&&<button onClick={()=>addLesson(section)}>+ Lesson</button>}</div>{section.lessons.map(lesson=><button key={lesson.id} onClick={()=>setSelected(lesson)} className={`block w-full text-left p-2 mt-2 rounded ${selected?.id===lesson.id?'bg-sky-50':'bg-slate-50'}`}>{lesson.title} <small>({lesson.content_type})</small></button>)}</div>)}</aside><main className="lg:col-span-2 border rounded-2xl p-6">{!selected?<p>Select a lesson.</p>:<><div className="flex justify-between"><h2 className="text-2xl font-bold">{selected.title}</h2>{editable&&<div className="flex gap-3"><button onClick={editLesson}>Edit</button><button className="text-red-600" onClick={removeLesson}>Delete</button></div>}</div>{selected.content_type==='quiz'?<div className="mt-6"><QuizBuilder lesson={selected} editable={editable}/></div>:<>{selected.content_type==='text'&&<div className="mt-6"><RichTextEditor value={content} onChange={setContent}/>{editable&&<button onClick={saveText} className="action mt-3">Save text</button>}</div>}{selected.content_type==='video'&&<div className="mt-6"><p>{selected.video?.original_name||'No video uploaded.'}</p>{editable&&<input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={e=>upload('video',e.target.files[0])}/>}</div>}<div className="mt-8"><h3 className="font-bold">Resources</h3>{selected.attachments?.map(a=><div key={a.id} className="flex justify-between py-2"><span>{a.display_name}</span>{editable&&<button onClick={()=>removeAttachment(a.id)} className="text-red-600">Remove</button>}</div>)}{editable&&<input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" onChange={e=>upload('attachment',e.target.files[0])}/>}</div></>}</>}</main></div></section>;
}
