import { Badge } from '@/components/ui/badge';
import { LetterStatus } from '@cipansor/shared';

interface LetterStatusBadgeProps {
  status: LetterStatus;
}

export function LetterStatusBadge({ status }: LetterStatusBadgeProps) {
  const getStatusColor = (status: LetterStatus) => {
    switch (status) {
      case LetterStatus.DRAFT:
        return 'bg-gray-200 text-gray-700 hover:bg-gray-300';
      case LetterStatus.PENDING_REVIEW:
        return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
      case LetterStatus.REVISION_NEEDED:
        return 'bg-orange-100 text-orange-700 hover:bg-orange-200';
      case LetterStatus.READY_TO_SIGN:
        return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
      case LetterStatus.SIGNED:
        return 'bg-green-100 text-green-700 hover:bg-green-200';
      case LetterStatus.SENT:
        return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200';
      case LetterStatus.ARCHIVED:
        return 'bg-slate-100 text-slate-700 hover:bg-slate-200';
      case LetterStatus.DISPOSED:
        return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: LetterStatus) => {
    switch (status) {
      case LetterStatus.DRAFT:
        return 'Konsep';
      case LetterStatus.PENDING_REVIEW:
        return 'Menunggu Review';
      case LetterStatus.REVISION_NEEDED:
        return 'Perlu Revisi';
      case LetterStatus.READY_TO_SIGN:
        return 'Siap TTD';
      case LetterStatus.SIGNED:
        return 'Sudah TTD';
      case LetterStatus.SENT:
        return 'Terkirim';
      case LetterStatus.ARCHIVED:
        return 'Diarsipkan';
      case LetterStatus.DISPOSED:
        return 'Didisposisikan';
      default:
        return status;
    }
  };

  return (
    <Badge className={getStatusColor(status)}>
      {getStatusLabel(status)}
    </Badge>
  );
}
