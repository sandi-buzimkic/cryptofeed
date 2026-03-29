import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, RefreshControl,
  SafeAreaView, TextInput, TouchableOpacity, Modal, Image,
  ScrollView, Pressable
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-gifted-charts';
import { Colors } from '../constants/theme';
import { COIN_META } from '../constants/crypto';

const API = `${process.env.EXPO_PUBLIC_API_URL}/api`;

type PriceData = Record<string, { usd: number }>;
type CoinResult = { id: string; name: string; symbol: string; thumb: string };

export default function DashboardScreen() {
  const [prices, setPrices]               = useState<PriceData>({});
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState<CoinResult[]>([]);
  const [searching, setSearching]         = useState(false);
  const [watchlist, setWatchlist]         = useState<string[]>([]);
  const [token, setToken]                 = useState<string | null>(null);
  const [selectedCoin, setSelectedCoin]   = useState<CoinResult | null>(null);
  const [priceHistory, setPriceHistory]   = useState<{ value: number }[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('token').then(savedToken => {
      setToken(savedToken);
      if (savedToken) fetchWatchlist(savedToken);
    });
  }, []);

  const fetchPrices = async () => {
    try {
      const res = await fetch(`${API}/prices`);
      setPrices(await res.json());
    } catch (e) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const eraseSearch = async () => {
    setSearchQuery('');
    setSearchResults([]);
  };


  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchWatchlist = async (t: string) => {
    try {
      const res = await fetch(`${API}/watchlist`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      setWatchlist(await res.json());
    } catch (e) {}
  };

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API}/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(await res.json());
      } catch (e) {
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openCoinModal = async (coin: CoinResult) => {
    setSelectedCoin(coin);
    setPriceHistory([]);
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API}/history/${coin.id}`);
      const data: [number, number][] = await res.json();
      setPriceHistory(data.map(([, price]) => ({ value: price })));
    } catch (e) {
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleFollow = async (coinId: string) => {
    if (!token) return;
    const isFollowing = watchlist.includes(coinId);
    if (isFollowing) {
      await fetch(`${API}/watchlist/${coinId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setWatchlist(prev => prev.filter(id => id !== coinId));
    } else {
      await fetch(`${API}/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ coin_id: coinId }),
      });
      setWatchlist(prev => [...prev, coinId]);
      // Trigger a background price fetch so the new coin gets into Redis
      fetch(`${API}/watchlist/prices`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(() => fetchPrices());
    }
  };

  const renderCoinRow = (coin: CoinResult, price?: number, showPrice = true) => {
    const isFollowing = watchlist.includes(coin.id);
    return (
      <TouchableOpacity key={coin.id} style={styles.card} onPress={() => openCoinModal(coin)}>
        <View style={styles.cardLeft}>
          {coin.thumb
            ? <Image source={{ uri: coin.thumb }} style={styles.coinThumb} />
            : <View style={styles.coinThumbPlaceholder} />
          }
          <View>
            <Text style={styles.coinLabel}>{coin.name}</Text>
            <Text style={styles.coinSymbol}>{coin.symbol.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          {showPrice && (
            price !== undefined
              ? <Text style={styles.price}>${price.toLocaleString()}</Text>
              : <ActivityIndicator size="small" color={Colors.primary} />
          )}
          {isFollowing && <Text style={styles.followingBadge}>● Following</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  // Coins from Redis cache — used as "popular" suggestions when search bar is focused
  const trendingCoins: CoinResult[] = Object.keys(prices).map(id => {
    const meta = COIN_META[id] ?? { label: id, symbol: id.toUpperCase() };
    return { id, name: meta.label, symbol: meta.symbol, thumb: '' };
  });

  // Followed coins built from watchlist + prices already in Redis
  const followedCoins: CoinResult[] = watchlist.map(id => {
    const meta = COIN_META[id] ?? { label: id, symbol: id.toUpperCase() };
    return { id, name: meta.label, symbol: meta.symbol, thumb: '' };
  });

  const followingResults = searchResults.filter(c => watchlist.includes(c.id));
  const discoverResults  = searchResults.filter(c => !watchlist.includes(c.id));
  const currentPrice     = selectedCoin ? prices[selectedCoin.id]?.usd : undefined;

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Market</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search currencies..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searching && (
          <ActivityIndicator size="small" color={Colors.primary} style={styles.searchSpinner} />
        )}
        {searchQuery !== '' && (
          <TouchableOpacity style={styles.button} onPress={() => eraseSearch()}>
            <Text >x</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchPrices(); }}
            tintColor={Colors.primary}
          />
        }
      >
        {searchQuery.trim() === '' ? (
          // Default view — followed coins only
          token ? (
            followedCoins.length === 0 ? (
              <Text style={styles.emptyText}>
                Use the search bar to find and follow currencies
              </Text>
            ) : (
              followedCoins.map(coin => renderCoinRow(coin, prices[coin.id]?.usd))
            )
          ) : (
            // Logged out — show trending as a preview
            <>
              <Text style={styles.sectionHeader}>Trending</Text>
              {trendingCoins.map(coin => renderCoinRow(coin, prices[coin.id]?.usd))}
            </>
          )
        ) : (
          // Search active
          <>
            {/* No query yet — show popular cached coins as suggestions */}
            {searchQuery.trim().length === 0 && (
              <>
                <Text style={styles.sectionHeader}>Popular</Text>
                {trendingCoins.map(coin => renderCoinRow(coin, prices[coin.id]?.usd))}
              </>
            )}

            {followingResults.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Following</Text>
                {followingResults.map(coin =>
                  renderCoinRow(coin, prices[coin.id]?.usd)
                )}
              </>
            )}

            {discoverResults.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Discover</Text>
                {discoverResults.map(coin =>
                  renderCoinRow(coin, prices[coin.id]?.usd, false)
                )}
              </>
            )}

            {searchResults.length === 0 && !searching && searchQuery.trim().length > 0 && (
              <Text style={styles.emptyText}>No results found</Text>
            )}
          </>
        )}
      </ScrollView>

      {/* Coin detail modal */}
      <Modal
        visible={!!selectedCoin}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedCoin(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedCoin(null)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            {selectedCoin && (
              <>
                <View style={styles.modalHeader}>
                  {selectedCoin.thumb
                    ? <Image source={{ uri: selectedCoin.thumb }} style={styles.modalThumb} />
                    : null
                  }
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalCoinName}>{selectedCoin.name}</Text>
                    <Text style={styles.modalCoinSymbol}>{selectedCoin.symbol.toUpperCase()}</Text>
                  </View>
                  {currentPrice !== undefined && (
                    <Text style={styles.modalPrice}>${currentPrice.toLocaleString()}</Text>
                  )}
                </View>

                {loadingHistory ? (
                  <ActivityIndicator color={Colors.primary} style={{ marginVertical: 40 }} />
                ) : priceHistory.length > 0 ? (
                  <View style={{ marginVertical: 20 }}>
                    <Text style={styles.chartLabel}>7-day price</Text>
                    <LineChart
                      data={priceHistory}
                      width={320}
                      height={180}
                      color={Colors.primary}
                      thickness={2}
                      hideDataPoints
                      hideYAxisText
                      xAxisColor="transparent"
                      yAxisColor="transparent"
                      backgroundColor="transparent"
                      noOfSections={4}
                      rulesColor="#2a2a2a"
                      rulesType="solid"
                      areaChart
                      startFillColor={Colors.primary}
                      endFillColor="transparent"
                      startOpacity={0.2}
                      endOpacity={0}
                    />
                  </View>
                ) : null}

                {token ? (
                  <TouchableOpacity
                    style={[
                      styles.followButton,
                      watchlist.includes(selectedCoin.id) && styles.unfollowButton,
                    ]}
                    onPress={() => toggleFollow(selectedCoin.id)}
                  >
                    <Text style={[
                      styles.followButtonText,
                      watchlist.includes(selectedCoin.id) && { color: Colors.error }
                    ]}>
                      {watchlist.includes(selectedCoin.id) ? 'Unfollow' : '+ Follow'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.loginPrompt}>Sign in to follow currencies</Text>
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header:    { fontSize: 28, fontWeight: 'bold', color: Colors.text, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },

  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, backgroundColor: '#1e1e1e', borderRadius: 12, paddingHorizontal: 14 },
  searchInput:     { flex: 1, color: Colors.text, fontSize: 15, paddingVertical: 12 },
  searchSpinner:   { marginLeft: 8 },

  sectionHeader: { color: Colors.textMuted, fontSize: 13, fontWeight: '600', marginHorizontal: 16, marginTop: 16, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  emptyText:     { color: Colors.textMuted, textAlign: 'center', marginTop: 40, marginHorizontal: 30, lineHeight: 22 },

  card:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, marginHorizontal: 16, marginVertical: 5, padding: 14, borderRadius: 14 },
  cardLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  coinThumb:            { width: 36, height: 36, borderRadius: 18 },
  coinThumbPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2a2a2a' },
  coinLabel:      { color: Colors.text, fontSize: 15, fontWeight: '600' },
  coinSymbol:     { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  price:          { color: Colors.primary, fontSize: 16, fontWeight: 'bold' },
  followingBadge: { color: Colors.primary, fontSize: 11 },

  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContent:    { backgroundColor: '#1a1a1a', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 28, paddingBottom: 50 },
  modalHeader:     { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  modalThumb:      { width: 48, height: 48, borderRadius: 24 },
  modalCoinName:   { color: Colors.text, fontSize: 20, fontWeight: 'bold' },
  modalCoinSymbol: { color: Colors.textMuted, fontSize: 14 },
  modalPrice:      { color: Colors.primary, fontSize: 22, fontWeight: 'bold', marginLeft: 'auto' },
  chartLabel:      { color: Colors.textMuted, fontSize: 13, marginBottom: 6 },

  followButton:     { backgroundColor: Colors.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  unfollowButton:   { backgroundColor: '#2a2a2a' },
  followButtonText: { color: '#000', fontWeight: 'bold', fontSize: 15 },
  loginPrompt:      { color: Colors.textMuted, textAlign: 'center', marginTop: 16, fontSize: 13 },

  button: { backgroundColor: Colors.textMuted, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 50 },
});