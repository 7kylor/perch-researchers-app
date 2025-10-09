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
  } catch {
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
    sidebarCollapsed: true, // Default to collapsed for new users
    version: 1,
    updatedAt: new Date().toISOString(),
  });
  const [counts, setCounts] = useState<CategoryCount[]>([]);
  const [state, setState] = useState<AsyncState<SidebarListResponse>>({
    status: 'idle',
    data: null,
  });
  const isHydrated = useRef(false);

  // Get current state for actions (to avoid stale closures)
  const getCurrentState = () => ({ nodes, prefs, counts });

  // Hydrate from cache fast
  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setNodes(cached.nodes);
      // Use cached prefs but default to collapsed if no explicit preference exists
      const mergedPrefs = {
        ...cached.prefs,
        sidebarCollapsed:
          cached.prefs.sidebarCollapsed !== undefined ? cached.prefs.sidebarCollapsed : true,
      };
      setPrefs(mergedPrefs);
      setCounts(cached.counts);
    }
    // Fetch from DB
    setState((s) => ({ ...s, status: 'loading' }));
    void window.api.sidebar
      .list()
      .then((res) => {
        setNodes(res.nodes);
        // Merge preferences: use API prefs but default to collapsed if no explicit preference exists
        const mergedPrefs = {
          ...res.prefs,
          sidebarCollapsed:
            res.prefs.sidebarCollapsed !== undefined ? res.prefs.sidebarCollapsed : true, // Default to collapsed for new users
        };
        setPrefs(mergedPrefs);
        setCounts(res.counts);
        writeCache({ nodes: res.nodes, prefs: mergedPrefs, counts: res.counts });
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
        const {
          nodes: currentNodes,
          prefs: currentPrefs,
          counts: currentCounts,
        } = getCurrentState();
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
          orderIndex:
            currentNodes.filter((n) => n.parentId === (partial.parentId ?? null)).length || 0,
          createdAt: now,
          updatedAt: now,
        } as SidebarNode;
        setNodes((prev) => [...prev, newNode]);
        try {
          const created = await window.api.sidebar.create(partial);
          setNodes((prev) => prev.map((n) => (n.id === optimisticId ? created : n)));
          writeCache({ nodes: currentNodes, prefs: currentPrefs, counts: currentCounts });
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
        const {
          nodes: currentNodes,
          prefs: currentPrefs,
          counts: currentCounts,
        } = getCurrentState();
        const before = currentNodes;
        setNodes((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n,
          ),
        );
        try {
          await window.api.sidebar.update(id, updates);
          writeCache({ nodes: currentNodes, prefs: currentPrefs, counts: currentCounts });
        } catch (e) {
          setNodes(before);
          throw e;
        }
      },
      remove: async (id: string) => {
        const {
          nodes: currentNodes,
          prefs: currentPrefs,
          counts: currentCounts,
        } = getCurrentState();
        const before = currentNodes;
        setNodes((prev) => prev.filter((n) => n.id !== id && n.parentId !== id));
        try {
          await window.api.sidebar.delete(id);
          writeCache({ nodes: currentNodes, prefs: currentPrefs, counts: currentCounts });
        } catch (e) {
          setNodes(before);
          throw e;
        }
      },
      move: async (id: string, newParentId: string | null, newIndex: number) => {
        const {
          nodes: currentNodes,
          prefs: currentPrefs,
          counts: currentCounts,
        } = getCurrentState();
        const before = currentNodes;
        const reordered: SidebarNode[] = [];
        const moving = currentNodes.find((n) => n.id === id);
        if (!moving) return;
        const siblings = currentNodes
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
        const others = currentNodes.filter((n) => n.parentId !== newParentId && n.id !== id);
        setNodes([...others, ...reordered]);
        try {
          await window.api.sidebar.move(id, newParentId, newIndex);
          writeCache({ nodes: currentNodes, prefs: currentPrefs, counts: currentCounts });
        } catch (e) {
          setNodes(before);
          throw e;
        }
      },
      setSidebarCollapsed: (collapsed: boolean) => {
        console.log('🔄 STORE: setSidebarCollapsed called with:', collapsed);
        const {
          nodes: currentNodes,
          prefs: currentPrefs,
          counts: currentCounts,
        } = getCurrentState();
        console.log('🔄 STORE: Current prefs before update:', currentPrefs);

        const next: SidebarPrefs = {
          ...currentPrefs,
          sidebarCollapsed: collapsed,
          updatedAt: new Date().toISOString(),
          version: (currentPrefs.version ?? 1) + 1,
        };

        console.log('🔄 STORE: New prefs after update:', next);

        // Update state immediately - this should trigger re-renders
        setPrefs(next);
        console.log('🔄 STORE: State updated, should trigger re-render');

        // Write to cache and API asynchronously (don't block UI)
        writeCache({ nodes: currentNodes, prefs: next, counts: currentCounts });
        window.api.sidebar.prefs.set(next).catch((error) => {
          console.error('Failed to save sidebar prefs:', error);
        });
      },
      setCollapsedNodeIds: (ids: string[]) => {
        const {
          nodes: currentNodes,
          prefs: currentPrefs,
          counts: currentCounts,
        } = getCurrentState();
        const next: SidebarPrefs = {
          ...currentPrefs,
          collapsedNodeIds: ids,
          updatedAt: new Date().toISOString(),
          version: (currentPrefs.version ?? 1) + 1,
        };
        setPrefs(next);
        writeCache({ nodes: currentNodes, prefs: next, counts: currentCounts });
        // Save to API asynchronously (don't await to avoid blocking UI)
        window.api.sidebar.prefs.set(next).catch((error) => {
          console.error('Failed to save sidebar prefs:', error);
        });
      },
      refreshCounts: async () => {
        const {
          nodes: currentNodes,
          prefs: currentPrefs,
          counts: currentCounts,
        } = getCurrentState();
        const res = await window.api.sidebar.list();
        setCounts(res.counts);
        writeCache({ nodes: currentNodes, prefs: currentPrefs, counts: res.counts });
      },
    };
  }, [nodes, prefs, counts]);

  return { nodes, prefs, counts, state, actions } as const;
}
