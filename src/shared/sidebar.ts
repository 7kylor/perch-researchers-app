export type ISODateString = string;

export type SidebarNodeType = 'folder' | 'label';

export interface SidebarNodeBase {
  id: string;
  parentId: string | null;
  type: SidebarNodeType;
  name: string;
  iconKey: string | null;
  colorHex: string | null;
  orderIndex: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface SidebarFolder extends SidebarNodeBase {
  type: 'folder';
}

export interface SidebarLabel extends SidebarNodeBase {
  type: 'label';
}

export type SidebarNode = SidebarFolder | SidebarLabel;

export interface SidebarPrefs {
  collapsedNodeIds: string[];
  sidebarCollapsed: boolean;
  version: number;
  updatedAt: ISODateString;
}

export interface CategoryCount {
  nodeId: string; // includes real node ids and built-ins like 'builtin:all'
  paperCount: number;
}

export type SidebarListResponse = {
  nodes: SidebarNode[];
  prefs: SidebarPrefs;
  counts: CategoryCount[];
};

export const BUILTIN_ALL = 'builtin:all';
export const BUILTIN_RECENT = 'builtin:recent';
export const BUILTIN_CATEGORIES = 'builtin:categories';
