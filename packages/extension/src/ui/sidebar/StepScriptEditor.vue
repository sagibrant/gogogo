<!-- StepEditor.vue -->
<template>
  <div>
    <!-- script editor with codemirror -->
    <div class="editor-section">
      <div class="editor-header">
        <label class="editor-label">Step Scripts</label>
        <button class="run-script-btn" @click="handleRunScript">Run Script</button>
      </div>
      <codemirror v-model="editorContent" :extensions="editorExtensions" class="code-editor" />

    </div>

    <!-- ai chat box -->
    <div class="ai-chatbox">
      <div class="ai-chat-controls">
        <div class="ai-selector">
          <label for="ai-engine-select">AI:</label>
          <select id="ai-engine-select" v-model="selectedAIEngine" @change="handleChangeAI">
            <option v-for="engine in aiEngines" :key="engine.value" :value="engine.value">
              {{ engine.label }}
            </option>
          </select>
        </div>
        <button class="inspect-btn" @click="handleInspect">Inspect</button>
      </div>
      <div class="ai-chat-messages">
        <div v-for="(msg, idx) in chatMessages" :key="idx" :class="['chat-msg', msg.role, { waiting: msg.waiting }]">
          <span class="engine-label" v-if="msg.engine">{{ msg.engine }}:</span>
          {{ msg.text }}
        </div>
      </div>
      <div class="ai-chat-input-row">
        <input v-model="chatInput" @keydown.enter="handleSend" placeholder="Type your message..."
          class="ai-chat-input" />
        <button @click="handleSend">Send</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, PropType } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { placeholder } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { ayuLight, coolGlow } from 'thememirror';
import { Step } from '../../execution/Task';

// Define component props with type annotations
const props = defineProps({
  /** The node data to be rendered */
  step: {
    type: Object as PropType<Step>,
    required: true,
    description: 'The tree node data including id, name, type, and children (for groups)'
  }
});

// Define component emission events
const emit = defineEmits<{
  /** Emitted when try to run the script, passes the script content */
  (e: 'run-script', script: string): void;
  /** Emitted when try to show the notification message, passes the message content */
  (e: 'show-notification-message', message: string): void;

}>();

const isDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);

const editorContent = ref('');

const editorExtensions = computed(() => isDark.value ? [javascript(), coolGlow, placeholder('Write your JavaScript here')] : [javascript(), ayuLight, placeholder('Write your JavaScript here')]);

const aiEngines = [
  { label: 'GPT-4.1', value: 'gpt-4.1' },
  { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
  { label: 'Claude Sonnet 3.5', value: 'claude-sonnet-3.5' }
];
const selectedAIEngine = ref(aiEngines[0].value);

const chatMessages = ref<{ role: string; text: string; engine?: string; waiting?: boolean }[]>([
  { role: 'ai', text: 'Hello! How can I help you with JavaScript coding?', engine: aiEngines[0].label }
]);
const chatInput = ref('');

const handleRunScript = () => {
  emit('run-script', editorContent.value);
}
const handleInspect = () => {
  emit('show-notification-message', 'inspected');
}

const handleChangeAI = () => {
  const engineLabel = aiEngines.find(e => e.value === selectedAIEngine.value)?.label;
  emit('show-notification-message', `Changed to ${engineLabel}`);
}

const handleSend = () => {
  if (!chatInput.value.trim()) return;
  const engineLabel = aiEngines.find(e => e.value === selectedAIEngine.value)?.label;
  chatMessages.value.push({
    role: 'user',
    text: chatInput.value,
    engine: engineLabel
  });
  const waitingMsg = {
    role: 'ai',
    text: 'Waiting for AI response...',
    engine: engineLabel,
    waiting: true
  };
  chatMessages.value.push(waitingMsg);
  const userMsg = chatInput.value;
  chatInput.value = '';
  setTimeout(() => {
    const idx = chatMessages.value.indexOf(waitingMsg);
    if (idx !== -1) {
      chatMessages.value.splice(idx, 1, {
        role: 'ai',
        text: `ai is handling the message: ${userMsg}`,
        engine: engineLabel
      });
    }
  }, 5000);
}

onMounted(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const update = () => { isDark.value = media.matches; };
  media.addEventListener('change', update);
  // Clean up
  onUnmounted(() => {
    media.removeEventListener('change', update);
  });

  editorContent.value = props.step.script;
});

</script>

<style scoped>
.code-editor {
  min-height: 200px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.editor-section {
  margin-bottom: 16px;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.editor-label {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  letter-spacing: 0.02em;
}

.run-script-btn {
  background: linear-gradient(90deg, #1976d2 0%, #42a5f5 100%);
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 6px 18px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.08);
  transition: background 0.2s, box-shadow 0.2s;
}

.run-script-btn:hover {
  background: linear-gradient(90deg, #1565c0 0%, #1e88e5 100%);
  box-shadow: 0 4px 16px rgba(25, 118, 210, 0.16);
}

.ai-chatbox {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  min-height: 200px;
  background: #fafafa;
}

.ai-chat-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.ai-selector {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-selector label {
  font-size: 0.97rem;
  font-weight: 500;
  color: #333;
}

.ai-selector select {
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid #bbb;
  font-size: 0.97rem;
  background: #fff;
  color: #222;
  transition: border 0.2s;
}

.ai-selector select:focus {
  border-color: #1976d2;
  outline: none;
}

.inspect-btn {
  background: linear-gradient(90deg, #1976d2 0%, #42a5f5 100%);
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 16px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.08);
  transition: background 0.2s, box-shadow 0.2s;
  height: 32px;
  display: flex;
  align-items: center;
}

.inspect-btn:hover {
  background: linear-gradient(90deg, #1565c0 0%, #1e88e5 100%);
  box-shadow: 0 4px 16px rgba(25, 118, 210, 0.16);
}

.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 8px;
  max-height: 120px;
  display: flex;
  flex-direction: column;
}

.chat-msg {
  margin-bottom: 4px;
  padding: 4px 8px;
  border-radius: 3px;
  word-break: break-word;
  background: #f1f8e9;
  align-self: flex-start;
  font-size: 14px;
}

.chat-msg.user {
  background: #e3f2fd;
  align-self: flex-end;
}

.chat-msg.waiting {
  color: #888;
  font-style: italic;
}

.engine-label {
  font-size: 11px;
  color: #888;
  margin-right: 4px;
}

.ai-chat-input-row {
  display: flex;
  gap: 8px;
}

.ai-chat-input {
  flex: 1;
  padding: 4px 8px;
  border-radius: 3px;
  border: 1px solid #ccc;
  font-size: 14px;
}

.engine-label {
  font-size: 11px;
  color: #888;
  margin-right: 4px;
}

.ai-chat-input-row button {
  background: linear-gradient(90deg, #1976d2 0%, #42a5f5 100%);
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 14px;
  font-size: 0.92rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.08);
  transition: background 0.2s, box-shadow 0.2s;
  margin-left: 2px;
  height: 32px;
  display: flex;
  align-items: center;
}

.ai-chat-input-row button:hover {
  background: linear-gradient(90deg, #1565c0 0%, #1e88e5 100%);
  box-shadow: 0 4px 16px rgba(25, 118, 210, 0.16);
}

/* Dark mode adaptations */
@media (prefers-color-scheme: dark) {

  .editor-label {
    color: #e0e0e0;
  }

  .run-script-btn {
    background: linear-gradient(90deg, #1565c0 0%, #1976d2 100%);
    color: #fff;
    box-shadow: 0 2px 8px rgba(30, 136, 229, 0.12);
  }

  .run-script-btn:hover {
    background: linear-gradient(90deg, #1976d2 0%, #42a5f5 100%);
    box-shadow: 0 4px 16px rgba(30, 136, 229, 0.24);
  }

  .ai-chatbox {
    border-color: #333;
    background: #23272e;
  }

  .ai-selector label {
    color: #b0b0b0;
  }

  .ai-selector select {
    background: #23272e;
    color: #e0e0e0;
    border-color: #444;
  }

  .ai-selector select:focus {
    border-color: #82b1ff;
  }

  .inspect-btn {
    background: linear-gradient(90deg, #1565c0 0%, #1976d2 100%);
    color: #fff;
    box-shadow: 0 2px 8px rgba(30, 136, 229, 0.12);
  }

  .inspect-btn:hover {
    background: linear-gradient(90deg, #1976d2 0%, #42a5f5 100%);
    box-shadow: 0 4px 16px rgba(30, 136, 229, 0.24);
  }

  .chat-msg {
    background: #23272e;
    color: #e0e0e0;
  }

  .chat-msg.user {
    background: #1e293b;
    color: #b3e5fc;
  }

  .chat-msg.waiting {
    color: #b0b0b0;
  }

  .ai-chat-input {
    background: #181c23;
    color: #e0e0e0;
    border-color: #444;
  }

  .ai-chat-input:focus {
    border-color: #82b1ff;
    background: #23272e;
    color: #fff;
  }

  .ai-selector label,
  .engine-label {
    color: #b0b0b0;
  }

  .ai-chat-input-row button {
    background: linear-gradient(90deg, #1565c0 0%, #1976d2 100%);
    color: #fff;
    box-shadow: 0 2px 8px rgba(30, 136, 229, 0.12);
  }

  .ai-chat-input-row button:hover {
    background: linear-gradient(90deg, #1976d2 0%, #42a5f5 100%);
    box-shadow: 0 4px 16px rgba(30, 136, 229, 0.24);
  }
}
</style>