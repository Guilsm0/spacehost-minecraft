import BackupsTabImproved from "./BackupsTabImproved";

interface BackupsTabProps {
  serverId: number;
}

export default function BackupsTab({ serverId }: BackupsTabProps) {
  return <BackupsTabImproved serverId={serverId} />;
}
