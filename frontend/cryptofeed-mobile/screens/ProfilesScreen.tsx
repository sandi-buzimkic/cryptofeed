import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  SafeAreaView, Image, Modal, TextInput, 
  KeyboardAvoidingView, Platform, Pressable 
} from 'react-native';
import { Colors } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
    setShowAuthModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>

        {isLoggedIn ? (
          <View style={styles.profileCard}>
            <Image 
              source={{ uri: 'https://ui-avatars.com/api/?name=User&background=00ff88&color=000' }} 
              style={styles.avatar} 
            />
            <Text style={styles.username}>@crypto_trader</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={() => setIsLoggedIn(false)}>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginBox}>
            <Ionicons name="person-circle-outline" size={80} color={Colors.textMuted} />
            <Text style={styles.infoText}>Sign in to sync your portfolio across devices.</Text>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => setShowAuthModal(true)}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* --- AUTH MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAuthModal}
        onRequestClose={() => setShowAuthModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAuthModal(false)}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            {/* Prevent closing when clicking inside the modal */}
            <Pressable style={styles.modalInner} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setAuthMode('login')}>
                  <Text style={[styles.tabText, authMode === 'login' && styles.activeTab]}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setAuthMode('signup')}>
                  <Text style={[styles.tabText, authMode === 'signup' && styles.activeTab]}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput 
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                
                {authMode === 'signup' && (
                  <TextInput 
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="#666"
                    secureTextEntry
                  />
                )}
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAuthSuccess}>
                <Text style={styles.submitButtonText}>
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
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
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.text, marginBottom: 30 },
  
  // Profile Views
  loginBox: { backgroundColor: Colors.card, padding: 30, borderRadius: 24, alignItems: 'center' },
  infoText: { color: Colors.textMuted, textAlign: 'center', marginVertical: 20, fontSize: 16 },
  button: { backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12 },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  
  profileCard: { backgroundColor: Colors.card, padding: 25, borderRadius: 24, alignItems: 'center' },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 15, borderWidth: 3, borderColor: Colors.primary },
  username: { color: Colors.text, fontSize: 22, fontWeight: 'bold' },
  logoutButton: { marginTop: 20 },
  logoutText: { color: Colors.error, fontWeight: '600' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { width: '100%' },
  modalInner: { 
    backgroundColor: '#1a1a1a', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    padding: 30, 
    paddingBottom: 50 
  },
  modalHeader: { flexDirection: 'row', marginBottom: 30, gap: 20 },
  tabText: { color: '#666', fontSize: 20, fontWeight: 'bold' },
  activeTab: { color: Colors.primary, borderBottomWidth: 2, borderBottomColor: Colors.primary },
  
  inputContainer: { gap: 15, marginBottom: 25 },
  input: { 
    backgroundColor: '#262626', 
    color: '#fff', 
    padding: 16, 
    borderRadius: 12, 
    fontSize: 16 
  },
  submitButton: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  closeButton: { marginTop: 15, alignItems: 'center' },
  closeButtonText: { color: '#888' },
});