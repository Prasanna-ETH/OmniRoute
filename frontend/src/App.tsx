import React, { useState } from 'react';
import { MobileFrame } from './components/layout/MobileFrame';
import { BottomNav } from './components/layout/BottomNav';
import type { NavTab } from './components/layout/BottomNav';
import { GalleryPage } from './pages/GalleryPage';
import { SearchPage } from './pages/SearchPage';
import { NpuLabsPage } from './pages/NpuLabsPage';
import { SettingsPage } from './pages/SettingsPage';
import { VideoDetailPage } from './pages/VideoDetailPage';
import type { VideoMetadata, SearchResult } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('search'); // Start on Search for instant demo impact
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [targetTimestamp, setTargetTimestamp] = useState<number>(0);
  const [matchedResult, setMatchedResult] = useState<SearchResult | undefined>(undefined);
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>('battery savings');

  const handleSelectVideoFromGallery = (video: VideoMetadata) => {
    setSelectedVideoId(video.video_id);
    setTargetTimestamp(0);
    setMatchedResult(undefined);
  };

  const handleSelectSearchResult = (result: SearchResult) => {
    setSelectedVideoId(result.video_id);
    setTargetTimestamp(result.timestamp);
    setMatchedResult(result);
  };

  const handleNavigateToSearch = (query?: string) => {
    if (query) setSearchInitialQuery(query);
    setSelectedVideoId(null);
    setCurrentTab('search');
  };

  const handleTabChange = (tab: NavTab) => {
    setSelectedVideoId(null);
    setCurrentTab(tab);
  };

  const handleBackToLibrary = () => {
    setSelectedVideoId(null);
  };

  return (
    <MobileFrame npuActive={true}>
      {/* If a video is opened (either directly or from search result), show VideoDetailPage */}
      {selectedVideoId ? (
        <VideoDetailPage
          videoId={selectedVideoId}
          targetTimestamp={targetTimestamp}
          matchedResult={matchedResult}
          onBack={handleBackToLibrary}
        />
      ) : (
        <>
          {currentTab === 'gallery' && (
            <GalleryPage
              onSelectVideo={handleSelectVideoFromGallery}
              onNavigateToSearch={handleNavigateToSearch}
            />
          )}

          {currentTab === 'search' && (
            <SearchPage
              initialQuery={searchInitialQuery}
              onSelectResult={handleSelectSearchResult}
            />
          )}

          {currentTab === 'npu' && <NpuLabsPage />}

          {currentTab === 'settings' && <SettingsPage />}
        </>
      )}

      {/* Floating Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={handleTabChange}
      />
    </MobileFrame>
  );
};

export default App;
