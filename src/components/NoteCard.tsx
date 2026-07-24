import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { firestoreService } from '../lib/firestoreService';
import { Lock, Trash2, MessageSquare, Send } from 'lucide-react';

interface NoteCardProps {
  key?: any;
  note: any;
  user: any;
  isAdmin: boolean;
  onDelete: () => void;
  currentUserName?: string;
}

export default function NoteCard({ note, user, isAdmin, onDelete, currentUserName }: NoteCardProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'notes', note.id, 'comments'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn("Comments sync permission or access denied:", err.message);
    });
    return () => unsub();
  }, [note.id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await firestoreService.setDocument(`notes/${note.id}/comments`, commentId, {
        id: commentId,
        text: newComment,
        authorId: user.uid,
        authorName: currentUserName || user.displayName || 'Membro Nexus Política',
        createdAt: Date.now()
      });
      setNewComment('');
    } catch (err) {
      console.error("Erro ao comentar:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-6 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-blue-600/50 transition-all flex flex-col h-full text-left relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-colors pointer-events-none opacity-0 dark:opacity-100" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className={`text-[8px] font-black px-3 py-1 rounded-sm uppercase tracking-widest leading-none ${note.type === 'private' ? 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]' : 'bg-zinc-950 text-white'}`}>
            {note.type === 'private' ? 'Pessoal' : (note.team || 'Campo')}
          </span>
          {note.type === 'private' && <Lock className="w-3.5 h-3.5 text-[var(--text-secondary)] opacity-50" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{new Date(note.createdAt).toLocaleDateString()}</span>
          {(isAdmin || note.leaderId === user?.uid || note.authorId === user?.uid) && (
             <button onClick={onDelete} className="text-zinc-300 hover:text-red-500 transition-colors p-1 hover:bg-red-500/10 rounded-sm">
               <Trash2 className="w-3.5 h-3.5" />
             </button>
          )}
        </div>
      </div>

      <p className="text-[var(--text-primary)] font-bold text-sm leading-relaxed mb-6 whitespace-pre-wrap relative z-10">"{note.text}"</p>

      <div className="mt-auto relative z-10">
        <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-sm bg-blue-600 flex items-center justify-center font-black text-[11px] text-white shadow-sm border border-white/20">
              {(note.leaderName || note.authorName || 'U').charAt(0)}
            </div>
            <div className="text-left">
              <p className="text-[7px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none">Registrado por</p>
              <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tight mt-1 leading-none">{note.leaderName || note.authorName}</p>
              <p className="text-[8px] font-bold text-blue-600 dark:text-blue-600 uppercase tracking-widest mt-1.5 leading-none">{note.teamName || note.team || (note.authorRole === 'coordinator' ? 'Liderança' : 'Campo')}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest transition-all px-3 py-1.5 rounded-sm border ${showComments ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]' : 'text-[var(--text-secondary)] border-[var(--border-color)] hover:border-blue-600 hover:text-blue-600'}`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> {comments.length}
          </button>
        </div>

        <AnimatePresence>
          {showComments && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-4 pt-2"
            >
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {comments.length > 0 ? comments.map((comment) => (
                  <div key={comment.id} className="bg-[var(--bg-tertiary)]/50 p-4 rounded-sm border border-[var(--border-color)] group/msg">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[8px] font-black text-[var(--text-primary)] uppercase tracking-tighter">{comment.authorName}</span>
                      <span className="text-[7px] font-bold text-[var(--text-secondary)] uppercase">{new Date(comment.createdAt).toLocaleTimeString().slice(0, 5)}</span>
                    </div>
                    <p className="text-[11px] font-medium text-[var(--text-secondary)] leading-relaxed">{comment.text}</p>
                  </div>
                )) : (
                  <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase text-center py-4 tracking-widest opacity-50">Nenhum comentário ainda.</p>
                )}
              </div>
              
              <form onSubmit={handlePostComment} className="flex gap-2 pt-2">
                <input 
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Comentar..."
                  className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm px-4 py-3 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-blue-600 shadow-inner transition-colors"
                />
                <button 
                  disabled={isSubmitting || !newComment.trim()}
                  className="bg-blue-600 text-white p-3 rounded-sm active:scale-95 disabled:opacity-50 shadow-lg hover:bg-blue-500 transition-colors"
                  type="submit"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
