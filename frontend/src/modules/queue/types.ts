export type QueueHistoryItem = {
  counter: string;
  isCurrent?: boolean;
  number: string;
  time?: string;
};

export type QueueStat = {
  label: string;
  tone?: 'blue' | 'green' | 'amber';
  value: string;
};
