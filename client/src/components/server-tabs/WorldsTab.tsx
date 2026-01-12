import WorldsTabImproved from "./WorldsTabImproved";

interface WorldsTabProps {
  serverId: number;
}

export default function WorldsTab({ serverId }: WorldsTabProps) {
  return <WorldsTabImproved serverId={serverId} />;
}
