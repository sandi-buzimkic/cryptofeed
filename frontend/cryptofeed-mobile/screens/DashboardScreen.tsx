import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, SafeAreaView } from 'react-native';
import { Colors } from '../constants/theme';
import { COIN_META } from '../constants/crypto';

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/prices`;

type PriceData = Record<string, { usd: number }>;

export default function DashboardScreen() {
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setPrices(data);
      setError(null);
    } catch (e) {
      setError('Check API connection');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Market</Text>
      <FlatList
        data={Object.entries(prices ?? {})}
        keyExtractor={([coin]) => coin}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchPrices();}} tintColor={Colors.primary} />}
        renderItem={({ item: [coin, { usd }] }) => {
          const meta = COIN_META[coin] ?? { label: coin, symbol: coin.toUpperCase() };
          return (
            <View style={styles.card}>
              <View>
                <Text style={styles.coinLabel}>{meta.label}</Text>
                <Text style={styles.coinSymbol}>{meta.symbol}</Text>
              </View>
              <Text style={styles.price}>${usd.toLocaleString()}</Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { fontSize: 24, fontWeight: 'bold', color: Colors.text, padding: 20 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, marginHorizontal: 16, marginVertical: 6, padding: 16, borderRadius: 12 },
  coinLabel: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  coinSymbol: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  price: { color: Colors.primary, fontSize: 18, fontWeight: 'bold' },
});