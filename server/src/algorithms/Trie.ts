/**
 * TRIE (prefix tree), implemented manually.
 *
 * Each node represents ONE character. Words that share a prefix
 * share the same path from the root.
 *
 * The Trie is "pure": it does no lowercasing or cleaning.
 * The caller (trieService) must pass normalized lowercase strings.
 */

/** One autocomplete suggestion. */
export interface Suggestion {
  word: string;
  frequency: number; // how many times the word was inserted (used for ranking suggestions)
}

/** One step of a prefix walk. Used by the visualizer in Step 11. */
export interface TrieStep {
  char: string;          // the character we tried to follow
  found: boolean;        // did the node for this character exist?
  isEndOfWord: boolean;  // does a complete word end at this node?
  children: string[];    // characters we could follow next from this node
}

/** NODE STRUCTURE */
class TrieNode {
  // HashMap: character -> child node. Lookup is O(1) on average.
  children: Map<string, TrieNode> = new Map();
  // true if a complete word ends at this node ("algo" is a path, "algorithm" is a word)
  isEndOfWord = false;
  // how many times this word was inserted (only meaningful when isEndOfWord is true)
  frequency = 0;
}

export class Trie {
  private root = new TrieNode();
  private wordCount = 0; // number of distinct words stored
  private nodeCount = 0; // number of nodes created (excluding root)

  /**
   * INSERT: walk down the tree one character at a time,
   * creating nodes that don't exist yet. Mark the last node as a word end.
   * Time: O(L). Space: O(L) in the worst case (all-new nodes).
   */
  insert(word: string, count = 1): void {
    if (word.length === 0) return;

    let node = this.root;
    for (const char of word) {
      let next = node.children.get(char);
      if (!next) {
        next = new TrieNode();
        node.children.set(char, next);
        this.nodeCount++;
      }
      node = next;
    }

    if (!node.isEndOfWord) {
      node.isEndOfWord = true;
      this.wordCount++;
    }
    node.frequency += count; // inserting the same word again just raises its frequency
  }

  /**
   * HELPER: follow `text` from the root. Returns the node we end on,
   * or null if the path breaks. Shared by search / startsWith / getSuggestions.
   * Time: O(length of text).
   */
  private findNode(text: string): TrieNode | null {
    let node = this.root;
    for (const char of text) {
      const next = node.children.get(char);
      if (!next) return null; // path does not exist
      node = next;
    }
    return node;
  }

  /**
   * SEARCH: is this EXACT word stored?
   * "algo" exists as a path but is not a word, so search("algo") is false.
   * Time: O(L).
   */
  search(word: string): boolean {
    if (word.length === 0) return false;
    const node = this.findNode(word);
    return node !== null && node.isEndOfWord;
  }

  /**
   * STARTS WITH: does at least one stored word begin with this prefix?
   * (By convention an empty prefix returns true because the root always exists.)
   * Time: O(P).
   */
  startsWith(prefix: string): boolean {
    return this.findNode(prefix) !== null;
  }

  /**
   * GET SUGGESTIONS (autocomplete):
   *   1. Walk down to the node for the prefix.   -> O(P)
   *   2. DFS the whole subtree below it,
   *      collecting every complete word.          -> O(M)
   *   3. Sort: highest frequency first, ties alphabetical, keep top `limit`.
   */
  getSuggestions(prefix: string, limit = 8): Suggestion[] {
    if (prefix.length === 0 || limit <= 0) return [];

    const startNode = this.findNode(prefix);
    if (!startNode) return []; // nothing starts with this prefix

    const found: Suggestion[] = [];
    this.collectWords(startNode, prefix, found);

    // Built-in sort is fine here: this is a small secondary ordering of suggestions.
    // Our own Merge Sort is used for the main search results (Step 8).
    found.sort(
      (a, b) => b.frequency - a.frequency || a.word.localeCompare(b.word)
    );
    return found.slice(0, limit);
  }

  /**
   * DFS helper: from `node`, whose path spelled `currentWord`,
   * visit every descendant and record each node that ends a word.
   */
  private collectWords(node: TrieNode, currentWord: string, results: Suggestion[]): void {
    if (node.isEndOfWord) {
      results.push({ word: currentWord, frequency: node.frequency });
    }
    for (const [char, child] of node.children) {
      this.collectWords(child, currentWord + char, results);
    }
  }

  /**
   * GET PATH: walk the prefix like startsWith, but record every step.
   * Stops at the first missing character. Used by the visualizer.
   * Time: O(P) (plus sorting at most a few children per step).
   */
  getPath(prefix: string): TrieStep[] {
    const steps: TrieStep[] = [];
    let node = this.root;

    for (const char of prefix) {
      const next = node.children.get(char);
      if (!next) {
        steps.push({ char, found: false, isEndOfWord: false, children: [] });
        break;
      }
      node = next;
      steps.push({
        char,
        found: true,
        isEndOfWord: node.isEndOfWord,
        children: Array.from(node.children.keys()).sort(),
      });
    }
    return steps;
  }

  /** The first letters available from the root (for the visualizer). */
  getRootChildren(): string[] {
    return Array.from(this.root.children.keys()).sort();
  }

  /** Size information for the statistics page. O(1). */
  getStats(): { wordCount: number; nodeCount: number } {
    return { wordCount: this.wordCount, nodeCount: this.nodeCount };
  }
}