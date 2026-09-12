"use client";
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";

interface Message {
  role: "user" | "assistant";
  content: string;
  ts?: string;
}

const SUGGESTIONS = [
  "I have a headache and fever",
  "What are symptoms of strep throat?",
  "Is this medication safe to combine?",
  "How long does a cold last?",
  "When should I go to the ER?",
  "Child won't stop coughing",
];

function getTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content, ts: getTime() };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch("https://freedoc.live/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reply = data.content ?? data.message ?? "Sorry, I couldn't get a response.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply, ts: getTime() }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
          ts: getTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>+</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>FreeDoc</Text>
            <Text style={styles.headerSub}>AI Medical Guidance</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL("tel:911")}>
          <Text style={styles.callBtnText}>CALL 911</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messagesArea}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>&#x1FA7A;</Text>
              <Text style={styles.emptyTitle}>Ask FreeDoc anything</Text>
              <Text style={styles.emptySub}>
                Free AI medical guidance, 24/7.{"\n"}Always seek professional care for emergencies.
              </Text>
              <View style={styles.chips}>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity key={s} style={styles.chip} onPress={() => sendMessage(s)}>
                    <Text style={styles.chipText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {messages.map((msg, i) => (
            <View key={i} style={styles.messageRow}>
              <View style={[styles.avatar, msg.role === "assistant" ? styles.avatarDoc : styles.avatarUser]}>
                <Text style={styles.avatarText}>{msg.role === "assistant" ? "+" : "U"}</Text>
              </View>
              <View style={styles.messageBubble}>
                <View style={styles.messageMeta}>
                  <Text style={styles.messageName}>{msg.role === "assistant" ? "FreeDoc" : "You"}</Text>
                  {msg.ts && <Text style={styles.messageTime}>{msg.ts}</Text>}
                </View>
                <Text style={styles.messageText}>{msg.content}</Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={styles.messageRow}>
              <View style={[styles.avatar, styles.avatarDoc]}>
                <Text style={styles.avatarText}>+</Text>
              </View>
              <View style={styles.messageBubble}>
                <Text style={styles.messageName}>FreeDoc</Text>
                <View style={styles.typingDots}>
                  <ActivityIndicator size="small" color="#3b82f6" />
                  <Text style={styles.typingText}>  Thinking...</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about symptoms, medications, conditions..."
            placeholderTextColor="#4a5568"
            multiline
            maxLength={2000}
            onSubmitEditing={() => sendMessage()}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendBtnText}>^</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          Not a substitute for professional medical advice. In emergencies, call 911.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0f1e" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#0d1424", borderBottomWidth: 1, borderBottomColor: "#1e2d4a" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoMark: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center" },
  logoText: { color: "#fff", fontSize: 22, fontWeight: "900" },
  headerTitle: { color: "#f0f4ff", fontSize: 18, fontWeight: "700" },
  headerSub: { color: "#64748b", fontSize: 11, marginTop: 1 },
  callBtn: { backgroundColor: "#dc2626", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  callBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  messagesArea: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  emptyState: { alignItems: "center", paddingTop: 40, paddingBottom: 20 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { color: "#f0f4ff", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  emptySub: { color: "#64748b", fontSize: 14, textAlign: "center", lineHeight: 21, marginBottom: 28, paddingHorizontal: 20 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  chip: { backgroundColor: "#111827", borderWidth: 1, borderColor: "#1e3a5f", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  chipText: { color: "#93c5fd", fontSize: 13 },
  messageRow: { flexDirection: "row", marginBottom: 16, gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  avatarDoc: { backgroundColor: "#1e3a5f" },
  avatarUser: { backgroundColor: "#1a2540" },
  avatarText: { fontSize: 16, color: "#93c5fd", fontWeight: "700" },
  messageBubble: { flex: 1 },
  messageMeta: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 4 },
  messageName: { color: "#93c5fd", fontSize: 14, fontWeight: "600" },
  messageTime: { color: "#4a5568", fontSize: 11 },
  messageText: { color: "#cbd5e1", fontSize: 15, lineHeight: 23 },
  typingDots: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  typingText: { color: "#64748b", fontSize: 14 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#0d1424", borderTopWidth: 1, borderTopColor: "#1e2d4a", gap: 10 },
  input: { flex: 1, backgroundColor: "#111827", borderWidth: 1, borderColor: "#1e3a5f", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: "#f0f4ff", fontSize: 15, maxHeight: 120 },
  sendBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { backgroundColor: "#1e2d4a" },
  sendBtnText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  disclaimer: { color: "#374151", fontSize: 11, textAlign: "center", paddingHorizontal: 16, paddingBottom: 8, paddingTop: 4, backgroundColor: "#0d1424" },
});
