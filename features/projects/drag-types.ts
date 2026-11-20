// features/projects/drag-types.ts
import type { Card } from "./schemas";

/** Data attached to every draggable and droppable. `cardIds` lets the board compute neighbours. */
export type DragData =
  | { readonly type: "column"; readonly listId: string; readonly cardIds: readonly string[] }
  | {
      readonly type: "card";
      readonly listId: string;
      readonly cardIds: readonly string[];
      readonly card: Card;
    }
  | { readonly type: "list"; readonly listId: string; readonly cardIds: readonly string[] };
