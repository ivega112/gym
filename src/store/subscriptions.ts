import { create } from "zustand";

type SubscriptionData = {
  id: string;
  memberId: string;
  membershipId: string;
  memberName: string;
  phone: string;
  startDate: Date;
  endDate: Date;
  durationMonths: number;
  remainingDays: number;
  status: string;
  gymName: string;
};

type SubscriptionStore = {
  subscriptions: SubscriptionData[];
  searchQuery: string;
  statusFilter: string;
  setSubscriptions: (data: SubscriptionData[]) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
};

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  subscriptions: [],
  searchQuery: "",
  statusFilter: "ALL",
  setSubscriptions: (data) => set({ subscriptions: data }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
}));
