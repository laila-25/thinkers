import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="grid min-h-screen place-items-center bg-[#FAFAF7] p-5 text-center" role="alert"><div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl"><h1 className="text-2xl font-extrabold text-slate-950">Thinkers couldn’t load this page</h1><p className="mt-3 text-slate-600">Your data is safe. Reload the page to try again.</p><button type="button" onClick={() => window.location.reload()} className="action mt-6">Reload page</button></div></main>;
  }
}
