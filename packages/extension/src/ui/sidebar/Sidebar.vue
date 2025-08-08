<template>
  <div class="sidebar-container">
    <!-- Header with menus -->
    <header class="sidebar-header">
      <!-- Task menus -->
      <div class="menu-bar task-menu">
        <button class="menu-btn" @click="handleNewTask">{{ t('new') }}</button>
        <span class="menu-divider"></span>
        <button class="menu-btn" @click="handleLoadTask">{{ t('load') }}</button>
        <span class="menu-divider"></span>
        <button class="menu-btn" @click="handleSaveTask">{{ t('save') }}</button>
        <span class="menu-divider"></span>
        <button class="menu-btn" @click="handleOpenMarket">{{ t('market') }}</button>
      </div>

      <!-- Execution menus -->
      <div class="menu-bar execution-menu">
        <button class="menu-btn" @click="handleRecord">{{ t('record') }}</button>
        <span class="menu-divider"></span>
        <button class="menu-btn" @click="handleReplay">{{ t('replay') }}</button>
        <span class="menu-divider"></span>
        <button class="menu-btn" @click="handleReplayFromStep">{{ t('replayFromStep') }}</button>
      </div>
    </header>

    <!-- Middle section with task tree and steps panel -->
    <main class="sidebar-middle">
      <!-- Task tree panel with toggle -->
      <div class="task-tree-panel" :class="{ 'collapsed': isTreeCollapsed }">
        <button class="toggle-tree-btn" @click="toggleTree">
          {{ isTreeCollapsed ? '→' : '←' }}
        </button>
        <div class="tree-container" v-if="!isTreeCollapsed">
          <tree-node :node="taskTree" :active-node-id="activeTaskId" @node-selected="handleTaskSelect" />
        </div>
      </div>

      <!-- Steps panel -->
      <div class="steps-panel">
        <div class="steps-container">
          <div v-for="step in activeSteps" :key="step.uid" class="step-card"
            :class="{ 'selected': activeStepUid === step.uid }" draggable @dragstart="handleDragStart(step.uid)"
            @dragover.prevent="handleDragOver(step.uid)" @drop.prevent="handleDrop(step.uid)">
            <div class="step-type">
              {{ t('S') }}
            </div>
            <div class="step-description" @click="handleStepSelect(step.uid)">
              {{ getStepDescription(step) }}
            </div>
            <div class="step-status" :class="getStepStatus(step.uid)" @click="handleStepResultSelect(step.uid)">
              {{ getStepStatusIcon(step.uid) }}
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Bottom section with tabs -->
    <footer class="sidebar-bottom">

      <div class="sidebar-bottom-content content-panel" v-if="sidebarBottomType === 'step' && selectedStep">
        <step-script-editor :step="selectedStep" @run-script="handleRunScript"
        :key="selectedStep.uid"
          @show-notification-message="showNotificationMessage"></step-script-editor>
      </div>
      <!-- Result tab -->
      <div class="sidebar-bottom-content content-panel" v-if="sidebarBottomType === 'result' && selectedStepResult">
        <step-result-view :result="selectedStepResult"
          @show-notification-message="showNotificationMessage"></step-result-view>
      </div>
    </footer>

    <!-- Notification component -->
    <div class="notification" :class="{ 'visible': showNotification }">
      {{ notificationMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TreeNode from './TreeNode.vue';
import StepScriptEditor from './StepScriptEditor.vue'
import StepResultView from './StepResultView.vue'
import { TaskGroup, Task, Step, TaskUtils, TaskResult, StepResult, } from '../../execution/Task';
import { StepEngine } from './StepEngine';

/**
 * Union type representing either a task or a task group in the tree
 */
type TaskNode = TaskGroup | Task;
/**
 * Demo task group with sample data
 */
const demoTaskGroup: TaskGroup = TaskUtils.createDemoTaskGroup();
const demoTaskResults: TaskResult[] = [];

// Reactive state management
/** Whether the task tree panel is collapsed */
const isTreeCollapsed = ref(true);

/** Currently active tab in the bottom panel */
const sidebarBottomType = ref<'step' | 'result'>('step');

/** Whether to show the notification message */
const showNotification = ref(false);

/** Text content of the notification message */
const notificationMessage = ref('');

/** UID of the step being dragged */
const draggedStepUid = ref('');

/** The root node of the task tree */
const taskTree = ref<TaskNode>(demoTaskGroup);

/** List of all tasks in the tree */
const allTasks = ref<Task[]>([]);

/** ID of the currently active/selected task */
const activeTaskId = ref(''); // Default to first task

/** Steps of the currently active task */
const activeSteps = ref<Step[]>([]);

/** UID of the currently active/selected step */
const activeStepUid = ref('');

/** the selected step in the activeSteps */
const selectedStep = ref<Step | null>(null);

/** Execution result of the currently selected step */
const selectedStepResult = ref<StepResult | null>(null);

// Methods
/**
 * Get localized text by key
 * @param key - The key of the text to localize
 * @returns Localized text string
 */
const t = (key: string) => {
  return chrome.i18n.getMessage(key) || key; // Fallback to key if message not found
};

/**
 * Show a notification message
 * @param message - The message to display
 */
const showNotificationMessage = (message: string) => {
  notificationMessage.value = message;
  showNotification.value = true;
  setTimeout(() => {
    showNotification.value = false;
  }, 1000);
};

/**
 * Recursively load task data from the task tree
 * @param node - Current node to process
 */
const loadTaskData = (node: TaskNode) => {
  if (node.type === 'task') {
    allTasks.value.push(node);
    if (node.id === activeTaskId.value) {
      activeSteps.value = [...node.steps];
      if (node.steps.length > 0) {
        handleStepSelect(node.steps[0].uid);
      }
      else {
        handleStepSelect('');
      }
    }
  } else if (node.children) {
    node.children.forEach(child => loadTaskData(child));
  }
  if (activeTaskId.value.length === 0 && allTasks.value.length > 0) {
    const task = allTasks.value.find(t => t.steps.length > 0);
    if (task) {
      activeTaskId.value = task.id;
      activeSteps.value = [...task.steps];
    }
  }
};

/**
 * Toggle the collapsed state of the task tree panel
 */
const toggleTree = () => {
  isTreeCollapsed.value = !isTreeCollapsed.value;
};

/**
 * Handle selection of a task from the task tree
 * @param taskId - ID of the selected task
 */
const handleTaskSelect = (taskId: string) => {
  activeTaskId.value = taskId;
  for (const task of allTasks.value) {
    if (task.id === taskId) {
      activeSteps.value = [...task.steps];
      if (task.steps.length > 0) {
        handleStepSelect(task.steps[0].uid);
      }
      else {
        handleStepSelect('');
      }
    }
  }
  showNotificationMessage(`Task ${taskId} selected`);
};

/**
 * Handle selection of a step from the steps panel
 * @param uid - UID of the selected step
 */
const handleStepSelect = (uid: string) => {
  activeStepUid.value = uid;

  // Find the selected step
  const step = activeSteps.value.find(step => step.uid === uid);
  if (!step) {
    selectedStep.value = null;
    selectedStepResult.value = null;
    return;
  }
  selectedStep.value = step;
  selectedStepResult.value = null;

  // Update current result
  const findTask = (node: TaskNode): Task | null => {
    if (node.type === 'task' && node.id === activeTaskId.value) {
      return node;
    } else if (node.type === 'group' && node.children) {
      for (const child of node.children) {
        const found = findTask(child);
        if (found) return found;
      }
    }
    return null;
  };

  const currentTask = findTask(taskTree.value);
  if (currentTask) {
    const taskResult = demoTaskResults.find(r => r.task_id === currentTask.id);
    selectedStepResult.value = taskResult?.steps.find(s => s.step_uid === uid) || null;
  }
  // update the bottom content to script editor view
  sidebarBottomType.value = 'step';
};

/**
 * Handle selection of a step result from the steps panel
 * @param uid - UID of the selected step
 */
const handleStepResultSelect = (uid: string) => {
  sidebarBottomType.value = 'result';
}

/**
 * Get a human-readable description for a step
 * @param step - The step to generate a description for
 * @returns Description string
 */
const getStepDescription = (step: Step): string => {
  return step.description
};

/**
 * Get the execution status of a step
 * @param stepUid - UID of the step to check
 * @returns Status as 'success', 'failure', or 'pending'
 */
const getStepStatus = (stepUid: string): 'success' | 'failure' | 'pending' => {
  const findTask = (node: TaskNode): Task | null => {
    if (node.type === 'task' && node.id === activeTaskId.value) {
      return node;
    } else if (node.type === 'group' && node.children) {
      for (const child of node.children) {
        const found = findTask(child);
        if (found) return found;
      }
    }
    return null;
  };

  const currentTask = findTask(taskTree.value);
  if (currentTask) {
    const result = demoTaskResults.find(r => !!r.steps.find(s => s.step_uid === stepUid));
    if (result) {
      return result.status === 'pass' ? 'success' :
        result.status === 'fail' ? 'failure' : 'pending';
    }
  }
  return 'pending';
};

/**
 * Get the status icon for a step
 * @param stepUid - UID of the step to get the icon for
 * @returns Icon character as a string
 */
const getStepStatusIcon = (stepUid: string): string => {
  const status = getStepStatus(stepUid);
  return status === 'success' ? '✓' : status === 'failure' ? '✗' : '○';
};

// Mock menu handlers
/**
 * Handle "New Task" button click
 */
const handleNewTask = () => {
  showNotificationMessage(`${t('new')} task - mock implementation`);
};

/**
 * Handle "Load Task" button click
 */
const handleLoadTask = () => {
  showNotificationMessage(`${t('load')} task - mock implementation`);
};

/**
 * Handle "Save Task" button click
 */
const handleSaveTask = () => {
  showNotificationMessage(`${t('save')} task - mock implementation`);
};

/**
 * Handle "Open Market" button click
 */
const handleOpenMarket = () => {
  showNotificationMessage(`${t('market')} opened - mock implementation`);
};

/**
 * Handle "Record" button click
 */
const handleRecord = () => {
  showNotificationMessage(`${t('record')} started - mock implementation`);
};

/**
 * Handle "Replay" button click
 */
const handleReplay = () => {
  showNotificationMessage(`${t('replay')} started - mock implementation`);
};

/**
 * Handle "Replay from Step" button click
 */
const handleReplayFromStep = () => {
  if (activeStepUid.value) {
    showNotificationMessage(`${t('replayFromStep')}: ${activeStepUid.value} - mock implementation`);
  } else {
    showNotificationMessage(`${t('replayFromStep')} - no step selected`);
  }
};

/**
 * Handle "Run Script" button click in StepScriptEditor
 */
const handleRunScript = (script: string) => {
  if (script.length === 0) {
    return;
  }
  if (!('engine' in window)) {
    return;
  }
  const engine = window.engine as StepEngine;
  engine.runScript(script).then((result) => {
    if (result) {
      showNotificationMessage(`RunScript result: \r\n ${JSON.stringify(result)}`);
    }
    else {
      showNotificationMessage(`RunScript complete.`);
    }
  }).catch((error) => {
    showNotificationMessage(`RunScript failed. error: ${error instanceof Error ? error.message : error}`);
  });
};

// Drag and drop handlers
/**
 * Handle drag start event for reordering steps
 * @param uid - UID of the step being dragged
 */
const handleDragStart = (uid: string) => {
  draggedStepUid.value = uid;
};

/**
 * Handle drag over event (required to allow drop)
 * @param uid - UID of the step being dragged over
 */
const handleDragOver = (uid: string) => {
  // Prevent default to allow drop
};

/**
 * Handle drop event to reorder steps
 * @param targetUid - UID of the step where the dragged step is dropped
 */
const handleDrop = (targetUid: string) => {
  if (draggedStepUid.value && draggedStepUid.value !== targetUid) {
    // Find indices of dragged and target steps
    const draggedIndex = activeSteps.value.findIndex(s => s.uid === draggedStepUid.value);
    const targetIndex = activeSteps.value.findIndex(s => s.uid === targetUid);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Create a copy of steps array
      const newSteps = [...activeSteps.value];
      // Remove dragged step
      const [movedStep] = newSteps.splice(draggedIndex, 1);
      // Insert at new position
      newSteps.splice(targetIndex, 0, movedStep);
      // Update reactive array
      activeSteps.value = newSteps;
      // Update active step uid
      activeStepUid.value = movedStep.uid;
      showNotificationMessage('Step order updated');
    }
  }
  draggedStepUid.value = '';
};

// Lifecycle hooks
/**
 * Initialize component on mount
 */
onMounted(() => {
  loadTaskData(demoTaskGroup);
});

</script>

<style scoped>
/* Styles remain the same as before */
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  color: #333;
  background-color: #fff;
  font-family: Roboto, Arial, sans-serif;
  overflow: hidden;
  border-left: 1px solid #e0e0e0;
}

/* Header Styles */
.sidebar-header {
  padding: 8px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f5f5f5;
}

.menu-bar {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.menu-bar:last-child {
  margin-bottom: 0;
}

.menu-btn {
  padding: 6px 12px;
  border: none;
  background-color: transparent;
  color: #555;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 2px;
}

.menu-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #333;
}

.menu-divider {
  width: 1px;
  height: 16px;
  background-color: #ddd;
  margin: 0 4px;
}

/* Middle Section Styles */
.sidebar-middle {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.task-tree-panel {
  display: flex;
  border-right: 1px solid #e0e0e0;
  background-color: #fafafa;
  min-width: 24px;
  max-width: 240px;
}

.toggle-tree-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #757575;
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  overflow-x: auto;
  min-width: 160px;
}

.task-tree-panel.collapsed .tree-container {
  display: none;
}

.steps-panel {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.steps-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-card {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.step-card:hover {
  border-color: #bdbdbd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.step-card.selected {
  background-color: #337ab7;
  color: white;
  border-color: #337ab7;
}

.step-type {
  min-width: 24px;
  padding-right: 12px;
  border-right: 1px solid #e0e0e0;
  font-weight: 500;
}

.step-card.selected .step-type {
  border-right-color: rgba(255, 255, 255, 0.3);
}

.step-description {
  flex: 1;
  padding: 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.step-status {
  min-width: 24px;
  text-align: center;
  font-weight: bold;
}

.step-status.success {
  color: #4caf50;
}

.step-status.failure {
  color: #f44336;
}

.step-status.pending {
  color: #9e9e9e;
}

/* Bottom Section Styles */
.sidebar-bottom {
  border-top: 1px solid #e0e0e0;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.sidebar-bottom-content {
  padding: 16px;
  overflow-y: auto;
  max-height: 300px;
}

.content-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Object Tab Styles */
.object-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}


/* Notification */
.notification {
  position: absolute;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 4px;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  z-index: 100;
}

.notification.visible {
  opacity: 1;
}


/* Dark Mode Styles */
@media (prefers-color-scheme: dark) {
  .sidebar-container {
    color: #e0e0e0;
    background-color: #121212;
  }

  .sidebar-header {
    border-bottom-color: #333;
    background-color: #1e1e1e;
  }

  .menu-btn {
    background-color: transparent;
  }

  .menu-btn:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .task-tree-panel {
    border-right-color: #333;
    background-color: #1e1e1e;
  }

  .toggle-tree-btn {
    color: #bbb;
  }

  .step-card {
    border-color: #333;
    background-color: #1e1e1e;
  }

  .step-card:hover {
    border-color: #555;
  }

  .step-type {
    border-right-color: #333;
  }

  .sidebar-bottom {
    border-top-color: #333;
    background-color: #1e1e1e;
  }
}
</style>