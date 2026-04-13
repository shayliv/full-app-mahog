import { labels } from "../lib/i18n-he";
import { ImportModal } from "./ImportModal";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export function ImportStudentsModal({ onClose, onSuccess }: Props) {
  return (
    <ImportModal
      endpoint="/students/import"
      title={labels.import.title}
      description={labels.import.description}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
