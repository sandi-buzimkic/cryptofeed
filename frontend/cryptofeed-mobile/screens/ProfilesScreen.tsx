import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Image, Modal, TextInput,
  KeyboardAvoidingView, Platform, Pressable, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api`;
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function ProfileScreen() {
  const [isLoggedIn, setIsLoggedIn]     = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode]         = useState<'login' | 'signup'>('login');
  const [loading, setLoading]           = useState(false);
  const [username, setUsername]         = useState('');
  const [name, setName]                 = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    AsyncStorage.multiGet(['token', 'username']).then(stores => {
      const token       = stores[0][1];
      const savedUsername = stores[1][1];
      if (token) {
        setIsLoggedIn(true);
        setUsername(savedUsername ?? '');
      }
    });
  }, []);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim())
      return Alert.alert('Error', 'Please fill in all fields.');
    if (!isValidEmail(email))
      return Alert.alert('Error', 'Please enter a valid email address.');
    if (authMode === 'signup') {
      if (!name.trim()) return Alert.alert('Error', 'Name is required.');
      if (password !== confirmPassword) return Alert.alert('Error', 'Passwords do not match.');
    }

    setLoading(true);
    try {
      const endpoint = authMode === 'login' ? '/login' : '/register';
      const body: any = { email, password };
      if (authMode === 'signup') {
        body.name = name;
        body.password_confirmation = confirmPassword;
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.message || JSON.stringify(data.errors);
        return Alert.alert('Error', message);
      }

      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('username', data.user.name);
      setUsername(data.user.name);
      setIsLoggedIn(true);
      setShowAuthModal(false);
    } catch (e) {
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = await AsyncStorage.getItem('token');
    await fetch(`${API_URL}/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    await AsyncStorage.multiRemove(['token', 'username']);
    setIsLoggedIn(false);
    setUsername('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>

        {isLoggedIn ? (
          <View style={styles.profileCard}>
            <Image
              source={{ uri: `https://ui-avatars.com/api/?name=${username}&background=00ff88&color=000` }}
              style={styles.avatar}
            />
            <Text style={styles.username}>@{username}</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginBox}>
            <Ionicons name="person-circle-outline" size={80} color={Colors.textMuted} />
            <Text style={styles.infoText}>Sign in to sync your portfolio across devices.</Text>
            <TouchableOpacity style={styles.button} onPress={() => setShowAuthModal(true)}>
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal animationType="slide" transparent visible={showAuthModal} onRequestClose={() => setShowAuthModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAuthModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <Pressable style={styles.modalInner} onPress={e => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setAuthMode('login')}>
                  <Text style={[styles.tabText, authMode === 'login' && styles.activeTab]}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setAuthMode('signup')}>
                  <Text style={[styles.tabText, authMode === 'signup' && styles.activeTab]}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                {authMode === 'signup' && (
                  <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#666"
                    value={name} onChangeText={setName} />
                )}
                <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666"
                  value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#666"
                  value={password} onChangeText={setPassword} secureTextEntry />
                {authMode === 'signup' && (
                  <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#666"
                    value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
                )}
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAuth} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#000" />
                  : <Text style={styles.submitButtonText}>{authMode === 'login' ? 'Sign In' : 'Create Account'}</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={() => setShowAuthModal(false)}>
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { padding: 20 },
  title:     { fontSize: 28, fontWeight: 'bold', color: Colors.text, marginBottom: 30 },

  loginBox:  { backgroundColor: Colors.card, padding: 30, borderRadius: 24, alignItems: 'center' },
  infoText:  { color: Colors.textMuted, textAlign: 'center', marginVertical: 20, fontSize: 16 },
  button:    { backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12 },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },

  profileCard:  { backgroundColor: Colors.card, padding: 25, borderRadius: 24, alignItems: 'center' },
  avatar:       { width: 100, height: 100, borderRadius: 50, marginBottom: 15, borderWidth: 3, borderColor: Colors.primary },
  username:     { color: Colors.text, fontSize: 22, fontWeight: 'bold' },
  logoutButton: { marginTop: 20 },
  logoutText:   { color: Colors.error, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { width: '100%' },
  modalInner:   { backgroundColor: '#1a1a1a', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, paddingBottom: 50 },
  modalHeader:  { flexDirection: 'row', marginBottom: 30, gap: 20 },
  tabText:      { color: '#666', fontSize: 20, fontWeight: 'bold' },
  activeTab:    { color: Colors.primary, borderBottomWidth: 2, borderBottomColor: Colors.primary },

  inputContainer: { gap: 15, marginBottom: 25 },
  input:          { backgroundColor: '#262626', color: '#fff', padding: 16, borderRadius: 12, fontSize: 16 },
  submitButton:   { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  closeButton:    { marginTop: 15, alignItems: 'center' },
  closeButtonText: { color: '#888' },
});