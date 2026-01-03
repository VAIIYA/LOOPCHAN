import { Board, Thread, Post } from '../types';

// Helper to create a date object
const createDate = (daysAgo: number, hoursAgo: number = 0, minutesAgo: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date;
};

// Mock Data for Posts (simplified for single Random board)
const mockPosts: Post[] = [
  {
    id: 'post1',
    content: 'This is the first post in the first thread. Welcome to LoopChan!',
    timestamp: createDate(5, 10, 30),
    isAnonymous: true,
    authorWallet: '0xAnonWallet1',
  },
  {
    id: 'post2',
    content: 'Second post, just a reply.',
    timestamp: createDate(5, 9, 45),
    isAnonymous: true,
    authorWallet: '0xAnonWallet2',
  },
  {
    id: 'post3',
    content: 'Third post, with an image!',
    timestamp: createDate(4, 15, 0),
    image: 'https://picsum.photos/seed/image1/400/300',
    imageThumb: 'https://picsum.photos/seed/image1/150/150',
    isAnonymous: true,
    authorWallet: '0xAnonWallet3',
  },
  {
    id: 'post4',
    content: 'Another reply here.',
    timestamp: createDate(4, 14, 30),
    isAnonymous: true,
    authorWallet: '0xAnonWallet4',
  },
  {
    id: 'post5',
    content: 'A post with a video!',
    timestamp: createDate(3, 20, 0),
    video: 'https://www.w3schools.com/html/mov_bbb.mp4',
    isAnonymous: true,
    authorWallet: '0xAnonWallet5',
  },
  {
    id: 'post6',
    content: 'Reply to the video post.',
    timestamp: createDate(3, 19, 15),
    isAnonymous: true,
    authorWallet: '0xAnonWallet6',
  },
];

// Mock Data for Threads (only Random board threads)
const mockThreads: Thread[] = [
  {
    id: 'thread1',
    title: 'First Thread on Random',
    op: mockPosts[0],
    replies: [mockPosts[1], mockPosts[2], mockPosts[3], mockPosts[4], mockPosts[5]],
    replyCount: 5,
    imageCount: 2,
    videoCount: 1,
    board: 'random',
    page: 1,
    createdAt: createDate(5, 10, 30),
    lastReply: createDate(3, 19, 15),
    lastActivity: createDate(3, 19, 15),
    authorWallet: '0xAnonWallet1',
  },
  {
    id: 'thread2',
    title: 'General Discussion',
    op: {
      id: 'post_random1',
      content: 'Anything goes here on the Random board!',
      timestamp: createDate(6, 0, 0),
      isAnonymous: true,
      authorWallet: '0xAnonWalletRandom1',
    },
    replies: [],
    replyCount: 0,
    imageCount: 0,
    videoCount: 0,
    board: 'random',
    page: 1,
    createdAt: createDate(6, 0, 0),
    lastReply: createDate(6, 0, 0),
    lastActivity: createDate(6, 0, 0),
    authorWallet: '0xAnonWalletRandom1',
  },
];

// Single Random board definition
export const initialBoards: Board[] = [
  { id: 'random', name: 'Random', description: 'The most random board on the internet.', maxPages: 1, threadsPerPage: 100, maxThreads: 100 },
];

// Data exports for the single Random board
export const boardsData: { [key: string]: Thread[] } = {
  random: mockThreads.filter(thread => thread.board === 'random')
};

export const threadsData: { [key: string]: Thread } = mockThreads.reduce((acc, thread) => {
  acc[thread.id] = thread;
  return acc;
}, {} as { [key: string]: Thread });

export const postsData: { [key: string]: Post } = mockPosts.reduce((acc, post) => {
  acc[post.id] = post;
  return acc;
}, {} as { [key: string]: Post });