
export interface AccountCode {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId?: string | null;
  children?: AccountCode[];
  level?: number;
  [key: string]: unknown;
}

/**
 * Transforms a flat list of accounts into a hierarchical tree structure.
 * @param accounts Flat array of AccountCode objects
 * @returns Hierarchical array of AccountCode objects (root nodes with children)
 */
export function buildAccountTree(accounts: AccountCode[]): AccountCode[] {
  const accountMap = new Map<string, AccountCode>();
  const roots: AccountCode[] = [];

  // 1. Initialize map and add children array to each node
  accounts.forEach((account) => {
    accountMap.set(account.id, { ...account, children: [], level: 0 });
  });

  // 2. Build relationships
  accounts.forEach((account) => {
    const node = accountMap.get(account.id);
    if (!node) return;

    if (account.parentId && accountMap.has(account.parentId)) {
      const parent = accountMap.get(account.parentId);
      parent?.children?.push(node);
    } else {
      roots.push(node);
    }
  });

  // 3. Recursive function to set levels and sort
  const processNode = (node: AccountCode, level: number) => {
    node.level = level;
    if (node.children && node.children.length > 0) {
      node.children.sort((a, b) => a.code.localeCompare(b.code));
      node.children.forEach((child) => processNode(child, level + 1));
    }
  };

  // 4. Sort roots and process levels
  roots.sort((a, b) => a.code.localeCompare(b.code));
  roots.forEach((root) => processNode(root, 0));

  return roots;
}

/**
 * Flattens a tree structure back into a list, preserving order (for rendering table rows)
 * @param tree Hierarchical array of AccountCode objects
 * @returns Flat array of AccountCode objects in depth-first order
 */
export function flattenAccountTree(tree: AccountCode[]): AccountCode[] {
  const flatList: AccountCode[] = [];

  const traverse = (nodes: AccountCode[]) => {
    nodes.forEach((node) => {
      flatList.push(node);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };

  traverse(tree);
  return flatList;
}
