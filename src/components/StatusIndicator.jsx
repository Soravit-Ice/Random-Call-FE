export default function StatusIndicator({ status, className = "" }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return { color: 'bg-green-500', label: 'Online' };
      case 'connecting':
        return { color: 'bg-yellow-500 animate-pulse', label: 'Connecting' };
      case 'offline':
        return { color: 'bg-gray-500', label: 'Offline' };
      case 'in-call':
        return { color: 'bg-blue-500', label: 'In Call' };
      default:
        return { color: 'bg-gray-500', label: 'Unknown' };
    }
  };

  const { color, label } = getStatusConfig();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-sm text-slate-400">{label}</span>
    </div>
  );
}