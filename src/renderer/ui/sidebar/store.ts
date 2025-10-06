import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  CategoryCount,
  SidebarListResponse,
  SidebarNode,
  SidebarPrefs,
} from '../../../shared/sidebar';

type AsyncState<T> = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  data: T | null;
  error?: string;
};

type StoreSnapshot = {
  nodes: SidebarNode[];
  prefs: SidebarPrefs;
  counts: CategoryCount[];
};

function readCache(): StoreSnapshot | null {
  try {
    const raw = localStorage.getItem('sidebarCache');
    if (!raw) return null;
    return JSON.parse(raw) as StoreSnapshot;
  } catch (_) {
    return null;
  }
}

function writeCache(snapshot: StoreSnapshot): void {
  localStorage.setItem('sidebarCache', JSON.stringify(snapshot));
}

export function useSidebarStore() {
  const [nodes, setNodes] = useState<SidebarNode[]>([]);
  const [prefs, setPrefs] = useState<SidebarPrefs>({
    collapsedNodeIds: [],
    sidebarCollapsed: false,
    version: 1,
    updatedAt: new Date().toISOString(),
  });
  const [counts, setCounts] = useState<CategoryCount[]>([]);
  const [state, setState] = useState<AsyncState<SidebarListResponse>>({
    status: 'idle',
    data: null,
  });
  const isHydrated = useRef(false);

  // Hydrate from cache fast
  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setNodes(cached.nodes);
      setPrefs(cached.prefs);
      setCounts(cached.counts);
    }
    // Fetch from DB
    setState((s) => ({ ...s, status: 'loading' }));
    void window.api.sidebar
      .list()
      .then((res) => {
        setNodes(res.nodes);
        setPrefs(res.prefs);
        setCounts(res.counts);
        writeCache({ nodes: res.nodes, prefs: res.prefs, counts: res.counts });
        setState({ status: 'ready', data: res });
        isHydrated.current = true;
      })
      .catch((err) => {
        setState({ status: 'error', data: null, error: String(err) });
      });
  }, []);

  const actions = useMemo(() => {
    return {
      create: async (
        partial: Partial<SidebarNode> & {
          type: 'folder' | 'label';
          name: string;
          parentId?: string | null;
        },
      ): Promise<string> => {
        // optimistic
        const optimisticId = `temp-${Date.now()}`;
        const now = new Date().toISOString();
        const newNode: SidebarNode = {
          id: optimisticId,
          parentId: partial.parentId ?? null,
          type: partial.type,
          name: partial.name,
          iconKey: partial.iconKey ?? null,
          colorHex: partial.colorHex ?? null,
          orderIndex: nodes.filter((n) => n.parentId === (partial.parentId ?? null)).length || 0,
          createdAt: now,
          updatedAt: now,
        } as SidebarNode;
        setNodes((prev) => [...prev, newNode]);
        try {
          const created = await window.api.sidebar.create(partial);
          setNodes((prev) => prev.map((n) => (n.id === optimisticId ? created : n)));
          writeCache({ nodes: nodes, prefs, counts });
          return created.id;
        } catch (e) {
          setNodes((prev) => prev.filter((n) => n.id !== optimisticId));
          throw e;
        }
      },
      update: async (
        id: string,
        updates: Partial<Pick<SidebarNode, 'name' | 'iconKey' | 'colorHex'>>,
      ) => {
        const before = nodes;
        setNodes((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n,
          ),
        );
        try {
          await window.api.sidebar.update(id, updates);
          writeCache({ nodes: nodes, prefs, counts });
        } catch (e) {
          setNodes(before);
          throw e;
        }
      },
      remove: async (id: string) => {
        const before = nodes;
        setNodes((prev) => prev.filter((n) => n.id !== id && n.parentId !== id));
        try {
          await window.api.sidebar.delete(id);
          writeCache({ nodes: nodes, prefs, counts });
        } catch (e) {
          setNodes(before);
          throw e;
        }
      },
      move: async (id: string, newParentId: string | null, newIndex: number) => {
        const before = nodes;
        const reordered: SidebarNode[] = [];
        const moving = nodes.find((n) => n.id === id);
        if (!moving) return;
        const siblings = nodes
          .filter((n) => n.parentId === newParentId && n.id !== id)
          .sort((a, b) => a.orderIndex - b.orderIndex);
        const next = [...siblings.slice(0, newIndex), moving, ...siblings.slice(newIndex)];
        next.forEach((n, i) => {
          reordered.push({
            ...n,
            parentId: n.id === id ? newParentId : n.parentId,
            orderIndex: i,
            updatedAt: new Date().toISOString(),
          });
        });
        const others = nodes.filter((n) => n.parentId !== newParentId && n.id !== id);
        setNodes([...others, ...reordered]);
        try {
          await window.api.sidebar.move(id, newParentId, newIndex);
          writeCache({ nodes: nodes, prefs, counts });
        } catch (e) {
          setNodes(before);
          throw e;
        }
      },
      setSidebarCollapsed: async (collapsed: boolean) => {
        const next: SidebarPrefs = {
          ...prefs,
          sidebarCollapsed: collapsed,
          updatedAt: new Date().toISOString(),
          version: (prefs.version ?? 1) + 1,
        };
        setPrefs(next);
        writeCache({ nodes, prefs: next, counts });
        await window.api.sidebar.prefs.set(next);
      },
      setCollapsedNodeIds: async (ids: string[]) => {
        const next: SidebarPrefs = {
          ...prefs,
          collapsedNodeIds: ids,
          updatedAt: new Date().toISOString(),
          version: (prefs.version ?? 1) + 1,
        };
        setPrefs(next);
        writeCache({ nodes, prefs: next, counts });
        await window.api.sidebar.prefs.set(next);
      },
      refreshCounts: async () => {
        const res = await window.api.sidebar.list();
        setCounts(res.counts);
        writeCache({ nodes, prefs, counts: res.counts });
      },
    };
  }, [nodes, prefs, counts]);

  return { nodes, prefs, counts, state, actions } as const;
}
