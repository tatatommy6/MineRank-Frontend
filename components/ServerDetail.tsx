import React, { useState, useEffect } from 'react';
import type { Server, Review, GalleryPost, User } from '../types';
import { fetchReviews, fetchGalleryPosts, fetchUsers } from '../constants';
import { Gallery } from './Gallery';
import { ReviewList } from './ReviewList';
import { ReviewForm } from './ReviewForm';
import { summarizeReviews } from '../services/geminiService';
import { createReview } from '../constants';
import { ArrowLeftIcon, UsersIcon, SparklesIcon } from './icons';
import { Community } from './Community';

interface ServerDetailProps {
  server: Server;
  onBack: () => void;
  currentUser: User | null;
}

type Tab = 'details' | 'gallery' | 'reviews' | 'community';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                active 
                ? 'bg-slate-700 text-emerald-400 border-b-2 border-emerald-400' 
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
            }`}
        >
            {children}
        </button>
    );
};

export const ServerDetail: React.FC<ServerDetailProps> = ({ server, onBack, currentUser }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [galleryPosts, setGalleryPosts] = useState<GalleryPost[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<Tab>('details');

  // Ensure tags is always an array
  const tags = Array.isArray(server.tags) 
    ? server.tags 
    : typeof server.tags === 'string' 
      ? server.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [allReviews, allGallery, allUsers] = await Promise.all([fetchReviews(), fetchGalleryPosts(), fetchUsers()]);
        if (!mounted) return;
        setReviews(allReviews.filter(r => r.serverId == server.id));
        setGalleryPosts(allGallery.filter(p => p.serverId == server.id));
        setUsers(allUsers);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load reviews or gallery posts', err);
      } finally {
        if (mounted) setAiSummary('');
      }
    };
    load();
    return () => { mounted = false; };
  }, [server.id]);

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!currentUser) return;
    try {
      const created = await createReview({ serverId: server.id, user: currentUser, rating, comment });
      setReviews(prevReviews => [created, ...prevReviews]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Failed to create review', err);
    }
  };

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    setAiSummary('');
    const summary = await summarizeReviews(reviews);
    setAiSummary(summary);
    setIsSummarizing(false);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <button onClick={onBack} className="flex items-center space-x-2 text-slate-300 hover:text-emerald-400 mb-6 transition-colors">
        <ArrowLeftIcon />
        <span>목록으로 돌아가기</span>
      </button>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-lg">
        {/* Header */}
        <div className="relative h-48 md:h-64 bg-cover bg-center" style={{ backgroundImage: `url(${server.bannerUrl})` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-800 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-4xl md:text-5xl font-bold text-white">{server.name}</h1>
            <p className="text-lg text-cyan-300 font-mono bg-black/50 px-2 py-1 rounded inline-block mt-2">{server.ip}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700 px-6">
          <nav className="flex space-x-2 -mb-px">
            <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')}>상세정보</TabButton>
            <TabButton active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')}>갤러리</TabButton>
            <TabButton active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}>리뷰</TabButton>
            <TabButton active={activeTab === 'community'} onClick={() => setActiveTab('community')}>커뮤니티</TabButton>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'details' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                     <h3 className="text-2xl font-bold text-sky-400">서버 상세정보</h3>
                     <p className="text-slate-300">{server.description}</p>
                     <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <span key={tag} className="text-sm font-semibold px-3 py-1 bg-slate-700 text-sky-300 rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="md:col-span-1">
                     <div className="bg-slate-900/50 border border-slate-700 p-4 rounded-lg text-center">
                        <div className="flex items-center justify-center space-x-2 text-slate-300">
                            <UsersIcon className="w-6 h-6 text-cyan-400" />
                            <span className="text-lg">{server.onlinePlayers} / {server.maxPlayers} 접속 중</span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">버전: {server.version}</p>
                    </div>
                </div>
             </div>
          )}

          {activeTab === 'gallery' && <Gallery posts={galleryPosts} users={users} />}
          
          {activeTab === 'reviews' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <h3 className="text-2xl font-bold text-sky-400">플레이어 리뷰 ({reviews.length})</h3>
                    <ReviewList reviews={reviews} users={users} />
                </div>
                <div className="md:col-span-1 space-y-6">
                     <div className="bg-slate-900/50 border border-slate-700 p-4 rounded-lg">
                        <h4 className="font-bold text-lg text-center mb-2">AI 리뷰 요약</h4>
                        <button onClick={handleGenerateSummary} disabled={isSummarizing || reviews.length === 0} className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed">
                            <SparklesIcon className="w-5 h-5"/>
                            <span>{isSummarizing ? '생성 중...' : '요약 생성하기'}</span>
                        </button>
                        {isSummarizing && <div className="text-center mt-4 text-slate-400">생각 중...</div>}
                        {aiSummary && <p className="text-sm text-slate-300 bg-slate-800 p-3 mt-4 rounded-md border border-slate-600">{aiSummary}</p>}
                    </div>
                    {currentUser ? (
                      <ReviewForm onSubmit={handleReviewSubmit} />
                    ) : (
                      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 text-center">
                        <p className="text-slate-300">리뷰를 작성하려면 로그인해야 합니다.</p>
                      </div>
                    )}
                </div>
            </div>
          )}

          {activeTab === 'community' && <Community serverId={server.id} currentUser={currentUser} />}
        </div>
      </div>
    </div>
  );
};