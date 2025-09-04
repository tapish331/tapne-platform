export type Trip = {
  id: string;
  ownerId: string;
  title: string;
  slug: string;
  isPrivate: boolean;
  createdAt: number;
  updatedAt: number;
};

export type TripCreate = {
  ownerId: string;
  title: string;
  isPrivate?: boolean;
};

export type TripUpdate = {
  id: string;
  title?: string;
  isPrivate?: boolean;
};

