// src/pages/Videos.jsx
import { useEffect, useState } from 'react';
import { Search, TrendingUp, Clock, Flame } from 'lucide-react';
import VideoCard from '../components/video/VideoCard';
import {
  getNewestVideos,
  getTopVideos,
  getTrendingVideos,
  searchVideos,
} from '../firebase/videos';
import toast from 'react-hot-toast';
import '../styles/videos.css';

export default function Videos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trending');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadVideos();
  }, [activeTab]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      let data = [];
      switch (activeTab) {
        case 'trending':
          data = await getTrendingVideos(20);
          break;
        case 'newest':
          data = await getNewestVideos(20);
          break;
        case 'top':
          data = await getTopVideos(20);
          break;
        default:
          data = await getTrendingVideos(20);
      }
      setVideos(data);
    } catch (err) {
      console.error('Failed to load videos:', err);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const results = await searchVideos(searchTerm);
      setSearchResults(results);
    } catch (err) {
      console.error('Failed to search videos:', err);
      toast.error('Failed to search videos');
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const displayVideos = isSearching ? searchResults : videos;


  return (
    <div className="videos-page">
      <div className="videos-header">
        <h1>Videos</h1>
        <p className="videos-subtitle">Discover amazing video content from artists</p>
      </div>

      {/* Search Bar */}
      <form className="videos-search" onSubmit={handleSearch}>
        <div className="videos-search-input-wrap">
          <Search size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search videos..."
            className="videos-search-input"
          />
          {isSearching && (
            <button type="button" onClick={clearSearch} className="videos-search-clear">
              Clear
            </button>
          )}
        </div>
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {/* Tabs */}
      {!isSearching && (
        <div className="videos-tabs">
          <button
            className={`videos-tab ${activeTab === 'trending' ? 'active' : ''}`}
            onClick={() => setActiveTab('trending')}
          >
            <Flame size={18} />
            <span>Trending</span>
          </button>
          <button
            className={`videos-tab ${activeTab === 'newest' ? 'active' : ''}`}
            onClick={() => setActiveTab('newest')}
          >
            <Clock size={18} />
            <span>New</span>
          </button>
          <button
            className={`videos-tab ${activeTab === 'top' ? 'active' : ''}`}
            onClick={() => setActiveTab('top')}
          >
            <TrendingUp size={18} />
            <span>Top Rated</span>
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="videos-loading">
          <div className="spinner" />
        </div>
      )}

      {/* Videos Grid */}
      {!loading && (
        <>
          {isSearching && (
            <div className="videos-search-info">
              Found {searchResults.length} results for "{searchTerm}"
            </div>
          )}
          {displayVideos.length === 0 ? (
            <div className="videos-empty">
              <p>No videos found</p>
            </div>
          ) : (
            <div className="videos-grid">
              {displayVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
