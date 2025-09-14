// src/components/Common/index.ts
/**
 * Common components export barrel file
 * @module components/Common
 */

// Swipe actions
export { SwipeActions } from './SwipeActions';
export type { SwipeAction, SwipeActionsProps } from './SwipeActions';

// Touch feedback
export { TouchFeedback, TouchFeedbackList, TouchFeedbackButton } from './TouchFeedback';
export type { TouchFeedbackType, TouchFeedbackConfig, TouchFeedbackProps } from './TouchFeedback';

// Gesture recognizer
export { GestureRecognizer } from './GestureRecognizer';
export type { GesturePattern, RecognizedGesture, GestureRecognizerProps } from './GestureRecognizer';

// Default exports
export { default as SwipeActions } from './SwipeActions';
export { default as TouchFeedback } from './TouchFeedback';
export { default as GestureRecognizer } from './GestureRecognizer';
