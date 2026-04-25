export type Participant = {
  houseNumber: number;
  count: number;
  note?: string;
  updatedAt: string;
};

export type SiteContent = {
  news: string[];
  rules: string[];
};

export type HalloweenData = {
  participants: Participant[];
  content: SiteContent;
};

export type House = {
  number: number;
  side: "top" | "bottom";
};

export type MapBlock = {
  id: string;
  label: string;
  top: House[];
  bottom: House[];
};
