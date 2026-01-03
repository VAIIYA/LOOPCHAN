import { useState } from 'react';
import { Thread } from '../types';
import { initialBoards } from '../data/mockData';

export const useImageboard = () => {
  const boards = initialBoards;
  const [currentView, setCurrentView] = useState<'boards' | 'threads' | 'thread'>('boards');
  const [currentBoard, setCurrentBoard] = useState<string>('');
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);

  const navigateToBoard = (boardId: string) => {
    setCurrentBoard(boardId);
    setCurrentView('threads');
    setCurrentThread(null);
  };

  const navigateToThread = (threadId: string) => {
    const board = boards.find(b => b.id === currentBoard);
    const thread = board?.threads?.find(t => t.id === threadId);
    if (thread) {
      setCurrentThread(thread);
      setCurrentView('thread');
    }
  };

  const navigateToBoards = () => {
    setCurrentView('boards');
    setCurrentBoard('');
    setCurrentThread(null);
  };

  const navigateBack = () => {
    if (currentView === 'thread') {
      setCurrentView('threads');
      setCurrentThread(null);
    } else if (currentView === 'threads') {
      navigateToBoards();
    }
  };

  const getCurrentBoard = () => {
    return boards.find(b => b.id === currentBoard);
  };

  return {
    boards,
    currentView,
    currentBoard,
    currentThread,
    getCurrentBoard,
    navigateToBoard,
    navigateToThread,
    navigateToBoards,
    navigateBack
  };
};