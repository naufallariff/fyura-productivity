export interface Placed {
  id: string;
  start: number;
  end: number;
}

export interface LaidOut extends Placed {
  /** Zero-based lane index inside its overlap cluster. */
  lane: number;
  /** Total lanes in the cluster. Used to compute width. */
  lanes: number;
}

/**
 * Assigns each block a lane so overlapping blocks sit side by side.
 * Blocks that overlap form a cluster; every block in a cluster shares the cluster's lane count.
 */
export function layoutLanes(items: readonly Placed[]): LaidOut[] {
  const sorted = [...items].sort(
    (a, b) => a.start - b.start || b.end - a.end || a.id.localeCompare(b.id),
  );

  const result: LaidOut[] = [];
  let cluster: LaidOut[] = [];
  let clusterEnd = -1;
  const laneEnds: number[] = [];

  const flush = () => {
    const lanes = Math.max(...cluster.map((c) => c.lane)) + 1;
    for (const item of cluster) item.lanes = lanes;
    result.push(...cluster);
    cluster = [];
    laneEnds.length = 0;
    clusterEnd = -1;
  };

  for (const item of sorted) {
    if (cluster.length > 0 && item.start >= clusterEnd) flush();

    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.end);
    } else {
      laneEnds[lane] = item.end;
    }

    cluster.push({ ...item, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, item.end);
  }

  if (cluster.length > 0) flush();
  return result;
}
