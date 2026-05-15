// src/store/jobStore.js
// Zustand store for job/booking state management

import { create } from 'zustand';

const useJobStore = create((set) => ({
  activeJob: null,          // The currently active job (real-time listener)
  incomingJobs: [],         // For workers: list of open job requests nearby
  myBookings: [],           // For customers: all their bookings
  selectedCategory: null,   // Category selected on CustomerHome to pre-fill PostRequest

  setActiveJob: (job) => set({ activeJob: job }),
  setIncomingJobs: (jobs) => set({ incomingJobs: jobs }),
  setMyBookings: (bookings) => set({ myBookings: bookings }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  clearJobState: () =>
    set({ activeJob: null, incomingJobs: [], myBookings: [], selectedCategory: null }),
}));

export default useJobStore;
